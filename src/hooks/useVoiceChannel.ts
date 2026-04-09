import { useRef, useEffect, useCallback, useState } from "react";
import { useAudioDevices } from "./useAudioDevices";

const API_URL = "https://functions.poehali.dev/34ebed0a-100a-450c-8c07-780342df2a96";

const ICE_SERVERS = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
    { urls: "turn:openrelay.metered.ca:80", username: "openrelayproject", credential: "openrelayproject" },
    { urls: "turn:openrelay.metered.ca:443", username: "openrelayproject", credential: "openrelayproject" },
  ],
};

export interface VoiceChannelState {
  localStream: MediaStream | null;
  audioDevices: ReturnType<typeof useAudioDevices>["audioDevices"];
  outputDevices: ReturnType<typeof useAudioDevices>["outputDevices"];
  selectedMic: string;
  selectedSpeaker: string;
  setMicMuted: (v: boolean) => void;
  setDeafened: (v: boolean) => void;
  selectMic: (id: string) => Promise<void>;
  selectSpeaker: (id: string) => void;
  refreshDevices: () => Promise<void>;
  connectedPeers: number;
}

interface Options {
  userId: number;
  channelId: number | null;
  micMuted: boolean;
  deafened: boolean;
}

export function useVoiceChannel({ userId, channelId, micMuted, deafened }: Options): VoiceChannelState {
  const devices = useAudioDevices();

  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [connectedPeers, setConnectedPeers] = useState(0);

  const peersRef = useRef<Map<number, RTCPeerConnection>>(new Map());
  const audioElemsRef = useRef<Map<number, HTMLAudioElement>>(new Map());
  const localStreamRef = useRef<MediaStream | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const deafenedRef = useRef(deafened);
  const channelIdRef = useRef(channelId);

  deafenedRef.current = deafened;
  channelIdRef.current = channelId;

  // ── Получить локальный поток ────────────────────────────
  const getLocalStream = useCallback(async (micId?: string): Promise<MediaStream | null> => {
    try {
      const id = micId ?? devices.selectedMic;
      const constraint = id && id !== "default" ? { deviceId: { exact: id } } : true;
      const stream = await navigator.mediaDevices.getUserMedia({ audio: constraint, video: false });
      stream.getAudioTracks().forEach(t => { t.enabled = !micMuted; });
      return stream;
    } catch { return null; }
  }, [micMuted, devices.selectedMic]);

  // ── Отправить сигнал ────────────────────────────────────
  const sendSignal = useCallback(async (toUserId: number, type: string, payload: object) => {
    if (!channelIdRef.current) return;
    await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "voice_signal",
        channel_id: channelIdRef.current,
        from_user_id: userId,
        to_user_id: toUserId,
        type,
        payload: JSON.stringify(payload),
      }),
    }).catch(() => {});
  }, [userId]);

  // ── Создать PeerConnection ──────────────────────────────
  const createPeer = useCallback((remoteUserId: number, stream: MediaStream, initiator: boolean) => {
    if (peersRef.current.has(remoteUserId)) {
      peersRef.current.get(remoteUserId)?.close();
      peersRef.current.delete(remoteUserId);
    }

    const pc = new RTCPeerConnection(ICE_SERVERS);
    peersRef.current.set(remoteUserId, pc);

    stream.getTracks().forEach(t => pc.addTrack(t, stream));

    pc.ontrack = (e) => {
      const [remoteStream] = e.streams;
      let audio = audioElemsRef.current.get(remoteUserId);
      if (!audio) {
        audio = new Audio();
        audio.autoplay = true;
        audioElemsRef.current.set(remoteUserId, audio);
      }
      audio.srcObject = remoteStream;
      audio.muted = deafenedRef.current;
      devices.applyOutputToElement(audio);
      setConnectedPeers(peersRef.current.size);
    };

    pc.onicecandidate = (e) => {
      if (e.candidate) sendSignal(remoteUserId, "ice", { candidate: e.candidate });
    };

    pc.onconnectionstatechange = () => {
      if (pc.connectionState === "failed" || pc.connectionState === "closed") {
        peersRef.current.delete(remoteUserId);
        audioElemsRef.current.get(remoteUserId)?.pause();
        audioElemsRef.current.delete(remoteUserId);
        setConnectedPeers(peersRef.current.size);
      }
    };

    if (initiator) {
      pc.createOffer({ offerToReceiveAudio: true })
        .then(offer => pc.setLocalDescription(offer).then(() => sendSignal(remoteUserId, "offer", offer)))
        .catch(() => {});
    }

    return pc;
  }, [sendSignal, devices]);

  // ── Polling сигналов ────────────────────────────────────
  const pollSignals = useCallback(async () => {
    const cid = channelIdRef.current;
    if (!cid || !localStreamRef.current) return;

    let data: { signals?: { id: number; from: number; type: string; payload: string }[] };
    try {
      const res = await fetch(`${API_URL}?action=voice_signal_poll&channel_id=${cid}&user_id=${userId}`);
      data = await res.json();
    } catch { return; }

    if (!data.signals?.length) return;

    for (const sig of data.signals) {
      const fromId = sig.from;
      let payload: RTCSessionDescriptionInit | { candidate: RTCIceCandidateInit };
      try { payload = JSON.parse(sig.payload); } catch { continue; }

      let pc = peersRef.current.get(fromId);

      if (sig.type === "offer") {
        pc = createPeer(fromId, localStreamRef.current!, false);
        try {
          await pc.setRemoteDescription(new RTCSessionDescription(payload as RTCSessionDescriptionInit));
          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);
          await sendSignal(fromId, "answer", answer);
        } catch { /* silent */ }
      } else if (sig.type === "answer" && pc) {
        if (pc.signalingState === "have-local-offer") {
          try { await pc.setRemoteDescription(new RTCSessionDescription(payload as RTCSessionDescriptionInit)); } catch { /* silent */ }
        }
      } else if (sig.type === "ice" && pc) {
        const { candidate } = payload as { candidate: RTCIceCandidateInit };
        if (candidate) {
          try { await pc.addIceCandidate(new RTCIceCandidate(candidate)); } catch { /* stale */ }
        }
      } else if (sig.type === "join") {
        if (!pc && localStreamRef.current) createPeer(fromId, localStreamRef.current, true);
      }
    }
  }, [userId, createPeer, sendSignal]);

  // ── Инициализация при заходе в канал ───────────────────
  useEffect(() => {
    if (!channelId || !userId) return;
    let cancelled = false;

    const init = async () => {
      await devices.refreshDevices();
      const stream = await getLocalStream(devices.selectedMic);
      if (!stream || cancelled) return;
      localStreamRef.current = stream;
      setLocalStream(stream);

      await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "voice_signal", channel_id: channelId,
          from_user_id: userId, to_user_id: -1,
          type: "join", payload: JSON.stringify({ user_id: userId }),
        }),
      }).catch(() => {});

      if (pollRef.current) clearInterval(pollRef.current);
      pollRef.current = setInterval(pollSignals, 600);
    };

    init();
    return () => {
      cancelled = true;
      if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; }
      peersRef.current.forEach(pc => pc.close());
      peersRef.current.clear();
      audioElemsRef.current.forEach(a => { a.pause(); a.srcObject = null; });
      audioElemsRef.current.clear();
      localStreamRef.current?.getTracks().forEach(t => t.stop());
      localStreamRef.current = null;
      setLocalStream(null);
      setConnectedPeers(0);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [channelId, userId]);

  // ── Мут/анмут ───────────────────────────────────────────
  const setMicMuted = useCallback((v: boolean) => {
    localStreamRef.current?.getAudioTracks().forEach(t => { t.enabled = !v; });
  }, []);

  // ── Деафен ──────────────────────────────────────────────
  const setDeafened = useCallback((v: boolean) => {
    audioElemsRef.current.forEach(a => { a.muted = v; });
  }, []);

  // ── Смена микрофона мгновенно ───────────────────────────
  const selectMic = useCallback(async (id: string) => {
    devices.setSelectedMic(id);
    const isMuted = !localStreamRef.current?.getAudioTracks()[0]?.enabled;
    const constraint = id !== "default" ? { deviceId: { exact: id } } : true;
    let newTrack: MediaStreamTrack | null = null;
    try {
      const s = await navigator.mediaDevices.getUserMedia({ audio: constraint, video: false });
      newTrack = s.getAudioTracks()[0];
    } catch { return; }

    const replacePromises: Promise<void>[] = [];
    peersRef.current.forEach(pc => {
      const sender = pc.getSenders().find(s => s.track?.kind === "audio");
      if (sender && newTrack) replacePromises.push(sender.replaceTrack(newTrack).catch(() => {}));
    });
    await Promise.all(replacePromises);

    localStreamRef.current?.getAudioTracks().forEach(t => t.stop());
    newTrack.enabled = !isMuted;
    const updated = new MediaStream([newTrack]);
    localStreamRef.current = updated;
    setLocalStream(updated);
  }, [devices]);

  // ── Смена динамика ──────────────────────────────────────
  const selectSpeaker = useCallback((id: string) => {
    devices.setSelectedSpeaker(id);
    audioElemsRef.current.forEach(a => {
      devices.applyOutputToElement(a);
    });
  }, [devices]);

  // Обновляем мут/деафен из внешнего state
  useEffect(() => {
    localStreamRef.current?.getAudioTracks().forEach(t => { t.enabled = !micMuted; });
  }, [micMuted]);

  useEffect(() => {
    audioElemsRef.current.forEach(a => { a.muted = deafened; });
  }, [deafened]);

  return {
    localStream,
    audioDevices: devices.audioDevices,
    outputDevices: devices.outputDevices,
    selectedMic: devices.selectedMic,
    selectedSpeaker: devices.selectedSpeaker,
    setMicMuted,
    setDeafened,
    selectMic,
    selectSpeaker,
    refreshDevices: devices.refreshDevices,
    connectedPeers,
  };
}
