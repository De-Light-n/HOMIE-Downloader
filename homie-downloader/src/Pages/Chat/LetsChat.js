import React from 'react';
import { useNavigate } from 'react-router-dom';
import './LetsChat.css';

function LetsChat() {
    const navigate = useNavigate();

    const handleSubmit = (e) => {
        e.preventDefault();
        // Тут буде логіка відправки форми
        alert('Ваше повідомлення відправлено! Ми зв\'яжемося з вами найближчим часом.');
        navigate('/');
    };

    return (
        <div className="lets-chat-page">
            <div className="background-animation-container">
                <div className="floating-element orb1" style={{ '--base-opacity': '0.2' }}></div>
                <div className="floating-element orb2" style={{ '--base-opacity': '0.15' }}></div>
                <div className="floating-element orb3" style={{ '--base-opacity': '0.12' }}></div>
            </div>
            <div className="lets-chat-container">
                <h1 className="lets-chat-title">Написати нам</h1>
                <p className="lets-chat-subtitle">Маєте запитання чи пропозиції? Напишіть нам!</p>

                <form className="contact-form" onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label htmlFor="name"></label>
                        <input
                            type="text"
                            id="name"
                            name="name"
                            required
                            placeholder="Введіть ваше ім'я"
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="email"></label>
                        <input
                            type="email"
                            id="email"
                            name="email"
                            required
                            placeholder="Введіть ваш email"
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="subject"></label>
                        <input
                            type="text"
                            id="subject"
                            name="subject"
                            required
                            placeholder="Тема повідомлення"
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="message"></label>
                        <textarea
                            id="message"
                            name="message"
                            rows="5"
                            required
                            placeholder="Ваше повідомлення..."
                        ></textarea>
                    </div>

                    <button type="submit" className="submit-btn">
                        Надіслати повідомлення
                    </button>
                </form>

                <div className="contact-info">
                    <h3>Або зв'яжіться з нами іншим способом:</h3>
                    <p>Email: <a href="mailto:support@homiedownloader.com">support@homiedownloader.com</a></p>
                    <p>Телефон: +38 067 987 65 43</p>
                </div>
            </div>
        </div>
    );
}

export default LetsChat;