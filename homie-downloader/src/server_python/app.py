import time
import os
import re
import uuid
import traceback
import logging
import atexit # Додано для очищення тимчасових файлів
from dotenv import load_dotenv
load_dotenv()
from urllib.parse import quote as url_quote
from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
import yt_dlp as youtube_dl
import imageio_ffmpeg
import tempfile

app = Flask(__name__)
CORS(app)

# --- CONFIGURATION ---
DOWNLOAD_FOLDER = 'downloads'
FFMPEG_EXE_PATH = None # Automatically determined
TEMP_COOKIE_FILE_PATH = None # Шлях до тимчасового файлу cookie

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

# --- Cookie Handling ---
def cleanup_temp_cookie_file():
    global TEMP_COOKIE_FILE_PATH
    if TEMP_COOKIE_FILE_PATH and os.path.exists(TEMP_COOKIE_FILE_PATH):
        try:
            os.remove(TEMP_COOKIE_FILE_PATH)
            app.logger.info(f"Temporary cookie file {TEMP_COOKIE_FILE_PATH} removed.")
        except Exception as e:
            app.logger.error(f"Error removing temporary cookie file {TEMP_COOKIE_FILE_PATH}: {e}")
        TEMP_COOKIE_FILE_PATH = None

def setup_cookies_from_env():
    global TEMP_COOKIE_FILE_PATH
    cookies_content = os.environ.get('YOUTUBE_COOKIES_CONTENT')
    if cookies_content:
        try:
            fd, path = tempfile.mkstemp(suffix='.txt', prefix='yt_cookies_', text=True) # text=True for string write
            with os.fdopen(fd, 'w', encoding='utf-8') as tmp:
                tmp.write(cookies_content)
            TEMP_COOKIE_FILE_PATH = path
            atexit.register(cleanup_temp_cookie_file) # Реєструємо функцію очищення
            app.logger.info(f"Successfully created temporary cookie file at: {TEMP_COOKIE_FILE_PATH}. It will be cleaned up on exit.")
        except Exception as e:
            app.logger.error(f"Failed to create temporary cookie file from environment variable: {e}")
            TEMP_COOKIE_FILE_PATH = None # Ensure it's None if creation failed
    else:
        app.logger.warning("YOUTUBE_COOKIES_CONTENT environment variable not set. Proceeding without cookies. Access to private/restricted content will fail.")
        TEMP_COOKIE_FILE_PATH = None # Ensure it's None

