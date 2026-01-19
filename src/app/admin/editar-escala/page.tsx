'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { getSubstitutesAction, swapScheduleAction } from '@/app/actions';
import { ArrowLeft, RotateCw } from 'lucide-react';
import styles from './editar.module.css';

interface ScheduleItem {
    id: string;
    assigned_role: string;
    assigned_room: string | null;
    day: number;
    volunteer: {
        name: string;
        role: string;
    };
    event: {
        event_date: string;
        event_type: string;
    };
}

interface Substitute {
    id: string;
    name: string;
    count: number;
}

export default function EditarEscalaPage() {
    const [schedule, setSchedule] = useState<ScheduleItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [currentDate, setCurrentDate] = useState(() => {
        const now = new Date();
        return new Date(now.getFullYear(), now.getMonth() + 1, 1);
    });

    // Modal State
    const [selectedItem, setSelectedItem] = useState<ScheduleItem | null>(null);
    const [substitutes, setSubstitutes] = useState<Substitute[]>([]);
    const [loadingSubs, setLoadingSubs] = useState(false);
    const [swapping, setSwapping] = useState(false);

    const fetchSchedule = async () => {
        setLoading(true);
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth() + 1;

        const { data, error } = await supabase
            .from('schedules')
            .select(`
        id,
        assigned_role,
        assigned_room,
        volunteer:volunteers(name, role),
        event:events(event_date, event_type)
      `)
            .eq('month', month)
            .eq('year', year)
            .order('event_id');

        if (error) {
            console.error('Error fetching schedule:', error);
        } else {
            const sorted = (data as any[]).sort((a, b) => {
                return new Date(a.event.event_date).getTime() - new Date(b.event.event_date).getTime();
            });
            setSchedule(sorted);
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchSchedule();
    }, [currentDate]);

    const handleOpenSwap = async (item: ScheduleItem) => {
        setSelectedItem(item);
        setLoadingSubs(true);
        setSubstitutes([]);

        const result = await getSubstitutesAction(item.id);
        if (result.success && result.data) {
            setSubstitutes(result.data);
        } else {
            alert('Erro ao buscar substitutos');
        }
        setLoadingSubs(false);
    };

    const handleSwap = async (newVolunteerId: string) => {
        if (!selectedItem) return;
        setSwapping(true);

        const result = await swapScheduleAction(selectedItem.id, newVolunteerId);
        if (result.success) {
            await fetchSchedule(); // Refresh list
            setSelectedItem(null); // Close modal
        } else {
            alert(`Erro: ${result.message}`);
        }
        setSwapping(false);
    };

    const getDayLabel = (dateStr: string) => {
        const date = new Date(dateStr);
        date.setDate(date.getDate() + 1);
        const days = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
        return `${date.getDate()}/${date.getMonth() + 1} - ${days[date.getDay()]}`;
    };

    const groupedSchedule = groupByDate(schedule);

    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <Link href="/admin" className={styles.backButton}>
                    <ArrowLeft size={24} />
                </Link>
                <h1 className={styles.title}>Editar Escala</h1>
            </header>

            {loading ? (
                <div className={styles.loading}>
                    <div className={styles.spinner}></div>
                    <p>Carregando...</p>
                </div>
            ) : (
                <div className={styles.list}>
                    {Object.entries(groupedSchedule).map(([date, items]) => (
                        <div key={date} className={styles.dayGroup}>
                            <h3 className={styles.dayHeader}>
                                {getDayLabel(date)}
                                <span className={styles.dayBadge}>
                                    {items[0].event.event_type === 'sabado' ? 'EBD' : 'Culto'}
                                </span>
                            </h3>

                            <div className={styles.grid}>
                                {items.map(item => (
                                    <div key={item.id} className={styles.card} onClick={() => handleOpenSwap(item)}>
                                        <div className={styles.cardInfo}>
                                            <div className={styles.cardRole}>
                                                {getRoomLabel(item.assigned_room)} • {item.assigned_role}
                                            </div>
                                            <div className={styles.cardName}>{item.volunteer.name}</div>
                                        </div>
                                        <div className={styles.swapIcon}>
                                            <RotateCw size={18} />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* MODAL */}
            {selectedItem && (
                <div className={styles.modalOverlay} onClick={() => setSelectedItem(null)}>
                    <div className={styles.modal} onClick={e => e.stopPropagation()}>
                        <h3 className={styles.modalTitle}>Trocar Voluntário</h3>
                        <p className={styles.modalSubtitle}>
                            Substituir <strong>{selectedItem.volunteer.name}</strong> em {getDayLabel(selectedItem.event.event_date)}
                        </p>

                        <div className={styles.subsList}>
                            {loadingSubs ? (
                                <p className={styles.loadingText}>Buscando substitutos...</p>
                            ) : substitutes.length === 0 ? (
                                <p className={styles.emptyText}>Nenhum substituto válido encontrado.</p>
                            ) : (
                                substitutes.map(sub => (
                                    <button
                                        key={sub.id}
                                        className={styles.subItem}
                                        onClick={() => handleSwap(sub.id)}
                                        disabled={swapping}
                                    >
                                        <span className={styles.subName}>{sub.name}</span>
                                        <span className={styles.subCount}>{sub.count} escalas</span>
                                    </button>
                                ))
                            )}
                        </div>

                        <button className={styles.closeButton} onClick={() => setSelectedItem(null)}>Cancel</button>
                    </div>
                </div>
            )}
        </div>
    );
}

function groupByDate(items: ScheduleItem[]) {
    const grouped: Record<string, ScheduleItem[]> = {};
    items.forEach(item => {
        const date = item.event.event_date;
        if (!grouped[date]) grouped[date] = [];
        grouped[date].push(item);
    });
    return grouped;
}

function getRoomLabel(room: string | null) {
    if (!room) return 'Geral';
    if (room === 'bebes') return 'Bebês';
    if (room === 'pequenos') return 'Pequenos';
    if (room === 'grandes') return 'Grandes';
    if (room === 'unificada') return 'Unificada';
    return room;
}
