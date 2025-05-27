# --- START OF FILE app.py ---

import time
import os
import re
import uuid
import traceback
from urllib.parse import quote as url_quote
from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
import yt_dlp as youtube_dl
import imageio_ffmpeg

app = Flask(__name__)
CORS(app)

# --- КОНФІГУРАЦІЯ ---
DOWNLOAD_FOLDER = 'downloads'
FFMPEG_EXE_PATH = None # Визначається автоматично

# Створення папки downloads, якщо не існує
if not os.path.exists(DOWNLOAD_FOLDER):
    try:
        os.makedirs(DOWNLOAD_FOLDER)
        print(f"Папку {DOWNLOAD_FOLDER} створено.")
    except Exception as e:
        print(f"Не вдалося створити папку {DOWNLOAD_FOLDER}: {e}")

# Функція для отримання шляху до FFmpeg (залишається без змін)
def get_ffmpeg_path_with_auto_download():
    global FFMPEG_EXE_PATH
    if FFMPEG_EXE_PATH and os.path.exists(FFMPEG_EXE_PATH) and os.path.isfile(FFMPEG_EXE_PATH):
        return FFMPEG_EXE_PATH
    try:
        ffmpeg_path = imageio_ffmpeg.get_ffmpeg_exe()
        if os.path.exists(ffmpeg_path) and os.path.isfile(ffmpeg_path):
            FFMPEG_EXE_PATH = ffmpeg_path
            print(f"FFmpeg знайдено/завантажено: {ffmpeg_path}")
            return ffmpeg_path
        else:
            print(f"imageio-ffmpeg не зміг надати валідний шлях до FFmpeg: {ffmpeg_path}")
            FFMPEG_EXE_PATH = None
            return None
    except Exception as e:
        print(f"Помилка під час отримання/завантаження FFmpeg: {e}")
        FFMPEG_EXE_PATH = None
        return None

print("Ініціалізація шляху до FFmpeg...")
FFMPEG_EXE_PATH = get_ffmpeg_path_with_auto_download()
print(f"Фінальний шлях до FFmpeg: {FFMPEG_EXE_PATH or 'Не визначено/Не завантажено'}")


# --- ДОПОМІЖНІ ФУНКЦІЇ ---
def get_url_type(url): # Для попередньої класифікації, yt-dlp є основним джерелом правди
    if re.match(r'(https?://)?(www\.)?(youtube|youtu|youtube-nocookie)\.(com|be)/', url):
        return 'youtube'
    if re.match(r'(https?://)?(.*tiktok\.com.*)', url, re.IGNORECASE):
        return 'tiktok'
    if re.match(r'(https?://)?(.*soundcloud\.com.*)', url, re.IGNORECASE):
        return 'soundcloud'
    if re.match(r'(https?://)?(.*vimeo\.com.*)', url, re.IGNORECASE):
        return 'vimeo'
    # Можна додати інші популярні платформи для швидкої ідентифікації
    return 'unknown'


