import React, { useRef, useState, useEffect } from 'react';
import { AUTO_HIDE_DELAY_MS } from '../constants';

interface ControlsProps {
  onInputStateChange: (key: string, pressed: boolean) => void;
  onAction: () => void;
}

export const Controls: React.FC<ControlsProps> = ({ onInputStateChange, onAction }) => {
  const dpadRef = useRef<HTMLDivElement>(null);
  const [activeDir, setActiveDir] = useState<string | null>(null);
  const [isVisible, setIsVisible] = useState<boolean>(true);
  const hideTimeoutRef = useRef<number | null>(null);

  // Reset the hide timer and make controls visible
  const resetHideTimer = () => {
    setIsVisible(true);
    
    if (hideTimeoutRef.current !== null) {
      window.clearTimeout(hideTimeoutRef.current);
    }
    
    hideTimeoutRef.current = window.setTimeout(() => {
      setIsVisible(false);
    }, AUTO_HIDE_DELAY_MS);
  };

  // Clear all inputs to prevent sticking
  const clearInput = () => {
      ['UP', 'DOWN', 'LEFT', 'RIGHT'].forEach(dir => onInputStateChange(dir, false));
      setActiveDir(null);
  };

  const handleMove = (clientX: number, clientY: number) => {
      resetHideTimer(); // Reset timer on movement
      if (!dpadRef.current) return;
      
      const rect = dpadRef.current.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      
      const dx = clientX - centerX;
      const dy = clientY - centerY;
      
      // Calculate distance to ensure we aren't just tapping the very center accidentally
      const distance = Math.sqrt(dx*dx + dy*dy);
      
      // Deadzone at the very center (small)
      if (distance < 5) {
          return; // Keep previous state if hovering dead center, or clear? Better to keep for smoothness until release.
      }

      // Classic 4-Way D-Pad Logic
      const angle = Math.atan2(dy, dx) * (180 / Math.PI);
      let newDir = '';

      // 45 degree segments for 4-way feel
      if (angle > -45 && angle <= 45) newDir = 'RIGHT';
      else if (angle > 45 && angle <= 135) newDir = 'DOWN';
      else if (angle > 135 || angle <= -135) newDir = 'LEFT';
      else newDir = 'UP';

      if (newDir !== activeDir) {
          // Reset all others first to ensure clean state
          ['UP', 'DOWN', 'LEFT', 'RIGHT'].forEach(d => {
              if (d !== newDir) onInputStateChange(d, false);
          });
          
          onInputStateChange(newDir, true);
          setActiveDir(newDir);
      }
  };

  const handleTouchStart = (e: React.TouchEvent) => {
      handleMove(e.touches[0].clientX, e.touches[0].clientY);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
      // e.preventDefault() is handled by CSS touch-action: none mostly, but good here too
      handleMove(e.touches[0].clientX, e.touches[0].clientY);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
      e.preventDefault();
      clearInput();
  };

  // Mouse fallback for testing on desktop
  const handleMouseDown = (e: React.MouseEvent) => {
      handleMove(e.clientX, e.clientY);
      const mouseMove = (ev: MouseEvent) => handleMove(ev.clientX, ev.clientY);
      const mouseUp = () => {
          clearInput();
          window.removeEventListener('mousemove', mouseMove);
          window.removeEventListener('mouseup', mouseUp);
      };
      window.addEventListener('mousemove', mouseMove);
      window.addEventListener('mouseup', mouseUp);
  };

  const handleAction = (e: React.TouchEvent | React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      resetHideTimer(); // Reset timer on action
      onAction();
  }

  // Keyboard controls
  useEffect(() => {
      const handleKeyDown = (e: KeyboardEvent) => {
          resetHideTimer(); // Reset timer on keyboard input
          const key = e.key.toLowerCase();
          
          // Movement controls - WASD
          if (key === 'w') onInputStateChange('UP', true);
          if (key === 'a') onInputStateChange('LEFT', true);
          if (key === 's') onInputStateChange('DOWN', true);
          if (key === 'd') onInputStateChange('RIGHT', true);
          
          // Movement controls - Arrow keys
          if (e.key === 'ArrowUp') onInputStateChange('UP', true);
          if (e.key === 'ArrowLeft') onInputStateChange('LEFT', true);
          if (e.key === 'ArrowDown') onInputStateChange('DOWN', true);
          if (e.key === 'ArrowRight') onInputStateChange('RIGHT', true);
          
          // Action controls - Space and F
          if (key === ' ' || key === 'f') {
              e.preventDefault();
              onAction();
          }
      };
      
      const handleKeyUp = (e: KeyboardEvent) => {
          const key = e.key.toLowerCase();
          
          // Movement controls - WASD
          if (key === 'w') onInputStateChange('UP', false);
          if (key === 'a') onInputStateChange('LEFT', false);
          if (key === 's') onInputStateChange('DOWN', false);
          if (key === 'd') onInputStateChange('RIGHT', false);
          
          // Movement controls - Arrow keys
          if (e.key === 'ArrowUp') onInputStateChange('UP', false);
          if (e.key === 'ArrowLeft') onInputStateChange('LEFT', false);
          if (e.key === 'ArrowDown') onInputStateChange('DOWN', false);
          if (e.key === 'ArrowRight') onInputStateChange('RIGHT', false);
      };
      
      window.addEventListener('keydown', handleKeyDown);
      window.addEventListener('keyup', handleKeyUp);
      
      // Start the initial hide timer
      resetHideTimer();
      
      return () => {
          clearInput();
          if (hideTimeoutRef.current !== null) {
              window.clearTimeout(hideTimeoutRef.current);
          }
          window.removeEventListener('keydown', handleKeyDown);
          window.removeEventListener('keyup', handleKeyUp);
      };
  }, [onInputStateChange, onAction]);

  // Visual helper
  const isPressed = (dir: string) => activeDir === dir;

  return (
    <div className={`absolute bottom-6 left-0 right-0 px-6 flex justify-between items-end select-none z-30 pointer-events-none transition-opacity duration-500 ${isVisible ? 'opacity-100' : 'opacity-0'}`}>
      
      {/* D-PAD Area - Enable pointer events here */}
      <div 
        ref={dpadRef}
        className="relative w-44 h-44 pointer-events-auto"
        style={{ touchAction: 'none' }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onTouchCancel={clearInput}
        onMouseDown={handleMouseDown}
      >
        {/* D-Pad Background */}
        <div className="w-full h-full bg-zinc-900/40 rounded-full absolute top-0 left-0 border-2 border-zinc-800/50 backdrop-blur-[2px]" />
        
        {/* Cross Shape Visuals */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-32 bg-zinc-800 rounded-md shadow-inner" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-12 bg-zinc-800 rounded-md shadow-inner" />

        {/* Buttons */}
        <div className={`absolute top-2 left-1/2 -translate-x-1/2 w-12 h-14 rounded-t-md ${isPressed('UP') ? 'bg-zinc-600' : 'bg-transparent'} transition-colors`} />
        <div className={`absolute bottom-2 left-1/2 -translate-x-1/2 w-12 h-14 rounded-b-md ${isPressed('DOWN') ? 'bg-zinc-600' : 'bg-transparent'} transition-colors`} />
        <div className={`absolute left-2 top-1/2 -translate-y-1/2 h-12 w-14 rounded-l-md ${isPressed('LEFT') ? 'bg-zinc-600' : 'bg-transparent'} transition-colors`} />
        <div className={`absolute right-2 top-1/2 -translate-y-1/2 h-12 w-14 rounded-r-md ${isPressed('RIGHT') ? 'bg-zinc-600' : 'bg-transparent'} transition-colors`} />
        
        {/* Center Dent */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 bg-zinc-900 rounded-full opacity-50" />
      </div>

      {/* Action Button - Enable pointer events here */}
      <div className="flex items-end mb-4 mr-2 pointer-events-auto">
        <button
            onTouchStart={handleAction}
            onMouseDown={handleAction}
            className="w-24 h-24 rounded-full bg-blue-600 active:bg-blue-500 border-b-8 border-r-4 active:border-0 active:translate-y-2 border-blue-900 shadow-xl transition-all flex items-center justify-center group"
        >
            <span className="text-white font-bold text-lg drop-shadow-md group-active:scale-95">RUNK</span>
        </button>
      </div>
    </div>
  );
};