setup_cookies_from_env()
# --- End Cookie Handling ---


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
            'playlist_items': '1', # Process only the first item if it's a playlist
            'retries': 5,
            'sleep_interval': 5,
            'max_sleep_interval': 30,
            'youtube_include_dash_manifest': False, # Often helps with some YouTube issues
        }

        if TEMP_COOKIE_FILE_PATH and os.path.exists(TEMP_COOKIE_FILE_PATH):
            ydl_opts['cookiefile'] = TEMP_COOKIE_FILE_PATH
            app.logger.info(f"get_video_info [{request_id_info}]: Using temporary cookie file: {TEMP_COOKIE_FILE_PATH}")
        else:
            app.logger.info(f"get_video_info [{request_id_info}]: No cookie file configured or available. Proceeding without cookies.")

        with youtube_dl.YoutubeDL(ydl_opts) as ydl:
            info = ydl.extract_info(url, download=False)

        if not info:
            app.logger.warning(f"get_video_info [{request_id_info}]: yt-dlp returned empty info for {url}")
            return None

        # If it's a playlist, take the first entry (due to 'playlist_items': '1')
        if '_type' in info and info['_type'] == 'playlist' and info.get('entries'):
            if info['entries']: # Ensure entries list is not empty
                info = info['entries'][0]
                if not info: # Check if the first entry itself is None/empty
                    app.logger.warning(f"get_video_info [{request_id_info}]: First playlist item is empty for {url}")
                    return None
            else:
                app.logger.warning(f"get_video_info [{request_id_info}]: Playlist detected but 'entries' list is empty for {url}")
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
            pass # Default handling for YouTube is usually fine
        elif 'tiktok' in extractor_key:
            video_info_data['title'] = info.get('title', info.get('description', 'TikTok Video'))
            if not video_info_data['title'] and video_info_data['description']:
                video_info_data['title'] = video_info_data['description'].split('\n')[0][:70]
        elif 'soundcloud' in extractor_key:
            video_info_data['title'] = info.get('title', info.get('track', 'Audio Track'))
            video_info_data['uploader'] = info.get('uploader', info.get('user', {}).get('username'))

        formats = info.get('formats', [])
        if not formats:
            app.logger.warning(f"get_video_info [{request_id_info}]: No formats found for {url} (type: {extractor_key}).")

        available_video_qualities_set = set()
        if 'youtube' in extractor_key:
            allowed_qualities_preview = ['144p', '240p', '360p', '480p', '720p', '1080p', '1440p', '2160p']
            for fmt in formats:
                if fmt.get('vcodec') != 'none' and fmt.get('height'):
                    quality_str = f"{fmt['height']}p"
                    if quality_str in allowed_qualities_preview:
                        available_video_qualities_set.add(quality_str)
            video_info_data['qualities_video'] = sorted(list(available_video_qualities_set), key=lambda q_str: int(q_str[:-1]), reverse=True)
        else: # For non-YouTube sources
            has_any_video = any(f.get('vcodec') != 'none' and f.get('ext') == 'mp4' for f in formats)
            if has_any_video:
                video_info_data['qualities_video'] = ['Best Video (MP4)'] # Generic option
            elif FFMPEG_EXE_PATH and any(f.get('vcodec') != 'none' and f.get('acodec') == 'none' for f in formats): # Video-only stream
                video_info_data['qualities_video'] = ['Best Video (requires merge)']

        available_audio_qualities_set = set()
        # Check for audio-only streams
        has_any_audio_stream = any(f.get('acodec') != 'none' and f.get('vcodec') == 'none' for f in formats)
        if has_any_audio_stream:
            available_audio_qualities_set.add("Best audio (M4A/Opus)") # yt-dlp default best audio
            if FFMPEG_EXE_PATH:
                available_audio_qualities_set.add("Best audio (MP3)")
        # Check for muxed streams (video+audio) from which audio can be extracted
        elif any(f.get('acodec') != 'none' and f.get('vcodec') != 'none' for f in formats):
            available_audio_qualities_set.add("Extract Audio (M4A/Opus)")
            if FFMPEG_EXE_PATH:
                available_audio_qualities_set.add("Extract Audio (MP3)")

        video_info_data['qualities_audio'] = sorted(list(available_audio_qualities_set))

        if not video_info_data['qualities_video'] and not video_info_data['qualities_audio']:
            app.logger.warning(f"get_video_info [{request_id_info}]: No downloadable video or audio qualities found for {url} (type: {extractor_key}).")

        app.logger.info(f"get_video_info [{request_id_info}]: Info for {url} (type: {extractor_key}): Video qualities: {video_info_data['qualities_video']}, Audio qualities: {video_info_data['qualities_audio']}")
        return video_info_data

    except youtube_dl.utils.DownloadError as e:
        err_msg_lower = str(e).lower()
        app.logger.error(f"get_video_info [{request_id_info}]: yt-dlp error (DownloadError) for {url}: {type(e)} - {str(e)}")
        if "unsupported url" in err_msg_lower or "not a valid url" in err_msg_lower or "no supported media" in err_msg_lower or "valid url" in err_msg_lower:
            return {'error_type': 'InvalidURL', 'message': 'The provided URL is unsupported, invalid, or does not contain media.'}

        if any(keyword in err_msg_lower for keyword in ["this video is unavailable", "private video", "video is private", "age restricted", "sign in to confirm", "authentication required"]):
            base_message = 'This video/audio is unavailable (private, deleted, age-restricted), or requires authentication (e.g., to confirm you are not a bot).'
            cookies_were_configured = bool(TEMP_COOKIE_FILE_PATH and os.path.exists(TEMP_COOKIE_FILE_PATH)) # Check if cookie file was actively used

            if not cookies_were_configured and not os.environ.get('YOUTUBE_COOKIES_CONTENT'):
                # Cookies were never set up via ENV var
                full_message = f"{base_message} Cookies were not configured (YOUTUBE_COOKIES_CONTENT environment variable not set). To access such content, valid YouTube cookies might be required."
            elif not cookies_were_configured and os.environ.get('YOUTUBE_COOKIES_CONTENT'):
                # Cookies ENV var was set, but file creation failed
                full_message = f"{base_message} Cookies were provided via YOUTUBE_COOKIES_CONTENT, but the temporary cookie file could not be created or used. Check server logs for errors."
            else: # Cookies were configured and file was presumably used
                full_message = f"{base_message} Please ensure your YouTube cookies (provided via YOUTUBE_COOKIES_CONTENT) are up-to-date, correctly formatted, and from a logged-in account with access to this specific content."
            return {'error_type': 'VideoUnavailable', 'message': full_message}

        if "http error 429" in err_msg_lower:
            return {'error_type': 'TooManyRequests', 'message': 'Too many requests were made. Please try again later. If this persists, valid cookies might help.'}

        # Generic fallback for other DownloadErrors
        app.logger.warning(f"get_video_info [{request_id_info}]: Unhandled DownloadError for {url}: {str(e)}. Returning generic error.")
        return {'error_type': 'DownloadFailed', 'message': f'Failed to retrieve video information. The content might be unavailable or there was a network issue. Details: {str(e)}'}

    except Exception as e:
        app.logger.error(f"get_video_info [{request_id_info}]: General error processing {url}: {type(e)} - {str(e)}\n{traceback.format_exc()}")
        return {'error_type': 'ServerError', 'message': 'An unexpected error occurred on the server while fetching video info.'} # Return dict for consistent error handling

