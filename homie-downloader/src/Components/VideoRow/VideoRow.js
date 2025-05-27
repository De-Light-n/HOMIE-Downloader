import styles from './VideoRow.module.css';
import VideoCard from '../VideoCard/VideoCard';
import { FiChevronLeft, FiChevronRight } from 'react-icons/fi'; // FiChevronDown removed
import { useRef, useState, useEffect } from 'react';
import { collection, getDocs, query, orderBy, limit, startAfter, where } from 'firebase/firestore';
import { db } from '../Firebase/firebase';

const VideoRow = ({ title, type, index, category }) => {
    const rowRef = useRef(null);
    const [allVideos, setAllVideos] = useState([]);
    const [visibleVideos, setVisibleVideos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [lastVisibleDoc, setLastVisibleDoc] = useState(null);
    const [hasMore, setHasMore] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);

    const [isLeftScrollPossible, setIsLeftScrollPossible] = useState(false);
    const [isRightScrollPossible, setIsRightScrollPossible] = useState(true);

    // Функція для створення базового запиту з фільтруванням
    const createBaseQuery = (collectionRef) => {
        let baseQuery = query(
            collectionRef,
            orderBy('timestamp', 'desc')
        );

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
        const uniqueVideos = new Map();
        querySnapshot.docs.forEach(doc => {
            const docData = doc.data();
            const VideoName = docData.videoTitle; // Using videoTitle for initial uniqueness within a batch
            if (uniqueVideos.has(VideoName) && type !== 'recent-downloads' && type !== 'recent-searches') { // Allow duplicates for history-like types if needed, otherwise ensure unique by title
                // For history, same video could be actioned multiple times, but row usually shows unique videos
                // If strict uniqueness by title is always desired, remove conditional
            }

            uniqueVideos.set(VideoName, { // If titles can be non-unique, use doc.id as key
                id: doc.id,
                videoTitle: docData.videoTitle || '',
                videoThumbnail: docData.thumbnail || '',
                channelName: docData.userEmail ? docData.userEmail.split('@')[0] : 'YouTube',
                date: docData.timestamp?.toDate()?.toLocaleDateString() || '',
                views: docData.views || '',
                duration: docData.duration || '',
                description: docData.videoDescription || '',
                likes: docData.likes || '',
                qualities: ['720p'],
                url: docData.query || '',
                categories: docData.category ? [docData.category] : ['Other']
            });
        });
        return Array.from(uniqueVideos.values());
    };

    // Завантаження початкових даних
    useEffect(() => {
        const fetchInitialData = async () => {
            setLoading(true);
            setError(null);
            setLastVisibleDoc(null);
            setHasMore(true); // Assume more initially
            try {
                const collectionRef = getCollectionForType();
                if (!collectionRef) {
                    setLoading(false);
                    return;
                }

                let baseQuery = createBaseQuery(collectionRef);
                baseQuery = getAdditionalFilters(baseQuery);

                const q = query(baseQuery, limit(10));
                const querySnapshot = await getDocs(q);

                const lastDoc = querySnapshot.docs[querySnapshot.docs.length - 1];
                setLastVisibleDoc(lastDoc);
                setHasMore(querySnapshot.docs.length === 10);

                const data = await processVideoData(querySnapshot);
                setAllVideos(data);
                setVisibleVideos(data.slice(0, 5)); // Show first 5
            } catch (err) {
                console.error(`Помилка завантаження ${type}:`, err);
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchInitialData();
    }, [type, category]); // type and category are dependencies for re-fetching

    // Завантаження додаткових відео
    const loadMoreVideos = async () => {
        if (!lastVisibleDoc || !hasMore || loadingMore || loading) return;

        setLoadingMore(true);
        try {
            const collectionRef = getCollectionForType();
            if (!collectionRef) {
                setLoadingMore(false);
                return;
            }

            let baseQuery = createBaseQuery(collectionRef);
            baseQuery = getAdditionalFilters(baseQuery);

            const q = query(baseQuery, startAfter(lastVisibleDoc), limit(10));
            const querySnapshot = await getDocs(q);

            const lastDoc = querySnapshot.docs[querySnapshot.docs.length - 1];
            setLastVisibleDoc(lastDoc);
            setHasMore(querySnapshot.docs.length === 10);

            const newData = await processVideoData(querySnapshot);

            const existingVideoIds = new Set(allVideos.map(video => video.id)); // Use 'id' (doc.id) for uniqueness
            const uniqueNewVideos = newData.filter(video => !existingVideoIds.has(video.id));

            setAllVideos(prev => [...prev, ...uniqueNewVideos]);
            // Show the first few newly loaded videos automatically
            if (uniqueNewVideos.length > 0) {
                // Only add to visibleVideos if they were actually "shown" by showMore or this explicit load
                const currentlyVisibleCount = visibleVideos.length;
                const allLoadedCount = allVideos.length + uniqueNewVideos.length; // count before adding new
                // If all previously loaded videos were visible, then add new ones
                if(currentlyVisibleCount === allVideos.length) {
                    setVisibleVideos(prev => [...prev, ...uniqueNewVideos.slice(0, 5)]);
                }
            }

        } catch (err) {
            console.error("Помилка завантаження додаткових відео:", err);
            setError(err.message); // Optionally set error for load more
        } finally {
            setLoadingMore(false);
        }
    };

    // Показати більше вже завантажених відео
    const showMore = () => {
        const currentVisibleCount = visibleVideos.length;
        const nextVideos = allVideos.slice(currentVisibleCount, currentVisibleCount + 5);
        if (nextVideos.length > 0) {
            setVisibleVideos(prev => [...prev, ...nextVideos]);
        }
    };

    const updateArrowStates = () => {
        if (!rowRef.current) {
            setIsLeftScrollPossible(false);
            setIsRightScrollPossible(false); // Default to false if no ref
            return;
        }

        const container = rowRef.current;
        const canScrollPhysicallyLeft = container.scrollLeft > 0;
        setIsLeftScrollPossible(canScrollPhysicallyLeft);

        const canScrollPhysicallyRight = container.scrollLeft < (container.scrollWidth - container.clientWidth - 1); // -1 for precision
        const canShowMoreLoaded = visibleVideos.length < allVideos.length;
        const canLoadMoreFromBackend = hasMore && !loadingMore && !loading; // Ensure initial load is not happening

        setIsRightScrollPossible(canScrollPhysicallyRight || canShowMoreLoaded || canLoadMoreFromBackend);
    };

    // Update arrow states based on data changes and scroll position
    useEffect(() => {
        updateArrowStates();
        // Adding a listener for scroll events on the container to update arrows during manual scroll
        const container = rowRef.current;
        if (container) {
            container.addEventListener('scroll', updateArrowStates);
            // Call updateArrowStates after a short delay to ensure layout is stable
            const timer = setTimeout(updateArrowStates, 100);
            return () => {
                container.removeEventListener('scroll', updateArrowStates);
                clearTimeout(timer);
            };
        }
    }, [visibleVideos, allVideos, hasMore, loadingMore, loading]);


    // Обробка прокрутки та завантаження/показу нових відео
    const handleArrowClick = (direction) => {
        if (!rowRef.current) return;
        const container = rowRef.current;

        if (direction === 'left') {
            if (isLeftScrollPossible) {
                container.scrollBy({ left: -400, behavior: 'smooth' });
            }
        } else if (direction === 'right') {
            const canScrollPhysicallyRight = container.scrollLeft < (container.scrollWidth - container.clientWidth - 1);

            if (canScrollPhysicallyRight) {
                container.scrollBy({ left: 400, behavior: 'smooth' });
            } else {
                // At the end of physical scroll, try to show more or load more
                if (loading) return; // Don't do anything if initial load is in progress

                if (!loadingMore) {
                    if (visibleVideos.length < allVideos.length) {
                        showMore();
                    } else if (hasMore) {
                        loadMoreVideos();
                    }
                }
            }
        }
        // updateArrowStates will be called by scroll event or by useEffect after state changes
        // For immediate feedback after action that doesn't scroll (showMore, loadMore):
        setTimeout(updateArrowStates, 50); // Small delay for state updates to propagate
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
                    {loadingMore && <span className={styles.loadingMoreIndicator}> Loading...</span>}
                </h2>
                <div className={styles.controls}>
                    <button
                        className={styles.arrowButton}
                        onClick={() => handleArrowClick('left')}
                        disabled={!isLeftScrollPossible || loadingMore}
                        aria-label="Scroll left"
                    >
                        <FiChevronLeft size={24} />
                    </button>
                    <button
                        className={styles.arrowButton}
                        onClick={() => handleArrowClick('right')}
                        disabled={!isRightScrollPossible || loadingMore}
                        aria-label="Scroll right / Load more"
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
                                key={item.id} // Ensure unique key, doc.id is good
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
                {/* "Show more" button is removed */}
            </div>
        </div>
    );
};

export default VideoRow;