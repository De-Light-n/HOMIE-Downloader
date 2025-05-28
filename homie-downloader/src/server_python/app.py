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

# --- CONFIGURATION ---
DOWNLOAD_FOLDER = 'downloads'
FFMPEG_EXE_PATH = None # Automatically determined

if not os.path.exists(DOWNLOAD_FOLDER):
    try:
        os.makedirs(DOWNLOAD_FOLDER)
        print(f"Folder {DOWNLOAD_FOLDER} created.")
    except Exception as e:
        print(f"Failed to create folder {DOWNLOAD_FOLDER}: {e}")

def get_ffmpeg_path_with_auto_download():
    global FFMPEG_EXE_PATH
    if FFMPEG_EXE_PATH and os.path.exists(FFMPEG_EXE_PATH) and os.path.isfile(FFMPEG_EXE_PATH):
        return FFMPEG_EXE_PATH
    try:
        ffmpeg_path = imageio_ffmpeg.get_ffmpeg_exe()
        if os.path.exists(ffmpeg_path) and os.path.isfile(ffmpeg_path):
            FFMPEG_EXE_PATH = ffmpeg_path
            print(f"FFmpeg found/downloaded: {ffmpeg_path}")
            return ffmpeg_path
        else:
            print(f"imageio-ffmpeg could not provide a valid path to FFmpeg: {ffmpeg_path}")
            FFMPEG_EXE_PATH = None
            return None
    except Exception as e:
        print(f"Error while getting/downloading FFmpeg: {e}")
        FFMPEG_EXE_PATH = None
        return None

print("Initializing FFmpeg path...")
FFMPEG_EXE_PATH = get_ffmpeg_path_with_auto_download()
print(f"Final FFmpeg path: {FFMPEG_EXE_PATH or 'Not defined/Not downloaded'}")


# --- HELPER FUNCTIONS ---
def get_url_type(url):
    if re.match(r'(https?://)?(www\.)?(youtube|youtu|youtube-nocookie)\.(com|be)/', url):
        return 'youtube'
    if re.match(r'(https?://)?(.*tiktok\.com.*)', url, re.IGNORECASE):
        return 'tiktok'
    if re.match(r'(https?://)?(.*soundcloud\.com.*)', url, re.IGNORECASE):
        return 'soundcloud'
    if re.match(r'(https?://)?(.*vimeo\.com.*)', url, re.IGNORECASE):
        return 'vimeo'
    return 'unknown'


