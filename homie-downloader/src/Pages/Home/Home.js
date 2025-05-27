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
            <div className="background-animation-container">
                <div className="floating-element orb1" style={{ '--base-opacity': '0.2' }}></div>
                <div className="floating-element orb2" style={{ '--base-opacity': '0.15' }}></div>
                <div className="floating-element orb3" style={{ '--base-opacity': '0.12' }}></div>
            </div>
            <div className={styles.contentWrapper}>
                <Header/>

                <main className={styles.mainContent}>
                    <div className={styles.searchBarContainer}>
                        <SearchBar/>
                    </div>

                    <VideoRow
                        title="Recent-searches"
                        type="recent-searches"
                        index={0}
                    />

                    <VideoRow
                        title="Recent-downloads"
                        type="recent-downloads"
                        index={1}
                    />

                    {/* Виправлені рядки за категоріями - використовуємо проп category замість type */}
                    <VideoRow
                        title="Popular Music"
                        category="Music"
                        index={2}
                    />

                    <VideoRow
                        title="Popular Games"
                        category="gaming"
                        index={3}
                    />

                    <VideoRow
                        title="Educational Videos"
                        category="education"
                        index={4}
                    />

                    <VideoRow
                        title="Sports Videos"
                        category="sports"
                        index={5}
                    />

                    <VideoRow
                        title="Podcasts"
                        category="podcasts"
                        index={6}
                    />

                    <VideoRow
                        title="Cooking Videos"
                        category="cooking"
                        index={7}
                    />

                    <VideoRow
                        title="Travel Videos"
                        category="travel"
                        index={8}
                    />

                    <VideoRow
                        title="Motivation Videos"
                        category="motivation"
                        index={9}
                    />

                    <VideoRow
                        title="Movies & TV Shows"
                        category="movies"
                        index={10}
                    />
                </main>
            </div>
        </div>
    );
};

export default Home;