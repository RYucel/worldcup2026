import { useState, useEffect } from 'react';
import { translations, Language } from '../i18n';
import { Clock } from 'lucide-react';

interface Props {
  dateStr: string;
  timeStr: string;
  lang: Language;
}

// Map textual months to zero-based numbers
const months: Record<string, number> = {
  'June': 5,
  'July': 6,
  'Haziran': 5,
  'Temmuz': 6
};

function getMatchDate(dateStr: string, timeStr: string) {
  // Typical dateStr: "Thursday 11 June 2026" or "Perşembe 11 Haziran 2026"
  const parts = dateStr.split(' ');
  if (parts.length >= 4) {
    const day = parseInt(parts[1], 10);
    const month = months[parts[2]] ?? 5;
    const year = parseInt(parts[3], 10);
    
    // timeStr: "22:00"
    const [h, m] = timeStr.split(':').map(Number);
    
    // For World Cup matches, assuming UTC-4 or similar, but for simplicity let's use the local time or construct an absolute UTC time. 
    // Since World Cup is in North America, we'll assign it UTC time for consistency if users are around the world,
    // or just assume the string is local to the user if we do `new Date(year, month, day, h, m)`.
    // Let's create a UTC date and assume the schedules provided are in UTC for now to have a unified countdown.
    return new Date(Date.UTC(year, month, day, h, m));
  }
  return new Date();
}

export default function Countdown({ dateStr, timeStr, lang }: Props) {
  const text = translations[lang];
  const [timeLeft, setTimeLeft] = useState<{ d: number, h: number, m: number, s: number } | null>(null);

  useEffect(() => {
    const matchDate = getMatchDate(dateStr, timeStr);
    
    const update = () => {
      const now = new Date().getTime();
      const distance = matchDate.getTime() - now;

      if (distance <= 0) {
        setTimeLeft({ d: 0, h: 0, m: 0, s: 0 });
        return;
      }

      const d = Math.floor(distance / (1000 * 60 * 60 * 24));
      const h = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const m = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
      const s = Math.floor((distance % (1000 * 60)) / 1000);

      setTimeLeft({ d, h, m, s });
    };

    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [dateStr, timeStr]);

  if (!timeLeft) return null;

  if (timeLeft.d === 0 && timeLeft.h === 0 && timeLeft.m === 0 && timeLeft.s === 0) {
    return (
      <div className="flex items-center gap-1.5 text-[10px] font-bold text-rose-500 bg-rose-50 dark:bg-rose-500/10 px-2 py-1 rounded-md border border-rose-100 dark:border-rose-500/20 w-fit">
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
        </span>
        {text.live}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1.5 text-[10px] sm:text-xs font-bold text-sky-600 dark:text-sky-400 bg-sky-50 dark:bg-sky-500/10 px-2 py-1 rounded-md border border-sky-100 dark:border-sky-500/20 w-fit mt-1 sm:mt-0">
      <Clock size={12} className="shrink-0" />
      <span className="tabular-nums tracking-wide">
        {timeLeft.d > 0 && `${timeLeft.d}${text.days} `}
        {String(timeLeft.h).padStart(2, '0')}{text.hours} {String(timeLeft.m).padStart(2, '0')}{text.mins}
      </span>
    </div>
  );
}
