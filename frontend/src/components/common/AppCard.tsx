import type { HTMLAttributes } from 'react';
import { layout } from '../../theme';

type AppCardProps = HTMLAttributes<HTMLDivElement>;

export const AppCard = ({ className = '', ...rest }: AppCardProps) => (
  <div className={`${layout.card} p-6 ${className}`} {...rest} />
);
