import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Cell } from 'recharts';
import { translations, Language } from '../i18n';
import { ShieldAlert, Crosshair } from 'lucide-react';

export interface GroupStat {
  group: string;
  avgElo: number;
  avgDiff: number;
}

interface Props {
  stats: GroupStat[];
  lang: Language;
}

export default function GroupAnalysis({ stats, lang }: Props) {
  const text = translations[lang];

  // Sorting
  const sortedByElo = [...stats].sort((a, b) => b.avgElo - a.avgElo);
  const sortedByDiff = [...stats].sort((a, b) => a.avgDiff - b.avgDiff);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
      {/* Strength Chart */}
      <div className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-xl border border-slate-200 dark:border-white/10 rounded-2xl p-6 shadow-sm flex flex-col text-slate-700 dark:text-slate-300">
          <h2 className="text-lg font-black mb-6 flex items-center gap-2.5 text-slate-800 dark:text-slate-100 uppercase tracking-widest pl-2">
            <ShieldAlert className="w-5 h-5 text-blue-500" />
            {text.hardestGrp} ({text.averageElo})
          </h2>
          <div className="h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={sortedByElo} layout="vertical" margin={{ top: 0, right: 30, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#94a3b8" strokeOpacity={0.2} />
                <XAxis type="number" domain={['dataMin - 50', 'dataMax + 50']} tick={{ fill: 'currentColor', fontSize: 12 }} axisLine={{stroke: '#94a3b8', strokeOpacity: 0.3}} tickLine={false} />
                <YAxis dataKey="group" type="category" interval={0} tick={{ fill: 'currentColor', fontSize: 13, fontWeight: 'bold' }} axisLine={false} tickLine={false} width={40} />
                <RechartsTooltip 
                  cursor={{fill: '#94a3b8', opacity: 0.1}} 
                  contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.9)', borderColor: 'rgba(255,255,255,0.1)', color: '#fff', borderRadius: '8px' }}
                />
                <Bar dataKey="avgElo" radius={[0, 4, 4, 0]}>
                  {sortedByElo.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={index === 0 ? '#3b82f6' : '#64748b'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
      </div>

       {/* Competitiveness Chart */}
      <div className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-xl border border-slate-200 dark:border-white/10 rounded-2xl p-6 shadow-sm flex flex-col text-slate-700 dark:text-slate-300">
          <h2 className="text-lg font-black mb-6 flex items-center gap-2.5 text-slate-800 dark:text-slate-100 uppercase tracking-widest pl-2">
            <Crosshair className="w-5 h-5 text-emerald-500" />
            {text.mostCompGrp} ({text.averageDiff})
          </h2>
          <div className="h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={sortedByDiff} layout="vertical" margin={{ top: 0, right: 30, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#94a3b8" strokeOpacity={0.2} />
                <XAxis type="number" tick={{ fill: 'currentColor', fontSize: 12 }} axisLine={{stroke: '#94a3b8', strokeOpacity: 0.3}} tickLine={false} />
                <YAxis dataKey="group" type="category" interval={0} tick={{ fill: 'currentColor', fontSize: 13, fontWeight: 'bold' }} axisLine={false} tickLine={false} width={40} />
                <RechartsTooltip 
                  cursor={{fill: '#94a3b8', opacity: 0.1}} 
                  contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.9)', borderColor: 'rgba(255,255,255,0.1)', color: '#fff', borderRadius: '8px' }}
                />
                <Bar dataKey="avgDiff" radius={[0, 4, 4, 0]}>
                  {sortedByDiff.map((_, index) => (
                     <Cell key={`cell-${index}`} fill={index === 0 ? '#10b981' : '#64748b'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
      </div>
    </div>
  );
}
