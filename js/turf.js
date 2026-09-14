import { 
    db, 
    auth, 
    collection, 
    getDocs, 
    onAuthStateChanged, 
    signOut, 
    resolveImageUrl 
} from "./firebase.js";

const turfList = document.getElementById("turfList");
const searchInput = document.getElementById("searchInput");
const userEmailDisplay = document.getElementById("userEmailDisplay");
const logoutBtn = document.getElementById("logoutBtn");

let allTurfsData = [];

// Initial standard turfs matching images in images folder
const INITIAL_TURFS = [
    { id: "turf-1", name: "Lords Turf Arena", location: "Shivaji Park, Mumbai", price: 1200, image: "img 1.jpg" },
    { id: "turf-2", name: "Eden Garden Turf", location: "Kothrud, Pune", price: 1000, image: "img 2.jpg" },
    { id: "turf-3", name: "Wankhede Box Turf", location: "Andheri West, Mumbai", price: 1500, image: "img 3.jpg" }
];

function getTurfs() {
    try {
        const stored = localStorage.getItem("allTurfsData");
        if (stored) {
            return JSON.parse(stored);
        }
    } catch (e) {}
    localStorage.setItem("allTurfsData", JSON.stringify(INITIAL_TURFS));
    return [...INITIAL_TURFS];
}

// Initialize navbar immediately from localStorage
const storedEmail = localStorage.getItem("userEmail");
if (storedEmail) {
    if (userEmailDisplay) {
        userEmailDisplay.innerHTML = `👤 <span>${storedEmail}</span>`;
        userEmailDisplay.style.display = "inline-flex";
    }
    if (logoutBtn) logoutBtn.style.display = "inline-flex";
}

// Track Firebase auth state
onAuthStateChanged(auth, (user) => {
    if (user && user.email) {
        localStorage.setItem("userEmail", user.email);
        if (userEmailDisplay) {
            userEmailDisplay.innerHTML = `👤 <span>${user.email}</span>`;
            userEmailDisplay.style.display = "inline-flex";
        }
        if (logoutBtn) logoutBtn.style.display = "inline-flex";
    } else if (!localStorage.getItem("userEmail")) {
        if (userEmailDisplay) {
            userEmailDisplay.innerHTML = `👤 <span>Guest</span>`;
        }
        if (logoutBtn) logoutBtn.style.display = "none";
    }
});

// Logout handler
if (logoutBtn) {
    logoutBtn.onclick = async () => {
        try {
            await signOut(auth);
        } catch (err) {}
        localStorage.removeItem("userEmail");
        localStorage.removeItem("userName");
        localStorage.removeItem("isAdmin");
        window.location.href = "login.html";
    };
}

// Function to select and start booking a turf
export function bookTurf(id, name, location, price, image) {
    localStorage.setItem("turfId", id || "");
    localStorage.setItem("turfName", name || "Cricket Turf");
    localStorage.setItem("turfLocation", location || "Main Stadium");
    localStorage.setItem("turfPrice", price || "0");
    localStorage.setItem("turfImage", image || "images/img 1.jpg");

    window.location.href = "booking.html";
}
window.bookTurf = bookTurf;

// Render turfs list
function renderTurfs(turfs) {
    if (!turfList) return;
    
    if (turfs.length === 0) {
        turfList.innerHTML = `
            <div class="empty-state" style="padding: 40px; background: rgba(255,255,255,0.08); border-radius: 12px; grid-column: 1 / -1;">
                <h3 style="color: white; margin-bottom: 8px;">🏏 No Turfs Available</h3>
                <p style="color: #cbd5e1;">Check back soon for available cricket pitches.</p>
            </div>
        `;
        return;
    }

    turfList.innerHTML = turfs.map((turf) => {
        const imgUrl = resolveImageUrl(turf.image);
        return `
            <div class="card" data-id="${turf.id}">
                <div class="card-img-wrap">
                    <img src="${imgUrl}" alt="${turf.name}" onerror="this.onerror=null;this.src='images/img 1.jpg';">
                    <div class="price-badge">₹ ${turf.price} / hr</div>
                </div>
                <div class="card-body">
                    <h3>${turf.name}</h3>
                    <div class="card-location">📍 ${turf.location}</div>
                    <div class="card-footer">
                        <button class="book-btn" 
                                data-id="${turf.id}"
                                data-name="${encodeURIComponent(turf.name)}"
                                data-location="${encodeURIComponent(turf.location)}"
                                data-price="${turf.price}"
                                data-image="${encodeURIComponent(turf.image || '')}">
                            Book Turf Now
                        </button>
                    </div>
                </div>
            </div>
        `;
    }).join("");

    // Attach click listeners safely
    turfList.querySelectorAll(".book-btn").forEach((btn) => {
        btn.addEventListener("click", () => {
            const id = btn.getAttribute("data-id");
            const name = decodeURIComponent(btn.getAttribute("data-name"));
            const location = decodeURIComponent(btn.getAttribute("data-location"));
            const price = btn.getAttribute("data-price");
            const image = decodeURIComponent(btn.getAttribute("data-image"));
            bookTurf(id, name, location, price, image);
        });
    });
}

// Fetch turfs
function loadTurfs() {
    allTurfsData = getTurfs();
    renderTurfs(allTurfsData);
}

// Search / Filter event listener
if (searchInput) {
    searchInput.addEventListener("input", (e) => {
        const query = e.target.value.toLowerCase().trim();
        const filtered = allTurfsData.filter(t => 
            (t.name && t.name.toLowerCase().includes(query)) || 
            (t.location && t.location.toLowerCase().includes(query))
        );
        renderTurfs(filtered);
    });
}

loadTurfs();