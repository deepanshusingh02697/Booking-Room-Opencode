import type { ReactNode } from 'react';
import { typeScale } from '../../theme';

type PageHeaderProps = {
  title: string;
  sub?: string;
  action?: ReactNode;
  className?: string;
  topPad?: string;
};

export const PageHeader = ({
  title,
  sub,
  action,
  className = '',
  topPad = 'pt-8',
}: PageHeaderProps) => {
  return (
    <div className={`flex items-start justify-between gap-4 pb-5 ${topPad} ${className}`}>
      <div>
        <h1 className={typeScale.pageTitle}>{title}</h1>
        {sub && <p className={`${typeScale.subCaption} mt-0`}>{sub}</p>}
      </div>
      {action}
    </div>
  );
};
