import { useState, useRef, useEffect, useCallback } from "react";
import Icon from "@/components/ui/icon";
import UserAvatar from "@/components/UserAvatar";
import IncomingCall from "@/components/IncomingCall";
import AudioDevicePicker from "@/components/AudioDevicePicker";
import { useWebRTC } from "@/hooks/useWebRTC";

const DM_URL = "https://functions.poehali.dev/b026ce37-f295-45e6-9d62-287d071942eb";
const ONLINE_URL = "https://functions.poehali.dev/66112eb3-a471-46d1-b43a-c46fa78fbe18";

interface User {
  id: number;
  username: string;
  email: string;
  avatar_color: string;
  status: string;
}

interface DMViewProps {
  user: User;
  avatarImg?: string | null;
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

interface Friend {
  id: number;
  username: string;
  avatar_color: string;
  user_status: string;
  is_online: boolean;
  direction?: string;
  friend_status?: string;
}

interface Convo {
  user_id: number;
  username: string;
  avatar_color: string;
  status: string;
  last_msg: string;
  last_time: string;
  is_online: boolean;
}

interface Msg {
  id: number;
  from_user_id: number;
  text: string;
  time: string;
  date?: string;
  is_removed?: boolean;
  edited?: boolean;
  file_url?: string;
  file_name?: string;
  file_type?: string;
}

interface SearchUser {
  id: number;
  username: string;
  avatar_color: string;
  status: string;
  is_online: boolean;
}

const STATUS_COLOR: Record<string, string> = {
  online: "#00ff88", streaming: "#ff00aa", away: "#ff6600", dnd: "#ff4444", offline: "#4a5568",
};

const EMOJI_LIST = ["👍","❤️","😂","😮","😢","🔥","⚔️","🏆","💯","✅","👀","🎮"];

type Tab = "friends" | "pending" | "blocked";

export default function DMView({
  user, avatarImg, onOpenSettings, micMuted, headphonesDeaf,
  onToggleMic, onToggleDeaf, myStatusColor, myStatusLabel, onOpenStatusMenu,
}: DMViewProps) {
  const rF = { fontFamily: "Rajdhani, sans-serif" };
  const iF = { fontFamily: "IBM Plex Sans, sans-serif" };

  // Активный диалог
  const [activeConvo, setActiveConvo] = useState<Convo | null>(null);
  // Список диалогов
  const [convos, setConvos] = useState<Convo[]>([]);
  // Сообщения текущего диалога
  const [msgs, setMsgs] = useState<Msg[]>([]);
  // Ввод
  const [input, setInput] = useState("");
  // Вкладка (друзья/входящие/заблокированные)
  const [tab, setTab] = useState<Tab>("friends");
  // Поиск на главном экране
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchUser[]>([]);
  const [searching, setSearching] = useState(false);
  // Друзья
  const [friends, setFriends] = useState<Friend[]>([]);
  const [pending, setPending] = useState<Friend[]>([]);
  // Добавить друга
  const [addInput, setAddInput] = useState("");
  const [addStatus, setAddStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [addError, setAddError] = useState("");
  const [addingFriendId, setAddingFriendId] = useState<number | null>(null);
  const [addedFriendIds, setAddedFriendIds] = useState<Set<number>>(new Set());
  // Контекст сообщения
  const [menuMsgId, setMenuMsgId] = useState<number | null>(null);
  // Редактирование
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editText, setEditText] = useState("");
  // Реакции (эмодзи пикер над сообщением)
  const [emojiPickerMsgId, setEmojiPickerMsgId] = useState<number | null>(null);
  // Поиск по собеседникам в сайдбаре
  const [sidebarSearch, setSidebarSearch] = useState("");
  // Загрузка
  const [loadingMsgs, setLoadingMsgs] = useState(false);
  // Звонок
  const [callActive, setCallActive] = useState(false);
  const [callVideo, setCallVideo] = useState(false);
  const [callTimer, setCallTimer] = useState(0);
  const [screenShareStream, setScreenShareStream] = useState<MediaStream | null>(null);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [outgoingCallId, setOutgoingCallId] = useState<number | null>(null);
  const [outgoingCallStatus, setOutgoingCallStatus] = useState<"ringing" | "accepted" | "declined" | "cancelled">("ringing");
  const [callRemoteUserId, setCallRemoteUserId] = useState<number | null>(null);
  const [isCallInitiator, setIsCallInitiator] = useState(false);
  const [showDevicePicker, setShowDevicePicker] = useState(false);
  // Входящий звонок
  const [incomingCall, setIncomingCall] = useState<{ call_id: number; caller_id: number; caller_name: string; caller_color: string; call_type: "audio" | "video" } | null>(null);

  // WebRTC хук — активен только во время звонка
  const webrtc = useWebRTC({
    userId: user.id,
    callId: outgoingCallId,
    remoteUserId: callRemoteUserId,
    isInitiator: isCallInitiator,
    withVideo: callVideo,
  });

  const msgsEndRef = useRef<HTMLDivElement>(null);
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastIdRef = useRef<number>(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const callTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const callPollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const outgoingCallPollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const screenVideoRef = useRef<HTMLVideoElement | null>(null);

  // ── Загрузка диалогов ──────────────────────────────────
  const fetchConvos = useCallback(async () => {
    try {
      const res = await fetch(`${DM_URL}?action=conversations&user_id=${user.id}`);
      const data = await res.json();
      if (data.conversations) setConvos(data.conversations);
    } catch { /* silent */ }
  }, [user.id]);

  // ── Загрузка друзей ────────────────────────────────────
  const fetchFriends = useCallback(async () => {
    try {
      const [accRes, pendRes] = await Promise.all([
        fetch(`${DM_URL}?action=friends&user_id=${user.id}&status=accepted`),
        fetch(`${DM_URL}?action=friends&user_id=${user.id}&status=pending`),
      ]);
      const [accData, pendData] = await Promise.all([accRes.json(), pendRes.json()]);
      if (accData.friends) setFriends(accData.friends);
      if (pendData.friends) setPending(pendData.friends);
    } catch { /* silent */ }
  }, [user.id]);

  // ── Polling входящих звонков ───────────────────────────
  useEffect(() => {
    const poll = async () => {
      try {
        const res = await fetch(`${DM_URL}?action=call_poll&user_id=${user.id}`);
        const data = await res.json();
        if (data.incoming && !callActive) {
          setIncomingCall(data.incoming);
        }
      } catch { /* silent */ }
    };
    poll();
    callPollRef.current = setInterval(poll, 3000);
    return () => { if (callPollRef.current) clearInterval(callPollRef.current); };
  }, [user.id, callActive]);

  // ── Звонок ─────────────────────────────────────────────
  const startCall = async (withVideo = false) => {
    if (!activeConvo) return;
    setCallVideo(withVideo);
    setIsCallInitiator(true);
    setCallRemoteUserId(activeConvo.user_id);

    try {
      const res = await fetch(DM_URL, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "call_invite", caller_id: user.id, callee_id: activeConvo.user_id,
          caller_name: user.username, caller_color: user.avatar_color,
          call_type: withVideo ? "video" : "audio",
        }),
      });
      const data = await res.json();
      if (data.call_id) {
        setOutgoingCallId(data.call_id);
        setOutgoingCallStatus("ringing");
        outgoingCallPollRef.current = setInterval(async () => {
          try {
            const r = await fetch(`${DM_URL}?action=call_status&call_id=${data.call_id}`);
            const d = await r.json();
            if (d.status === "accepted") {
              setOutgoingCallStatus("accepted");
              if (outgoingCallPollRef.current) clearInterval(outgoingCallPollRef.current);
            } else if (d.status === "declined" || d.status === "cancelled") {
              setOutgoingCallStatus(d.status as "declined" | "cancelled");
              if (outgoingCallPollRef.current) clearInterval(outgoingCallPollRef.current);
              setTimeout(() => endCall(), 2000);
            }
          } catch { /* silent */ }
        }, 2000);
      }
    } catch { /* silent */ }

