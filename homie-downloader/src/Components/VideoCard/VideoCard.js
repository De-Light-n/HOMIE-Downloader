import styles from './VideoCard.module.css';
import { FiEye, FiClock, FiMoreVertical } from 'react-icons/fi';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const VideoCard = ({ video }) => {
    const [isHovered, setIsHovered] = useState(false);
    const navigate = useNavigate();

    const handleClick = () => {
        navigate('/video/details', {
            state: {
                videoData: {
                    title: video.title,
                    description: video.description || 'No description available',
                    thumbnail: video.thumbnail,
                    likes: video.likes || 'N/A',
                    views: video.views || 'N/A',
                    duration: video.duration || 'N/A',
                    qualities: video.qualities || ['720p']
                },
                videoUrl: video.url || ''
            }
        });
    };

    return (
        <div
            className={styles.videoCard}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            onClick={handleClick}
            style={{ cursor: 'pointer' }}
        >
            <div className={styles.thumbnailContainer}>
                {video.thumbnail && (
                    <img
                        src={video.thumbnail}
                        alt={video.title}
                        className={styles.thumbnail}
                    />
                )}
                {video.duration && (
                    <span className={styles.duration}>{video.duration}</span>
                )}
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
                            {video.views && (
                                <span className={styles.views}>
                                    <FiEye size={14} /> {video.views}
                                </span>
                            )}
                            {video.date && (
                                <span className={styles.date}>{video.date}</span>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default VideoCard;