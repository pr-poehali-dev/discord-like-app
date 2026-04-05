interface UserAvatarProps {
  username: string;
  color: string;
  avatarImg?: string | null;
  size?: number;
  showStatus?: boolean;
  status?: string;
  className?: string;
  onClick?: () => void;
}

const STATUS_BG: Record<string, string> = {
  online: "#00ff88",
  streaming: "#ff00aa",
  away: "#ff6600",
  dnd: "#ff4444",
  offline: "#374151",
  invisible: "#374151",
};

export default function UserAvatar({
  username,
  color,
  avatarImg,
  size = 32,
  showStatus = false,
  status = "online",
  className = "",
  onClick,
}: UserAvatarProps) {
  const initials = username.slice(0, 2).toUpperCase();
  const fontSize = Math.max(9, Math.floor(size * 0.35));
  const dotSize = Math.max(8, Math.floor(size * 0.3));

  return (
    <div
      className={`relative shrink-0 ${onClick ? "cursor-pointer" : ""} ${className}`}
      onClick={onClick}
      style={{ width: size, height: size }}
    >
      <div
        className="w-full h-full rounded-full overflow-hidden flex items-center justify-center"
        style={{
          background: avatarImg ? "transparent" : color + "22",
          border: `${Math.max(1, Math.floor(size / 16))}px solid ${color}44`,
          boxShadow: onClick ? `0 0 0 0 ${color}` : undefined,
        }}
      >
        {avatarImg ? (
          <img
            src={avatarImg}
            alt={username}
            className="w-full h-full object-cover"
            style={{ borderRadius: "50%" }}
          />
        ) : (
          <span
            style={{
              fontFamily: "Rajdhani, sans-serif",
              fontWeight: 700,
              fontSize: `${fontSize}px`,
              color,
              userSelect: "none",
            }}
          >
            {initials}
          </span>
        )}
      </div>

      {showStatus && (
        <div
          className="absolute rounded-full border-2"
          style={{
            width: dotSize,
            height: dotSize,
            bottom: -1,
            right: -1,
            background: STATUS_BG[status] || "#374151",
            borderColor: "var(--dark-panel)",
            boxShadow: status === "online" ? `0 0 4px ${STATUS_BG[status]}` : undefined,
          }}
        />
      )}
    </div>
  );
}
