import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiSearch, FiX, FiDownload, FiThumbsUp, FiEye, FiChevronDown, FiExternalLink } from 'react-icons/fi';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db, auth } from '../Firebase/firebase';
import styles from './SearchBar.module.css';

const SearchBar = () => {
    const [query, setQuery] = useState('');
    const [isFocused, setIsFocused] = useState(false);
    const [videoPreview, setVideoPreview] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [selectedQuality, setSelectedQuality] = useState('720p');
    const [showFullDescription, setShowFullDescription] = useState(false);
    const descriptionRef = useRef(null);
    const navigate = useNavigate();

    // Функція для збереження пошукового запиту
    const saveSearch = async (searchTerm) => {
        if (!searchTerm.trim()) return;

        try {
            const user = auth.currentUser;
            const searchData = {
                query: searchTerm,
                timestamp: serverTimestamp(),
                type: 'search',
                userId: user?.uid || 'anonymous',
                userEmail: user?.email || null,
                isVideoUrl: searchTerm.includes('youtube.com') || searchTerm.includes('youtu.be')
            };

            await addDoc(collection(db, 'searchHistory'), searchData);
            console.log('Пошук збережено:', searchData);
        } catch (error) {
            console.error("Помилка збереження пошуку:", error);
        }
    };

    // Функція для збереження завантаження
    const saveDownload = async (url, quality) => {
        if (!url) return;

        try {
            const user = auth.currentUser;
            const downloadData = {
                url: url,
                quality: quality,
                timestamp: serverTimestamp(),
                type: 'download',
                userId: user?.uid || 'anonymous',
                userEmail: user?.email || null,
                videoTitle: videoPreview?.title || '',
                videoId: videoPreview?.id || ''
            };

            await addDoc(collection(db, 'downloadHistory'), downloadData);
            console.log('Завантаження збережено:', downloadData);
        } catch (error) {
            console.error("Помилка збереження завантаження:", error);
        }
    };

    useEffect(() => {
        const isVideoUrl = query.includes('youtube.com') || query.includes('youtu.be');
        if (isVideoUrl) {
            fetchVideoPreview(query);
        } else {
            setVideoPreview(null);
        }
    }, [query]);

    const fetchVideoPreview = async (url) => {
        setIsLoading(true);
        try {
            const response = await fetch(`/api/video/preview?url=${encodeURIComponent(url)}`);
            if (!response.ok) throw new Error("Не вдалося отримати прев'ю");

            const data = await response.json();
            setVideoPreview(data);
            setShowFullDescription(false);

            // Зберігаємо факт перегляду прев'ю як пошуковий запит
            await saveSearch(url);
        } catch (error) {
            console.error("Помилка отримання прев'ю:", error);
            setVideoPreview(null);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSearch = async (e) => {
        e.preventDefault();
        if (query.trim()) {
            await saveSearch(query);
            console.log("Пошук виконано:", query);
        }
    };

    const clearInput = () => {
        setQuery('');
        setVideoPreview(null);
    };

    const handleDownload = async () => {
        if (!query) return;

        try {
            // Спочатку зберігаємо інформацію про завантаження
            await saveDownload(query, selectedQuality);

            // Потім виконуємо завантаження
            const response = await fetch('/api/video/download', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    url: query,
                    quality: selectedQuality
                })
            });

            const data = await response.json();
            if (data.success && data.download_url) {
                const link = document.createElement('a');
                link.href = `http://127.0.0.1:5000${data.download_url}`;
                link.setAttribute('download', data.filename);
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
            } else {
                alert("Не вдалося завантажити відео");
            }
        } catch (error) {
            console.error("Помилка завантаження:", error);
        }
    };

    const handleViewFullDetails = () => {
        navigate(`/video/details`, {
            state: {
                videoData: videoPreview,
                videoUrl: query
            }
        });
    };

    const toggleDescription = () => {
        if (descriptionRef.current && videoPreview?.description) {
            if (showFullDescription) {
                const lineHeight = parseInt(window.getComputedStyle(descriptionRef.current).lineHeight);
                const maxHeight = descriptionRef.current.clientHeight;
                const maxLines = Math.floor(maxHeight / lineHeight);
                const truncated = videoPreview.description.split('\n').slice(0, maxLines).join('\n') + '...';
                descriptionRef.current.textContent = truncated;
            } else {
                descriptionRef.current.textContent = videoPreview.description;
            }
            setShowFullDescription(!showFullDescription);
        }
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
                        placeholder="Search videos, channels or paste video URL..."
                        className={styles.searchInput}
                    />
                    {query && (
                        <button
                            type="button"
                            onClick={clearInput}
                            className={styles.clearButton}
                        >
                            <FiX size={18} />
                        </button>
                    )}
                </div>
                <button
                    type="submit"
                    className={styles.searchButton}
                    disabled={!query.trim()}
                >
                    <FiSearch size={18} />
                    <span>Search</span>
                </button>
            </form>

            {isLoading && (
                <div className={styles.loadingPreview}>Завантаження даних...</div>
            )}

            {videoPreview && !isLoading && (
                <div className={styles.videoPreviewContainer}>
                    <div className={styles.videoPreviewContent}>
                        <div className={styles.videoThumbnail}>
                            <img src={videoPreview.thumbnail} alt="Video thumbnail" />
                        </div>
                        <div className={styles.videoInfo}>
                            <h3>{videoPreview.title}</h3>
                            <div className={styles.descriptionContainer}>
                                <p
                                    ref={descriptionRef}
                                    className={styles.videoDescription}
                                >
                                    {videoPreview.description}
                                </p>
                                {videoPreview.description.length > 150 && (
                                    <button
                                        onClick={toggleDescription}
                                        className={styles.toggleDescriptionButton}
                                    >
                                        <FiChevronDown size={16} />
                                        <span>{showFullDescription ? 'Show less' : 'Show more'}</span>
                                    </button>
                                )}
                            </div>
                            <div className={styles.videoStats}>
                                <span className={styles.videoStat}>
                                    <FiThumbsUp /> {videoPreview.likes}
                                </span>
                                <span className={styles.videoStat}>
                                    <FiEye /> {videoPreview.views}
                                </span>
                                <span className={styles.videoStat}>
                                    {videoPreview.duration}
                                </span>
                            </div>
                        </div>
                    </div>
                    <div className={styles.downloadOptions}>
                        <select
                            value={selectedQuality}
                            onChange={(e) => setSelectedQuality(e.target.value)}
                            className={styles.qualitySelect}
                        >
                            {videoPreview.qualities.map(quality => (
                                <option key={quality} value={quality}>{quality}</option>
                            ))}
                        </select>
                        <button
                            onClick={handleDownload}
                            className={styles.downloadButton}
                        >
                            <FiDownload size={18} />
                            <span>Download</span>
                        </button>
                        <button
                            onClick={handleViewFullDetails}
                            className={styles.fullDetailsButton}
                        >
                            <FiExternalLink size={18} />
                            <span>Full Details</span>
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SearchBar;