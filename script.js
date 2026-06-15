// Kalpesh Cricket Turf Booking - Premium 3D Interaction Engine
// Optimized for performance on low-end ("potato") laptops.

// Turf Data definition
const turfData = [
    {
        id: 0,
        name: "Wankhede Premium",
        badge: "Championship Pitch",
        desc: "Elite hybrid-grass field with professional crease markings. Replicates the iconic pitch condition of Wankhede, giving high carry and true bounce. Ideal for competitive matches.",
        size: "130 x 85 ft",
        bounce: "Medium-High",
        capacity: "16 Players",
        type: "Open Air Stadium",
        price: 1200,
        rating: "4.9",
        reviews: 142,
        color: 0x2e7d32, // deep green grass
        themeColor: "#00e676",
        pitchColor: 0xc5a059 // light dry clay
    },
    {
        id: 1,
        name: "Eden Gardens Floodlit",
        badge: "Floodlit Special",
        desc: "Lush outfield designed for spectacular nighttime play under high-powered professional floodlights. Offers excellent spin assistance and dew protection.",
        size: "120 x 80 ft",
        bounce: "Medium",
        capacity: "14 Players",
        type: "Floodlit Ring",
        price: 1500, // Night rates
        rating: "4.8",
        reviews: 98,
        color: 0x1b5e20, // dark lush grass
        themeColor: "#00b0ff",
        pitchColor: 0xd7ccc8 // standard clay
    },
    {
        id: 2,
        name: "Lords Indoor Net",
        badge: "All Weather",
        desc: "Climate-controlled indoor arena wrapped in high-tensile safety netting. Continuous bounce-back action and non-stop play regardless of wind or rain.",
        size: "100 x 60 ft",
        bounce: "Consistent Low",
        capacity: "10 Players",
        type: "Indoor / Closed",
        price: 1000,
        rating: "4.7",
        reviews: 76,
        color: 0x388e3c, // bright synthetic turf
        themeColor: "#ffd700",
        pitchColor: 0xa1887f // artificial matting
    },
    {
        id: 3,
        name: "Melbourne Bouncy",
        badge: "Fast & Bouncy",
        desc: "Styled after the hard Australian pitches. Features a clay-rich surface designed to give raw pace, steep bounce, and challenge batsmen. Excellent for fast bowlers.",
        size: "140 x 90 ft",
        bounce: "Extreme High",
        capacity: "18 Players",
        type: "Huge Arena",
        price: 1300,
        rating: "4.6",
        reviews: 54,
        color: 0x4caf50, // dry green
        themeColor: "#ff9100",
        pitchColor: 0x8d6e63 // hard baked soil
    },
    {
        id: 4,
        name: "Gabba Wet-Turf",
        badge: "Green Top",
        desc: "Damp-soil green pitch providing high swing and seam movement. Best suited for bowlers who love swing and batsmen looking to hone their technique.",
        size: "115 x 75 ft",
        bounce: "Variable High",
        capacity: "12 Players",
        type: "Slightly Humid",
        price: 1100,
        rating: "4.5",
        reviews: 38,
        color: 0x004d40, // deep teal-green grass
        themeColor: "#e040fb",
        pitchColor: 0x5d4037 // damp dark clay
    }
];

// Available Time Slots definition
const timeSlots = [
    { id: "s1", time: "06:00 AM - 08:00 AM", rate: 0.8 }, // Morning discount
    { id: "s2", time: "08:00 AM - 10:00 AM", rate: 0.9 },
    { id: "s3", time: "10:00 AM - 12:00 PM", rate: 0.9 },
    { id: "s4", time: "12:00 PM - 02:00 PM", rate: 0.8 }, // Afternoon heat discount
    { id: "s5", time: "02:00 PM - 04:00 PM", rate: 0.9 },
    { id: "s6", time: "04:00 PM - 06:00 PM", rate: 1.0 }, // Peak evening
    { id: "s7", time: "06:00 PM - 08:00 PM", rate: 1.2 }, // Night floodlit
    { id: "s8", time: "08:00 PM - 10:00 PM", rate: 1.2 }  // Night floodlit
];

