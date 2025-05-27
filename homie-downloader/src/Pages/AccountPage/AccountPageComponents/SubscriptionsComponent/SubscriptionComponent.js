import React from "react";

const SubscriptionsComponent = () => {
  const channels = [
    { id: 1, name: "Tech Reviews", videos: 342, newVideos: 3, lastUpdate: "2 hours ago" },
    { id: 2, name: "Coding Tutorials", videos: 156, newVideos: 2, lastUpdate: "5 hours ago" },
    { id: 3, name: "Music Channel", videos: 89, newVideos: 1, lastUpdate: "1 day ago" },
    { id: 4, name: "Gaming Channel", videos: 210, newVideos: 4, lastUpdate: "1 day ago" },
  ];

  return (
    <>
      <div className="details-header">
        <h2>Subscriptions</h2>
        <p className="section-description">
          Channels you're subscribed to
        </p>
      </div>

      <div className="stats-container">
        <div className="stats-section">
          <div className="stats-cards">
            <div className="stat-card">
              <h4>Total Subscriptions</h4>
              <p className="stat-value">24</p>
            </div>
            <div className="stat-card">
              <h4>New Videos This Week</h4>
              <p className="stat-value">18</p>
            </div>
          </div>

          <div className="videos-list-container">
            <h3 className="stats-title">Recently Updated Channels</h3>
            <div className="videos-list">
              {channels.map(channel => (
                <div key={channel.id} className="video-item">
                  <div className="video-thumbnail" style={{ backgroundColor: `var(--user-icon-bg)` }}>
                    {channel.name.charAt(0)}
                  </div>
                  <div className="video-info">
                    <h4 className="video-title">{channel.name}</h4>
                    <div className="video-meta">
                      <p className="video-views">{channel.videos} videos</p>
                      <p className="video-date">{channel.newVideos} new</p>
                      <p className="video-duration">{channel.lastUpdate}</p>
                    </div>
                  </div>
                  <button className="video-edit-btn">
                    Unsubscribe
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

export default SubscriptionsComponent;