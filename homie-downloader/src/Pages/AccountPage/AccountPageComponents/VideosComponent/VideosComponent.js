import React from "react";

const userVideos = [
  { id: 1, title: "How to build a React app", views: 1250, date: "2023-05-15", duration: "12:34" },
  { id: 2, title: "CSS Animations Tutorial", views: 890, date: "2023-06-22", duration: "08:45" },
  { id: 3, title: "JavaScript ES6 Features", views: 2100, date: "2023-07-10", duration: "15:20" },
  { id: 4, title: "Node.js Crash Course", views: 750, date: "2023-08-05", duration: "22:10" },
];

const VideosComponent = () => {
  return (
    <>
      <div className="details-header">
        <h2>My Videos</h2>
        <p className="section-description">
          Your uploaded videos and their statistics
        </p>
      </div>

      <div className="stats-container">
        <div className="stats-section">
          <div className="stats-cards">
            <div className="stat-card">
              <h4>Total Videos</h4>
              <p className="stat-value">{userVideos.length}</p>
            </div>
            <div className="stat-card">
              <h4>Total Views</h4>
              <p className="stat-value">
                {userVideos.reduce((sum, video) => sum + video.views, 0).toLocaleString()}
              </p>
            </div>
          </div>

          <div className="videos-list-container">
            <h3 className="stats-title">Your Videos</h3>
            <div className="videos-list">
              {userVideos.map(video => (
                <div key={video.id} className="video-item">
                  <div className="video-thumbnail">
                    Thumbnail
                  </div>
                  <div className="video-info">
                    <h4 className="video-title">{video.title}</h4>
                    <div className="video-meta">
                      <p className="video-views">{video.views.toLocaleString()} views</p>
                      <p className="video-date">{video.date}</p>
                      <p className="video-duration">{video.duration}</p>
                    </div>
                  </div>
                  <button className="video-edit-btn">
                    Edit
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default VideosComponent;