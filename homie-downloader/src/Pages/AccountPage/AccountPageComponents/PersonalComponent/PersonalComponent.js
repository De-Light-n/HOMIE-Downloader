import React from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

const monthlyData = [
  { name: "Week 1", videos: 12 },
  { name: "Week 2", videos: 19 },
  { name: "Week 3", videos: 30 },
  { name: "Week 4", videos: 25 },
];

const PersonalComponent = ({ currentUser }) => {
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
                      fill="var(--primary-color)"
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
                      fill="var(--primary-dark)"
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
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-color)" />
                  <XAxis dataKey="name" stroke="var(--text-secondary)" />
                  <YAxis stroke="var(--text-secondary)" />
                  <Tooltip contentStyle={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)' }} />
                  <Bar
                    dataKey="videos"
                    fill="var(--primary-color)"
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
};

export default PersonalComponent;