def get_video_info(url):
    request_id_info = uuid.uuid4().hex[:8]
    app.logger.info(f"get_video_info [{request_id_info}]: Запит інформації для URL: {url}")

    try:
        ydl_opts = {
            'no_warnings': False,
            'skip_download': True,
            'force_generic_extractor': False,
            'logger': app.logger,
            'ffmpeg_location': FFMPEG_EXE_PATH,
            'extract_flat': 'in_playlist', # Не заглиблюватися в плейлисти для прев'ю
            'playlist_items': '1', # Для плейлистів брати інфо тільки першого елемента
        }
        with youtube_dl.YoutubeDL(ydl_opts) as ydl:
            info = ydl.extract_info(url, download=False)

        if not info:
            app.logger.warning(f"get_video_info [{request_id_info}]: yt-dlp повернув порожню інформацію для {url}")
            return None

        # Якщо це був плейлист, беремо інформацію першого елемента
        if '_type' in info and info['_type'] == 'playlist' and info.get('entries'):
            info = info['entries'][0]
            if not info: # Якщо перший елемент плейлиста порожній
                app.logger.warning(f"get_video_info [{request_id_info}]: Перший елемент плейлиста порожній для {url}")
                return None

        extractor_key = info.get('extractor_key', '').lower()
        if not extractor_key: extractor_key = get_url_type(url) # Резервний варіант

        video_info_data = {
            'title': info.get('title', info.get('fulltitle', 'Невідома назва')),
            'description': info.get('description', ''),
            'thumbnail': info.get('thumbnail', ''),
            'duration': info.get('duration', 0),
            'views': info.get('view_count', info.get('play_count')), # play_count для деяких платформ
            'likes': info.get('like_count'),
            'uploader': info.get('uploader', info.get('creator', info.get('channel', info.get('artist')))), # artist для аудіо
            'qualities_video': [],
            'qualities_audio': [], # Окремо для аудіо
            'source_type': extractor_key or 'generic',
            'original_url': info.get('webpage_url', url), # URL, з якого фактично взято інфо
        }

        # Заповнення специфічних полів
        if 'youtube' in extractor_key:
            pass # Загальні поля вже заповнені
        elif 'tiktok' in extractor_key:
            video_info_data['title'] = info.get('title', info.get('description', 'Відео TikTok'))
            if not video_info_data['title'] and video_info_data['description']:
                video_info_data['title'] = video_info_data['description'].split('\n')[0][:70]
        elif 'soundcloud' in extractor_key:
            video_info_data['title'] = info.get('title', info.get('track', 'Аудіо трек'))
            video_info_data['uploader'] = info.get('uploader', info.get('user', {}).get('username'))
            # Для SoundCloud може не бути переглядів/лайків у стандартному вигляді

        formats = info.get('formats', [])
        if not formats:
            app.logger.warning(f"get_video_info [{request_id_info}]: Немає форматів для {url} (тип: {extractor_key}).")

        # --- Обробка якостей ВІДЕО ---
        available_video_qualities_set = set()
        if 'youtube' in extractor_key:
            # ... (логіка для YouTube якостей залишається схожою) ...
            allowed_qualities_preview = ['144p', '240p', '360p', '480p', '720p', '1080p', '1440p', '2160p']
            for fmt in formats:
                if fmt.get('vcodec') != 'none' and fmt.get('height'): # Має бути відео з висотою
                    quality_str = f"{fmt['height']}p"
                    if quality_str in allowed_qualities_preview:
                        available_video_qualities_set.add(quality_str)
            video_info_data['qualities_video'] = sorted(list(available_video_qualities_set), key=lambda q_str: int(q_str[:-1]), reverse=True)
        else: # Для інших платформ (TikTok, Vimeo, загальні)
            has_any_video = any(f.get('vcodec') != 'none' and f.get('ext') == 'mp4' for f in formats)
            if has_any_video:
                # Можна спробувати витягнути висоту, якщо є, але це може бути складно для всіх
                # Простіше запропонувати загальну опцію
                video_info_data['qualities_video'] = ['Найкраще відео (MP4)']
            # Якщо є тільки відео без аудіо, і є FFmpeg, то це теж варіант
            elif FFMPEG_EXE_PATH and any(f.get('vcodec') != 'none' and f.get('acodec') == 'none' for f in formats):
                video_info_data['qualities_video'] = ['Найкраще відео (потрібне злиття)']


        # --- Обробка якостей АУДІО ---
        available_audio_qualities_set = set()
        # Намагаємося знайти аудіо формати (m4a, mp3, opus, ogg)
        # yt-dlp сам вибере найкращий аудіо, якщо вказати 'bestaudio'
        # Тут ми можемо просто вказати, що аудіо доступне
        has_any_audio_stream = any(f.get('acodec') != 'none' and f.get('vcodec') == 'none' for f in formats)
        if has_any_audio_stream:
            available_audio_qualities_set.add("Найкраще аудіо (M4A/Opus)") # yt-dlp за замовчуванням прагне до m4a/opus
            if FFMPEG_EXE_PATH: # Якщо є FFmpeg, можемо запропонувати MP3
                available_audio_qualities_set.add("Найкраще аудіо (MP3)")
        elif any(f.get('acodec') != 'none' and f.get('vcodec') != 'none' for f in formats): # Якщо є тільки змерджені
            available_audio_qualities_set.add("Витягнути аудіо (M4A/Opus)")
            if FFMPEG_EXE_PATH:
                available_audio_qualities_set.add("Витягнути аудіо (MP3)")

        video_info_data['qualities_audio'] = sorted(list(available_audio_qualities_set))


        if not video_info_data['qualities_video'] and not video_info_data['qualities_audio']:
            app.logger.warning(f"get_video_info [{request_id_info}]: Не знайдено відео/аудіо якостей для {url} (тип: {extractor_key}).")

        app.logger.info(f"get_video_info [{request_id_info}]: Інформація для {url} (тип: {extractor_key}): Відео якості: {video_info_data['qualities_video']}, Аудіо якості: {video_info_data['qualities_audio']}")
        return video_info_data

    except youtube_dl.utils.DownloadError as e:
        # ... (обробка помилок як раніше) ...
        err_msg = str(e).lower()
        app.logger.error(f"get_video_info [{request_id_info}]: Помилка yt-dlp (DownloadError) для {url}: {type(e)} - {str(e)}")
        if "unsupported url" in err_msg or "not a valid url" in err_msg or "no supported media" in err_msg or "valid url" in err_msg:
            return {'error_type': 'InvalidURL', 'message': 'Наданий URL не підтримується, недійсний або не містить медіа.'}
        if "this video is unavailable" in err_msg or "private video" in err_msg or "video is private" in err_msg or "age restricted" in err_msg:
            return {'error_type': 'VideoUnavailable', 'message': 'Це відео/аудіо недоступне (приватне, видалене, обмеження за віком).'}
        return None
    except Exception as e:
        app.logger.error(f"get_video_info [{request_id_info}]: Загальна помилка для {url}: {type(e)} - {str(e)}\n{traceback.format_exc()}")
        return None

