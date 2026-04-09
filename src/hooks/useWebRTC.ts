import { useState, useRef, useEffect, useCallback } from "react";

const DM_URL = "https://functions.poehali.dev/b026ce37-f295-45e6-9d62-287d071942eb";

// Google STUN + открытые STUN серверы
const ICE_SERVERS = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
    { urls: "stun:stun2.l.google.com:19302" },
    { urls: "stun:openrelay.metered.ca:80" },
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

export interface AudioDevice {
  deviceId: string;
  label: string;
  kind: MediaDeviceKind;
}

interface UseWebRTCOptions {
  userId: number;
  callId: number | null;
  remoteUserId: number | null;
  isInitiator: boolean; // true = звонящий, false = принимающий
  withVideo?: boolean;
  micDeviceId?: string;
  speakerDeviceId?: string;
}

export interface WebRTCState {
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  connected: boolean;
  micMuted: boolean;
  deafened: boolean;
  audioDevices: AudioDevice[];
  videoDevices: AudioDevice[];
  outputDevices: AudioDevice[];
  selectedMic: string;
  selectedCamera: string;
  selectedSpeaker: string;
  setMicMuted: (v: boolean) => void;
  setDeafened: (v: boolean) => void;
  selectMic: (deviceId: string) => void;
  selectCamera: (deviceId: string) => void;
  selectSpeaker: (deviceId: string) => void;
  hangup: () => void;
  refreshDevices: () => Promise<void>;
}

