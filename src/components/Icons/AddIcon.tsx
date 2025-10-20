interface AddIconProps {
  size?: number;
  color?: string;
  strokeWidth?: number;
  className?: string;
}

export function AddIcon({
  size = 24,
  color = 'currentColor',
  strokeWidth = 2,
  className = '',
}: AddIconProps) {
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
      <path d="M5 12h14" />
      <path d="M12 5v14" />
    </svg>
  );
}
