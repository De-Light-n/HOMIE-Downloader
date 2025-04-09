// VideoCard.js
import styles from './VideoCard.module.css';
import { FiEye, FiClock, FiMoreVertical } from 'react-icons/fi';
import { useState } from 'react';

const VideoCard = ({ video }) => {
    const [isHovered, setIsHovered] = useState(false);

    return (
        <div
            className={styles.videoCard}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            <div className={styles.thumbnailContainer}>
                <img
                    src={video.thumbnail}
                    alt={video.title}
                    className={styles.thumbnail}
                />
                {isHovered && (
                    <div className={styles.hoverOverlay}>
                        <div className={styles.hoverButtons}>
                            <button className={styles.watchLaterBtn}>
                                <FiClock size={18} />
                            </button>
                            <button className={styles.moreOptionsBtn}>
                                <FiMoreVertical size={18} />
                            </button>
                        </div>
                    </div>
                )}
                <span className={styles.duration}>{video.duration}</span>
            </div>

            <div className={styles.videoInfo}>
                <div className={styles.channelAvatar}>
                    {video.channel[0].toUpperCase()}
                </div>

                <div className={styles.infoContainer}>
                    <h3 className={styles.title}>{video.title}</h3>
                    <div className={styles.metaData}>
                        <p className={styles.channel}>{video.channel}</p>
                        <div className={styles.stats}>
                            <span className={styles.views}>
                                <FiEye size={14} /> {video.views}
                            </span>
                            <span className={styles.date}>{video.date}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default VideoCard;