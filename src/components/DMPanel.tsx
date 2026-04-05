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

interface DMPanelProps {
  user: User;
  onClose: () => void;
}

const MOCK_FRIENDS = [
  { id: 1, name: "CyberWolf", color: "#00ff88", status: "online", game: "Cyber Arena", mutual: 3, avatar: null },
  { id: 2, name: "NeonShadow", color: "#ff00aa", status: "streaming", game: "🔴 В эфире · CS2", mutual: 5, avatar: null },
  { id: 3, name: "PixelKnight", color: "#00aaff", status: "online", game: "VALORANT", mutual: 2, avatar: null },
  { id: 4, name: "GhostRunner", color: "#aa00ff", status: "away", game: "Отошёл", mutual: 7, avatar: null },
  { id: 5, name: "IronCore", color: "#ff6600", status: "dnd", game: "Не беспокоить", mutual: 1, avatar: null },
  { id: 6, name: "StarForge", color: "#ffcc00", status: "offline", game: "", mutual: 4, avatar: null },
  { id: 7, name: "VoidHunter", color: "#00ffff", status: "online", game: "Dota 2", mutual: 6, avatar: null },
  { id: 8, name: "NightCrawler", color: "#ff4444", status: "offline", game: "", mutual: 2, avatar: null },
];

const PENDING_REQUESTS = [
  { id: 9, name: "DarkBlade", color: "#aa00ff", direction: "incoming" },
  { id: 10, name: "XenoStrike", color: "#ff6600", direction: "outgoing" },
];

const STATUS_COLOR: Record<string, string> = {
  online: "#00ff88", streaming: "#ff00aa", away: "#ff6600", dnd: "#ff4444", offline: "#4a5568",
};
const STATUS_LABEL: Record<string, string> = {
  online: "В сети", streaming: "Стримит", away: "Отошёл", dnd: "Не беспокоить", offline: "Не в сети",
};

interface Message {
  id: number;
  from: "me" | "them";
  text: string;
  time: string;
  type?: "call" | "text";
}

const MOCK_MESSAGES: Record<number, Message[]> = {
  1: [
    { id: 1, from: "them", text: "Йо! Готов к рейду?", time: "19:30", type: "text" },
    { id: 2, from: "me", text: "Да, буду онлайн в 21:00", time: "19:31", type: "text" },
    { id: 3, from: "them", text: "Отлично! Я уже в голосовом канале", time: "19:32", type: "text" },
    { id: 4, from: "them", text: "🎯 Пропущенный звонок", time: "19:45", type: "call" },
    { id: 5, from: "me", text: "Сорри, был занят. Звоню?", time: "19:50", type: "text" },
  ],
  2: [
    { id: 1, from: "them", text: "Смотришь мой стрим? 😄", time: "18:00", type: "text" },
    { id: 2, from: "me", text: "Да! Ты топовый, как всегда!", time: "18:02", type: "text" },
  ],
  3: [
    { id: 1, from: "them", text: "Привет! Сыграем в VALORANT?", time: "20:10", type: "text" },
    { id: 2, from: "me", text: "Конечно, создавай лобби", time: "20:11", type: "text" },
  ],
};

type Section = "friends" | "dm" | "pending" | "blocked";

