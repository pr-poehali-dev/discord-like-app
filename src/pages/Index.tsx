import { useState } from "react";
import Icon from "@/components/ui/icon";
import ServerSettings from "@/components/ServerSettings";
import UserSettings from "@/components/UserSettings";
import CreateServerModal from "@/components/CreateServerModal";
import ChannelSettings from "@/components/ChannelSettings";
import StreamCapture from "@/components/StreamCapture";
import DMView from "@/components/DMView";
import ProfileModal from "@/components/ProfileModal";
import UserAvatar from "@/components/UserAvatar";

interface User {
  id: number;
  username: string;
  email: string;
  avatar_color: string;
  status: string;
}

interface IndexProps {
  user: User;
  avatarImg?: string | null;
  onLogout: () => void;
  onAvatarChange?: (img: string | null, color?: string) => void;
}

const INITIAL_SERVERS = [
  { id: 1, name: "NEXUS", abbr: "NX", color: "#00ff88", members: 1247, unread: 3 },
  { id: 2, name: "VOID SQUAD", abbr: "VS", color: "#ff00aa", members: 834, unread: 12 },
  { id: 3, name: "CYBER GUILD", abbr: "CG", color: "#00aaff", members: 2103, unread: 0 },
  { id: 4, name: "DARK MATTER", abbr: "DM", color: "#ff6600", members: 456, unread: 1 },
  { id: 5, name: "ALPHA TEAM", abbr: "AT", color: "#aa00ff", members: 189, unread: 0 },
];

interface TextChannel { id: number; name: string; unread?: number; pinned?: boolean; locked?: boolean; }
interface VoiceChannel { id: number; name: string; users: number; streaming: boolean; }
interface ForumChannel { id: number; name: string; posts: number; }
interface ServerChannels { text: TextChannel[]; voice: VoiceChannel[]; forum: ForumChannel[]; }
interface ServerMember { id: number; name: string; role: string; roleColor: string; status: string; avatar: string; game: string; color: string; }
interface ServerRole { id: number; name: string; color: string; members: number; perms: string[]; }
interface Msg { id: number; user: string; avatar: string; color: string; role: string; roleColor: string; time: string; text: string; reactions: { emoji: string; count: number }[]; }

