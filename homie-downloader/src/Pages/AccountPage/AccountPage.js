import React, { useEffect, useState } from "react";
import { useAuth } from "../../Components/Firebase/AuthContext";
import { useNavigate } from "react-router-dom";
import "./AccountPage.css";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

const AccountPage = () => {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("personal");
  const [theme, setTheme] = useState("dark");

  useEffect(() => {
    if (!currentUser) {
      navigate('/');
    }
  }, [currentUser, navigate]);

  const handleSignOut = async () => {
    try {
      await logout();
      navigate('/');
    } catch (error) {
      console.error("Failed to log out", error);
    }
  };

  const monthlyData = [
    { name: "Week 1", videos: 12 },
    { name: "Week 2", videos: 19 },
    { name: "Week 3", videos: 30 },
    { name: "Week 4", videos: 25 },
  ];

  const userVideos = [
    { id: 1, title: "How to build a React app", views: 1250, date: "2023-05-15", duration: "12:34" },
    { id: 2, title: "CSS Animations Tutorial", views: 890, date: "2023-06-22", duration: "08:45" },
    { id: 3, title: "JavaScript ES6 Features", views: 2100, date: "2023-07-10", duration: "15:20" },
    { id: 4, title: "Node.js Crash Course", views: 750, date: "2023-08-05", duration: "22:10" },
  ];

  const payments = [
    { id: 1, date: "2023-01-15", amount: 9.99, method: "Visa ****4242", status: "Completed" },
    { id: 2, date: "2023-02-15", amount: 9.99, method: "Visa ****4242", status: "Completed" },
    { id: 3, date: "2023-03-15", amount: 9.99, method: "Mastercard ****5555", status: "Completed" },
  ];

  if (!currentUser) return null;

  const renderTabContent = () => {
    switch (activeTab) {
      case "personal":
        return (
            <>
              <div className="details-header">
                <h2>Personal information</h2>
                <p className="section-description">
                  Manage your personal information and activity
                </p>
              </div>

              <div className="details-content">
                <div className="detail-item">
                  <div className="detail-item-header">
                    <h4>Name</h4>
                  </div>
                  <p className="detail-value">
                    {currentUser.displayName || 'Not specified'}
                  </p>
                </div>

                <div className="detail-item">
                  <div className="detail-item-header">
                    <h4>Email</h4>
                  </div>
                  <p className="detail-value">{currentUser.email}</p>
                </div>

                <div className="detail-item">
                  <div className="detail-item-header">
                    <h4>Account Created</h4>
                  </div>
                  <p className="detail-value">
                    {new Date(
                        currentUser.metadata?.creationTime || Date.now()
                    ).toLocaleDateString()}
                  </p>
                </div>

                <div className="detail-item">
                  <div className="detail-item-header">
                    <h4>Last Login</h4>
                  </div>
                  <p className="detail-value">
                    {new Date(
                        currentUser.metadata?.lastSignInTime || Date.now()
                    ).toLocaleDateString()}
                  </p>
                </div>
              </div>

              <div className="stats-container">
                <div className="stats-section">
                  <h3 className="stats-title">Your Activity</h3>

                  <div className="stats-cards">
                    <div className="stat-card">
                      <h4>Videos Watched</h4>
                      <p className="stat-value">1,248</p>
                      <div className="mini-chart">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={monthlyData.slice(0, 2)}>
                            <Bar
                                dataKey="videos"
                                fill="#ff6d00"
                                radius={[4, 4, 0, 0]}
                            />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>

                    <div className="stat-card">
                      <h4>Hours Watched</h4>
                      <p className="stat-value">87.5</p>
                      <div className="mini-chart">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={monthlyData.slice(2, 4)}>
                            <Bar
                                dataKey="videos"
                                fill="#1a73e8"
                                radius={[4, 4, 0, 0]}
                            />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  </div>

                  <div className="monthly-chart-container">
                    <h4>Monthly Activity</h4>
                    <div className="chart-wrapper">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                            data={monthlyData}
                            margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" vertical={false} />
                          <XAxis dataKey="name" />
                          <YAxis />
                          <Tooltip />
                          <Bar
                              dataKey="videos"
                              fill="#ff6d00"
                              radius={[4, 4, 0, 0]}
                          />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>
              </div>
            </>
        );
      case "billing":
        return (
            <>
              <div className="details-header">
                <h2>Billing & Payments</h2>
                <p className="section-description">
                  Manage your subscription and payment methods
                </p>
              </div>

              <div className="details-content billing-content">
                <div className="detail-item full-width">
                  <div className="detail-item-header">
                    <h4>Subscription Plan</h4>
                  </div>
                  <div className="plan-info">
                    <p className="detail-value">Premium Monthly ($9.99/month)</p>
                    <button className="change-plan-btn">
                      Change Plan
                    </button>
                  </div>
                </div>

                <div className="detail-item">
                  <div className="detail-item-header">
                    <h4>Next Billing Date</h4>
                  </div>
                  <p className="detail-value">June 15, 2023</p>
                </div>

                <div className="detail-item">
                  <div className="detail-item-header">
                    <h4>Payment Method</h4>
                  </div>
                  <p className="detail-value">Visa ****4242</p>
                </div>
              </div>

              <div className="stats-container">
                <div className="stats-section">
                  <h3 className="stats-title">Payment History</h3>

                  <div className="payment-history">
                    {payments.map(payment => (
                        <div key={payment.id} className="payment-item">
                          <div className="payment-header">
                            <h4>{new Date(payment.date).toLocaleDateString()}</h4>
                            <span className="payment-status">{payment.status}</span>
                          </div>
                          <div className="payment-details">
                            <p className="detail-value">{payment.method}</p>
                            <p className="detail-value">${payment.amount}</p>
                          </div>
                        </div>
                    ))}
                  </div>
                </div>
              </div>
            </>
        );
      case "videos":
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
      case "themes":
        return (
            <>
              <div className="details-header">
                <h2>Themes</h2>
                <p className="section-description">
                  Customize your interface appearance
                </p>
              </div>

              <div className="details-content themes-content">
                <div
                    className={`theme-item ${theme === "dark" ? "active-theme" : ""}`}
                    onClick={() => setTheme("dark")}
                >
                  <div className="theme-header">
                    <h4>Dark Theme</h4>
                    {theme === "dark" && <span className="active-indicator">✓ Active</span>}
                  </div>
                  <p className="detail-value">
                    Default dark interface with neon accents
                  </p>
                </div>

                <div
                    className={`theme-item ${theme === "light" ? "active-theme" : ""}`}
                    onClick={() => setTheme("light")}
                >
                  <div className="theme-header">
                    <h4>Light Theme</h4>
                    {theme === "light" && <span className="active-indicator">✓ Active</span>}
                  </div>
                  <p className="detail-value">
                    Light interface with soft colors
                  </p>
                </div>

                <div
                    className={`theme-item ${theme === "amoled" ? "active-theme" : ""}`}
                    onClick={() => setTheme("amoled")}
                >
                  <div className="theme-header">
                    <h4>AMOLED Black</h4>
                    {theme === "amoled" && <span className="active-indicator">✓ Active</span>}
                  </div>
                  <p className="detail-value">
                    Pure black interface for AMOLED screens
                  </p>
                </div>
              </div>
            </>
        );
      case "subscriptions":
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
                      {[
                        { id: 1, name: "Tech Reviews", videos: 342, newVideos: 3, lastUpdate: "2 hours ago" },
                        { id: 2, name: "Coding Tutorials", videos: 156, newVideos: 2, lastUpdate: "5 hours ago" },
                        { id: 3, name: "Music Channel", videos: 89, newVideos: 1, lastUpdate: "1 day ago" },
                        { id: 4, name: "Gaming Channel", videos: 210, newVideos: 4, lastUpdate: "1 day ago" },
                      ].map(channel => (
                          <div key={channel.id} className="video-item">
                            <div className="video-thumbnail" style={{ backgroundColor: `#${Math.floor(Math.random()*16777215).toString(16)}` }}>
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
      case "watchlater":
        return (
            <>
              <div className="details-header">
                <h2>Watch Later</h2>
                <p className="section-description">
                  Videos you've saved to watch later
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
                      {[
                        { id: 1, title: "Advanced React Patterns", duration: "32:15", added: "3 days ago" },
                        { id: 2, title: "CSS Grid Masterclass", duration: "45:20", added: "1 week ago" },
                        { id: 3, title: "JavaScript Performance Tips", duration: "28:10", added: "2 weeks ago" },
                        { id: 4, title: "Building a REST API with Node", duration: "1:12:45", added: "3 weeks ago" },
                      ].map(video => (
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
      case "notifications":
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
                    {[
                      { id: 1, label: "New videos from subscriptions", enabled: true },
                      { id: 2, label: "Comments on your videos", enabled: true },
                      { id: 3, label: "Likes on your videos", enabled: false },
                      { id: 4, label: "System updates", enabled: true },
                      { id: 5, label: "Promotional offers", enabled: false },
                    ].map(item => (
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
                    {[
                      { id: 1, text: "Tech Reviews uploaded a new video", time: "2 hours ago", read: false },
                      { id: 2, text: "Your video got 15 new likes", time: "5 hours ago", read: true },
                      { id: 3, text: "Coding Tutorials is live now", time: "1 day ago", read: true },
                      { id: 4, text: "System maintenance scheduled", time: "2 days ago", read: false },
                    ].map(notification => (
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
      case "settings":
        return (
            <>
              <div className="details-header">
                <h2>Account Settings</h2>
                <p className="section-description">
                  Manage your account preferences and security
                </p>
              </div>

              <div className="details-content">
                <div className="detail-item">
                  <div className="detail-item-header">
                    <h4>Language</h4>
                  </div>
                  <select className="settings-select">
                    <option>English</option>
                    <option>Ukrainian</option>
                    <option>Spanish</option>
                    <option>French</option>
                  </select>
                </div>

                <div className="detail-item">
                  <div className="detail-item-header">
                    <h4>Video Quality</h4>
                  </div>
                  <select className="settings-select">
                    <option>Auto (Recommended)</option>
                    <option>1080p</option>
                    <option>720p</option>
                    <option>480p</option>
                  </select>
                </div>

                <div className="detail-item full-width">
                  <div className="detail-item-header">
                    <h4>Change Password</h4>
                  </div>
                  <div className="password-form">
                    <input type="password" placeholder="Current Password" className="settings-input" />
                    <input type="password" placeholder="New Password" className="settings-input" />
                    <input type="password" placeholder="Confirm New Password" className="settings-input" />
                    <button className="change-plan-btn update-btn">
                      Update Password
                    </button>
                  </div>
                </div>

                <div className="detail-item full-width">
                  <div className="detail-item-header">
                    <h4>Danger Zone</h4>
                  </div>
                  <div className="danger-zone">
                    <button className="danger-btn">
                      Delete Account
                    </button>
                    <p className="danger-warning">
                      Warning: This action cannot be undone. All your data will be permanently deleted.
                    </p>
                  </div>
                </div>
              </div>
            </>
        );
      default:
        return (
            <>
              <div className="details-header">
                <h2>{activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}</h2>
                <p className="section-description">
                  This section is under development
                </p>
              </div>
              <div className="detail-item coming-soon">
                <p className="detail-value">
                  We're working on this feature and it will be available soon.
                </p>
              </div>
            </>
        );
    }
  };

  return (
      <div className="account-page-container">
        <div className="neonBackground">
          <div className={`glowEffect purpleGlow`}></div>
          <div className={`glowEffect pinkGlow`}></div>
          <div className={`glowEffect blueGlow`}></div>
          <div className="gridOverlay"></div>
        </div>

        <div className="account-content-wrapper">
          <header className="account-header">
            <h1>My Account</h1>
            <button className="sign-out-btn" onClick={handleSignOut}>
              Sign out
            </button>
          </header>

          <div className="divider"></div>

          <div className="account-content">
            <div className="left-column">
              <section className="personal-info-section">
                <div className="avatar-section">
                  <div className="avatar-container">
                    {currentUser.photoURL ? (
                        <img
                            src={currentUser.photoURL}
                            alt={currentUser.displayName || 'User'}
                            className="avatar-placeholder"
                        />
                    ) : (
                        <div className="avatar-placeholder">
                          {currentUser.displayName?.charAt(0).toUpperCase() || 'U'}
                        </div>
                    )}
                    <div className="user-status"></div>
                  </div>
                  <div className="avatar-info">
                    <h3 className="user-name">{currentUser.displayName || 'User'}</h3>
                    <p className="user-email">{currentUser.email}</p>
                    <div className="user-status-label">Premium Member</div>
                  </div>
                </div>
              </section>

              <nav className="account-nav">
                <ul>
                  <li
                      className={activeTab === "personal" ? "active" : ""}
                      onClick={() => setActiveTab("personal")}
                  >
                    Personal information
                  </li>
                  <li
                      className={activeTab === "billing" ? "active" : ""}
                      onClick={() => setActiveTab("billing")}
                  >
                    Billing & Payments
                  </li>
                  <li
                      className={activeTab === "videos" ? "active" : ""}
                      onClick={() => setActiveTab("videos")}
                  >
                    My Videos
                  </li>
                  <li
                      className={activeTab === "subscriptions" ? "active" : ""}
                      onClick={() => setActiveTab("subscriptions")}
                  >
                    Subscriptions
                  </li>
                  <li
                      className={activeTab === "watchlater" ? "active" : ""}
                      onClick={() => setActiveTab("watchlater")}
                  >
                    Watch Later
                  </li>
                  <li
                      className={activeTab === "notifications" ? "active" : ""}
                      onClick={() => setActiveTab("notifications")}
                  >
                    Notifications
                  </li>
                  <li
                      className={activeTab === "themes" ? "active" : ""}
                      onClick={() => setActiveTab("themes")}
                  >
                    Themes
                  </li>
                  <li
                      className={activeTab === "settings" ? "active" : ""}
                      onClick={() => setActiveTab("settings")}
                  >
                    Settings
                  </li>
                </ul>
              </nav>
            </div>

            <section className="details-section">
              {renderTabContent()}
            </section>
          </div>
        </div>
      </div>
  );
};

export default AccountPage;