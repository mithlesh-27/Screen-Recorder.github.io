"use strict";

let localStream = null;
let mediaRecorder;
let chunks = [];
let recordingInterval;
let recordingTime = 0;

const screenConstraints = {
    video: true,
    audio: { echoCancellation: true, noiseSuppression: true }
};

const micConstraints = { 
    audio: { echoCancellation: true, noiseSuppression: true } 
};

const cameraConstraints = { 
    video: { facingMode: "user" }, 
    audio: { echoCancellation: true, noiseSuppression: true } 
};

const shareBtn = document.querySelector("button#shareScreen");
const useCameraBtn = document.querySelector("button#useCamera");
const recBtn = document.querySelector("button#rec");
const recCameraBtn = document.querySelector("button#recCamera");
const stopBtn = document.querySelector("button#stop");
const resetBtn = document.querySelector("button#reset");
const timerElement = document.querySelector("#duration");
const previewElement = document.querySelector("#preview");
const cameraOverlay = document.querySelector("#cameraOverlay");
const cameraPreviewElement = document.querySelector("#cameraPreview");
const dataElement = document.querySelector("#data");
const downloadLink = document.querySelector("a#downloadLink");

previewElement.controls = false;

function onShareScreen() {
    navigator.mediaDevices.getDisplayMedia(screenConstraints)
        .then(screenStream => {
            localStream = new MediaStream();
            screenStream.getVideoTracks().forEach(track => localStream.addTrack(track));
            navigator.mediaDevices.getUserMedia(micConstraints).then(micStream => {
                micStream.getAudioTracks().forEach(track => localStream.addTrack(track));
                previewElement.srcObject = localStream;
                previewElement.play();
                recBtn.disabled = false;
                resetBtn.disabled = false;
                shareBtn.disabled = true;
                useCameraBtn.disabled = false;
            }).catch(err => log("Error accessing microphone: " + err));
        })
        .catch(err => log("navigator.getDisplayMedia error: " + err));
}

function resetScreenShare() {
    if (localStream) {
        localStream.getTracks().forEach(track => track.stop());
        previewElement.srcObject = null;
        localStream = null;
        recBtn.disabled = true;
        resetBtn.disabled = true;
        shareBtn.disabled = false;
        useCameraBtn.disabled = true;
        recCameraBtn.disabled = true;
        log("Screen share reset.");
    }
}

function onUseCamera() {
    navigator.mediaDevices.getUserMedia(cameraConstraints)
        .then(stream => {
            cameraPreviewElement.srcObject = stream;
            cameraPreviewElement.play();
            cameraOverlay.classList.remove("hidden");
            recCameraBtn.disabled = false;
        })
        .catch(err => log("Error accessing camera: " + err));
}

function stopCamera() {
    const stream = cameraPreviewElement.srcObject;
    if (stream) {
        stream.getTracks().forEach(track => track.stop());
        cameraOverlay.classList.add("hidden");
    }
}

function onBtnRecordClicked() {
    if (!localStream) {
        alert("Please share your screen first.");
        return;
    }

    recBtn.disabled = true;
    stopBtn.disabled = false;
    recordingTime = 0;
    timerElement.innerText = "00:00";
    log("Start recording screen...");

    mediaRecorder = new MediaRecorder(localStream);
    mediaRecorder.ondataavailable = e => chunks.push(e.data);
    mediaRecorder.onstop = handleStop;
    mediaRecorder.start();

    startTimer();
}

function onBtnRecordCameraClicked() {
    const cameraStream = cameraPreviewElement.srcObject;
    if (!cameraStream) {
        alert("Camera not active.");
        return;
    }

    recCameraBtn.disabled = true;
    stopBtn.disabled = false;
    recordingTime = 0;
    timerElement.innerText = "00:00";
    log("Start recording camera...");

    mediaRecorder = new MediaRecorder(cameraStream);
    mediaRecorder.ondataavailable = e => chunks.push(e.data);
    mediaRecorder.onstop = handleStop;
    mediaRecorder.start();

    startTimer();
}

function onBtnStopClicked() {
    if (mediaRecorder) {
        mediaRecorder.stop();
        stopCamera(); // Stop camera when recording stops
        resetBtn.disabled = false;
        recBtn.disabled = false;
        recCameraBtn.disabled = false;
    }
}

function handleStop() {
    const blob = new Blob(chunks, { type: "video/webm" });
    chunks = [];
    const videoURL = URL.createObjectURL(blob);
    downloadLink.href = videoURL;
    previewElement.src = videoURL;
    downloadLink.innerHTML = "Download Video";
    log("Recording stopped.");
    clearInterval(recordingInterval);
}

function startTimer() {
    recordingInterval = setInterval(() => {
        recordingTime++;
        const minutes = String(Math.floor(recordingTime / 60)).padStart(2, '0');
        const seconds = String(recordingTime % 60).padStart(2, '0');
        timerElement.innerText = `${minutes}:${seconds}`;
    }, 1000);
}

function toggleTheme() {
    document.body.classList.toggle('dark');
}

function log(message) {
    dataElement.innerHTML += "<br>" + message;
    console.log(message);
}
