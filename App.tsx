import React, { useState, useRef } from 'react';
import { GameEngine } from './components/GameEngine';
import { Controls } from './components/Controls';
import { VIRTUAL_WIDTH, VIRTUAL_HEIGHT } from './constants';

const App: React.FC = () => {
  const [gameState, setGameState] = useState<'START' | 'LEVEL_SELECT' | 'PLAYING' | 'PAUSED' | 'GAMEOVER'>('START');
  const [score, setScore] = useState(0);
  const [selectedLevel, setSelectedLevel] = useState(1);
  const [currentLevel, setCurrentLevel] = useState(1);
  
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

  const showLevelSelect = () => {
      setGameState('LEVEL_SELECT');
  }

  const togglePause = () => {
      if (gameState === 'PLAYING') {
          setGameState('PAUSED');
      } else if (gameState === 'PAUSED') {
          setGameState('PLAYING');
      }
  }

  const restartLevel = () => {
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
          {(gameState === 'PLAYING' || gameState === 'PAUSED') && (
              <GameEngine 
                inputs={inputsRef} 
                actionTrigger={actionRef} 
                onScoreUpdate={setScore}
                onGameOver={() => setGameState('GAMEOVER')}
                onWin={() => {}}
                onLevelChange={setCurrentLevel}
                onPauseRequest={togglePause}
                isPaused={gameState === 'PAUSED'}
                initialLevel={selectedLevel}
              />
          )}

          {/* UI Layer - Score removed per requirements */}

          {/* Menus */}
          {gameState === 'START' && (
              <div className="absolute inset-0 bg-black/95 flex flex-col items-center justify-center text-center z-40 p-8 space-y-6">
                  <h1 className="text-4xl md:text-5xl text-green-500 font-bold drop-shadow-[4px_4px_0_rgba(255,255,255,0.2)] leading-tight">
                      runke<br/>mannen
                  </h1>
                  <div className="space-y-3 text-zinc-300 text-xs leading-relaxed max-w-xs">
                      <p className="text-yellow-400">oppdrag: overlev på stranda</p>
                      
                      <div className="bg-zinc-900 p-4 border border-zinc-700 text-left space-y-2">
                        <p><span className="text-blue-400">snike</span> seg nær dei nakne jentene for å lade opp.</p>
                        <p>trykk <span className="text-blue-500 font-bold">runk</span> raskt og gjentatte ganger når du er fulladet og nær dei.</p>
                        <p>unngå <span className="text-purple-400">auga</span> – dei distraherer deg.</p>
                        <p><span className="text-red-400">mistek du for mykje lading, er det game over!</span></p>
                        <p>finn <span className="text-yellow-400">solbriller</span> for ekstra stealth.</p>
                      </div>
                      
                      <div className="bg-blue-900/30 p-3 border border-blue-700/50 text-xs text-blue-300">
                        💡 tips: legg til heimeskjermen for beste oppleving
                      </div>
                  </div>
                  <button 
                    onClick={showLevelSelect}
                    className="px-8 py-4 bg-green-600 hover:bg-green-500 text-white font-bold border-b-4 border-green-800 active:border-b-0 active:translate-y-1 transition-all w-full max-w-[200px]"
                  >
                      start oppdrag
                  </button>
              </div>
          )}

          {gameState === 'LEVEL_SELECT' && (
              <div className="absolute inset-0 bg-black/95 flex flex-col items-center justify-center text-center z-40 p-8 space-y-6 overflow-y-auto">
                  <h1 className="text-2xl md:text-3xl text-green-500 font-bold">
                      velg djup (d)
                  </h1>
                  <div className="grid grid-cols-5 gap-3 max-w-md w-full">
                      {Array.from({length: 25}, (_, i) => i + 1).map(level => (
                          <button 
                              key={level}
                              onClick={() => {
                                  setSelectedLevel(level);
                                  startGame();
                              }}
                              className={`px-4 py-3 ${
                                  selectedLevel === level 
                                      ? 'bg-blue-600 hover:bg-blue-500' 
                                      : level === 25 
                                      ? 'bg-purple-600 hover:bg-purple-500'
                                      : 'bg-green-600 hover:bg-green-500'
                              } text-white font-bold border-b-4 ${
                                  selectedLevel === level 
                                      ? 'border-blue-800' 
                                      : level === 25
                                      ? 'border-purple-800'
                                      : 'border-green-800'
                              } active:border-b-0 active:translate-y-1 transition-all text-sm`}
                          >
                              {level}
                          </button>
                      ))}
                  </div>
                  <button 
                    onClick={() => setGameState('START')}
                    className="px-6 py-3 bg-zinc-600 hover:bg-zinc-500 text-white font-bold border-b-4 border-zinc-800 active:border-b-0 active:translate-y-1 transition-all text-sm"
                  >
                      tilbake
                  </button>
              </div>
          )}

          {gameState === 'GAMEOVER' && (
              <div className="absolute inset-0 bg-black/90 flex flex-col items-center justify-center text-center z-40 p-8 space-y-8">
                  <h1 className="text-4xl text-red-500 font-bold">mista lading!</h1>
                  <p className="text-zinc-300">du mista ereksjon...</p>
                  <button 
                    onClick={restartLevel}
                    className="px-8 py-4 bg-white text-black font-bold hover:bg-zinc-200 transition-all"
                  >
                      prøv igjen
                  </button>
              </div>
          )}

          {gameState === 'PAUSED' && (
              <div className="absolute inset-0 bg-black/90 flex flex-col items-center justify-center text-center z-40 p-8 space-y-6">
                  <h1 className="text-3xl text-yellow-400 font-bold">pause</h1>
                  <div className="space-y-3">
                      <button 
                        onClick={togglePause}
                        className="w-full px-8 py-4 bg-green-600 hover:bg-green-500 text-white font-bold border-b-4 border-green-800 active:border-b-0 active:translate-y-1 transition-all"
                      >
                          fortsett
                      </button>
                      <button 
                        onClick={restartLevel}
                        className="w-full px-8 py-4 bg-blue-600 hover:bg-blue-500 text-white font-bold border-b-4 border-blue-800 active:border-b-0 active:translate-y-1 transition-all"
                      >
                          start på nytt
                      </button>
                      <button 
                        onClick={() => setGameState('START')}
                        className="w-full px-8 py-4 bg-zinc-600 hover:bg-zinc-500 text-white font-bold border-b-4 border-zinc-800 active:border-b-0 active:translate-y-1 transition-all"
                      >
                          hovedmeny
                      </button>
                  </div>
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