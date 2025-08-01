import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap-icons/font/bootstrap-icons.css";

function SignIn() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [theme, setTheme] = useState(localStorage.getItem("theme") || "light");
  const navigate = useNavigate();

  // Apply selected theme to the document
  useEffect(() => {
    document.documentElement.setAttribute("data-bs-theme", theme);
    localStorage.setItem("theme", theme);
  }, [theme]);

  // Handle login logic
  const handleLogin = async (e) => {
    e.preventDefault(); // Prevent form reload
    setError(""); // Clear previous errors
    setLoading(true); // Show loading indicator

    try {
      const response = await fetch("http://localhost:3001/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include", // Include cookies for session
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Login failed. Please try again.");
      }

      if (!data.user || !data.user.role) {
        throw new Error("Invalid server response. Missing user information.");
      }

      console.log("Logged in user:", data.user);

      // Navigate based on role
      if (data.user.role === "admin") {
        navigate("/dashboard");
      } else if (data.user.role === "student") {
        navigate("/exam-selection");
      } else {
        throw new Error("Unknown user role. Please contact support.");
      }
    } catch (err) {
      console.error("Login error:", err.message);
      setError(err.message || "An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false); // Reset loading state
    }
  };

  // Handle theme toggle
  const toggleTheme = () => {
    setTheme((prevTheme) => (prevTheme === "light" ? "dark" : "light"));
  };

  return (
    <div className="container vh-100 d-flex justify-content-center align-items-center">
      <div className="card p-4 shadow-lg" style={{ width: "100%", maxWidth: "400px" }}>
        <form className="text-center" onSubmit={handleLogin}>
          <h1 className="h3 mb-3 fw-normal">Please sign in</h1>
          <div className="form-floating mb-2">
            <input
              type="email"
              className="form-control"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <label>Email address</label>
          </div>
          <div className="form-floating mb-2 position-relative">
            <input
              type={showPassword ? "text" : "password"}
              className="form-control"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
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
          {error && <p className="text-danger">{error}</p>}
          <button
            className="btn btn-primary w-100 py-2 mt-2"
            type="submit"
            disabled={loading}
          >
            {loading ? "Signing in..." : "Sign in"}
          </button>
        </form>
        <div className="text-center mt-3">
          <a
            href="http://localhost:3001/auth/google"
            className="btn btn-danger mt-2"
          >
            <i className="bi bi-google"></i> Sign in with Google
          </a>
          <button
            className="btn btn-outline-secondary mt-3"
            onClick={toggleTheme}
          >
            Switch to {theme === "light" ? "Dark" : "Light"} Mode
          </button>
        </div>
      </div>
    </div>
  );
}

export default SignIn;