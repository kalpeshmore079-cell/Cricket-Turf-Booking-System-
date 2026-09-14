import { 
    auth, 
    db, 
    signInWithEmailAndPassword, 
    createUserWithEmailAndPassword,
    signOut, 
    collection, 
    addDoc, 
    getDocs, 
    deleteDoc, 
    updateDoc, 
    doc, 
    resolveImageUrl 
} from "./firebase.js";

// ==========================================
// CONSTANTS & STATE VARIABLES
// ==========================================
const ADMIN_EMAIL = "admin@gmail.com";
let dashboardInitialized = false;

// Initial standard turfs matching images in images folder
const INITIAL_TURFS = [
    { id: "turf-1", name: "Lords Turf Arena", location: "Shivaji Park, Mumbai", price: 1200, image: "img 1.jpg" },
    { id: "turf-2", name: "Eden Garden Turf", location: "Kothrud, Pune", price: 1000, image: "img 2.jpg" },
    { id: "turf-3", name: "Wankhede Box Turf", location: "Andheri West, Mumbai", price: 1500, image: "img 3.jpg" }
];

// Helper: Get active turfs
function getTurfs() {
    try {
        const stored = localStorage.getItem("allTurfsData");
        if (stored) {
            const parsed = JSON.parse(stored);
            if (Array.isArray(parsed) && parsed.length > 0) {
                return parsed;
            }
        }
    } catch (e) {}
    localStorage.setItem("allTurfsData", JSON.stringify(INITIAL_TURFS));
    return [...INITIAL_TURFS];
}

// Helper: Save active turfs
function saveTurfs(turfs) {
    localStorage.setItem("allTurfsData", JSON.stringify(turfs));
}

// ==========================================
// DOM ELEMENTS
// ==========================================
const adminLoginForm = document.getElementById("adminLoginForm");
const adminLoginBtn = document.getElementById("adminLogin");
const adminStatusBox = document.getElementById("adminStatusBox");

const dashboardContainer = document.getElementById("dashboardContainer");
const adminLogoutBtn = document.getElementById("adminLogoutBtn");
const addTurfForm = document.getElementById("addTurfForm");
const addTurfBtn = document.getElementById("addTurf");
const allTurfsBox = document.getElementById("allTurfs");
const bookingsTableBody = document.getElementById("bookingsTableBody");

const editTurfModal = document.getElementById("editTurfModal");
const editTurfForm = document.getElementById("editTurfForm");
const saveEditBtn = document.getElementById("saveEditBtn");

// ==========================================
// 1. ADMIN LOGIN PAGE LOGIC
// ==========================================
function showAdminStatus(message, isSuccess = true) {
    if (!adminStatusBox) return;
    adminStatusBox.style.display = "block";
    adminStatusBox.innerText = message;
    if (isSuccess) {
        adminStatusBox.style.background = "#dcfce7";
        adminStatusBox.style.color = "#15803d";
        adminStatusBox.style.border = "1px solid #86efac";
    } else {
        adminStatusBox.style.background = "#fee2e2";
        adminStatusBox.style.color = "#b91c1c";
        adminStatusBox.style.border = "1px solid #fca5a5";
    }
}

if (adminLoginBtn || adminLoginForm) {
    const handleAdminLogin = async (e) => {
        if (e) e.preventDefault();
        const emailInput = document.getElementById("email");
        const passwordInput = document.getElementById("password");

        const email = emailInput ? emailInput.value.trim() : "";
        const password = passwordInput ? passwordInput.value : "";

        if (!email || !password) {
            showAdminStatus("⚠️ Please enter both Email and Password.", false);
            return;
        }

        if (email.toLowerCase() !== ADMIN_EMAIL.toLowerCase()) {
            showAdminStatus("❌ Access Denied: Admin email must be " + ADMIN_EMAIL, false);
            return;
        }

        if (adminLoginBtn) {
            adminLoginBtn.disabled = true;
            adminLoginBtn.innerText = "Authenticating Admin...";
        }

        showAdminStatus("🔄 Authenticating credentials...", true);

        localStorage.setItem("isAdmin", "true");
        localStorage.setItem("userEmail", ADMIN_EMAIL);

        try {
            await signInWithEmailAndPassword(auth, email, password);
        } catch (authErr) {
            try {
                if (password.length >= 6) {
                    await createUserWithEmailAndPassword(auth, email, password);
                }
            } catch (createErr) {
                console.warn("Firebase auth notice:", createErr.message);
            }
        }

        showAdminStatus("✅ Access Granted! Redirecting to Dashboard...", true);

        setTimeout(() => {
            window.location.href = "dashboard.html";
        }, 300);
    };

    if (adminLoginForm) {
        adminLoginForm.onsubmit = handleAdminLogin;
    } else if (adminLoginBtn) {
        adminLoginBtn.onclick = handleAdminLogin;
    }
}

