
import React, { useState } from 'react';
import { GameState, NarrativeEntry, Fragment } from './types';
import { processFragments, getEndingNarrative } from './services/geminiService';
import { FragmentCard } from './components/FragmentCard';
import { NarrativeLog } from './components/NarrativeLog';

const INITIAL_FRAGMENTS: Fragment[] = [
  { text: "He hasn't called.", isFixed: false },
  { text: "I know I should be stronger than this, yet I find myself checking my phone every time the wind rattles the windowpane.", isFixed: true },
  { text: "Strength is just a lie I tell my mirror before the sun goes down.", isFixed: false },
  { text: "Maybe he's just busy.", isFixed: false },
  { text: "I wonder if the cold coffee on my desk tastes like the regret I'm trying so hard not to swallow.", isFixed: true }
];

const App: React.FC = () => {
  const [gameState, setGameState] = useState<GameState>({
    happiness: 50,
    currentFragments: INITIAL_FRAGMENTS,
    roundStartFragments: INITIAL_FRAGMENTS,
    history: [],
    status: 'start',
  });
  const [endingText, setEndingText] = useState<string>('');
  const [draggedItemIndex, setDraggedItemIndex] = useState<number | null>(null);

  const handleDragStart = (index: number) => {
    if (gameState.currentFragments[index].isFixed) return;
    setDraggedItemIndex(index);
  };

  const handleDragEnter = (index: number) => {
    if (draggedItemIndex === null || draggedItemIndex === index) return;
    
    // Prevent swapping if the target is fixed
    if (gameState.currentFragments[index].isFixed) return;
    
    const newFragments = [...gameState.currentFragments];
    const item = newFragments[draggedItemIndex];
    newFragments.splice(draggedItemIndex, 1);
    newFragments.splice(index, 0, item);
    
    setDraggedItemIndex(index);
    setGameState(prev => ({ ...prev, currentFragments: newFragments }));
  };

  const handleDragEnd = () => {
    setDraggedItemIndex(null);
  };

  const handleResetOrder = () => {
    setGameState(prev => ({
      ...prev,
      currentFragments: [...prev.roundStartFragments]
    }));
  };

  const handleSubmit = async () => {
    if (gameState.status !== 'playing') return;
    
    setGameState(prev => ({ ...prev, status: 'loading' }));
    
    try {
      const fragmentTexts = gameState.currentFragments.map(f => f.text);
      const response = await processFragments(fragmentTexts, gameState.happiness);
      
      const newHappiness = Math.min(Math.max(gameState.happiness + response.happiness_delta, -10), 110);
      
      const entry: NarrativeEntry = {
        sequence: fragmentTexts,
        interpretation: response.interpretation_summary,
        happinessDelta: response.happiness_delta,
        newHappiness: newHappiness
      };

      let newStatus: GameState['status'] = 'playing';
      if (newHappiness >= 100) newStatus = 'victory';
      if (newHappiness <= 0) newStatus = 'failure';

      if (newStatus === 'victory' || newStatus === 'failure') {
        const endNarrative = await getEndingNarrative(newStatus === 'victory', [...gameState.history, entry]);
        setEndingText(endNarrative);
      }

      const nextFragments: Fragment[] = response.next_fragments.map(f => ({
        text: f.text,
        isFixed: f.is_fixed
      }));

      setGameState(prev => ({
        ...prev,
        happiness: newHappiness,
        currentFragments: nextFragments,
        roundStartFragments: [...nextFragments],
        history: [...prev.history, entry],
        status: newStatus,
        lastInterpretation: response.interpretation_summary,
        tone: response.tone
      }));
    } catch (error) {
      console.error("Error processing turn:", error);
      setGameState(prev => ({ ...prev, status: 'playing' }));
      alert("Something went wrong with her thoughts. Please try again.");
    }
  };

  const startGame = () => {
    setGameState({
      happiness: 50,
      currentFragments: INITIAL_FRAGMENTS,
      roundStartFragments: INITIAL_FRAGMENTS,
      history: [],
      status: 'playing',
    });
  };

  const resetGame = () => {
    setGameState({
      happiness: 50,
      currentFragments: INITIAL_FRAGMENTS,
      roundStartFragments: INITIAL_FRAGMENTS,
      history: [],
      status: 'start',
    });
    setEndingText('');
  };

  const isOrderChanged = JSON.stringify(gameState.currentFragments) !== JSON.stringify(gameState.roundStartFragments);

  return (
    <div className="min-h-screen bg-[#0f172a] text-slate-200 flex flex-col items-center p-4 sm:p-8">
      <div className="max-w-2xl w-full">
        <header className="mb-12 text-center">
          <h1 className="text-4xl sm:text-5xl font-light serif mb-4 tracking-tighter text-pink-100">
            Fragments of Her Heart
          </h1>
          <p className="text-slate-500 font-light text-sm uppercase tracking-widest italic">
            an editor of fate
          </p>
        </header>

        {gameState.status === 'start' && (
          <div className="bg-slate-900/40 border border-slate-800 p-8 rounded-2xl text-center space-y-6 animate-in fade-in duration-1000">
            <p className="serif text-xl leading-relaxed italic text-slate-300">
              "My thoughts are shattered glass... some pieces are so sharp, so heavy, I cannot move them at all."
            </p>
            <div className="text-sm text-slate-500 max-w-md mx-auto leading-relaxed">
              Reorder her monologue to guide her fate. Note that some thoughts are <b>anchored</b>—they cannot be moved until her perspective shifts.
            </div>
            <button 
              onClick={startGame}
              className="px-10 py-3 bg-pink-600 hover:bg-pink-500 text-white rounded-full transition-all hover:scale-105 active:scale-95 shadow-lg shadow-pink-900/20"
            >
              Enter Her Mind
            </button>
          </div>
        )}

        {(gameState.status === 'playing' || gameState.status === 'loading') && (
          <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-700">
            <div className="space-y-2">
              <div className="flex justify-between items-end">
                <span className="text-xs uppercase tracking-widest text-slate-500 font-medium">Heart Resonance</span>
                <span className={`text-2xl font-light serif ${gameState.happiness > 70 ? 'text-pink-400' : gameState.happiness < 30 ? 'text-rose-500' : 'text-slate-300'}`}>
                  {gameState.happiness}%
                </span>
              </div>
              <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                <div 
                  className={`h-full transition-all duration-1000 ease-out ${gameState.happiness > 70 ? 'bg-pink-500' : gameState.happiness < 30 ? 'bg-rose-600' : 'bg-slate-400'}`}
                  style={{ width: `${gameState.happiness}%` }}
                ></div>
              </div>
            </div>

            <div className="space-y-1">
              {gameState.currentFragments.map((fragment, idx) => (
                <FragmentCard
                  key={`${idx}-${fragment.text.substring(0, 10)}`}
                  text={fragment.text}
                  index={idx}
                  isFixed={fragment.isFixed}
                  onDragStart={handleDragStart}
                  onDragEnter={handleDragEnter}
                  onDragEnd={handleDragEnd}
                />
              ))}
            </div>

            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <button
                disabled={gameState.status === 'loading'}
                onClick={handleSubmit}
                className={`flex-1 py-4 rounded-xl font-medium transition-all flex items-center justify-center gap-2
                  ${gameState.status === 'loading' 
                    ? 'bg-slate-800 text-slate-500 cursor-wait' 
                    : 'bg-white text-slate-900 hover:bg-pink-50 hover:text-pink-600'
                  }`}
              >
                {gameState.status === 'loading' ? 'Interpreting Soul...' : 'Commit the Thought'}
              </button>
              
              <button
                disabled={gameState.status === 'loading' || !isOrderChanged}
                onClick={handleResetOrder}
                className="px-6 py-4 rounded-xl bg-slate-800/50 text-slate-400 hover:text-white hover:bg-slate-800 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
              >
                Reset Sequence
              </button>
            </div>

            {gameState.lastInterpretation && (
              <div className="p-4 bg-slate-900/50 rounded-lg border border-slate-800">
                <p className="text-xs text-slate-500 uppercase tracking-widest mb-1">Last Realization</p>
                <p className="text-slate-400 text-sm italic leading-relaxed">
                  {gameState.lastInterpretation}
                </p>
              </div>
            )}

            <NarrativeLog history={gameState.history} />
          </div>
        )}

        {(gameState.status === 'victory' || gameState.status === 'failure') && (
          <div className="bg-slate-900/60 border border-slate-800 p-8 rounded-2xl space-y-8 text-center">
            <h2 className={`text-3xl serif ${gameState.status === 'victory' ? 'text-emerald-400' : 'text-rose-400'}`}>
              {gameState.status === 'victory' ? 'Closure' : 'Desolation'}
            </h2>
            <div className="serif text-lg leading-relaxed text-slate-300 italic whitespace-pre-wrap">
              {endingText}
            </div>
            <button 
              onClick={resetGame}
              className="px-8 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-full transition-all"
            >
              Restart the Cycle
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default App;
