import { useState } from "react";
import Icon from "@/components/ui/icon";

interface ServerSettingsProps {
  server: { id: number; name: string; abbr: string; color: string; members: number };
  onClose: () => void;
}

const SETTING_SECTIONS = [
  { id: "overview", icon: "Server", label: "Обзор" },
  { id: "roles", icon: "Shield", label: "Роли" },
  { id: "channels", icon: "Hash", label: "Каналы" },
  { id: "members", icon: "Users", label: "Участники" },
  { id: "invites", icon: "Link", label: "Приглашения" },
  { id: "bans", icon: "UserX", label: "Баны" },
  { id: "audit", icon: "ClipboardList", label: "Журнал аудита" },
  { id: "integrations", icon: "Plug", label: "Интеграции" },
  { id: "emoji", icon: "Smile", label: "Эмодзи" },
  { id: "security", icon: "ShieldCheck", label: "Безопасность" },
  { id: "moderation", icon: "Gavel", label: "Автомодерация" },
  { id: "community", icon: "Globe", label: "Сообщество" },
  { id: "webhooks", icon: "Webhook", label: "Вебхуки" },
  { id: "discovery", icon: "Compass", label: "Каталог" },
];

const MOCK_MEMBERS = [
  { id: 1, name: "CyberWolf", role: "Admin", color: "#00ff88", status: "online", joined: "01.01.2025", warned: 0, muted: false, banned: false },
  { id: 2, name: "NeonShadow", role: "Mod", color: "#ff00aa", status: "streaming", joined: "15.02.2025", warned: 0, muted: false, banned: false },
  { id: 3, name: "PixelKnight", role: "Боец", color: "#00aaff", status: "online", joined: "03.03.2025", warned: 1, muted: false, banned: false },
  { id: 4, name: "GhostRunner", role: "Разведчик", color: "#aa00ff", status: "online", joined: "20.03.2025", warned: 0, muted: false, banned: false },
  { id: 5, name: "IronCore", role: "Боец", color: "#00aaff", status: "away", joined: "02.04.2025", warned: 2, muted: true, banned: false },
  { id: 6, name: "VoidHunter", role: "Рекрут", color: "#6b7fa3", status: "online", joined: "10.04.2025", warned: 0, muted: false, banned: false },
];

const MOCK_BANS = [
  { id: 1, name: "DarkSpammer", reason: "Спам и флуд", date: "12.03.2025", by: "CyberWolf" },
  { id: 2, name: "ToxicPlayer", reason: "Токсичное поведение", date: "28.03.2025", by: "NeonShadow" },
  { id: 3, name: "HackBot9000", reason: "Бот / автоматизация", date: "01.04.2025", by: "CyberWolf" },
];

const MOCK_AUDIT = [
  { id: 1, user: "CyberWolf", action: "Забанил", target: "DarkSpammer", time: "12.03 14:32", type: "ban" },
  { id: 2, user: "NeonShadow", action: "Удалил сообщение", target: "PixelKnight", time: "14.03 09:11", type: "delete" },
  { id: 3, user: "CyberWolf", action: "Создал канал", target: "#медиа", time: "20.03 18:45", type: "create" },
  { id: 4, user: "NeonShadow", action: "Выдал мут (1ч)", target: "IronCore", time: "02.04 22:17", type: "mute" },
  { id: 5, user: "CyberWolf", action: "Изменил роль", target: "GhostRunner → Разведчик", time: "04.04 11:00", type: "role" },
  { id: 6, user: "CyberWolf", action: "Забанил", target: "HackBot9000", time: "01.04 03:55", type: "ban" },
];

