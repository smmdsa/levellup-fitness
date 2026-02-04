import React, { useMemo, useRef, useState, useEffect } from 'react';
import { AnalyticsData, User, UserStats, WeightEntry } from '../types';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
  LineChart,
  Line,
  CartesianGrid,
} from 'recharts';
import { TrendingUp, Activity, Calendar, Scale, Edit3 } from 'lucide-react';
import { getTodayKey } from '../services/dateService';

interface StatsProps {
  analytics: AnalyticsData;
  user: User;
  userStats: UserStats;
  sessionsPerDay: number;
  weightRewardCoins: number;
  onLogWeight: (payload: { date: string; weightKg: number; note?: string }) => void;
}

const formatShortDate = (dateStr: string) => {
  const date = new Date(`${dateStr}T00:00:00`);
  if (Number.isNaN(date.getTime())) {
    return dateStr;
  }

  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
};

const getWeekStartKey = (dateStr: string) => {
  const date = new Date(`${dateStr}T00:00:00`);
  if (Number.isNaN(date.getTime())) {
    return dateStr;
  }

  const day = (date.getDay() + 6) % 7;
  const monday = new Date(date);
  monday.setDate(date.getDate() - day);
  return monday.toISOString().slice(0, 10);
};

const getAgeFromBirthDate = (birthDate: string) => {
  const date = new Date(`${birthDate}T00:00:00`);
  if (Number.isNaN(date.getTime())) {
    return null;
  }

  const today = new Date();
  let age = today.getFullYear() - date.getFullYear();
  const monthDiff = today.getMonth() - date.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < date.getDate())) {
    age -= 1;
  }
  return age;
};

const getBmiCategory = (bmi: number) => {
  if (bmi < 18.5) return { label: 'Bajo peso', note: 'Prioriza nutricion y fuerza progresiva.' };
  if (bmi < 25) return { label: 'Normal', note: 'Buen rango. Enfocate en consistencia.' };
  if (bmi < 30) return { label: 'Sobrepeso', note: 'Combina fuerza + cardio con deficit moderado.' };
  return { label: 'Obesidad', note: 'Apoya con habitos diarios y seguimiento medico.' };
};

const getLatestEntry = (entries: WeightEntry[]) => {
  if (entries.length === 0) return null;
  return [...entries].sort((a, b) => a.date.localeCompare(b.date)).at(-1) ?? null;
};

