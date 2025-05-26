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
                <p>support@homiedownloader.com • Завантажуй легко, слухай вільно • support@homiedownloader.com</p>
            </div>

            {/* Основний контент */}
            <div className="footer-content">
                <div className="footer-left">
                    <h2 className="footer-title">Завантажуй. Слухай. Насолоджуйся.</h2>
                    <button className="chat-btn" onClick={redirectToChat}>
                        Написати нам →
                    </button>
                </div>

                <div className="footer-nav">
                    <h4>НАВІГАЦІЯ</h4>
                    <ul>
                        <li><Link to="/aboutus">Про нас</Link></li>
                        <li><Link to="/guide#features">Можливості</Link></li>
                        <li><Link to="/guide#faq">FAQ</Link></li>
                        <li><Link to="/guide#platforms">Підтримувані платформи</Link></li>
                        <li><Link to="/guide#how-to-use">Інструкції</Link></li>
                        <li><Link to="/letschat">Контакти</Link></li>
                    </ul>
                </div>

                <div className="footer-services">
                    <h4>ЩО МИ ПРОПОНУЄМО</h4>
                    <ul>
                        <li><Link to="/guide#how-to-use">Як завантажувати відео</Link></li>
                        <li><Link to="/guide#how-to-use">Завантаження музики в MP3</Link></li>
                        <li><Link to="/guide#platforms">YouTube та TikTok</Link></li>
                        <li><Link to="/guide#platforms">SoundCloud та інші</Link></li>
                        <li><Link to="/guide#features">Висока якість</Link></li>
                        <li><Link to="/guide#features">Безкоштовний доступ</Link></li>
                    </ul>
                </div>

                <div className="footer-contact">
                    <h4>КОНТАКТИ</h4>
                    <p>+38 067 987 65 43</p>
                    <p>
                        <a href="mailto:support@homiedownloader.com">support@homiedownloader.com</a>
                    </p>
                    <p>
                        вул. Технічна, 25 <br/>
                        Київ, Україна <br/>
                        02000
                    </p>
                </div>
            </div>

            {/* Великий напис на фоні */}
            <div className="footer-bg-text">Homie</div>
        </footer>
    );
}

export default Footer;