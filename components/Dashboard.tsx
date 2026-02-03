import React, { useState, useEffect } from 'react';
import { DailyProgress, UserStats, ExerciseItem, ScheduledSession } from '../types';
import { generateSessionRoutine, getQuote } from '../services/gameService';
import { CheckCircle2, Flame, Dumbbell, Square, Pencil, Trash2, Plus, Clock, Play, ChevronDown, ChevronUp, Bell } from 'lucide-react';

interface DashboardProps {
  daily: DailyProgress;
  userStats: UserStats;
  onLogSession: (completedExercises: ExerciseItem[]) => void;
  onStartDay: (startTime: string, intervalMinutes: number) => void;
  onUpdateSchedule: (newSchedule: ScheduledSession[]) => void;
  sessionsPerDay: number;
}

export const Dashboard: React.FC<DashboardProps> = ({ daily, userStats, onLogSession, onStartDay, onUpdateSchedule, sessionsPerDay }) => {
  const nextSessionIndex = daily.sessionsDone + 1;
  const isFinished = daily.sessionsDone >= sessionsPerDay;
  
  // -- State for Exercises --
  const [exercises, setExercises] = useState<ExerciseItem[]>([]);
  const [isEditingExercises, setIsEditingExercises] = useState(false);

  // -- State for Schedule --
  const [showSchedule, setShowSchedule] = useState(false);
  const [startTimeInput, setStartTimeInput] = useState(() => {
    const now = new Date();
    return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  });
  const [intervalInput, setIntervalInput] = useState(60);
  const [countdown, setCountdown] = useState<string>('');
  const [isSessionReady, setIsSessionReady] = useState(false);

  // Initialize routine when session changes
  useEffect(() => {
    if (!isFinished) {
      setExercises(generateSessionRoutine(nextSessionIndex));
      setIsEditingExercises(false);
    }
  }, [nextSessionIndex, isFinished]);

  // Countdown Logic
  useEffect(() => {
    if (daily.schedule.length === 0 || isFinished) return;

    const tick = () => {
      const targetSession = daily.schedule.find(s => s.sessionId === nextSessionIndex);
      if (!targetSession) return;

      const now = new Date();
      const target = new Date(targetSession.targetTime);
      const diff = target.getTime() - now.getTime();

      if (diff <= 0) {
        setCountdown("READY");
        setIsSessionReady(true);
      } else {
        setIsSessionReady(false);
        const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
        const minutes = Math.floor((diff / (1000 * 60)) % 60);
        const seconds = Math.floor((diff / 1000) % 60);
        setCountdown(`${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);
      }
    };

    tick(); // Initial call
    const timer = setInterval(tick, 1000);
    return () => clearInterval(timer);
  }, [daily.schedule, nextSessionIndex, isFinished]);


  // -- Exercise Logic --
  const toggleCheck = (id: string) => {
    if (isEditingExercises) return;
    setExercises(prev => prev.map(ex => 
      ex.id === id ? { ...ex, completed: !ex.completed } : ex
    ));
  };

  const handleEditChange = (id: string, field: 'name' | 'reps', value: string) => {
    setExercises(prev => prev.map(ex => 
      ex.id === id ? { ...ex, [field]: value } : ex
    ));
  };

  const deleteExercise = (id: string) => {
    setExercises(prev => prev.filter(ex => ex.id !== id));
  };

  const addExercise = () => {
    const newId = Date.now().toString();
    setExercises(prev => [
      ...prev, 
      { id: newId, name: 'New Exercise', reps: 10, completed: false }
    ]);
  };

  const handleStartDayClick = () => {
    onStartDay(startTimeInput, intervalInput);
  };

  const handleScheduleTimeChange = (sessionId: number, newTimeStr: string) => {
    // newTimeStr is "HH:MM"
    const now = new Date();
    const [hours, minutes] = newTimeStr.split(':').map(Number);
    const newDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hours, minutes);
    
    const updatedSchedule = daily.schedule.map(s => 
      s.sessionId === sessionId 
        ? { ...s, targetTime: newDate.toISOString(), notificationSent: false } 
        : s
    );
    onUpdateSchedule(updatedSchedule);
  };

  const allCompleted = exercises.length > 0 && exercises.every(ex => ex.completed);

  // -- Render: Start Day Screen --
  if (daily.schedule.length === 0 && !isFinished) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 max-w-md mx-auto">
        <div className="bg-slate-800 border border-slate-700 p-8 rounded-2xl w-full shadow-2xl text-center">
          <Clock className="w-16 h-16 text-indigo-400 mx-auto mb-4 animate-pulse" />
          <h2 className="text-2xl font-bold text-white mb-2">Initialize Protocol</h2>
          <p className="text-slate-400 mb-8 text-sm">Configure your {sessionsPerDay} session schedule for today.</p>

          <div className="space-y-6 text-left">
            <div>
              <label className="block text-slate-300 text-sm font-bold mb-2">Start First Session At</label>
              <input 
                type="time" 
                value={startTimeInput}
                onChange={(e) => setStartTimeInput(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 text-white rounded-lg p-3 focus:border-indigo-500 focus:outline-none text-lg"
              />
            </div>

            <div>
              <label className="block text-slate-300 text-sm font-bold mb-2">Interval (Minutes)</label>
              <input 
                type="number" 
                value={intervalInput}
                onChange={(e) => setIntervalInput(parseInt(e.target.value))}
                className="w-full bg-slate-900 border border-slate-700 text-white rounded-lg p-3 focus:border-indigo-500 focus:outline-none text-lg"
              />
            </div>

            <button 
              onClick={handleStartDayClick}
              className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-4 rounded-xl flex items-center justify-center space-x-2 transition-transform active:scale-95"
            >
              <Play size={20} fill="currentColor" />
              <span>START DAY</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // -- Render: Main Dashboard --
  return (
    <div className="pb-24 pt-6 px-4 max-w-md mx-auto min-h-screen flex flex-col">
      {/* Header Stats */}
      <header className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-wider">TODAY'S QUEST</h1>
          <p className="text-indigo-400 text-sm font-medium">{new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}</p>
        </div>
        <div className="flex items-center space-x-2 bg-slate-800 px-3 py-1 rounded-full border border-orange-500/30">
          <Flame className="text-orange-500" size={18} />
          <span className="text-orange-400 font-bold">{userStats.currentStreak} Day Streak</span>
        </div>
      </header>

      {/* Progress Slots */}
      <div className="grid grid-cols-5 gap-3 mb-6">
        {Array.from({ length: sessionsPerDay }).map((_, idx) => {
          const sessionNum = idx + 1;
          const isCompleted = sessionNum <= daily.sessionsDone;
          const isNext = sessionNum === daily.sessionsDone + 1;
          const scheduledTime = daily.schedule.find(s => s.sessionId === sessionNum)?.targetTime;
          const timeLabel = scheduledTime ? new Date(scheduledTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : '';

          return (
            <div key={idx} className="flex flex-col items-center">
               <div
                className={`w-full aspect-square rounded-lg flex items-center justify-center border-2 transition-all duration-300 relative ${
                  isCompleted
                    ? 'bg-indigo-600 border-indigo-400 shadow-[0_0_15px_rgba(99,102,241,0.5)]'
                    : isNext
                    ? 'bg-slate-800 border-indigo-500/50 animate-pulse'
                    : 'bg-slate-900 border-slate-700'
                }`}
              >
                {isCompleted ? (
                  <CheckCircle2 className="text-white" size={20} />
                ) : (
                  <span className={`font-bold ${isNext ? 'text-indigo-300' : 'text-slate-600'}`}>{sessionNum}</span>
                )}
              </div>
              <span className="text-[10px] text-slate-500 mt-1">{timeLabel}</span>
            </div>
           
          );
        })}
      </div>

      {/* Countdown & Schedule Toggle */}
      {!isFinished && (
        <div className="mb-6">
          <div className="flex justify-between items-end mb-2">
            <div className="flex items-center space-x-2">
              <Clock className={isSessionReady ? "text-green-400 animate-bounce" : "text-indigo-400"} size={20} />
              <span className="text-slate-400 text-xs font-bold uppercase tracking-wider">Next Session</span>
            </div>
            <button 
              onClick={() => setShowSchedule(!showSchedule)}
              className="text-xs text-slate-500 hover:text-slate-300 flex items-center"
            >
              {showSchedule ? 'Hide Schedule' : 'Edit Schedule'}
              {showSchedule ? <ChevronUp size={14} className="ml-1"/> : <ChevronDown size={14} className="ml-1"/>}
            </button>
          </div>
          
          <div className={`text-4xl font-mono font-black tracking-widest transition-colors duration-300 ${
            isSessionReady ? 'text-green-400 drop-shadow-[0_0_10px_rgba(74,222,128,0.5)]' : 'text-white'
          }`}>
            {countdown}
          </div>

          {/* Collapsible Schedule Editor */}
          {showSchedule && (
            <div className="mt-4 bg-slate-800 rounded-xl p-4 border border-slate-700 animate-popup">
              <h3 className="text-sm font-bold text-white mb-3 flex items-center">
                <Bell size={14} className="mr-2" /> Session Schedule
              </h3>
              <div className="space-y-2 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
                {daily.schedule.map((s) => {
                   const isDone = s.sessionId <= daily.sessionsDone;
                   const date = new Date(s.targetTime);
                   // Format HH:MM for input value
                   const timeValue = `${String(date.getHours()).padStart(2,'0')}:${String(date.getMinutes()).padStart(2,'0')}`;
                   
                   return (
                     <div key={s.sessionId} className={`flex justify-between items-center p-2 rounded ${isDone ? 'opacity-50' : ''}`}>
                       <span className="text-slate-400 text-sm font-medium">Session {s.sessionId}</span>
                       <input 
                         type="time" 
                         disabled={isDone}
                         value={timeValue}
                         onChange={(e) => handleScheduleTimeChange(s.sessionId, e.target.value)}
                         className="bg-slate-900 border border-slate-600 rounded px-2 py-1 text-white text-sm focus:border-indigo-500 outline-none disabled:cursor-not-allowed"
                       />
                     </div>
                   );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Main Action Area */}
      <div className="flex-1 flex flex-col justify-center items-center w-full">
        {isFinished ? (
          <div className="text-center space-y-4 animate-bounce">
            <div className="w-24 h-24 bg-green-500 rounded-full flex items-center justify-center mx-auto shadow-lg shadow-green-500/50">
              <CheckCircle2 size={48} className="text-white" />
            </div>
            <h2 className="text-3xl font-bold text-green-400">MISSION COMPLETE</h2>
            <p className="text-slate-300">Great job, Legend. Rest up for tomorrow.</p>
          </div>
        ) : (
          <div className="w-full bg-slate-800/50 border border-slate-700 rounded-2xl p-6 backdrop-blur-sm relative">
            
            {/* Session Header & Controls */}
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-white flex items-center">
                <Dumbbell className="mr-2 text-indigo-400" size={20} />
                Session {nextSessionIndex}/{sessionsPerDay}
              </h2>
              <button 
                onClick={() => setIsEditingExercises(!isEditingExercises)}
                className={`p-2 rounded-full transition-colors ${isEditingExercises ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-700'}`}
              >
                {isEditingExercises ? <CheckCircle2 size={18} /> : <Pencil size={18} />}
              </button>
            </div>

            {/* Checklist / Edit List */}
            <div className="space-y-3 mb-8">
              {exercises.map((ex) => (
                <div 
                  key={ex.id} 
                  className={`flex items-center justify-between p-3 rounded-lg border transition-all duration-200 ${
                    ex.completed && !isEditingExercises
                      ? 'bg-indigo-900/30 border-indigo-500/50' 
                      : 'bg-slate-900/50 border-slate-700/50'
                  }`}
                >
                  {isEditingExercises ? (
                    <div className="flex w-full space-x-2">
                       <input 
                         type="text" 
                         value={ex.name} 
                         onChange={(e) => handleEditChange(ex.id, 'name', e.target.value)}
                         className="bg-slate-800 text-white px-2 py-1 rounded w-full border border-slate-700 focus:border-indigo-500 outline-none text-sm"
                       />
                       <input 
                         type="text" 
                         value={ex.reps} 
                         onChange={(e) => handleEditChange(ex.id, 'reps', e.target.value)}
                         className="bg-slate-800 text-indigo-300 px-2 py-1 rounded w-16 text-center border border-slate-700 focus:border-indigo-500 outline-none font-mono text-sm"
                       />
                       <button onClick={() => deleteExercise(ex.id)} className="text-red-400 hover:text-red-300 p-1">
                         <Trash2 size={18} />
                       </button>
                    </div>
                  ) : (
                    <div 
                      className="flex items-center w-full cursor-pointer group"
                      onClick={() => toggleCheck(ex.id)}
                    >
                      <div className={`mr-3 transition-colors ${ex.completed ? 'text-indigo-400' : 'text-slate-600 group-hover:text-slate-500'}`}>
                        {ex.completed ? <CheckCircle2 size={24} /> : <Square size={24} />}
                      </div>
                      <div className="flex-1">
                         <span className={`block font-medium ${ex.completed ? 'text-slate-400 line-through' : 'text-slate-200'}`}>
                           {ex.name}
                         </span>
                      </div>
                      <span className={`font-mono font-bold text-lg ${ex.completed ? 'text-slate-500' : 'text-indigo-300'}`}>
                        {ex.reps}
                      </span>
                    </div>
                  )}
                </div>
              ))}

              {isEditingExercises && (
                <button 
                  onClick={addExercise}
                  className="w-full py-2 border-2 border-dashed border-slate-700 text-slate-400 rounded-lg hover:border-indigo-500 hover:text-indigo-400 flex items-center justify-center text-sm font-bold transition-colors"
                >
                  <Plus size={16} className="mr-1" /> Add Exercise
                </button>
              )}
            </div>

            {/* Complete Button */}
            {!isEditingExercises && (
              <button
                onClick={() => onLogSession(exercises)}
                disabled={!allCompleted}
                className={`w-full py-4 px-6 rounded-xl shadow-lg transform transition-all duration-200 flex items-center justify-center space-x-2 font-bold tracking-widest text-lg ${
                  allCompleted 
                    ? 'bg-gradient-to-r from-green-600 to-emerald-600 text-white hover:scale-[1.02] hover:shadow-green-900/50' 
                    : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                }`}
              >
                <span>COMPLETE SESSION</span>
                {allCompleted && <CheckCircle2 className="animate-ping absolute right-6 opacity-50" />}
              </button>
            )}
            
            {!allCompleted && !isEditingExercises && (
               <p className="text-center text-xs text-slate-500 mt-2">Check all exercises to complete</p>
            )}
          </div>
        )}
      </div>

      <div className="mt-8 text-center px-4">
        <p className="text-slate-500 italic text-sm">"{getQuote(userStats.level)}"</p>
      </div>
    </div>
  );
};
