import time
import os
import re
import uuid
import traceback
from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
import yt_dlp as youtube_dl
import imageio_ffmpeg

app = Flask(__name__)
CORS(app)

# --- КОНФІГУРАЦІЯ ---
DOWNLOAD_FOLDER = 'downloads'
FFMPEG_EXE_PATH = None

if not os.path.exists(DOWNLOAD_FOLDER):
    try:
        os.makedirs(DOWNLOAD_FOLDER)
        print(f"Папку {DOWNLOAD_FOLDER} створено.")
    except Exception as e:
        print(f"Не вдалося створити папку {DOWNLOAD_FOLDER}: {e}")

def get_ffmpeg_path_with_auto_download():
    global FFMPEG_EXE_PATH
    if FFMPEG_EXE_PATH and os.path.exists(FFMPEG_EXE_PATH) and os.path.isfile(FFMPEG_EXE_PATH):
        # Логер Flask може бути ще не готовий тут, тому print
        print(f"Використовується попередньо знайдений FFmpeg: {FFMPEG_EXE_PATH}")
        return FFMPEG_EXE_PATH
    try:
        print("Спроба знайти або завантажити FFmpeg за допомогою imageio-ffmpeg...")
        ffmpeg_path = imageio_ffmpeg.get_ffmpeg_exe()
        if os.path.exists(ffmpeg_path) and os.path.isfile(ffmpeg_path):
            print(f"FFmpeg знайдено/завантажено за шляхом: {ffmpeg_path}")
            FFMPEG_EXE_PATH = ffmpeg_path
            return ffmpeg_path
        else:
            print(f"imageio-ffmpeg.get_ffmpeg_exe() повернув шлях '{ffmpeg_path}', але файл не існує або не є файлом.")
            FFMPEG_EXE_PATH = None
            return None
    except Exception as e:
        print(f"Помилка під час отримання/завантаження FFmpeg через imageio-ffmpeg: {e}")
        print("Продовження роботи без FFmpeg.")
        FFMPEG_EXE_PATH = None
        return None

print("Ініціалізація шляху до FFmpeg...")
FFMPEG_EXE_PATH = get_ffmpeg_path_with_auto_download()
print(f"Фінальний шлях до FFmpeg після ініціалізації: {FFMPEG_EXE_PATH or 'Не визначено/Не завантажено'}")


# --- ДОПОМІЖНІ ФУНКЦІЇ ---
def is_valid_youtube_url(url):
    youtube_regex = (
        r'(https?://)?(www\.)?'
        r'(youtube|youtu|youtube-nocookie)\.(com|be)/'
        r'(watch\?v=|embed/|v/|.+\?v=)?([^&=%\?]{11})'
    )
    return re.match(youtube_regex, url) is not None

