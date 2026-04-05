import { useState } from "react";
import Icon from "@/components/ui/icon";

interface StreamCaptureProps {
  onClose: () => void;
  onStart: (config: StreamConfig) => void;
}

interface StreamConfig {
  source: string;
  sourceName: string;
  quality: string;
  fps: string;
  bitrate: string;
  audio: boolean;
  cursor: boolean;
}

const MOCK_WINDOWS = [
  { id: "chrome", name: "Google Chrome", icon: "Globe", subtitle: "Браузер · 3 вкладки", type: "app" },
  { id: "vscode", name: "VS Code", icon: "Code2", subtitle: "Редактор · nexus-project", type: "app" },
  { id: "discord", name: "Discord", icon: "MessageSquare", subtitle: "Приложение", type: "app" },
  { id: "steam", name: "Steam", icon: "Gamepad2", subtitle: "Игровая платформа", type: "app" },
  { id: "obs", name: "OBS Studio", icon: "Radio", subtitle: "Стриминг-ПО", type: "app" },
  { id: "figma", name: "Figma", icon: "Layers", subtitle: "Дизайн · проект nexus", type: "app" },
];

const MOCK_GAMES = [
  { id: "cs2", name: "Counter-Strike 2", icon: "🎯", resolution: "1920×1080", fps: 120 },
  { id: "dota", name: "Dota 2", icon: "🏆", resolution: "2560×1440", fps: 165 },
  { id: "valorant", name: "VALORANT", icon: "💥", resolution: "1920×1080", fps: 240 },
  { id: "apex", name: "Apex Legends", icon: "🔥", resolution: "1920×1080", fps: 144 },
  { id: "minecraft", name: "Minecraft", icon: "⛏️", resolution: "1920×1080", fps: 60 },
];

const QUALITY_OPTIONS = [
  { v: "360p", label: "360p", desc: "Очень экономный трафик" },
  { v: "480p", label: "480p", desc: "Эконом режим" },
  { v: "720p", label: "720p", desc: "Стандарт HD" },
  { v: "1080p", label: "1080p", desc: "Full HD — рекомендуется" },
  { v: "1440p", label: "1440p", desc: "Quad HD (QHD)" },
];

const FPS_OPTIONS = [
  { v: "15", label: "15 FPS", color: "#6b7fa3", desc: "Слайд-шоу" },
  { v: "30", label: "30 FPS", color: "#00aaff", desc: "Стандарт" },
  { v: "45", label: "45 FPS", color: "#aa00ff", desc: "Плавный" },
  { v: "60", label: "60 FPS", color: "#00ff88", desc: "Максимум" },
];

const BITRATE_MAP: Record<string, Record<string, string>> = {
  "360p": { "15": "500", "30": "800", "45": "1000", "60": "1200" },
  "480p": { "15": "1000", "30": "1500", "45": "2000", "60": "2500" },
  "720p": { "15": "2000", "30": "3000", "45": "4000", "60": "4500" },
  "1080p": { "15": "3000", "30": "5000", "45": "6000", "60": "7500" },
  "1440p": { "15": "5000", "30": "8000", "45": "10000", "60": "12000" },
};

