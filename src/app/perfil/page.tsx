'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { updatePin } from '@/lib/auth';
import { ArrowLeft, Lock, Save, Moon, Sun, User } from 'lucide-react';
import styles from './perfil.module.css';

export default function PerfilPage() {
    const { user, isAdmin } = useAuth();
    const router = useRouter();

    const [newPin, setNewPin] = useState('');
    const [confirmPin, setConfirmPin] = useState('');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');

    const handlePinChange = async (e: React.FormEvent) => {
        e.preventDefault();
        setMessage('');
        setError('');

        if (newPin.length !== 4) {
            setError('O PIN deve ter 4 números.');
            return;
        }

        if (newPin !== confirmPin) {
            setError('Os PINs não coincidem.');
            return;
        }

        if (!user) return;

        setLoading(true);
        const result = await updatePin(user.id, newPin);
        setLoading(false);

        if (result.success) {
            setMessage('PIN atualizado com sucesso!');
            setNewPin('');
            setConfirmPin('');
        } else {
            setError(result.error || 'Erro ao atualizar.');
        }
    };

    if (!user) return null;

    const backLink = isAdmin ? '/admin' : '/dashboard';

    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <Link href={backLink} className={styles.backButton}>
                    <ArrowLeft size={24} />
                </Link>
                <h1 className={styles.title}>Meu Perfil</h1>
            </header>

            <div className={styles.card}>
                <div className={styles.userInfo}>
                    <div className={styles.avatar}>
                        <User size={32} />
                    </div>
                    <div className={styles.userDetails}>
                        <h2 className={styles.userName}>{user.name}</h2>
                        <span className={styles.userRole}>
                            {user.role === 'admin' ? 'Administrador' : user.role === 'professor' ? 'Professor(a)' : 'Auxiliar'}
                        </span>
                    </div>
                </div>

                <hr className={styles.divider} />

                <section className={styles.section}>
                    <h3 className={styles.sectionTitle}>
                        <Lock size={18} /> Alterar PIN
                    </h3>

                    <form onSubmit={handlePinChange} className={styles.form}>
                        <div className={styles.inputGroup}>
                            <label className={styles.label}>Novo PIN</label>
                            <input
                                type="password"
                                maxLength={4}
                                inputMode="numeric"
                                className={styles.input}
                                placeholder="••••"
                                value={newPin}
                                onChange={e => setNewPin(e.target.value.replace(/\D/g, ''))}
                            />
                        </div>

                        <div className={styles.inputGroup}>
                            <label className={styles.label}>Confirmar PIN</label>
                            <input
                                type="password"
                                maxLength={4}
                                inputMode="numeric"
                                className={styles.input}
                                placeholder="••••"
                                value={confirmPin}
                                onChange={e => setConfirmPin(e.target.value.replace(/\D/g, ''))}
                            />
                        </div>

                        {message && <div className={styles.successMessage}>{message}</div>}
                        {error && <div className={styles.errorMessage}>{error}</div>}

                        <button type="submit" className={styles.button} disabled={loading}>
                            {loading ? 'Salvando...' : <><Save size={18} /> Salvar Nova Senha</>}
                        </button>
                    </form>
                </section>

                <hr className={styles.divider} />

                <section className={styles.section}>
                    <h3 className={styles.sectionTitle}>
                        Configurações do App
                    </h3>
                    <div className={styles.settingRow}>
                        <div className={styles.settingLabel}>
                            <span>Tema Escuro</span>
                            <small>Em breve</small>
                        </div>
                        <div className={styles.toggleDisabled}>
                            <Moon size={18} />
                        </div>
                    </div>
                </section>
            </div>
        </div>
    );
}
