import styles from './Search.module.css';
import Header from '../../components/Header/Header';
import VideoRow from '../../components/VideoRow/VideoRow';
import { useLocation } from 'react-router-dom';

const Search = () => {
    const location = useLocation();
    const query = new URLSearchParams(location.search).get('q');

    // In a real app, you would fetch search results based on the query
    const searchResults = Array(10).fill({
        id: Math.random(),
        title: `Search Result for "${query}"`,
        channel: 'Various Channels',
        views: '500K',
        date: '1 month ago',
        duration: '10:00',
        thumbnail: 'https://via.placeholder.com/300x169?text=Search+Video'
    });

    return (
        <div className={styles.searchPage}>
            <Header />
            <main className={styles.mainContent}>
                <h1 className={styles.searchTitle}>Results for: "{query}"</h1>
                <VideoRow title="" videos={searchResults} />
            </main>
        </div>
    );
};

export default Search;