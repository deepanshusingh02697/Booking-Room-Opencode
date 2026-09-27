import type { ReactNode } from 'react';
import { AppCard } from '../components/common/AppCard';
import { typeScale } from '../theme';

type PlaceholderPageProps = {
  title: string;
  phase: string;
  children?: ReactNode;
};

export const PlaceholderPage = ({ title, phase, children }: PlaceholderPageProps) => {
  return (
    <div className="py-8">
      <h1 className={typeScale.pageTitle}>{title}</h1>
      <AppCard className="mt-6">
        <p className="text-sm text-muted">This screen is built in {phase}.</p>
        {children}
      </AppCard>
    </div>
  );
};
