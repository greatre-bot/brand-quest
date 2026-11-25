import {loadCount} from './service.js';

/**
 * Resolve a 5-state task-driven NPC state:
 * 'idle' | 'accepted' | 'ready' | 'completed' | 'blocked'
 * Ensures no NPC gives premature completion praise before the player actually completes the task,
 * and ambient/side NPCs never falsely claim they drank/received unrelated deliverables.
 */
export function resolveNpcState(npc, session) {
  switch (npc.id) {
    case 'clerk':
      if (session.has('mixue_order')) return 'completed';
      return session.has('clerk_met') ? 'accepted' : 'idle';

    case 'cashier':
      return session.has('mixue_order') ? 'completed' : 'idle';

    case 'rider':
      if (session.has('clip_done')) return 'completed';
      if (session.has('clip_found')) return 'ready';
      return session.has('clip_start') ? 'accepted' : 'idle';

    case 'street_office':
      if (session.has('queue_check_done')) return 'completed';
      if (session.has('queue_check_start') && session.has('queue_counted')) return 'ready';
      return session.has('queue_check_start') ? 'accepted' : 'idle';

    case 'documentarian': {
      if (session.has('field_pair')) return 'completed';
      const hasAll = ['sany_sign', 'sany_machine', 'sany_service_record'].every(k => session.photos.includes(k));
      if (hasAll) return 'ready';
      return session.has('field_start') ? 'accepted' : 'idle';
    }

    case 'engineer':
      if (session.has('sany_service')) return 'completed';
      return session.has('service_ticket') ? 'accepted' : 'idle';

    case 'service_tech':
      if (session.has('sany_service')) return 'completed';
      if (!session.has('service_ticket')) return 'blocked';
      return loadCount(session) >= 2 ? 'ready' : 'accepted';

    case 'contractor_boss':
    case 'park_driver':
    case 'warehouse_keeper':
      return session.has('sany_service') ? 'completed' : 'idle';

    case 'waiting_boss':
      if (session.has('sany_service')) return 'completed';
      return session.has('service_ticket') ? 'accepted' : 'idle';

    default:
      return 'idle';
  }
}

export function resolveNpcLines(npc, session) {
  const state = resolveNpcState(npc, session);
  const bank = npc.dialogue;
  if (bank) {
    const lines = bank[state] || bank.idle || [];
    return {state, lines};
  }
  return {state, lines: npc.lines || []};
}
