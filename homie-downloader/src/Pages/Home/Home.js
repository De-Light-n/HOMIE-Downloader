import { useState } from 'react';
import styles from './Home.module.css';
import Header from '../../Components/Header/Header';
import VideoRow from '../../Components/VideoRow/VideoRow';
import LoadingSpinner from '../../Components/LoadingSpinner/LoadingSpinner';
import SearchBar from '../../Components/SearchBar/SearchBar';
import '../../Styles/themes.css';

const Home = () => {
    const [isLoading, setIsLoading] = useState(false);

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

                    {/* Виправлені рядки за категоріями - використовуємо проп category замість type */}
                    <VideoRow
                        title="Популярна музика"
                        category="Music"
                        index={2}
                    />

                    <VideoRow
                        title="Топ ігри"
                        category="gaming"
                        index={3}
                    />

                    <VideoRow
                        title="Навчальні матеріали"
                        category="education"
                        index={4}
                    />

                    <VideoRow
                        title="Спортивні події"
                        category="sports"
                        index={5}
                    />

                    <VideoRow
                        title="Подкасти"
                        category="podcasts"
                        index={6}
                    />

                    <VideoRow
                        title="Кулінарні шедеври"
                        category="cooking"
                        index={7}
                    />

                    <VideoRow
                        title="Подорожі"
                        category="travel"
                        index={8}
                    />

                    <VideoRow
                        title="Мотивація"
                        category="motivation"
                        index={9}
                    />

                    <VideoRow
                        title="Кіно та серіали"
                        category="movies"
                        index={10}
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