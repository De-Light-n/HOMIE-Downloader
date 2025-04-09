// SearchBar.js
import styles from './SearchBar.module.css';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiSearch, FiX } from 'react-icons/fi';

const SearchBar = () => {
    const [query, setQuery] = useState('');
    const [isFocused, setIsFocused] = useState(false);
    const navigate = useNavigate();

    const handleSearch = (e) => {
        e.preventDefault();
        if (query.trim()) {
            navigate(`/search?q=${encodeURIComponent(query)}`);
        }
    };

    const clearInput = () => {
        setQuery('');
    };

    return (
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
                    placeholder="Search videos, channels..."
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
    );
};

export default SearchBar;