# --- API ROUTES ---
@app.route('/api/video/preview', methods=['GET'])
def video_preview():
    video_url = request.args.get('url')
    if not video_url: return jsonify({'error': 'URL not provided'}), 400

    video_info_data = get_video_info(video_url) # This now returns a dict on error too

    if not video_info_data: # Should ideally not happen if get_video_info always returns a dict
        return jsonify({'error': 'Failed to get information. Unknown error.'}), 500

    if video_info_data.get('error_type'):
        error_type = video_info_data.get('error_type')
        status_code = 400
        if error_type == 'InvalidURL': status_code = 400
        elif error_type == 'VideoUnavailable': status_code = 403
        elif error_type == 'TooManyRequests': status_code = 429
        elif error_type in ['DownloadFailed', 'ServerError']: status_code = 500
        else: status_code = 500 # Default for unmapped error_type
        return jsonify({'error': video_info_data['message']}), status_code

    # Format views, likes, duration if present
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
    else: video_info_data['duration'] = "N/A" if video_info_data.get('duration') == 0 else "N/A"


    app.logger.info(f"video_preview: Successfully returned information for {video_url}")
    return jsonify(video_info_data)


@app.route('/api/video/download', methods=['POST'])
def download_video():
    data = request.json
    video_url = data.get('url')
    download_type = data.get('download_type', 'video').lower()
    quality_or_format_req = data.get('quality', 'best') # For video, this is "720p", "best"; for audio "mp3", "m4a"
    request_id = uuid.uuid4().hex[:8]

    app.logger.info(f"download_video [{request_id}]: Request: URL={video_url}, Type={download_type}, Quality/Format={quality_or_format_req}, FFmpeg={FFMPEG_EXE_PATH or 'Not Defined'}")

    if not video_url: return jsonify({'error': 'URL not provided'}), 400

    try:
        # Get basic info first to sanitize title and check availability
        info_opts_for_meta = {
            'skip_download': True,
            'logger': app.logger,
            'no_warnings': True, # Less verbose for meta-info
            'retries': 5, 'sleep_interval': 5, 'max_sleep_interval': 30,
            'youtube_include_dash_manifest': False,
            'playlist_items': '1', # Get info for the first item if it's a playlist
        }
        if TEMP_COOKIE_FILE_PATH and os.path.exists(TEMP_COOKIE_FILE_PATH):
            info_opts_for_meta['cookiefile'] = TEMP_COOKIE_FILE_PATH
            app.logger.info(f"download_video [{request_id}]: Using temporary cookie file for meta-info: {TEMP_COOKIE_FILE_PATH}")
        else:
            app.logger.info(f"download_video [{request_id}]: No cookie file for meta-info. Proceeding without cookies.")

        with youtube_dl.YoutubeDL(info_opts_for_meta) as ydl_meta:
            info = ydl_meta.extract_info(video_url, download=False)

        if not info:
            app.logger.error(f"download_video [{request_id}]: Failed to get meta-info for URL: {video_url}")
            return jsonify({'error': 'Failed to get initial information about the URL. It might be invalid or unavailable.'}), 500

        if '_type' in info and info['_type'] == 'playlist' and info.get('entries'):
            if info['entries']:
                info = info['entries'][0]
                if not info:
                    app.logger.error(f"download_video [{request_id}]: Meta-info for first playlist item is empty for URL: {video_url}")
                    return jsonify({'error': 'Failed to get information for the first item in the playlist.'}), 500
            else:
                app.logger.error(f"download_video [{request_id}]: Meta-info: Playlist detected but 'entries' list is empty for URL: {video_url}")
                return jsonify({'error': 'Playlist detected, but no items found in it.'}), 404


        source_type = info.get('extractor_key', '').lower() or get_url_type(video_url)
        raw_title = info.get('title', info.get('track', 'downloaded_content'))
        if not raw_title and info.get('description'): raw_title = info.get('description').split('\n')[0][:70] # Fallback for TikTok-like descriptions

        sanitized_title_for_file = re.sub(r'[\\/*?:"<>|\x00-\x1f\x7f]', "", raw_title).strip()
        sanitized_title_for_file = sanitized_title_for_file.replace('#', '_H_').replace('%', '_P_') # Basic replacements
        max_len = 50 # Max length for the title part of filename
        if not sanitized_title_for_file: sanitized_title_for_file = "content"
        elif len(sanitized_title_for_file) > max_len: sanitized_title_for_file = sanitized_title_for_file[:max_len].strip()

        app.logger.debug(f"download_video [{request_id}]: Sanitized title: '{sanitized_title_for_file}' (Source: {source_type})")

        # --- Prepare Download Options ---
        ydl_opts_download = {
            'logger': app.logger,
            'nocheckcertificate': True,
            'noplaylist': True, # We already handled playlist item selection
            'ffmpeg_location': FFMPEG_EXE_PATH,
            'quiet': False, 'no_warnings': False, 'verbose': app.debug,
            'format_sort_force': True,
            'prefer_free_formats': True,
            'retries': 5, 'sleep_interval': 5, 'max_sleep_interval': 30,
            'youtube_include_dash_manifest': False,
        }

        if TEMP_COOKIE_FILE_PATH and os.path.exists(TEMP_COOKIE_FILE_PATH):
            ydl_opts_download['cookiefile'] = TEMP_COOKIE_FILE_PATH
            app.logger.info(f"download_video [{request_id}]: Using temporary cookie file for download: {TEMP_COOKIE_FILE_PATH}")
        else:
            app.logger.info(f"download_video [{request_id}]: No cookie file for download. Proceeding without cookies.")


        file_label_part = "" # e.g., "720p", "mp3"
        output_final_extension = None # mp4, mp3, etc. Determined by choices.

        if download_type == 'video':
            file_label_part = quality_or_format_req if quality_or_format_req != 'best' else 'best_video'
            output_final_extension = 'mp4' # Desired final container

            if 'youtube' in source_type and quality_or_format_req != 'best' and 'p' in quality_or_format_req:
                height_filter = quality_or_format_req[:-1] # e.g., "720" from "720p"
                if FFMPEG_EXE_PATH:
                    # Prefer separate streams for better quality, merge to MP4
                    ydl_opts_download['format'] = f'bestvideo[height<={height_filter}][ext=mp4]+bestaudio[ext=m4a]/bestvideo[height<={height_filter}]+bestaudio/best[height<={height_filter}]'
                else:
                    # No FFmpeg, try to get a pre-merged MP4 if possible
                    ydl_opts_download['format'] = f"best[height<={height_filter}][ext=mp4][vcodec!=none][acodec!=none]/best[height<={height_filter}][vcodec!=none][acodec!=none]"
                    output_final_extension = None # Extension will be from yt-dlp
            else: # Best quality or non-YouTube
                if FFMPEG_EXE_PATH:
                    ydl_opts_download['format'] = 'bestvideo[ext=mp4]+bestaudio[ext=m4a]/bestvideo+bestaudio/best'
                else:
                    ydl_opts_download['format'] = 'best[ext=mp4][vcodec!=none][acodec!=none]/best[vcodec!=none][acodec!=none]'
                    output_final_extension = None

            if FFMPEG_EXE_PATH and output_final_extension == 'mp4': # Ensure merge format if we specify mp4
                ydl_opts_download['merge_output_format'] = 'mp4'

        elif download_type == 'audio':
            audio_format_preference = quality_or_format_req.lower() # e.g., mp3, m4a, best
            file_label_part = audio_format_preference # Will be 'mp3', 'm4a', or 'best_audio'

            if audio_format_preference not in ['mp3', 'm4a', 'opus', 'ogg', 'wav', 'best']:
                app.logger.warning(f"download_video [{request_id}]: Invalid audio format '{audio_format_preference}', defaulting to 'm4a'.")
                audio_format_preference = 'm4a' # Default if invalid
                file_label_part = 'm4a'

            if audio_format_preference == 'best':
                ydl_opts_download['format'] = 'bestaudio/best' # Let yt-dlp pick best audio native format
                # If FFmpeg is available, we can convert this best audio to a common format like M4A or MP3
                if FFMPEG_EXE_PATH:
                    # Prefer M4A as a good quality default if 'best' is chosen and FFmpeg is there for conversion
                    # You could make this smarter, e.g., prefer MP3 if explicitly selected in a 'best_mp3' quality_or_format_req
                    ydl_opts_download['postprocessors'] = [{
                        'key': 'FFmpegExtractAudio',
                        'preferredcodec': 'm4a', # Default to m4a for "best" when re-encoding
                    }]
                    output_final_extension = 'm4a'
                    file_label_part = 'best_audio_m4a' # More descriptive
                else: # No FFmpeg, can't convert, extension will be from yt-dlp
                    output_final_extension = None
                    file_label_part = 'best_audio_native'
            else: # Specific audio format requested (mp3, m4a, etc.)
                if not FFMPEG_EXE_PATH and audio_format_preference == 'mp3':
                    app.logger.warning(f"download_video [{request_id}]: MP3 requested, but FFmpeg is unavailable. Attempting to download best available audio format directly.")
                    ydl_opts_download['format'] = 'bestaudio[ext=m4a]/bestaudio[ext=opus]/bestaudio' # Try for m4a or opus first
                    output_final_extension = None # Extension will be from yt-dlp
                    file_label_part = f'best_audio_no_ffmpeg'
                elif not FFMPEG_EXE_PATH: # Other formats like m4a, opus, ogg, wav without FFmpeg
                    ydl_opts_download['format'] = f'bestaudio[ext={audio_format_preference}]/bestaudio'
                    output_final_extension = None # Extension from yt-dlp
                else: # FFmpeg is available for conversion
                    ydl_opts_download['format'] = 'bestaudio/best' # Download best, then convert
                    ydl_opts_download['postprocessors'] = [{
                        'key': 'FFmpegExtractAudio',
                        'preferredcodec': audio_format_preference,
                        'preferredquality': '192' if audio_format_preference == 'mp3' else None, # For MP3, set a quality
                    }]
                    output_final_extension = audio_format_preference
        else:
            return jsonify({'error': f'Unsupported download type: {download_type}'}), 400

        # --- Define Output Template and Download ---
        base_filename_part = f"{sanitized_title_for_file} [{file_label_part}]"
        if output_final_extension: # If we know the final extension (e.g. after ffmpeg conversion)
            output_template = os.path.join(DOWNLOAD_FOLDER, f"{base_filename_part}.{output_final_extension}")
        else: # If extension is determined by yt-dlp directly (no ffmpeg or direct format download)
            output_template = os.path.join(DOWNLOAD_FOLDER, f"{base_filename_part}.%(ext)s")

        ydl_opts_download['outtmpl'] = output_template
        app.logger.info(f"download_video [{request_id}]: Settings: Type={download_type}, yt-dlp Format='{ydl_opts_download.get('format')}', File template='{output_template}'")

        with youtube_dl.YoutubeDL(ydl_opts_download) as ydl:
            download_result = ydl.extract_info(video_url, download=True) # Using extract_info with download=True
            # ydl.download([video_url]) would also work but extract_info gives more context if needed

        # extract_info returns a dict, ydl.download returns an exit code.
        # We need to find the downloaded file based on outtmpl.
        # The 'filepath' key might be in download_result if successful and not a playlist.
        # For playlists (even if we download one item), it's more complex.
        # Robust way is to search based on the template.

        app.logger.info(f"download_video [{request_id}]: yt-dlp processing finished.")

        # --- Find the downloaded file ---
        actual_filename_found = None
        # Give a little time for file system to catch up, especially if FFmpeg was involved
        time.sleep(1.5)

        # Strategy 1: If we forced an extension and it's known
        if output_final_extension:
            expected_filename = f"{base_filename_part}.{output_final_extension}"
            full_expected_path = os.path.join(DOWNLOAD_FOLDER, expected_filename)
            app.logger.info(f"download_video [{request_id}]: Searching for specific file: '{full_expected_path}'")
            if os.path.exists(full_expected_path) and os.path.isfile(full_expected_path):
                actual_filename_found = expected_filename
                app.logger.info(f"download_video [{request_id}]: Found exact expected file: '{actual_filename_found}'")

        # Strategy 2: If extension was dynamic (%(ext)s) or specific file not found
        if not actual_filename_found:
            app.logger.info(f"download_video [{request_id}]: Exact file not found or extension was dynamic. Searching by pattern '{base_filename_part}.*'")
            files_in_dir = os.listdir(DOWNLOAD_FOLDER)
            candidate_files = [f for f in files_in_dir if f.startswith(base_filename_part) and not f.endswith((".part", ".ytdl"))]
            if candidate_files:
                # Sort by modification time (newest first) or length, then name, to pick the most likely one
                candidate_files.sort(key=lambda name: os.path.getmtime(os.path.join(DOWNLOAD_FOLDER, name)), reverse=True)
                actual_filename_found = candidate_files[0]
                app.logger.info(f"download_video [{request_id}]: Found file by pattern: '{actual_filename_found}'")

        if not actual_filename_found:
            app.logger.error(f"download_video [{request_id}]: File not found in '{DOWNLOAD_FOLDER}' matching base '{base_filename_part}' after download attempt.")
            return jsonify({'error': 'File not found after download/processing. yt-dlp might have failed silently or output a different filename.'}), 500

        final_output_path = os.path.join(DOWNLOAD_FOLDER, actual_filename_found)
        if not (os.path.exists(final_output_path) and os.path.isfile(final_output_path) and os.path.getsize(final_output_path) > 0):
            app.logger.error(f"download_video [{request_id}]: Downloaded file '{final_output_path}' is empty or does not exist.")
            return jsonify({'error': 'Downloaded file is empty or does not exist.'}), 500

        encoded_filename = url_quote(actual_filename_found)
        app.logger.info(f"download_video [{request_id}]: Success. File: {actual_filename_found}, URL-encoded: {encoded_filename}")
        return jsonify({
            'success': True,
            'download_url': f'/download/{encoded_filename}',
            'filename': actual_filename_found
        })

    except youtube_dl.utils.DownloadError as e:
        err_msg_lower = str(e).lower()
        app.logger.error(f"download_video [{request_id}]: yt-dlp error (DownloadError) during download for {video_url}: {type(e)} - {str(e)}")

        if "unsupported url" in err_msg_lower or "not a valid url" in err_msg_lower or "no supported media" in err_msg_lower or "valid url" in err_msg_lower:
            return jsonify({'error': 'The provided URL is unsupported, invalid, or does not contain media.'}), 400

        if any(keyword in err_msg_lower for keyword in ["this video is unavailable", "private video", "video is private", "age restricted", "sign in to confirm", "authentication required"]):
            base_message = 'This video/audio is unavailable (private, deleted, age-restricted), or requires authentication (e.g., to confirm you are not a bot).'
            cookies_were_configured = bool(TEMP_COOKIE_FILE_PATH and os.path.exists(TEMP_COOKIE_FILE_PATH))

            if not cookies_were_configured and not os.environ.get('YOUTUBE_COOKIES_CONTENT'):
                full_message = f"{base_message} Cookies were not configured. To access such content, valid YouTube cookies might be required."
            elif not cookies_were_configured and os.environ.get('YOUTUBE_COOKIES_CONTENT'):
                full_message = f"{base_message} Cookies were provided, but the temporary cookie file could not be used. Check server logs."
            else:
                full_message = f"{base_message} Please ensure your YouTube cookies are up-to-date, correctly formatted, and from an account with access."
            return jsonify({'error': full_message}), 403

        if "http error 429" in err_msg_lower:
            return jsonify({'error': 'Too many requests were made. Please try again later. Valid cookies might help.'}), 429

        return jsonify({'error': f'yt-dlp download error: {str(e)}'}), 500 # Fallback for other DownloadErrors
    except Exception as e:
        app.logger.error(f"download_video [{request_id}]: General error during download for {video_url}: {type(e)} - {str(e)}\n{traceback.format_exc()}")
        return jsonify({'error': 'Internal server error during download process.'}), 500


