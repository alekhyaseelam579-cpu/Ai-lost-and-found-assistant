import React, { useState, useEffect } from 'react';
import { Sparkles, ArrowRightLeft, Check, X, ShieldCheck, Tag, MapPin, Calendar, CheckCircle2 } from 'lucide-react';
import api from '../api/client';
import ConfidenceMeter from '../components/ConfidenceMeter';

export default function Matches() {
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedMatch, setSelectedMatch] = useState(null);
  const [actionSuccess, setActionSuccess] = useState('');

  useEffect(() => {
    fetchMatches();
  }, []);

  const fetchMatches = async () => {
    setLoading(true);
    try {
      const res = await api.get('/api/matches');
      setMatches(res.data || []);
    } catch (e) {
      console.log('Error fetching matches:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateMatchStatus = async (matchId, status) => {
    try {
      await api.put(`/api/matches/${matchId}/status`, { status });
      setMatches(prev => prev.map(m => m.id === matchId ? { ...m, status } : m));
      setActionSuccess(`Match request marked as ${status}.`);
      setTimeout(() => setActionSuccess(''), 4000);
    } catch (e) {
      console.log('Error updating match:', e);
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400 mb-1">
            <Sparkles className="w-4 h-4" />
            <span>AI Neural Similarity Engine</span>
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-slate-100">AI Match Radar</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Candidate lost & found record pairs ranked by 6-factor similarity score
          </p>
        </div>
      </div>

      {actionSuccess && (
        <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/60 text-emerald-700 dark:text-emerald-300 text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          <span>{actionSuccess}</span>
        </div>
      )}

      {loading ? (
        <div className="p-12 text-center text-slate-400 text-sm">Running AI Vector Search...</div>
      ) : matches.length === 0 ? (
        <div className="glass-card p-12 rounded-3xl text-center space-y-3">
          <Sparkles className="w-10 h-10 text-blue-500 mx-auto" />
          <h3 className="font-bold text-slate-800 dark:text-slate-200">No Candidate Matches Yet</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto leading-relaxed">
            Report a lost or found item to trigger automatic similarity matching against all campus records.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {matches.map((match) => {
            const lost = match.lost_item;
            const found = match.found_item;

            return (
              <div key={match.id} className="glass-card rounded-3xl p-6 space-y-6 flex flex-col justify-between">
                {/* Score Gauge */}
                <ConfidenceMeter match={match} />

                {/* Side by Side Comparative Preview */}
                <div className="grid grid-cols-2 gap-4">
                  {/* Lost Item Column */}
                  <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 space-y-2">
                    <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider">
                      Lost Item
                    </span>
                    <img
                      src={lost.image_urls?.[0] || 'https://images.unsplash.com/photo-1584438784894-089d6a62b8fa?w=600&auto=format&fit=crop&q=60'}
                      alt={lost.name}
                      className="w-full h-28 object-cover rounded-xl border border-slate-200 dark:border-slate-800"
                    />
                    <h4 className="font-bold text-xs text-slate-900 dark:text-slate-100 truncate">{lost.name}</h4>
                    <p className="text-[11px] text-slate-500 truncate">{lost.location}</p>
                  </div>

                  {/* Found Item Column */}
                  <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 space-y-2">
                    <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
                      Found Item
                    </span>
                    <img
                      src={found.image_urls?.[0] || 'https://images.unsplash.com/photo-1584438784894-089d6a62b8fa?w=600&auto=format&fit=crop&q=60'}
                      alt={found.name}
                      className="w-full h-28 object-cover rounded-xl border border-slate-200 dark:border-slate-800"
                    />
                    <h4 className="font-bold text-xs text-slate-900 dark:text-slate-100 truncate">{found.name}</h4>
                    <p className="text-[11px] text-slate-500 truncate">{found.location}</p>
                  </div>
                </div>

                {/* Match Action Buttons */}
                <div className="flex items-center justify-between gap-3 pt-2">
                  <span className={`text-xs px-3 py-1 rounded-full font-bold uppercase ${
                    match.status === 'approved'
                      ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                      : match.status === 'rejected'
                      ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300'
                      : 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                  }`}>
                    Status: {match.status}
                  </span>

                  {match.status === 'pending' && (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleUpdateMatchStatus(match.id, 'rejected')}
                        className="py-2 px-3 rounded-xl border border-rose-200 dark:border-rose-900 text-rose-600 dark:text-rose-400 hover:bg-rose-50 text-xs font-bold transition-colors"
                      >
                        Reject Match
                      </button>
                      <button
                        onClick={() => handleUpdateMatchStatus(match.id, 'approved')}
                        className="py-2 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md flex items-center gap-1.5 transition-all"
                      >
                        <Check className="w-4 h-4" />
                        <span>Confirm Match</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
