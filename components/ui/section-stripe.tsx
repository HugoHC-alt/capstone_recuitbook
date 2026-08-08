type SectionStripeProps = {
  className?: string;
};

export function SectionStripe({ className }: SectionStripeProps) {
  const classes = ['h-8 w-full rounded-full', className].filter(Boolean).join(' ');

  return (
    <div
      className={classes}
      style={{
        backgroundImage: 'linear-gradient(90deg, var(--color-signal-violet), var(--color-mint-pulse))',
      }}
    />
  );
}
