import React, { useEffect, useState } from "react";
import "../styles.css";

function HomePage() {
  const [darkMode, setDarkMode] = useState(false);

  const toggleDarkMode = () => {
    document.body.classList.toggle("dark-mode");
    setDarkMode(!darkMode);
  };

  useEffect(() => {
    const handleScroll = () => {
      const sections = document.querySelectorAll(
        ".features-section, .how-it-works-section, .use-cases-section, .faq-section, .contact-section"
      );
      sections.forEach((section) => {
        const rect = section.getBoundingClientRect();
        if (rect.top < window.innerHeight - 100) {
          section.classList.add("section-visible");
        }
      });
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const toggleAnswer = (e) => {
    const answer = e.currentTarget.nextElementSibling;
    const arrow = e.currentTarget.querySelector(".arrow");
    if (answer.style.display === "block") {
      answer.style.display = "none";
      arrow.style.transform = "rotate(0deg)";
    } else {
      answer.style.display = "block";
      arrow.style.transform = "rotate(180deg)";
    }
  };

  return (
    <>
     <header className="hero-section">
  <nav className="navbar">
    <div className="logo">HoneSta</div>
    <ul className="nav-links">
      <li><a href="#features">Features</a></li>
      <li><a href="#how-it-works">How It Works</a></li>
      <li><a href="#use-cases">Use Cases</a></li>
      <li><a href="#faq">FAQs</a></li>
      <li><a href="#contact">Contact</a></li>
      <li><a href="/login" className="login-btn">Login</a></li>
      <li><a href="/register" className="signup-btn">Sign Up</a></li>
    </ul>
  </nav>
  <div className="hero-content" style={{ height: "100vh", display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center" }}>
    <h1>Integrity in Every Click, Confidence in Every Step.</h1>
    <p>A scalable, privacy-focused proctoring system designed for all institutions.</p>
    <button className="cta-button" fdprocessedid="17vwa" onClick={() => window.location.href = "/register"}>Get Started</button>
  </div>
</header>


<section id="features" className="features-section">
  <h2>Key Features</h2>
  <div className="features-grid">
    <div className="feature-item">
     
      <h3>Behavioral Monitoring</h3>
      <p>Detect suspicious activities through mouse movements, keystrokes, and window shifts.</p>
    </div>
    <div className="feature-item">
      
      <h3>Dynamic Risk Scoring</h3>
      <p>Real-time analytics calculate and adjust risk scores based on user behavior.</p>
    </div>
    <div className="feature-item">

      <h3>Privacy-First Design</h3>
      <p>GDPR and FERPA compliant—ensures no video or audio invasion during assessments.</p>
    </div>
    <div className="feature-item">
      
      <h3>Automated Alerts</h3>
      <p>Proactive notifications ensure timely interventions during flagged activities.</p>
    </div>
  </div>
</section>

      <div className="divider"></div>

      <section id="how-it-works" className="how-it-works-section">
        <h2>How It Works</h2>
        <div className="steps-grid">
          <div className="step-item">
            <h3>Step 1: Sign Up</h3>
            <p>Securely create your account as an admin, proctor, or candidate.</p>
          </div>
          <div className="step-item">
            <h3>Step 2: Configure Tests</h3>
            <p>Admins can set up rules, schedules, and proctoring settings for assessments.</p>
          </div>
          <div className="step-item">
            <h3>Step 3: Take the Test</h3>
            <p>Candidates participate in an assessment with non-intrusive monitoring.</p>
          </div>
          <div className="step-item">
            <h3>Step 4: Analyze Results</h3>
            <p>Review risk scores and detailed activity logs to ensure academic integrity.</p>
          </div>
        </div>
      </section>

      <div className="divider"></div>

      <section id="use-cases" className="use-cases-section">
        <h2>Who Can Use HoneSta?</h2>
        <div className="use-cases-grid">
          <div className="use-case-item">
            <h3>Universities</h3>
            <p>Secure online exams for students with scalable features and non-intrusive monitoring.</p>
          </div>
          <div className="use-case-item">
            <h3>Corporates</h3>
            <p>Conduct professional certifications and training evaluations with enhanced integrity.</p>
          </div>
          <div className="use-case-item">
            <h3>Testing Agencies</h3>
            <p>Deploy risk-based monitoring for large-scale examination processes globally.</p>
          </div>
        </div>
      </section>

      <div className="divider"></div>

      <section id="faq" className="faq-section">
        <h2>Frequently Asked Questions</h2>
        <div className="faq-item">
          <h3 onClick={toggleAnswer}>
            How does ProctorSecure ensure privacy? <span className="arrow">▼</span>
          </h3>
          <p className="answer">ProctorSecure avoids intrusive practices like video/audio recordings and complies with global privacy laws.</p>
        </div>
        <div className="faq-item">
          <h3 onClick={toggleAnswer}>
            Can ProctorSecure scale for large exams? <span className="arrow">▼</span>
          </h3>
          <p className="answer">Yes, the system is designed to handle thousands of concurrent users seamlessly.</p>
        </div>
        <div className="faq-item">
          <h3 onClick={toggleAnswer}>
            What happens if suspicious activity is flagged? <span className="arrow">▼</span>
          </h3>
          <p className="answer">The system sends real-time alerts to proctors/admins for immediate action.</p>
        </div>
      </section>

      <div className="divider"></div>

      <section id="contact" className="contact-section">
        <h2>Contact Us</h2>
        <form action="submit.html" method="POST">
          <div className="form-group">
            <input type="text" id="name" name="name" placeholder="Your Name" required />
          </div>
          <div className="form-group">
            <input type="email" id="email" name="email" placeholder="Your Email" required />
          </div>
          <div className="form-group">
            <textarea id="message" name="message" rows="4" placeholder="Your Message" required></textarea>
          </div>
          <button type="submit" className="cta-button">Submit</button>
        </form>
      </section>

      <footer className="footer-section">
        <p>&copy; 2025 HoneSta. All rights reserved.</p>
        <a href="privacy.html">Privacy Policy</a> | <a href="terms.html">Terms of Use</a>
      </footer>
    </>
  );
}

export default HomePage;