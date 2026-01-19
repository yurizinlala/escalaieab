'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import styles from './login.module.css';

export default function LoginPage() {
    const [phone, setPhone] = useState('');
    const [pin, setPin] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const { login, isAdmin } = useAuth();
    const router = useRouter();

    // Format phone input
    const formatPhone = (value: string) => {
        const digits = value.replace(/\D/g, '');
        if (digits.length <= 2) return digits;
        if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
        if (digits.length <= 11) return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
        return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7, 11)}`;
    };

    const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const formatted = formatPhone(e.target.value);
        setPhone(formatted);
        setError('');
    };

    const handlePinChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const digits = e.target.value.replace(/\D/g, '').slice(0, 4);
        setPin(digits);
        setError('');
    };

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();

        const phoneDigits = phone.replace(/\D/g, '');

        if (phoneDigits.length < 10) {
            setError('Digite um número de telefone válido');
            return;
        }

        if (pin.length !== 4) {
            setError('O PIN deve ter 4 dígitos');
            return;
        }

        setIsLoading(true);
        setError('');

        try {
            const result = await login(phoneDigits, pin);

            if (result.success && result.user) {
                if (result.user.role === 'admin') {
                    window.location.href = '/admin';
                } else {
                    window.location.href = '/dashboard';
                }
            } else {
                setError(result.error || 'Erro ao fazer login');
            }
        } catch (err) {
            setError('Erro inesperado. Tente novamente.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className={styles.loginContainer}>
            <div className={styles.loginCard}>
                <div className={styles.logo}>
                    <div className={styles.logoIcon}>
                        <svg xmlns="http://www.w3.org/2000/svg" width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4.5 9.5V12a10 10 0 0 0 20 0V9.5" /><path d="M6.5 12A8 8 0 0 1 14 5.5a1 1 0 0 1 1 1v6a1 1 0 0 1-1 1 8 8 0 0 1-7.5-6.5" /><path d="M10 10a2 2 0 1 1 4 0 2 2 0 0 1-4 0z" /></svg>
                    </div>
                    <h1 className={styles.logoTitle}>Escala IEAB</h1>
                    <p className={styles.logoSubtitle}>Ministério Infantil</p>
                </div>

                <form className={styles.form} onSubmit={handleSubmit}>
                    <div className={styles.inputGroup}>
                        <label className={styles.label} htmlFor="phone">
                            Telefone
                        </label>
                        <div className={styles.inputWrapper}>
                            <span className={styles.inputIcon}>
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" /></svg>
                            </span>
                            <input
                                id="phone"
                                type="tel"
                                className={styles.input}
                                placeholder="(84) 99999-9999"
                                value={phone}
                                onChange={handlePhoneChange}
                                disabled={isLoading}
                                autoComplete="tel"
                            />
                        </div>
                    </div>

                    <div className={styles.inputGroup}>
                        <label className={styles.label} htmlFor="pin">
                            PIN (4 dígitos)
                        </label>
                        <div className={styles.inputWrapper}>
                            <span className={styles.inputIcon}>
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="11" x="3" y="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>
                            </span>
                            <input
                                id="pin"
                                type="password"
                                inputMode="numeric"
                                className={`${styles.input} ${styles.pinInput}`}
                                placeholder="••••"
                                value={pin}
                                onChange={handlePinChange}
                                disabled={isLoading}
                                maxLength={4}
                                autoComplete="current-password"
                            />
                        </div>
                    </div>

                    {error && (
                        <div className={styles.errorMessage}>
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><line x1="12" x2="12" y1="8" y2="12" /><line x1="12" x2="12.01" y1="16" y2="16" /></svg>
                            {error}
                        </div>
                    )}

                    <button
                        type="submit"
                        className={styles.submitButton}
                        disabled={isLoading}
                    >
                        {isLoading ? (
                            <>
                                <span className={styles.spinner}></span>
                                Entrando...
                            </>
                        ) : (
                            'Entrar'
                        )}
                    </button>
                </form>

                <p className={styles.footer}>
                    Igreja Evangélica Avivamento Bíblico
                </p>
            </div>
        </div>
    );
}
