import { useEffect, useState } from 'react';

interface UserAvatarProps {
  name: string;
  avatarUrl: string | null;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

const SIZES = {
  sm: 'h-8 w-8 text-xs',
  md: 'h-9 w-9 text-xs',
  lg: 'h-14 w-14 text-base',
  xl: 'h-20 w-20 text-xl',
} as const;

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'NS';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function UserAvatar({ name, avatarUrl, size = 'md' }: UserAvatarProps) {
  const [imgFailed, setImgFailed] = useState(false);

  useEffect(() => {
    setImgFailed(false);
  }, [avatarUrl]);

  const sizeClasses = SIZES[size];

  if (avatarUrl && !imgFailed) {
    return (
      <img
        src={avatarUrl}
        alt={`${name} profile`}
        referrerPolicy="no-referrer"
        onError={() => setImgFailed(true)}
        className={`${sizeClasses} rounded-full object-cover border border-slate-200 bg-slate-100 shrink-0`}
      />
    );
  }

  return (
    <div
      aria-label={`${name} avatar`}
      className={`${sizeClasses} rounded-full bg-gradient-to-br from-blue-600 to-emerald-600 text-white font-semibold flex items-center justify-center shrink-0 select-none`}
    >
      {getInitials(name)}
    </div>
  );
}
