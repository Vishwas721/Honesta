import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const ExamSelection = () => {
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchExams = async () => {
      try {
        // Make API call to fetch exams
        const response = await axios.get("http://localhost:3001/exams", { withCredentials: true });
        setExams(response.data.exams); // Store exams in state
      } catch (err) {
        // Check for specific error codes or fallback
        if (err.response) {
          if (err.response.status === 401) {
            setError("You are not authorized. Please log in first.");
          } else {
            setError(err.response.data.error || "Failed to load exams. Please try again later.");
          }
        } else {
          setError("Network error. Please check your connection and try again.");
        }

        console.error("Error fetching exams:", err.response?.data || err.message);
      } finally {
        // Ensure loading spinner is hidden
        setLoading(false);
      }
    };

    fetchExams();
  }, []); // Empty dependency array ensures this only runs on component mount

  const handleTakeExam = (examId) => {
    navigate(`/guideline/${examId}`);
  };

  const handleViewResults = (examId) => {
    navigate(`/results`, { state: { examId } });
  };

  if (loading) {
    return <p>Loading exams...</p>;
  }

  if (error) {
    return <p className="text-danger">{error}</p>;
  }

  return (
    <div className="container mt-5">
      <h1 className="mb-4">Available Exams</h1>
      {exams.map((exam) => (
        <div key={exam.id} className="card mb-3 p-3 shadow">
          <h5>{exam.name}</h5>
          <p>{exam.description}</p>

          {/* Handle different exam statuses */}
          {exam.blocked ? (
  <button className="btn btn-danger" disabled>
    You are blocked from this exam
  </button>
) : exam.completed ? (
  <button className="btn btn-secondary" onClick={() => handleViewResults(exam.id)}>
    View Results
  </button>
) : exam.attempted ? (
  <button className="btn btn-warning" disabled>
    Already Attempted
  </button>
) : (
  <button className="btn btn-primary" onClick={() => handleTakeExam(exam.id)}>
    Take Test
  </button>
)}




        </div>
      ))}
    </div>
  );
};

export default ExamSelection;