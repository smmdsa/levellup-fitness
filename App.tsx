import React, { useEffect, useState, useCallback } from 'react';
import type { Clan as ClanData, ClanInvite, ClanMember, ClanStore } from './types';
import {
  ViewState,
  User,
  DailyProgress,
  AnalyticsData,
  Session,
  HistoryEntry,
  ExerciseItem,
  ScheduledSession,
} from './types';
import * as Game from './services/gameService';
import { getDayKey, getTodayKey } from './services/dateService';
import { userRepository, dailyProgressRepository, analyticsRepository, clanRepository } from './repositories';
import { Navbar } from './components/Navbar';
import { Dashboard } from './components/Dashboard';
import { Stats } from './components/Stats';
import { Profile } from './components/Profile';
import { Clan } from './components/Clan';

const createId = () => {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }

  return `id_${Date.now()}_${Math.floor(Math.random() * 10000)}`;
};

const App: React.FC = () => {
  const [view, setView] = useState<ViewState>(ViewState.DASHBOARD);
  const [user, setUser] = useState<User>(userRepository.get());
  const [daily, setDaily] = useState<DailyProgress>(
    dailyProgressRepository.getToday(user.settings.dayStartHour, user.settings.timeZone)
  );
  const [analytics, setAnalytics] = useState<AnalyticsData>(analyticsRepository.get());
  const [clanStore, setClanStore] = useState<ClanStore>(clanRepository.get());
  const [showLevelUp, setShowLevelUp] = useState(false);
  const sessionsPerDay = Math.max(1, Math.min(50, Math.floor(user.settings.sessionsPerDay ?? 10)));
  const weightRewardCoins = 10;

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
      const today = getTodayKey(user.settings.dayStartHour, user.settings.timeZone);
      if (daily.date !== today) {
        handleDayReset(daily, analytics, user.settings.dayStartHour, user.settings.timeZone);
      }
    };
    
    checkDate();
    window.addEventListener('focus', checkDate);
    return () => window.removeEventListener('focus', checkDate);
  }, [daily, analytics]);

  const handleDayReset = (
    currentDaily: DailyProgress,
    currentAnalytics: AnalyticsData,
    dayStartHour: number,
    timeZone?: string
  ) => {
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
      date: getTodayKey(dayStartHour, timeZone),
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
    const yesterdayStr = getDayKey(yesterday, dayStartHour, timeZone);
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

    const today = getTodayKey(user.settings.dayStartHour, user.settings.timeZone);
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

    // 6. Update Clan Contributions
    if (user.clan.status === 'member' || user.clan.status === 'leader') {
      const clanId = user.clan.clanId;
      if (clanId) {
        const clanIndex = clanStore.clans.findIndex(clan => clan.id === clanId);
        if (clanIndex >= 0) {
          const clan = clanStore.clans[clanIndex];
          const memberIndex = clan.members.findIndex(member => member.userId === user.profile.id);
          const updatedMembers = memberIndex >= 0
            ? clan.members.map((member, idx) => (
              idx === memberIndex
                ? {
                    ...member,
                    contributionXP: member.contributionXP + earnedXP,
                    contributionSessions: member.contributionSessions + 1,
                  }
                : member
            ))
            : [
                ...clan.members,
                {
                  userId: user.profile.id,
                  username: user.profile.username,
                  avatarUrl: user.profile.avatarUrl,
                  role: 'member',
                  joinedAt: new Date().toISOString(),
                  contributionXP: earnedXP,
                  contributionSessions: 1,
                }
              ];

          const updatedClan: ClanData = {
            ...clan,
            members: updatedMembers,
            stats: {
              ...clan.stats,
              totalXP: clan.stats.totalXP + earnedXP,
              totalSessions: clan.stats.totalSessions + 1,
            },
          };

          const nextClanStore = {
            ...clanStore,
            clans: clanStore.clans.map((item, idx) => (idx === clanIndex ? updatedClan : item)),
          };
          setClanStore(nextClanStore);
          clanRepository.set(nextClanStore);
        }
      }
    }

    if (leveledUp) {
      setShowLevelUp(true);
      setTimeout(() => setShowLevelUp(false), 3000);
    }
  }, [daily, user, analytics, sessionsPerDay, clanStore]);

  const updateClanStore = (nextStore: ClanStore) => {
    setClanStore(nextStore);
    clanRepository.set(nextStore);
  };

  const handleCreateClan = useCallback((payload: { name: string; tag: string; motto: string }) => {
    if (!payload.name || !payload.tag) return;

    const now = new Date().toISOString();
    const clanId = createId();
    const leader: ClanMember = {
      userId: user.profile.id,
      username: user.profile.username,
      avatarUrl: user.profile.avatarUrl,
      role: 'leader',
      joinedAt: now,
      contributionXP: 0,
      contributionSessions: 0,
    };

    const clan: ClanData = {
      id: clanId,
      name: payload.name,
      tag: payload.tag,
      motto: payload.motto || undefined,
      createdAt: now,
      leaderId: user.profile.id,
      members: [leader],
      invites: [],
      stats: {
        totalXP: 0,
        totalSessions: 0,
        createdAt: now,
      },
    };

    updateClanStore({ ...clanStore, clans: [...clanStore.clans, clan] });

    const nextUser = {
      ...user,
      clan: {
        status: 'leader',
        clanId,
        invitedClanId: null,
        invitedAt: null,
      },
    };
    setUser(nextUser);
    userRepository.set(nextUser);
  }, [clanStore, user]);

  const handleRequestInvite = useCallback((clanId: string) => {
    if (user.clan.status !== 'none') return;

    const now = new Date().toISOString();
    const invite: ClanInvite = {
      id: createId(),
      clanId,
      invitedUserId: user.profile.id,
      invitedUsername: user.profile.username,
      invitedAt: now,
      status: 'pending',
    };

    const nextStore = {
      ...clanStore,
      clans: clanStore.clans.map(clan => (
        clan.id === clanId ? { ...clan, invites: [...clan.invites, invite] } : clan
      )),
    };
    updateClanStore(nextStore);

    const nextUser = {
      ...user,
      clan: {
        status: 'invited',
        clanId: null,
        invitedClanId: clanId,
        invitedAt: now,
      },
    };
    setUser(nextUser);
    userRepository.set(nextUser);
  }, [clanStore, user]);

  const handleAcceptInvite = useCallback(() => {
    if (user.clan.status !== 'invited' || !user.clan.invitedClanId) return;

    const clanId = user.clan.invitedClanId;
    const now = new Date().toISOString();

    const nextStore = {
      ...clanStore,
      clans: clanStore.clans.map(clan => {
        if (clan.id !== clanId) return clan;

        const memberExists = clan.members.some(member => member.userId === user.profile.id);
        const updatedMembers = memberExists
          ? clan.members
          : [
              ...clan.members,
              {
                userId: user.profile.id,
                username: user.profile.username,
                avatarUrl: user.profile.avatarUrl,
                role: 'member',
                joinedAt: now,
                contributionXP: 0,
                contributionSessions: 0,
              },
            ];

        const updatedInvites = clan.invites.map(invite =>
          invite.invitedUserId === user.profile.id && invite.status === 'pending'
            ? { ...invite, status: 'accepted' }
            : invite
        );

        return {
          ...clan,
          members: updatedMembers,
          invites: updatedInvites,
        };
      }),
    };
    updateClanStore(nextStore);

    const nextUser = {
      ...user,
      clan: {
        status: 'member',
        clanId,
        invitedClanId: null,
        invitedAt: null,
      },
    };
    setUser(nextUser);
    userRepository.set(nextUser);
  }, [clanStore, user]);

  const handleDeclineInvite = useCallback(() => {
    if (user.clan.status !== 'invited' || !user.clan.invitedClanId) return;

    const clanId = user.clan.invitedClanId;
    const nextStore = {
      ...clanStore,
      clans: clanStore.clans.map(clan => (
        clan.id === clanId
          ? {
              ...clan,
              invites: clan.invites.map(invite =>
                invite.invitedUserId === user.profile.id && invite.status === 'pending'
                  ? { ...invite, status: 'declined' }
                  : invite
              ),
            }
          : clan
      )),
    };
    updateClanStore(nextStore);

    const nextUser = {
      ...user,
      clan: {
        status: 'none',
        clanId: null,
        invitedClanId: null,
        invitedAt: null,
      },
    };
    setUser(nextUser);
    userRepository.set(nextUser);
  }, [clanStore, user]);

  const handleLeaveClan = useCallback(() => {
    if (user.clan.status !== 'member' || !user.clan.clanId) return;
    const clanId = user.clan.clanId;

    const nextStore = {
      ...clanStore,
      clans: clanStore.clans.map(clan => (
        clan.id === clanId
          ? { ...clan, members: clan.members.filter(member => member.userId !== user.profile.id) }
          : clan
      )),
    };
    updateClanStore(nextStore);

    const nextUser = {
      ...user,
      clan: {
        status: 'none',
        clanId: null,
        invitedClanId: null,
        invitedAt: null,
      },
    };
    setUser(nextUser);
    userRepository.set(nextUser);
  }, [clanStore, user]);

  const handleDisbandClan = useCallback(() => {
    if (user.clan.status !== 'leader' || !user.clan.clanId) return;
    const clanId = user.clan.clanId;
    updateClanStore({ ...clanStore, clans: clanStore.clans.filter(clan => clan.id !== clanId) });

    const nextUser = {
      ...user,
      clan: {
        status: 'none',
        clanId: null,
        invitedClanId: null,
        invitedAt: null,
      },
    };
    setUser(nextUser);
    userRepository.set(nextUser);
  }, [clanStore, user]);

  const handleSendInvite = useCallback((invitedUsername: string) => {
    if (user.clan.status !== 'leader' || !user.clan.clanId) return;

    const now = new Date().toISOString();
    const invite: ClanInvite = {
      id: createId(),
      clanId: user.clan.clanId,
      invitedUserId: createId(),
      invitedUsername,
      invitedAt: now,
      status: 'pending',
    };

    const nextStore = {
      ...clanStore,
      clans: clanStore.clans.map(clan => (
        clan.id === user.clan.clanId ? { ...clan, invites: [...clan.invites, invite] } : clan
      )),
    };
    updateClanStore(nextStore);
  }, [clanStore, user]);

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

  const handleUpdateDayStartHour = useCallback((nextHour: number) => {
    const normalized = Math.max(0, Math.min(23, Math.floor(nextHour)));
    const newUser = {
      ...user,
      settings: {
        ...user.settings,
        dayStartHour: normalized,
      }
    };
    setUser(newUser);
    userRepository.set(newUser);

    const today = getTodayKey(normalized, user.settings.timeZone);
    if (daily.date !== today) {
      handleDayReset(daily, analytics, normalized, user.settings.timeZone);
    }
  }, [daily, analytics, user]);

  const handleUpdateTimeZone = useCallback((nextTimeZone: string) => {
    const normalized = nextTimeZone?.trim() || 'UTC';
    const newUser = {
      ...user,
      settings: {
        ...user.settings,
        timeZone: normalized,
      }
    };
    setUser(newUser);
    userRepository.set(newUser);

    const today = getTodayKey(user.settings.dayStartHour, normalized);
    if (daily.date !== today) {
      handleDayReset(daily, analytics, user.settings.dayStartHour, normalized);
    }
  }, [daily, analytics, user]);

  const handleUpdateHealthProfile = useCallback((payload: {
    heightCm: number | null;
    sex: 'male' | 'female' | 'other' | null;
    birthDate: string | null;
  }) => {
    const newUser = {
      ...user,
      profile: {
        ...user.profile,
        heightCm: payload.heightCm,
        sex: payload.sex,
        birthDate: payload.birthDate,
      },
    };
    setUser(newUser);
    userRepository.set(newUser);
  }, [user]);

  const handleLogWeight = useCallback((payload: { date: string; weightKg: number; note?: string }) => {
    const normalizedDate = payload.date?.trim().length > 0
      ? payload.date.trim()
      : getTodayKey(user.settings.dayStartHour, user.settings.timeZone);
    const weightValue = Number(payload.weightKg);
    if (!Number.isFinite(weightValue) || weightValue <= 0) {
      return;
    }

    const entry = {
      date: normalizedDate,
      weightKg: Number(weightValue.toFixed(1)),
      note: payload.note?.trim() || undefined,
    };

    const currentEntries = analytics.weightEntries ?? [];
    const existingIndex = currentEntries.findIndex((item) => item.date === normalizedDate);
    const nextEntries = existingIndex >= 0
      ? currentEntries.map((item, index) => (index === existingIndex ? entry : item))
      : [...currentEntries, entry];

    const sortedEntries = [...nextEntries].sort((a, b) => a.date.localeCompare(b.date));
    const nextAnalytics = {
      ...analytics,
      weightEntries: sortedEntries,
    };

    const today = getTodayKey(user.settings.dayStartHour, user.settings.timeZone);
    if (normalizedDate === today && existingIndex === -1) {
      const nextUser = {
        ...user,
        stats: {
          ...user.stats,
          fitCoins: user.stats.fitCoins + weightRewardCoins,
        },
      };
      setUser(nextUser);
      userRepository.set(nextUser);
    }

    setAnalytics(nextAnalytics);
    analyticsRepository.set(nextAnalytics);
  }, [analytics, user, weightRewardCoins]);

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
            dayStartHour={user.settings.dayStartHour}
            timeZone={user.settings.timeZone}
          />
        )}
        {view === ViewState.STATS && (
          <Stats
            analytics={analytics}
            user={user}
            userStats={user.stats}
            sessionsPerDay={sessionsPerDay}
            weightRewardCoins={weightRewardCoins}
            onLogWeight={handleLogWeight}
          />
        )}
        {view === ViewState.PROFILE && (
          <Profile
            user={user}
            onUpdateSessionsPerDay={handleUpdateSessionsPerDay}
            onUpdateDayStartHour={handleUpdateDayStartHour}
            onUpdateTimeZone={handleUpdateTimeZone}
            onUpdateHealthProfile={handleUpdateHealthProfile}
          />
        )}
        {view === ViewState.CLAN && (
          <Clan
            user={user}
            clanStore={clanStore}
            onCreateClan={handleCreateClan}
            onRequestInvite={handleRequestInvite}
            onAcceptInvite={handleAcceptInvite}
            onDeclineInvite={handleDeclineInvite}
            onLeaveClan={handleLeaveClan}
            onDisbandClan={handleDisbandClan}
            onSendInvite={handleSendInvite}
          />
        )}
      </div>

      <Navbar currentView={view} setView={setView} />
    </div>
  );
};

export default App;
