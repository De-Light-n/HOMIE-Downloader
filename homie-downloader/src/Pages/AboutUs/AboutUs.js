import React from 'react';
import './AboutUs.css';
import neonO from './photo/neonO.png';
import neonI from './photo/neonI.png';
import neonR from './photo/neonR.png';
import neonN from './photo/neonN.png';
import neonY from './photo/neonY.png';




function AboutUs() {
    return (
        <div className="about-us-page">
            <div className="neonBackground">
                <div className={`glowEffect purpleGlow`}></div>
                <div className={`glowEffect pinkGlow`}></div>
                <div className={`glowEffect blueGlow`}></div>
                <div className="gridOverlay"></div>
            </div>
            <div className="about-us">
                <section className="intro-block">
                    <div className="about-header">
                        <h1 className="about-title">About us</h1>
                    </div>
                    <p className="text-holder">
                        We are a team of developers who create a user-friendly downloader for videos and songs from various platforms. Our service is your assistant for saving your favorite content quickly and easily.
                    </p>
                </section>

                <section className="mission-block">
                    <h2 className="section-title">Our mission</h2>
                    <p className="text-holder">
                        We're committed to making media downloads accessible to everyone. Our service helps users save videos and music from popular platforms without unnecessary complications.
                    </p>
                </section>

                <section className="content-block">
                    <h2 className="section-title">What our service offers</h2>
                    <div className="features-list">
                        <div className="feature-item">
                            <h3>Downloading from different platforms</h3>
                            <p>We support YouTube, TikTok, SoundCloud and many other services.</p>
                        </div>
                        <div className="feature-item">
                            <h3>Ease of use</h3>
                            <p>
                                Intuitive interface for fast loading without unnecessary settings.
                            </p>
                        </div>
                        <div className="feature-item">
                            <h3>High quality content</h3>
                            <p>Save videos in high resolution and music in MP3 format.</p>
                        </div>
                        <div className="feature-item">
                            <h3>Free access</h3>
                            <p>Download your favorite files for free and without restrictions.</p>
                        </div>
                    </div>
                </section>

                <section className="team-block">
                    <h2 className="section-title">Our team</h2>
                    <div className="team-members">
                        <div className="team-member">
                            <img src={neonI} alt="Ігор - фронтенд розробник" className="team-member__image" />
                            <div className="team-member__content">
                                <h3>Ihor</h3>
                                <p className="team-member__role">Frontend developer</p>
                                <p>
                                    I create a convenient and attractive interface so that users can easily download media from any platform.
                                </p>
                            </div>
                        </div>
                        <div className="team-member">
                            <img src={neonN} alt="Назар - фулстек розробник" className="team-member__image" />
                            <div className="team-member__content">
                                <h3>Nazar</h3>
                                <p className="team-member__role">Fullstack developer</p>
                                <p>
                                    I develop server and client parts, providing fast and reliable downloading of video and audio from various platforms.
                                </p>
                            </div>
                        </div>
                        <div className="team-member">
                            <img src={neonO} alt="Орест - фулстек розробник" className="team-member__image" />
                            <div className="team-member__content">
                                <h3>Orest</h3>
                                <p className="team-member__role">Fullstack developer</p>
                                <p>
                                    I work on the frontend and backend, creating a complete and fast interface for comfortable work with our service.
                                </p>
                            </div>
                        </div>
                        <div className="team-member">
                            <img src={neonY} alt="Ян - тестувальник" className="team-member__image" />
                            <div className="team-member__content">
                                <h3>Ian</h3>
                                <p className="team-member__role">Tester</p>
                                <p>
                                    I check the functionality of the service to ensure stable operation and flawless user experience.
                                </p>
                            </div>
                        </div>
                        <div className="team-member">
                            <img src={neonR} alt="Руслан - аналітик" className="team-member__image" />
                            <div className="team-member__content">
                                <h3>Ruslan</h3>
                                <p className="team-member__role">Analyst</p>
                                <p>
                                    I analyze the needs of users and optimize the service so that it meets your expectations and remains convenient.
                                </p>
                            </div>
                        </div>
                    </div>
                </section>

                <section className="why-us-block">
                    <h2 className="section-title">Why us?</h2>
                    <p>
                        We don't just create a downloader - we make it as convenient and efficient as possible! Every feature is tested and every update aims to improve your experience.
                    </p>
                </section>

                <section className="testimonials-section">
                    <h2 className="section-title">Inspirational reviews</h2>
                    <div className="testimonials-scroller">
                        <div className="testimonials-track">
                            <div className="testimonial-card">
                                <div className="stars">★★★★★</div>
                                <p className="testimonial-text">
                                    Сервіс надзвичайно зручний! Завантажую відео з YouTube за секунди, все інтуїтивно зрозуміло.
                                </p>
                                <p className="author">Олександр К.</p>
                            </div>
                            <div className="testimonial-card">
                                <div className="stars">★★★★</div>
                                <p className="testimonial-text">
                                    Чудовий інструмент для збереження музики з SoundCloud. Інтерфейс простий, але іноді хочеться більше форматів.
                                </p>
                                <p className="author">Марія П.</p>
                            </div>
                            <div className="testimonial-card">
                                <div className="stars">★★★★★</div>
                                <p className="testimonial-text">
                                    Найкращий завантажувач, який я використовував. TikTok і YouTube працюють бездоганно!
                                </p>
                                <p className="author">Дмитро С.</p>
                            </div>
                            <div className="testimonial-card">
                                <div className="stars">★★★★</div>
                                <p className="testimonial-text">
                                    Зручний сервіс для швидкого завантаження. Хотілося б трішки швидше обробку великих файлів.
                                </p>
                                <p className="author">Анна Л.</p>
                            </div>
                            <div className="testimonial-card">
                                <div className="stars">★★★★★</div>
                                <p className="testimonial-text">
                                    Завантажую відео з Vimeo без проблем. Якість завжди на висоті, рекомендую!
                                </p>
                                <p className="author">Віктор М.</p>
                            </div>
                            <div className="testimonial-card">
                                <div className="stars">★★★★</div>
                                <p className="testimonial-text">
                                    Простий у використанні, але іноді потрібна інструкція для нових платформ. Загалом задоволений.
                                </p>
                                <p className="author">Софія Р.</p>
                            </div>
                            <div className="testimonial-card">
                                <div className="stars">★★★★★</div>
                                <p className="testimonial-text">
                                    Суперсервіс! Завантаження з Instagram тепер займає лише кілька кліків.
                                </p>
                                <p className="author">Михайло Т.</p>
                            </div>
                            <div className="testimonial-card">
                                <div className="stars">★★★★</div>
                                <p className="testimonial-text">
                                    Хороший завантажувач, але іноді з’єднання з сервером повільне. В іншому все ок.
                                </p>
                                <p className="author">Олена Б.</p>
                            </div>
                            <div className="testimonial-card">
                                <div className="stars">★★★★★</div>
                                <p className="testimonial-text">
                                    Дуже зручно зберігати музику в MP3. Інтерфейс стильний і сучасний!
                                </p>
                                <p className="author">Артем В.</p>
                            </div>
                            <div className="testimonial-card">
                                <div className="stars">★★★★</div>
                                <p className="testimonial-text">
                                    Сервіс працює добре, але хотілося б підтримки більше платформ, наприклад, Dailymotion.
                                </p>
                                <p className="author">Юлія К.</p>
                            </div>
                            <div className="testimonial-card">
                                <div className="stars">★★★★★</div>
                                <p className="testimonial-text">
                                    Завантажую улюблені кліпи з TikTok без водяних знаків. Дуже задоволений!
                                </p>
                                <p className="author">Іван Д.</p>
                            </div>
                            <div className="testimonial-card">
                                <div className="stars">★★★★</div>
                                <p className="testimonial-text">
                                    Непоганий сервіс, але іноді потрібна повторна спроба для завантаження. Все одно зручно.
                                </p>
                                <p className="author">Катерина М.</p>
                            </div>
                            <div className="testimonial-card">
                                <div className="stars">★★★★★</div>
                                <p className="testimonial-text">
                                    Швидко, просто і якісно. Завантаження з YouTube ще ніколи не було таким легким!
                                </p>
                                <p className="author">Павло З.</p>
                            </div>
                            <div className="testimonial-card">
                                <div className="stars">★★★★</div>
                                <p className="testimonial-text">
                                    Зручний для музики, але хотілося б більше опцій для налаштування якості відео.
                                </p>
                                <p className="author">Наталія Г.</p>
                            </div>
                            <div className="testimonial-card">
                                <div className="stars">★★★★★</div>
                                <p className="testimonial-text">
                                    Ідеальний сервіс для збереження подкастів. Все працює як годинник!
                                </p>
                                <p className="author">Ростислав О.</p>
                            </div>
                            <div className="testimonial-card">
                                <div className="stars">★★★★</div>
                                <p className="testimonial-text">
                                    Дуже зручно, але іноді завантаження займає більше часу, ніж очікувалося.
                                </p>
                                <p className="author">Тетяна С.</p>
                            </div>
                            <div className="testimonial-card">
                                <div className="stars">★★★★★</div>
                                <p className="testimonial-text">
                                    Завантажую відео з Facebook без проблем. Сервіс вартий уваги!
                                </p>
                                <p className="author">Вадим П.</p>
                            </div>
                            <div className="testimonial-card">
                                <div className="stars">★★★★</div>
                                <p className="testimonial-text">
                                    Гарний сервіс, але хотілося б швидшої реакції на нові платформи.
                                </p>
                                <p className="author">Лілія В.</p>
                            </div>
                            <div className="testimonial-card">
                                <div className="stars">★★★★★</div>
                                <p className="testimonial-text">
                                    Найзручніший спосіб зберегти відео з Twitter. Рекомендую всім!
                                </p>
                                <p className="author">Олег Р.</p>
                            </div>
                            <div className="testimonial-card">
                                <div className="stars">★★★★</div>
                                <p className="testimonial-text">
                                    Сервіс хороший, але іноді потрібна допомога з інструкціями для нових користувачів.
                                </p>
                                <p className="author">Дарина К.</p>
                            </div>
                        </div>
                    </div>
                </section>
            </div>
        </div>
    );
}

export default AboutUs;