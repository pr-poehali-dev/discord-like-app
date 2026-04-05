import { useState } from "react";
import Icon from "@/components/ui/icon";

const SERVERS = [
  { id: 1, name: "NEXUS", abbr: "NX", color: "#00ff88", members: 1247, unread: 3 },
  { id: 2, name: "VOID SQUAD", abbr: "VS", color: "#ff00aa", members: 834, unread: 12 },
  { id: 3, name: "CYBER GUILD", abbr: "CG", color: "#00aaff", members: 2103, unread: 0 },
  { id: 4, name: "DARK MATTER", abbr: "DM", color: "#ff6600", members: 456, unread: 1 },
  { id: 5, name: "ALPHA TEAM", abbr: "AT", color: "#aa00ff", members: 189, unread: 0 },
];

const CHANNELS = {
  text: [
    { id: 1, name: "общий", unread: 5, pinned: true },
    { id: 2, name: "игры", unread: 0 },
    { id: 3, name: "стратегии", unread: 2 },
    { id: 4, name: "объявления", unread: 0, locked: true },
    { id: 5, name: "медиа", unread: 0 },
  ],
  voice: [
    { id: 6, name: "Арена #1", users: 3, streaming: true },
    { id: 7, name: "Арена #2", users: 0, streaming: false },
    { id: 8, name: "Штаб командира", users: 1, streaming: false },
  ],
  forum: [
    { id: 9, name: "тактики", posts: 47 },
    { id: 10, name: "рекруты", posts: 12 },
  ]
};

const INITIAL_MESSAGES = [
  {
    id: 1, user: "CyberWolf", avatar: "CW", color: "#00ff88", role: "Admin",
    roleColor: "#00ff88", time: "19:42",
    text: "Всем привет! Сегодня в 21:00 рейд на третью зону. Нужны все доступные бойцы.",
    reactions: [{ emoji: "🔥", count: 12 }, { emoji: "⚔️", count: 8 }]
  },
  {
    id: 2, user: "NeonShadow", avatar: "NS", color: "#ff00aa", role: "Mod",
    roleColor: "#ff00aa", time: "19:44",
    text: "Готов! Буду стримить для тех кто не успеет. Подключайтесь к Арена #1",
    reactions: [{ emoji: "👀", count: 5 }]
  },
  {
    id: 3, user: "PixelKnight", avatar: "PK", color: "#00aaff", role: "Боец",
    roleColor: "#00aaff", time: "19:47",
    text: "Тактика как в прошлый раз или меняем подход? У меня есть идея насчёт фланговой атаки",
    reactions: []
  },
  {
    id: 4, user: "GhostRunner", avatar: "GR", color: "#aa00ff", role: "Разведчик",
    roleColor: "#aa00ff", time: "19:51",
    text: "Флаг поддерживаю. Прошлый раз лобовая атака стоила нам 40 минут. Нужна скорость.",
    reactions: [{ emoji: "💡", count: 9 }, { emoji: "✅", count: 14 }]
  },
  {
    id: 5, user: "CyberWolf", avatar: "CW", color: "#00ff88", role: "Admin",
    roleColor: "#00ff88", time: "19:53",
    text: "Принято. GhostRunner ведёт разведку, PixelKnight командует флангом. Остальные — основная группа. Брифинг в 20:45.",
    reactions: [{ emoji: "🎯", count: 17 }]
  },
];

const MEMBERS = [
  { id: 1, name: "CyberWolf", role: "Admin", roleColor: "#00ff88", status: "online", avatar: "CW", game: "Cyber Arena" },
  { id: 2, name: "NeonShadow", role: "Mod", roleColor: "#ff00aa", status: "streaming", avatar: "NS", game: "🔴 В эфире" },
  { id: 3, name: "PixelKnight", role: "Боец", roleColor: "#00aaff", status: "online", avatar: "PK", game: "Cyber Arena" },
  { id: 4, name: "GhostRunner", role: "Разведчик", roleColor: "#aa00ff", status: "online", avatar: "GR", game: "Cyber Arena" },
  { id: 5, name: "IronCore", role: "Боец", roleColor: "#00aaff", status: "away", avatar: "IC", game: "Away" },
  { id: 6, name: "VoidHunter", role: "Рекрут", roleColor: "#6b7fa3", status: "online", avatar: "VH", game: "Lobby" },
  { id: 7, name: "StarForge", role: "Рекрут", roleColor: "#6b7fa3", status: "offline", avatar: "SF", game: "" },
  { id: 8, name: "NightCrawler", role: "Рекрут", roleColor: "#6b7fa3", status: "offline", avatar: "NC", game: "" },
];

const ROLES = [
  { id: 1, name: "Admin", color: "#00ff88", members: 1, perms: ["Все права", "Управление сервером", "Бан/Кик"] },
  { id: 2, name: "Mod", color: "#ff00aa", members: 2, perms: ["Управление каналами", "Удаление сообщений", "Тайм-аут"] },
  { id: 3, name: "Боец", color: "#00aaff", members: 48, perms: ["Голосовой чат", "Стриминг", "Прикреплять файлы"] },
  { id: 4, name: "Разведчик", color: "#aa00ff", members: 15, perms: ["Голосовой чат", "Стриминг", "Специальные каналы"] },
  { id: 5, name: "Рекрут", color: "#6b7fa3", members: 234, perms: ["Чтение каналов", "Текстовый чат"] },
];

