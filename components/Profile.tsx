import React, { useEffect, useState } from 'react';
import { Sex, User } from '../types';
import { LevelBadge } from './LevelBadge';
import { Shield, Zap, Coins, Pencil, Check, X } from 'lucide-react';

interface ProfileProps {
  user: User;
  onUpdateSessionsPerDay: (nextCount: number) => void;
  onUpdateDayStartHour: (nextHour: number) => void;
  onUpdateTimeZone: (nextTimeZone: string) => void;
  onUpdateHealthProfile: (payload: {
    heightCm: number | null;
    sex: Sex | null;
    birthDate: string | null;
  }) => void;
}

const fallbackTimeZones = [
  'UTC',
  'America/New_York',
  'America/Chicago',
  'America/Denver',
  'America/Los_Angeles',
  'America/Mexico_City',
  'America/Bogota',
  'America/Lima',
  'America/Santiago',
  'America/Argentina/Buenos_Aires',
  'Europe/Madrid',
  'Europe/London',
  'Europe/Paris',
  'Europe/Berlin',
  'Africa/Johannesburg',
  'Asia/Dubai',
  'Asia/Singapore',
  'Asia/Tokyo',
  'Australia/Sydney'
];

export const Profile: React.FC<ProfileProps> = ({
  user,
  onUpdateSessionsPerDay,
  onUpdateDayStartHour,
  onUpdateTimeZone,
  onUpdateHealthProfile
}) => {
  const { stats, profile } = user;
  const progressPercent = Math.min(100, (stats.currentXP / stats.nextLevelXP) * 100);
  const timeZones =
    typeof (Intl as typeof Intl & { supportedValuesOf?: (key: string) => string[] }).supportedValuesOf === 'function'
      ? (Intl as typeof Intl & { supportedValuesOf: (key: string) => string[] }).supportedValuesOf('timeZone')
      : fallbackTimeZones;
  const [editingHealth, setEditingHealth] = useState(false);
  const [healthForm, setHealthForm] = useState({
    heightCm: profile.heightCm ? String(profile.heightCm) : '',
    sex: profile.sex ?? '',
    birthDate: profile.birthDate ?? '',
  });

  useEffect(() => {
    if (!editingHealth) {
      setHealthForm({
        heightCm: profile.heightCm ? String(profile.heightCm) : '',
        sex: profile.sex ?? '',
        birthDate: profile.birthDate ?? '',
      });
    }
  }, [editingHealth, profile.birthDate, profile.heightCm, profile.sex]);

  const ageLabel = (() => {
    if (!profile.birthDate) return null;
    const birthDate = new Date(`${profile.birthDate}T00:00:00`);
    if (Number.isNaN(birthDate.getTime())) return null;
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age -= 1;
    }
    return `${age} anos`;
  })();

  const handleSaveHealth = () => {
    const heightRaw = Number(healthForm.heightCm);
    const heightCm = Number.isFinite(heightRaw) && heightRaw > 0 ? Math.round(heightRaw) : null;
    const sex = healthForm.sex === 'male' || healthForm.sex === 'female' || healthForm.sex === 'other'
      ? (healthForm.sex as Sex)
      : null;
    const birthDate = healthForm.birthDate ? healthForm.birthDate : null;

    onUpdateHealthProfile({
      heightCm,
      sex,
      birthDate,
    });
    setEditingHealth(false);
  };

  const sexLabel = profile.sex === 'male'
    ? 'Hombre'
    : profile.sex === 'female'
      ? 'Mujer'
      : profile.sex === 'other'
        ? 'Otro'
        : 'Sin definir';

  return (
    <div className="pb-24 pt-6 px-4 max-w-md mx-auto min-h-screen">
      {/* Profile Header */}
      <div className="flex flex-col items-center mb-8">
        <div className="relative mb-4">
          <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-slate-700 bg-slate-800">
            <img src={profile.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
          </div>
          <div className="absolute -bottom-2 -right-2">
            <LevelBadge level={stats.level} size="lg" />
          </div>
        </div>
        <h2 className="text-2xl font-bold text-white mt-2">{profile.username}</h2>
        <p className="text-slate-400 text-sm">Member since {new Date(profile.createdAt).getFullYear()}</p>
      </div>

      {/* Level Progress */}
      <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700 mb-6 shadow-lg">
        <div className="flex justify-between items-end mb-2">
          <span className="text-slate-300 font-bold">Level {stats.level}</span>
          <span className="text-indigo-400 text-sm font-mono">{stats.currentXP} / {stats.nextLevelXP} XP</span>
        </div>
        <div className="w-full bg-slate-900 h-4 rounded-full overflow-hidden border border-slate-700">
          <div 
            className="bg-gradient-to-r from-indigo-600 to-purple-500 h-full transition-all duration-1000 ease-out"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
        <p className="text-xs text-center text-slate-500 mt-2">
          {stats.nextLevelXP - stats.currentXP} XP to next level
        </p>
      </div>

      {/* Currency & Buffs (Future Proofing) */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-slate-800 p-4 rounded-xl border border-slate-700 flex items-center space-x-3">
          <div className="bg-yellow-500/20 p-2 rounded-lg">
            <Coins className="text-yellow-500" />
          </div>
          <div>
            <p className="text-xs text-slate-400 uppercase font-bold">FitCoins</p>
            <p className="text-xl font-bold text-white">{stats.fitCoins}</p>
          </div>
        </div>
        <div className="bg-slate-800 p-4 rounded-xl border border-slate-700 flex items-center space-x-3">
          <div className="bg-blue-500/20 p-2 rounded-lg">
            <Shield className="text-blue-500" />
          </div>
          <div>
            <p className="text-xs text-slate-400 uppercase font-bold">Streak Shield</p>
            <p className="text-xl font-bold text-white">Inactive</p>
          </div>
        </div>
      </div>

      {/* Settings */}
      <div className="mt-8 bg-slate-800 p-4 rounded-xl border border-slate-700">
        <h3 className="text-white font-bold mb-4">Settings</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-slate-300 text-sm font-bold mb-2">Sessions per day</label>
            <input
              type="number"
              min={1}
              max={50}
              value={user.settings.sessionsPerDay}
              onChange={(e) => onUpdateSessionsPerDay(Number(e.target.value))}
              className="w-full bg-slate-900 border border-slate-700 text-white rounded-lg p-3 focus:border-indigo-500 focus:outline-none text-lg"
            />
            <p className="text-xs text-slate-500 mt-2">Define how many sessions you want in your daily routine.</p>
          </div>
          <div>
            <label className="block text-slate-300 text-sm font-bold mb-2">Day starts at</label>
            <select
              value={user.settings.dayStartHour}
              onChange={(e) => onUpdateDayStartHour(Number(e.target.value))}
              className="w-full bg-slate-900 border border-slate-700 text-white rounded-lg p-3 focus:border-indigo-500 focus:outline-none text-lg"
            >
              {Array.from({ length: 24 }).map((_, hour) => (
                <option key={hour} value={hour} className="bg-slate-900">
                  {String(hour).padStart(2, '0')}:00
                </option>
              ))}
            </select>
            <p className="text-xs text-slate-500 mt-2">Choose when your day starts (24h format).</p>
          </div>
          <div>
            <label className="block text-slate-300 text-sm font-bold mb-2">Time zone</label>
            <select
              value={user.settings.timeZone}
              onChange={(e) => onUpdateTimeZone(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 text-white rounded-lg p-3 focus:border-indigo-500 focus:outline-none text-lg"
            >
              {timeZones.map((timeZone) => (
                <option key={timeZone} value={timeZone} className="bg-slate-900">
                  {timeZone}
                </option>
              ))}
            </select>
            <p className="text-xs text-slate-500 mt-2">This affects when a new day starts.</p>
          </div>
        </div>
      </div>

      <div className="mt-8 bg-slate-800 p-4 rounded-xl border border-slate-700">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-white font-bold">Health Profile</h3>
          {!editingHealth ? (
            <button
              onClick={() => setEditingHealth(true)}
              className="text-slate-400 hover:text-white transition"
              aria-label="Editar perfil de salud"
            >
              <Pencil size={18} />
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={handleSaveHealth}
                className="text-emerald-400 hover:text-emerald-300"
                aria-label="Guardar perfil de salud"
              >
                <Check size={18} />
              </button>
              <button
                onClick={() => setEditingHealth(false)}
                className="text-red-400 hover:text-red-300"
                aria-label="Cancelar edicion"
              >
                <X size={18} />
              </button>
            </div>
          )}
        </div>
        {!editingHealth ? (
          <div className="space-y-3 text-sm text-slate-300">
            <div className="flex justify-between">
              <span className="text-slate-500">Altura</span>
              <span>{profile.heightCm ? `${profile.heightCm} cm` : 'Sin configurar'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Sexo</span>
              <span>{sexLabel}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Nacimiento</span>
              <span>{profile.birthDate ? profile.birthDate : 'Sin configurar'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Edad</span>
              <span>{ageLabel ?? 'Sin calcular'}</span>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <div>
              <label className="block text-slate-300 text-sm font-bold mb-2">Altura (cm)</label>
              <input
                type="number"
                min={80}
                max={250}
                value={healthForm.heightCm}
                onChange={(event) => setHealthForm((prev) => ({ ...prev, heightCm: event.target.value }))}
                className="w-full bg-slate-900 border border-slate-700 text-white rounded-lg p-3 focus:border-indigo-500 focus:outline-none text-lg"
              />
            </div>
            <div>
              <label className="block text-slate-300 text-sm font-bold mb-2">Sexo</label>
              <select
                value={healthForm.sex}
                onChange={(event) => setHealthForm((prev) => ({ ...prev, sex: event.target.value }))}
                className="w-full bg-slate-900 border border-slate-700 text-white rounded-lg p-3 focus:border-indigo-500 focus:outline-none text-lg"
              >
                <option value="" className="bg-slate-900">Selecciona</option>
                <option value="male" className="bg-slate-900">Hombre</option>
                <option value="female" className="bg-slate-900">Mujer</option>
                <option value="other" className="bg-slate-900">Otro</option>
              </select>
            </div>
            <div>
              <label className="block text-slate-300 text-sm font-bold mb-2">Fecha de nacimiento</label>
              <input
                type="date"
                value={healthForm.birthDate}
                onChange={(event) => setHealthForm((prev) => ({ ...prev, birthDate: event.target.value }))}
                className="w-full bg-slate-900 border border-slate-700 text-white rounded-lg p-3 focus:border-indigo-500 focus:outline-none text-lg"
              />
            </div>
          </div>
        )}
      </div>
      
      <div className="mt-8">
        <h3 className="text-white font-bold mb-4 flex items-center">
            <Zap className="mr-2 text-yellow-400" size={18} />
            Achievements
        </h3>
        <div className="space-y-3">
             {/* Dummy Achievements for MVP */}
             <div className="bg-slate-800/50 border border-slate-700 p-3 rounded-lg flex items-center opacity-100">
                <div className="w-10 h-10 bg-green-900/50 rounded flex items-center justify-center mr-3 text-green-400">
                    🏆
                </div>
                <div>
                    <h4 className="text-sm font-bold text-slate-200">First Step</h4>
                    <p className="text-xs text-slate-500">Completed first session</p>
                </div>
             </div>
             <div className={`bg-slate-800/50 border border-slate-700 p-3 rounded-lg flex items-center ${stats.level >= 5 ? 'opacity-100' : 'opacity-40 grayscale'}`}>
                <div className="w-10 h-10 bg-purple-900/50 rounded flex items-center justify-center mr-3 text-purple-400">
                    ⭐
                </div>
                <div>
                    <h4 className="text-sm font-bold text-slate-200">High Five</h4>
                    <p className="text-xs text-slate-500">Reached Level 5</p>
                </div>
             </div>
             <div className={`bg-slate-800/50 border border-slate-700 p-3 rounded-lg flex items-center ${stats.highestStreak >= 7 ? 'opacity-100' : 'opacity-40 grayscale'}`}>
                <div className="w-10 h-10 bg-orange-900/50 rounded flex items-center justify-center mr-3 text-orange-400">
                    🔥
                </div>
                <div>
                    <h4 className="text-sm font-bold text-slate-200">Week Warrior</h4>
                    <p className="text-xs text-slate-500">7 Day Streak</p>
                </div>
             </div>
        </div>
      </div>
    </div>
  );
};
