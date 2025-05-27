import React from "react";

const NotificationsComponent = () => {
  const notificationSettings = [
    { id: 1, label: "New videos from subscriptions", enabled: true },
    { id: 2, label: "Comments on your videos", enabled: true },
    { id: 3, label: "Likes on your videos", enabled: false },
    { id: 4, label: "System updates", enabled: true },
    { id: 5, label: "Promotional offers", enabled: false },
  ];

  const recentNotifications = [
    { id: 1, text: "Tech Reviews uploaded a new video", time: "2 hours ago", read: false },
    { id: 2, text: "Your video got 15 new likes", time: "5 hours ago", read: true },
    { id: 3, text: "Coding Tutorials is live now", time: "1 day ago", read: true },
    { id: 4, text: "System maintenance scheduled", time: "2 days ago", read: false },
  ];

  return (
    <>
      <div className="details-header">
        <h2>Notifications</h2>
        <p className="section-description">
          Manage your notification preferences
        </p>
      </div>

      <div className="details-content">
        <div className="detail-item full-width">
          <div className="detail-item-header">
            <h4>Notification Settings</h4>
          </div>
          <div className="notification-settings">
            {notificationSettings.map(item => (
              <div key={item.id} className="notification-item">
                <span className="detail-value">{item.label}</span>
                <label className="switch">
                  <input type="checkbox" defaultChecked={item.enabled} />
                  <span className="slider round"></span>
                </label>
              </div>
            ))}
          </div>
        </div>

        <div className="detail-item full-width">
          <div className="detail-item-header">
            <h4>Recent Notifications</h4>
          </div>
          <div className="notifications-list">
            {recentNotifications.map(notification => (
              <div key={notification.id} className={`notification ${notification.read ? 'read' : 'unread'}`}>
                <p className="notification-text">{notification.text}</p>
                <p className="notification-time">{notification.time}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
};

export default NotificationsComponent;