export const Stats: React.FC<StatsProps> = ({
  analytics,
  user,
  userStats,
  sessionsPerDay,
  weightRewardCoins,
  onLogWeight,
}) => {
  // Prepare data for the chart (Last 7 entries)
  const chartData = analytics.history.slice(-7).map(entry => ({
    name: new Date(entry.date).toLocaleDateString(undefined, { weekday: 'short' }),
    sessions: entry.sessionsDone,
  }));

  const todayKey = getTodayKey(user.settings.dayStartHour, user.settings.timeZone);
  const weightEntries = analytics.weightEntries ?? [];
  const hasTodayWeight = weightEntries.some((entry) => entry.date === todayKey);
  const latestEntry = useMemo(() => getLatestEntry(weightEntries), [weightEntries]);
  const latestWeight = latestEntry?.weightKg ?? null;
  const heightCm = user.profile.heightCm;
  const bmi = latestWeight && heightCm ? latestWeight / Math.pow(heightCm / 100, 2) : null;
  const bmiCategory = bmi ? getBmiCategory(bmi) : null;
  const age = user.profile.birthDate ? getAgeFromBirthDate(user.profile.birthDate) : null;
  const sexFactor = user.profile.sex === 'male' ? 1 : user.profile.sex === 'female' ? 0 : null;
  const bodyFat = bmi !== null && age !== null && sexFactor !== null
    ? (1.2 * bmi) + (0.23 * age) - (10.8 * sexFactor) - 5.4
    : null;

  const [weightDate, setWeightDate] = useState(todayKey);
  const [weightValue, setWeightValue] = useState('');
  const [weightNote, setWeightNote] = useState('');
  const [weightError, setWeightError] = useState('');
  const [weightMode, setWeightMode] = useState<'daily' | 'weekly'>('daily');
  const weightInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setWeightDate(todayKey);
  }, [todayKey]);

  const weightChartData = useMemo(() => {
    const sorted = [...weightEntries].sort((a, b) => a.date.localeCompare(b.date));
    if (weightMode === 'weekly') {
      const weekly = new Map<string, { total: number; count: number }>();
      sorted.forEach((entry) => {
        const weekKey = getWeekStartKey(entry.date);
        const current = weekly.get(weekKey) ?? { total: 0, count: 0 };
        weekly.set(weekKey, { total: current.total + entry.weightKg, count: current.count + 1 });
      });
      return Array.from(weekly.entries())
        .sort(([a], [b]) => a.localeCompare(b))
        .slice(-8)
        .map(([weekKey, value]) => ({
          name: formatShortDate(weekKey),
          weight: Number((value.total / value.count).toFixed(1)),
        }));
    }

    return sorted.slice(-10).map((entry) => ({
      name: formatShortDate(entry.date),
      weight: entry.weightKg,
    }));
  }, [weightEntries, weightMode]);

  const handleWeightSubmit = () => {
    const parsed = Number(weightValue);
    if (!Number.isFinite(parsed) || parsed <= 0) {
      setWeightError('Ingresa un peso valido.');
      return;
    }

    onLogWeight({
      date: weightDate,
      weightKg: parsed,
      note: weightNote,
    });
    setWeightError('');
    setWeightValue('');
    setWeightNote('');
  };

  const handleJumpToWeight = () => {
    setWeightDate(todayKey);
    weightInputRef.current?.focus();
  };

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

      {/* Weight + BMI */}
      <div className="bg-slate-800 p-4 rounded-xl border border-slate-700 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2 text-emerald-300">
            <Scale size={18} />
            <span className="text-xs font-bold uppercase">Peso y Composicion</span>
          </div>
          <div className="flex items-center space-x-2 text-xs text-slate-400">
            <button
              onClick={() => setWeightMode('daily')}
              className={`px-2 py-1 rounded ${weightMode === 'daily' ? 'bg-slate-700 text-white' : 'bg-slate-900'}`}
            >
              Diario
            </button>
            <button
              onClick={() => setWeightMode('weekly')}
              className={`px-2 py-1 rounded ${weightMode === 'weekly' ? 'bg-slate-700 text-white' : 'bg-slate-900'}`}
            >
              Semanal
            </button>
          </div>
        </div>

        {weightChartData.length === 0 ? (
          <div className="h-48 flex flex-col items-center justify-center text-center px-4">
            <p className="text-slate-300 font-semibold">Sin registros de peso</p>
            <p className="text-xs text-slate-400 mt-2">Registra tu primer valor para ver la grafica.</p>
          </div>
        ) : (
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={180}>
              <LineChart data={weightChartData}>
                <CartesianGrid stroke="#1f2937" strokeDasharray="3 3" />
                <XAxis
                  dataKey="name"
                  stroke="#64748b"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  stroke="#64748b"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  width={32}
                />
                <Tooltip
                  cursor={{ fill: '#334155', opacity: 0.4 }}
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', color: '#f8fafc' }}
                />
                <Line
                  type="monotone"
                  dataKey="weight"
                  stroke="#34d399"
                  strokeWidth={2}
                  dot={{ fill: '#34d399', strokeWidth: 1 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

        <div className="grid grid-cols-2 gap-3 mt-4">
          <div className="bg-slate-900/60 p-3 rounded-lg border border-slate-700">
            <p className="text-xs text-slate-400 uppercase font-semibold">Peso actual</p>
            <p className="text-lg font-bold text-white">
              {latestWeight ? `${latestWeight.toFixed(1)} kg` : 'Sin dato'}
            </p>
            {latestEntry?.date && (
              <p className="text-xs text-slate-500">{formatShortDate(latestEntry.date)}</p>
            )}
          </div>
          <div className="bg-slate-900/60 p-3 rounded-lg border border-slate-700">
            <p className="text-xs text-slate-400 uppercase font-semibold">IMC</p>
            <p className="text-lg font-bold text-white">
              {bmi ? bmi.toFixed(1) : 'Sin dato'}
            </p>
            <p className="text-xs text-slate-500">
              {bmiCategory ? `${bmiCategory.label}. ${bmiCategory.note}` : 'Agrega altura y peso.'}
            </p>
          </div>
          <div className="bg-slate-900/60 p-3 rounded-lg border border-slate-700 col-span-2">
            <p className="text-xs text-slate-400 uppercase font-semibold">% Grasa estimada</p>
            <p className="text-lg font-bold text-white">
              {bodyFat !== null ? `${bodyFat.toFixed(1)}%` : 'Requiere edad y sexo'}
            </p>
            <p className="text-xs text-slate-500">
              Estimacion basada en IMC; no diferencia masa muscular.
            </p>
          </div>
        </div>
      </div>

      {/* Log Weight */}
      <div className="bg-slate-800 p-4 rounded-xl border border-slate-700 mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-bold text-slate-200">Registrar peso</h3>
            <p className="text-xs text-slate-500">
              Gana +{weightRewardCoins} FitCoins al registrar tu peso diario.
            </p>
          </div>
          <Edit3 size={18} className="text-slate-500" />
        </div>
        <div className="space-y-3">
          <div>
            <label className="block text-xs text-slate-400 mb-1">Fecha</label>
            <input
              type="date"
              value={weightDate}
              onChange={(event) => setWeightDate(event.target.value)}
              className="w-full bg-slate-900 border border-slate-700 text-white rounded-lg p-3 focus:border-emerald-400 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1">Peso (kg)</label>
            <input
              ref={weightInputRef}
              type="number"
              step="0.1"
              min={1}
              value={weightValue}
              onChange={(event) => setWeightValue(event.target.value)}
              className="w-full bg-slate-900 border border-slate-700 text-white rounded-lg p-3 focus:border-emerald-400 focus:outline-none"
            />
            {weightError && <p className="text-xs text-red-400 mt-1">{weightError}</p>}
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1">Nota (opcional)</label>
            <input
              type="text"
              value={weightNote}
              onChange={(event) => setWeightNote(event.target.value)}
              placeholder="Ej: Retencion de liquidos"
              className="w-full bg-slate-900 border border-slate-700 text-white rounded-lg p-3 focus:border-emerald-400 focus:outline-none"
            />
          </div>
          <button
            onClick={handleWeightSubmit}
            className="w-full bg-emerald-500 text-slate-900 font-bold py-3 rounded-lg hover:bg-emerald-400 transition"
          >
            Guardar peso
          </button>
        </div>
      </div>

      {!hasTodayWeight && (
        <button
          onClick={handleJumpToWeight}
          className="fixed bottom-24 right-4 bg-emerald-500 text-slate-900 font-bold px-4 py-3 rounded-full shadow-lg flex items-center gap-2"
        >
          <span>Registra tu peso</span>
          <span className="text-xs bg-emerald-200 text-emerald-900 px-2 py-0.5 rounded-full">
            +{weightRewardCoins}
          </span>
        </button>
      )}
    </div>
  );
};
