/**
 * Inline Agora live page. Must use the same App ID + token as backend AgoraService
 * (video calls). Joining with a mismatched App ID / null token → blank black screen.
 */

export const AGORA_LIVE_APP_ID = '2fae578d9eef4fe19df335eb67227571';

export type LiveStreamWebOptions = {
  appId?: string;
  token: string;
  uid: number;
};

export function buildLiveStreamWebHtml(
  channel: string,
  role: 'host' | 'audience',
  options?: LiveStreamWebOptions | null,
): string {
  const opts = options ?? { token: '', uid: 0 };
  const channelJs = JSON.stringify(channel);
  const roleJs = JSON.stringify(role);
  const appIdJs = JSON.stringify(opts.appId || AGORA_LIVE_APP_ID);
  const tokenJs = JSON.stringify(opts.token || null);
  const uidJs = JSON.stringify(Number(opts.uid) || Math.floor(Math.random() * 100000));

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no"/>
  <title>GymPaddy Live Streaming</title>
  <script src="https://download.agora.io/sdk/release/AgoraRTC_N.js"></script>
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css"/>
  <style>
    * { box-sizing: border-box; }
    body {
      background: #000;
      color: #fff;
      margin: 0;
      font-family: 'Segoe UI', sans-serif;
      display: flex;
      flex-direction: column;
      height: 100vh;
      touch-action: manipulation;
    }
    #header {
      padding: 14px 20px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      background: #1a1a1a;
      font-size: 18px;
      font-weight: 600;
      border-bottom: 1px solid #333;
    }
    #video-container {
      flex: 1;
      display: flex;
      justify-content: center;
      align-items: center;
      background: #000;
      position: relative;
    }
    .video-box {
      width: 100%;
      height: 100%;
      background: #111;
      border-radius: 12px;
      overflow: hidden;
      position: relative;
    }
    #videoOffOverlay {
      display: none;
      position: absolute;
      inset: 0;
      background: #111;
      align-items: center;
      justify-content: center;
      flex-direction: column;
      gap: 8px;
      z-index: 4;
      color: #aaa;
      font-size: 14px;
    }
    #videoOffOverlay.show { display: flex; }
    #statusBanner {
      position: absolute;
      left: 12px;
      right: 12px;
      bottom: 12px;
      padding: 10px 12px;
      border-radius: 8px;
      background: rgba(0,0,0,0.7);
      color: #fff;
      font-size: 13px;
      z-index: 5;
      display: none;
    }
    #statusBanner.error { background: rgba(198,31,58,0.9); display: block; }
    #statusBanner.info { display: block; }
    #controls {
      display: none;
      justify-content: space-around;
      background: #1a1a1a;
      padding: 12px;
      border-top: 1px solid #333;
    }
    button {
      border: none;
      cursor: pointer;
    }
    #confirmModal {
      position: fixed;
      inset: 0;
      display: none;
      background-color: rgba(0, 0, 0, 0.6);
      justify-content: center;
      align-items: center;
      z-index: 9999;
    }
    #confirmBox {
      background-color: #1a1a1a;
      padding: 20px;
      border-radius: 10px;
      width: 80%;
      max-width: 300px;
      text-align: center;
    }
    #confirmBox button {
      flex: 1;
      padding: 10px;
      margin: 8px 4px 0;
      border-radius: 8px;
      color: #fff;
      background: #333;
    }
    #confirmBox button.end { background: #C61F3A; }
    .control-btn {
      flex: 1;
      padding: 14px;
      margin: 0 8px;
      font-size: 18px;
      background: #2a2a2a;
      color: white;
      border-radius: 50%;
      max-width: 60px;
      height: 60px;
      display: flex;
      align-items: center;
      justify-content: center;
      touch-action: manipulation;
      -webkit-tap-highlight-color: transparent;
      user-select: none;
      transition: background 0.2s, transform 0.15s;
    }
    .control-btn:active { transform: scale(0.92); }
    .control-btn.end { background: #C61F3A; }
    .control-btn.off {
      background: #C61F3A;
    }
    .control-btn.disabled {
      opacity: 0.4;
      pointer-events: none;
    }
  </style>
</head>
<body>
  <div id="header">
    Live Streaming <span id="roleLabel"></span>
  </div>
  <div id="video-container">
    <div id="local-player" class="video-box"></div>
    <div id="videoOffOverlay"><i class="fa-solid fa-video-slash" style="font-size:36px"></i><span>Camera off</span></div>
    <div id="statusBanner" class="info">Connecting…</div>
  </div>
  <div id="controls">
    <button type="button" id="mute-audio" class="control-btn" aria-label="Mute audio">
      <i class="fa-solid fa-microphone"></i>
    </button>
    <button type="button" id="mute-video" class="control-btn" aria-label="Mute video">
      <i class="fa-solid fa-video"></i>
    </button>
    <button type="button" id="switch-camera" class="control-btn" aria-label="Switch camera">
      <i class="fa-solid fa-rotate"></i>
    </button>
    <button type="button" class="control-btn end" onclick="openConfirm()" aria-label="End">
      <i class="fa-solid fa-phone-slash"></i>
    </button>
  </div>
  <div id="confirmModal">
    <div id="confirmBox">
      <p>Are you sure you want to end the live stream?</p>
      <button type="button" onclick="closeConfirm()">Cancel</button>
      <button type="button" class="end" onclick="handleConfirmEnd()">Yes, End</button>
    </div>
  </div>
<script>
const CHANNEL = ${channelJs};
const ROLE = ${roleJs} === "host" ? "host" : "audience";
const APP_ID = ${appIdJs};
const TOKEN = ${tokenJs};
const UID = ${uidJs};
const client = AgoraRTC.createClient({ mode: "live", codec: "vp8" });

let localAudioTrack = null;
let localVideoTrack = null;
let cameras = [];
let currentCameraIndex = 0;
let switchInFlight = false;
let audioOn = true;
let videoOn = true;

document.getElementById("roleLabel").innerText = "(" + ROLE + ")";

function setStatus(message, isError) {
  var el = document.getElementById("statusBanner");
  if (!el) return;
  if (!message) {
    el.style.display = "none";
    el.textContent = "";
    return;
  }
  el.textContent = message;
  el.className = isError ? "error" : "info";
}

function postRn(msg) {
  try {
    if (window.ReactNativeWebView) {
      window.ReactNativeWebView.postMessage(typeof msg === "string" ? msg : JSON.stringify(msg));
    }
  } catch (e) {}
}

function setBtnOff(id, isOff, onIcon, offIcon) {
  var btn = document.getElementById(id);
  if (!btn) return;
  var icon = btn.querySelector("i");
  if (isOff) {
    btn.classList.add("off");
    if (icon) icon.className = "fa-solid " + offIcon;
  } else {
    btn.classList.remove("off");
    if (icon) icon.className = "fa-solid " + onIcon;
  }
}

function syncControlIcons() {
  setBtnOff("mute-audio", !audioOn, "fa-microphone", "fa-microphone-slash");
  setBtnOff("mute-video", !videoOn, "fa-video", "fa-video-slash");
  var overlay = document.getElementById("videoOffOverlay");
  if (overlay) {
    if (videoOn) overlay.classList.remove("show");
    else overlay.classList.add("show");
  }
}

function getCurrentVideoDeviceId() {
  try {
    if (!localVideoTrack || !localVideoTrack.getMediaStreamTrack) return "";
    var ms = localVideoTrack.getMediaStreamTrack();
    if (!ms || !ms.getSettings) return "";
    return ms.getSettings().deviceId || "";
  } catch (e) {
    return "";
  }
}

function wireSwitchCamera() {
  var btn = document.getElementById("switch-camera");
  if (!btn || btn.__gpWired) return;
  btn.__gpWired = true;
  btn.addEventListener("click", async function () {
    if (switchInFlight || !localVideoTrack || !videoOn) return;
    if (btn.classList.contains("disabled")) return;
    switchInFlight = true;
    try {
      cameras = await AgoraRTC.getCameras();
      if (cameras.length < 2) return;
      var currentId = getCurrentVideoDeviceId();
      var next = cameras.find(function (c) { return c.deviceId && c.deviceId !== currentId; });
      if (!next) {
        currentCameraIndex = (currentCameraIndex + 1) % cameras.length;
        next = cameras[currentCameraIndex];
      } else {
        currentCameraIndex = cameras.indexOf(next);
      }
      if (next && next.deviceId) {
        await localVideoTrack.setDevice(next.deviceId);
      }
    } catch (err) {
    } finally {
      switchInFlight = false;
    }
  });
}

async function withTimeout(promise, ms, label) {
  return Promise.race([
    promise,
    new Promise(function (_, reject) {
      setTimeout(function () {
        reject(new Error(label + " timed out. Grant mic/camera permission and try again."));
      }, ms);
    }),
  ]);
}

async function startHostTracks() {
  // One getUserMedia for both — sequential camera-then-mic often hangs forever on Android WebView.
  if (typeof AgoraRTC.createMicrophoneAndCameraTracks === "function") {
    setStatus("Opening camera & microphone…", false);
    var both = await withTimeout(
      AgoraRTC.createMicrophoneAndCameraTracks(
        { AEC: true, ANS: true },
        { encoderConfig: "480p_1" }
      ),
      20000,
      "Camera/Microphone"
    );
    localAudioTrack = both[0];
    localVideoTrack = both[1];
    return;
  }

  // Fallback for older Agora builds: mic first, then camera.
  setStatus("Opening microphone…", false);
  localAudioTrack = await withTimeout(
    AgoraRTC.createMicrophoneAudioTrack({ AEC: true, ANS: true }),
    15000,
    "Microphone"
  );
  setStatus("Opening camera…", false);
  localVideoTrack = await withTimeout(
    AgoraRTC.createCameraVideoTrack({ encoderConfig: "480p_1" }),
    15000,
    "Camera"
  );
}

async function startStream() {
  try {
    if (!APP_ID) throw new Error("Missing Agora App ID");
    if (!TOKEN) throw new Error("Missing Agora token");
    if (!CHANNEL) throw new Error("Missing channel");

    setStatus("Joining channel…", false);
    await client.setClientRole(ROLE);
    await client.join(APP_ID, CHANNEL, TOKEN, UID);

    if (ROLE === "host") {
      document.getElementById("controls").style.display = "flex";
      await startHostTracks();
      await localVideoTrack.play("local-player", { fit: "cover", mirror: true });
      await client.publish([localAudioTrack, localVideoTrack]);
      audioOn = true;
      videoOn = true;
      syncControlIcons();
      setStatus("", false);
      postRn({ type: "live_ready", role: "host" });

      cameras = await AgoraRTC.getCameras();
      if (cameras.length < 2) {
        document.getElementById("switch-camera").classList.add("disabled");
      }
      wireSwitchCamera();
      wireHostControls();
    } else {
      setStatus("Waiting for host…", false);
      client.on("user-published", async function (user, mediaType) {
        await client.subscribe(user, mediaType);
        if (mediaType === "video") {
          var remotePlayer = document.getElementById("local-player");
          remotePlayer.innerHTML = "";
          user.videoTrack.play(remotePlayer, { fit: "cover" });
          var overlay = document.getElementById("videoOffOverlay");
          if (overlay) overlay.classList.remove("show");
          setStatus("", false);
          postRn({ type: "live_ready", role: "audience" });
        }
        if (mediaType === "audio") {
          user.audioTrack.play();
        }
      });
      client.on("user-unpublished", function (user, mediaType) {
        if (mediaType === "video") {
          setStatus("Host turned camera off", false);
          var overlayOff = document.getElementById("videoOffOverlay");
          if (overlayOff) overlayOff.classList.add("show");
        }
      });
    }
  } catch (err) {
    var message = (err && (err.message || err.code)) ? (err.message || String(err.code)) : String(err);
    setStatus("Live failed: " + message, true);
    postRn({ type: "live_error", message: message });
  }
}

function wireHostControls() {
  var audioBtn = document.getElementById("mute-audio");
  var videoBtn = document.getElementById("mute-video");
  if (audioBtn && !audioBtn.__gpWired) {
    audioBtn.__gpWired = true;
    audioBtn.addEventListener("click", async function () {
      if (!localAudioTrack) return;
      try {
        audioOn = !audioOn;
        await localAudioTrack.setEnabled(audioOn);
        syncControlIcons();
        postRn({ type: "host_media", audioOn: audioOn, videoOn: videoOn });
      } catch (e) {
        audioOn = !audioOn;
        syncControlIcons();
      }
    });
  }
  if (videoBtn && !videoBtn.__gpWired) {
    videoBtn.__gpWired = true;
    videoBtn.addEventListener("click", async function () {
      if (!localVideoTrack) return;
      try {
        if (videoOn) {
          await localVideoTrack.setEnabled(false);
          videoOn = false;
        } else {
          await localVideoTrack.setEnabled(true);
          // Re-attach preview after re-enable (Android WebView often needs this).
          try {
            await localVideoTrack.play("local-player", { fit: "cover", mirror: true });
          } catch (playErr) {}
          videoOn = true;
        }
        syncControlIcons();
        postRn({ type: "host_media", audioOn: audioOn, videoOn: videoOn });
      } catch (e) {
        setStatus("Could not toggle camera", true);
      }
    });
  }
}

async function handleConfirmEnd() {
  closeConfirm();
  await endLiveStream();
  await leave();
}

async function endLiveStream() {
  try {
    await fetch("https://api.gympaddy.com/api/live-streams/end/" + encodeURIComponent(CHANNEL));
    postRn("stream_ended");
  } catch (err) {}
}

async function leave() {
  try {
    if (localAudioTrack) {
      localAudioTrack.stop();
      localAudioTrack.close();
    }
    if (localVideoTrack) {
      localVideoTrack.stop();
      localVideoTrack.close();
    }
    await client.leave();
  } catch (e) {}
  document.body.innerHTML =
    '<div style="text-align:center; padding: 30px; color:white;"><h2>Stream Ended</h2><p>Thanks for using GymPaddy Live.</p></div>';
}

function openConfirm() {
  document.getElementById("confirmModal").style.display = "flex";
}
function closeConfirm() {
  document.getElementById("confirmModal").style.display = "none";
}

document.addEventListener("DOMContentLoaded", startStream);
</script>
</body>
</html>`;
}
