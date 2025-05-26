import time
import os
import re
import uuid
from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
import yt_dlp as youtube_dl

app = Flask(__name__)
CORS(app)  # Для розробки можна залишити так, для продакшену обмежити джерела

# Конфігурація
DOWNLOAD_FOLDER = 'downloads'
ALLOWED_QUALITIES = ['144p', '240p', '360p', '480p', '720p', '1080p', '1440p', '2160p']
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
            'force_generic_extractor': True,  # Важливо для отримання інформації без завантаження
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
                # Перевіряємо, що формат має відео і аудіо, або є тільки відео (і потім додамо аудіо)
                if fmt.get('vcodec') != 'none' and fmt.get('height'):
                    quality = f"{fmt['height']}p"
                    if quality in ALLOWED_QUALITIES:
                        available_qualities.add(quality)

            # Якщо відео має лише аудіо або незвичайні формати, може бути порожнім
            # Можна додати логіку для обробки таких випадків, якщо потрібно

            video_info['qualities'] = sorted(
                list(available_qualities),
                key=lambda x: int(x[:-1]),
                reverse=True
            )
            # Забезпечуємо, що '720p' є за замовчуванням, якщо доступно
            if not video_info['qualities'] and '720p' in ALLOWED_QUALITIES:
                # Це може бути ситуація, коли жодної якості не знайдено, але ми можемо спробувати 720p
                # Або ж, якщо доступні якості є, але '720p' немає серед них, це нормально.
                # Якщо 'qualities' порожній, значить yt-dlp не знайшов підтримуваних відео форматів з висотою.
                # Можна залишити порожнім, або додати стандартну якість, якщо це відео без чітко визначених "p" якостей.
                pass

            return video_info

    except youtube_dl.utils.DownloadError as e:
        app.logger.error(f"Помилка yt-dlp при отриманні інформації про відео ({url}): {e}")
        # Можна повертати більш конкретну помилку, якщо це потрібно фронтенду
        if "Unsupported URL" in str(e) or "not a valid URL" in str(e):
            return {'error_type': 'InvalidURL', 'message': 'Наданий URL не підтримується або недійсний.'}
        return None  # Загальна помилка
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
        return jsonify({
            'error': 'Не вдалося отримати інформацію про відео. Можливо, відео приватне, видалене або URL некоректний.'}), 500

    if video_info.get('error_type') == 'InvalidURL':
        return jsonify({'error': video_info['message']}), 400

    # Форматування переглядів та лайків
    if video_info['views'] >= 1000000:
        video_info['views'] = f"{video_info['views'] / 1000000:.1f}M"
    elif video_info['views'] >= 1000:
        video_info['views'] = f"{video_info['views'] / 1000:.1f}K"

    if video_info['likes'] >= 1000000:
        video_info['likes'] = f"{video_info['likes'] / 1000000:.1f}M"
    elif video_info['likes'] >= 1000:
        video_info['likes'] = f"{video_info['likes'] / 1000:.1f}K"

    # Форматування тривалості
    duration_seconds = video_info.get('duration', 0)
    if isinstance(duration_seconds, (int, float)):
        minutes, seconds = divmod(int(duration_seconds), 60)
        hours, minutes = divmod(minutes, 60)
        if hours > 0:
            video_info['duration'] = f"{hours}:{minutes:02d}:{seconds:02d}"
        else:
            video_info['duration'] = f"{minutes:02d}:{seconds:02d}"
    else:
        video_info['duration'] = "N/A"  # Якщо тривалість не число

    # Переконатися, що список якостей не порожній, якщо можливо
    if not video_info['qualities']:
        # Можна додати стандартну якість, якщо yt-dlp не зміг визначити,
        # але це може призвести до помилок при завантаженні.
        # Краще, щоб фронтенд обробляв порожній список якостей.
        # Наприклад, можна додати 'best' як опцію, якщо список порожній.
        # Для даного випадку, залишимо як є, щоб фронтенд показав що є.
        app.logger.warning(f"Для відео {video_url} не знайдено доступних якостей з ALLOWED_QUALITIES.")

    return jsonify(video_info)


