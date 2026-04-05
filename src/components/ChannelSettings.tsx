import { useState } from "react";
import Icon from "@/components/ui/icon";

interface Channel {
  id: number;
  name: string;
  type: "text" | "voice";
  locked?: boolean;
  pinned?: boolean;
  users?: number;
  streaming?: boolean;
  unread?: number;
}

interface ChannelSettingsProps {
  channel: Channel;
  onClose: () => void;
}

const PERM_ROLES = [
  { role: "@everyone", color: "#6b7fa3" },
  { role: "Mod", color: "#ff00aa" },
  { role: "Боец", color: "#00aaff" },
  { role: "Разведчик", color: "#aa00ff" },
  { role: "Рекрут", color: "#6b7fa3" },
];

const TEXT_SECTIONS = [
  { id: "overview", label: "Обзор", icon: "Hash" },
  { id: "permissions", label: "Права доступа", icon: "Shield" },
  { id: "invites", label: "Приглашения", icon: "Link" },
  { id: "webhooks", label: "Вебхуки", icon: "Webhook" },
  { id: "slowmode", label: "Слоу-мод", icon: "Timer" },
  { id: "pins", label: "Закреплённые", icon: "Pin" },
];

const VOICE_SECTIONS = [
  { id: "overview", label: "Обзор", icon: "Volume2" },
  { id: "permissions", label: "Права доступа", icon: "Shield" },
  { id: "quality", label: "Качество", icon: "Zap" },
  { id: "regions", label: "Регион", icon: "Globe" },
  { id: "users", label: "Пользователи", icon: "Users" },
];

const MOCK_PINNED = [
  { id: 1, author: "CyberWolf", text: "Сегодня в 21:00 рейд на 3-ю зону. Нужны все бойцы!", time: "01.04 19:42" },
  { id: 2, author: "NeonShadow", text: "Правила канала: только по теме. Мемы в #медиа", time: "15.03 12:00" },
];

