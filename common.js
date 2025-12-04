console.log("Common.js Loaded");

// ------------------ APPOINTMENT SAVE & REDIRECT ------------------
document.getElementById("bookAppointmentBtn")?.addEventListener("click", () => {
    const date = document.getElementById("apptDate").value;
    const time = document.getElementById("apptTime").value;
    const name = document.getElementById("apptPatientName").value.trim();

    if (!date || !time || !name) {
        alert("Please fill all appointment details.");
        return;
    }

    localStorage.setItem("appt_date", date);
    localStorage.setItem("appt_time", time);
    localStorage.setItem("appt_name", name);

    alert("Appointment successfully booked!");

    // Auto Navigate → Patient Page
    window.location.href = "patient.html";
});

// ------------------ LOAD PATIENT NAME FROM APPOINTMENT ------------------
if (document.getElementById("patientNameInput")) {
    document.getElementById("patientNameInput").value =
        localStorage.getItem("appt_name") || "";
}

// ------------------ SAVE PATIENT DETAILS & GO TO VOICE NOTES ------------------
document.getElementById("savePatientBtn")?.addEventListener("click", () => {
    const patientName = document.getElementById("patientNameInput").value.trim();
    const visitId = document.getElementById("visitIdInput").value.trim();

    if (!patientName || !visitId) {
        alert("Please enter Patient Name & Visit ID.");
        return;
    }

    localStorage.setItem("patientName", patientName);
    localStorage.setItem("visitId", visitId);

    alert("Patient saved successfully!");
    window.location.href = "voice.html";
});

// ------------------ LOAD COMPLAINTS INTO PRESCRIPTION ------------------
if (document.getElementById("complaintsBox")) {
    document.getElementById("complaintsBox").value =
        localStorage.getItem("complaints") || "No complaints captured.";
}

// ------------------ DOWNLOAD PRESCRIPTION AS PDF ------------------
document.getElementById("downloadPrescriptionBtn")?.addEventListener("click", () => {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    const patient = localStorage.getItem("patientName") || "N/A";
    const visitId = localStorage.getItem("visitId") || "N/A";
    const complaints = localStorage.getItem("complaints") || "N/A";
    const obs = document.getElementById("doctorObs").value || "N/A";
    const meds = document.getElementById("medications").value || "N/A";

    let y = 10;

    doc.setFont("Helvetica", "bold");
    doc.setFontSize(16);
    doc.text("KeshavCare – Prescription", 10, y);
    y += 10;

    doc.setFontSize(11);
    doc.setFont("Helvetica", "normal");
    doc.text(`Patient: ${patient}`, 10, y); y += 6;
    doc.text(`Visit ID: ${visitId}`, 10, y); y += 6;
    doc.text(`Date: ${new Date().toLocaleDateString()}`, 10, y);
    y += 10;

    doc.setFont("Helvetica", "bold");
    doc.text("Complaints:", 10, y);
    y += 6;
    doc.setFont("Helvetica", "normal");
    complaints.split("\n").forEach(line => {
        doc.text(line, 10, y);
        y += 6;
    });

    y += 4;
    doc.setFont("Helvetica", "bold");
    doc.text("Doctor Observations:", 10, y);
    y += 6;
    doc.setFont("Helvetica", "normal");
    obs.split("\n").forEach(line => {
        doc.text(line, 10, y);
        y += 6;
    });

    y += 4;
    doc.setFont("Helvetica", "bold");
    doc.text("Medications:", 10, y);
    y += 6;
    doc.setFont("Helvetica", "normal");
    meds.split("\n").forEach(line => {
        doc.text(line, 10, y);
        y += 6;
    });

    doc.save(`Prescription-${patient}.pdf`);
    alert("Prescription PDF Downloaded Successfully! 📄");
});