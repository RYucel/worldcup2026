import { useMemo } from 'react';
import { ScatterChart, Scatter, XAxis, YAxis, ZAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, ReferenceLine } from 'recharts';
import { Match } from '../types';
import { translations, Language } from '../i18n';
import { Grid3X3 } from 'lucide-react';

interface Props {
  matches: Match[];
  lang: Language;
}

const getDifficulty = (timeStr: string) => {
  const hour = parseInt(timeStr.split(':')[0], 10);
  if (hour >= 1 && hour <= 5) return 1200; // Big bubble (night)
  if (hour === 0) return 800; // Midnight
  if (hour === 6 || hour === 7) return 600; // Early morning
  return 200; // Small bubble (easy daytime/evening viewing)
};

const getColor = (diff: number) => {
  if (diff < 80) return '#ef4444'; // Intense Red (very close)
  if (diff < 180) return '#f97316'; // Orange
  if (diff < 280) return '#fbbf24'; // Yellow
  if (diff < 400) return '#94a3b8'; // Slate light
  return '#64748b'; // Slate dark
};

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-white/95 dark:bg-slate-900/95 border border-slate-200 dark:border-slate-700/80 p-4 rounded-xl shadow-xl backdrop-blur-md min-w-[200px]">
        <div className="font-bold text-base text-slate-800 dark:text-white border-b border-slate-200 dark:border-white/10 pb-2 mb-3 flex items-center justify-between gap-4">
          <span className="truncate max-w-[120px]">{data.team1}</span>
          <span className="text-slate-500 text-[10px] font-black uppercase text-center border px-1.5 py-0.5 rounded border-slate-300 dark:border-slate-700">VS</span>
          <span className="truncate max-w-[120px] text-right">{data.team2}</span>
        </div>
        <div className="grid grid-cols-[1fr_auto] gap-x-6 gap-y-2 text-sm">
          <span className="text-slate-500 dark:text-slate-400">Match Time:</span>
          <span className="text-sky-600 dark:text-sky-400 font-medium text-right">{data.date.split(' ')[0]} {data.time}</span>
          
          <span className="text-slate-500 dark:text-slate-400">ELO Diff:</span>
          <span className="text-rose-500 dark:text-rose-400 font-bold text-right">{data.diff}</span>
          
          <span className="text-slate-500 dark:text-slate-400">Higher ELO:</span>
          <span className="text-slate-700 dark:text-slate-200 font-medium text-right">{data.higherElo}</span>
          
          <span className="text-slate-500 dark:text-slate-400">Lower ELO:</span>
          <span className="text-slate-700 dark:text-slate-200 font-medium text-right">{data.lowerElo}</span>
        </div>
      </div>
    );
  }
  return null;
};

export default function EloScatterChart({ matches, lang }: Props) {
  const text = translations[lang];
  
  const data = useMemo(() => {
    return matches.map(m => {
      const higherElo = Math.max(m.elo1, m.elo2);
      const lowerElo = Math.min(m.elo1, m.elo2);
      return {
        ...m,
        higherElo,
        lowerElo,
        z: getDifficulty(m.time),
        fillColor: getColor(m.diff)
      };
    });
  }, [matches]);

  // Adjust domains to match reasonable ranges
  const minElo = 1100;
  const maxElo = 2300;

  return (
    <div className="w-full bg-white/70 dark:bg-slate-800/70 backdrop-blur-xl border border-slate-200 dark:border-white/10 rounded-2xl p-6 shadow-sm mb-8 flex flex-col relative overflow-hidden group">
      <div className="absolute inset-0 bg-gradient-to-br from-black/[0.02] dark:from-white/[0.03] to-transparent pointer-events-none" />
      
      <h2 className="text-lg font-black mb-10 flex items-center gap-2.5 text-slate-800 dark:text-slate-100 relative z-10 uppercase tracking-widest pl-2">
        <div className="flex gap-0.5 opacity-90 text-amber-500 mr-2">
           <Grid3X3 className="w-5 h-5 drop-shadow-[0_0_8px_rgba(245,158,11,0.5)]" />
        </div>
        {text.scatterTitle}
      </h2>
      
      <div className="h-[500px] w-full relative z-10 -ml-4 pr-6 text-slate-700 dark:text-slate-300">
        <ResponsiveContainer width="100%" height="100%">
          <ScatterChart margin={{ top: 10, right: 10, bottom: 30, left: 20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#94a3b8" strokeOpacity={0.2} vertical={true} horizontal={true} />
            <XAxis 
              type="number" 
              dataKey="higherElo" 
              name="Higher ELO" 
              domain={[minElo, maxElo]} 
              tick={{ fill: 'currentColor', fontSize: 13, fontWeight: 500 }}
              tickLine={false}
              axisLine={{ stroke: '#94a3b8', strokeWidth: 2, strokeOpacity: 0.3 }}
              label={{ value: text.higherEloTeam, position: 'bottom', fill: 'currentColor', fontSize: 13, offset: 10, fontWeight: 600, letterSpacing: '0.05em' }}
            />
            <YAxis 
              type="number" 
              dataKey="lowerElo" 
              name="Lower ELO" 
              domain={[minElo, maxElo]} 
              tick={{ fill: 'currentColor', fontSize: 13, fontWeight: 500 }}
              tickLine={false}
              axisLine={{ stroke: '#94a3b8', strokeWidth: 2, strokeOpacity: 0.3 }}
              label={{ value: text.lowerEloTeam, angle: -90, position: 'insideLeft', fill: 'currentColor', fontSize: 13, offset: -5, fontWeight: 600, letterSpacing: '0.05em' }}
            />
            <ZAxis type="number" dataKey="z" range={[150, 1600]} name="Difficulty" />
            <Tooltip 
              content={<CustomTooltip />} 
              cursor={{ strokeDasharray: '4 4', stroke: '#475569', strokeWidth: 1.5 }} 
              isAnimationActive={false} // Faster popups
            />
            
            {/* Diagonal line y = x for perfectly matched teams */}
            <ReferenceLine 
              segment={[{ x: minElo, y: minElo }, { x: maxElo, y: maxElo }]} 
              stroke="#334155" 
              strokeOpacity={0.8}
              strokeDasharray="6 6" 
              strokeWidth={2}
            />

            <Scatter name="Matches" data={data}>
              {data.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={entry.fillColor} 
                  stroke="transparent"
                  strokeWidth={2}
                  fillOpacity={0.8}
                  className="transition-all duration-300 hover:fill-opacity-100"
                  style={{ filter: `drop-shadow(0 4px 12px ${entry.fillColor}40)` }}
                />
              ))}
            </Scatter>
          </ScatterChart>
        </ResponsiveContainer>
      </div>
      
      <div className="flex justify-center mt-6">
        <p className="text-center text-slate-500 text-[13px] relative z-10 font-medium max-w-2xl px-4 py-2 rounded-2xl bg-slate-100 dark:bg-white/[0.02]">
          {text.scatterDesc}
        </p>
      </div>
    </div>
  );
}
