import { useState, useRef, useEffect } from "react";
import Icon from "@/components/ui/icon";
import ProfileModal from "@/components/ProfileModal";

interface User {
  id: number;
  username: string;
  email: string;
  avatar_color: string;
  status: string;
}

interface DMViewProps {
  user: User;
  onLogout: () => void;
  onOpenSettings: () => void;
  micMuted: boolean;
  headphonesDeaf: boolean;
  onToggleMic: () => void;
  onToggleDeaf: () => void;
  myStatusDot: string;
  myStatusColor: string;
  myStatusLabel: string;
  onOpenStatusMenu: () => void;
}

const STATUS_COLOR: Record<string, string> = {
  online: "#00ff88", streaming: "#ff00aa", away: "#ff6600", dnd: "#ff4444", offline: "#4a5568",
};
const STATUS_LABEL: Record<string, string> = {
  online: "В сети", streaming: "Стримит", away: "Отошёл", dnd: "Не беспокоить", offline: "Не в сети",
};

const FRIENDS = [
  { id: 1, name: "CyberWolf",    color: "#00ff88", status: "online",    game: "Cyber Arena",       avatar: "CW", mutual: 3 },
  { id: 2, name: "NeonShadow",   color: "#ff00aa", status: "streaming", game: "🔴 В эфире · CS2",  avatar: "NS", mutual: 5 },
  { id: 3, name: "PixelKnight",  color: "#00aaff", status: "online",    game: "VALORANT",           avatar: "PK", mutual: 2 },
  { id: 4, name: "GhostRunner",  color: "#aa00ff", status: "away",      game: "Отошёл",             avatar: "GR", mutual: 7 },
  { id: 5, name: "IronCore",     color: "#ff6600", status: "dnd",       game: "Не беспокоить",      avatar: "IC", mutual: 1 },
  { id: 6, name: "StarForge",    color: "#ffcc00", status: "offline",   game: "",                   avatar: "SF", mutual: 4 },
  { id: 7, name: "VoidHunter",   color: "#00ffff", status: "online",    game: "Dota 2",             avatar: "VH", mutual: 6 },
  { id: 8, name: "NightCrawler", color: "#ff4444", status: "offline",   game: "",                   avatar: "NC", mutual: 2 },
];

const PENDING = [
  { id: 9,  name: "DarkBlade",   color: "#aa00ff", direction: "incoming" as const },
  { id: 10, name: "XenoStrike",  color: "#ff6600", direction: "outgoing" as const },
];

interface Msg {
  id: number;
  from: "me" | "them";
  text: string;
  time: string;
  type?: "call" | "vcall" | "text";
}

const INIT_MSGS: Record<number, Msg[]> = {
  1: [
    { id: 1, from: "them", text: "Йо! Готов к рейду?", time: "19:30" },
    { id: 2, from: "me",   text: "Да, буду онлайн в 21:00", time: "19:31" },
    { id: 3, from: "them", text: "Отлично! Я уже в голосовом", time: "19:32" },
    { id: 4, from: "them", text: "📞 Пропущенный звонок", time: "19:45", type: "call" },
    { id: 5, from: "me",   text: "Сорри, был занят. Звоню?", time: "19:50" },
  ],
  2: [
    { id: 1, from: "them", text: "Смотришь стрим? 😄", time: "18:00" },
    { id: 2, from: "me",   text: "Да! Топовый как всегда", time: "18:02" },
  ],
  3: [
    { id: 1, from: "them", text: "Сыграем в VALORANT?", time: "20:10" },
    { id: 2, from: "me",   text: "Конечно, создавай лобби", time: "20:11" },
  ],
  7: [
    { id: 1, from: "them", text: "Привет! Давно не виделись в игре", time: "15:00" },
  ],
};

type Section = "friends" | "chat" | "pending" | "blocked";

