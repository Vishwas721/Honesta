import React from "react";
import DynamicWatermark from "./DynamicWatermark";

const ExamScreen = ({ userName, userID }) => {
  return (
    <div style={{ padding: "20px", position: "relative" }}>
      <h1>Exam Screen</h1>
      <p>Welcome, {userName}. Please complete your exam carefully.</p>

      {/* Render the dynamic watermark */}
      <DynamicWatermark userName={userName} userID={userID} />

      {/* Example exam question */}
      <div>
        <h2>Question 1:</h2>
        <p>What is the capital of France?</p>
      </div>
    </div>
  );
};

export default ExamScreen;