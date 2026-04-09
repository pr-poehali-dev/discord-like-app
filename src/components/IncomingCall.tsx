import { useEffect, useRef } from "react";
import Icon from "@/components/ui/icon";

interface IncomingCallProps {
  callerName: string;
  callerColor: string;
  callType: "audio" | "video";
  onAccept: () => void;
  onDecline: () => void;
}

export default function IncomingCall({ callerName, callerColor, callType, onAccept, onDecline }: IncomingCallProps) {
  const rF = { fontFamily: "Rajdhani, sans-serif" };
  const iF = { fontFamily: "IBM Plex Sans, sans-serif" };
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Звук звонка (синтетический через Web Audio API)
  useEffect(() => {
    let ctx: AudioContext | null = null;
    let stopped = false;

    const ring = () => {
      if (stopped) return;
      try {
        ctx = new AudioContext();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = "sine";
        osc.frequency.setValueAtTime(880, ctx.currentTime);
        osc.frequency.setValueAtTime(660, ctx.currentTime + 0.15);
        gain.gain.setValueAtTime(0.3, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);
        osc.start();
        osc.stop(ctx.currentTime + 0.4);
        osc.onended = () => { ctx?.close(); ctx = null; };
      } catch { /* нет разрешения на звук */ }
    };

    ring();
    const interval = setInterval(ring, 1200);

    return () => {
      stopped = true;
      clearInterval(interval);
      ctx?.close();
    };
  }, []);

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center"
      style={{ background: "rgba(0,0,0,0.75)", backdropFilter: "blur(8px)" }}
    >
      {/* Пульсирующее кольцо */}
      <div className="relative flex items-center justify-center">
        <div
          className="absolute rounded-full animate-ping"
          style={{
            width: "180px", height: "180px",
            background: callerColor + "15",
            border: `2px solid ${callerColor}33`,
          }}
        />
        <div
          className="absolute rounded-full"
          style={{
            width: "160px", height: "160px",
            background: callerColor + "08",
            border: `1px solid ${callerColor}22`,
            animation: "ping 1.5s cubic-bezier(0,0,0.2,1) infinite 0.3s",
          }}
        />

        {/* Карточка */}
        <div
          className="relative flex flex-col items-center gap-5 px-10 py-8 rounded-3xl"
          style={{
            background: "linear-gradient(160deg, #0d1424 0%, #060a11 100%)",
            border: `1px solid ${callerColor}44`,
            boxShadow: `0 0 60px ${callerColor}20, 0 32px 64px rgba(0,0,0,0.6)`,
            minWidth: "320px",
          }}
        >
          {/* Аватар */}
          <div className="relative">
            <div
              className="w-20 h-20 rounded-full flex items-center justify-center"
              style={{
                background: callerColor + "22",
                color: callerColor,
                border: `3px solid ${callerColor}66`,
                boxShadow: `0 0 32px ${callerColor}44`,
                ...rF, fontWeight: 900, fontSize: "26px",
              }}
            >
              {callerName.slice(0, 2).toUpperCase()}
            </div>
            {/* Иконка типа звонка */}
            <div
              className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full flex items-center justify-center"
              style={{ background: callerColor, boxShadow: `0 2px 8px ${callerColor}88` }}
            >
              <Icon name={callType === "video" ? "Video" : "Phone"} size={13} style={{ color: "#fff" }} />
            </div>
          </div>

          {/* Текст */}
          <div className="text-center">
            <div style={{ ...iF, fontSize: "12px", color: "#6b7fa3", marginBottom: "4px", letterSpacing: "0.5px" }}>
              Входящий {callType === "video" ? "видеозвонок" : "звонок"}
            </div>
            <div style={{ ...rF, fontWeight: 800, fontSize: "22px", color: callerColor }}>
              {callerName}
            </div>
          </div>

          {/* Кнопки */}
          <div className="flex items-center gap-6 mt-2">
            {/* Отклонить */}
            <div className="flex flex-col items-center gap-2">
              <button
                onClick={onDecline}
                className="w-16 h-16 rounded-full flex items-center justify-center transition-all hover:scale-110 active:scale-95"
                style={{
                  background: "rgba(255,68,68,0.2)",
                  border: "2px solid rgba(255,68,68,0.5)",
                  color: "#ff4444",
                  boxShadow: "0 4px 20px rgba(255,68,68,0.25)",
                }}
              >
                <Icon name="PhoneOff" size={24} />
              </button>
              <span style={{ ...iF, fontSize: "11px", color: "#6b7fa3" }}>Отклонить</span>
            </div>

            {/* Принять */}
            <div className="flex flex-col items-center gap-2">
              <button
                onClick={onAccept}
                className="w-16 h-16 rounded-full flex items-center justify-center transition-all hover:scale-110 active:scale-95"
                style={{
                  background: "rgba(0,255,136,0.2)",
                  border: "2px solid rgba(0,255,136,0.5)",
                  color: "#00ff88",
                  boxShadow: "0 4px 20px rgba(0,255,136,0.25)",
                }}
              >
                <Icon name={callType === "video" ? "Video" : "Phone"} size={24} />
              </button>
              <span style={{ ...iF, fontSize: "11px", color: "#6b7fa3" }}>Принять</span>
            </div>
          </div>
        </div>
      </div>

      {/* Скрытый audio элемент (заглушка) */}
      <audio ref={audioRef} loop style={{ display: "none" }} />
    </div>
  );
}
