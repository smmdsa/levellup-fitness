import React, { useEffect, useState, useCallback } from 'react';
import { ViewState, User, DailyProgress, AnalyticsData, Session, HistoryEntry, ExerciseItem, ScheduledSession } from './types';
import * as Game from './services/gameService';
import { userRepository, dailyProgressRepository, analyticsRepository } from './repositories';
import { Navbar } from './components/Navbar';
import { Dashboard } from './components/Dashboard';
import { Stats } from './components/Stats';
import { Profile } from './components/Profile';

const App: React.FC = () => {
  const [view, setView] = useState<ViewState>(ViewState.DASHBOARD);
  const [user, setUser] = useState<User>(userRepository.get());
  const [daily, setDaily] = useState<DailyProgress>(dailyProgressRepository.getToday());
  const [analytics, setAnalytics] = useState<AnalyticsData>(analyticsRepository.get());
  const [showLevelUp, setShowLevelUp] = useState(false);
  const sessionsPerDay = Math.max(1, Math.min(50, Math.floor(user.settings.sessionsPerDay ?? 10)));

  // Request Notification Permission on Mount
  useEffect(() => {
    if ('Notification' in window && Notification.permission !== 'granted') {
      Notification.requestPermission();
    }
  }, []);

  // Alarm / Notification Check Loop
  useEffect(() => {
    const checkSchedule = () => {
      if (daily.isCompleted || daily.schedule.length === 0) return;

      const now = new Date();
      // Find sessions that:
      // 1. Have NOT been completed (sessionId > sessionsDone)
      // 2. Are in the past (targetTime <= now)
      // 3. Have NOT sent a notification yet
      const pendingNotification = daily.schedule.find(s => 
        s.sessionId > daily.sessionsDone && 
        new Date(s.targetTime) <= now && 
        !s.notificationSent
      );

      if (pendingNotification) {
        // Send Notification
        if ('Notification' in window && Notification.permission === 'granted') {
          new Notification(`LevelUp Fitness`, {
            body: `It's time for Session ${pendingNotification.sessionId}! Drop and give me a set!`,
            icon: '/icon.png' // Placeholder, browser will use default if missing
          });
        }

        // Update state to mark notification as sent
        const updatedSchedule = daily.schedule.map(s => 
          s.sessionId === pendingNotification.sessionId 
            ? { ...s, notificationSent: true } 
            : s
        );
        const newDaily = { ...daily, schedule: updatedSchedule };
        setDaily(newDaily);
        dailyProgressRepository.set(newDaily);
      }
    };

    const intervalId = setInterval(checkSchedule, 10000); // Check every 10 seconds
    return () => clearInterval(intervalId);
  }, [daily]);

  // Check for day reset on mount and visibility change
  useEffect(() => {
    const checkDate = () => {
      const today = new Date().toISOString().split('T')[0];
      if (daily.date !== today) {
        handleDayReset(daily, analytics);
      }
    };
    
    checkDate();
    window.addEventListener('focus', checkDate);
    return () => window.removeEventListener('focus', checkDate);
  }, [daily, analytics]);

  const handleDayReset = (currentDaily: DailyProgress, currentAnalytics: AnalyticsData) => {
    // 1. Archive yesterday
    const isAlreadyArchived = currentAnalytics.history.some(h => h.date === currentDaily.date);
    
    let newAnalytics = { ...currentAnalytics };
    if (!isAlreadyArchived && currentDaily.sessionsDone > 0) {
      const historyEntry: HistoryEntry = {
        date: currentDaily.date,
        sessionsDone: currentDaily.sessionsDone,
        xpEarned: 0 
      };
      newAnalytics.history.push(historyEntry);
      analyticsRepository.set(newAnalytics);
      setAnalytics(newAnalytics);
    }

    // 2. Reset Daily
    const newDaily: DailyProgress = {
      date: new Date().toISOString().split('T')[0],
      isCompleted: false,
      sessionsDone: 0,
      sessions: [],
      schedule: [] // Clear schedule for new day
    };
    dailyProgressRepository.set(newDaily);
    setDaily(newDaily);

    // 3. Handle Streak Logic
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];
    const yesterdayEntry = newAnalytics.history.find(h => h.date === yesterdayStr);

    let newUser = { ...user };
    if (yesterdayEntry && yesterdayEntry.sessionsDone > 0) {
        newUser.stats.currentStreak += 1;
        if (newUser.stats.currentStreak > newUser.stats.highestStreak) {
            newUser.stats.highestStreak = newUser.stats.currentStreak;
        }
    } else if (currentDaily.sessionsDone === 0) { 
         newUser.stats.currentStreak = 0;
    }
    setUser(newUser);
    userRepository.set(newUser);
  };

  const handleStartDay = (startTimeStr: string, intervalMinutes: number) => {
    const now = new Date();
    const [hours, minutes] = startTimeStr.split(':').map(Number);
    const startObj = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hours, minutes);

    const newSchedule: ScheduledSession[] = [];
    for (let i = 0; i < sessionsPerDay; i++) {
      const time = new Date(startObj.getTime() + (i * intervalMinutes * 60 * 1000));
      newSchedule.push({
        sessionId: i + 1,
        targetTime: time.toISOString(),
        notificationSent: false
      });
    }

    const newDaily = { ...daily, schedule: newSchedule };
    setDaily(newDaily);
    dailyProgressRepository.set(newDaily);
  };

  const handleUpdateSchedule = (newSchedule: ScheduledSession[]) => {
    const newDaily = { ...daily, schedule: newSchedule };
    setDaily(newDaily);
    dailyProgressRepository.set(newDaily);
  };

  const handleLogSession = useCallback((completedExercises: ExerciseItem[]) => {
    if (daily.sessionsDone >= sessionsPerDay) return;

    // 1. Calculate XP
    const earnedXP = Game.calculateSessionXP(user.stats.level);
    
    // 2. Update User (Check Level Up)
    const updatedStats = Game.processLevelUp(user.stats, earnedXP);
    const leveledUp = updatedStats.level > user.stats.level;
    
    // 3. Update Daily Progress
    const newSessionIndex = daily.sessionsDone + 1;
    const sessionDetails: Session = {
      sessionId: newSessionIndex,
      timestamp: new Date().toISOString(),
      exercises: completedExercises
    };

    const newDaily = {
      ...daily,
      sessionsDone: newSessionIndex,
      isCompleted: newSessionIndex === sessionsPerDay,
      sessions: [...daily.sessions, sessionDetails]
    };

    // 4. Update Analytics
    const newAnalytics = { ...analytics };
    completedExercises.forEach(ex => {
        const name = ex.name.toLowerCase();
        let reps = typeof ex.reps === 'string' ? parseInt(ex.reps) : ex.reps;
        if (isNaN(reps)) reps = 0;

        if (name.includes('pushup') || name.includes('push-up') || name.includes('press')) {
            newAnalytics.totalReps.push += reps;
        } else if (name.includes('pull') || name.includes('row') || name.includes('superman')) {
            newAnalytics.totalReps.pull += reps;
        } else if (name.includes('squat') || name.includes('lunge') || name.includes('leg') || name.includes('glute')) {
            newAnalytics.totalReps.legs += reps;
        } else if (name.includes('situp') || name.includes('sit-up') || name.includes('plank') || name.includes('crunch')) {
            newAnalytics.totalReps.core += reps;
        }
    });

    const today = new Date().toISOString().split('T')[0];
    const existingEntryIndex = newAnalytics.history.findIndex(entry => entry.date === today);
    if (existingEntryIndex >= 0) {
      const updatedEntry = { ...newAnalytics.history[existingEntryIndex] };
      updatedEntry.sessionsDone = newDaily.sessionsDone;
      updatedEntry.xpEarned += earnedXP;
      newAnalytics.history = newAnalytics.history.map((entry, index) =>
        index === existingEntryIndex ? updatedEntry : entry
      );
    } else {
      newAnalytics.history = [
        ...newAnalytics.history,
        {
          date: today,
          sessionsDone: newDaily.sessionsDone,
          xpEarned: earnedXP
        }
      ];
    }

    // 5. Save Everything
    setUser({ ...user, stats: updatedStats });
    setDaily(newDaily);
    setAnalytics(newAnalytics);
    
    userRepository.set({ ...user, stats: updatedStats });
    dailyProgressRepository.set(newDaily);
    analyticsRepository.set(newAnalytics);

    if (leveledUp) {
      setShowLevelUp(true);
      setTimeout(() => setShowLevelUp(false), 3000);
    }
  }, [daily, user, analytics, sessionsPerDay]);

  const handleUpdateSessionsPerDay = useCallback((nextCount: number) => {
    const normalized = Math.max(1, Math.min(50, Math.floor(nextCount)));
    const newUser = {
      ...user,
      settings: {
        ...user.settings,
        sessionsPerDay: normalized,
      }
    };
    setUser(newUser);
    userRepository.set(newUser);

    if (daily.sessionsDone === 0 && daily.schedule.length > 0) {
      const first = new Date(daily.schedule[0].targetTime);
      let intervalMinutes = 60;
      if (daily.schedule.length > 1) {
        const second = new Date(daily.schedule[1].targetTime);
        intervalMinutes = Math.max(1, Math.round((second.getTime() - first.getTime()) / 60000));
      }

      const updatedSchedule: ScheduledSession[] = [];
      for (let i = 0; i < normalized; i++) {
        const time = new Date(first.getTime() + (i * intervalMinutes * 60 * 1000));
        updatedSchedule.push({
          sessionId: i + 1,
          targetTime: time.toISOString(),
          notificationSent: false,
        });
      }

      const newDaily = { ...daily, schedule: updatedSchedule };
      setDaily(newDaily);
      dailyProgressRepository.set(newDaily);
    }
  }, [daily, user]);

  return (
    <div className="bg-slate-900 min-h-screen font-sans text-slate-100 selection:bg-indigo-500 selection:text-white">
      {/* Level Up Overlay */}
      {showLevelUp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm level-up-anim pointer-events-none">
          <div className="text-center">
            <h1 className="text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-500 glow-text mb-4">LEVEL UP!</h1>
            <p className="text-2xl text-white font-bold">You are now Level {user.stats.level}</p>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="w-full">
        {view === ViewState.DASHBOARD && (
          <Dashboard 
            daily={daily} 
            userStats={user.stats} 
            onLogSession={handleLogSession}
            onStartDay={handleStartDay}
            onUpdateSchedule={handleUpdateSchedule}
            sessionsPerDay={sessionsPerDay}
          />
        )}
        {view === ViewState.STATS && (
          <Stats analytics={analytics} userStats={user.stats} sessionsPerDay={sessionsPerDay} />
        )}
        {view === ViewState.PROFILE && (
          <Profile user={user} onUpdateSessionsPerDay={handleUpdateSessionsPerDay} />
        )}
      </div>

      <Navbar currentView={view} setView={setView} />
    </div>
  );
};

export default App;
