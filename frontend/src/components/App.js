import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import SignIn from "./signin";
import SignUp from "./signup";
import Dashboard from "./Dashboard";
import ExamPage from "./ExamPage";
import ExamSelection from "./ExamSelection";
import Guideline from "./Guideline";
import ResultsPage from "./ResultsPage";
import HomePage from "./HomePage";

import "../styles.css";

function App() {
  const [studentName, setStudentName] = useState("");
  const [studentEmail, setStudentEmail] = useState("");
  const [testName, setTestName] = useState("");

  // Initialize user details from localStorage (or fetch dynamically)
  useEffect(() => {
    const storedName = localStorage.getItem("studentName");
    const storedEmail = localStorage.getItem("studentEmail");
    const storedTestName = localStorage.getItem("testName");

    if (storedName) setStudentName(storedName);
    if (storedEmail) setStudentEmail(storedEmail);
    if (storedTestName) setTestName(storedTestName);
  }, []);

  return (
    <Router>
      <div>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<SignIn />} />
          <Route path="/register" element={<SignUp />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route
            path="/exam-selection"
            element={
              <ExamSelection
                studentName={studentName}
                setStudentName={setStudentName}
                studentEmail={studentEmail}
                setStudentEmail={setStudentEmail}
                setTestName={setTestName}
              />
            }
          />
          <Route
            path="/guideline/:examId"
            element={
              <Guideline
                studentName={studentName}
                studentEmail={studentEmail}
                testName={testName}
              />
            }
          />
          <Route
            path="/start-exam/:examId"
            element={
              <ExamPage
                studentName={studentName}
                studentEmail={studentEmail}
                testName={testName}
              />
            }
          />
          <Route path="/results" element={<ResultsPage />} />
          <Route path="*" element={<h1>404 Not Found</h1>} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
