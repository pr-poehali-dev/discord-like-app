import { useState } from "react";
import Icon from "@/components/ui/icon";

interface UserSettingsProps {
  user: { id: number; username: string; email: string; avatar_color: string; status: string };
  onClose: () => void;
  onLogout: () => void;
}

const USER_SECTIONS = [
  { id: "profile", icon: "User", label: "Мой профиль" },
  { id: "account", icon: "Key", label: "Аккаунт" },
  { id: "privacy", icon: "Eye", label: "Приватность" },
  { id: "audio", icon: "Mic", label: "Аудио и видео" },
  { id: "notifications", icon: "Bell", label: "Уведомления" },
  { id: "appearance", icon: "Palette", label: "Внешний вид" },
  { id: "keybinds", icon: "Keyboard", label: "Горячие клавиши" },
  { id: "accessibility", icon: "Eye", label: "Доступность" },
  { id: "activity", icon: "Activity", label: "Активность" },
  { id: "language", icon: "Globe", label: "Язык" },
  { id: "advanced", icon: "Cpu", label: "Продвинутые" },
];

const COLORS = ["#00ff88", "#ff00aa", "#00aaff", "#aa00ff", "#ff6600", "#ffcc00", "#ff4444", "#00ffff"];
const STATUSES = [
  { value: "online", label: "В сети", color: "#00ff88" },
  { value: "away", label: "Отошёл", color: "#ff6600" },
  { value: "dnd", label: "Не беспокоить", color: "#ff4444" },
  { value: "invisible", label: "Невидимый", color: "#6b7fa3" },
];
const KEYBINDS = [
  { action: "Мут микрофона", key: "M", category: "Голос" },
  { action: "Заглушить наушники", key: "H", category: "Голос" },
  { action: "Push-to-talk", key: "X", category: "Голос" },
  { action: "Начать стриминг", key: "S", category: "Стриминг" },
  { action: "Остановить стриминг", key: "Shift+S", category: "Стриминг" },
  { action: "Поднять руку", key: "R", category: "Голос" },
  { action: "Следующий канал", key: "Tab", category: "Навигация" },
  { action: "Поиск", key: "Ctrl+K", category: "Навигация" },
];

