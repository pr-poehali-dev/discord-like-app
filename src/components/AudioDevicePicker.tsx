import Icon from "@/components/ui/icon";
import type { AudioDevice } from "@/hooks/useWebRTC";

interface AudioDevicePickerProps {
  audioDevices: AudioDevice[];
  videoDevices: AudioDevice[];
  outputDevices: AudioDevice[];
  selectedMic: string;
  selectedCamera: string;
  selectedSpeaker: string;
  onSelectMic: (id: string) => void;
  onSelectCamera: (id: string) => void;
  onSelectSpeaker: (id: string) => void;
  withVideo?: boolean;
  onClose: () => void;
}

export default function AudioDevicePicker({
  audioDevices, videoDevices, outputDevices,
  selectedMic, selectedCamera, selectedSpeaker,
  onSelectMic, onSelectCamera, onSelectSpeaker,
  withVideo = false, onClose,
}: AudioDevicePickerProps) {
  const rF = { fontFamily: "Rajdhani, sans-serif" };
  const iF = { fontFamily: "IBM Plex Sans, sans-serif" };

  const Section = ({ icon, label, devices, selected, onSelect }: {
    icon: string; label: string;
    devices: AudioDevice[]; selected: string;
    onSelect: (id: string) => void;
  }) => (
    <div className="mb-4">
      <div className="flex items-center gap-2 mb-2">
        <Icon name={icon as "Mic"} size={13} style={{ color: "#6b7fa3" }} />
        <span style={{ ...rF, fontWeight: 700, fontSize: "11px", color: "#6b7fa3", textTransform: "uppercase", letterSpacing: "1px" }}>{label}</span>
      </div>
      {devices.length === 0 ? (
        <div style={{ ...iF, fontSize: "12px", color: "#4a5568", padding: "8px 12px" }}>Устройства не найдены</div>
      ) : (
        <div className="space-y-1">
          {devices.map(d => (
            <button key={d.deviceId} onClick={() => onSelect(d.deviceId)}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all hover:opacity-90"
              style={{
                background: selected === d.deviceId ? "rgba(0,255,136,0.12)" : "rgba(255,255,255,0.04)",
                border: `1px solid ${selected === d.deviceId ? "rgba(0,255,136,0.3)" : "rgba(255,255,255,0.06)"}`,
              }}>
              <div className="w-5 h-5 rounded-full flex items-center justify-center shrink-0"
                style={{ background: selected === d.deviceId ? "rgba(0,255,136,0.2)" : "rgba(255,255,255,0.06)" }}>
                {selected === d.deviceId && (
                  <div className="w-2 h-2 rounded-full" style={{ background: "#00ff88" }} />
                )}
              </div>
              <span style={{ ...iF, fontSize: "13px", color: selected === d.deviceId ? "#e2e8f0" : "#8899bb", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1 }}>
                {d.label}
              </span>
              {selected === d.deviceId && (
                <Icon name="Check" size={13} style={{ color: "#00ff88", flexShrink: 0 }} />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center" style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }} onClick={onClose}>
      <div className="w-full max-w-sm mx-4 rounded-2xl overflow-hidden" style={{ background: "var(--dark-panel)", border: "1px solid rgba(0,255,136,0.15)", boxShadow: "0 24px 64px rgba(0,0,0,0.6)" }} onClick={e => e.stopPropagation()}>

        {/* Шапка */}
        <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: "rgba(0,255,136,0.12)" }}>
              <Icon name="Settings" size={16} style={{ color: "#00ff88" }} />
            </div>
            <span style={{ ...rF, fontWeight: 800, fontSize: "15px", color: "#e2e8f0" }}>Аудио и видео устройства</span>
          </div>
          <button onClick={onClose} className="w-7 h-7 rounded-lg flex items-center justify-center hover:opacity-70"
            style={{ background: "rgba(255,255,255,0.06)", color: "#6b7fa3" }}>
            <Icon name="X" size={14} />
          </button>
        </div>

        <div className="px-5 py-4 overflow-y-auto" style={{ maxHeight: "70vh" }}>
          <Section
            icon="Mic"
            label="Микрофон (вход)"
            devices={audioDevices}
            selected={selectedMic}
            onSelect={onSelectMic}
          />

          {withVideo && (
            <Section
              icon="Camera"
              label="Камера"
              devices={videoDevices}
              selected={selectedCamera}
              onSelect={onSelectCamera}
            />
          )}

          <Section
            icon="Volume2"
            label="Динамик (выход)"
            devices={outputDevices}
            selected={selectedSpeaker}
            onSelect={onSelectSpeaker}
          />

          {outputDevices.length === 0 && audioDevices.length === 0 && (
            <div className="text-center py-4">
              <Icon name="MicOff" size={32} style={{ color: "#4a5568", margin: "0 auto 8px" }} />
              <p style={{ ...iF, fontSize: "13px", color: "#6b7fa3" }}>Нет доступа к устройствам</p>
              <p style={{ ...iF, fontSize: "11px", color: "#4a5568", marginTop: "4px" }}>Разреши доступ к микрофону в браузере</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
