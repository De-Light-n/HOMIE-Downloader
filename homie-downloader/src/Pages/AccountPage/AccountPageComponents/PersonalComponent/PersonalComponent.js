import React, { useState, useEffect } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../../../../Components/Firebase/firebase";

import "./Analitics.css";

const getWeeklyCounts = (items) => {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const weeks = [0, 0, 0, 0];
  items.forEach((item) => {
    const date = new Date(item.timestamp);
    if (date >= startOfMonth && date <= now) {
      const week = Math.min(3, Math.floor((date.getDate() - 1) / 7));
      weeks[week]++;
    }
  });
  return [
    { name: "Week 1", count: weeks[0] },
    { name: "Week 2", count: weeks[1] },
    { name: "Week 3", count: weeks[2] },
    { name: "Week 4", count: weeks[3] },
  ];
};

const AnalyticsSection = ({ currentUser }) => {
  const [analytics, setAnalytics] = useState({
    timeSpent: 0,
    searches: [],
    downloads: [],
  });

  useEffect(() => {
    const fetchAnalytics = async () => {
      if (!currentUser) return;

      const analyticsRef = doc(db, "userAnalytics", currentUser.uid);
      const analyticsSnap = await getDoc(analyticsRef);

      if (analyticsSnap.exists()) {
        const data = analyticsSnap.data();
        setAnalytics({
          timeSpent: data.timeSpent || 0,
          searches: data.searches || [],
          downloads: data.downloads || [],
        });
      }
    };

    fetchAnalytics();
  }, [currentUser]);

  return (
    <div className="analytics-section">
      <div className="analytics-stats">
        <div className="time-spend-section">
          <h4>Total Time Spent</h4>
          <p className="stat-value">
            {Math.floor(analytics.timeSpent / 60)} minutes
          </p>
        </div>
        <div className="analytics-cards-row">
          <div className="analitics-card">
            <h4>Last Searches</h4>
            <ul>
              {analytics.searches
                .slice(-5)
                .reverse()
                .map((s, i) => (
                  <li key={i}>
                    {new Date(s.timestamp).toLocaleString()} — {s.query}
                  </li>
                ))}
            </ul>
          </div>
          <div className="analitics-card">
            <h4>Last Downloads</h4>
            <ul>
              {analytics.downloads
                .slice(-5)
                .reverse()
                .map((d, i) => (
                  <li key={i}>
                    {new Date(d.timestamp).toLocaleString()} — {d.videoTitle}
                  </li>
                ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

const PersonalComponent = ({ currentUser }) => {
  const [analytics, setAnalytics] = useState({
    timeSpent: 0,
    searches: [],
    downloads: [],
  });

  useEffect(() => {
    const fetchAnalytics = async () => {
      if (!currentUser) return;
      const analyticsRef = doc(db, "userAnalytics", currentUser.uid);
      const analyticsSnap = await getDoc(analyticsRef);
      if (analyticsSnap.exists()) {
        const data = analyticsSnap.data();
        setAnalytics({
          timeSpent: data.timeSpent || 0,
          searches: data.searches || [],
          downloads: data.downloads || [],
        });
      }
    };
    fetchAnalytics();
  }, [currentUser]);

  const weeklySearches = getWeeklyCounts(analytics.searches);
  const weeklyDownloads = getWeeklyCounts(analytics.downloads);

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
            {currentUser.displayName || "Not specified"}
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
      </div>

      <div className="stats-container">
        <div className="stats-section">
          <h3 className="stats-title">Your Activity</h3>

          <div className="stats-cards">
            <div className="stat-card">
              <h4>Search requests</h4>
              <p className="stat-value">{analytics.searches.length}</p>
              <div className="mini-chart">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={weeklySearches} barCategoryGap="15%">
                    <XAxis dataKey="name" hide />
                    <YAxis hide />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "var(--bg-secondary)",
                        borderColor: "var(--border-color)",
                      }}
                    />
                    <Bar
                      dataKey="count"
                      fill="var(--primary-color)"
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="stat-card">
              <h4>Download requests</h4>
              <p className="stat-value">{analytics.downloads.length}</p>
              <div className="mini-chart">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={weeklyDownloads} barCategoryGap="15%">
                    <XAxis dataKey="name" hide />
                    <YAxis hide />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "var(--bg-secondary)",
                        borderColor: "var(--border-color)",
                      }}
                    />
                    <Bar
                      dataKey="count"
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
                  data={[
                    {
                      name: "Week 1",
                      Searches: weeklySearches[0].count,
                      Downloads: weeklyDownloads[0].count,
                    },
                    {
                      name: "Week 2",
                      Searches: weeklySearches[1].count,
                      Downloads: weeklyDownloads[1].count,
                    },
                    {
                      name: "Week 3",
                      Searches: weeklySearches[2].count,
                      Downloads: weeklyDownloads[2].count,
                    },
                    {
                      name: "Week 4",
                      Searches: weeklySearches[3].count,
                      Downloads: weeklyDownloads[3].count,
                    },
                  ]}
                  margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                  barCategoryGap="15%"
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke="var(--border-color)"
                  />
                  <XAxis dataKey="name" stroke="var(--text-secondary)" />
                  <YAxis stroke="var(--text-secondary)" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "var(--bg-secondary)",
                      borderColor: "var(--border-color)",
                    }}
                  />
                  <Bar
                    dataKey="Searches"
                    fill="var(--primary-color)"
                    radius={[4, 4, 0, 0]}
                  />
                  <Bar
                    dataKey="Downloads"
                    fill="var(--primary-dark)"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <AnalyticsSection currentUser={currentUser} />
        </div>
      </div>
    </>
  );
};

export default PersonalComponent;
