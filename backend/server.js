require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const taskRoutes = require("./routes/taskRoutes");
const authRoutes = require("./routes/authRoutes");

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(express.json());
app.use(cors());

// Routes
app.use("/api/tasks", taskRoutes);
app.use("/api/auth", authRoutes);

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB Connected"))
  .catch(err => console.error("❌ DB Connection Failed:", err));

  const cron = require("node-cron");
  const Task = require("./models/Task");
  const User = require("./models/userModel");
  const { sendReminderEmail } = require("./utils/emailService");
  
  // Run every day at 8 AM
  cron.schedule("0 8 * * *", async () => {
      console.log("🔔 Checking for task reminders...");
  
      const now = new Date();
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
  
      try {
          const tasks = await Task.find({
              completed: false,
              deadline: { $gte: now, $lte: tomorrow }
          }).populate("user","email");
  
          tasks.forEach(task => {
            console.log(`📧 Preparing email for: ${task.user?.email || "No Email Found"} - Task: ${task.title}`);
              if (task.user && task.user.email) {
                  sendReminderEmail(task.user.email, task);
              }
          });
      } catch (error) {
          console.error("❌ Error checking tasks for reminders:", error);
      }
  });
  


// Start Server
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
