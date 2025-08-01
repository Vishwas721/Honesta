import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { io } from "socket.io-client";

const ExamPage = () => {
  const { examId } = useParams();
  const navigate = useNavigate();
  const [questions, setQuestions] = useState([]);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedOption, setSelectedOption] = useState(null);
  const [answers, setAnswers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [timer, setTimer] = useState(3600); // 1-hour timer
  const [warningMessage, setWarningMessage] = useState(null);
  const [socket, setSocket] = useState(null);

  const studentId = 1; // Replace with actual studentId from authentication

  // Initialize WebSocket connection
  useEffect(() => {
    const newSocket = io("http://localhost:3001");
    setSocket(newSocket);

    newSocket.on("connect", () => {
      console.log("Connected to WebSocket server:", newSocket.id);
    });

    newSocket.on("risk_warning", (data) => {
      setWarningMessage(data.message);
      setTimeout(() => setWarningMessage(null), 5000);
    });

    newSocket.on("lock_exam", (data) => {
      alert(data.message);
      navigate("/exam-selection");
    });

    return () => {
      newSocket.disconnect(); // Cleanup on unmount
    };
  }, [navigate]);

  // Emit events via WebSocket
  const emitEvent = (eventName, data) => {
    if (socket && examId && studentId) {
      socket.emit(eventName, { ...data, examId, studentId, timestamp: Date.now() });
    } else {
      console.error(`Failed to emit ${eventName}: Ensure socket, examId, and studentId are defined.`);
    }
  };

  // Fetch exam questions
  useEffect(() => {
    const fetchQuestions = async () => {
      try {
        const response = await axios.get(
          `http://localhost:3001/exams/${examId}/questions`,
          { withCredentials: true }
        );
        setQuestions(response.data.questions);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching questions:", error.response?.data || error.message);
        alert("Failed to load exam questions.");
        setLoading(false);
      }
    };

    fetchQuestions();
  }, [examId]);

  // Timer countdown
  useEffect(() => {
    const countdown = setInterval(() => {
      setTimer((prev) => {
        if (prev <= 1) {
          clearInterval(countdown);
          handleSubmitExam(); // Auto-submit exam when timer ends
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(countdown); // Cleanup
  }, []);

  // Monitor mouse movement
  useEffect(() => {
    const handleMouseMove = (e) => {
      emitEvent("mouse_activity", { x: e.clientX, y: e.clientY });
    };

    window.addEventListener("mousemove", handleMouseMove);

    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, [socket]);

  // Monitor keystroke activity
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (document.visibilityState === "visible") {
        emitEvent("keystroke_activity", { key: e.key });
      } else {
        console.warn("Keystroke detected outside exam tab");
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [socket]);

  // Monitor tab switching
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        emitEvent("tab_change", { action: "Tab switched" });
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [socket]);

  // Detect copy-paste actions
  useEffect(() => {
    const handleCopyPaste = (e) => {
      e.preventDefault();
      alert("Copy-paste is not allowed during the exam.");
      emitEvent("increase_risk_score", { action: "Copy-paste attempt detected" });
    };

    document.addEventListener("copy", handleCopyPaste);
    document.addEventListener("cut", handleCopyPaste);
    document.addEventListener("paste", handleCopyPaste);

    return () => {
      document.removeEventListener("copy", handleCopyPaste);
      document.removeEventListener("cut", handleCopyPaste);
      document.removeEventListener("paste", handleCopyPaste);
    };
  }, [socket]);

  // Detect split-screen activity
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < screen.width || window.innerHeight < screen.height) {
        emitEvent("split_screen", { action: "Split-screen detected" });
      }
    };

    window.addEventListener("resize", handleResize);

    return () => window.removeEventListener("resize", handleResize);
  }, [socket]);

  // Detect app switching
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        emitEvent("app_switch", { action: "App switch detected" });
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [socket]);

  // Detect screenshot attempts
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "PrintScreen") {
        e.preventDefault();
        navigator.clipboard.writeText(""); // Clear clipboard content
        emitEvent("screenshot_attempt", { action: "Screenshot attempt detected - PrintScreen" });
      }

      if (e.ctrlKey && e.shiftKey && e.key === "S") {
        e.preventDefault();
        emitEvent("screenshot_attempt", { action: "Screenshot attempt detected - Snipping Tool" });
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [socket]);

  const handleOptionChange = (option) => {
    console.log("Selected Option:", option);
    setSelectedOption(option);
    setAnswers((prev) => {
      const updatedAnswers = [...prev];
      updatedAnswers[currentQuestion] = {
        questionId: questions[currentQuestion]?.id,
        answer: option,
      };
      console.log("Updated Answers:", updatedAnswers);
      return updatedAnswers;
    });
  };

  const handleNextQuestion = () => {
    console.log("Current Question Before:", currentQuestion);
    console.log("Questions Length:", questions.length);

    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion((prev) => prev + 1); // Safely increment question index
      setSelectedOption(null); // Reset selected option
      console.log("Moving to Next Question:", currentQuestion + 1);
    } else {
      console.log("Submitting Exam...");
      handleSubmitExam(); // Trigger exam submission
    }
  };

  const handleSubmitExam = async () => {
    try {
      setLoading(true);

      if (answers.length !== questions.length) {
        alert("Please answer all questions before submitting.");
        setLoading(false);
        return;
      }

      const payload = {
        examId,
        studentId,
        answers,
      };

      const response = await axios.post("http://localhost:3001/submit-exam", payload, {
        withCredentials: true,
      });

      const results = response.data.results;
      alert(`Exam submitted successfully! Your score: ${results.score}/${results.totalQuestions}`);
      navigate("/results", { state: { results } });
    } catch (error) {
      console.error("Error submitting the exam:", error.response?.data || error.message);
      alert("Failed to submit the exam. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <p>Loading questions...</p>;
  }

  if (questions.length === 0) {
    return <p>No questions available for this exam.</p>;
  }

  const currentQ = questions[currentQuestion] || null; // Fallback to null if undefined

  return (
    <div className="container mt-5">
      {warningMessage && (
        <div className="alert alert-warning text-center" role="alert">
          {warningMessage}
        </div>
      )}

      <header className="d-flex justify-content-between align-items-center mb-4">
        <h1 className="text-primary">Exam</h1>
        <div className="text-danger h4">
          Time Left: {Math.floor(timer / 60)}:{("0" + (timer % 60)).slice(-2)}
        </div>
      </header>

      {currentQ ? (
        <div className="card shadow-lg p-4">
          <h4 className="card-title">
            Q{currentQuestion + 1}: {currentQ.text}
          </h4>
          <div className="mt-3">
            {currentQ.options?.map((option, index) => (
              <div key={index} className="form-check">
                <input
                  className="form-check-input"
                  type="radio"
                  name={`question-${currentQuestion}`}
                  id={`option-${index}`}
                  value={option}
                  onChange={() => handleOptionChange(option)}
                  checked={selectedOption === option}
                />
                <label className="form-check-label" htmlFor={`option-${index}`}>
                  {option}
                </label>
              </div>
            ))}
          </div>
          <button
            className="btn btn-primary mt-4"
            onClick={handleNextQuestion}
            disabled={selectedOption === null}
          >
            {currentQuestion === questions.length - 1 ? "Finish Exam" : "Next Question"}
          </button>
        </div>
      ) : (
        <p>No more questions available.</p>
      )}
    </div>
  );
};

export default ExamPage;