# --- МАРШРУТИ API ---
@app.route('/api/video/preview', methods=['GET'])
def video_preview():
    video_url = request.args.get('url')
    # ... (перевірка video_url) ...
    if not video_url: return jsonify({'error': 'URL не надано'}), 400

    video_info_data = get_video_info(video_url)

    # ... (обробка помилок video_info_data як раніше) ...
    if not video_info_data: return jsonify({'error': 'Не вдалося отримати інформацію. Перевірте URL або спробуйте пізніше.'}), 500
    if video_info_data.get('error_type'): return jsonify({'error': video_info_data['message']}), 400 if video_info_data.get('error_type') == 'InvalidURL' else 404

    # Форматування (залишається схожим, але враховуємо, що деякі поля можуть бути відсутні)
    if isinstance(video_info_data.get('views'), (int, float)):
        views = video_info_data['views']
        if views >= 1000000: video_info_data['views'] = f"{views / 1000000:.1f}M"
        elif views >= 1000: video_info_data['views'] = f"{views / 1000:.1f}K"
    elif video_info_data.get('views') is None: video_info_data['views'] = "N/A"


    if isinstance(video_info_data.get('likes'), (int, float)):
        likes = video_info_data['likes']
        if likes >= 1000000: video_info_data['likes'] = f"{likes / 1000000:.1f}M"
        elif likes >= 1000: video_info_data['likes'] = f"{likes / 1000:.1f}K"
    elif video_info_data.get('likes') is None: video_info_data['likes'] = "N/A"

    duration_seconds = video_info_data.get('duration', 0)
    if isinstance(duration_seconds, (int, float)) and duration_seconds > 0:
        minutes, seconds_rem = divmod(int(duration_seconds), 60)
        hours, minutes = divmod(minutes, 60)
        video_info_data['duration'] = f"{hours}:{minutes:02d}:{seconds_rem:02d}" if hours > 0 else f"{minutes:02d}:{seconds_rem:02d}"
    else: video_info_data['duration'] = "N/A"

    app.logger.info(f"video_preview: Успішно повернуто інформацію для {video_url}")
    return jsonify(video_info_data)