def get_video_info(url):
    request_id_info = uuid.uuid4().hex[:8]
    # Логер app.logger вже має бути доступний тут
    app.logger.debug(f"get_video_info [{request_id_info}]: Запит інформації для URL: {url}")
    try:
        ffmpeg_available_for_preview = FFMPEG_EXE_PATH is not None

        ydl_opts = {
            'no_warnings': False,
            'skip_download': True,
            'force_generic_extractor': False,
            'logger': app.logger,
            'ffmpeg_location': FFMPEG_EXE_PATH if ffmpeg_available_for_preview else None,
        }
        with youtube_dl.YoutubeDL(ydl_opts) as ydl:
            info = ydl.extract_info(url, download=False)

        if not info:
            app.logger.warning(f"get_video_info [{request_id_info}]: yt-dlp повернув порожню інформацію для {url}")
            return None

        video_info_data = {
            'title': info.get('title', 'Невідоме відео'),
            'description': info.get('description', ''),
            'thumbnail': info.get('thumbnail', ''),
            'duration': info.get('duration', 0),
            'views': info.get('view_count', 0),
            'likes': info.get('like_count'),
            'qualities': []
        }

        formats = info.get('formats', [])
        if not formats:
            app.logger.warning(f"get_video_info [{request_id_info}]: yt-dlp.extract_info НЕ повернув жодних форматів для {url}.")

        available_qualities = set()
        allowed_qualities_preview = ['144p', '240p', '360p', '480p', '720p', '1080p', '1440p', '2160p']

        for fmt in formats:
            height = fmt.get('height')
            if not height:
                continue

            quality_str = f"{height}p"
            is_premerged = fmt.get('vcodec') != 'none' and fmt.get('acodec') != 'none'
            is_video_only = fmt.get('vcodec') != 'none' and fmt.get('acodec') == 'none'

            if ffmpeg_available_for_preview:
                if (is_premerged or is_video_only) and quality_str in allowed_qualities_preview:
                    available_qualities.add(quality_str)
            else:
                if is_premerged and quality_str in allowed_qualities_preview:
                    available_qualities.add(quality_str)

        video_info_data['qualities'] = sorted(list(available_qualities), key=lambda q_str: int(q_str[:-1]), reverse=True)

        if not video_info_data['qualities']:
            app.logger.warning(f"get_video_info [{request_id_info}]: Для {url} не знайдено підтримуваних якостей (FFmpeg {'доступний' if ffmpeg_available_for_preview else 'недоступний'}).")
        else:
            app.logger.info(f"get_video_info [{request_id_info}]: Доступні якості для {url} (FFmpeg {'доступний' if ffmpeg_available_for_preview else 'недоступний'}): {video_info_data['qualities']}")

        return video_info_data

    except youtube_dl.utils.DownloadError as e:
        app.logger.error(f"get_video_info [{request_id_info}]: Помилка yt-dlp (DownloadError) для {url}: {type(e)} - {str(e)}")
        if "Unsupported URL" in str(e) or "not a valid URL" in str(e):
            return {'error_type': 'InvalidURL', 'message': 'Наданий URL не підтримується або недійсний.'}
        return None
    except Exception as e:
        app.logger.error(f"get_video_info [{request_id_info}]: Загальна помилка для {url}: {type(e)} - {str(e)}\n{traceback.format_exc()}")
        return None

# --- МАРШРУТИ API ---
@app.route('/api/video/preview', methods=['GET'])
def video_preview():
    video_url = request.args.get('url')
    app.logger.info(f"video_preview: Запит на прев'ю для URL: {video_url}")

    if not video_url:
        app.logger.warning("video_preview: URL відео не надано.")
        return jsonify({'error': 'URL відео не надано'}), 400
    if not is_valid_youtube_url(video_url):
        app.logger.warning(f"video_preview: Недійсний URL YouTube: {video_url}")
        return jsonify({'error': 'Недійсний URL YouTube'}), 400

    video_info_data = get_video_info(video_url)

    if not video_info_data:
        app.logger.error(f"video_preview: Не вдалося отримати інформацію для {video_url}.")
        return jsonify({'error': 'Не вдалося отримати інформацію про відео. Спробуйте пізніше або перевірте URL.'}), 500
    if video_info_data.get('error_type') == 'InvalidURL':
        app.logger.warning(f"video_preview: {video_info_data['message']} для URL: {video_url}")
        return jsonify({'error': video_info_data['message']}), 400

    if isinstance(video_info_data.get('views'), (int, float)):
        views = video_info_data['views']
        if views >= 1000000: video_info_data['views'] = f"{views / 1000000:.1f}M"
        elif views >= 1000: video_info_data['views'] = f"{views / 1000:.1f}K"

    if isinstance(video_info_data.get('likes'), (int, float)):
        likes = video_info_data['likes']
        if likes >= 1000000: video_info_data['likes'] = f"{likes / 1000000:.1f}M"
        elif likes >= 1000: video_info_data['likes'] = f"{likes / 1000:.1f}K"
    elif video_info_data.get('likes') is None:
        video_info_data['likes'] = "N/A"

    duration_seconds = video_info_data.get('duration', 0)
    if isinstance(duration_seconds, (int, float)) and duration_seconds > 0:
        minutes, seconds_rem = divmod(int(duration_seconds), 60)
        hours, minutes = divmod(minutes, 60)
        video_info_data['duration'] = f"{hours}:{minutes:02d}:{seconds_rem:02d}" if hours > 0 else f"{minutes:02d}:{seconds_rem:02d}"
    else:
        video_info_data['duration'] = "00:00" if duration_seconds == 0 else "N/A"

    if not video_info_data['qualities']:
        app.logger.warning(f"video_preview: Для відео {video_url} не знайдено дозволених якостей. FFmpeg {'доступний' if FFMPEG_EXE_PATH else 'недоступний'}.")

    app.logger.info(f"video_preview: Успішно повернуто інформацію для {video_url}")
    return jsonify(video_info_data)


