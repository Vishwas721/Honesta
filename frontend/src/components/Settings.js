import React, { useState, useEffect } from "react";
import axios from "axios";

const Settings = () => {
  const [settings, setSettings] = useState({
    notificationEmail: "",
    language: "en",
    timeZone: "GMT",
  });
  const [profile, setProfile] = useState({
    name: "",
    email: "",
    password: "",
  });

  useEffect(() => {
    // Fetch settings from the backend
    axios.get("http://localhost:3001/settings", { withCredentials: true })
      .then(response => setSettings(response.data))
      .catch(error => console.error("Error fetching settings:", error));

    // Fetch profile information
    axios.get("http://localhost:3001/profile", { withCredentials: true })
      .then(response => setProfile(response.data.user))
      .catch(error => console.error("Error fetching profile information:", error));
  }, []);

  const handleUpdateSettings = async () => {
    try {
      // Send updated settings to the backend
      await axios.post("http://localhost:3001/settings", settings, { withCredentials: true });
      alert("Settings updated successfully");
    } catch (error) {
      console.error("Error updating settings:", error);
    }
  };

  const handleUpdateProfile = async () => {
    try {
      // Send updated profile information to the backend
      await axios.post("http://localhost:3001/update-profile", profile, { withCredentials: true });
      alert("Profile updated successfully");
    } catch (error) {
      console.error("Error updating profile:", error);
    }
  };

  const handleChangePassword = async () => {
    try {
      // Change password
      await axios.post("http://localhost:3001/change-password", { password: profile.password }, { withCredentials: true });
      alert("Password changed successfully");
    } catch (error) {
      console.error("Error changing password:", error);
    }
  };

  const handleDeleteAccount = async () => {
    try {
      // Delete account
      await axios.post("http://localhost:3001/delete-account", {}, { withCredentials: true });
      alert("Account deleted successfully");
      // Redirect to login page or home page
    } catch (error) {
      console.error("Error deleting account:", error);
    }
  };

  return (
    <div className="card">
      <div className="card-body">
        <h2 className="card-title mb-4">Admin Settings</h2>

        {/* Update Profile */}
        <div className="form-group">
          <label>Name</label>
          <input
            type="text"
            className="form-control"
            value={profile.name}
            onChange={(e) => setProfile({ ...profile, name: e.target.value })}
          />
        </div>
        <div className="form-group mt-4">
          <label>Email</label>
          <input
            type="email"
            className="form-control"
            value={profile.email}
            onChange={(e) => setProfile({ ...profile, email: e.target.value })}
          />
        </div>
        <button className="btn btn-primary mt-4" onClick={handleUpdateProfile}>
          Update Profile
        </button>

        {/* Change Password */}
        <div className="form-group mt-4">
          <label>New Password</label>
          <input
            type="password"
            className="form-control"
            value={profile.password}
            onChange={(e) => setProfile({ ...profile, password: e.target.value })}
          />
        </div>
        <button className="btn btn-primary mt-4" onClick={handleChangePassword}>
          Change Password
        </button>

        {/* Notification Email */}
        <div className="form-group mt-4">
          <label>Notification Email</label>
          <input
            type="email"
            className="form-control"
            value={settings.notificationEmail}
            onChange={(e) => setSettings({ ...settings, notificationEmail: e.target.value })}
          />
        </div>

        {/* Application Settings */}
        <div className="form-group mt-4">
          <label>Default Language</label>
          <select
            className="form-control"
            value={settings.language}
            onChange={(e) => setSettings({ ...settings, language: e.target.value })}
          >
            <option value="en">English</option>
            <option value="es">Spanish</option>
            <option value="fr">French</option>
          </select>
        </div>
        <div className="form-group mt-4">
          <label>Time Zone</label>
          <select
            className="form-control"
            value={settings.timeZone}
            onChange={(e) => setSettings({ ...settings, timeZone: e.target.value })}
          >
            <option value="GMT">GMT</option>
            <option value="PST">PST</option>
            <option value="EST">EST</option>
          </select>
        </div>

        <button className="btn btn-primary mt-4" onClick={handleUpdateSettings}>
          Update Settings
        </button>

        {/* Delete Account */}
        <button className="btn btn-danger mt-4" onClick={handleDeleteAccount}>
          Delete Account
        </button>
      </div>
    </div>
  );
};

export default Settings;