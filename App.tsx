
import React, { useState, useCallback, useEffect } from 'react';
import { Play, Pause, RefreshCw, BrainCircuit, Activity, Magnet } from 'lucide-react';
import SimulationCanvas from './components/SimulationCanvas';
import StatsChart from './components/StatsChart';
import { analyzeSimulationState } from './services/geminiService';
import { SimulationStats } from './types';
import { DEFAULT_TEMPERATURE, DEFAULT_MAGNETIC_FIELD, CRITICAL_TEMPERATURE } from './constants';

const App: React.FC = () => {
  const [temperature, setTemperature] = useState<number>(DEFAULT_TEMPERATURE);
  const [magneticField, setMagneticField] = useState<number>(DEFAULT_MAGNETIC_FIELD);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [resetSignal, setResetSignal] = useState<number>(0);
  const [stats, setStats] = useState<SimulationStats | null>(null);
  const [statsHistory, setStatsHistory] = useState<SimulationStats[]>([]);
  const [aiAnalysis, setAiAnalysis] = useState<string>("");
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);

  // Update stats history (limit array size)
  const handleStatsUpdate = useCallback((newStats: SimulationStats) => {
    setStats(newStats);
    setStatsHistory(prev => {
      const updated = [...prev, newStats];
      if (updated.length > 200) updated.shift();
      return updated;
    });
  }, []);

  const handleReset = () => {
    setIsRunning(false);
    setResetSignal(prev => prev + 1);
    setStatsHistory([]);
    setStats(null);
    setAiAnalysis("");
  };

  const handleAnalyze = async () => {
    if (!stats) return;
    setIsAnalyzing(true);
    const result = await analyzeSimulationState(temperature, stats.magnetization, stats.energy, magneticField);
    setAiAnalysis(result);
    setIsAnalyzing(false);
  };

  // Determine physics phase for UI coloring
  const phaseColor = temperature < CRITICAL_TEMPERATURE ? 'text-blue-400' : 'text-red-400';
  const phaseName = temperature < CRITICAL_TEMPERATURE ? 'Ферромагнетик' : 'Парамагнетик';

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-indigo-500 selection:text-white pb-12">
      {/* Header */}
      <header className="bg-slate-900 border-b border-slate-800 p-6 sticky top-0 z-50 shadow-lg">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-3">
             <div className="p-2 bg-indigo-600 rounded-lg shadow-lg shadow-indigo-500/20">
               <Activity className="w-6 h-6 text-white" />
             </div>
             <div>
               <h1 className="text-2xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-cyan-400">
                 Модель Изинга 2D
               </h1>
               <p className="text-xs text-slate-400">Симуляция фазовых переходов Монте-Карло</p>
             </div>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="text-right hidden md:block">
              <div className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Текущая фаза</div>
              <div className={`font-mono font-bold ${phaseColor}`}>{phaseName}</div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto p-4 md:p-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column: Controls & Stats */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* Controls Card */}
          <div className="bg-slate-900 rounded-xl p-6 border border-slate-800 shadow-xl">
            <h2 className="text-lg font-semibold mb-6 flex items-center gap-2">
              <span className="w-1 h-6 bg-indigo-500 rounded-full"></span>
              Параметры
            </h2>
            
            {/* Temperature Slider */}
            <div className="mb-6 space-y-2">
              <div className="flex justify-between items-end mb-2">
                <label className="text-sm font-medium text-slate-300">Температура (T)</label>
                <span className="text-2xl font-mono text-cyan-400">{temperature.toFixed(2)}</span>
              </div>
              <input
                type="range"
                min="0.1"
                max="5.0"
                step="0.01"
                value={temperature}
                onChange={(e) => setTemperature(parseFloat(e.target.value))}
                className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-500 hover:accent-indigo-400 transition-all"
              />
              <div className="flex justify-between text-xs text-slate-500 font-mono mt-1">
                <span>0.1</span>
                <span className="text-red-500 font-bold cursor-help" title={`Critical Temp: ${CRITICAL_TEMPERATURE}`}>Tc</span>
                <span>5.0</span>
              </div>
            </div>

             {/* Magnetic Field Slider */}
            <div className="mb-8 space-y-2">
              <div className="flex justify-between items-end mb-2">
                <label className="text-sm font-medium text-slate-300 flex items-center gap-2">
                   <Magnet size={14} className="text-rose-400" /> 
                   Поле (H)
                </label>
                <span className="text-2xl font-mono text-rose-400">{magneticField.toFixed(2)}</span>
              </div>
              <input
                type="range"
                min="-2.0"
                max="2.0"
                step="0.05"
                value={magneticField}
                onChange={(e) => setMagneticField(parseFloat(e.target.value))}
                className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-rose-500 hover:accent-rose-400 transition-all"
              />
              <div className="flex justify-between text-xs text-slate-500 font-mono mt-1">
                <span>-2.0</span>
                <span>0.0</span>
                <span>2.0</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setIsRunning(!isRunning)}
                className={`flex items-center justify-center gap-2 py-3 px-4 rounded-lg font-semibold transition-all ${
                  isRunning 
                    ? 'bg-amber-500/10 text-amber-500 border border-amber-500/50 hover:bg-amber-500/20' 
                    : 'bg-emerald-500 text-slate-900 hover:bg-emerald-400 shadow-lg shadow-emerald-500/20'
                }`}
              >
                {isRunning ? <><Pause size={18} /> Стоп</> : <><Play size={18} /> Старт</>}
              </button>
              
              <button
                onClick={handleReset}
                className="flex items-center justify-center gap-2 py-3 px-4 rounded-lg font-semibold bg-slate-800 text-slate-300 border border-slate-700 hover:bg-slate-700 transition-all"
              >
                <RefreshCw size={18} /> Сброс
              </button>
            </div>
          </div>

          {/* Real-time Data Card */}
          <div className="bg-slate-900 rounded-xl p-6 border border-slate-800 shadow-xl">
             <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <span className="w-1 h-6 bg-cyan-500 rounded-full"></span>
              Метрики
            </h2>
            
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
                <div className="text-xs text-slate-500 uppercase mb-1">Намагниченность</div>
                <div className="text-xl font-mono text-slate-100">
                  {stats ? stats.magnetization.toFixed(3) : '---'}
                </div>
              </div>
              <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
                <div className="text-xs text-slate-500 uppercase mb-1">Энергия</div>
                <div className="text-xl font-mono text-slate-100">
                  {stats ? stats.energy.toFixed(3) : '---'}
                </div>
              </div>
            </div>

            <StatsChart data={statsHistory} />
          </div>

          {/* AI Analysis Card */}
          <div className="bg-slate-900 rounded-xl p-6 border border-slate-800 shadow-xl relative overflow-hidden">
             <div className="absolute top-0 right-0 p-3 opacity-10">
               <BrainCircuit size={64} />
             </div>
             <h2 className="text-lg font-semibold mb-4 flex items-center gap-2 relative z-10">
              <span className="w-1 h-6 bg-purple-500 rounded-full"></span>
              AI Анализ
            </h2>
            
            <div className="min-h-[100px] text-sm text-slate-300 leading-relaxed mb-4 bg-slate-950/50 p-4 rounded-lg border border-slate-800/50">
              {aiAnalysis ? (
                <p>{aiAnalysis}</p>
              ) : (
                <p className="text-slate-600 italic">Запустите симуляцию и нажмите кнопку для анализа текущего состояния физической системы.</p>
              )}
            </div>

            <button
              onClick={handleAnalyze}
              disabled={!stats || isAnalyzing}
              className="w-full flex items-center justify-center gap-2 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium transition-colors shadow-lg shadow-indigo-500/20"
            >
              {isAnalyzing ? (
                <span className="animate-pulse">Анализ...</span>
              ) : (
                <>
                  <BrainCircuit size={16} /> Объяснить физику
                </>
              )}
            </button>
          </div>

        </div>

        {/* Right Column: Simulation Canvas */}
        <div className="lg:col-span-8 flex flex-col items-center justify-start space-y-6">
           <div className="w-full bg-slate-900 p-4 rounded-2xl border border-slate-800 shadow-2xl flex justify-center">
             <SimulationCanvas 
               temperature={temperature}
               magneticField={magneticField}
               isRunning={isRunning}
               onStatsUpdate={handleStatsUpdate}
               resetSignal={resetSignal}
             />
           </div>

           <div className="w-full p-4 bg-slate-800/50 border border-slate-700/50 rounded-xl text-sm text-slate-400">
             <h3 className="font-bold text-slate-200 mb-2">Как это работает?</h3>
             <ul className="list-disc pl-5 space-y-1">
               <li>Желтые/Синие точки — это спины (+1/-1).</li>
               <li>Система стремится минимизировать энергию: спины хотят быть параллельны соседям и внешнему полю.</li>
               <li><strong>T &lt; Tc</strong>: Доминирует взаимодействие (порядок). Поле смещает равновесие к одному цвету.</li>
               <li><strong>T &gt; Tc</strong>: Доминирует тепловой шум (хаос). Поле лишь слегка намагничивает материал.</li>
               <li><strong>H (Поле)</strong>: Создает предпочтительное направление. Попробуйте резко сменить знак поля при низкой температуре, чтобы увидеть задержку (гистерезис).</li>
             </ul>
           </div>
        </div>

      </main>
    </div>
  );
};

export default App;
