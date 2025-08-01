import React, { useEffect, useState } from "react";
import axios from "axios";

const Users = () => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios
      .get("http://localhost:3001/attending-students", { withCredentials: true })
      .then((response) => {
        setStudents(response.data);
        setLoading(false);
      })
      .catch((error) => {
        console.error("Error fetching attending students:", error);
      });
  }, []);

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="card">
      <div className="card-body">
        <h2 className="card-title mb-4">Registered Users</h2>
        <ul className="list-group">
          {/* Display attending students */}
          {students.map((student) => (
            <li key={student.id} className="list-group-item">
              {student.name} - {student.email} - Attending: {student.test_name}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default Users;