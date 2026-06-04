import { useState, useEffect, useMemo } from 'react';
import { translations, Language } from './i18n';
import { matchesData, flagMap } from './data';
import { Search, Star, Moon, Sun, MapPin, BarChart3, Trophy, Globe, ShieldAlert, Crosshair } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import EloScatterChart from './components/EloScatterChart';
import GroupAnalysis, { GroupStat } from './components/GroupAnalysis';
import TournamentInsights from './components/TournamentInsights';
import GroupMembersViewer from './components/GroupMembersViewer';
import Countdown from './components/Countdown';
import InstallPWA from './components/InstallPWA';

const allGroups = ['ALL', 'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L'];
const cardClass = "bg-white/70 dark:bg-slate-800/70 backdrop-blur-xl border border-slate-200 dark:border-white/10 rounded-2xl shadow-sm";

const translateDate = (dateStr: string, lang: Language) => {
  if (lang === 'en') return dateStr;
  
  const map: Record<string, string> = {
    'Monday': 'Pazartesi',
    'Tuesday': 'Salı',
    'Wednesday': 'Çarşamba',
    'Thursday': 'Perşembe',
    'Friday': 'Cuma',
    'Saturday': 'Cumartesi',
    'Sunday': 'Pazar',
    'June': 'Haziran',
    'July': 'Temmuz'
  };

  let translated = dateStr;
  Object.keys(map).forEach(eng => {
    translated = translated.replace(new RegExp(eng, 'g'), map[eng]);
  });
  
  return translated;
};

