import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { MapPin, Calendar, Tag, QrCode, Sparkles, User, ShieldCheck, ArrowLeft } from 'lucide-react';
import api from '../api/client';
import QRModal from '../components/QRModal';
import ConfidenceMeter from '../components/ConfidenceMeter';

export default function ItemDetails() {
  const { id } = useParams();
  const [item, setItem] = useState(null);
  const [candidateMatches, setCandidateMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [showQr, setShowQr] = useState(false);

  useEffect(() => {
    fetchItemDetails();
  }, [id]);

  const fetchItemDetails = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/api/items/${id}`);
      setItem(res.data);
    } catch (e) {
      console.log('Error fetching item:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleRunAiSearch = async () => {
    setSearching(true);
    try {
      const res = await api.post(`/api/matches/run-search/${id}`);
      setCandidateMatches(res.data || []);
    } catch (e) {
      console.log('Error running AI search:', e);
    } finally {
      setSearching(false);
    }
  };

  if (loading) {
    return <div className="p-12 text-center text-slate-400 text-sm">Loading record...</div>;
  }

  if (!item) {
    return <div className="p-12 text-center text-rose-500 font-bold">Item record not found</div>;
  }

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-8">
      <Link to="/" className="inline-flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition-colors">
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Dashboard</span>
      </Link>

      <div className="glass-card rounded-3xl p-8 space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Image */}
          <div className="space-y-4">
            <div className="h-80 rounded-2xl overflow-hidden bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
              <img
                src={item.image_urls?.[0] || 'https://images.unsplash.com/photo-1584438784894-089d6a62b8fa?w=600&auto=format&fit=crop&q=60'}
                alt={item.name}
                className="w-full h-full object-cover"
              />
            </div>
            
            <button
              onClick={() => setShowQr(true)}
              className="w-full py-3 px-4 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 font-bold text-xs text-slate-700 dark:text-slate-200 flex items-center justify-center gap-2 transition-colors"
            >
              <QrCode className="w-4 h-4 text-blue-500" />
              <span>Show QR Ownership Code</span>
            </button>
          </div>

          {/* Attributes */}
          <div className="space-y-6">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className={`text-[10px] px-3 py-1 rounded-full font-bold uppercase ${
                  item.type === 'lost' ? 'bg-amber-500 text-slate-950' : 'bg-emerald-500 text-white'
                }`}>
                  {item.type} Item
                </span>
                <span className="text-xs px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold">
                  Status: {item.status}
                </span>
              </div>

              <h1 className="text-2xl font-extrabold text-slate-900 dark:text-slate-100">{item.name}</h1>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Category: {item.category}</p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 space-y-3 text-xs">
              <p className="text-slate-700 dark:text-slate-300 leading-relaxed">{item.description}</p>
              
              <div className="grid grid-cols-2 gap-2 pt-3 border-t border-slate-200 dark:border-slate-700/60 font-medium text-slate-500 dark:text-slate-400">
                <div>Color: <span className="font-bold text-slate-800 dark:text-slate-200">{item.color || 'N/A'}</span></div>
                <div>Brand: <span className="font-bold text-slate-800 dark:text-slate-200">{item.brand || 'N/A'}</span></div>
                <div>Location: <span className="font-bold text-slate-800 dark:text-slate-200">{item.location}</span></div>
                <div>Date: <span className="font-bold text-slate-800 dark:text-slate-200">{item.date_lost_found}</span></div>
              </div>
            </div>

            <button
              onClick={handleRunAiSearch}
              disabled={searching}
              className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-extrabold text-sm shadow-lg shadow-blue-600/30 flex items-center justify-center gap-2 transition-all"
            >
              <Sparkles className="w-4 h-4" />
              <span>{searching ? 'Calculating Vector Distances...' : 'Run Real-time AI Match Search'}</span>
            </button>
          </div>
        </div>

        {/* Candidate AI Matches List */}
        {candidateMatches.length > 0 && (
          <div className="pt-8 border-t border-slate-200 dark:border-slate-800 space-y-6">
            <h3 className="font-extrabold text-lg text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-blue-500" />
              <span>AI Search Candidates ({candidateMatches.length})</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {candidateMatches.map(match => (
                <ConfidenceMeter key={match.id} match={match} />
              ))}
            </div>
          </div>
        )}
      </div>

      {showQr && <QRModal item={item} onClose={() => setShowQr(false)} />}
    </div>
  );
}
