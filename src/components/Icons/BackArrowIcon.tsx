interface BackArrowIconProps {
  size?: number;
  color?: string;
  strokeWidth?: number;
  className?: string;
}

export function BackArrowIcon({
  size = 24,
  color = 'currentColor',
  strokeWidth = 2,
  className = '',
}: BackArrowIconProps) {
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
      <path d="m12 19-7-7 7-7" />
      <path d="M19 12H5" />
    </svg>
  );
}