export default function UserSettings({ user, onClose, onLogout }: UserSettingsProps) {
  const [section, setSection] = useState("profile");
  const [username, setUsername] = useState(user.username);
  const [avatarColor, setAvatarColor] = useState(user.avatar_color);
  const [status, setStatus] = useState("online");
  const [customStatus, setCustomStatus] = useState("");
  const [micMuted, setMicMuted] = useState(false);
  const [headphonesMuted, setHeadphonesMuted] = useState(false);
  const [inputVolume, setInputVolume] = useState(80);
  const [outputVolume, setOutputVolume] = useState(100);
  const [noiseSuppression, setNoiseSuppression] = useState(true);
  const [echoCancellation, setEchoCancellation] = useState(true);
  const [autoGain, setAutoGain] = useState(true);
  const [pushToTalk, setPushToTalk] = useState(false);
  const [cameraEnabled, setCameraEnabled] = useState(false);
  const [streamQuality, setStreamQuality] = useState("1080p");
  const [streamFps, setStreamFps] = useState("60");
  const [notifAll, setNotifAll] = useState(true);
  const [notifMention, setNotifMention] = useState(true);
  const [notifSound, setNotifSound] = useState(true);
  const [notifDm, setNotifDm] = useState(true);
  const [darkMode, setDarkMode] = useState(true);
  const [compactMode, setCompactMode] = useState(false);
  const [fontSize, setFontSize] = useState(14);
  const [savedToast, setSavedToast] = useState(false);
  const [bioText, setBioText] = useState("Рейдер и стратег. Всегда готов к бою ⚔️");

  const showSaved = () => { setSavedToast(true); setTimeout(() => setSavedToast(false), 2000); };

  const rF = { fontFamily: "Rajdhani, sans-serif" };
  const iF = { fontFamily: "IBM Plex Sans, sans-serif" };

  const Toggle = ({ value, onChange, color = "#00ff88" }: { value: boolean; onChange: () => void; color?: string }) => (
    <button onClick={onChange} className="w-10 h-5 rounded-full transition-all relative shrink-0" style={{ background: value ? color : "rgba(255,255,255,0.1)" }}>
      <div className="absolute w-3.5 h-3.5 rounded-full top-0.5 transition-all" style={{ background: "#fff", left: value ? "21px" : "3px" }} />
    </button>
  );

  const Slider = ({ value, onChange, min = 0, max = 100 }: { value: number; onChange: (v: number) => void; min?: number; max?: number }) => (
    <div className="flex items-center gap-3">
      <input type="range" min={min} max={max} value={value} onChange={e => onChange(Number(e.target.value))}
        className="flex-1 h-1.5 rounded-full appearance-none cursor-pointer"
        style={{ accentColor: "#00ff88", background: `linear-gradient(to right, #00ff88 ${((value - min) / (max - min)) * 100}%, rgba(255,255,255,0.1) 0%)` }} />
      <span style={{ ...rF, fontWeight: 700, fontSize: "13px", color: "#00ff88", minWidth: "36px", textAlign: "right" }}>{value}%</span>
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 flex animate-fade-in" style={{ background: "rgba(0,0,0,0.75)" }}>
      <div className="flex w-full max-w-4xl mx-auto my-6 rounded-2xl overflow-hidden" style={{ background: "var(--dark-bg)", border: "1px solid rgba(0,255,136,0.15)" }}>

        {/* Sidebar */}
        <div className="w-52 shrink-0 flex flex-col py-4" style={{ background: "#060a11", borderRight: "1px solid rgba(0,255,136,0.08)" }}>
          <div className="px-4 mb-3">
            <div style={{ ...rF, fontWeight: 700, fontSize: "11px", color: "#6b7fa3", textTransform: "uppercase", letterSpacing: "1px" }}>Настройки</div>
            <div style={{ ...rF, fontWeight: 700, fontSize: "14px", color: user.avatar_color, marginTop: "4px" }}>{user.username}</div>
          </div>
          <div className="flex-1 overflow-y-auto px-2">
            {USER_SECTIONS.map(s => (
              <button key={s.id} onClick={() => setSection(s.id)}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-lg mb-0.5 transition-all text-left"
                style={{ background: section === s.id ? "rgba(0,255,136,0.12)" : "transparent", color: section === s.id ? "#00ff88" : "#6b7fa3", boxShadow: section === s.id ? "inset 3px 0 0 #00ff88" : "none" }}>
                <Icon name={s.icon} size={14} />
                <span style={{ ...rF, fontWeight: 600, fontSize: "13px" }}>{s.label}</span>
              </button>
            ))}
            <div className="h-px mx-2 my-2" style={{ background: "rgba(255,255,255,0.06)" }} />
            <button onClick={onLogout} className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-left hover:opacity-70 transition-opacity" style={{ color: "#ff4444" }}>
              <Icon name="LogOut" size={14} />
              <span style={{ ...rF, fontWeight: 600, fontSize: "13px" }}>Выйти</span>
            </button>
          </div>
          <div className="px-2 mt-2">
            <button onClick={onClose} className="w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:opacity-70 transition-opacity" style={{ color: "#6b7fa3" }}>
              <Icon name="X" size={14} />
              <span style={{ ...rF, fontWeight: 600, fontSize: "13px" }}>Закрыть [ESC]</span>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6" style={{ background: "var(--dark-panel)" }}>
          {savedToast && (
            <div className="fixed bottom-6 right-6 flex items-center gap-2 px-4 py-2.5 rounded-xl animate-fade-in z-50" style={{ background: "rgba(0,255,136,0.15)", border: "1px solid rgba(0,255,136,0.3)", color: "#00ff88", ...rF, fontWeight: 700 }}>
              <Icon name="Check" size={16} /> Сохранено
            </div>
          )}

          {/* PROFILE */}
          {section === "profile" && (
            <div className="space-y-5">
              <div>
                <h2 style={{ ...rF, fontWeight: 700, fontSize: "20px", color: "#e2e8f0" }}>Мой профиль</h2>
                <p style={{ ...iF, fontSize: "13px", color: "#6b7fa3", marginTop: "4px" }}>Как тебя видят другие</p>
              </div>

              {/* Avatar preview */}
              <div className="p-5 rounded-2xl" style={{ background: "var(--dark-card)", border: "1px solid rgba(0,255,136,0.1)" }}>
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-16 h-16 rounded-full flex items-center justify-center" style={{ background: avatarColor + "33", border: `2px solid ${avatarColor}66`, color: avatarColor, ...rF, fontWeight: 900, fontSize: "20px" }}>
                    {username.slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <div style={{ ...rF, fontWeight: 700, fontSize: "20px", color: avatarColor }}>{username}</div>
                    <div className="flex items-center gap-1.5 mt-1">
                      <div className="w-2 h-2 rounded-full" style={{ background: STATUSES.find(s => s.value === status)?.color }} />
                      <span style={{ ...rF, fontSize: "13px", color: "#6b7fa3" }}>{STATUSES.find(s => s.value === status)?.label}</span>
                    </div>
                  </div>
                </div>
                {/* Avatar color */}
                <div style={{ ...rF, fontWeight: 600, fontSize: "11px", color: "#6b7fa3", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "8px" }}>Цвет аватара</div>
                <div className="flex gap-2">
                  {COLORS.map(c => (
                    <button key={c} onClick={() => setAvatarColor(c)} className="w-7 h-7 rounded-full transition-all hover:scale-110" style={{ background: c, border: avatarColor === c ? "2px solid white" : "2px solid transparent", boxShadow: avatarColor === c ? `0 0 8px ${c}` : "none" }} />
                  ))}
                </div>
              </div>

              {/* Username */}
              <div className="p-4 rounded-xl" style={{ background: "var(--dark-card)", border: "1px solid rgba(255,255,255,0.05)" }}>
                <label style={{ ...rF, fontWeight: 600, fontSize: "11px", color: "#6b7fa3", textTransform: "uppercase", letterSpacing: "1px", display: "block", marginBottom: "6px" }}>Имя пользователя</label>
                <input className="w-full px-3 py-2 rounded-xl outline-none text-sm" style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(0,255,136,0.2)", color: "#e2e8f0", ...iF }}
                  value={username} onChange={e => setUsername(e.target.value)} />
              </div>

              {/* Custom status */}
              <div className="p-4 rounded-xl" style={{ background: "var(--dark-card)", border: "1px solid rgba(255,255,255,0.05)" }}>
                <label style={{ ...rF, fontWeight: 600, fontSize: "11px", color: "#6b7fa3", textTransform: "uppercase", letterSpacing: "1px", display: "block", marginBottom: "6px" }}>Кастомный статус</label>
                <input className="w-full px-3 py-2 rounded-xl outline-none text-sm" style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(0,170,255,0.2)", color: "#e2e8f0", ...iF }}
                  placeholder="Сейчас играю в..."
                  value={customStatus} onChange={e => setCustomStatus(e.target.value)} />
                <div style={{ ...rF, fontSize: "11px", color: "#6b7fa3", marginTop: "6px" }}>Статус доступности:</div>
                <div className="flex gap-2 mt-2">
                  {STATUSES.map(s => (
                    <button key={s.value} onClick={() => setStatus(s.value)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition-all"
                      style={{ background: status === s.value ? s.color + "22" : "rgba(255,255,255,0.04)", border: status === s.value ? `1px solid ${s.color}44` : "1px solid transparent", color: status === s.value ? s.color : "#6b7fa3" }}>
                      <div className="w-2 h-2 rounded-full" style={{ background: s.color }} />
                      <span style={{ ...rF, fontWeight: 600, fontSize: "12px" }}>{s.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Bio */}
              <div className="p-4 rounded-xl" style={{ background: "var(--dark-card)", border: "1px solid rgba(255,255,255,0.05)" }}>
                <label style={{ ...rF, fontWeight: 600, fontSize: "11px", color: "#6b7fa3", textTransform: "uppercase", letterSpacing: "1px", display: "block", marginBottom: "6px" }}>О себе</label>
                <textarea className="w-full px-3 py-2 rounded-xl outline-none text-sm resize-none" rows={3} style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(0,255,136,0.15)", color: "#e2e8f0", ...iF }}
                  value={bioText} onChange={e => setBioText(e.target.value)} />
                <div style={{ ...iF, fontSize: "11px", color: "#4a5568", marginTop: "4px" }}>{bioText.length}/190</div>
              </div>

              <button onClick={showSaved} className="px-6 py-2.5 rounded-xl transition-all hover:opacity-90" style={{ background: "rgba(0,255,136,0.15)", color: "#00ff88", border: "1px solid rgba(0,255,136,0.3)", ...rF, fontWeight: 700, fontSize: "14px" }}>
                Сохранить профиль
              </button>
            </div>
          )}

          {/* AUDIO & VIDEO */}
          {section === "audio" && (
            <div className="space-y-5">
              <div>
                <h2 style={{ ...rF, fontWeight: 700, fontSize: "20px", color: "#e2e8f0" }}>Аудио и видео</h2>
                <p style={{ ...iF, fontSize: "13px", color: "#6b7fa3", marginTop: "4px" }}>Настройки микрофона, наушников и камеры</p>
              </div>

              {/* Quick controls */}
              <div className="grid grid-cols-2 gap-3">
                <button onClick={() => setMicMuted(v => !v)} className="flex items-center gap-3 p-4 rounded-xl transition-all hover:opacity-90"
                  style={{ background: micMuted ? "rgba(255,0,0,0.12)" : "rgba(0,255,136,0.08)", border: `1px solid ${micMuted ? "#ff444444" : "rgba(0,255,136,0.2)"}` }}>
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: micMuted ? "rgba(255,0,0,0.15)" : "rgba(0,255,136,0.12)" }}>
                    <Icon name={micMuted ? "MicOff" : "Mic"} size={20} style={{ color: micMuted ? "#ff4444" : "#00ff88" }} />
                  </div>
                  <div>
                    <div style={{ ...rF, fontWeight: 700, fontSize: "15px", color: micMuted ? "#ff4444" : "#00ff88" }}>{micMuted ? "Микрофон выключен" : "Микрофон включён"}</div>
                    <div style={{ ...iF, fontSize: "11px", color: "#6b7fa3" }}>Нажми для {micMuted ? "включения" : "выключения"}</div>
                  </div>
                </button>
                <button onClick={() => setHeadphonesMuted(v => !v)} className="flex items-center gap-3 p-4 rounded-xl transition-all hover:opacity-90"
                  style={{ background: headphonesMuted ? "rgba(255,0,0,0.12)" : "rgba(0,170,255,0.08)", border: `1px solid ${headphonesMuted ? "#ff444444" : "rgba(0,170,255,0.2)"}` }}>
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: headphonesMuted ? "rgba(255,0,0,0.15)" : "rgba(0,170,255,0.12)" }}>
                    <Icon name={headphonesMuted ? "VolumeX" : "Headphones"} size={20} style={{ color: headphonesMuted ? "#ff4444" : "#00aaff" }} />
                  </div>
                  <div>
                    <div style={{ ...rF, fontWeight: 700, fontSize: "15px", color: headphonesMuted ? "#ff4444" : "#00aaff" }}>{headphonesMuted ? "Звук выключен" : "Звук включён"}</div>
                    <div style={{ ...iF, fontSize: "11px", color: "#6b7fa3" }}>Нажми для {headphonesMuted ? "включения" : "выключения"}</div>
                  </div>
                </button>
              </div>

              {/* Volume sliders */}
              <div className="p-5 rounded-2xl space-y-5" style={{ background: "var(--dark-card)", border: "1px solid rgba(255,255,255,0.06)" }}>
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2"><Icon name="Mic" size={14} style={{ color: "#00ff88" }} /><span style={{ ...rF, fontWeight: 600, fontSize: "13px", color: "#e2e8f0" }}>Громкость входа (микрофон)</span></div>
                  </div>
                  <Slider value={inputVolume} onChange={setInputVolume} />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2"><Icon name="Volume2" size={14} style={{ color: "#00aaff" }} /><span style={{ ...rF, fontWeight: 600, fontSize: "13px", color: "#e2e8f0" }}>Громкость выхода (наушники)</span></div>
                  </div>
                  <Slider value={outputVolume} onChange={setOutputVolume} />
                </div>
              </div>

              {/* Audio processing */}
              <div className="p-5 rounded-2xl space-y-3" style={{ background: "var(--dark-card)", border: "1px solid rgba(255,255,255,0.06)" }}>
                <div style={{ ...rF, fontWeight: 600, fontSize: "13px", color: "#6b7fa3", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "4px" }}>Обработка звука</div>
                {[
                  { label: "Подавление шума", desc: "Убирает фоновые звуки", value: noiseSuppression, set: setNoiseSuppression },
                  { label: "Эхоподавление", desc: "Устраняет эхо от динамиков", value: echoCancellation, set: setEchoCancellation },
                  { label: "Автоусиление", desc: "Автоматически подстраивает уровень", value: autoGain, set: setAutoGain },
                  { label: "Push-to-talk", desc: "Микрофон работает только при нажатии X", value: pushToTalk, set: setPushToTalk },
                ].map((item, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <div>
                      <div style={{ ...rF, fontWeight: 600, fontSize: "14px", color: "#e2e8f0" }}>{item.label}</div>
                      <div style={{ ...iF, fontSize: "11px", color: "#6b7fa3" }}>{item.desc}</div>
                    </div>
                    <Toggle value={item.value} onChange={() => item.set(v => !v)} />
                  </div>
                ))}
              </div>

              {/* Camera + Streaming quality */}
              <div className="p-5 rounded-2xl space-y-4" style={{ background: "var(--dark-card)", border: "1px solid rgba(255,255,255,0.06)" }}>
                <div style={{ ...rF, fontWeight: 600, fontSize: "13px", color: "#6b7fa3", textTransform: "uppercase", letterSpacing: "1px" }}>Видео и стриминг</div>
                <div className="flex items-center justify-between">
                  <div><div style={{ ...rF, fontWeight: 600, fontSize: "14px", color: "#e2e8f0" }}>Камера включена</div>
                    <div style={{ ...iF, fontSize: "11px", color: "#6b7fa3" }}>Веб-камера в голосовых каналах</div></div>
                  <Toggle value={cameraEnabled} onChange={() => setCameraEnabled(v => !v)} color="#aa00ff" />
                </div>
                <div>
                  <div style={{ ...rF, fontWeight: 600, fontSize: "13px", color: "#e2e8f0", marginBottom: "8px" }}>Качество стриминга</div>
                  <div className="grid grid-cols-4 gap-2">
                    {["480p", "720p", "1080p", "1440p"].map(q => (
                      <button key={q} onClick={() => setStreamQuality(q)} className="py-2 rounded-lg transition-all"
                        style={{ background: streamQuality === q ? "rgba(255,0,170,0.15)" : "rgba(255,255,255,0.04)", color: streamQuality === q ? "#ff00aa" : "#6b7fa3", border: streamQuality === q ? "1px solid rgba(255,0,170,0.3)" : "1px solid transparent", ...rF, fontWeight: 700, fontSize: "13px" }}>
                        {q}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <div style={{ ...rF, fontWeight: 600, fontSize: "13px", color: "#e2e8f0", marginBottom: "8px" }}>Частота кадров (FPS)</div>
                  <div className="flex gap-2">
                    {["15", "30", "60"].map(fps => (
                      <button key={fps} onClick={() => setStreamFps(fps)} className="px-5 py-2 rounded-lg transition-all"
                        style={{ background: streamFps === fps ? "rgba(0,255,136,0.15)" : "rgba(255,255,255,0.04)", color: streamFps === fps ? "#00ff88" : "#6b7fa3", border: streamFps === fps ? "1px solid rgba(0,255,136,0.3)" : "1px solid transparent", ...rF, fontWeight: 700, fontSize: "14px" }}>
                        {fps} FPS
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* NOTIFICATIONS */}
          {section === "notifications" && (
            <div className="space-y-5">
              <div>
                <h2 style={{ ...rF, fontWeight: 700, fontSize: "20px", color: "#e2e8f0" }}>Уведомления</h2>
                <p style={{ ...iF, fontSize: "13px", color: "#6b7fa3", marginTop: "4px" }}>Управление оповещениями</p>
              </div>
              <div className="p-5 rounded-2xl space-y-4" style={{ background: "var(--dark-card)", border: "1px solid rgba(255,255,255,0.06)" }}>
                {[
                  { label: "Все уведомления", desc: "Уведомлять о каждом новом сообщении", value: notifAll, set: setNotifAll },
                  { label: "Упоминания", desc: "Только когда меня упомянули (@)", value: notifMention, set: setNotifMention },
                  { label: "Звук уведомлений", desc: "Воспроизводить звук при сообщениях", value: notifSound, set: setNotifSound },
                  { label: "Личные сообщения", desc: "Уведомлять при получении ЛС", value: notifDm, set: setNotifDm },
                ].map((item, i) => (
                  <div key={i} className="flex items-center justify-between py-1">
                    <div>
                      <div style={{ ...rF, fontWeight: 600, fontSize: "14px", color: "#e2e8f0" }}>{item.label}</div>
                      <div style={{ ...iF, fontSize: "11px", color: "#6b7fa3" }}>{item.desc}</div>
                    </div>
                    <Toggle value={item.value} onChange={() => item.set(v => !v)} />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* APPEARANCE */}
          {section === "appearance" && (
            <div className="space-y-5">
              <div>
                <h2 style={{ ...rF, fontWeight: 700, fontSize: "20px", color: "#e2e8f0" }}>Внешний вид</h2>
                <p style={{ ...iF, fontSize: "13px", color: "#6b7fa3", marginTop: "4px" }}>Тема, шрифты, масштаб интерфейса</p>
              </div>
              <div className="p-5 rounded-2xl space-y-5" style={{ background: "var(--dark-card)", border: "1px solid rgba(255,255,255,0.06)" }}>
                <div className="flex items-center justify-between">
                  <div><div style={{ ...rF, fontWeight: 600, fontSize: "14px", color: "#e2e8f0" }}>Тёмная тема</div>
                    <div style={{ ...iF, fontSize: "11px", color: "#6b7fa3" }}>Основная тема интерфейса</div></div>
                  <Toggle value={darkMode} onChange={() => setDarkMode(v => !v)} />
                </div>
                <div className="flex items-center justify-between">
                  <div><div style={{ ...rF, fontWeight: 600, fontSize: "14px", color: "#e2e8f0" }}>Компактный режим</div>
                    <div style={{ ...iF, fontSize: "11px", color: "#6b7fa3" }}>Уменьшает отступы и размер сообщений</div></div>
                  <Toggle value={compactMode} onChange={() => setCompactMode(v => !v)} color="#ff00aa" />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span style={{ ...rF, fontWeight: 600, fontSize: "14px", color: "#e2e8f0" }}>Размер шрифта — {fontSize}px</span>
                  </div>
                  <Slider value={fontSize} onChange={setFontSize} min={10} max={20} />
                  <div style={{ ...iF, fontSize: `${fontSize}px`, color: "#8899bb", marginTop: "8px", padding: "10px", background: "rgba(255,255,255,0.03)", borderRadius: "8px" }}>
                    Пример текста сообщения с выбранным размером шрифта
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* KEYBINDS */}
          {section === "keybinds" && (
            <div className="space-y-4">
              <div>
                <h2 style={{ ...rF, fontWeight: 700, fontSize: "20px", color: "#e2e8f0" }}>Горячие клавиши</h2>
                <p style={{ ...iF, fontSize: "13px", color: "#6b7fa3", marginTop: "4px" }}>Настройка кнопок быстрого доступа</p>
              </div>
              <div className="space-y-2">
                {["Голос", "Стриминг", "Навигация"].map(cat => (
                  <div key={cat} className="mb-4">
                    <div style={{ ...rF, fontWeight: 600, fontSize: "11px", color: "#6b7fa3", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "8px" }}>{cat}</div>
                    {KEYBINDS.filter(k => k.category === cat).map((kb, i) => (
                      <div key={i} className="flex items-center justify-between px-4 py-3 rounded-xl mb-1" style={{ background: "var(--dark-card)", border: "1px solid rgba(255,255,255,0.04)" }}>
                        <span style={{ ...rF, fontWeight: 600, fontSize: "14px", color: "#c8d6e8" }}>{kb.action}</span>
                        <div className="flex items-center gap-2">
                          <kbd className="px-3 py-1 rounded-lg" style={{ ...rF, fontWeight: 700, fontSize: "12px", background: "rgba(0,255,136,0.1)", color: "#00ff88", border: "1px solid rgba(0,255,136,0.2)", letterSpacing: "1px" }}>
                            {kb.key}
                          </kbd>
                          <button className="w-7 h-7 rounded-lg flex items-center justify-center hover:opacity-70 transition-opacity" style={{ background: "rgba(255,255,255,0.05)" }}>
                            <Icon name="Pencil" size={12} style={{ color: "#6b7fa3" }} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ACCOUNT */}
          {section === "account" && (
            <div className="space-y-5">
              <div>
                <h2 style={{ ...rF, fontWeight: 700, fontSize: "20px", color: "#e2e8f0" }}>Аккаунт</h2>
              </div>
              <div className="p-4 rounded-xl space-y-3" style={{ background: "var(--dark-card)", border: "1px solid rgba(255,255,255,0.06)" }}>
                {[
                  { label: "Email", value: user.email, icon: "Mail" },
                  { label: "ID пользователя", value: `#${String(user.id).padStart(6, "0")}`, icon: "Hash" },
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-3 p-3 rounded-xl" style={{ background: "rgba(255,255,255,0.03)" }}>
                    <Icon name={item.icon} size={15} style={{ color: "#6b7fa3" }} />
                    <div className="flex-1">
                      <div style={{ ...rF, fontSize: "10px", color: "#4a5568", textTransform: "uppercase" }}>{item.label}</div>
                      <div style={{ ...iF, fontSize: "14px", color: "#e2e8f0" }}>{item.value}</div>
                    </div>
                    <button style={{ background: "rgba(0,255,136,0.08)", color: "#00ff88", border: "1px solid rgba(0,255,136,0.2)", padding: "4px 10px", borderRadius: "8px", ...rF, fontWeight: 600, fontSize: "12px" }}>
                      Изменить
                    </button>
                  </div>
                ))}
              </div>
              <div className="p-4 rounded-xl" style={{ background: "rgba(255,0,0,0.05)", border: "1px solid rgba(255,0,0,0.15)" }}>
                <div style={{ ...rF, fontWeight: 700, fontSize: "13px", color: "#ff4444", marginBottom: "10px" }}>Опасная зона</div>
                <button style={{ background: "rgba(255,0,0,0.1)", color: "#ff4444", border: "1px solid rgba(255,0,0,0.25)", padding: "8px 16px", borderRadius: "8px", ...rF, fontWeight: 700, fontSize: "13px" }}>
                  Удалить аккаунт
                </button>
              </div>
            </div>
          )}

          {/* OTHER */}
          {!["profile", "audio", "notifications", "appearance", "keybinds", "account"].includes(section) && (
            <div className="flex flex-col items-center justify-center h-64 gap-3">
              <Icon name="Settings" size={40} style={{ color: "#2a3a5c" }} />
              <div style={{ ...rF, fontWeight: 700, fontSize: "18px", color: "#4a5568" }}>
                {USER_SECTIONS.find(s => s.id === section)?.label}
              </div>
              <div style={{ ...iF, fontSize: "13px", color: "#374151" }}>Раздел в разработке</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
