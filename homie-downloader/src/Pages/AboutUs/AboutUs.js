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
            <div className="about-us">
                <section className="intro-block">
                    <div className="about-header">
                        <h1 className="about-title">Про нас</h1>
                    </div>
                    <p className="text-holder">
                        Ми – команда розробників, які створюють зручний завантажувач для відео та пісень з різних платформ. Наш сервіс – це ваш помічник для збереження улюбленого контенту швидко та легко.
                    </p>
                </section>

                <section className="mission-block">
                    <h2 className="section-title">Наша місія</h2>
                    <p className="text-holder">
                        Ми прагнемо зробити завантаження медіа доступним для кожного. Наш сервіс допомагає користувачам зберігати відео та музику з популярних платформ без зайвих складнощів.
                    </p>
                </section>

                <section className="content-block">
                    <h2 className="section-title">Що пропонує наш сервіс</h2>
                    <div className="features-list">
                        <div className="feature-item">
                            <h3>Завантаження з різних платформ</h3>
                            <p>Підтримуємо YouTube, TikTok, SoundCloud та багато інших сервісів.</p>
                        </div>
                        <div className="feature-item">
                            <h3>Простота використання</h3>
                            <p>Інтуїтивний інтерфейс для швидкого завантаження без зайвих налаштувань.</p>
                        </div>
                        <div className="feature-item">
                            <h3>Висока якість контенту</h3>
                            <p>Зберігайте відео у високій роздільній здатності та музику у форматі MP3.</p>
                        </div>
                        <div className="feature-item">
                            <h3>Безкоштовний доступ</h3>
                            <p>Завантажуйте улюблені файли безкоштовно та без обмежень.</p>
                        </div>
                    </div>
                </section>

                <section className="team-block">
                    <h2 className="section-title">Наша команда</h2>
                    <div className="team-members">
                        <div className="team-member">
                            <img src={neonI} alt="Ігор - фронтенд розробник" className="team-member__image" />
                            <div className="team-member__content">
                                <h3>Ігор</h3>
                                <p className="team-member__role">Фронтенд розробник</p>
                                <p>
                                    Створюю зручний та привабливий інтерфейс, щоб користувачі могли легко завантажувати медіа з будь-якої платформи.
                                </p>
                            </div>
                        </div>
                        <div className="team-member">
                            <img src={neonN} alt="Назар - фулстек розробник" className="team-member__image" />
                            <div className="team-member__content">
                                <h3>Назар</h3>
                                <p className="team-member__role">Фулстек розробник</p>
                                <p>
                                    Розробляю серверну та клієнтську частини, забезпечуючи швидке та надійне завантаження відео та аудіо з різних платформ.
                                </p>
                            </div>
                        </div>
                        <div className="team-member">
                            <img src={neonO} alt="Орест - фулстек розробник" className="team-member__image" />
                            <div className="team-member__content">
                                <h3>Орест</h3>
                                <p className="team-member__role">Фулстек розробник</p>
                                <p>
                                    Працюю над фронтендом і бекендом, створюючи цілісний та швидкий інтерфейс для комфортної роботи з нашим сервісом.
                                </p>
                            </div>
                        </div>
                        <div className="team-member">
                            <img src={neonY} alt="Ян - тестувальник" className="team-member__image" />
                            <div className="team-member__content">
                                <h3>Ян</h3>
                                <p className="team-member__role">Тестувальник</p>
                                <p>
                                    Перевіряю функціонал сервісу, щоб забезпечити стабільну роботу та бездоганний досвід користувача.
                                </p>
                            </div>
                        </div>
                        <div className="team-member">
                            <img src={neonR} alt="Руслан - аналітик" className="team-member__image" />
                            <div className="team-member__content">
                                <h3>Руслан</h3>
                                <p className="team-member__role">Аналітик</p>
                                <p>
                                    Аналізую потреби користувачів і оптимізую сервіс, щоб він відповідав вашим очікуванням і залишався зручним.
                                </p>
                            </div>
                        </div>
                    </div>
                </section>

                <section className="why-us-block">
                    <h2 className="section-title">Чому ми?</h2>
                    <p>
                        Ми не просто створюємо завантажувач – ми робимо його максимально зручним і ефективним! Кожна функція протестована, а кожен оновлення спрямоване на покращення вашого досвіду.
                    </p>
                </section>

                <section className="testimonials-section">
                    <h2 className="section-title">Відгуки, що надихають</h2>
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