export default function DMPanel({ user, onClose }: DMPanelProps) {
  const [section, setSection] = useState<Section>("friends");
  const [friendFilter, setFriendFilter] = useState<"all" | "online" | "offline">("online");
  const [activeDM, setActiveDM] = useState<number | null>(null);
  const [dmMessages, setDmMessages] = useState(MOCK_MESSAGES);
  const [inputValue, setInputValue] = useState("");
  const [callActive, setCallActive] = useState(false);
  const [callUser, setCallUser] = useState<typeof MOCK_FRIENDS[0] | null>(null);
  const [callMuted, setCallMuted] = useState(false);
  const [callDeaf, setCallDeaf] = useState(false);
  const [callVideo, setCallVideo] = useState(false);
  const [callTimer, setCallTimer] = useState(0);
  const [search, setSearch] = useState("");
  const [addFriendInput, setAddFriendInput] = useState("");
  const [addFriendStatus, setAddFriendStatus] = useState<"idle" | "sent" | "error">("idle");
  const [profileUser, setProfileUser] = useState<typeof MOCK_FRIENDS[0] | null>(null);
  const [friends, setFriends] = useState(MOCK_FRIENDS);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const rF = { fontFamily: "Rajdhani, sans-serif" };
  const iF = { fontFamily: "IBM Plex Sans, sans-serif" };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [activeDM, dmMessages]);

  useEffect(() => {
    if (callActive) {
      timerRef.current = setInterval(() => setCallTimer(t => t + 1), 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
      setCallTimer(0);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [callActive]);

  const formatTime = (s: number) => `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

  const sendMessage = () => {
    if (!inputValue.trim() || !activeDM) return;
    const msg: Message = { id: Date.now(), from: "me", text: inputValue.trim(), time: new Date().toLocaleTimeString("ru", { hour: "2-digit", minute: "2-digit" }), type: "text" };
    setDmMessages(prev => ({ ...prev, [activeDM]: [...(prev[activeDM] || []), msg] }));
    setInputValue("");
  };

  const startCall = (friend: typeof MOCK_FRIENDS[0], video = false) => {
    setCallUser(friend);
    setCallVideo(video);
    setCallActive(true);
    setCallMuted(false);
    setCallDeaf(false);
  };

  const endCall = () => {
    setCallActive(false);
    setCallUser(null);
  };

  const removeFriend = (id: number) => setFriends(prev => prev.filter(f => f.id !== id));

  const sendFriendRequest = () => {
    if (!addFriendInput.trim()) return;
    setAddFriendStatus("sent");
    setTimeout(() => setAddFriendStatus("idle"), 3000);
    setAddFriendInput("");
  };

  const activeFriend = MOCK_FRIENDS.find(f => f.id === activeDM);
  const filteredFriends = friends.filter(f => {
    const matchSearch = f.name.toLowerCase().includes(search.toLowerCase());
    if (friendFilter === "online") return matchSearch && f.status !== "offline";
    if (friendFilter === "offline") return matchSearch && f.status === "offline";
    return matchSearch;
  });

  return (
    <>
      {/* Profile modal */}
      {profileUser && (
        <ProfileModal
          member={{ id: profileUser.id, name: profileUser.name, color: profileUser.color, role: "Боец", roleColor: profileUser.color, status: profileUser.status, avatar: profileUser.name.slice(0, 2).toUpperCase(), game: profileUser.game, mutual: profileUser.mutual }}
          onClose={() => setProfileUser(null)}
          onMessage={() => { setActiveDM(profileUser.id); setSection("dm"); setProfileUser(null); }}
          onCall={() => { startCall(profileUser); setProfileUser(null); }}
        />
      )}

      {/* Active call overlay */}
      {callActive && callUser && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center" style={{ background: "rgba(0,0,0,0.85)" }}>
          <div className="w-80 rounded-2xl overflow-hidden shadow-2xl" style={{ background: "var(--dark-panel)", border: `1px solid ${callUser.color}33` }}>
            <div className="p-6 flex flex-col items-center gap-4">
              {/* Animated avatar */}
              <div className="relative">
                <div className="w-24 h-24 rounded-full flex items-center justify-center" style={{ background: callUser.color + "22", border: `3px solid ${callUser.color}`, boxShadow: `0 0 30px ${callUser.color}44` }}>
                  <span style={{ ...rF, fontWeight: 900, fontSize: "28px", color: callUser.color }}>{callUser.name.slice(0, 2).toUpperCase()}</span>
                </div>
                {!callDeaf && (
                  <div className="absolute -inset-2 rounded-full border-2 animate-ping opacity-30" style={{ borderColor: callUser.color }} />
                )}
              </div>
              <div className="text-center">
                <div style={{ ...rF, fontWeight: 800, fontSize: "22px", color: callUser.color }}>{callUser.name}</div>
                <div className="flex items-center gap-2 justify-center mt-1">
                  {callVideo && <Icon name="Video" size={13} style={{ color: "#aa00ff" }} />}
                  <span style={{ ...iF, fontSize: "13px", color: "#6b7fa3" }}>
                    {callActive ? formatTime(callTimer) : "Вызов..."}
                  </span>
                </div>
              </div>

              {/* Call controls */}
              <div className="flex items-center gap-3">
                <button onClick={() => setCallMuted(v => !v)} className="w-12 h-12 rounded-full flex items-center justify-center transition-all hover:scale-110"
                  style={{ background: callMuted ? "rgba(255,68,68,0.2)" : "rgba(255,255,255,0.1)", border: `1px solid ${callMuted ? "#ff444444" : "rgba(255,255,255,0.15)"}` }} title={callMuted ? "Включить микрофон" : "Выключить микрофон"}>
                  <Icon name={callMuted ? "MicOff" : "Mic"} size={20} style={{ color: callMuted ? "#ff4444" : "#e2e8f0" }} />
                </button>
                <button onClick={endCall} className="w-14 h-14 rounded-full flex items-center justify-center transition-all hover:scale-110 hover:brightness-110"
                  style={{ background: "#ff4444", boxShadow: "0 0 20px rgba(255,68,68,0.4)" }} title="Завершить звонок">
                  <Icon name="PhoneOff" size={22} style={{ color: "#fff" }} />
                </button>
                <button onClick={() => setCallDeaf(v => !v)} className="w-12 h-12 rounded-full flex items-center justify-center transition-all hover:scale-110"
                  style={{ background: callDeaf ? "rgba(255,68,68,0.2)" : "rgba(255,255,255,0.1)", border: `1px solid ${callDeaf ? "#ff444444" : "rgba(255,255,255,0.15)"}` }} title={callDeaf ? "Включить звук" : "Заглушить"}>
                  <Icon name={callDeaf ? "VolumeX" : "Volume2"} size={20} style={{ color: callDeaf ? "#ff4444" : "#e2e8f0" }} />
                </button>
              </div>

              {callVideo && (
                <div className="w-full h-32 rounded-xl flex items-center justify-center" style={{ background: "rgba(170,0,255,0.08)", border: "1px solid rgba(170,0,255,0.2)" }}>
                  <div className="flex flex-col items-center gap-2">
                    <Icon name="VideoOff" size={28} style={{ color: "#aa00ff" }} />
                    <span style={{ ...rF, fontWeight: 600, fontSize: "12px", color: "#6b7fa3" }}>Видео-звонок · HD</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Main DM Panel */}
      <div className="fixed inset-0 z-50 flex animate-fade-in" style={{ background: "rgba(0,0,0,0.7)" }} onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
        <div className="flex w-full max-w-4xl mx-auto my-6 rounded-2xl overflow-hidden shadow-2xl" style={{ background: "var(--dark-bg)", border: "1px solid rgba(0,170,255,0.15)" }}>

          {/* Left sidebar */}
          <div className="w-64 shrink-0 flex flex-col" style={{ background: "#060a11", borderRight: "1px solid rgba(0,170,255,0.08)" }}>
            {/* Header */}
            <div className="px-4 py-4 flex items-center justify-between" style={{ borderBottom: "1px solid rgba(0,170,255,0.08)" }}>
              <div>
                <div style={{ ...rF, fontWeight: 800, fontSize: "14px", color: "#00aaff" }}>Личные сообщения</div>
                <div style={{ ...iF, fontSize: "11px", color: "#6b7fa3", marginTop: "1px" }}>{friends.filter(f => f.status !== "offline").length} онлайн</div>
              </div>
              <button onClick={onClose} className="w-7 h-7 rounded-lg flex items-center justify-center hover:opacity-70 transition-opacity" style={{ background: "rgba(255,255,255,0.05)" }}>
                <Icon name="X" size={14} style={{ color: "#6b7fa3" }} />
              </button>
            </div>

            {/* Nav */}
            <div className="px-2 py-2 space-y-0.5">
              {[
                { id: "friends" as Section, icon: "Users", label: "Друзья", badge: 0 },
                { id: "pending" as Section, icon: "UserPlus", label: "Запросы", badge: PENDING_REQUESTS.filter(r => r.direction === "incoming").length },
                { id: "blocked" as Section, icon: "UserX", label: "Заблокированные", badge: 0 },
              ].map(item => (
                <button key={item.id} onClick={() => setSection(item.id)} className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl transition-all text-left"
                  style={{ background: section === item.id ? "rgba(0,170,255,0.12)" : "transparent", color: section === item.id ? "#00aaff" : "#6b7fa3", boxShadow: section === item.id ? "inset 3px 0 0 #00aaff" : "none" }}>
                  <Icon name={item.icon} size={15} />
                  <span style={{ ...rF, fontWeight: 700, fontSize: "13px", flex: 1 }}>{item.label}</span>
                  {item.badge > 0 && <span className="w-5 h-5 rounded-full flex items-center justify-center" style={{ background: "#ff4444", color: "#fff", fontSize: "10px", fontWeight: 700 }}>{item.badge}</span>}
                </button>
              ))}
            </div>

            <div className="h-px mx-3 my-1" style={{ background: "rgba(255,255,255,0.06)" }} />

            {/* DM list */}
            <div className="px-3 py-2">
              <div style={{ ...rF, fontWeight: 600, fontSize: "10px", color: "#4a5568", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "6px" }}>Сообщения</div>
              <div className="space-y-0.5 overflow-y-auto" style={{ maxHeight: "280px" }}>
                {friends.filter(f => dmMessages[f.id]).map(friend => (
                  <button key={friend.id} onClick={() => { setActiveDM(friend.id); setSection("dm"); }}
                    className="w-full flex items-center gap-2.5 px-2 py-2 rounded-xl transition-all text-left"
                    style={{ background: activeDM === friend.id && section === "dm" ? friend.color + "15" : "transparent", border: activeDM === friend.id && section === "dm" ? `1px solid ${friend.color}22` : "1px solid transparent" }}>
                    <div className="relative shrink-0">
                      <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: friend.color + "22", color: friend.color, border: `1px solid ${friend.color}33`, ...rF, fontWeight: 700, fontSize: "11px" }}>
                        {friend.name.slice(0, 2).toUpperCase()}
                      </div>
                      <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2" style={{ background: STATUS_COLOR[friend.status], borderColor: "#060a11" }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div style={{ ...rF, fontWeight: 700, fontSize: "13px", color: activeDM === friend.id ? friend.color : "#c8d6e8", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{friend.name}</div>
                      <div style={{ ...iF, fontSize: "10px", color: "#6b7fa3", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {(dmMessages[friend.id] || []).slice(-1)[0]?.text || "Нет сообщений"}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* My profile at bottom */}
            <div className="mt-auto px-3 py-3" style={{ borderTop: "1px solid rgba(0,170,255,0.08)" }}>
              <div className="flex items-center gap-2 px-2 py-1.5 rounded-xl" style={{ background: "rgba(0,170,255,0.06)" }}>
                <div className="w-7 h-7 rounded-full flex items-center justify-center" style={{ background: user.avatar_color + "33", color: user.avatar_color, border: `1px solid ${user.avatar_color}44`, ...rF, fontWeight: 700, fontSize: "10px" }}>
                  {user.username.slice(0, 2).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div style={{ ...rF, fontWeight: 700, fontSize: "12px", color: user.avatar_color, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{user.username}</div>
                  <div style={{ ...iF, fontSize: "10px", color: "#6b7fa3" }}>Online</div>
                </div>
              </div>
            </div>
          </div>

          {/* Right content */}
          <div className="flex-1 flex flex-col min-w-0">

            {/* FRIENDS */}
            {section === "friends" && (
              <div className="flex-1 flex flex-col overflow-hidden">
                {/* Header */}
                <div className="px-5 py-4 flex items-center gap-3 shrink-0" style={{ borderBottom: "1px solid rgba(0,170,255,0.08)" }}>
                  <Icon name="Users" size={18} style={{ color: "#00aaff" }} />
                  <span style={{ ...rF, fontWeight: 700, fontSize: "16px", color: "#e2e8f0" }}>Друзья</span>
                  <div className="flex gap-1 ml-4">
                    {(["online", "all", "offline"] as const).map(f => (
                      <button key={f} onClick={() => setFriendFilter(f)} className="px-3 py-1 rounded-lg transition-all"
                        style={{ background: friendFilter === f ? "rgba(0,170,255,0.15)" : "rgba(255,255,255,0.05)", color: friendFilter === f ? "#00aaff" : "#6b7fa3", border: friendFilter === f ? "1px solid rgba(0,170,255,0.3)" : "1px solid transparent", ...rF, fontWeight: 700, fontSize: "12px" }}>
                        {f === "online" ? "Онлайн" : f === "all" ? "Все" : "Офлайн"}
                      </button>
                    ))}
                  </div>
                  <button onClick={() => setSection("pending")} className="ml-auto flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition-all hover:opacity-80"
                    style={{ background: "rgba(0,255,136,0.1)", color: "#00ff88", border: "1px solid rgba(0,255,136,0.25)", ...rF, fontWeight: 700, fontSize: "12px" }}>
                    <Icon name="UserPlus" size={13} /> Добавить
                  </button>
                </div>

                {/* Search */}
                <div className="px-5 py-3 shrink-0">
                  <div className="flex items-center gap-2 px-3 py-2 rounded-xl" style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}>
                    <Icon name="Search" size={14} style={{ color: "#6b7fa3" }} />
                    <input className="flex-1 bg-transparent outline-none text-sm" placeholder="Поиск друзей..." value={search} onChange={e => setSearch(e.target.value)}
                      style={{ color: "#e2e8f0", ...iF }} />
                  </div>
                </div>

                {/* Friends list */}
                <div className="flex-1 overflow-y-auto px-5 pb-4">
                  <div style={{ ...rF, fontWeight: 600, fontSize: "11px", color: "#6b7fa3", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "10px" }}>
                    {friendFilter === "online" ? `В сети — ${filteredFriends.length}` : `Всего — ${filteredFriends.length}`}
                  </div>
                  <div className="space-y-1">
                    {filteredFriends.map(friend => (
                      <div key={friend.id} className="flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all group"
                        style={{ background: "var(--dark-card)", border: "1px solid rgba(255,255,255,0.04)" }}
                        onMouseEnter={e => (e.currentTarget.style.borderColor = friend.color + "22")}
                        onMouseLeave={e => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.04)")}>
                        {/* Avatar */}
                        <div className="relative shrink-0 cursor-pointer" onClick={() => setProfileUser(friend)}>
                          <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: friend.color + "22", color: friend.color, border: `2px solid ${friend.color}33`, ...rF, fontWeight: 700, fontSize: "13px" }}>
                            {friend.name.slice(0, 2).toUpperCase()}
                          </div>
                          <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2" style={{ background: STATUS_COLOR[friend.status], borderColor: "var(--dark-card)" }} />
                        </div>
                        {/* Info */}
                        <div className="flex-1 min-w-0 cursor-pointer" onClick={() => setProfileUser(friend)}>
                          <div style={{ ...rF, fontWeight: 700, fontSize: "15px", color: friend.color }}>{friend.name}</div>
                          <div style={{ ...iF, fontSize: "12px", color: "#6b7fa3" }}>
                            {friend.status === "streaming" ? <span style={{ color: "#ff00aa" }}>{friend.game}</span> : friend.game || STATUS_LABEL[friend.status]}
                          </div>
                        </div>
                        {/* Actions */}
                        <div className="flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => { setActiveDM(friend.id); setSection("dm"); }} title="Написать сообщение"
                            className="w-8 h-8 rounded-xl flex items-center justify-center transition-all hover:scale-110"
                            style={{ background: "rgba(0,170,255,0.12)", border: "1px solid rgba(0,170,255,0.25)" }}>
                            <Icon name="MessageCircle" size={15} style={{ color: "#00aaff" }} />
                          </button>
                          <button onClick={() => startCall(friend)} title="Голосовой звонок"
                            className="w-8 h-8 rounded-xl flex items-center justify-center transition-all hover:scale-110"
                            style={{ background: "rgba(0,255,136,0.12)", border: "1px solid rgba(0,255,136,0.25)" }}>
                            <Icon name="Phone" size={15} style={{ color: "#00ff88" }} />
                          </button>
                          <button onClick={() => startCall(friend, true)} title="Видеозвонок"
                            className="w-8 h-8 rounded-xl flex items-center justify-center transition-all hover:scale-110"
                            style={{ background: "rgba(170,0,255,0.12)", border: "1px solid rgba(170,0,255,0.25)" }}>
                            <Icon name="Video" size={15} style={{ color: "#aa00ff" }} />
                          </button>
                          <button onClick={() => setProfileUser(friend)} title="Профиль"
                            className="w-8 h-8 rounded-xl flex items-center justify-center transition-all hover:scale-110"
                            style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.08)" }}>
                            <Icon name="UserCircle" size={15} style={{ color: "#6b7fa3" }} />
                          </button>
                          <button onClick={() => removeFriend(friend.id)} title="Удалить из друзей"
                            className="w-8 h-8 rounded-xl flex items-center justify-center transition-all hover:scale-110"
                            style={{ background: "rgba(255,0,0,0.06)", border: "1px solid rgba(255,0,0,0.1)" }}>
                            <Icon name="UserMinus" size={15} style={{ color: "#ff4444" }} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* DM CHAT */}
            {section === "dm" && activeDM && activeFriend && (
              <div className="flex-1 flex flex-col overflow-hidden">
                {/* DM Header */}
                <div className="px-4 py-3 flex items-center gap-3 shrink-0" style={{ borderBottom: "1px solid rgba(0,170,255,0.08)", background: "var(--dark-panel)" }}>
                  <div className="relative cursor-pointer" onClick={() => setProfileUser(activeFriend)}>
                    <div className="w-9 h-9 rounded-full flex items-center justify-center" style={{ background: activeFriend.color + "22", color: activeFriend.color, border: `2px solid ${activeFriend.color}44`, ...rF, fontWeight: 700, fontSize: "12px" }}>
                      {activeFriend.name.slice(0, 2).toUpperCase()}
                    </div>
                    <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2" style={{ background: STATUS_COLOR[activeFriend.status], borderColor: "var(--dark-panel)" }} />
                  </div>
                  <div className="flex-1 cursor-pointer" onClick={() => setProfileUser(activeFriend)}>
                    <div style={{ ...rF, fontWeight: 700, fontSize: "15px", color: activeFriend.color }}>{activeFriend.name}</div>
                    <div style={{ ...iF, fontSize: "11px", color: "#6b7fa3" }}>{STATUS_LABEL[activeFriend.status]}{activeFriend.game ? ` · ${activeFriend.game}` : ""}</div>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => startCall(activeFriend)} className="w-8 h-8 rounded-xl flex items-center justify-center hover:opacity-80 transition-all"
                      style={{ background: "rgba(0,255,136,0.1)", border: "1px solid rgba(0,255,136,0.25)" }} title="Голосовой звонок">
                      <Icon name="Phone" size={15} style={{ color: "#00ff88" }} />
                    </button>
                    <button onClick={() => startCall(activeFriend, true)} className="w-8 h-8 rounded-xl flex items-center justify-center hover:opacity-80 transition-all"
                      style={{ background: "rgba(170,0,255,0.1)", border: "1px solid rgba(170,0,255,0.25)" }} title="Видеозвонок">
                      <Icon name="Video" size={15} style={{ color: "#aa00ff" }} />
                    </button>
                    <button onClick={() => setProfileUser(activeFriend)} className="w-8 h-8 rounded-xl flex items-center justify-center hover:opacity-80 transition-all"
                      style={{ background: "rgba(255,255,255,0.05)" }} title="Профиль">
                      <Icon name="UserCircle" size={15} style={{ color: "#6b7fa3" }} />
                    </button>
                  </div>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
                  <div className="flex flex-col items-center mb-6 gap-2">
                    <div className="w-16 h-16 rounded-full flex items-center justify-center" style={{ background: activeFriend.color + "22", color: activeFriend.color, border: `3px solid ${activeFriend.color}44`, ...rF, fontWeight: 900, fontSize: "20px" }}>
                      {activeFriend.name.slice(0, 2).toUpperCase()}
                    </div>
                    <div style={{ ...rF, fontWeight: 800, fontSize: "18px", color: activeFriend.color }}>{activeFriend.name}</div>
                    <div style={{ ...iF, fontSize: "12px", color: "#6b7fa3" }}>Начало личной переписки</div>
                  </div>
                  {(dmMessages[activeDM] || []).map(msg => (
                    <div key={msg.id} className={`flex ${msg.from === "me" ? "justify-end" : "justify-start"} gap-2`}>
                      {msg.from === "them" && (
                        <div className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-1" style={{ background: activeFriend.color + "22", color: activeFriend.color, ...rF, fontWeight: 700, fontSize: "9px" }}>
                          {activeFriend.name.slice(0, 2).toUpperCase()}
                        </div>
                      )}
                      {msg.type === "call" ? (
                        <div className="flex items-center gap-2 px-4 py-2.5 rounded-2xl" style={{ background: msg.from === "me" ? "rgba(0,255,136,0.1)" : "rgba(255,100,0,0.1)", border: `1px solid ${msg.from === "me" ? "rgba(0,255,136,0.2)" : "rgba(255,100,0,0.2)"}` }}>
                          <Icon name={msg.from === "me" ? "Phone" : "PhoneMissed"} size={14} style={{ color: msg.from === "me" ? "#00ff88" : "#ff6600" }} />
                          <span style={{ ...rF, fontWeight: 600, fontSize: "13px", color: msg.from === "me" ? "#00ff88" : "#ff6600" }}>{msg.text}</span>
                          <span style={{ ...iF, fontSize: "11px", color: "#6b7fa3" }}>{msg.time}</span>
                        </div>
                      ) : (
                        <div className="max-w-xs">
                          <div className="px-4 py-2.5 rounded-2xl" style={{
                            background: msg.from === "me" ? "linear-gradient(135deg, rgba(0,170,255,0.25), rgba(0,170,255,0.15))" : "rgba(255,255,255,0.06)",
                            border: `1px solid ${msg.from === "me" ? "rgba(0,170,255,0.3)" : "rgba(255,255,255,0.08)"}`,
                            borderBottomRightRadius: msg.from === "me" ? "4px" : undefined,
                            borderBottomLeftRadius: msg.from === "them" ? "4px" : undefined,
                          }}>
                            <div style={{ ...iF, fontSize: "14px", color: "#e2e8f0" }}>{msg.text}</div>
                          </div>
                          <div style={{ ...iF, fontSize: "10px", color: "#4a5568", marginTop: "2px", textAlign: msg.from === "me" ? "right" : "left" }}>{msg.time}</div>
                        </div>
                      )}
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>

                {/* Input */}
                <div className="px-4 pb-4 pt-2 shrink-0">
                  <div className="flex items-center gap-2 px-4 py-2.5 rounded-2xl" style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(0,170,255,0.15)" }}>
                    <button className="w-7 h-7 rounded-lg flex items-center justify-center hover:opacity-70 transition-opacity" style={{ background: "rgba(255,255,255,0.05)" }}>
                      <Icon name="Plus" size={14} style={{ color: "#6b7fa3" }} />
                    </button>
                    <input className="flex-1 bg-transparent outline-none text-sm" placeholder={`Написать ${activeFriend.name}...`} value={inputValue}
                      onChange={e => setInputValue(e.target.value)} onKeyDown={e => e.key === "Enter" && sendMessage()}
                      style={{ color: "#e2e8f0", ...iF }} />
                    <button className="w-7 h-7 rounded-lg flex items-center justify-center hover:opacity-70 transition-opacity" style={{ background: "rgba(255,255,255,0.05)" }}>
                      <Icon name="Smile" size={14} style={{ color: "#6b7fa3" }} />
                    </button>
                    <button onClick={sendMessage} className="w-7 h-7 rounded-xl flex items-center justify-center transition-all hover:scale-110" style={{ background: "rgba(0,170,255,0.2)", border: "1px solid rgba(0,170,255,0.3)" }}>
                      <Icon name="Send" size={13} style={{ color: "#00aaff" }} />
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* DM — no conversation selected */}
            {section === "dm" && !activeDM && (
              <div className="flex-1 flex flex-col items-center justify-center gap-4">
                <Icon name="MessageCircle" size={48} style={{ color: "#2a3a5c" }} />
                <div style={{ ...rF, fontWeight: 700, fontSize: "18px", color: "#4a5568" }}>Выберите диалог</div>
                <div style={{ ...iF, fontSize: "13px", color: "#374151" }}>или найдите друга в списке</div>
              </div>
            )}

            {/* PENDING */}
            {section === "pending" && (
              <div className="flex-1 overflow-y-auto p-5">
                <h2 style={{ ...rF, fontWeight: 700, fontSize: "18px", color: "#e2e8f0", marginBottom: "4px" }}>Запросы в друзья</h2>
                <p style={{ ...iF, fontSize: "13px", color: "#6b7fa3", marginBottom: "16px" }}>Входящие и исходящие запросы</p>

                {/* Add friend input */}
                <div className="p-4 rounded-2xl mb-5" style={{ background: "var(--dark-card)", border: "1px solid rgba(0,255,136,0.12)" }}>
                  <div style={{ ...rF, fontWeight: 700, fontSize: "14px", color: "#e2e8f0", marginBottom: "8px" }}>Добавить друга</div>
                  <div style={{ ...iF, fontSize: "12px", color: "#6b7fa3", marginBottom: "10px" }}>Введи имя пользователя чтобы отправить запрос</div>
                  <div className="flex gap-2">
                    <div className="flex-1 flex items-center gap-2 px-3 py-2.5 rounded-xl" style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(0,255,136,0.2)" }}>
                      <Icon name="AtSign" size={14} style={{ color: "#6b7fa3" }} />
                      <input className="flex-1 bg-transparent outline-none text-sm" placeholder="NickName#0000" value={addFriendInput} onChange={e => setAddFriendInput(e.target.value)} onKeyDown={e => e.key === "Enter" && sendFriendRequest()}
                        style={{ color: "#e2e8f0", ...iF }} />
                    </div>
                    <button onClick={sendFriendRequest} className="px-4 py-2.5 rounded-xl transition-all hover:opacity-90"
                      style={{ background: "rgba(0,255,136,0.15)", color: "#00ff88", border: "1px solid rgba(0,255,136,0.3)", ...rF, fontWeight: 700, fontSize: "13px" }}>
                      Отправить
                    </button>
                  </div>
                  {addFriendStatus === "sent" && (
                    <div className="flex items-center gap-2 mt-2 animate-fade-in" style={{ color: "#00ff88", ...iF, fontSize: "12px" }}>
                      <Icon name="Check" size={13} /> Запрос отправлен!
                    </div>
                  )}
                </div>

                {PENDING_REQUESTS.filter(r => r.direction === "incoming").length > 0 && (
                  <>
                    <div style={{ ...rF, fontWeight: 600, fontSize: "11px", color: "#6b7fa3", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "8px" }}>Входящие — {PENDING_REQUESTS.filter(r => r.direction === "incoming").length}</div>
                    <div className="space-y-2 mb-5">
                      {PENDING_REQUESTS.filter(r => r.direction === "incoming").map(req => (
                        <div key={req.id} className="flex items-center gap-3 p-3 rounded-xl" style={{ background: "var(--dark-card)", border: "1px solid rgba(0,255,136,0.12)" }}>
                          <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0" style={{ background: req.color + "22", color: req.color, border: `1px solid ${req.color}33`, ...rF, fontWeight: 700, fontSize: "13px" }}>
                            {req.name.slice(0, 2).toUpperCase()}
                          </div>
                          <div className="flex-1">
                            <div style={{ ...rF, fontWeight: 700, fontSize: "15px", color: "#e2e8f0" }}>{req.name}</div>
                            <div style={{ ...iF, fontSize: "12px", color: "#6b7fa3" }}>Хочет добавить тебя в друзья</div>
                          </div>
                          <div className="flex gap-2">
                            <button className="w-8 h-8 rounded-xl flex items-center justify-center hover:opacity-80" style={{ background: "rgba(0,255,136,0.15)", border: "1px solid rgba(0,255,136,0.3)" }}>
                              <Icon name="Check" size={15} style={{ color: "#00ff88" }} />
                            </button>
                            <button className="w-8 h-8 rounded-xl flex items-center justify-center hover:opacity-80" style={{ background: "rgba(255,0,0,0.1)", border: "1px solid rgba(255,0,0,0.2)" }}>
                              <Icon name="X" size={15} style={{ color: "#ff4444" }} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                )}

                <div style={{ ...rF, fontWeight: 600, fontSize: "11px", color: "#6b7fa3", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "8px" }}>Исходящие</div>
                <div className="space-y-2">
                  {PENDING_REQUESTS.filter(r => r.direction === "outgoing").map(req => (
                    <div key={req.id} className="flex items-center gap-3 p-3 rounded-xl" style={{ background: "var(--dark-card)", border: "1px solid rgba(255,255,255,0.05)" }}>
                      <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0" style={{ background: req.color + "22", color: req.color, border: `1px solid ${req.color}33`, ...rF, fontWeight: 700, fontSize: "13px" }}>
                        {req.name.slice(0, 2).toUpperCase()}
                      </div>
                      <div className="flex-1">
                        <div style={{ ...rF, fontWeight: 700, fontSize: "15px", color: "#e2e8f0" }}>{req.name}</div>
                        <div style={{ ...iF, fontSize: "12px", color: "#6b7fa3" }}>Ожидает ответа</div>
                      </div>
                      <button className="w-8 h-8 rounded-xl flex items-center justify-center hover:opacity-80" style={{ background: "rgba(255,0,0,0.08)", border: "1px solid rgba(255,0,0,0.15)" }}>
                        <Icon name="X" size={15} style={{ color: "#ff4444" }} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* BLOCKED */}
            {section === "blocked" && (
              <div className="flex-1 flex flex-col items-center justify-center gap-3">
                <Icon name="UserX" size={40} style={{ color: "#2a3a5c" }} />
                <div style={{ ...rF, fontWeight: 700, fontSize: "16px", color: "#4a5568" }}>Список заблокированных пуст</div>
                <div style={{ ...iF, fontSize: "13px", color: "#374151" }}>Заблокированные пользователи не могут писать тебе</div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
