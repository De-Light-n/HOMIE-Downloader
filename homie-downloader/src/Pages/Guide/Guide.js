import React, { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import './Guide.css';


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
            <div className="background-animation-container">
                <div className="floating-element orb1" style={{ '--base-opacity': '0.2' }}></div>
                <div className="floating-element orb2" style={{ '--base-opacity': '0.15' }}></div>
                <div className="floating-element orb3" style={{ '--base-opacity': '0.12' }}></div>
            </div>
            <div className="guide-content">
                <section id="how-to-use" className="guide-section">
                    <h2 className="section-title">How to use the service</h2>
                    <div className="text-holder">
                        <h3>Downloading videos</h3>
                        <p>
                            1. Copy the video link from the platform (YouTube, TikTok, etc.).<br/>
                            2. Paste the link into the download field on the main page.<br/>
                            3. Select the format (1080p,720p ,...) and click "Download".<br/>
                            4. Wait a few seconds, and your video will be ready!
                        </p>
                    </div>
                    <div className="text-holder">
                        <h3>Downloading music in MP3</h3>
                        <p>
                            1. Copy the link to the audio or video (e.g., from SoundCloud or YouTube).<br/>
                            2. Paste it into the download field.<br/>
                            3. Select audio format and click "Download".<br/>
                            4. Get a high-quality MP3 file in an instant!
                        </p>
                    </div>
                </section>

                <section id="platforms" className="guide-section">
                    <h2 className="section-title">Supported platforms</h2>
                    <div className="features-list">
                        <div className="feature-item">
                            <h3>YouTube and TikTok</h3>
                            <p>Download videos and music from YouTube and TikTok without watermarks in high quality.</p>
                        </div>
                        <div className="feature-item">
                            <h3>SoundCloud and others</h3>
                            <p>We support SoundCloud, Vimeo, Instagram, Facebook, and many other platforms.</p>
                        </div>
                    </div>
                </section>

                <section id="faq" className="guide-section">
                    <h2 className="section-title">FAQ</h2>
                    <div className="faq-list">
                        <div className="faq-item">
                            <h3>Is it legal to download videos?</h3>
                            <p>Downloading is allowed for personal use if the content is not protected by copyright. Make sure you have permission.</p>
                        </div>
                        <div className="faq-item">
                            <h3>Why does downloading sometimes take a long time?</h3>
                            <p>It depends on the file size and your internet speed. We optimize the process, but large files take time.</p>
                        </div>
                        <div className="faq-item">
                            <h3>Is registration required?</h3>
                            <p>No, our service works without registration, but authorization gives access to download history and cool themes.</p>
                        </div>
                        <div className="faq-item">
                            <h3>What formats are supported?</h3>
                            <p>Video: 1080p, 720p,... Audio: MP3, MP4</p>
                        </div>
                    </div>
                </section>
            </div>
        </div>
    );
}

export default Guide;