import styles from './Header.module.css';
import SearchBar from '../SearchBar/SearchBar';
import { FiUser, FiBell, FiMenu } from 'react-icons/fi';
import { useState } from 'react';
import { Link } from 'react-router-dom';

const Header = () => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    return (
        <header className={styles.header}>
            <div className={styles.leftSection}>
                <button className={styles.menuButton}>
                    <FiMenu size={24} />
                </button>
                <div className={styles.logo}>
                    <span className={styles.logoMain}>Stream</span>
                    <span className={styles.logoAccent}>Hub</span>
                </div>
            </div>

            <SearchBar />

            <div className={styles.rightSection}>
                <button className={styles.notificationButton}>
                    <FiBell size={20} />
                    <span className={styles.notificationBadge}>3</span>
                </button>
                <div className={styles.userAvatar} onClick={() => setIsMenuOpen(!isMenuOpen)}>
                    <FiUser size={20} />
                    {isMenuOpen && (
                        <div className={styles.userDropdown}>
                            <Link to="/account" className={styles.dropdownItem}>Profile</Link>
                            <div className={styles.dropdownItem}>Settings</div>
                            <div className={styles.dropdownItem}>Logout</div>
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
};

export default Header;