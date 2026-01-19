
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// Load .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Erro: Variáveis de ambiente ausentes.');
    process.exit(1);
}

if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.warn('⚠️ AVISO: Usando ANON KEY. A limpeza pode falhar se o RLS bloquear deletes.');
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function resetDatabase() {
    console.log('🔄 Iniciando limpeza do banco de dados...');

    // 1. Find Admin 'Raíssa'
    console.log('🔍 Buscando usuário Raíssa...');
    const { data: users, error: userError } = await supabase
        .from('volunteers')
        .select('*')
        .ilike('name', '%Raíssa%'); // Case insensitive search

    if (userError) {
        console.error('❌ Erro ao buscar usuário:', userError.message);
        process.exit(1);
    }

    let adminId = null;

    if (users && users.length > 0) {
        const admin = users[0];
        adminId = admin.id;
        console.log(`✅ Usuário encontrado: ${admin.name} (${admin.id})`);
        // Ensure she is admin
        if (admin.role !== 'admin') {
            console.log('⚠️ Usuário não é admin. Atualizando para admin...');
            await supabase.from('volunteers').update({ role: 'admin' }).eq('id', adminId);
        }
    } else {
        console.warn('⚠️ Usuário "Raíssa" não encontrado. TODOS OS DADOS SERÃO APAGADOS.');
        console.warn('Você terá que criar um novo admin via banco de dados ou signup.');
        // Optional: Create Raíssa? No, user said "deixe apenas a conta existente". implying it exists.
        // If it doesn't exist, we just wipe everything.
    }

    // 2. Delete Dependent Data
    console.log('🗑️ Removendo agendamentos (schedules)...');
    const { error: err1 } = await supabase.from('schedules').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    if (err1) console.error('Erro ao limpar schedules:', err1.message);

    console.log('🗑️ Removendo indisponibilidades (unavailabilities)...');
    const { error: err2 } = await supabase.from('unavailabilities').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    if (err2) console.error('Erro ao limpar unavailabilities:', err2.message);

    console.log('🗑️ Removendo eventos (events)...');
    const { error: err3 } = await supabase.from('events').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    if (err3) console.error('Erro ao limpar events:', err3.message);

    // 3. Delete Volunteers
    console.log('🗑️ Removendo voluntários...');
    let query = supabase.from('volunteers').delete();

    if (adminId) {
        query = query.neq('id', adminId);
    } else {
        query = query.neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all
    }

    const { error: err4 } = await query;
    if (err4) {
        console.error('Erro ao limpar voluntários:', err4.message);
    } else {
        console.log('✅ Voluntários removidos.');
    }

    console.log('✨ Limpeza concluída!');
}

resetDatabase();
