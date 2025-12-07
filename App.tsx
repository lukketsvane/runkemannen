import React, { useState, useRef } from 'react';
import { GameEngine } from './components/GameEngine';
import { Controls } from './components/Controls';
import { VIRTUAL_WIDTH, VIRTUAL_HEIGHT } from './constants';

const App: React.FC = () => {
  const [gameState, setGameState] = useState<'START' | 'PLAYING' | 'GAMEOVER'>('START');
  const [score, setScore] = useState(0);
  
  // Refs for inputs to avoid re-renders in game loop
  const inputsRef = useRef<Record<string, boolean>>({});
  const actionRef = useRef<boolean>(false);

  const handleInput = (key: string, pressed: boolean) => {
    inputsRef.current[key] = pressed;
  };

  const handleAction = () => {
      // Trigger a single frame action
      actionRef.current = true;
  };

  const startGame = () => {
      setScore(0);
      setGameState('PLAYING');
      inputsRef.current = {};
  }

  return (
    <div className="relative w-full h-screen bg-zinc-950 flex flex-col items-center justify-center overflow-hidden">
      
      {/* Game Container maintaining aspect ratio */}
      <div 
        className="relative w-full max-w-md h-full max-h-[800px] bg-black overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.8)] border-x-4 border-zinc-900"
        style={{ aspectRatio: `${VIRTUAL_WIDTH}/${VIRTUAL_HEIGHT}` }}
      >
          {/* CRT Effect */}
          <div className="scanline"></div>
          
          {/* Main Game Canvas */}
          {gameState === 'PLAYING' && (
              <GameEngine 
                inputs={inputsRef} 
                actionTrigger={actionRef} 
                onScoreUpdate={setScore}
                onGameOver={() => setGameState('GAMEOVER')}
                onWin={() => {}}
              />
          )}

          {/* UI Layer */}
          <div className="absolute top-0 left-0 w-full p-4 pointer-events-none z-10 flex justify-between">
              <div className="text-yellow-400 font-bold drop-shadow-md border-2 border-black bg-zinc-900 px-2 py-1">
                  SCORE: {score.toString().padStart(5, '0')}
              </div>
          </div>

          {/* Menus */}
          {gameState === 'START' && (
              <div className="absolute inset-0 bg-black/95 flex flex-col items-center justify-center text-center z-40 p-8 space-y-6">
                  <h1 className="text-4xl md:text-5xl text-green-500 font-bold drop-shadow-[4px_4px_0_rgba(255,255,255,0.2)] leading-tight">
                      RUNKE<br/>MANNEN
                  </h1>
                  <div className="space-y-3 text-zinc-300 text-xs leading-relaxed max-w-xs">
                      <p className="text-yellow-400">MISSION: CHARGE & RELEASE</p>
                      
                      <div className="bg-zinc-900 p-4 border border-zinc-700 text-left space-y-2">
                        <p>👀 <span className="text-blue-400">STALK</span> girls to charge MANA.</p>
                        <p>💥 Press <span className="text-blue-500 font-bold">RUNK</span> when fully charged near them.</p>
                        <p>🚫 Avoid <span className="text-purple-400">EYES</span>! They DISTRACT you and reset MANA.</p>
                        <p>⏳ Beat the clock to advance.</p>
                      </div>
                  </div>
                  <button 
                    onClick={startGame}
                    className="px-8 py-4 bg-green-600 hover:bg-green-500 text-white font-bold border-b-4 border-green-800 active:border-b-0 active:translate-y-1 transition-all w-full max-w-[200px]"
                  >
                      START MISSION
                  </button>
              </div>
          )}

          {gameState === 'GAMEOVER' && (
              <div className="absolute inset-0 bg-black/90 flex flex-col items-center justify-center text-center z-40 p-8 space-y-8">
                  <h1 className="text-4xl text-red-500 font-bold">TIME UP!</h1>
                  <p className="text-white">FINAL SCORE: {score}</p>
                  <button 
                    onClick={startGame}
                    className="px-8 py-4 bg-white text-black font-bold hover:bg-zinc-200 transition-all"
                  >
                      TRY AGAIN
                  </button>
              </div>
          )}

           {/* Controls Layer */}
           {gameState === 'PLAYING' && (
              <Controls onInputStateChange={handleInput} onAction={handleAction} />
           )}
      </div>
    </div>
  );
};

export default App;