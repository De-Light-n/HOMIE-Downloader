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
            // Mock data with additional stats
            const mockResponse = {
                title: "Приклад відео",
                description: "Це опис відео, який буде відображатися у прев'ю. Тут може бути довгий текст з описом відео, його змістом та іншою корисною інформацією.",
                thumbnail: "https://i.ytimg.com/vi/dQw4w9WgXcQ/maxresdefault.jpg",
                qualities: ['360p', '480p', '720p', '1080p'],
                likes: "125K",
                views: "2.5M",
                duration: "10:30"
            };
            setVideoPreview(mockResponse);
        } catch (error) {
            console.error("Помилка при отриманні прев'ю:", error);
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

    const handleDownload = () => {
        console.log(`Завантаження відео у якості ${selectedQuality}`);
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