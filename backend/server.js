import express from 'express';
import session from 'express-session';
import connectPgSimple from 'connect-pg-simple';
import pg from 'pg';
import passport from 'passport';
import { Strategy as LocalStrategy } from 'passport-local';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import cors from 'cors';
import dotenv from 'dotenv';
import bcrypt from 'bcrypt';
import http from 'http';
import { Server } from 'socket.io';
import axios from 'axios';
import https from 'https';
import { GoogleGenerativeAI } from "@google/generative-ai"; 

dotenv.config();

const app = express();
const port = process.env.PORT || 3001;
const saltRounds = 10;
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// PostgreSQL Database Connection
const db = new pg.Pool({
  user: process.env.PG_USER || "postgres",
  host: process.env.PG_HOST || "localhost",
  database: process.env.PG_DATABASE || "testdb",
  password: process.env.PG_PASSWORD || "password",
  port: process.env.PG_PORT || 5432,
});

const PgSession = connectPgSimple(session);

// Middleware
app.use(cors({ origin: ["http://localhost:3000"], credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(
  session({
    store: new PgSession({
      pool: db,
      tableName: "session",
    }),
    secret: process.env.SESSION_SECRET || "supersecret",
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === "production", // Use secure cookies in production
      httpOnly: true,
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      maxAge: 1000 * 60 * 60 * 24, // 1 day
    },
  })
);

app.use(
  cors({
    origin: "http://localhost:3000", // Your frontend URL
    credentials: true, // Allow cookies to be sent
  })
);



app.use(passport.initialize());
app.use(passport.session());

const isAuthenticated = (req, res, next) => {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ error: 'Not authenticated' });
};

const agent = new https.Agent({
  rejectUnauthorized: false, // Accept self-signed certificates
});

// Local Strategy Authentication
passport.use(
  new LocalStrategy({ usernameField: "email" }, async (email, password, done) => {
    try {
      const result = await db.query("SELECT * FROM users WHERE email = $1", [email]);
      console.log("DB Query Result:", result.rows);

      if (result.rows.length === 0) return done(null, false, { message: "User not found" });

      const user = result.rows[0];
      console.log("User from DB:", user);

      const match = await bcrypt.compare(password, user.password);
      if (!match) return done(null, false, { message: "Incorrect password" });

      return done(null, user);
    } catch (err) {
      console.error("Error in login strategy:", err);
      return done(err);
    }
  })
);


// Google OAuth Strategy
passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: "http://localhost:3001/auth/google/callback",
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        let user = await db.query("SELECT * FROM users WHERE google_id = $1", [profile.id]);

        if (user.rows.length === 0) {
          // Assign role based on email domain and mark as active
          const role = profile.emails[0].value.endsWith("@company.com") ? "admin" : "student";
          user = await db.query(
            "INSERT INTO users (name, email, google_id, google_access_token, google_refresh_token) VALUES ($1, $2, $3, $4, $5) RETURNING *",
            [profile.displayName, profile.emails[0].value, profile.id, accessToken, refreshToken]
          );
          return done(null, user.rows[0]);
        }

        await db.query(
          "UPDATE users SET google_access_token = $1, google_refresh_token = $2 WHERE google_id = $3",
          [accessToken, refreshToken, profile.id]
        );

        // Mark existing user as active
        await db.query("UPDATE users SET active = TRUE WHERE google_id = $1", [profile.id]);
        return done(null, user.rows[0]);
      } catch (err) {
        return done(err);
      }
    }
  )
);

passport.serializeUser((user, done) => {
  done(null, user.id); // Ensure that the user object contains an `id` property
});

// Deserialize User
passport.deserializeUser(async (id, cb) => {
  try {
    console.log("Deserializing user with ID:", id);

    if (typeof id === "object" && id.googleId) {
      console.log("Google OAuth user detected:", id);
      return cb(null, id);
    }

    const result = await db.query(
      "SELECT id, name, email, role, active FROM users WHERE id = $1",
      [id]
    );

    if (result.rows.length === 0) {
      console.error("User not found in the database for ID:", id);
      return cb(null, false); // Return `false` when user is not found
    }

    console.log("Deserialized local user:", result.rows[0]);
    cb(null, result.rows[0]);
  } catch (err) {
    console.error("Error during deserialization:", err);
    cb(err); // Pass the error back for proper handling
  }
});



