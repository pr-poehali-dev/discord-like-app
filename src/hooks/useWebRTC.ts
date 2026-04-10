import { useState, useRef, useEffect, useCallback } from "react";
import { useAudioDevices } from "./useAudioDevices";
export type { AudioDevice } from "./useAudioDevices";

const DM_URL = "https://functions.poehali.dev/b026ce37-f295-45e6-9d62-287d071942eb";

const ICE_SERVERS: RTCConfiguration = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
    {
      urls: "turn:openrelay.metered.ca:80",
      username: "openrelayproject",
      credential: "openrelayproject",
    },
    {
      urls: "turn:openrelay.metered.ca:443",
      username: "openrelayproject",
      credential: "openrelayproject",
    },
  ],
};

const CALL_TIMEOUT_MS = 30000;
const RECONNECT_TIMEOUT_MS = 5000;

interface UseWebRTCOptions {
  userId: number;
  callId: number | null;
  remoteUserId: number | null;
  isInitiator: boolean;
  withVideo?: boolean;
}

export interface WebRTCState {
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  connected: boolean;
  micMuted: boolean;
  deafened: boolean;
  audioDevices: ReturnType<typeof useAudioDevices>["audioDevices"];
  videoDevices: ReturnType<typeof useAudioDevices>["videoDevices"];
  outputDevices: ReturnType<typeof useAudioDevices>["outputDevices"];
  selectedMic: string;
  selectedCamera: string;
  selectedSpeaker: string;
  setMicMuted: (v: boolean) => void;
  setDeafened: (v: boolean) => void;
  selectMic: (deviceId: string) => Promise<void>;
  selectCamera: (deviceId: string) => Promise<void>;
  selectSpeaker: (deviceId: string) => void;
  hangup: () => void;
  refreshDevices: () => Promise<void>;
}

