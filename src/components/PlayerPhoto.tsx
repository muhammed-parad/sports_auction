import { useState, useEffect } from 'react';
import { photoMap } from '../photoMap';

interface PlayerPhotoProps {
  name: string;
  className?: string;
  style?: React.CSSProperties;
}

function getPhotoSrc(name: string): string {
  const normalizedName = name.toLowerCase().trim();
  
  // 1. Exact match
  if (photoMap[normalizedName]) {
    return photoMap[normalizedName];
  }

  // 2. Aliases for mismatched names
  const aliases: Record<string, string> = {
    'ameen thangal': 'sayyid ameen',
    'muhammed p': 'muhd p',
    'munawir': 'munavvir',
    'munawwir': 'munavvir',
    'shabeer': 'sabeer',
    'afhah': 'afthah',
    'nasrullah': 'nasru'
  };

  const alias = aliases[normalizedName];
  if (alias && photoMap[alias]) {
    return photoMap[alias];
  }

  // 3. Fallback to UI avatar
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random&size=200`;
}

export default function PlayerPhoto({ name, className, style }: PlayerPhotoProps) {
  const [src, setSrc] = useState(getPhotoSrc(name));
  const [hasError, setHasError] = useState(false);

  // If name changes, reset
  useEffect(() => {
    setSrc(getPhotoSrc(name));
    setHasError(false);
  }, [name]);

  const handleError = () => {
    if (!hasError) {
      setHasError(true);
      setSrc(`https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random&size=200`);
    }
  };

  return (
    <img 
      src={src} 
      alt={name} 
      className={className} 
      style={{ ...style, objectFit: 'cover' }} 
      onError={handleError}
      loading="lazy"
    />
  );
}
