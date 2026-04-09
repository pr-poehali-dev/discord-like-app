import { useEffect, useRef, useState } from "react";

export function useMicLevel(stream: MediaStream | null, muted: boolean): number {
  const [level, setLevel] = useState(0);
  const rafRef = useRef<number | null>(null);
  const ctxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);

  useEffect(() => {
    if (!stream || muted) {
      setLevel(0);
      return;
    }

    try {
      ctxRef.current = new AudioContext();
      analyserRef.current = ctxRef.current.createAnalyser();
      analyserRef.current.fftSize = 256;
      analyserRef.current.smoothingTimeConstant = 0.7;
      sourceRef.current = ctxRef.current.createMediaStreamSource(stream);
      sourceRef.current.connect(analyserRef.current);

      const buf = new Uint8Array(analyserRef.current.frequencyBinCount);

      const tick = () => {
        if (!analyserRef.current) return;
        analyserRef.current.getByteFrequencyData(buf);
        const avg = buf.reduce((a, b) => a + b, 0) / buf.length;
        setLevel(Math.min(1, avg / 80));
        rafRef.current = requestAnimationFrame(tick);
      };
      rafRef.current = requestAnimationFrame(tick);
    } catch { /* нет доступа */ }

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      sourceRef.current?.disconnect();
      ctxRef.current?.close();
      analyserRef.current = null;
      sourceRef.current = null;
      ctxRef.current = null;
      setLevel(0);
    };
  }, [stream, muted]);

  return level;
}
