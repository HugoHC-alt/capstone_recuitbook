import type { ReactNode } from 'react';

type CardProps = {
  children: ReactNode;
  className?: string;
};

export function Card({ children, className }: CardProps) {
  const classes = ['rounded-2xl border border-fog-gray bg-pure-white p-24', className]
    .filter(Boolean)
    .join(' ');

  return <div className={classes}>{children}</div>;
}
