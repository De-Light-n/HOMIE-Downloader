import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiSearch, FiX, FiDownload, FiThumbsUp, FiEye, FiChevronDown, FiExternalLink } from 'react-icons/fi';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db, auth } from '../Firebase/firebase';
import styles from './SearchBar.module.css';
import Loader from './Loader';

const SearchBar = () => {
    const [query, setQuery] = useState('');
    const [isFocused, setIsFocused] = useState(false);
    const [videoPreview, setVideoPreview] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [selectedQuality, setSelectedQuality] = useState('720p');
    const [showFullDescription, setShowFullDescription] = useState(false);
    const [isDownloading, setIsDownloading] = useState(false);
    const descriptionRef = useRef(null);
    const navigate = useNavigate();

    // Function to detect video category
    const detectVideoCategory = (title, description) => {
        if (!title && !description) return 'Other';

        const text = `${title} ${description}`.toLowerCase();

        const categories = {
            'Music': ['музика', 'пісня', 'лірика', 'альбом', 'гурт', 'виконавець', 'кліп', 'music', 'song', 'lyric'],
            'Gaming': ['гра', 'геймінг', 'прохідження', 'летсплей', 'кіберспорт', 'game', 'gaming', 'walkthrough'],
            'Education': ['урок', 'навчання', 'курс', 'туторіал', 'як зробити', 'education', 'tutorial', 'how to'],
            'Sports': ['спорт', 'футбол', 'баскетбол', 'теніс', 'тренування', 'sport', 'football', 'workout'],
            'Entertainment': ['фільм', 'шоу', 'комедія', 'смішно', 'розваги', 'movie', 'comedy', 'entertainment'],
            'Technology': ['технології', 'програмування', 'код', 'комп\'ютер', 'штучний інтелект', 'tech', 'programming', 'ai'],
            'News': ['новини', 'події', 'політика', 'актуальне', 'news', 'politics', 'current events'],
            'Podcasts': ['подкаст', 'аудіо', 'радіо', 'podcast', 'audio', 'interview'],
            'Cooking': ['рецепт', 'кулінарія', 'приготування', 'їжа', 'страва', 'cooking', 'recipe', 'food'],
            'Travel': ['подорож', 'туризм', 'країна', 'місто', 'travel', 'tourism', 'country'],
            'Motivation': ['мотивація', 'успіх', 'історія', 'досягнення', 'motivation', 'success', 'inspiration'],
            'Cinema': ['кіно', 'фільм', 'рецензія', 'актор', 'режисер', 'cinema', 'film', 'review'],
            'Automotive': ['авто', 'машина', 'автомобіль', 'car', 'vehicle', 'driving'],
            'Fashion': ['мода', 'стиль', 'одяг', 'fashion', 'style', 'clothing'],
            'Science': ['наука', 'дослідження', 'відкриття', 'science', 'research', 'discovery'],
            'Health': ['здоров\'я', 'медицина', 'лікування', 'health', 'medicine', 'fitness'],
            'Cryptocurrency': ['криптовалюта', 'біткоін', 'блокчейн', 'crypto', 'bitcoin', 'blockchain']
        };

        for (const [category, keywords] of Object.entries(categories)) {
            if (keywords.some(keyword => text.includes(keyword))) {
                return category;
            }
        }

        return 'Other';
    };

    const saveAction = async (actionData) => {
        try {
            const user = auth.currentUser;

            let category = 'Other';
            if (actionData.videoTitle || actionData.videoDescription) {
                category = detectVideoCategory(
                    actionData.videoTitle || '',
                    actionData.videoDescription || ''
                );
            }

            const data = Object.entries({
                ...actionData,
                category,
                timestamp: serverTimestamp(),
                userId: user?.uid || 'anonymous',
                userEmail: user?.email || null,
            }).reduce((acc, [key, value]) => {
                if (value !== undefined) {
                    acc[key] = value;
                }
                return acc;
            }, {});

            await addDoc(collection(db, 'userActions'), data);
            console.log('Дія збережена:', data);
        } catch (error) {
            console.error("Помилка збереження дії:", error);
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

            await saveAction({
                type: 'preview',
                query: url,
                videoTitle: data.title || '',
                videoDescription: data.description || '',
                thumbnail: data.thumbnail || '',
                duration: data.duration || '',
                views: data.views || '',
                likes: data.likes || ''
            });
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
            await saveAction({
                type: 'search',
                query: query,
                isVideoUrl: query.includes('youtube.com') || query.includes('youtu.be')
            });
        }
    };

    const clearInput = () => {
        setQuery('');
        setVideoPreview(null);
        setIsDownloading(false);
    };

    const handleDownload = async () => {
        if (!query) return;

        setIsDownloading(true);
        try {
            await saveAction({
                type: 'download',
                url: query,
                quality: selectedQuality,
                videoTitle: videoPreview?.title || '',
                videoDescription: videoPreview?.description || '',
                thumbnail: videoPreview?.thumbnail || '',
                duration: videoPreview?.duration || '',
                views: videoPreview?.views || '',
                likes: videoPreview?.likes || ''
            });

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
            alert("Помилка при завантаженні відео");
        } finally {
            setIsDownloading(false);
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
                        placeholder="Search for videos, channels or paste a video link..."
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
                <div className={styles.loadingPreview}>
                    <Loader />
                </div>
            )}

            {isDownloading && (
                <div className={styles.downloadLoader}>
                    <DownloadLoader />
                </div>
            )}

            {videoPreview && !isLoading && !isDownloading && (
                <div className={styles.videoPreviewContainer}>
                    <div className={styles.videoPreviewContent}>
                        <div className={styles.videoThumbnail}>
                            <img src={videoPreview.thumbnail} alt="Preview of video" />
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
                                        <span>{showFullDescription ? 'Roll up' : 'Unfold'}</span>
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
                            disabled={isDownloading}
                        >
                            <FiDownload size={18} />
                            <span>Download</span>
                        </button>
                        <button
                            onClick={handleViewFullDetails}
                            className={styles.fullDetailsButton}
                        >
                            <FiExternalLink size={18} />
                            <span>Details</span>
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SearchBar;