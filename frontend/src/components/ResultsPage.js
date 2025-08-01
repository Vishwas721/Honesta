import React from "react";
import { useLocation, useNavigate } from "react-router-dom";

const Results = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { state } = location;
  const results = state?.results; // Access passed state from navigate()

  if (!results) {
    return (
      <div className="container mt-5">
        <h1>Exam Results</h1>
        <p>No results available. Please submit the exam again or contact support.</p>
        <button
          className="btn btn-primary mt-3"
          onClick={() => navigate("/exam-selection")}
        >
          Go to Exam Selection
        </button>
      </div>
    );
  }

  return (
    <div className="container mt-5">
      <h1>Exam Results</h1>
      <p>Your Score: {results.score}/{results.totalQuestions}</p>
      <p>Exam ID: {results.examId}</p>
      <p>Student ID: {results.studentId}</p>
      <button
        className="btn btn-primary mt-3"
        onClick={() => navigate("/exam-selection")}
      >
        Go to Exam Selection
      </button>
    </div>
  );
};

export default Results;