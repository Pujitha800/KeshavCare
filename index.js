// ---- GLOBALS ----
let recognition = null;
let recognizing = false;

let mediaRecorder = null;
let audioChunks = [];
let currentStream = null;

// DOM references
const statusIndicator = document.getElementById("statusIndicator");
const statusText = document.getElementById("statusText");
const liveTextEl = document.getElementById("liveText");
const pointsListEl = document.getElementById("pointsList");
const patientComplaintsEl = document.getElementById("finalText"); // hidden storage

const toggleRecordBtn = document.getElementById("toggleRecordBtn");
const toggleRecordLabel = document.getElementById("toggleRecordLabel");
const downloadTextBtn = document.getElementById("downloadTextBtn");
const downloadAudioBtn = document.getElementById("downloadAudioBtn");
const clearBtn = document.getElementById("clearBtn");
const languageSelect = document.getElementById("languageSelect");
const patientNameInput = document.getElementById("patientName");
const visitIdInput = document.getElementById("visitId");

// Appointment elements
const apptDateInput = document.getElementById("apptDate");
const apptTimeInput = document.getElementById("apptTime");
const apptPatientNameInput = document.getElementById("apptPatientName");
const bookAppointmentBtn = document.getElementById("bookAppointmentBtn");

// Clinical notes & prescription
const doctorObservationsEl = document.getElementById("doctorObservations");
const prescriptionAddEl = document.getElementById("prescriptionAdd");
const generatePrescriptionBtn = document.getElementById("generatePrescriptionBtn");

// Collapsible sections
const sectionToggleButtons = document.querySelectorAll(".section-toggle");

// ---- Collapsible section logic ----
sectionToggleButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
        const targetId = btn.getAttribute("data-target");
        const targetEl = document.getElementById(targetId);
        const isOpen = targetEl.classList.contains("open");

        if (isOpen) {
            targetEl.classList.remove("open");
            btn.classList.add("collapsed");
        } else {
            targetEl.classList.add("open");
            btn.classList.remove("collapsed");
        }
    });
});

// ---- SPEECH RECOGNITION SETUP ----
function initSpeechRecognition() {
    const SpeechRecognition =
        window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
        alert("Speech Recognition is not supported in this browser. Please use Chrome or Edge.");
        toggleRecordBtn.disabled = true;
        return;
    }

    recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = languageSelect.value;

    recognition.onresult = (event) => {
        let interimTranscript = "";
        let finalTranscript = "";

        for (let i = event.resultIndex; i < event.results.length; i++) {
            const result = event.results[i];
            const transcript = result[0].transcript.trim();
            if (!transcript) continue;

            if (result.isFinal) {
                finalTranscript += transcript + " ";
            } else {
                interimTranscript += transcript + " ";
            }
        }

        // Show interim in live box
        if (interimTranscript) {
            liveTextEl.textContent = interimTranscript;
            liveTextEl.classList.remove("placeholder");
        } else if (!finalTranscript && recognizing) {
            liveTextEl.textContent = "Listening…";
        }

        // Add final sentences as bullet points
        if (finalTranscript) {
            const sentences = splitIntoSentences(finalTranscript);
            sentences.forEach((s) => addPoint(s));
            liveTextEl.textContent = "";
            liveTextEl.classList.add("placeholder");
        }
    };

    recognition.onerror = (event) => {
        console.error("Speech recognition error:", event.error);
        statusText.textContent = "Error: " + event.error;
    };

    recognition.onend = () => {
        if (recognizing) {
            recognizing = false;
            updateUIForRecordingState();
        }
    };
}

function splitIntoSentences(text) {
    return text
        .split(/(?<=[.?!।])\s+/) // also split on Hindi/Telugu danda (।)
        .map((s) => s.trim())
        .filter((s) => s.length > 0);
}

function addPoint(text) {
    if (!text) return;
    const li = document.createElement("li");
    li.textContent = text;
    pointsListEl.appendChild(li);

    // Append to the hidden 'patient complaints' field
    const prefix = patientComplaintsEl.value.trim().length > 0 ? "\n" : "";
    patientComplaintsEl.value += prefix + "- " + text;
}

// ---- AUDIO RECORDING ----
async function startAudioRecording() {
    try {
        currentStream = await navigator.mediaDevices.getUserMedia({ audio: true });
        mediaRecorder = new MediaRecorder(currentStream);

        mediaRecorder.ondataavailable = (e) => {
            if (e.data && e.data.size > 0) {
                audioChunks.push(e.data);
            }
        };

        mediaRecorder.start();
    } catch (err) {
        console.error("Microphone access error:", err);
        alert("Unable to access microphone. Please allow mic permission.");
    }
}

function stopAudioRecording() {
    if (mediaRecorder && mediaRecorder.state !== "inactive") {
        mediaRecorder.stop();
    }
    if (currentStream) {
        currentStream.getTracks().forEach((t) => t.stop());
        currentStream = null;
    }
}

// ---- UI STATE ----
function updateUIForRecordingState() {
    if (recognizing) {
        statusIndicator.classList.add("recording");
        statusText.textContent =
            "Listening to patient… (" +
            languageSelect.options[languageSelect.selectedIndex].text +
            ")";
        toggleRecordLabel.textContent = "Pause Listening";
    } else {
        statusIndicator.classList.remove("recording");
        statusText.textContent = "Mic is idle";
        toggleRecordLabel.textContent = "Start Listening";
    }
}

