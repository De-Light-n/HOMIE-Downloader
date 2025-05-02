import { useState } from 'react';
import styles from './Home.module.css';
import Header from '../../Components/Header/Header';
import VideoRow from '../../Components/VideoRow/VideoRow';
import LoadingSpinner from '../../Components/LoadingSpinner/LoadingSpinner';
import SearchBar from '../../Components/SearchBar/SearchBar';
import '../../Styles/Background.css';

const Home = () => {
    const [isLoading, setIsLoading] = useState(false); // Змінили на false, оскільки VideoRow сам керує загрузкою

    // Видалили useEffect, оскільки загрузка тепер відбувається в VideoRow

    return (
        <div className={styles.home}>
            <div className="neonBackground">
                <div className={`glowEffect purpleGlow`}></div>
                <div className={`glowEffect pinkGlow`}></div>
                <div className={`glowEffect blueGlow`}></div>
                <div className="gridOverlay"></div>
            </div>

            <div className={styles.contentWrapper}>
                <Header />

                <main className={styles.mainContent}>
                    <div className={styles.searchBarContainer}>
                        <SearchBar />
                    </div>

                    <VideoRow
                        title="Недавні пошуки"
                        type="recent-searches"
                        index={0}
                    />

                    <VideoRow
                        title="Недавні завантаження"
                        type="recent-downloads"
                        index={1}
                    />

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