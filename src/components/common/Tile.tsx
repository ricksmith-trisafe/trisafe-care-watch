import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';
import './Tile.scss';

interface TileAction {
  label: string;
  icon?: LucideIcon;
  onClick?: () => void;
  variant?: 'default' | 'badge';
  badgeColor?: 'green' | 'blue' | 'orange' | 'red';
}

interface TileProps {
  title: string;
  icon: LucideIcon;
  actions?: TileAction[];
  children: ReactNode;
  className?: string;
  noPadding?: boolean;
}

export const Tile = ({ title, icon: Icon, actions, children, className = '', noPadding = false }: TileProps) => {
  return (
    <div className={`tile ${className}`}>
      <div className="tile__header">
        <div className="tile__header-left">
          <Icon size={18} />
          <h3>{title}</h3>
        </div>
        {actions && actions.length > 0 && (
          <div className="tile__actions">
            {actions.map((action, index) => {
              if (action.variant === 'badge') {
                return (
                  <span
                    key={index}
                    className={`tile__badge tile__badge--${action.badgeColor || 'green'}`}
                  >
                    {action.label}
                  </span>
                );
              }

              return (
                <button
                  key={index}
                  className="tile__action-btn"
                  onClick={action.onClick}
                >
                  {action.icon && <action.icon size={14} />}
                  {action.label}
                </button>
              );
            })}
          </div>
        )}
      </div>
      <div className={`tile__content ${noPadding ? 'tile__content--no-padding' : ''}`}>
        {children}
      </div>
    </div>
  );
};

// Empty state component for use inside tiles
interface TileEmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
}

export const TileEmptyState = ({ icon: Icon, title, description }: TileEmptyStateProps) => {
  return (
    <div className="tile__empty-state">
      <Icon size={32} />
      <p>{title}</p>
      <span>{description}</span>
    </div>
  );
};
