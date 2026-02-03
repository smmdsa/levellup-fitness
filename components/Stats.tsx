import React from 'react';
import { AnalyticsData, UserStats } from '../types';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { TrendingUp, Activity, Calendar } from 'lucide-react';

interface StatsProps {
  analytics: AnalyticsData;
  userStats: UserStats;
  sessionsPerDay: number;
}

export const Stats: React.FC<StatsProps> = ({ analytics, userStats, sessionsPerDay }) => {
  // Prepare data for the chart (Last 7 entries)
  const chartData = analytics.history.slice(-7).map(entry => ({
    name: new Date(entry.date).toLocaleDateString(undefined, { weekday: 'short' }),
    sessions: entry.sessionsDone,
  }));

  return (
    <div className="pb-24 pt-6 px-4 max-w-md mx-auto min-h-screen">
      <h1 className="text-2xl font-bold text-white mb-6">Battle Report</h1>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 gap-4 mb-8">
        <div className="bg-slate-800 p-4 rounded-xl border border-slate-700">
          <div className="flex items-center space-x-2 text-indigo-400 mb-2">
            <TrendingUp size={18} />
            <span className="text-xs font-bold uppercase">Total XP</span>
          </div>
          <p className="text-2xl font-bold text-white">{userStats.totalXP.toLocaleString()}</p>
        </div>
        <div className="bg-slate-800 p-4 rounded-xl border border-slate-700">
          <div className="flex items-center space-x-2 text-green-400 mb-2">
            <Calendar size={18} />
            <span className="text-xs font-bold uppercase">Total Days</span>
          </div>
          <p className="text-2xl font-bold text-white">{analytics.history.length}</p>
        </div>
        <div className="col-span-2 bg-slate-800 p-4 rounded-xl border border-slate-700">
           <div className="flex items-center space-x-2 text-orange-400 mb-2">
            <Activity size={18} />
            <span className="text-xs font-bold uppercase">Muscle Distribution (Reps)</span>
          </div>
          <div className="grid grid-cols-4 gap-2 text-center mt-2">
            <div>
              <div className="text-xs text-slate-400">Push</div>
              <div className="font-bold text-slate-200">{analytics.totalReps.push}</div>
            </div>
            <div>
              <div className="text-xs text-slate-400">Pull</div>
              <div className="font-bold text-slate-200">{analytics.totalReps.pull}</div>
            </div>
            <div>
              <div className="text-xs text-slate-400">Core</div>
              <div className="font-bold text-slate-200">{analytics.totalReps.core}</div>
            </div>
            <div>
              <div className="text-xs text-slate-400">Legs</div>
              <div className="font-bold text-slate-200">{analytics.totalReps.legs}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Chart */}
      <div className="bg-slate-800 p-4 rounded-xl border border-slate-700 h-64 mb-8">
        <h3 className="text-sm font-bold text-slate-300 mb-4">Recent Intensity</h3>
        {chartData.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center px-4">
            <p className="text-slate-300 font-semibold">No data yet</p>
            <p className="text-xs text-slate-400 mt-2">Arranca tu primera sesión y comienza a construir tu racha.</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={200}>
            <BarChart data={chartData}>
              <XAxis 
                dataKey="name" 
                stroke="#64748b" 
                fontSize={12} 
                tickLine={false}
                axisLine={false}
              />
              <YAxis hide domain={[0, sessionsPerDay]} />
              <Tooltip 
                cursor={{fill: '#334155', opacity: 0.4}}
                contentStyle={{ backgroundColor: '#1e293b', borderColor: '#475569', color: '#f8fafc' }}
              />
              <Bar dataKey="sessions" radius={[4, 4, 0, 0]}>
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.sessions >= sessionsPerDay ? '#22c55e' : '#6366f1'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
};