def get_video_info(url):
    request_id_info = uuid.uuid4().hex[:8]
    app.logger.info(f"get_video_info [{request_id_info}]: Requesting info for URL: {url}")

    try:
        ydl_opts = {
            'no_warnings': False,
            'skip_download': True,
            'force_generic_extractor': False,
            'logger': app.logger,
            'ffmpeg_location': FFMPEG_EXE_PATH,
            'extract_flat': 'in_playlist',
            'playlist_items': '1',
        }
        with youtube_dl.YoutubeDL(ydl_opts) as ydl:
            info = ydl.extract_info(url, download=False)

        if not info:
            app.logger.warning(f"get_video_info [{request_id_info}]: yt-dlp returned empty info for {url}")
            return None

        if '_type' in info and info['_type'] == 'playlist' and info.get('entries'):
            info = info['entries'][0]
            if not info:
                app.logger.warning(f"get_video_info [{request_id_info}]: First playlist item is empty for {url}")
                return None

        extractor_key = info.get('extractor_key', '').lower()
        if not extractor_key: extractor_key = get_url_type(url)

        video_info_data = {
            'title': info.get('title', info.get('fulltitle', 'Unknown Title')),
            'description': info.get('description', ''),
            'thumbnail': info.get('thumbnail', ''),
            'duration': info.get('duration', 0),
            'views': info.get('view_count', info.get('play_count')),
            'likes': info.get('like_count'),
            'uploader': info.get('uploader', info.get('creator', info.get('channel', info.get('artist')))),
            'qualities_video': [],
            'qualities_audio': [],
            'source_type': extractor_key or 'generic',
            'original_url': info.get('webpage_url', url),
        }

        if 'youtube' in extractor_key:
            pass
        elif 'tiktok' in extractor_key:
            video_info_data['title'] = info.get('title', info.get('description', 'TikTok Video'))
            if not video_info_data['title'] and video_info_data['description']:
                video_info_data['title'] = video_info_data['description'].split('\n')[0][:70]
        elif 'soundcloud' in extractor_key:
            video_info_data['title'] = info.get('title', info.get('track', 'Audio Track'))
            video_info_data['uploader'] = info.get('uploader', info.get('user', {}).get('username'))

        formats = info.get('formats', [])
        if not formats:
            app.logger.warning(f"get_video_info [{request_id_info}]: No formats for {url} (type: {extractor_key}).")

        available_video_qualities_set = set()
        if 'youtube' in extractor_key:
            allowed_qualities_preview = ['144p', '240p', '360p', '480p', '720p', '1080p', '1440p', '2160p']
            for fmt in formats:
                if fmt.get('vcodec') != 'none' and fmt.get('height'):
                    quality_str = f"{fmt['height']}p"
                    if quality_str in allowed_qualities_preview:
                        available_video_qualities_set.add(quality_str)
            video_info_data['qualities_video'] = sorted(list(available_video_qualities_set), key=lambda q_str: int(q_str[:-1]), reverse=True)
        else:
            has_any_video = any(f.get('vcodec') != 'none' and f.get('ext') == 'mp4' for f in formats)
            if has_any_video:
                video_info_data['qualities_video'] = ['Best Video (MP4)']
            elif FFMPEG_EXE_PATH and any(f.get('vcodec') != 'none' and f.get('acodec') == 'none' for f in formats):
                video_info_data['qualities_video'] = ['Best Video (requires merge)']

        available_audio_qualities_set = set()
        has_any_audio_stream = any(f.get('acodec') != 'none' and f.get('vcodec') == 'none' for f in formats)
        if has_any_audio_stream:
            available_audio_qualities_set.add("Best audio (M4A/Opus)")
            if FFMPEG_EXE_PATH:
                available_audio_qualities_set.add("Best audio (MP3)")
        elif any(f.get('acodec') != 'none' and f.get('vcodec') != 'none' for f in formats):
            available_audio_qualities_set.add("Extract Audio (M4A/Opus)")
            if FFMPEG_EXE_PATH:
                available_audio_qualities_set.add("Extract Audio (MP3)")

        video_info_data['qualities_audio'] = sorted(list(available_audio_qualities_set))


        if not video_info_data['qualities_video'] and not video_info_data['qualities_audio']:
            app.logger.warning(f"get_video_info [{request_id_info}]: No video/audio qualities found for {url} (type: {extractor_key}).")

        app.logger.info(f"get_video_info [{request_id_info}]: Info for {url} (type: {extractor_key}): Video qualities: {video_info_data['qualities_video']}, Audio qualities: {video_info_data['qualities_audio']}")
        return video_info_data

    except youtube_dl.utils.DownloadError as e:
        err_msg = str(e).lower()
        app.logger.error(f"get_video_info [{request_id_info}]: yt-dlp error (DownloadError) for {url}: {type(e)} - {str(e)}")
        if "unsupported url" in err_msg or "not a valid url" in err_msg or "no supported media" in err_msg or "valid url" in err_msg:
            return {'error_type': 'InvalidURL', 'message': 'The provided URL is unsupported, invalid, or does not contain media.'}
        if "this video is unavailable" in err_msg or "private video" in err_msg or "video is private" in err_msg or "age restricted" in err_msg:
            return {'error_type': 'VideoUnavailable', 'message': 'This video/audio is unavailable (private, deleted, age-restricted).'}
        return None
    except Exception as e:
        app.logger.error(f"get_video_info [{request_id_info}]: General error for {url}: {type(e)} - {str(e)}\n{traceback.format_exc()}")
        return None

