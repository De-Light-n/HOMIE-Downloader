import React from "react";

const WatchLaterComponent = () => {
  const watchLaterVideos = [
    { id: 1, title: "Advanced React Patterns", duration: "32:15", added: "3 days ago" },
    { id: 2, title: "CSS Grid Masterclass", duration: "45:20", added: "1 week ago" },
    { id: 3, title: "JavaScript Performance Tips", duration: "28:10", added: "2 weeks ago" },
    { id: 4, title: "Building a REST API with Node", duration: "1:12:45", added: "3 weeks ago" },
  ];

  return (
    <>
      <div className="details-header">
        <h2>Watch Later</h2>
        <p className="section-description">
          Videos you've savedktion to watch later
        </p>
      </div>

      <div className="stats-container">
        <div className="stats-section">
          <div className="stats-cards">
            <div className="stat-card">
              <h4>Videos in List</h4>
              <p className="stat-value">15</p>
            </div>
            <div className="stat-card">
              <h4>Total Duration</h4>
              <p className="stat-value">6h 45m</p>
            </div>
          </div>

          <div className="videos-list-container">
            <h3 className="stats-title">Your Watch Later List</h3>
            <div className="videos-list">
              {watchLaterVideos.map(video => (
                <div key={video.id} className="video-item">
                  <div className="video-thumbnail">
                    Thumbnail
                  </div>
                  <div className="video-info">
                    <h4 className="video-title">{video.title}</h4>
                    <div className="video-meta">
                      <p className="video-views">{video.duration}</p>
                      <p className="video-date">Added {video.added}</p>
                    </div>
                  </div>
                  <button className="video-edit-btn">
                    Remove
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

export default WatchLaterComponent;