type IconProps = { className?: string };

export function ArrowUpRight({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 11.8536 11.8536" fill="none" aria-hidden="true">
      <path d="M11.3536 11.5V0.5H0.353553M11.3536 0.5L0.353553 11.5" stroke="currentColor" strokeWidth="1" />
    </svg>
  );
}

export function ArrowLeft({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 28 28" fill="none" aria-hidden="true">
      <path d="M14 9L9 14L14 19M9 14L19 14" stroke="currentColor" strokeWidth="1" />
    </svg>
  );
}

export function ArrowRight({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 28 28" fill="none" aria-hidden="true">
      <path d="M14 19L19 14L14 9M19 14H9" stroke="currentColor" strokeWidth="1" />
    </svg>
  );
}
