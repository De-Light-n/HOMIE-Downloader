import styles from './VideoRow.module.css';
import VideoCard from '../VideoCard/VideoCard';
import {FiChevronDown, FiChevronLeft, FiChevronRight} from 'react-icons/fi';
import { useRef, useState, useEffect } from 'react';
import { collection, getDocs, query, orderBy, limit, startAfter } from 'firebase/firestore';
import { db } from '../Firebase/firebase';

const VideoRow = ({ title, type, index }) => {
    const rowRef = useRef(null);
    const [showLeftArrow, setShowLeftArrow] = useState(false);
    const [showRightArrow, setShowRightArrow] = useState(true);
    const [allVideos, setAllVideos] = useState([]); // Всі завантажені відео
    const [visibleVideos, setVisibleVideos] = useState([]); // Відео для відображення
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [lastVisibleDoc, setLastVisibleDoc] = useState(null);
    const [hasMore, setHasMore] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);

    // Завантажити початкові дані
    useEffect(() => {
        const fetchInitialData = async () => {
            try {
                let collectionRef;
                if (type === 'recent-searches') {
                    collectionRef = collection(db, 'searchHistory');
                } else if (type === 'recent-downloads') {
                    collectionRef = collection(db, 'downloadHistory');
                } else {
                    setLoading(false);
                    return;
                }

                const q = query(
                    collectionRef,
                    orderBy('timestamp', 'desc'),
                    limit(5)
                );
                const querySnapshot = await getDocs(q);

                const lastDoc = querySnapshot.docs[querySnapshot.docs.length - 1];
                setLastVisibleDoc(lastDoc);
                setHasMore(querySnapshot.docs.length === 5);

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
    }, [type]);

    // Обробка даних відео
    const processVideoData = async (querySnapshot) => {
        return await Promise.all(
            querySnapshot.docs.map(async (doc) => {
                const docData = doc.data();
                const isVideoUrl = docData.query?.includes('youtube.com') ||
                    docData.query?.includes('youtu.be') ||
                    docData.url?.includes('youtube.com') ||
                    docData.url?.includes('youtu.be');

                if (isVideoUrl) {
                    try {
                        const url = docData.query || docData.url;
                        const response = await fetch(`/api/video/preview?url=${encodeURIComponent(url)}`);
                        if (response.ok) {
                            const videoData = await response.json();
                            return {
                                id: doc.id,
                                ...docData,
                                videoTitle: videoData.title || docData.videoTitle || docData.query || docData.url,
                                videoThumbnail: videoData.thumbnail || docData.videoThumbnail || '',
                                channelName: videoData.channel || docData.channelName || 'YouTube',
                                date: docData.timestamp?.toDate()?.toLocaleDateString() || '',
                                views: videoData.views || '',
                                duration: videoData.duration || '',
                                description: videoData.description,
                                likes: videoData.likes,
                                qualities: videoData.qualities || ['720p'],
                                url: url
                            };
                        }
                    } catch (err) {
                        console.error("Помилка отримання даних відео:", err);
                    }
                }

                return {
                    id: doc.id,
                    ...docData,
                    videoTitle: docData.query || docData.videoTitle || docData.url,
                    videoThumbnail: docData.videoThumbnail || '',
                    channelName: docData.channelName || (type === 'recent-downloads' ? 'Channel' : 'Search'),
                    date: docData.timestamp?.toDate()?.toLocaleDateString() || '',
                    views: '',
                    duration: '',
                    qualities: ['720p'],
                    url: docData.query || docData.url || ''
                };
            })
        );
    };

    // Завантажити більше відео
    const loadMoreVideos = async () => {
        if (!lastVisibleDoc || !hasMore || loadingMore) return;

        setLoadingMore(true);
        try {
            let collectionRef;
            if (type === 'recent-searches') {
                collectionRef = collection(db, 'searchHistory');
            } else if (type === 'recent-downloads') {
                collectionRef = collection(db, 'downloadHistory');
            } else {
                return;
            }

            const q = query(
                collectionRef,
                orderBy('timestamp', 'desc'),
                startAfter(lastVisibleDoc),
                limit(5)
            );
            const querySnapshot = await getDocs(q);

            const lastDoc = querySnapshot.docs[querySnapshot.docs.length - 1];
            setLastVisibleDoc(lastDoc);
            setHasMore(querySnapshot.docs.length === 5);

            const newData = await processVideoData(querySnapshot);
            setAllVideos(prev => [...prev, ...newData]);
            setVisibleVideos(prev => [...prev, ...newData.slice(0, 5)]);
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
        container.scrollBy({left: scrollAmount, behavior: 'smooth'});

        setTimeout(() => {
            setShowLeftArrow(container.scrollLeft > 0);
            setShowRightArrow(
                container.scrollLeft < container.scrollWidth - container.clientWidth
            );
        }, 300);
    };

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
                    Помилка завантаження: {error}
                </div>
            </div>
        );
    }

    if (allVideos.length === 0) {
        return null;
    }

    return (
        <div className={styles.videoRowSection} style={{'--row-index': index}}>
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
                        <FiChevronLeft size={24}/>
                    </button>
                    <button
                        className={`${styles.arrowButton} ${!showRightArrow && styles.hidden}`}
                        onClick={() => scrollHandler('right')}
                    >
                        <FiChevronRight size={24}/>
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
                                    url: item.url
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
                            <span>Завантаження...</span>
                        ) : (
                            <>
                                <span>Показати більше</span>
                                <FiChevronDown className={styles.loadMoreIcon}/>
                            </>
                        )}
                    </button>
                )}
            </div>
        </div>
    );
}

export default VideoRow;