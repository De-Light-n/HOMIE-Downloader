import React, { useEffect } from "react";
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

  // Автоматичне перенаправлення, якщо користувач не авторизований
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

  // Приклад даних для графіків
  const monthlyData = [
    { name: "Week 1", videos: 12 },
    { name: "Week 2", videos: 19 },
    { name: "Week 3", videos: 30 },
    { name: "Week 4", videos: 25 },
  ];

  if (!currentUser) return null;

  return (
      <div className="account-page-container">
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
                <li className="active">Personal information</li>
                <li>Billing & Payments</li>
                <li>My Videos</li>
                <li>Subscriptions</li>
                <li>Watch Later</li>
                <li>Notifications</li>
                <li>Settings</li>
              </ul>
            </nav>
          </div>

          <section className="details-section">
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
          </section>
        </div>
      </div>
  );
};

export default AccountPage;