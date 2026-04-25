/**
 * Inline Agora live page (was remote live.html) so we can fix camera switch / touch behavior
 * without redeploying skillverse.com.pk.
 */
export function buildLiveStreamWebHtml(channel: string, role: 'host' | 'audience'): string {
  const channelJs = JSON.stringify(channel);
  const roleJs = JSON.stringify(role);

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
    }
    .video-box {
      width: 100%;
      height: 100%;
      background: #111;
      border-radius: 12px;
      overflow: hidden;
      position: relative;
    }
    #controls {
      display: flex;
      justify-content: space-around;
      background: #1a1a1a;
      padding: 12px;
      border-top: 1px solid #333;
    }
    button {
      flex: 1;
      padding: 12px;
      margin: 0 6px;
      font-size: 14px;
      background: #333;
      color: #fff;
      border: none;
      border-radius: 8px;
      cursor: pointer;
      transition: background 0.3s;
    }
    button:hover { background: #444; }
    button.end { background-color: #e53935; }
    button.end:hover { background-color: #d32f2f; }
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
    }
    .control-btn:hover { background: #3a3a3a; }
    .control-btn.end { background: #e53935; }
    .control-btn.end:hover { background: #d32f2f; }
    .control-btn.disabled {
      opacity: 0.4;
      cursor: not-allowed;
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
  </div>
  <div id="controls" style="display: none;">
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
const UID = Math.floor(Math.random() * 100000);
const client = AgoraRTC.createClient({ mode: "live", codec: "vp8" });

let localAudioTrack, localVideoTrack;
let cameras = [];
let currentCameraIndex = 0;
let switchInFlight = false;

document.getElementById("roleLabel").innerText = "(" + ROLE + ")";

function getCurrentVideoDeviceId() {
  try {
    if (!localVideoTrack || !localVideoTrack.getMediaStreamTrack) return "";
    const ms = localVideoTrack.getMediaStreamTrack();
    if (!ms || !ms.getSettings) return "";
    return ms.getSettings().deviceId || "";
  } catch (e) {
    return "";
  }
}

function wireSwitchCamera() {
  const btn = document.getElementById("switch-camera");
  if (!btn || btn.__gpWired) return;
  btn.__gpWired = true;
  btn.addEventListener("click", async function () {
    if (switchInFlight || !localVideoTrack) return;
    if (btn.classList.contains("disabled")) return;
    switchInFlight = true;
    try {
      cameras = await AgoraRTC.getCameras();
      if (cameras.length < 2) return;
      const currentId = getCurrentVideoDeviceId();
      let next = cameras.find(function (c) { return c.deviceId && c.deviceId !== currentId; });
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

async function startStream() {
  await client.setClientRole(ROLE);
  await client.join("594b734537da44b7994c6a0194c25ffb", CHANNEL, null, UID);

  if (ROLE === "host") {
    document.getElementById("controls").style.display = "flex";
    localAudioTrack = await AgoraRTC.createMicrophoneAudioTrack();
    localVideoTrack = await AgoraRTC.createCameraVideoTrack();
    await localVideoTrack.play("local-player");
    await client.publish([localAudioTrack, localVideoTrack]);
    cameras = await AgoraRTC.getCameras();
    if (cameras.length < 2) {
      document.getElementById("switch-camera").classList.add("disabled");
    }
    wireSwitchCamera();
  } else {
    client.on("user-published", async (user, mediaType) => {
      await client.subscribe(user, mediaType);
      if (mediaType === "video") {
        const remotePlayer = document.getElementById("local-player");
        remotePlayer.innerHTML = "";
        user.videoTrack.play(remotePlayer);
      }
      if (mediaType === "audio") {
        user.audioTrack.play();
      }
    });
  }
}

document.getElementById("mute-audio").onclick = function () {
  if (!localAudioTrack) return;
  localAudioTrack.setEnabled(!localAudioTrack.enabled);
};
document.getElementById("mute-video").onclick = function () {
  if (!localVideoTrack) return;
  localVideoTrack.setEnabled(!localVideoTrack.enabled);
};

async function handleConfirmEnd() {
  closeConfirm();
  await endLiveStream();
  await leave();
}

async function endLiveStream() {
  try {
    await fetch("https://api.gympaddy.com/api/live-streams/end/" + encodeURIComponent(CHANNEL));
    if (window.ReactNativeWebView) {
      window.ReactNativeWebView.postMessage("stream_ended");
    }
  } catch (err) {}
}

async function leave() {
  if (localAudioTrack) {
    localAudioTrack.stop();
    localAudioTrack.close();
  }
  if (localVideoTrack) {
    localVideoTrack.stop();
    localVideoTrack.close();
  }
  await client.leave();
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