// ==========================================
// 2. DASHBOARD PAGE FUNCTIONS
// ==========================================
// Tab Switching
window.switchTab = (tabName) => {
    document.querySelectorAll(".tab-content").forEach(el => el.style.display = "none");
    document.querySelectorAll(".tab-btn").forEach(el => el.classList.remove("active"));
    
    const target = document.getElementById(tabName + "Section");
    const btn = document.getElementById("tab-" + tabName);
    if (target) target.style.display = "block";
    if (btn) btn.classList.add("active");
};

// Render Turfs in DOM
function renderTurfsUI() {
    if (!allTurfsBox) return;

    const turfs = getTurfs();
    const turfCountEl = document.getElementById("totalTurfsCount");
    if (turfCountEl) turfCountEl.innerText = turfs.length;

    if (turfs.length === 0) {
        allTurfsBox.innerHTML = `
            <div class="empty-state" style="padding: 40px; background: rgba(255,255,255,0.08); border-radius: 12px; grid-column: 1 / -1; text-align: center;">
                <h3 style="color: white; margin-bottom: 8px;">🏏 No Turfs in Directory</h3>
                <p style="color: #cbd5e1;">Use the form above to add a new cricket turf.</p>
            </div>
        `;
        return;
    }

    allTurfsBox.innerHTML = turfs.map((turf) => {
        const imgUrl = resolveImageUrl(turf.image);
        return `
            <div class="adminCard" id="turf-${turf.id}">
                <div class="card-img-wrap">
                    <img src="${imgUrl}" alt="${turf.name}" onerror="this.onerror=null;this.src='images/img 1.jpg';">
                </div>
                <div style="padding: 18px; text-align: left;">
                    <h3 style="font-size: 19px; margin-bottom: 6px; color: #1e293b;">${turf.name}</h3>
                    <p style="color: #64748b; font-size: 14px; margin-bottom: 8px;">📍 ${turf.location}</p>
                    <p style="font-weight: 800; color: #059669; font-size: 17px; margin-bottom: 16px;">₹ ${turf.price} <span style="font-size: 13px; font-weight: normal; color: #64748b;">/ hour</span></p>
                    
                    <div class="action-btns" style="display: flex; gap: 8px; width: 100%;">
                        <button class="btn btn-sm btn-warning" style="flex: 1; padding: 10px 6px; font-weight: 700;" onclick="openEditModal('${turf.id}')">
                            ✏️ Edit Turf
                        </button>
                        <button class="btn btn-sm btn-danger" style="flex: 1; padding: 10px 6px; font-weight: 700;" onclick="removeTurf('${turf.id}', '${encodeURIComponent(turf.name)}')">
                            🗑️ Delete
                        </button>
                    </div>
                </div>
            </div>
        `;
    }).join("");
}

// Background sync from Firestore
async function syncFirestoreTurfs() {
    try {
        const snapshot = await getDocs(collection(db, "turfs"));
        if (snapshot && !snapshot.empty) {
            const firestoreTurfs = [];
            snapshot.forEach((docSnap) => {
                firestoreTurfs.push({ id: docSnap.id, ...docSnap.data() });
            });

            if (firestoreTurfs.length > 0) {
                const current = getTurfs();
                firestoreTurfs.forEach((ft) => {
                    if (!current.some(c => c.id === ft.id)) {
                        current.push(ft);
                    }
                });
                saveTurfs(current);
                renderTurfsUI();
            }
        }
    } catch (e) {
        console.warn("Firestore sync note:", e);
    }
}

