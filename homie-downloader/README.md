# Homie Downloader - Python Server

Це Python/Flask сервер для завантаження відео з YouTube.

## Налаштування та запуск

1.  **Клонуйте репозиторій (якщо потрібно):**
    ```bash
    git clone <URL_ВАШОГО_РЕПОЗИТОРІЯ>
    cd <шлях_до_папки_сервера> 
    # наприклад, cd homie-downloader/src/server
    ```

2.  **Створіть та активуйте віртуальне оточення:**
3. ЗАЙТИ В ПАПКУ ДЛЯ СЕРВЕРА server_python
    ```bash
    python -m venv .venv
    # Windows PowerShell:
    # .\.venv\Scripts\Activate.ps1
    # Windows CMD:
    # .\.venv\Scripts\activate.bat
    # Linux/macOS:
    # source .venv/bin/activate
    ```

3.  **Встановіть залежності:**
    ```bash
    pip install -r requirements.txt
    ```

4.  **Запустіть Flask-сервер:**
    ```bash
    python app.py 
    # Або flask run, якщо ви налаштували змінні середовища FLASK_APP та FLASK_ENV
    ```
    Сервер буде доступний за адресою `http://127.0.0.1:5000` (або як налаштовано у вашому `app.py`).

## Використання

Сервер надає наступні API ендпоінти:
*   `GET /api/video/preview?url=<youtube_video_url>`: Отримати інформацію про відео.
*   `POST /api/video/download`: Завантажити відео. Тіло запиту: `{ "url": "<youtube_video_url>", "quality": "<бажана_якість>" }`
*   `GET /download/<filename>`: Завантажити збережений файл.

## Папка `downloads`
Завантажені відео тимчасово зберігаються у папці `downloads`, яка створюється автоматично. Ця папка не повинна бути частиною репозиторію.