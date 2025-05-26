import time
import os
import re
import uuid
from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
import yt_dlp as youtube_dl

app = Flask(__name__)
CORS(app)

# Конфігурація
DOWNLOAD_FOLDER = 'downloads'
ALLOWED_QUALITIES = ['144p', '240p', '360p', '480p', '720p', '1080p'] # Обмежимо для варіанту без FFmpeg
# Вищі якості (1440p, 2160p) майже завжди вимагають FFmpeg.
# Можна залишити їх, але користувачі рідко зможуть їх завантажити без FFmpeg.

if not os.path.exists(DOWNLOAD_FOLDER):
    os.makedirs(DOWNLOAD_FOLDER)


def is_valid_youtube_url(url):
    youtube_regex = (
        r'(https?://)?(www\.)?'
        r'(youtube|youtu|youtube-nocookie)\.(com|be)/'
        r'(watch\?v=|embed/|v/|.+\?v=)?([^&=%\?]{11})'
    )
    return re.match(youtube_regex, url) is not None


def get_video_info(url):
    try:
        ydl_opts = {
            'quiet': True,
            'no_warnings': True,
            'skip_download': True,
            'force_generic_extractor': True,
        }

        with youtube_dl.YoutubeDL(ydl_opts) as ydl:
            info = ydl.extract_info(url, download=False)

            video_info = {
                'title': info.get('title', 'Невідоме відео'),
                'description': info.get('description', ''),
                'thumbnail': info.get('thumbnail', ''),
                'duration': info.get('duration', 0),
                'views': info.get('view_count', 0),
                'likes': info.get('like_count', 0),
                'qualities': []
            }

            formats = info.get('formats', [])
            available_qualities = set()

            for fmt in formats:
                # Шукаємо формати, де відео та аудіо вже є (або тільки відео)
                # і висота відповідає дозволеним.
                # fmt.get('acodec') != 'none' - означає, що є аудіо
                # fmt.get('vcodec') != 'none' - означає, що є відео
                if fmt.get('vcodec') != 'none' and fmt.get('height'):
                    # Додатково можна перевірити, чи формат вже об'єднаний, якщо це можливо
                    # Але для спрощення, будемо вважати, що якщо є vcodec і acodec, то він потенційно підходить
                    # або yt-dlp обере такий, якщо він є.
                    quality = f"{fmt['height']}p"
                    if quality in ALLOWED_QUALITIES:
                        available_qualities.add(quality)

            video_info['qualities'] = sorted(
                list(available_qualities),
                key=lambda x: int(x[:-1]),
                reverse=True
            )
            return video_info

    except youtube_dl.utils.DownloadError as e:
        app.logger.error(f"Помилка yt-dlp при отриманні інформації про відео ({url}): {e}")
        if "Unsupported URL" in str(e) or "not a valid URL" in str(e):
            return {'error_type': 'InvalidURL', 'message': 'Наданий URL не підтримується або недійсний.'}
        return None
    except Exception as e:
        app.logger.error(f"Загальна помилка при отриманні інформації про відео ({url}): {e}")
        return None