export default function DMView({
  user, onLogout, onOpenSettings, micMuted, headphonesDeaf,
  onToggleMic, onToggleDeaf, myStatusDot, myStatusColor, myStatusLabel, onOpenStatusMenu,
}: DMViewProps) {
  const rF = { fontFamily: "Rajdhani, sans-serif" };
  const iF = { fontFamily: "IBM Plex Sans, sans-serif" };

  const [section, setSection]       = useState<Section>("friends");
  const [activeDM, setActiveDM]     = useState<number | null>(null);
  const [friendFilter, setFriendFilter] = useState<"online" | "all" | "offline">("online");
  const [friendSearch, setFriendSearch] = useState("");
  const [addInput, setAddInput]     = useState("");
  const [addStatus, setAddStatus]   = useState<"idle" | "sent">("idle");
  const [msgs, setMsgs]             = useState(INIT_MSGS);
  const [input, setInput]           = useState("");
  const [profileUser, setProfileUser] = useState<typeof FRIENDS[0] | null>(null);
  const [friends, setFriends]       = useState(FRIENDS);
  const [pending, setPending]       = useState(PENDING);

  // Call state
  const [callActive, setCallActive] = useState(false);
  const [callVideo, setCallVideo]   = useState(false);
  const [callFriend, setCallFriend] = useState<typeof FRIENDS[0] | null>(null);
  const [callMuted, setCallMuted]   = useState(false);
  const [callDeaf, setCallDeaf]     = useState(false);
  const [callTimer, setCallTimer]   = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const msgsEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    msgsEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [activeDM, msgs]);

  useEffect(() => {
    if (callActive) {
      timerRef.current = setInterval(() => setCallTimer(t => t + 1), 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
      setCallTimer(0);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [callActive]);

  const fmtTime = (s: number) =>
    `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

  const activeFriend = friends.find(f => f.id === activeDM);

  const startCall = (f: typeof FRIENDS[0], video = false) => {
    setCallFriend(f); setCallVideo(video); setCallActive(true);
    setCallMuted(false); setCallDeaf(false);
  };
  const endCall = () => { setCallActive(false); setCallFriend(null); };

  const sendMsg = () => {
    if (!input.trim() || !activeDM) return;
    const m: Msg = { id: Date.now(), from: "me", text: input.trim(), time: new Date().toLocaleTimeString("ru", { hour: "2-digit", minute: "2-digit" }) };
    setMsgs(prev => ({ ...prev, [activeDM]: [...(prev[activeDM] || []), m] }));
    setInput("");
  };

  const filteredFriends = friends.filter(f => {
    const matchSearch = f.name.toLowerCase().includes(friendSearch.toLowerCase());
    if (friendFilter === "online") return matchSearch && f.status !== "offline";
    if (friendFilter === "offline") return matchSearch && f.status === "offline";
    return matchSearch;
  });

  const dmFriends = friends.filter(f => msgs[f.id]);

  return (
    <div className="flex flex-1 min-w-0 overflow-hidden">

      {/* Profile modal */}
      {profileUser && (
        <ProfileModal
          member={{ id: profileUser.id, name: profileUser.name, color: profileUser.color, role: "Друг", roleColor: profileUser.color, status: profileUser.status, avatar: profileUser.avatar, game: profileUser.game, mutual: profileUser.mutual }}
          onClose={() => setProfileUser(null)}
          onMessage={() => { setActiveDM(profileUser.id); setSection("chat"); setProfileUser(null); }}
          onCall={() => { startCall(profileUser); setProfileUser(null); }}
        />
      )}

      {/* Active call overlay */}
      {callActive && callFriend && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center" style={{ background: "rgba(0,0,0,0.88)" }}>
          <div className="w-96 rounded-2xl overflow-hidden shadow-2xl" style={{ background: "var(--dark-panel)", border: `2px solid ${callFriend.color}33` }}>
            {/* Call header */}
            <div className="px-6 py-4 flex items-center gap-2" style={{ background: callFriend.color + "10", borderBottom: `1px solid ${callFriend.color}22` }}>
              <div className="w-2 h-2 rounded-full animate-pulse" style={{ background: callFriend.color }} />
              <span style={{ ...rF, fontWeight: 700, fontSize: "13px", color: callFriend.color }}>
                {callVideo ? "Видеозвонок" : "Голосовой звонок"}
              </span>
              <span style={{ ...rF, fontWeight: 600, fontSize: "13px", color: "#6b7fa3", marginLeft: "auto" }}>
                {fmtTime(callTimer)}
              </span>
            </div>

            <div className="p-8 flex flex-col items-center gap-5">
              {/* Avatar with pulse ring */}
              <div className="relative">
                <div className="absolute -inset-3 rounded-full border-2 animate-ping opacity-20" style={{ borderColor: callFriend.color }} />
                <div className="w-24 h-24 rounded-full flex items-center justify-center" style={{ background: callFriend.color + "22", border: `3px solid ${callFriend.color}`, boxShadow: `0 0 40px ${callFriend.color}44` }}>
                  <span style={{ ...rF, fontWeight: 900, fontSize: "28px", color: callFriend.color }}>{callFriend.avatar}</span>
                </div>
              </div>

              <div className="text-center">
                <div style={{ ...rF, fontWeight: 900, fontSize: "24px", color: callFriend.color }}>{callFriend.name}</div>
                <div style={{ ...iF, fontSize: "13px", color: "#6b7fa3", marginTop: "4px" }}>
                  {callActive ? `Идёт ${callTimer > 0 ? fmtTime(callTimer) : "..."}` : "Вызов..."}
                </div>
              </div>

              {/* Video placeholder */}
              {callVideo && (
                <div className="w-full h-36 rounded-2xl flex items-center justify-center" style={{ background: "rgba(170,0,255,0.07)", border: "1px solid rgba(170,0,255,0.2)" }}>
                  <div className="flex flex-col items-center gap-2">
                    <Icon name="Video" size={28} style={{ color: "#aa00ff" }} />
                    <span style={{ ...rF, fontWeight: 600, fontSize: "12px", color: "#6b7fa3" }}>HD видео · 1080p</span>
                  </div>
                </div>
              )}

              {/* Controls */}
              <div className="flex items-center gap-4">
                <div className="flex flex-col items-center gap-1">
                  <button onClick={() => setCallMuted(v => !v)} className="w-12 h-12 rounded-full flex items-center justify-center transition-all hover:scale-110"
                    style={{ background: callMuted ? "rgba(255,68,68,0.25)" : "rgba(255,255,255,0.08)", border: `1px solid ${callMuted ? "rgba(255,68,68,0.4)" : "rgba(255,255,255,0.12)"}` }}>
                    <Icon name={callMuted ? "MicOff" : "Mic"} size={20} style={{ color: callMuted ? "#ff4444" : "#e2e8f0" }} />
                  </button>
                  <span style={{ ...rF, fontSize: "10px", color: "#6b7fa3" }}>{callMuted ? "Включить" : "Откл. мик"}</span>
                </div>

                <div className="flex flex-col items-center gap-1">
                  <button onClick={endCall} className="w-14 h-14 rounded-full flex items-center justify-center transition-all hover:scale-110 hover:brightness-110"
                    style={{ background: "#ff4444", boxShadow: "0 0 24px rgba(255,68,68,0.5)" }}>
                    <Icon name="PhoneOff" size={24} style={{ color: "#fff" }} />
                  </button>
                  <span style={{ ...rF, fontSize: "10px", color: "#ff4444" }}>Завершить</span>
                </div>

                <div className="flex flex-col items-center gap-1">
                  <button onClick={() => setCallDeaf(v => !v)} className="w-12 h-12 rounded-full flex items-center justify-center transition-all hover:scale-110"
                    style={{ background: callDeaf ? "rgba(255,68,68,0.25)" : "rgba(255,255,255,0.08)", border: `1px solid ${callDeaf ? "rgba(255,68,68,0.4)" : "rgba(255,255,255,0.12)"}` }}>
                    <Icon name={callDeaf ? "VolumeX" : "Volume2"} size={20} style={{ color: callDeaf ? "#ff4444" : "#e2e8f0" }} />
                  </button>
                  <span style={{ ...rF, fontSize: "10px", color: "#6b7fa3" }}>{callDeaf ? "Включить" : "Заглушить"}</span>
                </div>

                {!callVideo && (
                  <div className="flex flex-col items-center gap-1">
                    <button onClick={() => setCallVideo(true)} className="w-12 h-12 rounded-full flex items-center justify-center transition-all hover:scale-110"
                      style={{ background: "rgba(170,0,255,0.15)", border: "1px solid rgba(170,0,255,0.3)" }}>
                      <Icon name="Video" size={20} style={{ color: "#aa00ff" }} />
                    </button>
                    <span style={{ ...rF, fontSize: "10px", color: "#6b7fa3" }}>Видео</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ══════════ LEFT PANEL — DM list ══════════ */}
      <div className="w-64 shrink-0 flex flex-col" style={{ background: "var(--dark-panel)", borderRight: "1px solid rgba(0,170,255,0.08)" }}>

        {/* Header */}
        <div className="px-4 py-3" style={{ borderBottom: "1px solid rgba(0,170,255,0.08)" }}>
          <div style={{ ...rF, fontWeight: 800, fontSize: "13px", color: "#00aaff", letterSpacing: "1px" }}>ЛИЧНЫЕ СООБЩЕНИЯ</div>
          <div style={{ ...iF, fontSize: "11px", color: "#6b7fa3", marginTop: "2px" }}>
            {friends.filter(f => f.status !== "offline").length} друзей онлайн
          </div>
        </div>

        {/* Nav tabs */}
        <div className="flex gap-1 px-2 py-2">
          {([
            { id: "friends" as Section, icon: "Users",       label: "Друзья",   badge: 0 },
            { id: "pending" as Section, icon: "UserPlus",    label: "Запросы",  badge: pending.filter(r => r.direction === "incoming").length },
            { id: "blocked" as Section, icon: "UserX",       label: "Блок",     badge: 0 },
          ]).map(item => (
            <button key={item.id} onClick={() => setSection(item.id)}
              className="flex-1 flex flex-col items-center gap-0.5 py-1.5 rounded-lg transition-all duration-200 relative"
              style={{ background: section === item.id ? "rgba(0,170,255,0.12)" : "transparent", color: section === item.id ? "#00aaff" : "#6b7fa3" }}>
              <Icon name={item.icon} size={13} />
              <span style={{ fontSize: "9px", ...rF, fontWeight: 600 }}>{item.label}</span>
              {item.badge > 0 && (
                <div className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full flex items-center justify-center" style={{ background: "#ff4444", color: "#fff", fontSize: "8px", fontWeight: 700 }}>{item.badge}</div>
              )}
            </button>
          ))}
        </div>

        {/* DM history */}
        <div className="px-2 pb-1">
          <div style={{ ...rF, fontWeight: 600, fontSize: "9px", color: "#4a5568", textTransform: "uppercase", letterSpacing: "1px", padding: "4px 6px" }}>Недавние</div>
          <div className="space-y-0.5">
            {dmFriends.map(f => {
              const lastMsg = (msgs[f.id] || []).slice(-1)[0];
              const isActive = activeDM === f.id && section === "chat";
              return (
                <button key={f.id} onClick={() => { setActiveDM(f.id); setSection("chat"); }}
                  className="w-full flex items-center gap-2.5 px-2 py-2 rounded-xl transition-all text-left"
                  style={{ background: isActive ? f.color + "15" : "transparent", border: isActive ? `1px solid ${f.color}22` : "1px solid transparent" }}>
                  <div className="relative shrink-0">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: f.color + "22", color: f.color, border: `1px solid ${f.color}33`, ...rF, fontWeight: 700, fontSize: "10px" }}>
                      {f.avatar}
                    </div>
                    <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2" style={{ background: STATUS_COLOR[f.status], borderColor: "var(--dark-panel)" }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div style={{ ...rF, fontWeight: 700, fontSize: "13px", color: isActive ? f.color : "#c8d6e8", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{f.name}</div>
                    <div style={{ ...iF, fontSize: "10px", color: "#6b7fa3", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {lastMsg ? (lastMsg.from === "me" ? `Ты: ${lastMsg.text}` : lastMsg.text) : "Нет сообщений"}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        <div className="h-px mx-3 my-1" style={{ background: "rgba(255,255,255,0.05)" }} />

        {/* New DM button */}
        <div className="px-3 pb-2">
          <button onClick={() => setSection("friends")} className="w-full flex items-center gap-2 px-3 py-2 rounded-xl transition-all hover:opacity-80"
            style={{ background: "rgba(0,170,255,0.08)", border: "1px solid rgba(0,170,255,0.2)", color: "#00aaff" }}>
            <Icon name="Plus" size={13} />
            <span style={{ ...rF, fontWeight: 700, fontSize: "12px" }}>Новый диалог</span>
          </button>
        </div>

        {/* User footer */}
        <div className="px-2 py-2 mt-auto" style={{ borderTop: "1px solid rgba(0,170,255,0.08)" }}>
          <div className="flex items-center gap-2 px-2 py-1.5 rounded-lg" style={{ background: `${myStatusColor}08` }}>
            <button className="relative shrink-0" onClick={onOpenStatusMenu}>
              <div className="w-7 h-7 rounded-full flex items-center justify-center" style={{ background: user.avatar_color + "33", border: `1px solid ${user.avatar_color}55`, color: user.avatar_color, ...rF, fontWeight: 700, fontSize: "10px" }}>
                {user.username.slice(0, 2).toUpperCase()}
              </div>
              <div className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 ${myStatusDot}`} style={{ borderColor: "var(--dark-panel)" }} />
            </button>
            <div className="flex-1 min-w-0 cursor-pointer" onClick={onOpenStatusMenu}>
              <div style={{ ...rF, fontWeight: 600, fontSize: "13px", color: user.avatar_color, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{user.username}</div>
              <div style={{ fontSize: "10px", color: myStatusColor }}>{myStatusLabel}</div>
            </div>
            <div className="flex gap-1">
              <button onClick={onToggleMic} className="w-6 h-6 rounded flex items-center justify-center hover:opacity-70" style={{ background: micMuted ? "rgba(255,68,68,0.2)" : "rgba(255,255,255,0.05)" }}>
                <Icon name={micMuted ? "MicOff" : "Mic"} size={12} style={{ color: micMuted ? "#ff4444" : "#6b7fa3" }} />
              </button>
              <button onClick={onToggleDeaf} className="w-6 h-6 rounded flex items-center justify-center hover:opacity-70" style={{ background: headphonesDeaf ? "rgba(255,68,68,0.2)" : "rgba(255,255,255,0.05)" }}>
                <Icon name={headphonesDeaf ? "VolumeX" : "Headphones"} size={12} style={{ color: headphonesDeaf ? "#ff4444" : "#6b7fa3" }} />
              </button>
              <button onClick={onOpenSettings} className="w-6 h-6 rounded flex items-center justify-center hover:opacity-70" style={{ background: "rgba(255,255,255,0.05)" }}>
                <Icon name="Settings" size={12} style={{ color: "#6b7fa3" }} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ══════════ RIGHT CONTENT ══════════ */}
      <div className="flex-1 flex flex-col min-w-0">

        {/* FRIENDS */}
        {section === "friends" && (
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Header */}
            <div className="px-5 py-3 flex items-center gap-3 shrink-0" style={{ background: "var(--dark-panel)", borderBottom: "1px solid rgba(0,170,255,0.08)" }}>
              <Icon name="Users" size={18} style={{ color: "#00aaff" }} />
              <span style={{ ...rF, fontWeight: 700, fontSize: "16px", color: "#e2e8f0" }}>Друзья</span>
              <div className="flex gap-1 ml-3">
                {(["online", "all", "offline"] as const).map(f => (
                  <button key={f} onClick={() => setFriendFilter(f)} className="px-3 py-1 rounded-lg transition-all"
                    style={{ background: friendFilter === f ? "rgba(0,170,255,0.15)" : "rgba(255,255,255,0.05)", color: friendFilter === f ? "#00aaff" : "#6b7fa3", border: friendFilter === f ? "1px solid rgba(0,170,255,0.3)" : "1px solid transparent", ...rF, fontWeight: 700, fontSize: "12px" }}>
                    {f === "online" ? `Онлайн (${friends.filter(fr => fr.status !== "offline").length})` : f === "all" ? "Все" : "Офлайн"}
                  </button>
                ))}
              </div>
              <button onClick={() => setSection("pending")} className="ml-auto flex items-center gap-1.5 px-3 py-1.5 rounded-xl hover:opacity-80 transition-all"
                style={{ background: "rgba(0,255,136,0.1)", color: "#00ff88", border: "1px solid rgba(0,255,136,0.25)", ...rF, fontWeight: 700, fontSize: "12px" }}>
                <Icon name="UserPlus" size={13} /> Добавить друга
              </button>
            </div>

            {/* Search */}
            <div className="px-5 py-3 shrink-0" style={{ background: "var(--dark-bg)" }}>
              <div className="flex items-center gap-2 px-3 py-2 rounded-xl" style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.07)" }}>
                <Icon name="Search" size={14} style={{ color: "#6b7fa3" }} />
                <input className="flex-1 bg-transparent outline-none text-sm" placeholder="Поиск друзей..."
                  value={friendSearch} onChange={e => setFriendSearch(e.target.value)}
                  style={{ color: "#e2e8f0", ...iF }} />
              </div>
            </div>

            {/* Friends list */}
            <div className="flex-1 overflow-y-auto px-5 pb-5" style={{ background: "var(--dark-bg)" }}>
              {filteredFriends.length === 0 && (
                <div className="flex flex-col items-center justify-center h-48 gap-3">
                  <Icon name="Users" size={40} style={{ color: "#2a3a5c" }} />
                  <div style={{ ...rF, fontWeight: 700, fontSize: "16px", color: "#4a5568" }}>Никого нет</div>
                </div>
              )}
              <div className="space-y-1">
                {filteredFriends.map(friend => (
                  <div key={friend.id} className="flex items-center gap-3 px-4 py-3 rounded-2xl transition-all group cursor-default"
                    style={{ background: "var(--dark-card)", border: "1px solid rgba(255,255,255,0.04)" }}
                    onMouseEnter={e => (e.currentTarget.style.borderColor = friend.color + "25")}
                    onMouseLeave={e => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.04)")}>
                    {/* Avatar */}
                    <div className="relative shrink-0 cursor-pointer" onClick={() => setProfileUser(friend)}>
                      <div className="w-11 h-11 rounded-full flex items-center justify-center" style={{ background: friend.color + "22", color: friend.color, border: `2px solid ${friend.color}33`, ...rF, fontWeight: 800, fontSize: "13px" }}>
                        {friend.avatar}
                      </div>
                      <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2" style={{ background: STATUS_COLOR[friend.status], borderColor: "var(--dark-card)" }} />
                    </div>
                    {/* Info */}
                    <div className="flex-1 min-w-0 cursor-pointer" onClick={() => setProfileUser(friend)}>
                      <div style={{ ...rF, fontWeight: 800, fontSize: "15px", color: friend.color }}>{friend.name}</div>
                      <div style={{ ...iF, fontSize: "12px", color: "#6b7fa3" }}>
                        {friend.status === "streaming"
                          ? <span style={{ color: "#ff00aa" }}>{friend.game}</span>
                          : friend.game || STATUS_LABEL[friend.status]}
                      </div>
                    </div>
                    {/* Action buttons — show on hover */}
                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => { setActiveDM(friend.id); setSection("chat"); }} title="Написать"
                        className="w-9 h-9 rounded-xl flex items-center justify-center transition-all hover:scale-110"
                        style={{ background: "rgba(0,170,255,0.12)", border: "1px solid rgba(0,170,255,0.25)" }}>
                        <Icon name="MessageCircle" size={16} style={{ color: "#00aaff" }} />
                      </button>
                      <button onClick={() => startCall(friend)} title="Голосовой звонок"
                        className="w-9 h-9 rounded-xl flex items-center justify-center transition-all hover:scale-110"
                        style={{ background: "rgba(0,255,136,0.12)", border: "1px solid rgba(0,255,136,0.25)" }}>
                        <Icon name="Phone" size={16} style={{ color: "#00ff88" }} />
                      </button>
                      <button onClick={() => startCall(friend, true)} title="Видеозвонок"
                        className="w-9 h-9 rounded-xl flex items-center justify-center transition-all hover:scale-110"
                        style={{ background: "rgba(170,0,255,0.12)", border: "1px solid rgba(170,0,255,0.25)" }}>
                        <Icon name="Video" size={16} style={{ color: "#aa00ff" }} />
                      </button>
                      <button onClick={() => setProfileUser(friend)} title="Профиль"
                        className="w-9 h-9 rounded-xl flex items-center justify-center transition-all hover:scale-110"
                        style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)" }}>
                        <Icon name="UserCircle" size={16} style={{ color: "#6b7fa3" }} />
                      </button>
                      <button onClick={() => setFriends(prev => prev.filter(f => f.id !== friend.id))} title="Удалить из друзей"
                        className="w-9 h-9 rounded-xl flex items-center justify-center transition-all hover:scale-110"
                        style={{ background: "rgba(255,0,0,0.07)", border: "1px solid rgba(255,0,0,0.12)" }}>
                        <Icon name="UserMinus" size={16} style={{ color: "#ff4444" }} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* CHAT */}
        {section === "chat" && activeFriend && (
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Chat header */}
            <div className="px-5 py-3 flex items-center gap-3 shrink-0" style={{ background: "var(--dark-panel)", borderBottom: "1px solid rgba(0,170,255,0.08)" }}>
              <div className="relative cursor-pointer" onClick={() => setProfileUser(activeFriend)}>
                <div className="w-9 h-9 rounded-full flex items-center justify-center" style={{ background: activeFriend.color + "22", color: activeFriend.color, border: `2px solid ${activeFriend.color}44`, ...rF, fontWeight: 700, fontSize: "12px" }}>
                  {activeFriend.avatar}
                </div>
                <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2" style={{ background: STATUS_COLOR[activeFriend.status], borderColor: "var(--dark-panel)" }} />
              </div>
              <div className="flex-1 cursor-pointer" onClick={() => setProfileUser(activeFriend)}>
                <div style={{ ...rF, fontWeight: 800, fontSize: "16px", color: activeFriend.color }}>{activeFriend.name}</div>
                <div style={{ ...iF, fontSize: "11px", color: "#6b7fa3" }}>
                  {STATUS_LABEL[activeFriend.status]}{activeFriend.game ? ` · ${activeFriend.game}` : ""}
                </div>
              </div>
              {/* Call buttons always visible */}
              <div className="flex gap-2">
                <button onClick={() => startCall(activeFriend)} className="flex items-center gap-1.5 px-3 py-2 rounded-xl transition-all hover:opacity-90 active:scale-95"
                  style={{ background: "rgba(0,255,136,0.12)", border: "1px solid rgba(0,255,136,0.25)", color: "#00ff88" }} title="Голосовой звонок">
                  <Icon name="Phone" size={15} />
                  <span style={{ ...rF, fontWeight: 700, fontSize: "12px" }}>Звонок</span>
                </button>
                <button onClick={() => startCall(activeFriend, true)} className="flex items-center gap-1.5 px-3 py-2 rounded-xl transition-all hover:opacity-90 active:scale-95"
                  style={{ background: "rgba(170,0,255,0.12)", border: "1px solid rgba(170,0,255,0.25)", color: "#aa00ff" }} title="Видеозвонок">
                  <Icon name="Video" size={15} />
                  <span style={{ ...rF, fontWeight: 700, fontSize: "12px" }}>Видео</span>
                </button>
                <button onClick={() => setProfileUser(activeFriend)} className="w-9 h-9 rounded-xl flex items-center justify-center hover:opacity-80 transition-all"
                  style={{ background: "rgba(255,255,255,0.05)" }} title="Профиль">
                  <Icon name="UserCircle" size={16} style={{ color: "#6b7fa3" }} />
                </button>
                <button className="w-9 h-9 rounded-xl flex items-center justify-center hover:opacity-80 transition-all"
                  style={{ background: "rgba(255,255,255,0.05)" }}>
                  <Icon name="Search" size={15} style={{ color: "#6b7fa3" }} />
                </button>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-5 py-5 space-y-3" style={{ background: "var(--dark-bg)" }}>
              {/* Channel intro */}
              <div className="flex flex-col items-center mb-8 gap-3">
                <div className="w-20 h-20 rounded-full flex items-center justify-center" style={{ background: activeFriend.color + "22", color: activeFriend.color, border: `3px solid ${activeFriend.color}44`, boxShadow: `0 0 30px ${activeFriend.color}22`, ...rF, fontWeight: 900, fontSize: "24px" }}>
                  {activeFriend.avatar}
                </div>
                <div style={{ ...rF, fontWeight: 900, fontSize: "22px", color: activeFriend.color }}>{activeFriend.name}</div>
                <div style={{ ...iF, fontSize: "13px", color: "#6b7fa3" }}>Начало личной переписки с {activeFriend.name}</div>
                <div className="flex gap-2">
                  <button onClick={() => startCall(activeFriend)} className="flex items-center gap-1.5 px-4 py-2 rounded-xl transition-all hover:opacity-80"
                    style={{ background: "rgba(0,255,136,0.1)", color: "#00ff88", border: "1px solid rgba(0,255,136,0.25)", ...rF, fontWeight: 700, fontSize: "12px" }}>
                    <Icon name="Phone" size={13} /> Позвонить
                  </button>
                  <button onClick={() => startCall(activeFriend, true)} className="flex items-center gap-1.5 px-4 py-2 rounded-xl transition-all hover:opacity-80"
                    style={{ background: "rgba(170,0,255,0.1)", color: "#aa00ff", border: "1px solid rgba(170,0,255,0.25)", ...rF, fontWeight: 700, fontSize: "12px" }}>
                    <Icon name="Video" size={13} /> Видеозвонок
                  </button>
                </div>
              </div>

              {(msgs[activeDM!] || []).map(msg => (
                <div key={msg.id} className={`flex items-end gap-2 ${msg.from === "me" ? "justify-end" : "justify-start"}`}>
                  {msg.from === "them" && (
                    <div className="w-7 h-7 rounded-full flex items-center justify-center shrink-0"
                      style={{ background: activeFriend.color + "22", color: activeFriend.color, ...rF, fontWeight: 700, fontSize: "9px" }}>
                      {activeFriend.avatar}
                    </div>
                  )}
                  {msg.type === "call" || msg.type === "vcall" ? (
                    <div className="flex items-center gap-2.5 px-4 py-2.5 rounded-2xl"
                      style={{ background: msg.from === "me" ? "rgba(0,255,136,0.08)" : "rgba(255,100,0,0.08)", border: `1px solid ${msg.from === "me" ? "rgba(0,255,136,0.2)" : "rgba(255,100,0,0.2)"}` }}>
                      <Icon name={msg.type === "vcall" ? "Video" : (msg.from === "me" ? "Phone" : "PhoneMissed")} size={15}
                        style={{ color: msg.from === "me" ? "#00ff88" : "#ff6600" }} />
                      <span style={{ ...rF, fontWeight: 700, fontSize: "13px", color: msg.from === "me" ? "#00ff88" : "#ff6600" }}>{msg.text}</span>
                      <span style={{ ...iF, fontSize: "10px", color: "#6b7fa3" }}>{msg.time}</span>
                    </div>
                  ) : (
                    <div className="max-w-sm">
                      <div className="px-4 py-2.5 rounded-2xl" style={{
                        background: msg.from === "me"
                          ? `linear-gradient(135deg, ${activeFriend.color}30, ${activeFriend.color}18)`
                          : "rgba(255,255,255,0.06)",
                        border: `1px solid ${msg.from === "me" ? activeFriend.color + "33" : "rgba(255,255,255,0.07)"}`,
                        borderBottomRightRadius: msg.from === "me" ? "4px" : undefined,
                        borderBottomLeftRadius: msg.from === "them" ? "4px" : undefined,
                      }}>
                        <div style={{ ...iF, fontSize: "14px", color: "#e2e8f0", lineHeight: 1.5 }}>{msg.text}</div>
                      </div>
                      <div style={{ ...iF, fontSize: "10px", color: "#4a5568", marginTop: "2px", textAlign: msg.from === "me" ? "right" : "left" }}>{msg.time}</div>
                    </div>
                  )}
                  {msg.from === "me" && (
                    <div className="w-7 h-7 rounded-full flex items-center justify-center shrink-0"
                      style={{ background: user.avatar_color + "22", color: user.avatar_color, ...rF, fontWeight: 700, fontSize: "9px" }}>
                      {user.username.slice(0, 2).toUpperCase()}
                    </div>
                  )}
                </div>
              ))}
              <div ref={msgsEndRef} />
            </div>

            {/* Input */}
            <div className="px-5 pb-5 pt-2 shrink-0" style={{ background: "var(--dark-bg)" }}>
              <div className="flex items-center gap-2 px-4 py-3 rounded-2xl" style={{ background: "rgba(255,255,255,0.06)", border: `1px solid ${activeFriend.color}22` }}>
                <button className="w-7 h-7 rounded-lg flex items-center justify-center hover:opacity-70" style={{ background: "rgba(255,255,255,0.06)" }}>
                  <Icon name="Plus" size={14} style={{ color: "#6b7fa3" }} />
                </button>
                <input className="flex-1 bg-transparent outline-none text-sm"
                  placeholder={`Написать ${activeFriend.name}...`}
                  value={input} onChange={e => setInput(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && !e.shiftKey && sendMsg()}
                  style={{ color: "#e2e8f0", ...iF }} />
                <button className="w-7 h-7 rounded-lg flex items-center justify-center hover:opacity-70" style={{ background: "rgba(255,255,255,0.06)" }}>
                  <Icon name="Smile" size={14} style={{ color: "#6b7fa3" }} />
                </button>
                <button onClick={sendMsg} className="w-8 h-8 rounded-xl flex items-center justify-center transition-all hover:scale-110 active:scale-95"
                  style={{ background: activeFriend.color + "22", border: `1px solid ${activeFriend.color}44` }}>
                  <Icon name="Send" size={14} style={{ color: activeFriend.color }} />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* NO CHAT SELECTED */}
        {section === "chat" && !activeDM && (
          <div className="flex-1 flex flex-col items-center justify-center gap-5" style={{ background: "var(--dark-bg)" }}>
            <div className="w-24 h-24 rounded-full flex items-center justify-center" style={{ background: "rgba(0,170,255,0.08)", border: "2px solid rgba(0,170,255,0.15)" }}>
              <Icon name="MessageCircle" size={40} style={{ color: "#2a4060" }} />
            </div>
            <div style={{ ...rF, fontWeight: 700, fontSize: "20px", color: "#4a5568" }}>Нет открытых диалогов</div>
            <div style={{ ...iF, fontSize: "14px", color: "#374151" }}>Выбери друга и начни общение</div>
            <button onClick={() => setSection("friends")} className="flex items-center gap-2 px-5 py-2.5 rounded-xl transition-all hover:opacity-90"
              style={{ background: "rgba(0,170,255,0.12)", color: "#00aaff", border: "1px solid rgba(0,170,255,0.25)", ...rF, fontWeight: 700, fontSize: "14px" }}>
              <Icon name="Users" size={16} /> Открыть список друзей
            </button>
          </div>
        )}

        {/* PENDING */}
        {section === "pending" && (
          <div className="flex-1 overflow-y-auto p-6" style={{ background: "var(--dark-bg)" }}>
            <h2 style={{ ...rF, fontWeight: 800, fontSize: "20px", color: "#e2e8f0", marginBottom: "4px" }}>Запросы в друзья</h2>
            <p style={{ ...iF, fontSize: "13px", color: "#6b7fa3", marginBottom: "20px" }}>Входящие и исходящие запросы</p>

            {/* Add friend */}
            <div className="p-5 rounded-2xl mb-6" style={{ background: "var(--dark-card)", border: "1px solid rgba(0,255,136,0.12)" }}>
              <div style={{ ...rF, fontWeight: 700, fontSize: "15px", color: "#e2e8f0", marginBottom: "4px" }}>Добавить друга</div>
              <div style={{ ...iF, fontSize: "12px", color: "#6b7fa3", marginBottom: "12px" }}>Отправь запрос по имени пользователя</div>
              <div className="flex gap-2">
                <div className="flex-1 flex items-center gap-2 px-3 py-2.5 rounded-xl" style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(0,255,136,0.2)" }}>
                  <Icon name="AtSign" size={14} style={{ color: "#6b7fa3" }} />
                  <input className="flex-1 bg-transparent outline-none text-sm" placeholder="Имя пользователя"
                    value={addInput} onChange={e => setAddInput(e.target.value)}
                    onKeyDown={e => { if (e.key === "Enter" && addInput.trim()) { setAddStatus("sent"); setAddInput(""); setTimeout(() => setAddStatus("idle"), 3000); } }}
                    style={{ color: "#e2e8f0", ...iF }} />
                </div>
                <button onClick={() => { if (addInput.trim()) { setAddStatus("sent"); setAddInput(""); setTimeout(() => setAddStatus("idle"), 3000); } }}
                  className="px-4 py-2.5 rounded-xl transition-all hover:opacity-90"
                  style={{ background: "rgba(0,255,136,0.15)", color: "#00ff88", border: "1px solid rgba(0,255,136,0.3)", ...rF, fontWeight: 700 }}>
                  Отправить
                </button>
              </div>
              {addStatus === "sent" && (
                <div className="flex items-center gap-2 mt-2 animate-fade-in" style={{ color: "#00ff88", ...iF, fontSize: "12px" }}>
                  <Icon name="Check" size={13} /> Запрос отправлен!
                </div>
              )}
            </div>

            {/* Incoming */}
            {pending.filter(r => r.direction === "incoming").length > 0 && (
              <>
                <div style={{ ...rF, fontWeight: 600, fontSize: "11px", color: "#6b7fa3", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "10px" }}>
                  Входящие — {pending.filter(r => r.direction === "incoming").length}
                </div>
                <div className="space-y-2 mb-6">
                  {pending.filter(r => r.direction === "incoming").map(req => (
                    <div key={req.id} className="flex items-center gap-3 p-4 rounded-2xl" style={{ background: "var(--dark-card)", border: "1px solid rgba(0,255,136,0.12)" }}>
                      <div className="w-12 h-12 rounded-full flex items-center justify-center shrink-0" style={{ background: req.color + "22", color: req.color, border: `2px solid ${req.color}33`, ...rF, fontWeight: 800, fontSize: "14px" }}>
                        {req.name.slice(0, 2).toUpperCase()}
                      </div>
                      <div className="flex-1">
                        <div style={{ ...rF, fontWeight: 800, fontSize: "16px", color: req.color }}>{req.name}</div>
                        <div style={{ ...iF, fontSize: "12px", color: "#6b7fa3" }}>Хочет добавить тебя в друзья</div>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => setPending(prev => prev.filter(r => r.id !== req.id))}
                          className="flex items-center gap-1.5 px-3 py-2 rounded-xl transition-all hover:opacity-80"
                          style={{ background: "rgba(0,255,136,0.15)", color: "#00ff88", border: "1px solid rgba(0,255,136,0.3)", ...rF, fontWeight: 700, fontSize: "12px" }}>
                          <Icon name="Check" size={13} /> Принять
                        </button>
                        <button onClick={() => setPending(prev => prev.filter(r => r.id !== req.id))}
                          className="w-9 h-9 rounded-xl flex items-center justify-center hover:opacity-80"
                          style={{ background: "rgba(255,0,0,0.1)", border: "1px solid rgba(255,0,0,0.2)" }}>
                          <Icon name="X" size={15} style={{ color: "#ff4444" }} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}

            {/* Outgoing */}
            <div style={{ ...rF, fontWeight: 600, fontSize: "11px", color: "#6b7fa3", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "10px" }}>Исходящие</div>
            <div className="space-y-2">
              {pending.filter(r => r.direction === "outgoing").map(req => (
                <div key={req.id} className="flex items-center gap-3 p-4 rounded-2xl" style={{ background: "var(--dark-card)", border: "1px solid rgba(255,255,255,0.05)" }}>
                  <div className="w-12 h-12 rounded-full flex items-center justify-center shrink-0" style={{ background: req.color + "22", color: req.color, border: `2px solid ${req.color}33`, ...rF, fontWeight: 800, fontSize: "14px" }}>
                    {req.name.slice(0, 2).toUpperCase()}
                  </div>
                  <div className="flex-1">
                    <div style={{ ...rF, fontWeight: 800, fontSize: "16px", color: req.color }}>{req.name}</div>
                    <div style={{ ...iF, fontSize: "12px", color: "#6b7fa3" }}>Ожидает ответа...</div>
                  </div>
                  <button onClick={() => setPending(prev => prev.filter(r => r.id !== req.id))}
                    className="w-9 h-9 rounded-xl flex items-center justify-center hover:opacity-80"
                    style={{ background: "rgba(255,0,0,0.08)", border: "1px solid rgba(255,0,0,0.15)" }}>
                    <Icon name="X" size={15} style={{ color: "#ff4444" }} />
                  </button>
                </div>
              ))}
              {pending.filter(r => r.direction === "outgoing").length === 0 && (
                <div style={{ ...iF, fontSize: "13px", color: "#374151", padding: "12px" }}>Нет исходящих запросов</div>
              )}
            </div>
          </div>
        )}

        {/* BLOCKED */}
        {section === "blocked" && (
          <div className="flex-1 flex flex-col items-center justify-center gap-3" style={{ background: "var(--dark-bg)" }}>
            <Icon name="UserX" size={44} style={{ color: "#2a3a5c" }} />
            <div style={{ ...rF, fontWeight: 700, fontSize: "18px", color: "#4a5568" }}>Заблокированных нет</div>
            <div style={{ ...iF, fontSize: "13px", color: "#374151" }}>Заблокированные не могут писать тебе</div>
          </div>
        )}
      </div>
    </div>
  );
}
