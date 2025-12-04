let recognition;
let recognizing = false;
let editMode = false;

const liveText = document.getElementById("liveText");
const pointsList = document.getElementById("pointsList");
const statusText = document.getElementById("statusText");
const statusIndicator = document.getElementById("statusIndicator");
const editTextArea = document.getElementById("editTextArea");
const languageSelect = document.getElementById("languageSelect");
const saveEditBtn = document.getElementById("saveEditBtn");

// Initialize Speech Recognition
function initSpeech() {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    recognition = new SR();
    recognition.lang = languageSelect.value; // Language selected
    recognition.continuous = true;
    recognition.interimResults = true;

    recognition.onresult = (event) => {
        let finalText = "";
        for (let i = event.resultIndex; i < event.results.length; i++) {
            if (event.results[i].isFinal) {
                finalText += event.results[i][0].transcript;
            }
        }
        if (finalText) addComplaint(finalText.trim());
    };
}

// Add complaint to list + save
function addComplaint(text) {
    let li = document.createElement("li");
    li.textContent = text;
    pointsList.appendChild(li);

    let existing = localStorage.getItem("complaints") || "";
    localStorage.setItem("complaints", existing + `\n- ${text}`);

    liveText.innerText = "";
}

// Toggle recording
document.getElementById("toggleRecordBtn").onclick = () => {
    if (!recognizing) {
        initSpeech();
        recognition.start();
        recognizing = true;
        liveText.textContent = "Listening…";
        statusText.textContent = "Recording";
        statusIndicator.classList.add("recording");
    } else {
        recognition.stop();
        recognizing = false;
        statusText.textContent = "Mic is idle";
        statusIndicator.classList.remove("recording");
    }
};

// Edit complaints mode
document.getElementById("editComplaintsBtn").onclick = () => {
    editMode = true;

    const stored = localStorage.getItem("complaints") || "";
    editTextArea.value = stored.replace(/^- /gm, "");
    
    pointsList.style.display = "none";
    editTextArea.style.display = "block";
    saveEditBtn.style.display = "inline-block";
};

// Save edits back to list + storage
saveEditBtn.onclick = () => {
    editMode = false;

    const updated = editTextArea.value
        .split("\n")
        .filter(l => l.trim() !== "")
        .map(l => `- ${l.trim()}`)
        .join("\n");

    localStorage.setItem("complaints", updated);

    pointsList.innerHTML = "";
    updated.split("\n").forEach(c => {
        const li = document.createElement("li");
        li.textContent = c.replace("- ", "");
        pointsList.appendChild(li);
    });

    editTextArea.style.display = "none";
    saveEditBtn.style.display = "none";
    pointsList.style.display = "block";
};

// Redirect to prescription page
document.getElementById("goPrescriptionBtn").onclick = () => {
    window.location.href = "prescription.html";
};