import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiSearch, FiX, FiDownload, FiThumbsUp, FiEye, FiChevronDown, FiExternalLink } from 'react-icons/fi';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db, auth } from '../Firebase/firebase'; // Переконайтеся, що шлях правильний
import styles from './SearchBar.module.css';
import Loader from './Loader'; // Переконайтеся, що компонент Loader існує і імпортований

// Примітка: Цей код передбачає, що у вашому package.json налаштовано проксі:
// "proxy": "http://localhost:5000" (або URL вашого Flask-сервера).
// Якщо проксі не використовується, потрібно вказувати повні URL для fetch запитів
// (наприклад, `http://localhost:5000/api/video/preview`).

const SearchBar = () => {
    const [query, setQuery] = useState('');
    const [isFocused, setIsFocused] = useState(false);
    const [videoPreview, setVideoPreview] = useState(null);
    const [isLoadingPreview, setIsLoadingPreview] = useState(false);
    const [selectedQuality, setSelectedQuality] = useState('720p'); // За замовчуванням
    const [showFullDescription, setShowFullDescription] = useState(false);
    const [isDownloading, setIsDownloading] = useState(false);
    const [error, setError] = useState(''); // Для відображення помилок користувачу
    const descriptionRef = useRef(null);
    const navigate = useNavigate();

    // Функція для визначення, чи є рядок URL YouTube
    const isValidYoutubeUrl = (url) => {
        const youtubeRegex = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.?be)\/.+$/;
        return youtubeRegex.test(url);
    };

    const detectVideoCategory = (title, description) => {
        // ... (ваш код detectVideoCategory залишається без змін)
        if (!title && !description) return 'Other';
        const text = `${title} ${description}`.toLowerCase();
        const categories = { /* ... ваші категорії ... */ };
        for (const [category, keywords] of Object.entries(categories)) {
            if (keywords.some(keyword => text.includes(keyword))) return category;
        }
        return 'Other';
    };

    const saveAction = async (actionData) => {
        try {
            const user = auth.currentUser;
            let category = 'Other';
            if (actionData.videoTitle || actionData.videoDescription) {
                category = detectVideoCategory(actionData.videoTitle || '', actionData.videoDescription || '');
            }
            const data = Object.entries({
                ...actionData,
                category,
                timestamp: serverTimestamp(),
                userId: user?.uid || 'anonymous',
                userEmail: user?.email || null,
            }).reduce((acc, [key, value]) => (value !== undefined ? { ...acc, [key]: value } : acc), {});
            await addDoc(collection(db, 'userActions'), data);
            // console.log('Дія збережена:', data);
        } catch (e) {
            console.error("Помилка збереження дії:", e);
        }
    };

    useEffect(() => {
        if (isValidYoutubeUrl(query)) {
            const timer = setTimeout(() => { // Дебаунс для запиту прев'ю
                fetchVideoPreview(query);
            }, 500); // Затримка 500 мс перед запитом
            return () => clearTimeout(timer);
        } else {
            setVideoPreview(null);
            setError(''); // Скидаємо помилку, якщо URL вже не валідний
        }
    }, [query]);

    const fetchVideoPreview = async (url) => {
        setIsLoadingPreview(true);
        setError('');
        setVideoPreview(null); // Скидаємо попереднє прев'ю
        try {
            const response = await fetch(`/api/video/preview?url=${encodeURIComponent(url)}`);
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || `Помилка сервера: ${response.status}`);
            }

            setVideoPreview(data);
            if (data.qualities && data.qualities.length > 0) {
                setSelectedQuality(data.qualities[0]); // Встановлюємо найкращу доступну якість
            } else {
                setSelectedQuality('720p'); // або стандартну, якщо список порожній
            }
            setShowFullDescription(false);

            await saveAction({
                type: 'preview', query: url, videoTitle: data.title || '',
                videoDescription: data.description || '', thumbnail: data.thumbnail || '',
                duration: data.duration || '', views: data.views || '', likes: data.likes || ''
            });
        } catch (err) {
            console.error("Помилка отримання прев'ю:", err);
            setError(err.message || "Не вдалося отримати інформацію про відео.");
            setVideoPreview(null);
        } finally {
            setIsLoadingPreview(false);
        }
    };

    const handleSearch = async (e) => {
        e.preventDefault();
        setError('');
        if (query.trim()) {
            if (!isValidYoutubeUrl(query)) {
                // Тут можна реалізувати логіку пошуку на YouTube, якщо це не URL
                setError("Будь ласка, вставте дійсне посилання на YouTube відео для прев'ю та завантаження.");
                // navigate(`/search-results?q=${encodeURIComponent(query)}`); // Приклад навігації на сторінку результатів
                console.log("Пошуковий запит (не URL):", query);
                await saveAction({ type: 'search', query: query, isVideoUrl: false });
                return;
            }
            // Якщо це URL, fetchVideoPreview вже мав викликатися через useEffect
            // Можна додати примусовий виклик, якщо потрібно
            // fetchVideoPreview(query);
            await saveAction({ type: 'search', query: query, isVideoUrl: true });
        }
    };

    const clearInput = () => {
        setQuery('');
        setVideoPreview(null);
        setIsDownloading(false);
        setError('');
    };

    const handleDownload = async () => {
        if (!query || !videoPreview) {
            setError("Спочатку отримайте інформацію про відео, вставивши посилання.");
            return;
        }
        if (!selectedQuality) {
            setError("Будь ласка, виберіть якість для завантаження.");
            return;
        }

        setIsDownloading(true);
        setError('');
        try {
            await saveAction({
                type: 'download', url: query, quality: selectedQuality,
                videoTitle: videoPreview?.title || '', videoDescription: videoPreview?.description || '',
                thumbnail: videoPreview?.thumbnail || '', duration: videoPreview?.duration || '',
                views: videoPreview?.views || '', likes: videoPreview?.likes || ''
            });

            const response = await fetch('/api/video/download', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ url: query, quality: selectedQuality })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || `Помилка сервера: ${response.status}`);
            }

            if (data.success && data.download_url) {
                const link = document.createElement('a');
                // download_url з сервера вже є відносним шляхом, наприклад /download/filename.mp4
                // Якщо використовується проксі, браузер коректно сформує повний URL
                link.href = data.download_url;
                link.setAttribute('download', data.filename || 'video.mp4');
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                // Можна додати повідомлення про успішне початок завантаження
            } else {
                // data.error має містити повідомлення від сервера
                throw new Error(data.error || "Не вдалося отримати посилання на завантаження.");
            }
        } catch (err) {
            console.error("Помилка завантаження:", err);
            setError(err.message || "Помилка при завантаженні відео. Спробуйте ще раз.");
        } finally {
            setIsDownloading(false);
        }
    };

    const handleViewFullDetails = () => {
        if (videoPreview && query) {
            navigate(`/video/details`, { state: { videoData: videoPreview, videoUrl: query } });
        }
    };

    const toggleDescription = () => {
        // Логіка для toggleDescription (можна залишити вашу або спростити)
        // Поточна логіка з ref може бути складною, якщо опис короткий.
        // Розгляньте CSS рішення для обрізки тексту, якщо це можливо.
        setShowFullDescription(!showFullDescription);
    };

    // Стилі для обрізки опису (приклад)
    const descriptionStyle = {
        display: '-webkit-box',
        WebkitBoxOrient: 'vertical',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        WebkitLineClamp: showFullDescription ? 'none' : 3, // Показувати 3 рядки
        maxHeight: showFullDescription ? 'none' : '4.5em', // Приблизно 3 * line-height
        lineHeight: '1.5em' // Встановіть відповідний line-height
    };


    return (
        <div className={styles.searchWrapper}>
            <form
                onSubmit={handleSearch}
                className={`${styles.searchForm} ${isFocused ? styles.focused : ''}`}
            >
                <div className={styles.searchContainer}>
                    <FiSearch className={styles.searchIcon} size={20} />
                    <input
                        type="text"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        onFocus={() => setIsFocused(true)}
                        onBlur={() => setIsFocused(false)}
                        placeholder="Вставте посилання на YouTube відео..."
                        className={styles.searchInput}
                    />
                    {query && (
                        <button type="button" onClick={clearInput} className={styles.clearButton}>
                            <FiX size={18} />
                        </button>
                    )}
                </div>
                {/* Кнопка пошуку може бути не потрібна, якщо прев'ю завантажується автоматично по URL */}
                {/* <button type="submit" className={styles.searchButton} disabled={!query.trim()}>
                    <FiSearch size={18} /> <span>Пошук</span>
                </button> */}
            </form>

            {error && <p className={styles.errorMessage}>{error}</p>}

            {isLoadingPreview && (
                <div className={styles.loadingPreview}>
                    <Loader />
                </div>
            )}

            {isDownloading && ( // Використовуємо isDownloading для відображення завантажувача
                <div className={styles.downloadLoaderContainer}> {/* Окремий контейнер для лоадера завантаження */}
                    <p>Завантаження відео, будь ласка, зачекайте...</p>
                    <Loader /> {/* Використовуємо той самий Loader, або створіть спеціальний DownloadLoader */}
                </div>
            )}

            {videoPreview && !isLoadingPreview && (
                <div className={styles.videoPreviewContainer}>
                    <div className={styles.videoPreviewContent}>
                        <div className={styles.videoThumbnail}>
                            <img src={videoPreview.thumbnail} alt={videoPreview.title || "Прев'ю відео"} />
                        </div>
                        <div className={styles.videoInfo}>
                            <h3>{videoPreview.title}</h3>
                            <div className={styles.descriptionContainer}>
                                <p
                                    ref={descriptionRef}
                                    className={styles.videoDescription}
                                    style={descriptionStyle} // Застосовуємо стилі для обрізки
                                >
                                    {videoPreview.description || "Опис відсутній."}
                                </p>
                                {/* Перевірка, чи текст дійсно довший за N рядків, перш ніж показувати кнопку */}
                                {(videoPreview.description && videoPreview.description.split('\n').length > 3 || videoPreview.description && videoPreview.description.length > 150) && ( // Приблизна умова
                                    <button
                                        onClick={toggleDescription}
                                        className={styles.toggleDescriptionButton}
                                    >
                                        <FiChevronDown size={16} />
                                        <span>{showFullDescription ? 'Згорнути' : 'Розгорнути'}</span>
                                    </button>
                                )}
                            </div>
                            <div className={styles.videoStats}>
                                <span className={styles.videoStat}><FiThumbsUp /> {videoPreview.likes}</span>
                                <span className={styles.videoStat}><FiEye /> {videoPreview.views}</span>
                                <span className={styles.videoStat}>{videoPreview.duration}</span>
                            </div>
                        </div>
                    </div>
                    {videoPreview.qualities && videoPreview.qualities.length > 0 ? (
                        <div className={styles.downloadOptions}>
                            <select
                                value={selectedQuality}
                                onChange={(e) => setSelectedQuality(e.target.value)}
                                className={styles.qualitySelect}
                                disabled={isDownloading}
                            >
                                {videoPreview.qualities.map(q => (
                                    <option key={q} value={q}>{q}</option>
                                ))}
                            </select>
                            <button
                                onClick={handleDownload}
                                className={styles.downloadButton}
                                disabled={isDownloading || !selectedQuality}
                            >
                                {isDownloading ? <Loader size="small" /> : <FiDownload size={18} />}
                                <span>{isDownloading ? 'Завантаження...' : 'Завантажити'}</span>
                            </button>
                            <button
                                onClick={handleViewFullDetails}
                                className={styles.fullDetailsButton}
                                disabled={isDownloading}
                            >
                                <FiExternalLink size={18} />
                                <span>Деталі</span>
                            </button>
                        </div>
                    ) : (
                        <p className={styles.noQualities}>Для цього відео не знайдено доступних якостей для завантаження.</p>
                    )}
                </div>
            )}
        </div>
    );
};

export default SearchBar;