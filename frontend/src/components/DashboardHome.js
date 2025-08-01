import React, { useEffect, useState } from "react";
import axios from "axios";
import CreateQuestion from "./CreateQuestion";
import GenerateQuestions from "./GenerateQuestions";
import { io } from "socket.io-client";




const DashboardHome = ({ user, handleCreateExam, examName, setExamName, exams }) => {
  const [totalUsers, setTotalUsers] = useState(0);
  const [riskAlerts, setRiskAlerts] = useState(0);
  const [totalExams, setTotalExams] = useState(0);

  useEffect(() => {
    const newSocket = io("http://localhost:3001");
  
    newSocket.on("dashboard_update", (data) => {
      setTotalUsers(data.totalUsers || totalUsers);
      setRiskAlerts(data.riskAlerts || riskAlerts);
      setTotalExams(data.totalExams || totalExams);
    });
  
    return () => newSocket.disconnect();
  }, []);
  
  
  
  

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const totalUsersResponse = await axios.get("http://localhost:3001/total-users", { withCredentials: true });
        const riskAlertsResponse = await axios.get("http://localhost:3001/risk-alerts", { withCredentials: true });
        const totalExamsResponse = await axios.get("http://localhost:3001/total-exams", { withCredentials: true });

        setTotalUsers((prevUsers) => {
          console.log("Previous Users:", prevUsers, "New Users:", data.totalUsers);
          return data.totalUsers || prevUsers;
        });
        
        setRiskAlerts(riskAlertsResponse.data.riskAlerts);
        setTotalExams(totalExamsResponse.data.totalExams);
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      }
    };

    fetchDashboardData();
  }, []);

  return (
    <div className="row">
      <DashboardCard title="Total Users" count={totalUsers} color="primary" />
      <DashboardCard title="Risk Alerts" count={riskAlerts} color="danger" />
      <DashboardCard title="Total Exams" count={totalExams} color="success" />
      <div className="col-12 mt-4">
        <div className="card">
          <div className="card-body">
            <h2 className="card-title">Welcome, {user?.name}</h2>
          </div>
        </div>
      </div>
      <div className="col-12 mt-4">
        <div className="card">
          <div className="card-body">
            <h2 className="card-title">Create Exam</h2>
            <input
              type="text"
              className="form-control"
              placeholder="Enter exam name"
              value={examName}
              onChange={(e) => setExamName(e.target.value)}
            />
            <button className="btn btn-primary mt-2" onClick={handleCreateExam}>
              Create Exam
            </button>
            <div className="mt-4">
              <h2>Created Exams</h2>
              <ul className="list-group">
                {exams.map((exam) => (
                  <li key={exam.id} className="list-group-item">
                    <strong>{exam.name}</strong> (ID: <span className="text-muted">{exam.id}</span>)
                  </li>
                ))}
              </ul>
            </div>
            <div className="mt-4">
              <CreateQuestion /> {/* Manual Question Creation */}
              <GenerateQuestions /> {/* AI-Powered Question Generation */}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const DashboardCard = ({ title, count, color }) => (
  <div className="col-sm-4 mb-4">
    <div className={`card text-white bg-${color}`}>
      <div className="card-body">
        <h5 className="card-title">{title}</h5>
        <p className="card-text display-4">{count}</p>
      </div>
    </div>
  </div>
);

export default DashboardHome;