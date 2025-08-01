import React, { useEffect, useState } from "react";
import { FiHome, FiUsers, FiAlertTriangle, FiSettings, FiLogOut } from "react-icons/fi";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import Users from "./Users";
import DashboardHome from "./DashboardHome";
import Settings from "./Settings";

const Dashboard = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("Home");
  const [examName, setExamName] = useState("");
  const [exams, setExams] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    axios
      .get("http://localhost:3001/profile", { withCredentials: true })
      .then((response) => {
        setUser(response.data.user);
        setLoading(false);
      })
      .catch(() => {
        navigate("/login");
      });
  }, [navigate]);

  const handleLogout = async () => {
    try {
      await axios.post("http://localhost:3001/logout", {}, { withCredentials: true });
      navigate("/login");
    } catch (error) {
      console.error("Logout failed", error);
    }
  };

  const handleCreateExam = async () => {
    try {
      const response = await axios.post("http://localhost:3001/create-exam", { examName }, { withCredentials: true });
      if (response.data.exam) {
        setExams([...exams, response.data.exam]);
        setExamName("");
      }
    } catch (error) {
      console.error("Error creating exam:", error);
    }
  };

  const fetchExams = async () => {
    try {
      const response = await axios.get("http://localhost:3001/exams", { withCredentials: true });
      setExams(response.data.exams);
    } catch (error) {
      console.error("Error fetching exams:", error);
    }
  };

  useEffect(() => {
    fetchExams();
  }, []);

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="d-flex vh-100 bg-light">
      {/* Sidebar */}
      <div className="bg-dark text-white d-flex flex-column" style={{ width: '250px' }}>
        <div className="p-4 text-center border-bottom">Honesta</div>
        <nav className="flex-grow-1 p-4">
          <SidebarItem icon={<FiHome />} text="Home" active={activeTab} setActive={setActiveTab} />
          <SidebarItem icon={<FiUsers />} text="Users" active={activeTab} setActive={setActiveTab} />
          <SidebarItem icon={<FiAlertTriangle />} text="Alerts" active={activeTab} setActive={setActiveTab} />
          <SidebarItem icon={<FiSettings />} text="Settings" active={activeTab} setActive={setActiveTab} />
        </nav>
        <button onClick={handleLogout} className="btn btn-danger m-4">Logout</button>
      </div>

      {/* Main Dashboard */}
      <div className="flex-grow-1 p-4">
        <h1 className="mb-4">{activeTab}</h1>
        <div>
          {activeTab === "Home" && (
            <DashboardHome
              user={user}
              handleCreateExam={handleCreateExam}
              examName={examName}
              setExamName={setExamName}
              exams={exams}
            />
          )}
          {activeTab === "Users" && <Users />}
          {activeTab === "Alerts" && <Alerts />}
          {activeTab === "Settings" && <Settings />}
        </div>
      </div>
    </div>
  );
};

const SidebarItem = ({ icon, text, active, setActive }) => (
  <button
    onClick={() => setActive(text)}
    className={`btn btn-block text-left ${active === text ? "btn-secondary" : "btn-dark"}`}
  >
    {icon} <span className="ml-2">{text}</span>
  </button>
);

const Alerts = () => (
  <div className="card">
    <div className="card-body">
      <h2 className="card-title mb-4">Recent Risk Alerts</h2>
      <p>No recent alerts.</p>
    </div>
  </div>
);

export default Dashboard;