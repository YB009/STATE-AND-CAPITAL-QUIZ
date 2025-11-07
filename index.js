import express from "express";
import bodyParser from "body-parser";
import pg from "pg";
import dotenv from "dotenv";
import dns from "dns";
dns.setDefaultResultOrder('ipv4first');



if (process.env.NODE_ENV !== "production") {
  dotenv.config();
}

const app = express();
const port = process.env.PORT || 3000;

// ✅ Use connection string from Render instead of localhost parameters
const db = new pg.Client({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false } // Required for Render's PostgreSQL
});

db.connect()
  .then(() => console.log("✅ Connected to Render PostgreSQL"))
  .catch((err) => console.error("❌ Database connection error:", err.stack));

let quiz = [];

// ✅ Load quiz data after connection succeeds
db.query("SELECT * FROM capitals")
  .then((res) => {
    quiz = res.rows;
    console.log(`Loaded ${quiz.length} quiz items.`);
  })
  .catch((err) => console.error("Error executing query:", err.stack));

let totalCorrect = 0;
let currentQuestion = {};

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

// GET home page
app.get("/", async (req, res) => {
  totalCorrect = 0;
  await nextQuestion();
  res.render("index.ejs", { question: currentQuestion });
});

// POST submit handler
app.post("/submit", (req, res) => {
  const answer = req.body.answer.trim();
  const isCorrect =
    currentQuestion.capital.toLowerCase() === answer.toLowerCase();

  if (isCorrect) totalCorrect++;

  nextQuestion();
  res.render("index.ejs", {
    question: currentQuestion,
    wasCorrect: isCorrect,
    totalScore: totalCorrect,
  });
});

async function nextQuestion() {
  const randomCountry = quiz[Math.floor(Math.random() * quiz.length)];
  currentQuestion = randomCountry;
}

app.listen(port, () => {
  console.log(`🚀 Server running on port ${port}`);
});
