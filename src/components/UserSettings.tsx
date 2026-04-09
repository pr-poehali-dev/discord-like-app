import { useState, useRef } from "react";
import Icon from "@/components/ui/icon";
import UserAvatar from "@/components/UserAvatar";

interface UserSettingsProps {
  user: { id: number; username: string; email: string; avatar_color: string; status: string };
  avatarImg?: string | null;
  onAvatarChange?: (img: string | null, color?: string) => void;
  onClose: () => void;
  onLogout: () => void;
}

const USER_SECTIONS = [
  { id: "profile", icon: "User", label: "Мой профиль" },
  { id: "server_profile", icon: "Users", label: "Профиль на сервере" },
  { id: "account", icon: "Key", label: "Аккаунт" },
  { id: "privacy", icon: "Eye", label: "Приватность" },
  { id: "audio", icon: "Mic", label: "Голос и аудио" },
  { id: "video", icon: "Video", label: "Видео" },
  { id: "streaming", icon: "MonitorPlay", label: "Стриминг" },
  { id: "notifications", icon: "Bell", label: "Уведомления" },
  { id: "appearance", icon: "Palette", label: "Внешний вид" },
  { id: "keybinds", icon: "Keyboard", label: "Горячие клавиши" },
  { id: "language", icon: "Globe", label: "Язык" },
  { id: "accessibility", icon: "Accessibility", label: "Доступность" },
  { id: "advanced", icon: "Cpu", label: "Продвинутые" },
];

const AVATAR_COLORS = ["#00ff88", "#ff00aa", "#00aaff", "#aa00ff", "#ff6600", "#ffcc00", "#ff4444", "#00ffff", "#ff6699", "#66ff99"];

const STATUSES = [
  { value: "online", label: "В сети", color: "#00ff88", icon: "Circle" },
  { value: "away", label: "Отошёл", color: "#ff6600", icon: "Clock" },
  { value: "dnd", label: "Не беспокоить", color: "#ff4444", icon: "MinusCircle" },
  { value: "invisible", label: "Невидимый", color: "#6b7fa3", icon: "EyeOff" },
];

const LANGUAGES = [
  { code: "ru", label: "Русский", flag: "🇷🇺", native: "Русский" },
  { code: "en", label: "English", flag: "🇺🇸", native: "English" },
  { code: "de", label: "Deutsch", flag: "🇩🇪", native: "Deutsch" },
  { code: "fr", label: "Français", flag: "🇫🇷", native: "Français" },
  { code: "es", label: "Español", flag: "🇪🇸", native: "Español" },
  { code: "pt", label: "Português", flag: "🇧🇷", native: "Português" },
  { code: "zh", label: "中文", flag: "🇨🇳", native: "中文 (简体)" },
  { code: "ja", label: "日本語", flag: "🇯🇵", native: "日本語" },
  { code: "ko", label: "한국어", flag: "🇰🇷", native: "한국어" },
  { code: "tr", label: "Türkçe", flag: "🇹🇷", native: "Türkçe" },
];

const FONTS = [
  { id: "ibm", label: "IBM Plex Sans", family: "IBM Plex Sans, sans-serif", preview: "Сообщение в чате" },
  { id: "rajdhani", label: "Rajdhani", family: "Rajdhani, sans-serif", preview: "Сообщение в чате" },
  { id: "orbitron", label: "Orbitron", family: "Orbitron, sans-serif", preview: "Сообщение в чате" },
  { id: "inter", label: "Inter", family: "Inter, sans-serif", preview: "Сообщение в чате" },
  { id: "mono", label: "Monospace", family: "monospace", preview: "Сообщение в чате" },
];

const COLOR_THEMES = [
  { id: "nexus", label: "Nexus", primary: "#00ff88", secondary: "#00aaff", accent: "#ff00aa" },
  { id: "fire", label: "Fire", primary: "#ff4500", secondary: "#ff6600", accent: "#ffcc00" },
  { id: "purple", label: "Violet", primary: "#aa00ff", secondary: "#ff00aa", accent: "#00aaff" },
  { id: "ice", label: "Ice", primary: "#00cfff", secondary: "#0080ff", accent: "#00ffdd" },
  { id: "gold", label: "Gold", primary: "#ffcc00", secondary: "#ff8800", accent: "#ffe066" },
  { id: "cherry", label: "Cherry", primary: "#ff1a4b", secondary: "#ff6699", accent: "#ff44aa" },
];

const GAME_EMOJI = [
  { cat: "Реакции", items: ["⚔️","🛡️","🎯","💀","🔥","⚡","🌟","💥","🎮","👾","🏆","🎲","🃏","🧨","💣","🔮","🐉","👑","⚙️","🚀"] },
  { cat: "Статусы", items: ["😈","😤","🤬","😎","🥷","🤖","👻","💪","🫡","🫠","🥶","🔥","💯","✅","❌","⚠️","🚫","🎖️","🏅","🌀"] },
  { cat: "Игровые", items: ["🗡️","🏹","🪄","🪖","🎁","💊","🧪","🪙","💎","🧬","🛸","🪐","🌌","🌪️","🌊","🌈","☄️","🪝","🔑","🗝️"] },
  { cat: "Команды", items: ["🤝","👊","✊","🤜","🤛","🙌","👏","💬","📣","📢","🔔","📍","📌","🏷️","🎗️","🎪","🏴","🚩","⚑","🎌"] },
];

const KEYBINDS = [
  { action: "Мут микрофона", key: "M", category: "Голос" },
  { action: "Заглушить наушники", key: "H", category: "Голос" },
  { action: "Push-to-talk", key: "X", category: "Голос" },
  { action: "Поднять руку", key: "R", category: "Голос" },
  { action: "Начать стриминг", key: "S", category: "Стриминг" },
  { action: "Остановить стриминг", key: "Shift+S", category: "Стриминг" },
  { action: "Пауза/Продолжить стрим", key: "P", category: "Стриминг" },
  { action: "Следующий канал", key: "Tab", category: "Навигация" },
  { action: "Поиск", key: "Ctrl+K", category: "Навигация" },
  { action: "Настройки", key: "Ctrl+,", category: "Навигация" },
  { action: "Закрыть / ESC", key: "Esc", category: "Навигация" },
];

const AUDIO_DEVICES_IN = ["Микрофон (встроенный)", "USB Headset Mic", "Blue Yeti", "AirPods Pro"];
const AUDIO_DEVICES_OUT = ["Динамики (встроенные)", "USB Headphones", "Sony WH-1000XM5", "AirPods Pro"];

