import { translations, Language } from '../i18n';
import { GroupStat } from './GroupAnalysis';
import { Users } from 'lucide-react';
import { flagMap } from '../data';

interface Props {
  stats: GroupStat[];
  lang: Language;
}

export default function GroupMembersViewer({ stats, lang }: Props) {
  const text = translations[lang];

  return (
    <div className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-xl border border-slate-200 dark:border-white/10 rounded-2xl p-6 shadow-sm mb-8 text-slate-700 dark:text-slate-300">
      <h2 className="text-lg font-black mb-6 flex items-center gap-2.5 text-slate-800 dark:text-slate-100 uppercase tracking-widest pl-2">
        <Users className="w-5 h-5 text-indigo-500" />
        {text.groupMembers || (lang === 'tr' ? 'Grup Üyeleri' : 'Group Members')}
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {stats.map(stat => (
          <div key={stat.group} className="bg-slate-50 dark:bg-slate-700/50 rounded-xl p-4 border border-slate-200 dark:border-white/5">
            <h3 className="font-bold text-lg mb-3 pb-2 border-b border-slate-200 dark:border-slate-600 flex justify-between items-center">
              <span>{text.group} {stat.group}</span>
              <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Avg Elo: {stat.avgElo}</span>
            </h3>
            <div className="flex flex-col gap-2">
              {[...(stat.teams || [])].sort((a, b) => b.elo - a.elo).map(team => (
                <div key={team.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <img src={`https://flagcdn.com/w20/${flagMap[team.name]}.png`} alt={team.name} className="w-5 h-3 object-cover rounded-sm shadow-sm" />
                    <span className="text-sm font-medium">{team.name}</span>
                  </div>
                  <span className="text-sm font-bold text-slate-500 dark:text-slate-400">{team.elo}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
