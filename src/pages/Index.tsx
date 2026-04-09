import { useState, useEffect, useRef } from "react";
import Icon from "@/components/ui/icon";

import ServerSettings from "@/components/ServerSettings";
import UserSettings from "@/components/UserSettings";
import CreateServerModal from "@/components/CreateServerModal";
import ChannelSettings from "@/components/ChannelSettings";
import StreamCapture from "@/components/StreamCapture";
import DMView from "@/components/DMView";
import ProfileModal from "@/components/ProfileModal";
import UserAvatar from "@/components/UserAvatar";
import AudioDevicePicker from "@/components/AudioDevicePicker";
import { useWebRTC } from "@/hooks/useWebRTC";
import { useMicLevel } from "@/hooks/useMicLevel";

const MESSAGES_URL = "https://functions.poehali.dev/bd122cd3-cf73-44cb-b4a3-4b1eb3cfdaac";
const API_URL = "https://functions.poehali.dev/34ebed0a-100a-450c-8c07-780342df2a96";
const ONLINE_URL = "https://functions.poehali.dev/66112eb3-a471-46d1-b43a-c46fa78fbe18";
const EXTRA_URL = "https://functions.poehali.dev/c074df0d-1419-4f35-8521-e4b9d170082c";

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
interface ServerMember { id: number; name: string; role: string; roleColor: string; status: string; avatar: string; game: string; color: string; avatarImg?: string; bannerImg?: string; }
interface ServerRole { id: number; name: string; color: string; members: number; perms: string[]; }
interface VoiceParticipant {
  user_id: number;
  username: string;
  avatar_color: string;
  muted: boolean;
  deafened: boolean;
  streaming: boolean;
  video: boolean;
}

interface Msg {
  id: number;
  user: string;
  user_id?: number;
  avatar: string;
  color: string;
  role: string;
  roleColor: string;
  time: string;
  text: string;
  reactions: { emoji: string; count: number; user_ids?: number[] }[];
  file_url?: string;
  file_name?: string;
  file_type?: string;
  edited?: boolean;
  is_removed?: boolean;
  reply_to_id?: number;
  reply_to_text?: string;
  reply_to_user?: string;
  mentions?: string;
  date?: string;
}

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

