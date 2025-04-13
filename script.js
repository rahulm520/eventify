// Add 'visible' class to sections on scroll
window.addEventListener('scroll', () => {
    document.querySelectorAll('section').forEach(section => {
        const rect = section.getBoundingClientRect();
        if (rect.top < window.innerHeight) {
            section.classList.add('visible');
        }
    });
});

// Add 'visible' class to header on page load
window.addEventListener('load', () => {
    document.querySelector('.head').classList.add('visible');
});

// Toggle menu for mobile view
const menuBar = document.getElementById('menu-bar');
const navbar = document.querySelector('.navbar');

menuBar.addEventListener('click', () => {
    navbar.classList.toggle('active');
    menuBar.classList.toggle('active');
});

// Handle AR functionality for VR "Try Now"
// Get elements
const tryNowButton = document.getElementById('try-now');
const cameraStream = document.getElementById('camera-stream');
const cameraView = document.getElementById('camera-view');
const overlayCanvas = document.getElementById('overlay');
const overlayContext = overlayCanvas.getContext('2d');

// Detect if the device is mobile
function isMobileDevice() {
    return /Mobi|Android|iPhone/i.test(navigator.userAgent);
}

// Load the COCO-SSD model
let model;
async function loadModel() {
    model = await cocoSsd.load();
    console.log("COCO-SSD model loaded!");
}

// Function to start the camera and overlay AR decorations
tryNowButton.addEventListener('click', async () => {
    try {
        // Check device type and set facingMode
        const isMobile = isMobileDevice();
        const constraints = {
            video: {
                facingMode: isMobile ? { exact: "environment" } : "user",
                width: { ideal: 1280 },
                height: { ideal: 720 }
            }
        };

        console.log("Using constraints:", constraints);

        // Access the camera
        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        cameraStream.srcObject = stream;

        // Ensure the video and canvas dimensions match
        cameraStream.addEventListener('loadedmetadata', () => {
            cameraStream.play();

            // Dynamically set canvas size
            overlayCanvas.width = cameraStream.videoWidth;
            overlayCanvas.height = cameraStream.videoHeight;

            // Log dimensions for debugging
            console.log("Canvas dimensions:", overlayCanvas.width, overlayCanvas.height);
            console.log('Video Width: ', cameraStream.videoWidth);
            console.log('Video Height: ', cameraStream.videoHeight);
            console.log('Canvas Width: ', overlayCanvas.width);
            console.log('Canvas Height: ', overlayCanvas.height);

            // Display the camera view
            cameraView.style.display = 'block';

            // Start the AR process
            renderARDecorations();
        });
    } catch (err) {
        alert('Error accessing camera: ' + err.message);
        console.error("Camera access error:", err);
    }
});

// Objects storage
let placedObjects = [];  // Store placed objects and their positions

// Function to render AR decorations (replace drawing with images)
function renderARDecorations() {
    const draw = () => {
        // Detect objects in the current frame
        model.detect(cameraStream).then(predictions => {
            // Log predictions for debugging
            console.log("Predictions:", predictions);

            // Mark areas as occupied
            const occupiedAreas = [];
            predictions.forEach(prediction => {
                const [x, y, width, height] = prediction.bbox;
                occupiedAreas.push({ x, y, width, height });
            });

            // Divide the canvas into a 3x3 grid
            const gridWidth = overlayCanvas.width / 3;
            const gridHeight = overlayCanvas.height / 3;

            // Iterate through grid cells to find empty spaces
            for (let i = 0; i < 3; i++) {
                for (let j = 0; j < 3; j++) {
                    const gridX = i * gridWidth;
                    const gridY = j * gridHeight;

                    // Check if the grid cell overlaps with detected objects
                    const isOccupied = occupiedAreas.some(area =>
                        gridX < area.x + area.width &&
                        gridX + gridWidth > area.x &&
                        gridY < area.y + area.height &&
                        gridY + gridHeight > area.y
                    );

                    if (!isOccupied) {
                        // Place a random decoration in the empty grid cell
                        const decoration = Math.floor(Math.random() * 5);
                        placeDecoration(decoration, gridX + gridWidth / 2, gridY + gridHeight / 2);
                    }
                }
            }

            // Continue the animation loop
            requestAnimationFrame(draw);
        });
    };

    // Start the drawing loop
    draw();
}

// Function to place a decoration (using images)
function placeDecoration(type, x, y) {
    const img = new Image();
    img.onload = () => {
        // Create a container for the object with its image and remove button
        const objectContainer = document.createElement('div');
        objectContainer.style.position = 'absolute';
        objectContainer.style.left = `${x - 50}px`; // Adjust for image size
        objectContainer.style.top = `${y - 50}px`;  // Adjust for image size
        objectContainer.style.zIndex = '10';
        objectContainer.classList.add('draggable');

        // Append image to the container
        img.src = getDecorationImage(type);
        objectContainer.appendChild(img);

        // Create a remove button for the object
        const removeButton = document.createElement('button');
        removeButton.textContent = 'Remove';
        removeButton.classList.add('remove-btn');
        removeButton.onclick = () => {
            objectContainer.remove();
            placedObjects = placedObjects.filter(obj => obj.x !== x && obj.y !== y);
        };
        objectContainer.appendChild(removeButton);

        // Append the object container to the camera view (instead of overlay canvas)
        cameraView.appendChild(objectContainer);

        // Store the placed object for possible removal
        placedObjects.push({ type, x, y, element: objectContainer });
    };

    // Call the function to set the image source for the decoration type
    img.src = getDecorationImage(type);
}

// Helper function to return the correct image for each decoration type
function getDecorationImage(type) {
    switch (type) {
        case 0: // Balloon
            return 'ASSET/balloon.png'; // Ensure you have these images
        case 1: // Table
            return 'ASSET/table.png';   // Ensure you have these images
        case 2: // Curtain
            return 'ASSET/curtain.png'; // Ensure you have these images
        case 3: // Decoration
            return 'ASSET/decoration.png'; // Ensure you have these images
        case 4: // Chair
            return 'ASSET/chair.png';    // Ensure you have these images
        default:
            return '';
    }
}

// Load the model on page load
window.addEventListener('load', () => {
    loadModel();
});

// Add/remove objects via a sliding panel
const addObjectButtons = document.querySelectorAll('.add-object-btn');
addObjectButtons.forEach(button => {
    button.addEventListener('click', (event) => {
        const type = event.target.getAttribute('data-type');
        addObject(type);
    });
});

// Add object to AR view
function addObject(type) {
    // Find an empty space and place the object
    const gridWidth = overlayCanvas.width / 3;
    const gridHeight = overlayCanvas.height / 3;
    const x = Math.random() * overlayCanvas.width;
    const y = Math.random() * overlayCanvas.height;
    placeDecoration(type, x, y);
}
