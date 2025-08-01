import React, { useState } from "react";
import axios from "axios";

const CreateQuestion = () => {
  const [examId, setExamId] = useState("");
  const [text, setText] = useState("");
  const [options, setOptions] = useState([]);
  const [correctAnswer, setCorrectAnswer] = useState("");

  const handleCreate = async () => {
    try {
      const response = await axios.post("http://localhost:3001/questions", {
        examId,
        text,
        options,
        correctAnswer,
      });
      alert("Question created successfully");
    } catch (error) {
      console.error("Error creating question:", error);
    }
  };

  return (
    <div>
      <h2>Create Question</h2>
      <input
        type="text"
        placeholder="Exam ID"
        value={examId}
        onChange={(e) => setExamId(e.target.value)}
      />
      <input
        type="text"
        placeholder="Question Text"
        value={text}
        onChange={(e) => setText(e.target.value)}
      />
      <input
        type="text"
        placeholder="Options (comma-separated)"
        value={options}
        onChange={(e) => setOptions(e.target.value.split(","))}
      />
      <input
        type="text"
        placeholder="Correct Answer"
        value={correctAnswer}
        onChange={(e) => setCorrectAnswer(e.target.value)}
      />
      <button onClick={handleCreate}>Create Question</button>
    </div>
  );
};

export default CreateQuestion;