@app.route('/api/video/download', methods=['POST'])
def download_video():
    data = request.json
    video_url = data.get('url')
    quality_req = data.get('quality', '720p')
    request_id = uuid.uuid4().hex[:8]

    current_ffmpeg_path = FFMPEG_EXE_PATH

    app.logger.info(f"download_video [{request_id}]: Запит на завантаження. URL: {video_url}, Якість: {quality_req}. FFmpeg: {current_ffmpeg_path or 'Недоступний'}")

    if not video_url or not is_valid_youtube_url(video_url):
        app.logger.warning(f"download_video [{request_id}]: Недійсний URL: {video_url}")
        return jsonify({'error': 'Недійсний URL YouTube'}), 400

    allowed_download_qualities = ['144p', '240p', '360p', '480p', '720p', '1080p', '1440p', '2160p', 'best']
    if quality_req not in allowed_download_qualities:
        app.logger.warning(f"download_video [{request_id}]: Недійсна якість: {quality_req}.")
        return jsonify({'error': f'Недійсна якість відео: {quality_req}.'}), 400

    final_sanitized_title_for_file = 'video_download'

    try:
        info_opts = {
            'skip_download': True,
            'force_generic_extractor': False,
            'logger': app.logger,
            'no_warnings': False,
            'ffmpeg_location': current_ffmpeg_path
        }
        with youtube_dl.YoutubeDL(info_opts) as ydl_info:
            info = ydl_info.extract_info(video_url, download=False)

        if info and info.get('title'):
            raw_title = info.get('title')
            max_clean_title_length = 60

            sanitized_title_full = re.sub(r'[\\/*?:"<>|\x00-\x1f\x7f]', "", raw_title).strip()

            if not sanitized_title_full:
                final_sanitized_title_for_file = "video_download"
            elif len(sanitized_title_full) > max_clean_title_length:
                final_sanitized_title_for_file = sanitized_title_full[:max_clean_title_length].strip()
                app.logger.debug(f"download_video [{request_id}]: Назва відео '{raw_title}' санітизована і скорочена до '{final_sanitized_title_for_file}' (макс. довжина {max_clean_title_length})")
            else:
                final_sanitized_title_for_file = sanitized_title_full
        else:
            app.logger.warning(f"download_video [{request_id}]: Не вдалося отримати назву для {video_url}. Використовується '{final_sanitized_title_for_file}'.")

        app.logger.debug(f"download_video [{request_id}]: Фінальна санітизована назва для файлу (частина): '{final_sanitized_title_for_file}'")

        output_final_extension = None
        if current_ffmpeg_path:
            if quality_req == 'best':
                format_selector = 'bestvideo[ext=mp4]+bestaudio[ext=m4a]/bestvideo+bestaudio/best'
            else:
                height_filter = quality_req[:-1]
                format_selector = (
                    f'bestvideo[height<={height_filter}][ext=mp4]+bestaudio[ext=m4a]/bestvideo[height<={height_filter}]+bestaudio/best[height<={height_filter}]'
                )
            output_final_extension = "mp4"
        else:
            if quality_req == 'best':
                format_selector = "best[ext=mp4][vcodec!=none][acodec!=none]/best[vcodec!=none][acodec!=none]"
            else:
                height_filter = quality_req[:-1]
                format_selector = (
                    f"best[height<={height_filter}][ext=mp4][vcodec!=none][acodec!=none]/"
                    f"best[height<={height_filter}][vcodec!=none][acodec!=none]"
                )

        app.logger.info(f"download_video [{request_id}]: Використовується форматний рядок: {format_selector}")

        base_filename_part = f"{final_sanitized_title_for_file} [{quality_req}]"
        app.logger.info(f"download_video [{request_id}]: Сформовано base_filename_part: '{base_filename_part}'")

        if output_final_extension:
            output_template = os.path.join(DOWNLOAD_FOLDER, f"{base_filename_part}.{output_final_extension}")
        else:
            output_template = os.path.join(DOWNLOAD_FOLDER, f"{base_filename_part}.%(ext)s")

        app.logger.info(f"download_video [{request_id}]: Шаблон вихідного файлу (outtmpl) для yt-dlp: '{output_template}'")

        ydl_opts_download = {
            'format': format_selector,
            'outtmpl': output_template,
            'quiet': False,
            'no_warnings': False,
            'verbose': app.debug,
            'logger': app.logger,
            'nocheckcertificate': True,
            'noplaylist': True,
            'ffmpeg_location': current_ffmpeg_path,
        }

        if current_ffmpeg_path:
            ydl_opts_download['merge_output_format'] = 'mp4'
            output_final_extension = "mp4"
            app.logger.info(f"download_video [{request_id}]: Встановлено merge_output_format: mp4. Очікуване розширення: {output_final_extension}")

        app.logger.debug(f"download_video [{request_id}]: Опції для yt-dlp: {ydl_opts_download}")
        with youtube_dl.YoutubeDL(ydl_opts_download) as ydl:
            download_return_code = ydl.download([video_url])
            app.logger.info(f"download_video [{request_id}]: ydl.download завершено з кодом: {download_return_code}")

        actual_filename_found = None
        time.sleep(1.0)

        if output_final_extension:
            expected_filename = f"{base_filename_part}.{output_final_extension}"
            app.logger.info(f"download_video [{request_id}]: Шукаємо точний файл: '{expected_filename}'")
            full_expected_path = os.path.join(DOWNLOAD_FOLDER, expected_filename)
            if os.path.exists(full_expected_path) and os.path.isfile(full_expected_path):
                actual_filename_found = expected_filename
                app.logger.info(f"download_video [{request_id}]: Знайдено точний очікуваний файл: '{actual_filename_found}'")

        if not actual_filename_found:
            app.logger.debug(f"download_video [{request_id}]: Точний файл не знайдено або розширення було динамічним. Пошук за '{base_filename_part}*.*'")
            files_in_dir = os.listdir(DOWNLOAD_FOLDER)
            app.logger.debug(f"download_video [{request_id}]: Вміст папки {DOWNLOAD_FOLDER}: {files_in_dir}")

            candidate_files = []
            for f_in_dir in files_in_dir:
                if f_in_dir.startswith(base_filename_part) and not f_in_dir.endswith((".part", ".ytdl")):
                    candidate_files.append(f_in_dir)

            if candidate_files:
                candidate_files.sort(key=lambda name: (len(name), name))
                actual_filename_found = candidate_files[0]
                app.logger.info(f"download_video [{request_id}]: Знайдено файл за шаблоном (після сортування): '{actual_filename_found}'")

        if not actual_filename_found:
            app.logger.error(f"download_video [{request_id}]: Файл не знайдено після завантаження. Код повернення ydl.download: {download_return_code}.")
            part_files = [f for f in os.listdir(DOWNLOAD_FOLDER) if f.startswith(base_filename_part) and f.endswith((".part", ".ytdl"))]
            if part_files:
                app.logger.warning(f"download_video [{request_id}]: Знайдено тимчасові файли: {part_files}. Можливо, завантаження/об'єднання не завершилось успішно.")
            return jsonify({'error': 'Не вдалося завантажити відео: файл не було створено або фіналізовано.'}), 500

        final_output_path = os.path.join(DOWNLOAD_FOLDER, actual_filename_found)
        downloaded_successfully_flag = False

        if os.path.exists(final_output_path) and os.path.isfile(final_output_path):
            file_size = os.path.getsize(final_output_path)
            app.logger.info(f"download_video [{request_id}]: Файл '{final_output_path}' існує. Розмір: {file_size} байт.")
            if file_size > 0:
                downloaded_successfully_flag = True
            else:
                app.logger.error(f"download_video [{request_id}]: Файл '{final_output_path}' ПОРОЖНІЙ.")
                try: os.remove(final_output_path)
                except Exception as e_rm: app.logger.error(f"Не вдалося видалити порожній файл: {e_rm}")
        else:
            app.logger.error(f"download_video [{request_id}]: Файл '{final_output_path}' НЕ ІСНУЄ або не є файлом.")

        if not downloaded_successfully_flag:
            return jsonify({'error': 'Не вдалося завантажити відео. Файл не створено належним чином або він порожній.'}), 500

        app.logger.info(f"download_video [{request_id}]: Успішно. Повертаю JSON для файлу: {actual_filename_found}")
        return jsonify({
            'success': True,
            'download_url': f'/download/{actual_filename_found}',
            'filename': actual_filename_found
        })

    except youtube_dl.utils.DownloadError as e:
        app.logger.error(f"download_video [{request_id}]: Помилка yt-dlp (DownloadError): {type(e)} - {str(e)}")
        err_str_lower = str(e).lower()
        if "requested format is not available" in err_str_lower or \
                "no video formats found" in err_str_lower or \
                "format not available" in err_str_lower:
            app.logger.warning(f"download_video [{request_id}]: Запитуваний формат ({quality_req}) недоступний: {e}")
            return jsonify({'error': f'Запитувана якість ({quality_req}) недоступна для цього відео.'}), 400
        if "unsupported url" in err_str_lower: return jsonify({'error': f'URL не підтримується: {video_url}'}), 400
        if "video unavailable" in err_str_lower: return jsonify({'error': 'Відео недоступне.'}), 404
        return jsonify({'error': f'Помилка завантаження з yt-dlp: {str(e)}'}), 500
    except Exception as e:
        full_traceback = traceback.format_exc()
        app.logger.error(f"download_video [{request_id}]: Загальна непередбачена помилка: {type(e)} - {str(e)}\n{full_traceback}")
        return jsonify({'error': f'Не вдалося завантажити відео через непередбачену помилку сервера.'}), 500


