// --- START OF MODIFIED SearchBar.js ---

import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    FiSearch, FiX, FiDownload, FiThumbsUp, FiEye, FiChevronDown,
    FiExternalLink, FiYoutube, FiMoreHorizontal, FiVideo, FiMusic
} from 'react-icons/fi';
import { FaTiktok, FaSoundcloud, FaVimeoV } from 'react-icons/fa'; // Додано більше іконок
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db, auth } from '../Firebase/firebase';
import styles from './SearchBar.module.css';
import Loader from './Loader';

const SearchBar = () => {
    const [query, setQuery] = useState('');
    const [isFocused, setIsFocused] = useState(false);
    const [videoPreview, setVideoPreview] = useState(null);
    const [isLoadingPreview, setIsLoadingPreview] = useState(false);

    const [downloadType, setDownloadType] = useState('video'); // 'video' or 'audio'
    const [selectedQuality, setSelectedQuality] = useState(''); // Якість для відео або формат для аудіо

    const [showFullDescription, setShowFullDescription] = useState(false);
    const [isDownloading, setIsDownloading] = useState(false);
    const [error, setError] = useState('');
    const descriptionRef = useRef(null);
    const navigate = useNavigate();

    // Клієнтська валідація URL тепер менш сувора.
    // Дозволяємо yt-dlp на сервері вирішувати, чи підтримується URL.
    const isPotentiallyValidUrl = (url) => {
        try {
            new URL(url); // Перевіряє, чи рядок є синтаксично коректним URL
            return url.includes('://'); // Проста перевірка на наявність протоколу
        } catch (_) {
            return false;
        }
    };

    const getUrlPlatform = (url, serverSourceType) => {
        if (serverSourceType && serverSourceType !== 'unknown' && serverSourceType !== 'generic') {
            return serverSourceType;
        }
        // Резервна логіка, якщо сервер не надав чіткий тип
        if (/youtube\.com|youtu\.?be/.test(url)) return 'youtube';
        if (/tiktok\.com/.test(url)) return 'tiktok';
        if (/soundcloud\.com/.test(url)) return 'soundcloud';
        if (/vimeo\.com/.test(url)) return 'vimeo';
        return 'generic'; // Загальний тип, якщо не вдалося визначити
    };

    const detectVideoCategory = (title, description) => {
        if (!title && !description) return 'Other';
        const text = `${title} ${description}`.toLowerCase();
        const categories = { /* ... ваші категорії ... */ };
        for (const [category, keywords] of Object.entries(categories)) {
            if (keywords.some(keyword => text.includes(keyword))) return category;
        }
        return 'Other';
    };

    const saveAction = async (actionData) => {
        // ... (код saveAction залишається без змін) ...
        try {
            const user = auth.currentUser;
            let category = 'Other';
            if (actionData.videoTitle || actionData.videoDescription) {
                category = detectVideoCategory(actionData.videoTitle || '', actionData.videoDescription || '');
            }
            const dataToSave = { // Явно визначаємо об'єкт
                ...actionData,
                category,
                timestamp: serverTimestamp(),
                userId: user?.uid || 'anonymous',
                userEmail: user?.email || null,
            };
            // Видаляємо undefined поля перед збереженням
            Object.keys(dataToSave).forEach(key => dataToSave[key] === undefined && delete dataToSave[key]);
            await addDoc(collection(db, 'userActions'), dataToSave);
        } catch (e) {
            console.error("Помилка збереження дії:", e);
        }
    };

    useEffect(() => {
        if (query.trim() && isPotentiallyValidUrl(query)) { // Перевіряємо, чи це потенційний URL
            const timer = setTimeout(() => {
                fetchVideoPreview(query);
            }, 700); // Трохи збільшена затримка
            return () => clearTimeout(timer);
        } else {
            setVideoPreview(null);
            if (query.trim() === '') {
                setError('');
            }
        }
    }, [query]);

    useEffect(() => { // Оновлення selectedQuality при зміні downloadType або videoPreview
        if (videoPreview) {
            if (downloadType === 'video' && videoPreview.qualities_video && videoPreview.qualities_video.length > 0) {
                setSelectedQuality(videoPreview.qualities_video[0]);
            } else if (downloadType === 'audio' && videoPreview.qualities_audio && videoPreview.qualities_audio.length > 0) {
                setSelectedQuality(videoPreview.qualities_audio[0]);
            } else {
                setSelectedQuality(''); // Якщо немає доступних опцій для поточного типу
            }
        }
    }, [downloadType, videoPreview]);


    const fetchVideoPreview = async (url) => {
        setIsLoadingPreview(true);
        setError('');
        setVideoPreview(null);
        setDownloadType('video'); // Скидаємо до відео за замовчуванням при новому прев'ю
        setSelectedQuality('');

        try {
            const response = await fetch(`/api/video/preview?url=${encodeURIComponent(url)}`);
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || `Помилка сервера: ${response.status}`);
            }

            setVideoPreview(data);
            // `selectedQuality` тепер встановлюється в `useEffect` вище
            setShowFullDescription(false);

            await saveAction({
                type: 'preview', query: url, videoTitle: data.title || '',
                videoDescription: data.description || '', thumbnail: data.thumbnail || '',
                duration: data.duration || '', views: data.views || '', likes: data.likes || '',
                source_type: data.source_type || getUrlPlatform(url, data.source_type)
            });
        } catch (err) {
            console.error("Помилка отримання прев'ю:", err);
            setError(err.message || "Не вдалося отримати інформацію про відео.");
            setVideoPreview(null);
        } finally {
            setIsLoadingPreview(false);
        }
    };

    const handleSearch = async (e) => { // Ця функція може бути спрощена, якщо покладатися на useEffect
        e.preventDefault();
        if (query.trim() && isPotentiallyValidUrl(query)) {
            fetchVideoPreview(query); // Примусово викликаємо, якщо це URL
            await saveAction({ type: 'search', query: query, isVideoUrl: true, source_type: getUrlPlatform(query, videoPreview?.source_type) });
        } else if (query.trim()) {
            setError("Будь ласка, вставте дійсне посилання на медіа або введіть пошуковий запит.");
            console.log("Пошуковий запит (не URL):", query);
            await saveAction({ type: 'search', query: query, isVideoUrl: false });
        }
    };

    const clearInput = () => {
        setQuery('');
        setVideoPreview(null);
        setDownloadType('video');
        setSelectedQuality('');
        setIsDownloading(false);
        setError('');
    };

    const handleDownload = async () => {
        if (!query || !videoPreview) {
            setError("Спочатку отримайте інформацію про контент, вставивши посилання.");
            return;
        }
        if (!selectedQuality) {
            setError(`Будь ласка, виберіть ${downloadType === 'video' ? 'якість відео' : 'формат аудіо'}.`);
            return;
        }

        setIsDownloading(true);
        setError('');
        try {
            await saveAction({
                type: 'download', url: query,
                downloadType: downloadType, // Надсилаємо тип завантаження
                quality: selectedQuality, // Це може бути якість відео або формат аудіо
                videoTitle: videoPreview?.title || '', videoDescription: videoPreview?.description || '',
                thumbnail: videoPreview?.thumbnail || '', duration: videoPreview?.duration || '',
                views: videoPreview?.views || '', likes: videoPreview?.likes || '',
                source_type: videoPreview?.source_type || getUrlPlatform(query, videoPreview?.source_type)
            });

            const response = await fetch('/api/video/download', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    url: query,
                    download_type: downloadType, // Надсилаємо тип
                    quality: selectedQuality    // Надсилаємо вибрану якість/формат
                })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || `Помилка сервера: ${response.status}`);
            }

            if (data.success && data.download_url) {
                const link = document.createElement('a');
                // Використовуємо повний URL до Flask сервера, якщо в розробці
                const flaskServerBaseUrl = process.env.NODE_ENV === 'development' ? 'http://localhost:5000' : '';
                link.href = `${flaskServerBaseUrl}${data.download_url}`;
                link.setAttribute('download', data.filename || `${downloadType}.${selectedQuality.split(' ')[0].toLowerCase()}`); // Більш осмислене ім'я за замовчуванням
                document.body.appendChild(link);
                link.click();

                setTimeout(() => {
                    if(link.parentNode) {
                        document.body.removeChild(link);
                    }
                }, 150);
            } else {
                throw new Error(data.error || "Не вдалося отримати посилання на завантаження.");
            }
        } catch (err) {
            console.error("Помилка завантаження:", err);
            setError(err.message || "Помилка при завантаженні. Спробуйте ще раз.");
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
        setShowFullDescription(!showFullDescription);
    };

    const descriptionStyle = { /* ... (без змін) ... */ };

    const platformIcon = (sourceType) => {
        const normalizedSourceType = sourceType ? sourceType.toLowerCase() : 'generic';
        if (normalizedSourceType.includes('youtube')) return <FiYoutube className={styles.platformOriginIcon} title="YouTube"/>;
        if (normalizedSourceType.includes('tiktok')) return <FaTiktok className={styles.platformOriginIcon} title="TikTok"/>;
        if (normalizedSourceType.includes('soundcloud')) return <FaSoundcloud className={styles.platformOriginIcon} title="SoundCloud"/>;
        if (normalizedSourceType.includes('vimeo')) return <FaVimeoV className={styles.platformOriginIcon} title="Vimeo"/>;
        // Додайте інші платформи за потреби
        return <FiMoreHorizontal className={styles.platformOriginIcon} title="Інша платформа"/>;
    };

    // Поточний список доступних опцій (якостей/форматів)
    const currentOptions = downloadType === 'video'
        ? (videoPreview?.qualities_video || [])
        : (videoPreview?.qualities_audio || []);

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
                        placeholder="Вставте посилання на відео або аудіо..."
                        className={styles.searchInput}
                    />
                    {query && (
                        <button type="button" onClick={clearInput} className={styles.clearButton}>
                            <FiX size={18} />
                        </button>
                    )}
                </div>
            </form>

            {error && <p className={styles.errorMessage}>{error}</p>}
            {isLoadingPreview && <div className={styles.loadingPreview}><Loader /></div>}
            {isDownloading && (
                <div className={styles.downloadLoaderContainer}>
                    <p>Завантаження, будь ласка, зачекайте...</p>
                    <Loader />
                </div>
            )}

            {videoPreview && !isLoadingPreview && (
                <div className={styles.videoPreviewContainer}>
                    <div className={styles.videoPreviewContent}>
                        <div className={styles.videoThumbnail}>
                            {videoPreview.thumbnail ? (
                                <img src={videoPreview.thumbnail} alt={videoPreview.title || "Прев'ю"} />
                            ) : (
                                <div className={styles.noThumbnail}>
                                    {downloadType === 'audio' || videoPreview.source_type?.includes('soundcloud') ? <FiMusic size={50} /> : <FiVideo size={50} />}
                                </div>
                            )}
                            {videoPreview.source_type && (
                                <div className={styles.platformIconContainer}>
                                    {platformIcon(videoPreview.source_type)}
                                </div>
                            )}
                        </div>
                        <div className={styles.videoInfo}>
                            <h3>{videoPreview.title || "Назва не визначена"}</h3>
                            {videoPreview.uploader && <p className={styles.videoUploader}>Автор: {videoPreview.uploader}</p>}
                            <div className={styles.descriptionContainer}>
                                <p className={styles.videoDescription} style={descriptionStyle}>
                                    {videoPreview.description || "Опис відсутній."}
                                </p>
                                {(videoPreview.description?.split('\n').length > 3 || videoPreview.description?.length > 150) && (
                                    <button onClick={toggleDescription} className={styles.toggleDescriptionButton}>
                                        <FiChevronDown size={16} />
                                        <span>{showFullDescription ? 'Згорнути' : 'Розгорнути'}</span>
                                    </button>
                                )}
                            </div>
                            <div className={styles.videoStats}>
                                {videoPreview.likes !== undefined && videoPreview.likes !== "N/A" && <span className={styles.videoStat}><FiThumbsUp /> {videoPreview.likes}</span>}
                                {videoPreview.views !== undefined && videoPreview.views !== "N/A" && <span className={styles.videoStat}><FiEye /> {videoPreview.views}</span>}
                                {videoPreview.duration && videoPreview.duration !== "N/A" && <span className={styles.videoStat}>{videoPreview.duration}</span>}
                            </div>
                        </div>
                    </div>

                    {/* Вибір типу завантаження та якості/формату */}
                    <div className={styles.downloadTypeSelector}>
                        <button
                            className={`${styles.typeButton} ${downloadType === 'video' ? styles.active : ''}`}
                            onClick={() => setDownloadType('video')}
                            disabled={!videoPreview.qualities_video || videoPreview.qualities_video.length === 0}
                        >
                            <FiVideo /> Відео
                        </button>
                        <button
                            className={`${styles.typeButton} ${downloadType === 'audio' ? styles.active : ''}`}
                            onClick={() => setDownloadType('audio')}
                            disabled={!videoPreview.qualities_audio || videoPreview.qualities_audio.length === 0}
                        >
                            <FiMusic /> Аудіо
                        </button>
                    </div>

                    {currentOptions.length > 0 ? (
                        <div className={styles.downloadOptions}>
                            <select
                                value={selectedQuality}
                                onChange={(e) => setSelectedQuality(e.target.value)}
                                className={styles.qualitySelect}
                                disabled={isDownloading}
                            >
                                {currentOptions.map(q => (
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
                            {videoPreview.source_type?.includes('youtube') && downloadType === 'video' && ( // Кнопка "Деталі" тільки для YouTube відео
                                <button onClick={handleViewFullDetails} className={styles.fullDetailsButton} disabled={isDownloading}>
                                    <FiExternalLink size={18} /> <span>Деталі</span>
                                </button>
                            )}
                        </div>
                    ) : (
                        <p className={styles.noQualities}>
                            Для вибраного типу ({downloadType === 'video' ? 'відео' : 'аудіо'}) немає доступних опцій завантаження.
                        </p>
                    )}
                </div>
            )}
        </div>
    );
};

export default SearchBar;

// --- END OF MODIFIED SearchBar.js ---