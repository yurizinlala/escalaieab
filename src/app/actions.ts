'use server';

import { generateSchedule as runAlgorithm } from '@/lib/algorithm';

export async function generateScheduleAction(month: number, year: number) {
    try {
        const result = await runAlgorithm(month, year);
        return result;
    } catch (error: any) {
        return {
            success: false,
            message: error.message || 'Erro desconhecido ao gerar escala',
            logs: ['Erro crítico na execução da Server Action', error.message]
        };
    }
}

import { ensureEventsExist } from '@/lib/algorithm';

export async function ensureEventsAction(month: number, year: number) {
    try {
        await ensureEventsExist(month, year);
        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

import { getSubstitutes, swapSchedule } from '@/lib/management';

export async function getSubstitutesAction(scheduleId: string) {
    try {
        const results = await getSubstitutes(scheduleId);
        return { success: true, data: results };
    } catch (error: any) {
        return { success: false, message: error.message };
    }
}

export async function swapScheduleAction(scheduleId: string, newVolunteerId: string) {
    try {
        await swapSchedule(scheduleId, newVolunteerId);
        return { success: true };
    } catch (error: any) {
        return { success: false, message: error.message };
    }
}

import { supabase } from '@/lib/algorithm'; // Use the admin client from algorithm

async function hashPin(pin: string) {
    const { createHash } = await import('crypto');
    return createHash('sha256').update(pin).digest('hex');
}

export async function createVolunteerAction(data: { name: string; phone: string; role: string; room: string | null; pin: string }) {
    try {
        const pin_hash = await hashPin(data.pin);
        const { error } = await supabase.from('volunteers').insert({
            name: data.name,
            phone: data.phone.replace(/\D/g, ''),
            role: data.role,
            room: data.room === 'null' ? null : data.room,
            pin_hash,
            is_active: true
        });

        if (error) throw error;
        return { success: true };
    } catch (error: any) {
        return { success: false, message: error.message };
    }
}

export async function updateVolunteerAction(id: string, data: { name: string; phone: string; role: string; room: string | null }) {
    try {
        const { error } = await supabase.from('volunteers').update({
            name: data.name,
            phone: data.phone.replace(/\D/g, ''),
            role: data.role,
            room: data.room === 'null' ? null : data.room
        }).eq('id', id);

        if (error) throw error;
        return { success: true };
    } catch (error: any) {
        return { success: false, message: error.message };
    }
}

export async function deleteVolunteerAction(id: string) {
    try {
        const { error } = await supabase.from('volunteers').delete().eq('id', id);

        if (error) {
            await supabase.from('volunteers').update({ is_active: false }).eq('id', id);
        }
        return { success: true };
    } catch (error: any) {
        return { success: false, message: error.message };
    }
}

export async function resetDatabaseAction(adminIdToKeep: string) {
    try {
        await supabase.from('schedules').delete().neq('id', '00000000-0000-0000-0000-000000000000');
        await supabase.from('unavailabilities').delete().neq('id', '00000000-0000-0000-0000-000000000000');
        await supabase.from('events').delete().neq('id', '00000000-0000-0000-0000-000000000000');
        await supabase.from('volunteers').delete().neq('id', adminIdToKeep);

        if (error) throw error;
        return { success: true };
    } catch (error: any) {
        return { success: false, message: error.message };
    }
}
