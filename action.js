"use strict";

var screenConstraints = { video: true, audio: true };
var micConstraints = { audio: true };
var cameraConstraints = { video: { facingMode: "user" }, audio: true };

var shareBtn = document.querySelector("button#shareScreen");
var useCameraBtn = document.querySelector("button#useCamera");
var recBtn = document.querySelector("button#rec");
var recCameraBtn = document.querySelector("button#recCamera");
var stopBtn = document.querySelector("button#stop");
var toggleThemeBtn = document.querySelector("button#toggleTheme");
var timerElement = document.querySelector("#duration");
var previewElement = document.querySelector("#preview");
var cameraOverlay = document.querySelector("#cameraOverlay");
var cameraPreviewElement = document.querySelector("#cameraPreview");
var dataElement = document.querySelector("#data");
var downloadLink = document.querySelector("a#downloadLink");
var backgroundInput = document.querySelector("#backgroundInput");

previewElement.controls = false;

var mediaRecorder;
var cameraRecorder;
var chunks = [];
var localStream = null;
var cameraStream = null;
var recordingInterval;
var recordingTime = 0;

function onShareScreen() {
  navigator.mediaDevices.getDisplayMedia(screenConstraints).then(function(screenStream) {
    handleCombinedStream(screenStream);
  }).catch(function(err) {
    log("navigator.getDisplayMedia error: " + err);
  });
}

function handleCombinedStream(screenStream) {
  localStream = new MediaStream();
  screenStream.getVideoTracks().forEach(track => localStream.addTrack(track));
  screenStream.getAudioTracks().forEach(track => localStream.addTrack(track));

  previewElement.srcObject = localStream;
  previewElement.play();
  recBtn.disabled = false;
  shareBtn.disabled = true;
  useCameraBtn.disabled = false;
}

function onUseCamera() {
  navigator.mediaDevices.getUserMedia(cameraConstraints).then(function(stream) {
    cameraStream = stream;
    cameraPreviewElement.srcObject = cameraStream;
    cameraPreviewElement.play();
    cameraOverlay.classList.remove("hidden");
    recCameraBtn.disabled = false;
  }).catch(function(err) {
    log("Error accessing camera: " + err);
  });
}

function stopCamera() {
  if (cameraStream) {
    cameraStream.getTracks().forEach(track => track.stop());
    cameraOverlay.classList.add("hidden");
    recCameraBtn.disabled = true;
    useCameraBtn.disabled = false;
    cameraStream = null;
    log("Camera stopped.");
  }
}

function onBtnRecordClicked() {
  if (localStream == null) {
    alert("Could not get local stream from mic/camera");
    return;
  }

  recBtn.disabled = true;
  stopBtn.disabled = false;
  recordingTime = 0;
  timerElement.innerText = "00:00";
  log("Start recording screen...");

  mediaRecorder = new MediaRecorder(localStream, { mimeType: "video/webm; codecs=vp8" });

  mediaRecorder.ondataavailable = function(e) {
    chunks.push(e.data);
  };

  mediaRecorder.onstop = function() {
    clearInterval(recordingInterval);
    finalizeRecording();
  };

  mediaRecorder.start(10);
  startTimer();
}

function onBtnRecordCameraClicked() {
  if (cameraStream == null) {
    alert("Could not get camera stream.");
    return;
  }

  recCameraBtn.disabled = true;
  stopBtn.disabled = false;
  recordingTime = 0;
  timerElement.innerText = "00:00";
  log("Start recording camera...");

  cameraRecorder = new MediaRecorder(cameraStream, { mimeType: "video/webm; codecs=vp8" });

  cameraRecorder.ondataavailable = function(e) {
    chunks.push(e.data);
  };

  cameraRecorder.onstop = function() {
    clearInterval(recordingInterval);
    finalizeRecording();
  };

  cameraRecorder.start(10);
  startTimer();
}

function onBtnStopClicked() {
  if (mediaRecorder && mediaRecorder.state === "recording") {
    mediaRecorder.stop();
  }
  if (cameraRecorder && cameraRecorder.state === "recording") {
    cameraRecorder.stop();
  }
  stopBtn.disabled = true;
}

function finalizeRecording() {
  var blob = new Blob(chunks, { type: "video/webm" });
  chunks = [];
  var videoURL = URL.createObjectURL(blob);
  downloadLink.href = videoURL;
  previewElement.src = videoURL;
  downloadLink.innerHTML = "Download Video";
  log("Recording stopped.");
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

function loadBackgroundImage(event) {
  const file = event.target.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = function(e) {
      cameraOverlay.style.backgroundImage = `url(${e.target.result})`;
      cameraOverlay.style.backgroundSize = 'cover';
      log("Background image set.");
    };
    reader.readAsDataURL(file);
  }
}

function log(message) {
  dataElement.innerHTML += "<br>" + message;
  console.log(message);
}
