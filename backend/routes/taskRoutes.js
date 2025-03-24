const express = require("express");
const mongoose = require("mongoose");
const Task = require("../models/Task");
const { protect } = require("../middleware/authMiddleware"); // Import authentication middleware
const { prioritizeTasks } = require("../utils/gemini");

const router = express.Router();

// Get all tasks for the authenticated user
router.get("/", protect, async (req, res) => {
    try {
        const incompleteTasks = await Task.find({ completed: false, user: req.user.userId });
        const completedTasks = await Task.find({ completed: true, user: req.user.userId });
        res.json({ incompleteTasks, completedTasks });
    } catch (error) {
        res.status(500).json({ error: "Server error while fetching tasks" });
    }
});

// Add new task (with deadline & urgency) for the authenticated user
router.post("/", protect, async (req, res) => { 
  try {
      const { title, deadline, urgency } = req.body;
      const userId = req.user.userId;  // `userId` should match `protect` middleware

      const newTask = new Task({ title, deadline: deadline ? new Date(deadline) : null, urgency: urgency || "Medium", user: userId });

      await newTask.save();
      res.status(201).json(newTask);
  } catch (error) {
      res.status(500).json({ error: "Server error while adding task" });
  }
});

// Update task (including completion, deadline & urgency) for the authenticated user
router.put("/:id", protect, async (req, res) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).json({ error: "Invalid task ID format" });
        }

        const { completed, deadline, urgency } = req.body;

        const updatedTask = await Task.findOneAndUpdate(
            { _id: req.params.id, user: req.user.userId }, // Ensure task belongs to authenticated user
            { completed, deadline: deadline ? new Date(deadline) : null, urgency },
            { new: true }
        );

        if (!updatedTask) {
            return res.status(404).json({ error: "Task not found or not authorized" });
        }

        res.json(updatedTask);
    } catch (error) {
        res.status(500).json({ error: "Server error while updating task" });
    }
});

// Delete task for the authenticated user
router.delete("/:id", protect, async (req, res) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).json({ error: "Invalid task ID format" });
        }

        const deletedTask = await Task.findOneAndDelete({ _id: req.params.id, user: req.user.userId });

        if (!deletedTask) {
            return res.status(404).json({ error: "Task not found or not authorized" });
        }

        res.json({ message: "Task deleted successfully" });
    } catch (error) {
        res.status(500).json({ error: "Server error while deleting task" });
    }
});

// Prioritize tasks for the authenticated user (ignores completed tasks)
router.post("/prioritize", protect, async (req, res) => {
    try {
        const { tasks } = req.body;

        if (!Array.isArray(tasks)) {
            return res.status(400).json({ error: "Invalid input: tasks must be an array" });
        }

        // Prioritize tasks: High urgency first, then by nearest deadline
        const urgencyLevels = { "High": 3, "Medium": 2, "Low": 1 };

        const prioritizedTasks = tasks
            .sort((a, b) => {
                const urgencyA = urgencyLevels[a.urgency] || 0;
                const urgencyB = urgencyLevels[b.urgency] || 0;

                if (urgencyA !== urgencyB) {
                    return urgencyB - urgencyA; // Higher urgency first
                }

                const deadlineA = a.deadline ? new Date(a.deadline).getTime() : Infinity;
                const deadlineB = b.deadline ? new Date(b.deadline).getTime() : Infinity;

                return deadlineA - deadlineB; // Sooner deadlines first
            });
        console.log("🚀 Prioritized tasks:", prioritizedTasks);    
        res.json({ prioritizedTasks });
    } catch (error) {
        res.status(500).json({ error: "Failed to prioritize tasks" });
    }
});

module.exports = router;