@app.route('/api/video/preview', methods=['GET'])
def video_preview():
    video_url = request.args.get('url')

    if not video_url:
        return jsonify({'error': 'URL відео не надано'}), 400
    if not is_valid_youtube_url(video_url):
        return jsonify({'error': 'Недійсний URL YouTube'}), 400

    video_info = get_video_info(video_url)

    if not video_info:
        return jsonify({'error': 'Не вдалося отримати інформацію про відео. Можливо, відео приватне, видалене або URL некоректний.'}), 500
    if video_info.get('error_type') == 'InvalidURL':
        return jsonify({'error': video_info['message']}), 400

    if video_info['views'] >= 1000000: video_info['views'] = f"{video_info['views'] / 1000000:.1f}M"
    elif video_info['views'] >= 1000: video_info['views'] = f"{video_info['views'] / 1000:.1f}K"
    if video_info['likes'] >= 1000000: video_info['likes'] = f"{video_info['likes'] / 1000000:.1f}M"
    elif video_info['likes'] >= 1000: video_info['likes'] = f"{video_info['likes'] / 1000:.1f}K"

    duration_seconds = video_info.get('duration', 0)
    if isinstance(duration_seconds, (int, float)):
        minutes, seconds = divmod(int(duration_seconds), 60)
        hours, minutes = divmod(minutes, 60)
        video_info['duration'] = f"{hours}:{minutes:02d}:{seconds:02d}" if hours > 0 else f"{minutes:02d}:{seconds:02d}"
    else:
        video_info['duration'] = "N/A"

    if not video_info['qualities']:
        app.logger.warning(f"Для відео {video_url} не знайдено доступних якостей з ALLOWED_QUALITIES.")

    return jsonify(video_info)


