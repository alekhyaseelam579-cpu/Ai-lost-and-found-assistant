import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  FileText, 
  Sparkles, 
  CheckCircle, 
  TrendingUp, 
  Plus, 
  Search, 
  ArrowRight, 
  Calendar, 
  MapPin, 
  Tag, 
  QrCode,
  ShieldAlert
} from 'lucide-react';
import api from '../api/client';
import QRModal from '../components/QRModal';

export default function Dashboard({ searchQuery }) {
  const [items, setItems] = useState([]);
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedQrItem, setSelectedQrItem] = useState(null);

  useEffect(() => {
    fetchDashboardData();
  }, [searchQuery]);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const itemsRes = await api.get('/api/items', { params: { search: searchQuery } });
      const matchesRes = await api.get('/api/matches');
      setItems(itemsRes.data.items || []);
      setMatches(matchesRes.data || []);
    } catch (e) {
      console.log('Error fetching dashboard data:', e);
    } finally {
      setLoading(false);
    }
  };

  const lostItems = items.filter(it => it.type === 'lost');
  const foundItems = items.filter(it => it.type === 'found');
  const highConfidenceMatches = matches.filter(m => m.final_score >= 70);

  const stats = [
    { label: 'Lost Items Reported', value: lostItems.length, icon: FileText, color: 'from-amber-500 to-orange-600', text: 'text-amber-600' },
    { label: 'Found Items Logged', value: foundItems.length, icon: CheckCircle, color: 'from-emerald-500 to-teal-600', text: 'text-emerald-600' },
    { label: 'AI Matches Found', value: matches.length, icon: Sparkles, color: 'from-blue-600 to-indigo-600', text: 'text-blue-600' },
    { label: 'Recovery Rate', value: '88.5%', icon: TrendingUp, color: 'from-purple-600 to-pink-600', text: 'text-purple-600' },
  ];

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-blue-950 via-slate-900 to-indigo-950 p-8 rounded-3xl text-white shadow-2xl border border-slate-800 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="space-y-2 relative z-10">
          <span className="text-xs font-bold px-3 py-1 rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/30 uppercase tracking-wider">
            AI-Powered Recovery Hub
          </span>
          <h1 className="text-3xl font-extrabold tracking-tight">AI Lost & Found Dashboard</h1>
          <p className="text-slate-400 text-sm max-w-xl">
            Real-time multimodal similarity search combining 6-factor text & visual embeddings to help locate lost items.
          </p>
        </div>

        <div className="flex items-center gap-3 relative z-10">
          <Link
            to="/report-lost"
            className="py-3 px-5 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-sm shadow-lg shadow-amber-500/20 flex items-center gap-2 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Report Lost</span>
          </Link>
          <Link
            to="/report-found"
            className="py-3 px-5 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-extrabold text-sm shadow-lg shadow-blue-600/30 flex items-center gap-2 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Report Found</span>
          </Link>
        </div>
      </div>

      {/* Metrics Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {stats.map((s, i) => {
          const Icon = s.icon;
          return (
            <div key={i} className="glass-card p-6 rounded-3xl space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{s.label}</span>
                <div className={`w-10 h-10 rounded-2xl bg-gradient-to-tr ${s.color} flex items-center justify-center text-white shadow-lg`}>
                  <Icon className="w-5 h-5" />
                </div>
              </div>
              <p className="text-3xl font-extrabold text-slate-900 dark:text-slate-100">{s.value}</p>
            </div>
          );
        })}
      </div>

      {/* High Confidence AI Alert Banner */}
      {highConfidenceMatches.length > 0 && (
        <div className="p-6 rounded-3xl bg-gradient-to-r from-blue-900/40 via-indigo-900/30 to-purple-900/40 border border-blue-500/40 flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white flex items-center justify-center flex-shrink-0 shadow-lg shadow-blue-600/30">
              <Sparkles className="w-6 h-6 animate-spin-slow" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 dark:text-slate-100 text-base">
                {highConfidenceMatches.length} High Confidence AI Matches Ready!
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5">
                Our AI model has detected matching features between your reported records.
              </p>
            </div>
          </div>
          <Link
            to="/matches"
            className="py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-md flex items-center gap-2 transition-all flex-shrink-0"
          >
            <span>Review Matches</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      )}

      {/* Main Items Listing Grid */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">Recent Reported Items</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">All lost & found records on campus</p>
          </div>
          <Link to="/items" className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1">
            <span>View All ({items.length})</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {loading ? (
          <div className="p-12 text-center text-slate-400 text-sm">Loading records...</div>
        ) : items.length === 0 ? (
          <div className="glass-card p-12 rounded-3xl text-center space-y-3">
            <ShieldAlert className="w-10 h-10 text-slate-400 mx-auto" />
            <p className="text-sm font-semibold text-slate-600 dark:text-slate-300">No items reported matching criteria</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {items.map((item) => (
              <div key={item.id} className="glass-card-hover rounded-3xl overflow-hidden flex flex-col justify-between">
                <div>
                  {/* Image Container */}
                  <div className="h-48 relative overflow-hidden bg-slate-200 dark:bg-slate-800">
                    <img
                      src={item.image_urls?.[0] || 'https://images.unsplash.com/photo-1584438784894-089d6a62b8fa?w=600&auto=format&fit=crop&q=60'}
                      alt={item.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute top-3 left-3 flex gap-2">
                      <span className={`text-[10px] px-3 py-1 rounded-full font-bold uppercase tracking-wider ${
                        item.type === 'lost'
                          ? 'bg-amber-500 text-slate-950 shadow-md'
                          : 'bg-emerald-500 text-white shadow-md'
                      }`}>
                        {item.type}
                      </span>
                    </div>

                    <div className="absolute top-3 right-3">
                      <span className={`text-[10px] px-2.5 py-1 rounded-full font-bold uppercase ${
                        item.status === 'returned'
                          ? 'bg-purple-600 text-white'
                          : item.status === 'matched'
                          ? 'bg-blue-600 text-white'
                          : 'bg-slate-900/80 backdrop-blur-md text-slate-200'
                      }`}>
                        {item.status}
                      </span>
                    </div>
                  </div>

                  {/* Card Content */}
                  <div className="p-5 space-y-3">
                    <div className="flex items-center gap-2 text-xs font-semibold text-blue-600 dark:text-blue-400">
                      <Tag className="w-3.5 h-3.5" />
                      <span>{item.category}</span>
                      {item.brand && <span className="text-slate-400">• {item.brand}</span>}
                    </div>

                    <h3 className="font-bold text-slate-900 dark:text-slate-100 text-base line-clamp-1">
                      {item.name}
                    </h3>

                    <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                      {item.description}
                    </p>

                    <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 space-y-1.5 text-xs text-slate-600 dark:text-slate-400">
                      <div className="flex items-center gap-2">
                        <MapPin className="w-3.5 h-3.5 text-slate-400" />
                        <span className="truncate">{item.location}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        <span>{item.date_lost_found}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Card Footer Actions */}
                <div className="p-5 pt-0 flex items-center justify-between gap-2">
                  <button
                    onClick={() => setSelectedQrItem(item)}
                    className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors"
                    title="View QR Verification Code"
                  >
                    <QrCode className="w-4 h-4" />
                  </button>

                  <Link
                    to={`/items/${item.id}`}
                    className="flex-1 py-2 px-3 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-blue-600 hover:text-white dark:hover:bg-blue-600 text-xs font-bold text-slate-700 dark:text-slate-200 text-center transition-colors"
                  >
                    Details & AI Match
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* QR Code Verification Modal */}
      {selectedQrItem && (
        <QRModal item={selectedQrItem} onClose={() => setSelectedQrItem(null)} />
      )}
    </div>
  );
}
