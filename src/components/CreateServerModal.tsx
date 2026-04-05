import { useState, useRef } from "react";
import Icon from "@/components/ui/icon";

interface CreateServerModalProps {
  onClose: () => void;
  onCreate: (server: { name: string; abbr: string; color: string; description: string; category: string; isPrivate: boolean }) => void;
}

const SERVER_TEMPLATES = [
  { id: "gaming", icon: "Gamepad2", label: "Игровой", desc: "Для команды геймеров", color: "#00ff88" },
  { id: "esports", icon: "Trophy", label: "Киберспорт", desc: "Турниры и соревнования", color: "#ff00aa" },
  { id: "clan", icon: "Shield", label: "Клан/Гильдия", desc: "Организованная команда", color: "#00aaff" },
  { id: "study", icon: "BookOpen", label: "Обучение", desc: "Стратегии и советы", color: "#aa00ff" },
  { id: "streaming", icon: "Radio", label: "Стриминг", desc: "Трансляции и контент", color: "#ff6600" },
  { id: "custom", icon: "Sparkles", label: "Своё", desc: "Чистый сервер с нуля", color: "#6b7fa3" },
];

const SERVER_COLORS = ["#00ff88", "#ff00aa", "#00aaff", "#aa00ff", "#ff6600", "#ffcc00", "#ff4444", "#00ffff"];

const CATEGORIES = ["Игры", "Киберспорт", "Стриминг", "Общение", "Обучение", "Клан", "Другое"];

const INITIAL_CHANNELS = {
  gaming: [
    { name: "общий", type: "text" }, { name: "стратегии", type: "text" }, { name: "объявления", type: "text" },
    { name: "Лобби", type: "voice" }, { name: "Арена #1", type: "voice" },
  ],
  esports: [
    { name: "анонсы", type: "text" }, { name: "матчи", type: "text" }, { name: "аналитика", type: "text" },
    { name: "Тренировка", type: "voice" }, { name: "Стрим-рум", type: "voice" },
  ],
  clan: [
    { name: "общий", type: "text" }, { name: "заявки", type: "text" }, { name: "стратегии", type: "text" },
    { name: "Штаб", type: "voice" }, { name: "Рейд", type: "voice" },
  ],
  custom: [
    { name: "общий", type: "text" },
    { name: "Голосовой", type: "voice" },
  ],
};

