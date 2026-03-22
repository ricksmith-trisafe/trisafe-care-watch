import { useState, useRef, useCallback, useEffect } from 'react';
import { X, FileText, Loader2, RefreshCw } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { apiConfig } from '../../config/api';
import { getAccessToken } from '../../store/slices/authSlice';
import './HealthReportModal.scss';

interface HealthReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  patientEmail: string;
  patientName: string;
}

const DEFAULT_DAYS = 30;

export const HealthReportModal = ({ isOpen, onClose, patientEmail, patientName }: HealthReportModalProps) => {
  const [report, setReport] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [days, setDays] = useState(DEFAULT_DAYS);

  // Drag state
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragOffset = useRef({ x: 0, y: 0 });

  // Resize state
  const [size, setSize] = useState({ width: 720, height: 600 });
  const [isResizing, setIsResizing] = useState(false);
  const resizeStart = useRef({ x: 0, y: 0, width: 0, height: 0 });

  const modalRef = useRef<HTMLDivElement>(null);

  // Centre on open
  useEffect(() => {
    if (isOpen) {
      setPosition({
        x: Math.max(0, (window.innerWidth - size.width) / 2),
        y: Math.max(0, (window.innerHeight - size.height) / 2),
      });
    }
  }, [isOpen]); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchReport = useCallback(async (numDays: number) => {
    setIsLoading(true);
    setError(null);

    const endDate = new Date().toISOString().split('T')[0];
    const start = new Date();
    start.setDate(start.getDate() - numDays);
    const startDate = start.toISOString().split('T')[0];

    try {
      const token = await getAccessToken();
      const res = await fetch(
        `${apiConfig.baseUrl}/withings/health-report?startDate=${startDate}&endDate=${endDate}&userEmail=${encodeURIComponent(patientEmail)}`,
        { headers: { Authorization: `Bearer ${token}` } },
      );

      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.error || `Request failed (${res.status})`);
      }

      const data = await res.json();
      setReport(data.data.report);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate report');
    } finally {
      setIsLoading(false);
    }
  }, [patientEmail]);

  // Auto-fetch on open
  useEffect(() => {
    if (isOpen && !report && !isLoading) {
      fetchReport(days);
    }
  }, [isOpen]); // eslint-disable-line react-hooks/exhaustive-deps

  // Reset on close
  useEffect(() => {
    if (!isOpen) {
      setReport(null);
      setError(null);
      setDays(DEFAULT_DAYS);
    }
  }, [isOpen]);

  // Drag handlers
  const handleDragStart = useCallback((e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('.health-report-modal__controls')) return;
    setIsDragging(true);
    dragOffset.current = { x: e.clientX - position.x, y: e.clientY - position.y };
  }, [position]);

  useEffect(() => {
    if (!isDragging) return;
    const handleMove = (e: MouseEvent) => {
      setPosition({ x: e.clientX - dragOffset.current.x, y: e.clientY - dragOffset.current.y });
    };
    const handleUp = () => setIsDragging(false);
    window.addEventListener('mousemove', handleMove);
    window.addEventListener('mouseup', handleUp);
    return () => { window.removeEventListener('mousemove', handleMove); window.removeEventListener('mouseup', handleUp); };
  }, [isDragging]);

  // Resize handlers
  const handleResizeStart = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsResizing(true);
    resizeStart.current = { x: e.clientX, y: e.clientY, width: size.width, height: size.height };
  }, [size]);

  useEffect(() => {
    if (!isResizing) return;
    const handleMove = (e: MouseEvent) => {
      setSize({
        width: Math.max(400, resizeStart.current.width + (e.clientX - resizeStart.current.x)),
        height: Math.max(300, resizeStart.current.height + (e.clientY - resizeStart.current.y)),
      });
    };
    const handleUp = () => setIsResizing(false);
    window.addEventListener('mousemove', handleMove);
    window.addEventListener('mouseup', handleUp);
    return () => { window.removeEventListener('mousemove', handleMove); window.removeEventListener('mouseup', handleUp); };
  }, [isResizing]);

  if (!isOpen) return null;

  return (
    <div className="health-report-modal__overlay" onClick={onClose}>
      <div
        ref={modalRef}
        className={`health-report-modal ${isDragging ? 'health-report-modal--dragging' : ''}`}
        style={{ left: position.x, top: position.y, width: size.width, height: size.height }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="health-report-modal__header" onMouseDown={handleDragStart}>
          <div className="health-report-modal__title">
            <FileText size={16} />
            <span>Health Report — {patientName}</span>
          </div>
          <div className="health-report-modal__controls">
            <label className="health-report-modal__days">
              <span>Period:</span>
              <select value={days} onChange={(e) => setDays(Number(e.target.value))}>
                <option value={7}>7 days</option>
                <option value={14}>14 days</option>
                <option value={30}>30 days</option>
                <option value={60}>60 days</option>
                <option value={90}>90 days</option>
              </select>
            </label>
            <button
              className="health-report-modal__refresh"
              onClick={() => fetchReport(days)}
              disabled={isLoading}
              title="Regenerate report"
            >
              <RefreshCw size={14} />
            </button>
            <button className="health-report-modal__close" onClick={onClose}>
              <X size={16} />
            </button>
          </div>
        </div>

        <div className="health-report-modal__body">
          {isLoading && (
            <div className="health-report-modal__loading">
              <Loader2 size={24} className="spin" />
              <p>Generating health report...</p>
            </div>
          )}
          {error && (
            <div className="health-report-modal__error">
              <p>{error}</p>
              <button onClick={() => fetchReport(days)}>Retry</button>
            </div>
          )}
          {report && !isLoading && (
            <div className="health-report-modal__content">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{report}</ReactMarkdown>
            </div>
          )}
        </div>

        <div className="health-report-modal__resize" onMouseDown={handleResizeStart} />
      </div>
    </div>
  );
};
