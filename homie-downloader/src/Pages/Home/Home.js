import { useEffect, useState } from 'react';
import styles from './Home.module.css';
import Header from '../../Components/Header/Header';
import VideoRow from '../../Components/VideoRow/VideoRow';
import LoadingSpinner from '../../Components/LoadingSpinner/LoadingSpinner';
import SearchBar from '../../Components/SearchBar/SearchBar'; // Додано імпорт SearchBar

const videoCategories = [
    {
        id: 1,
        title: "Popular Videos",
        videos: Array(8).fill().map((_, i) => ({
            id: i + 1,
            title: `Amazing Nature Documentary ${2023 - i}`,
            channel: ['Nature Channel', 'Wildlife TV', 'Discovery Plus'][i % 3],
            views: `${(1.2 + i * 0.3).toFixed(1)}M`,
            date: `${i + 1} week${i > 0 ? 's' : ''} ago`,
            duration: `${Math.floor(12 + i)}:${34 - i}`,
            thumbnail: `https://source.unsplash.com/random/300x169/?nature,${i}`
        }))
    },
    {
        id: 2,
        title: "Recommended For You",
        videos: Array(8).fill().map((_, i) => ({
            id: i + 10,
            title: `Top Travel Destinations ${2023 - i}`,
            channel: ['Travel Adventures', 'Explore World', 'Wanderlust'][i % 3],
            views: `${(0.8 + i * 0.2).toFixed(1)}M`,
            date: `${i + 2} day${i > 0 ? 's' : ''} ago`,
            duration: `${Math.floor(15 + i)}:${20 - i}`,
            thumbnail: `https://source.unsplash.com/random/300x169/?travel,${i}`
        }))
    },
    {
        id: 3,
        title: "Trending Now",
        videos: Array(8).fill().map((_, i) => ({
            id: i + 20,
            title: `Tech Innovations ${2023 - i}`,
            channel: ['Tech Today', 'Future Labs', 'Digital World'][i % 3],
            views: `${(1.5 + i * 0.4).toFixed(1)}M`,
            date: `${i} day${i !== 1 ? 's' : ''} ago`,
            duration: `${Math.floor(10 + i)}:${45 - i}`,
            thumbnail: `https://source.unsplash.com/random/300x169/?technology,${i}`
        }))
    }
];

const Home = () => {
    const [isLoading, setIsLoading] = useState(true);
    const [categories, setCategories] = useState([]);

    useEffect(() => {
        const timer = setTimeout(() => {
            setCategories(videoCategories);
            setIsLoading(false);
        }, 1500);

        return () => clearTimeout(timer);
    }, []);

    if (isLoading) {
        return (
            <div className={styles.loadingContainer}>
                <LoadingSpinner />
            </div>
        );
    }

    return (
        <div className={styles.home}>
            {/* Анімований неоновий фон */}
            <div className={styles.neonBackground}>
                <div className={`${styles.glowEffect} ${styles.purpleGlow}`}></div>
                <div className={`${styles.glowEffect} ${styles.pinkGlow}`}></div>
                <div className={`${styles.glowEffect} ${styles.blueGlow}`}></div>
                <div className={styles.gridOverlay}></div>
            </div>

            {/* Основний контент */}
            <div className={styles.contentWrapper}>
                <Header />

                <main className={styles.mainContent}>
                    {/* Додано SearchBar під Header */}
                    <div className={styles.searchBarContainer}>
                        <SearchBar />
                    </div>

                    {categories.map((category, index) => (
                        <VideoRow
                            key={category.id}
                            title={category.title}
                            videos={category.videos}
                            index={index}
                        />
                    ))}

                    <div className={styles.ctaSection}>
                        <h2 className={styles.ctaTitle}>Ready for More?</h2>
                        <p className={styles.ctaSubtitle}>Discover exclusive content in our library</p>
                        <button className={styles.exploreButton}>
                            Explore All Videos
                        </button>
                    </div>
                </main>
            </div>
        </div>
    );
};

export default Home;