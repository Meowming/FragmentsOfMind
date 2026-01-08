
import React, { useState } from 'react';
import { GameState, NarrativeEntry, Fragment, GeminiResponse } from './types';
import { adjudicateTurn } from './services/geminiService';
import { FragmentCard } from './components/FragmentCard';
import { NarrativeLog } from './components/NarrativeLog';

const INITIAL_FRAGMENTS: Fragment[] = [
  { text: "屏幕上，敌方水晶只剩最后一丝血量。", isFixed: false },
  { text: "楼道里传来电梯门开启的清脆叮咚声。", isFixed: false },
  { text: "那是父亲沉重的脚步声，比平时提前了整整两小时。", isFixed: true },
  { text: "我的手心瞬间渗出了冷汗，滑腻地握不住鼠标。", isFixed: false },
  { text: "钥匙在锁孔里搅动的金属摩擦声清晰可辨。", isFixed: true }
];

const App: React.FC = () => {
  const [gameState, setGameState] = useState<GameState>({
    trust: 60,
    autonomy: 50,
    study: 55,
    risk: 20,
    coherence: 100,
    currentFragments: INITIAL_FRAGMENTS,
    roundStartFragments: INITIAL_FRAGMENTS,
    history: [],
    status: 'start',
    turn_id: "T1"
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

  const handleSubmit = async () => {
    if (gameState.status !== 'playing') return;
    setGameState(prev => ({ ...prev, status: 'loading' }));
    
    try {
      const fragmentTexts = gameState.currentFragments.map(f => f.text);
      const res: GeminiResponse = await adjudicateTurn(
        gameState.turn_id,
        fragmentTexts,
        { trust: gameState.trust, autonomy: gameState.autonomy, study: gameState.study, risk: gameState.risk, coherence: gameState.coherence },
        "父母提前回家，玩家正在电脑前秘密玩游戏。"
      );

      const newValues = {
        trust: Math.min(Math.max(gameState.trust + res.delta.trust, 0), 100),
        autonomy: Math.min(Math.max(gameState.autonomy + res.delta.autonomy, 0), 100),
        study: Math.min(Math.max(gameState.study + res.delta.study, 0), 100),
        risk: Math.min(Math.max(gameState.risk + res.delta.risk, 0), 100),
        coherence: Math.min(Math.max(gameState.coherence + res.delta.coherence, 0), 100),
      };

      const entry: NarrativeEntry = {
        sequence: fragmentTexts,
        interpretation: res.player_feedback_cn,
        delta: res.delta,
        newValues: newValues
      };

      if (res.outcome.is_game_over) {
        setEndingText(res.outcome.ending_text);
        setGameState(prev => ({ ...prev, status: 'failure', ...newValues, history: [...prev.history, entry] }));
        return;
      }

      const nextIdNum = parseInt(gameState.turn_id.substring(1)) + 1;
      const fixedIndices = res.internal_notes?.fixed_indices || [0]; // 默认固定第一个

      const nextFragments: Fragment[] = res.next_fragments_cn.map((text, idx) => ({
        text,
        isFixed: fixedIndices.includes(idx)
      }));

      setGameState(prev => ({
        ...prev,
        ...newValues,
        currentFragments: nextFragments,
        roundStartFragments: [...nextFragments],
        history: [...prev.history, entry],
        status: 'playing',
        turn_id: `T${nextIdNum}`,
        lastInterpretation: res.player_feedback_cn
      }));
    } catch (error) {
      console.error(error);
      setGameState(prev => ({ ...prev, status: 'playing' }));
      alert("思绪一片混乱……请重试。");
    }
  };

  const startGame = () => setGameState(prev => ({ ...prev, status: 'playing' }));
  const resetGame = () => window.location.reload();

  return (
    <div className="min-h-screen bg-[#0f172a] text-slate-200 flex flex-col items-center p-4 sm:p-8 selection:bg-pink-500/30">
      <div className="max-w-2xl w-full">
        <header className="mb-10 text-center">
          <h1 className="text-5xl sm:text-6xl font-medium serif mb-3 tracking-tighter text-pink-100 opacity-90">心跳之夜</h1>
          <p className="text-slate-500 font-light text-sm uppercase tracking-[0.4em] italic opacity-80">中国式家庭博弈</p>
        </header>

        {gameState.status === 'start' && (
          <div className="bg-slate-900/40 border border-slate-800 p-10 rounded-3xl text-center space-y-8 backdrop-blur-sm">
            <p className="handwritten text-3xl leading-relaxed text-pink-200/80 italic">“楼道里的脚步声，总是比闹钟更让人惊醒。”</p>
            <div className="text-sm text-slate-400 max-w-md mx-auto leading-relaxed font-light">
              通过重新排列你的<b>行动与借口</b>来应对突发状况。
              保持<b>信任值</b>，捍卫<b>自主性</b>，并在高压下维持逻辑的一致。
            </div>
            <button onClick={startGame} className="px-12 py-4 bg-pink-600 hover:bg-pink-500 text-white rounded-full transition-all shadow-xl font-medium tracking-wider">开始这个夜晚</button>
          </div>
        )}

        {(gameState.status === 'playing' || gameState.status === 'loading') && (
          <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-700">
            <div className="grid grid-cols-3 gap-4">
              <StatBar label="信任" value={gameState.trust} color="bg-emerald-500" />
              <StatBar label="自主" value={gameState.autonomy} color="bg-blue-500" />
              <StatBar label="学业" value={gameState.study} color="bg-amber-500" />
            </div>

            <div className="space-y-2">
              {gameState.currentFragments.map((fragment, idx) => (
                <FragmentCard key={`${idx}-${fragment.text}`} text={fragment.text} index={idx} isFixed={fragment.isFixed} onDragStart={handleDragStart} onDragEnter={handleDragEnter} onDragEnd={() => setDraggedItemIndex(null)} />
              ))}
            </div>

            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <button disabled={gameState.status === 'loading'} onClick={handleSubmit} className={`flex-1 py-4 rounded-2xl font-medium transition-all flex items-center justify-center gap-3 shadow-lg ${gameState.status === 'loading' ? 'bg-slate-800 text-slate-500 cursor-wait' : 'bg-white text-slate-900 hover:bg-pink-50'}`}>
                {gameState.status === 'loading' ? <><div className="w-4 h-4 border-2 border-slate-500 border-t-transparent rounded-full animate-spin"></div>裁决中...</> : '确认行动顺序'}
              </button>
              <button disabled={gameState.status === 'loading'} onClick={() => setGameState(p => ({ ...p, currentFragments: [...p.roundStartFragments] }))} className="px-8 py-4 rounded-2xl bg-slate-800/40 text-slate-400 hover:text-white border border-slate-800">重置</button>
            </div>

            {gameState.lastInterpretation && (
              <div className="p-6 bg-slate-900/30 rounded-2xl border border-slate-800/50 backdrop-blur-sm">
                <p className="text-[10px] text-slate-500 uppercase tracking-widest mb-2 font-bold">局势反馈</p>
                <p className="text-slate-300 text-base italic leading-relaxed serif">{gameState.lastInterpretation}</p>
              </div>
            )}
            <NarrativeLog history={gameState.history} />
          </div>
        )}

        {gameState.status === 'failure' && (
          <div className="bg-slate-900/60 border border-slate-800 p-10 rounded-3xl space-y-10 text-center backdrop-blur-md shadow-2xl">
            <h2 className="text-4xl serif text-rose-400">冲突爆发</h2>
            <div className="serif text-xl leading-loose text-slate-200 italic whitespace-pre-wrap px-4">{endingText}</div>
            <button onClick={resetGame} className="px-12 py-4 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-full border border-slate-700">重新开始这个夜晚</button>
          </div>
        )}
      </div>
    </div>
  );
};

const StatBar: React.FC<{ label: string, value: number, color: string }> = ({ label, value, color }) => (
  <div className="space-y-1.5">
    <div className="flex justify-between text-[10px] uppercase tracking-wider text-slate-500 font-bold px-1">
      <span>{label}</span>
      <span>{value}</span>
    </div>
    <div className="h-1 w-full bg-slate-800 rounded-full overflow-hidden">
      <div className={`h-full transition-all duration-1000 ${color}`} style={{ width: `${value}%` }}></div>
    </div>
  </div>
);

export default App;