// Global State
let activeTurfIndex = 0;
let selectedSlotId = null;
let bookingDate = "";
let isPotatoMode = true; // Default to optimized mode for potato laptops!

// Three.js Objects
let scene, camera, renderer;
let turfGroups = []; // Array of groups for each turf
const turfSpacing = 22; // Horizontal distance between each turf stadium
let cameraTargetX = 0;
let cameraCurrentX = 0;
let lightConeRotation = 0;
let floodlightBeams = [];

// Initialize Page and Three.js
window.addEventListener('load', () => {
    // Set date input to today by default
    const dateInput = document.getElementById('booking-date');
    const today = new Date();
    const formattedDate = today.toISOString().split('T')[0];
    dateInput.value = formattedDate;
    dateInput.min = formattedDate;
    bookingDate = formattedDate;

    // Load initial slots list
    renderSlots();

    // Setup UI listeners
    initUIListeners();

    // Setup Three.js
    initThreeJS();

    // Hide Loading Screen
    setTimeout(() => {
        const loader = document.getElementById('loading-screen');
        loader.style.opacity = '0';
        setTimeout(() => loader.style.display = 'none', 500);
    }, 1200);
});

// UI Event Listeners Setup
function initUIListeners() {
    const prevBtn = document.getElementById('prev-btn');
    const nextBtn = document.getElementById('next-btn');
    const turfSelect = document.getElementById('turf-select');
    const perfToggle = document.getElementById('perf-toggle');
    const dateInput = document.getElementById('booking-date');
    const bookBtn = document.getElementById('book-now-btn');
    const closeTicketBtn = document.getElementById('close-ticket-btn');
    const modalOverlay = document.getElementById('modal-overlay');

    // Navigation arrows
    prevBtn.addEventListener('click', () => {
        if (activeTurfIndex > 0) {
            updateActiveTurf(activeTurfIndex - 1);
        }
    });

    nextBtn.addEventListener('click', () => {
        if (activeTurfIndex < turfData.length - 1) {
            updateActiveTurf(activeTurfIndex + 1);
        }
    });

    // Range slider
    turfSelect.addEventListener('input', (e) => {
        updateActiveTurf(parseInt(e.target.value));
    });

    // Performance Mode Toggle
    perfToggle.addEventListener('click', () => {
        isPotatoMode = !isPotatoMode;
        if (isPotatoMode) {
            perfToggle.classList.remove('btn-primary');
            perfToggle.classList.add('btn-secondary');
            perfToggle.querySelector('span').textContent = 'Mode: Potato';
            applyPerformanceSettings(false);
        } else {
            perfToggle.classList.remove('btn-secondary');
            perfToggle.classList.add('btn-primary');
            perfToggle.querySelector('span').textContent = 'Mode: High Quality';
            applyPerformanceSettings(true);
        }
    });

    // Date change
    dateInput.addEventListener('change', (e) => {
        bookingDate = e.target.value;
        validateBookingForm();
    });

    // Book Now button clicks
    bookBtn.addEventListener('click', handleBookingSubmit);

    // Modal Close
    closeTicketBtn.addEventListener('click', toggleModal);
    modalOverlay.addEventListener('click', toggleModal);
}