@app.route('/api/video/download', methods=['POST'])
def download_video():
    data = request.json
    video_url = data.get('url')
    quality = data.get('quality', '720p')  # За замовчуванням 720p

    if not video_url or not is_valid_youtube_url(video_url):
        return jsonify({'error': 'Недійсний URL YouTube'}), 400

    if quality not in ALLOWED_QUALITIES:
        # Якщо фронтенд може надсилати "best", обробити це
        if quality != 'best':  # Приклад, якщо б ми дозволяли "best"
            return jsonify({'error': f'Недійсна якість відео: {quality}'}), 400

    try:
        unique_id = uuid.uuid4().hex

        # Спочатку отримуємо назву, щоб уникнути повторного запиту, якщо можливо
        # Однак, для простоти, будемо отримувати її в рамках одного процесу ydl

        # Налаштування для завантаження
        # Використовуємо yt-dlp синтаксис для якості
        # f'bestvideo[height<={quality[:-1]}]+bestaudio/best[height<={quality[:-1]}]'
        # Для простоти можна використовувати просто 'best' і сподіватися, що yt-dlp обере найкраще до 720p
        # Або ж, якщо якість вказана точно (наприклад, '720p'), то:
        format_selector = f'bestvideo[height={quality[:-1]}][ext=mp4]+bestaudio[ext=m4a]/bestvideo[height={quality[:-1]}]+bestaudio/best[height={quality[:-1]}]/best'
        if "p" not in quality:  # На випадок, якщо прийде щось типу "best"
            format_selector = quality

        # Отримуємо інформацію про відео для назви файлу
        with youtube_dl.YoutubeDL({'quiet': True, 'skip_download': True}) as ydl_info:
            info = ydl_info.extract_info(video_url, download=False)
            title = re.sub(r'[\\/*?:"<>|]', "", info.get('title', 'video')).strip()
            # Якщо назва занадто довга, її можна обрізати
            max_len = 60  # Максимальна довжина частини назви
            if len(title) > max_len:
                title = title[:max_len] + "..."

        filename = f"{title} [{quality}]_{unique_id}.mp4"
        output_path = os.path.join(DOWNLOAD_FOLDER, filename)

        ydl_opts = {
            'format': format_selector,
            'outtmpl': output_path,
            'quiet': True,
            'no_warnings': True,
            'merge_output_format': 'mp4',
            'postprocessors': [{
                'key': 'FFmpegVideoConvertor',
                'preferedformat': 'mp4',
            }],
            'verbose': True, # для дебагу
        }

        app.logger.info(f"Спроба завантажити: {video_url} з якістю {quality} у файл {filename}")
        app.logger.info(f"Використовується формат: {format_selector}")

        with youtube_dl.YoutubeDL(ydl_opts) as ydl:
            ydl.download([video_url])

        if not os.path.exists(output_path):
            app.logger.error(f"Файл {output_path} не було створено після спроби завантаження.")
            return jsonify({'error': 'Не вдалося завантажити відео. Файл не створено.'}), 500

        return jsonify({
            'success': True,
            'download_url': f'/download/{filename}',  # Відносний URL
            'filename': filename
        })

    except youtube_dl.utils.DownloadError as e:
        app.logger.error(f"Помилка yt-dlp при завантаженні відео: {e}")
        # Спробуємо дати більш зрозуміле повідомлення
        if "Unsupported URL" in str(e):
            return jsonify({'error': f'URL не підтримується: {video_url}'}), 400
        if "video unavailable" in str(e).lower():
            return jsonify({'error': 'Відео недоступне (можливо, приватне або видалене).'}), 404
        if "No video formats found" in str(e) or "requested format not available" in str(e):
            return jsonify({'error': f'Запитувана якість ({quality}) недоступна для цього відео. Спробуйте іншу.'}), 400
        return jsonify({'error': f'Помилка завантаження відео: {str(e)}'}), 500
    except Exception as e:
        app.logger.error(f"Загальна помилка при завантаженні відео: {e}")
        import traceback
        app.logger.error(traceback.format_exc())
        return jsonify({'error': 'Не вдалося завантажити відео через непередбачену помилку сервера.'}), 500


@app.route('/download/<path:filename>', methods=['GET'])  # path:filename для підтримки назв з пробілами тощо
def download_file(filename):
    # Важливо: Санітизувати filename або переконатися, що він не містить шляхів типу ../
    # У нашому випадку filename генерується сервером, тому це менш критично,
    # але хороша практика - валідувати його.
    # Простий спосіб - переконатися, що він не містить '/' або '\'
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
                # Невелика затримка може бути корисною на деяких системах (наприклад, Windows)
                # щоб файл встиг звільнитися процесом, що його віддає.
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
    # Додаємо логування для кращого дебагу
    import logging

    logging.basicConfig(level=logging.INFO)
    handler = logging.FileHandler('flask_app.log')  # Зберігати логи у файл
    handler.setLevel(logging.INFO)
    formatter = logging.Formatter('%(asctime)s - %(name)s - %(levelname)s - %(message)s')
    handler.setFormatter(formatter)
    app.logger.addHandler(handler)

    app.run(host='0.0.0.0', port=5000, debug=True)