import React from "react";

const SettingsComponent = () => {
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
};

export default SettingsComponent;