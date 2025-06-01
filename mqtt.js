const client = mqtt.connect('wss://your-mqtt-broker-url');

let currentStep = 1;

// Start webcam
const video = document.getElementById("webcamFeed");

if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
  navigator.mediaDevices.getUserMedia({ video: true })
    .then(stream => {
      video.srcObject = stream;
    })
    .catch(err => {
      alert("Could not access webcam. Please allow camera permissions.");
      console.error("Webcam error:", err);
    });
} else {
  alert("Your browser does not support getUserMedia.");
}

// Create 13 steps dynamically
function initSteps() {
  const container = document.getElementById("stepIndicator");
  container.innerHTML = "";

  for (let i = 1; i <= 13; i++) {
    const wrapper = document.createElement("div");
    wrapper.className = "step-indicator text-center";

    const circle = document.createElement("div");
    circle.id = `step${i}`;
    circle.className = "step-circle bg-gray";
    circle.innerText = i;

    const label = document.createElement("small");
    label.innerText = `Step ${i}`;

    wrapper.appendChild(circle);
    wrapper.appendChild(label);
    container.appendChild(wrapper);
  }

  updateStepIndicator(currentStep);
}

initSteps();

function updateStepIndicator(step) {
  for (let i = 1; i <= 13; i++) {
    const el = document.getElementById(`step${i}`);
    if (i < step) {
      el.className = "step-circle bg-green";
    } else if (i === step) {
      el.className = "step-circle bg-orange";
    } else {
      el.className = "step-circle bg-gray";
    }
  }
}

function setInstruction(message, icon = "") {
  const instructionText = document.getElementById("instructionText");
  instructionText.innerHTML = `${icon} ${message}`;
}

client.on("connect", () => {
  console.log("Connected to MQTT broker");
  client.subscribe("pose/status", (err) => {
    if (!err) {
      console.log("Subscribed to topic: pose/status");
    }
  });
});

client.on("message", (topic, message) => {
  if (topic === "pose/status") {
    try {
      const payload = JSON.parse(message.toString());
      const status = payload.status;
      const step = parseInt(payload.step || "1");

      if (step >= 1 && step <= 13) {
        currentStep = step;
        updateStepIndicator(currentStep);
      }

      switch (status) {
        case "unassembled":
          setInstruction("No part detected yet. Please locate the correct component.");
          break;
        case "partial_match":
          setInstruction("Part detected but orientation seems incorrect. Adjust it.", "⚠️");
          break;
        case "correct_pose":
          setInstruction("Great! Part is correctly oriented. Move on to final assembly.", "✅");
          break;
        case "complete":
          setInstruction("Success! Part is correctly assembled. Proceed to next step.", "🎉");
          break;
        case "wrong_part":
          setInstruction("Incorrect part detected. Please use the correct component shown in the guide.", "❗");
          break;
        case "occluded":
          setInstruction("Part visibility is low. Make sure the camera has a clear view of the component.", "🔍");
          break;
        default:
          setInstruction("Unknown pose state", "❓");
      }
    } catch (e) {
      console.error("Error parsing MQTT message", e);
    }
  }
});