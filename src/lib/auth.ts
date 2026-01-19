import { supabase, Volunteer } from './supabase';

// Simple SHA256 hash function for PIN verification
async function sha256(message: string): Promise<string> {
    const msgBuffer = new TextEncoder().encode(message);
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// Generate a random session token
function generateToken(): string {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return Array.from(array, b => b.toString(16).padStart(2, '0')).join('');
}

// Session duration: 30 days
const SESSION_DURATION_MS = 30 * 24 * 60 * 60 * 1000;

// Cookie name for session
const SESSION_COOKIE = 'ieab_session';

export interface AuthUser {
    id: string;
    name: string;
    phone: string;
    role: 'professor' | 'auxiliar' | 'admin';
    room: 'bebes' | 'pequenos' | 'grandes' | null;
}

export interface LoginResult {
    success: boolean;
    error?: string;
    user?: AuthUser;
}

/**
 * Authenticate user with phone and PIN
 */
export async function login(phone: string, pin: string): Promise<LoginResult> {
    try {
        // Normalize phone (remove non-digits)
        const normalizedPhone = phone.replace(/\D/g, '');

        // Find volunteer by phone
        const { data: volunteer, error } = await supabase
            .from('volunteers')
            .select('*')
            .eq('phone', normalizedPhone)
            .eq('is_active', true)
            .single();

        if (error || !volunteer) {
            return { success: false, error: 'Telefone não encontrado' };
        }

        // Verify PIN
        const pinHash = await sha256(pin);
        if (pinHash !== volunteer.pin_hash) {
            return { success: false, error: 'PIN incorreto' };
        }

        // Create session
        const token = generateToken();
        const expiresAt = new Date(Date.now() + SESSION_DURATION_MS).toISOString();

        const { error: sessionError } = await supabase
            .from('sessions')
            .insert({
                volunteer_id: volunteer.id,
                token,
                expires_at: expiresAt,
            });

        if (sessionError) {
            console.error('Session creation error:', sessionError);
            return { success: false, error: 'Erro ao criar sessão' };
        }

        // Store token in localStorage (client-side)
        if (typeof window !== 'undefined') {
            localStorage.setItem(SESSION_COOKIE, token);
        }

        return {
            success: true,
            user: {
                id: volunteer.id,
                name: volunteer.name,
                phone: volunteer.phone,
                role: volunteer.role,
                room: volunteer.room,
            },
        };
    } catch (err) {
        console.error('Login error:', err);
        return { success: false, error: 'Erro inesperado no login' };
    }
}

/**
 * Get current logged in user from session token
 */
export async function getCurrentUser(): Promise<AuthUser | null> {
    try {
        if (typeof window === 'undefined') {
            return null;
        }

        const token = localStorage.getItem(SESSION_COOKIE);
        if (!token) {
            return null;
        }

        // Find valid session
        const { data: session, error: sessionError } = await supabase
            .from('sessions')
            .select('volunteer_id, expires_at')
            .eq('token', token)
            .single();

        if (sessionError || !session) {
            localStorage.removeItem(SESSION_COOKIE);
            return null;
        }

        // Check if session expired
        if (new Date(session.expires_at) < new Date()) {
            await supabase.from('sessions').delete().eq('token', token);
            localStorage.removeItem(SESSION_COOKIE);
            return null;
        }

        // Get volunteer data
        const { data: volunteer, error: volunteerError } = await supabase
            .from('volunteers')
            .select('id, name, phone, role, room')
            .eq('id', session.volunteer_id)
            .eq('is_active', true)
            .single();

        if (volunteerError || !volunteer) {
            localStorage.removeItem(SESSION_COOKIE);
            return null;
        }

        return {
            id: volunteer.id,
            name: volunteer.name,
            phone: volunteer.phone,
            role: volunteer.role,
            room: volunteer.room,
        };
    } catch (err) {
        console.error('Get current user error:', err);
        return null;
    }
}

/**
 * Logout current user
 */
export async function logout(): Promise<void> {
    try {
        if (typeof window === 'undefined') {
            return;
        }

        const token = localStorage.getItem(SESSION_COOKIE);
        if (token) {
            await supabase.from('sessions').delete().eq('token', token);
            localStorage.removeItem(SESSION_COOKIE);
        }
    } catch (err) {
        console.error('Logout error:', err);
        localStorage.removeItem(SESSION_COOKIE);
    }
}

/**
 * Check if user is admin
 */
export function isAdmin(user: AuthUser | null): boolean {
    return user?.role === 'admin';
}

/**
 * Update user's PIN
 */
export async function updatePin(userId: string, newPin: string): Promise<{ success: boolean; error?: string }> {
    try {
        const pinHash = await sha256(newPin);

        const { error } = await supabase
            .from('volunteers')
            .update({ pin_hash: pinHash })
            .eq('id', userId);

        if (error) {
            return { success: false, error: 'Erro ao atualizar PIN' };
        }

        return { success: true };
    } catch (err) {
        console.error('Update PIN error:', err);
        return { success: false, error: 'Erro inesperado' };
    }
}