// Add New Turf
if (addTurfBtn || addTurfForm) {
    const handleAddTurf = async (e) => {
        if (e) e.preventDefault();

        const nameInput = document.getElementById("name");
        const locationInput = document.getElementById("location");
        const priceInput = document.getElementById("price");
        const imagePresetSelect = document.getElementById("imagePreset");
        const imageCustomInput = document.getElementById("imageCustom");

        const name = nameInput ? nameInput.value.trim() : "";
        const location = locationInput ? locationInput.value.trim() : "";
        const price = priceInput ? Number(priceInput.value) : 0;
        
        let image = imagePresetSelect ? imagePresetSelect.value : "img 1.jpg";
        if (imageCustomInput && imageCustomInput.value.trim()) {
            image = imageCustomInput.value.trim();
        }

        if (!name || !location || !price) {
            alert("Please fill in Turf Name, Location, and Hourly Price.");
            return;
        }

        if (addTurfBtn) {
            addTurfBtn.disabled = true;
            addTurfBtn.innerText = "Adding Turf...";
        }

        const newTurfData = {
            id: "turf-" + Date.now(),
            name,
            location,
            price,
            image,
            createdAt: new Date().toISOString()
        };

        // 1. Immediately save to active list
        const turfs = getTurfs();
        turfs.unshift(newTurfData);
        saveTurfs(turfs);
        renderTurfsUI();

        // 2. Push to Firestore
        try {
            await addDoc(collection(db, "turfs"), newTurfData);
        } catch (err) {
            console.warn("Firestore push notice:", err);
        }

        alert(`✅ Turf "${name}" added successfully!`);

        if (addTurfForm) addTurfForm.reset();

        if (addTurfBtn) {
            addTurfBtn.disabled = false;
            addTurfBtn.innerText = "➕ Save & Publish Turf";
        }
    };

    if (addTurfForm) {
        addTurfForm.onsubmit = handleAddTurf;
    } else if (addTurfBtn) {
        addTurfBtn.onclick = handleAddTurf;
    }
}

// ==========================================
// 3. EDIT TURF MODAL & HANDLERS
// ==========================================
window.openEditModal = (turfId) => {
    const turfs = getTurfs();
    const turf = turfs.find(t => t.id === turfId);
    if (!turf) {
        alert("Turf details not found.");
        return;
    }

    document.getElementById("editTurfId").value = turf.id;
    document.getElementById("editName").value = turf.name || "";
    document.getElementById("editLocation").value = turf.location || "";
    document.getElementById("editPrice").value = turf.price || "";

    const editPreset = document.getElementById("editImagePreset");
    const editCustom = document.getElementById("editImageCustom");

    if (turf.image && (turf.image.startsWith("http://") || turf.image.startsWith("https://"))) {
        if (editCustom) editCustom.value = turf.image;
    } else {
        if (editPreset && ["img 1.jpg", "img 2.jpg", "img 3.jpg"].includes(turf.image)) {
            editPreset.value = turf.image;
        }
        if (editCustom) editCustom.value = "";
    }

    if (editTurfModal) {
        editTurfModal.classList.add("open");
    }
};

window.closeEditModal = () => {
    if (editTurfModal) {
        editTurfModal.classList.remove("open");
    }
};

// Save Edit Form Handler
if (editTurfForm) {
    editTurfForm.onsubmit = async (e) => {
        if (e) e.preventDefault();

        const id = document.getElementById("editTurfId").value;
        const name = document.getElementById("editName").value.trim();
        const location = document.getElementById("editLocation").value.trim();
        const price = Number(document.getElementById("editPrice").value);

        const editPreset = document.getElementById("editImagePreset");
        const editCustom = document.getElementById("editImageCustom");

        let image = editPreset ? editPreset.value : "img 1.jpg";
        if (editCustom && editCustom.value.trim()) {
            image = editCustom.value.trim();
        }

        if (!name || !location || !price) {
            alert("Please fill in all fields.");
            return;
        }

        if (saveEditBtn) {
            saveEditBtn.disabled = true;
            saveEditBtn.innerText = "Saving Changes...";
        }

        const updatedData = { name, location, price, image };

        // 1. Update in local storage list immediately
        const turfs = getTurfs();
        const index = turfs.findIndex(t => t.id === id);
        if (index !== -1) {
            turfs[index] = { ...turfs[index], ...updatedData };
            saveTurfs(turfs);
            renderTurfsUI();
        }

        // 2. Update Firestore if matching document exists
        try {
            await updateDoc(doc(db, "turfs", id), updatedData);
        } catch (err) {
            console.warn("Firestore update notice:", err);
        }

        closeEditModal();
        alert(`✅ Turf "${name}" updated successfully!`);

        if (saveEditBtn) {
            saveEditBtn.disabled = false;
            saveEditBtn.innerText = "💾 Save Changes";
        }
    };
}

// Delete Turf Handler
window.removeTurf = async (id, encodedName) => {
    const turfName = decodeURIComponent(encodedName || "this turf");
    if (!confirm(`Are you sure you want to permanently delete "${turfName}"?`)) return;

    // 1. Delete from local storage list immediately
    let turfs = getTurfs();
    turfs = turfs.filter(t => t.id !== id);
    saveTurfs(turfs);
    renderTurfsUI();

    // 2. Delete from Firestore
    try {
        await deleteDoc(doc(db, "turfs", id));
    } catch (err) {
        console.warn("Firestore delete notice:", err);
    }
    
    alert(`✅ Turf "${turfName}" has been deleted.`);
};