export default function CreateServerModal({ onClose, onCreate }: CreateServerModalProps) {
  const [step, setStep] = useState(1);
  const [template, setTemplate] = useState("");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [color, setColor] = useState("#00ff88");
  const [category, setCategory] = useState("Игры");
  const [isPrivate, setIsPrivate] = useState(false);
  const [iconImg, setIconImg] = useState<string | null>(null);
  const iconInputRef = useRef<HTMLInputElement>(null);

  const rF = { fontFamily: "Rajdhani, sans-serif" };
  const iF = { fontFamily: "IBM Plex Sans, sans-serif" };

  const abbr = name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase() || "??";
  const preview = SERVER_TEMPLATES.find(t => t.id === template);

  const handleCreate = () => {
    if (!name.trim()) return;
    onCreate({ name: name.trim(), abbr, color, description, category, isPrivate });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center animate-fade-in" style={{ background: "rgba(0,0,0,0.8)" }}>
      <div className="w-full max-w-lg mx-4 rounded-2xl overflow-hidden shadow-2xl" style={{ background: "var(--dark-panel)", border: "1px solid rgba(0,255,136,0.15)" }}>

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4" style={{ background: "#060a11", borderBottom: "1px solid rgba(0,255,136,0.08)" }}>
          <div>
            <div style={{ ...rF, fontWeight: 800, fontSize: "18px", color: "#e2e8f0" }}>Создать сервер</div>
            <div style={{ ...iF, fontSize: "12px", color: "#6b7fa3", marginTop: "2px" }}>
              Шаг {step} из 3 — {step === 1 ? "Шаблон" : step === 2 ? "Основное" : "Оформление"}
            </div>
          </div>
          <div className="flex items-center gap-3">
            {/* Progress dots */}
            <div className="flex gap-1.5">
              {[1, 2, 3].map(s => (
                <div key={s} className="w-2 h-2 rounded-full transition-all" style={{ background: step >= s ? color : "rgba(255,255,255,0.15)", boxShadow: step === s ? `0 0 6px ${color}` : "none" }} />
              ))}
            </div>
            <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center hover:opacity-70 transition-opacity" style={{ background: "rgba(255,255,255,0.05)" }}>
              <Icon name="X" size={15} style={{ color: "#6b7fa3" }} />
            </button>
          </div>
        </div>

        <div className="p-6">

          {/* Step 1 — Template */}
          {step === 1 && (
            <div>
              <div style={{ ...rF, fontWeight: 700, fontSize: "16px", color: "#e2e8f0", marginBottom: "4px" }}>Выберите шаблон</div>
              <p style={{ ...iF, fontSize: "13px", color: "#6b7fa3", marginBottom: "16px" }}>Мы создадим каналы автоматически, или начни с нуля</p>
              <div className="grid grid-cols-2 gap-3">
                {SERVER_TEMPLATES.map(tmpl => (
                  <button key={tmpl.id} onClick={() => { setTemplate(tmpl.id); if (!color || color === "#00ff88") setColor(tmpl.color); }}
                    className="flex items-start gap-3 p-4 rounded-xl transition-all text-left hover:opacity-90"
                    style={{ background: template === tmpl.id ? tmpl.color + "18" : "rgba(255,255,255,0.04)", border: template === tmpl.id ? `2px solid ${tmpl.color}44` : "2px solid rgba(255,255,255,0.06)", boxShadow: template === tmpl.id ? `0 0 16px ${tmpl.color}18` : "none" }}>
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: tmpl.color + "22" }}>
                      <Icon name={tmpl.icon} size={18} style={{ color: tmpl.color }} />
                    </div>
                    <div>
                      <div style={{ ...rF, fontWeight: 700, fontSize: "14px", color: template === tmpl.id ? tmpl.color : "#e2e8f0" }}>{tmpl.label}</div>
                      <div style={{ ...iF, fontSize: "11px", color: "#6b7fa3" }}>{tmpl.desc}</div>
                    </div>
                  </button>
                ))}
              </div>

              {template && (
                <div className="mt-4 p-3 rounded-xl animate-fade-in" style={{ background: "rgba(0,255,136,0.06)", border: "1px solid rgba(0,255,136,0.15)" }}>
                  <div style={{ ...rF, fontWeight: 600, fontSize: "12px", color: "#6b7fa3", marginBottom: "6px" }}>Будут созданы каналы:</div>
                  <div className="flex flex-wrap gap-2">
                    {(INITIAL_CHANNELS[template as keyof typeof INITIAL_CHANNELS] || INITIAL_CHANNELS.custom).map((ch, i) => (
                      <div key={i} className="flex items-center gap-1 px-2 py-1 rounded-lg" style={{ background: "rgba(255,255,255,0.05)", color: "#8899bb" }}>
                        <Icon name={ch.type === "text" ? "Hash" : "Volume2"} size={11} style={{ color: "#6b7fa3" }} />
                        <span style={{ ...rF, fontWeight: 600, fontSize: "11px" }}>{ch.name}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Step 2 — Basic */}
          {step === 2 && (
            <div className="space-y-4">
              <div style={{ ...rF, fontWeight: 700, fontSize: "16px", color: "#e2e8f0", marginBottom: "4px" }}>Основная информация</div>

              {/* Name */}
              <div>
                <label style={{ ...rF, fontWeight: 600, fontSize: "11px", color: "#6b7fa3", textTransform: "uppercase", letterSpacing: "1px", display: "block", marginBottom: "6px" }}>Название сервера *</label>
                <input className="w-full px-3 py-2.5 rounded-xl outline-none"
                  style={{ background: "rgba(255,255,255,0.05)", border: `1px solid ${name ? color + "44" : "rgba(0,255,136,0.2)"}`, color: "#e2e8f0", ...iF, fontSize: "14px" }}
                  placeholder="Мой крутой сервер" value={name} onChange={e => setName(e.target.value)} maxLength={50} />
                <div style={{ ...iF, fontSize: "11px", color: "#4a5568", marginTop: "3px" }}>{name.length}/50</div>
              </div>

              {/* Description */}
              <div>
                <label style={{ ...rF, fontWeight: 600, fontSize: "11px", color: "#6b7fa3", textTransform: "uppercase", letterSpacing: "1px", display: "block", marginBottom: "6px" }}>Описание</label>
                <textarea className="w-full px-3 py-2.5 rounded-xl outline-none resize-none" rows={2}
                  style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", color: "#e2e8f0", ...iF, fontSize: "13px" }}
                  placeholder="О чём этот сервер?" value={description} onChange={e => setDescription(e.target.value)} maxLength={120} />
              </div>

              {/* Category */}
              <div>
                <label style={{ ...rF, fontWeight: 600, fontSize: "11px", color: "#6b7fa3", textTransform: "uppercase", letterSpacing: "1px", display: "block", marginBottom: "6px" }}>Категория</label>
                <div className="flex flex-wrap gap-2">
                  {CATEGORIES.map(cat => (
                    <button key={cat} onClick={() => setCategory(cat)} className="px-3 py-1.5 rounded-lg transition-all"
                      style={{ background: category === cat ? color + "20" : "rgba(255,255,255,0.05)", color: category === cat ? color : "#6b7fa3", border: category === cat ? `1px solid ${color}44` : "1px solid transparent", ...rF, fontWeight: 700, fontSize: "12px" }}>
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              {/* Privacy */}
              <div className="flex items-center justify-between p-3 rounded-xl" style={{ background: "rgba(255,255,255,0.04)" }}>
                <div>
                  <div style={{ ...rF, fontWeight: 600, fontSize: "14px", color: "#e2e8f0" }}>Приватный сервер</div>
                  <div style={{ ...iF, fontSize: "11px", color: "#6b7fa3" }}>Только по приглашению</div>
                </div>
                <button onClick={() => setIsPrivate(v => !v)} className="w-10 h-5 rounded-full transition-all relative"
                  style={{ background: isPrivate ? color : "rgba(255,255,255,0.1)" }}>
                  <div className="absolute w-3.5 h-3.5 rounded-full top-0.5 transition-all" style={{ background: "#fff", left: isPrivate ? "21px" : "3px" }} />
                </button>
              </div>
            </div>
          )}

          {/* Step 3 — Design */}
          {step === 3 && (
            <div className="space-y-4">
              <div style={{ ...rF, fontWeight: 700, fontSize: "16px", color: "#e2e8f0", marginBottom: "4px" }}>Оформление</div>

              {/* Preview */}
              <div className="flex items-center gap-4 p-4 rounded-xl" style={{ background: "rgba(255,255,255,0.03)", border: `1px solid ${color}22` }}>
                <div className="w-16 h-16 rounded-2xl flex items-center justify-center overflow-hidden cursor-pointer group relative"
                  style={{ background: iconImg ? "transparent" : color + "22", border: `2px solid ${color}55` }}
                  onClick={() => iconInputRef.current?.click()}>
                  {iconImg
                    ? <img src={iconImg} alt="icon" className="w-full h-full object-cover" />
                    : <span style={{ ...rF, fontWeight: 900, fontSize: "20px", color }}>{abbr}</span>
                  }
                  <div className="absolute inset-0 rounded-2xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity" style={{ background: "rgba(0,0,0,0.6)" }}>
                    <Icon name="Camera" size={16} style={{ color: "#fff" }} />
                  </div>
                  <input ref={iconInputRef} type="file" accept="image/*,.gif" className="hidden" onChange={e => {
                    const f = e.target.files?.[0]; if (!f) return;
                    const r = new FileReader(); r.onload = ev => setIconImg(ev.target?.result as string); r.readAsDataURL(f);
                  }} />
                </div>
                <div>
                  <div style={{ ...rF, fontWeight: 800, fontSize: "20px", color, textShadow: `0 0 12px ${color}66` }}>{name || "Название сервера"}</div>
                  <div style={{ ...iF, fontSize: "12px", color: "#6b7fa3", marginTop: "2px" }}>{category} · {isPrivate ? "Приватный" : "Публичный"}</div>
                  {description && <div style={{ ...iF, fontSize: "12px", color: "#8899bb", marginTop: "2px" }}>{description}</div>}
                </div>
              </div>

              {/* Color picker */}
              <div>
                <label style={{ ...rF, fontWeight: 600, fontSize: "11px", color: "#6b7fa3", textTransform: "uppercase", letterSpacing: "1px", display: "block", marginBottom: "8px" }}>Цвет акцента</label>
                <div className="flex gap-2 flex-wrap">
                  {SERVER_COLORS.map(c => (
                    <button key={c} onClick={() => setColor(c)} className="w-9 h-9 rounded-full transition-all hover:scale-110"
                      style={{ background: c, border: color === c ? "3px solid white" : "3px solid transparent", boxShadow: color === c ? `0 0 12px ${c}` : "none" }} />
                  ))}
                  <div className="relative">
                    <input type="color" value={color} onChange={e => setColor(e.target.value)} className="w-9 h-9 rounded-full cursor-pointer border-0 opacity-0 absolute inset-0" />
                    <div className="w-9 h-9 rounded-full flex items-center justify-center" style={{ background: color + "33", border: `2px dashed ${color}66` }}>
                      <Icon name="Pipette" size={14} style={{ color }} />
                    </div>
                  </div>
                </div>
              </div>

              {/* Upload icon */}
              <div>
                <label style={{ ...rF, fontWeight: 600, fontSize: "11px", color: "#6b7fa3", textTransform: "uppercase", letterSpacing: "1px", display: "block", marginBottom: "8px" }}>Иконка сервера (PNG/GIF)</label>
                <div className="flex items-center gap-3">
                  <button onClick={() => iconInputRef.current?.click()} className="flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all hover:opacity-80"
                    style={{ background: color + "18", color, border: `1px solid ${color}44`, ...rF, fontWeight: 700, fontSize: "13px" }}>
                    <Icon name="Upload" size={14} /> Загрузить иконку
                  </button>
                  {iconImg && (
                    <button onClick={() => setIconImg(null)} className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl hover:opacity-80"
                      style={{ background: "rgba(255,0,0,0.1)", color: "#ff4444", border: "1px solid rgba(255,0,0,0.2)", ...rF, fontWeight: 600, fontSize: "12px" }}>
                      <Icon name="Trash2" size={12} /> Убрать
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Footer buttons */}
        <div className="flex items-center justify-between px-6 py-4" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
          <button onClick={() => step > 1 ? setStep(s => s - 1) : onClose()} className="flex items-center gap-2 px-4 py-2 rounded-xl hover:opacity-70 transition-opacity" style={{ color: "#6b7fa3", ...rF, fontWeight: 700 }}>
            <Icon name="ChevronLeft" size={15} />
            {step === 1 ? "Отмена" : "Назад"}
          </button>
          {step < 3 ? (
            <button onClick={() => setStep(s => s + 1)} disabled={step === 1 && !template || step === 2 && !name.trim()}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl transition-all hover:opacity-90 disabled:opacity-40"
              style={{ background: color + "22", color, border: `1px solid ${color}44`, ...rF, fontWeight: 700, fontSize: "14px" }}>
              Далее <Icon name="ChevronRight" size={15} />
            </button>
          ) : (
            <button onClick={handleCreate} disabled={!name.trim()}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl transition-all hover:opacity-90 disabled:opacity-40"
              style={{ background: `linear-gradient(135deg, ${color}33, ${color}18)`, color, border: `1px solid ${color}55`, ...rF, fontWeight: 700, fontSize: "14px", boxShadow: `0 0 20px ${color}22` }}>
              <Icon name="Check" size={15} /> Создать сервер
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