export function useWebRTC(options: UseWebRTCOptions): WebRTCState {
  const { userId, callId, remoteUserId, isInitiator, withVideo = false } = options;

  const devices = useAudioDevices();

  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [connected, setConnected] = useState(false);
  const [micMuted, setMicMutedState] = useState(false);
  const [deafened, setDeafenedState] = useState(false);

  const pcRef = useRef<RTCPeerConnection | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const remoteAudioRef = useRef<HTMLAudioElement | null>(null);
  const micMutedRef = useRef(false);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const callTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const cleanupCalledRef = useRef(false);

  const clearReconnectTimeout = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
  }, []);

  const clearCallTimeout = useCallback(() => {
    if (callTimeoutRef.current) {
      clearTimeout(callTimeoutRef.current);
      callTimeoutRef.current = null;
    }
  }, []);

  const cleanup = useCallback(() => {
    if (cleanupCalledRef.current) return;
    cleanupCalledRef.current = true;
    clearReconnectTimeout();
    clearCallTimeout();
    if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; }
    pcRef.current?.close();
    pcRef.current = null;
    localStreamRef.current?.getTracks().forEach(t => t.stop());
    localStreamRef.current = null;
    setLocalStream(null);
    setRemoteStream(null);
    setConnected(false);
    if (remoteAudioRef.current) {
      remoteAudioRef.current.srcObject = null;
      remoteAudioRef.current = null;
    }
  }, [clearReconnectTimeout, clearCallTimeout]);

  // ── Получить локальный поток ────────────────────────────
  const getLocalStream = useCallback(async (micId?: string, cameraId?: string) => {
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(t => t.stop());
    }
    const mic = micId ?? devices.selectedMic;
    const cam = cameraId ?? devices.selectedCamera;
    const audioConstraint = mic && mic !== "default" ? { deviceId: { exact: mic } } : true;
    const videoConstraint = withVideo
      ? (cam && cam !== "default" ? { deviceId: { exact: cam } } : true)
      : false;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: audioConstraint,
        video: videoConstraint,
      });
      localStreamRef.current = stream;
      setLocalStream(stream);
      return stream;
    } catch (err) {
      console.error("getUserMedia error:", err);
      return null;
    }
  }, [withVideo, devices.selectedMic, devices.selectedCamera]);

  // ── Отправить WebRTC сигнал ─────────────────────────────
  const sendSignal = useCallback(async (type: string, payload: object) => {
    if (!callId || !remoteUserId) return;
    try {
      await fetch(DM_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "webrtc_signal",
          call_id: callId,
          from_user_id: userId,
          to_user_id: remoteUserId,
          type,
          payload: JSON.stringify(payload),
        }),
      });
    } catch (err) {
      console.error("sendSignal error:", err);
    }
  }, [callId, userId, remoteUserId]);

  const hangup = useCallback(() => {
    if (callId && remoteUserId) {
      sendSignal("hangup", {}).catch((err) => console.error("hangup signal error:", err));
    }
    cleanup();
  }, [callId, remoteUserId, sendSignal, cleanup]);

  const handleRemoteHangup = useCallback(() => {
    cleanup();
  }, [cleanup]);

  // ── Создать PeerConnection ──────────────────────────────
  const createPC = useCallback((stream: MediaStream) => {
    const pc = new RTCPeerConnection(ICE_SERVERS);
    pcRef.current = pc;

    stream.getTracks().forEach(track => pc.addTrack(track, stream));

    pc.ontrack = (event) => {
      const [remoteS] = event.streams;
      setRemoteStream(remoteS);
      if (!remoteAudioRef.current) {
        remoteAudioRef.current = new Audio();
        remoteAudioRef.current.autoplay = true;
      }
      remoteAudioRef.current.srcObject = remoteS;
      devices.applyOutputToElement(remoteAudioRef.current);
    };

    pc.onicecandidate = (event) => {
      if (event.candidate) sendSignal("ice", { candidate: event.candidate });
    };

    pc.onconnectionstatechange = () => {
      const state = pc.connectionState;
      if (state === "connected") {
        setConnected(true);
        clearReconnectTimeout();
        clearCallTimeout();
      } else if (state === "failed" || state === "closed") {
        clearReconnectTimeout();
        cleanup();
      } else if (state === "disconnected") {
        setConnected(false);
        clearReconnectTimeout();
        reconnectTimeoutRef.current = setTimeout(() => {
          if (pcRef.current && pcRef.current.connectionState !== "connected") {
            cleanup();
          }
        }, RECONNECT_TIMEOUT_MS);
      }
    };

    pc.oniceconnectionstatechange = () => {
      if (pc.iceConnectionState === "connected" || pc.iceConnectionState === "completed") {
        setConnected(true);
        clearCallTimeout();
      }
    };

    return pc;
  }, [sendSignal, devices, clearReconnectTimeout, clearCallTimeout, cleanup]);

  // ── Polling сигналов ────────────────────────────────────
  const pollSignals = useCallback(async () => {
    if (!callId || !userId) return;
    try {
      const res = await fetch(`${DM_URL}?action=webrtc_poll&call_id=${callId}&user_id=${userId}`);
      const data = await res.json();
      if (!data.signals?.length) return;

      for (const sig of data.signals) {
        const payload = JSON.parse(sig.payload);
        const pc = pcRef.current;
        if (!pc) continue;

        if (sig.type === "offer") {
          await pc.setRemoteDescription(new RTCSessionDescription(payload));
          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);
          await sendSignal("answer", answer);
        } else if (sig.type === "answer") {
          if (pc.signalingState === "have-local-offer") {
            await pc.setRemoteDescription(new RTCSessionDescription(payload));
          }
        } else if (sig.type === "ice") {
          try { await pc.addIceCandidate(new RTCIceCandidate(payload.candidate)); } catch { /* stale */ }
        } else if (sig.type === "hangup") {
          handleRemoteHangup();
        }
      }
    } catch (err) {
      console.error("pollSignals error:", err);
    }
   
  }, [callId, userId, sendSignal, handleRemoteHangup]);

  // ── Инициализация звонка ────────────────────────────────
  useEffect(() => {
    if (!callId || !remoteUserId) return;
    let cancelled = false;
    cleanupCalledRef.current = false;

    const init = async () => {
      await devices.refreshDevices();
      const stream = await getLocalStream();
      if (!stream || cancelled) return;

      const pc = createPC(stream);

      if (isInitiator) {
        try {
          const offer = await pc.createOffer({ offerToReceiveAudio: true, offerToReceiveVideo: withVideo });
          await pc.setLocalDescription(offer);
          await sendSignal("offer", offer);
        } catch (err) {
          console.error("offer error:", err);
        }

        callTimeoutRef.current = setTimeout(() => {
          if (pcRef.current && pcRef.current.connectionState !== "connected") {
            console.error("Outgoing call timeout — no answer");
            hangup();
          }
        }, CALL_TIMEOUT_MS);
      }

      if (pollRef.current) clearInterval(pollRef.current);
      pollRef.current = setInterval(pollSignals, 800);
    };

    init();

    return () => {
      cancelled = true;
      if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; }
      clearCallTimeout();
      clearReconnectTimeout();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [callId, remoteUserId]);

  // ── Мут микрофона ───────────────────────────────────────
  const setMicMuted = useCallback((v: boolean) => {
    setMicMutedState(v);
    micMutedRef.current = v;
    localStreamRef.current?.getAudioTracks().forEach(t => { t.enabled = !v; });
  }, []);

  // ── Деафен ──────────────────────────────────────────────
  const setDeafened = useCallback((v: boolean) => {
    setDeafenedState(v);
    if (remoteAudioRef.current) remoteAudioRef.current.muted = v;
  }, []);

  // ── Смена микрофона мгновенно ───────────────────────────
  const selectMic = useCallback(async (deviceId: string) => {
    devices.setSelectedMic(deviceId);
    const pc = pcRef.current;
    if (!localStreamRef.current) return;
    try {
      const constraint = deviceId !== "default" ? { deviceId: { exact: deviceId } } : true;
      const newStream = await navigator.mediaDevices.getUserMedia({ audio: constraint, video: false });
      const newAudioTrack = newStream.getAudioTracks()[0];
      newAudioTrack.enabled = !micMutedRef.current;
      if (pc) {
        const sender = pc.getSenders().find(s => s.track?.kind === "audio");
        if (sender) await sender.replaceTrack(newAudioTrack);
      }
      localStreamRef.current.getAudioTracks().forEach(t => t.stop());
      const updated = new MediaStream([
        newAudioTrack,
        ...localStreamRef.current.getVideoTracks(),
      ]);
      localStreamRef.current = updated;
      setLocalStream(updated);
    } catch (err) {
      console.error("selectMic error:", err);
    }
  }, [devices]);

  // ── Смена камеры ────────────────────────────────────────
  const selectCamera = useCallback(async (deviceId: string) => {
    devices.setSelectedCamera(deviceId);
    if (!withVideo || !pcRef.current) return;
    try {
      const constraint = deviceId !== "default" ? { deviceId: { exact: deviceId } } : true;
      const newStream = await navigator.mediaDevices.getUserMedia({ video: constraint, audio: false });
      const newVideoTrack = newStream.getVideoTracks()[0];
      const sender = pcRef.current.getSenders().find(s => s.track?.kind === "video");
      if (sender) await sender.replaceTrack(newVideoTrack);
    } catch (err) {
      console.error("selectCamera error:", err);
    }
  }, [withVideo, devices]);

  // ── Смена динамика ──────────────────────────────────────
  const selectSpeaker = useCallback((deviceId: string) => {
    devices.setSelectedSpeaker(deviceId);
    if (remoteAudioRef.current) {
      devices.applyOutputToElement(remoteAudioRef.current);
    }
  }, [devices]);

  useEffect(() => {
    return () => {
      if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; }
      if (reconnectTimeoutRef.current) { clearTimeout(reconnectTimeoutRef.current); reconnectTimeoutRef.current = null; }
      if (callTimeoutRef.current) { clearTimeout(callTimeoutRef.current); callTimeoutRef.current = null; }
      pcRef.current?.close();
      localStreamRef.current?.getTracks().forEach(t => t.stop());
      remoteAudioRef.current?.pause();
    };
  }, []);

  return {
    localStream,
    remoteStream,
    connected,
    micMuted,
    deafened,
    audioDevices: devices.audioDevices,
    videoDevices: devices.videoDevices,
    outputDevices: devices.outputDevices,
    selectedMic: devices.selectedMic,
    selectedCamera: devices.selectedCamera,
    selectedSpeaker: devices.selectedSpeaker,
    setMicMuted,
    setDeafened,
    selectMic,
    selectCamera,
    selectSpeaker,
    hangup,
    refreshDevices: devices.refreshDevices,
  };
}
