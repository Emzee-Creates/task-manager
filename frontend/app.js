const API_URL = "http://localhost:5000/api/tasks"; 
const LOGIN_URL = "http://localhost:5000/api/auth/login"; 
const REGISTER_URL = "http://localhost:5000/api/auth/register";


function logoutUser() {
    localStorage.removeItem("token");
    localStorage.removeItem("user");

    document.getElementById("taskManager").style.display = "none";
    document.getElementById("loginForm").style.display = "block";
    document.getElementById("registerForm").style.display = "block";
    document.getElementById("logoutButton").style.display = "none";
}



async function loginUser(event) {
    event.preventDefault();

    const emailInput = document.getElementById("loginEmail");
    const passwordInput = document.getElementById("loginPassword");

    if (!emailInput || !passwordInput) {
        console.error("Login form elements not found.");
        return;
    }

    const email = emailInput.value;
    const password = passwordInput.value;

    try {
        const response = await fetch(LOGIN_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, password })
        });

        const data = await response.json();
        if (response.ok) {
            localStorage.setItem("token", data.token);
            localStorage.setItem("user", JSON.stringify(data.user));
            showTaskManager();
        } else {
            alert("Login failed: " + data.message);
        }
    } catch (error) {
        console.error("Error logging in:", error);
    }
}


async function registerUser(event) {
    event.preventDefault();

    const username = document.getElementById("registerUsername").value;
    const email = document.getElementById("registerEmail").value;
    const password = document.getElementById("registerPassword").value;

    try {
        const response = await fetch(REGISTER_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username, email, password })
        });

        const data = await response.json();
        if (response.ok) {
            alert("Registration successful! You can now log in.");
        } else {
            alert("Registration failed: " + data.message);
        }
    } catch (error) {
        console.error("Error registering user:", error);
    }
}


// ✅ Check if the user is already logged in
function checkLoginStatus() {
    const token = localStorage.getItem("token");
    const user = JSON.parse(localStorage.getItem("user"));

    if (token && user) {
        showTaskManager();
    }
}

// ✅ Show Task Manager after login
function showTaskManager() {
    document.getElementById("loginForm").style.display = "none";
    document.getElementById("registerForm").style.display = "none";
    document.getElementById("taskManager").style.display = "block";
    document.getElementById("logoutButton").style.display = "inline-block";
    loadTasks();
}



async function addTask(event) {
    event.preventDefault();

    const title = document.getElementById("taskInput").value;
    const deadline = document.getElementById("taskDeadline").value;
    const urgency = document.getElementById("taskUrgency").value;
    const token = localStorage.getItem("token");

    if (!token) {
        alert("You must be logged in to add tasks.");
        return;
    }

    try {
        const response = await fetch(API_URL, {
            method: "POST",
            headers: { 
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify({ title, deadline, urgency })
        });

        const data = await response.json();
        if (response.ok) {
            console.log("✅ Task added:", data);

            // ✅ Refresh the task list after adding a new task
            loadTasks();
        } else {
            alert("Failed to add task: " + data.message);
        }
    } catch (error) {
        console.error("❌ Error adding task:", error);
    }
}



// ✅ Fetch tasks
async function loadTasks() {
    const token = localStorage.getItem("token");
    if (!token) return;

    try {
        const response = await fetch(API_URL, {
            headers: { "Authorization": `Bearer ${token}` }
        });

        const data = await response.json();
        if (response.ok) {
            renderTasks(data.incompleteTasks, data.completedTasks);
        } else {
            console.error("Failed to load tasks:", data.message);
        }
    } catch (error) {
        console.error("Error loading tasks:", error);
    }
}

// ✅ Drag-and-drop functions (Fixed)
function allowDrop(event) {
    event.preventDefault();
}

function dragStart(event) {
    event.target.style.opacity = "0.5"; 
    event.dataTransfer.setData("taskId", event.target.getAttribute("data-id"));
    event.dataTransfer.setData("isCompleted", event.target.getAttribute("data-completed"));
}

async function drop(event, newCompletedStatus) {
    event.preventDefault();
    const taskId = event.dataTransfer.getData("taskId");

    await updateTaskStatus(taskId, newCompletedStatus);
    loadTasks();
}

async function updateTaskStatus(taskId, completed) {
    const token = localStorage.getItem("token");
    if (!token) return;

    try {
        await fetch(`${API_URL}/${taskId}`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify({ completed })
        });

        loadTasks();
    } catch (error) {
        console.error("Error updating task status:", error);
    }
}

