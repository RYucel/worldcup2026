import { useMemo } from 'react';
import { translations, Language } from '../i18n';
import { Match } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Cell, AreaChart, Area, ComposedChart, Line } from 'recharts';
import { Trophy, CalendarDays } from 'lucide-react';
import { flagMap } from '../data';

interface Props {
  matches: Match[];
  lang: Language;
}

export default function TournamentInsights({ matches, lang }: Props) {
  const text = translations[lang];

  const topTeams = useMemo(() => {
    const teams = new Map<string, number>();
    matches.forEach(m => {
      teams.set(m.team1, m.elo1);
      teams.set(m.team2, m.elo2);
    });
    return Array.from(teams.entries())
      .map(([team, elo]) => ({ team, elo }))
      .sort((a, b) => b.elo - a.elo)
      .slice(0, 10);
  }, [matches]);

  const timelineData = useMemo(() => {
    const days = new Map<string, { dateObj: Date, count: number, totalDiff: number }>();
    matches.forEach(m => {
      const parts = m.date.split(' ');
      // Example: 'Thursday', '11', 'June', '2026'
      // Taking Day Number and Month (short)
      const shortDate = `${parts[1]} ${parts[2].slice(0,3)}`;
      if (!days.has(shortDate)) {
        // approximate date object for sorting purposes
        const monthNum = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'].indexOf(parts[2]);
        const dObj = new Date(parseInt(parts[3], 10), monthNum !== -1 ? monthNum : 5, parseInt(parts[1], 10));
        days.set(shortDate, { dateObj: dObj, count: 0, totalDiff: 0 });
      }
      const dayData = days.get(shortDate)!;
      dayData.count += 1;
      dayData.totalDiff += m.diff;
    });

    return Array.from(days.entries())
      .map(([date, data]) => ({
        date,
        dateObj: data.dateObj,
        matches: data.count,
        avgDiff: Math.round(data.totalDiff / data.count)
      }))
      .sort((a, b) => a.dateObj.getTime() - b.dateObj.getTime());
  }, [matches]);

  const CustomTooltipTeam = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-slate-900/95 border border-slate-700/80 p-3 rounded-xl shadow-2xl backdrop-blur-md flex items-center gap-3 min-w-[150px]">
          <img src={`https://flagcdn.com/w40/${flagMap[data.team]}.png`} alt={data.team} className="w-8 h-5 object-cover rounded shadow-sm" />
          <div className="text-left">
            <div className="font-bold text-slate-100 text-sm whitespace-nowrap">{data.team}</div>
            <div className="text-amber-400 font-black text-xs">{data.elo} {text.eloRating}</div>
          </div>
        </div>
      );
    }
    return null;
  };

  const CustomTooltipTimeline = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-slate-900/95 border border-slate-700/80 p-3 rounded-xl shadow-2xl backdrop-blur-md min-w-[150px]">
          <div className="font-bold text-slate-100 text-sm mb-2 text-left">{label}</div>
          {payload.map((p: any, idx: number) => (
             <div key={idx} className="flex justify-between items-center gap-4 text-xs mb-1">
                <span style={{ color: p.color }} className="font-medium">{p.name}:</span>
                <span className="text-slate-200 font-bold">{p.value}</span>
             </div>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8 text-slate-700 dark:text-slate-300">
      {/* Top Teams Power Rankings */}
      <div className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-xl border border-slate-200 dark:border-white/10 rounded-2xl p-6 shadow-sm flex flex-col">
          <h2 className="text-lg font-black mb-6 flex items-center gap-2.5 text-slate-800 dark:text-slate-100 uppercase tracking-widest pl-2">
            <Trophy className="w-5 h-5 text-amber-500" />
            {text.powerRankings}
          </h2>
          <div className="h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topTeams} layout="vertical" margin={{ top: 0, right: 30, left: 10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#94a3b8" strokeOpacity={0.2} />
                <XAxis type="number" domain={['dataMin - 100', 'dataMax + 20']} tick={{ fill: 'currentColor', fontSize: 12 }} axisLine={{stroke: '#94a3b8', strokeOpacity: 0.3}} tickLine={false} />
                <YAxis dataKey="team" type="category" interval={0} tick={{ fill: 'currentColor', fontSize: 12, fontWeight: 'bold' }} axisLine={false} tickLine={false} width={100} />
                <RechartsTooltip content={<CustomTooltipTeam />} cursor={{fill: '#94a3b8', opacity: 0.1}} />
                <Bar dataKey="elo" radius={[0, 4, 4, 0]} barSize={16}>
                  {topTeams.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={index < 3 ? '#f59e0b' : '#3b82f6'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
      </div>

      {/* Timeline Matches & Competitiveness */}
      <div className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-xl border border-slate-200 dark:border-white/10 rounded-2xl p-6 shadow-sm flex flex-col">
          <h2 className="text-lg font-black mb-6 flex items-center gap-2.5 text-slate-800 dark:text-slate-100 uppercase tracking-widest pl-2">
            <CalendarDays className="w-5 h-5 text-purple-500" />
            {text.timeline}
          </h2>
          <div className="h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
               <ComposedChart data={timelineData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                 <CartesianGrid strokeDasharray="3 3" stroke="#94a3b8" strokeOpacity={0.2} vertical={false} />
                 <XAxis dataKey="date" tick={{ fill: 'currentColor', fontSize: 11 }} axisLine={{stroke: '#94a3b8', strokeOpacity: 0.3}} tickLine={false} />
                 <YAxis yAxisId="left" tick={{ fill: 'currentColor', fontSize: 11 }} axisLine={false} tickLine={false} />
                 <YAxis yAxisId="right" orientation="right" tick={{ fill: 'currentColor', fontSize: 11 }} axisLine={false} tickLine={false} />
                 <RechartsTooltip content={<CustomTooltipTimeline />} cursor={{stroke: '#94a3b8', strokeWidth: 2, strokeOpacity: 0.2, strokeDasharray: '4 4'}} />
                 
                 <Area yAxisId="left" type="monotone" name={text.matchesPerDay} dataKey="matches" fill="#a855f7" stroke="#a855f7" fillOpacity={0.2} strokeWidth={2} />
                 <Line yAxisId="right" type="monotone" name={text.avgDiffByDay} dataKey="avgDiff" stroke="#f43f5e" strokeWidth={3} dot={{r: 4, fill: '#f43f5e', strokeWidth: 0, stroke: 'none'}} activeDot={{ r: 6, fill: '#f43f5e', stroke: '#fff', strokeWidth: 2 }} />
               </ComposedChart>
            </ResponsiveContainer>
          </div>
      </div>
    </div>
  );
}