@app.route('/download/<path:filename_from_url>', methods=['GET'])
def download_file(filename_from_url):
    request_id = uuid.uuid4().hex[:8]
    app.logger.info(f"download_file [{request_id}]: Received download request. filename_from_url (after Flask decoding): '{filename_from_url}'")

    # Basic security: prevent path traversal and empty filenames
    if not filename_from_url or ".." in filename_from_url or filename_from_url.startswith(("/", "\\")):
        app.logger.warning(f"download_file [{request_id}]: Invalid filename requested: '{filename_from_url}'")
        return jsonify({'error': 'Invalid or malicious filename provided'}), 400

    # filename_from_url is already URL-decoded by Flask.
    # We assume it's the same as `actual_filename_found` which was sanitized and URL-encoded before being sent to client.
    safe_filename = filename_from_url

    app.logger.info(f"download_file [{request_id}]: Using filename for disk search: '{safe_filename}'")
    file_path = os.path.join(DOWNLOAD_FOLDER, safe_filename)
    app.logger.debug(f"download_file [{request_id}]: Full path to file: '{file_path}' (normalized: '{os.path.normpath(file_path)}')")

    # Double check that the path is still within DOWNLOAD_FOLDER after normalization
    if not os.path.normpath(file_path).startswith(os.path.normpath(DOWNLOAD_FOLDER) + os.sep):
        app.logger.error(f"download_file [{request_id}]: Path traversal attempt detected or filename leads outside download folder: '{file_path}'")
        return jsonify({'error': 'Access denied to the requested file.'}), 403

    if not (os.path.exists(file_path) and os.path.isfile(file_path)):
        app.logger.error(f"download_file [{request_id}]: File '{file_path}' DOES NOT EXIST or is not a file.")
        return jsonify({'error': 'File not found on server. It might have been deleted or the link is incorrect.'}), 404

    app.logger.info(f"download_file [{request_id}]: File '{safe_filename}' found, sending.")
    return send_from_directory(DOWNLOAD_FOLDER, safe_filename, as_attachment=True)


