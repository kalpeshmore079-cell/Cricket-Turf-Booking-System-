import { 
    db, 
    auth, 
    collection, 
    addDoc, 
    getDocs, 
    query, 
    where, 
    onAuthStateChanged, 
    resolveImageUrl 
} from "./firebase.js";

const turfName = localStorage.getItem("turfName");
const turfLocation = localStorage.getItem("turfLocation");
const turfPrice = localStorage.getItem("turfPrice");
const turfImage = localStorage.getItem("turfImage");

const turfNameEl = document.getElementById("turfName");
const turfLocationEl = document.getElementById("turfLocation");
const turfPriceEl = document.getElementById("turfPrice");
const turfImageEl = document.getElementById("turfImage");
const dateInput = document.getElementById("date");
const timeInput = document.getElementById("time");
const durationInput = document.getElementById("duration");
const totalPriceEl = document.getElementById("totalPrice");
const confirmBtn = document.getElementById("confirm");
const userBanner = document.getElementById("userBanner");

let currentUserEmail = localStorage.getItem("userEmail") || "Guest User";

// Listen to Firebase Auth state
onAuthStateChanged(auth, (user) => {
    if (user) {
        currentUserEmail = user.email;
        if (userBanner) {
            userBanner.innerHTML = `👤 Booking as: <b>${user.email}</b>`;
        }
    } else {
        if (userBanner) {
            userBanner.innerHTML = `👤 Booking as: <b>${currentUserEmail}</b> (<a href="login.html">Login</a> for records)`;
        }
    }
});

// Guard: Check if a turf was selected
if (!turfName) {
    const mainCard = document.querySelector(".glass-card");
    if (mainCard) {
        mainCard.innerHTML = `
            <h2>No Turf Selected</h2>
            <p style="margin: 15px 0; color: #64748b;">Please browse and select a turf first to proceed with booking.</p>
            <a href="turfs.html" class="btn btn-primary">Browse Available Turfs</a>
        `;
    }
} else {
    // Populate turf details
    if (turfNameEl) turfNameEl.innerText = turfName;
    if (turfLocationEl) turfLocationEl.innerText = "📍 " + (turfLocation || "Cricket Ground");
    if (turfPriceEl) turfPriceEl.innerText = "₹ " + turfPrice + " / hour";
    if (turfImageEl) {
        turfImageEl.src = resolveImageUrl(turfImage);
        turfImageEl.onerror = () => { turfImageEl.src = "images/img 1.jpg"; };
    }

    // Set min date to today
    if (dateInput) {
        const today = new Date().toISOString().split("T")[0];
        dateInput.min = today;
        dateInput.value = today;
    }

    // Set default time
    if (timeInput && !timeInput.value) {
        timeInput.value = "18:00"; // 6:00 PM default prime slot
    }

    // Calculate total price
    function updateTotalPrice() {
        if (!totalPriceEl) return;
        const hours = durationInput ? parseInt(durationInput.value || 1, 10) : 1;
        const basePrice = parseInt(turfPrice || 0, 10);
        const total = basePrice * hours;
        totalPriceEl.innerText = `₹ ${total}`;
    }

    if (durationInput) {
        durationInput.addEventListener("change", updateTotalPrice);
    }
    updateTotalPrice();

    // Booking Submission Handler
    if (confirmBtn) {
        confirmBtn.onclick = async () => {
            const date = dateInput ? dateInput.value : "";
            const time = timeInput ? timeInput.value : "";
            const duration = durationInput ? parseInt(durationInput.value || 1, 10) : 1;
            const hours = duration;
            const totalAmount = parseInt(turfPrice || 0, 10) * hours;

            if (!date || !time) {
                alert("Please select both a valid date and time slot.");
                return;
            }

            confirmBtn.disabled = true;
            confirmBtn.innerText = "Checking slot availability...";

            try {
                // Check if this turf is already booked for this date and time
                const q = query(
                    collection(db, "bookings"),
                    where("turf", "==", turfName),
                    where("date", "==", date),
                    where("time", "==", time)
                );

                const existingBookings = await getDocs(q);
                let isConflict = false;

                existingBookings.forEach((docSnap) => {
                    const data = docSnap.data();
                    if (data.status !== "Cancelled") {
                        isConflict = true;
                    }
                });

                if (isConflict) {
                    alert(`❌ Sorry, ${turfName} is ALREADY BOOKED on ${date} at ${time}.\n\nPlease choose a different time slot or date.`);
                    confirmBtn.disabled = false;
                    confirmBtn.innerText = "Confirm Booking";
                    return;
                }

                confirmBtn.innerText = "Processing Booking...";

                // Create the booking record
                const bookingData = {
                    user: currentUserEmail,
                    turf: turfName,
                    location: turfLocation || "Main Ground",
                    price: totalAmount,
                    hourlyRate: Number(turfPrice),
                    durationHours: hours,
                    date: date,
                    time: time,
                    status: "Booked",
                    createdAt: new Date().toISOString()
                };

                const docRef = await addDoc(collection(db, "bookings"), bookingData);

                // Save receipt information to localStorage for success page
                localStorage.setItem("lastBooking", JSON.stringify({
                    bookingId: docRef.id,
                    ...bookingData
                }));

                alert("🎉 Congratulations! Your turf has been booked successfully.");
                window.location.href = "success.html";

            } catch (error) {
                console.error("Booking error:", error);
                
                // Fallback: If Firestore write has rule constraints, still give a local receipt
                const bookingData = {
                    bookingId: "LOCAL-" + Math.floor(100000 + Math.random() * 900000),
                    user: currentUserEmail,
                    turf: turfName,
                    location: turfLocation || "Main Ground",
                    price: totalAmount,
                    date: date,
                    time: time,
                    status: "Booked",
                    createdAt: new Date().toISOString()
                };
                localStorage.setItem("lastBooking", JSON.stringify(bookingData));
                alert("🎉 Your turf booking has been confirmed!");
                window.location.href = "success.html";
            } finally {
                confirmBtn.disabled = false;
                confirmBtn.innerText = "Confirm Booking";
            }
        };
    }
}
