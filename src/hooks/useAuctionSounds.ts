import { useState, useCallback } from 'react';

const SOUNDS = {
  bid: 'https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3', // Short click
  sold: 'https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3', // Gavel
  newPlayer: 'https://assets.mixkit.co/active_storage/sfx/2013/2013-preview.mp3', // Chime
};

export const useAuctionSounds = () => {
  const [isMuted, setIsMuted] = useState(true);
  const [audioStarted, setAudioStarted] = useState(false);

  // Preload sounds
  const [audioObjects] = useState(() => {
    const objs: Record<string, HTMLAudioElement> = {};
    Object.entries(SOUNDS).forEach(([key, url]) => {
      objs[key] = new Audio(url);
    });
    return objs;
  });

  const playSound = useCallback((type: keyof typeof SOUNDS) => {
    if (isMuted || !audioStarted) return;
    
    const audio = audioObjects[type];
    if (audio) {
      audio.currentTime = 0;
      audio.play().catch(err => console.error("Audio playback failed:", err));
    }
  }, [isMuted, audioStarted, audioObjects]);

  const toggleMute = () => {
    setIsMuted(prev => !prev);
    if (!audioStarted) setAudioStarted(true);
  };

  const startAudio = () => {
    setAudioStarted(true);
    setIsMuted(false);
  };

  return {
    isMuted,
    audioStarted,
    toggleMute,
    startAudio,
    playBid: () => playSound('bid'),
    playSold: () => playSound('sold'),
    playNewPlayer: () => playSound('newPlayer'),
  };
};
