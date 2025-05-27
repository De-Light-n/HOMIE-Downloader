import React, { useEffect, useState } from "react";
import { useAuth } from "../../Components/Firebase/AuthContext";
import { useNavigate } from "react-router-dom";
import { useTheme } from "../../Components/ThemeContext";
import "./AccountPage.css";
import PersonalComponent from "./AccountPageComponents/PersonalComponent/PersonalComponent";
import BillingComponent from "./AccountPageComponents/BillingComponent/BillingComponent";
import ThemesComponent from "./AccountPageComponents/ThemesComponent/ThemesComponent";
import SettingsComponent from "./AccountPageComponents/SettingsComponent/SettingsComponent";

const AccountPage = () => {
  const { currentUser, logout } = useAuth();
  const { theme, themes, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("personal");

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

  const tabComponents = {
    personal: <PersonalComponent currentUser={currentUser} />,
    billing: <BillingComponent />,
    themes: <ThemesComponent theme={theme} themes={themes} toggleTheme={toggleTheme} />,
    settings: <SettingsComponent />,
  };

  if (!currentUser) return null;

  return (
    <div className="account-page-container">
      <div className="background-animation-container">
        <div className="floating-element orb1" style={{ '--base-opacity': '0.2' }}></div>
        <div className="floating-element orb2" style={{ '--base-opacity': '0.15' }}></div>
        <div className="floating-element orb3" style={{ '--base-opacity': '0.12' }}></div>
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
            {tabComponents[activeTab] || (
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
            )}
          </section>
        </div>
      </div>
    </div>
  );
};

export default AccountPage;