import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './Footer.css';

function Footer() {
    const navigate = useNavigate();

    const redirectToChat = () => {
        navigate('/letschat');
    };

    return (
        <footer className="footer">
            {/* Верхній рядок */}
            <div className="footer-top">
                <p>support@homiedownloader.com • Download easily, listen freely • support@homiedownloader.com</p>
            </div>

            {/* Основний контент */}
            <div className="footer-content">
                <div className="footer-left">
                    <h2 className="footer-title">Download. Listen.Enjoy yourself</h2>
                    <button className="chat-btn" onClick={redirectToChat}>
                        Write to us →
                    </button>
                </div>

                <div className="footer-nav">
                    <h4>NAVIGATION</h4>
                    <ul>
                        <li><Link to="/aboutus">About us</Link></li>
                        <li><Link to="/guide#features">Opportunities</Link></li>
                        <li><Link to="/guide#faq">FAQ</Link></li>
                        <li><Link to="/guide#platforms">Supported platforms</Link></li>
                        <li><Link to="/guide#how-to-use">Instructions</Link></li>
                        <li><Link to="/letschat">Contacts</Link></li>
                    </ul>
                </div>

                <div className="footer-services">
                    <h4>WHAT WE OFFER</h4>
                    <ul>
                        <li><Link to="/guide#how-to-use">How to download videos</Link></li>
                        <li><Link to="/guide#how-to-use">Download music in MP3</Link></li>
                        <li><Link to="/guide#platforms">YouTube and TikTok</Link></li>
                        <li><Link to="/guide#platforms">SoundCloud and others</Link></li>
                        <li><Link to="/guide#features">High quality</Link></li>
                        <li><Link to="/guide#features">Free access</Link></li>
                    </ul>
                </div>

                <div className="footer-contact">
                    <h4>CONTACTS</h4>
                    <p>+38 066 666 66</p>
                    <p>
                        <a href="mailto:support@homiedownloader.com">support@homiedownloader.com</a>
                    </p>
                    <p>
                        St. homie, 3 <br/>
                        Lviv, Ukraine<br/>
                    </p>
                </div>
            </div>


            {/* Великий напис на фоні */}
            <div className="footer-bg-text">Homie</div>
        </footer>
    );
}

export default Footer;