type Tab = "chat" | "streaming" | "users" | "roles" | "settings";

export default function Index() {
  const [activeServer, setActiveServer] = useState(1);
  const [activeChannel, setActiveChannel] = useState(1);
  const [activeTab, setActiveTab] = useState<Tab>("chat");
  const [inputValue, setInputValue] = useState("");
  const [expandText, setExpandText] = useState(true);
  const [expandVoice, setExpandVoice] = useState(true);
  const [expandForum, setExpandForum] = useState(false);
  const [streamActive, setStreamActive] = useState(false);
  const [messages, setMessages] = useState(INITIAL_MESSAGES);

  const server = SERVERS.find(s => s.id === activeServer)!;
  const channel = CHANNELS.text.find(c => c.id === activeChannel) || CHANNELS.text[0];

  const sendMessage = () => {
    if (!inputValue.trim()) return;
    setMessages(prev => [...prev, {
      id: prev.length + 1,
      user: "Вы",
      avatar: "ВЫ",
      color: "#00ff88",
      role: "Admin",
      roleColor: "#00ff88",
      time: new Date().toLocaleTimeString("ru", { hour: "2-digit", minute: "2-digit" }),
      text: inputValue,
      reactions: []
    }]);
    setInputValue("");
  };

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: "var(--dark-bg)", fontFamily: "IBM Plex Sans, sans-serif" }}>

      {/* Servers sidebar */}
      <div className="flex flex-col items-center py-4 gap-2 w-[68px] shrink-0" style={{ background: "#060a11", borderRight: "1px solid rgba(0,255,136,0.08)" }}>
        <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-2 cursor-pointer" style={{ background: "linear-gradient(135deg, #00ff88, #00aaff)" }}>
          <span style={{ fontFamily: "Orbitron, sans-serif", fontSize: "11px", fontWeight: 900, color: "#060a11" }}>NX</span>
        </div>
        <div className="w-6 h-px mb-1" style={{ background: "rgba(0,255,136,0.2)" }} />

        {SERVERS.map(srv => (
          <div key={srv.id} className="relative group" onClick={() => setActiveServer(srv.id)}>
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center cursor-pointer transition-all duration-200"
              style={{
                fontFamily: "Rajdhani, sans-serif", fontWeight: 700, fontSize: "12px",
                background: activeServer === srv.id ? srv.color + "22" : "#0d1424",
                border: activeServer === srv.id ? `1px solid ${srv.color}` : "1px solid rgba(255,255,255,0.06)",
                color: activeServer === srv.id ? srv.color : "#6b7fa3",
                boxShadow: activeServer === srv.id ? `0 0 12px ${srv.color}44` : "none",
                transform: activeServer === srv.id ? "scale(1.05)" : "scale(1)"
              }}
            >
              {srv.abbr}
            </div>
            {srv.unread > 0 && (
              <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center text-white font-bold" style={{ background: "#ff00aa", fontSize: "9px", boxShadow: "0 0 6px #ff00aa" }}>
                {srv.unread}
              </div>
            )}
            <div className="absolute left-12 rounded-lg px-2 py-1 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 whitespace-nowrap" style={{ background: "#111a2e", color: "#e2e8f0", border: "1px solid rgba(0,255,136,0.2)", fontSize: "12px", fontFamily: "Rajdhani, sans-serif", fontWeight: 600 }}>
              {srv.name}
            </div>
          </div>
        ))}

        <div className="mt-auto">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center cursor-pointer hover:opacity-80 transition-opacity" style={{ background: "#0d1424", border: "1px dashed rgba(0,255,136,0.3)" }}>
            <Icon name="Plus" size={16} style={{ color: "#00ff88" }} />
          </div>
        </div>
      </div>

      {/* Channels panel */}
      <div className="flex flex-col w-[220px] shrink-0" style={{ background: "var(--dark-panel)", borderRight: "1px solid rgba(0,255,136,0.08)" }}>
        {/* Server header */}
        <div className="px-3 py-3 flex items-center justify-between cursor-pointer hover:opacity-90 transition-all" style={{ borderBottom: "1px solid rgba(0,255,136,0.1)" }}>
          <div>
            <div style={{ fontFamily: "Orbitron, sans-serif", fontWeight: 700, fontSize: "13px", color: server.color, textShadow: `0 0 8px ${server.color}88`, letterSpacing: "1px" }}>
              {server.name}
            </div>
            <div style={{ fontSize: "11px", color: "#6b7fa3", marginTop: "2px" }}>{server.members.toLocaleString()} участников</div>
          </div>
          <Icon name="ChevronDown" size={14} style={{ color: "#6b7fa3" }} />
        </div>

        {/* Nav tabs */}
        <div className="flex gap-1 px-2 py-2">
          {([
            { tab: "chat", icon: "MessageSquare", label: "Чат" },
            { tab: "users", icon: "Users", label: "Люди" },
            { tab: "roles", icon: "Shield", label: "Роли" },
            { tab: "settings", icon: "Settings", label: "Настр." },
          ] as { tab: Tab; icon: string; label: string }[]).map(item => (
            <button
              key={item.tab}
              onClick={() => setActiveTab(item.tab)}
              className="flex-1 flex flex-col items-center gap-0.5 py-1.5 rounded-lg transition-all duration-200"
              style={{
                background: activeTab === item.tab ? "rgba(0,255,136,0.12)" : "transparent",
                color: activeTab === item.tab ? "#00ff88" : "#6b7fa3",
              }}
              title={item.label}
            >
              <Icon name={item.icon} size={13} />
              <span style={{ fontSize: "9px", fontFamily: "Rajdhani, sans-serif", fontWeight: 600 }}>{item.label}</span>
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto px-2 pb-2">
          {/* Text channels */}
          <div className="mb-2">
            <button className="flex items-center gap-1 w-full px-1 py-1 mb-1" onClick={() => setExpandText(v => !v)}>
              <Icon name={expandText ? "ChevronDown" : "ChevronRight"} size={11} style={{ color: "#6b7fa3" }} />
              <span style={{ fontFamily: "Rajdhani, sans-serif", fontWeight: 600, fontSize: "10px", color: "#6b7fa3", textTransform: "uppercase", letterSpacing: "1px" }}>Текстовые</span>
            </button>
            {expandText && CHANNELS.text.map(ch => (
              <button
                key={ch.id}
                onClick={() => { setActiveChannel(ch.id); setActiveTab("chat"); }}
                className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg mb-0.5 transition-all duration-150 text-left"
                style={{
                  background: activeChannel === ch.id && activeTab === "chat" ? "rgba(0,255,136,0.1)" : "transparent",
                  boxShadow: activeChannel === ch.id && activeTab === "chat" ? "inset 3px 0 0 #00ff88" : "none",
                }}
              >
                <Icon name={ch.locked ? "Lock" : "Hash"} size={13} style={{ color: activeChannel === ch.id && activeTab === "chat" ? "#00ff88" : "#6b7fa3" }} />
                <span className="flex-1 text-sm" style={{ fontFamily: "IBM Plex Sans, sans-serif", color: activeChannel === ch.id && activeTab === "chat" ? "#e2e8f0" : "#8899bb" }}>{ch.name}</span>
                {ch.unread > 0 && <span className="w-4 h-4 rounded-full flex items-center justify-center text-white font-bold" style={{ background: "#ff00aa", fontSize: "9px" }}>{ch.unread}</span>}
                {ch.pinned && <Icon name="Pin" size={10} style={{ color: "#6b7fa3" }} />}
              </button>
            ))}
          </div>

          {/* Voice channels */}
          <div className="mb-2">
            <button className="flex items-center gap-1 w-full px-1 py-1 mb-1" onClick={() => setExpandVoice(v => !v)}>
              <Icon name={expandVoice ? "ChevronDown" : "ChevronRight"} size={11} style={{ color: "#6b7fa3" }} />
              <span style={{ fontFamily: "Rajdhani, sans-serif", fontWeight: 600, fontSize: "10px", color: "#6b7fa3", textTransform: "uppercase", letterSpacing: "1px" }}>Голосовые</span>
            </button>
            {expandVoice && CHANNELS.voice.map(ch => (
              <button key={ch.id} onClick={() => setActiveTab("streaming")} className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg mb-0.5 transition-all duration-150 text-left" style={{ background: "transparent" }}>
                <Icon name="Volume2" size={13} style={{ color: ch.streaming ? "#ff00aa" : "#6b7fa3" }} />
                <span className="flex-1 text-sm" style={{ fontFamily: "IBM Plex Sans, sans-serif", color: "#8899bb" }}>{ch.name}</span>
                {ch.streaming && <span style={{ background: "rgba(255,0,170,0.2)", color: "#ff00aa", fontSize: "9px", fontFamily: "Rajdhani, sans-serif", fontWeight: 700, padding: "1px 4px", borderRadius: "3px" }}>LIVE</span>}
                {ch.users > 0 && <span style={{ color: "#6b7fa3", fontSize: "12px", fontFamily: "Rajdhani, sans-serif" }}>{ch.users}</span>}
              </button>
            ))}
          </div>

          {/* Forum */}
          <div>
            <button className="flex items-center gap-1 w-full px-1 py-1 mb-1" onClick={() => setExpandForum(v => !v)}>
              <Icon name={expandForum ? "ChevronDown" : "ChevronRight"} size={11} style={{ color: "#6b7fa3" }} />
              <span style={{ fontFamily: "Rajdhani, sans-serif", fontWeight: 600, fontSize: "10px", color: "#6b7fa3", textTransform: "uppercase", letterSpacing: "1px" }}>Форум</span>
            </button>
            {expandForum && CHANNELS.forum.map(ch => (
              <button key={ch.id} className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg mb-0.5 text-left" style={{ background: "transparent" }}>
                <Icon name="BookOpen" size={13} style={{ color: "#6b7fa3" }} />
                <span className="flex-1 text-sm" style={{ fontFamily: "IBM Plex Sans, sans-serif", color: "#8899bb" }}>{ch.name}</span>
                <span style={{ color: "#6b7fa3", fontSize: "12px", fontFamily: "Rajdhani, sans-serif" }}>{ch.posts}</span>
              </button>
            ))}
          </div>
        </div>

        {/* User footer */}
        <div className="px-2 py-2" style={{ borderTop: "1px solid rgba(0,255,136,0.08)" }}>
          <div className="flex items-center gap-2 px-2 py-1.5 rounded-lg" style={{ background: "rgba(0,255,136,0.05)" }}>
            <div className="relative">
              <div className="w-7 h-7 rounded-full flex items-center justify-center" style={{ background: "linear-gradient(135deg, #00ff88, #00aaff)", color: "#060a11", fontFamily: "Rajdhani, sans-serif", fontWeight: 700, fontSize: "10px" }}>ВЫ</div>
              <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 status-online" style={{ borderColor: "var(--dark-panel)" }} />
            </div>
            <div className="flex-1 min-w-0">
              <div style={{ fontFamily: "Rajdhani, sans-serif", fontWeight: 600, fontSize: "13px", color: "#00ff88", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>CyberWolf</div>
              <div style={{ fontSize: "10px", color: "#6b7fa3", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>Admin · Online</div>
            </div>
            <div className="flex gap-1">
              <button className="w-6 h-6 rounded flex items-center justify-center hover:opacity-70 transition-opacity" style={{ background: "rgba(255,255,255,0.05)" }}>
                <Icon name="Mic" size={12} style={{ color: "#6b7fa3" }} />
              </button>
              <button className="w-6 h-6 rounded flex items-center justify-center hover:opacity-70 transition-opacity" style={{ background: "rgba(255,255,255,0.05)" }}>
                <Icon name="Settings" size={12} style={{ color: "#6b7fa3" }} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">

        {/* Header */}
        <div className="flex items-center px-4 py-2.5 shrink-0" style={{ background: "var(--dark-panel)", borderBottom: "1px solid rgba(0,255,136,0.08)" }}>
          <div className="flex items-center gap-2 flex-1">
            <Icon name={activeTab === "chat" ? "Hash" : activeTab === "streaming" ? "Radio" : activeTab === "users" ? "Users" : activeTab === "roles" ? "Shield" : "Settings"} size={18} style={{ color: "#00ff88" }} />
            <span style={{ fontFamily: "Rajdhani, sans-serif", fontWeight: 600, fontSize: "16px", color: "#e2e8f0" }}>
              {activeTab === "chat" ? channel.name : activeTab === "streaming" ? "Стриминг" : activeTab === "users" ? "Пользователи" : activeTab === "roles" ? "Роли и права" : "Настройки"}
            </span>
            {activeTab === "chat" && <span className="h-4 w-px mx-1" style={{ background: "rgba(255,255,255,0.15)" }} />}
            {activeTab === "chat" && <span className="text-sm" style={{ color: "#6b7fa3" }}>Тактические обсуждения</span>}
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setActiveTab("streaming")} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all duration-200 hover:opacity-90" style={{ fontFamily: "Rajdhani, sans-serif", fontWeight: 600, fontSize: "13px", background: streamActive ? "rgba(255,0,170,0.2)" : "rgba(0,255,136,0.1)", color: streamActive ? "#ff00aa" : "#00ff88", border: `1px solid ${streamActive ? "#ff00aa44" : "#00ff8844"}` }}>
              <Icon name={streamActive ? "MonitorOff" : "Monitor"} size={14} />
              {streamActive ? "Стоп" : "Стримить"}
            </button>
            <button className="w-8 h-8 rounded-lg flex items-center justify-center hover:opacity-70 transition-opacity" style={{ background: "rgba(255,255,255,0.05)" }}>
              <Icon name="Search" size={15} style={{ color: "#6b7fa3" }} />
            </button>
            <button className="w-8 h-8 rounded-lg flex items-center justify-center hover:opacity-70 transition-opacity" style={{ background: "rgba(255,255,255,0.05)" }}>
              <Icon name="Bell" size={15} style={{ color: "#6b7fa3" }} />
            </button>
          </div>
        </div>

        {/* Content area */}
        <div className="flex-1 flex overflow-hidden">

          {/* Chat */}
          {activeTab === "chat" && (
            <div className="flex-1 flex flex-col min-w-0">
              <div className="flex-1 overflow-y-auto px-4 py-4 space-y-1">
                {messages.map((msg, i) => (
                  <div key={msg.id} className="flex gap-3 px-3 py-2 rounded-xl group transition-colors" style={{ background: "transparent" }}
                    onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,0.02)")}
                    onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                  >
                    <div className="w-9 h-9 rounded-full flex items-center justify-center shrink-0" style={{ background: msg.color + "22", border: `1px solid ${msg.color}44`, color: msg.color, fontFamily: "Rajdhani, sans-serif", fontWeight: 700, fontSize: "11px" }}>
                      {msg.avatar}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span style={{ fontFamily: "Rajdhani, sans-serif", fontWeight: 600, fontSize: "14px", color: msg.color }}>{msg.user}</span>
                        <span style={{ fontFamily: "Rajdhani, sans-serif", fontWeight: 600, fontSize: "10px", background: msg.roleColor + "22", color: msg.roleColor, border: `1px solid ${msg.roleColor}44`, padding: "1px 6px", borderRadius: "3px", textTransform: "uppercase", letterSpacing: "0.5px" }}>{msg.role}</span>
                        <span style={{ fontSize: "11px", color: "#4a5568" }}>{msg.time}</span>
                      </div>
                      <p className="text-sm leading-relaxed" style={{ color: "#c8d6e8", fontFamily: "IBM Plex Sans, sans-serif" }}>{msg.text}</p>
                      {msg.reactions.length > 0 && (
                        <div className="flex gap-1.5 mt-1.5">
                          {msg.reactions.map((r, ri) => (
                            <button key={ri} className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs transition-all hover:opacity-80" style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", color: "#8899bb" }}>
                              <span>{r.emoji}</span>
                              <span style={{ fontFamily: "Rajdhani, sans-serif", fontWeight: 600 }}>{r.count}</span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))}

                {/* Typing indicator */}
                <div className="flex items-center gap-2 px-3 py-1">
                  <div className="flex gap-1">
                    {[0, 1, 2].map(i => <div key={i} className="w-1.5 h-1.5 rounded-full typing-dot" style={{ background: "#6b7fa3" }} />)}
                  </div>
                  <span style={{ fontSize: "12px", color: "#6b7fa3", fontFamily: "IBM Plex Sans, sans-serif" }}>NeonShadow печатает...</span>
                </div>
              </div>

              {/* Input */}
              <div className="px-4 pb-4">
                <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl" style={{ background: "var(--dark-card)", border: "1px solid rgba(0,255,136,0.1)" }}>
                  <button className="shrink-0 hover:opacity-70 transition-opacity">
                    <Icon name="Plus" size={18} style={{ color: "#6b7fa3" }} />
                  </button>
                  <input
                    className="flex-1 bg-transparent outline-none text-sm"
                    style={{ color: "#e2e8f0", fontFamily: "IBM Plex Sans, sans-serif" }}
                    placeholder={`Написать в #${channel.name}...`}
                    value={inputValue}
                    onChange={e => setInputValue(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && sendMessage()}
                  />
                  <div className="flex items-center gap-1">
                    <button className="hover:opacity-70 transition-opacity"><Icon name="Smile" size={16} style={{ color: "#6b7fa3" }} /></button>
                    <button className="hover:opacity-70 transition-opacity"><Icon name="Paperclip" size={16} style={{ color: "#6b7fa3" }} /></button>
                    <button onClick={sendMessage} className="w-7 h-7 rounded-lg flex items-center justify-center transition-all hover:opacity-90" style={{ background: "rgba(0,255,136,0.15)", color: "#00ff88" }}>
                      <Icon name="Send" size={13} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Streaming */}
          {activeTab === "streaming" && (
            <div className="flex-1 flex flex-col p-4 gap-4 overflow-y-auto">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 px-3 py-1 rounded-full animate-pulse-slow" style={{ fontFamily: "Rajdhani, sans-serif", fontWeight: 700, fontSize: "13px", background: "rgba(255,0,170,0.15)", color: "#ff00aa", border: "1px solid rgba(255,0,170,0.3)" }}>
                  <div className="w-2 h-2 rounded-full glow-pulse" style={{ background: "#ff00aa" }} />
                  LIVE: NeonShadow
                </div>
                <span style={{ fontSize: "13px", color: "#6b7fa3", fontFamily: "IBM Plex Sans, sans-serif" }}>Арена #1 · 847 зрителей</span>
              </div>

              {/* Stream screen */}
              <div className="relative rounded-2xl overflow-hidden stream-border" style={{ background: "linear-gradient(135deg, #0a0f1a, #0d1424)", aspectRatio: "16/9" }}>
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
                  <div className="w-20 h-20 rounded-full flex items-center justify-center" style={{ background: "rgba(255,0,170,0.15)", border: "2px solid rgba(255,0,170,0.3)" }}>
                    <Icon name="Monitor" size={36} style={{ color: "#ff00aa" }} />
                  </div>
                  <div className="text-center">
                    <div style={{ fontFamily: "Orbitron, sans-serif", fontWeight: 700, fontSize: "22px", color: "#ff00aa", textShadow: "0 0 20px rgba(255,0,170,0.7)", marginBottom: "6px" }}>NeonShadow LIVE</div>
                    <div style={{ fontFamily: "Rajdhani, sans-serif", fontSize: "14px", color: "#6b7fa3" }}>Cyber Arena · Рейд на 3-ю зону</div>
                  </div>
                  <button
                    onClick={() => setStreamActive(v => !v)}
                    className="flex items-center gap-2 px-6 py-2.5 rounded-xl transition-all hover:opacity-90"
                    style={{ fontFamily: "Rajdhani, sans-serif", fontWeight: 700, fontSize: "14px", background: streamActive ? "rgba(255,0,170,0.2)" : "rgba(0,255,136,0.15)", color: streamActive ? "#ff00aa" : "#00ff88", border: `1px solid ${streamActive ? "#ff00aa55" : "#00ff8855"}` }}
                  >
                    <Icon name={streamActive ? "MonitorOff" : "MonitorPlay"} size={16} />
                    {streamActive ? "Остановить трансляцию" : "Начать трансляцию экрана"}
                  </button>
                </div>
                <div className="absolute top-3 right-3 flex items-center gap-1.5 px-2 py-1 rounded-lg" style={{ background: "rgba(0,0,0,0.7)", border: "1px solid rgba(255,0,170,0.3)" }}>
                  <div className="w-1.5 h-1.5 rounded-full glow-pulse" style={{ background: "#ff00aa" }} />
                  <span style={{ fontFamily: "Rajdhani, sans-serif", fontWeight: 700, fontSize: "11px", color: "#ff00aa" }}>LIVE</span>
                </div>
              </div>

              {/* Stream options */}
              <div className="grid grid-cols-3 gap-3">
                {[
                  { icon: "Monitor", label: "Весь экран", desc: "Трансляция рабочего стола", color: "#00ff88" },
                  { icon: "AppWindow", label: "Окно", desc: "Выбрать приложение", color: "#00aaff" },
                  { icon: "Video", label: "Камера", desc: "Веб-камера + экран", color: "#aa00ff" },
                ].map((opt, i) => (
                  <button key={i} className="flex flex-col items-center gap-2 p-4 rounded-xl transition-all hover:opacity-80" style={{ background: opt.color + "11", border: `1px solid ${opt.color}33` }}>
                    <Icon name={opt.icon} size={24} style={{ color: opt.color }} />
                    <div>
                      <div style={{ fontFamily: "Rajdhani, sans-serif", fontWeight: 600, fontSize: "14px", color: "#e2e8f0" }}>{opt.label}</div>
                      <div style={{ fontSize: "12px", color: "#6b7fa3" }}>{opt.desc}</div>
                    </div>
                  </button>
                ))}
              </div>

              {/* Active streamers */}
              <div>
                <div style={{ fontFamily: "Rajdhani, sans-serif", fontWeight: 600, fontSize: "11px", color: "#6b7fa3", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "12px" }}>Активные трансляции</div>
                <div className="space-y-2">
                  {[
                    { name: "NeonShadow", viewers: 847, game: "Cyber Arena", color: "#ff00aa" },
                    { name: "PixelKnight", viewers: 234, game: "Void Tactics", color: "#00aaff" },
                  ].map((s, i) => (
                    <div key={i} className="flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all hover:opacity-80" style={{ background: "var(--dark-card)", border: "1px solid rgba(255,255,255,0.05)" }}>
                      <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0" style={{ background: s.color + "22", color: s.color, border: `1px solid ${s.color}44`, fontFamily: "Rajdhani, sans-serif", fontWeight: 700, fontSize: "12px" }}>
                        {s.name.slice(0, 2).toUpperCase()}
                      </div>
                      <div className="flex-1">
                        <div style={{ fontFamily: "Rajdhani, sans-serif", fontWeight: 600, fontSize: "14px", color: "#e2e8f0" }}>{s.name}</div>
                        <div style={{ fontSize: "12px", color: "#6b7fa3" }}>{s.game}</div>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <div className="w-1.5 h-1.5 rounded-full" style={{ background: "#ff00aa" }} />
                        <span style={{ fontFamily: "Rajdhani, sans-serif", fontWeight: 600, fontSize: "14px", color: "#ff00aa" }}>{s.viewers}</span>
                        <Icon name="Eye" size={12} style={{ color: "#6b7fa3" }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Users */}
          {activeTab === "users" && (
            <div className="flex-1 overflow-y-auto p-4">
              <div className="flex items-center gap-3 mb-4">
                <div className="flex-1 flex items-center gap-2 px-3 py-2 rounded-xl" style={{ background: "var(--dark-card)", border: "1px solid rgba(0,255,136,0.1)" }}>
                  <Icon name="Search" size={14} style={{ color: "#6b7fa3" }} />
                  <input className="flex-1 bg-transparent outline-none text-sm" style={{ color: "#e2e8f0", fontFamily: "IBM Plex Sans, sans-serif" }} placeholder="Поиск пользователей..." />
                </div>
                <button className="flex items-center gap-1.5 px-3 py-2 rounded-xl transition-all hover:opacity-90" style={{ fontFamily: "Rajdhani, sans-serif", fontWeight: 600, fontSize: "13px", background: "rgba(0,255,136,0.1)", color: "#00ff88", border: "1px solid rgba(0,255,136,0.2)" }}>
                  <Icon name="UserPlus" size={14} />
                  Пригласить
                </button>
              </div>

              {["Admin", "Mod", "Боец", "Разведчик", "Рекрут"].map(role => {
                const roleMembers = MEMBERS.filter(m => m.role === role);
                if (!roleMembers.length) return null;
                const roleColor = ROLES.find(r => r.name === role)?.color || "#6b7fa3";
                return (
                  <div key={role} className="mb-5">
                    <div className="flex items-center gap-2 mb-2 px-1">
                      <span style={{ fontFamily: "Rajdhani, sans-serif", fontWeight: 700, fontSize: "11px", color: roleColor, textTransform: "uppercase", letterSpacing: "1px" }}>{role}</span>
                      <span style={{ fontFamily: "Rajdhani, sans-serif", fontSize: "11px", color: "#4a5568" }}>— {roleMembers.length}</span>
                    </div>
                    <div className="space-y-0.5">
                      {roleMembers.map(member => (
                        <div key={member.id} className="flex items-center gap-3 px-3 py-2 rounded-xl cursor-pointer transition-all"
                          onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,0.03)")}
                          onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                          style={{ background: "transparent" }}
                        >
                          <div className="relative">
                            <div className="w-9 h-9 rounded-full flex items-center justify-center" style={{ background: member.color + "22", border: `1px solid ${member.color}44`, color: member.color, fontFamily: "Rajdhani, sans-serif", fontWeight: 700, fontSize: "11px", opacity: member.status === "offline" ? 0.5 : 1 }}>
                              {member.avatar}
                            </div>
                            <div className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 status-${member.status}`} style={{ borderColor: "var(--dark-panel)" }} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div style={{ fontFamily: "Rajdhani, sans-serif", fontWeight: 600, fontSize: "14px", color: member.status === "offline" ? "#4a5568" : "#c8d6e8" }}>{member.name}</div>
                            {member.game && <div style={{ fontSize: "11px", color: member.status === "streaming" ? "#ff00aa" : "#4a5568" }}>{member.game}</div>}
                          </div>
                          {member.status === "streaming" && (
                            <span className="animate-pulse-slow" style={{ fontFamily: "Rajdhani, sans-serif", fontWeight: 700, fontSize: "10px", background: "rgba(255,0,170,0.15)", color: "#ff00aa", padding: "2px 6px", borderRadius: "4px" }}>LIVE</span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Roles */}
          {activeTab === "roles" && (
            <div className="flex-1 overflow-y-auto p-4">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <div style={{ fontFamily: "Orbitron, sans-serif", fontWeight: 700, fontSize: "16px", color: "#e2e8f0" }}>Роли сервера</div>
                  <div style={{ fontSize: "13px", color: "#6b7fa3", marginTop: "4px", fontFamily: "IBM Plex Sans, sans-serif" }}>Управление правами доступа</div>
                </div>
                <button className="flex items-center gap-1.5 px-3 py-2 rounded-xl" style={{ fontFamily: "Rajdhani, sans-serif", fontWeight: 600, fontSize: "13px", background: "rgba(0,255,136,0.1)", color: "#00ff88", border: "1px solid rgba(0,255,136,0.2)" }}>
                  <Icon name="Plus" size={14} />
                  Новая роль
                </button>
              </div>
              <div className="space-y-3">
                {ROLES.map((role, i) => (
                  <div key={role.id} className="p-4 rounded-2xl cursor-pointer transition-all hover:opacity-90" style={{ background: "var(--dark-card)", border: `1px solid ${role.color}22`, animationDelay: `${i * 0.08}s` }}>
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: role.color + "15", border: `1px solid ${role.color}33` }}>
                        <Icon name="Shield" size={18} style={{ color: role.color }} />
                      </div>
                      <div className="flex-1">
                        <div style={{ fontFamily: "Rajdhani, sans-serif", fontWeight: 700, fontSize: "16px", color: role.color }}>{role.name}</div>
                        <div style={{ fontSize: "12px", color: "#6b7fa3" }}>{role.members} участников</div>
                      </div>
                      <button className="w-8 h-8 rounded-lg flex items-center justify-center hover:opacity-70" style={{ background: "rgba(255,255,255,0.05)" }}>
                        <Icon name="Pencil" size={13} style={{ color: "#6b7fa3" }} />
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {role.perms.map((perm, pi) => (
                        <span key={pi} style={{ fontFamily: "Rajdhani, sans-serif", fontWeight: 600, fontSize: "10px", background: role.color + "15", color: role.color, border: `1px solid ${role.color}25`, padding: "2px 8px", borderRadius: "20px", letterSpacing: "0.3px" }}>
                          {perm}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Settings */}
          {activeTab === "settings" && (
            <div className="flex-1 overflow-y-auto p-4">
              <div style={{ fontFamily: "Orbitron, sans-serif", fontWeight: 700, fontSize: "16px", color: "#e2e8f0", marginBottom: "4px" }}>Настройки сервера</div>
              <div style={{ fontSize: "13px", color: "#6b7fa3", marginBottom: "20px", fontFamily: "IBM Plex Sans, sans-serif" }}>Конфигурация {server.name}</div>
              <div className="space-y-3">
                {[
                  { label: "Название сервера", value: server.name, icon: "Server" },
                  { label: "Регион", value: "EU-Central", icon: "Globe" },
                  { label: "Уровень верификации", value: "Средний", icon: "ShieldCheck" },
                  { label: "Медиа-контент", value: "Для всех", icon: "Image" },
                ].map((s, i) => (
                  <div key={i} className="flex items-center gap-4 p-4 rounded-xl" style={{ background: "var(--dark-card)", border: "1px solid rgba(255,255,255,0.05)" }}>
                    <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: "rgba(0,255,136,0.1)" }}>
                      <Icon name={s.icon} size={16} style={{ color: "#00ff88" }} />
                    </div>
                    <div className="flex-1">
                      <div style={{ fontFamily: "Rajdhani, sans-serif", fontSize: "10px", color: "#6b7fa3", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "2px" }}>{s.label}</div>
                      <div style={{ fontFamily: "Rajdhani, sans-serif", fontWeight: 600, fontSize: "14px", color: "#e2e8f0" }}>{s.value}</div>
                    </div>
                    <button style={{ fontFamily: "Rajdhani, sans-serif", fontSize: "12px", background: "rgba(0,255,136,0.1)", color: "#00ff88", border: "1px solid rgba(0,255,136,0.2)", padding: "4px 12px", borderRadius: "8px" }}>
                      Изменить
                    </button>
                  </div>
                ))}

                <div className="p-4 rounded-xl" style={{ background: "rgba(255,0,0,0.05)", border: "1px solid rgba(255,0,0,0.15)" }}>
                  <div style={{ fontFamily: "Rajdhani, sans-serif", fontWeight: 700, fontSize: "13px", color: "#ff4444", marginBottom: "10px" }}>Опасная зона</div>
                  <div className="flex gap-2">
                    <button style={{ fontFamily: "Rajdhani, sans-serif", fontWeight: 600, fontSize: "13px", background: "rgba(255,0,0,0.1)", color: "#ff4444", border: "1px solid rgba(255,0,0,0.25)", padding: "6px 12px", borderRadius: "8px" }}>
                      Удалить сервер
                    </button>
                    <button style={{ fontFamily: "Rajdhani, sans-serif", fontWeight: 600, fontSize: "13px", background: "rgba(255,100,0,0.1)", color: "#ff6600", border: "1px solid rgba(255,100,0,0.25)", padding: "6px 12px", borderRadius: "8px" }}>
                      Покинуть
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>

      {/* Members sidebar */}
      {activeTab === "chat" && (
        <div className="w-[200px] shrink-0 overflow-y-auto py-3" style={{ background: "var(--dark-panel)", borderLeft: "1px solid rgba(0,255,136,0.08)" }}>
          <div className="px-3">
            <div style={{ fontFamily: "Rajdhani, sans-serif", fontWeight: 600, fontSize: "10px", color: "#6b7fa3", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "8px" }}>
              Онлайн — {MEMBERS.filter(m => m.status !== "offline").length}
            </div>
            {MEMBERS.filter(m => m.status !== "offline").map(member => (
              <div key={member.id} className="flex items-center gap-2 py-1.5 px-2 rounded-xl cursor-pointer transition-all" style={{ marginBottom: "2px" }}
                onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,0.04)")}
                onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
              >
                <div className="relative shrink-0">
                  <div className="w-7 h-7 rounded-full flex items-center justify-center" style={{ background: member.color + "22", color: member.color, fontFamily: "Rajdhani, sans-serif", fontWeight: 700, fontSize: "10px" }}>
                    {member.avatar}
                  </div>
                  <div className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 status-${member.status}`} style={{ borderColor: "var(--dark-panel)" }} />
                </div>
                <div className="min-w-0 flex-1">
                  <div style={{ fontFamily: "Rajdhani, sans-serif", fontWeight: 600, fontSize: "12px", color: "#c8d6e8", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{member.name}</div>
                  {member.status === "streaming" && <div style={{ fontFamily: "Rajdhani, sans-serif", fontSize: "10px", color: "#ff00aa" }}>🔴 В эфире</div>}
                </div>
              </div>
            ))}

            <div style={{ fontFamily: "Rajdhani, sans-serif", fontWeight: 600, fontSize: "10px", color: "#4a5568", textTransform: "uppercase", letterSpacing: "1px", marginTop: "12px", marginBottom: "8px" }}>
              Офлайн — {MEMBERS.filter(m => m.status === "offline").length}
            </div>
            {MEMBERS.filter(m => m.status === "offline").map(member => (
              <div key={member.id} className="flex items-center gap-2 py-1.5 px-2 rounded-xl" style={{ marginBottom: "2px", opacity: 0.45 }}>
                <div className="w-7 h-7 rounded-full flex items-center justify-center" style={{ background: "#1a2030", color: "#4a5568", fontFamily: "Rajdhani, sans-serif", fontWeight: 700, fontSize: "10px" }}>
                  {member.avatar}
                </div>
                <div style={{ fontFamily: "Rajdhani, sans-serif", fontWeight: 600, fontSize: "12px", color: "#4a5568", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{member.name}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
