import styles from './SearchBar.module.css';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiSearch, FiX, FiDownload, FiThumbsUp, FiEye } from 'react-icons/fi';

const SearchBar = () => {
    const [query, setQuery] = useState('');
    const [isFocused, setIsFocused] = useState(false);
    const [videoPreview, setVideoPreview] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [selectedQuality, setSelectedQuality] = useState('720p');
    const navigate = useNavigate();

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
            if (!response.ok) {
                throw new Error("Не вдалося отримати прев'ю");
            }
            const data = await response.json();
            setVideoPreview(data);
        } catch (error) {
            console.error("Помилка при отриманні прев'ю:", error);
            setVideoPreview(null);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSearch = (e) => {
        e.preventDefault();
        if (query.trim()) {
            navigate(`/search?q=${encodeURIComponent(query)}`);
        }
    };

    const clearInput = () => {
        setQuery('');
        setVideoPreview(null);
    };

    const handleDownload = async () => {
        if (!query) return;
        try {
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
                link.setAttribute('download', data.filename);  // опційно
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
            } else {
                alert("Не вдалося завантажити відео");
            }
        } catch (error) {
            console.error("Помилка при завантаженні відео:", error);
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
                            <p>{videoPreview.description}</p>
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
                            <span>Завантажити</span>
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SearchBar;
