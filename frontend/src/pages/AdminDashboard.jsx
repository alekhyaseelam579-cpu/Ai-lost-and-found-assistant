import React, { useState, useEffect } from 'react';
import { 
  BarChart2, 
  Users, 
  FileText, 
  CheckCircle, 
  RotateCcw, 
  Trash2, 
  ShieldCheck, 
  Activity, 
  TrendingUp, 
  Sparkles 
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  Tooltip, 
  BarChart, 
  Bar 
} from 'recharts';
import api from '../api/client';

export default function AdminDashboard() {
  const [analytics, setAnalytics] = useState(null);
  const [users, setUsers] = useState([]);
  const [items, setItems] = useState([]);
  const [activityLogs, setActivityLogs] = useState([]);
  const [activeTab, setActiveTab] = useState('analytics');
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetchAdminData();
  }, []);

  const fetchAdminData = async () => {
    setLoading(true);
    try {
      const [analyticsRes, usersRes, itemsRes, logsRes] = await Promise.all([
        api.get('/api/admin/analytics'),
        api.get('/api/admin/users'),
        api.get('/api/admin/items'),
        api.get('/api/admin/activity-logs'),
      ]);

      setAnalytics(analyticsRes.data);
      setUsers(usersRes.data || []);
      setItems(itemsRes.data || []);
      setActivityLogs(logsRes.data || []);
    } catch (e) {
      console.log('Error fetching admin data:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkReturned = async (itemId) => {
    try {
      await api.put(`/api/admin/items/${itemId}/returned`);
      setMessage('Item marked as returned to owner successfully.');
      fetchAdminData();
      setTimeout(() => setMessage(''), 4000);
    } catch (e) {
      console.log('Error marking returned:', e);
    }
  };

  const handleDeleteItem = async (itemId) => {
    if (!window.confirm('Are you sure you want to delete this item record?')) return;
    try {
      await api.delete(`/api/admin/items/${itemId}`);
      setMessage('Item record removed from system.');
      fetchAdminData();
      setTimeout(() => setMessage(''), 4000);
    } catch (e) {
      console.log('Error deleting item:', e);
    }
  };

  if (loading) {
    return <div className="p-12 text-center text-slate-400 text-sm">Loading Admin Console...</div>;
  }

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-purple-950 via-slate-900 to-slate-950 p-8 rounded-3xl text-white shadow-2xl border border-purple-900/40 relative overflow-hidden">
        <div className="space-y-2 relative z-10">
          <span className="text-xs font-bold px-3 py-1 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30 uppercase tracking-wider flex items-center gap-1.5 w-fit">
            <ShieldCheck className="w-3.5 h-3.5" /> Admin Office Control Console
          </span>
          <h1 className="text-3xl font-extrabold tracking-tight">System Operations & Analytics</h1>
          <p className="text-slate-400 text-sm">
            Monitor active cases, approve AI match candidate pairs, manage users, and review activity logs.
          </p>
        </div>
      </div>

      {message && (
        <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/60 text-emerald-700 dark:text-emerald-300 text-xs font-semibold">
          {message}
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-4">
        <button
          onClick={() => setActiveTab('analytics')}
          className={`py-2 px-4 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'analytics'
              ? 'bg-purple-600 text-white shadow-md'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          Analytics & Metrics
        </button>
        <button
          onClick={() => setActiveTab('items')}
          className={`py-2 px-4 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'items'
              ? 'bg-purple-600 text-white shadow-md'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          All Items ({items.length})
        </button>
        <button
          onClick={() => setActiveTab('users')}
          className={`py-2 px-4 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'users'
              ? 'bg-purple-600 text-white shadow-md'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          User Accounts ({users.length})
        </button>
        <button
          onClick={() => setActiveTab('logs')}
          className={`py-2 px-4 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'logs'
              ? 'bg-purple-600 text-white shadow-md'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          Audit Logs
        </button>
      </div>

      {/* Tab 1: Analytics & Recharts Graphs */}
      {activeTab === 'analytics' && analytics && (
        <div className="space-y-8">
          {/* Key KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            <div className="glass-card p-5 rounded-3xl space-y-2">
              <span className="text-xs font-bold text-slate-400 uppercase">Total System Records</span>
              <p className="text-3xl font-extrabold text-slate-900 dark:text-slate-100">{analytics.total_items}</p>
              <p className="text-xs text-slate-500">Lost: {analytics.total_lost} | Found: {analytics.total_found}</p>
            </div>
            <div className="glass-card p-5 rounded-3xl space-y-2">
              <span className="text-xs font-bold text-slate-400 uppercase">AI Matches Found</span>
              <p className="text-3xl font-extrabold text-blue-600 dark:text-blue-400">{analytics.total_matches}</p>
              <p className="text-xs text-slate-500">Approved: {analytics.approved_matches}</p>
            </div>
            <div className="glass-card p-5 rounded-3xl space-y-2">
              <span className="text-xs font-bold text-slate-400 uppercase">Items Returned</span>
              <p className="text-3xl font-extrabold text-emerald-600 dark:text-emerald-400">{analytics.returned_items}</p>
              <p className="text-xs text-slate-500">Avg Recovery: {analytics.avg_recovery_days} days</p>
            </div>
            <div className="glass-card p-5 rounded-3xl space-y-2">
              <span className="text-xs font-bold text-slate-400 uppercase">Recovery Rate</span>
              <p className="text-3xl font-extrabold text-purple-600 dark:text-purple-400">{analytics.recovery_rate}%</p>
              <p className="text-xs text-slate-500">High Confidence Engine</p>
            </div>
          </div>

          {/* Graphs Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Daily Report Activity Area Chart */}
            <div className="glass-card p-6 rounded-3xl space-y-4">
              <h3 className="font-bold text-sm text-slate-800 dark:text-slate-200 flex items-center gap-2">
                <BarChart2 className="w-4 h-4 text-purple-500" />
                <span>Weekly Item Velocity</span>
              </h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={analytics.daily_reports}>
                    <XAxis dataKey="day" stroke="#888888" fontSize={11} />
                    <YAxis stroke="#888888" fontSize={11} />
                    <Tooltip />
                    <Area type="monotone" dataKey="lost" stroke="#f59e0b" fill="#f59e0b" fillOpacity={0.2} name="Lost Reported" />
                    <Area type="monotone" dataKey="found" stroke="#10b981" fill="#10b981" fillOpacity={0.2} name="Found Logged" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Top Categories Bar Chart */}
            <div className="glass-card p-6 rounded-3xl space-y-4">
              <h3 className="font-bold text-sm text-slate-800 dark:text-slate-200 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-blue-500" />
                <span>Top Lost Categories</span>
              </h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={analytics.top_categories}>
                    <XAxis dataKey="category" stroke="#888888" fontSize={11} />
                    <YAxis stroke="#888888" fontSize={11} />
                    <Tooltip />
                    <Bar dataKey="count" fill="#3b82f6" radius={[6, 6, 0, 0]} name="Report Count" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: All Items Management */}
      {activeTab === 'items' && (
        <div className="glass-card rounded-3xl overflow-hidden border border-slate-200 dark:border-slate-800">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100 dark:bg-slate-800/80 text-slate-500 dark:text-slate-400 font-bold uppercase">
              <tr>
                <th className="p-4">Item Name</th>
                <th className="p-4">Type</th>
                <th className="p-4">Category</th>
                <th className="p-4">Location</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {items.map(it => (
                <tr key={it.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                  <td className="p-4 font-bold text-slate-900 dark:text-slate-100">{it.name}</td>
                  <td className="p-4">
                    <span className={`px-2.5 py-0.5 rounded-full font-bold uppercase ${
                      it.type === 'lost' ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300' : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                    }`}>
                      {it.type}
                    </span>
                  </td>
                  <td className="p-4 text-slate-600 dark:text-slate-300">{it.category}</td>
                  <td className="p-4 text-slate-600 dark:text-slate-300">{it.location}</td>
                  <td className="p-4 font-bold">{it.status}</td>
                  <td className="p-4 text-right space-x-2">
                    {it.status !== 'returned' && (
                      <button
                        onClick={() => handleMarkReturned(it.id)}
                        className="py-1 px-3 rounded-lg bg-emerald-600 text-white font-bold hover:bg-emerald-500 transition-colors"
                      >
                        Mark Returned
                      </button>
                    )}
                    <button
                      onClick={() => handleDeleteItem(it.id)}
                      className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition-colors"
                      title="Delete Item"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Tab 3: Users */}
      {activeTab === 'users' && (
        <div className="glass-card rounded-3xl overflow-hidden border border-slate-200 dark:border-slate-800">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100 dark:bg-slate-800/80 text-slate-500 dark:text-slate-400 font-bold uppercase">
              <tr>
                <th className="p-4">User</th>
                <th className="p-4">Email</th>
                <th className="p-4">Role</th>
                <th className="p-4">Verified</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {users.map(u => (
                <tr key={u.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                  <td className="p-4 font-bold flex items-center gap-2 text-slate-900 dark:text-slate-100">
                    <img src={u.avatar_url} alt="" className="w-6 h-6 rounded-full bg-white border" />
                    <span>{u.full_name}</span>
                  </td>
                  <td className="p-4 text-slate-600 dark:text-slate-300">{u.email}</td>
                  <td className="p-4 font-bold uppercase">{u.role}</td>
                  <td className="p-4 text-emerald-500 font-bold">Yes</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Tab 4: Activity Logs */}
      {activeTab === 'logs' && (
        <div className="glass-card rounded-3xl p-6 space-y-4">
          <h3 className="font-bold text-sm text-slate-800 dark:text-slate-200 flex items-center gap-2">
            <Activity className="w-4 h-4 text-purple-500" />
            <span>Recent System Activity Audit Logs</span>
          </h3>

          <div className="space-y-2">
            {activityLogs.map(log => (
              <div key={log.id} className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60 flex items-center justify-between text-xs">
                <div>
                  <span className="font-bold text-purple-600 dark:text-purple-400 mr-2">[{log.action}]</span>
                  <span className="text-slate-700 dark:text-slate-300">{log.details}</span>
                </div>
                <span className="text-[10px] text-slate-400 font-mono">
                  {new Date(log.timestamp).toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