    setCallActive(true);
    setCallTimer(0);
    callTimerRef.current = setInterval(() => setCallTimer(t => t + 1), 1000);
  };

  const endCall = () => {
    if (callTimerRef.current) { clearInterval(callTimerRef.current); callTimerRef.current = null; }
    if (outgoingCallPollRef.current) { clearInterval(outgoingCallPollRef.current); outgoingCallPollRef.current = null; }
    if (screenShareStream) { screenShareStream.getTracks().forEach(t => t.stop()); setScreenShareStream(null); setIsScreenSharing(false); }
    webrtc.hangup();
    if (outgoingCallId) {
      fetch(DM_URL, { method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "call_answer", call_id: outgoingCallId, answer: "cancel" }),
      }).catch(() => {});
    }
    setCallActive(false);
    setCallVideo(false);
    setCallTimer(0);
    setOutgoingCallId(null);
    setCallRemoteUserId(null);
    setIsCallInitiator(false);
    setOutgoingCallStatus("ringing");
  };

  const acceptIncomingCall = async () => {
    if (!incomingCall) return;
    await fetch(DM_URL, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "call_answer", call_id: incomingCall.call_id, answer: "accept" }),
    }).catch(() => {});
    const convo = {
      user_id: incomingCall.caller_id, username: incomingCall.caller_name,
      avatar_color: incomingCall.caller_color, status: "online",
      last_msg: "", last_time: "", is_online: true,
    };
    setActiveConvo(convo);
    // Настраиваем WebRTC как принимающий
    setOutgoingCallId(incomingCall.call_id);
    setCallRemoteUserId(incomingCall.caller_id);
    setIsCallInitiator(false);
    setCallVideo(incomingCall.call_type === "video");
    setIncomingCall(null);
    setCallActive(true);
    setCallTimer(0);
    callTimerRef.current = setInterval(() => setCallTimer(t => t + 1), 1000);
  };

  const declineIncomingCall = async () => {
    if (!incomingCall) return;
    await fetch(DM_URL, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "call_answer", call_id: incomingCall.call_id, answer: "decline" }),
    }).catch(() => {});
    setIncomingCall(null);
  };

  const toggleCallMic = () => {
    if (localStream) localStream.getAudioTracks().forEach(t => { t.enabled = callMuted; });
    setCallMuted(v => !v);
  };

  const startCallScreenShare = async () => {
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: false });
      setScreenShareStream(stream);
      setIsScreenSharing(true);
      setTimeout(() => { if (screenVideoRef.current) screenVideoRef.current.srcObject = stream; }, 100);
      stream.getVideoTracks()[0].onended = () => { setScreenShareStream(null); setIsScreenSharing(false); };
    } catch { /* отмена */ }
  };

  const stopCallScreenShare = () => {
    if (screenShareStream) { screenShareStream.getTracks().forEach(t => t.stop()); setScreenShareStream(null); }
    setIsScreenSharing(false);
  };

  const fmtTime = (s: number) =>
    `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

  // ── Загрузка сообщений ─────────────────────────────────
  const fetchMsgs = useCallback(async (partnerId: number, reset = false) => {
    const afterId = reset ? 0 : lastIdRef.current;
    try {
      const res = await fetch(`${DM_URL}?user_a=${user.id}&user_b=${partnerId}&after_id=${afterId}`);
      const data = await res.json();
      if (!data.messages?.length) return;
      lastIdRef.current = data.messages[data.messages.length - 1].id;
      if (reset) {
        setMsgs(data.messages);
      } else {
        setMsgs(prev => [...prev, ...data.messages]);
      }
      setTimeout(() => msgsEndRef.current?.scrollIntoView({ behavior: "smooth" }), 60);
    } catch { /* silent */ }
  }, [user.id]);

  // При смене диалога
  useEffect(() => {
    if (pollingRef.current) clearInterval(pollingRef.current);
    if (!activeConvo) return;
    setMsgs([]);
    setInput("");
    lastIdRef.current = 0;
    setLoadingMsgs(true);
    fetchMsgs(activeConvo.user_id, true).finally(() => setLoadingMsgs(false));
    pollingRef.current = setInterval(() => fetchMsgs(activeConvo.user_id), 2000);
    return () => { if (pollingRef.current) clearInterval(pollingRef.current); };
  }, [activeConvo?.user_id]);

  // Начальная загрузка
  useEffect(() => {
    fetchConvos();
    fetchFriends();
    const convoPoll = setInterval(fetchConvos, 5000);
    return () => clearInterval(convoPoll);
  }, [fetchConvos, fetchFriends]);

  // ── Открыть диалог ─────────────────────────────────────
  const openConvo = (u: { id: number; username: string; avatar_color: string; is_online: boolean; user_status?: string; status?: string }) => {
    const convo: Convo = {
      user_id: u.id,
      username: u.username,
      avatar_color: u.avatar_color,
      status: u.user_status || u.status || "offline",
      last_msg: "",
      last_time: "",
      is_online: u.is_online,
    };
    setActiveConvo(convo);
    setMenuMsgId(null);
    setEditingId(null);
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  // ── Отправить сообщение ────────────────────────────────
  const sendMsg = async () => {
    if (!input.trim() || !activeConvo) return;
    const text = input.trim();
    setInput("");
    try {
      const res = await fetch(DM_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ from_user_id: user.id, to_user_id: activeConvo.user_id, text }),
      });
      const data = await res.json();
      if (data.id) {
        setMsgs(prev => [...prev, data]);
        lastIdRef.current = data.id;
        setTimeout(() => msgsEndRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
        fetchConvos();
      }
    } catch { /* silent */ }
  };

  // ── Редактировать сообщение ────────────────────────────
  const editMsg = async (id: number, text: string) => {
    try {
      await fetch(DM_URL, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "edit", id, user_id: user.id, text }),
      });
      setMsgs(prev => prev.map(m => m.id === id ? { ...m, text, edited: true } : m));
      setEditingId(null);
      setEditText("");
    } catch { /* silent */ }
  };

  // ── Удалить сообщение ──────────────────────────────────
  const removeMsg = async (id: number) => {
    try {
      await fetch(DM_URL, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "remove", id, user_id: user.id }),
      });
      setMsgs(prev => prev.map(m => m.id === id ? { ...m, text: "Сообщение удалено", is_removed: true } : m));
      setMenuMsgId(null);
    } catch { /* silent */ }
  };

  // ── Добавить друга по username (из поля ввода) ──────────
  const addFriend = async () => {
    if (!addInput.trim()) return;
    setAddStatus("sending");
    setAddError("");
    try {
      const res = await fetch(DM_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "add_friend", user_id: user.id, username: addInput.trim() }),
      });
      const data = await res.json();
      if (data.ok) {
        setAddStatus("sent");
        setAddInput("");
        fetchFriends();
        setTimeout(() => setAddStatus("idle"), 3000);
      } else {
        setAddStatus("error");
        setAddError(data.error === "user not found" ? "Пользователь не найден" : data.error || "Ошибка");
        setTimeout(() => setAddStatus("idle"), 3000);
      }
    } catch {
      setAddStatus("error");
      setAddError("Ошибка соединения");
      setTimeout(() => setAddStatus("idle"), 3000);
    }
  };

  // ── Добавить друга прямо из результатов поиска ──────────
  const addFriendById = async (targetUser: SearchUser) => {
    if (addingFriendId === targetUser.id) return;
    setAddingFriendId(targetUser.id);
    try {
      const res = await fetch(DM_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "add_friend", user_id: user.id, username: targetUser.username }),
      });
      const data = await res.json();
      if (data.ok) {
        setAddedFriendIds(prev => new Set(prev).add(targetUser.id));
        fetchFriends();
      }
    } catch { /* silent */ }
    setAddingFriendId(null);
  };

  // ── Принять/отклонить заявку ───────────────────────────
  const respondFriend = async (friendId: number, accept: boolean) => {
    try {
      await fetch(DM_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "respond_friend", user_id: user.id, friend_id: friendId, accept }),
      });
      fetchFriends();
    } catch { /* silent */ }
  };

  // ── Удалить друга ──────────────────────────────────────
  const removeFriend = async (friendId: number) => {
    try {
      await fetch(DM_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "remove_friend", user_id: user.id, friend_id: friendId }),
      });
      fetchFriends();
    } catch { /* silent */ }
  };

  // ── Поиск пользователей ────────────────────────────────
  const doSearch = async (q: string) => {
    setSearchQuery(q);
    if (q.trim().length < 2) { setSearchResults([]); return; }
    setSearching(true);
    try {
      const res = await fetch(`${DM_URL}?action=search_users&q=${encodeURIComponent(q)}&user_id=${user.id}`);
      const data = await res.json();
      setSearchResults(data.users || []);
    } catch { /* silent */ }
    setSearching(false);
  };

  // ── Sidebar фильтр ─────────────────────────────────────
  const filteredConvos = convos.filter(c =>
    c.username.toLowerCase().includes(sidebarSearch.toLowerCase())
  );

  const incomingPending = pending.filter(f => f.direction === "incoming");
  const outgoingPending = pending.filter(f => f.direction === "outgoing");

  // ── Рендер ─────────────────────────────────────────────
  return (
    <div className="flex h-screen overflow-hidden" style={{ fontFamily: "IBM Plex Sans, sans-serif", background: "var(--dark-bg)" }}
      onClick={() => { setMenuMsgId(null); setEmojiPickerMsgId(null); }}>

      {/* Входящий звонок */}
      {incomingCall && !callActive && (
        <IncomingCall
          callerName={incomingCall.caller_name}
          callerColor={incomingCall.caller_color}
          callType={incomingCall.call_type}
          onAccept={acceptIncomingCall}
          onDecline={declineIncomingCall}
        />
      )}

      {/* Выбор устройств */}
      {showDevicePicker && (
        <AudioDevicePicker
          audioDevices={webrtc.audioDevices}
          videoDevices={webrtc.videoDevices}
          outputDevices={webrtc.outputDevices}
          selectedMic={webrtc.selectedMic}
          selectedCamera={webrtc.selectedCamera}
          selectedSpeaker={webrtc.selectedSpeaker}
          onSelectMic={webrtc.selectMic}
          onSelectCamera={webrtc.selectCamera}
          onSelectSpeaker={webrtc.selectSpeaker}
          withVideo={callVideo}
          onClose={() => setShowDevicePicker(false)}
        />
      )}

      {/* Сайдбар */}
      <div className="flex flex-col w-60 shrink-0" style={{ background: "var(--dark-panel)", borderRight: "1px solid rgba(0,255,136,0.08)" }}>

        {/* Поиск в сайдбаре */}
        <div className="px-3 pt-3 pb-2">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl" style={{ background: "#0d1424", border: "1px solid rgba(255,255,255,0.07)" }}>
            <Icon name="Search" size={13} style={{ color: "#6b7fa3" }} />
            <input
              value={sidebarSearch}
              onChange={e => setSidebarSearch(e.target.value)}
              placeholder="Найти диалог..."
              className="bg-transparent outline-none flex-1"
              style={{ ...iF, fontSize: "13px", color: "#e2e8f0" }}
            />
          </div>
        </div>

        {/* Кнопка "Друзья" */}
        <button
          onClick={() => { setActiveConvo(null); setTab("friends"); }}
          className="flex items-center gap-3 mx-2 px-3 py-2 rounded-xl mb-1 transition-all"
          style={{ background: !activeConvo && tab === "friends" ? "rgba(0,255,136,0.1)" : "transparent", color: !activeConvo && tab === "friends" ? "#00ff88" : "#8899bb" }}>
          <Icon name="Users" size={16} />
          <span style={{ ...rF, fontWeight: 700, fontSize: "14px" }}>Друзья</span>
          {incomingPending.length > 0 && (
            <span className="ml-auto w-5 h-5 rounded-full flex items-center justify-center text-white font-bold" style={{ background: "#ff00aa", fontSize: "10px" }}>
              {incomingPending.length}
            </span>
          )}
        </button>

        {/* Диалоги */}
        {filteredConvos.length > 0 && (
          <div className="px-3 mb-1">
            <span style={{ ...rF, fontWeight: 600, fontSize: "10px", color: "#4a5568", textTransform: "uppercase", letterSpacing: "1px" }}>
              Сообщения
            </span>
          </div>
        )}
        <div className="flex-1 overflow-y-auto px-2 space-y-0.5">
          {filteredConvos.map(c => (
            <button key={c.user_id}
              onClick={() => openConvo(c)}
              className="w-full flex items-center gap-2 px-2 py-2 rounded-xl transition-all text-left group"
              style={{ background: activeConvo?.user_id === c.user_id ? "rgba(0,255,136,0.1)" : "transparent" }}
              onMouseEnter={e => { if (activeConvo?.user_id !== c.user_id) e.currentTarget.style.background = "rgba(255,255,255,0.04)"; }}
              onMouseLeave={e => { if (activeConvo?.user_id !== c.user_id) e.currentTarget.style.background = "transparent"; }}>
              <div className="relative shrink-0">
                <div className="w-8 h-8 rounded-full flex items-center justify-center"
                  style={{ background: c.avatar_color + "22", color: c.avatar_color, border: `1px solid ${c.avatar_color}33`, ...rF, fontWeight: 700, fontSize: "11px" }}>
                  {c.username.slice(0, 2).toUpperCase()}
                </div>
                <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2"
                  style={{ background: c.is_online ? STATUS_COLOR.online : STATUS_COLOR.offline, borderColor: "var(--dark-panel)" }} />
              </div>
              <div className="flex-1 min-w-0">
                <div style={{ ...rF, fontWeight: 700, fontSize: "13px", color: activeConvo?.user_id === c.user_id ? "#00ff88" : "#e2e8f0" }}>
                  {c.username}
                </div>
                {c.last_msg && (
                  <div style={{ ...iF, fontSize: "11px", color: "#4a5568", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {c.last_msg.slice(0, 25)}{c.last_msg.length > 25 ? "…" : ""}
                  </div>
                )}
              </div>
              {c.last_time && <span style={{ ...iF, fontSize: "10px", color: "#4a5568" }}>{c.last_time}</span>}
            </button>
          ))}
        </div>

        {/* Футер пользователя */}
        <div className="px-2 py-2 mt-auto" style={{ borderTop: "1px solid rgba(0,255,136,0.08)" }}>
          <div className="flex items-center gap-2 px-2 py-1.5 rounded-xl" style={{ background: "rgba(255,255,255,0.03)" }}>
            <div className="relative cursor-pointer" onClick={onOpenStatusMenu}>
              <UserAvatar username={user.username} color={user.avatar_color} avatarImg={avatarImg} size={32} />
              <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2" style={{ background: myStatusColor, borderColor: "var(--dark-panel)" }} />
            </div>
            <div className="flex-1 min-w-0">
              <div style={{ ...rF, fontWeight: 700, fontSize: "13px", color: "#e2e8f0", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{user.username}</div>
              <div style={{ ...iF, fontSize: "10px", color: myStatusColor }}>{myStatusLabel}</div>
            </div>
            <button onClick={onOpenSettings} className="hover:opacity-70 transition-opacity">
              <Icon name="Settings" size={14} style={{ color: "#6b7fa3" }} />
            </button>
            <button onClick={onToggleMic} className="hover:opacity-70 transition-opacity">
              <Icon name={micMuted ? "MicOff" : "Mic"} size={14} style={{ color: micMuted ? "#ff4444" : "#6b7fa3" }} />
            </button>
            <button onClick={onToggleDeaf} className="hover:opacity-70 transition-opacity">
              <Icon name={headphonesDeaf ? "VolumeX" : "Headphones"} size={14} style={{ color: headphonesDeaf ? "#ff4444" : "#6b7fa3" }} />
            </button>
          </div>
        </div>
      </div>

      {/* Основная зона */}
      {activeConvo ? (
        /* ── ЧАТ ───────────────────────────────────────────── */
        <div className="flex-1 flex flex-col min-w-0">

          {/* Шапка */}
          <div className="flex items-center gap-3 px-4 py-3 shrink-0" style={{ borderBottom: "1px solid rgba(0,255,136,0.08)", background: "var(--dark-panel)" }}>
            <button onClick={() => setActiveConvo(null)} className="hover:opacity-70 transition-opacity mr-1">
              <Icon name="ChevronLeft" size={18} style={{ color: "#6b7fa3" }} />
            </button>
            <div className="relative">
              <div className="w-9 h-9 rounded-full flex items-center justify-center"
                style={{ background: activeConvo.avatar_color + "22", color: activeConvo.avatar_color, border: `2px solid ${activeConvo.avatar_color}44`, ...rF, fontWeight: 700, fontSize: "12px" }}>
                {activeConvo.username.slice(0, 2).toUpperCase()}
              </div>
              <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2"
                style={{ background: activeConvo.is_online ? STATUS_COLOR.online : STATUS_COLOR.offline, borderColor: "var(--dark-panel)" }} />
            </div>
            <div>
              <div style={{ ...rF, fontWeight: 700, fontSize: "16px", color: activeConvo.avatar_color }}>{activeConvo.username}</div>
              <div style={{ ...iF, fontSize: "11px", color: activeConvo.is_online ? STATUS_COLOR.online : "#6b7fa3" }}>
                {activeConvo.is_online ? "В сети" : "Не в сети"}
              </div>
            </div>
            <div className="ml-auto flex items-center gap-2">
              {callActive ? (
                <>
                  {/* Статус / индикатор подключения */}
                  {outgoingCallStatus === "ringing" && isCallInitiator ? (
                    <span style={{ ...iF, fontSize: "12px", color: "#6b7fa3" }} className="animate-pulse">Вызов...</span>
                  ) : outgoingCallStatus === "declined" ? (
                    <span style={{ ...iF, fontSize: "12px", color: "#ff4444" }}>Отклонён</span>
                  ) : (
                    <div className="flex items-center gap-1.5">
                      <div className="w-2 h-2 rounded-full" style={{ background: webrtc.connected ? "#00ff88" : "#ff6600", animation: webrtc.connected ? "none" : "pulse 1s infinite" }} title={webrtc.connected ? "Соединено" : "Подключение..."} />
                      <span style={{ ...rF, fontWeight: 700, fontSize: "13px", color: webrtc.connected ? "#00ff88" : "#ff6600" }}>{fmtTime(callTimer)}</span>
                    </div>
                  )}
                  {/* Мут микрофона */}
                  <button onClick={() => webrtc.setMicMuted(!webrtc.micMuted)} className="w-8 h-8 rounded-xl flex items-center justify-center hover:opacity-80"
                    style={{ background: webrtc.micMuted ? "rgba(255,68,68,0.2)" : "rgba(0,255,136,0.1)", color: webrtc.micMuted ? "#ff4444" : "#00ff88" }} title={webrtc.micMuted ? "Включить микрофон" : "Выключить микрофон"}>
                    <Icon name={webrtc.micMuted ? "MicOff" : "Mic"} size={15} />
                  </button>
                  {/* Деафен */}
                  <button onClick={() => webrtc.setDeafened(!webrtc.deafened)} className="w-8 h-8 rounded-xl flex items-center justify-center hover:opacity-80"
                    style={{ background: webrtc.deafened ? "rgba(255,68,68,0.2)" : "rgba(255,255,255,0.06)", color: webrtc.deafened ? "#ff4444" : "#6b7fa3" }} title={webrtc.deafened ? "Включить звук" : "Выключить звук"}>
                    <Icon name={webrtc.deafened ? "VolumeX" : "Headphones"} size={15} />
                  </button>
                  {/* Трансляция экрана */}
                  {callVideo && (
                    <button onClick={isScreenSharing ? stopCallScreenShare : startCallScreenShare} className="w-8 h-8 rounded-xl flex items-center justify-center hover:opacity-80"
                      style={{ background: isScreenSharing ? "rgba(255,0,170,0.2)" : "rgba(0,170,255,0.1)", color: isScreenSharing ? "#ff00aa" : "#00aaff" }} title="Трансляция экрана">
                      <Icon name={isScreenSharing ? "MonitorOff" : "MonitorPlay"} size={15} />
                    </button>
                  )}
                  {/* Устройства */}
                  <button onClick={() => setShowDevicePicker(true)} className="w-8 h-8 rounded-xl flex items-center justify-center hover:opacity-80"
                    style={{ background: "rgba(255,255,255,0.06)", color: "#6b7fa3" }} title="Настройки устройств">
                    <Icon name="Settings2" size={15} />
                  </button>
                  {/* Завершить */}
                  <button onClick={endCall} className="w-8 h-8 rounded-xl flex items-center justify-center hover:opacity-80"
                    style={{ background: "rgba(255,68,68,0.2)", color: "#ff4444" }} title="Завершить звонок">
                    <Icon name="PhoneOff" size={15} />
                  </button>
                </>
              ) : (
                <>
                  <button onClick={() => startCall(false)} className="w-8 h-8 rounded-xl flex items-center justify-center hover:opacity-70 transition-opacity" style={{ background: "rgba(0,255,136,0.08)" }} title="Голосовой звонок">
                    <Icon name="Phone" size={15} style={{ color: "#00ff88" }} />
                  </button>
                  <button onClick={() => startCall(true)} className="w-8 h-8 rounded-xl flex items-center justify-center hover:opacity-70 transition-opacity" style={{ background: "rgba(0,170,255,0.08)" }} title="Видеозвонок">
                    <Icon name="Video" size={15} style={{ color: "#00aaff" }} />
                  </button>
                  {/* Настройки устройств (всегда доступны) */}
                  <button onClick={() => { webrtc.refreshDevices(); setShowDevicePicker(true); }}
                    className="w-8 h-8 rounded-xl flex items-center justify-center hover:opacity-70 transition-opacity"
                    style={{ background: "rgba(255,255,255,0.05)" }} title="Настройки микрофона и динамика">
                    <Icon name="Settings2" size={15} style={{ color: "#6b7fa3" }} />
                  </button>
                </>
              )}
              <button className="w-8 h-8 rounded-xl flex items-center justify-center hover:opacity-70 transition-opacity" style={{ background: "rgba(255,255,255,0.05)" }} title="Профиль">
                <Icon name="User" size={15} style={{ color: "#6b7fa3" }} />
              </button>
            </div>
          </div>

          {/* Видео звонок */}
          {callActive && callVideo && (
            <div className="shrink-0 relative" style={{ height: "240px", background: "#060a11", borderBottom: "1px solid rgba(0,255,136,0.08)" }}>
              {isScreenSharing && screenShareStream ? (
                <video ref={screenVideoRef} autoPlay muted playsInline className="w-full h-full object-contain" />
              ) : (
                <div className="w-full h-full flex items-center justify-center gap-8">
                  {/* Удалённое видео собеседника */}
                  <div className="flex flex-col items-center gap-2">
                    {webrtc.remoteStream && webrtc.remoteStream.getVideoTracks().length > 0 ? (
                      <video autoPlay playsInline className="w-32 h-32 rounded-2xl object-cover"
                        style={{ border: `2px solid ${activeConvo.avatar_color}44` }}
                        ref={el => { if (el && webrtc.remoteStream) el.srcObject = webrtc.remoteStream; }} />
                    ) : (
                      <div className="w-24 h-24 rounded-full flex items-center justify-center"
                        style={{ background: activeConvo.avatar_color + "22", color: activeConvo.avatar_color, border: `3px solid ${activeConvo.avatar_color}55`, ...rF, fontWeight: 900, fontSize: "28px", boxShadow: `0 0 24px ${activeConvo.avatar_color}33` }}>
                        {activeConvo.username.slice(0, 2).toUpperCase()}
                      </div>
                    )}
                    <span style={{ ...rF, fontWeight: 700, fontSize: "12px", color: activeConvo.avatar_color }}>{activeConvo.username}</span>
                  </div>
                  {/* Моё локальное видео */}
                  <div className="flex flex-col items-center gap-2">
                    {webrtc.localStream && webrtc.localStream.getVideoTracks().length > 0 ? (
                      <video autoPlay muted playsInline className="w-24 h-24 rounded-2xl object-cover"
                        style={{ border: `2px solid ${user.avatar_color}44` }}
                        ref={el => { if (el && webrtc.localStream) el.srcObject = webrtc.localStream; }} />
                    ) : (
                      <div className="w-20 h-20 rounded-full flex items-center justify-center"
                        style={{ background: user.avatar_color + "22", color: user.avatar_color, border: `2px solid ${user.avatar_color}44`, ...rF, fontWeight: 900, fontSize: "22px" }}>
                        {user.username.slice(0, 2).toUpperCase()}
                      </div>
                    )}
                    <span style={{ ...rF, fontWeight: 700, fontSize: "11px", color: user.avatar_color }}>Вы</span>
                  </div>
                </div>
              )}
              <div className="absolute top-2 left-3 flex items-center gap-2">
                <div className="w-2 h-2 rounded-full" style={{ background: webrtc.connected ? "#00ff88" : "#ff6600", animation: "pulse 1s infinite" }} />
                <span style={{ ...rF, fontWeight: 700, fontSize: "11px", color: webrtc.connected ? "#00ff88" : "#ff6600" }}>
                  {webrtc.connected ? `Видеозвонок · ${fmtTime(callTimer)}` : "Подключение..."}
                </span>
              </div>
            </div>
          )}

          {/* Аудио звонок (без видео) */}
          {callActive && !callVideo && (
            <div className="shrink-0 flex items-center justify-center gap-6 py-4" style={{ background: "rgba(0,255,136,0.04)", borderBottom: "1px solid rgba(0,255,136,0.08)" }}>
              <div className="flex flex-col items-center gap-2">
                <div className="w-16 h-16 rounded-full flex items-center justify-center"
                  style={{ background: activeConvo.avatar_color + "22", color: activeConvo.avatar_color, border: `3px solid ${webrtc.connected ? activeConvo.avatar_color + "88" : activeConvo.avatar_color + "33"}`, ...rF, fontWeight: 900, fontSize: "20px", boxShadow: webrtc.connected ? `0 0 20px ${activeConvo.avatar_color}33` : "none", transition: "all 0.3s" }}>
                  {activeConvo.username.slice(0, 2).toUpperCase()}
                </div>
                <span style={{ ...rF, fontWeight: 700, fontSize: "12px", color: activeConvo.avatar_color }}>{activeConvo.username}</span>
              </div>
              <div className="flex flex-col items-center gap-1">
                <Icon name={webrtc.connected ? "Phone" : "Loader2"} size={18} style={{ color: webrtc.connected ? "#00ff88" : "#ff6600" }} className={webrtc.connected ? "" : "animate-spin"} />
                <span style={{ ...rF, fontWeight: 700, fontSize: "13px", color: webrtc.connected ? "#00ff88" : "#ff6600" }}>{webrtc.connected ? fmtTime(callTimer) : "Подключение..."}</span>
                <span style={{ ...iF, fontSize: "11px", color: "#6b7fa3" }}>Голосовой звонок</span>
              </div>
            </div>
          )}

          {/* Сообщения */}
          <div className="flex-1 overflow-y-auto px-4 py-4" onClick={() => { setMenuMsgId(null); setEmojiPickerMsgId(null); }}>
            {loadingMsgs && (
              <div className="flex justify-center py-8">
                <Icon name="Loader2" size={20} style={{ color: "#6b7fa3" }} className="animate-spin" />
              </div>
            )}

            {!loadingMsgs && msgs.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full gap-4 py-16">
                <div className="w-20 h-20 rounded-full flex items-center justify-center"
                  style={{ background: activeConvo.avatar_color + "22", color: activeConvo.avatar_color, border: `3px solid ${activeConvo.avatar_color}33`, ...rF, fontWeight: 900, fontSize: "24px" }}>
                  {activeConvo.username.slice(0, 2).toUpperCase()}
                </div>
                <div style={{ ...rF, fontWeight: 700, fontSize: "22px", color: "#e2e8f0" }}>{activeConvo.username}</div>
                <div style={{ ...iF, fontSize: "14px", color: "#6b7fa3" }}>Начало вашего диалога с {activeConvo.username}</div>
              </div>
            )}

            {/* Группировка по дате */}
            {(() => {
              let lastDate = "";
              return msgs.map((msg, i) => {
                const showDate = msg.date && msg.date !== lastDate;
                if (msg.date) lastDate = msg.date;
                const isMe = msg.from_user_id === user.id;
                const showAvatar = i === 0 || msgs[i - 1]?.from_user_id !== msg.from_user_id;

                return (
                  <div key={msg.id}>
                    {showDate && (
                      <div className="flex items-center gap-3 my-4">
                        <div className="flex-1 h-px" style={{ background: "rgba(255,255,255,0.06)" }} />
                        <span style={{ ...iF, fontSize: "11px", color: "#4a5568" }}>{msg.date}</span>
                        <div className="flex-1 h-px" style={{ background: "rgba(255,255,255,0.06)" }} />
                      </div>
                    )}
                    <div
                      className={`flex gap-2 group relative ${showAvatar ? "mt-3" : "mt-0.5"} ${isMe ? "flex-row-reverse" : "flex-row"}`}
                      onMouseLeave={() => { setMenuMsgId(null); setEmojiPickerMsgId(null); }}>

                      {/* Аватар */}
                      <div className="shrink-0 w-8" style={{ alignSelf: "flex-end" }}>
                        {showAvatar && !isMe && (
                          <div className="w-8 h-8 rounded-full flex items-center justify-center"
                            style={{ background: activeConvo.avatar_color + "22", color: activeConvo.avatar_color, border: `1px solid ${activeConvo.avatar_color}33`, ...rF, fontWeight: 700, fontSize: "10px" }}>
                            {activeConvo.username.slice(0, 2).toUpperCase()}
                          </div>
                        )}
                        {showAvatar && isMe && (
                          <UserAvatar username={user.username} color={user.avatar_color} avatarImg={avatarImg} size={32} />
                        )}
                      </div>

                      {/* Пузырь */}
                      <div className={`max-w-[70%] ${isMe ? "items-end" : "items-start"} flex flex-col`}>
                        {showAvatar && (
                          <div className={`flex items-baseline gap-2 mb-1 ${isMe ? "flex-row-reverse" : ""}`}>
                            <span style={{ ...rF, fontWeight: 700, fontSize: "13px", color: isMe ? user.avatar_color : activeConvo.avatar_color }}>
                              {isMe ? user.username : activeConvo.username}
                            </span>
                            <span style={{ ...iF, fontSize: "10px", color: "#4a5568" }}>{msg.time}</span>
                          </div>
                        )}

                        {editingId === msg.id ? (
                          <div className="flex gap-2 w-full">
                            <input
                              className="flex-1 px-3 py-1.5 rounded-xl outline-none text-sm"
                              style={{ background: "rgba(0,255,136,0.08)", border: "1px solid rgba(0,255,136,0.3)", color: "#e2e8f0", ...iF }}
                              value={editText}
                              onChange={e => setEditText(e.target.value)}
                              onKeyDown={e => { if (e.key === "Enter") editMsg(msg.id, editText); if (e.key === "Escape") { setEditingId(null); setEditText(""); } }}
                              autoFocus
                            />
                            <button onClick={() => editMsg(msg.id, editText)} style={{ ...rF, fontWeight: 700, fontSize: "12px", background: "rgba(0,255,136,0.15)", color: "#00ff88", border: "none", borderRadius: "8px", padding: "4px 12px", cursor: "pointer" }}>ОК</button>
                            <button onClick={() => { setEditingId(null); setEditText(""); }} style={{ ...iF, fontSize: "12px", background: "none", color: "#6b7fa3", border: "none", cursor: "pointer" }}>✕</button>
                          </div>
                        ) : (
                          <div className="relative">
                            {/* Контекст-кнопки при hover */}
                            <div className={`absolute top-0 ${isMe ? "left-0 -translate-x-full pr-1" : "right-0 translate-x-full pl-1"} opacity-0 group-hover:opacity-100 transition-opacity flex gap-1`}
                              onClick={e => e.stopPropagation()}>
                              <button
                                className="w-6 h-6 rounded-lg flex items-center justify-center hover:opacity-80"
                                style={{ background: "#0d1424", border: "1px solid rgba(0,255,136,0.15)" }}
                                onClick={() => setEmojiPickerMsgId(emojiPickerMsgId === msg.id ? null : msg.id)}
                                title="Реакция">
                                <Icon name="Smile" size={12} style={{ color: "#6b7fa3" }} />
                              </button>
                              {isMe && !msg.is_removed && (
                                <button
                                  className="w-6 h-6 rounded-lg flex items-center justify-center hover:opacity-80"
                                  style={{ background: "#0d1424", border: "1px solid rgba(0,255,136,0.15)" }}
                                  onClick={() => setMenuMsgId(menuMsgId === msg.id ? null : msg.id)}
                                  title="Ещё">
                                  <Icon name="MoreHorizontal" size={12} style={{ color: "#6b7fa3" }} />
                                </button>
                              )}
                            </div>

                            {/* Эмодзи пикер */}
                            {emojiPickerMsgId === msg.id && (
                              <div className={`absolute z-50 bottom-full mb-1 ${isMe ? "right-0" : "left-0"} flex gap-1 p-2 rounded-xl`}
                                style={{ background: "#0d1424", border: "1px solid rgba(0,255,136,0.2)", boxShadow: "0 8px 32px rgba(0,0,0,0.5)" }}
                                onClick={e => e.stopPropagation()}>
                                {EMOJI_LIST.map(emoji => (
                                  <button key={emoji} className="text-lg hover:scale-125 transition-transform w-7 h-7 flex items-center justify-center rounded"
                                    title={emoji}
                                    onClick={() => { setEmojiPickerMsgId(null); }}>
                                    {emoji}
                                  </button>
                                ))}
                              </div>
                            )}

                            {/* Контекстное меню */}
                            {menuMsgId === msg.id && (
                              <div className={`absolute z-50 bottom-full mb-1 ${isMe ? "right-0" : "left-0"} rounded-xl overflow-hidden`}
                                style={{ background: "#0d1424", border: "1px solid rgba(255,68,68,0.2)", minWidth: "140px", boxShadow: "0 8px 32px rgba(0,0,0,0.5)" }}
                                onClick={e => e.stopPropagation()}>
                                <button className="w-full flex items-center gap-2 px-3 py-2.5 text-left hover:bg-white hover:bg-opacity-5 transition-colors"
                                  onClick={() => { setEditingId(msg.id); setEditText(msg.text); setMenuMsgId(null); }}
                                  style={{ ...rF, fontWeight: 600, fontSize: "13px", color: "#00ff88" }}>
                                  <Icon name="Pencil" size={12} /> Редактировать
                                </button>
                                <button className="w-full flex items-center gap-2 px-3 py-2.5 text-left hover:bg-white hover:bg-opacity-5 transition-colors"
                                  onClick={() => removeMsg(msg.id)}
                                  style={{ ...rF, fontWeight: 600, fontSize: "13px", color: "#ff4444" }}>
                                  <Icon name="Trash2" size={12} /> Удалить
                                </button>
                              </div>
                            )}

                            {/* Сам пузырь */}
                            <div className="px-3 py-2 rounded-2xl"
                              style={{
                                background: isMe
                                  ? `linear-gradient(135deg, ${user.avatar_color}22, ${user.avatar_color}11)`
                                  : "rgba(255,255,255,0.06)",
                                border: isMe
                                  ? `1px solid ${user.avatar_color}33`
                                  : "1px solid rgba(255,255,255,0.08)",
                                borderBottomRightRadius: isMe ? "6px" : "18px",
                                borderBottomLeftRadius: isMe ? "18px" : "6px",
                              }}>
                              {/* Файл */}
                              {msg.file_url && !msg.is_removed && (
                                <div className="mb-2">
                                  {msg.file_type?.startsWith("image/") ? (
                                    <img src={msg.file_url} alt={msg.file_name || "file"} className="rounded-xl max-h-48 max-w-xs object-cover cursor-pointer hover:opacity-90 transition-opacity" onClick={() => window.open(msg.file_url, "_blank")} />
                                  ) : (
                                    <a href={msg.file_url} target="_blank" rel="noopener noreferrer"
                                      className="flex items-center gap-2 px-3 py-2 rounded-lg hover:opacity-80 transition-opacity"
                                      style={{ background: "rgba(0,255,136,0.08)", border: "1px solid rgba(0,255,136,0.15)" }}>
                                      <Icon name="File" size={14} style={{ color: "#00ff88" }} />
                                      <span style={{ ...iF, fontSize: "12px", color: "#e2e8f0" }}>{msg.file_name}</span>
                                    </a>
                                  )}
                                </div>
                              )}
                              <p style={{
                                ...iF, fontSize: "14px", lineHeight: "1.5",
                                color: msg.is_removed ? "#4a5568" : "#e2e8f0",
                                fontStyle: msg.is_removed ? "italic" : "normal",
                                wordBreak: "break-word",
                              }}>{msg.text}</p>
                              {msg.edited && !msg.is_removed && (
                                <span style={{ ...iF, fontSize: "10px", color: "#4a5568" }}> (изм.)</span>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              });
            })()}
            <div ref={msgsEndRef} />
          </div>

          {/* Поле ввода */}
          <div className="px-4 py-3 shrink-0" style={{ borderTop: "1px solid rgba(0,255,136,0.08)" }}>
            <div className="flex items-center gap-2 px-3 py-2 rounded-2xl" style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(0,255,136,0.12)" }}>
              <button onClick={() => fileInputRef.current?.click()} className="hover:opacity-70 transition-opacity" title="Прикрепить файл">
                <Icon name="Paperclip" size={16} style={{ color: "#6b7fa3" }} />
              </button>
              <input
                ref={inputRef}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === "Enter" && !e.shiftKey && sendMsg()}
                placeholder={`Написать ${activeConvo.username}...`}
                className="flex-1 bg-transparent outline-none"
                style={{ ...iF, fontSize: "14px", color: "#e2e8f0" }}
              />
              <button onClick={() => {}} className="hover:opacity-70 transition-opacity" title="Эмодзи">
                <Icon name="Smile" size={16} style={{ color: "#6b7fa3" }} />
              </button>
              <button
                onClick={sendMsg}
                disabled={!input.trim()}
                className="w-8 h-8 rounded-xl flex items-center justify-center transition-all hover:opacity-90 disabled:opacity-30"
                style={{ background: "rgba(0,255,136,0.15)", color: "#00ff88" }}>
                <Icon name="Send" size={14} />
              </button>
            </div>
            <input type="file" ref={fileInputRef} className="hidden" accept="image/*,video/*,.pdf,.txt" onChange={e => { e.target.value = ""; }} />
          </div>
        </div>
      ) : (
        /* ── ДРУЗЬЯ / ПОИСК ────────────────────────────────── */
        <div className="flex-1 flex flex-col min-w-0">

          {/* Шапка */}
          <div className="flex items-center gap-4 px-6 py-3 shrink-0" style={{ borderBottom: "1px solid rgba(0,255,136,0.08)", background: "var(--dark-panel)" }}>
            <Icon name="Users" size={18} style={{ color: "#00ff88" }} />
            <span style={{ ...rF, fontWeight: 700, fontSize: "16px", color: "#e2e8f0" }}>Друзья</span>
            <div className="h-5 w-px" style={{ background: "rgba(255,255,255,0.1)" }} />
            {(["friends", "pending", "blocked"] as Tab[]).map(t => (
              <button key={t} onClick={() => setTab(t)}
                className="px-3 py-1 rounded-lg transition-all"
                style={{
                  ...rF, fontWeight: 700, fontSize: "13px",
                  background: tab === t ? "rgba(0,255,136,0.12)" : "transparent",
                  color: tab === t ? "#00ff88" : "#6b7fa3",
                }}>
                {t === "friends" ? `В сети (${friends.filter(f => f.is_online).length})` : t === "pending" ? `Ожидание${incomingPending.length ? ` (${incomingPending.length})` : ""}` : "Заблокированные"}
              </button>
            ))}
            <div className="ml-auto">
              <button
                onClick={() => setTab("friends")}
                className="px-4 py-1.5 rounded-xl transition-all hover:opacity-90"
                style={{ ...rF, fontWeight: 700, fontSize: "13px", background: "rgba(0,255,136,0.15)", color: "#00ff88", border: "1px solid rgba(0,255,136,0.3)" }}>
                Добавить друга
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto px-6 py-4">

            {/* Умный поиск: люди + добавление в друзья */}
            <div className="mb-5">
              <div className="flex items-center gap-2 px-4 py-2.5 rounded-2xl" style={{ background: "rgba(255,255,255,0.05)", border: `1px solid ${searchQuery ? "rgba(0,255,136,0.25)" : "rgba(255,255,255,0.08)"}`, transition: "border-color 0.2s" }}>
                <Icon name={searching ? "Loader2" : "Search"} size={15} style={{ color: searching ? "#00ff88" : "#6b7fa3", flexShrink: 0 }} className={searching ? "animate-spin" : ""} />
                <input
                  value={searchQuery}
                  onChange={e => doSearch(e.target.value)}
                  placeholder="Поиск людей по имени..."
                  className="flex-1 bg-transparent outline-none"
                  style={{ ...iF, fontSize: "14px", color: "#e2e8f0" }}
                />
                {searchQuery && (
                  <button onClick={() => { setSearchQuery(""); setSearchResults([]); }} className="w-5 h-5 rounded-full flex items-center justify-center hover:opacity-70" style={{ background: "rgba(255,255,255,0.1)", color: "#6b7fa3", flexShrink: 0 }}>
                    <Icon name="X" size={11} />
                  </button>
                )}
              </div>

              {/* Результаты поиска с кнопкой добавить */}
              {searchQuery.trim().length >= 2 && (
                <div className="mt-2 rounded-2xl overflow-hidden" style={{ border: "1px solid rgba(255,255,255,0.07)", background: "rgba(255,255,255,0.02)" }}>
                  {searching && searchResults.length === 0 && (
                    <div className="flex items-center gap-3 px-4 py-3">
                      <Icon name="Loader2" size={16} style={{ color: "#6b7fa3" }} className="animate-spin" />
                      <span style={{ ...iF, fontSize: "13px", color: "#6b7fa3" }}>Ищу...</span>
                    </div>
                  )}
                  {!searching && searchResults.length === 0 && (
                    <div className="flex items-center gap-3 px-4 py-3">
                      <Icon name="UserX" size={16} style={{ color: "#4a5568" }} />
                      <span style={{ ...iF, fontSize: "13px", color: "#4a5568" }}>Никого не найдено по «{searchQuery}»</span>
                    </div>
                  )}
                  {searchResults.map((u, idx) => {
                    const isFriend = friends.some(f => f.id === u.id);
                    const isPending = pending.some(p => p.id === u.id);
                    const isAdded = addedFriendIds.has(u.id);
                    const isAdding = addingFriendId === u.id;
                    const isMe = u.id === user.id;
                    return (
                      <div key={u.id} className="flex items-center gap-3 px-4 py-3 group hover:bg-white hover:bg-opacity-4 transition-colors cursor-pointer"
                        style={{ borderTop: idx > 0 ? "1px solid rgba(255,255,255,0.05)" : "none" }}
                        onClick={() => !isMe && openConvo({ id: u.id, username: u.username, avatar_color: u.avatar_color, is_online: u.is_online, status: u.status })}>
                        {/* Аватар */}
                        <div className="relative shrink-0">
                          <div className="w-10 h-10 rounded-full flex items-center justify-center"
                            style={{ background: u.avatar_color + "22", color: u.avatar_color, border: `2px solid ${u.avatar_color}33`, ...rF, fontWeight: 800, fontSize: "13px" }}>
                            {u.username.slice(0, 2).toUpperCase()}
                          </div>
                          <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2"
                            style={{ background: u.is_online ? STATUS_COLOR.online : "#4a5568", borderColor: "var(--dark-bg)" }} />
                        </div>
                        {/* Инфо */}
                        <div className="flex-1 min-w-0">
                          <div style={{ ...rF, fontWeight: 700, fontSize: "15px", color: u.avatar_color, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{u.username}</div>
                          <div style={{ ...iF, fontSize: "12px", color: u.is_online ? "#00ff88" : "#4a5568" }}>
                            {u.is_online ? "В сети" : "Не в сети"}
                          </div>
                        </div>
                        {/* Кнопки действий */}
                        {!isMe && (
                          <div className="flex items-center gap-2 shrink-0">
                            <button
                              onClick={e => { e.stopPropagation(); openConvo({ id: u.id, username: u.username, avatar_color: u.avatar_color, is_online: u.is_online, status: u.status }); }}
                              className="px-3 py-1.5 rounded-xl transition-all hover:opacity-90"
                              style={{ ...rF, fontWeight: 700, fontSize: "12px", background: "rgba(0,170,255,0.12)", color: "#00aaff", border: "1px solid rgba(0,170,255,0.2)" }}>
                              <Icon name="MessageCircle" size={13} />
                            </button>
                            {isFriend ? (
                              <span className="px-3 py-1.5 rounded-xl" style={{ ...rF, fontWeight: 700, fontSize: "12px", color: "#00ff88", background: "rgba(0,255,136,0.08)", border: "1px solid rgba(0,255,136,0.2)" }}>
                                Друг ✓
                              </span>
                            ) : isPending || isAdded ? (
                              <span className="px-3 py-1.5 rounded-xl" style={{ ...rF, fontWeight: 700, fontSize: "12px", color: "#ffcc00", background: "rgba(255,204,0,0.08)", border: "1px solid rgba(255,204,0,0.2)" }}>
                                Заявка отправлена
                              </span>
                            ) : (
                              <button
                                onClick={e => { e.stopPropagation(); addFriendById(u); }}
                                disabled={isAdding}
                                className="px-3 py-1.5 rounded-xl transition-all hover:opacity-90 disabled:opacity-50"
                                style={{ ...rF, fontWeight: 700, fontSize: "12px", background: "rgba(0,255,136,0.15)", color: "#00ff88", border: "1px solid rgba(0,255,136,0.3)" }}>
                                {isAdding ? <Icon name="Loader2" size={13} className="animate-spin" /> : <><Icon name="UserPlus" size={13} /> &nbsp;Добавить</>}
                              </button>
                            )}
                          </div>
                        )}
                        {isMe && <span style={{ ...iF, fontSize: "11px", color: "#4a5568" }}>Это ты</span>}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Вкладка Друзья */}
            {tab === "friends" && !searchQuery && (
              <>
                <div style={{ ...rF, fontWeight: 600, fontSize: "11px", color: "#6b7fa3", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "8px" }}>
                  Все друзья — {friends.length}
                </div>
                {friends.length === 0 && (
                  <div className="text-center py-12" style={{ ...iF, fontSize: "14px", color: "#4a5568" }}>
                    У тебя пока нет друзей. Добавь кого-нибудь!
                  </div>
                )}
                {friends.map(f => (
                  <div key={f.id} className="flex items-center gap-3 px-3 py-2.5 rounded-xl mb-1 group hover:bg-white hover:bg-opacity-5 transition-colors cursor-pointer"
                    onClick={() => openConvo({ id: f.id, username: f.username, avatar_color: f.avatar_color, is_online: f.is_online, user_status: f.user_status })}>
                    <div className="relative">
                      <div className="w-10 h-10 rounded-full flex items-center justify-center"
                        style={{ background: f.avatar_color + "22", color: f.avatar_color, border: `1px solid ${f.avatar_color}33`, ...rF, fontWeight: 700, fontSize: "13px" }}>
                        {f.username.slice(0, 2).toUpperCase()}
                      </div>
                      <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2"
                        style={{ background: f.is_online ? STATUS_COLOR.online : STATUS_COLOR.offline, borderColor: "var(--dark-bg)" }} />
                    </div>
                    <div className="flex-1">
                      <div style={{ ...rF, fontWeight: 700, fontSize: "15px", color: f.avatar_color }}>{f.username}</div>
                      <div style={{ ...iF, fontSize: "12px", color: "#6b7fa3" }}>{f.is_online ? "В сети" : "Не в сети"}</div>
                    </div>
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
                      <button className="w-8 h-8 rounded-xl flex items-center justify-center hover:opacity-80"
                        style={{ background: "rgba(0,255,136,0.1)", color: "#00ff88" }}
                        onClick={e => { e.stopPropagation(); openConvo({ id: f.id, username: f.username, avatar_color: f.avatar_color, is_online: f.is_online, user_status: f.user_status }); }}
                        title="Написать">
                        <Icon name="MessageCircle" size={15} />
                      </button>
                      <button className="w-8 h-8 rounded-xl flex items-center justify-center hover:opacity-80"
                        style={{ background: "rgba(255,100,0,0.1)", color: "#ff6600" }}
                        onClick={e => { e.stopPropagation(); removeFriend(f.id); }}
                        title="Удалить из друзей">
                        <Icon name="UserMinus" size={15} />
                      </button>
                    </div>
                  </div>
                ))}
              </>
            )}

            {/* Вкладка Ожидание */}
            {tab === "pending" && !searchQuery && (
              <>
                {/* Входящие */}
                {incomingPending.length > 0 && (
                  <>
                    <div style={{ ...rF, fontWeight: 600, fontSize: "11px", color: "#6b7fa3", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "8px" }}>
                      Входящие — {incomingPending.length}
                    </div>
                    {incomingPending.map(f => (
                      <div key={f.id} className="flex items-center gap-3 px-3 py-2.5 rounded-xl mb-1 hover:bg-white hover:bg-opacity-5 transition-colors">
                        <div className="w-10 h-10 rounded-full flex items-center justify-center"
                          style={{ background: f.avatar_color + "22", color: f.avatar_color, border: `1px solid ${f.avatar_color}33`, ...rF, fontWeight: 700, fontSize: "13px" }}>
                          {f.username.slice(0, 2).toUpperCase()}
                        </div>
                        <div className="flex-1">
                          <div style={{ ...rF, fontWeight: 700, fontSize: "15px", color: f.avatar_color }}>{f.username}</div>
                          <div style={{ ...iF, fontSize: "12px", color: "#6b7fa3" }}>Входящая заявка</div>
                        </div>
                        <button onClick={() => respondFriend(f.id, true)} className="w-8 h-8 rounded-xl flex items-center justify-center hover:opacity-80" style={{ background: "rgba(0,255,136,0.15)", color: "#00ff88" }} title="Принять">
                          <Icon name="Check" size={15} />
                        </button>
                        <button onClick={() => respondFriend(f.id, false)} className="w-8 h-8 rounded-xl flex items-center justify-center hover:opacity-80" style={{ background: "rgba(255,68,68,0.12)", color: "#ff4444" }} title="Отклонить">
                          <Icon name="X" size={15} />
                        </button>
                      </div>
                    ))}
                  </>
                )}

                {/* Исходящие */}
                {outgoingPending.length > 0 && (
                  <>
                    <div style={{ ...rF, fontWeight: 600, fontSize: "11px", color: "#6b7fa3", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "8px", marginTop: "16px" }}>
                      Исходящие — {outgoingPending.length}
                    </div>
                    {outgoingPending.map(f => (
                      <div key={f.id} className="flex items-center gap-3 px-3 py-2.5 rounded-xl mb-1 hover:bg-white hover:bg-opacity-5 transition-colors">
                        <div className="w-10 h-10 rounded-full flex items-center justify-center"
                          style={{ background: f.avatar_color + "22", color: f.avatar_color, border: `1px solid ${f.avatar_color}33`, ...rF, fontWeight: 700, fontSize: "13px" }}>
                          {f.username.slice(0, 2).toUpperCase()}
                        </div>
                        <div className="flex-1">
                          <div style={{ ...rF, fontWeight: 700, fontSize: "15px", color: f.avatar_color }}>{f.username}</div>
                          <div style={{ ...iF, fontSize: "12px", color: "#6b7fa3" }}>Ожидание ответа...</div>
                        </div>
                        <button onClick={() => removeFriend(f.id)} className="w-8 h-8 rounded-xl flex items-center justify-center hover:opacity-80" style={{ background: "rgba(255,68,68,0.12)", color: "#ff4444" }} title="Отменить">
                          <Icon name="X" size={15} />
                        </button>
                      </div>
                    ))}
                  </>
                )}

                {incomingPending.length === 0 && outgoingPending.length === 0 && (
                  <div className="text-center py-12" style={{ ...iF, fontSize: "14px", color: "#4a5568" }}>
                    Нет ожидающих заявок
                  </div>
                )}
              </>
            )}

            {/* Заблокированные */}
            {tab === "blocked" && !searchQuery && (
              <div className="text-center py-12" style={{ ...iF, fontSize: "14px", color: "#4a5568" }}>
                Нет заблокированных пользователей
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}