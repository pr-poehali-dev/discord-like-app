import { useState } from "react";
import Icon from "@/components/ui/icon";

const AUTH_URL = "https://functions.poehali.dev/67bd2f8d-73c8-45bd-886b-8e747657c350";

interface User {
  id: number;
  username: string;
  email: string;
  avatar_color: string;
  status: string;
}

interface AuthPageProps {
  onAuth: (user: User, token: string) => void;
}

export default function Auth({ onAuth }: AuthPageProps) {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    setError("");
    if (mode === "register") {
      if (!username || !email || !password) { setError("Заполните все поля"); return; }
      if (password !== confirmPassword) { setError("Пароли не совпадают"); return; }
    } else {
      if (!email || !password) { setError("Заполните все поля"); return; }
    }

    setLoading(true);
    try {
      const action = mode === "register" ? "register" : "login";
      const bodyData = mode === "register"
        ? { username, email, password }
        : { login: email, password };

      const res = await fetch(`${AUTH_URL}?action=${action}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(bodyData),
      });

      const raw = await res.json();
      const data = typeof raw === "string" ? JSON.parse(raw) : raw;

      if (!res.ok) {
        setError(data.error || "Произошла ошибка");
        return;
      }

      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));
      onAuth(data.user, data.token);
    } catch {
      setError("Ошибка соединения с сервером");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden" style={{ background: "var(--dark-bg)" }}>
      {/* Grid bg */}
      <div className="absolute inset-0" style={{
        backgroundImage: "linear-gradient(rgba(0,255,136,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(0,255,136,0.03) 1px, transparent 1px)",
        backgroundSize: "40px 40px"
      }} />

      {/* Glow orbs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full pointer-events-none" style={{ background: "radial-gradient(circle, rgba(0,255,136,0.05) 0%, transparent 70%)" }} />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full pointer-events-none" style={{ background: "radial-gradient(circle, rgba(255,0,170,0.05) 0%, transparent 70%)" }} />

      <div className="relative w-full max-w-md mx-4 animate-fade-in">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4" style={{ background: "linear-gradient(135deg, #00ff88, #00aaff)", boxShadow: "0 0 30px rgba(0,255,136,0.3)" }}>
            <span style={{ fontFamily: "Orbitron, sans-serif", fontSize: "18px", fontWeight: 900, color: "#060a11" }}>NX</span>
          </div>
          <div style={{ fontFamily: "Orbitron, sans-serif", fontWeight: 900, fontSize: "24px", color: "#e2e8f0", letterSpacing: "2px" }}>NEXUSCHAT</div>
          <div style={{ fontFamily: "IBM Plex Sans, sans-serif", fontSize: "14px", color: "#6b7fa3", marginTop: "4px" }}>Игровая коммуникационная платформа</div>
        </div>

        {/* Card */}
        <div className="rounded-2xl p-8" style={{ background: "var(--dark-panel)", border: "1px solid rgba(0,255,136,0.12)", boxShadow: "0 0 40px rgba(0,0,0,0.5)" }}>
          {/* Tabs */}
          <div className="flex rounded-xl p-1 mb-6" style={{ background: "rgba(255,255,255,0.04)" }}>
            <button
              onClick={() => { setMode("login"); setError(""); }}
              className="flex-1 py-2 rounded-lg transition-all duration-200"
              style={{
                fontFamily: "Rajdhani, sans-serif", fontWeight: 700, fontSize: "14px",
                background: mode === "login" ? "rgba(0,255,136,0.15)" : "transparent",
                color: mode === "login" ? "#00ff88" : "#6b7fa3",
                border: mode === "login" ? "1px solid rgba(0,255,136,0.3)" : "1px solid transparent",
              }}
            >
              Войти
            </button>
            <button
              onClick={() => { setMode("register"); setError(""); }}
              className="flex-1 py-2 rounded-lg transition-all duration-200"
              style={{
                fontFamily: "Rajdhani, sans-serif", fontWeight: 700, fontSize: "14px",
                background: mode === "register" ? "rgba(0,255,136,0.15)" : "transparent",
                color: mode === "register" ? "#00ff88" : "#6b7fa3",
                border: mode === "register" ? "1px solid rgba(0,255,136,0.3)" : "1px solid transparent",
              }}
            >
              Регистрация
            </button>
          </div>

          <div className="space-y-4">
            {mode === "register" && (
              <div>
                <label style={{ fontFamily: "Rajdhani, sans-serif", fontWeight: 600, fontSize: "11px", color: "#6b7fa3", textTransform: "uppercase", letterSpacing: "1px", display: "block", marginBottom: "6px" }}>
                  Имя пользователя
                </label>
                <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(0,255,136,0.15)" }}>
                  <Icon name="User" size={15} style={{ color: "#6b7fa3" }} />
                  <input
                    className="flex-1 bg-transparent outline-none text-sm"
                    style={{ color: "#e2e8f0", fontFamily: "IBM Plex Sans, sans-serif" }}
                    placeholder="CyberWolf"
                    value={username}
                    onChange={e => setUsername(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && submit()}
                  />
                </div>
              </div>
            )}

            <div>
              <label style={{ fontFamily: "Rajdhani, sans-serif", fontWeight: 600, fontSize: "11px", color: "#6b7fa3", textTransform: "uppercase", letterSpacing: "1px", display: "block", marginBottom: "6px" }}>
                Email
              </label>
              <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(0,255,136,0.15)" }}>
                <Icon name="Mail" size={15} style={{ color: "#6b7fa3" }} />
                <input
                  className="flex-1 bg-transparent outline-none text-sm"
                  style={{ color: "#e2e8f0", fontFamily: "IBM Plex Sans, sans-serif" }}
                  placeholder="player@nexus.gg"
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && submit()}
                />
              </div>
            </div>

            <div>
              <label style={{ fontFamily: "Rajdhani, sans-serif", fontWeight: 600, fontSize: "11px", color: "#6b7fa3", textTransform: "uppercase", letterSpacing: "1px", display: "block", marginBottom: "6px" }}>
                Пароль
              </label>
              <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(0,255,136,0.15)" }}>
                <Icon name="Lock" size={15} style={{ color: "#6b7fa3" }} />
                <input
                  className="flex-1 bg-transparent outline-none text-sm"
                  style={{ color: "#e2e8f0", fontFamily: "IBM Plex Sans, sans-serif" }}
                  placeholder="••••••••"
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && submit()}
                />
              </div>
            </div>

            {mode === "register" && (
              <div>
                <label style={{ fontFamily: "Rajdhani, sans-serif", fontWeight: 600, fontSize: "11px", color: "#6b7fa3", textTransform: "uppercase", letterSpacing: "1px", display: "block", marginBottom: "6px" }}>
                  Повторите пароль
                </label>
                <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(0,255,136,0.15)" }}>
                  <Icon name="LockKeyhole" size={15} style={{ color: "#6b7fa3" }} />
                  <input
                    className="flex-1 bg-transparent outline-none text-sm"
                    style={{ color: "#e2e8f0", fontFamily: "IBM Plex Sans, sans-serif" }}
                    placeholder="••••••••"
                    type="password"
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && submit()}
                  />
                </div>
              </div>
            )}

            {error && (
              <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl" style={{ background: "rgba(255,0,0,0.08)", border: "1px solid rgba(255,0,0,0.2)" }}>
                <Icon name="AlertCircle" size={14} style={{ color: "#ff4444" }} />
                <span style={{ fontFamily: "IBM Plex Sans, sans-serif", fontSize: "13px", color: "#ff4444" }}>{error}</span>
              </div>
            )}

            <button
              onClick={submit}
              disabled={loading}
              className="w-full py-3 rounded-xl flex items-center justify-center gap-2 transition-all duration-200 hover:opacity-90 active:scale-[0.98]"
              style={{
                fontFamily: "Rajdhani, sans-serif", fontWeight: 700, fontSize: "15px",
                background: loading ? "rgba(0,255,136,0.08)" : "linear-gradient(135deg, rgba(0,255,136,0.2), rgba(0,170,255,0.15))",
                color: "#00ff88",
                border: "1px solid rgba(0,255,136,0.3)",
                boxShadow: loading ? "none" : "0 0 20px rgba(0,255,136,0.1)",
                letterSpacing: "1px",
              }}
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: "rgba(0,255,136,0.3)", borderTopColor: "#00ff88" }} />
                  Загрузка...
                </>
              ) : (
                <>
                  <Icon name={mode === "login" ? "LogIn" : "UserPlus"} size={16} />
                  {mode === "login" ? "Войти в систему" : "Создать аккаунт"}
                </>
              )}
            </button>
          </div>
        </div>

        <div className="text-center mt-4" style={{ fontFamily: "IBM Plex Sans, sans-serif", fontSize: "12px", color: "#4a5568" }}>
          NexusChat © 2026 · Игровая платформа
        </div>
      </div>
    </div>
  );
}