// Update Active Turf Details & camera slide position
function updateActiveTurf(index) {
    activeTurfIndex = index;
    
    // Update HTML slider controls
    document.getElementById('turf-select').value = index;
    document.getElementById('slider-index').textContent = index + 1;

    // Slide Camera Target
    cameraTargetX = index * turfSpacing;

    // Get Active Turf Info
    const info = turfData[index];

    // Populate Turf Panel Info with transition
    const infoPanel = document.querySelector('.turf-info-panel');
    infoPanel.style.opacity = '0.5';
    
    setTimeout(() => {
        document.getElementById('turf-badge').textContent = info.badge;
        document.getElementById('turf-title').textContent = info.name;
        document.getElementById('turf-rating').textContent = info.rating;
        document.querySelector('.reviews-count').textContent = `(${info.reviews}+ reviews)`;
        document.getElementById('turf-desc').textContent = info.desc;
        document.getElementById('turf-size').textContent = info.size;
        document.getElementById('turf-bounce').textContent = info.bounce;
        document.getElementById('turf-capacity').textContent = info.capacity;
        document.getElementById('turf-type').textContent = info.type;
        document.getElementById('turf-price').textContent = info.price.toLocaleString('en-IN');
        
        // Update primary CSS colors dynamically for glows
        document.documentElement.style.setProperty('--color-primary', info.themeColor);
        document.documentElement.style.setProperty('--color-primary-glow', `${info.themeColor}66`);

        // Recalculate price and slots based on the new active turf
        selectedSlotId = null;
        renderSlots();
        updateSummary();
        validateBookingForm();
        
        infoPanel.style.opacity = '1';
    }, 150);
}

// Generate Time Slots in Grid
function renderSlots() {
    const container = document.getElementById('slots-container');
    container.innerHTML = '';

    const turf = turfData[activeTurfIndex];

    timeSlots.forEach(slot => {
        const finalPrice = Math.round(turf.price * slot.rate);
        
        const btn = document.createElement('button');
        btn.className = 'slot-btn';
        if (slot.id === selectedSlotId) {
            btn.classList.add('selected');
        }
        btn.innerHTML = `
            <div>${slot.time}</div>
            <div style="font-weight: 700; margin-top: 2px;">₹${finalPrice}</div>
        `;

        btn.addEventListener('click', () => {
            if (selectedSlotId === slot.id) {
                selectedSlotId = null;
            } else {
                selectedSlotId = slot.id;
            }
            
            // Re-render slot selection state
            document.querySelectorAll('.slot-btn').forEach(b => b.classList.remove('selected'));
            if (selectedSlotId) {
                btn.classList.add('selected');
            }
            
            updateSummary();
            validateBookingForm();
        });

        container.appendChild(btn);
    });
}

// Update booking cost summary details
function updateSummary() {
    const summarySlot = document.getElementById('summary-slot');
    const summaryTotal = document.getElementById('summary-total');

    if (!selectedSlotId) {
        summarySlot.textContent = 'None Selected';
        summaryTotal.textContent = '₹0';
        return;
    }

    const turf = turfData[activeTurfIndex];
    const slot = timeSlots.find(s => s.id === selectedSlotId);
    const cost = Math.round(turf.price * slot.rate);

    summarySlot.textContent = slot.time;
    summaryTotal.textContent = `₹${cost.toLocaleString('en-IN')}`;
}

// Disable or Enable Book Button depending on fields
function validateBookingForm() {
    const bookBtn = document.getElementById('book-now-btn');
    if (selectedSlotId && bookingDate !== "") {
        bookBtn.removeAttribute('disabled');
    } else {
        bookBtn.setAttribute('disabled', 'true');
    }
}

// Handle booking confirmation dialog
function handleBookingSubmit() {
    const turf = turfData[activeTurfIndex];
    const slot = timeSlots.find(s => s.id === selectedSlotId);
    const cost = Math.round(turf.price * slot.rate);

    // Populate ticket contents
    document.getElementById('ticket-turf-name').textContent = turf.name;
    document.getElementById('ticket-date').textContent = new Date(bookingDate).toLocaleDateString('en-IN', {
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
    });
    document.getElementById('ticket-time').textContent = slot.time;
    document.getElementById('ticket-amount').textContent = `₹${cost.toLocaleString('en-IN')}`;
    
    // Generate a unique booking confirmation code
    const randomID = "KT-" + Math.floor(100000 + Math.random() * 900000) + "-" + String.fromCharCode(65 + Math.floor(Math.random() * 26));
    document.getElementById('ticket-id').textContent = randomID;

    // Show modal
    toggleModal();
}

