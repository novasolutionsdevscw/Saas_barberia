import { useState } from 'react';
import { ImageOff, User } from 'lucide-react';
import { mediaUrl } from '../../utils/mediaUrl';

type MediaImageProps = {
  src?: string | null;
  alt: string;
  className?: string;
  wrapperClassName?: string;
  fallbackIcon?: 'user' | 'off';
};

export function MediaImage({
  src,
  alt,
  className = 'h-full w-full object-cover',
  wrapperClassName = 'h-full w-full',
  fallbackIcon = 'off',
}: MediaImageProps) {
  const [failed, setFailed] = useState(false);
  const resolved = mediaUrl(src);

  if (!resolved || failed) {
    return (
      <div
        className={`flex items-center justify-center bg-gradient-to-br from-[var(--landing-secondary,#1e1b4b)] to-[#0a0c10] text-slate-600 ${wrapperClassName}`}
      >
        {fallbackIcon === 'user' ? (
          <User className="h-12 w-12 text-[var(--landing-primary,#6366f1)]/40 sm:h-16 sm:w-16" />
        ) : (
          <ImageOff className="h-8 w-8" />
        )}
      </div>
    );
  }

  return (
    <img
      src={resolved}
      alt={alt}
      loading="lazy"
      decoding="async"
      className={className}
      onError={() => setFailed(true)}
    />
  );
}
