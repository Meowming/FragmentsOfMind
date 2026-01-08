
import React, { useState, useEffect } from 'react';
import { GameState, NarrativeEntry, Fragment } from './types';
import { processFragments, getEndingNarrative } from './services/geminiService';
import { FragmentCard } from './components/FragmentCard';
import { NarrativeLog } from './components/NarrativeLog';

const INITIAL_FRAGMENTS: Fragment[] = [
  { text: "我拿起手机，终于打下那句：‘昨晚的事，我很抱歉。’", isFixed: false },
  { text: "我知道我该坚强些，可每当窗外有车声减速，我还是忍不住去张望。", isFixed: true },
  { text: "我一路走到了他住的那条街，只想在他门前站一会儿。", isFixed: false },
  { text: "我往他的信箱里塞了一张小纸条，纸张在寒雾中微微受潮。", isFixed: false },
  { text: "我不知道桌上这杯冷掉的咖啡，尝起来是否像我拼命想咽下的悔意。", isFixed: true }
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
      console.error("处理回合时出错:", error);
      setGameState(prev => ({ ...prev, status: 'playing' }));
      alert("她的思绪断裂了。请重试一次。");
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
            碎心余烬
          </h1>
          <p className="text-slate-500 font-light text-sm uppercase tracking-widest italic">
            命运的编排者
          </p>
        </header>

        {gameState.status === 'start' && (
          <div className="bg-slate-900/40 border border-slate-800 p-8 rounded-2xl text-center space-y-6 animate-in fade-in duration-1000">
            <p className="serif text-xl leading-relaxed italic text-slate-300">
              “我的行动如同回声……有些如此沉重，我只能祈祷他能听见。”
            </p>
            <div className="text-sm text-slate-500 max-w-md mx-auto leading-relaxed">
              重新排列她<b>针对他的行动</b>以及她的内心思绪，来引导他们的命运。有些时刻是<b>锚定</b>的，在局势转变前无法被移动。
            </div>
            <button 
              onClick={startGame}
              className="px-10 py-3 bg-pink-600 hover:bg-pink-500 text-white rounded-full transition-all hover:scale-105 active:scale-95 shadow-lg shadow-pink-900/20"
            >
              进入她的内心
            </button>
          </div>
        )}

        {(gameState.status === 'playing' || gameState.status === 'loading') && (
          <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-700">
            <div className="space-y-2">
              <div className="flex justify-between items-end">
                <span className="text-xs uppercase tracking-widest text-slate-500 font-medium">心灵共鸣度</span>
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
                {gameState.status === 'loading' ? '正在解析灵魂...' : '确认思绪序列'}
              </button>
              
              <button
                disabled={gameState.status === 'loading' || !isOrderChanged}
                onClick={handleResetOrder}
                className="px-6 py-4 rounded-xl bg-slate-800/50 text-slate-400 hover:text-white hover:bg-slate-800 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
              >
                重置
              </button>
            </div>

            {gameState.lastInterpretation && (
              <div className="p-4 bg-slate-900/50 rounded-lg border border-slate-800">
                <p className="text-xs text-slate-500 uppercase tracking-widest mb-1">对关系的影响</p>
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
              {gameState.status === 'victory' ? '和解' : '断绝'}
            </h2>
            <div className="serif text-lg leading-relaxed text-slate-300 italic whitespace-pre-wrap">
              {endingText}
            </div>
            <button 
              onClick={resetGame}
              className="px-8 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-full transition-all"
            >
              重新开始轮回
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default App;
