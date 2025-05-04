from flask import Flask, request, jsonify, send_from_directory
import os
import yt_dlp as youtube_dl
import uuid
from flask_cors import CORS
import re

app = Flask(__name__)
CORS(app)

# Конфігурація
DOWNLOAD_FOLDER = 'downloads'
ALLOWED_QUALITIES = ['144p', '240p', '360p', '480p', '720p', '1080p', '1440p', '2160p']
if not os.path.exists(DOWNLOAD_FOLDER):
    os.makedirs(DOWNLOAD_FOLDER)


def is_valid_youtube_url(url):
    """Перевіряє, чи є URL дійсним посиланням YouTube"""
    youtube_regex = (
        r'(https?://)?(www\.)?'
        r'(youtube|youtu|youtube-nocookie)\.(com|be)/'
        r'(watch\?v=|embed/|v/|.+\?v=)?([^&=%\?]{11})'
    )
    return re.match(youtube_regex, url) is not None


def get_video_info(url):
    """Отримує інформацію про відео з YouTube"""
    try:
        ydl_opts = {
            'quiet': True,
            'no_warnings': True,
            'skip_download': True,
            'force_generic_extractor': True,
        }

        with youtube_dl.YoutubeDL(ydl_opts) as ydl:
            info = ydl.extract_info(url, download=False)

            # Форматуємо дані для відповіді
            video_info = {
                'title': info.get('title', 'Невідоме відео'),
                'description': info.get('description', ''),
                'thumbnail': info.get('thumbnail', ''),
                'duration': info.get('duration', 0),
                'views': info.get('view_count', 0),
                'likes': info.get('like_count', 0),
                'qualities': []
            }

            # Отримуємо доступні формати
            formats = info.get('formats', [])
            available_qualities = set()

            for fmt in formats:
                if fmt.get('height'):
                    quality = f"{fmt['height']}p"
                    if quality in ALLOWED_QUALITIES:
                        available_qualities.add(quality)

            video_info['qualities'] = sorted(
                list(available_qualities),
                key=lambda x: int(x[:-1]),
                reverse=True
            )

            return video_info

    except Exception as e:
        print(f"Помилка при отриманні інформації про відео: {e}")
        return None


@app.route('/api/video/preview', methods=['GET'])
def video_preview():
    """Отримує інформацію про відео для прев'ю"""
    video_url = request.args.get('url')

    if not video_url or not is_valid_youtube_url(video_url):
        return jsonify({'error': 'Недійсний URL YouTube'}), 400

    video_info = get_video_info(video_url)

    if not video_info:
        return jsonify({'error': 'Не вдалося отримати інформацію про відео'}), 500

    # Форматуємо числа для кращого відображення
    if video_info['views'] >= 1000000:
        video_info['views'] = f"{video_info['views'] / 1000000:.1f}M"
    elif video_info['views'] >= 1000:
        video_info['views'] = f"{video_info['views'] / 1000:.1f}K"

    if video_info['likes'] >= 1000000:
        video_info['likes'] = f"{video_info['likes'] / 1000000:.1f}M"
    elif video_info['likes'] >= 1000:
        video_info['likes'] = f"{video_info['likes'] / 1000:.1f}K"

    # Форматуємо тривалість
    minutes, seconds = divmod(video_info['duration'], 60)
    hours, minutes = divmod(minutes, 60)
    if hours > 0:
        video_info['duration'] = f"{hours}:{minutes:02d}:{seconds:02d}"
    else:
        video_info['duration'] = f"{minutes}:{seconds:02d}"

    return jsonify(video_info)


@app.route('/api/video/download', methods=['POST'])
def download_video():
    """Завантажує відео з YouTube у вказаній якості"""
    data = request.json
    video_url = data.get('url')
    quality = data.get('quality', '720p')

    if not video_url or not is_valid_youtube_url(video_url):
        return jsonify({'error': 'Недійсний URL YouTube'}), 400

    if quality not in ALLOWED_QUALITIES:
        return jsonify({'error': 'Недійсна якість відео'}), 400

    try:
        # Отримуємо інформацію про відео
        ydl_info_opts = {
            'quiet': True,
            'no_warnings': True,
            'skip_download': True
        }

        with youtube_dl.YoutubeDL(ydl_info_opts) as ydl:
            info = ydl.extract_info(video_url, download=False)
            title = re.sub(r'[\\/*?:"<>|]', "", info.get('title', 'video')).strip()
            filename = f"{title} [{quality}].mp4"
            output_path = os.path.join(DOWNLOAD_FOLDER, filename)

            # Якщо файл вже існує — повертаємо лінк
            if os.path.exists(output_path):
                return jsonify({
                    'success': True,
                    'download_url': f'/download/{filename}',
                    'filename': filename
                })

        # Параметри завантаження
        ydl_opts = {
            'format': f'bestvideo[ext=mp4][height<={quality[:-1]}]+bestaudio[ext=m4a]/best[ext=mp4][height<={quality[:-1]}]',
            'outtmpl': output_path,
            'quiet': True,
            'no_warnings': True,
            'merge_output_format': 'mp4'
        }

        with youtube_dl.YoutubeDL(ydl_opts) as ydl:
            ydl.download([video_url])

        return jsonify({
            'success': True,
            'download_url': f'/download/{filename}',
            'filename': filename
        })

    except Exception as e:
        print(f"Помилка при завантаженні відео: {e}")
        return jsonify({'error': 'Не вдалося завантажити відео'}), 500


@app.route('/download/<filename>', methods=['GET'])
def download_file(filename):
    print(f"[ЗАПИТ НА ЗАВАНТАЖЕННЯ] Ім'я файлу: {filename}")
    file_path = os.path.join(DOWNLOAD_FOLDER, filename)
    print(f"[ШЛЯХ ДО ФАЙЛУ] {file_path}")
    print(f"[ІСНУЄ?] {os.path.exists(file_path)}")

    if not os.path.exists(file_path):
        print(f"[ПОМИЛКА] Файл не знайдено")
        return jsonify({'error': 'Файл не знайдено'}), 404

    return send_from_directory(DOWNLOAD_FOLDER, filename, as_attachment=True)



if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)