export default function ChannelSettings({ channel, onClose }: ChannelSettingsProps) {
  const isVoice = channel.type === "voice";
  const sections = isVoice ? VOICE_SECTIONS : TEXT_SECTIONS;
  const [section, setSection] = useState("overview");

  const rF = { fontFamily: "Rajdhani, sans-serif" };
  const iF = { fontFamily: "IBM Plex Sans, sans-serif" };

  // Text channel state
  const [channelName, setChannelName] = useState(channel.name);
  const [channelTopic, setChannelTopic] = useState("Основной канал для общения");
  const [slowmode, setSlowmode] = useState(0);
  const [nsfw, setNsfw] = useState(false);
  const [autoArchive, setAutoArchive] = useState(false);
  const [maxPins, setMaxPins] = useState(50);

  // Voice channel state
  const [userLimit, setUserLimit] = useState(0);
  const [bitrate, setBitrate] = useState(64);
  const [region, setRegion] = useState("auto");
  const [videoEnabled, setVideoEnabled] = useState(true);
  const [streamEnabled, setStreamEnabled] = useState(true);
  const [connectPerm, setConnectPerm] = useState(true);
  const [speakPerm, setSpeakPerm] = useState(true);

  // Permissions per role
  const [rolePerms, setRolePerms] = useState(
    PERM_ROLES.map(r => ({ ...r, read: true, send: true, connect: true, speak: r.role !== "Рекрут", manage: r.role === "Mod" }))
  );

  const [savedToast, setSavedToast] = useState(false);
  const showSaved = () => { setSavedToast(true); setTimeout(() => setSavedToast(false), 2000); };

  const accentColor = isVoice ? "#00aaff" : "#00ff88";

  const Toggle = ({ value, onChange }: { value: boolean; onChange: () => void }) => (
    <button onClick={onChange} className="w-10 h-5 rounded-full transition-all relative shrink-0"
      style={{ background: value ? accentColor : "rgba(255,255,255,0.1)" }}>
      <div className="absolute w-3.5 h-3.5 rounded-full top-0.5 transition-all" style={{ background: "#fff", left: value ? "21px" : "3px" }} />
    </button>
  );

  return (
    <div className="fixed inset-0 z-50 flex animate-fade-in" style={{ background: "rgba(0,0,0,0.75)" }}>
      <div className="flex w-full max-w-3xl mx-auto my-8 rounded-2xl overflow-hidden shadow-2xl" style={{ background: "var(--dark-bg)", border: `1px solid ${accentColor}22` }}>

        {/* Sidebar */}
        <div className="w-52 shrink-0 flex flex-col py-4" style={{ background: "#060a11", borderRight: "1px solid rgba(0,255,136,0.06)" }}>
          <div className="px-4 mb-3">
            <div style={{ ...rF, fontWeight: 600, fontSize: "10px", color: "#4a5568", textTransform: "uppercase", letterSpacing: "1px" }}>
              {isVoice ? "Голосовой канал" : "Текстовый канал"}
            </div>
            <div className="flex items-center gap-1.5 mt-1">
              <Icon name={isVoice ? "Volume2" : "Hash"} size={14} style={{ color: accentColor }} />
              <span style={{ ...rF, fontWeight: 700, fontSize: "14px", color: accentColor }}>{channel.name}</span>
            </div>
          </div>
          <div className="flex-1 px-2">
            {sections.map(s => (
              <button key={s.id} onClick={() => setSection(s.id)}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-lg mb-0.5 transition-all text-left"
                style={{ background: section === s.id ? accentColor + "18" : "transparent", color: section === s.id ? accentColor : "#6b7fa3", boxShadow: section === s.id ? `inset 3px 0 0 ${accentColor}` : "none" }}>
                <Icon name={s.icon} size={14} />
                <span style={{ ...rF, fontWeight: 600, fontSize: "13px" }}>{s.label}</span>
              </button>
            ))}
            <div className="h-px mx-2 my-2" style={{ background: "rgba(255,255,255,0.06)" }} />
            <button className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-left hover:opacity-70 transition-opacity" style={{ color: "#ff4444" }}>
              <Icon name="Trash2" size={14} />
              <span style={{ ...rF, fontWeight: 600, fontSize: "13px" }}>Удалить канал</span>
            </button>
          </div>
          <div className="px-2 mt-2">
            <button onClick={onClose} className="w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:opacity-70 transition-opacity" style={{ color: "#6b7fa3" }}>
              <Icon name="X" size={14} />
              <span style={{ ...rF, fontWeight: 600, fontSize: "13px" }}>Закрыть</span>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6" style={{ background: "var(--dark-panel)" }}>
          {savedToast && (
            <div className="fixed bottom-6 right-6 flex items-center gap-2 px-4 py-2.5 rounded-xl z-50 animate-fade-in"
              style={{ background: accentColor + "22", border: `1px solid ${accentColor}44`, color: accentColor, ...rF, fontWeight: 700 }}>
              <Icon name="Check" size={16} /> Сохранено
            </div>
          )}

          {/* OVERVIEW — TEXT */}
          {section === "overview" && !isVoice && (
            <div className="space-y-5">
              <h2 style={{ ...rF, fontWeight: 700, fontSize: "20px", color: "#e2e8f0" }}>Настройки канала</h2>
              <div className="p-5 rounded-2xl space-y-4" style={{ background: "var(--dark-card)", border: "1px solid rgba(0,255,136,0.1)" }}>
                <div>
                  <label style={{ ...rF, fontWeight: 600, fontSize: "11px", color: "#6b7fa3", textTransform: "uppercase", letterSpacing: "1px", display: "block", marginBottom: "6px" }}>Название канала</label>
                  <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl" style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(0,255,136,0.2)" }}>
                    <Icon name="Hash" size={14} style={{ color: "#6b7fa3" }} />
                    <input className="flex-1 bg-transparent outline-none text-sm" value={channelName} onChange={e => setChannelName(e.target.value)}
                      style={{ color: "#e2e8f0", ...iF }} />
                  </div>
                </div>
                <div>
                  <label style={{ ...rF, fontWeight: 600, fontSize: "11px", color: "#6b7fa3", textTransform: "uppercase", letterSpacing: "1px", display: "block", marginBottom: "6px" }}>Тема канала</label>
                  <textarea className="w-full px-3 py-2.5 rounded-xl outline-none resize-none text-sm" rows={2} value={channelTopic} onChange={e => setChannelTopic(e.target.value)}
                    style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", color: "#e2e8f0", ...iF }} />
                  <div style={{ ...iF, fontSize: "11px", color: "#4a5568", marginTop: "4px" }}>{channelTopic.length}/1024</div>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <div style={{ ...rF, fontWeight: 600, fontSize: "14px", color: "#e2e8f0" }}>NSFW канал</div>
                    <div style={{ ...iF, fontSize: "11px", color: "#6b7fa3" }}>Требует подтверждения возраста</div>
                  </div>
                  <Toggle value={nsfw} onChange={() => setNsfw(v => !v)} />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <div style={{ ...rF, fontWeight: 600, fontSize: "14px", color: "#e2e8f0" }}>Автоархивирование</div>
                    <div style={{ ...iF, fontSize: "11px", color: "#6b7fa3" }}>Неактивные треды через 24ч</div>
                  </div>
                  <Toggle value={autoArchive} onChange={() => setAutoArchive(v => !v)} />
                </div>
              </div>

              {/* Slowmode */}
              <div className="p-5 rounded-2xl" style={{ background: "var(--dark-card)", border: "1px solid rgba(255,255,255,0.06)" }}>
                <div style={{ ...rF, fontWeight: 600, fontSize: "13px", color: "#6b7fa3", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "10px" }}>Слоу-мод</div>
                <div style={{ ...rF, fontWeight: 600, fontSize: "14px", color: "#e2e8f0", marginBottom: "8px" }}>
                  {slowmode === 0 ? "Выключен" : `${slowmode} сек между сообщениями`}
                </div>
                <div className="flex gap-2 flex-wrap">
                  {[0, 5, 10, 15, 30, 60, 120, 300].map(s => (
                    <button key={s} onClick={() => setSlowmode(s)} className="px-3 py-1.5 rounded-lg transition-all"
                      style={{ background: slowmode === s ? "rgba(0,255,136,0.15)" : "rgba(255,255,255,0.05)", color: slowmode === s ? "#00ff88" : "#6b7fa3", border: slowmode === s ? "1px solid rgba(0,255,136,0.3)" : "1px solid transparent", ...rF, fontWeight: 700, fontSize: "12px" }}>
                      {s === 0 ? "Выкл" : s < 60 ? `${s}с` : `${s / 60}м`}
                    </button>
                  ))}
                </div>
              </div>
              <button onClick={showSaved} className="px-6 py-2.5 rounded-xl hover:opacity-90 transition-all"
                style={{ background: "rgba(0,255,136,0.15)", color: "#00ff88", border: "1px solid rgba(0,255,136,0.3)", ...rF, fontWeight: 700, fontSize: "14px" }}>
                Сохранить
              </button>
            </div>
          )}

          {/* OVERVIEW — VOICE */}
          {section === "overview" && isVoice && (
            <div className="space-y-5">
              <h2 style={{ ...rF, fontWeight: 700, fontSize: "20px", color: "#e2e8f0" }}>Настройки голосового канала</h2>
              <div className="p-5 rounded-2xl space-y-4" style={{ background: "var(--dark-card)", border: "1px solid rgba(0,170,255,0.12)" }}>
                <div>
                  <label style={{ ...rF, fontWeight: 600, fontSize: "11px", color: "#6b7fa3", textTransform: "uppercase", letterSpacing: "1px", display: "block", marginBottom: "6px" }}>Название канала</label>
                  <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl" style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(0,170,255,0.2)" }}>
                    <Icon name="Volume2" size={14} style={{ color: "#6b7fa3" }} />
                    <input className="flex-1 bg-transparent outline-none text-sm" value={channelName} onChange={e => setChannelName(e.target.value)}
                      style={{ color: "#e2e8f0", ...iF }} />
                  </div>
                </div>
                <div>
                  <div style={{ ...rF, fontWeight: 600, fontSize: "14px", color: "#e2e8f0", marginBottom: "8px" }}>
                    Лимит пользователей: {userLimit === 0 ? "∞ без ограничений" : userLimit}
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    {[0, 2, 5, 10, 15, 20, 25, 99].map(n => (
                      <button key={n} onClick={() => setUserLimit(n)} className="px-3 py-1.5 rounded-lg transition-all"
                        style={{ background: userLimit === n ? "rgba(0,170,255,0.15)" : "rgba(255,255,255,0.05)", color: userLimit === n ? "#00aaff" : "#6b7fa3", border: userLimit === n ? "1px solid rgba(0,170,255,0.3)" : "1px solid transparent", ...rF, fontWeight: 700, fontSize: "12px" }}>
                        {n === 0 ? "∞" : n}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <div style={{ ...rF, fontWeight: 600, fontSize: "14px", color: "#e2e8f0" }}>Разрешить видео</div>
                    <div style={{ ...iF, fontSize: "11px", color: "#6b7fa3" }}>Камера в этом канале</div>
                  </div>
                  <Toggle value={videoEnabled} onChange={() => setVideoEnabled(v => !v)} />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <div style={{ ...rF, fontWeight: 600, fontSize: "14px", color: "#e2e8f0" }}>Разрешить стриминг</div>
                    <div style={{ ...iF, fontSize: "11px", color: "#6b7fa3" }}>Трансляция экрана в канале</div>
                  </div>
                  <Toggle value={streamEnabled} onChange={() => setStreamEnabled(v => !v)} />
                </div>
              </div>
              <button onClick={showSaved} className="px-6 py-2.5 rounded-xl hover:opacity-90 transition-all"
                style={{ background: "rgba(0,170,255,0.15)", color: "#00aaff", border: "1px solid rgba(0,170,255,0.3)", ...rF, fontWeight: 700, fontSize: "14px" }}>
                Сохранить
              </button>
            </div>
          )}

          {/* PERMISSIONS */}
          {section === "permissions" && (
            <div className="space-y-4">
              <h2 style={{ ...rF, fontWeight: 700, fontSize: "20px", color: "#e2e8f0" }}>Права доступа</h2>
              <p style={{ ...iF, fontSize: "13px", color: "#6b7fa3" }}>Настройте права для каждой роли в этом канале</p>
              <div className="space-y-3">
                {rolePerms.map((rp, idx) => (
                  <div key={rp.role} className="p-4 rounded-xl" style={{ background: "var(--dark-card)", border: `1px solid ${rp.color}18` }}>
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-3 h-3 rounded-full" style={{ background: rp.color }} />
                      <span style={{ ...rF, fontWeight: 700, fontSize: "14px", color: rp.color }}>{rp.role}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      {isVoice ? [
                        { key: "connect", label: "Подключаться" },
                        { key: "speak", label: "Говорить" },
                        { key: "manage", label: "Управлять" },
                      ] : [
                        { key: "read", label: "Читать" },
                        { key: "send", label: "Писать" },
                        { key: "manage", label: "Управлять" },
                      ].map((perm: { key: string; label: string }) => (
                        <div key={perm.key} className="flex items-center justify-between px-3 py-2 rounded-lg" style={{ background: "rgba(255,255,255,0.03)" }}>
                          <span style={{ ...rF, fontWeight: 600, fontSize: "12px", color: (rp as Record<string, unknown>)[perm.key] ? "#e2e8f0" : "#6b7fa3" }}>{perm.label}</span>
                          <button onClick={() => setRolePerms(prev => prev.map((r, i) => i === idx ? { ...r, [perm.key]: !(r as Record<string, unknown>)[perm.key] } : r))}
                            className="w-8 h-4 rounded-full transition-all relative"
                            style={{ background: (rp as Record<string, unknown>)[perm.key] ? rp.color : "rgba(255,255,255,0.1)" }}>
                            <div className="absolute w-2.5 h-2.5 rounded-full top-[3px] transition-all" style={{ background: "#fff", left: (rp as Record<string, unknown>)[perm.key] ? "14px" : "3px" }} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* QUALITY — Voice only */}
          {section === "quality" && isVoice && (
            <div className="space-y-5">
              <h2 style={{ ...rF, fontWeight: 700, fontSize: "20px", color: "#e2e8f0" }}>Качество звука</h2>
              <div className="p-5 rounded-2xl space-y-5" style={{ background: "var(--dark-card)", border: "1px solid rgba(0,170,255,0.1)" }}>
                <div>
                  <div style={{ ...rF, fontWeight: 600, fontSize: "14px", color: "#e2e8f0", marginBottom: "8px" }}>Битрейт голоса: {bitrate} kbps</div>
                  <div className="flex gap-2 flex-wrap">
                    {[8, 16, 32, 64, 96, 128, 256, 384].map(b => (
                      <button key={b} onClick={() => setBitrate(b)} className="px-3 py-1.5 rounded-lg transition-all"
                        style={{ background: bitrate === b ? "rgba(0,170,255,0.15)" : "rgba(255,255,255,0.05)", color: bitrate === b ? "#00aaff" : "#6b7fa3", border: bitrate === b ? "1px solid rgba(0,170,255,0.3)" : "1px solid transparent", ...rF, fontWeight: 700, fontSize: "12px" }}>
                        {b}k{b >= 256 ? " 🎵" : ""}
                      </button>
                    ))}
                  </div>
                  <div style={{ ...iF, fontSize: "11px", color: "#4a5568", marginTop: "4px" }}>
                    {bitrate <= 32 ? "Базовое качество, экономия трафика" : bitrate <= 96 ? "Стандартное качество для голоса" : bitrate <= 256 ? "Высокое качество, рекомендуется" : "Студийное качество (требует стабильный интернет)"}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* REGIONS — Voice only */}
          {section === "regions" && isVoice && (
            <div className="space-y-5">
              <h2 style={{ ...rF, fontWeight: 700, fontSize: "20px", color: "#e2e8f0" }}>Регион сервера</h2>
              <div className="p-5 rounded-2xl" style={{ background: "var(--dark-card)", border: "1px solid rgba(255,255,255,0.06)" }}>
                {[
                  { v: "auto", label: "Автоматически", desc: "Ближайший сервер" },
                  { v: "eu-central", label: "EU Central", desc: "Центральная Европа" },
                  { v: "eu-west", label: "EU West", desc: "Западная Европа" },
                  { v: "us-east", label: "US East", desc: "Восточное побережье США" },
                  { v: "us-west", label: "US West", desc: "Западное побережье США" },
                  { v: "asia", label: "Asia Pacific", desc: "Азиатско-Тихоокеанский регион" },
                  { v: "russia", label: "Russia", desc: "Российский регион" },
                ].map(opt => (
                  <button key={opt.v} onClick={() => setRegion(opt.v)} className="w-full flex items-center gap-3 px-3 py-3 rounded-xl mb-1 transition-all text-left"
                    style={{ background: region === opt.v ? "rgba(0,170,255,0.1)" : "rgba(255,255,255,0.03)", border: region === opt.v ? "1px solid rgba(0,170,255,0.3)" : "1px solid transparent" }}>
                    <Icon name="Globe" size={15} style={{ color: region === opt.v ? "#00aaff" : "#6b7fa3" }} />
                    <div className="flex-1">
                      <div style={{ ...rF, fontWeight: 700, fontSize: "14px", color: region === opt.v ? "#00aaff" : "#e2e8f0" }}>{opt.label}</div>
                      <div style={{ ...iF, fontSize: "11px", color: "#6b7fa3" }}>{opt.desc}</div>
                    </div>
                    {region === opt.v && <Icon name="Check" size={14} style={{ color: "#00aaff" }} />}
                  </button>
                ))}
              </div>
              <button onClick={showSaved} className="px-6 py-2.5 rounded-xl hover:opacity-90 transition-all"
                style={{ background: "rgba(0,170,255,0.15)", color: "#00aaff", border: "1px solid rgba(0,170,255,0.3)", ...rF, fontWeight: 700, fontSize: "14px" }}>
                Применить регион
              </button>
            </div>
          )}

          {/* PINS — Text only */}
          {section === "pins" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 style={{ ...rF, fontWeight: 700, fontSize: "20px", color: "#e2e8f0" }}>Закреплённые</h2>
                <span style={{ ...rF, fontWeight: 700, fontSize: "12px", color: "#6b7fa3" }}>{MOCK_PINNED.length}/{maxPins} сообщений</span>
              </div>
              <div className="space-y-2">
                {MOCK_PINNED.map(msg => (
                  <div key={msg.id} className="flex items-start gap-3 p-4 rounded-xl" style={{ background: "var(--dark-card)", border: "1px solid rgba(255,255,255,0.05)" }}>
                    <Icon name="Pin" size={15} style={{ color: "#00ff88", marginTop: "2px" }} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span style={{ ...rF, fontWeight: 700, fontSize: "13px", color: "#00ff88" }}>{msg.author}</span>
                        <span style={{ ...rF, fontSize: "11px", color: "#4a5568" }}>{msg.time}</span>
                      </div>
                      <div style={{ ...iF, fontSize: "13px", color: "#c8d6e8" }}>{msg.text}</div>
                    </div>
                    <button className="shrink-0 w-7 h-7 rounded-lg flex items-center justify-center hover:opacity-70 transition-opacity" style={{ background: "rgba(255,0,0,0.08)" }}>
                      <Icon name="X" size={12} style={{ color: "#ff4444" }} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* SLOWMODE section for text */}
          {section === "slowmode" && (
            <div className="space-y-5">
              <h2 style={{ ...rF, fontWeight: 700, fontSize: "20px", color: "#e2e8f0" }}>Слоу-мод</h2>
              <div className="p-5 rounded-2xl" style={{ background: "var(--dark-card)", border: "1px solid rgba(255,255,255,0.06)" }}>
                <div style={{ ...rF, fontWeight: 700, fontSize: "16px", color: slowmode === 0 ? "#6b7fa3" : "#00ff88", marginBottom: "12px" }}>
                  {slowmode === 0 ? "Слоу-мод выключен" : `Ограничение: ${slowmode >= 60 ? `${slowmode / 60} мин` : `${slowmode} сек`}`}
                </div>
                <div className="grid grid-cols-4 gap-2">
                  {[
                    { v: 0, label: "Выкл" }, { v: 5, label: "5 сек" }, { v: 10, label: "10 сек" }, { v: 15, label: "15 сек" },
                    { v: 30, label: "30 сек" }, { v: 60, label: "1 мин" }, { v: 120, label: "2 мин" }, { v: 300, label: "5 мин" },
                    { v: 600, label: "10 мин" }, { v: 900, label: "15 мин" }, { v: 1800, label: "30 мин" }, { v: 3600, label: "1 час" },
                  ].map(opt => (
                    <button key={opt.v} onClick={() => setSlowmode(opt.v)} className="py-2.5 rounded-xl transition-all"
                      style={{ background: slowmode === opt.v ? "rgba(0,255,136,0.15)" : "rgba(255,255,255,0.04)", color: slowmode === opt.v ? "#00ff88" : "#6b7fa3", border: slowmode === opt.v ? "1px solid rgba(0,255,136,0.3)" : "1px solid transparent", ...rF, fontWeight: 700, fontSize: "13px" }}>
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
              <button onClick={showSaved} className="px-6 py-2.5 rounded-xl hover:opacity-90 transition-all"
                style={{ background: "rgba(0,255,136,0.15)", color: "#00ff88", border: "1px solid rgba(0,255,136,0.3)", ...rF, fontWeight: 700, fontSize: "14px" }}>
                Сохранить
              </button>
            </div>
          )}

          {/* Fallback */}
          {!["overview", "permissions", "quality", "regions", "pins", "slowmode"].includes(section) && (
            <div className="flex flex-col items-center justify-center h-48 gap-3">
              <Icon name="Settings" size={36} style={{ color: "#2a3a5c" }} />
              <div style={{ ...rF, fontWeight: 700, fontSize: "16px", color: "#4a5568" }}>
                {sections.find(s => s.id === section)?.label}
              </div>
              <div style={{ ...iF, fontSize: "13px", color: "#374151" }}>Раздел в разработке</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