// Fetch User Profile
app.get("/profile", (req, res) => {
  if (!req.isAuthenticated()) return res.status(401).json({ error: "Not authenticated" });
  res.json({ user: req.user });
});

// **API Routes**
// Backend registration route
// Backend registration route
app.post("/register", async (req, res) => {
  const { name, email, password, confirmPassword, role } = req.body;

  if (!name || !email || !password || !confirmPassword || password !== confirmPassword || !role) {
    return res.status(400).json({ error: "Invalid registration details" });
  }

  try {
    const userExists = await db.query("SELECT id FROM users WHERE email = $1", [email]);
    if (userExists.rows.length > 0) {
      return res.status(400).json({ error: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, saltRounds);

    const result = await db.query(
      "INSERT INTO users (name, email, password, role) VALUES ($1, $2, $3, $4) RETURNING *",
      [name, email, hashedPassword, role]
    );

    const user = result.rows[0];

    // Automatically log in the user after registration
    req.login(user, (err) => {
      if (err) {
        console.error("Error logging in user after registration:", err);
        return res.status(500).json({ error: "Login failed after registration" });
      }

      res.json({ message: "Signup successful", user });
    });
  } catch (err) {
    console.error("Error during registration:", err);
    res.status(500).json({ error: "Server error during registration" });
  }
});

// Backend login route
app.post("/login", (req, res, next) => {
  passport.authenticate("local", (err, user, info) => {
    if (err) {
      console.error("[LOGIN ERROR] Authentication error:", err);
      return res.status(500).json({ error: "Internal server error. Please try again later." });
    }

    if (!user) {
      console.warn("[LOGIN WARNING] Authentication failed:", info?.message);
      return res.status(401).json({ error: info?.message || "Authentication failed. Invalid email or password." });
    }

    req.login(user, async (loginErr) => {
      if (loginErr) {
        console.error("[LOGIN ERROR] Login process error:", loginErr);
        return res.status(500).json({ error: "Login process failed. Please try again later." });
      }

      try {
        console.log(`[LOGIN SUCCESS] Marking user ID ${user.id} as active.`);
        await db.query("UPDATE users SET active = TRUE WHERE id = $1", [user.id]);
        console.log("[DATABASE SUCCESS] User status updated successfully.");

        // Determine redirect URL based on user role
        const redirectUrl = user.role === "admin" ? "/dashboard" : "/exam-selection";

        // Log the final response for debugging
        console.log("[LOGIN RESPONSE]", {
          user: { id: user.id, role: user.role, email: user.email },
          redirectUrl,
        });

        // Respond with user details and the redirect URL
        return res.json({
          success: true,
          message: "Login successful",
          user: { id: user.id, role: user.role, email: user.email }, // Include necessary user info
          redirectUrl,
        });
      } catch (dbErr) {
        console.error("[DATABASE ERROR] Error updating user active status:", dbErr);
        return res.status(500).json({
          error: "Failed to update user active status. Please try again later.",
        });
      }
    });
  })(req, res, next);
});




// Google OAuth Routes
app.get("/auth/google", passport.authenticate("google", { scope: ["profile", "email"] }));
app.get(
  "/auth/google/callback",
  passport.authenticate("google", { failureRedirect: "http://localhost:3000" }),
  (req, res) => {
    const redirectUrl = req.user.role === "admin" ? "/dashboard" : "/exam-selection";
    res.redirect(`http://localhost:3000${redirectUrl}`);
  }
);

// Fetch Attending Students
app.get("/attending-students", async (req, res) => {
  if (!req.isAuthenticated()) return res.status(401).json({ error: "Not authenticated" });

  try {
    const result = await db.query("SELECT * FROM attending_students"); // Replace with your actual query
    res.json(result.rows);
  } catch (err) {
    console.error("Error fetching attending students:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// Fetch User Profile
app.get("/auth/user", (req, res) => {
  if (!req.isAuthenticated()) return res.status(401).json({ error: "Not authenticated" });
  res.json({ user: req.user });
});

// Logout Route
app.post("/logout", (req, res) => {
  const userId = req.user.id;
  req.logout((err) => {
    if (err) return res.status(500).json({ error: "Logout failed" });

    // Update user status to inactive
    db.query("UPDATE users SET active = FALSE WHERE id = $1", [userId], (err) => {
      if (err) {
        console.error("Error updating user inactive status:", err);
        return res.status(500).json({ error: "Failed to update user status" });
      }

      req.session.destroy(() => res.clearCookie("connect.sid").json({ message: "Logout successful" }));
    });
  });
});

app.get("/start-exam/:examId", async (req, res) => {
  try {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "You are not authenticated. Please log in to access the exam." });
    }

    const { examId } = req.params;
    const studentId = req.user.id;

    if (!examId || !studentId) {
      return res.status(400).json({ error: "Invalid request. Missing examId or studentId." });
    }

    // Check if the user is blocked from this exam
    const queryBlocked = `
      SELECT reason FROM blocked_users WHERE exam_id = $1 AND student_id = $2
    `;
    const blockedResult = await db.query(queryBlocked, [examId, studentId]);

    if (blockedResult.rows.length > 0) {
      return res.status(403).json({
        error: "You are blocked from this exam due to suspicious activity.",
        reason: blockedResult.rows[0].reason, // Optional: Send the reason for blocking
      });
    }

    // Check if the user has already completed this exam
    const queryAttempts = `
      SELECT * FROM exam_attempts WHERE exam_id = $1 AND student_id = $2
    `;
    const attemptResult = await db.query(queryAttempts, [examId, studentId]);

    if (attemptResult.rows.length > 0) {
      return res.status(200).json({
        message: "You have already completed this exam.",
        completed: true,
      });
    }

    // If not blocked and not completed, allow access
    return res.status(200).json({ message: "You may start the exam.", completed: false });

  } catch (err) {
    console.error("Error checking exam access:", err.message);
    return res.status(500).json({
      error: "An internal error occurred while checking exam access. Please try again later.",
    });
  }
});



// Insert Student when Exam Starts
app.post("/start-exam/:examId", async (req, res) => {
  if (!req.isAuthenticated()) return res.status(401).json({ error: "Not authenticated" });

  const { examId } = req.params;
  const { studentName, studentEmail } = req.body;

  if (!studentName || !studentEmail || !examId) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  try {
    const query = "INSERT INTO attending_students (name, email, test_name) VALUES ($1, $2, $3)";
    await db.query(query, [studentName, studentEmail, examId]);
    res.json({ message: "Student added to attending_students table" });
  } catch (err) {
    console.error("Error inserting student:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// Create Question
app.post("/questions", async (req, res) => {
  if (!req.isAuthenticated()) return res.status(401).json({ error: "Not authenticated" });

  const { examId, text, options, correctAnswer } = req.body;

  if (!examId || !text || !options || !correctAnswer) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  try {
    const query = "INSERT INTO questions (exam_id, text, options, correct_answer) VALUES ($1, $2, $3, $4) RETURNING *";
    const result = await db.query(query, [examId, text, options, correctAnswer]);

    res.json({ question: result.rows[0] });
  } catch (err) {
    console.error("Error creating question:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// Fetch Questions with Shuffling
app.get("/exams/:examId/questions", async (req, res) => {
  if (!req.isAuthenticated()) return res.status(401).json({ error: "Not authenticated" });

  const { examId } = req.params;

  try {
    const result = await db.query("SELECT * FROM questions WHERE exam_id = $1", [examId]);
    const questions = result.rows;

    // Shuffle questions
    questions.sort(() => Math.random() - 0.5);

    res.json({ questions });
  } catch (err) {
    console.error("Error fetching questions:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// Generate AI-Powered Questions using NoteGPT
// Generate Questions using Gemini AI API
app.post("/generate-questions", async (req, res) => {
  if (!req.isAuthenticated()) return res.status(401).json({ error: "Not authenticated" });

  const { examId, topic, difficulty, numberOfQuestions } = req.body;

  // Helper function to validate questions
  const isValidQuestion = (question) => {
    return (
      question?.text &&
      Array.isArray(question?.options) &&
      question.options.length === 4 &&
      question.correctAnswer &&
      question.options.includes(question.correctAnswer)
    );
  };

  // Helper function to clean and extract JSON
  const extractJSON = (text) => {
    try {
      // Remove Markdown-style code fences (```json and ```)
      const cleanedText = text.replace(/```json|```/g, "").trim();
      return cleanedText;
    } catch (error) {
      console.error("Error cleaning response text:", error.message);
      return null;
    }
  };

  console.log("Request Data:", { topic, difficulty, numberOfQuestions });

  if (!examId || !topic || !difficulty || !numberOfQuestions) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  try {
    // Initialize the generative model
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    // Define the prompt
    const prompt = `
      Generate ${numberOfQuestions} multiple-choice questions strictly on the topic '${topic}' at an '${difficulty}' difficulty level.
      Format the response as a JSON array with the following structure:
      [
        {
          "text": "What is the capital of France?",
          "options": ["Paris", "London", "Berlin", "Rome"],
          "correctAnswer": "Paris"
        },
        ...
      ]
      Ensure the questions are relevant to the topic '${topic}' and appropriate for '${difficulty}' difficulty.
    `;

    // Call the AI model to generate content
    const result = await model.generateContent(prompt);
    console.log("AI Raw Response:", JSON.stringify(result.response.candidates, null, 2));

    // Parse and clean AI response
    const generatedQuestions = result?.response?.candidates?.flatMap((candidate) => {
      try {
        console.log("Candidate Content Parts:", candidate.content?.parts);
        const cleanedResponse = extractJSON(candidate.content?.parts?.[0]?.text || "{}");
        if (!cleanedResponse) {
          throw new Error("Failed to clean response text");
        }
        const parsedQuestions = JSON.parse(cleanedResponse);
        if (!Array.isArray(parsedQuestions)) {
          throw new Error("Parsed response is not a valid JSON array");
        }
        return parsedQuestions; // Return parsed questions
      } catch (error) {
        console.error("Error parsing candidate content:", error.message);
        return []; // Return an empty array for invalid candidates
      }
    });

    // Filter and validate questions
    const validQuestions = generatedQuestions.filter(isValidQuestion);

    if (validQuestions.length === 0) {
      throw new Error("No valid or relevant questions generated.");
    }

    // Insert valid questions into the database
    const questions = [];
    for (const question of validQuestions) {
      const query = `
        INSERT INTO questions (exam_id, text, options, correct_answer)
        VALUES ($1, $2, $3, $4) RETURNING *;
      `;
      const dbResult = await db.query(query, [
        examId,
        question.text,
        question.options,
        question.correctAnswer,
      ]);
      questions.push(dbResult.rows[0]);
    }

    // Respond with the inserted questions
    res.json({ message: "Questions successfully generated and saved." });

  } catch (err) {
    console.error("Error generating questions:", err.message);
    res.status(500).json({ error: "Failed to generate questions. Please try again later." });
  }
});



app.get("/exams/:examId/questions", async (req, res) => {
  if (!req.isAuthenticated()) return res.status(401).json({ error: "Not authenticated" });

  const { examId } = req.params;

  try {
    const result = await db.query("SELECT * FROM questions WHERE exam_id = $1", [examId]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "No questions found for this exam." });
    }

    res.json({ questions: result.rows });
  } catch (err) {
    console.error("Error fetching questions:", err.message);
    res.status(500).json({ error: "Failed to fetch questions. Please try again later." });
  }
});



app.get("/get-exam-questions/:examId", async (req, res) => {
  const { examId } = req.params;

  try {
    const result = await db.query("SELECT * FROM questions WHERE exam_id = $1", [examId]);
    res.json({ questions: result.rows });
  } catch (err) {
    console.error("Error fetching exam questions:", err);
    res.status(500).json({ error: "Failed to fetch exam questions." });
  }
});




// Insert Student when Exam Starts
app.post("/start-exam", async (req, res) => {
  if (!req.isAuthenticated()) return res.status(401).json({ error: "Not authenticated" });

  const { studentName, studentEmail, testName } = req.body;

  if (!studentName || !studentEmail || !testName) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  try {
    const query = "INSERT INTO attending_students (name, email, test_name) VALUES ($1, $2, $3)";
    await db.query(query, [studentName, studentEmail, testName]);
    res.json({ message: "Student added to attending_students table" });
  } catch (err) {
    console.error("Error inserting student:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// Fetch Active Users
app.get("/active-users", async (req, res) => {
  if (!req.isAuthenticated()) return res.status(401).json({ error: "Not authenticated" });

  try {
    const result = await db.query("SELECT COUNT(*) FROM users WHERE active = TRUE");
    res.json({ activeUsers: result.rows[0].count });
  } catch (err) {
    console.error("Error fetching active users:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// Fetch Risk Alerts
app.get("/risk-alerts", async (req, res) => {
  if (!req.isAuthenticated()) return res.status(401).json({ error: "Not authenticated" });

  try {
    const result = await db.query("SELECT COUNT(*) FROM risk_alerts"); // Adjust the query based on your schema
    res.json({ riskAlerts: result.rows[0].count });
  } catch (err) {
    console.error("Error fetching risk alerts:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// Fetch Total Exams
app.get("/total-exams", async (req, res) => {
  if (!req.isAuthenticated()) return res.status(401).json({ error: "Not authenticated" });

  try {
    const result = await db.query("SELECT COUNT(*) FROM exams");
    res.json({ totalExams: result.rows[0].count });
  } catch (err) {
    console.error("Error fetching total exams:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// Middleware to initialize settings for new users
app.use(async (req, res, next) => {
  if (req.isAuthenticated()) {
    try {
      const userSettings = await db.query("SELECT * FROM settings WHERE user_id = $1", [req.user.id]);
      if (userSettings.rows.length === 0) {
        await db.query("INSERT INTO settings (user_id) VALUES ($1)", [req.user.id]);
      }
    } catch (err) {
      console.error("Error initializing settings:", err);
    }
  }
  next();
});

// Fetch Settings
app.get("/settings", async (req, res) => {
  if (!req.isAuthenticated()) return res.status(401).json({ error: "Not authenticated" });

  try {
    const result = await db.query("SELECT * FROM settings WHERE user_id = $1", [req.user.id]);
    res.json(result.rows[0]);
  } catch (err) {
    console.error("Error fetching settings:", err);
    res.status(500).json({ error: "Server error" });
  }
});

app.post("/submit-exam", async (req, res) => {
  console.log("🔹 Request Payload:", req.body);

  try {
    // ✅ Validate authentication
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "You are not authenticated. Please log in." });
    }

    const studentId = req.user.id;
    const { examId, answers } = req.body;

    // ✅ Validate input fields
    if (!examId || !studentId || !Array.isArray(answers) || answers.length === 0) {
      return res.status(400).json({ error: "Missing or invalid fields in the request." });
    }

    // ✅ Check if the student has already attempted this exam
    const checkAttemptQuery = `SELECT 1 FROM exam_attempts WHERE exam_id = $1 AND student_id = $2`;
    const checkAttempt = await db.query(checkAttemptQuery, [examId, studentId]);

    if (checkAttempt.rows.length > 0) {
      console.warn(`⚠️ Student ${studentId} has already attempted exam ${examId}`);
      return res.status(403).json({ error: "You have already attempted this exam." });
    }

    // ✅ Fetch questions for the exam
    const fetchQuestionsQuery = `SELECT id AS "questionId", correct_answer FROM questions WHERE exam_id = $1`;
    const questionResult = await db.query(fetchQuestionsQuery, [examId]);

    if (questionResult.rows.length === 0) {
      return res.status(404).json({ error: "No questions found for this exam." });
    }

    const questions = questionResult.rows;
    console.log("✅ Questions Fetched:", questions);

    // ✅ Calculate the score
    let score = 0;

    answers.forEach((currentAnswer) => {
      const question = questions.find((q) => q.questionId === currentAnswer.questionId);

      if (!question) {
        console.warn(`⚠️ Question ID ${currentAnswer.questionId} not found in DB.`);
        return;
      }

      console.log(
        `🔍 Checking Q${currentAnswer.questionId}: Given="${currentAnswer.answer}" | Expected="${question.correct_answer}"`
      );

      if (
        question.correct_answer.trim().toLowerCase() === currentAnswer.answer.trim().toLowerCase()
      ) {
        score += 1;
      }
    });

    console.log(`✅ Final Score for Student ${studentId}: ${score}/${questions.length}`);

    // ✅ Save the attempt in the database
    const insertAttemptQuery = `
      INSERT INTO exam_attempts (exam_id, student_id, score, total_questions, completed_at)
      VALUES ($1, $2, $3, $4, NOW()) RETURNING *;
    `;
    const dbResult = await db.query(insertAttemptQuery, [examId, studentId, score, questions.length]);

    console.log("✅ Database Insert Result:", dbResult.rows[0]);

    // ✅ Send the response with the submission results
    res.status(200).json({
      message: "Exam submitted successfully.",
      results: {
        examId,
        studentId,
        score,
        totalQuestions: questions.length,
      },
    });
  } catch (err) {
    console.error("❌ Error processing exam submission:", err.message);
    res.status(500).json({ error: "Internal server error. Please try again later." });
  }
});



app.get("/exams", async (req, res) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ error: "Not authenticated" });
  }

  const { studentId } = req.query;

  try {
    // Fetch all exams
    const exams = await db.query("SELECT * FROM exams");

    // Fetch attempted exams for the user
    const attempts = await db.query(
      "SELECT exam_id FROM exam_attempts WHERE student_id = $1",
      [studentId]
    );
    const attemptedExamIds = attempts.rows.map((attempt) => attempt.exam_id);

    // Fetch blocked exams for the user
    const blocked = await db.query(
      "SELECT exam_id FROM blocked_users WHERE student_id = $1",
      [studentId]
    );
    const blockedExamIds = blocked.rows.map((block) => block.exam_id);

    // Combine data to include 'attempted' and 'blocked' status
    const examsWithStatus = exams.rows.map((exam) => ({
      ...exam,
      attempted: attemptedExamIds.includes(exam.id),
      blocked: blockedExamIds.includes(exam.id), // Add blocked status
    }));

    res.json({ exams: examsWithStatus });
  } catch (err) {
    console.error("Error fetching exams:", err.message);
    res.status(500).json({ error: "Failed to fetch exams" });
  }
});




// Update Settings
app.post("/settings", async (req, res) => {
  if (!req.isAuthenticated()) return res.status(401).json({ error: "Not authenticated" });

  const { theme, notificationEmail } = req.body;

  try {
    const result = await db.query(
      "UPDATE settings SET theme = $1, notification_email = $2 WHERE user_id = $3 RETURNING *",
      [theme, notificationEmail, req.user.id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error("Error updating settings:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// Update Profile
app.post("/update-profile", async (req, res) => {
  if (!req.isAuthenticated()) return res.status(401).json({ error: "Not authenticated" });

  const { name, email } = req.body;

  try {
    const result = await db.query(
      "UPDATE users SET name = $1, email = $2 WHERE id = $3 RETURNING *",
      [name, email, req.user.id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error("Error updating profile:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// Change Password
app.post("/change-password", async (req, res) => {
  if (!req.isAuthenticated()) return res.status(401).json({ error: "Not authenticated" });

  const { password } = req.body;

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    await db.query("UPDATE users SET password = $1 WHERE id = $2", [hashedPassword, req.user.id]);
    res.json({ message: "Password changed successfully" });
  } catch (err) {
    console.error("Error changing password:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// Delete Account
app.post("/delete-account", async (req, res) => {
  if (!req.isAuthenticated()) return res.status(401).json({ error: "Not authenticated" });

  try {
    await db.query("DELETE FROM users WHERE id = $1", [req.user.id]);
    req.logout((err) => {
      if (err) return res.status(500).json({ error: "Logout failed" });
      req.session.destroy(() => res.clearCookie("connect.sid").json({ message: "Account deleted successfully" }));
    });
  } catch (err) {
    console.error("Error deleting account:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// Create Exam Endpoint
// Create Exam Endpoint
app.post("/create-exam", async (req, res) => {
  if (!req.isAuthenticated()) return res.status(401).json({ error: "Not authenticated" });

  const { examName } = req.body;

  if (!examName) {
    return res.status(400).json({ error: "Exam name is required" });
  }

  try {
    const result = await db.query("INSERT INTO exams (name) VALUES ($1) RETURNING *", [examName]);
    res.json({ message: "Exam created", exam: result.rows[0] });
  } catch (err) {
    console.error("Error creating exam:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// Fetch Exams Endpoint
app.get("/exams", async (req, res) => {
  if (!req.isAuthenticated()) return res.status(401).json({ error: "Not authenticated" });

  try {
    const result = await db.query("SELECT * FROM exams");
    res.json({ exams: result.rows });
  } catch (err) {
    console.error("Error fetching exams:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// WebSocket setup and risk calculation logic
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"],
  },
});


let results = [
  { id: 1, user: "John Doe", exam: "Math", score: 85 },
  { id: 2, user: "Jane Smith", exam: "Science", score: 92 }
];
let alerts = [
  { id: 1, user: "John Doe", alert: "Attempted split-screen usage" },
  { id: 2, user: "Jane Smith", alert: "Copy-paste detected" }
];

app.get("/api/user-results", (req, res) => {
  res.json(results);
});

app.get("/api/user-alerts", (req, res) => {
  res.json(alerts);
});

io.on("connection", (socket) => {
  console.log("Admin connected to dashboard");

  // Send real-time updates
  setInterval(() => {
    const newResult = { id: Date.now(), user: "New User", exam: "Math", score: Math.floor(Math.random() * 100) };
    const newAlert = { id: Date.now(), user: "New User", alert: "Suspicious activity detected" };
    
    results.push(newResult);
    alerts.push(newAlert);

    socket.emit("new-result", newResult);
    socket.emit("new-alert", newAlert);
  }, 10000); // Push updates every 10 seconds
});
const userRiskScores = {};
const userCooldown = {}; // Cooldown management for each user

io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  const handleEvent = (eventType, data) => {
    const { examId, studentId } = data; // Extract examId and studentId
    if (!examId || !studentId) {
      console.error(`Missing examId or studentId in ${eventType} data:`, data);
      return;
    }
    updateRiskScore(socket.id, eventType, examId, studentId);
  };

  // Handle mouse activity
  socket.on("mouse_activity", (data) => handleEvent("mouse_activity", data));

  // Handle keystroke activity
  socket.on("keystroke_activity", (data) => handleEvent("keystroke_activity", data));

  // Handle tab change activity
  socket.on("tab_change", (data) => handleEvent("tab_change", data));

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
    delete userRiskScores[socket.id];
    delete userCooldown[socket.id];
  });
});


const lockExam = async (socketId, examId, studentId) => {
  try {
    if (!examId || !studentId) {
      throw new Error("Missing examId or studentId");
    }

    console.log(`Locking exam for examId: ${examId}, studentId: ${studentId}`);

    // Use your error-handling query here
    const query = "INSERT INTO blocked_users (exam_id, student_id) VALUES ($1, $2) ON CONFLICT DO NOTHING";
    await db.query(query, [examId, studentId]); // Adding the user to the blocked_users table

    // Notify the user
    io.to(socketId).emit("lock_exam", {
      message: "Your exam has been locked due to suspicious activity. You cannot retake this exam.",
    });

    console.log(`Exam ${examId} locked for student ${studentId}`);
  } catch (dbError) {
    // Catch and log the database error
    console.error("Database Error:", dbError.message);
    throw dbError; // Optional: Rethrow the error if needed upstream
  }
};



const updateRiskScore = async (socketId, eventType, examId, studentId) => {
  if (!userRiskScores[socketId]) {
    userRiskScores[socketId] = 0; // Initialize risk score
  }

  if (!userCooldown[socketId]) {
    userCooldown[socketId] = { lastAction: Date.now(), warningIssued: false };
  }

  const currentTime = Date.now();
  const cooldownPeriod = 10000; // 10 seconds

  if (eventType === "mouse_activity") {
    if (currentTime - userCooldown[socketId].lastAction < cooldownPeriod) {
      return;
    }
    userRiskScores[socketId] += 1;
  } else if (eventType === "keystroke_activity") {
    userRiskScores[socketId] += 2;
  } else if (eventType === "tab_change" || eventType === "split_screen" || eventType === "screenshot_attempt") {
    // Equal risk score for tab switching, split-screen, and screenshot attempts
    userRiskScores[socketId] += 10;
  } else if (eventType === "app_switch") {
    // Higher risk score for switching between apps
    userRiskScores[socketId] += 15;
  }

  userCooldown[socketId].lastAction = currentTime;

  console.log(`Risk score for ${socketId}:`, userRiskScores[socketId]);

  // Trigger risk warning
  if (userRiskScores[socketId] > 20 && !userCooldown[socketId].warningIssued) {
    io.to(socketId).emit("risk_warning", {
      message: "Suspicious activity detected. Please focus on the exam.",
    });
    userCooldown[socketId].warningIssued = true;
  }

  // Lock the exam if risk exceeds threshold
  if (userRiskScores[socketId] > 50) {
    console.log(`Calling lockExam with examId: ${examId}, studentId: ${studentId}`);

    await lockExam(socketId, examId, studentId);
  }
};


server.listen(3001, () => {
  console.log("WebSocket server running on port 3001");
});