@app.route('/api/video/download', methods=['POST'])
def download_video():
    data = request.json
    video_url = data.get('url')
    # Клієнт тепер має надсилати 'download_type': 'video' або 'audio'
    download_type = data.get('download_type', 'video').lower()
    # 'quality_or_format' може бути як "720p" для відео, так і "mp3" для аудіо
    quality_or_format_req = data.get('quality', 'best')
    request_id = uuid.uuid4().hex[:8]

    app.logger.info(f"download_video [{request_id}]: Запит: URL={video_url}, Тип={download_type}, Якість/Формат={quality_or_format_req}, FFmpeg={FFMPEG_EXE_PATH or 'Немає'}")

    if not video_url: return jsonify({'error': 'URL не надано'}), 400

    try:
        # Отримуємо інфо для назви та типу
        info_opts_for_meta = {'skip_download': True, 'logger': app.logger, 'no_warnings': True}
        with youtube_dl.YoutubeDL(info_opts_for_meta) as ydl_meta:
            info = ydl_meta.extract_info(video_url, download=False)
        if not info: return jsonify({'error': 'Не вдалося отримати інфо про URL.'}), 500

        if '_type' in info and info['_type'] == 'playlist' and info.get('entries'):
            info = info['entries'][0] # Беремо перший елемент, якщо плейлист

        source_type = info.get('extractor_key', '').lower() or get_url_type(url)

        # Санітизація назви файлу
        raw_title = info.get('title', info.get('track', 'downloaded_content'))
        if not raw_title and info.get('description'): raw_title = info.get('description').split('\n')[0][:70]

        sanitized_title_for_file = re.sub(r'[\\/*?:"<>|\x00-\x1f\x7f]', "", raw_title).strip()
        sanitized_title_for_file = sanitized_title_for_file.replace('#', '_H_').replace('%', '_P_') # Простіша заміна
        max_len = 50 # Скорочуємо, щоб залишити місце для якості/формату
        if not sanitized_title_for_file: sanitized_title_for_file = "content"
        elif len(sanitized_title_for_file) > max_len: sanitized_title_for_file = sanitized_title_for_file[:max_len].strip()

        app.logger.debug(f"download_video [{request_id}]: Санітизована назва: '{sanitized_title_for_file}' (Джерело: {source_type})")

        # --- Налаштування для yt-dlp ---
        ydl_opts_download = {
            'logger': app.logger,
            'nocheckcertificate': True,
            'noplaylist': True, # Важливо, щоб не качати весь плейлист
            'ffmpeg_location': FFMPEG_EXE_PATH,
            'quiet': False, 'no_warnings': False, 'verbose': app.debug,
            'format_sort_force': True,
            'prefer_free_formats': True,
        }

        file_label_part = "" # Для імені файлу [якість/формат]
        output_final_extension = None # Визначатиметься логікою нижче

        if download_type == 'video':
            file_label_part = quality_or_format_req if quality_or_format_req != 'best' else 'best_video'
            output_final_extension = 'mp4' # Прагнемо до mp4 для відео

            if 'youtube' in source_type and quality_or_format_req != 'best' and 'p' in quality_or_format_req:
                height_filter = quality_or_format_req[:-1]
                if FFMPEG_EXE_PATH:
                    ydl_opts_download['format'] = f'bestvideo[height<={height_filter}][ext=mp4]+bestaudio[ext=m4a]/bestvideo[height<={height_filter}]+bestaudio/best[height<={height_filter}]'
                else: # Без FFmpeg шукаємо змерджені
                    ydl_opts_download['format'] = f"best[height<={height_filter}][ext=mp4][vcodec!=none][acodec!=none]/best[height<={height_filter}][vcodec!=none][acodec!=none]"
                    output_final_extension = None # yt-dlp визначить
            else: # Для інших платформ або 'best'
                if FFMPEG_EXE_PATH:
                    ydl_opts_download['format'] = 'bestvideo[ext=mp4]+bestaudio[ext=m4a]/bestvideo+bestaudio/best'
                else:
                    ydl_opts_download['format'] = 'best[ext=mp4][vcodec!=none][acodec!=none]/best[vcodec!=none][acodec!=none]'
                    output_final_extension = None

            if FFMPEG_EXE_PATH and output_final_extension == 'mp4': # Якщо плануємо злиття в mp4
                ydl_opts_download['merge_output_format'] = 'mp4'

        elif download_type == 'audio':
            file_label_part = quality_or_format_req # наприклад, "mp3" або "m4a"

            # Бажані формати аудіо
            audio_format_preference = quality_or_format_req.lower()
            if audio_format_preference not in ['mp3', 'm4a', 'opus', 'ogg', 'wav', 'best']:
                audio_format_preference = 'm4a' # За замовчуванням M4A, якщо не вказано відомий

            if audio_format_preference == 'best': # Не плутати з 'best' для відео
                ydl_opts_download['format'] = 'bestaudio/best'
                # Якщо є FFmpeg, yt-dlp може сам конвертувати в кращий формат (зазвичай m4a або opus)
                # Якщо немає FFmpeg, він завантажить найкращий доступний аудіофайл.
                # Розширення буде визначено yt-dlp або postprocessor'ом
                if FFMPEG_EXE_PATH:
                    # За замовчуванням yt-dlp з 'bestaudio' і ffmpeg часто дає m4a/opus.
                    # Якщо клієнт вибрав "Найкраще аудіо (MP3)", то тут має бути 'mp3'
                    # Але якщо клієнт просто "best", то нехай yt-dlp вирішує
                    # Якщо `quality_or_format_req` було щось типу "MP3_placeholder_from_client"
                    if "mp3" in quality_or_format_req.lower() and FFMPEG_EXE_PATH:
                        ydl_opts_download['postprocessors'] = [{
                            'key': 'FFmpegExtractAudio',
                            'preferredcodec': 'mp3',
                            'preferredquality': '192', # Або інший бітрейт
                        }]
                        output_final_extension = 'mp3'
                        file_label_part = 'mp3'
                    else: # m4a/opus за замовчуванням
                        ydl_opts_download['postprocessors'] = [{
                            'key': 'FFmpegExtractAudio',
                            'preferredcodec': 'm4a', # Або opus
                        }]
                        output_final_extension = 'm4a' # Або opus
                        file_label_part = 'm4a' # Або opus

                else: # Немає FFmpeg, розширення визначить yt-dlp
                    output_final_extension = None
            else: # Конкретний аудіо формат запитано (mp3, m4a, opus, etc.)
                if not FFMPEG_EXE_PATH and audio_format_preference == 'mp3':
                    app.logger.warning(f"download_video [{request_id}]: Запит MP3, але FFmpeg недоступний. Спроба завантажити найкраще аудіо.")
                    ydl_opts_download['format'] = 'bestaudio/best' # yt-dlp візьме найкраще доступне
                    output_final_extension = None # yt-dlp визначить
                    file_label_part = 'best_audio'
                elif not FFMPEG_EXE_PATH and audio_format_preference != 'mp3':
                    # Шукаємо конкретний формат без FFmpeg
                    ydl_opts_download['format'] = f'bestaudio[ext={audio_format_preference}]/bestaudio'
                    output_final_extension = None # yt-dlp має дати потрібне розширення
                else: # Є FFmpeg, можемо конвертувати
                    ydl_opts_download['format'] = 'bestaudio/best' # Завантажуємо найкраще аудіо
                    ydl_opts_download['postprocessors'] = [{
                        'key': 'FFmpegExtractAudio',
                        'preferredcodec': audio_format_preference,
                        'preferredquality': '192' if audio_format_preference == 'mp3' else None, # Якість для mp3
                    }]
                    output_final_extension = audio_format_preference
        else:
            return jsonify({'error': f'Непідтримуваний тип завантаження: {download_type}'}), 400

        # Формування імені файлу та шаблону outtmpl
        base_filename_part = f"{sanitized_title_for_file} [{file_label_part}]"
        if output_final_extension:
            output_template = os.path.join(DOWNLOAD_FOLDER, f"{base_filename_part}.{output_final_extension}")
        else: # Розширення буде визначено yt-dlp (наприклад, %(ext)s)
            output_template = os.path.join(DOWNLOAD_FOLDER, f"{base_filename_part}.%(ext)s")

        ydl_opts_download['outtmpl'] = output_template
        app.logger.info(f"download_video [{request_id}]: Налаштування: Тип={download_type}, Формат yt-dlp='{ydl_opts_download.get('format')}', Шаблон файлу='{output_template}'")

        # Завантаження
        with youtube_dl.YoutubeDL(ydl_opts_download) as ydl:
            download_return_code = ydl.download([video_url])
        app.logger.info(f"download_video [{request_id}]: ydl.download завершено з кодом: {download_return_code}")
        if download_return_code != 0:
            # Деякі помилки можуть не викликати виняток, а повернути код
            app.logger.error(f"download_video [{request_id}]: yt-dlp повернув ненульовий код: {download_return_code}. Перевірте логи yt-dlp.")
            # Можливо, варто повернути більш конкретну помилку на основі логів yt-dlp, якщо можливо

        # --- Пошук файлу (логіка залишається схожою, але важливий `output_final_extension`) ---
        actual_filename_found = None
        time.sleep(1.5) # Збільшимо трохи час для можливої конвертації аудіо

        expected_ext_for_search = output_final_extension # Використовуємо визначене розширення
        if ydl_opts_download.get('postprocessors') and not expected_ext_for_search:
            # Якщо був postprocessor (наприклад, FFmpegExtractAudio без явного preferredcodec),
            # розширення могло змінитися. Спробуємо типові аудіо.
            # Цю логіку можна покращити, якщо знати, яке розширення дасть postprocessor.
            pass # Поки що покладаємося на пошук за шаблоном, якщо expected_ext_for_search is None


        if expected_ext_for_search:
            expected_filename = f"{base_filename_part}.{expected_ext_for_search}"
            app.logger.info(f"download_video [{request_id}]: Шукаємо файл (з очікуваним розширенням '{expected_ext_for_search}'): '{expected_filename}'")
            full_expected_path = os.path.join(DOWNLOAD_FOLDER, expected_filename)
            if os.path.exists(full_expected_path) and os.path.isfile(full_expected_path):
                actual_filename_found = expected_filename
                app.logger.info(f"download_video [{request_id}]: Знайдено точний очікуваний файл: '{actual_filename_found}'")

        if not actual_filename_found:
            app.logger.debug(f"download_video [{request_id}]: Точний файл не знайдено або розширення було динамічним. Пошук за '{base_filename_part}*.*'")
            files_in_dir = os.listdir(DOWNLOAD_FOLDER)
            app.logger.debug(f"download_video [{request_id}]: Вміст папки {DOWNLOAD_FOLDER}: {files_in_dir}")
            candidate_files = [f for f in files_in_dir if f.startswith(base_filename_part) and not f.endswith((".part", ".ytdl"))]
            if candidate_files:
                candidate_files.sort(key=lambda name: (len(name), name))
                actual_filename_found = candidate_files[0]
                app.logger.info(f"download_video [{request_id}]: Знайдено файл за шаблоном: '{actual_filename_found}'")

        # --- Перевірка результату ---
        if not actual_filename_found:
            # ... (обробка помилки, якщо файл не знайдено) ...
            return jsonify({'error': 'Файл не знайдено після завантаження/обробки.'}), 500

        # ... (перевірка розміру файлу) ...
        final_output_path = os.path.join(DOWNLOAD_FOLDER, actual_filename_found)
        if not (os.path.exists(final_output_path) and os.path.isfile(final_output_path) and os.path.getsize(final_output_path) > 0):
            return jsonify({'error': 'Завантажений файл порожній або не існує.'}), 500

        # URL-кодування імені файлу для відповіді клієнту
        encoded_filename = url_quote(actual_filename_found)
        app.logger.info(f"download_video [{request_id}]: Успішно. Файл: {actual_filename_found}, URL-кодоване: {encoded_filename}")
        return jsonify({
            'success': True,
            'download_url': f'/download/{encoded_filename}',
            'filename': actual_filename_found
        })

    except youtube_dl.utils.DownloadError as e:
        # ... (обробка помилок yt-dlp як раніше) ...
        return jsonify({'error': f'Помилка yt-dlp: {str(e)}'}), 500
    except Exception as e:
        # ... (обробка загальних помилок як раніше) ...
        return jsonify({'error': 'Внутрішня помилка сервера при завантаженні.'}), 500


