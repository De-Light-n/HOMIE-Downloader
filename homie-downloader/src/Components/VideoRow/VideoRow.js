import styles from './VideoRow.module.css';
import VideoCard from '../VideoCard/VideoCard';
import { FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import { useRef, useState } from 'react';

const VideoRow = ({ title, videos }) => {
    const rowRef = useRef(null);
    const [showLeftArrow, setShowLeftArrow] = useState(false);
    const [showRightArrow, setShowRightArrow] = useState(true);

    const scrollHandler = (direction) => {
        const container = rowRef.current;
        const scrollAmount = direction === 'left' ? -400 : 400;
        container.scrollBy({ left: scrollAmount, behavior: 'smooth' });

        // Update arrow visibility after scroll
        setTimeout(() => {
            setShowLeftArrow(container.scrollLeft > 0);
            setShowRightArrow(
                container.scrollLeft < container.scrollWidth - container.clientWidth
            );
        }, 300);
    };

    return (
        <div className={styles.videoRowSection}>
            <div className={styles.header}>
                <h2 className={styles.sectionTitle}>
                    <span className={styles.titleDecorator}>#</span>
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

            <div className={styles.videoRowContainer} ref={rowRef}>
                <div className={styles.videoRow}>
                    {videos.map((video, index) => (
                        <VideoCard
                            key={`${video.id}-${index}`}
                            video={video}
                            index={index}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
};

export default VideoRow;