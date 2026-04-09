import { useState, useEffect, useCallback, useRef } from "react";

export interface AudioDevice {
  deviceId: string;
  label: string;
  kind: MediaDeviceKind;
}

const STORAGE_KEY = "audio_device_prefs";

function loadPrefs(): { mic: string; speaker: string; camera: string } {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
  } catch { return {}; }
}

function savePrefs(mic: string, speaker: string, camera: string) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ mic, speaker, camera }));
}

export interface AudioDevicesState {
  audioDevices: AudioDevice[];
  outputDevices: AudioDevice[];
  videoDevices: AudioDevice[];
  selectedMic: string;
  selectedSpeaker: string;
  selectedCamera: string;
  setSelectedMic: (id: string) => void;
  setSelectedSpeaker: (id: string) => void;
  setSelectedCamera: (id: string) => void;
  refreshDevices: () => Promise<void>;
  applyOutputToElement: (el: HTMLAudioElement | HTMLVideoElement) => void;
}

export function useAudioDevices(): AudioDevicesState {
  const prefs = loadPrefs();
  const [audioDevices, setAudioDevices] = useState<AudioDevice[]>([]);
  const [outputDevices, setOutputDevices] = useState<AudioDevice[]>([]);
  const [videoDevices, setVideoDevices] = useState<AudioDevice[]>([]);
  const [selectedMic, setSelectedMicState] = useState(prefs.mic || "default");
  const [selectedSpeaker, setSelectedSpeakerState] = useState(prefs.speaker || "default");
  const [selectedCamera, setSelectedCameraState] = useState(prefs.camera || "default");

  const selectedSpeakerRef = useRef(selectedSpeaker);
  selectedSpeakerRef.current = selectedSpeaker;

  const refreshDevices = useCallback(async () => {
    try {
      // запрашиваем разрешение чтобы браузер отдал имена устройств
      const s = await navigator.mediaDevices.getUserMedia({ audio: true }).catch(() => null);
      s?.getTracks().forEach(t => t.stop());
      const devs = await navigator.mediaDevices.enumerateDevices();
      setAudioDevices(devs.filter(d => d.kind === "audioinput").map(d => ({
        deviceId: d.deviceId, label: d.label || `Микрофон`, kind: d.kind,
      })));
      setOutputDevices(devs.filter(d => d.kind === "audiooutput").map(d => ({
        deviceId: d.deviceId, label: d.label || `Динамик`, kind: d.kind,
      })));
      setVideoDevices(devs.filter(d => d.kind === "videoinput").map(d => ({
        deviceId: d.deviceId, label: d.label || `Камера`, kind: d.kind,
      })));
    } catch { /* silent */ }
  }, []);

  const setSelectedMic = useCallback((id: string) => {
    setSelectedMicState(id);
    const p = loadPrefs();
    savePrefs(id, p.speaker || "default", p.camera || "default");
  }, []);

  const setSelectedSpeaker = useCallback((id: string) => {
    setSelectedSpeakerState(id);
    selectedSpeakerRef.current = id;
    const p = loadPrefs();
    savePrefs(p.mic || "default", id, p.camera || "default");
  }, []);

  const setSelectedCamera = useCallback((id: string) => {
    setSelectedCameraState(id);
    const p = loadPrefs();
    savePrefs(p.mic || "default", p.speaker || "default", id);
  }, []);

  // Применить выбранный динамик к audio/video элементу
  const applyOutputToElement = useCallback((el: HTMLAudioElement | HTMLVideoElement) => {
    const spk = selectedSpeakerRef.current;
    if (spk && spk !== "default" && "setSinkId" in el) {
      (el as HTMLAudioElement & { setSinkId: (id: string) => Promise<void> })
        .setSinkId(spk).catch(() => {});
    }
  }, []);

  // Слушаем подключение/отключение устройств
  useEffect(() => {
    navigator.mediaDevices.addEventListener("devicechange", refreshDevices);
    refreshDevices();
    return () => navigator.mediaDevices.removeEventListener("devicechange", refreshDevices);
  }, [refreshDevices]);

  return {
    audioDevices, outputDevices, videoDevices,
    selectedMic, selectedSpeaker, selectedCamera,
    setSelectedMic, setSelectedSpeaker, setSelectedCamera,
    refreshDevices, applyOutputToElement,
  };
}