# Функція download_file (залишається без змін)
@app.route('/download/<path:filename_from_url>', methods=['GET'])
def download_file(filename_from_url):
    # ... (код як у попередній версії) ...
    request_id = uuid.uuid4().hex[:8]
    app.logger.info(f"download_file [{request_id}]: Отримано запит на завантаження. filename_from_url (після де кодування Flask): '{filename_from_url}'")
    if not filename_from_url.strip(): return jsonify({'error': 'Ім\'я файлу не може бути порожнім'}), 400
    if ".." in filename_from_url or filename_from_url.startswith(("/", "\\")): return jsonify({'error': 'Неприпустиме ім\'я файлу'}), 400
    safe_filename = filename_from_url
    app.logger.info(f"download_file [{request_id}]: Використовується ім'я файлу для пошуку на диску: '{safe_filename}'")
    file_path = os.path.join(DOWNLOAD_FOLDER, safe_filename)
    app.logger.debug(f"download_file [{request_id}]: Повний шлях до файлу: '{file_path}'")
    if not (os.path.exists(file_path) and os.path.isfile(file_path)):
        app.logger.error(f"download_file [{request_id}]: Файл '{file_path}' НЕ ІСНУЄ або не є файлом.")
        return jsonify({'error': 'Файл не знайдено на сервері'}), 404
    app.logger.info(f"download_file [{request_id}]: Файл '{safe_filename}' знайдено, відправка.")
    return send_from_directory(DOWNLOAD_FOLDER, safe_filename, as_attachment=True)


