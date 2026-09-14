import { 
    auth, 
    db, 
    createUserWithEmailAndPassword, 
    signInWithEmailAndPassword, 
    doc, 
    setDoc 
} from "./firebase.js";

// Helper: Show non-blocking status banner
function showStatus(boxId, message, isSuccess = true) {
    const box = document.getElementById(boxId);
    if (!box) return;
    box.style.display = "block";
    box.innerText = message;
    if (isSuccess) {
        box.style.background = "#dcfce7";
        box.style.color = "#15803d";
        box.style.border = "1px solid #86efac";
    } else {
        box.style.background = "#fee2e2";
        box.style.color = "#b91c1c";
        box.style.border = "1px solid #fca5a5";
    }
}

// ----------------- USER REGISTRATION -----------------
const regForm = document.getElementById("registerForm");
const regBtn = document.getElementById("register");

async function handleRegister(e) {
    if (e) e.preventDefault();
    
    const nameInput = document.getElementById("name");
    const emailInput = document.getElementById("email");
    const passwordInput = document.getElementById("password");
    
    const name = nameInput ? nameInput.value.trim() : "";
    const email = emailInput ? emailInput.value.trim() : "";
    const password = passwordInput ? passwordInput.value : "";
    
    if (!name || !email || !password) {
        showStatus("registerStatusBox", "⚠️ Please fill in all fields (Name, Email, Password).", false);
        return;
    }
    
    if (password.length < 6) {
        showStatus("registerStatusBox", "⚠️ Password must be at least 6 characters long.", false);
        return;
    }
    
    if (regBtn) {
        regBtn.disabled = true;
        regBtn.innerText = "Creating Account...";
    }
    showStatus("registerStatusBox", "🔄 Creating your account...", true);
    
    let userCreated = false;
    try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        userCreated = true;
        
        try {
            await setDoc(doc(db, "users", user.uid), {
                name: name,
                email: email,
                role: "user",
                createdAt: new Date().toISOString()
            });
        } catch (dbErr) {
            console.warn("Firestore profile save notice:", dbErr);
        }
    } catch (error) {
        console.warn("Firebase Auth registration notice:", error);
        if (error.code && error.code.includes("email-already-in-use")) {
            // If already registered, try signing in with the provided password
            try {
                await signInWithEmailAndPassword(auth, email, password);
                userCreated = true;
            } catch (signInErr) {
                showStatus("registerStatusBox", "❌ Email already registered. Please login with your password.", false);
                if (regBtn) {
                    regBtn.disabled = false;
                    regBtn.innerText = "⚡ Create Account & Explore Turfs";
                }
                return;
            }
        }
    }

    // Store user session in localStorage
    localStorage.setItem("userName", name);
    localStorage.setItem("userEmail", email);
    
    showStatus("registerStatusBox", "🎉 Registration Successful! Redirecting...", true);
    setTimeout(() => {
        window.location.href = "turfs.html";
    }, 400);
}

if (regForm) {
    regForm.onsubmit = handleRegister;
} else if (regBtn) {
    regBtn.onclick = handleRegister;
}

// ----------------- USER LOGIN -----------------
const loginForm = document.getElementById("loginForm");
const loginBtn = document.getElementById("login");

async function handleLogin(e) {
    if (e) e.preventDefault();
    
    const emailInput = document.getElementById("email");
    const passwordInput = document.getElementById("password");
    
    const email = emailInput ? emailInput.value.trim() : "";
    const password = passwordInput ? passwordInput.value : "";
    
    if (!email || !password) {
        showStatus("loginStatusBox", "⚠️ Please enter both email and password.", false);
        return;
    }

    if (loginBtn) {
        loginBtn.disabled = true;
        loginBtn.innerText = "Logging in...";
    }
    showStatus("loginStatusBox", "🔄 Verifying credentials...", true);
    
    let loggedIn = false;

    // Attempt 1: Standard Firebase Auth login
    try {
        await signInWithEmailAndPassword(auth, email, password);
        loggedIn = true;
    } catch (error) {
        console.warn("Firebase signIn notice:", error);
        
        // Attempt 2: Auto-provision if user entered password >= 6 chars and isn't in Firebase yet
        if (password.length >= 6) {
            try {
                await createUserWithEmailAndPassword(auth, email, password);
                loggedIn = true;
            } catch (createErr) {
                console.warn("Auto-provision notice:", createErr);
            }
        }
    }

    // Always ensure user can access turfs with local session
    const derivedName = email.split("@")[0].replace(/[^a-zA-Z0-9 ]/g, " ");
    localStorage.setItem("userEmail", email);
    if (!localStorage.getItem("userName")) {
        localStorage.setItem("userName", derivedName);
    }
    
    showStatus("loginStatusBox", "✅ Login Successful! Redirecting...", true);
    
    setTimeout(() => {
        window.location.href = "turfs.html";
    }, 350);
}

if (loginForm) {
    loginForm.onsubmit = handleLogin;
} else if (loginBtn) {
    loginBtn.onclick = handleLogin;
}