@app.route('/download/<path:filename_from_url>', methods=['GET'])
def download_file(filename_from_url):
    request_id = uuid.uuid4().hex[:8]
    app.logger.info(f"download_file [{request_id}]: Отримано запит на завантаження. filename_from_url: '{filename_from_url}'")

    if not filename_from_url.strip():
        app.logger.warning(f"download_file [{request_id}]: Отримано порожнє ім'я файлу.")
        return jsonify({'error': 'Ім\'я файлу не може бути порожнім'}), 400

    if ".." in filename_from_url or filename_from_url.startswith(("/", "\\")):
        app.logger.warning(f"download_file [{request_id}]: Неприпустиме або потенційно небезпечне ім'я файлу: '{filename_from_url}'")
        return jsonify({'error': 'Неприпустиме ім\'я файлу'}), 400

    safe_filename = os.path.basename(filename_from_url)
    app.logger.info(f"download_file [{request_id}]: safe_filename після os.path.basename: '{safe_filename}'")

    if safe_filename != filename_from_url:
        app.logger.warning(f"download_file [{request_id}]: Ім'я файлу '{filename_from_url}' було змінено на '{safe_filename}' для безпеки.")

    file_path = os.path.join(DOWNLOAD_FOLDER, safe_filename)
    app.logger.info(f"download_file [{request_id}]: Сформований повний шлях до файлу: '{file_path}'")

    # Додамо лог вмісту папки ПЕРЕД перевіркою існування файлу
    try:
        files_in_dir_before_check = os.listdir(DOWNLOAD_FOLDER)
        app.logger.debug(f"download_file [{request_id}]: Вміст папки '{DOWNLOAD_FOLDER}' ПЕРЕД перевіркою існування файлу '{safe_filename}': {files_in_dir_before_check}")
    except Exception as e_ls_before:
        app.logger.error(f"download_file [{request_id}]: Не вдалося прочитати вміст папки {DOWNLOAD_FOLDER} перед перевіркою: {e_ls_before}")


    if os.path.exists(file_path) and os.path.isfile(file_path):
        file_size = os.path.getsize(file_path)
        app.logger.info(f"download_file [{request_id}]: Файл '{file_path}' ІСНУЄ перед відправкою. Розмір: {file_size} байт.")
    else:
        app.logger.error(f"download_file [{request_id}]: Файл '{file_path}' НЕ ІСНУЄ або не є файлом перед відправкою.")
        # Логуємо вміст папки ще раз, щоб побачити, чи не зник файл
        try:
            files_in_dir_on_error = os.listdir(DOWNLOAD_FOLDER)
            app.logger.info(f"download_file [{request_id}]: Вміст папки '{DOWNLOAD_FOLDER}' на момент помилки 404 для '{safe_filename}': {files_in_dir_on_error}")
        except Exception as e_ls_on_error:
            app.logger.error(f"download_file [{request_id}]: Не вдалося прочитати вміст папки {DOWNLOAD_FOLDER} на момент помилки: {e_ls_on_error}")
        return jsonify({'error': 'Файл не знайдено на сервері'}), 404

    try:
        response = send_from_directory(DOWNLOAD_FOLDER, safe_filename, as_attachment=True)
        app.logger.info(f"download_file [{request_id}]: Файл '{safe_filename}' готовий до відправки.")

        # ВАЖЛИВО: ТИМЧАСОВО ВИМКНЕНО ВИДАЛЕННЯ ФАЙЛУ ПІСЛЯ ВІДПРАВКИ
        # ЦЕ ПОТРІБНО ДЛЯ ДІАГНОСТИКИ ПРОБЛЕМИ "ФАЙЛ НЕ ЗНАЙДЕНО" НА КЛІЄНТІ.
        # ПІСЛЯ ВИРІШЕННЯ ПРОБЛЕМИ, ПОТРІБНО БУДЕ РЕАЛІЗУВАТИ КОРЕКТНУ СТРАТЕГІЮ ОЧИЩЕННЯ.
        # @response.call_on_close
        # def remove_file_after_send():
        #     removal_request_id = uuid.uuid4().hex[:8]
        #     app.logger.info(f"remove_file_after_send [{removal_request_id}]: Спроба видалити файл '{file_path}' після відправки.")
        #     try:
        #         time.sleep(1)
        #         os.remove(file_path)
        #         app.logger.info(f"remove_file_after_send [{removal_request_id}]: Файл '{safe_filename}' успішно видалено.")
        #     except PermissionError as e_perm:
        #          app.logger.error(f"remove_file_after_send [{removal_request_id}]: Помилка дозволу: {e_perm}")
        #     except FileNotFoundError:
        #          app.logger.warning(f"remove_file_after_send [{removal_request_id}]: Файл не знайдено для видалення.")
        #     except Exception as error_remove:
        #         app.logger.error(f"remove_file_after_send [{removal_request_id}]: Помилка видалення: {error_remove}")

        return response
    except Exception as e_send:
        full_traceback = traceback.format_exc()
        app.logger.error(f"download_file [{request_id}]: Помилка при відправці файлу '{safe_filename}': {type(e_send)} - {str(e_send)}\n{full_traceback}")
        return jsonify({'error': 'Не вдалося відправити файл.'}), 500

