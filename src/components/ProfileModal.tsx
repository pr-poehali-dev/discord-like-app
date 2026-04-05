import { useState } from "react";
import Icon from "@/components/ui/icon";

interface Member {
  id: number;
  name: string;
  color: string;
  role: string;
  roleColor: string;
  status: string;
  avatar: string;
  game?: string;
  mutual?: number;
}

interface ProfileModalProps {
  member: Member;
  onClose: () => void;
  onMessage?: () => void;
  onCall?: () => void;
}

const STATUS_COLOR: Record<string, string> = {
  online: "#00ff88", streaming: "#ff00aa", away: "#ff6600", dnd: "#ff4444", offline: "#4a5568",
};
const STATUS_LABEL: Record<string, string> = {
  online: "В сети", streaming: "Стримит", away: "Отошёл", dnd: "Не беспокоить", offline: "Не в сети",
};

const BANNER_COLORS: Record<string, string> = {
  "#00ff88": "linear-gradient(135deg, #003322 0%, #001a0f 100%)",
  "#ff00aa": "linear-gradient(135deg, #330022 0%, #1a0011 100%)",
  "#00aaff": "linear-gradient(135deg, #002233 0%, #001122 100%)",
  "#aa00ff": "linear-gradient(135deg, #220033 0%, #110019 100%)",
  "#ff6600": "linear-gradient(135deg, #331100 0%, #1a0800 100%)",
  "#ffcc00": "linear-gradient(135deg, #332200 0%, #1a1100 100%)",
  "#ff4444": "linear-gradient(135deg, #330000 0%, #1a0000 100%)",
  "#00ffff": "linear-gradient(135deg, #003333 0%, #001a1a 100%)",
};

const MOCK_BADGES = [
  { icon: "⚔️", label: "Рейдер", color: "#00ff88" },
  { icon: "🏆", label: "Чемпион", color: "#ffcc00" },
  { icon: "🔥", label: "Стример", color: "#ff6600" },
  { icon: "🛡️", label: "Модератор", color: "#00aaff" },
];

const MOCK_ACTIVITY = [
  { game: "Cyber Arena", time: "2 ч 34 мин", icon: "🎮" },
  { game: "VALORANT", time: "1 ч 12 мин", icon: "🎯" },
  { game: "Dota 2", time: "47 мин", icon: "🏆" },
];