const SERVER_DATA: Record<number, { channels: ServerChannels; members: ServerMember[]; roles: ServerRole[]; messages: Record<number, Msg[]> }> = {
  1: {
    channels: {
      text: [
        { id: 101, name: "общий", unread: 5, pinned: true },
        { id: 102, name: "игры", unread: 0 },
        { id: 103, name: "стратегии", unread: 2 },
        { id: 104, name: "объявления", unread: 0, locked: true },
        { id: 105, name: "медиа", unread: 0 },
      ],
      voice: [
        { id: 151, name: "Арена #1", users: 3, streaming: true },
        { id: 152, name: "Арена #2", users: 0, streaming: false },
        { id: 153, name: "Штаб командира", users: 1, streaming: false },
      ],
      forum: [{ id: 191, name: "тактики", posts: 47 }, { id: 192, name: "рекруты", posts: 12 }],
    },
    roles: [
      { id: 1, name: "Admin", color: "#00ff88", members: 1, perms: ["Все права", "Управление сервером", "Бан/Кик"] },
      { id: 2, name: "Mod", color: "#ff00aa", members: 2, perms: ["Управление каналами", "Удаление сообщений"] },
      { id: 3, name: "Боец", color: "#00aaff", members: 48, perms: ["Голосовой чат", "Стриминг"] },
      { id: 4, name: "Разведчик", color: "#aa00ff", members: 15, perms: ["Специальные каналы"] },
      { id: 5, name: "Рекрут", color: "#6b7fa3", members: 234, perms: ["Чтение каналов", "Текстовый чат"] },
    ],
    members: [
      { id: 1, name: "CyberWolf", role: "Admin", roleColor: "#00ff88", color: "#00ff88", status: "online", avatar: "CW", game: "Cyber Arena" },
      { id: 2, name: "NeonShadow", role: "Mod", roleColor: "#ff00aa", color: "#ff00aa", status: "streaming", avatar: "NS", game: "🔴 В эфире" },
      { id: 3, name: "PixelKnight", role: "Боец", roleColor: "#00aaff", color: "#00aaff", status: "online", avatar: "PK", game: "Cyber Arena" },
      { id: 4, name: "GhostRunner", role: "Разведчик", roleColor: "#aa00ff", color: "#aa00ff", status: "online", avatar: "GR", game: "Cyber Arena" },
      { id: 5, name: "IronCore", role: "Боец", roleColor: "#00aaff", color: "#00aaff", status: "away", avatar: "IC", game: "Away" },
      { id: 6, name: "VoidHunter", role: "Рекрут", roleColor: "#6b7fa3", color: "#6b7fa3", status: "online", avatar: "VH", game: "Lobby" },
      { id: 7, name: "StarForge", role: "Рекрут", roleColor: "#6b7fa3", color: "#6b7fa3", status: "offline", avatar: "SF", game: "" },
    ],
    messages: {
      101: [
        { id: 1, user: "CyberWolf", avatar: "CW", color: "#00ff88", role: "Admin", roleColor: "#00ff88", time: "19:42", text: "Всем привет! Сегодня в 21:00 рейд на третью зону. Нужны все доступные бойцы.", reactions: [{ emoji: "🔥", count: 12 }, { emoji: "⚔️", count: 8 }] },
        { id: 2, user: "NeonShadow", avatar: "NS", color: "#ff00aa", role: "Mod", roleColor: "#ff00aa", time: "19:44", text: "Готов! Буду стримить для тех кто не успеет. Подключайтесь к Арена #1", reactions: [{ emoji: "👀", count: 5 }] },
        { id: 3, user: "PixelKnight", avatar: "PK", color: "#00aaff", role: "Боец", roleColor: "#00aaff", time: "19:47", text: "Тактика как в прошлый раз или меняем подход? У меня есть идея насчёт фланговой атаки", reactions: [] },
        { id: 4, user: "GhostRunner", avatar: "GR", color: "#aa00ff", role: "Разведчик", roleColor: "#aa00ff", time: "19:51", text: "Флаг поддерживаю. Прошлый раз лобовая атака стоила нам 40 минут. Нужна скорость.", reactions: [{ emoji: "💡", count: 9 }, { emoji: "✅", count: 14 }] },
        { id: 5, user: "CyberWolf", avatar: "CW", color: "#00ff88", role: "Admin", roleColor: "#00ff88", time: "19:53", text: "Принято. GhostRunner ведёт разведку, PixelKnight командует флангом. Брифинг в 20:45.", reactions: [{ emoji: "🎯", count: 17 }] },
      ],
      102: [
        { id: 1, user: "VoidHunter", avatar: "VH", color: "#6b7fa3", role: "Рекрут", roleColor: "#6b7fa3", time: "18:00", text: "Кто-нибудь играет в новый Cyber Arena сезон? Там добавили новую карту!", reactions: [{ emoji: "🎮", count: 4 }] },
        { id: 2, user: "IronCore", avatar: "IC", color: "#00aaff", role: "Боец", roleColor: "#00aaff", time: "18:10", text: "Да! Карта огонь. Особенно новая точка B с порталами", reactions: [] },
      ],
      103: [
        { id: 1, user: "GhostRunner", avatar: "GR", color: "#aa00ff", role: "Разведчик", roleColor: "#aa00ff", time: "17:30", text: "Разбираем новую тактику 3-2 с прикрытием фланга. Нужны видео для анализа.", reactions: [{ emoji: "📊", count: 6 }] },
      ],
      104: [
        { id: 1, user: "CyberWolf", avatar: "CW", color: "#00ff88", role: "Admin", roleColor: "#00ff88", time: "10:00", text: "📢 Турнир NEXUS CUP стартует 15 апреля! Записывайтесь в #стратегии", reactions: [{ emoji: "🏆", count: 23 }] },
      ],
      105: [
        { id: 1, user: "NeonShadow", avatar: "NS", color: "#ff00aa", role: "Mod", roleColor: "#ff00aa", time: "20:00", text: "Запись рейда прошлой недели. Разбор ошибок в 15:40 🎥", reactions: [{ emoji: "👀", count: 11 }] },
      ],
    },
  },
  2: {
    channels: {
      text: [
        { id: 201, name: "void-chat", unread: 12 },
        { id: 202, name: "тактика", unread: 0 },
        { id: 203, name: "набор", unread: 0 },
        { id: 204, name: "новости", unread: 0, locked: true },
      ],
      voice: [
        { id: 251, name: "Войд Лобби", users: 5, streaming: false },
        { id: 252, name: "Рейд-канал", users: 2, streaming: true },
      ],
      forum: [{ id: 291, name: "обсуждения", posts: 28 }],
    },
    roles: [
      { id: 1, name: "Void Leader", color: "#ff00aa", members: 1, perms: ["Все права"] },
      { id: 2, name: "Void Elder", color: "#ff6699", members: 3, perms: ["Управление", "Бан"] },
      { id: 3, name: "Void Scout", color: "#aa0066", members: 22, perms: ["Голос", "Стриминг"] },
      { id: 4, name: "Recruit", color: "#4a3050", members: 98, perms: ["Читать", "Писать"] },
    ],
    members: [
      { id: 10, name: "VoidMaster", role: "Void Leader", roleColor: "#ff00aa", color: "#ff00aa", status: "online", avatar: "VM", game: "Dota 2" },
      { id: 11, name: "ShadowBlade", role: "Void Elder", roleColor: "#ff6699", color: "#ff6699", status: "online", avatar: "SB", game: "VALORANT" },
      { id: 12, name: "DarkPhoenix", role: "Void Scout", roleColor: "#aa0066", color: "#aa0066", status: "away", avatar: "DP", game: "" },
      { id: 13, name: "NightWalker", role: "Recruit", roleColor: "#4a3050", color: "#9966aa", status: "offline", avatar: "NW", game: "" },
    ],
    messages: {
      201: [
        { id: 1, user: "VoidMaster", avatar: "VM", color: "#ff00aa", role: "Void Leader", roleColor: "#ff00aa", time: "20:00", text: "Войд сквад — лучшая команда региона! Сегодня финал турнира в 22:00 🏆", reactions: [{ emoji: "💜", count: 18 }] },
        { id: 2, user: "ShadowBlade", avatar: "SB", color: "#ff6699", role: "Void Elder", roleColor: "#ff6699", time: "20:05", text: "Готов. Стрим будет на нашем канале. Ссылка в #новости", reactions: [{ emoji: "🔥", count: 7 }] },
        { id: 3, user: "DarkPhoenix", avatar: "DP", color: "#aa0066", role: "Void Scout", roleColor: "#aa0066", time: "20:10", text: "Немного опоздаю, пробки. Буду к 21:45", reactions: [] },
      ],
      202: [
        { id: 1, user: "VoidMaster", avatar: "VM", color: "#ff00aa", role: "Void Leader", roleColor: "#ff00aa", time: "15:00", text: "Разбираем карту Fracture — важные точки для финала", reactions: [{ emoji: "📌", count: 5 }] },
      ],
    },
  },
  3: {
    channels: {
      text: [
        { id: 301, name: "главная", unread: 0, pinned: true },
        { id: 302, name: "гильдия", unread: 0 },
        { id: 303, name: "ивенты", unread: 0 },
        { id: 304, name: "торговля", unread: 0 },
        { id: 305, name: "правила", unread: 0, locked: true },
      ],
      voice: [
        { id: 351, name: "Зал совета", users: 1, streaming: false },
        { id: 352, name: "Рейд А", users: 4, streaming: false },
        { id: 353, name: "Рейд Б", users: 0, streaming: false },
        { id: 354, name: "АФК", users: 2, streaming: false },
      ],
      forum: [{ id: 391, name: "гайды", posts: 115 }, { id: 392, name: "история", posts: 34 }],
    },
    roles: [
      { id: 1, name: "Архимаг", color: "#00aaff", members: 1, perms: ["Все права"] },
      { id: 2, name: "Маг", color: "#4488ff", members: 8, perms: ["Управление"] },
      { id: 3, name: "Рыцарь", color: "#0066cc", members: 67, perms: ["Голос", "Стриминг"] },
      { id: 4, name: "Адепт", color: "#003399", members: 340, perms: ["Читать", "Писать"] },
    ],
    members: [
      { id: 20, name: "ArcMage", role: "Архимаг", roleColor: "#00aaff", color: "#00aaff", status: "online", avatar: "AM", game: "WoW" },
      { id: 21, name: "BlueFrost", role: "Маг", roleColor: "#4488ff", color: "#4488ff", status: "online", avatar: "BF", game: "ESO" },
      { id: 22, name: "IceKnight", role: "Рыцарь", roleColor: "#0066cc", color: "#0066cc", status: "away", avatar: "IK", game: "" },
      { id: 23, name: "AquaStrike", role: "Адепт", roleColor: "#003399", color: "#6699ff", status: "offline", avatar: "AS", game: "" },
    ],
    messages: {
      301: [
        { id: 1, user: "ArcMage", avatar: "AM", color: "#00aaff", role: "Архимаг", roleColor: "#00aaff", time: "12:00", text: "Cyber Guild — 2103 участника! Рекорд сервера! Спасибо всем за доверие 💙", reactions: [{ emoji: "💙", count: 45 }, { emoji: "🏆", count: 22 }] },
        { id: 2, user: "BlueFrost", avatar: "BF", color: "#4488ff", role: "Маг", roleColor: "#4488ff", time: "12:10", text: "Такой рост за последний месяц — потрясающий результат команды", reactions: [{ emoji: "🎉", count: 13 }] },
      ],
    },
  },
  4: {
    channels: {
      text: [
        { id: 401, name: "тьма", unread: 1 },
        { id: 402, name: "хаос", unread: 0 },
        { id: 403, name: "приказы", unread: 0, locked: true },
      ],
      voice: [
        { id: 451, name: "Темный зал", users: 2, streaming: false },
        { id: 452, name: "Бункер", users: 0, streaming: false },
      ],
      forum: [{ id: 491, name: "теории", posts: 19 }],
    },
    roles: [
      { id: 1, name: "Dark Lord", color: "#ff6600", members: 1, perms: ["Все права"] },
      { id: 2, name: "Enforcer", color: "#cc4400", members: 4, perms: ["Кик", "Бан"] },
      { id: 3, name: "Dark Knight", color: "#882200", members: 31, perms: ["Голос"] },
      { id: 4, name: "Shadow", color: "#441100", members: 120, perms: ["Читать"] },
    ],
    members: [
      { id: 30, name: "DarkLord", role: "Dark Lord", roleColor: "#ff6600", color: "#ff6600", status: "dnd", avatar: "DL", game: "Diablo IV" },
      { id: 31, name: "CrimsonFang", role: "Enforcer", roleColor: "#cc4400", color: "#cc4400", status: "online", avatar: "CF", game: "Dark Souls" },
      { id: 32, name: "ObsidianBlade", role: "Dark Knight", roleColor: "#882200", color: "#882200", status: "offline", avatar: "OB", game: "" },
    ],
    messages: {
      401: [
        { id: 1, user: "DarkLord", avatar: "DL", color: "#ff6600", role: "Dark Lord", roleColor: "#ff6600", time: "23:00", text: "Завтра ночной рейд. Только проверенные участники. Подготовить снаряжение.", reactions: [{ emoji: "💀", count: 8 }] },
        { id: 2, user: "CrimsonFang", avatar: "CF", color: "#cc4400", role: "Enforcer", roleColor: "#cc4400", time: "23:05", text: "Готов. Буду за 30 минут до старта", reactions: [] },
      ],
    },
  },
  5: {
    channels: {
      text: [
        { id: 501, name: "альфа-чат", unread: 0 },
        { id: 502, name: "тренировки", unread: 0 },
        { id: 503, name: "результаты", unread: 0, pinned: true },
      ],
      voice: [
        { id: 551, name: "Штаб Альфа", users: 0, streaming: false },
        { id: 552, name: "Тренировка", users: 3, streaming: false },
      ],
      forum: [{ id: 591, name: "тактики", posts: 7 }],
    },
    roles: [
      { id: 1, name: "Alpha Leader", color: "#aa00ff", members: 1, perms: ["Все права"] },
      { id: 2, name: "Alpha Pro", color: "#8800cc", members: 5, perms: ["Управление"] },
      { id: 3, name: "Alpha Member", color: "#660099", members: 43, perms: ["Голос", "Писать"] },
    ],
    members: [
      { id: 40, name: "AlphaOne", role: "Alpha Leader", roleColor: "#aa00ff", color: "#aa00ff", status: "online", avatar: "A1", game: "CS2" },
      { id: 41, name: "BetaForce", role: "Alpha Pro", roleColor: "#8800cc", color: "#8800cc", status: "online", avatar: "BF", game: "VALORANT" },
      { id: 42, name: "GammaRay", role: "Alpha Member", roleColor: "#660099", color: "#9933cc", status: "away", avatar: "GR", game: "" },
      { id: 43, name: "DeltaStrike", role: "Alpha Member", roleColor: "#660099", color: "#9933cc", status: "offline", avatar: "DS", game: "" },
    ],
    messages: {
      501: [
        { id: 1, user: "AlphaOne", avatar: "A1", color: "#aa00ff", role: "Alpha Leader", roleColor: "#aa00ff", time: "16:00", text: "Тренировка сегодня в 19:00. Фокус на дисциплине передвижения.", reactions: [{ emoji: "💪", count: 6 }] },
        { id: 2, user: "BetaForce", avatar: "BF", color: "#8800cc", role: "Alpha Pro", roleColor: "#8800cc", time: "16:15", text: "Принято. Разминку начну заранее", reactions: [] },
      ],
    },
  },
};

