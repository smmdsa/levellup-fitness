import React from 'react';
import { User } from '../types';
import { LevelBadge } from './LevelBadge';
import { Shield, Zap, Coins } from 'lucide-react';

interface ProfileProps {
  user: User;
  onUpdateSessionsPerDay: (nextCount: number) => void;
}

export const Profile: React.FC<ProfileProps> = ({ user, onUpdateSessionsPerDay }) => {
  const { stats, profile } = user;
  const progressPercent = Math.min(100, (stats.currentXP / stats.nextLevelXP) * 100);

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
        </div>
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
