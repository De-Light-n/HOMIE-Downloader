import React from "react";
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
  const monthlyData = [
    { name: "Week 1", songs: 120 },
    { name: "Week 2", songs: 190 },
    { name: "Week 3", songs: 300 },
    { name: "Week 4", songs: 250 },
  ];
  return (
    <div className="account-page-container">
      <header className="account-header">
        <h1>Account</h1>
        <button className="sign-out-btn">Sign out</button>
      </header>

      <div className="divider"></div>

      <div className="account-content">
        {/* Ліва колонка */}
        <div className="left-column">
          <section className="personal-info-section">
            <div className="avatar-section">
              <div className="avatar-container">
                <div className="avatar-placeholder"></div>
                <div className="user-status"></div>
              </div>
              <div className="avatar-info">
                <h3 className="user-name">Irakli talavadze</h3>
                <p className="user-email">ikakodesign@gmail.com</p>
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

        {/* Права колонка */}
        <section className="details-section">
          <div className="details-header">
            <h2>Personal information</h2>
            <p className="section-description">
              Manage your personal information, including phone numbers and
              email address where you can be contacted
            </p>
          </div>

          <div className="details-content">
            <div className="detail-item">
              <div className="detail-item-header">
                <h4>Name</h4>
                <svg
                  className="detail-icon"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM12 20C7.59 20 4 16.41 4 12C4 7.59 7.59 4 12 4C16.41 4 20 7.59 20 12C20 16.41 16.41 20 12 20Z"
                    fill="#666"
                  />
                  <path d="M11 7H13V9H11V7ZM11 11H13V17H11V11Z" fill="#666" />
                </svg>
              </div>
              <p className="detail-value">irakli talavadze</p>
            </div>

            <div className="detail-item">
              <div className="detail-item-header">
                <h4>Name</h4>
                <svg
                  className="detail-icon"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM12 20C7.59 20 4 16.41 4 12C4 7.59 7.59 4 12 4C16.41 4 20 7.59 20 12C20 16.41 16.41 20 12 20Z"
                    fill="#666"
                  />
                  <path d="M11 7H13V9H11V7ZM11 11H13V17H11V11Z" fill="#666" />
                </svg>
              </div>
              <p className="detail-value">irakli talavadze</p>
            </div>

            <div className="detail-item">
              <div className="detail-item-header">
                <h4>Name</h4>
                <svg
                  className="detail-icon"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM12 20C7.59 20 4 16.41 4 12C4 7.59 7.59 4 12 4C16.41 4 20 7.59 20 12C20 16.41 16.41 20 12 20Z"
                    fill="#666"
                  />
                  <path d="M11 7H13V9H11V7ZM11 11H13V17H11V11Z" fill="#666" />
                </svg>
              </div>
              <p className="detail-value">irakli talavadze</p>
            </div>

            <div className="detail-item">
              <div className="detail-item-header">
                <h4>Name</h4>
                <svg
                  className="detail-icon"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM12 20C7.59 20 4 16.41 4 12C4 7.59 7.59 4 12 4C16.41 4 20 7.59 20 12C20 16.41 16.41 20 12 20Z"
                    fill="#666"
                  />
                  <path d="M11 7H13V9H11V7ZM11 11H13V17H11V11Z" fill="#666" />
                </svg>
              </div>
              <p className="detail-value">irakli talavadze</p>
            </div>
          </div>
          <div className="stats-container">
            <div className="stats-section">
              <h3 className="stats-title">Listening Activity</h3>

              <div className="stats-cards">
                <div className="stat-card">
                  <h4>Songs Played</h4>
                  <p className="stat-value">1,248</p>
                  <div className="mini-chart">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={monthlyData.slice(0, 2)}>
                        <Bar
                          dataKey="songs"
                          fill="#ff6d00"
                          radius={[4, 4, 0, 0]}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="stat-card">
                  <h4>Hours Listened</h4>
                  <p className="stat-value">87.5</p>
                  <div className="mini-chart">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={monthlyData.slice(2, 4)}>
                        <Bar
                          dataKey="songs"
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
                        dataKey="songs"
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
