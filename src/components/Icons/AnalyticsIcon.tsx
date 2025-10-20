interface AnalyticsIconProps {
  size?: number;
  color?: string;
  strokeWidth?: number;
  className?: string;
}

export function AnalyticsIcon({
  size = 24,
  color = 'currentColor',
  strokeWidth = 2,
  className = '',
}: AnalyticsIconProps) {
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
      <path d="M3 3v16a2 2 0 0 0 2 2h16" />
      <path d="m19 9-5 5-4-4-3 3" />
    </svg>
  );
}
