import type { ReactNode } from 'react';
import { AppCard } from './AppCard';
import { typeScale } from '../../theme';

type PanelCardProps = {
  title: string;
  sub?: string;
  action?: ReactNode;
  children?: ReactNode;
  className?: string;
};

export const PanelCard = ({
  title,
  sub,
  action,
  children,
  className = '',
}: PanelCardProps) => (
  <AppCard className={`flex flex-col ${className}`}>
    <div className="flex items-start justify-between gap-4">
      <div>
        <h2 className={typeScale.panelTitle}>{title}</h2>
        {sub && <p className={`${typeScale.subCaption} mt-2`}>{sub}</p>}
      </div>
      {action}
    </div>
    {children && <div className="mt-2">{children}</div>}
  </AppCard>
);