function toggleModal() {
    const modal = document.getElementById('ticket-modal');
    modal.classList.toggle('active');
}

// ==========================================
// THREE.JS GRAPHIC ENGINE IMPLEMENTATION
// ==========================================

function initThreeJS() {
    const container = document.getElementById('canvas-container');

    // Scene setup
    scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x070f0b, 0.015);

    // Camera setup
    camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 150);
    // Position camera overlooking the first turf
    camera.position.set(0, 10, 18);
    camera.lookAt(0, 0.5, 0);

    // WebGL Renderer setup
    renderer = new THREE.WebGLRenderer({ antialias: false, alpha: false }); // Antialias off by default for potato mode
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setClearColor(0x070f0b);
    renderer.shadowMap.enabled = false; // Off by default for potato laptops
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    
    // Set pixel ratio capped at 1 for potato mode
    renderer.setPixelRatio(1);
    container.appendChild(renderer.domElement);

    // Lights Setup
    // Ambient Light
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.45);
    scene.add(ambientLight);

    // Main Directional Sun Light (casting soft shadows when enabled)
    const sunLight = new THREE.DirectionalLight(0xffffff, 0.85);
    sunLight.position.set(10, 25, 15);
    sunLight.castShadow = false; // Shadow deactivated initially for potato mode
    sunLight.shadow.mapSize.width = 512;
    sunLight.shadow.mapSize.height = 512;
    sunLight.shadow.camera.near = 0.5;
    sunLight.shadow.camera.far = 50;
    const d = 25;
    sunLight.shadow.camera.left = -d;
    sunLight.shadow.camera.right = d;
    sunLight.shadow.camera.top = d;
    sunLight.shadow.camera.bottom = -d;
    scene.add(sunLight);

    // Generate Stadium Blocks for each Turf
    turfData.forEach((turf, idx) => {
        const turfGroup = buildTurf3D(turf, idx);
        scene.add(turfGroup);
        turfGroups.push(turfGroup);
    });

    // Window resizing handler
    window.addEventListener('resize', () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    });

    // Initial positioning setup
    cameraTargetX = activeTurfIndex * turfSpacing;
    cameraCurrentX = cameraTargetX;

    // Start rendering frame loop
    animate3D();
}

// Function to switch rendering qualities dynamically
function applyPerformanceSettings(highQuality) {
    if (highQuality) {
        // High Quality Settings
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));
        
        // Re-enable shadows
        renderer.shadowMap.enabled = true;
        scene.traverse((node) => {
            if (node.isLight && node.id !== 7) { // Enable sun light shadows
                node.castShadow = true;
            }
            if (node.isMesh) {
                node.castShadow = true;
                node.receiveShadow = true;
                // Switch materials to standard/glossier if possible
                if (node.material.userData && node.material.userData.originalType === 'lambert') {
                    node.material = new THREE.MeshStandardMaterial({
                        color: node.material.color,
                        roughness: 0.6,
                        metalness: 0.1
                    });
                }
            }
        });
        
        // Show floodlight beam cones
        floodlightBeams.forEach(beam => {
            beam.visible = true;
        });

    } else {
        // Potato Mode Settings (Super fast performance)
        renderer.setPixelRatio(1);
        renderer.shadowMap.enabled = false;
        
        scene.traverse((node) => {
            if (node.isLight) {
                node.castShadow = false;
            }
            if (node.isMesh) {
                node.castShadow = false;
                node.receiveShadow = false;
            }
        });

        // Hide beam cones to reduce shader calculation cost
        floodlightBeams.forEach(beam => {
            beam.visible = false;
        });
    }
}