const ROLES_DATA = [
  { id: 1, name: "Admin", color: "#00ff88", members: 1, hoist: true, mentionable: true,
    perms: { admin: true, manageServer: true, manageChannels: true, manageRoles: true, kickMembers: true, banMembers: true, manageMessages: true, sendMessages: true, readMessages: true, connect: true, speak: true, stream: true } },
  { id: 2, name: "Mod", color: "#ff00aa", members: 2, hoist: true, mentionable: true,
    perms: { admin: false, manageServer: false, manageChannels: true, manageRoles: false, kickMembers: true, banMembers: false, manageMessages: true, sendMessages: true, readMessages: true, connect: true, speak: true, stream: true } },
  { id: 3, name: "Боец", color: "#00aaff", members: 48, hoist: false, mentionable: true,
    perms: { admin: false, manageServer: false, manageChannels: false, manageRoles: false, kickMembers: false, banMembers: false, manageMessages: false, sendMessages: true, readMessages: true, connect: true, speak: true, stream: true } },
  { id: 4, name: "Разведчик", color: "#aa00ff", members: 15, hoist: false, mentionable: true,
    perms: { admin: false, manageServer: false, manageChannels: false, manageRoles: false, kickMembers: false, banMembers: false, manageMessages: false, sendMessages: true, readMessages: true, connect: true, speak: true, stream: true } },
  { id: 5, name: "Рекрут", color: "#6b7fa3", members: 234, hoist: false, mentionable: false,
    perms: { admin: false, manageServer: false, manageChannels: false, manageRoles: false, kickMembers: false, banMembers: false, manageMessages: false, sendMessages: true, readMessages: true, connect: true, speak: false, stream: false } },
];

type PermKey = "admin" | "manageServer" | "manageChannels" | "manageRoles" | "kickMembers" | "banMembers" | "manageMessages" | "sendMessages" | "readMessages" | "connect" | "speak" | "stream";

const PERM_LABELS: { key: PermKey; label: string; desc: string; category: string }[] = [
  { key: "admin", label: "Администратор", desc: "Все права, обходит остальные ограничения", category: "Общие" },
  { key: "manageServer", label: "Управление сервером", desc: "Изменять название, иконку и настройки сервера", category: "Общие" },
  { key: "manageChannels", label: "Управление каналами", desc: "Создавать, изменять и удалять каналы", category: "Общие" },
  { key: "manageRoles", label: "Управление ролями", desc: "Создавать роли и изменять права участников", category: "Общие" },
  { key: "kickMembers", label: "Кик участников", desc: "Выгонять участников с сервера", category: "Модерация" },
  { key: "banMembers", label: "Бан участников", desc: "Навсегда блокировать участников", category: "Модерация" },
  { key: "manageMessages", label: "Управление сообщениями", desc: "Удалять и закреплять сообщения других", category: "Модерация" },
  { key: "sendMessages", label: "Отправка сообщений", desc: "Писать в текстовых каналах", category: "Текст" },
  { key: "readMessages", label: "Чтение каналов", desc: "Видеть каналы и сообщения", category: "Текст" },
  { key: "connect", label: "Подключение к голосу", desc: "Заходить в голосовые каналы", category: "Голос" },
  { key: "speak", label: "Говорить", desc: "Передавать аудио в голосовых каналах", category: "Голос" },
  { key: "stream", label: "Стриминг", desc: "Транслировать видео и экран", category: "Голос" },
];

const AUTOMOD_RULES = [
  { id: 1, name: "Анти-спам", desc: "Блокировать повторяющиеся сообщения", enabled: true, action: "Удалять + мут 5 мин" },
  { id: 2, name: "Запрещённые слова", desc: "Список слов под фильтром", enabled: true, action: "Удалять сообщение" },
  { id: 3, name: "Анти-флуд", desc: "Больше 5 сообщений за 3 сек", enabled: false, action: "Тайм-аут 10 мин" },
  { id: 4, name: "Защита от рейда", desc: "Массовые вступления за короткое время", enabled: true, action: "Режим верификации" },
  { id: 5, name: "Фильтр ссылок", desc: "Блокировать ссылки для не-модераторов", enabled: false, action: "Удалять сообщение" },
  { id: 6, name: "Анти-кейпслок", desc: "Сообщения целиком заглавными", enabled: true, action: "Предупреждение" },
];

