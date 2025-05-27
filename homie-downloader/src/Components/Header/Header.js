import styles from './Header.module.css';
import { FiUser, FiMenu } from 'react-icons/fi';
import { FaQuestionCircle } from 'react-icons/fa'; // Imported question mark icon
import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../Firebase/AuthContext';

const Header = () => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const dropdownRef = useRef(null);
    const mobileMenuRef = useRef(null);
    const navigate = useNavigate();

    const auth = useAuth();
    const currentUser = auth?.currentUser;
    const logout = auth?.logout;

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsMenuOpen(false);
            }
            if (mobileMenuRef.current && !mobileMenuRef.current.contains(event.target) &&
                !event.target.closest(`.${styles.menuButton}`)) {
                setIsMobileMenuOpen(false);
            }
        };

        if (isMenuOpen || isMobileMenuOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        } else {
            document.removeEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isMenuOpen, isMobileMenuOpen]);

    const handleAvatarClick = () => {
        if (currentUser) {
            navigate('/account');
        } else {
            setIsMenuOpen(!isMenuOpen);
        }
    };

    const handleLogout = async () => {
        try {
            if (logout) {
                await logout();
            }
            setIsMenuOpen(false);
            navigate('/');
        } catch (error) {
            console.error('Failed to log out', error);
        }
    };

    return (
        <header className={styles.header}>
            <div className={styles.leftSection}>
                <button
                    className={styles.menuButton}
                    onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                >
                    <FiMenu size={20} />
                </button>

                <Link to="/" className={styles.logo}>
                    <span className={styles.logoMain}>Homie</span>
                    <span className={styles.logoAccent}>Downloader</span>
                </Link>
            </div>

            {/* Mobile Menu */}
            {isMobileMenuOpen && (
                <div className={styles.mobileMenu} ref={mobileMenuRef}>
                    {currentUser ? (
                        <>
                            <Link
                                to="/account"
                                className={styles.mobileMenuItem}
                                onClick={() => setIsMobileMenuOpen(false)}
                            >
                                Profile
                            </Link>
                            <div
                                className={styles.mobileMenuItem}
                                onClick={() => {
                                    setIsMobileMenuOpen(false);
                                    handleLogout();
                                }}
                            >
                                Logout
                            </div>
                        </>
                    ) : (
                        <>
                            <Link
                                to="/login"
                                className={styles.mobileMenuItem}
                                onClick={() => setIsMobileMenuOpen(false)}
                            >
                                Log In
                            </Link>
                            <Link
                                to="/signup"
                                className={styles.mobileMenuItem}
                                onClick={() => setIsMobileMenuOpen(false)}
                            >
                                Sign Up
                            </Link>
                        </>
                    )}
                </div>
            )}

            <div className={styles.rightSection}>
                <Link to="/aboutus" className={styles.aboutButton}>
                    <FaQuestionCircle size={20} />
                </Link>
                {currentUser ? (
                    <>
                        <div
                            className={styles.userAvatar}
                            onClick={handleAvatarClick}
                        >
                            {currentUser.photoURL ? (
                                <img
                                    src={currentUser.photoURL}
                                    alt="User"
                                    className={styles.avatarImage}
                                />
                            ) : (
                                <FiUser size={20} />
                            )}
                        </div>
                    </>
                ) : (
                    <div className={styles.authButtons}>
                        <Link to="/login" className={styles.loginButton}>
                            Log In
                        </Link>
                        <Link to="/signup" className={styles.signupButton}>
                            Sign Up
                        </Link>
                    </div>
                )}
            </div>
        </header>
    );
};

export default Header;