// Build lightweight 3D stadium representation using standard geometries
function buildTurf3D(turf, index) {
    const group = new THREE.Group();
    group.position.x = index * turfSpacing;

    // 1. Stadium Grass Platform (Green)
    const grassGeo = new THREE.BoxGeometry(16, 0.4, 10);
    const grassMat = new THREE.MeshLambertMaterial({ color: turf.color });
    const grass = new THREE.Mesh(grassGeo, grassMat);
    grass.position.y = -0.2;
    group.add(grass);

    // 2. Cricket Pitch Strip (Brownish clay color)
    const pitchGeo = new THREE.PlaneGeometry(2.0, 6.5);
    const pitchMat = new THREE.MeshLambertMaterial({ color: turf.pitchColor });
    const pitch = new THREE.Mesh(pitchGeo, pitchMat);
    pitch.rotation.x = -Math.PI / 2;
    pitch.position.set(0, 0.015, 0); // slightly elevated to avoid Z-fighting
    group.add(pitch);

    // White Bowling Crease lines
    const lineMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    
    // Top Crease Line
    const creaseGeo = new THREE.PlaneGeometry(1.6, 0.05);
    const topCrease = new THREE.Mesh(creaseGeo, lineMat);
    topCrease.rotation.x = -Math.PI / 2;
    topCrease.position.set(0, 0.018, 2.5);
    group.add(topCrease);

    // Bottom Crease Line
    const bottomCrease = topCrease.clone();
    bottomCrease.position.z = -2.5;
    group.add(bottomCrease);

    // 3. Wickets (represented by 3 thin white cylinders and bails on both ends)
    const wicketGroupTop = new THREE.Group();
    wicketGroupTop.position.set(0, 0, 2.6);
    
    const stumpGeo = new THREE.CylinderGeometry(0.02, 0.02, 0.7);
    const stumpMat = new THREE.MeshLambertMaterial({ color: 0xffe082 }); // wood color
    
    // 3 stumps
    const stumpL = new THREE.Mesh(stumpGeo, stumpMat);
    stumpL.position.set(-0.15, 0.35, 0);
    const stumpM = new THREE.Mesh(stumpGeo, stumpMat);
    stumpM.position.set(0, 0.35, 0);
    const stumpR = new THREE.Mesh(stumpGeo, stumpMat);
    stumpR.position.set(0.15, 0.35, 0);
    wicketGroupTop.add(stumpL, stumpM, stumpR);

    // Bails on top
    const bailGeo = new THREE.CylinderGeometry(0.012, 0.012, 0.36);
    const bail = new THREE.Mesh(bailGeo, stumpMat);
    bail.rotation.z = Math.PI / 2;
    bail.position.set(0, 0.7, 0);
    wicketGroupTop.add(bail);

    group.add(wicketGroupTop);

    // Clone wickets to the other bowling end
    const wicketGroupBottom = wicketGroupTop.clone();
    wicketGroupBottom.position.z = -2.6;
    group.add(wicketGroupBottom);

    // 4. Stadium Boundary Net/Barriers (Transparent Grid Tube/Fence)
    // Low polygon geometry fence
    const fenceGeo = new THREE.CylinderGeometry(8.2, 8.2, 2.2, 16, 1, true);
    const fenceMat = new THREE.MeshLambertMaterial({
        color: 0x37474f,
        wireframe: true,
        transparent: true,
        opacity: 0.15,
        side: THREE.DoubleSide
    });
    const fence = new THREE.Mesh(fenceGeo, fenceMat);
    fence.position.y = 1.0;
    group.add(fence);

    // Boundary Base Rim (representing rope/glow boundary)
    const rimGeo = new THREE.TorusGeometry(8.2, 0.08, 6, 32);
    const rimMat = new THREE.MeshLambertMaterial({ color: turf.pitchColor });
    const rim = new THREE.Mesh(rimGeo, rimMat);
    rim.rotation.x = Math.PI / 2;
    rim.position.y = 0.05;
    group.add(rim);

    // 5. Floodlight Masts (placed at the four corners)
    const cornerOffsets = [
        { x: -7.5, z: -4.5, rot: 45 },
        { x: 7.5, z: -4.5, rot: -45 },
        { x: -7.5, z: 4.5, rot: 135 },
        { x: 7.5, z: 4.5, rot: -135 }
    ];

    const poleGeo = new THREE.CylinderGeometry(0.08, 0.18, 4.0, 6);
    const poleMat = new THREE.MeshLambertMaterial({ color: 0x607d8b });

    cornerOffsets.forEach(pos => {
        const poleGroup = new THREE.Group();
        poleGroup.position.set(pos.x, 2.0, pos.z);

        // Mast pole
        const pole = new THREE.Mesh(poleGeo, poleMat);
        poleGroup.add(pole);

        // Light Head
        const headGeo = new THREE.BoxGeometry(0.8, 0.4, 0.4);
        const headMat = new THREE.MeshLambertMaterial({ color: 0x455a64 });
        const head = new THREE.Mesh(headGeo, headMat);
        head.position.y = 2.0;
        head.rotation.y = pos.rot * Math.PI / 180;
        poleGroup.add(head);

        // Small glowing bulbs inside the floodlight head
        const bulbGeo = new THREE.SphereGeometry(0.12, 6, 6);
        const bulbMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
        const bulb = new THREE.Mesh(bulbGeo, bulbMat);
        bulb.position.set(0, 2.0, 0.2);
        bulb.position.applyAxisAngle(new THREE.Vector3(0, 1, 0), pos.rot * Math.PI / 180);
        poleGroup.add(bulb);

        // 6. Light cones (floodlight beam helpers) only on the high-quality setting (hidden by default)
        const coneGeo = new THREE.ConeGeometry(2.0, 6.0, 8, 1, true);
        const coneMat = new THREE.MeshBasicMaterial({
            color: 0xffffff,
            transparent: true,
            opacity: 0.12,
            side: THREE.DoubleSide
        });
        const cone = new THREE.Mesh(coneGeo, coneMat);
        
        // Angle the light cone down towards the pitch center
        cone.position.set(0, 1.8, 0.2);
        cone.position.applyAxisAngle(new THREE.Vector3(0, 1, 0), pos.rot * Math.PI / 180);
        cone.lookAt(new THREE.Vector3(0, 0, 0));
        cone.rotateX(Math.PI / 2);
        cone.translateY(-3);
        cone.visible = false; // hidden initially (potato mode by default)
        
        poleGroup.add(cone);
        floodlightBeams.push(cone);

        group.add(poleGroup);
    });

    return group;
}