export default function ServerSettings({ server, onClose }: ServerSettingsProps) {
  const [section, setSection] = useState("overview");
  const [serverName, setServerName] = useState(server.name);
  const [serverRegion, setServerRegion] = useState("EU-Central");
  const [verificationLevel, setVerificationLevel] = useState("medium");
  const [contentFilter, setContentFilter] = useState("all");
  const [members, setMembers] = useState(MOCK_MEMBERS);
  const [selectedRole, setSelectedRole] = useState(ROLES_DATA[0]);
  const [roles, setRoles] = useState(ROLES_DATA);
  const [automod, setAutomod] = useState(AUTOMOD_RULES);
  const [memberSearch, setMemberSearch] = useState("");
  const [confirmBan, setConfirmBan] = useState<number | null>(null);
  const [savedToast, setSavedToast] = useState(false);

  const showSaved = () => { setSavedToast(true); setTimeout(() => setSavedToast(false), 2000); };

  const muteToggle = (id: number) => setMembers(prev => prev.map(m => m.id === id ? { ...m, muted: !m.muted } : m));
  const warnMember = (id: number) => setMembers(prev => prev.map(m => m.id === id ? { ...m, warned: m.warned + 1 } : m));
  const kickMember = (id: number) => setMembers(prev => prev.filter(m => m.id !== id));
  const togglePerm = (roleId: number, key: PermKey) => {
    setRoles(prev => prev.map(r => r.id === roleId ? { ...r, perms: { ...r.perms, [key]: !r.perms[key] } } : r));
    setSelectedRole(prev => prev.id === roleId ? { ...prev, perms: { ...prev.perms, [key]: !prev.perms[key] } } : prev);
  };

  const rF = { fontFamily: "Rajdhani, sans-serif" };
  const iF = { fontFamily: "IBM Plex Sans, sans-serif" };

  return (
    <div className="fixed inset-0 z-50 flex animate-fade-in" style={{ background: "rgba(0,0,0,0.7)" }}>
      <div className="flex w-full max-w-5xl mx-auto my-6 rounded-2xl overflow-hidden" style={{ background: "var(--dark-bg)", border: "1px solid rgba(0,255,136,0.15)" }}>

        {/* Sidebar */}
        <div className="w-56 shrink-0 flex flex-col py-4" style={{ background: "#060a11", borderRight: "1px solid rgba(0,255,136,0.08)" }}>
          <div className="px-4 mb-3">
            <div style={{ ...rF, fontWeight: 700, fontSize: "11px", color: "#6b7fa3", textTransform: "uppercase", letterSpacing: "1px" }}>Настройки сервера</div>
            <div style={{ ...rF, fontWeight: 700, fontSize: "14px", color: server.color, marginTop: "4px", textShadow: `0 0 8px ${server.color}66` }}>{server.name}</div>
          </div>
          <div className="flex-1 overflow-y-auto px-2">
            {SETTING_SECTIONS.map(s => (
              <button key={s.id} onClick={() => setSection(s.id)}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-lg mb-0.5 transition-all text-left"
                style={{ background: section === s.id ? "rgba(0,255,136,0.12)" : "transparent", color: section === s.id ? "#00ff88" : "#6b7fa3", boxShadow: section === s.id ? "inset 3px 0 0 #00ff88" : "none" }}>
                <Icon name={s.icon} size={14} />
                <span style={{ ...rF, fontWeight: 600, fontSize: "13px" }}>{s.label}</span>
              </button>
            ))}
            <div className="h-px mx-2 my-2" style={{ background: "rgba(255,255,255,0.06)" }} />
            <button className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-left hover:opacity-70 transition-opacity" style={{ color: "#ff4444" }}>
              <Icon name="Trash2" size={14} />
              <span style={{ ...rF, fontWeight: 600, fontSize: "13px" }}>Удалить сервер</span>
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

          {/* Toast */}
          {savedToast && (
            <div className="fixed bottom-6 right-6 flex items-center gap-2 px-4 py-2.5 rounded-xl animate-fade-in z-50" style={{ background: "rgba(0,255,136,0.15)", border: "1px solid rgba(0,255,136,0.3)", color: "#00ff88", ...rF, fontWeight: 700 }}>
              <Icon name="Check" size={16} />
              Изменения сохранены
            </div>
          )}

          {/* OVERVIEW */}
          {section === "overview" && (
            <div className="space-y-6">
              <div>
                <h2 style={{ ...rF, fontWeight: 700, fontSize: "20px", color: "#e2e8f0" }}>Обзор сервера</h2>
                <p style={{ ...iF, fontSize: "13px", color: "#6b7fa3", marginTop: "4px" }}>Основные настройки сервера</p>
              </div>

              {/* Server icon + name */}
              <div className="flex items-center gap-5 p-5 rounded-2xl" style={{ background: "var(--dark-card)", border: "1px solid rgba(0,255,136,0.1)" }}>
                <div className="w-20 h-20 rounded-2xl flex items-center justify-center relative cursor-pointer group" style={{ background: `linear-gradient(135deg, ${server.color}33, ${server.color}11)`, border: `2px solid ${server.color}44` }}>
                  <span style={{ ...rF, fontWeight: 900, fontSize: "24px", color: server.color }}>{server.abbr}</span>
                  <div className="absolute inset-0 rounded-2xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity" style={{ background: "rgba(0,0,0,0.6)" }}>
                    <Icon name="Camera" size={20} style={{ color: "#fff" }} />
                  </div>
                </div>
                <div className="flex-1">
                  <label style={{ ...rF, fontWeight: 600, fontSize: "11px", color: "#6b7fa3", textTransform: "uppercase", letterSpacing: "1px", display: "block", marginBottom: "6px" }}>Название сервера</label>
                  <input className="w-full px-3 py-2 rounded-xl outline-none text-sm" style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(0,255,136,0.2)", color: "#e2e8f0", ...iF }}
                    value={serverName} onChange={e => setServerName(e.target.value)} />
                  <div style={{ ...iF, fontSize: "11px", color: "#4a5568", marginTop: "4px" }}>{serverName.length}/100 символов</div>
                </div>
              </div>

              {/* Region + Verification */}
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-xl" style={{ background: "var(--dark-card)", border: "1px solid rgba(255,255,255,0.06)" }}>
                  <label style={{ ...rF, fontWeight: 600, fontSize: "11px", color: "#6b7fa3", textTransform: "uppercase", letterSpacing: "1px", display: "block", marginBottom: "8px" }}>Регион сервера</label>
                  {["EU-Central", "EU-West", "US-East", "US-West", "Asia"].map(r => (
                    <button key={r} onClick={() => setServerRegion(r)} className="w-full flex items-center gap-2 px-3 py-2 rounded-lg mb-1 text-left transition-all"
                      style={{ background: serverRegion === r ? "rgba(0,255,136,0.12)" : "transparent", color: serverRegion === r ? "#00ff88" : "#8899bb", border: serverRegion === r ? "1px solid rgba(0,255,136,0.2)" : "1px solid transparent" }}>
                      <Icon name="Globe" size={12} />
                      <span style={{ ...rF, fontWeight: 600, fontSize: "13px" }}>{r}</span>
                    </button>
                  ))}
                </div>
                <div className="p-4 rounded-xl" style={{ background: "var(--dark-card)", border: "1px solid rgba(255,255,255,0.06)" }}>
                  <label style={{ ...rF, fontWeight: 600, fontSize: "11px", color: "#6b7fa3", textTransform: "uppercase", letterSpacing: "1px", display: "block", marginBottom: "8px" }}>Уровень верификации</label>
                  {[
                    { v: "none", label: "Отсутствует", desc: "Без ограничений" },
                    { v: "low", label: "Низкий", desc: "Подтверждённый email" },
                    { v: "medium", label: "Средний", desc: "Аккаунт 5+ минут" },
                    { v: "high", label: "Высокий", desc: "Участник 10+ мин" },
                    { v: "very_high", label: "Максимальный", desc: "Телефон верифицирован" },
                  ].map(opt => (
                    <button key={opt.v} onClick={() => setVerificationLevel(opt.v)} className="w-full flex items-center gap-2 px-3 py-2 rounded-lg mb-1 text-left transition-all"
                      style={{ background: verificationLevel === opt.v ? "rgba(0,170,255,0.12)" : "transparent", color: verificationLevel === opt.v ? "#00aaff" : "#8899bb" }}>
                      <Icon name="ShieldCheck" size={12} />
                      <div>
                        <div style={{ ...rF, fontWeight: 600, fontSize: "13px" }}>{opt.label}</div>
                        <div style={{ ...iF, fontSize: "10px", color: "#4a5568" }}>{opt.desc}</div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Content filter */}
              <div className="p-4 rounded-xl" style={{ background: "var(--dark-card)", border: "1px solid rgba(255,255,255,0.06)" }}>
                <label style={{ ...rF, fontWeight: 600, fontSize: "11px", color: "#6b7fa3", textTransform: "uppercase", letterSpacing: "1px", display: "block", marginBottom: "8px" }}>Фильтр медиа-контента</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { v: "off", label: "Отключён", icon: "ShieldOff" },
                    { v: "no_roles", label: "Без ролей", icon: "Shield" },
                    { v: "all", label: "Для всех", icon: "ShieldCheck" },
                  ].map(opt => (
                    <button key={opt.v} onClick={() => setContentFilter(opt.v)} className="flex flex-col items-center gap-2 p-3 rounded-xl transition-all"
                      style={{ background: contentFilter === opt.v ? "rgba(255,0,170,0.12)" : "rgba(255,255,255,0.03)", border: contentFilter === opt.v ? "1px solid rgba(255,0,170,0.3)" : "1px solid transparent", color: contentFilter === opt.v ? "#ff00aa" : "#6b7fa3" }}>
                      <Icon name={opt.icon} size={20} />
                      <span style={{ ...rF, fontWeight: 600, fontSize: "12px" }}>{opt.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <button onClick={showSaved} className="px-6 py-2.5 rounded-xl transition-all hover:opacity-90" style={{ background: "rgba(0,255,136,0.15)", color: "#00ff88", border: "1px solid rgba(0,255,136,0.3)", ...rF, fontWeight: 700, fontSize: "14px" }}>
                Сохранить изменения
              </button>
            </div>
          )}

          {/* ROLES */}
          {section === "roles" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 style={{ ...rF, fontWeight: 700, fontSize: "20px", color: "#e2e8f0" }}>Роли</h2>
                  <p style={{ ...iF, fontSize: "13px", color: "#6b7fa3", marginTop: "4px" }}>Управление правами участников</p>
                </div>
                <button className="flex items-center gap-2 px-4 py-2 rounded-xl" style={{ background: "rgba(0,255,136,0.1)", color: "#00ff88", border: "1px solid rgba(0,255,136,0.25)", ...rF, fontWeight: 700, fontSize: "13px" }}>
                  <Icon name="Plus" size={14} /> Создать роль
                </button>
              </div>

              <div className="flex gap-4">
                {/* Role list */}
                <div className="w-44 space-y-1">
                  {roles.map(role => (
                    <button key={role.id} onClick={() => setSelectedRole(role)} className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-left transition-all"
                      style={{ background: selectedRole.id === role.id ? role.color + "15" : "transparent", border: selectedRole.id === role.id ? `1px solid ${role.color}33` : "1px solid transparent" }}>
                      <div className="w-3 h-3 rounded-full" style={{ background: role.color }} />
                      <span style={{ ...rF, fontWeight: 600, fontSize: "13px", color: selectedRole.id === role.id ? role.color : "#8899bb" }}>{role.name}</span>
                      <span style={{ ...rF, fontSize: "11px", color: "#4a5568", marginLeft: "auto" }}>{role.members}</span>
                    </button>
                  ))}
                </div>

                {/* Role editor */}
                <div className="flex-1 rounded-2xl p-5 space-y-4" style={{ background: "var(--dark-card)", border: `1px solid ${selectedRole.color}22` }}>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: selectedRole.color + "22" }}>
                      <div className="w-4 h-4 rounded-full" style={{ background: selectedRole.color }} />
                    </div>
                    <input className="flex-1 px-3 py-1.5 rounded-lg outline-none" style={{ background: "rgba(255,255,255,0.05)", border: `1px solid ${selectedRole.color}33`, color: selectedRole.color, ...rF, fontWeight: 700, fontSize: "16px" }}
                      defaultValue={selectedRole.name} />
                  </div>

                  {/* Toggles */}
                  <div className="flex gap-3">
                    {[
                      { key: "hoist", label: "Показывать отдельно" },
                      { key: "mentionable", label: "Упоминаемая" },
                    ].map(opt => (
                      <div key={opt.key} className="flex items-center gap-2 px-3 py-2 rounded-lg" style={{ background: "rgba(255,255,255,0.04)" }}>
                        <span style={{ ...rF, fontWeight: 600, fontSize: "12px", color: "#8899bb" }}>{opt.label}</span>
                        <div className="w-9 h-5 rounded-full cursor-pointer transition-all relative" style={{ background: (selectedRole as Record<string, unknown>)[opt.key] ? selectedRole.color : "rgba(255,255,255,0.1)" }}>
                          <div className="absolute w-3.5 h-3.5 rounded-full top-0.5 transition-all" style={{ background: "#fff", left: (selectedRole as Record<string, unknown>)[opt.key] ? "19px" : "3px" }} />
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Permissions */}
                  <div>
                    <div style={{ ...rF, fontWeight: 600, fontSize: "11px", color: "#6b7fa3", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "10px" }}>Права доступа</div>
                    {["Общие", "Модерация", "Текст", "Голос"].map(cat => (
                      <div key={cat} className="mb-3">
                        <div style={{ ...rF, fontWeight: 600, fontSize: "11px", color: "#4a5568", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "6px" }}>{cat}</div>
                        {PERM_LABELS.filter(p => p.category === cat).map(perm => (
                          <div key={perm.key} className="flex items-center justify-between px-3 py-2 rounded-lg mb-1" style={{ background: "rgba(255,255,255,0.03)" }}>
                            <div>
                              <div style={{ ...rF, fontWeight: 600, fontSize: "13px", color: selectedRole.perms[perm.key] ? "#e2e8f0" : "#6b7fa3" }}>{perm.label}</div>
                              <div style={{ ...iF, fontSize: "11px", color: "#4a5568" }}>{perm.desc}</div>
                            </div>
                            <button onClick={() => togglePerm(selectedRole.id, perm.key)}
                              className="w-9 h-5 rounded-full transition-all relative shrink-0"
                              style={{ background: selectedRole.perms[perm.key] ? selectedRole.color : "rgba(255,255,255,0.1)" }}>
                              <div className="absolute w-3.5 h-3.5 rounded-full top-0.5 transition-all" style={{ background: "#fff", left: selectedRole.perms[perm.key] ? "19px" : "3px" }} />
                            </button>
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>
                  <button onClick={showSaved} className="px-5 py-2 rounded-xl" style={{ background: selectedRole.color + "22", color: selectedRole.color, border: `1px solid ${selectedRole.color}44`, ...rF, fontWeight: 700, fontSize: "13px" }}>
                    Сохранить роль
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* MEMBERS */}
          {section === "members" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 style={{ ...rF, fontWeight: 700, fontSize: "20px", color: "#e2e8f0" }}>Участники</h2>
                  <p style={{ ...iF, fontSize: "13px", color: "#6b7fa3", marginTop: "4px" }}>{members.length} участников</p>
                </div>
                <div className="flex items-center gap-2 px-3 py-2 rounded-xl" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }}>
                  <Icon name="Search" size={14} style={{ color: "#6b7fa3" }} />
                  <input className="bg-transparent outline-none text-sm" style={{ ...iF, color: "#e2e8f0" }} placeholder="Поиск..." value={memberSearch} onChange={e => setMemberSearch(e.target.value)} />
                </div>
              </div>

              <div className="space-y-2">
                {members.filter(m => m.name.toLowerCase().includes(memberSearch.toLowerCase())).map(member => (
                  <div key={member.id} className="flex items-center gap-3 p-3 rounded-xl" style={{ background: "var(--dark-card)", border: "1px solid rgba(255,255,255,0.04)" }}>
                    <div className="w-9 h-9 rounded-full flex items-center justify-center shrink-0" style={{ background: member.color + "22", color: member.color, border: `1px solid ${member.color}33`, ...rF, fontWeight: 700, fontSize: "12px" }}>
                      {member.name.slice(0, 2).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span style={{ ...rF, fontWeight: 700, fontSize: "14px", color: member.color }}>{member.name}</span>
                        {member.muted && <span style={{ background: "rgba(255,100,0,0.15)", color: "#ff6600", ...rF, fontWeight: 600, fontSize: "9px", padding: "1px 5px", borderRadius: "3px" }}>МУТ</span>}
                        {member.warned > 0 && <span style={{ background: "rgba(255,200,0,0.15)", color: "#ffcc00", ...rF, fontWeight: 600, fontSize: "9px", padding: "1px 5px", borderRadius: "3px" }}>⚠ {member.warned}</span>}
                      </div>
                      <div style={{ ...rF, fontSize: "11px", color: "#6b7fa3" }}>{member.role} · вступил {member.joined}</div>
                    </div>
                    <div className="flex items-center gap-1">
                      <button onClick={() => muteToggle(member.id)} className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg transition-all hover:opacity-80" style={{ background: member.muted ? "rgba(255,100,0,0.15)" : "rgba(255,255,255,0.05)", color: member.muted ? "#ff6600" : "#6b7fa3" }} title={member.muted ? "Снять мут" : "Замутить"}>
                        <Icon name={member.muted ? "VolumeX" : "Volume2"} size={13} />
                      </button>
                      <button onClick={() => warnMember(member.id)} className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg transition-all hover:opacity-80" style={{ background: "rgba(255,200,0,0.08)", color: "#ffcc00" }} title="Предупредить">
                        <Icon name="AlertTriangle" size={13} />
                      </button>
                      <button className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg transition-all hover:opacity-80" style={{ background: "rgba(255,100,0,0.08)", color: "#ff6600" }} title="Кик">
                        <Icon name="UserMinus" size={13} />
                      </button>
                      <button onClick={() => setConfirmBan(confirmBan === member.id ? null : member.id)} className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg transition-all hover:opacity-80" style={{ background: "rgba(255,0,0,0.08)", color: "#ff4444" }} title="Бан">
                        <Icon name="Ban" size={13} />
                      </button>
                    </div>
                    {confirmBan === member.id && (
                      <div className="flex items-center gap-2 ml-2 px-3 py-1.5 rounded-xl animate-fade-in" style={{ background: "rgba(255,0,0,0.1)", border: "1px solid rgba(255,0,0,0.2)" }}>
                        <span style={{ ...rF, fontWeight: 600, fontSize: "12px", color: "#ff4444" }}>Забанить?</span>
                        <button onClick={() => { kickMember(member.id); setConfirmBan(null); }} className="px-2 py-0.5 rounded-lg" style={{ background: "rgba(255,0,0,0.2)", color: "#ff4444", ...rF, fontWeight: 700, fontSize: "11px" }}>Да</button>
                        <button onClick={() => setConfirmBan(null)} style={{ color: "#6b7fa3", ...rF, fontWeight: 600, fontSize: "11px" }}>Нет</button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* BANS */}
          {section === "bans" && (
            <div className="space-y-4">
              <div>
                <h2 style={{ ...rF, fontWeight: 700, fontSize: "20px", color: "#e2e8f0" }}>Заблокированные</h2>
                <p style={{ ...iF, fontSize: "13px", color: "#6b7fa3", marginTop: "4px" }}>{MOCK_BANS.length} активных банов</p>
              </div>
              <div className="space-y-2">
                {MOCK_BANS.map(ban => (
                  <div key={ban.id} className="flex items-center gap-3 p-4 rounded-xl" style={{ background: "var(--dark-card)", border: "1px solid rgba(255,0,0,0.1)" }}>
                    <div className="w-9 h-9 rounded-full flex items-center justify-center" style={{ background: "rgba(255,0,0,0.1)", color: "#ff4444", ...rF, fontWeight: 700, fontSize: "12px" }}>
                      {ban.name.slice(0, 2).toUpperCase()}
                    </div>
                    <div className="flex-1">
                      <div style={{ ...rF, fontWeight: 700, fontSize: "14px", color: "#ff4444" }}>{ban.name}</div>
                      <div style={{ ...iF, fontSize: "12px", color: "#6b7fa3" }}>Причина: {ban.reason}</div>
                      <div style={{ ...rF, fontSize: "11px", color: "#4a5568" }}>{ban.date} · заблокировал {ban.by}</div>
                    </div>
                    <button className="px-3 py-1.5 rounded-lg transition-all hover:opacity-80" style={{ background: "rgba(0,255,136,0.1)", color: "#00ff88", border: "1px solid rgba(0,255,136,0.2)", ...rF, fontWeight: 700, fontSize: "12px" }}>
                      Разбанить
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* AUDIT LOG */}
          {section === "audit" && (
            <div className="space-y-4">
              <div>
                <h2 style={{ ...rF, fontWeight: 700, fontSize: "20px", color: "#e2e8f0" }}>Журнал аудита</h2>
                <p style={{ ...iF, fontSize: "13px", color: "#6b7fa3", marginTop: "4px" }}>История действий модераторов и администраторов</p>
              </div>
              <div className="space-y-1.5">
                {MOCK_AUDIT.map(entry => {
                  const colors: Record<string, string> = { ban: "#ff4444", delete: "#ff6600", create: "#00ff88", mute: "#ff6600", role: "#00aaff" };
                  const icons: Record<string, string> = { ban: "Ban", delete: "Trash2", create: "Plus", mute: "VolumeX", role: "Shield" };
                  return (
                    <div key={entry.id} className="flex items-center gap-3 px-4 py-3 rounded-xl" style={{ background: "var(--dark-card)", border: `1px solid ${colors[entry.type]}18` }}>
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: colors[entry.type] + "15" }}>
                        <Icon name={icons[entry.type] || "Activity"} size={15} style={{ color: colors[entry.type] }} />
                      </div>
                      <div className="flex-1">
                        <span style={{ ...rF, fontWeight: 700, fontSize: "13px", color: "#00ff88" }}>{entry.user}</span>
                        <span style={{ ...iF, fontSize: "13px", color: "#8899bb" }}> {entry.action} </span>
                        <span style={{ ...rF, fontWeight: 600, fontSize: "13px", color: colors[entry.type] }}>{entry.target}</span>
                      </div>
                      <div style={{ ...rF, fontSize: "11px", color: "#4a5568" }}>{entry.time}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* AUTOMODERATION */}
          {section === "moderation" && (
            <div className="space-y-4">
              <div>
                <h2 style={{ ...rF, fontWeight: 700, fontSize: "20px", color: "#e2e8f0" }}>Автомодерация</h2>
                <p style={{ ...iF, fontSize: "13px", color: "#6b7fa3", marginTop: "4px" }}>Автоматические правила для защиты сервера</p>
              </div>
              <div className="space-y-3">
                {automod.map(rule => (
                  <div key={rule.id} className="p-4 rounded-xl" style={{ background: "var(--dark-card)", border: `1px solid rgba(${rule.enabled ? "0,255,136" : "255,255,255"},0.07)` }}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Icon name="Zap" size={15} style={{ color: rule.enabled ? "#00ff88" : "#6b7fa3" }} />
                        <span style={{ ...rF, fontWeight: 700, fontSize: "15px", color: rule.enabled ? "#e2e8f0" : "#6b7fa3" }}>{rule.name}</span>
                      </div>
                      <button onClick={() => setAutomod(prev => prev.map(r => r.id === rule.id ? { ...r, enabled: !r.enabled } : r))}
                        className="w-10 h-5 rounded-full transition-all relative"
                        style={{ background: rule.enabled ? "#00ff88" : "rgba(255,255,255,0.1)" }}>
                        <div className="absolute w-3.5 h-3.5 rounded-full top-0.5 transition-all" style={{ background: "#fff", left: rule.enabled ? "21px" : "3px" }} />
                      </button>
                    </div>
                    <p style={{ ...iF, fontSize: "12px", color: "#6b7fa3" }}>{rule.desc}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <Icon name="Zap" size={11} style={{ color: "#ff6600" }} />
                      <span style={{ ...rF, fontSize: "11px", color: "#ff6600" }}>Действие: {rule.action}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* INVITES */}
          {section === "invites" && (
            <div className="space-y-4">
              <h2 style={{ ...rF, fontWeight: 700, fontSize: "20px", color: "#e2e8f0" }}>Приглашения</h2>
              <div className="p-5 rounded-2xl" style={{ background: "var(--dark-card)", border: "1px solid rgba(0,255,136,0.12)" }}>
                <div style={{ ...rF, fontWeight: 600, fontSize: "13px", color: "#6b7fa3", marginBottom: "8px" }}>Активная ссылка</div>
                <div className="flex items-center gap-3">
                  <div className="flex-1 px-3 py-2 rounded-xl" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(0,255,136,0.15)", ...iF, fontSize: "13px", color: "#00ff88" }}>
                    nexus.gg/join/ab3k9x
                  </div>
                  <button className="flex items-center gap-2 px-4 py-2 rounded-xl" style={{ background: "rgba(0,255,136,0.12)", color: "#00ff88", border: "1px solid rgba(0,255,136,0.25)", ...rF, fontWeight: 700, fontSize: "13px" }}>
                    <Icon name="Copy" size={14} /> Копировать
                  </button>
                </div>
                <div className="grid grid-cols-3 gap-3 mt-4">
                  {[{ label: "Срок действия", value: "24 часа" }, { label: "Максимум", value: "∞" }, { label: "Использований", value: "247" }].map((s, i) => (
                    <div key={i} className="px-3 py-2 rounded-lg text-center" style={{ background: "rgba(255,255,255,0.03)" }}>
                      <div style={{ ...rF, fontSize: "10px", color: "#4a5568", textTransform: "uppercase" }}>{s.label}</div>
                      <div style={{ ...rF, fontWeight: 700, fontSize: "16px", color: "#e2e8f0" }}>{s.value}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* OTHER SECTIONS — placeholder */}
          {!["overview", "roles", "members", "bans", "audit", "moderation", "invites"].includes(section) && (
            <div className="flex flex-col items-center justify-center h-64 gap-3">
              <Icon name="Settings" size={40} style={{ color: "#2a3a5c" }} />
              <div style={{ ...rF, fontWeight: 700, fontSize: "18px", color: "#4a5568" }}>
                {SETTING_SECTIONS.find(s => s.id === section)?.label}
              </div>
              <div style={{ ...iF, fontSize: "13px", color: "#374151" }}>Раздел в разработке</div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
