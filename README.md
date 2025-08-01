# 🎓 Honesta – Risk-Based Proctoring System

**Honesta** is a real-time browser-based proctoring system that detects and reports suspicious user behavior during online exams. It uses JavaScript event listeners and WebSockets to track activities like tab switching, abnormal typing speed, and aggressive mouse movements — helping institutions ensure fair online assessments.

---

## 🚀 Key Features

- ⚠️ **Tab Switching Detection**
  - Tracks if the user leaves the exam tab or window

- 🖱️ **Aggressive Mouse Movement Detection**
  - Identifies rapid and erratic mouse behavior

- ⌨️ **Typing Speed Monitoring**
  - Flags abnormal typing patterns (too fast or inconsistent)

- 🔄 **Real-time Risk Score Updates**
  - Uses WebSockets (Socket.io) to send live alerts to the backend and admin dashboard

- 📋 **Event Logging**
  - All events (tab switch, typing rate, mouse spikes) are logged for review

---

## 🛠 Tech Stack

| Frontend         | Backend           | Real-time Communication | Database          |
|------------------|-------------------|--------------------------|-------------------|
| React.js         | Node.js + Express | Socket.io (WebSockets)   | PostgreSQL / SQLite |

---

## ⚙️ Setup Instructions

### 🔽 Clone the Repository

```bash
git clone https://github.com/your-username/Honesta.git
cd Honesta