# --- SERVER STARTUP AND LOGGER CONFIGURATION ---
if __name__ == '__main__':
    # Ensure logging is configured before app.logger is used anywhere else if running directly
    # (Flask's default logger might be used before this if app.logger calls happen at import time globally)

    flask_debug_env = os.environ.get("FLASK_DEBUG")
    current_debug_mode = flask_debug_env == "1" if flask_debug_env is not None else False # Default to False if not set

    log_level_name_env = os.environ.get("FLASK_LOG_LEVEL", "INFO").upper()
    # Ensure a valid log level, default to INFO
    log_level = getattr(logging, log_level_name_env, logging.INFO)
    if not isinstance(log_level, int): # Check if getattr returned a valid level
        print(f"Warning: Invalid FLASK_LOG_LEVEL '{log_level_name_env}'. Defaulting to INFO.")
        log_level = logging.INFO

    # Override to DEBUG if Flask debug mode is on and current level is INFO (common case)
    if current_debug_mode and log_level == logging.INFO:
        log_level = logging.DEBUG

    formatter = logging.Formatter(
        '%(asctime)s - %(name)s - %(levelname)s - [%(process)d:%(threadName)s] - %(module)s.%(funcName)s:%(lineno)d - %(message)s'
    )

    # Configure app.logger
    app.logger.removeHandler(logging.getLogger('flask.app').handlers[0] if logging.getLogger('flask.app').handlers else None) # flask.app is new name
    app.logger.setLevel(log_level)

    console_handler = logging.StreamHandler()
    console_handler.setLevel(log_level)
    console_handler.setFormatter(formatter)
    app.logger.addHandler(console_handler)

    file_handler = None
    try:
        log_file_path = 'flask_app.log'
        file_handler = logging.FileHandler(log_file_path, encoding='utf-8')
        file_handler.setLevel(log_level)
        file_handler.setFormatter(formatter)
        app.logger.addHandler(file_handler)
        print(f"File logger configured to write to: {os.path.abspath(log_file_path)}")
    except Exception as e_fh:
        print(f"Failed to configure file logger: {e_fh}. Logging will only be to console.")

    # Configure Werkzeug logger (HTTP requests)
    werkzeug_logger = logging.getLogger('werkzeug')
    for h in list(werkzeug_logger.handlers): werkzeug_logger.removeHandler(h) # Clear existing handlers
    werkzeug_logger.setLevel(logging.INFO if not current_debug_mode else logging.DEBUG) # Less verbose for prod
    werkzeug_logger.addHandler(console_handler)
    if file_handler: werkzeug_logger.addHandler(file_handler)
    werkzeug_logger.propagate = False

    # Configure yt-dlp logger
    yt_dlp_logger_instance = logging.getLogger('yt_dlp')
    for h in list(yt_dlp_logger_instance.handlers): yt_dlp_logger_instance.removeHandler(h)
    yt_dlp_logger_instance.setLevel(logging.WARNING if not current_debug_mode else logging.DEBUG) # Usually WARNING is enough
    yt_dlp_logger_instance.addHandler(console_handler)
    if file_handler: yt_dlp_logger_instance.addHandler(file_handler)
    yt_dlp_logger_instance.propagate = False

    # Configure imageio_ffmpeg logger
    imageio_logger = logging.getLogger('imageio_ffmpeg')
    for h in list(imageio_logger.handlers): imageio_logger.removeHandler(h)
    imageio_logger.setLevel(log_level) # Same as app logger
    imageio_logger.addHandler(console_handler)
    if file_handler: imageio_logger.addHandler(file_handler)
    imageio_logger.propagate = False

    app.debug = current_debug_mode
    app.logger.info(f"Flask app starting... Debug mode is {'ON' if app.debug else 'OFF'}. Effective log level for app: {logging.getLevelName(app.logger.getEffectiveLevel())}")

    try:
        port = int(os.environ.get("PORT", 5000))
        # use_reloader should be False if you are debugging with an external debugger like in VS Code
        # For production, it's typically False (managed by gunicorn/supervisor etc.)
        # For local dev without external debugger, app.debug often implies use_reloader=True
        use_reloader_flag = app.debug
        app.run(host='0.0.0.0', port=port, debug=app.debug, use_reloader=use_reloader_flag)
    except Exception as e_run:
        # Use app.logger if available, otherwise print
        log_func = app.logger.critical if app.logger.hasHandlers() and app.logger.handlers else print
        log_func(f"Critical error when starting Flask application: {e_run}\n{traceback.format_exc()}")
    finally:
        # This will be called when app.run() exits, including on Ctrl+C if not using reloader
        # If using reloader, atexit handlers run for each child process.
        # cleanup_temp_cookie_file() # atexit should handle this
        pass