# --- API ROUTES ---
@app.route('/api/video/preview', methods=['GET'])
def video_preview():
    video_url = request.args.get('url')
    if not video_url: return jsonify({'error': 'URL not provided'}), 400

    video_info_data = get_video_info(video_url)

    if not video_info_data: return jsonify({'error': 'Failed to get information. Check the URL or try again later.'}), 500
    if video_info_data.get('error_type'): return jsonify({'error': video_info_data['message']}), 400 if video_info_data.get('error_type') == 'InvalidURL' else 404

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

    app.logger.info(f"video_preview: Successfully returned information for {video_url}")
    return jsonify(video_info_data)


@app.route('/api/video/download', methods=['POST'])
def download_video():
    data = request.json
    video_url = data.get('url')
    download_type = data.get('download_type', 'video').lower()
    quality_or_format_req = data.get('quality', 'best')
    request_id = uuid.uuid4().hex[:8]

    app.logger.info(f"download_video [{request_id}]: Request: URL={video_url}, Type={download_type}, Quality/Format={quality_or_format_req}, FFmpeg={FFMPEG_EXE_PATH or 'Not Defined'}")

    if not video_url: return jsonify({'error': 'URL not provided'}), 400

    try:
        info_opts_for_meta = {'skip_download': True, 'logger': app.logger, 'no_warnings': True}
        with youtube_dl.YoutubeDL(info_opts_for_meta) as ydl_meta:
            info = ydl_meta.extract_info(video_url, download=False)
        if not info: return jsonify({'error': 'Failed to get info about URL.'}), 500

        if '_type' in info and info['_type'] == 'playlist' and info.get('entries'):
            info = info['entries'][0]

        source_type = info.get('extractor_key', '').lower() or get_url_type(video_url) # Fixed: was 'url' instead of 'video_url'

        raw_title = info.get('title', info.get('track', 'downloaded_content'))
        if not raw_title and info.get('description'): raw_title = info.get('description').split('\n')[0][:70]

        sanitized_title_for_file = re.sub(r'[\\/*?:"<>|\x00-\x1f\x7f]', "", raw_title).strip()
        sanitized_title_for_file = sanitized_title_for_file.replace('#', '_H_').replace('%', '_P_')
        max_len = 50
        if not sanitized_title_for_file: sanitized_title_for_file = "content"
        elif len(sanitized_title_for_file) > max_len: sanitized_title_for_file = sanitized_title_for_file[:max_len].strip()

        app.logger.debug(f"download_video [{request_id}]: Sanitized title: '{sanitized_title_for_file}' (Source: {source_type})")

        ydl_opts_download = {
            'logger': app.logger,
            'nocheckcertificate': True,
            'noplaylist': True,
            'ffmpeg_location': FFMPEG_EXE_PATH,
            'quiet': False, 'no_warnings': False, 'verbose': app.debug,
            'format_sort_force': True,
            'prefer_free_formats': True,
        }

        file_label_part = ""
        output_final_extension = None

        if download_type == 'video':
            file_label_part = quality_or_format_req if quality_or_format_req != 'best' else 'best_video'
            output_final_extension = 'mp4'

            if 'youtube' in source_type and quality_or_format_req != 'best' and 'p' in quality_or_format_req:
                height_filter = quality_or_format_req[:-1]
                if FFMPEG_EXE_PATH:
                    ydl_opts_download['format'] = f'bestvideo[height<={height_filter}][ext=mp4]+bestaudio[ext=m4a]/bestvideo[height<={height_filter}]+bestaudio/best[height<={height_filter}]'
                else:
                    ydl_opts_download['format'] = f"best[height<={height_filter}][ext=mp4][vcodec!=none][acodec!=none]/best[height<={height_filter}][vcodec!=none][acodec!=none]"
                    output_final_extension = None
            else:
                if FFMPEG_EXE_PATH:
                    ydl_opts_download['format'] = 'bestvideo[ext=mp4]+bestaudio[ext=m4a]/bestvideo+bestaudio/best'
                else:
                    ydl_opts_download['format'] = 'best[ext=mp4][vcodec!=none][acodec!=none]/best[vcodec!=none][acodec!=none]'
                    output_final_extension = None

            if FFMPEG_EXE_PATH and output_final_extension == 'mp4':
                ydl_opts_download['merge_output_format'] = 'mp4'

        elif download_type == 'audio':
            file_label_part = quality_or_format_req

            audio_format_preference = quality_or_format_req.lower()
            if audio_format_preference not in ['mp3', 'm4a', 'opus', 'ogg', 'wav', 'best']:
                audio_format_preference = 'm4a'

            if audio_format_preference == 'best':
                ydl_opts_download['format'] = 'bestaudio/best'
                if FFMPEG_EXE_PATH:
                    if "mp3" in quality_or_format_req.lower() and FFMPEG_EXE_PATH:
                        ydl_opts_download['postprocessors'] = [{
                            'key': 'FFmpegExtractAudio',
                            'preferredcodec': 'mp3',
                            'preferredquality': '192',
                        }]
                        output_final_extension = 'mp3'
                        file_label_part = 'mp3'
                    else:
                        ydl_opts_download['postprocessors'] = [{
                            'key': 'FFmpegExtractAudio',
                            'preferredcodec': 'm4a',
                        }]
                        output_final_extension = 'm4a'
                        file_label_part = 'm4a'

                else:
                    output_final_extension = None
            else:
                if not FFMPEG_EXE_PATH and audio_format_preference == 'mp3':
                    app.logger.warning(f"download_video [{request_id}]: MP3 requested, but FFmpeg is unavailable. Attempting to download best audio.")
                    ydl_opts_download['format'] = 'bestaudio/best'
                    output_final_extension = None
                    file_label_part = 'best_audio'
                elif not FFMPEG_EXE_PATH and audio_format_preference != 'mp3':
                    ydl_opts_download['format'] = f'bestaudio[ext={audio_format_preference}]/bestaudio'
                    output_final_extension = None
                else:
                    ydl_opts_download['format'] = 'bestaudio/best'
                    ydl_opts_download['postprocessors'] = [{
                        'key': 'FFmpegExtractAudio',
                        'preferredcodec': audio_format_preference,
                        'preferredquality': '192' if audio_format_preference == 'mp3' else None,
                    }]
                    output_final_extension = audio_format_preference
        else:
            return jsonify({'error': f'Unsupported download type: {download_type}'}), 400

        base_filename_part = f"{sanitized_title_for_file} [{file_label_part}]"
        if output_final_extension:
            output_template = os.path.join(DOWNLOAD_FOLDER, f"{base_filename_part}.{output_final_extension}")
        else:
            output_template = os.path.join(DOWNLOAD_FOLDER, f"{base_filename_part}.%(ext)s")

        ydl_opts_download['outtmpl'] = output_template
        app.logger.info(f"download_video [{request_id}]: Settings: Type={download_type}, yt-dlp Format='{ydl_opts_download.get('format')}', File template='{output_template}'")

        with youtube_dl.YoutubeDL(ydl_opts_download) as ydl:
            download_return_code = ydl.download([video_url])
        app.logger.info(f"download_video [{request_id}]: ydl.download finished with code: {download_return_code}")
        if download_return_code != 0:
            app.logger.error(f"download_video [{request_id}]: yt-dlp returned a non-zero code: {download_return_code}. Check yt-dlp logs.")

        actual_filename_found = None
        time.sleep(1.5)

        expected_ext_for_search = output_final_extension
        if ydl_opts_download.get('postprocessors') and not expected_ext_for_search:
            pass


        if expected_ext_for_search:
            expected_filename = f"{base_filename_part}.{expected_ext_for_search}"
            app.logger.info(f"download_video [{request_id}]: Searching for file (with expected extension '{expected_ext_for_search}'): '{expected_filename}'")
            full_expected_path = os.path.join(DOWNLOAD_FOLDER, expected_filename)
            if os.path.exists(full_expected_path) and os.path.isfile(full_expected_path):
                actual_filename_found = expected_filename
                app.logger.info(f"download_video [{request_id}]: Found exact expected file: '{actual_filename_found}'")

        if not actual_filename_found:
            app.logger.debug(f"download_video [{request_id}]: Exact file not found or extension was dynamic. Searching by '{base_filename_part}*.*'")
            files_in_dir = os.listdir(DOWNLOAD_FOLDER)
            app.logger.debug(f"download_video [{request_id}]: Contents of folder {DOWNLOAD_FOLDER}: {files_in_dir}")
            candidate_files = [f for f in files_in_dir if f.startswith(base_filename_part) and not f.endswith((".part", ".ytdl"))]
            if candidate_files:
                candidate_files.sort(key=lambda name: (len(name), name))
                actual_filename_found = candidate_files[0]
                app.logger.info(f"download_video [{request_id}]: Found file by pattern: '{actual_filename_found}'")

        if not actual_filename_found:
            return jsonify({'error': 'File not found after download/processing.'}), 500

        final_output_path = os.path.join(DOWNLOAD_FOLDER, actual_filename_found)
        if not (os.path.exists(final_output_path) and os.path.isfile(final_output_path) and os.path.getsize(final_output_path) > 0):
            return jsonify({'error': 'Downloaded file is empty or does not exist.'}), 500

        encoded_filename = url_quote(actual_filename_found)
        app.logger.info(f"download_video [{request_id}]: Success. File: {actual_filename_found}, URL-encoded: {encoded_filename}")
        return jsonify({
            'success': True,
            'download_url': f'/download/{encoded_filename}',
            'filename': actual_filename_found
        })

    except youtube_dl.utils.DownloadError as e:
        return jsonify({'error': f'yt-dlp error: {str(e)}'}), 500
    except Exception as e:
        app.logger.error(f"download_video [{request_id}]: General error for {video_url}: {type(e)} - {str(e)}\n{traceback.format_exc()}")
        return jsonify({'error': 'Internal server error during download.'}), 500


