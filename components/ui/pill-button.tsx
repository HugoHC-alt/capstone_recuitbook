import type { ButtonHTMLAttributes } from 'react';

type PillButtonProps = ButtonHTMLAttributes<HTMLButtonElement>;

export function PillButton({ type = 'button', className, ...props }: PillButtonProps) {
  const classes = [
    'inline-flex items-center justify-center rounded-full bg-action-fill px-24 py-12',
    'text-body font-medium text-action-fg transition-colors duration-150 hover:opacity-90',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return <button type={type} className={classes} {...props} />;
}