// Frame Animation loop
function animate3D() {
    requestAnimationFrame(animate3D);

    // Smoothly pan camera horizontally to match active turf X position
    cameraCurrentX += (cameraTargetX - cameraCurrentX) * 0.085;
    
    // Keep camera positioned relative to current X coordinate
    camera.position.x = cameraCurrentX;
    
    // Slowly orbit camera slightly back and forth based on mouse position / hover
    const time = Date.now() * 0.0008;
    camera.position.z = 18 + Math.sin(time * 0.5) * 1.5;
    camera.position.y = 10 + Math.cos(time * 0.4) * 1.0;
    
    // Always look at the current moving focal center
    camera.lookAt(new THREE.Vector3(cameraCurrentX, 0.8, 0));

    // Spin or bob animations of elements inside current selected turf to make it feel "alive"
    const activeGroup = turfGroups[activeTurfIndex];
    if (activeGroup) {
        // Bob wickets up and down slightly
        const bob = Math.sin(Date.now() * 0.003) * 0.04;
        
        // Find wickets in active group (child indices 4 and 5 in group)
        activeGroup.children.forEach(child => {
            if (child.isGroup) {
                child.position.y = bob;
            }
        });
    }

    // Slowly rotate floodlight beam cones slightly for volumetric atmosphere
    if (!isPotatoMode) {
        lightConeRotation += 0.003;
        floodlightBeams.forEach((beam, index) => {
            beam.rotation.z = Math.sin(lightConeRotation + index) * 0.15;
        });
    }

    renderer.render(scene, camera);
}
