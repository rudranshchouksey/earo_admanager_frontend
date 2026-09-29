// Ported from admanager_landing/src/icons/common.tsx so AudioCardPlayer looks identical
// on the landing site and in the dashboard.

export const PlayIcon = ({ className = 'w-4 h-4', fill = 'black' }: { className?: string; fill?: string }) => (
  <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <rect width="40" height="40" rx="20" fill={fill} />
    <path
      d="M17 13.5714L27 20L17 26.4286V13.5714Z"
      fill="white"
      stroke="white"
      strokeWidth="1.42857"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export const PauseIcon = ({ className = 'w-4 h-4', fill = 'black' }: { className?: string; fill?: string }) => (
  <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <rect width="40" height="40" rx="20" fill={fill} />
    <path d="M15 13H18V27H15V13Z" fill="white" stroke="white" strokeWidth="1.42857" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M22 13H25V27H22V13Z" fill="white" stroke="white" strokeWidth="1.42857" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);