// Build base file name using patient + visit + timestamp
function buildFileBaseName() {
    const patientRaw = patientNameInput.value.trim() || "patient";
    const visitRaw = visitIdInput.value.trim();

    const sanitize = (str) =>
        str
            .toLowerCase()
            .replace(/\s+/g, "-")
            .replace(/[^a-z0-9\-]/g, "");

    let base = sanitize(patientRaw);
    if (visitRaw) base += "-" + sanitize(visitRaw);

    const timestamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-");
    return base + "-" + timestamp;
}

// ---- Appointment Handler ----
bookAppointmentBtn.addEventListener("click", () => {
    const date = apptDateInput.value;
    const time = apptTimeInput.value;
    const name = apptPatientNameInput.value.trim();

    if (!date || !time || !name) {
        alert("Please fill in Date, Time, and Patient Name for the appointment.");
        return;
    }

    console.log(`MOCK API: Booking appointment for ${name} on ${date} at ${time}`);
    alert(
        `Appointment successfully booked!
Patient: ${name}
Date: ${date}
Time: ${time}
(In a real app, this would be saved to a database.)`
    );

    // Optional: auto-fill patient name in clinical section
    if (!patientNameInput.value.trim()) {
        patientNameInput.value = name;
    }

    // Optionally clear the fields
    apptDateInput.value = "";
    apptTimeInput.value = "";
    apptPatientNameInput.value = "";
});

// ---- Prescription Handler ----
generatePrescriptionBtn.addEventListener("click", () => {
    const patientName = patientNameInput.value.trim();
    const visitId = visitIdInput.value.trim();
    const complaints = patientComplaintsEl.value.trim();
    const observations = doctorObservationsEl.value.trim();
    const prescription = prescriptionAddEl.value.trim();

    if (!patientName || !visitId) {
        alert("Please enter Patient Name and Visit ID/MRN before generating a prescription.");
        return;
    }

    if (!complaints && !observations && !prescription) {
        alert("Prescription is empty. Please add complaints, observations, or medications.");
        return;
    }

    const today = new Date();
    const dateStr = today.toLocaleDateString();

    const prescriptionText = `--- KeshavCare Prescription ---
Patient: ${patientName} (ID: ${visitId})
Date: ${dateStr}

A. PATIENT COMPLAINTS (from Voice Notes):
${complaints || "No voice notes captured."}

B. DOCTOR OBSERVATIONS:
${observations || "No specific observations noted."}

C. PRESCRIPTION:
${prescription || "No medications prescribed."}

--- End of Prescription ---
`;

    console.log("MOCK API: Generating and saving prescription.");

    const fileBase = buildFileBaseName();
    const blob = new Blob([prescriptionText], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = fileBase + "_Prescription.txt";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    alert("Prescription generated and downloaded as a TXT file.");
});

// ---- BUTTON HANDLERS (Voice Notes) ----
toggleRecordBtn.addEventListener("click", async () => {
    if (!recognition) {
        initSpeechRecognition();
        if (!recognition) return;
    }

    if (!recognizing) {
        try {
            recognition.lang = languageSelect.value;
            recognition.start();
            recognizing = true;
            liveTextEl.textContent = "Listening…";
            liveTextEl.classList.remove("placeholder");
            updateUIForRecordingState();
            await startAudioRecording();
        } catch (err) {
            console.error("Error starting recognition:", err);
        }
    } else {
        recognizing = false;
        recognition.stop();
        stopAudioRecording();
        liveTextEl.textContent = "";
        liveTextEl.classList.add("placeholder");
        updateUIForRecordingState();
    }
});

// Language change while idle: just set lang; while recording: stop
languageSelect.addEventListener("change", () => {
    if (recognition) {
        recognition.lang = languageSelect.value;
    }
    if (recognizing && recognition) {
        recognizing = false;
        recognition.stop();
        stopAudioRecording();
        liveTextEl.textContent = "";
        liveTextEl.classList.add("placeholder");
        updateUIForRecordingState();
    }
});

downloadTextBtn.addEventListener("click", () => {
    const text = patientComplaintsEl.value.trim();
    if (!text) {
        alert("No voice notes to download.");
        return;
    }
    const fileBase = buildFileBaseName();
    const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = fileBase + "_Complaints.txt";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
});

downloadAudioBtn.addEventListener("click", () => {
    if (audioChunks.length === 0) {
        alert("No audio recorded yet.");
        return;
    }
    const fileBase = buildFileBaseName();
    const blob = new Blob(audioChunks, { type: "audio/webm" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = fileBase + "_Audio.webm";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
});

clearBtn.addEventListener("click", () => {
    if (!confirm("Clear all captured points, complaints, observations, prescription, and audio?")) return;
    pointsListEl.innerHTML = "";
    patientComplaintsEl.value = "";
    doctorObservationsEl.value = "";
    prescriptionAddEl.value = "";
    liveTextEl.textContent = "Press “Start Listening” and ask the patient to speak…";
    liveTextEl.classList.add("placeholder");
    audioChunks = [];
});

// Init on load
initSpeechRecognition();