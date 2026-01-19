'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import {
    Users,
    BarChart3,
    Wand2,
    Edit,
    Share2,
    Settings,
    LogOut,
    Crown
} from 'lucide-react';
import styles from '../dashboard/dashboard.module.css';

export default function AdminPage() {
    const { user, isLoading, isAdmin, logout } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!isLoading) {
            if (!user) {
                router.push('/login');
            } else if (!isAdmin) {
                router.push('/dashboard');
            }
        }
    }, [isLoading, user, isAdmin, router]);

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

    if (!user || !isAdmin) {
        return null;
    }

    return (
        <div className={styles.dashboardContainer}>
            <header className={styles.header}>
                <div className={styles.userInfo}>
                    <div className={styles.avatar}>
                        <Crown size={24} />
                    </div>
                    <div>
                        <h2 className={styles.userName}>Painel Admin</h2>
                        <p className={styles.userRole}>
                            <span className={styles.roleBadge}>{user.name}</span>
                        </p>
                    </div>
                </div>
                <button onClick={handleLogout} className={styles.logoutButton}>
                    <LogOut size={20} />
                    Sair
                </button>
            </header>

            <main className={styles.content}>
                <div className={styles.welcomeCard}>
                    <div className={styles.welcomeIcon}>
                        <Settings size={32} />
                    </div>
                    <h3 className={styles.welcomeTitle}>Gerenciamento de Escalas</h3>
                    <p className={styles.welcomeText}>
                        Gerencie disponibilidades, gere escalas e faça ajustes manuais.
                    </p>
                </div>

                <div className={styles.menuGrid}>
                    <Link href="/admin/disponibilidades" className={styles.menuCard}>
                        <span className={styles.menuIcon}>
                            <BarChart3 size={28} />
                        </span>
                        <span className={styles.menuTitle}>Disponibilidades</span>
                        <span className={styles.menuDescription}>Ver quem preencheu</span>
                    </Link>

                    <Link href="/admin/gerar-escala" className={styles.menuCard}>
                        <span className={styles.menuIcon}>
                            <Wand2 size={28} />
                        </span>
                        <span className={styles.menuTitle}>Gerar Escala</span>
                        <span className={styles.menuDescription}>Algoritmo automático</span>
                    </Link>

                    <Link href="/admin/editar-escala" className={styles.menuCard}>
                        <span className={styles.menuIcon}>
                            <Edit size={28} />
                        </span>
                        <span className={styles.menuTitle}>Editar Escala</span>
                        <span className={styles.menuDescription}>Ajustes manuais</span>
                    </Link>

                    <Link href="/admin/exportar" className={styles.menuCard}>
                        <span className={styles.menuIcon}>
                            <Share2 size={28} />
                        </span>
                        <span className={styles.menuTitle}>Exportar</span>
                        <span className={styles.menuDescription}>WhatsApp / PDF</span>
                    </Link>

                    <Link href="/admin/equipe" className={styles.menuCard}>
                        <span className={styles.menuIcon}>
                            <Users size={28} />
                        </span>
                        <span className={styles.menuTitle}>Gerenciar Equipe</span>
                        <span className={styles.menuDescription}>Ver voluntários</span>
                    </Link>

                    <Link href="/perfil" className={styles.menuCard}>
                        <span className={styles.menuIcon}>
                            <Settings size={28} />
                        </span>
                        <span className={styles.menuTitle}>Configurações</span>
                        <span className={styles.menuDescription}>Meu Perfil</span>
                    </Link>
                </div>
            </main>
        </div>
    );
}