export default function ProfileModal({ member, onClose, onMessage, onCall }: ProfileModalProps) {
  const [activeTab, setActiveTab] = useState<"profile" | "mutual" | "notes">("profile");
  const [note, setNote] = useState("");
  const [blocked, setBlocked] = useState(false);
  const [reported, setReported] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  const rF = { fontFamily: "Rajdhani, sans-serif" };
  const iF = { fontFamily: "IBM Plex Sans, sans-serif" };
  const bannerBg = BANNER_COLORS[member.color] || BANNER_COLORS["#00ff88"];

  const MUTUAL_SERVERS = [
    { name: "NEXUS", abbr: "NX", color: "#00ff88" },
    { name: "CYBER GUILD", abbr: "CG", color: "#00aaff" },
    { name: "DARK MATTER", abbr: "DM", color: "#ff6600" },
  ].slice(0, member.mutual || 2);

  return (
    <div className="fixed inset-0 z-[55] flex items-center justify-center animate-fade-in"
      style={{ background: "rgba(0,0,0,0.75)" }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>

      <div className="w-80 rounded-2xl overflow-hidden shadow-2xl" style={{ background: "var(--dark-panel)", border: `1px solid ${member.color}28` }}>

        {/* Banner */}
        <div className="relative" style={{ height: "90px", background: bannerBg }}>
          {/* Glow effect */}
          <div className="absolute inset-0" style={{ background: `radial-gradient(ellipse at 50% 100%, ${member.color}18 0%, transparent 70%)` }} />

          {/* Close + menu */}
          <div className="absolute top-2 right-2 flex gap-1.5">
            <div className="relative">
              <button onClick={() => setMenuOpen(v => !v)} className="w-7 h-7 rounded-lg flex items-center justify-center hover:opacity-70 transition-opacity" style={{ background: "rgba(0,0,0,0.5)" }}>
                <Icon name="MoreHorizontal" size={14} style={{ color: "#e2e8f0" }} />
              </button>
              {menuOpen && (
                <div className="absolute right-0 top-9 rounded-xl overflow-hidden z-10 animate-fade-in w-44" style={{ background: "#0d1424", border: "1px solid rgba(255,255,255,0.1)", boxShadow: "0 8px 32px rgba(0,0,0,0.5)" }}>
                  {onMessage && (
                    <button onClick={() => { onMessage(); setMenuOpen(false); }} className="w-full flex items-center gap-2 px-3 py-2.5 hover:bg-white hover:bg-opacity-5 transition-colors text-left">
                      <Icon name="MessageCircle" size={13} style={{ color: "#00aaff" }} />
                      <span style={{ ...rF, fontWeight: 600, fontSize: "13px", color: "#e2e8f0" }}>Написать</span>
                    </button>
                  )}
                  {onCall && (
                    <button onClick={() => { onCall(); setMenuOpen(false); }} className="w-full flex items-center gap-2 px-3 py-2.5 hover:bg-white hover:bg-opacity-5 transition-colors text-left">
                      <Icon name="Phone" size={13} style={{ color: "#00ff88" }} />
                      <span style={{ ...rF, fontWeight: 600, fontSize: "13px", color: "#e2e8f0" }}>Позвонить</span>
                    </button>
                  )}
                  <div className="h-px my-1" style={{ background: "rgba(255,255,255,0.06)" }} />
                  <button onClick={() => { setBlocked(v => !v); setMenuOpen(false); }} className="w-full flex items-center gap-2 px-3 py-2.5 hover:bg-white hover:bg-opacity-5 transition-colors text-left">
                    <Icon name="UserX" size={13} style={{ color: blocked ? "#00ff88" : "#ff6600" }} />
                    <span style={{ ...rF, fontWeight: 600, fontSize: "13px", color: blocked ? "#00ff88" : "#ff6600" }}>{blocked ? "Разблокировать" : "Заблокировать"}</span>
                  </button>
                  <button onClick={() => { setReported(true); setMenuOpen(false); }} className="w-full flex items-center gap-2 px-3 py-2.5 hover:bg-white hover:bg-opacity-5 transition-colors text-left">
                    <Icon name="Flag" size={13} style={{ color: "#ff4444" }} />
                    <span style={{ ...rF, fontWeight: 600, fontSize: "13px", color: "#ff4444" }}>{reported ? "Жалоба отправлена" : "Пожаловаться"}</span>
                  </button>
                </div>
              )}
            </div>
            <button onClick={onClose} className="w-7 h-7 rounded-lg flex items-center justify-center hover:opacity-70 transition-opacity" style={{ background: "rgba(0,0,0,0.5)" }}>
              <Icon name="X" size={14} style={{ color: "#e2e8f0" }} />
            </button>
          </div>
        </div>

        {/* Avatar overlap */}
        <div className="px-4 relative" style={{ marginTop: "-32px" }}>
          <div className="relative inline-block">
            <div className="w-16 h-16 rounded-full flex items-center justify-center" style={{ background: member.color + "22", border: `3px solid var(--dark-panel)`, color: member.color, ...rF, fontWeight: 900, fontSize: "18px", boxShadow: `0 0 20px ${member.color}33` }}>
              {member.avatar}
            </div>
            <div className="absolute bottom-1 right-0.5 w-4 h-4 rounded-full border-2" style={{ background: STATUS_COLOR[member.status], borderColor: "var(--dark-panel)" }} />
          </div>

          {/* Action buttons */}
          <div className="flex gap-2 absolute right-4" style={{ bottom: "4px" }}>
            {onMessage && (
              <button onClick={onMessage} className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition-all hover:opacity-90 active:scale-95"
                style={{ background: "rgba(0,170,255,0.15)", color: "#00aaff", border: "1px solid rgba(0,170,255,0.3)", ...rF, fontWeight: 700, fontSize: "12px" }}>
                <Icon name="MessageCircle" size={13} /> ЛС
              </button>
            )}
            {onCall && (
              <button onClick={onCall} className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition-all hover:opacity-90 active:scale-95"
                style={{ background: "rgba(0,255,136,0.12)", color: "#00ff88", border: "1px solid rgba(0,255,136,0.25)", ...rF, fontWeight: 700, fontSize: "12px" }}>
                <Icon name="Phone" size={13} /> Звонок
              </button>
            )}
          </div>
        </div>

        {/* Name + status */}
        <div className="px-4 pt-2 pb-3">
          <div style={{ ...rF, fontWeight: 900, fontSize: "20px", color: member.color, textShadow: `0 0 12px ${member.color}44` }}>{member.name}</div>
          <div className="flex items-center gap-1.5 mt-0.5">
            <div className="w-2 h-2 rounded-full" style={{ background: STATUS_COLOR[member.status] }} />
            <span style={{ ...iF, fontSize: "12px", color: "#8899bb" }}>{STATUS_LABEL[member.status]}</span>
            {member.game && member.status !== "offline" && (
              <>
                <span style={{ color: "#4a5568" }}>·</span>
                <span style={{ ...iF, fontSize: "12px", color: member.status === "streaming" ? "#ff00aa" : "#6b7fa3" }}>{member.game}</span>
              </>
            )}
          </div>

          {/* Role badge */}
          <div className="flex items-center gap-1.5 mt-2 flex-wrap">
            <div className="flex items-center gap-1 px-2 py-0.5 rounded-full" style={{ background: member.roleColor + "18", border: `1px solid ${member.roleColor}33` }}>
              <div className="w-1.5 h-1.5 rounded-full" style={{ background: member.roleColor }} />
              <span style={{ ...rF, fontWeight: 700, fontSize: "11px", color: member.roleColor }}>{member.role}</span>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex px-4 gap-1 mb-3">
          {[
            { id: "profile" as const, label: "Профиль" },
            { id: "mutual" as const, label: `Общее (${MUTUAL_SERVERS.length})` },
            { id: "notes" as const, label: "Заметка" },
          ].map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)} className="px-3 py-1.5 rounded-lg transition-all"
              style={{ background: activeTab === tab.id ? member.color + "18" : "rgba(255,255,255,0.04)", color: activeTab === tab.id ? member.color : "#6b7fa3", border: activeTab === tab.id ? `1px solid ${member.color}33` : "1px solid transparent", ...rF, fontWeight: 700, fontSize: "12px" }}>
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div className="px-4 pb-4">

          {/* PROFILE tab */}
          {activeTab === "profile" && (
            <div className="space-y-3">
              {/* Badges */}
              <div className="p-3 rounded-xl" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.05)" }}>
                <div style={{ ...rF, fontWeight: 600, fontSize: "10px", color: "#6b7fa3", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "8px" }}>Значки</div>
                <div className="flex gap-2 flex-wrap">
                  {MOCK_BADGES.map((badge, i) => (
                    <div key={i} className="flex items-center gap-1.5 px-2 py-1 rounded-lg group relative cursor-default"
                      style={{ background: badge.color + "15", border: `1px solid ${badge.color}25` }}>
                      <span style={{ fontSize: "14px" }}>{badge.icon}</span>
                      <span style={{ ...rF, fontWeight: 600, fontSize: "11px", color: badge.color }}>{badge.label}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Bio */}
              <div className="p-3 rounded-xl" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.05)" }}>
                <div style={{ ...rF, fontWeight: 600, fontSize: "10px", color: "#6b7fa3", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "6px" }}>О себе</div>
                <div style={{ ...iF, fontSize: "13px", color: "#c8d6e8", lineHeight: 1.5 }}>
                  Рейдер и стратег. Всегда готов к бою ⚔️<br />
                  <span style={{ color: "#6b7fa3" }}>Победа — это привычка</span>
                </div>
              </div>

              {/* Recent activity */}
              <div className="p-3 rounded-xl" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.05)" }}>
                <div style={{ ...rF, fontWeight: 600, fontSize: "10px", color: "#6b7fa3", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "8px" }}>Активность</div>
                <div className="space-y-2">
                  {MOCK_ACTIVITY.map((a, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <span style={{ fontSize: "14px" }}>{a.icon}</span>
                      <div className="flex-1">
                        <div style={{ ...rF, fontWeight: 600, fontSize: "12px", color: "#e2e8f0" }}>{a.game}</div>
                      </div>
                      <div style={{ ...iF, fontSize: "11px", color: "#6b7fa3" }}>{a.time}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Member since */}
              <div className="flex items-center gap-2 px-3 py-2 rounded-xl" style={{ background: "rgba(255,255,255,0.03)" }}>
                <Icon name="Calendar" size={13} style={{ color: "#6b7fa3" }} />
                <span style={{ ...iF, fontSize: "12px", color: "#6b7fa3" }}>Участник с </span>
                <span style={{ ...rF, fontWeight: 700, fontSize: "12px", color: "#8899bb" }}>01 января 2025</span>
              </div>
            </div>
          )}

          {/* MUTUAL tab */}
          {activeTab === "mutual" && (
            <div className="space-y-2">
              <div style={{ ...iF, fontSize: "12px", color: "#6b7fa3", marginBottom: "8px" }}>Общие серверы с {member.name}</div>
              {MUTUAL_SERVERS.map((srv, i) => (
                <div key={i} className="flex items-center gap-3 px-3 py-2.5 rounded-xl" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.05)" }}>
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: srv.color + "22", border: `1px solid ${srv.color}33` }}>
                    <span style={{ ...rF, fontWeight: 900, fontSize: "11px", color: srv.color }}>{srv.abbr}</span>
                  </div>
                  <div>
                    <div style={{ ...rF, fontWeight: 700, fontSize: "13px", color: srv.color }}>{srv.name}</div>
                    <div style={{ ...iF, fontSize: "11px", color: "#6b7fa3" }}>Общий сервер</div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* NOTES tab */}
          {activeTab === "notes" && (
            <div className="space-y-2">
              <div style={{ ...iF, fontSize: "12px", color: "#6b7fa3" }}>Заметки видны только тебе</div>
              <textarea className="w-full px-3 py-2.5 rounded-xl outline-none resize-none text-sm" rows={4}
                placeholder="Добавить заметку о пользователе..."
                value={note} onChange={e => setNote(e.target.value)}
                style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", color: "#e2e8f0", ...iF }} />
              <div style={{ ...iF, fontSize: "11px", color: "#4a5568", textAlign: "right" }}>{note.length}/256</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
