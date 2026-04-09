import Icon from "@/components/ui/icon";
import { useAudioDevices } from "@/hooks/useAudioDevices";

interface Props {
  onClose: () => void;
  withVideo?: boolean;
}

export default function DeviceSettingsPanel({ onClose, withVideo = false }: Props) {
  const devices = useAudioDevices();
  const rF = { fontFamily: "Rajdhani, sans-serif" };
  const iF = { fontFamily: "IBM Plex Sans, sans-serif" };

  type Section = { icon: string; label: string; devices: typeof devices.audioDevices; selected: string; onSelect: (id: string) => void };

  const sections: Section[] = [
    { icon: "Mic", label: "Микрофон (вход)", devices: devices.audioDevices, selected: devices.selectedMic, onSelect: devices.setSelectedMic },
    { icon: "Volume2", label: "Динамик (выход)", devices: devices.outputDevices, selected: devices.selectedSpeaker, onSelect: devices.setSelectedSpeaker },
    ...(withVideo ? [{ icon: "Camera", label: "Камера", devices: devices.videoDevices, selected: devices.selectedCamera, onSelect: devices.setSelectedCamera } as Section] : []),
  ];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center"
      style={{ background: "rgba(0,0,0,0.65)", backdropFilter: "blur(6px)" }}
      onClick={onClose}>
      <div className="w-full max-w-sm mx-4 rounded-2xl overflow-hidden"
        style={{ background: "var(--dark-panel)", border: "1px solid rgba(0,255,136,0.18)", boxShadow: "0 32px 80px rgba(0,0,0,0.7)" }}
        onClick={e => e.stopPropagation()}>

        {/* Шапка */}
        <div className="flex items-center justify-between px-5 py-4"
          style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{ background: "rgba(0,255,136,0.12)" }}>
              <Icon name="Headphones" size={18} style={{ color: "#00ff88" }} />
            </div>
            <div>
              <div style={{ ...rF, fontWeight: 800, fontSize: "15px", color: "#e2e8f0" }}>Устройства</div>
              <div style={{ ...iF, fontSize: "11px", color: "#6b7fa3" }}>Общие настройки для звонков и каналов</div>
            </div>
          </div>
          <button onClick={onClose}
            className="w-7 h-7 rounded-lg flex items-center justify-center hover:opacity-70 transition-opacity"
            style={{ background: "rgba(255,255,255,0.06)", color: "#6b7fa3" }}>
            <Icon name="X" size={14} />
          </button>
        </div>

        <div className="px-5 py-4 overflow-y-auto" style={{ maxHeight: "72vh" }}>
          {sections.map(sec => (
            <div key={sec.label} className="mb-5">
              <div className="flex items-center gap-2 mb-2.5">
                <Icon name={sec.icon as "Mic"} size={13} style={{ color: "#6b7fa3" }} />
                <span style={{ ...rF, fontWeight: 700, fontSize: "10px", color: "#6b7fa3", textTransform: "uppercase", letterSpacing: "1px" }}>
                  {sec.label}
                </span>
              </div>

              {sec.devices.length === 0 ? (
                <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl"
                  style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
                  <Icon name="AlertCircle" size={13} style={{ color: "#4a5568" }} />
                  <span style={{ ...iF, fontSize: "12px", color: "#4a5568" }}>Устройства не найдены</span>
                </div>
              ) : (
                <div className="space-y-1">
                  {sec.devices.map(d => {
                    const active = sec.selected === d.deviceId;
                    return (
                      <button key={d.deviceId} onClick={() => sec.onSelect(d.deviceId)}
                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all hover:opacity-90"
                        style={{
                          background: active ? "rgba(0,255,136,0.1)" : "rgba(255,255,255,0.03)",
                          border: `1px solid ${active ? "rgba(0,255,136,0.28)" : "rgba(255,255,255,0.06)"}`,
                        }}>
                        <div className="w-5 h-5 rounded-full flex items-center justify-center shrink-0"
                          style={{ background: active ? "rgba(0,255,136,0.2)" : "rgba(255,255,255,0.06)" }}>
                          {active && <div className="w-2.5 h-2.5 rounded-full" style={{ background: "#00ff88" }} />}
                        </div>
                        <span style={{ ...iF, fontSize: "13px", color: active ? "#e2e8f0" : "#8899bb", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1 }}>
                          {d.label}
                        </span>
                        {active && <Icon name="Check" size={13} style={{ color: "#00ff88", flexShrink: 0 }} />}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          ))}

          <div className="pt-1 pb-1">
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl"
              style={{ background: "rgba(0,255,136,0.04)", border: "1px solid rgba(0,255,136,0.1)" }}>
              <Icon name="Info" size={12} style={{ color: "#6b7fa3" }} />
              <span style={{ ...iF, fontSize: "11px", color: "#6b7fa3" }}>
                Настройки сохраняются и применяются ко всем звонкам и каналам
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
