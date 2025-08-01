import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap-icons/font/bootstrap-icons.css";
import { Dropdown } from "bootstrap";

function SignUp() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    role: "student"  // Default role
  });

  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [theme, setTheme] = useState(localStorage.getItem("theme") || "light");
  const navigate = useNavigate();

  useEffect(() => {
    document.documentElement.setAttribute("data-bs-theme", theme);
    localStorage.setItem("theme", theme);

    // Initialize Bootstrap Dropdown
    setTimeout(() => {
      const dropdownElement = document.getElementById("bd-theme");
      if (dropdownElement) {
        new Dropdown(dropdownElement);
      }
    }, 100);
  }, [theme]);

  const handleThemeChange = (selectedTheme) => {
    setTheme(selectedTheme);
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value.trim() });
  };

  const handleSignUp = async (e) => {
    e.preventDefault();
    setError("");
    setSuccessMessage("");

    const { name, email, password, confirmPassword, role } = formData;

    if (!name || !email || !password || !confirmPassword) {
      setError("All fields are required!");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match!");
      return;
    }

    try {
      const response = await fetch("http://localhost:3001/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ name, email, password, confirmPassword, role }), // Included role
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error);

      setSuccessMessage("Registration Successful!");
      console.log("User Registered:", data.user);
      
      // Clear form after successful registration
      setFormData({ name: "", email: "", password: "", confirmPassword: "", role: "student" });

      // Redirect based on role
      if (data.user.role === "admin") {
        navigate("/dashboard");
      } else {
        navigate("/exam-selection");
      }

    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="container vh-100 d-flex justify-content-center align-items-center">
      <div className="card p-4 shadow-lg" style={{ width: "100%", maxWidth: "400px" }}>
        <form className="text-center" onSubmit={handleSignUp}>
          <img
            className="mb-4"
            src="https://getbootstrap.com/docs/5.3/assets/brand/bootstrap-logo.svg"
            alt="Bootstrap Logo"
            width="72"
            height="57"
          />
          <h1 className="h3 mb-3 fw-normal">Sign Up</h1>

          <div className="form-floating mb-2">
            <input
              type="text"
              className="form-control"
              placeholder="Full Name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
            />
            <label>Full Name</label>
          </div>

          <div className="form-floating mb-2">
            <input
              type="email"
              className="form-control"
              placeholder="Email address"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
            />
            <label>Email address</label>
          </div>

          <div className="form-floating mb-2 position-relative">
            <input
              type={showPassword ? "text" : "password"}
              className="form-control"
              placeholder="Password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
            />
            <label>Password</label>
            <button
              type="button"
              className="btn position-absolute end-0 top-50 translate-middle-y me-2"
              onClick={() => setShowPassword(!showPassword)}
              style={{ border: "none", background: "transparent" }}
            >
              <i className={`bi ${showPassword ? "bi-eye-slash" : "bi-eye"}`} style={{ fontSize: "1.2rem" }}></i>
            </button>
          </div>

          <div className="form-floating mb-2">
            <input
              type={showPassword ? "text" : "password"}
              className="form-control"
              placeholder="Confirm Password"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              required
            />
            <label>Confirm Password</label>
          </div>

          <div className="form-floating mb-2">
            <select className="form-control" name="role" value={formData.role} onChange={handleChange}>
              <option value="student">Student</option>
              <option value="admin">Admin</option>
            </select>
            <label>Select Role</label>
          </div>

          {error && <p className="text-danger">{error}</p>}
          {successMessage && <p className="text-success">{successMessage}</p>}

          <button className="btn btn-primary w-100 py-2 mt-2" type="submit">
            Sign Up
          </button>
        </form>
      </div>

      <div className="dropdown position-fixed bottom-0 end-0 mb-3 me-3">
        <button
          className="btn btn-bd-primary py-2 dropdown-toggle d-flex align-items-center"
          id="bd-theme"
          type="button"
          data-bs-toggle="dropdown"
          aria-expanded="false"
        >
          <i className={`bi bi-${theme === "dark" ? "moon-stars-fill" : theme === "auto" ? "circle-half" : "sun-fill"} theme-icon-active`}></i>
        </button>
        <ul className="dropdown-menu dropdown-menu-end shadow">
          <li>
            <button
              type="button"
              className={`dropdown-item d-flex align-items-center ${theme === "light" ? "active" : ""}`}
              onClick={() => handleThemeChange("light")}
            >
              <i className="bi bi-sun-fill me-2 opacity-50"></i> Light
            </button>
          </li>
          <li>
            <button
              type="button"
              className={`dropdown-item d-flex align-items-center ${theme === "dark" ? "active" : ""}`}
              onClick={() => handleThemeChange("dark")}
            >
              <i className="bi bi-moon-stars-fill me-2 opacity-50"></i> Dark
            </button>
          </li>
          <li>
            <button
              type="button"
              className={`dropdown-item d-flex align-items-center ${theme === "auto" ? "active" : ""}`}
              onClick={() => handleThemeChange("auto")}
            >
              <i className="bi bi-circle-half me-2 opacity-50"></i> Auto
            </button>
          </li>
        </ul>
      </div>
    </div>
  );
}

export default SignUp;