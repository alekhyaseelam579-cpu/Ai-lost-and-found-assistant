import React from 'react';
import { Sparkles, CheckCircle2, AlertTriangle } from 'lucide-react';

export default function ConfidenceMeter({ match }) {
  const score = match.final_score || 0;
  
  let scoreColor = 'from-emerald-500 to-teal-600';
  let badgeBg = 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400';
  let statusText = 'Very High Match';

  if (score < 60) {
    scoreColor = 'from-amber-500 to-orange-600';
    badgeBg = 'bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-400';
    statusText = 'Moderate Match';
  } else if (score >= 80) {
    scoreColor = 'from-blue-600 to-indigo-600';
    badgeBg = 'bg-blue-100 text-blue-700 dark:bg-blue-950/50 dark:text-blue-400';
    statusText = 'High Confidence AI Match';
  }

  const factors = [
    { label: 'Text Semantic Sim', value: Math.round((match.text_sim || 0) * 100), weight: '45%' },
    { label: 'Image Features Sim', value: Math.round((match.image_sim || 0) * 100), weight: '30%' },
    { label: 'Category Match', value: Math.round((match.category_match || 0) * 100), weight: '10%' },
    { label: 'Location Match', value: Math.round((match.location_match || 0) * 100), weight: '5%' },
    { label: 'Brand Match', value: Math.round((match.brand_match || 0) * 100), weight: '5%' },
    { label: 'Color Match', value: Math.round((match.color_match || 0) * 100), weight: '5%' },
  ];

  return (
    <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/80 space-y-4">
      {/* Overall Score Meter */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-blue-500" />
          <span className="font-bold text-sm text-slate-800 dark:text-slate-200">AI Confidence Score</span>
        </div>
        <span className={`text-xs px-2.5 py-1 rounded-full font-bold uppercase tracking-wider ${badgeBg}`}>
          {statusText}
        </span>
      </div>

      <div className="space-y-1.5">
        <div className="flex items-baseline justify-between text-xs font-semibold">
          <span className="text-slate-500 dark:text-slate-400">Match Percentage</span>
          <span className="text-xl font-extrabold text-slate-800 dark:text-slate-100">{score}%</span>
        </div>
        <div className="w-full h-3 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden p-0.5">
          <div
            className={`h-full rounded-full bg-gradient-to-r ${scoreColor} transition-all duration-1000 ease-out`}
            style={{ width: `${Math.min(100, Math.max(5, score))}%` }}
          />
        </div>
      </div>

      {/* 6-Factor Weights Grid */}
      <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-200 dark:border-slate-700/60 text-xs">
        {factors.map((f, i) => (
          <div key={i} className="flex flex-col justify-between p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800">
            <div className="flex justify-between text-[11px] text-slate-500 dark:text-slate-400">
              <span className="truncate">{f.label}</span>
              <span className="font-mono text-[10px] text-slate-400">{f.weight}</span>
            </div>
            <span className="font-bold text-slate-800 dark:text-slate-200 mt-1">{f.value}%</span>
          </div>
        ))}
      </div>

      {/* AI Explanation Callout */}
      {match.ai_explanation && (
        <div className="p-3 rounded-xl bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200/60 dark:border-blue-900/50 text-xs text-blue-900 dark:text-blue-200">
          <p className="font-semibold mb-0.5 flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-blue-500" />
            AI Match Reasoning
          </p>
          <p className="leading-relaxed opacity-90">{match.ai_explanation}</p>
        </div>
      )}
    </div>
  );
}
