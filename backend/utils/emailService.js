const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: process.env.EMAIL_USER, // Your email
        pass: process.env.EMAIL_PASS  // Your email app password
    }
});

async function sendReminderEmail(to, task) {
    if (!to) {
        console.error("❌ No recipient email provided for task:", task.title);
        return;
    }

    const mailOptions = {
        from: process.env.EMAIL_USER,
        to,
        subject: `Reminder: ${task.title} is due soon!`,
        text: `Your task "${task.title}" is due on ${task.deadline}. Don't forget to complete it!`
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log(`📧 Reminder sent to ${to} for task: ${task.title}`);
    } catch (error) {
        console.error("❌ Email sending error:", error);
    }
}


module.exports = { sendReminderEmail };
