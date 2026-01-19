'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import {
    CalendarHeart,
    CalendarDays,
    ClipboardList,
    UserCog,
    LogOut,
    User,
    Crown
} from 'lucide-react';
import styles from './dashboard.module.css';

export default function DashboardPage() {
    const { user, isLoading, isAdmin, logout } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!isLoading && !user) {
            router.push('/login');
        }
    }, [isLoading, user, router]);

    const handleLogout = async () => {
        await logout();
        router.push('/login');
    };

    if (isLoading) {
        return (
            <div className={styles.loading}>
                <div className={styles.loadingSpinner}></div>
                <p className={styles.loadingText}>Carregando...</p>
            </div>
        );
    }

    if (!user) {
        return null;
    }

    const getRoleLabel = (role: string) => {
        switch (role) {
            case 'admin': return 'Administrador';
            case 'professor': return 'Professor(a)';
            case 'auxiliar': return 'Auxiliar';
            default: return role;
        }
    };

    const getRoomLabel = (room: string | null) => {
        if (!room) return '';
        switch (room) {
            case 'bebes': return 'Bebês';
            case 'pequenos': return 'Pequenos';
            case 'grandes': return 'Grandes';
            default: return room;
        }
    };

    return (
        <div className={styles.dashboardContainer}>
            <header className={styles.header}>
                <div className={styles.userInfo}>
                    <div className={styles.avatar}>
                        <User size={32} />
                    </div>
                    <div>
                        <h2 className={styles.userName}>{user.name}</h2>
                        <p className={styles.userRole}>
                            <span className={styles.roleBadge}>{getRoleLabel(user.role)}</span>
                            {user.room && <span>• {getRoomLabel(user.room)}</span>}
                        </p>
                    </div>
                </div>
                <button onClick={handleLogout} className={styles.logoutButton}>
                    <LogOut size={20} />
                    Sair
                </button>
            </header>

            <main className={styles.content}>
                {isAdmin && (
                    <div className={styles.adminBanner}>
                        <div className={styles.adminBannerIcon}>
                            <Crown size={24} />
                        </div>
                        <div className={styles.adminBannerText}>
                            <p className={styles.adminBannerTitle}>Modo Administrador</p>
                            <p className={styles.adminBannerDescription}>
                                Você tem acesso ao painel de gestão
                            </p>
                        </div>
                        <Link href="/admin" className={styles.adminLink}>
                            Abrir
                        </Link>
                    </div>
                )}

                <div className={styles.welcomeCard}>
                    <div className={styles.welcomeIcon}>
                        <CalendarHeart size={32} />
                    </div>
                    <h3 className={styles.welcomeTitle}>Bem-vindo(a) à Escala IEAB</h3>
                    <p className={styles.welcomeText}>
                        Aqui você pode visualizar sua escala e informar suas indisponibilidades para o próximo mês.
                    </p>
                </div>

                <div className={styles.menuGrid}>
                    <Link href="/disponibilidade" className={styles.menuCard}>
                        <span className={styles.menuIcon}>
                            <CalendarDays size={28} />
                        </span>
                        <span className={styles.menuTitle}>Disponibilidade</span>
                        <span className={styles.menuDescription}>Informar dias indisponíveis</span>
                    </Link>

                    <Link href="/escala" className={styles.menuCard}>
                        <span className={styles.menuIcon}>
                            <ClipboardList size={28} />
                        </span>
                        <span className={styles.menuTitle}>Ver Escala</span>
                        <span className={styles.menuDescription}>Escala do mês atual</span>
                    </Link>

                    <Link href="/perfil" className={styles.menuCard}>
                        <span className={styles.menuIcon}>
                            <UserCog size={28} />
                        </span>
                        <span className={styles.menuTitle}>Meu Perfil</span>
                        <span className={styles.menuDescription}>Alterar PIN e preferências</span>
                    </Link>
                </div>
            </main>
        </div>
    );
}
