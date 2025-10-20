interface DiscountsIconProps {
  size?: number;
  color?: string;
  strokeWidth?: number;
  className?: string;
}

export function DiscountsIcon({
  size = 24,
  color = 'currentColor',
  strokeWidth = 2,
  className = '',
}: DiscountsIconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <line x1="19" x2="5" y1="5" y2="19" />
      <circle cx="6.5" cy="6.5" r="2.5" />
      <circle cx="17.5" cy="17.5" r="2.5" />
    </svg>
  );
}
