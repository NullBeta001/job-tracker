export default function OfferlyLogo({ size = 32, className = "" }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <rect width="64" height="64" rx="16" fill="#2563EB" />
      <path
        d="M32 16C23.163 16 16 23.163 16 32C16 40.837 23.163 48 32 48C40.837 48 48 40.837 48 32C48 23.163 40.837 16 32 16ZM32 42C26.477 42 22 37.523 22 32C22 26.477 26.477 22 32 22C37.523 22 42 26.477 42 32C42 37.523 37.523 42 32 42Z"
        fill="white"
      />
      <path
        d="M38 28L30.5 35.5L26 31"
        stroke="white"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