export default function App() {
  const [lang, setLang] = useState<Language>('en');
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    if (typeof window !== 'undefined') {
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return 'dark';
  });

  const [search, setSearch] = useState('');
  const [sort, setSort] = useState('date');
  const [activeGroup, setActiveGroup] = useState('ALL');
  const [favOnly, setFavOnly] = useState(false);
  const [favorites, setFavorites] = useState<string[]>([]);

  const text = translations[lang];

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, [theme]);

  useEffect(() => {
    const saved = localStorage.getItem('wc_favorites');
    if (saved) setFavorites(JSON.parse(saved));
  }, []);

  const toggleFav = (matchId: string) => {
    setFavorites(prev => {
      const next = prev.includes(matchId) ? prev.filter(id => id !== matchId) : [...prev, matchId];
      localStorage.setItem('wc_favorites', JSON.stringify(next));
      return next;
    });
  };

  const filteredMatches = useMemo(() => {
    let result = matchesData;
    if (activeGroup !== 'ALL') {
      result = result.filter(m => m.group === activeGroup);
    }
    if (search) {
      const s = search.toLowerCase();
      result = result.filter(m => m.team1.toLowerCase().includes(s) || m.team2.toLowerCase().includes(s));
    }
    if (favOnly) {
      result = result.filter(m => favorites.includes(`${m.team1}_${m.team2}`));
    }
    result = [...result].sort((a, b) => {
      switch (sort) {
        case 'diff-desc': return b.diff - a.diff;
        case 'diff-asc': return a.diff - b.diff;
        case 'elo-high': return Math.max(b.elo1, b.elo2) - Math.max(a.elo1, a.elo2);
        case 'elo-low': return Math.min(a.elo1, a.elo2) - Math.min(b.elo1, b.elo2);
        case 'date': default: return 0;
      }
    });
    return result;
  }, [search, activeGroup, sort, favOnly, favorites]);

  const totalMatches = matchesData.length;
  const avgEloDiff = Math.round(matchesData.reduce((acc, m) => acc + m.diff, 0) / totalMatches);
  const closestMatch = Math.min(...matchesData.map(m => m.diff));
  const biggestMismatch = Math.max(...matchesData.map(m => m.diff));

  const maxDiff = Math.max(...matchesData.map(m => m.diff));
  const buckets = Array(10).fill(0);
  matchesData.forEach(m => {
    const bucket = Math.min(Math.floor((m.diff / (maxDiff + 1)) * 10), 9);
    buckets[bucket]++;
  });
  const maxCount = Math.max(...buckets);

  const groupStats: GroupStat[] = useMemo(() => {
    const stats: Record<string, { totalDiff: number; count: number; matches: typeof matchesData }> = {};
    matchesData.forEach(m => {
      if (!stats[m.group]) stats[m.group] = { totalDiff: 0, count: 0, matches: [] };
      stats[m.group].totalDiff += m.diff;
      stats[m.group].count++;
      stats[m.group].matches.push(m);
    });

    return Object.entries(stats).map(([group, data]) => {
      const teams = new Map<string, number>();
      data.matches.forEach(m => {
        teams.set(m.team1, m.elo1);
        teams.set(m.team2, m.elo2);
      });
      let totalGroupElo = 0;
      teams.forEach(elo => totalGroupElo += elo);
      const avgElo = Math.round(totalGroupElo / teams.size);
      
      return {
        group,
        avgElo,
        avgDiff: Math.round(data.totalDiff / data.count),
        teams: Array.from(teams.entries()).map(([name, elo]) => ({ name, elo }))
      };
    }).sort((a, b) => a.group.localeCompare(b.group));
  }, []);

  const hardestGroup = [...groupStats].sort((a, b) => b.avgElo - a.avgElo)[0];
  const mostCompetitive = [...groupStats].sort((a, b) => a.avgDiff - b.avgDiff)[0];

  const calcWinProb = (elo1: number, elo2: number) => {
    const prob1 = 1 / (1 + Math.pow(10, (elo2 - elo1) / 400));
    return [(prob1 * 100).toFixed(1), ((1 - prob1) * 100).toFixed(1)];
  };

  const getEloColor = (elo: number) => {
    if (elo >= 1900) return 'bg-emerald-500';
    if (elo >= 1700) return 'bg-amber-500';
    return 'bg-rose-500';
  };

  const getEdgeInfo = (diff: number) => {
    if (diff < 100) return { label: text.evenlyMatchedTxt, color: 'bg-emerald-500 text-white' };
    if (diff < 150) return { label: text.slightEdge, color: 'bg-amber-500 text-white dark:text-black' };
    if (diff < 300) return { label: text.moderateEdge, color: 'bg-orange-500 text-white' };
    return { label: text.heavyFavorite, color: 'bg-rose-500 text-white' };
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] dark:bg-[#0f172a] text-slate-900 dark:text-slate-100 transition-colors duration-300">
      <header className="sticky top-0 z-50 transition-colors bg-white/70 dark:bg-slate-800/70 backdrop-blur-xl border-b border-slate-200 dark:border-white/10">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-amber-500 rounded-xl shadow-md">
                <Trophy className="text-slate-900 w-6 h-6" />
              </div>
              <div>
                <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">
                  {text.title}
                </h1>
                <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">{text.subtitle}</p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <div className="relative">
                <input 
                  value={search} 
                  onChange={e => setSearch(e.target.value)} 
                  type="text" 
                  placeholder={text.search}
                  className="pl-9 pr-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-full md:w-48 text-slate-900 dark:text-white" 
                />
                <Search size={16} className="absolute left-3 top-2.5 text-slate-400" />
              </div>

              <select 
                value={sort} 
                onChange={e => setSort(e.target.value)}
                className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white appearance-none"
              >
                <option value="date">{text.sortDate}</option>
                <option value="diff-desc">{text.sortDiffDesc}</option>
                <option value="diff-asc">{text.sortDiffAsc}</option>
                <option value="elo-high">{text.sortEloHigh}</option>
                <option value="elo-low">{text.sortEloLow}</option>
              </select>

              <button 
                onClick={() => setFavOnly(!favOnly)}
                className={`px-4 py-2 rounded-xl border text-sm transition-colors flex items-center gap-2
                  ${favOnly 
                    ? 'bg-yellow-500/20 border-yellow-500/50 text-yellow-700 dark:text-yellow-500' 
                    : 'bg-slate-100 dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800'}`}
              >
                <Star size={16} className={favOnly ? 'fill-yellow-500 text-yellow-500' : ''} />
                {text.favOnly}
              </button>

              <InstallPWA lang={lang} />

              <button 
                onClick={() => setTheme(t => t === 'dark' ? 'light' : 'dark')} 
                className="p-2 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 transition"
              >
                {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
              </button>
              
              <button 
                onClick={() => setLang(l => l === 'en' ? 'tr' : 'en')} 
                className="p-2 px-3 flex items-center gap-2 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold text-sm hover:bg-slate-200 dark:hover:bg-slate-800 transition"
              >
                <Globe size={18} />
                {lang === 'en' ? 'TR' : 'EN'}
              </button>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 mt-6 justify-center">
            {allGroups.map(g => {
              const isActive = activeGroup === g;
              const label = g === 'ALL' ? text.groupAll : `${text.group} ${g}`;
              return (
                <button 
                  key={g} 
                  onClick={() => setActiveGroup(g)}
                  className={`px-3 py-1 rounded-full text-xs font-bold transition-all
                    ${isActive 
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-500/30 dark:shadow-none' 
                      : 'bg-slate-200 text-slate-600 dark:bg-slate-900 dark:text-slate-400 hover:bg-slate-300 dark:hover:bg-slate-800 border border-transparent dark:border-slate-800'}`}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
          <div className={`p-4 ${cardClass} bg-gradient-to-br from-blue-50/50 to-purple-50/50 dark:from-blue-500/10 dark:to-purple-500/10 border-blue-100 dark:border-blue-500/20`}>
            <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">{totalMatches}</div>
            <div className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider font-semibold">{text.totalMatches}</div>
          </div>
          <div className={`p-4 ${cardClass} bg-gradient-to-br from-purple-50/50 to-pink-50/50 dark:from-purple-500/10 dark:to-pink-500/10 border-purple-100 dark:border-purple-500/20`}>
            <div className="text-3xl font-bold text-purple-600 dark:text-purple-400">{avgEloDiff}</div>
            <div className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider font-semibold">{text.avgEloDiff}</div>
          </div>
          <div className={`p-4 ${cardClass} bg-gradient-to-br from-indigo-50/50 to-blue-50/50 dark:from-indigo-500/10 dark:to-blue-500/10 border-indigo-100 dark:border-indigo-500/20`}>
            <div className="text-3xl font-bold text-indigo-600 dark:text-indigo-400">{hardestGroup?.group}</div>
            <div className="text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-wider font-semibold">{text.hardestGrp} ({hardestGroup?.avgElo} ELO)</div>
          </div>
          <div className={`p-4 ${cardClass} bg-gradient-to-br from-teal-50/50 to-emerald-50/50 dark:from-teal-500/10 dark:to-emerald-500/10 border-teal-100 dark:border-teal-500/20`}>
            <div className="text-3xl font-bold text-teal-600 dark:text-teal-400">{mostCompetitive?.group}</div>
            <div className="text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-wider font-semibold">{text.mostCompGrp} ({mostCompetitive?.avgDiff} Diff)</div>
          </div>
          <div className={`p-4 ${cardClass} bg-gradient-to-br from-emerald-50/50 to-teal-50/50 dark:from-emerald-500/10 dark:to-teal-500/10 border-emerald-100 dark:border-emerald-500/20`}>
            <div className="text-3xl font-bold text-emerald-600 dark:text-emerald-400">{closestMatch}</div>
            <div className="text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-wider font-semibold">{text.closestMatch}</div>
          </div>
          <div className={`p-4 ${cardClass} bg-gradient-to-br from-rose-50/50 to-orange-50/50 dark:from-rose-500/10 dark:to-orange-500/10 border-rose-100 dark:border-rose-500/20`}>
            <div className="text-3xl font-bold text-rose-600 dark:text-rose-400">{biggestMismatch}</div>
            <div className="text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-wider font-semibold">{text.biggestMismatch}</div>
          </div>
        </div>

        <EloScatterChart matches={filteredMatches} lang={lang} />
        <TournamentInsights matches={matchesData} lang={lang} />
        <GroupAnalysis stats={groupStats} lang={lang} />
        <GroupMembersViewer stats={groupStats} lang={lang} />

        <div className={`p-6 mb-8 ${cardClass}`}>
          <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
            <BarChart3 className="text-blue-500 dark:text-blue-400" /> {text.distributionTitle}
          </h2>
          <div className="flex items-end gap-1 h-32">
            {buckets.map((count, i) => {
              const height = maxCount > 0 ? (count / maxCount) * 100 : 0;
              const color = i < 3 ? 'bg-emerald-500' : i < 7 ? 'bg-amber-500' : 'bg-rose-500';
              return (
                <div 
                  key={i} 
                  className={`flex-1 rounded-t transition-all ${color}`} 
                  style={{ height: `${height}%` }}
                  title={`Range ${Math.floor(i * maxDiff/10)}-${Math.floor((i+1) * maxDiff/10)}`}
                />
              )
            })}
          </div>
          <div className="flex justify-between text-xs text-slate-500 mt-2 font-medium">
            <span>{text.evenlyMatched}</span>
            <span>{text.moderate}</span>
            <span>{text.heavyMismatch}</span>
          </div>
        </div>

        {filteredMatches.length === 0 ? (
          <div className="text-center py-20">
            <Search className="w-16 h-16 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-slate-500 dark:text-slate-400">{text.noMatches}</h3>
            <p className="text-slate-400 dark:text-slate-500">{text.tryAdjusting}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            <AnimatePresence mode="popLayout">
              {filteredMatches.map(match => {
                const matchId = `${match.team1}_${match.team2}`;
                const isFav = favorites.includes(matchId);
                const prob = calcWinProb(match.elo1, match.elo2);
                const edge = getEdgeInfo(match.diff);
                const w1 = ((match.elo1 / (match.elo1 + match.elo2)) * 100).toFixed(1);
                const w2 = ((match.elo2 / (match.elo1 + match.elo2)) * 100).toFixed(1);

                return (
                  <motion.div 
                    layout
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    key={matchId} 
                    className={`p-5 transition hover:-translate-y-1 hover:shadow-xl dark:shadow-none dark:hover:shadow-lg dark:hover:shadow-black/40 ${cardClass}`}
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                        <span className="bg-gradient-to-r from-blue-500 to-purple-500 px-2 py-1 rounded-lg text-xs font-bold text-white shadow-sm w-fit">
                          {text.group} {match.group}
                        </span>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">{translateDate(match.date, lang).split(' ').slice(0,3).join(' ')} &middot; {match.time}</span>
                          <Countdown dateStr={match.date} timeStr={match.time} lang={lang} />
                        </div>
                      </div>
                      <button onClick={() => toggleFav(matchId)} className="focus:outline-none transition-transform hover:scale-110 shrink-0 ml-2">
                        <Star className={isFav ? "text-yellow-500 fill-yellow-500 drop-shadow-sm" : "text-slate-300 dark:text-slate-600"} size={20} />
                      </button>
                    </div>

                    <div className="flex items-center justify-between mb-4">
                      <div className="flex-1 text-center">
                        <img 
                          src={`https://flagcdn.com/w80/${flagMap[match.team1]}.png`} 
                          alt={match.team1} 
                          className="w-12 h-8 object-cover rounded shadow-md mx-auto mb-2" 
                        />
                        <div className="font-bold text-sm tracking-tight text-slate-800 dark:text-slate-200 leading-tight h-8 flex items-center justify-center">{match.team1}</div>
                        <div className="text-2xl font-extrabold text-blue-600 dark:text-blue-400">{match.elo1}</div>
                      </div>

                      <div className="px-2 text-center flex flex-col items-center">
                        <div className="text-xs font-bold text-slate-400 dark:text-slate-500 mb-1">VS</div>
                        <div className={`px-3 py-1 rounded-full text-xs font-bold shadow-sm ${edge.color}`}>
                          {match.diff} {text.diffLabel}
                        </div>
                        <div className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 mt-2">{edge.label}</div>
                      </div>

                      <div className="flex-1 text-center">
                        <img 
                          src={`https://flagcdn.com/w80/${flagMap[match.team2]}.png`} 
                          alt={match.team2} 
                          className="w-12 h-8 object-cover rounded shadow-md mx-auto mb-2" 
                        />
                        <div className="font-bold text-sm tracking-tight text-slate-800 dark:text-slate-200 leading-tight h-8 flex items-center justify-center">{match.team2}</div>
                        <div className="text-2xl font-extrabold text-purple-600 dark:text-purple-400">{match.elo2}</div>
                      </div>
                    </div>

                    <div className="mb-3 px-2">
                       <div className="flex h-2.5 rounded-full overflow-hidden bg-slate-200 dark:bg-slate-700 shadow-inner">
                          <div className={getEloColor(match.elo1)} style={{width: `${w1}%`}} />
                          <div className={getEloColor(match.elo2)} style={{width: `${w2}%`}} />
                       </div>
                       <div className="flex justify-between text-[11px] mt-1.5 font-bold">
                         <span className="text-blue-600 dark:text-blue-400">{prob[0]}%</span>
                         <span className="text-purple-600 dark:text-purple-400">{prob[1]}%</span>
                       </div>
                    </div>
                    
                    <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 mt-4 px-2">
                       <MapPin size={14} className="text-slate-400" /> 
                       <span className="line-clamp-1" title={match.stadium}>{match.stadium}</span>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </main>
    </div>
  );
}