type Tab = "chat" | "streaming" | "users" | "roles" | "settings";
type UserStatus = "online" | "away" | "dnd" | "invisible";

const STATUS_META: Record<UserStatus, { label: string; color: string; dot: string }> = {
  online: { label: "В сети", color: "#00ff88", dot: "status-online" },
  away: { label: "Отошёл", color: "#ff6600", dot: "status-away" },
  dnd: { label: "Не беспокоить", color: "#ff4444", dot: "status-dnd" },
  invisible: { label: "Невидимый", color: "#6b7fa3", dot: "status-offline" },
};

export default function Index({ user, avatarImg, onLogout, onAvatarChange }: IndexProps) {
  const [activeServer, setActiveServer] = useState(1);
  const [activeChannel, setActiveChannel] = useState(101);
  const [activeTab, setActiveTab] = useState<Tab>("chat");
  const [inputValue, setInputValue] = useState("");
  const [expandText, setExpandText] = useState(true);
  const [expandVoice, setExpandVoice] = useState(true);
  const [expandForum, setExpandForum] = useState(false);
  const [streamActive, setStreamActive] = useState(false);
  const [serverMessages, setServerMessages] = useState<Record<number, Record<number, Msg[]>>>(
    Object.fromEntries(Object.entries(SERVER_DATA).map(([sid, data]) => [Number(sid), { ...data.messages }]))
  );
  const [micMuted, setMicMuted] = useState(false);
  const [headphonesDeaf, setHeadphonesDeaf] = useState(false);
  const [myStatus, setMyStatus] = useState<UserStatus>("online");
  const [dndNotifications, setDndNotifications] = useState(true);
  const [statusMenuOpen, setStatusMenuOpen] = useState(false);
  const [showServerSettings, setShowServerSettings] = useState(false);
  const [showUserSettings, setShowUserSettings] = useState(false);
  const [showCreateServer, setShowCreateServer] = useState(false);
  const [showChannelSettings, setShowChannelSettings] = useState(false);
  const [showStreamCapture, setShowStreamCapture] = useState(false);
  const [dmMode, setDmMode] = useState(false);
  const [profileMember, setProfileMember] = useState<ServerMember | null>(null);
  const [servers, setServers] = useState(INITIAL_SERVERS);

  const server = servers.find(s => s.id === activeServer) || servers[0];
  const sData = SERVER_DATA[activeServer] || SERVER_DATA[1];
  const CHANNELS = sData.channels;
  const MEMBERS = sData.members;
  const ROLES = sData.roles;
  const messages = serverMessages[activeServer]?.[activeChannel] || [];
  const channel = CHANNELS.text.find(c => c.id === activeChannel) || CHANNELS.text[0];

  const switchServer = (id: number) => {
    setActiveServer(id);
    const firstCh = (SERVER_DATA[id] || SERVER_DATA[1]).channels.text[0];
    setActiveChannel(firstCh?.id || 101);
    setActiveTab("chat");
  };

  const sendMessage = () => {
    if (!inputValue.trim()) return;
    const newMsg: Msg = {
      id: Date.now(),
      user: user.username,
      avatar: user.username.slice(0, 2).toUpperCase(),
      color: user.avatar_color,
      role: "Admin",
      roleColor: user.avatar_color,
      time: new Date().toLocaleTimeString("ru", { hour: "2-digit", minute: "2-digit" }),
      text: inputValue,
      reactions: [],
    };
    setServerMessages(prev => ({
      ...prev,
      [activeServer]: {
        ...(prev[activeServer] || {}),
        [activeChannel]: [...(prev[activeServer]?.[activeChannel] || []), newMsg],
      },
    }));
    setInputValue("");
  };

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: "var(--dark-bg)", fontFamily: "IBM Plex Sans, sans-serif" }}>
      {showServerSettings && <ServerSettings server={server} onClose={() => setShowServerSettings(false)} />}
      {showUserSettings && <UserSettings user={user} avatarImg={avatarImg} onAvatarChange={onAvatarChange} onClose={() => setShowUserSettings(false)} onLogout={onLogout} />}
      {showCreateServer && <CreateServerModal onClose={() => setShowCreateServer(false)} onCreate={s => { const newId = servers.length + 1; setServers(prev => [...prev, { id: newId, ...s, members: 1, unread: 0 }]); setActiveServer(newId); }} />}
      {showChannelSettings && <ChannelSettings channel={sData.channels.text.find(c => c.id === activeChannel) || sData.channels.text[0]} onClose={() => setShowChannelSettings(false)} />}
      {showStreamCapture && <StreamCapture onClose={() => setShowStreamCapture(false)} onStart={() => setStreamActive(true)} />}
      {profileMember && (
        <ProfileModal
          member={{ id: profileMember.id, name: profileMember.name, color: profileMember.color, role: profileMember.role, roleColor: profileMember.roleColor, status: profileMember.status, avatar: profileMember.avatar, game: profileMember.game, mutual: 3 }}
          onClose={() => setProfileMember(null)}
          onMessage={() => { setShowDMPanel(true); setProfileMember(null); }}
        />
      )}

      {/* Servers sidebar */}
      <div className="flex flex-col items-center py-4 gap-2 w-[68px] shrink-0" style={{ background: "#060a11", borderRight: "1px solid rgba(0,255,136,0.08)" }}>
        <div onClick={() => setDmMode(v => !v)} title={dmMode ? "Вернуться к серверам" : "Личные сообщения"}
          className="w-10 h-10 rounded-xl flex items-center justify-center mb-2 cursor-pointer transition-all hover:scale-105 group relative"
          style={{ background: dmMode ? "linear-gradient(135deg, #00aaff, #00ff88)" : "linear-gradient(135deg, #00ff88, #00aaff)", boxShadow: dmMode ? "0 0 12px rgba(0,170,255,0.5)" : "none" }}>
          <span style={{ fontFamily: "Orbitron, sans-serif", fontSize: "11px", fontWeight: 900, color: "#060a11" }}>NX</span>
          <div className="absolute left-12 rounded-lg px-2 py-1 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 whitespace-nowrap" style={{ background: "#111a2e", color: "#e2e8f0", border: "1px solid rgba(0,170,255,0.2)", fontSize: "12px", fontFamily: "Rajdhani, sans-serif", fontWeight: 600 }}>
            {dmMode ? "← Серверы" : "Личные сообщения"}
          </div>
        </div>
        <div className="w-6 h-px mb-1" style={{ background: "rgba(0,255,136,0.2)" }} />

        {servers.map(srv => (
          <div key={srv.id} className="relative group" onClick={() => switchServer(srv.id)}>
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
          <div onClick={() => setShowCreateServer(true)} className="w-10 h-10 rounded-xl flex items-center justify-center cursor-pointer hover:opacity-80 hover:scale-105 transition-all" style={{ background: "#0d1424", border: "1px dashed rgba(0,255,136,0.3)" }} title="Создать сервер">
            <Icon name="Plus" size={16} style={{ color: "#00ff88" }} />
          </div>
        </div>
      </div>

      {/* DM MODE */}
      {dmMode && (
        <DMView
          user={user}
          avatarImg={avatarImg}
          onLogout={onLogout}
          onOpenSettings={() => setShowUserSettings(true)}
          micMuted={micMuted}
          headphonesDeaf={headphonesDeaf}
          onToggleMic={() => setMicMuted(v => !v)}
          onToggleDeaf={() => setHeadphonesDeaf(v => !v)}
          myStatusDot={STATUS_META[myStatus].dot}
          myStatusColor={STATUS_META[myStatus].color}
          myStatusLabel={STATUS_META[myStatus].label}
          onOpenStatusMenu={() => setStatusMenuOpen(v => !v)}
        />
      )}

      {/* SERVERS MODE */}
      {/* Channels panel */}
      {!dmMode && <div className="flex flex-col w-[220px] shrink-0" style={{ background: "var(--dark-panel)", borderRight: "1px solid rgba(0,255,136,0.08)" }}>
        {/* Server header */}
        <div className="px-3 py-3 flex items-center justify-between" style={{ borderBottom: "1px solid rgba(0,255,136,0.1)" }}>
          <div className="flex-1 cursor-pointer hover:opacity-90 transition-all" onClick={() => setShowServerSettings(true)}>
            <div style={{ fontFamily: "Orbitron, sans-serif", fontWeight: 700, fontSize: "13px", color: server.color, textShadow: `0 0 8px ${server.color}88`, letterSpacing: "1px" }}>
              {server.name}
            </div>
            <div style={{ fontSize: "11px", color: "#6b7fa3", marginTop: "2px" }}>{server.members.toLocaleString()} участников</div>
          </div>
          <button onClick={() => setShowServerSettings(true)} className="w-6 h-6 rounded flex items-center justify-center hover:opacity-70 transition-opacity" title="Настройки сервера">
            <Icon name="Settings" size={13} style={{ color: "#6b7fa3" }} />
          </button>
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
        <div className="px-2 py-2 relative" style={{ borderTop: "1px solid rgba(0,255,136,0.08)" }}>
          {/* Status menu */}
          {statusMenuOpen && (
            <div className="absolute bottom-full left-2 right-2 mb-2 rounded-xl overflow-hidden z-50 animate-fade-in"
              style={{ background: "#0d1424", border: "1px solid rgba(255,255,255,0.1)", boxShadow: "0 -8px 32px rgba(0,0,0,0.5)" }}>
              <div style={{ fontFamily: "Rajdhani, sans-serif", fontWeight: 600, fontSize: "10px", color: "#4a5568", textTransform: "uppercase", letterSpacing: "1px", padding: "8px 12px 4px" }}>Статус</div>
              {(["online", "away", "dnd", "invisible"] as UserStatus[]).map(s => (
                <button key={s} onClick={() => { setMyStatus(s); setStatusMenuOpen(false); }}
                  className="w-full flex items-center gap-2.5 px-3 py-2.5 transition-colors text-left hover:bg-white hover:bg-opacity-5">
                  <div className="w-3 h-3 rounded-full" style={{ background: STATUS_META[s].color, boxShadow: myStatus === s ? `0 0 6px ${STATUS_META[s].color}` : "none" }} />
                  <span style={{ fontFamily: "Rajdhani, sans-serif", fontWeight: 700, fontSize: "13px", color: myStatus === s ? STATUS_META[s].color : "#e2e8f0" }}>{STATUS_META[s].label}</span>
                  {myStatus === s && <Icon name="Check" size={12} style={{ color: STATUS_META[s].color, marginLeft: "auto" }} />}
                </button>
              ))}
              {/* DND — mute notifications */}
              {myStatus === "dnd" && (
                <>
                  <div className="h-px mx-3" style={{ background: "rgba(255,255,255,0.06)" }} />
                  <button onClick={() => setDndNotifications(v => !v)}
                    className="w-full flex items-center gap-2.5 px-3 py-2.5 transition-colors text-left hover:bg-white hover:bg-opacity-5">
                    <Icon name={dndNotifications ? "BellOff" : "Bell"} size={14} style={{ color: dndNotifications ? "#ff4444" : "#00ff88" }} />
                    <div>
                      <div style={{ fontFamily: "Rajdhani, sans-serif", fontWeight: 700, fontSize: "13px", color: "#e2e8f0" }}>
                        {dndNotifications ? "Уведомления выключены" : "Уведомления включены"}
                      </div>
                      <div style={{ fontFamily: "IBM Plex Sans, sans-serif", fontSize: "10px", color: "#6b7fa3" }}>
                        {dndNotifications ? "Нажми чтобы включить" : "Нажми чтобы заглушить"}
                      </div>
                    </div>
                    <div className="ml-auto w-8 h-4 rounded-full relative shrink-0" style={{ background: dndNotifications ? "rgba(255,68,68,0.3)" : "rgba(0,255,136,0.3)" }}>
                      <div className="absolute w-2.5 h-2.5 rounded-full top-[3px] transition-all" style={{ background: "#fff", left: dndNotifications ? "2px" : "14px" }} />
                    </div>
                  </button>
                </>
              )}
              <div className="h-px mx-3" style={{ background: "rgba(255,255,255,0.06)" }} />
              <button onClick={() => { setShowUserSettings(true); setStatusMenuOpen(false); }}
                className="w-full flex items-center gap-2.5 px-3 py-2.5 transition-colors text-left hover:bg-white hover:bg-opacity-5">
                <Icon name="Settings" size={13} style={{ color: "#6b7fa3" }} />
                <span style={{ fontFamily: "Rajdhani, sans-serif", fontWeight: 600, fontSize: "13px", color: "#6b7fa3" }}>Открыть настройки</span>
              </button>
            </div>
          )}

          <div className="flex items-center gap-2 px-2 py-1.5 rounded-lg" style={{ background: `${STATUS_META[myStatus].color}08` }}>
            {/* Avatar — click opens status menu */}
            <button className="relative shrink-0" onClick={() => setStatusMenuOpen(v => !v)} title="Сменить статус">
              <UserAvatar
                username={user.username}
                color={user.avatar_color}
                avatarImg={avatarImg}
                size={28}
                showStatus
                status={myStatus}
              />
            </button>
            <div className="flex-1 min-w-0 cursor-pointer" onClick={() => setStatusMenuOpen(v => !v)}>
              <div style={{ fontFamily: "Rajdhani, sans-serif", fontWeight: 600, fontSize: "13px", color: user.avatar_color, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{user.username}</div>
              <div className="flex items-center gap-1">
                {myStatus === "dnd" && dndNotifications && <Icon name="BellOff" size={9} style={{ color: "#ff4444" }} />}
                <div style={{ fontSize: "10px", color: STATUS_META[myStatus].color, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {STATUS_META[myStatus].label}{micMuted ? " · Мик выкл" : ""}{headphonesDeaf ? " · Глушилка" : ""}
                </div>
              </div>
            </div>
            <div className="flex gap-1">
              <button onClick={() => setMicMuted(v => !v)} title={micMuted ? "Включить микрофон" : "Выключить микрофон"}
                className="w-6 h-6 rounded flex items-center justify-center hover:opacity-70 transition-opacity"
                style={{ background: micMuted ? "rgba(255,68,68,0.2)" : "rgba(255,255,255,0.05)" }}>
                <Icon name={micMuted ? "MicOff" : "Mic"} size={12} style={{ color: micMuted ? "#ff4444" : "#6b7fa3" }} />
              </button>
              <button onClick={() => setHeadphonesDeaf(v => !v)} title={headphonesDeaf ? "Включить звук" : "Заглушить наушники"}
                className="w-6 h-6 rounded flex items-center justify-center hover:opacity-70 transition-opacity"
                style={{ background: headphonesDeaf ? "rgba(255,68,68,0.2)" : "rgba(255,255,255,0.05)" }}>
                <Icon name={headphonesDeaf ? "VolumeX" : "Headphones"} size={12} style={{ color: headphonesDeaf ? "#ff4444" : "#6b7fa3" }} />
              </button>
              <button onClick={() => { setShowUserSettings(true); setStatusMenuOpen(false); }} title="Настройки"
                className="w-6 h-6 rounded flex items-center justify-center hover:opacity-70 transition-opacity"
                style={{ background: "rgba(255,255,255,0.05)" }}>
                <Icon name="Settings" size={12} style={{ color: "#6b7fa3" }} />
              </button>
            </div>
          </div>
        </div>
      </div>}

      {/* Main content — only in server mode */}
      {!dmMode && <div className="flex-1 flex flex-col min-w-0" key={activeServer}>

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
            <button onClick={() => setShowStreamCapture(true)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all duration-200 hover:opacity-90" style={{ fontFamily: "Rajdhani, sans-serif", fontWeight: 600, fontSize: "13px", background: streamActive ? "rgba(255,0,170,0.2)" : "rgba(0,255,136,0.1)", color: streamActive ? "#ff00aa" : "#00ff88", border: `1px solid ${streamActive ? "#ff00aa44" : "#00ff8844"}` }}>
              <Icon name={streamActive ? "MonitorOff" : "MonitorPlay"} size={14} />
              {streamActive ? "В эфире" : "Стримить"}
            </button>
            {activeTab === "chat" && (
              <button onClick={() => setShowChannelSettings(true)} className="w-8 h-8 rounded-lg flex items-center justify-center hover:opacity-70 transition-opacity" title="Настройки канала" style={{ background: "rgba(255,255,255,0.05)" }}>
                <Icon name="Settings" size={15} style={{ color: "#6b7fa3" }} />
              </button>
            )}
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
                    <UserAvatar
                      username={msg.user}
                      color={msg.color}
                      avatarImg={msg.user === user.username ? avatarImg : undefined}
                      size={36}
                      onClick={() => { const m = MEMBERS.find(mb => mb.name === msg.user); if (m) setProfileMember(m); }}
                      className="hover:scale-110 transition-all"
                    />
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
              <div className="flex items-center gap-3 flex-wrap">
                <div className="flex items-center gap-2 px-3 py-1 rounded-full animate-pulse-slow" style={{ fontFamily: "Rajdhani, sans-serif", fontWeight: 700, fontSize: "13px", background: "rgba(255,0,170,0.15)", color: "#ff00aa", border: "1px solid rgba(255,0,170,0.3)" }}>
                  <div className="w-2 h-2 rounded-full glow-pulse" style={{ background: "#ff00aa" }} />
                  LIVE: NeonShadow
                </div>
                <span style={{ fontSize: "13px", color: "#6b7fa3", fontFamily: "IBM Plex Sans, sans-serif" }}>Арена #1 · 847 зрителей</span>
                {/* My mic+deaf quick controls */}
                <div className="flex items-center gap-2 ml-auto">
                  <button onClick={() => setMicMuted(v => !v)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition-all"
                    style={{ background: micMuted ? "rgba(255,68,68,0.15)" : "rgba(255,255,255,0.06)", color: micMuted ? "#ff4444" : "#6b7fa3", border: micMuted ? "1px solid rgba(255,68,68,0.3)" : "1px solid transparent", fontFamily: "Rajdhani, sans-serif", fontWeight: 700, fontSize: "12px" }}>
                    <Icon name={micMuted ? "MicOff" : "Mic"} size={14} />
                    {micMuted ? "Мик выкл" : "Мик вкл"}
                  </button>
                  <button onClick={() => setHeadphonesDeaf(v => !v)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition-all"
                    style={{ background: headphonesDeaf ? "rgba(255,68,68,0.15)" : "rgba(255,255,255,0.06)", color: headphonesDeaf ? "#ff4444" : "#6b7fa3", border: headphonesDeaf ? "1px solid rgba(255,68,68,0.3)" : "1px solid transparent", fontFamily: "Rajdhani, sans-serif", fontWeight: 700, fontSize: "12px" }}>
                    <Icon name={headphonesDeaf ? "VolumeX" : "Headphones"} size={14} />
                    {headphonesDeaf ? "Глушилка" : "Звук вкл"}
                  </button>
                </div>
              </div>

              {/* Stream screen */}
              <div className="relative rounded-2xl overflow-hidden stream-border" style={{ background: "linear-gradient(135deg, #0a0f1a, #0d1424)", aspectRatio: "16/9" }}>
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
                  <div className="w-20 h-20 rounded-full flex items-center justify-center" style={{ background: "rgba(255,0,170,0.15)", border: "2px solid rgba(255,0,170,0.3)" }}>
                    <Icon name={streamActive ? "MonitorPlay" : "Monitor"} size={36} style={{ color: "#ff00aa" }} />
                  </div>
                  <div className="text-center">
                    <div style={{ fontFamily: "Orbitron, sans-serif", fontWeight: 700, fontSize: "22px", color: streamActive ? "#00ff88" : "#ff00aa", textShadow: `0 0 20px ${streamActive ? "rgba(0,255,136,0.7)" : "rgba(255,0,170,0.7)"}`, marginBottom: "6px" }}>
                      {streamActive ? "Ваша трансляция идёт" : "NeonShadow LIVE"}
                    </div>
                    <div style={{ fontFamily: "Rajdhani, sans-serif", fontSize: "14px", color: "#6b7fa3" }}>{streamActive ? "Транслируете экран участникам" : "Cyber Arena · Рейд на 3-ю зону"}</div>
                  </div>
                  <button
                    onClick={() => setStreamActive(v => !v)}
                    className="flex items-center gap-2 px-6 py-2.5 rounded-xl transition-all hover:opacity-90"
                    style={{ fontFamily: "Rajdhani, sans-serif", fontWeight: 700, fontSize: "14px", background: streamActive ? "rgba(255,0,170,0.2)" : "rgba(0,255,136,0.15)", color: streamActive ? "#ff00aa" : "#00ff88", border: `1px solid ${streamActive ? "#ff00aa55" : "#00ff8855"}` }}
                  >
                    <Icon name={streamActive ? "MonitorOff" : "MonitorPlay"} size={16} />
                    {streamActive ? "Остановить трансляцию" : "Начать трансляцию"}
                  </button>
                </div>
                {streamActive && (
                  <div className="absolute top-3 right-3 flex items-center gap-1.5 px-2 py-1 rounded-lg" style={{ background: "rgba(0,0,0,0.7)", border: "1px solid rgba(0,255,136,0.3)" }}>
                    <div className="w-1.5 h-1.5 rounded-full glow-pulse" style={{ background: "#00ff88" }} />
                    <span style={{ fontFamily: "Rajdhani, sans-serif", fontWeight: 700, fontSize: "11px", color: "#00ff88" }}>В ЭФИРЕ</span>
                  </div>
                )}
                {!streamActive && (
                  <div className="absolute top-3 right-3 flex items-center gap-1.5 px-2 py-1 rounded-lg" style={{ background: "rgba(0,0,0,0.7)", border: "1px solid rgba(255,0,170,0.3)" }}>
                    <div className="w-1.5 h-1.5 rounded-full glow-pulse" style={{ background: "#ff00aa" }} />
                    <span style={{ fontFamily: "Rajdhani, sans-serif", fontWeight: 700, fontSize: "11px", color: "#ff00aa" }}>LIVE</span>
                  </div>
                )}
              </div>

              {/* Stream source options */}
              <div>
                <div style={{ fontFamily: "Rajdhani, sans-serif", fontWeight: 600, fontSize: "11px", color: "#6b7fa3", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "10px" }}>Источник трансляции</div>
                <div className="grid grid-cols-4 gap-3">
                  {[
                    { icon: "Monitor", label: "Весь экран", desc: "Рабочий стол", color: "#00ff88" },
                    { icon: "AppWindow", label: "Приложение", desc: "Выбрать окно", color: "#00aaff" },
                    { icon: "Gamepad2", label: "Игра", desc: "Захват игры", color: "#aa00ff" },
                    { icon: "Video", label: "Камера", desc: "Веб-камера", color: "#ff00aa" },
                  ].map((opt, i) => (
                    <button key={i} onClick={() => setStreamActive(true)} className="flex flex-col items-center gap-2 p-3 rounded-xl transition-all hover:opacity-80 active:scale-95" style={{ background: opt.color + "11", border: `1px solid ${opt.color}33` }}>
                      <Icon name={opt.icon} size={22} style={{ color: opt.color }} />
                      <div>
                        <div style={{ fontFamily: "Rajdhani, sans-serif", fontWeight: 700, fontSize: "13px", color: "#e2e8f0" }}>{opt.label}</div>
                        <div style={{ fontSize: "11px", color: "#6b7fa3" }}>{opt.desc}</div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Active streamers */}
              <div>
                <div style={{ fontFamily: "Rajdhani, sans-serif", fontWeight: 600, fontSize: "11px", color: "#6b7fa3", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "12px" }}>Активные трансляции</div>
                <div className="space-y-2">
                  {[
                    { name: "NeonShadow", viewers: 847, game: "Cyber Arena", color: "#ff00aa", source: "Игра" },
                    { name: "PixelKnight", viewers: 234, game: "Void Tactics", color: "#00aaff", source: "Приложение" },
                  ].map((s, i) => (
                    <div key={i} className="flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all hover:opacity-80" style={{ background: "var(--dark-card)", border: "1px solid rgba(255,255,255,0.05)" }}>
                      <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0" style={{ background: s.color + "22", color: s.color, border: `1px solid ${s.color}44`, fontFamily: "Rajdhani, sans-serif", fontWeight: 700, fontSize: "12px" }}>
                        {s.name.slice(0, 2).toUpperCase()}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span style={{ fontFamily: "Rajdhani, sans-serif", fontWeight: 600, fontSize: "14px", color: "#e2e8f0" }}>{s.name}</span>
                          <span style={{ fontFamily: "Rajdhani, sans-serif", fontWeight: 700, fontSize: "10px", background: s.color + "22", color: s.color, padding: "1px 5px", borderRadius: "3px" }}>{s.source}</span>
                        </div>
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
      </div>}

      {/* Members sidebar — only in server mode */}
      {!dmMode && activeTab === "chat" && (
        <div className="w-[210px] shrink-0 overflow-y-auto py-3" style={{ background: "var(--dark-panel)", borderLeft: "1px solid rgba(0,255,136,0.08)" }}>
          <div className="px-3">
            {/* Group by role */}
            {ROLES.map(role => {
              const roleMembers = MEMBERS.filter(m => m.role === role.name && m.status !== "offline");
              if (roleMembers.length === 0) return null;
              return (
                <div key={role.id} className="mb-3">
                  <div className="flex items-center gap-1.5 mb-1.5 px-1">
                    <div className="w-2 h-2 rounded-full" style={{ background: role.color }} />
                    <span style={{ fontFamily: "Rajdhani, sans-serif", fontWeight: 700, fontSize: "10px", color: role.color, textTransform: "uppercase", letterSpacing: "0.8px" }}>
                      {role.name} — {roleMembers.length}
                    </span>
                  </div>
                  {roleMembers.map(member => (
                    <div key={member.id} onClick={() => setProfileMember(member)}
                      className="flex items-center gap-2 py-1.5 px-2 rounded-xl cursor-pointer transition-all" style={{ marginBottom: "1px" }}
                      onMouseEnter={e => (e.currentTarget.style.background = role.color + "10")}
                      onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                    >
                      <div className="relative shrink-0">
                        <div className="w-7 h-7 rounded-full flex items-center justify-center" style={{ background: member.color + "22", color: member.color, border: `1px solid ${member.color}33`, fontFamily: "Rajdhani, sans-serif", fontWeight: 700, fontSize: "10px" }}>
                          {member.avatar}
                        </div>
                        <div className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 status-${member.status}`} style={{ borderColor: "var(--dark-panel)" }} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div style={{ fontFamily: "Rajdhani, sans-serif", fontWeight: 700, fontSize: "12px", color: member.color, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{member.name}</div>
                        {member.status === "streaming"
                          ? <div style={{ fontFamily: "Rajdhani, sans-serif", fontSize: "9px", color: "#ff00aa" }}>🔴 В эфире</div>
                          : member.game && <div style={{ fontFamily: "IBM Plex Sans, sans-serif", fontSize: "9px", color: "#6b7fa3", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{member.game}</div>
                        }
                      </div>
                    </div>
                  ))}
                </div>
              );
            })}

            {/* Offline */}
            {MEMBERS.filter(m => m.status === "offline").length > 0 && (
              <div className="mb-2">
                <div className="flex items-center gap-1.5 mb-1.5 px-1">
                  <div className="w-2 h-2 rounded-full" style={{ background: "#4a5568" }} />
                  <span style={{ fontFamily: "Rajdhani, sans-serif", fontWeight: 700, fontSize: "10px", color: "#4a5568", textTransform: "uppercase", letterSpacing: "0.8px" }}>
                    Офлайн — {MEMBERS.filter(m => m.status === "offline").length}
                  </span>
                </div>
                {MEMBERS.filter(m => m.status === "offline").map(member => (
                  <div key={member.id} onClick={() => setProfileMember(member)}
                    className="flex items-center gap-2 py-1.5 px-2 rounded-xl cursor-pointer transition-all" style={{ marginBottom: "1px", opacity: 0.4 }}
                    onMouseEnter={e => (e.currentTarget.style.opacity = "0.65")}
                    onMouseLeave={e => (e.currentTarget.style.opacity = "0.4")}
                  >
                    <div className="w-7 h-7 rounded-full flex items-center justify-center shrink-0" style={{ background: "#1a2030", color: "#4a5568", fontFamily: "Rajdhani, sans-serif", fontWeight: 700, fontSize: "10px" }}>
                      {member.avatar}
                    </div>
                    <div style={{ fontFamily: "Rajdhani, sans-serif", fontWeight: 600, fontSize: "12px", color: "#4a5568", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{member.name}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}