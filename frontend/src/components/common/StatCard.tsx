import { AppCard } from './AppCard';
import { typeScale } from '../../theme';

type StatCardProps = {
  value: number;
  label: string;
};

export const StatCard = ({ value, label }: StatCardProps) => (
  <AppCard className="flex min-h-[153px] flex-col">
    <div className="flex h-[39px] w-10 items-center justify-center rounded bg-tintStrong">
      <span className="text-[22px] font-bold leading-none text-navy">{value}</span>
    </div>
    <p className={`${typeScale.statLabel} mt-auto`}>{label}</p>
  </AppCard>
);
