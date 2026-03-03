/**
 * Emergency Video Panel
 * Displays video feeds during emergency calls
 */
import type { RefObject } from 'react';
import { useState, useCallback, useEffect } from 'react';
import { X, Maximize2, Minimize2 } from 'lucide-react';
import './EmergencyVideoPanel.scss';

interface EmergencyVideoPanelProps {
  localVideoRef: RefObject<HTMLVideoElement | null>;
  remoteVideoRef: RefObject<HTMLVideoElement | null>;
  isConnected: boolean;
  onClose: () => void;
  isMinimized?: boolean;
  onToggleMinimize?: () => void;
}

interface Position {
  x: number;
  y: number;
}

export const EmergencyVideoPanel = ({
  localVideoRef,
  remoteVideoRef,
  isConnected,
  onClose,
  isMinimized = false,
  onToggleMinimize,
}: EmergencyVideoPanelProps) => {
  const [position, setPosition] = useState<Position | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState<Position>({ x: 0, y: 0 });

  const handleMouseDown = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if ((e.target as HTMLElement).closest('button')) return;

    const panel = e.currentTarget.closest('.emergency-video-panel') as HTMLElement;
    if (!panel) return;

    const rect = panel.getBoundingClientRect();
    setDragOffset({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
    setIsDragging(true);
  }, []);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging) return;

    const newX = e.clientX - dragOffset.x;
    const newY = e.clientY - dragOffset.y;

    const maxX = window.innerWidth - 400;
    const maxY = window.innerHeight - 100;

    setPosition({
      x: Math.max(0, Math.min(newX, maxX)),
      y: Math.max(0, Math.min(newY, maxY)),
    });
  }, [isDragging, dragOffset]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp]);

  if (!isConnected) return null;

  const panelStyle = position
    ? { left: position.x, top: position.y, right: 'auto', bottom: 'auto' }
    : {};

  return (
    <div
      className={`emergency-video-panel ${isMinimized ? 'emergency-video-panel--minimized' : ''} ${isDragging ? 'emergency-video-panel--dragging' : ''}`}
      style={panelStyle}
    >
      <div
        className="emergency-video-panel__header"
        onMouseDown={handleMouseDown}
      >
        <span className="emergency-video-panel__title">Emergency Video Feed</span>
        <div className="emergency-video-panel__controls">
          {onToggleMinimize && (
            <button
              className="emergency-video-panel__control-btn"
              onClick={onToggleMinimize}
              title={isMinimized ? 'Maximize' : 'Minimize'}
            >
              {isMinimized ? <Maximize2 size={16} /> : <Minimize2 size={16} />}
            </button>
          )}
          <button
            className="emergency-video-panel__control-btn emergency-video-panel__control-btn--close"
            onClick={onClose}
            title="Close video"
          >
            <X size={16} />
          </button>
        </div>
      </div>

      {!isMinimized && (
        <div className="emergency-video-panel__content">
          {/* Remote video (main view) */}
          <div className="emergency-video-panel__remote">
            <video
              ref={remoteVideoRef}
              autoPlay
              playsInline
              muted={false}
              className="emergency-video-panel__video"
            />
          </div>

          {/* Local video (PIP) */}
          <div className="emergency-video-panel__local">
            <video
              ref={localVideoRef}
              autoPlay
              playsInline
              muted
              className="emergency-video-panel__video"
            />
          </div>
        </div>
      )}
    </div>
  );
};
