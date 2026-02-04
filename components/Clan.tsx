import React, { useMemo, useState } from 'react';
import type { ClanStore, User } from '../types';
import { Crown, Users, Shield, UserPlus, Swords } from 'lucide-react';

interface ClanProps {
  user: User;
  clanStore: ClanStore;
  onCreateClan: (payload: { name: string; tag: string; motto: string }) => void;
  onRequestInvite: (clanId: string) => void;
  onAcceptInvite: () => void;
  onDeclineInvite: () => void;
  onLeaveClan: () => void;
  onDisbandClan: () => void;
  onSendInvite: (invitedUsername: string) => void;
}

export const Clan: React.FC<ClanProps> = ({
  user,
  clanStore,
  onCreateClan,
  onRequestInvite,
  onAcceptInvite,
  onDeclineInvite,
  onLeaveClan,
  onDisbandClan,
  onSendInvite,
}) => {
  const [name, setName] = useState('');
  const [tag, setTag] = useState('');
  const [motto, setMotto] = useState('');
  const [inviteName, setInviteName] = useState('');

  const currentClan = useMemo(
    () => clanStore.clans.find(clan => clan.id === user.clan.clanId) ?? null,
    [clanStore.clans, user.clan.clanId]
  );

  const invitedClan = useMemo(
    () => clanStore.clans.find(clan => clan.id === user.clan.invitedClanId) ?? null,
    [clanStore.clans, user.clan.invitedClanId]
  );

  const handleCreate = () => {
    if (!name.trim() || !tag.trim()) return;
    onCreateClan({ name: name.trim(), tag: tag.trim().toUpperCase(), motto: motto.trim() });
    setName('');
    setTag('');
    setMotto('');
  };

  const handleInvite = () => {
    if (!inviteName.trim()) return;
    onSendInvite(inviteName.trim());
    setInviteName('');
  };

  return (
    <div className="pb-24 pt-6 px-4 max-w-md mx-auto min-h-screen">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-white">Clanes</h1>
        <div className="text-xs font-bold uppercase text-indigo-300">Social HQ</div>
      </div>

      {user.clan.status === 'invited' && invitedClan && (
        <div className="bg-slate-800 border border-slate-700 rounded-2xl p-5 mb-6">
          <div className="flex items-center space-x-3 mb-4">
            <div className="p-2 bg-indigo-500/20 rounded-lg">
              <Swords className="text-indigo-400" size={20} />
            </div>
            <div>
              <p className="text-sm uppercase text-slate-400">Invitación pendiente</p>
              <h2 className="text-xl font-bold text-white">{invitedClan.name}</h2>
              <p className="text-xs text-slate-400">Tag: [{invitedClan.tag}]</p>
            </div>
          </div>
          <p className="text-slate-300 text-sm mb-4">Acepta la invitación para convertirte en miembro y desbloquear eventos de clan.</p>
          <div className="flex gap-3">
            <button
              onClick={onAcceptInvite}
              className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2 rounded-xl"
            >
              Aceptar
            </button>
            <button
              onClick={onDeclineInvite}
              className="flex-1 bg-slate-900 border border-slate-700 text-slate-200 font-bold py-2 rounded-xl"
            >
              Rechazar
            </button>
          </div>
        </div>
      )}

      {user.clan.status === 'member' || user.clan.status === 'leader' ? (
        currentClan ? (
          <div className="space-y-6">
            <div className="bg-slate-800 border border-slate-700 rounded-2xl p-5">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs uppercase text-slate-400">Clan</div>
                  <h2 className="text-2xl font-bold text-white">{currentClan.name}</h2>
                  <p className="text-sm text-indigo-400">[{currentClan.tag}]</p>
                </div>
                <div className="w-12 h-12 rounded-full bg-indigo-500/20 flex items-center justify-center">
                  {user.clan.status === 'leader' ? (
                    <Crown className="text-yellow-400" size={22} />
                  ) : (
                    <Shield className="text-indigo-300" size={20} />
                  )}
                </div>
              </div>
              {currentClan.motto && (
                <p className="text-slate-300 text-sm mt-3">“{currentClan.motto}”</p>
              )}
              <div className="grid grid-cols-2 gap-3 mt-5">
                <div className="bg-slate-900/70 border border-slate-700 rounded-xl p-3 text-center">
                  <p className="text-xs uppercase text-slate-500">XP Total</p>
                  <p className="text-lg font-bold text-white">{currentClan.stats.totalXP}</p>
                </div>
                <div className="bg-slate-900/70 border border-slate-700 rounded-xl p-3 text-center">
                  <p className="text-xs uppercase text-slate-500">Sesiones</p>
                  <p className="text-lg font-bold text-white">{currentClan.stats.totalSessions}</p>
                </div>
              </div>
            </div>

            <div className="bg-slate-800 border border-slate-700 rounded-2xl p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <Users size={18} className="text-indigo-300" />
                  Miembros
                </h3>
                <span className="text-xs text-slate-400">{currentClan.members.length} activos</span>
              </div>
              <div className="space-y-3">
                {currentClan.members.map(member => (
                  <div key={member.userId} className="flex items-center justify-between bg-slate-900/60 border border-slate-700 rounded-xl p-3">
                    <div>
                      <p className="text-sm font-bold text-white">{member.username}</p>
                      <p className="text-xs text-slate-400">{member.contributionSessions} sesiones · {member.contributionXP} XP</p>
                    </div>
                    <span className={`text-xs font-bold uppercase ${member.role === 'leader' ? 'text-yellow-400' : 'text-indigo-300'}`}>
                      {member.role}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-slate-800 border border-slate-700 rounded-2xl p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <UserPlus size={18} className="text-green-400" />
                  Invitaciones
                </h3>
                <span className="text-xs text-slate-400">{currentClan.invites.length} totales</span>
              </div>
              {user.clan.status === 'leader' && (
                <div className="flex gap-2 mb-4">
                  <input
                    value={inviteName}
                    onChange={(e) => setInviteName(e.target.value)}
                    placeholder="Invitar usuario"
                    className="flex-1 bg-slate-900 border border-slate-700 text-white rounded-lg p-2 text-sm"
                  />
                  <button
                    onClick={handleInvite}
                    className="bg-green-600 hover:bg-green-500 text-white font-bold px-4 rounded-lg"
                  >
                    Enviar
                  </button>
                </div>
              )}
              {currentClan.invites.length === 0 ? (
                <p className="text-sm text-slate-400">Sin invitaciones todavía.</p>
              ) : (
                <div className="space-y-2">
                  {currentClan.invites.map(invite => (
                    <div key={invite.id} className="flex items-center justify-between bg-slate-900/60 border border-slate-700 rounded-lg p-2">
                      <div>
                        <p className="text-sm text-white">{invite.invitedUsername}</p>
                        <p className="text-xs text-slate-500">Estado: {invite.status}</p>
                      </div>
                      <span className="text-xs uppercase text-slate-400">{new Date(invite.invitedAt).toLocaleDateString()}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex gap-3">
              {user.clan.status === 'leader' ? (
                <button
                  onClick={onDisbandClan}
                  className="flex-1 bg-red-600 hover:bg-red-500 text-white font-bold py-3 rounded-xl"
                >
                  Disolver clan
                </button>
              ) : (
                <button
                  onClick={onLeaveClan}
                  className="flex-1 bg-slate-900 border border-slate-700 text-slate-200 font-bold py-3 rounded-xl"
                >
                  Salir del clan
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="bg-slate-800 border border-slate-700 rounded-2xl p-5">
            <p className="text-slate-300">No se encontró información del clan actual.</p>
          </div>
        )
      ) : (
        <div className="space-y-6">
          <div className="bg-slate-800 border border-slate-700 rounded-2xl p-5">
            <h2 className="text-lg font-bold text-white mb-4">Crear Clan</h2>
            <div className="space-y-3">
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Nombre del clan"
                className="w-full bg-slate-900 border border-slate-700 text-white rounded-lg p-3"
              />
              <input
                value={tag}
                onChange={(e) => setTag(e.target.value)}
                placeholder="Tag (3-5 letras)"
                maxLength={5}
                className="w-full bg-slate-900 border border-slate-700 text-white rounded-lg p-3"
              />
              <input
                value={motto}
                onChange={(e) => setMotto(e.target.value)}
                placeholder="Motto opcional"
                className="w-full bg-slate-900 border border-slate-700 text-white rounded-lg p-3"
              />
              <button
                onClick={handleCreate}
                className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 rounded-xl"
              >
                Crear Clan
              </button>
            </div>
          </div>

          <div className="bg-slate-800 border border-slate-700 rounded-2xl p-5">
            <h2 className="text-lg font-bold text-white mb-4">Clanes disponibles</h2>
            {clanStore.clans.length === 0 ? (
              <p className="text-sm text-slate-400">No hay clanes aún. ¡Crea el primero!</p>
            ) : (
              <div className="space-y-3">
                {clanStore.clans.map(clan => (
                  <div key={clan.id} className="flex items-center justify-between bg-slate-900/60 border border-slate-700 rounded-xl p-3">
                    <div>
                      <p className="text-sm font-bold text-white">{clan.name}</p>
                      <p className="text-xs text-slate-500">[{clan.tag}] · {clan.members.length} miembros</p>
                    </div>
                    <button
                      onClick={() => onRequestInvite(clan.id)}
                      className="bg-indigo-500/20 text-indigo-300 font-bold text-xs px-3 py-2 rounded-lg"
                    >
                      Solicitar invitación
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