export default function UserSettings({ user, avatarImg: avatarImgProp, onAvatarChange, onClose, onLogout }: UserSettingsProps) {
  const [section, setSection] = useState("profile");
  const rF = { fontFamily: "Rajdhani, sans-serif" };
  const iF = { fontFamily: "IBM Plex Sans, sans-serif" };

  // Profile
  const [username, setUsername] = useState(user.username);
  const [avatarColor, setAvatarColor] = useState(user.avatar_color);
  const [avatarImg, setAvatarImg] = useState<string | null>(avatarImgProp ?? null);
  const [bannerImg, setBannerImg] = useState<string | null>(localStorage.getItem("bannerImg"));
  const [bannerColor, setBannerColor] = useState("#0d1424");
  const [userStatus, setUserStatus] = useState("online");
  const [customStatus, setCustomStatus] = useState("");
  const [bioText, setBioText] = useState("Рейдер и стратег. Всегда готов к бою ⚔️");
  const [serverNick, setServerNick] = useState(user.username);
  const [serverBio, setServerBio] = useState("");

  // Audio
  const [micMuted, setMicMuted] = useState(false);
  const [headphonesMuted, setHeadphonesMuted] = useState(false);
  const [inputVolume, setInputVolume] = useState(80);
  const [outputVolume, setOutputVolume] = useState(100);
  const [appVolume, setAppVolume] = useState(100);
  const [inputDevice, setInputDevice] = useState(AUDIO_DEVICES_IN[0]);
  const [outputDevice, setOutputDevice] = useState(AUDIO_DEVICES_OUT[0]);
  const [noiseSuppression, setNoiseSuppression] = useState(true);
  const [echoCancellation, setEchoCancellation] = useState(true);
  const [autoGain, setAutoGain] = useState(true);
  const [pushToTalk, setPushToTalk] = useState(false);
  const [voiceActivity, setVoiceActivity] = useState(true);
  const [sensitivityAuto, setSensitivityAuto] = useState(true);
  const [sensitivity, setSensitivity] = useState(50);
  const [spatialAudio, setSpatialAudio] = useState(false);
  const [subwoofer, setSubwoofer] = useState(false);
  const [noiseSuppLevel, setNoiseSuppLevel] = useState("high");
  const [inputTest, setInputTest] = useState(false);

  // Video
  const [cameraEnabled, setCameraEnabled] = useState(false);
  const [cameraDevice, setCameraDevice] = useState("Встроенная камера");
  const [cameraMirror, setCameraMirror] = useState(false);
  const [cameraBackground, setCameraBackground] = useState("none");
  const [cameraQuality, setCameraQuality] = useState("720p");

  // Streaming
  const [streamQuality, setStreamQuality] = useState("1080p");
  const [streamFps, setStreamFps] = useState("60");
  const [streamBitrate, setStreamBitrate] = useState("6000");
  const [streamCodec, setStreamCodec] = useState("H.264");
  const [streamAudio, setStreamAudio] = useState(true);
  const [streamCursor, setStreamCursor] = useState(true);
  const [streamPreview, setStreamPreview] = useState(true);
  const [streamHotkey, setStreamHotkey] = useState(true);
  const [streamCaptureMouse, setStreamCaptureMouse] = useState(true);

  // Notifications
  const [notifAll, setNotifAll] = useState(true);
  const [notifMention, setNotifMention] = useState(true);
  const [notifSound, setNotifSound] = useState(true);
  const [notifDm, setNotifDm] = useState(true);
  const [notifServer, setNotifServer] = useState(true);
  const [notifDesktop, setNotifDesktop] = useState(true);

  // Appearance
  const [darkMode] = useState(true);
  const [compactMode, setCompactMode] = useState(false);
  const [fontSize, setFontSize] = useState(14);
  const [chatFont, setChatFont] = useState("ibm");
  const [colorTheme, setColorTheme] = useState("nexus");
  const [showAnimations, setShowAnimations] = useState(true);
  const [showAvatars, setShowAvatars] = useState(true);
  const [messageGrouping, setMessageGrouping] = useState(true);

  // Language
  const [language, setLanguage] = useState("ru");

  // Misc
  const [savedToast, setSavedToast] = useState(false);
  const [activeEmojiCat, setActiveEmojiCat] = useState("Реакции");
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);

  const showSaved = () => { setSavedToast(true); setTimeout(() => setSavedToast(false), 2500); };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, type: "avatar" | "banner") => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const result = ev.target?.result as string;
      if (type === "avatar") {
        setAvatarImg(result);
        onAvatarChange?.(result, avatarColor);
      } else {
        setBannerImg(result);
        localStorage.setItem("bannerImg", result);
      }
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const removeAvatar = () => {
    setAvatarImg(null);
    onAvatarChange?.(null, avatarColor);
  };

  const handleColorChange = (c: string) => {
    setAvatarColor(c);
    onAvatarChange?.(avatarImg, c);
  };

  const Toggle = ({ value, onChange, color = "#00ff88" }: { value: boolean; onChange: () => void; color?: string }) => (
    <button onClick={onChange} className="w-10 h-5 rounded-full transition-all relative shrink-0"
      style={{ background: value ? color : "rgba(255,255,255,0.1)" }}>
      <div className="absolute w-3.5 h-3.5 rounded-full top-0.5 transition-all"
        style={{ background: "#fff", left: value ? "21px" : "3px" }} />
    </button>
  );

  const Slider = ({ value, onChange, min = 0, max = 100, color = "#00ff88" }: { value: number; onChange: (v: number) => void; min?: number; max?: number; color?: string }) => (
    <div className="flex items-center gap-3">
      <input type="range" min={min} max={max} value={value} onChange={e => onChange(Number(e.target.value))}
        className="flex-1 h-1.5 rounded-full appearance-none cursor-pointer"
        style={{ accentColor: color }} />
      <span style={{ ...rF, fontWeight: 700, fontSize: "13px", color, minWidth: "36px", textAlign: "right" }}>{value}</span>
    </div>
  );

  const SectionLabel = ({ children }: { children: React.ReactNode }) => (
    <div style={{ ...rF, fontWeight: 600, fontSize: "11px", color: "#6b7fa3", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "10px" }}>{children}</div>
  );

  const Card = ({ children, color = "rgba(255,255,255,0.05)" }: { children: React.ReactNode; color?: string }) => (
    <div className="p-5 rounded-2xl" style={{ background: "var(--dark-card)", border: `1px solid ${color}` }}>{children}</div>
  );

  const SettingRow = ({ label, desc, children }: { label: string; desc?: string; children: React.ReactNode }) => (
    <div className="flex items-center justify-between py-2">
      <div>
        <div style={{ ...rF, fontWeight: 600, fontSize: "14px", color: "#e2e8f0" }}>{label}</div>
        {desc && <div style={{ ...iF, fontSize: "11px", color: "#6b7fa3" }}>{desc}</div>}
      </div>
      {children}
    </div>
  );

  const currentFont = FONTS.find(f => f.id === chatFont)?.family || "IBM Plex Sans, sans-serif";
  const currentTheme = COLOR_THEMES.find(t => t.id === colorTheme) || COLOR_THEMES[0];

  return (
    <div className="fixed inset-0 z-50 flex animate-fade-in" style={{ background: "rgba(0,0,0,0.8)" }}>
      <div className="flex w-full max-w-5xl mx-auto my-4 rounded-2xl overflow-hidden shadow-2xl" style={{ background: "var(--dark-bg)", border: "1px solid rgba(0,255,136,0.15)" }}>

        {/* Sidebar */}
        <div className="w-56 shrink-0 flex flex-col py-4 overflow-y-auto" style={{ background: "#060a11", borderRight: "1px solid rgba(0,255,136,0.08)" }}>
          <div className="px-4 mb-3">
            <div style={{ ...rF, fontWeight: 700, fontSize: "10px", color: "#4a5568", textTransform: "uppercase", letterSpacing: "1px" }}>Настройки</div>
            <div style={{ ...rF, fontWeight: 800, fontSize: "15px", color: user.avatar_color, marginTop: "2px" }}>{user.username}</div>
          </div>
          <div className="flex-1 px-2">
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
            <div className="fixed bottom-6 right-6 flex items-center gap-2 px-4 py-2.5 rounded-xl z-50 animate-fade-in"
              style={{ background: "rgba(0,255,136,0.15)", border: "1px solid rgba(0,255,136,0.35)", color: "#00ff88", ...rF, fontWeight: 700 }}>
              <Icon name="Check" size={16} /> Сохранено
            </div>
          )}

          {/* ───── ПРОФИЛЬ ───── */}
          {section === "profile" && (
            <div className="space-y-5">
              <div>
                <h2 style={{ ...rF, fontWeight: 700, fontSize: "20px", color: "#e2e8f0" }}>Мой профиль</h2>
                <p style={{ ...iF, fontSize: "13px", color: "#6b7fa3" }}>Аватар, баннер, статус, о себе</p>
              </div>

              {/* Banner + Avatar */}
              <Card>
                {/* Banner */}
                <div className="relative rounded-xl overflow-hidden mb-4 cursor-pointer group" style={{ height: "120px", background: bannerImg ? "transparent" : bannerColor }}
                  onClick={() => bannerInputRef.current?.click()}>
                  {bannerImg
                    ? <img src={bannerImg} alt="banner" className="w-full h-full object-cover" />
                    : <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity" style={{ background: "rgba(0,0,0,0.4)" }}>
                        <div className="flex items-center gap-2" style={{ ...rF, fontWeight: 700, color: "#fff", fontSize: "13px" }}>
                          <Icon name="Image" size={16} /> Загрузить баннер (PNG/GIF)
                        </div>
                      </div>
                  }
                  {bannerImg && (
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity" style={{ background: "rgba(0,0,0,0.5)" }}>
                      <div className="flex items-center gap-2" style={{ ...rF, fontWeight: 700, color: "#fff", fontSize: "13px" }}>
                        <Icon name="Image" size={16} /> Изменить баннер
                      </div>
                    </div>
                  )}
                  <input ref={bannerInputRef} type="file" accept="image/*,.gif" className="hidden" onChange={e => handleImageUpload(e, "banner")} />
                </div>
                {/* Banner color picker */}
                {!bannerImg && (
                  <div className="flex items-center gap-3 mb-4">
                    <span style={{ ...rF, fontWeight: 600, fontSize: "12px", color: "#6b7fa3" }}>Цвет баннера:</span>
                    {["#0d1424", "#0a1a0f", "#1a0a20", "#0a1520", "#1a1000", "#1a0a0a"].map(c => (
                      <button key={c} onClick={() => setBannerColor(c)} className="w-6 h-6 rounded-lg transition-all hover:scale-110"
                        style={{ background: c, border: bannerColor === c ? "2px solid #00ff88" : "2px solid transparent" }} />
                    ))}
                    <input type="color" value={bannerColor} onChange={e => setBannerColor(e.target.value)} className="w-7 h-7 rounded cursor-pointer border-0" style={{ background: "transparent" }} />
                  </div>
                )}
                {bannerImg && (
                  <button onClick={() => setBannerImg(null)} className="mb-4 flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all hover:opacity-80"
                    style={{ background: "rgba(255,0,0,0.1)", color: "#ff4444", border: "1px solid rgba(255,0,0,0.2)", ...rF, fontWeight: 600, fontSize: "12px" }}>
                    <Icon name="Trash2" size={12} /> Удалить баннер
                  </button>
                )}

                {/* Avatar */}
                <div className="flex items-end gap-4">
                  <div className="relative cursor-pointer group" onClick={() => avatarInputRef.current?.click()}>
                    <UserAvatar username={username} color={avatarColor} avatarImg={avatarImg} size={80} />
                    <div className="absolute inset-0 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity" style={{ background: "rgba(0,0,0,0.6)" }}>
                      <Icon name="Camera" size={18} style={{ color: "#fff" }} />
                    </div>
                    <input ref={avatarInputRef} type="file" accept="image/*,.gif" className="hidden" onChange={e => handleImageUpload(e, "avatar")} />
                  </div>
                  <div className="flex-1">
                    <div style={{ ...rF, fontWeight: 800, fontSize: "22px", color: avatarColor }}>{username}</div>
                    <div className="flex items-center gap-1.5 mt-1">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ background: STATUSES.find(s => s.value === userStatus)?.color }} />
                      <span style={{ ...iF, fontSize: "13px", color: "#6b7fa3" }}>{STATUSES.find(s => s.value === userStatus)?.label}</span>
                    </div>
                    <div className="flex gap-2 mt-2">
                      <button onClick={() => avatarInputRef.current?.click()} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition-all hover:opacity-80"
                        style={{ background: "rgba(0,255,136,0.1)", color: "#00ff88", border: "1px solid rgba(0,255,136,0.25)", ...rF, fontWeight: 600 }}>
                        <Icon name="Upload" size={12} /> Загрузить фото/GIF
                      </button>
                      {avatarImg && (
                        <button onClick={removeAvatar} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition-all hover:opacity-80"
                          style={{ background: "rgba(255,0,0,0.08)", color: "#ff4444", border: "1px solid rgba(255,0,0,0.2)", ...rF, fontWeight: 600 }}>
                          <Icon name="Trash2" size={12} /> Удалить
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </Card>

              {/* Avatar color (if no image) */}
              {!avatarImg && (
                <Card>
                  <SectionLabel>Цвет аватара</SectionLabel>
                  <div className="flex gap-2 flex-wrap">
                    {AVATAR_COLORS.map(c => (
                      <button key={c} onClick={() => handleColorChange(c)} className="w-8 h-8 rounded-full transition-all hover:scale-110"
                        style={{ background: c, border: avatarColor === c ? "3px solid white" : "3px solid transparent", boxShadow: avatarColor === c ? `0 0 10px ${c}` : "none" }} />
                    ))}
                    <div className="relative">
                      <input type="color" value={avatarColor} onChange={e => handleColorChange(e.target.value)}
                        className="w-8 h-8 rounded-full cursor-pointer border-0 opacity-0 absolute inset-0" />
                      <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: "rgba(255,255,255,0.08)", border: "2px dashed rgba(255,255,255,0.3)" }}>
                        <Icon name="Plus" size={14} style={{ color: "#6b7fa3" }} />
                      </div>
                    </div>
                  </div>
                </Card>
              )}

              {/* Username */}
              <Card>
                <SectionLabel>Имя пользователя</SectionLabel>
                <input className="w-full px-3 py-2.5 rounded-xl outline-none text-sm" value={username} onChange={e => setUsername(e.target.value)}
                  style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(0,255,136,0.2)", color: "#e2e8f0", ...iF }} />
                <div style={{ ...iF, fontSize: "11px", color: "#4a5568", marginTop: "4px" }}>{username.length}/32</div>
              </Card>

              {/* Status */}
              <Card>
                <SectionLabel>Статус присутствия</SectionLabel>
                <div className="grid grid-cols-2 gap-2 mb-3">
                  {STATUSES.map(s => (
                    <button key={s.value} onClick={() => setUserStatus(s.value)} className="flex items-center gap-2 px-3 py-2.5 rounded-xl transition-all"
                      style={{ background: userStatus === s.value ? s.color + "20" : "rgba(255,255,255,0.04)", border: userStatus === s.value ? `1px solid ${s.color}44` : "1px solid transparent", color: userStatus === s.value ? s.color : "#6b7fa3" }}>
                      <div className="w-2.5 h-2.5 rounded-full" style={{ background: s.color }} />
                      <span style={{ ...rF, fontWeight: 700, fontSize: "13px" }}>{s.label}</span>
                    </button>
                  ))}
                </div>
                <SectionLabel>Кастомный статус</SectionLabel>
                <div className="flex items-center gap-2 px-3 py-2 rounded-xl" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(0,255,136,0.15)" }}>
                  <span style={{ fontSize: "16px" }}>✏️</span>
                  <input className="flex-1 bg-transparent outline-none text-sm" placeholder="Сейчас играю в..." value={customStatus} onChange={e => setCustomStatus(e.target.value)}
                    style={{ color: "#e2e8f0", ...iF }} />
                </div>
              </Card>

              {/* Bio */}
              <Card>
                <SectionLabel>О себе</SectionLabel>
                <textarea className="w-full px-3 py-2.5 rounded-xl outline-none text-sm resize-none" rows={3} value={bioText} onChange={e => setBioText(e.target.value)}
                  style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(0,255,136,0.15)", color: "#e2e8f0", ...iF }} />
                <div style={{ ...iF, fontSize: "11px", color: "#4a5568", marginTop: "4px" }}>{bioText.length}/190</div>
              </Card>

              {/* Game emoji */}
              <Card>
                <SectionLabel>Игровые эмодзи</SectionLabel>
                <div className="flex gap-2 mb-3">
                  {GAME_EMOJI.map(cat => (
                    <button key={cat.cat} onClick={() => setActiveEmojiCat(cat.cat)} className="px-3 py-1.5 rounded-lg transition-all"
                      style={{ background: activeEmojiCat === cat.cat ? "rgba(0,255,136,0.15)" : "rgba(255,255,255,0.04)", color: activeEmojiCat === cat.cat ? "#00ff88" : "#6b7fa3", border: activeEmojiCat === cat.cat ? "1px solid rgba(0,255,136,0.3)" : "1px solid transparent", ...rF, fontWeight: 600, fontSize: "12px" }}>
                      {cat.cat}
                    </button>
                  ))}
                </div>
                <div className="flex flex-wrap gap-2">
                  {GAME_EMOJI.find(c => c.cat === activeEmojiCat)?.items.map((emoji, i) => (
                    <button key={i} onClick={() => setCustomStatus(cs => cs + emoji)}
                      className="w-9 h-9 rounded-xl flex items-center justify-center text-xl transition-all hover:scale-125 hover:bg-opacity-20"
                      style={{ background: "rgba(255,255,255,0.05)", fontSize: "18px" }}
                      title="Добавить в статус">
                      {emoji}
                    </button>
                  ))}
                </div>
                <div style={{ ...iF, fontSize: "11px", color: "#4a5568", marginTop: "8px" }}>Нажми на эмодзи — добавится в кастомный статус</div>
              </Card>

              <button onClick={showSaved} className="px-6 py-2.5 rounded-xl hover:opacity-90 transition-all"
                style={{ background: "rgba(0,255,136,0.15)", color: "#00ff88", border: "1px solid rgba(0,255,136,0.3)", ...rF, fontWeight: 700, fontSize: "14px" }}>
                Сохранить профиль
              </button>
            </div>
          )}

          {/* ───── ПРОФИЛЬ НА СЕРВЕРЕ ───── */}
          {section === "server_profile" && (
            <div className="space-y-5">
              <div>
                <h2 style={{ ...rF, fontWeight: 700, fontSize: "20px", color: "#e2e8f0" }}>Профиль на сервере</h2>
                <p style={{ ...iF, fontSize: "13px", color: "#6b7fa3" }}>Отдельный ник и биография для этого сервера</p>
              </div>
              <Card>
                <SectionLabel>Никнейм на сервере</SectionLabel>
                <input className="w-full px-3 py-2.5 rounded-xl outline-none text-sm" value={serverNick} onChange={e => setServerNick(e.target.value)}
                  style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(0,170,255,0.2)", color: "#e2e8f0", ...iF }} />
                <div style={{ ...iF, fontSize: "11px", color: "#4a5568", marginTop: "4px" }}>Виден только участникам этого сервера</div>
              </Card>
              <Card>
                <SectionLabel>О себе (на сервере)</SectionLabel>
                <textarea className="w-full px-3 py-2.5 rounded-xl outline-none text-sm resize-none" rows={3} value={serverBio} onChange={e => setServerBio(e.target.value)}
                  placeholder="Специализация на этом сервере..."
                  style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(0,170,255,0.15)", color: "#e2e8f0", ...iF }} />
              </Card>
              <Card>
                <SectionLabel>Аватар для сервера</SectionLabel>
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-full flex items-center justify-center" style={{ background: avatarColor + "33", color: avatarColor, ...rF, fontWeight: 900, fontSize: "18px" }}>
                    {serverNick.slice(0, 2).toUpperCase()}
                  </div>
                  <button className="flex items-center gap-2 px-4 py-2 rounded-xl transition-all hover:opacity-80"
                    style={{ background: "rgba(0,170,255,0.1)", color: "#00aaff", border: "1px solid rgba(0,170,255,0.25)", ...rF, fontWeight: 700, fontSize: "13px" }}>
                    <Icon name="Upload" size={14} /> Загрузить для сервера
                  </button>
                </div>
              </Card>
              <button onClick={showSaved} className="px-6 py-2.5 rounded-xl hover:opacity-90 transition-all"
                style={{ background: "rgba(0,170,255,0.12)", color: "#00aaff", border: "1px solid rgba(0,170,255,0.3)", ...rF, fontWeight: 700, fontSize: "14px" }}>
                Сохранить профиль сервера
              </button>
            </div>
          )}

          {/* ───── АККАУНТ ───── */}
          {section === "account" && (
            <div className="space-y-5">
              <h2 style={{ ...rF, fontWeight: 700, fontSize: "20px", color: "#e2e8f0" }}>Аккаунт</h2>
              <Card>
                {[
                  { label: "Email", value: user.email, icon: "Mail" },
                  { label: "Имя пользователя", value: user.username, icon: "User" },
                  { label: "ID пользователя", value: `#${String(user.id).padStart(6, "0")}`, icon: "Hash" },
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-3 p-3 rounded-xl mb-2" style={{ background: "rgba(255,255,255,0.03)" }}>
                    <Icon name={item.icon} size={15} style={{ color: "#6b7fa3" }} />
                    <div className="flex-1">
                      <div style={{ ...rF, fontSize: "10px", color: "#4a5568", textTransform: "uppercase", letterSpacing: "0.5px" }}>{item.label}</div>
                      <div style={{ ...iF, fontSize: "14px", color: "#e2e8f0" }}>{item.value}</div>
                    </div>
                    <button style={{ background: "rgba(0,255,136,0.08)", color: "#00ff88", border: "1px solid rgba(0,255,136,0.2)", padding: "4px 12px", borderRadius: "8px", ...rF, fontWeight: 600, fontSize: "12px" }}>
                      Изменить
                    </button>
                  </div>
                ))}
              </Card>
              <Card>
                <SettingRow label="Двухфакторная аутентификация" desc="Защити аккаунт с помощью 2FA">
                  <button style={{ background: "rgba(0,255,136,0.1)", color: "#00ff88", border: "1px solid rgba(0,255,136,0.25)", padding: "6px 14px", borderRadius: "8px", ...rF, fontWeight: 700, fontSize: "12px" }}>
                    Включить
                  </button>
                </SettingRow>
                <div className="h-px" style={{ background: "rgba(255,255,255,0.05)", margin: "10px 0" }} />
                <SettingRow label="Изменить пароль" desc="Рекомендуется менять раз в 3 месяца">
                  <button style={{ background: "rgba(0,170,255,0.1)", color: "#00aaff", border: "1px solid rgba(0,170,255,0.25)", padding: "6px 14px", borderRadius: "8px", ...rF, fontWeight: 700, fontSize: "12px" }}>
                    Изменить
                  </button>
                </SettingRow>
              </Card>
              <div className="p-4 rounded-xl" style={{ background: "rgba(255,0,0,0.05)", border: "1px solid rgba(255,0,0,0.15)" }}>
                <div style={{ ...rF, fontWeight: 700, fontSize: "13px", color: "#ff4444", marginBottom: "10px" }}>⚠️ Опасная зона</div>
                <div className="flex gap-2">
                  <button style={{ background: "rgba(255,100,0,0.1)", color: "#ff6600", border: "1px solid rgba(255,100,0,0.25)", padding: "8px 14px", borderRadius: "8px", ...rF, fontWeight: 700, fontSize: "12px" }}>
                    Отключить аккаунт
                  </button>
                  <button style={{ background: "rgba(255,0,0,0.1)", color: "#ff4444", border: "1px solid rgba(255,0,0,0.25)", padding: "8px 14px", borderRadius: "8px", ...rF, fontWeight: 700, fontSize: "12px" }}>
                    Удалить аккаунт
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ───── ГОЛОС И АУДИО ───── */}
          {section === "audio" && (
            <div className="space-y-5">
              <div>
                <h2 style={{ ...rF, fontWeight: 700, fontSize: "20px", color: "#e2e8f0" }}>Голос и аудио</h2>
                <p style={{ ...iF, fontSize: "13px", color: "#6b7fa3" }}>Микрофон, наушники, качество звука</p>
              </div>

              {/* Quick mute controls */}
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: micMuted ? "Микрофон выключен" : "Микрофон включён", icon: micMuted ? "MicOff" : "Mic", color: micMuted ? "#ff4444" : "#00ff88", toggle: () => setMicMuted(v => !v), active: !micMuted },
                  { label: headphonesMuted ? "Звук выключен" : "Звук включён", icon: headphonesMuted ? "VolumeX" : "Headphones", color: headphonesMuted ? "#ff4444" : "#00aaff", toggle: () => setHeadphonesMuted(v => !v), active: !headphonesMuted },
                ].map((ctrl, i) => (
                  <button key={i} onClick={ctrl.toggle} className="flex items-center gap-3 p-4 rounded-xl transition-all hover:opacity-90"
                    style={{ background: ctrl.active ? ctrl.color + "12" : "rgba(255,0,0,0.1)", border: `1px solid ${ctrl.active ? ctrl.color + "33" : "rgba(255,68,68,0.3)"}` }}>
                    <div className="w-11 h-11 rounded-xl flex items-center justify-center" style={{ background: ctrl.active ? ctrl.color + "20" : "rgba(255,0,0,0.15)" }}>
                      <Icon name={ctrl.icon} size={22} style={{ color: ctrl.active ? ctrl.color : "#ff4444" }} />
                    </div>
                    <div className="text-left">
                      <div style={{ ...rF, fontWeight: 700, fontSize: "14px", color: ctrl.active ? ctrl.color : "#ff4444" }}>{ctrl.label}</div>
                      <div style={{ ...iF, fontSize: "11px", color: "#6b7fa3" }}>Нажми для {ctrl.active ? "выключения" : "включения"}</div>
                    </div>
                  </button>
                ))}
              </div>

              {/* Input device */}
              <Card>
                <SectionLabel>Устройство ввода (микрофон)</SectionLabel>
                <div className="space-y-1 mb-4">
                  {AUDIO_DEVICES_IN.map(d => (
                    <button key={d} onClick={() => setInputDevice(d)} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all text-left"
                      style={{ background: inputDevice === d ? "rgba(0,255,136,0.1)" : "rgba(255,255,255,0.03)", border: inputDevice === d ? "1px solid rgba(0,255,136,0.3)" : "1px solid transparent", color: inputDevice === d ? "#00ff88" : "#8899bb" }}>
                      <Icon name="Mic" size={14} />
                      <span style={{ ...rF, fontWeight: 600, fontSize: "13px" }}>{d}</span>
                      {inputDevice === d && <Icon name="Check" size={13} style={{ color: "#00ff88", marginLeft: "auto" }} />}
                    </button>
                  ))}
                </div>
                <SectionLabel>Громкость микрофона</SectionLabel>
                <Slider value={inputVolume} onChange={setInputVolume} />
                <div className="flex items-center gap-2 mt-3">
                  <button onClick={() => setInputTest(v => !v)} className="flex items-center gap-2 px-4 py-2 rounded-xl transition-all"
                    style={{ background: inputTest ? "rgba(255,0,170,0.15)" : "rgba(255,255,255,0.06)", color: inputTest ? "#ff00aa" : "#6b7fa3", border: inputTest ? "1px solid rgba(255,0,170,0.3)" : "1px solid transparent", ...rF, fontWeight: 700, fontSize: "13px" }}>
                    <Icon name={inputTest ? "Square" : "Play"} size={13} />
                    {inputTest ? "Остановить тест" : "Проверить микрофон"}
                  </button>
                  {inputTest && (
                    <div className="flex gap-1 items-center">
                      {[...Array(8)].map((_, i) => (
                        <div key={i} className="w-1.5 rounded-full transition-all" style={{ height: `${8 + Math.random() * 20}px`, background: "#00ff88", opacity: 0.7 }} />
                      ))}
                    </div>
                  )}
                </div>
              </Card>

              {/* Output device */}
              <Card>
                <SectionLabel>Устройство вывода (наушники / динамики)</SectionLabel>
                <div className="space-y-1 mb-4">
                  {AUDIO_DEVICES_OUT.map(d => (
                    <button key={d} onClick={() => setOutputDevice(d)} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all text-left"
                      style={{ background: outputDevice === d ? "rgba(0,170,255,0.1)" : "rgba(255,255,255,0.03)", border: outputDevice === d ? "1px solid rgba(0,170,255,0.3)" : "1px solid transparent", color: outputDevice === d ? "#00aaff" : "#8899bb" }}>
                      <Icon name="Headphones" size={14} />
                      <span style={{ ...rF, fontWeight: 600, fontSize: "13px" }}>{d}</span>
                      {outputDevice === d && <Icon name="Check" size={13} style={{ color: "#00aaff", marginLeft: "auto" }} />}
                    </button>
                  ))}
                </div>
                <SectionLabel>Громкость вывода</SectionLabel>
                <Slider value={outputVolume} onChange={setOutputVolume} color="#00aaff" />
                <div className="mt-3">
                  <SectionLabel>Громкость приложения</SectionLabel>
                  <Slider value={appVolume} onChange={setAppVolume} color="#aa00ff" />
                </div>
              </Card>

              {/* Advanced audio processing */}
              <Card>
                <SectionLabel>Обработка звука</SectionLabel>
                <div className="space-y-1">
                  <SettingRow label="Подавление шума" desc="Убирает фоновые звуки окружения"><Toggle value={noiseSuppression} onChange={() => setNoiseSuppression(v => !v)} /></SettingRow>
                  {noiseSuppression && (
                    <div className="flex gap-2 ml-4 mb-2">
                      {["low", "medium", "high", "ultra"].map(lvl => (
                        <button key={lvl} onClick={() => setNoiseSuppLevel(lvl)} className="px-3 py-1 rounded-lg transition-all"
                          style={{ background: noiseSuppLevel === lvl ? "rgba(0,255,136,0.15)" : "rgba(255,255,255,0.04)", color: noiseSuppLevel === lvl ? "#00ff88" : "#6b7fa3", border: noiseSuppLevel === lvl ? "1px solid rgba(0,255,136,0.3)" : "1px solid transparent", ...rF, fontWeight: 600, fontSize: "12px", textTransform: "capitalize" }}>
                          {lvl === "low" ? "Низкий" : lvl === "medium" ? "Средний" : lvl === "high" ? "Высокий" : "Ультра"}
                        </button>
                      ))}
                    </div>
                  )}
                  <div className="h-px" style={{ background: "rgba(255,255,255,0.05)", margin: "6px 0" }} />
                  <SettingRow label="Эхоподавление" desc="Устраняет эхо от динамиков"><Toggle value={echoCancellation} onChange={() => setEchoCancellation(v => !v)} /></SettingRow>
                  <div className="h-px" style={{ background: "rgba(255,255,255,0.05)", margin: "6px 0" }} />
                  <SettingRow label="Автоусиление (AGC)" desc="Автоматически регулирует уровень громкости"><Toggle value={autoGain} onChange={() => setAutoGain(v => !v)} /></SettingRow>
                  <div className="h-px" style={{ background: "rgba(255,255,255,0.05)", margin: "6px 0" }} />
                  <SettingRow label="Пространственный звук" desc="3D-позиционирование голоса участников"><Toggle value={spatialAudio} onChange={() => setSpatialAudio(v => !v)} color="#aa00ff" /></SettingRow>
                  <div className="h-px" style={{ background: "rgba(255,255,255,0.05)", margin: "6px 0" }} />
                  <SettingRow label="Усиление низких частот" desc="Усиливает бас (требует хороших наушников)"><Toggle value={subwoofer} onChange={() => setSubwoofer(v => !v)} color="#ff6600" /></SettingRow>
                </div>
              </Card>

              {/* Voice detection */}
              <Card>
                <SectionLabel>Режим активации голоса</SectionLabel>
                <div className="flex gap-2 mb-4">
                  <button onClick={() => { setVoiceActivity(true); setPushToTalk(false); }} className="flex-1 py-2.5 rounded-xl transition-all"
                    style={{ background: voiceActivity ? "rgba(0,255,136,0.15)" : "rgba(255,255,255,0.04)", color: voiceActivity ? "#00ff88" : "#6b7fa3", border: voiceActivity ? "1px solid rgba(0,255,136,0.3)" : "1px solid rgba(255,255,255,0.06)", ...rF, fontWeight: 700 }}>
                    По голосу (VAD)
                  </button>
                  <button onClick={() => { setPushToTalk(true); setVoiceActivity(false); }} className="flex-1 py-2.5 rounded-xl transition-all"
                    style={{ background: pushToTalk ? "rgba(255,0,170,0.15)" : "rgba(255,255,255,0.04)", color: pushToTalk ? "#ff00aa" : "#6b7fa3", border: pushToTalk ? "1px solid rgba(255,0,170,0.3)" : "1px solid rgba(255,255,255,0.06)", ...rF, fontWeight: 700 }}>
                    Push-to-talk [X]
                  </button>
                </div>
                {voiceActivity && (
                  <>
                    <SettingRow label="Авточувствительность" desc="Порог определяется автоматически">
                      <Toggle value={sensitivityAuto} onChange={() => setSensitivityAuto(v => !v)} />
                    </SettingRow>
                    {!sensitivityAuto && (
                      <div className="mt-3">
                        <SectionLabel>Порог чувствительности</SectionLabel>
                        <Slider value={sensitivity} onChange={setSensitivity} color="#ff00aa" />
                      </div>
                    )}
                  </>
                )}
              </Card>
            </div>
          )}

          {/* ───── ВИДЕО ───── */}
          {section === "video" && (
            <div className="space-y-5">
              <div>
                <h2 style={{ ...rF, fontWeight: 700, fontSize: "20px", color: "#e2e8f0" }}>Видео</h2>
                <p style={{ ...iF, fontSize: "13px", color: "#6b7fa3" }}>Настройки веб-камеры</p>
              </div>
              <div className="flex items-center gap-3 p-4 rounded-xl" style={{ background: cameraEnabled ? "rgba(170,0,255,0.1)" : "rgba(255,255,255,0.04)", border: `1px solid ${cameraEnabled ? "rgba(170,0,255,0.3)" : "rgba(255,255,255,0.06)"}` }}>
                <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: cameraEnabled ? "rgba(170,0,255,0.15)" : "rgba(255,255,255,0.05)" }}>
                  <Icon name={cameraEnabled ? "Video" : "VideoOff"} size={22} style={{ color: cameraEnabled ? "#aa00ff" : "#6b7fa3" }} />
                </div>
                <div className="flex-1">
                  <div style={{ ...rF, fontWeight: 700, fontSize: "15px", color: cameraEnabled ? "#aa00ff" : "#6b7fa3" }}>{cameraEnabled ? "Камера включена" : "Камера выключена"}</div>
                  <div style={{ ...iF, fontSize: "11px", color: "#6b7fa3" }}>Видео в голосовых каналах</div>
                </div>
                <Toggle value={cameraEnabled} onChange={() => setCameraEnabled(v => !v)} color="#aa00ff" />
              </div>
              <Card>
                <SectionLabel>Устройство камеры</SectionLabel>
                {["Встроенная камера", "Logitech C922 Pro", "iPhone (Continuity Camera)"].map(d => (
                  <button key={d} onClick={() => setCameraDevice(d)} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl mb-1 transition-all text-left"
                    style={{ background: cameraDevice === d ? "rgba(170,0,255,0.1)" : "rgba(255,255,255,0.03)", border: cameraDevice === d ? "1px solid rgba(170,0,255,0.3)" : "1px solid transparent", color: cameraDevice === d ? "#aa00ff" : "#8899bb" }}>
                    <Icon name="Camera" size={14} />
                    <span style={{ ...rF, fontWeight: 600, fontSize: "13px" }}>{d}</span>
                    {cameraDevice === d && <Icon name="Check" size={13} style={{ marginLeft: "auto", color: "#aa00ff" }} />}
                  </button>
                ))}
              </Card>
              <Card>
                <SectionLabel>Качество камеры</SectionLabel>
                <div className="flex gap-2 mb-4">
                  {["480p", "720p", "1080p"].map(q => (
                    <button key={q} onClick={() => setCameraQuality(q)} className="flex-1 py-2 rounded-xl transition-all"
                      style={{ background: cameraQuality === q ? "rgba(170,0,255,0.15)" : "rgba(255,255,255,0.04)", color: cameraQuality === q ? "#aa00ff" : "#6b7fa3", border: cameraQuality === q ? "1px solid rgba(170,0,255,0.3)" : "1px solid transparent", ...rF, fontWeight: 700 }}>
                      {q}
                    </button>
                  ))}
                </div>
                <SettingRow label="Зеркалирование" desc="Отображать камеру зеркально"><Toggle value={cameraMirror} onChange={() => setCameraMirror(v => !v)} color="#aa00ff" /></SettingRow>
                <div className="h-px my-3" style={{ background: "rgba(255,255,255,0.05)" }} />
                <SectionLabel>Фон камеры</SectionLabel>
                <div className="grid grid-cols-3 gap-2">
                  {[{ v: "none", label: "Без фона" }, { v: "blur", label: "Размытие" }, { v: "space", label: "Космос" }].map(opt => (
                    <button key={opt.v} onClick={() => setCameraBackground(opt.v)} className="py-2.5 rounded-xl transition-all"
                      style={{ background: cameraBackground === opt.v ? "rgba(170,0,255,0.15)" : "rgba(255,255,255,0.04)", color: cameraBackground === opt.v ? "#aa00ff" : "#6b7fa3", border: cameraBackground === opt.v ? "1px solid rgba(170,0,255,0.3)" : "1px solid transparent", ...rF, fontWeight: 700, fontSize: "13px" }}>
                      {opt.label}
                    </button>
                  ))}
                </div>
              </Card>
            </div>
          )}

          {/* ───── СТРИМИНГ ───── */}
          {section === "streaming" && (
            <div className="space-y-5">
              <div>
                <h2 style={{ ...rF, fontWeight: 700, fontSize: "20px", color: "#e2e8f0" }}>Настройки стриминга</h2>
                <p style={{ ...iF, fontSize: "13px", color: "#6b7fa3" }}>Качество, кодек, захват, горячие клавиши</p>
              </div>

              {/* Quality + FPS */}
              <Card color="rgba(255,0,170,0.1)">
                <SectionLabel>Разрешение трансляции</SectionLabel>
                <div className="grid grid-cols-5 gap-2 mb-4">
                  {["360p", "480p", "720p", "1080p", "1440p"].map(q => (
                    <button key={q} onClick={() => setStreamQuality(q)} className="py-2 rounded-xl transition-all"
                      style={{ background: streamQuality === q ? "rgba(255,0,170,0.2)" : "rgba(255,255,255,0.04)", color: streamQuality === q ? "#ff00aa" : "#6b7fa3", border: streamQuality === q ? "1px solid rgba(255,0,170,0.4)" : "1px solid rgba(255,255,255,0.05)", ...rF, fontWeight: 700, fontSize: "13px", boxShadow: streamQuality === q ? "0 0 12px rgba(255,0,170,0.2)" : "none" }}>
                      {q}
                    </button>
                  ))}
                </div>
                <SectionLabel>Частота кадров (FPS)</SectionLabel>
                <div className="grid grid-cols-4 gap-2">
                  {[
                    { fps: "15", label: "15 FPS", desc: "Экономия трафика" },
                    { fps: "30", label: "30 FPS", desc: "Стандарт" },
                    { fps: "45", label: "45 FPS", desc: "Плавный" },
                    { fps: "60", label: "60 FPS", desc: "Максимум" },
                  ].map(opt => (
                    <button key={opt.fps} onClick={() => setStreamFps(opt.fps)} className="py-2.5 px-2 rounded-xl transition-all flex flex-col items-center"
                      style={{ background: streamFps === opt.fps ? "rgba(255,0,170,0.18)" : "rgba(255,255,255,0.04)", color: streamFps === opt.fps ? "#ff00aa" : "#6b7fa3", border: streamFps === opt.fps ? "1px solid rgba(255,0,170,0.35)" : "1px solid rgba(255,255,255,0.05)", boxShadow: streamFps === opt.fps ? "0 0 12px rgba(255,0,170,0.15)" : "none" }}>
                      <span style={{ ...rF, fontWeight: 800, fontSize: "15px" }}>{opt.label}</span>
                      <span style={{ ...iF, fontSize: "10px", color: streamFps === opt.fps ? "#ff00aa99" : "#4a5568" }}>{opt.desc}</span>
                    </button>
                  ))}
                </div>
              </Card>

              {/* Bitrate + Codec */}
              <Card>
                <SectionLabel>Битрейт потока</SectionLabel>
                <div className="flex gap-2 mb-4">
                  {[
                    { v: "2500", label: "2.5 Mbps", desc: "480p" },
                    { v: "4000", label: "4 Mbps", desc: "720p" },
                    { v: "6000", label: "6 Mbps", desc: "1080p" },
                    { v: "10000", label: "10 Mbps", desc: "1440p" },
                  ].map(b => (
                    <button key={b.v} onClick={() => setStreamBitrate(b.v)} className="flex-1 py-2 rounded-xl transition-all text-center"
                      style={{ background: streamBitrate === b.v ? "rgba(0,255,136,0.12)" : "rgba(255,255,255,0.04)", color: streamBitrate === b.v ? "#00ff88" : "#6b7fa3", border: streamBitrate === b.v ? "1px solid rgba(0,255,136,0.3)" : "1px solid transparent", ...rF, fontWeight: 700, fontSize: "12px" }}>
                      {b.label}<br /><span style={{ fontSize: "10px", opacity: 0.6 }}>{b.desc}</span>
                    </button>
                  ))}
                </div>
                <SectionLabel>Видеокодек</SectionLabel>
                <div className="flex gap-2">
                  {["H.264", "H.265", "VP9", "AV1"].map(c => (
                    <button key={c} onClick={() => setStreamCodec(c)} className="px-4 py-2 rounded-xl transition-all"
                      style={{ background: streamCodec === c ? "rgba(0,255,136,0.12)" : "rgba(255,255,255,0.04)", color: streamCodec === c ? "#00ff88" : "#6b7fa3", border: streamCodec === c ? "1px solid rgba(0,255,136,0.3)" : "1px solid transparent", ...rF, fontWeight: 700 }}>
                      {c}
                    </button>
                  ))}
                </div>
              </Card>

              {/* Stream options */}
              <Card>
                <SectionLabel>Параметры трансляции</SectionLabel>
                <SettingRow label="Захват звука системы" desc="Передавать звук игры/приложения зрителям"><Toggle value={streamAudio} onChange={() => setStreamAudio(v => !v)} /></SettingRow>
                <div className="h-px my-2" style={{ background: "rgba(255,255,255,0.05)" }} />
                <SettingRow label="Показывать курсор" desc="Курсор мыши виден в трансляции"><Toggle value={streamCursor} onChange={() => setStreamCursor(v => !v)} /></SettingRow>
                <div className="h-px my-2" style={{ background: "rgba(255,255,255,0.05)" }} />
                <SettingRow label="Предпросмотр перед стримом" desc="Показать превью перед началом"><Toggle value={streamPreview} onChange={() => setStreamPreview(v => !v)} /></SettingRow>
                <div className="h-px my-2" style={{ background: "rgba(255,255,255,0.05)" }} />
                <SettingRow label="Горячая клавиша [S]" desc="Быстрый старт/стоп стриминга"><Toggle value={streamHotkey} onChange={() => setStreamHotkey(v => !v)} /></SettingRow>
                <div className="h-px my-2" style={{ background: "rgba(255,255,255,0.05)" }} />
                <SettingRow label="Захват кликов мыши" desc="Выделять клики в трансляции"><Toggle value={streamCaptureMouse} onChange={() => setStreamCaptureMouse(v => !v)} /></SettingRow>
              </Card>
            </div>
          )}

          {/* ───── УВЕДОМЛЕНИЯ ───── */}
          {section === "notifications" && (
            <div className="space-y-5">
              <h2 style={{ ...rF, fontWeight: 700, fontSize: "20px", color: "#e2e8f0" }}>Уведомления</h2>
              <Card>
                <SettingRow label="Все сообщения" desc="Уведомлять о каждом новом сообщении"><Toggle value={notifAll} onChange={() => setNotifAll(v => !v)} /></SettingRow>
                <div className="h-px my-2" style={{ background: "rgba(255,255,255,0.05)" }} />
                <SettingRow label="Упоминания @" desc="Только когда тебя упомянули"><Toggle value={notifMention} onChange={() => setNotifMention(v => !v)} /></SettingRow>
                <div className="h-px my-2" style={{ background: "rgba(255,255,255,0.05)" }} />
                <SettingRow label="Звук уведомлений" desc="Воспроизводить звук"><Toggle value={notifSound} onChange={() => setNotifSound(v => !v)} /></SettingRow>
                <div className="h-px my-2" style={{ background: "rgba(255,255,255,0.05)" }} />
                <SettingRow label="Личные сообщения" desc="При получении ЛС"><Toggle value={notifDm} onChange={() => setNotifDm(v => !v)} /></SettingRow>
                <div className="h-px my-2" style={{ background: "rgba(255,255,255,0.05)" }} />
                <SettingRow label="Уведомления сервера" desc="Активность на сервере"><Toggle value={notifServer} onChange={() => setNotifServer(v => !v)} /></SettingRow>
                <div className="h-px my-2" style={{ background: "rgba(255,255,255,0.05)" }} />
                <SettingRow label="Рабочий стол (push)" desc="Системные уведомления браузера"><Toggle value={notifDesktop} onChange={() => setNotifDesktop(v => !v)} /></SettingRow>
              </Card>
            </div>
          )}

          {/* ───── ВНЕШНИЙ ВИД ───── */}
          {section === "appearance" && (
            <div className="space-y-5">
              <div>
                <h2 style={{ ...rF, fontWeight: 700, fontSize: "20px", color: "#e2e8f0" }}>Внешний вид</h2>
                <p style={{ ...iF, fontSize: "13px", color: "#6b7fa3" }}>Цвета, шрифты, размеры, анимации</p>
              </div>

              {/* Color theme */}
              <Card>
                <SectionLabel>Цветовая палитра</SectionLabel>
                <div className="grid grid-cols-3 gap-3">
                  {COLOR_THEMES.map(theme => (
                    <button key={theme.id} onClick={() => setColorTheme(theme.id)} className="p-3 rounded-xl transition-all"
                      style={{ background: colorTheme === theme.id ? theme.primary + "18" : "rgba(255,255,255,0.04)", border: colorTheme === theme.id ? `2px solid ${theme.primary}55` : "2px solid transparent" }}>
                      <div className="flex gap-1 mb-2 justify-center">
                        {[theme.primary, theme.secondary, theme.accent].map((c, i) => (
                          <div key={i} className="w-5 h-5 rounded-full" style={{ background: c, boxShadow: colorTheme === theme.id ? `0 0 6px ${c}` : "none" }} />
                        ))}
                      </div>
                      <div style={{ ...rF, fontWeight: 700, fontSize: "13px", color: colorTheme === theme.id ? theme.primary : "#6b7fa3" }}>{theme.label}</div>
                    </button>
                  ))}
                </div>
              </Card>

              {/* Font */}
              <Card>
                <SectionLabel>Шрифт чата</SectionLabel>
                <div className="space-y-2">
                  {FONTS.map(font => (
                    <button key={font.id} onClick={() => setChatFont(font.id)} className="w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all text-left"
                      style={{ background: chatFont === font.id ? "rgba(0,255,136,0.08)" : "rgba(255,255,255,0.03)", border: chatFont === font.id ? "1px solid rgba(0,255,136,0.3)" : "1px solid rgba(255,255,255,0.04)" }}>
                      <div>
                        <div style={{ ...rF, fontWeight: 600, fontSize: "13px", color: chatFont === font.id ? "#00ff88" : "#8899bb" }}>{font.label}</div>
                        <div style={{ fontFamily: font.family, fontSize: "14px", color: "#c8d6e8", marginTop: "2px" }}>{font.preview}</div>
                      </div>
                      {chatFont === font.id && <Icon name="Check" size={15} style={{ color: "#00ff88" }} />}
                    </button>
                  ))}
                </div>
              </Card>

              {/* Font size + misc */}
              <Card>
                <SettingRow label={`Размер шрифта — ${fontSize}px`} desc="Размер текста в сообщениях">
                  <></>
                </SettingRow>
                <Slider value={fontSize} onChange={setFontSize} min={10} max={20} />
                <div className="mt-3 px-3 py-2.5 rounded-xl" style={{ background: "rgba(255,255,255,0.03)" }}>
                  <span style={{ fontFamily: currentFont, fontSize: `${fontSize}px`, color: "#c8d6e8" }}>Пример текста сообщения в чате</span>
                </div>
                <div className="h-px my-4" style={{ background: "rgba(255,255,255,0.05)" }} />
                <SettingRow label="Компактный режим" desc="Уменьшает отступы между сообщениями"><Toggle value={compactMode} onChange={() => setCompactMode(v => !v)} color="#ff00aa" /></SettingRow>
                <div className="h-px my-2" style={{ background: "rgba(255,255,255,0.05)" }} />
                <SettingRow label="Анимации" desc="Плавные переходы и эффекты"><Toggle value={showAnimations} onChange={() => setShowAnimations(v => !v)} /></SettingRow>
                <div className="h-px my-2" style={{ background: "rgba(255,255,255,0.05)" }} />
                <SettingRow label="Аватары в чате" desc="Показывать аватары рядом с сообщениями"><Toggle value={showAvatars} onChange={() => setShowAvatars(v => !v)} /></SettingRow>
                <div className="h-px my-2" style={{ background: "rgba(255,255,255,0.05)" }} />
                <SettingRow label="Группировка сообщений" desc="Объединять сообщения одного автора"><Toggle value={messageGrouping} onChange={() => setMessageGrouping(v => !v)} /></SettingRow>
              </Card>
            </div>
          )}

          {/* ───── ГОРЯЧИЕ КЛАВИШИ ───── */}
          {section === "keybinds" && (
            <div className="space-y-4">
              <div>
                <h2 style={{ ...rF, fontWeight: 700, fontSize: "20px", color: "#e2e8f0" }}>Горячие клавиши</h2>
                <p style={{ ...iF, fontSize: "13px", color: "#6b7fa3" }}>Настройка кнопок быстрого доступа</p>
              </div>
              {["Голос", "Стриминг", "Навигация"].map(cat => (
                <div key={cat}>
                  <SectionLabel>{cat}</SectionLabel>
                  {KEYBINDS.filter(k => k.category === cat).map((kb, i) => (
                    <div key={i} className="flex items-center justify-between px-4 py-3 rounded-xl mb-1"
                      style={{ background: "var(--dark-card)", border: "1px solid rgba(255,255,255,0.04)" }}>
                      <span style={{ ...rF, fontWeight: 600, fontSize: "14px", color: "#c8d6e8" }}>{kb.action}</span>
                      <div className="flex items-center gap-2">
                        <kbd className="px-3 py-1 rounded-lg" style={{ ...rF, fontWeight: 700, fontSize: "12px", background: "rgba(0,255,136,0.1)", color: "#00ff88", border: "1px solid rgba(0,255,136,0.2)", letterSpacing: "1px" }}>{kb.key}</kbd>
                        <button className="w-7 h-7 rounded-lg flex items-center justify-center hover:opacity-70" style={{ background: "rgba(255,255,255,0.05)" }}>
                          <Icon name="Pencil" size={12} style={{ color: "#6b7fa3" }} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          )}

          {/* ───── ЯЗЫК ───── */}
          {section === "language" && (
            <div className="space-y-5">
              <div>
                <h2 style={{ ...rF, fontWeight: 700, fontSize: "20px", color: "#e2e8f0" }}>Язык интерфейса</h2>
                <p style={{ ...iF, fontSize: "13px", color: "#6b7fa3" }}>Выберите язык приложения</p>
              </div>
              <Card>
                <div className="grid grid-cols-2 gap-2">
                  {LANGUAGES.map(lang => (
                    <button key={lang.code} onClick={() => setLanguage(lang.code)} className="flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-left"
                      style={{ background: language === lang.code ? "rgba(0,255,136,0.12)" : "rgba(255,255,255,0.03)", border: language === lang.code ? "1px solid rgba(0,255,136,0.3)" : "1px solid rgba(255,255,255,0.04)", boxShadow: language === lang.code ? "0 0 12px rgba(0,255,136,0.08)" : "none" }}>
                      <span style={{ fontSize: "22px" }}>{lang.flag}</span>
                      <div>
                        <div style={{ ...rF, fontWeight: 700, fontSize: "14px", color: language === lang.code ? "#00ff88" : "#e2e8f0" }}>{lang.native}</div>
                        <div style={{ ...iF, fontSize: "11px", color: "#6b7fa3" }}>{lang.label}</div>
                      </div>
                      {language === lang.code && <Icon name="Check" size={15} style={{ color: "#00ff88", marginLeft: "auto" }} />}
                    </button>
                  ))}
                </div>
                <button onClick={showSaved} className="mt-4 w-full py-2.5 rounded-xl hover:opacity-90 transition-all"
                  style={{ background: "rgba(0,255,136,0.15)", color: "#00ff88", border: "1px solid rgba(0,255,136,0.3)", ...rF, fontWeight: 700, fontSize: "14px" }}>
                  Применить язык
                </button>
              </Card>
            </div>
          )}

          {/* OTHER */}
          {!["profile", "server_profile", "account", "audio", "video", "streaming", "notifications", "appearance", "keybinds", "language"].includes(section) && (
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