@app.route('/download/<path:filename_from_url>', methods=['GET'])
def download_file(filename_from_url):
    request_id = uuid.uuid4().hex[:8]
    app.logger.info(f"download_file [{request_id}]: Received download request. filename_from_url (after Flask decoding): '{filename_from_url}'")
    if not filename_from_url.strip(): return jsonify({'error': 'Filename cannot be empty'}), 400
    if ".." in filename_from_url or filename_from_url.startswith(("/", "\\")): return jsonify({'error': 'Invalid filename'}), 400
    safe_filename = filename_from_url
    app.logger.info(f"download_file [{request_id}]: Using filename for disk search: '{safe_filename}'")
    file_path = os.path.join(DOWNLOAD_FOLDER, safe_filename)
    app.logger.debug(f"download_file [{request_id}]: Full path to file: '{file_path}'")
    if not (os.path.exists(file_path) and os.path.isfile(file_path)):
        app.logger.error(f"download_file [{request_id}]: File '{file_path}' DOES NOT EXIST or is not a file.")
        return jsonify({'error': 'File not found on server'}), 404
    app.logger.info(f"download_file [{request_id}]: File '{safe_filename}' found, sending.")
    return send_from_directory(DOWNLOAD_FOLDER, safe_filename, as_attachment=True)


# --- SERVER STARTUP AND LOGGER CONFIGURATION ---
if __name__ == '__main__':
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
        print(f"File logger will be configured to write to: {os.path.abspath(log_file_path)}")
    except Exception as e_fh: print(f"Failed to configure file logger: {e_fh}. Logging will only be to console.")

    app.logger.removeHandler(default_handler); app.logger.setLevel(log_level)
    app.logger.addHandler(console_handler);
    if file_handler: app.logger.addHandler(file_handler)

    werkzeug_logger = logging.getLogger('werkzeug')
    for h in list(werkzeug_logger.handlers): werkzeug_logger.removeHandler(h)
    werkzeug_logger.setLevel(logging.INFO if not current_debug_mode else logging.DEBUG)
    werkzeug_logger.addHandler(console_handler)
    if file_handler: werkzeug_logger.addHandler(file_handler)
    werkzeug_logger.propagate = False

    yt_dlp_logger = logging.getLogger('yt_dlp')
    for h in list(yt_dlp_logger.handlers): yt_dlp_logger.removeHandler(h)
    yt_dlp_logger.setLevel(logging.WARNING if not current_debug_mode else logging.DEBUG)
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
        log_func(f"Critical error when starting Flask application: {e_run}\n{traceback.format_exc()}")