type Tab = "chat" | "users" | "roles" | "settings" | "streaming" | "voice" | "forum";
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
  const [channels, setChannels] = useState<Record<number, TextChannel[]>>({});
  const [onlineMembers, setOnlineMembers] = useState<{ id: number; username: string; avatar_color: string; status: string }[]>([]);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<{ id: number; username?: string; text?: string; time?: string; date?: string; channel_id?: number; avatar_color?: string }[]>([]);
  const [searchType, setSearchType] = useState<"messages" | "users">("messages");
  const [editingMsgId, setEditingMsgId] = useState<number | null>(null);
  const [editingText, setEditingText] = useState("");
  const [menuMsgId, setMenuMsgId] = useState<number | null>(null);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [activeVoiceChannel, setActiveVoiceChannel] = useState<number | null>(null);
  const [voiceParticipants, setVoiceParticipants] = useState<Record<string, VoiceParticipant[]>>({});
  const [myStream, setMyStream] = useState<MediaStream | null>(null);
  const [screenStream, setScreenStream] = useState<MediaStream | null>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [hasVideo, setHasVideo] = useState(false);
  const [showVoiceDevicePicker, setShowVoiceDevicePicker] = useState(false);
  const [forumThreads, setForumThreads] = useState<{ id: number; title: string; content: string; author_name: string; avatar_color: string; tags?: string; pinned?: boolean; locked?: boolean; created_at: string; reply_count: number }[]>([]);
  const [activeForumChannel, setActiveForumChannel] = useState<number | null>(null);
  const [activeThread, setActiveThread] = useState<{ id: number; title: string; content: string; author_name: string; avatar_color: string; tags?: string; pinned?: boolean; locked?: boolean; created_at: string; reply_count: number } | null>(null);
  const [threadReplies, setThreadReplies] = useState<{ id: number; author_name: string; avatar_color: string; content: string; created_at: string }[]>([]);
  const [newThreadTitle, setNewThreadTitle] = useState("");
  const [newThreadContent, setNewThreadContent] = useState("");
  const [newThreadTags, setNewThreadTags] = useState("");
  const [showNewThread, setShowNewThread] = useState(false);
  const [replyInput, setReplyInput] = useState("");
  // Typing indicator
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  // Reply-to
  const [replyTo, setReplyTo] = useState<{ id: number; text: string; user: string } | null>(null);
  // Pinned messages
  const [pinnedMessages, setPinnedMessages] = useState<{ id: number; username: string; avatar_color: string; text: string; time: string; pinned_at: string }[]>([]);
  const [showPinned, setShowPinned] = useState(false);
  // Invite modal
  const [showInvite, setShowInvite] = useState(false);
  const [inviteCode, setInviteCode] = useState("");
  const [inviteLoading, setInviteLoading] = useState(false);
  const [joinCode, setJoinCode] = useState("");
  const [joinStatus, setJoinStatus] = useState<"idle" | "loading" | "ok" | "error">("idle");
  const [joinError, setJoinError] = useState("");
  // Members sidebar
  const [showMembersSidebar, setShowMembersSidebar] = useState(true);
  // @mention autocomplete
  const [mentionQuery, setMentionQuery] = useState("");
  const [mentionOpen, setMentionOpen] = useState(false);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const heartbeatRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const onlinePollingRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const notifAudioRef = useRef<HTMLAudioElement | null>(null);
  const prevMsgCountRef = useRef<number>(0);
  const voicePingRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const screenVideoRef = useRef<HTMLVideoElement | null>(null);
  // Refs для актуальных значений в замыкании voicePingRef
  const micMutedRef = useRef(false);
  const headphonesDeafRef = useRef(false);
  const isStreamingRef = useRef(false);
  const activeVoiceChannelRef = useRef<number | null>(null);
  const activeServerRef = useRef<number>(1);

  // Синхронизация refs с актуальными state-значениями
  micMutedRef.current = micMuted;
  headphonesDeafRef.current = headphonesDeaf;
  isStreamingRef.current = isStreaming;
  activeVoiceChannelRef.current = activeVoiceChannel;
  activeServerRef.current = activeServer;

  // WebRTC для голосовых каналов (без call_id — каналы не используют p2p сигналинг, только устройства)
  const voiceWebRTC = useWebRTC({
    userId: user?.id ?? 0,
    callId: null,
    remoteUserId: null,
    isInitiator: false,
    withVideo: hasVideo,
  });

  // Уровень громкости микрофона (0..1)
  const micLevel = useMicLevel(myStream, micMuted);

  const server = servers.find(s => s.id === activeServer) || servers[0];
  const sData = SERVER_DATA[activeServer] || SERVER_DATA[1];
  const CHANNELS = sData.channels;
  const MEMBERS = sData.members;
  const ROLES = sData.roles;
  const messages = serverMessages[activeServer]?.[activeChannel] || [];
  const channel = CHANNELS.text.find(c => c.id === activeChannel) || CHANNELS.text[0];

  const lastMsgIdRef = useRef<Record<string, number>>({});
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const chatBottomRef = useRef<HTMLDivElement>(null);

  const fetchMessages = async (serverId: number, channelId: number) => {
    const key = `${serverId}_${channelId}`;
    const afterId = lastMsgIdRef.current[key] || 0;
    try {
      const res = await fetch(`${MESSAGES_URL}?server_id=${serverId}&channel_id=${channelId}&after_id=${afterId}`);
      const data = await res.json();
      if (!data.messages?.length) return;
      const newMsgs: Msg[] = data.messages.map((m: {
        id: number; user_id?: number; username: string; avatar_color: string;
        text: string; time: string; date?: string; file_url?: string; file_name?: string;
        file_type?: string; edited?: boolean; is_removed?: boolean;
        reactions?: { emoji: string; count: number; user_ids?: number[] }[];
        reply_to_id?: number; reply_to_text?: string; reply_to_user?: string; mentions?: string;
      }) => ({
        id: m.id,
        user_id: m.user_id,
        user: m.username,
        avatar: m.username.slice(0, 2).toUpperCase(),
        color: m.avatar_color,
        role: "",
        roleColor: m.avatar_color,
        time: m.time,
        date: m.date,
        text: m.text,
        reactions: m.reactions || [],
        file_url: m.file_url,
        file_name: m.file_name,
        file_type: m.file_type,
        edited: m.edited,
        is_removed: m.is_removed,
        reply_to_id: m.reply_to_id,
        reply_to_text: m.reply_to_text,
        reply_to_user: m.reply_to_user,
        mentions: m.mentions,
      }));
      lastMsgIdRef.current[key] = data.messages[data.messages.length - 1].id;
      // звук уведомления при новом сообщении
      if (prevMsgCountRef.current > 0 && notifAudioRef.current?.paused !== false) {
        try { notifAudioRef.current?.play().catch(() => {}); } catch { /* silent */ }
      }
      prevMsgCountRef.current = (serverMessages[serverId]?.[channelId]?.length || 0) + newMsgs.length;
      setServerMessages(prev => ({
        ...prev,
        [serverId]: {
          ...(prev[serverId] || {}),
          [channelId]: [
            ...(prev[serverId]?.[channelId] || []).filter(m => m.id < 1e12),
            ...newMsgs,
          ],
        },
      }));
      setTimeout(() => chatBottomRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
    } catch { /* silent */ }
  };

  useEffect(() => {
    if (pollingRef.current) clearInterval(pollingRef.current);
    setServerMessages(prev => ({
      ...prev,
      [activeServer]: { ...(prev[activeServer] || {}), [activeChannel]: [] },
    }));
    lastMsgIdRef.current[`${activeServer}_${activeChannel}`] = 0;
    fetchMessages(activeServer, activeChannel);
    pollingRef.current = setInterval(() => fetchMessages(activeServer, activeChannel), 2000);
    return () => { if (pollingRef.current) clearInterval(pollingRef.current); };
  }, [activeServer, activeChannel]);

  // Загрузка серверов и каналов при старте
  useEffect(() => {
    fetchServers();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    fetchChannels(activeServer);
    fetchOnlineMembers();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeServer]);

  // Heartbeat каждые 20 секунд
  useEffect(() => {
    sendHeartbeat();
    heartbeatRef.current = setInterval(sendHeartbeat, 20000);
    return () => { if (heartbeatRef.current) clearInterval(heartbeatRef.current); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [myStatus]);

  // Онлайн участники каждые 15 секунд
  useEffect(() => {
    onlinePollingRef.current = setInterval(fetchOnlineMembers, 15000);
    return () => { if (onlinePollingRef.current) clearInterval(onlinePollingRef.current); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeServer]);

  const switchServer = (id: number) => {
    setActiveServer(id);
    const dbChs = channels[id];
    const fallbackCh = (SERVER_DATA[id] || SERVER_DATA[1]).channels.text[0];
    setActiveChannel(dbChs?.[0]?.id || fallbackCh?.id || 101);
    setActiveTab("chat");
  };

  const sendMessage = async () => {
    if (!inputValue.trim()) return;
    const text = inputValue.trim();
    const currentReplyTo = replyTo;
    setInputValue("");
    setReplyTo(null);
    setMentionOpen(false);
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    const mentionRegex = /@(\w+)/g;
    const foundMentions = [...text.matchAll(mentionRegex)].map(m => m[1]).join(",");

    // Оптимистично добавляем сообщение сразу
    const tempId = Date.now();
    const now = new Date();
    const optimisticMsg: Msg = {
      id: tempId,
      user_id: user.id,
      user: user.username,
      avatar: user.username.slice(0, 2).toUpperCase(),
      color: user.avatar_color,
      role: "",
      roleColor: user.avatar_color,
      time: now.toTimeString().slice(0, 5),
      text,
      reactions: [],
      reply_to_id: currentReplyTo?.id,
      reply_to_text: currentReplyTo?.text,
      reply_to_user: currentReplyTo?.user,
      mentions: foundMentions,
    };
    setServerMessages(prev => ({
      ...prev,
      [activeServer]: {
        ...(prev[activeServer] || {}),
        [activeChannel]: [...(prev[activeServer]?.[activeChannel] || []), optimisticMsg],
      },
    }));
    setTimeout(() => chatBottomRef.current?.scrollIntoView({ behavior: "smooth" }), 30);

    try {
      const res = await fetch(MESSAGES_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          server_id: activeServer,
          channel_id: activeChannel,
          user_id: user.id,
          username: user.username,
          avatar_color: user.avatar_color,
          text,
          reply_to_id: currentReplyTo?.id ?? null,
          reply_to_text: currentReplyTo?.text ?? "",
          reply_to_user: currentReplyTo?.user ?? "",
          mentions: foundMentions,
        }),
      });
      const saved = await res.json();
      if (saved.id) {
        // Заменяем temp-сообщение реальным и обновляем lastMsgId
        setServerMessages(prev => ({
          ...prev,
          [activeServer]: {
            ...(prev[activeServer] || {}),
            [activeChannel]: (prev[activeServer]?.[activeChannel] || [])
              .map(m => m.id === tempId ? { ...optimisticMsg, id: saved.id, time: saved.time } : m),
          },
        }));
        lastMsgIdRef.current[`${activeServer}_${activeChannel}`] = saved.id;
      }
    } catch {
      // При ошибке убираем оптимистичное сообщение
      setServerMessages(prev => ({
        ...prev,
        [activeServer]: {
          ...(prev[activeServer] || {}),
          [activeChannel]: (prev[activeServer]?.[activeChannel] || []).filter(m => m.id !== tempId),
        },
      }));
    }
  };

  // Typing indicator
  const handleInputChange = (val: string) => {
    setInputValue(val);
    // @ autocomplete
    const lastAt = val.lastIndexOf("@");
    if (lastAt !== -1 && lastAt === val.length - 1 - (val.length - 1 - lastAt)) {
      const query = val.slice(lastAt + 1);
      if (query.length >= 0) { setMentionQuery(query); setMentionOpen(true); }
    } else { setMentionOpen(false); }
    // Typing
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    fetch(EXTRA_URL, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "typing_start", server_id: activeServer, channel_id: activeChannel, user_id: user.id, username: user.username }),
    }).catch(() => {});
    typingTimeoutRef.current = setTimeout(() => {}, 5000);
  };

  // Загрузка typing пользователей
  const fetchTyping = async () => {
    try {
      const res = await fetch(`${EXTRA_URL}?action=typing_list&channel_id=${activeChannel}&user_id=${user.id}`);
      const data = await res.json();
      setTypingUsers(data.typing || []);
    } catch { /* silent */ }
  };

  // Загрузка закреплённых
  const fetchPinned = async () => {
    try {
      const res = await fetch(`${EXTRA_URL}?action=get_pinned&channel_id=${activeChannel}`);
      const data = await res.json();
      if (data.pinned) setPinnedMessages(data.pinned);
    } catch { /* silent */ }
  };

  // Закрепить/открепить сообщение
  const pinMessage = async (msgId: number) => {
    try {
      await fetch(EXTRA_URL, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "pin_message", server_id: activeServer, channel_id: activeChannel, message_id: msgId, user_id: user.id }),
      });
      fetchPinned();
    } catch { /* silent */ }
  };

  const unpinMessage = async (msgId: number) => {
    try {
      await fetch(EXTRA_URL, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "unpin_message", channel_id: activeChannel, message_id: msgId }),
      });
      fetchPinned();
    } catch { /* silent */ }
  };

  // Typing polling при смене канала
  useEffect(() => {
    setTypingUsers([]);
    setReplyTo(null);
    setMentionOpen(false);
    fetchPinned();
    const typingInterval = setInterval(fetchTyping, 2500);
    return () => clearInterval(typingInterval);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeChannel]);

  // Создать инвайт
  const createInvite = async () => {
    setInviteLoading(true);
    try {
      const res = await fetch(EXTRA_URL, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "create_invite", server_id: activeServer, user_id: user.id }),
      });
      const data = await res.json();
      if (data.code) setInviteCode(data.code);
    } catch { /* silent */ }
    setInviteLoading(false);
  };

  // Вступить по инвайту
  const joinByInvite = async () => {
    if (!joinCode.trim()) return;
    setJoinStatus("loading");
    try {
      const res = await fetch(EXTRA_URL, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "use_invite", code: joinCode.trim(), user_id: user.id }),
      });
      const data = await res.json();
      if (data.ok) {
        setJoinStatus("ok");
        setJoinCode("");
        fetchServers();
        setTimeout(() => setJoinStatus("idle"), 2500);
      } else {
        setJoinStatus("error");
        setJoinError(data.error || "Ошибка");
        setTimeout(() => setJoinStatus("idle"), 3000);
      }
    } catch {
      setJoinStatus("error");
      setJoinError("Ошибка соединения");
      setTimeout(() => setJoinStatus("idle"), 3000);
    }
  };

  // Heartbeat онлайн
  const sendHeartbeat = async () => {
    try {
      await fetch(ONLINE_URL, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: user.id, status: myStatus }),
      });
    } catch { /* silent */ }
  };

  // Загрузка онлайн-участников
  const fetchOnlineMembers = async () => {
    try {
      const res = await fetch(`${ONLINE_URL}?server_id=${activeServer}`);
      const data = await res.json();
      if (data.online) setOnlineMembers(data.online);
    } catch { /* silent */ }
  };

  // Загрузка каналов с сервера
  const fetchChannels = async (serverId: number) => {
    try {
      const res = await fetch(`${API_URL}?action=get_channels&server_id=${serverId}`);
      const data = await res.json();
      if (data.channels?.length) {
        setChannels(prev => ({ ...prev, [serverId]: data.channels.filter((c: { type: string }) => c.type === "text") }));
      }
    } catch { /* silent */ }
  };

  // Загрузка серверов из БД
  const fetchServers = async () => {
    try {
      const res = await fetch(`${API_URL}?action=get_servers&user_id=${user.id}`);
      const data = await res.json();
      if (data.servers?.length) {
        setServers(data.servers.map((s: { id: number; name: string; abbr: string; color: string; members: number }) => ({ ...s, unread: 0 })));
      }
    } catch { /* silent */ }
  };

  // Поиск
  const doSearch = async () => {
    if (searchQuery.trim().length < 2) return;
    try {
      const res = await fetch(`${API_URL}?action=search&q=${encodeURIComponent(searchQuery)}&type=${searchType}&server_id=${activeServer}`);
      const data = await res.json();
      setSearchResults(searchType === "users" ? (data.users || []) : (data.messages || []));
    } catch { /* silent */ }
  };

  // Toggle реакция
  const toggleReaction = async (msgId: number, emoji: string) => {
    try {
      await fetch(API_URL, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "toggle_reaction", message_id: msgId, user_id: user.id, emoji }),
      });
      setServerMessages(prev => {
        const msgs = [...(prev[activeServer]?.[activeChannel] || [])];
        const idx = msgs.findIndex(m => m.id === msgId);
        if (idx === -1) return prev;
        const msg = { ...msgs[idx] };
        const rIdx = msg.reactions.findIndex(r => r.emoji === emoji);
        if (rIdx >= 0) {
          const alreadyReacted = msg.reactions[rIdx].user_ids?.includes(user.id);
          msg.reactions = msg.reactions.map((re, i) => i === rIdx
            ? { ...re, count: alreadyReacted ? re.count - 1 : re.count + 1, user_ids: alreadyReacted ? re.user_ids?.filter(uid => uid !== user.id) : [...(re.user_ids || []), user.id] }
            : re
          ).filter(re => re.count > 0);
        } else {
          msg.reactions = [...msg.reactions, { emoji, count: 1, user_ids: [user.id] }];
        }
        msgs[idx] = msg;
        return { ...prev, [activeServer]: { ...prev[activeServer], [activeChannel]: msgs } };
      });
    } catch { /* silent */ }
  };

  // Редактирование сообщения
  const editMessage = async (msgId: number, newText: string) => {
    try {
      await fetch(MESSAGES_URL, {
        method: "PUT", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: msgId, user_id: user.id, action: "edit", text: newText }),
      });
      setServerMessages(prev => {
        const msgs = (prev[activeServer]?.[activeChannel] || []).map(m =>
          m.id === msgId ? { ...m, text: newText, edited: true } : m
        );
        return { ...prev, [activeServer]: { ...prev[activeServer], [activeChannel]: msgs } };
      });
      setEditingMsgId(null);
      setEditingText("");
    } catch { /* silent */ }
  };

  // Удаление сообщения
  const removeMessage = async (msgId: number) => {
    try {
      await fetch(MESSAGES_URL, {
        method: "PUT", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: msgId, user_id: user.id, action: "remove" }),
      });
      setServerMessages(prev => {
        const msgs = (prev[activeServer]?.[activeChannel] || []).map(m =>
          m.id === msgId ? { ...m, text: "Сообщение удалено", is_removed: true } : m
        );
        return { ...prev, [activeServer]: { ...prev[activeServer], [activeChannel]: msgs } };
      });
      setMenuMsgId(null);
    } catch { /* silent */ }
  };

  // Загрузка файла
  const handleFileUpload = async (file: File) => {
    setUploadingFile(true);
    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const base64 = (e.target?.result as string)?.split(",")[1];
        if (!base64) { setUploadingFile(false); return; }
        await fetch(MESSAGES_URL, {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            server_id: activeServer, channel_id: activeChannel,
            user_id: user.id, username: user.username, avatar_color: user.avatar_color,
            text: "", file_data: base64, file_name: file.name, file_type: file.type,
          }),
        });
        fetchMessages(activeServer, activeChannel);
        setUploadingFile(false);
      };
      reader.readAsDataURL(file);
    } catch { setUploadingFile(false); }
  };

  // Войти в голосовой канал
  const joinVoiceChannel = async (channelId: number) => {
    if (activeVoiceChannelRef.current === channelId) {
      await leaveVoiceChannel();
      return;
    }
    if (activeVoiceChannelRef.current) await leaveVoiceChannel();

    try {
      const micId = voiceWebRTC.selectedMic;
      const audioConstraint = micId && micId !== "default" ? { deviceId: { exact: micId } } : true;
      const stream = await navigator.mediaDevices.getUserMedia({ audio: audioConstraint, video: false });
      setMyStream(stream);
      stream.getAudioTracks().forEach(t => { t.enabled = !micMutedRef.current; });
    } catch { /* нет микрофона — продолжаем без него */ }

    const serverId = activeServerRef.current;
    await fetch(API_URL, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "voice_join", server_id: serverId, channel_id: channelId, user_id: user.id, username: user.username, avatar_color: user.avatar_color }),
    }).catch(() => {});

    setActiveVoiceChannel(channelId);
    setActiveTab("voice");

    // Немедленно загружаем список участников
    const doVoiceSync = async () => {
      const cid = activeVoiceChannelRef.current;
      const sid = activeServerRef.current;
      if (!cid) return;
      await fetch(API_URL, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "voice_ping", server_id: sid, channel_id: cid, user_id: user.id,
          muted: micMutedRef.current, deafened: headphonesDeafRef.current,
          streaming: isStreamingRef.current, video: false,
        }),
      }).catch(() => {});
      const res = await fetch(`${API_URL}?action=voice_list&server_id=${sid}`).catch(() => null);
      const data = await res?.json().catch(() => ({})) || {};
      if (data.channels) setVoiceParticipants(data.channels);
    };

    doVoiceSync();
    if (voicePingRef.current) clearInterval(voicePingRef.current);
    voicePingRef.current = setInterval(doVoiceSync, 5000);
  };

  // Выйти из голосового канала
  const leaveVoiceChannel = async () => {
    const cid = activeVoiceChannelRef.current;
    if (!cid) return;
    if (voicePingRef.current) { clearInterval(voicePingRef.current); voicePingRef.current = null; }
    setMyStream(prev => { prev?.getTracks().forEach(t => t.stop()); return null; });
    setScreenStream(prev => { prev?.getTracks().forEach(t => t.stop()); return null; });
    setIsStreaming(false);
    await fetch(API_URL, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "voice_leave", server_id: activeServerRef.current, channel_id: cid, user_id: user.id }),
    }).catch(() => {});
    setActiveVoiceChannel(null);
    setVoiceParticipants({});
    setActiveTab("chat");
  };

  // Начать стриминг экрана
  const startScreenShare = async () => {
    if (!activeVoiceChannelRef.current) return;
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: true });
      setScreenStream(stream);
      setIsStreaming(true);
      stream.getVideoTracks()[0].onended = () => { setScreenStream(null); setIsStreaming(false); };
      // Устанавливаем srcObject через небольшую задержку чтобы элемент успел отрендериться
      setTimeout(() => { if (screenVideoRef.current) screenVideoRef.current.srcObject = stream; }, 100);
    } catch { /* пользователь отменил */ }
  };

  const stopScreenShare = () => {
    if (screenStream) { screenStream.getTracks().forEach(t => t.stop()); setScreenStream(null); }
    setIsStreaming(false);
  };

  // Форум
  const fetchForumThreads = async (channelId: number) => {
    try {
      const res = await fetch(`${API_URL}?action=forum_list&server_id=${activeServer}&channel_id=${channelId}`);
      const data = await res.json();
      if (data.threads) setForumThreads(data.threads);
    } catch { /* silent */ }
  };

  const createThread = async () => {
    if (!newThreadTitle.trim() || !newThreadContent.trim() || !activeForumChannel) return;
    try {
      await fetch(API_URL, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "forum_create", server_id: activeServer, channel_id: activeForumChannel, author_id: user.id, author_name: user.username, avatar_color: user.avatar_color, title: newThreadTitle.trim(), content: newThreadContent.trim(), tags: newThreadTags.trim() }),
      });
      setShowNewThread(false); setNewThreadTitle(""); setNewThreadContent(""); setNewThreadTags("");
      fetchForumThreads(activeForumChannel);
    } catch { /* silent */ }
  };

  const fetchThreadReplies = async (threadId: number) => {
    try {
      const res = await fetch(`${API_URL}?action=forum_replies&thread_id=${threadId}`);
      const data = await res.json();
      if (data.replies) setThreadReplies(data.replies);
    } catch { /* silent */ }
  };

  const postReply = async () => {
    if (!replyInput.trim() || !activeThread) return;
    try {
      await fetch(API_URL, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "forum_reply", thread_id: activeThread.id, author_id: user.id, author_name: user.username, avatar_color: user.avatar_color, content: replyInput.trim() }),
      });
      setReplyInput("");
      fetchThreadReplies(activeThread.id);
    } catch { /* silent */ }
  };

  return (
    <>
    <audio ref={notifAudioRef} src="https://cdn.poehali.dev/projects/p25996638/bucket/notif.mp3" preload="auto" />
    <input type="file" ref={fileInputRef} className="hidden" accept="image/*,video/*,.pdf,.txt,.zip" onChange={e => { const f = e.target.files?.[0]; if (f) handleFileUpload(f); e.target.value = ""; }} />
    <div className="flex h-screen overflow-hidden" style={{ background: "var(--dark-bg)", fontFamily: "IBM Plex Sans, sans-serif" }}>
      {showServerSettings && <ServerSettings
        server={server}
        onClose={() => setShowServerSettings(false)}
        currentUserId={user.id}
        currentUserRole={(server as { owner_id?: number }).owner_id === user.id ? "admin" : "member"}
        onDelete={async () => {
          try {
            await fetch(API_URL, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ action: "remove_server", server_id: activeServer, user_id: user.id }),
            });
            setServers(prev => prev.filter(s => s.id !== activeServer));
            const remaining = servers.filter(s => s.id !== activeServer);
            if (remaining.length > 0) switchServer(remaining[0].id);
          } catch { /* silent */ }
        }}
      />}
      {showUserSettings && <UserSettings user={user} avatarImg={avatarImg} onAvatarChange={onAvatarChange} onClose={() => setShowUserSettings(false)} onLogout={onLogout} />}
      {showCreateServer && <CreateServerModal onClose={() => setShowCreateServer(false)} onCreate={async (s) => {
        const res = await fetch(API_URL, {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "create_server", name: s.name, owner_id: user.id, color: s.color, abbr: s.abbr }),
        });
        const data = await res.json();
        if (data.id) {
          setServers(prev => [...prev, { ...data, unread: 0 }]);
          setActiveServer(data.id);
          fetchChannels(data.id);
        }
      }} />}
      {showChannelSettings && <ChannelSettings channel={sData.channels.text.find(c => c.id === activeChannel) || sData.channels.text[0]} onClose={() => setShowChannelSettings(false)} />}
      {showStreamCapture && <StreamCapture onClose={() => setShowStreamCapture(false)} onStart={() => setShowStreamCapture(false)} />}
      {profileMember && (
        <ProfileModal
          member={{ id: profileMember.id, name: profileMember.name, color: profileMember.color, role: profileMember.role, roleColor: profileMember.roleColor, status: profileMember.status, avatar: profileMember.avatar, game: profileMember.game, mutual: 3 }}
          onClose={() => setProfileMember(null)}
          onMessage={() => { setDmMode(true); setProfileMember(null); }}
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
              <div key={ch.id}>
                <button
                  onClick={() => joinVoiceChannel(ch.id)}
                  className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg mb-0.5 transition-all duration-150 text-left"
                  style={{
                    background: activeVoiceChannel === ch.id ? "rgba(0,255,136,0.12)" : "transparent",
                    boxShadow: activeVoiceChannel === ch.id ? "inset 3px 0 0 #00ff88" : "none",
                  }}>
                  <Icon name={activeVoiceChannel === ch.id ? "Volume2" : (ch.streaming ? "Radio" : "Volume2")} size={13}
                    style={{ color: activeVoiceChannel === ch.id ? "#00ff88" : ch.streaming ? "#ff00aa" : "#6b7fa3" }} />
                  <span className="flex-1 text-sm" style={{ fontFamily: "IBM Plex Sans, sans-serif", color: activeVoiceChannel === ch.id ? "#e2e8f0" : "#8899bb" }}>{ch.name}</span>
                  {ch.streaming && activeVoiceChannel !== ch.id && <span style={{ background: "rgba(255,0,170,0.2)", color: "#ff00aa", fontSize: "9px", fontFamily: "Rajdhani, sans-serif", fontWeight: 700, padding: "1px 4px", borderRadius: "3px" }}>LIVE</span>}
                  {(voiceParticipants[String(ch.id)]?.length || 0) > 0 && (
                    <span style={{ color: "#6b7fa3", fontSize: "11px", fontFamily: "Rajdhani, sans-serif" }}>
                      {voiceParticipants[String(ch.id)].length}
                    </span>
                  )}
                </button>
                {/* Участники в канале */}
                {voiceParticipants[String(ch.id)]?.map(p => (
                  <div key={p.user_id} className="flex items-center gap-2 px-4 py-0.5 mb-0.5">
                    <div className="w-5 h-5 rounded-full flex items-center justify-center" style={{ background: p.avatar_color + "22", color: p.avatar_color, fontSize: "8px", fontFamily: "Rajdhani, sans-serif", fontWeight: 700 }}>
                      {p.username.slice(0,2).toUpperCase()}
                    </div>
                    <span style={{ fontSize: "11px", color: "#6b7fa3", fontFamily: "IBM Plex Sans, sans-serif", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.username}</span>
                    {p.muted && <Icon name="MicOff" size={10} style={{ color: "#ff4444" }} />}
                    {p.streaming && <Icon name="MonitorPlay" size={10} style={{ color: "#00ff88" }} />}
                  </div>
                ))}
              </div>
            ))}
          </div>

          {/* Forum */}
          <div>
            <button className="flex items-center gap-1 w-full px-1 py-1 mb-1" onClick={() => setExpandForum(v => !v)}>
              <Icon name={expandForum ? "ChevronDown" : "ChevronRight"} size={11} style={{ color: "#6b7fa3" }} />
              <span style={{ fontFamily: "Rajdhani, sans-serif", fontWeight: 600, fontSize: "10px", color: "#6b7fa3", textTransform: "uppercase", letterSpacing: "1px" }}>Форум</span>
            </button>
            {expandForum && CHANNELS.forum.map(ch => (
              <button key={ch.id}
                onClick={() => { setActiveForumChannel(ch.id); setActiveTab("forum"); fetchForumThreads(ch.id); setActiveThread(null); }}
                className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg mb-0.5 text-left"
                style={{ background: activeForumChannel === ch.id && activeTab === "forum" ? "rgba(0,170,255,0.1)" : "transparent" }}>
                <Icon name="BookOpen" size={13} style={{ color: "#6b7fa3" }} />
                <span className="flex-1 text-sm" style={{ fontFamily: "IBM Plex Sans, sans-serif", color: "#8899bb" }}>{ch.name}</span>
                <span style={{ color: "#6b7fa3", fontSize: "12px", fontFamily: "Rajdhani, sans-serif" }}>{ch.posts}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Активный голосовой канал */}
        {activeVoiceChannel && (
          <div className="mx-2 mb-1 px-2 py-2 rounded-xl" style={{ background: "rgba(0,255,136,0.08)", border: "1px solid rgba(0,255,136,0.15)" }}>
            <div className="flex items-center gap-2 mb-1">
              <div className="w-2 h-2 rounded-full animate-pulse" style={{ background: "#00ff88" }} />
              <span style={{ fontFamily: "Rajdhani, sans-serif", fontWeight: 700, fontSize: "11px", color: "#00ff88" }}>Голосовой чат</span>
            </div>
            <div style={{ fontFamily: "IBM Plex Sans, sans-serif", fontSize: "11px", color: "#6b7fa3", marginBottom: "6px" }}>
              {sData.channels.voice.find(c => c.id === activeVoiceChannel)?.name}
            </div>
            {/* Индикатор уровня микрофона */}
            <div className="flex items-center gap-1.5 mb-2">
              <Icon name={micMuted ? "MicOff" : "Mic"} size={10} style={{ color: micMuted ? "#ff4444" : "#00ff88", flexShrink: 0 }} />
              <div className="flex gap-px flex-1">
                {Array.from({ length: 16 }).map((_, i) => {
                  const threshold = (i + 1) / 16;
                  const active = !micMuted && micLevel >= threshold;
                  const color = i < 10 ? "#00ff88" : i < 13 ? "#ffcc00" : "#ff4444";
                  return (
                    <div key={i} style={{
                      flex: 1, height: "6px", borderRadius: "2px",
                      background: active ? color : "rgba(255,255,255,0.07)",
                      transition: "background 80ms",
                    }} />
                  );
                })}
              </div>
            </div>
            <div className="flex gap-1.5">
              <button onClick={() => setMicMuted(v => !v)} className="w-7 h-7 rounded-lg flex items-center justify-center hover:opacity-80 transition-opacity"
                style={{ background: micMuted ? "rgba(255,68,68,0.2)" : "rgba(0,255,136,0.12)", color: micMuted ? "#ff4444" : "#00ff88" }} title={micMuted ? "Включить микрофон" : "Выключить микрофон"}>
                <Icon name={micMuted ? "MicOff" : "Mic"} size={13} />
              </button>
              <button onClick={() => setHeadphonesDeaf(v => !v)} className="w-7 h-7 rounded-lg flex items-center justify-center hover:opacity-80 transition-opacity"
                style={{ background: headphonesDeaf ? "rgba(255,68,68,0.2)" : "rgba(255,255,255,0.06)", color: headphonesDeaf ? "#ff4444" : "#6b7fa3" }} title={headphonesDeaf ? "Включить звук" : "Выключить звук"}>
                <Icon name={headphonesDeaf ? "VolumeX" : "Headphones"} size={13} />
              </button>
              <button onClick={() => { voiceWebRTC.refreshDevices(); setShowVoiceDevicePicker(true); }}
                className="w-7 h-7 rounded-lg flex items-center justify-center hover:opacity-80 transition-opacity"
                style={{ background: "rgba(255,255,255,0.06)", color: "#6b7fa3" }} title="Настройки устройств">
                <Icon name="Settings2" size={13} />
              </button>
              <button onClick={leaveVoiceChannel} className="w-7 h-7 rounded-lg flex items-center justify-center hover:opacity-80 transition-opacity ml-auto"
                style={{ background: "rgba(255,68,68,0.15)", color: "#ff4444" }} title="Покинуть канал">
                <Icon name="PhoneOff" size={13} />
              </button>
            </div>
          </div>
        )}

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
                className="w-6 h-6 rounded flex items-center justify-center hover:opacity-70 transition-opacity relative"
                style={{ background: micMuted ? "rgba(255,68,68,0.2)" : micLevel > 0.05 ? `rgba(0,255,136,${0.08 + micLevel * 0.22})` : "rgba(255,255,255,0.05)", boxShadow: !micMuted && micLevel > 0.1 ? `0 0 ${4 + micLevel * 8}px rgba(0,255,136,${micLevel * 0.6})` : "none", transition: "background 80ms, box-shadow 80ms" }}>
                <Icon name={micMuted ? "MicOff" : "Mic"} size={12} style={{ color: micMuted ? "#ff4444" : micLevel > 0.05 ? "#00ff88" : "#6b7fa3" }} />
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
          <div className="flex items-center gap-1.5">
            {/* Закреплённые */}
            {activeTab === "chat" && (
              <button onClick={() => { setShowPinned(v => !v); if (!showPinned) fetchPinned(); }}
                className="w-8 h-8 rounded-lg flex items-center justify-center hover:opacity-80 transition-opacity relative"
                style={{ background: showPinned ? "rgba(255,204,0,0.15)" : "rgba(255,255,255,0.05)" }}
                title="Закреплённые сообщения">
                <Icon name="Pin" size={15} style={{ color: showPinned ? "#ffcc00" : "#6b7fa3" }} />
                {pinnedMessages.length > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 rounded-full flex items-center justify-center text-white" style={{ background: "#ff00aa", fontSize: "8px", fontWeight: 700 }}>
                    {pinnedMessages.length}
                  </span>
                )}
              </button>
            )}
            {/* Участники */}
            <button onClick={() => setShowMembersSidebar(v => !v)}
              className="w-8 h-8 rounded-lg flex items-center justify-center hover:opacity-80 transition-opacity"
              style={{ background: showMembersSidebar ? "rgba(0,255,136,0.12)" : "rgba(255,255,255,0.05)" }}
              title="Список участников">
              <Icon name="Users" size={15} style={{ color: showMembersSidebar ? "#00ff88" : "#6b7fa3" }} />
            </button>
            {/* Инвайт */}
            <button onClick={() => { setShowInvite(v => !v); if (!showInvite) createInvite(); }}
              className="w-8 h-8 rounded-lg flex items-center justify-center hover:opacity-80 transition-opacity"
              style={{ background: showInvite ? "rgba(0,170,255,0.15)" : "rgba(255,255,255,0.05)" }}
              title="Пригласить участника">
              <Icon name="UserPlus" size={15} style={{ color: showInvite ? "#00aaff" : "#6b7fa3" }} />
            </button>
            <button onClick={() => setSearchOpen(v => !v)} className="w-8 h-8 rounded-lg flex items-center justify-center hover:opacity-80 transition-opacity" style={{ background: searchOpen ? "rgba(0,255,136,0.15)" : "rgba(255,255,255,0.05)" }}>
              <Icon name="Search" size={15} style={{ color: searchOpen ? "#00ff88" : "#6b7fa3" }} />
            </button>
            {activeTab === "chat" && (
              <button onClick={() => setShowChannelSettings(true)} className="w-8 h-8 rounded-lg flex items-center justify-center hover:opacity-80 transition-opacity" title="Настройки канала" style={{ background: "rgba(255,255,255,0.05)" }}>
                <Icon name="Settings" size={15} style={{ color: "#6b7fa3" }} />
              </button>
            )}
          </div>
        </div>

        {/* Search panel */}
        {searchOpen && (
          <div className="px-4 py-2 flex gap-2 shrink-0" style={{ background: "#0a1628", borderBottom: "1px solid rgba(0,255,136,0.1)" }}>
            <select value={searchType} onChange={e => setSearchType(e.target.value as "messages" | "users")}
              style={{ background: "#0d1424", color: "#e2e8f0", border: "1px solid rgba(0,255,136,0.2)", borderRadius: "6px", padding: "4px 8px", fontSize: "12px" }}>
              <option value="messages">Сообщения</option>
              <option value="users">Пользователи</option>
            </select>
            <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
              onKeyDown={e => e.key === "Enter" && doSearch()}
              placeholder="Поиск..." className="flex-1 bg-transparent outline-none text-sm"
              style={{ color: "#e2e8f0", border: "1px solid rgba(0,255,136,0.2)", borderRadius: "6px", padding: "4px 12px" }} />
            <button onClick={doSearch} style={{ background: "rgba(0,255,136,0.15)", color: "#00ff88", border: "none", borderRadius: "6px", padding: "4px 12px", cursor: "pointer", fontSize: "12px" }}>Найти</button>
            <button onClick={() => { setSearchOpen(false); setSearchResults([]); }} style={{ color: "#6b7fa3", cursor: "pointer", background: "none", border: "none" }}>✕</button>
          </div>
        )}
        {searchResults.length > 0 && searchOpen && (
          <div className="overflow-y-auto max-h-48 px-4 py-2 shrink-0" style={{ background: "#060a11", borderBottom: "1px solid rgba(0,255,136,0.1)" }}>
            {searchResults.map((r) => (
              <div key={r.id} className="py-1.5 px-2 rounded cursor-pointer hover:opacity-80" style={{ fontSize: "13px", color: "#e2e8f0", borderBottom: "1px solid rgba(255,255,255,0.03)" }}>
                {r.username && <span style={{ color: r.avatar_color || "#00ff88" }}>{r.username}</span>}
                {r.text && <><span style={{ color: "#6b7fa3", marginRight: 6 }}>{r.time} {r.date}</span><span>{r.text.slice(0, 80)}</span></>}
              </div>
            ))}
          </div>
        )}

        {/* Pinned panel */}
        {showPinned && activeTab === "chat" && (
          <div className="shrink-0 border-b" style={{ borderColor: "rgba(255,204,0,0.15)", background: "#0a0e1a" }}>
            <div className="flex items-center justify-between px-4 py-2" style={{ borderBottom: "1px solid rgba(255,204,0,0.1)" }}>
              <div className="flex items-center gap-2">
                <Icon name="Pin" size={13} style={{ color: "#ffcc00" }} />
                <span style={{ fontFamily: "Rajdhani, sans-serif", fontWeight: 700, fontSize: "13px", color: "#ffcc00" }}>Закреплённые сообщения ({pinnedMessages.length})</span>
              </div>
              <button onClick={() => setShowPinned(false)} style={{ color: "#6b7fa3", background: "none", border: "none", cursor: "pointer" }}>✕</button>
            </div>
            <div className="overflow-y-auto max-h-52 px-4 py-2 space-y-2">
              {pinnedMessages.length === 0 && <p style={{ fontFamily: "IBM Plex Sans, sans-serif", fontSize: "13px", color: "#4a5568" }}>Нет закреплённых сообщений</p>}
              {pinnedMessages.map(p => (
                <div key={p.id} className="flex items-start gap-2 py-1.5 group">
                  <div className="w-6 h-6 rounded-full flex items-center justify-center shrink-0" style={{ background: p.avatar_color + "22", color: p.avatar_color, fontFamily: "Rajdhani, sans-serif", fontWeight: 700, fontSize: "9px" }}>
                    {p.username.slice(0,2).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <span style={{ fontFamily: "Rajdhani, sans-serif", fontWeight: 700, fontSize: "12px", color: p.avatar_color }}>{p.username}</span>
                      <span style={{ fontFamily: "IBM Plex Sans, sans-serif", fontSize: "10px", color: "#4a5568" }}>{p.time}</span>
                    </div>
                    <p style={{ fontFamily: "IBM Plex Sans, sans-serif", fontSize: "12px", color: "#c8d6e8", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.text}</p>
                  </div>
                  <button onClick={() => unpinMessage(p.id)} className="opacity-0 group-hover:opacity-100 transition-opacity hover:opacity-80" style={{ color: "#ff4444", background: "none", border: "none", cursor: "pointer", fontSize: "14px" }} title="Открепить">✕</button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Invite panel */}
        {showInvite && (
          <div className="shrink-0 border-b px-4 py-3" style={{ borderColor: "rgba(0,170,255,0.15)", background: "#0a0e1a" }}>
            <div className="flex items-center gap-2 mb-3">
              <Icon name="UserPlus" size={14} style={{ color: "#00aaff" }} />
              <span style={{ fontFamily: "Rajdhani, sans-serif", fontWeight: 700, fontSize: "13px", color: "#00aaff" }}>Пригласить на сервер</span>
              <button onClick={() => setShowInvite(false)} className="ml-auto" style={{ color: "#6b7fa3", background: "none", border: "none", cursor: "pointer" }}>✕</button>
            </div>
            <div className="flex gap-2 mb-2">
              <div className="flex-1 flex items-center gap-2 px-3 py-2 rounded-xl" style={{ background: "rgba(0,170,255,0.08)", border: "1px solid rgba(0,170,255,0.2)" }}>
                <Icon name="Link" size={13} style={{ color: "#00aaff" }} />
                <span style={{ fontFamily: "IBM Plex Sans, sans-serif", fontSize: "13px", color: "#e2e8f0" }}>
                  {inviteLoading ? "Создаю ссылку..." : inviteCode ? `nexus.app/invite/${inviteCode}` : "—"}
                </span>
              </div>
              <button onClick={() => { if (inviteCode) { navigator.clipboard.writeText(`nexus.app/invite/${inviteCode}`); } }}
                disabled={!inviteCode} className="px-3 py-2 rounded-xl hover:opacity-80 disabled:opacity-30"
                style={{ background: "rgba(0,170,255,0.15)", color: "#00aaff", border: "1px solid rgba(0,170,255,0.3)", fontFamily: "Rajdhani, sans-serif", fontWeight: 700, fontSize: "12px" }}>
                Скопировать
              </button>
            </div>
            <div className="h-px mb-2" style={{ background: "rgba(255,255,255,0.06)" }} />
            <div style={{ fontFamily: "Rajdhani, sans-serif", fontWeight: 600, fontSize: "11px", color: "#6b7fa3", marginBottom: "6px" }}>Вступить по коду</div>
            <div className="flex gap-2">
              <input value={joinCode} onChange={e => setJoinCode(e.target.value)} onKeyDown={e => e.key === "Enter" && joinByInvite()}
                placeholder="Введи код инвайта..."
                className="flex-1 px-3 py-1.5 rounded-xl outline-none text-sm"
                style={{ background: "rgba(255,255,255,0.05)", border: `1px solid ${joinStatus === "error" ? "rgba(255,68,68,0.4)" : "rgba(0,170,255,0.2)"}`, color: "#e2e8f0", fontFamily: "IBM Plex Sans, sans-serif" }} />
              <button onClick={joinByInvite} disabled={joinStatus === "loading"}
                className="px-3 py-1.5 rounded-xl hover:opacity-80 disabled:opacity-50"
                style={{ background: "rgba(0,170,255,0.15)", color: "#00aaff", border: "1px solid rgba(0,170,255,0.3)", fontFamily: "Rajdhani, sans-serif", fontWeight: 700, fontSize: "12px" }}>
                {joinStatus === "loading" ? "..." : "Вступить"}
              </button>
            </div>
            {joinStatus === "ok" && <div style={{ fontFamily: "IBM Plex Sans, sans-serif", fontSize: "11px", color: "#00ff88", marginTop: "6px" }}>✓ Вы вступили на сервер!</div>}
            {joinStatus === "error" && <div style={{ fontFamily: "IBM Plex Sans, sans-serif", fontSize: "11px", color: "#ff4444", marginTop: "6px" }}>✕ {joinError}</div>}
          </div>
        )}

        {/* Content area */}
        <div className="flex-1 flex overflow-hidden" onClick={() => { if (menuMsgId !== null) setMenuMsgId(null); }}>

          {/* Chat */}
          {activeTab === "chat" && (
            <div className="flex-1 flex flex-col min-w-0">
              <div className="flex-1 overflow-y-auto px-4 py-4 space-y-1">
                {messages.map((msg, i) => (
                  <div key={msg.id} className="flex gap-3 px-3 py-2 rounded-xl group transition-colors relative" style={{ background: "transparent" }}
                    onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,0.02)")}
                    onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                  >
                    {/* Context menu */}
                    {menuMsgId === msg.id && (
                      <div className="absolute right-2 top-2 z-50 rounded-xl overflow-hidden shadow-2xl" style={{ background: "#0d1424", border: "1px solid rgba(0,255,136,0.2)", minWidth: "160px" }}>
                        <button className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-white hover:bg-opacity-5 transition-colors"
                          onClick={e => { e.stopPropagation(); setReplyTo({ id: msg.id, text: msg.text, user: msg.user }); setMenuMsgId(null); }}
                          style={{ fontFamily: "Rajdhani, sans-serif", fontWeight: 600, fontSize: "13px", color: "#00aaff" }}>
                          <Icon name="CornerUpLeft" size={12} /> Ответить
                        </button>
                        <button className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-white hover:bg-opacity-5 transition-colors"
                          onClick={e => { e.stopPropagation(); pinMessage(msg.id); setMenuMsgId(null); }}
                          style={{ fontFamily: "Rajdhani, sans-serif", fontWeight: 600, fontSize: "13px", color: "#ffcc00" }}>
                          <Icon name="Pin" size={12} /> Закрепить
                        </button>
                        {msg.user_id === user.id && !msg.is_removed && (
                          <button className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-white hover:bg-opacity-5 transition-colors"
                            onClick={e => { e.stopPropagation(); setEditingMsgId(msg.id); setEditingText(msg.text); setMenuMsgId(null); }}
                            style={{ fontFamily: "Rajdhani, sans-serif", fontWeight: 600, fontSize: "13px", color: "#00ff88" }}>
                            <Icon name="Pencil" size={12} /> Редактировать
                          </button>
                        )}
                        {msg.user_id === user.id && !msg.is_removed && (
                          <button className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-white hover:bg-opacity-5 transition-colors"
                            onClick={e => { e.stopPropagation(); removeMessage(msg.id); }}
                            style={{ fontFamily: "Rajdhani, sans-serif", fontWeight: 600, fontSize: "13px", color: "#ff4444" }}>
                            <Icon name="Trash2" size={12} /> Удалить
                          </button>
                        )}
                        <button className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-white hover:bg-opacity-5 transition-colors"
                          onClick={e => { e.stopPropagation(); setMenuMsgId(null); }}
                          style={{ fontFamily: "Rajdhani, sans-serif", fontWeight: 600, fontSize: "13px", color: "#6b7fa3" }}>
                          <Icon name="X" size={12} /> Закрыть
                        </button>
                      </div>
                    )}
                    <UserAvatar
                      username={msg.user}
                      color={msg.color}
                      avatarImg={msg.user === user.username ? avatarImg : undefined}
                      size={36}
                      onClick={() => {
                        const m = MEMBERS.find(mb => mb.name === msg.user);
                        const isMe = msg.user === user.username;
                        setProfileMember(m || {
                          id: msg.user_id || 0,
                          name: msg.user,
                          color: msg.color,
                          role: msg.role || "",
                          roleColor: msg.roleColor || msg.color,
                          status: isMe ? "online" : "online",
                          avatar: msg.avatar,
                          game: "",
                          avatarImg: isMe ? (avatarImg ?? undefined) : undefined,
                          bannerImg: isMe ? (localStorage.getItem("bannerImg") ?? undefined) : undefined,
                        });
                      }}
                      className="hover:scale-110 transition-all"
                    />
                    <div className="flex-1 min-w-0">
                      {/* Reply-to */}
                      {msg.reply_to_id && msg.reply_to_user && (
                        <div className="flex items-center gap-1.5 mb-1 ml-1 cursor-pointer hover:opacity-80" onClick={() => { const el = document.getElementById(`msg-${msg.reply_to_id}`); el?.scrollIntoView({ behavior: "smooth", block: "center" }); }}>
                          <div className="w-0.5 h-4 rounded-full" style={{ background: "#6b7fa3" }} />
                          <span style={{ fontFamily: "Rajdhani, sans-serif", fontWeight: 700, fontSize: "11px", color: "#6b7fa3" }}>@{msg.reply_to_user}</span>
                          <span style={{ fontFamily: "IBM Plex Sans, sans-serif", fontSize: "11px", color: "#4a5568", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "300px" }}>{msg.reply_to_text?.slice(0, 80)}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-2 mb-0.5" id={`msg-${msg.id}`}>
                        <span style={{ fontFamily: "Rajdhani, sans-serif", fontWeight: 600, fontSize: "14px", color: msg.color }}>{msg.user}</span>
                        {msg.role && <span style={{ fontFamily: "Rajdhani, sans-serif", fontWeight: 600, fontSize: "10px", background: msg.roleColor + "22", color: msg.roleColor, border: `1px solid ${msg.roleColor}44`, padding: "1px 6px", borderRadius: "3px", textTransform: "uppercase", letterSpacing: "0.5px" }}>{msg.role}</span>}
                        <span style={{ fontSize: "11px", color: "#4a5568" }}>{msg.time}</span>
                        {msg.edited && !msg.is_removed && <span style={{ fontSize: "10px", color: "#6b7fa3" }}>(изм.)</span>}
                        {/* три точки при hover */}
                        <button className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity w-6 h-6 rounded flex items-center justify-center"
                          style={{ background: "rgba(255,255,255,0.06)" }}
                          onClick={e => { e.stopPropagation(); setMenuMsgId(menuMsgId === msg.id ? null : msg.id); }}>
                          <Icon name="MoreHorizontal" size={12} style={{ color: "#6b7fa3" }} />
                        </button>
                      </div>
                      {/* Текст или режим редактирования */}
                      {editingMsgId === msg.id ? (
                        <div className="flex gap-2 mt-1">
                          <input className="flex-1 bg-transparent outline-none text-sm px-2 py-1 rounded"
                            style={{ color: "#e2e8f0", border: "1px solid rgba(0,255,136,0.3)", fontFamily: "IBM Plex Sans, sans-serif" }}
                            value={editingText} onChange={e => setEditingText(e.target.value)}
                            onKeyDown={e => { if (e.key === "Enter") editMessage(msg.id, editingText); if (e.key === "Escape") { setEditingMsgId(null); setEditingText(""); } }}
                            autoFocus />
                          <button onClick={() => editMessage(msg.id, editingText)} style={{ background: "rgba(0,255,136,0.15)", color: "#00ff88", border: "none", borderRadius: "6px", padding: "2px 10px", cursor: "pointer", fontSize: "12px", fontFamily: "Rajdhani, sans-serif", fontWeight: 600 }}>Сохранить</button>
                          <button onClick={() => { setEditingMsgId(null); setEditingText(""); }} style={{ color: "#6b7fa3", background: "none", border: "none", cursor: "pointer", fontSize: "12px" }}>Отмена</button>
                        </div>
                      ) : (
                        <p className="text-sm leading-relaxed" style={{ color: msg.is_removed ? "#4a5568" : "#c8d6e8", fontFamily: "IBM Plex Sans, sans-serif", fontStyle: msg.is_removed ? "italic" : "normal" }}>{msg.text}</p>
                      )}
                      {/* Прикреплённый файл/картинка */}
                      {msg.file_url && !msg.is_removed && (
                        <div className="mt-2">
                          {msg.file_type?.startsWith("image/") ? (
                            <img src={msg.file_url} alt={msg.file_name || "file"} className="rounded-xl max-h-60 max-w-xs object-cover cursor-pointer hover:opacity-90 transition-opacity" onClick={() => window.open(msg.file_url, "_blank")} />
                          ) : msg.file_type?.startsWith("video/") ? (
                            <video src={msg.file_url} controls className="rounded-xl max-h-48 max-w-xs" />
                          ) : (
                            <a href={msg.file_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-3 py-2 rounded-lg hover:opacity-80 transition-opacity" style={{ background: "rgba(0,255,136,0.08)", border: "1px solid rgba(0,255,136,0.15)", color: "#00ff88", textDecoration: "none", display: "inline-flex", maxWidth: "260px" }}>
                              <Icon name="Paperclip" size={14} />
                              <span style={{ fontFamily: "IBM Plex Sans, sans-serif", fontSize: "13px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{msg.file_name || "Файл"}</span>
                            </a>
                          )}
                        </div>
                      )}
                      {/* Реакции */}
                      {msg.reactions.length > 0 && (
                        <div className="flex gap-1.5 mt-1.5 flex-wrap">
                          {msg.reactions.map((r, ri) => (
                            <button key={ri} onClick={() => toggleReaction(msg.id, r.emoji)} className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs transition-all hover:opacity-80" style={{ background: r.user_ids?.includes(user.id) ? "rgba(0,255,136,0.15)" : "rgba(255,255,255,0.06)", border: r.user_ids?.includes(user.id) ? "1px solid rgba(0,255,136,0.3)" : "1px solid rgba(255,255,255,0.1)", color: "#8899bb" }}>
                              <span>{r.emoji}</span>
                              <span style={{ fontFamily: "Rajdhani, sans-serif", fontWeight: 600 }}>{r.count}</span>
                            </button>
                          ))}
                          {!msg.is_removed && (
                            <button onClick={() => toggleReaction(msg.id, "👍")} className="flex items-center gap-1 px-1.5 py-0.5 rounded-full text-xs opacity-0 group-hover:opacity-100 transition-opacity hover:opacity-80" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", color: "#6b7fa3" }}>
                              <Icon name="Smile" size={11} />
                            </button>
                          )}
                        </div>
                      )}
                      {msg.reactions.length === 0 && !msg.is_removed && (
                        <button onClick={() => toggleReaction(msg.id, "👍")} className="flex items-center gap-1 px-1.5 py-0.5 rounded-full text-xs opacity-0 group-hover:opacity-100 transition-opacity hover:opacity-80 mt-1" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", color: "#6b7fa3" }}>
                          <Icon name="Smile" size={11} />
                        </button>
                      )}
                    </div>
                  </div>
                ))}

                <div ref={chatBottomRef} />
              </div>

              {/* Input */}
              <div className="px-4 pb-4 relative">
                {/* Typing indicator */}
                {typingUsers.length > 0 && (
                  <div className="flex items-center gap-1.5 mb-1 px-1">
                    <div className="flex gap-0.5">
                      {[0,1,2].map(i => (
                        <div key={i} className="w-1 h-1 rounded-full animate-bounce" style={{ background: "#6b7fa3", animationDelay: `${i * 0.15}s` }} />
                      ))}
                    </div>
                    <span style={{ fontFamily: "IBM Plex Sans, sans-serif", fontSize: "11px", color: "#6b7fa3" }}>
                      <strong>{typingUsers.join(", ")}</strong> {typingUsers.length === 1 ? "печатает..." : "печатают..."}
                    </span>
                  </div>
                )}
                {/* Reply preview */}
                {replyTo && (
                  <div className="flex items-center gap-2 px-3 py-1.5 mb-1 rounded-t-xl" style={{ background: "rgba(0,170,255,0.08)", border: "1px solid rgba(0,170,255,0.15)", borderBottom: "none" }}>
                    <Icon name="CornerUpLeft" size={12} style={{ color: "#00aaff" }} />
                    <span style={{ fontFamily: "Rajdhani, sans-serif", fontWeight: 700, fontSize: "12px", color: "#00aaff" }}>Ответ @{replyTo.user}</span>
                    <span style={{ fontFamily: "IBM Plex Sans, sans-serif", fontSize: "11px", color: "#6b7fa3", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{replyTo.text.slice(0, 60)}</span>
                    <button onClick={() => setReplyTo(null)} style={{ color: "#4a5568", background: "none", border: "none", cursor: "pointer", fontSize: "14px" }}>✕</button>
                  </div>
                )}
                {/* @ autocomplete */}
                {mentionOpen && (
                  <div className="absolute bottom-full left-4 mb-2 rounded-xl overflow-hidden shadow-xl z-50" style={{ background: "#0d1424", border: "1px solid rgba(0,255,136,0.2)", minWidth: "200px" }}>
                    {onlineMembers
                      .filter(m => m.username.toLowerCase().includes(mentionQuery.toLowerCase()))
                      .slice(0, 8)
                      .map(m => (
                        <button key={m.id} className="w-full flex items-center gap-2 px-3 py-2 hover:bg-white hover:bg-opacity-5 transition-colors text-left"
                          onClick={() => {
                            const lastAt = inputValue.lastIndexOf("@");
                            setInputValue(inputValue.slice(0, lastAt) + `@${m.username} `);
                            setMentionOpen(false);
                          }}>
                          <div className="w-6 h-6 rounded-full flex items-center justify-center" style={{ background: m.avatar_color + "22", color: m.avatar_color, fontSize: "9px", fontFamily: "Rajdhani, sans-serif", fontWeight: 700 }}>
                            {m.username.slice(0,2).toUpperCase()}
                          </div>
                          <span style={{ fontFamily: "Rajdhani, sans-serif", fontWeight: 700, fontSize: "13px", color: m.avatar_color }}>{m.username}</span>
                        </button>
                      ))}
                  </div>
                )}
                <div className={`flex items-center gap-2 px-4 py-2.5 ${replyTo ? "rounded-b-xl rounded-t-none" : "rounded-xl"}`} style={{ background: "var(--dark-card)", border: `1px solid ${replyTo ? "rgba(0,170,255,0.15)" : "rgba(0,255,136,0.1)"}`, borderTop: replyTo ? "none" : undefined }}>
                  <button className="shrink-0 hover:opacity-70 transition-opacity" title="Прикрепить">
                    <Icon name="Plus" size={18} style={{ color: "#6b7fa3" }} onClick={() => fileInputRef.current?.click()} />
                  </button>
                  <input
                    className="flex-1 bg-transparent outline-none text-sm"
                    style={{ color: "#e2e8f0", fontFamily: "IBM Plex Sans, sans-serif" }}
                    placeholder={replyTo ? `Ответить @${replyTo.user}...` : `Написать в #${channel.name}...`}
                    value={inputValue}
                    onChange={e => handleInputChange(e.target.value)}
                    onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) sendMessage(); if (e.key === "Escape") { setReplyTo(null); setMentionOpen(false); } }}
                  />
                  <div className="flex items-center gap-1">
                    <button className="hover:opacity-70 transition-opacity"><Icon name="Smile" size={16} style={{ color: "#6b7fa3" }} /></button>
                    <button onClick={sendMessage} disabled={!inputValue.trim()} className="w-7 h-7 rounded-lg flex items-center justify-center transition-all hover:opacity-90 disabled:opacity-30" style={{ background: "rgba(0,255,136,0.15)", color: "#00ff88" }}>
                      <Icon name="Send" size={13} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Voice */}
          {activeTab === "voice" && (
            <div className="flex-1 flex flex-col overflow-hidden">
              {/* Шапка голосового канала */}
              <div className="flex items-center gap-3 px-4 py-3 shrink-0" style={{ borderBottom: "1px solid rgba(0,255,136,0.08)" }}>
                <Icon name="Volume2" size={16} style={{ color: "#00ff88" }} />
                <span style={{ fontFamily: "Rajdhani, sans-serif", fontWeight: 700, fontSize: "16px", color: "#e2e8f0" }}>
                  {sData.channels.voice.find(c => c.id === activeVoiceChannel)?.name || "Голосовой канал"}
                </span>
                <div className="ml-auto flex items-center gap-2">
                  {!isStreaming ? (
                    <button onClick={startScreenShare} className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition-all hover:opacity-90"
                      style={{ background: "rgba(0,255,136,0.12)", color: "#00ff88", border: "1px solid rgba(0,255,136,0.25)", fontFamily: "Rajdhani, sans-serif", fontWeight: 700, fontSize: "12px" }}>
                      <Icon name="MonitorPlay" size={14} /> Трансляция
                    </button>
                  ) : (
                    <button onClick={stopScreenShare} className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition-all hover:opacity-90"
                      style={{ background: "rgba(255,0,170,0.15)", color: "#ff00aa", border: "1px solid rgba(255,0,170,0.3)", fontFamily: "Rajdhani, sans-serif", fontWeight: 700, fontSize: "12px" }}>
                      <Icon name="MonitorOff" size={14} /> Стоп трансляция
                    </button>
                  )}
                  <button onClick={leaveVoiceChannel} className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition-all hover:opacity-90"
                    style={{ background: "rgba(255,68,68,0.12)", color: "#ff4444", border: "1px solid rgba(255,68,68,0.3)", fontFamily: "Rajdhani, sans-serif", fontWeight: 700, fontSize: "12px" }}>
                    <Icon name="PhoneOff" size={14} /> Выйти
                  </button>
                </div>
              </div>

              {/* Основная зона */}
              <div className="flex-1 flex flex-col overflow-hidden" style={{ background: "#060a11" }}>
                {/* Трансляция экрана */}
                {isStreaming && screenStream && (
                  <div className="relative flex-1 flex items-center justify-center p-4">
                    <div className="relative w-full rounded-2xl overflow-hidden" style={{ maxHeight: "60vh", background: "#000", aspectRatio: "16/9" }}>
                      <video
                        ref={el => { screenVideoRef.current = el; if (el && screenStream) el.srcObject = screenStream; }}
                        autoPlay muted playsInline className="w-full h-full object-contain"
                      />
                      <div className="absolute top-3 left-3 flex items-center gap-1.5 px-2.5 py-1 rounded-lg" style={{ background: "rgba(0,0,0,0.8)", backdropFilter: "blur(4px)" }}>
                        <div className="w-2 h-2 rounded-full animate-pulse" style={{ background: "#ff00aa" }} />
                        <span style={{ fontFamily: "Rajdhani, sans-serif", fontWeight: 700, fontSize: "11px", color: "#ff00aa" }}>В ЭФИРЕ · {user.username}</span>
                      </div>
                      <div className="absolute bottom-3 right-3 flex gap-2">
                        <button onClick={() => setMicMuted(v => !v)} className="w-9 h-9 rounded-xl flex items-center justify-center hover:opacity-90"
                          style={{ background: micMuted ? "rgba(255,68,68,0.9)" : "rgba(0,0,0,0.8)", backdropFilter: "blur(4px)", color: micMuted ? "#fff" : "#e2e8f0", border: micMuted ? "1px solid rgba(255,68,68,0.5)" : "1px solid rgba(255,255,255,0.1)" }}>
                          <Icon name={micMuted ? "MicOff" : "Mic"} size={16} />
                        </button>
                        <button onClick={stopScreenShare} className="w-9 h-9 rounded-xl flex items-center justify-center hover:opacity-90"
                          style={{ background: "rgba(255,0,170,0.9)", backdropFilter: "blur(4px)", color: "#fff" }}>
                          <Icon name="MonitorOff" size={16} />
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Участники голосового канала */}
                <div className={`flex flex-wrap justify-center gap-5 p-8 ${isStreaming && screenStream ? "shrink-0 border-t border-white border-opacity-5" : "flex-1 items-center content-center"}`}>
                  {/* Я сам (всегда первый) */}
                  <div className="flex flex-col items-center gap-2">
                    <div className="relative">
                      <div className="w-20 h-20 rounded-full flex items-center justify-center transition-all"
                        style={{
                          background: user.avatar_color + "22", color: user.avatar_color,
                          border: `3px solid ${micMuted ? "rgba(255,68,68,0.5)" : user.avatar_color + "88"}`,
                          boxShadow: micMuted ? "none" : `0 0 24px ${user.avatar_color}44`,
                          fontFamily: "Rajdhani, sans-serif", fontWeight: 900, fontSize: "22px",
                        }}>
                        {user.username.slice(0, 2).toUpperCase()}
                      </div>
                      {micMuted && (
                        <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full flex items-center justify-center" style={{ background: "#ff4444" }}>
                          <Icon name="MicOff" size={12} style={{ color: "#fff" }} />
                        </div>
                      )}
                      {isStreaming && (
                        <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center" style={{ background: "#ff00aa" }}>
                          <Icon name="MonitorPlay" size={10} style={{ color: "#fff" }} />
                        </div>
                      )}
                    </div>
                    <span style={{ fontFamily: "Rajdhani, sans-serif", fontWeight: 700, fontSize: "12px", color: user.avatar_color }}>{user.username} (вы)</span>
                  </div>

                  {/* Другие участники */}
                  {(voiceParticipants[String(activeVoiceChannel)] || [])
                    .filter(p => p.user_id !== user.id)
                    .map(p => (
                      <div key={p.user_id} className="flex flex-col items-center gap-2">
                        <div className="relative">
                          <div className="w-20 h-20 rounded-full flex items-center justify-center transition-all"
                            style={{
                              background: p.avatar_color + "22", color: p.avatar_color,
                              border: `3px solid ${p.muted ? "rgba(255,68,68,0.5)" : p.avatar_color + "88"}`,
                              boxShadow: p.muted ? "none" : `0 0 24px ${p.avatar_color}44`,
                              fontFamily: "Rajdhani, sans-serif", fontWeight: 900, fontSize: "22px",
                            }}>
                            {p.username.slice(0, 2).toUpperCase()}
                          </div>
                          {p.muted && (
                            <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full flex items-center justify-center" style={{ background: "#ff4444" }}>
                              <Icon name="MicOff" size={12} style={{ color: "#fff" }} />
                            </div>
                          )}
                          {p.streaming && (
                            <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center" style={{ background: "#ff00aa" }}>
                              <Icon name="MonitorPlay" size={10} style={{ color: "#fff" }} />
                            </div>
                          )}
                        </div>
                        <span style={{ fontFamily: "Rajdhani, sans-serif", fontWeight: 700, fontSize: "12px", color: p.avatar_color }}>{p.username}</span>
                      </div>
                    ))}
                </div>

                {/* Панель управления */}
                <div className="shrink-0 flex items-center justify-center gap-3 py-4" style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}>
                  <button onClick={() => setMicMuted(v => !v)}
                    className="flex flex-col items-center gap-1 w-14 h-14 rounded-2xl justify-center transition-all hover:scale-105"
                    style={{ background: micMuted ? "rgba(255,68,68,0.2)" : "rgba(0,255,136,0.12)", border: `1px solid ${micMuted ? "rgba(255,68,68,0.4)" : "rgba(0,255,136,0.25)"}`, color: micMuted ? "#ff4444" : "#00ff88" }}
                    title={micMuted ? "Включить микрофон" : "Выключить микрофон"}>
                    <Icon name={micMuted ? "MicOff" : "Mic"} size={20} />
                  </button>
                  <button onClick={() => setHeadphonesDeaf(v => !v)}
                    className="flex flex-col items-center gap-1 w-14 h-14 rounded-2xl justify-center transition-all hover:scale-105"
                    style={{ background: headphonesDeaf ? "rgba(255,68,68,0.2)" : "rgba(255,255,255,0.06)", border: `1px solid ${headphonesDeaf ? "rgba(255,68,68,0.4)" : "rgba(255,255,255,0.1)"}`, color: headphonesDeaf ? "#ff4444" : "#6b7fa3" }}
                    title={headphonesDeaf ? "Включить звук" : "Выключить звук"}>
                    <Icon name={headphonesDeaf ? "VolumeX" : "Headphones"} size={20} />
                  </button>
                  <button onClick={isStreaming ? stopScreenShare : startScreenShare}
                    className="flex flex-col items-center gap-1 w-14 h-14 rounded-2xl justify-center transition-all hover:scale-105"
                    style={{ background: isStreaming ? "rgba(255,0,170,0.2)" : "rgba(0,170,255,0.12)", border: `1px solid ${isStreaming ? "rgba(255,0,170,0.4)" : "rgba(0,170,255,0.25)"}`, color: isStreaming ? "#ff00aa" : "#00aaff" }}
                    title={isStreaming ? "Остановить трансляцию" : "Начать трансляцию"}>
                    <Icon name={isStreaming ? "MonitorOff" : "MonitorPlay"} size={20} />
                  </button>
                  <button onClick={leaveVoiceChannel}
                    className="flex flex-col items-center gap-1 w-14 h-14 rounded-2xl justify-center transition-all hover:scale-105"
                    style={{ background: "rgba(255,68,68,0.2)", border: "1px solid rgba(255,68,68,0.4)", color: "#ff4444" }}
                    title="Выйти из канала">
                    <Icon name="PhoneOff" size={20} />
                  </button>
                </div>
              </div>

              {/* Нижняя полоска */}
              {activeVoiceChannel && (
                <div className="px-4 py-1.5 shrink-0 flex items-center gap-2" style={{ background: "rgba(0,255,136,0.05)", borderTop: "1px solid rgba(0,255,136,0.08)" }}>
                  <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: "#00ff88" }} />
                  <span style={{ fontFamily: "Rajdhani, sans-serif", fontWeight: 700, fontSize: "11px", color: "#00ff88" }}>
                    {sData.channels.voice.find(c => c.id === activeVoiceChannel)?.name}
                  </span>
                  <span style={{ fontFamily: "IBM Plex Sans, sans-serif", fontSize: "11px", color: "#4a5568" }}>
                    · {1 + (voiceParticipants[String(activeVoiceChannel)] || []).filter(p => p.user_id !== user.id).length} участн.
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Правый сайдбар участников (показывается при showMembersSidebar в chat-режиме) */}
          {activeTab === "chat" && showMembersSidebar && (
            <div className="w-52 shrink-0 overflow-y-auto py-3 px-2" style={{ borderLeft: "1px solid rgba(0,255,136,0.08)", background: "var(--dark-panel)" }}>
              {/* Онлайн */}
              {onlineMembers.length > 0 && (
                <div className="mb-3">
                  <div style={{ fontFamily: "Rajdhani, sans-serif", fontWeight: 700, fontSize: "10px", color: "#6b7fa3", textTransform: "uppercase", letterSpacing: "1px", padding: "0 8px", marginBottom: "4px" }}>
                    Онлайн — {onlineMembers.length}
                  </div>
                  {onlineMembers.map(m => (
                    <div key={m.id} className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-white hover:bg-opacity-5 transition-colors cursor-pointer">
                      <div className="relative">
                        <div className="w-7 h-7 rounded-full flex items-center justify-center" style={{ background: m.avatar_color + "22", color: m.avatar_color, fontFamily: "Rajdhani, sans-serif", fontWeight: 700, fontSize: "9px" }}>
                          {m.username.slice(0,2).toUpperCase()}
                        </div>
                        <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2" style={{ background: "#00ff88", borderColor: "var(--dark-panel)" }} />
                      </div>
                      <span style={{ fontFamily: "IBM Plex Sans, sans-serif", fontSize: "12px", color: "#c8d6e8", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{m.username}</span>
                    </div>
                  ))}
                </div>
              )}
              {/* Оффлайн */}
              <div>
                <div style={{ fontFamily: "Rajdhani, sans-serif", fontWeight: 700, fontSize: "10px", color: "#4a5568", textTransform: "uppercase", letterSpacing: "1px", padding: "0 8px", marginBottom: "4px" }}>
                  Оффлайн — {MEMBERS.filter(m => m.status === "offline").length}
                </div>
                {MEMBERS.filter(m => m.status === "offline").slice(0, 10).map(m => (
                  <div key={m.id} className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-white hover:bg-opacity-5 transition-colors cursor-pointer opacity-50">
                    <div className="w-7 h-7 rounded-full flex items-center justify-center" style={{ background: m.color + "22", color: m.color, fontFamily: "Rajdhani, sans-serif", fontWeight: 700, fontSize: "9px" }}>
                      {m.avatar}
                    </div>
                    <span style={{ fontFamily: "IBM Plex Sans, sans-serif", fontSize: "12px", color: "#6b7fa3", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{m.name}</span>
                  </div>
                ))}
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
            {/* Online counter from API */}
            {onlineMembers.length > 0 && (
              <div className="flex items-center gap-1.5 mb-3 px-1">
                <div className="w-2 h-2 rounded-full" style={{ background: "#00ff88", boxShadow: "0 0 4px #00ff88" }} />
                <span style={{ fontFamily: "Rajdhani, sans-serif", fontWeight: 700, fontSize: "10px", color: "#00ff88", textTransform: "uppercase", letterSpacing: "0.8px" }}>
                  Онлайн — {onlineMembers.length}
                </span>
              </div>
            )}
            {/* Online members from API */}
            {onlineMembers.length > 0 ? (
              <div className="mb-3">
                {onlineMembers.map(om => (
                  <div key={om.id}
                    className="flex items-center gap-2 py-1.5 px-2 rounded-xl cursor-pointer transition-all" style={{ marginBottom: "1px" }}
                    onMouseEnter={e => (e.currentTarget.style.background = om.avatar_color + "10")}
                    onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                  >
                    <div className="relative shrink-0">
                      <div className="w-7 h-7 rounded-full flex items-center justify-center" style={{ background: om.avatar_color + "22", color: om.avatar_color, border: `1px solid ${om.avatar_color}33`, fontFamily: "Rajdhani, sans-serif", fontWeight: 700, fontSize: "10px" }}>
                        {om.username.slice(0, 2).toUpperCase()}
                      </div>
                      <div className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 status-${om.status}`} style={{ borderColor: "var(--dark-panel)" }} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div style={{ fontFamily: "Rajdhani, sans-serif", fontWeight: 700, fontSize: "12px", color: om.avatar_color, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{om.username}</div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <>
                {/* Fallback: Group by role (static data) */}
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

                {/* Offline (static) */}
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
              </>
            )}
          </div>
        </div>
      )}
    </div>

    {/* Выбор устройств для голосовых каналов */}
    {showVoiceDevicePicker && (
      <AudioDevicePicker
        audioDevices={voiceWebRTC.audioDevices}
        videoDevices={voiceWebRTC.videoDevices}
        outputDevices={voiceWebRTC.outputDevices}
        selectedMic={voiceWebRTC.selectedMic}
        selectedCamera={voiceWebRTC.selectedCamera}
        selectedSpeaker={voiceWebRTC.selectedSpeaker}
        onSelectMic={async (id) => {
          voiceWebRTC.selectMic(id);
          // Если уже в канале — переключаем микрофон в живом потоке
          if (myStream) {
            try {
              const constraint = id !== "default" ? { deviceId: { exact: id } } : true;
              const newS = await navigator.mediaDevices.getUserMedia({ audio: constraint, video: false });
              const newTrack = newS.getAudioTracks()[0];
              myStream.getAudioTracks().forEach(t => t.stop());
              const updated = new MediaStream([newTrack, ...myStream.getVideoTracks()]);
              newTrack.enabled = !micMuted;
              setMyStream(updated);
            } catch { /* silent */ }
          }
        }}
        onSelectCamera={voiceWebRTC.selectCamera}
        onSelectSpeaker={voiceWebRTC.selectSpeaker}
        withVideo={false}
        onClose={() => setShowVoiceDevicePicker(false)}
      />
    )}
    </>
  );
}