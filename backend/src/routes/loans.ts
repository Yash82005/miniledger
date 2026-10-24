
import { Router } from "express";
import { z } from "zod";
import { pool } from "../db";
import { authenticate } from "../middleware/authenticate";

const router = Router();

router.use(authenticate);

const loanSchema = z.object({
  friend_name: z.string().trim().min(1).max(100),
  amount: z.coerce.number().finite().positive().max(9999999999.99),
  due_date: z.string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Use YYYY-MM-DD")
    .refine((value) => {
      const date = new Date(`${value}T00:00:00Z`);
      return !Number.isNaN(date.getTime()) &&
        date.toISOString().slice(0, 10) === value;
    }, "Enter a valid date"),
});

router.post("/", async (req, res) => {
  const parsed = loanSchema.safeParse(req.body);

  if (!parsed.success) {
    return res.status(400).json({
      message: "Invalid loan details",
      errors: parsed.error.issues,
    });
  }

  try {
    const { friend_name, amount, due_date } = parsed.data;

    const result = await pool.query(
      `INSERT INTO loans (user_id, friend_name, amount, due_date)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [req.userId, friend_name, amount, due_date]
    );

    return res.status(201).json({ loan: result.rows[0] });
  } catch (error) {
    console.error("Add loan error:", error);
    return res.status(500).json({ message: "Could not add loan" });
  }
});

router.get("/", async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT *,
        (NOT is_repaid AND due_date < CURRENT_DATE) AS is_overdue
       FROM loans
       WHERE user_id = $1
       ORDER BY due_date ASC, id DESC`,
      [req.userId]
    );

    return res.json({ loans: result.rows });
  } catch (error) {
    console.error("List loans error:", error);
    return res.status(500).json({ message: "Could not fetch loans" });
  }
});

router.patch("/:id/repay", async (req, res) => {
  const id = Number(req.params.id);

  if (!Number.isInteger(id) || id < 1) {
    return res.status(400).json({ message: "Invalid loan ID" });
  }

  try {
    const result = await pool.query(
      `UPDATE loans
       SET is_repaid = TRUE, repaid_at = NOW()
       WHERE id = $1 AND user_id = $2 AND is_repaid = FALSE
       RETURNING *`,
      [id, req.userId]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({
        message: "Loan not found or already repaid",
      });
    }

    return res.json({
      message: "Loan marked as repaid",
      loan: result.rows[0],
    });
  } catch (error) {
    console.error("Repay loan error:", error);
    return res.status(500).json({ message: "Could not update loan" });
  }
});

export default router;
