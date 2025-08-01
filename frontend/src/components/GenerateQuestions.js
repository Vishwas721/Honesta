import React, { useState, useEffect } from "react";
import axios from "axios";

const GenerateQuestions = () => {
  const [examId, setExamId] = useState("");
  const [exams, setExams] = useState([]);
  const [topic, setTopic] = useState("");
  const [difficulty, setDifficulty] = useState("");
  const [numberOfQuestions, setNumberOfQuestions] = useState(1);
  const [questions, setQuestions] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    // Fetch available exams
    const fetchExams = async () => {
      try {
        const response = await axios.get("http://localhost:3001/exams", { withCredentials: true });
        setExams(response.data.exams);
      } catch (error) {
        console.error("Error fetching exams:", error);
      }
    };

    fetchExams();
  }, []);

  const handleGenerate = async () => {
    if (!examId) {
      alert("Please select an exam.");
      return;
    }
    setError("");
    try {
      const response = await axios.post(
        "http://localhost:3001/generate-questions",
        {
          examId,
          topic,
          difficulty,
          numberOfQuestions,
        },
        { withCredentials: true }
      );

      if (response.data.questions) {
        setQuestions(response.data.questions);
        alert("Questions generated and added to the exam successfully!");
      }
    } catch (err) {
      console.error("Error generating questions:", err);
      setError("Failed to generate questions. Please try again.");
    }
  };

  return (
    <div>
      <h2>Generate Questions</h2>
      <select
        className="form-control mb-3"
        value={examId}
        onChange={(e) => setExamId(e.target.value)}
      >
        <option value="">Select an Exam</option>
        {exams.map((exam) => (
          <option key={exam.id} value={exam.id}>
            {exam.name} (ID: {exam.id})
          </option>
        ))}
      </select>
      <input
        type="text"
        placeholder="Topic"
        value={topic}
        onChange={(e) => setTopic(e.target.value)}
      />
      <input
        type="text"
        placeholder="Difficulty"
        value={difficulty}
        onChange={(e) => setDifficulty(e.target.value)}
      />
      <input
        type="number"
        placeholder="Number of Questions"
        value={numberOfQuestions}
        onChange={(e) => setNumberOfQuestions(Number(e.target.value))}
      />
      <button onClick={handleGenerate}>Generate Questions</button>
      {error && <p style={{ color: "red" }}>{error}</p>}
      <div>
        {questions.map((question, index) => (
          <div key={index}>
            <p>{question.text}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default GenerateQuestions;