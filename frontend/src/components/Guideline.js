import React from "react";
import { useParams, useNavigate } from "react-router-dom";

const Guideline = () => {
  const { examId } = useParams();
  const navigate = useNavigate();

  const handleStartTest = () => {
    // Navigate to the exam page
    navigate(`/start-exam/${examId}`);
  };

  return (
    <div className="container mt-5">
      <h1>Exam Guidelines</h1>
      <div className="card mt-4">
        <div className="card-body">
          <h2>Read the following guidelines carefully before starting the test:</h2>
          <ul>
            <li>Ensure a stable internet connection throughout the test.</li>
            <li>Do not refresh or close the browser window during the test.</li>
            <li>Avoid any suspicious activities as the test is monitored.</li>
            <li>Read all questions carefully before answering.</li>
            <li>Manage your time efficiently and keep an eye on the timer.</li>
          </ul>
          <button className="btn btn-primary mt-4" onClick={handleStartTest}>
            Start Test
          </button>
        </div>
      </div>
    </div>
  );
};

export default Guideline;