# --- ЗАПУСК СЕРВЕРА ТА НАЛАШТУВАННЯ ЛОГЕРА ---
if __name__ == '__main__':
    import logging
    from flask.logging import default_handler

    # Ініціалізація логування до того, як app.logger використовується активно
    # Це допоможе захопити логи з самого початку, навіть до app.run

    # Визначаємо рівень логування та режим debug
    flask_debug_env = os.environ.get("FLASK_DEBUG")
    current_debug_mode = flask_debug_env == "1" if flask_debug_env is not None else False

    log_level_name_env = os.environ.get("FLASK_LOG_LEVEL", "INFO").upper()

    if current_debug_mode and log_level_name_env == "INFO":
        log_level = logging.DEBUG
    else:
        log_level = getattr(logging, log_level_name_env, logging.INFO)

    # Налаштування обробників для логерів
    formatter = logging.Formatter(
        '%(asctime)s - %(name)s - %(levelname)s - [%(process)d:%(threadName)s] - %(module)s.%(funcName)s:%(lineno)d - %(message)s'
    )

    # Обробник для консолі
    console_handler = logging.StreamHandler()
    console_handler.setLevel(log_level)
    console_handler.setFormatter(formatter)

    # Обробник для файлу (ініціалізуємо тут, щоб додати до всіх логерів)
    file_handler = None
    try:
        log_file_path = 'flask_app.log'
        file_handler = logging.FileHandler(log_file_path, encoding='utf-8')
        file_handler.setLevel(log_level)
        file_handler.setFormatter(formatter)
        print(f"Файловий логер буде налаштовано для запису в: {os.path.abspath(log_file_path)}")
    except Exception as e_fh:
        print(f"Не вдалося налаштувати файловий логер: {e_fh}. Логування буде тільки в консоль.")


    # Налаштування логера Flask App
    app.logger.removeHandler(default_handler)
    app.logger.setLevel(log_level)
    app.logger.addHandler(console_handler)
    if file_handler: app.logger.addHandler(file_handler)

    # Налаштування логера Werkzeug (сервер Flask)
    werkzeug_logger = logging.getLogger('werkzeug')
    # Очищаємо можливі стандартні обробники, щоб не дублювати
    for h in list(werkzeug_logger.handlers): werkzeug_logger.removeHandler(h)
    werkzeug_logger.setLevel(logging.INFO if not current_debug_mode else logging.DEBUG) # Менш детально, якщо не debug
    werkzeug_logger.addHandler(console_handler)
    if file_handler: werkzeug_logger.addHandler(file_handler)
    werkzeug_logger.propagate = False # Не передавати в root

    # Налаштування логера yt-dlp
    yt_dlp_logger = logging.getLogger('yt_dlp')
    for h in list(yt_dlp_logger.handlers): yt_dlp_logger.removeHandler(h)
    yt_dlp_logger.setLevel(log_level)
    yt_dlp_logger.addHandler(console_handler)
    if file_handler: yt_dlp_logger.addHandler(file_handler)
    yt_dlp_logger.propagate = False

    # Налаштування логера imageio_ffmpeg
    imageio_logger = logging.getLogger('imageio_ffmpeg')
    for h in list(imageio_logger.handlers): imageio_logger.removeHandler(h)
    imageio_logger.setLevel(log_level)
    imageio_logger.addHandler(console_handler)
    if file_handler: imageio_logger.addHandler(file_handler)
    imageio_logger.propagate = False

    app.debug = current_debug_mode

    app.logger.info(f"Flask app starting... Debug mode is {'ON' if app.debug else 'OFF'}. Effective log level for app: {logging.getLevelName(app.logger.getEffectiveLevel())}")
    # Лог шляху до FFmpeg вже виводиться через print() раніше, при старті модуля.

    try:
        use_reloader_flag = app.debug
        if FFMPEG_EXE_PATH is None and not os.environ.get("WERKZEUG_RUN_MAIN") and app.debug:
            app.logger.info("FFmpeg ще не завантажений і debug=True. Перевірте налаштування use_reloader, якщо виникають проблеми з подвійним завантаженням FFmpeg.")
            # use_reloader_flag = False # Розкоментуйте для тестування, якщо є підозри на проблеми з reloader'ом

        app.run(host='0.0.0.0', port=5000, debug=app.debug, use_reloader=use_reloader_flag)
    except Exception as e_run:
        log_func = app.logger.critical if app.logger.hasHandlers() else print
        log_func(f"Критична помилка при запуску Flask-додатку: {e_run}\n{traceback.format_exc()}")