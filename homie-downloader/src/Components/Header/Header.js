import styles from './Header.module.css';
import SearchBar from '../SearchBar/SearchBar';
import { FiUser, FiBell, FiMenu } from 'react-icons/fi';
import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';

const Header = () => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const dropdownRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsMenuOpen(false);
            }
        };

        if (isMenuOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        } else {
            document.removeEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isMenuOpen]);

    return (
        <header className={styles.header}>
            <div className={styles.leftSection}>
                <div className={styles.logo}>
                    <span className={styles.logoMain}>Homie</span>
                    <span className={styles.logoAccent}>Downloader</span>
                </div>
            </div>

            <div className={styles.rightSection}>
                <button className={styles.notificationButton}>
                    <FiBell size={20} />
                    <span className={styles.notificationBadge}>3</span>
                </button>
                <div className={styles.userAvatar} onClick={() => setIsMenuOpen(!isMenuOpen)}>
                    <FiUser size={20} />
                    {isMenuOpen && (
                        <div className={styles.userDropdown} ref={dropdownRef}>
                            <Link to="/account" className={styles.dropdownItem} onClick={() => setIsMenuOpen(false)}>Profile</Link>
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