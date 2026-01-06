
import React, { useState, useEffect, useRef } from 'react';
import { GameState, NarrativeEntry } from './types';
import { processFragments, getEndingNarrative } from './services/geminiService';
import { FragmentCard } from './components/FragmentCard';
import { NarrativeLog } from './components/NarrativeLog';

const INITIAL_FRAGMENTS = [
  "He hasn't called.",
  "I know I should be stronger than this, yet I find myself checking my phone every time the wind rattles the windowpane.",
  "Strength is just a lie I tell my mirror before the sun goes down.",
  "Maybe he's just busy.",
  "I wonder if the cold coffee on my desk tastes like the regret I'm trying so hard not to swallow."
];

const App: React.FC = () => {
  const [gameState, setGameState] = useState<GameState>({
    happiness: 50,
    currentFragments: INITIAL_FRAGMENTS,
    history: [],
    status: 'start',
  });
  const [endingText, setEndingText] = useState<string>('');
  const [draggedItemIndex, setDraggedItemIndex] = useState<number | null>(null);

  // Handle Drag and Drop
  const handleDragStart = (index: number) => {
    setDraggedItemIndex(index);
  };

  const handleDragEnter = (index: number) => {
    if (draggedItemIndex === null || draggedItemIndex === index) return;
    
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

  const handleSubmit = async () => {
    if (gameState.status !== 'playing') return;
    
    setGameState(prev => ({ ...prev, status: 'loading' }));
    
    try {
      const response = await processFragments(gameState.currentFragments, gameState.happiness);
      
      const newHappiness = Math.min(Math.max(gameState.happiness + response.happiness_delta, -10), 110);
      
      const entry: NarrativeEntry = {
        sequence: gameState.currentFragments,
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

      setGameState(prev => ({
        ...prev,
        happiness: newHappiness,
        currentFragments: response.next_fragments,
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
      history: [],
      status: 'playing',
    });
  };

  const resetGame = () => {
    setGameState({
      happiness: 50,
      currentFragments: INITIAL_FRAGMENTS,
      history: [],
      status: 'start',
    });
    setEndingText('');
  };

  return (
    <div className="min-h-screen bg-[#0f172a] text-slate-200 flex flex-col items-center p-4 sm:p-8">
      <div className="max-w-2xl w-full">
        {/* Header */}
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
              "My thoughts are shattered glass, catching the light in ways I don't understand. If I could just arrange them correctly, perhaps the picture of my life would finally make sense..."
            </p>
            <div className="text-sm text-slate-500 max-w-md mx-auto leading-relaxed">
              Arrange her internal monologue to guide her through romantic distress. 
              The order of her thoughts determines her emotional fate.
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
            {/* Happiness Meter */}
            <div className="relative pt-6">
              <div className="flex justify-between text-xs text-slate-500 uppercase tracking-widest mb-2 font-semibold">
                <span>Despair</span>
                <span>Happiness</span>
                <span>Stability</span>
              </div>
              <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                <div 
                  className={`h-full transition-all duration-1000 ease-out ${gameState.happiness > 70 ? 'bg-emerald-500' : gameState.happiness > 30 ? 'bg-pink-500' : 'bg-rose-600'}`}
                  style={{ width: `${gameState.happiness}%` }}
                ></div>
              </div>
              <div className="text-center mt-2">
                <span className="text-2xl font-light text-slate-100">{gameState.happiness}</span>
                <span className="text-slate-600 ml-1">/ 100</span>
              </div>
            </div>

            {/* Current Fragments Area */}
            <div className="space-y-4">
              <p className="text-slate-400 text-sm italic mb-4">Reorder her current thoughts:</p>
              <div className="min-h-[300px]">
                {gameState.currentFragments.map((frag, idx) => (
                  <FragmentCard 
                    key={`${frag}-${idx}`}
                    text={frag}
                    index={idx}
                    onDragStart={handleDragStart}
                    onDragEnter={handleDragEnter}
                    onDragEnd={handleDragEnd}
                  />
                ))}
              </div>
            </div>

            <div className="flex justify-center pt-4">
              <button
                onClick={handleSubmit}
                disabled={gameState.status === 'loading'}
                className={`px-12 py-4 rounded-full font-semibold transition-all shadow-xl
                  ${gameState.status === 'loading' 
                    ? 'bg-slate-700 cursor-not-allowed opacity-50' 
                    : 'bg-white text-slate-900 hover:bg-pink-50 hover:scale-105'}`}
              >
                {gameState.status === 'loading' ? (
                  <div className="flex items-center gap-2">
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Interpreting...
                  </div>
                ) : 'Submit Thoughts'}
              </button>
            </div>

            {/* Narrative Interpretation */}
            {gameState.lastInterpretation && (
              <div className="p-4 bg-slate-900/60 border-l-4 border-pink-500 italic text-slate-400 text-sm leading-relaxed serif animate-in fade-in duration-500">
                {gameState.lastInterpretation}
              </div>
            )}

            <NarrativeLog history={gameState.history} />
          </div>
        )}

        {(gameState.status === 'victory' || gameState.status === 'failure') && (
          <div className="space-y-8 text-center animate-in zoom-in-95 duration-1000">
            <h2 className={`text-3xl serif font-light ${gameState.status === 'victory' ? 'text-emerald-400' : 'text-rose-500'}`}>
              {gameState.status === 'victory' ? 'A Heart Resolved' : 'A Heart Shattered'}
            </h2>
            
            <div className="bg-slate-900/40 p-10 rounded-3xl border border-slate-800 shadow-2xl relative overflow-hidden">
               <div className={`absolute top-0 left-0 right-0 h-1 ${gameState.status === 'victory' ? 'bg-emerald-500' : 'bg-rose-600'}`}></div>
               <p className="serif text-xl sm:text-2xl leading-relaxed text-slate-200 italic">
                {endingText || "The story concludes..."}
               </p>
            </div>

            <div className="space-y-4">
              <button 
                onClick={resetGame}
                className="px-10 py-3 border border-slate-700 hover:bg-slate-800 rounded-full transition-colors text-slate-400"
              >
                Reflect Again
              </button>
              <div className="text-slate-600 text-xs uppercase tracking-widest pt-8">
                Final Happiness: {gameState.happiness}
              </div>
            </div>
          </div>
        )}
      </div>

      <footer className="mt-auto py-8 text-slate-600 text-[10px] uppercase tracking-widest text-center">
        &copy; {new Date().getFullYear()} Fragments of Her Heart • A Text Manipulation Experience
      </footer>
    </div>
  );
};

export default App;
