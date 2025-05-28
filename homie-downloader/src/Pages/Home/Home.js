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
                </main>
            </div>
        </div>
    );
};

export default Home;