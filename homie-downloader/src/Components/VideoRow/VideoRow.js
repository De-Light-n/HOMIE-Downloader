import styles from './VideoRow.module.css';
import VideoCard from '../VideoCard/VideoCard';
import { FiChevronDown, FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import { useRef, useState, useEffect } from 'react';
import { collection, getDocs, query, orderBy, limit, startAfter, where } from 'firebase/firestore';
import { db } from '../Firebase/firebase';

const VideoRow = ({ title, type, index, category }) => {
    const rowRef = useRef(null);
    const [showLeftArrow, setShowLeftArrow] = useState(false);
    const [showRightArrow, setShowRightArrow] = useState(true);
    const [allVideos, setAllVideos] = useState([]);
    const [visibleVideos, setVisibleVideos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [lastVisibleDoc, setLastVisibleDoc] = useState(null);
    const [hasMore, setHasMore] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);

    // Функція для створення базового запиту з фільтруванням
    const createBaseQuery = (collectionRef) => {
        let baseQuery = query(
            collectionRef,
            orderBy('timestamp', 'desc')
        );

        // Фільтрувати за категорією, якщо вказано
        if (category) {
            baseQuery = query(
                baseQuery,
                where('category', '==', category)
            );
        }

        return baseQuery;
    };

    // Визначення колекції для запиту на основі типу
    const getCollectionForType = () => {
        return collection(db, 'userActions');
    };

    // Додаткові фільтри для різних типів запитів
    const getAdditionalFilters = (baseQuery) => {
        if (type === 'recent-searches') {
            return query(baseQuery, where('type', '==', 'preview'));
        } else if (type === 'recent-downloads') {
            return query(baseQuery, where('type', '==', 'download'));
        }
        return baseQuery;
    };

    // Обробка даних відео відповідно до структури Firebase
    const processVideoData = async (querySnapshot) => {
        // Створюємо мапу для відстеження унікальних відео
        const uniqueVideos = new Map();

        querySnapshot.docs.forEach(doc => {
            const docData = doc.data();
            const VideoName = docData.videoTitle;

            // Якщо це відео вже є в нашій мапі - пропускаємо
            if (uniqueVideos.has(VideoName)) return;

            uniqueVideos.set(VideoName, {
                id: doc.id,
                videoTitle: docData.videoTitle || '',
                videoThumbnail: docData.thumbnail || '',
                channelName: docData.userEmail ? docData.userEmail.split('@')[0] : 'YouTube',
                date: docData.timestamp?.toDate()?.toLocaleDateString() || '',
                views: docData.views || '',
                duration: docData.duration || '',
                description: docData.videoDescription || '',
                likes: docData.likes || '',
                qualities: ['720p'], // Якість за замовчуванням
                url: docData.query || '',
                categories: docData.category ? [docData.category] : ['Other']
            });
        });

        // Перетворюємо мапу назад у масив
        return Array.from(uniqueVideos.values());
    };

    // Завантаження початкових даних
    useEffect(() => {
        const fetchInitialData = async () => {
            try {
                const collectionRef = getCollectionForType();
                if (!collectionRef) {
                    setLoading(false);
                    return;
                }

                let baseQuery = createBaseQuery(collectionRef);
                baseQuery = getAdditionalFilters(baseQuery);

                const q = query(
                    baseQuery,
                    limit(10)
                );

                const querySnapshot = await getDocs(q);

                const lastDoc = querySnapshot.docs[querySnapshot.docs.length - 1];
                setLastVisibleDoc(lastDoc);
                setHasMore(querySnapshot.docs.length === 10);

                const data = await processVideoData(querySnapshot);
                setAllVideos(data);
                setVisibleVideos(data.slice(0, 5));
                setLoading(false);
            } catch (err) {
                console.error(`Помилка завантаження ${type}:`, err);
                setError(err.message);
                setLoading(false);
            }
        };

        fetchInitialData();
    }, [type, category]);

    // Завантаження додаткових відео
    const loadMoreVideos = async () => {
        if (!lastVisibleDoc || !hasMore || loadingMore) return;

        setLoadingMore(true);
        try {
            const collectionRef = getCollectionForType();
            if (!collectionRef) {
                setLoadingMore(false);
                return;
            }

            let baseQuery = createBaseQuery(collectionRef);
            baseQuery = getAdditionalFilters(baseQuery);

            const q = query(
                baseQuery,
                startAfter(lastVisibleDoc),
                limit(10)
            );

            const querySnapshot = await getDocs(q);

            const lastDoc = querySnapshot.docs[querySnapshot.docs.length - 1];
            setLastVisibleDoc(lastDoc);
            setHasMore(querySnapshot.docs.length === 10);

            const newData = await processVideoData(querySnapshot);

            // Перевіряємо на дублікати при додаванні нових відео
            const existingVideoIds = new Set(allVideos.map(video => video.videoId));
            const uniqueNewVideos = newData.filter(video => !existingVideoIds.has(video.videoId));

            setAllVideos(prev => [...prev, ...uniqueNewVideos]);
            setVisibleVideos(prev => [...prev, ...uniqueNewVideos.slice(0, 5)]);
        } catch (err) {
            console.error("Помилка завантаження додаткових відео:", err);
        } finally {
            setLoadingMore(false);
        }
    };

    // Показати більше вже завантажених відео
    const showMore = () => {
        const nextVideos = allVideos.slice(visibleVideos.length, visibleVideos.length + 5);
        setVisibleVideos(prev => [...prev, ...nextVideos]);
    };

    // Обробка прокрутки
    const scrollHandler = (direction) => {
        if (!rowRef.current) return;

        const container = rowRef.current;
        const scrollAmount = direction === 'left' ? -400 : 400;
        container.scrollBy({ left: scrollAmount, behavior: 'smooth' });

        setTimeout(() => {
            setShowLeftArrow(container.scrollLeft > 0);
            setShowRightArrow(
                container.scrollLeft < container.scrollWidth - container.clientWidth
            );
        }, 300);
    };

    // Оновлення стрілок прокрутки при початковому рендері
    useEffect(() => {
        if (rowRef.current) {
            const container = rowRef.current;
            setShowLeftArrow(container.scrollLeft > 0);
            setShowRightArrow(
                container.scrollWidth > container.clientWidth
            );
        }
    }, [visibleVideos]);

    if (loading && allVideos.length === 0) {
        return (
            <div className={styles.videoRowSection}>
                <div className={styles.header}>
                    <h2 className={styles.sectionTitle}>
                        <span className={styles.titleDecorator}></span>
                        {title}
                    </h2>
                </div>
                <div className={styles.videoRowContainer}>
                    <div className={styles.videoRow}>
                        {[...Array(5)].map((_, idx) => (
                            <div key={idx} className={styles.videoCardSkeleton}></div>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className={styles.videoRowSection}>
                <div className={styles.header}>
                    <h2 className={styles.sectionTitle}>
                        <span className={styles.titleDecorator}></span>
                        {title}
                    </h2>
                </div>
                <div className={styles.errorMessage}>
                    Download error: {error}
                </div>
            </div>
        );
    }

    if (allVideos.length === 0 && !loading) {
        return (
            <div className={styles.videoRowSection}>
                <div className={styles.header}>
                    <h2 className={styles.sectionTitle}>
                        <span className={styles.titleDecorator}></span>
                        {title}
                    </h2>
                </div>
                <div className={styles.emptyMessage}>
                    Video not found
                </div>
            </div>
        );
    }

    return (
        <div className={styles.videoRowSection} style={{ '--row-index': index }}>
            <div className={styles.header}>
                <h2 className={styles.sectionTitle}>
                    <span className={styles.titleDecorator}></span>
                    {title}
                </h2>
                <div className={styles.controls}>
                    <button
                        className={`${styles.arrowButton} ${!showLeftArrow && styles.hidden}`}
                        onClick={() => scrollHandler('left')}
                    >
                        <FiChevronLeft size={24} />
                    </button>
                    <button
                        className={`${styles.arrowButton} ${!showRightArrow && styles.hidden}`}
                        onClick={() => scrollHandler('right')}
                    >
                        <FiChevronRight size={24} />
                    </button>
                </div>
            </div>

            <div className={styles.videoRowWrapper}>
                <div className={styles.videoRowContainer} ref={rowRef}>
                    <div className={styles.videoRow}>
                        {visibleVideos.map((item) => (
                            <VideoCard
                                key={item.id}
                                video={{
                                    id: item.id,
                                    title: item.videoTitle,
                                    thumbnail: item.videoThumbnail,
                                    channel: item.channelName,
                                    views: item.views,
                                    duration: item.duration,
                                    date: item.date,
                                    description: item.description,
                                    likes: item.likes,
                                    qualities: item.qualities,
                                    url: item.url,
                                    categories: item.categories
                                }}
                            />
                        ))}
                    </div>
                </div>

                {(hasMore || visibleVideos.length < allVideos.length) && (
                    <button
                        onClick={visibleVideos.length < allVideos.length ? showMore : loadMoreVideos}
                        className={styles.loadMoreButton}
                        disabled={loadingMore}
                    >
                        {loadingMore ? (
                            <span>Downloading...</span>
                        ) : (
                            <>
                                <span>Show more</span>
                                <FiChevronDown className={styles.loadMoreIcon} />
                            </>
                        )}
                    </button>
                )}
            </div>
        </div>
    );
};

export default VideoRow;