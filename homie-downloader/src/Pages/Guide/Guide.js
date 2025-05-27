import React, { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import './Guide.css';
import '../../Styles/Background.css';
function Guide() {
    const location = useLocation();

    useEffect(() => {
        const hash = location.hash;
        if (hash) {
            const element = document.querySelector(hash);
            if (element) {
                element.scrollIntoView({ behavior: 'smooth' });
            }
        }
    }, [location]);

    return (
        <div className="guide-page">
            <div className="neonBackground">
                <div className={`glowEffect purpleGlow`}></div>
                <div className={`glowEffect pinkGlow`}></div>
                <div className={`glowEffect blueGlow`}></div>
                <div className="gridOverlay"></div>
            </div>
            <div className="guide-content">
                <section id="how-to-use" className="guide-section">
                    <h2 className="section-title">Як користуватися сервісом</h2>
                    <div className="text-holder">
                        <h3>Завантаження відео</h3>
                        <p>
                            1. Скопіюйте посилання на відео з платформи (YouTube, TikTok тощо).<br/>
                            2. Вставте посилання в поле завантаження на головній сторінці.<br/>
                            3. Виберіть формат (MP4, WebM) і натисніть "Завантажити".<br/>
                            4. Зачекайте кілька секунд, і ваше відео буде готове!
                        </p>
                    </div>
                    <div className="text-holder">
                        <h3>Завантаження музики в MP3</h3>
                        <p>
                            1. Скопіюйте посилання на аудіо чи відео (наприклад, з SoundCloud або YouTube).<br/>
                            2. Вставте його в поле завантаження.<br/>
                            3. Виберіть формат MP3 і натисніть "Конвертувати та завантажити".<br/>
                            4. Отримайте високоякісний MP3-файл за мить!
                        </p>
                    </div>
                </section>

                <section id="platforms" className="guide-section">
                    <h2 className="section-title">Підтримувані платформи</h2>
                    <div className="features-list">
                        <div className="feature-item">
                            <h3>YouTube та TikTok</h3>
                            <p>Завантажуйте відео та музику з YouTube і TikTok без водяних знаків у високій якості.</p>
                        </div>
                        <div className="feature-item">
                            <h3>SoundCloud та інші</h3>
                            <p>Підтримуємо SoundCloud, Vimeo, Instagram, Facebook та багато інших платформ.</p>
                        </div>
                    </div>
                </section>

                <section id="features" className="guide-section">
                    <h2 className="section-title">Наші фішки</h2>
                    <div className="features-list">
                        <div className="feature-item">
                            <h3>Висока якість</h3>
                            <p>Зберігайте відео у роздільній здатності до 4K і музику в MP3 з бітрейтом до 320 kbps.</p>
                        </div>
                        <div className="feature-item">
                            <h3>Безкоштовний доступ</h3>
                            <p>Наш сервіс повністю безкоштовний, без прихованих платежів чи лімітів.</p>
                        </div>
                    </div>
                </section>

                <section id="faq" className="guide-section">
                    <h2 className="section-title">FAQ</h2>
                    <div className="faq-list">
                        <div className="faq-item">
                            <h3>Чи законно завантажувати відео?</h3>
                            <p>Завантаження дозволено для особистого використання, якщо контент не захищений авторським правом. Переконайтеся, що ви маєте дозвіл.</p>
                        </div>
                        <div className="faq-item">
                            <h3>Чому завантаження іноді триває довго?</h3>
                            <p>Це залежить від розміру файлу та швидкості вашого інтернету. Ми оптимізуємо процес, але великі файли потребують часу.</p>
                        </div>
                        <div className="faq-item">
                            <h3>Чи потрібна реєстрація?</h3>
                            <p>Ні, наш сервіс працює без реєстрації, але авторизація дає доступ до історії завантажень.</p>
                        </div>
                        <div className="faq-item">
                            <h3>Які формати підтримуються?</h3>
                            <p>Відео: MP4, WebM. Аудіо: MP3, WAV. Ми постійно додаємо нові формати!</p>
                        </div>
                    </div>
                </section>
            </div>
        </div>
    );
}

export default Guide;