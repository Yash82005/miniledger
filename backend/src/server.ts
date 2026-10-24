
import "dotenv/config";
import express from "express";
import cors from "cors";
import { pool } from "./db";
import authRouter from "./routes/auth";
import loansRouter from "./routes/loans";
import { authenticate } from "./middleware/authenticate";

const app = express();
const PORT = Number(process.env.PORT) || 5000;

app.use(cors());
app.use(express.json());

app.get("/api/health", (_req, res) => {
  res.json({
    status: "ok",
    message: "MiniLedger API is running",
  });
});

app.get("/api/db-health", async (_req, res) => {
  try {
    const result = await pool.query("SELECT NOW() AS current_time");

    res.json({
      status: "ok",
      database: "connected",
      time: result.rows[0].current_time,
    });
  } catch (error) {
    console.error("Database connection failed:", error);
    res.status(500).json({
      status: "error",
      message: "Database connection failed",
    });
  }
});

app.use("/api/auth", authRouter);
app.use("/api/loans", loansRouter);

app.get("/api/summary", authenticate, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT
        COALESCE(SUM(amount), 0) AS total_lent,
        COALESCE(SUM(amount) FILTER (WHERE is_repaid = TRUE), 0) AS total_repaid,
        COALESCE(SUM(amount) FILTER (
          WHERE is_repaid = FALSE AND due_date < CURRENT_DATE
        ), 0) AS overdue_amount
       FROM loans
       WHERE user_id = $1`,
      [req.userId]
    );

    return res.json({ summary: result.rows[0] });
  } catch (error) {
    console.error("Summary error:", error);
    return res.status(500).json({ message: "Could not fetch summary" });
  }
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`MiniLedger API running on port ${PORT}`);
});