// ✅ Render Tasks (Fixed for Drag-and-Drop)
function renderTasks(incompleteTasks = [], completedTasks = []) {
    const taskList = document.getElementById("taskList");
    const completedList = document.getElementById("completedList");

    taskList.innerHTML = "";
    completedList.innerHTML = "";

    console.log("🔄 Rendering tasks:", incompleteTasks, completedTasks);

    incompleteTasks.forEach(task => {
        const li = document.createElement("li");
        li.classList.add("task-item");
        li.setAttribute("data-id", task._id);
        li.setAttribute("data-urgency", task.urgency);
        li.setAttribute("data-deadline", task.deadline);
        li.draggable = true;
        li.ondragstart = dragStart;
        li.innerHTML = `
            <span>${task.title} - ${task.urgency}</span>
            <div>
                <button onclick="editTask('${task._id}', '${task.title}', '${task.deadline}', '${task.urgency}')">
                    <i class="fas fa-edit"></i>
                </button>
                <button onclick="deleteTask('${task._id}')">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        `;
        taskList.appendChild(li);
    });

    completedTasks.forEach(task => {
        const li = document.createElement("li");
        li.classList.add("task-item", "completed");
        li.setAttribute("data-id", task._id);
        li.draggable = true;
        li.ondragstart = dragStart;
        li.innerHTML = `
            <span>${task.title} - Completed</span>
            <button onclick="deleteTask('${task._id}')">
                <i class="fas fa-trash"></i>
            </button>
        `;
        completedList.appendChild(li);
    });
}


async function prioritizeTasks() {
    const token = localStorage.getItem("token");
    if (!token) {
        alert("You must be logged in to prioritize tasks.");
        return;
    }

    try {
        // Fetch existing tasks (to keep completed tasks)
        const response = await fetch(API_URL, {
            headers: { "Authorization": `Bearer ${token}` }
        });

        const allTasks = await response.json();
        const completedTasks = allTasks.completedTasks || []; // Keep completed tasks

        // Send only incomplete tasks for prioritization
        const response2 = await fetch(`${API_URL}/prioritize`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify({ tasks: allTasks.incompleteTasks })
        });

        const data = await response2.json();
        console.log("📥 Prioritized tasks:", data.prioritizedTasks);

        if (response2.ok && data.prioritizedTasks) {
            renderTasks(data.prioritizedTasks, completedTasks); // Preserve completed tasks
        } else {
            alert("Failed to prioritize tasks: " + (data.message || "Unknown error"));
        }
    } catch (error) {
        console.error("❌ Error prioritizing tasks:", error);
    }
}

    

document.addEventListener("DOMContentLoaded", () => {
    checkLoginStatus();

    const loginBtn = document.getElementById("loginButton");
    const registerBtn = document.getElementById("registerButton");
    const logoutBtn = document.getElementById("logoutButton");
    const prioritizeBtn = document.getElementById("prioritizeButton");
    const taskForm = document.getElementById("taskForm");
    

    if (loginBtn) loginBtn.addEventListener("click", loginUser);
    if (registerBtn) registerBtn.addEventListener("click", registerUser);
    if (logoutBtn) logoutBtn.addEventListener("click", logoutUser);
    if (prioritizeBtn) prioritizeBtn.addEventListener("click", prioritizeTasks);
    if (taskForm) taskForm.addEventListener("submit", addTask);
});
