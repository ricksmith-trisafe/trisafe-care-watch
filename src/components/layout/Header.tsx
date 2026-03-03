import { Bell, Settings, Phone, Pause, Clock } from 'lucide-react';
import { useAppSelector } from '../../store/hooks';
import { formatDuration } from '../../utils/formatters';
import type { AgentStatus } from '../../types';
import './Header.scss';

interface HeaderProps {
  activeCallTime: number;
  holdTime: number;
  afterCallTime: number;
  isOnHold: boolean;
  agentStatus: AgentStatus;
  pendingAlerts?: number;
}

export const Header = ({
  activeCallTime,
  holdTime,
  afterCallTime,
  isOnHold,
  agentStatus,
  pendingAlerts = 0,
}: HeaderProps) => {
  const { user } = useAppSelector((state) => state.auth);

  const isOnCall = agentStatus === 'INCOMING' || agentStatus === 'OUTGOING' || agentStatus === 'HOLD';
  const isInAfterCall = agentStatus === 'AFTER_CALL';

  // Total call time includes active + hold time
  const totalCallTime = activeCallTime + holdTime;

  return (
    <header className="header">
      <div className="header__left">
        <div className="header__logo">
          <Phone className="header__logo-icon" />
          <span className="header__logo-text">CareWatch</span>
        </div>

        {(isOnCall || isInAfterCall) && (
          <div className="header__timers">
            <div className={`header__timer header__timer--call ${isInAfterCall ? 'header__timer--completed' : ''}`}>
              <Phone className="header__timer-icon" />
              <span>Call: {formatDuration(totalCallTime)}</span>
            </div>
            {(isOnHold || (isInAfterCall && holdTime > 0)) && (
              <div className={`header__timer header__timer--hold ${isInAfterCall ? 'header__timer--completed' : ''}`}>
                <Pause className="header__timer-icon" />
                <span>Hold: {formatDuration(holdTime)}</span>
              </div>
            )}
            {isInAfterCall && (
              <div className="header__timer header__timer--after-call">
                <Clock className="header__timer-icon" />
                <span>After Call: {formatDuration(afterCallTime)}</span>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="header__right">
        {pendingAlerts > 0 && (
          <button className="header__alerts">
            <Bell />
            <span className="header__alerts-count">{pendingAlerts} Pending Alerts</span>
          </button>
        )}

        <button className="header__settings">
          <Bell />
        </button>

        <button className="header__settings">
          <Settings />
        </button>

        <div className="header__user">
          <div className="header__user-avatar">
            {user?.firstName?.[0]}{user?.lastName?.[0]}
          </div>
          <div className="header__user-info">
            <span className="header__user-name">Agent: {user?.fullName || `${user?.firstName} ${user?.lastName}`}</span>
            <span className="header__user-id">ID: A-{user?.id?.slice(-4)}</span>
          </div>
        </div>
      </div>
    </header>
  );
};
