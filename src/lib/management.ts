import { supabase } from './supabase';

interface SubstituteCandidate {
    id: string;
    name: string;
    count: number;
}

export async function getSubstitutes(scheduleId: string): Promise<SubstituteCandidate[]> {
    // 1. Get schedule details
    const { data: schedule, error: schedError } = await supabase
        .from('schedules')
        .select(`
      *,
      event:events(*)
    `)
        .eq('id', scheduleId)
        .single();

    if (schedError || !schedule) throw new Error('Agendamento não encontrado');

    const { event, assigned_role, assigned_room, volunteer_id: currentVolunteerId } = schedule;
    const eventDate = new Date(event.event_date);

    // 2. Get all volunteers eligible for this role/room
    let query = supabase
        .from('volunteers')
        .select('id, name, role, room')
        .eq('is_active', true)
        .neq('id', currentVolunteerId); // Exclude current

    if (assigned_role === 'professor') {
        query = query.eq('role', 'professor');
        if (assigned_room) {
            // If room is specific (bebes/pequenos/grandes), match it.
            // If 'unificada', room can be anything? Or we assume EBD constraints.
            // EBD logic was: any professor. Regular logic: specific room.
            // Let's assume strict room match unless room is 'unificada' or null.
            if (assigned_room !== 'unificada') {
                query = query.eq('room', assigned_room);
            }
        }
    } else {
        // Auxiliar: can be 'auxiliar' role. (Or professor acting as aid? keeping simple: role='auxiliar')
        query = query.eq('role', 'auxiliar');
    }

    const { data: candidates, error: candError } = await query;
    if (candError || !candidates) return [];

    // 3. Filter out unavailable for this event
    const { data: unavailabilities } = await supabase
        .from('unavailabilities')
        .select('volunteer_id')
        .eq('event_id', event.id);

    const unavailableIds = new Set(unavailabilities?.map(u => u.volunteer_id));

    // 4. Filter out working on same day (other assignments)
    const { data: sameDaySchedules } = await supabase
        .from('schedules')
        .select('volunteer_id')
        .eq('event_id', event.id);

    const workingIds = new Set(sameDaySchedules?.map(s => s.volunteer_id));

    // 5. Filter out working on previous day (Rest rule)
    const prevDate = new Date(eventDate);
    prevDate.setDate(prevDate.getDate() - 1);
    const prevDateStr = prevDate.toISOString().split('T')[0];

    // Find event ID for previous day
    const { data: prevEvent } = await supabase
        .from('events')
        .select('id')
        .eq('event_date', prevDateStr)
        .single();

    let restIds = new Set<string>();
    if (prevEvent) {
        const { data: prevSchedules } = await supabase
            .from('schedules')
            .select('volunteer_id')
            .eq('event_id', prevEvent.id);
        restIds = new Set(prevSchedules?.map(s => s.volunteer_id));
    }

    // 6. Calculate counts for sorting (Fairness)
    const { data: counts } = await supabase
        .from('schedules')
        .select('volunteer_id')
        .eq('month', event.month)
        .eq('year', event.year);

    const usageMap: Record<string, number> = {};
    counts?.forEach(c => {
        usageMap[c.volunteer_id] = (usageMap[c.volunteer_id] || 0) + 1;
    });

    // Combine filters
    const eligible = candidates.filter(c => {
        if (unavailableIds.has(c.id)) return false;
        if (workingIds.has(c.id)) return false;
        if (restIds.has(c.id)) return false;
        return true;
    });

    // Sort by load
    return eligible
        .map(c => ({
            id: c.id,
            name: c.name,
            count: usageMap[c.id] || 0
        }))
        .sort((a, b) => a.count - b.count);
}

export async function swapSchedule(scheduleId: string, newVolunteerId: string) {
    const { error } = await supabase
        .from('schedules')
        .update({ volunteer_id: newVolunteerId })
        .eq('id', scheduleId);

    if (error) throw new Error('Erro ao realizar a troca');
    return { success: true };
}