export function useWebRTC(options: UseWebRTCOptions): WebRTCState {
  const { userId, callId, remoteUserId, isInitiator, withVideo = false } = options;

  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [connected, setConnected] = useState(false);
  const [micMuted, setMicMutedState] = useState(false);
  const [deafened, setDeafenedState] = useState(false);
  const [audioDevices, setAudioDevices] = useState<AudioDevice[]>([]);
  const [videoDevices, setVideoDevices] = useState<AudioDevice[]>([]);
  const [outputDevices, setOutputDevices] = useState<AudioDevice[]>([]);
  const [selectedMic, setSelectedMic] = useState<string>("default");
  const [selectedCamera, setSelectedCamera] = useState<string>("default");
  const [selectedSpeaker, setSelectedSpeaker] = useState<string>("default");

  const pcRef = useRef<RTCPeerConnection | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const remoteAudioRef = useRef<HTMLAudioElement | null>(null);

  // ── Список устройств ────────────────────────────────────
  const refreshDevices = useCallback(async () => {
    try {
      // Запрашиваем разрешение сначала
      await navigator.mediaDevices.getUserMedia({ audio: true }).then(s => s.getTracks().forEach(t => t.stop()));
    } catch { /* нет доступа */ }
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      setAudioDevices(devices.filter(d => d.kind === "audioinput").map(d => ({ deviceId: d.deviceId, label: d.label || `Микрофон ${d.deviceId.slice(0, 8)}`, kind: d.kind })));
      setVideoDevices(devices.filter(d => d.kind === "videoinput").map(d => ({ deviceId: d.deviceId, label: d.label || `Камера ${d.deviceId.slice(0, 8)}`, kind: d.kind })));
      setOutputDevices(devices.filter(d => d.kind === "audiooutput").map(d => ({ deviceId: d.deviceId, label: d.label || `Динамик ${d.deviceId.slice(0, 8)}`, kind: d.kind })));
    } catch { /* silent */ }
  }, []);

  // ── Получить локальный поток ────────────────────────────
  const getLocalStream = useCallback(async (micId?: string, cameraId?: string) => {
    try {
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(t => t.stop());
      }
      const constraints: MediaStreamConstraints = {
        audio: micId && micId !== "default" ? { deviceId: { exact: micId } } : true,
        video: withVideo
          ? (cameraId && cameraId !== "default" ? { deviceId: { exact: cameraId } } : true)
          : false,
      };
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      localStreamRef.current = stream;
      setLocalStream(stream);
      return stream;
    } catch (err) {
      console.error("getUserMedia error:", err);
      return null;
    }
  }, [withVideo]);

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
    } catch { /* silent */ }
  }, [callId, userId, remoteUserId]);

  // ── Создать PeerConnection ──────────────────────────────
  const createPC = useCallback((stream: MediaStream) => {
    const pc = new RTCPeerConnection(ICE_SERVERS);
    pcRef.current = pc;

    // Добавляем свои треки
    stream.getTracks().forEach(track => pc.addTrack(track, stream));

    // Принимаем удалённые треки
    pc.ontrack = (event) => {
      const [remoteS] = event.streams;
      setRemoteStream(remoteS);
      // Подключаем к аудио-элементу
      if (!remoteAudioRef.current) {
        remoteAudioRef.current = new Audio();
        remoteAudioRef.current.autoplay = true;
      }
      remoteAudioRef.current.srcObject = remoteS;
      if (selectedSpeaker !== "default" && "setSinkId" in remoteAudioRef.current) {
        (remoteAudioRef.current as HTMLAudioElement & { setSinkId: (id: string) => Promise<void> })
          .setSinkId(selectedSpeaker).catch(() => {});
      }
    };

    // ICE кандидаты
    pc.onicecandidate = (event) => {
      if (event.candidate) {
        sendSignal("ice", { candidate: event.candidate });
      }
    };

    pc.onconnectionstatechange = () => {
      setConnected(pc.connectionState === "connected");
    };

    pc.oniceconnectionstatechange = () => {
      if (pc.iceConnectionState === "connected" || pc.iceConnectionState === "completed") {
        setConnected(true);
      }
    };

    return pc;
  }, [sendSignal, selectedSpeaker]);

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
          try {
            await pc.addIceCandidate(new RTCIceCandidate(payload.candidate));
          } catch { /* ignore stale candidates */ }
        } else if (sig.type === "hangup") {
          hangup();
        }
      }
    } catch { /* silent */ }
  }, [callId, userId, sendSignal]);

  // ── Основной эффект — инициализация звонка ──────────────
  useEffect(() => {
    if (!callId || !remoteUserId) return;

    let cancelled = false;

    const init = async () => {
      await refreshDevices();
      const stream = await getLocalStream(selectedMic, selectedCamera);
      if (!stream || cancelled) return;

      const pc = createPC(stream);

      if (isInitiator) {
        // Звонящий создаёт offer
        try {
          const offer = await pc.createOffer({ offerToReceiveAudio: true, offerToReceiveVideo: withVideo });
          await pc.setLocalDescription(offer);
          await sendSignal("offer", offer);
        } catch (err) {
          console.error("offer error:", err);
        }
      }

      // Запускаем polling сигналов каждые 800ms
      if (pollRef.current) clearInterval(pollRef.current);
      pollRef.current = setInterval(pollSignals, 800);
    };

    init();

    return () => {
      cancelled = true;
      if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [callId, remoteUserId]);

  // ── Мут/анмут микрофона ─────────────────────────────────
  const setMicMuted = useCallback((v: boolean) => {
    setMicMutedState(v);
    localStreamRef.current?.getAudioTracks().forEach(t => { t.enabled = !v; });
  }, []);

  // ── Деафен (заглушить входящий звук) ───────────────────
  const setDeafened = useCallback((v: boolean) => {
    setDeafenedState(v);
    if (remoteAudioRef.current) remoteAudioRef.current.muted = v;
  }, []);

  // ── Смена микрофона на лету ─────────────────────────────
  const selectMic = useCallback(async (deviceId: string) => {
    setSelectedMic(deviceId);
    const pc = pcRef.current;
    if (!pc || !localStreamRef.current) return;
    try {
      const newStream = await navigator.mediaDevices.getUserMedia({
        audio: deviceId !== "default" ? { deviceId: { exact: deviceId } } : true,
        video: false,
      });
      const newAudioTrack = newStream.getAudioTracks()[0];
      // Заменяем трек в PeerConnection
      const sender = pc.getSenders().find(s => s.track?.kind === "audio");
      if (sender) await sender.replaceTrack(newAudioTrack);
      // Останавливаем старый аудио-трек
      localStreamRef.current.getAudioTracks().forEach(t => t.stop());
      // Обновляем stream
      const updatedTracks = [...localStreamRef.current.getVideoTracks(), newAudioTrack];
      const updatedStream = new MediaStream(updatedTracks);
      localStreamRef.current = updatedStream;
      setLocalStream(updatedStream);
      if (micMuted) newAudioTrack.enabled = false;
    } catch (err) {
      console.error("selectMic error:", err);
    }
  }, [micMuted]);

  // ── Смена камеры ────────────────────────────────────────
  const selectCamera = useCallback(async (deviceId: string) => {
    setSelectedCamera(deviceId);
    if (!withVideo || !pcRef.current) return;
    try {
      const newStream = await navigator.mediaDevices.getUserMedia({
        video: deviceId !== "default" ? { deviceId: { exact: deviceId } } : true,
        audio: false,
      });
      const newVideoTrack = newStream.getVideoTracks()[0];
      const sender = pcRef.current.getSenders().find(s => s.track?.kind === "video");
      if (sender) await sender.replaceTrack(newVideoTrack);
    } catch (err) {
      console.error("selectCamera error:", err);
    }
  }, [withVideo]);

  // ── Смена динамика ──────────────────────────────────────
  const selectSpeaker = useCallback(async (deviceId: string) => {
    setSelectedSpeaker(deviceId);
    if (remoteAudioRef.current && "setSinkId" in remoteAudioRef.current) {
      try {
        await (remoteAudioRef.current as HTMLAudioElement & { setSinkId: (id: string) => Promise<void> })
          .setSinkId(deviceId);
      } catch (err) {
        console.error("setSinkId error:", err);
      }
    }
  }, []);

  // ── Завершить звонок ────────────────────────────────────
  const hangup = useCallback(() => {
    if (callId && remoteUserId) {
      sendSignal("hangup", {}).catch(() => {});
    }
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
  }, [callId, remoteUserId, sendSignal]);

  // Слушаем изменение устройств
  useEffect(() => {
    navigator.mediaDevices.addEventListener("devicechange", refreshDevices);
    refreshDevices();
    return () => navigator.mediaDevices.removeEventListener("devicechange", refreshDevices);
  }, [refreshDevices]);

  // Cleanup при unmount
  useEffect(() => {
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
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
    audioDevices,
    videoDevices,
    outputDevices,
    selectedMic,
    selectedCamera,
    selectedSpeaker,
    setMicMuted,
    setDeafened,
    selectMic,
    selectCamera,
    selectSpeaker,
    hangup,
    refreshDevices,
  };
}
