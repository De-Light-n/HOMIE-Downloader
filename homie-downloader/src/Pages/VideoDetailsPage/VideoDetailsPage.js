import { useLocation, useNavigate } from 'react-router-dom';
import { FiDownload, FiThumbsUp, FiEye, FiClock, FiArrowLeft } from 'react-icons/fi';
import styles from './VideoDetailsPage.module.css';
import { useState } from "react";
import '../../Styles/themes.css';

const VideoDetailsPage = () => {
    const { state } = useLocation();
    const navigate = useNavigate();
    const [selectedQuality, setSelectedQuality] = useState('720p');

    if (!state?.videoData) {
        return (
            <div className={styles.container}>
                <div className="neonBackground">
                    <div className={`glowEffect purpleGlow`}></div>
                    <div className={`glowEffect pinkGlow`}></div>
                    <div className={`glowEffect blueGlow`}></div>
                    <div className="gridOverlay"></div>
                </div>
                <p>No video data available. Please go back and try again.</p>
                <button onClick={() => navigate(-1)} className={styles.backButton}>
                    <FiArrowLeft /> Go Back
                </button>
            </div>
        );
    }

    const { videoData, videoUrl } = state;
    const { title, description, thumbnail, likes, views, duration, qualities } = videoData;

    const handleDownload = async () => {
        if (!videoUrl) return;
        try {
            const response = await fetch('https://homie-downloader-4.onrender.com/api/video/download', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    url: videoUrl,
                    quality: selectedQuality
                })
            });

            const data = await response.json();
            if (data.success && data.download_url) {
                const link = document.createElement('a');
                link.href = `http://127.0.0.1:5000${data.download_url}`;
                link.setAttribute('download', data.filename);
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
            } else {
                alert("Failed to download video");
            }
        } catch (error) {
            console.error("Error downloading video:", error);
        }
    };

    return (
        <div className={styles.wrapper}>
            <div className="neonBackground">
                <div className={`glowEffect purpleGlow`}></div>
                <div className={`glowEffect pinkGlow`}></div>
                <div className={`glowEffect blueGlow`}></div>
                <div className="gridOverlay"></div>
            </div>

            <div className={styles.container}>
                <button onClick={() => navigate(-1)} className={styles.backButton}>
                    <FiArrowLeft /> Back to Search
                </button>

                <div className={styles.contentWrapper}>
                    <div className={styles.mediaSection}>
                        <div className={styles.thumbnailContainer}>
                            <img src={thumbnail} alt={title} className={styles.thumbnail} />
                        </div>

                        <div className={styles.downloadSection}>
                            <h2 className={styles.downloadTitle}>Download Options</h2>
                            <div className={styles.downloadControls}>
                                <select
                                    value={selectedQuality}
                                    onChange={(e) => setSelectedQuality(e.target.value)}
                                    className={styles.qualitySelect}
                                >
                                    {qualities.map(quality => (
                                        <option key={quality} value={quality}>{quality}</option>
                                    ))}
                                </select>
                                <button
                                    onClick={handleDownload}
                                    className={styles.downloadButton}
                                >
                                    <FiDownload size={18} />
                                    <span>Download Video</span>
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className={styles.infoSection}>
                        <h1 className={styles.title}>{title}</h1>

                        <div className={styles.statsContainer}>
                            <div className={styles.statItem}>
                                <FiThumbsUp className={styles.statIcon} />
                                <span>{likes} likes</span>
                            </div>
                            <div className={styles.statItem}>
                                <FiEye className={styles.statIcon} />
                                <span>{views} views</span>
                            </div>
                            <div className={styles.statItem}>
                                <FiClock className={styles.statIcon} />
                                <span>{duration}</span>
                            </div>
                        </div>

                        <div className={styles.descriptionContainer}>
                            <h2 className={styles.descriptionTitle}>Description</h2>
                            <p className={styles.descriptionText}>{description}</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default VideoDetailsPage;