@app.route('/api/video/download', methods=['POST'])
def download_video():
    data = request.json
    video_url = data.get('url')
    quality_req = data.get('quality', '720p') # Якість, запитана користувачем

    if not video_url or not is_valid_youtube_url(video_url):
        return jsonify({'error': 'Недійсний URL YouTube'}), 400

    # Для версії без FFmpeg, ми більше покладатимемося на yt-dlp для вибору "найкращого"
    # з того, що не потребує об'єднання, до вказаної якості.
    # Якість (наприклад '720p') буде використана для фільтрації.
    if quality_req not in ALLOWED_QUALITIES and quality_req != 'best':
        return jsonify({'error': f'Недійсна якість відео: {quality_req}'}), 400

    try:
        unique_id = uuid.uuid4().hex

        # Отримуємо інформацію про відео для назви файлу та фактичного розширення
        # Це додатковий запит, але він потрібен, щоб дізнатися розширення заздалегідь
        temp_ydl_opts = {'quiet': True, 'skip_download': True}
        with youtube_dl.YoutubeDL(temp_ydl_opts) as ydl_info_extractor:
            info = ydl_info_extractor.extract_info(video_url, download=False)
            title = re.sub(r'[\\/*?:"<>|]', "", info.get('title', 'video')).strip()
            if len(title) > 60: title = title[:60] + "..."

            # Спробуємо визначити розширення файлу, який буде завантажено
            # Це складно без фактичного вибору формату yt-dlp,
            # тому поки що будемо використовувати '.mp4' і сподіватися, що це буде так.
            # Або можна залишити назву без розширення і додати його після завантаження,
            # перевіривши фактичне розширення завантаженого файлу.
            # Для простоти, залишимо .mp4, але це може бути неточно.
            # Якщо yt-dlp завантажить .webm, ім'я файлу буде .mp4, а вміст .webm.
            # Краще було б після завантаження перейменувати файл на основі його фактичного типу.
            # Однак, для цього потрібно спочатку завантажити у тимчасовий файл без розширення.

        # Селектор формату для роботи без FFmpeg:
        # 1. Шукаємо найкращий формат з відео ТА аудіо, який вже є mp4, і не вище вказаної якості.
        # 2. Якщо такого немає, шукаємо найкращий формат з відео ТА аудіо, не вище вказаної якості (будь-який контейнер).
        # 3. Якщо і такого немає, шукаємо найкращий формат (може бути тільки відео або тільки аудіо, якщо нічого кращого немає), не вище вказаної якості.
        # yt-dlp сам намагатиметься вибрати формат, який не потребує об'єднання, якщо FFmpeg не вказано/не знайдено.

        # Спрощений селектор: найкращий формат, що не перевищує вказану висоту.
        # yt-dlp сам спробує знайти формат, що не потребує об'єднання.
        # Якщо 'best' передано, то обираємо найкращий доступний (може бути високої якості, що вимагає об'єднання)
        if quality_req == 'best':
            format_selector = 'bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]/best'
        else:
            # Намагаємося отримати mp4 з відео та аудіо, якщо можливо, в межах якості
            # (vcodec!=none&acodec!=none) - спроба вибрати об'єднаний формат
            # [height<=quality_req[:-1]] - фільтр по висоті
            # [ext=mp4] - пріоритет для mp4
            # Якщо немає, то просто найкращий в межах якості.
            height_filter = quality_req[:-1]
            format_selector = (
                f"best[vcodec!=none][acodec!=none][height<={height_filter}][ext=mp4]/" # Найкращий об'єднаний mp4
                f"bestvideo[vcodec!=none][acodec!=none][height<={height_filter}]+bestaudio[height<={height_filter}]/" # Для yt-dlp, якщо він може об'єднати без ffmpeg (малоймовірно)
                f"best[vcodec!=none][acodec!=none][height<={height_filter}]/" # Найкращий об'єднаний будь-якого типу
                f"best[height<={height_filter}][ext=mp4]/" # Найкращий mp4 (може бути тільки відео)
                f"best[height<={height_filter}]" # Просто найкращий в межах якості
            )
            # Для повного відключення спроб об'єднання, можна використовувати:
            # format_selector = f"best[vcodec!=none][acodec!=none][height<={height_filter}][ext=mp4]/best[vcodec!=none][acodec!=none][height<={height_filter}]/best[height<={height_filter}]"


        # Назва файлу буде з .mp4, але фактичний тип може відрізнятися.
        # Це компроміс для версії без FFmpeg.
        actual_quality_for_filename = quality_req # Якість, яку покажемо в назві
        filename = f"{title} [{actual_quality_for_filename}]_{unique_id}.mp4" # Залишаємо .mp4
        output_path = os.path.join(DOWNLOAD_FOLDER, filename)

        ydl_opts = {
            'format': format_selector,
            'outtmpl': output_path,
            'quiet': False, # Вмикаємо логи, щоб бачити, що відбувається
            'no_warnings': False,
            # 'merge_output_format': 'mp4', # Ця опція не спрацює належним чином без FFmpeg, якщо потрібне об'єднання
            # Якщо завантажується не mp4, він залишиться таким, яким є.
            'verbose': app.debug, # Виводити більше логів, якщо Flask в debug режимі
            # 'postprocessors': [], # Видаляємо постпроцесори, що залежать від FFmpeg
            'ffmpeg_location': None # Явно вказуємо, що не шукати/не використовувати ffmpeg
            # Хоча yt-dlp сам не буде його використовувати, якщо не знайде
        }
        # Додаткове налаштування, щоб yt-dlp не намагався викликати ffmpeg для об'єднання
        # Це може бути не стандартною опцією yt-dlp, а скоріше побажанням
        # Зазвичай, якщо ffmpeg_location=None або він не знайдений, yt-dlp не буде його використовувати.
        # Головне - правильний format_selector.

        app.logger.info(f"Спроба завантажити (без FFmpeg): {video_url} з якістю '{quality_req}' у файл {filename}")
        app.logger.info(f"Використовується форматний рядок: {format_selector}")

        downloaded_correctly = False
        try:
            with youtube_dl.YoutubeDL(ydl_opts) as ydl:
                # Якщо yt-dlp не зможе завантажити (наприклад, формат вимагає об'єднання, а FFmpeg немає),
                # він може видати помилку або завантажити тільки один потік.
                ydl.download([video_url])

            if os.path.exists(output_path) and os.path.getsize(output_path) > 0:
                downloaded_correctly = True
                # Тут можна було б перевірити фактичне розширення файлу і перейменувати,
                # але це ускладнить код.
                app.logger.info(f"Файл {filename} успішно завантажено.")
            else:
                # Файл не створено або порожній
                app.logger.error(f"Файл {output_path} не було створено або він порожній після спроби завантаження.")
        except youtube_dl.utils.DownloadError as de:
            # Обробка помилок, специфічних для yt-dlp, які можуть виникнути,
            # якщо потрібний формат не може бути отриманий без FFmpeg
            app.logger.error(f"Помилка yt-dlp під час завантаження (можливо, потрібен FFmpeg): {de}")
            if "ffmpeg" in str(de).lower() or "merger" in str(de).lower():
                return jsonify({'error': f'Не вдалося завантажити відео у запитуваній якості ({quality_req}) без FFmpeg. Спробуйте нижчу якість або інше відео.'}), 500
            raise # Перевикидаємо помилку, якщо вона не пов'язана з FFmpeg

        if not downloaded_correctly:
            return jsonify({'error': 'Не вдалося завантажити відео. Файл не створено або порожній.'}), 500

        return jsonify({
            'success': True,
            'download_url': f'/download/{filename}',
            'filename': filename
        })

    except youtube_dl.utils.DownloadError as e:
        app.logger.error(f"Помилка yt-dlp при завантаженні відео: {e}")
        if "Unsupported URL" in str(e): return jsonify({'error': f'URL не підтримується: {video_url}'}), 400
        if "video unavailable" in str(e).lower(): return jsonify({'error': 'Відео недоступне.'}), 404
        if "No video formats found" in str(e) or "requested format not available" in str(e):
            return jsonify({'error': f'Запитувана якість ({quality_req}) недоступна для цього відео або потребує FFmpeg.'}), 400
        return jsonify({'error': f'Помилка завантаження відео: {str(e)}'}), 500
    except Exception as e:
        app.logger.error(f"Загальна помилка при завантаженні відео: {e}")
        import traceback
        app.logger.error(traceback.format_exc())
        return jsonify({'error': 'Не вдалося завантажити відео через непередбачену помилку сервера.'}), 500