# --- ЗАПУСК СЕРВЕРА ТА НАЛАШТУВАННЯ ЛОГЕРА ---
if __name__ == '__main__':
    # ... (код логера та запуску як у попередній версії) ...
    import logging
    from flask.logging import default_handler

    flask_debug_env = os.environ.get("FLASK_DEBUG")
    current_debug_mode = flask_debug_env == "1" if flask_debug_env is not None else False
    log_level_name_env = os.environ.get("FLASK_LOG_LEVEL", "INFO").upper()
    if current_debug_mode and log_level_name_env == "INFO": log_level = logging.DEBUG
    else: log_level = getattr(logging, log_level_name_env, logging.INFO)

    formatter = logging.Formatter(
        '%(asctime)s - %(name)s - %(levelname)s - [%(process)d:%(threadName)s] - %(module)s.%(funcName)s:%(lineno)d - %(message)s'
    )
    console_handler = logging.StreamHandler(); console_handler.setLevel(log_level); console_handler.setFormatter(formatter)
    file_handler = None
    try:
        log_file_path = 'flask_app.log'
        file_handler = logging.FileHandler(log_file_path, encoding='utf-8')
        file_handler.setLevel(log_level); file_handler.setFormatter(formatter)
        print(f"Файловий логер буде налаштовано для запису в: {os.path.abspath(log_file_path)}")
    except Exception as e_fh: print(f"Не вдалося налаштувати файловий логер: {e_fh}. Логування буде тільки в консоль.")

    app.logger.removeHandler(default_handler); app.logger.setLevel(log_level)
    app.logger.addHandler(console_handler);
    if file_handler: app.logger.addHandler(file_handler)

    werkzeug_logger = logging.getLogger('werkzeug')
    for h in list(werkzeug_logger.handlers): werkzeug_logger.removeHandler(h)
    werkzeug_logger.setLevel(logging.INFO if not current_debug_mode else logging.DEBUG)
    werkzeug_logger.addHandler(console_handler)
    if file_handler: werkzeug_logger.addHandler(file_handler)
    werkzeug_logger.propagate = False

    yt_dlp_logger = logging.getLogger('yt_dlp') # Логер для yt-dlp
    for h in list(yt_dlp_logger.handlers): yt_dlp_logger.removeHandler(h)
    yt_dlp_logger.setLevel(logging.WARNING if not current_debug_mode else logging.DEBUG) # Зробимо менш шумним за замовчуванням
    yt_dlp_logger.addHandler(console_handler)
    if file_handler: yt_dlp_logger.addHandler(file_handler)
    yt_dlp_logger.propagate = False

    imageio_logger = logging.getLogger('imageio_ffmpeg')
    for h in list(imageio_logger.handlers): imageio_logger.removeHandler(h)
    imageio_logger.setLevel(log_level); imageio_logger.addHandler(console_handler)
    if file_handler: imageio_logger.addHandler(file_handler)
    imageio_logger.propagate = False

    app.debug = current_debug_mode
    app.logger.info(f"Flask app starting... Debug mode is {'ON' if app.debug else 'OFF'}. Effective log level for app: {logging.getLevelName(app.logger.getEffectiveLevel())}")

    try:
        use_reloader_flag = app.debug
        app.run(host='0.0.0.0', port=5000, debug=app.debug, use_reloader=use_reloader_flag)
    except Exception as e_run:
        log_func = app.logger.critical if app.logger.hasHandlers() else print
        log_func(f"Критична помилка при запуску Flask-додатку: {e_run}\n{traceback.format_exc()}")

# --- END OF FILE app.py ---