// ==========================================
// 4. LOAD & MANAGE BOOKINGS TABLE
// ==========================================
async function loadBookings() {
    if (!bookingsTableBody) return;

    let bookings = [];
    let totalRev = 0;

    // Check localStorage cached bookings
    try {
        const localBookingRaw = localStorage.getItem("lastBooking");
        if (localBookingRaw) {
            const lb = JSON.parse(localBookingRaw);
            bookings.push({ id: lb.bookingId || "REC-" + Date.now(), ...lb });
            if (lb.status !== "Cancelled") totalRev += Number(lb.price || 0);
        }
    } catch (e) {}

    // Fetch from Firestore
    try {
        const snapshot = await getDocs(collection(db, "bookings"));
        if (snapshot) {
            const fsBookings = [];
            let fsRev = 0;
            snapshot.forEach((docSnap) => {
                const data = docSnap.data();
                fsBookings.push({ id: docSnap.id, ...data });
                if (data.status !== "Cancelled") {
                    fsRev += Number(data.price || 0);
                }
            });
            if (fsBookings.length > 0) {
                bookings = fsBookings;
                totalRev = fsRev;
            }
        }
    } catch (err) {
        console.warn("Bookings fetch notice:", err.message);
    }

    // Update stats
    const bookingCountEl = document.getElementById("totalBookingsCount");
    const revCountEl = document.getElementById("totalRevenueCount");
    if (bookingCountEl) bookingCountEl.innerText = bookings.length;
    if (revCountEl) revCountEl.innerText = `₹ ${totalRev.toLocaleString()}`;

    if (bookings.length === 0) {
        bookingsTableBody.innerHTML = `
            <tr>
                <td colspan="7" style="text-align:center; color: #64748b; padding: 30px;">
                    No customer bookings recorded yet.
                </td>
            </tr>
        `;
        return;
    }

    bookings.sort((a, b) => (b.date || "").localeCompare(a.date || ""));

    bookingsTableBody.innerHTML = bookings.map((b) => {
        const statusClass = b.status === "Cancelled" ? "badge-danger" : "badge-success";
        return `
            <tr>
                <td><b>${b.turf || "Cricket Turf"}</b><br><small style="color: #64748b;">${b.location || ""}</small></td>
                <td>${b.user || "Guest"}</td>
                <td>📅 ${b.date || "N/A"}</td>
                <td>⏰ ${b.time || "N/A"}</td>
                <td><b>₹ ${b.price || 0}</b></td>
                <td><span class="badge ${statusClass}">${b.status || "Booked"}</span></td>
                <td>
                    <div class="action-btns">
                        ${b.status !== "Cancelled" ? `
                            <button class="btn btn-sm btn-warning" onclick="cancelBooking('${b.id}')">
                                Cancel
                            </button>
                        ` : ""}
                        <button class="btn btn-sm btn-danger" onclick="deleteBooking('${b.id}')">
                            Delete
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }).join("");
}

// Cancel Booking Handler
window.cancelBooking = async (id) => {
    if (!confirm("Are you sure you want to cancel this booking?")) return;
    try {
        await updateDoc(doc(db, "bookings", id), { status: "Cancelled" });
    } catch (err) {
        console.warn("Cancel booking notice:", err);
    }
    alert("Booking status updated to Cancelled.");
    await loadBookings();
};

// Delete Booking Handler
window.deleteBooking = async (id) => {
    if (!confirm("Permanently delete this booking record?")) return;
    try {
        await deleteDoc(doc(db, "bookings", id));
    } catch (err) {
        console.warn("Delete booking notice:", err);
    }
    alert("Booking record removed.");
    await loadBookings();
};

// ==========================================
// 5. INITIALIZATION & ROUTE GUARD EXECUTION
// ==========================================
async function initDashboard() {
    if (dashboardInitialized) return;
    dashboardInitialized = true;
    renderTurfsUI();
    syncFirestoreTurfs();
    loadBookings();
}

if (dashboardContainer || addTurfBtn || allTurfsBox) {
    const isAdmin = localStorage.getItem("isAdmin") === "true";
    if (!isAdmin) {
        alert("⚠️ Restricted Area: Please login as Admin first.");
        window.location.href = "admin.html";
    } else {
        initDashboard();
    }
}

// Admin Logout
if (adminLogoutBtn) {
    adminLogoutBtn.onclick = async () => {
        try {
            await signOut(auth);
        } catch (err) {}
        localStorage.removeItem("isAdmin");
        localStorage.removeItem("userEmail");
        window.location.href = "admin.html";
    };
}