export default function StreamCapture({ onClose, onStart }: StreamCaptureProps) {
  const [step, setStep] = useState<"source" | "config">("source");
  const [sourceType, setSourceType] = useState<"screen" | "app" | "game" | "camera" | null>(null);
  const [selectedSource, setSelectedSource] = useState<string>("");
  const [selectedSourceName, setSelectedSourceName] = useState<string>("");
  const [quality, setQuality] = useState("1080p");
  const [fps, setFps] = useState("60");
  const [streamAudio, setStreamAudio] = useState(true);
  const [streamCursor, setStreamCursor] = useState(true);
  const [streamMic, setStreamMic] = useState(false);
  const [codec, setCodec] = useState("H.264");
  const [preview, setPreview] = useState(false);

  const rF = { fontFamily: "Rajdhani, sans-serif" };
  const iF = { fontFamily: "IBM Plex Sans, sans-serif" };

  const estimatedBitrate = BITRATE_MAP[quality]?.[fps] || "6000";
  const estimatedKbps = parseInt(estimatedBitrate);

  const handleStart = () => {
    onStart({
      source: sourceType || "screen",
      sourceName: selectedSourceName || "Весь экран",
      quality,
      fps,
      bitrate: estimatedBitrate,
      audio: streamAudio,
      cursor: streamCursor,
    });
    onClose();
  };

  const Toggle = ({ value, onChange, color = "#00ff88" }: { value: boolean; onChange: () => void; color?: string }) => (
    <button onClick={onChange} className="w-10 h-5 rounded-full transition-all relative shrink-0"
      style={{ background: value ? color : "rgba(255,255,255,0.1)" }}>
      <div className="absolute w-3.5 h-3.5 rounded-full top-0.5 transition-all" style={{ background: "#fff", left: value ? "21px" : "3px" }} />
    </button>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center animate-fade-in" style={{ background: "rgba(0,0,0,0.85)" }}>
      <div className="w-full max-w-2xl mx-4 rounded-2xl overflow-hidden shadow-2xl" style={{ background: "var(--dark-panel)", border: "1px solid rgba(255,0,170,0.2)" }}>

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4" style={{ background: "#060a11", borderBottom: "1px solid rgba(255,0,170,0.1)" }}>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: "rgba(255,0,170,0.15)" }}>
              <Icon name="MonitorPlay" size={18} style={{ color: "#ff00aa" }} />
            </div>
            <div>
              <div style={{ ...rF, fontWeight: 800, fontSize: "16px", color: "#e2e8f0" }}>
                {step === "source" ? "Выберите источник" : "Настройки трансляции"}
              </div>
              <div style={{ ...iF, fontSize: "12px", color: "#6b7fa3" }}>
                {step === "source" ? "Что вы хотите транслировать?" : `${selectedSourceName || "Весь экран"} · ${quality} · ${fps} FPS`}
              </div>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center hover:opacity-70 transition-opacity" style={{ background: "rgba(255,255,255,0.05)" }}>
            <Icon name="X" size={15} style={{ color: "#6b7fa3" }} />
          </button>
        </div>

        <div className="p-6">

          {/* STEP 1: Source selection */}
          {step === "source" && (
            <div className="space-y-4">
              {/* Source type buttons */}
              <div className="grid grid-cols-4 gap-3">
                {[
                  { type: "screen" as const, icon: "Monitor", label: "Весь экран", desc: "Рабочий стол", color: "#00ff88" },
                  { type: "app" as const, icon: "AppWindow", label: "Приложение", desc: "Окно/программа", color: "#00aaff" },
                  { type: "game" as const, icon: "Gamepad2", label: "Игра", desc: "Захват игры", color: "#aa00ff" },
                  { type: "camera" as const, icon: "Camera", label: "Камера", desc: "Веб-камера", color: "#ff00aa" },
                ].map(opt => (
                  <button key={opt.type} onClick={() => { setSourceType(opt.type); setSelectedSource(""); setSelectedSourceName(""); }}
                    className="flex flex-col items-center gap-2 p-4 rounded-xl transition-all hover:scale-[1.02]"
                    style={{ background: sourceType === opt.type ? opt.color + "18" : "rgba(255,255,255,0.04)", border: sourceType === opt.type ? `2px solid ${opt.color}44` : "2px solid rgba(255,255,255,0.06)", boxShadow: sourceType === opt.type ? `0 0 20px ${opt.color}15` : "none" }}>
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: sourceType === opt.type ? opt.color + "22" : "rgba(255,255,255,0.05)" }}>
                      <Icon name={opt.icon} size={20} style={{ color: sourceType === opt.type ? opt.color : "#6b7fa3" }} />
                    </div>
                    <div style={{ ...rF, fontWeight: 700, fontSize: "13px", color: sourceType === opt.type ? opt.color : "#e2e8f0" }}>{opt.label}</div>
                    <div style={{ ...iF, fontSize: "10px", color: "#6b7fa3", textAlign: "center" }}>{opt.desc}</div>
                  </button>
                ))}
              </div>

              {/* Screen — show monitors */}
              {sourceType === "screen" && (
                <div className="animate-fade-in">
                  <div style={{ ...rF, fontWeight: 600, fontSize: "11px", color: "#6b7fa3", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "8px" }}>Монитор</div>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { id: "monitor1", label: "Монитор 1", res: "1920×1080", primary: true },
                      { id: "monitor2", label: "Монитор 2", res: "2560×1440", primary: false },
                    ].map(m => (
                      <button key={m.id} onClick={() => { setSelectedSource(m.id); setSelectedSourceName(m.label); }}
                        className="flex items-center gap-3 p-3 rounded-xl transition-all text-left"
                        style={{ background: selectedSource === m.id ? "rgba(0,255,136,0.12)" : "rgba(255,255,255,0.04)", border: selectedSource === m.id ? "2px solid rgba(0,255,136,0.35)" : "2px solid rgba(255,255,255,0.06)" }}>
                        <div className="w-12 h-8 rounded-lg flex items-center justify-center" style={{ background: selectedSource === m.id ? "rgba(0,255,136,0.15)" : "rgba(255,255,255,0.06)", border: `1px solid ${selectedSource === m.id ? "#00ff8855" : "rgba(255,255,255,0.08)"}` }}>
                          <Icon name="Monitor" size={16} style={{ color: selectedSource === m.id ? "#00ff88" : "#6b7fa3" }} />
                        </div>
                        <div>
                          <div style={{ ...rF, fontWeight: 700, fontSize: "14px", color: selectedSource === m.id ? "#00ff88" : "#e2e8f0" }}>
                            {m.label} {m.primary && <span style={{ fontSize: "10px", color: "#6b7fa3" }}>(основной)</span>}
                          </div>
                          <div style={{ ...iF, fontSize: "11px", color: "#6b7fa3" }}>{m.res}</div>
                        </div>
                        {selectedSource === m.id && <Icon name="Check" size={15} style={{ color: "#00ff88", marginLeft: "auto" }} />}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* App — show windows */}
              {sourceType === "app" && (
                <div className="animate-fade-in">
                  <div style={{ ...rF, fontWeight: 600, fontSize: "11px", color: "#6b7fa3", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "8px" }}>Открытые приложения</div>
                  <div className="space-y-1.5 max-h-64 overflow-y-auto">
                    {MOCK_WINDOWS.map(win => (
                      <button key={win.id} onClick={() => { setSelectedSource(win.id); setSelectedSourceName(win.name); }}
                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all text-left"
                        style={{ background: selectedSource === win.id ? "rgba(0,170,255,0.1)" : "rgba(255,255,255,0.03)", border: selectedSource === win.id ? "1px solid rgba(0,170,255,0.3)" : "1px solid rgba(255,255,255,0.04)" }}>
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: selectedSource === win.id ? "rgba(0,170,255,0.15)" : "rgba(255,255,255,0.06)" }}>
                          <Icon name={win.icon} size={16} style={{ color: selectedSource === win.id ? "#00aaff" : "#6b7fa3" }} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div style={{ ...rF, fontWeight: 700, fontSize: "14px", color: selectedSource === win.id ? "#00aaff" : "#e2e8f0" }}>{win.name}</div>
                          <div style={{ ...iF, fontSize: "11px", color: "#6b7fa3" }}>{win.subtitle}</div>
                        </div>
                        {selectedSource === win.id && <Icon name="Check" size={14} style={{ color: "#00aaff" }} />}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Game — show detected games */}
              {sourceType === "game" && (
                <div className="animate-fade-in">
                  <div style={{ ...rF, fontWeight: 600, fontSize: "11px", color: "#6b7fa3", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "8px" }}>Обнаруженные игры</div>
                  <div className="space-y-2">
                    {MOCK_GAMES.map(game => (
                      <button key={game.id} onClick={() => { setSelectedSource(game.id); setSelectedSourceName(game.name); }}
                        className="w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-left"
                        style={{ background: selectedSource === game.id ? "rgba(170,0,255,0.12)" : "rgba(255,255,255,0.03)", border: selectedSource === game.id ? "1px solid rgba(170,0,255,0.35)" : "1px solid rgba(255,255,255,0.04)" }}>
                        <span style={{ fontSize: "22px" }}>{game.icon}</span>
                        <div className="flex-1">
                          <div style={{ ...rF, fontWeight: 700, fontSize: "14px", color: selectedSource === game.id ? "#aa00ff" : "#e2e8f0" }}>{game.name}</div>
                          <div style={{ ...iF, fontSize: "11px", color: "#6b7fa3" }}>{game.resolution} · {game.fps} FPS</div>
                        </div>
                        <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg" style={{ background: "rgba(0,255,136,0.1)" }}>
                          <div className="w-1.5 h-1.5 rounded-full" style={{ background: "#00ff88" }} />
                          <span style={{ ...rF, fontWeight: 700, fontSize: "10px", color: "#00ff88" }}>ЗАПУЩЕНА</span>
                        </div>
                        {selectedSource === game.id && <Icon name="Check" size={14} style={{ color: "#aa00ff" }} />}
                      </button>
                    ))}
                    <div className="flex items-center gap-3 px-4 py-3 rounded-xl opacity-40" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.04)" }}>
                      <span style={{ fontSize: "22px" }}>🎮</span>
                      <div>
                        <div style={{ ...rF, fontWeight: 700, fontSize: "14px", color: "#6b7fa3" }}>Warzone</div>
                        <div style={{ ...iF, fontSize: "11px", color: "#4a5568" }}>Не запущена</div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Camera */}
              {sourceType === "camera" && (
                <div className="animate-fade-in">
                  <div style={{ ...rF, fontWeight: 600, fontSize: "11px", color: "#6b7fa3", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "8px" }}>Камера</div>
                  <div className="space-y-1.5">
                    {["Встроенная камера (FaceTime HD)", "Logitech C922 Pro", "iPhone (Continuity Camera)"].map(cam => (
                      <button key={cam} onClick={() => { setSelectedSource(cam); setSelectedSourceName(cam); }}
                        className="w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all text-left"
                        style={{ background: selectedSource === cam ? "rgba(255,0,170,0.1)" : "rgba(255,255,255,0.03)", border: selectedSource === cam ? "1px solid rgba(255,0,170,0.3)" : "1px solid rgba(255,255,255,0.04)" }}>
                        <Icon name="Camera" size={16} style={{ color: selectedSource === cam ? "#ff00aa" : "#6b7fa3" }} />
                        <span style={{ ...rF, fontWeight: 700, fontSize: "14px", color: selectedSource === cam ? "#ff00aa" : "#e2e8f0" }}>{cam}</span>
                        {selectedSource === cam && <Icon name="Check" size={14} style={{ color: "#ff00aa", marginLeft: "auto" }} />}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* STEP 2: Config */}
          {step === "config" && (
            <div className="space-y-4">
              {/* Source badge */}
              <div className="flex items-center gap-2 px-3 py-2 rounded-xl" style={{ background: "rgba(255,0,170,0.08)", border: "1px solid rgba(255,0,170,0.2)" }}>
                <Icon name={sourceType === "game" ? "Gamepad2" : sourceType === "app" ? "AppWindow" : sourceType === "camera" ? "Camera" : "Monitor"} size={14} style={{ color: "#ff00aa" }} />
                <span style={{ ...rF, fontWeight: 700, fontSize: "13px", color: "#ff00aa" }}>Источник: {selectedSourceName || "Весь экран"}</span>
                <button onClick={() => setStep("source")} className="ml-auto text-xs hover:opacity-70 transition-opacity" style={{ color: "#6b7fa3", ...rF, fontWeight: 600 }}>Изменить</button>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Quality */}
                <div>
                  <div style={{ ...rF, fontWeight: 600, fontSize: "11px", color: "#6b7fa3", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "8px" }}>Разрешение</div>
                  <div className="space-y-1.5">
                    {QUALITY_OPTIONS.map(opt => (
                      <button key={opt.v} onClick={() => setQuality(opt.v)} className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl transition-all text-left"
                        style={{ background: quality === opt.v ? "rgba(255,0,170,0.12)" : "rgba(255,255,255,0.04)", border: quality === opt.v ? "1px solid rgba(255,0,170,0.3)" : "1px solid rgba(255,255,255,0.05)" }}>
                        <div>
                          <div style={{ ...rF, fontWeight: 700, fontSize: "14px", color: quality === opt.v ? "#ff00aa" : "#e2e8f0" }}>{opt.label}</div>
                          <div style={{ ...iF, fontSize: "10px", color: "#6b7fa3" }}>{opt.desc}</div>
                        </div>
                        {quality === opt.v && <Icon name="Check" size={13} style={{ color: "#ff00aa" }} />}
                      </button>
                    ))}
                  </div>
                </div>

                {/* FPS */}
                <div>
                  <div style={{ ...rF, fontWeight: 600, fontSize: "11px", color: "#6b7fa3", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "8px" }}>Частота кадров</div>
                  <div className="space-y-1.5">
                    {FPS_OPTIONS.map(opt => (
                      <button key={opt.v} onClick={() => setFps(opt.v)} className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl transition-all text-left"
                        style={{ background: fps === opt.v ? opt.color + "18" : "rgba(255,255,255,0.04)", border: fps === opt.v ? `1px solid ${opt.color}44` : "1px solid rgba(255,255,255,0.05)" }}>
                        <div>
                          <div style={{ ...rF, fontWeight: 700, fontSize: "14px", color: fps === opt.v ? opt.color : "#e2e8f0" }}>{opt.label}</div>
                          <div style={{ ...iF, fontSize: "10px", color: "#6b7fa3" }}>{opt.desc}</div>
                        </div>
                        {fps === opt.v && <Icon name="Check" size={13} style={{ color: opt.color }} />}
                      </button>
                    ))}
                  </div>

                  {/* Codec */}
                  <div style={{ ...rF, fontWeight: 600, fontSize: "11px", color: "#6b7fa3", textTransform: "uppercase", letterSpacing: "1px", margin: "12px 0 6px" }}>Кодек</div>
                  <div className="grid grid-cols-2 gap-1.5">
                    {["H.264", "H.265", "VP9", "AV1"].map(c => (
                      <button key={c} onClick={() => setCodec(c)} className="py-2 rounded-lg transition-all"
                        style={{ background: codec === c ? "rgba(0,255,136,0.12)" : "rgba(255,255,255,0.04)", color: codec === c ? "#00ff88" : "#6b7fa3", border: codec === c ? "1px solid rgba(0,255,136,0.25)" : "1px solid transparent", ...rF, fontWeight: 700, fontSize: "12px" }}>
                        {c}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Options */}
              <div className="p-4 rounded-xl space-y-3" style={{ background: "var(--dark-card)", border: "1px solid rgba(255,255,255,0.05)" }}>
                {[
                  { label: "Звук системы", desc: "Передавать аудио игры/приложения", value: streamAudio, set: () => setStreamAudio(v => !v), color: "#00ff88" },
                  { label: "Микрофон в стриме", desc: "Зрители слышат ваш микрофон", value: streamMic, set: () => setStreamMic(v => !v), color: "#ff00aa" },
                  { label: "Показывать курсор", desc: "Курсор мыши виден в трансляции", value: streamCursor, set: () => setStreamCursor(v => !v), color: "#00aaff" },
                  { label: "Предпросмотр", desc: "Показать превью перед запуском", value: preview, set: () => setPreview(v => !v), color: "#aa00ff" },
                ].map((opt, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <div>
                      <div style={{ ...rF, fontWeight: 600, fontSize: "14px", color: "#e2e8f0" }}>{opt.label}</div>
                      <div style={{ ...iF, fontSize: "11px", color: "#6b7fa3" }}>{opt.desc}</div>
                    </div>
                    <Toggle value={opt.value} onChange={opt.set} color={opt.color} />
                  </div>
                ))}
              </div>

              {/* Estimated stats */}
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: "Разрешение", value: quality },
                  { label: "Частота", value: `${fps} FPS` },
                  { label: "Битрейт", value: `~${estimatedKbps >= 1000 ? `${(estimatedKbps / 1000).toFixed(1)} Mbps` : `${estimatedKbps} kbps`}` },
                ].map((stat, i) => (
                  <div key={i} className="p-3 rounded-xl text-center" style={{ background: "rgba(255,0,170,0.06)", border: "1px solid rgba(255,0,170,0.15)" }}>
                    <div style={{ ...rF, fontWeight: 800, fontSize: "16px", color: "#ff00aa" }}>{stat.value}</div>
                    <div style={{ ...iF, fontSize: "10px", color: "#6b7fa3" }}>{stat.label}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
          <button onClick={() => step === "config" ? setStep("source") : onClose()} className="flex items-center gap-2 px-4 py-2 rounded-xl hover:opacity-70 transition-opacity" style={{ color: "#6b7fa3", ...rF, fontWeight: 700 }}>
            <Icon name="ChevronLeft" size={15} />
            {step === "source" ? "Отмена" : "Назад"}
          </button>

          {step === "source" ? (
            <button onClick={() => setStep("config")} disabled={!sourceType || (sourceType !== "screen" && !selectedSource)}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl transition-all hover:opacity-90 disabled:opacity-40"
              style={{ background: "rgba(255,0,170,0.18)", color: "#ff00aa", border: "1px solid rgba(255,0,170,0.35)", ...rF, fontWeight: 700, fontSize: "14px" }}>
              Далее <Icon name="ChevronRight" size={15} />
            </button>
          ) : (
            <button onClick={handleStart}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl transition-all hover:opacity-90 active:scale-[0.98]"
              style={{ background: "linear-gradient(135deg, rgba(255,0,170,0.3), rgba(255,0,170,0.15))", color: "#ff00aa", border: "1px solid rgba(255,0,170,0.4)", ...rF, fontWeight: 700, fontSize: "14px", boxShadow: "0 0 20px rgba(255,0,170,0.2)" }}>
              <Icon name="Radio" size={15} />
              Начать трансляцию
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