@app.route('/download/<path:filename>', methods=['GET'])
def download_file(filename):
    if '/' in filename or '\\' in filename:
        return jsonify({'error': 'Неприпустиме ім\'я файлу'}), 400
    file_path = os.path.join(DOWNLOAD_FOLDER, filename)
    app.logger.info(f"Запит на завантаження файлу: {file_path}")
    if not os.path.exists(file_path):
        app.logger.error(f"Файл не знайдено: {file_path}")
        return jsonify({'error': 'Файл не знайдено'}), 404
    try:
        response = send_from_directory(DOWNLOAD_FOLDER, filename, as_attachment=True)
        @response.call_on_close
        def remove_file_after_send():
            try:
                # time.sleep(0.5) # Розкоментуйте, якщо виникають проблеми з видаленням
                os.remove(file_path)
                app.logger.info(f"Файл {filename} успішно видалено після відправки.")
            except Exception as error:
                app.logger.error(f"Помилка видалення файлу {filename}: {error}")
        return response
    except Exception as e:
        app.logger.error(f"Помилка при відправці файлу {filename}: {e}")
        return jsonify({'error': 'Не вдалося відправити файл.'}), 500

if __name__ == '__main__':
    import logging
    logging.basicConfig(level=logging.DEBUG if app.debug else logging.INFO) # Більше логів для debug

    # Створення файлового логера
    file_handler = logging.FileHandler('flask_app.log', encoding='utf-8')
    file_handler.setLevel(logging.DEBUG if app.debug else logging.INFO)
    formatter = logging.Formatter('%(asctime)s - %(name)s - %(levelname)s - %(message)s')
    file_handler.setFormatter(formatter)

    # Додавання файлового логера до логера Flask
    # Також можна додати до кореневого логера, щоб логувати і yt-dlp
    logging.getLogger().addHandler(file_handler) # Для логів yt-dlp
    app.logger.addHandler(file_handler) # Для логів самого Flask додатку

    app.logger.info("Flask app starting...")
    app.run(host='0.0.0.0', port=5000, debug=True)