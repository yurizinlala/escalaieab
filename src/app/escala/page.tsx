'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import styles from './escala.module.css';

interface ScheduleItem {
    id: string;
    assigned_role: string;
    assigned_room: string | null;
    day: number;
    volunteer: {
        name: string;
    };
    event: {
        event_date: string;
        event_type: string;
    };
}

export default function EscalaPage() {
    const [schedule, setSchedule] = useState<ScheduleItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [currentDate, setCurrentDate] = useState(() => {
        const now = new Date();
        return new Date(now.getFullYear(), now.getMonth() + 1, 1); // Default to next month
    });

    useEffect(() => {
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
          volunteer:volunteers(name),
          event:events(event_date, event_type)
        `)
                .eq('month', month)
                .eq('year', year)
                .order('event_id'); // Roughly chronological if event ids are sequential, but better to sort by date in JS

            if (error) {
                console.error('Error fetching schedule:', error);
            } else {
                // Sort by date then room
                const sorted = (data as any[]).sort((a, b) => {
                    return new Date(a.event.event_date).getTime() - new Date(b.event.event_date).getTime();
                });
                setSchedule(sorted);
            }
            setLoading(false);
        };

        fetchSchedule();
    }, [currentDate]);

    const groupByDate = () => {
        const grouped: Record<string, ScheduleItem[]> = {};
        schedule.forEach(item => {
            const date = item.event.event_date;
            if (!grouped[date]) grouped[date] = [];
            grouped[date].push(item);
        });
        return grouped;
    };

    const getDayLabel = (dateStr: string) => {
        const date = new Date(dateStr);
        date.setDate(date.getDate() + 1); // Fix timezone offset for display
        const days = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
        return `${date.getDate()}/${date.getMonth() + 1} - ${days[date.getDay()]}`;
    };

    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <Link href="/dashboard" className={styles.backButton}>←</Link>
                <h1 className={styles.title}>Escala de {currentDate.toLocaleString('pt-BR', { month: 'long' })}</h1>
            </header>

            {loading ? (
                <div className={styles.loading}>
                    <div className={styles.spinner}></div>
                    <p>Carregando escala...</p>
                </div>
            ) : schedule.length === 0 ? (
                <div className={styles.emptyState}>
                    <div className={styles.emptyIcon}>📅</div>
                    <h3>Nenhuma escala publicada</h3>
                    <p>A escala para este mês ainda não foi gerada ou publicada.</p>
                </div>
            ) : (
                <div className={styles.timeline}>
                    {Object.entries(groupByDate()).map(([date, items]) => (
                        <div key={date} className={styles.dayCard}>
                            <h3 className={styles.dayHeader}>
                                {getDayLabel(date)}
                                <span className={styles.dayTypeBadge}>
                                    {items[0].event.event_type === 'sabado' ? 'EBD' : 'Culto'}
                                </span>
                            </h3>

                            <div className={styles.assignments}>
                                {groupItemsByRoom(items).map((group, idx) => (
                                    <div key={idx} className={styles.roomGroup}>
                                        <div className={styles.roomName}>
                                            {getRoomLabel(group.room)}
                                        </div>
                                        {group.items.map(item => (
                                            <div key={item.id} className={styles.assignment}>
                                                <span className={styles.roleIcon}>
                                                    {item.assigned_role === 'professor' ? '🎓' : '🤝'}
                                                </span>
                                                <span className={styles.volunteerName}>
                                                    {item.volunteer.name}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

function groupItemsByRoom(items: ScheduleItem[]) {
    // Group by room (null/unificada/bebes/etc)
    const groups: Record<string, ScheduleItem[]> = {};
    items.forEach(item => {
        const room = item.assigned_room || 'Geral';
        if (!groups[room]) groups[room] = [];
        groups[room].push(item);
    });

    // Order: Bebes, Pequenos, Grandes, Unificada/Geral
    const order = ['bebes', 'pequenos', 'grandes', 'unificada', 'Geral'];

    return Object.entries(groups)
        .sort((a, b) => order.indexOf(a[0]) - order.indexOf(b[0]))
        .map(([room, items]) => ({ room, items }));
}

function getRoomLabel(room: string) {
    if (room === 'bebes') return 'Bebês';
    if (room === 'pequenos') return 'Pequenos';
    if (room === 'grandes') return 'Grandes';
    if (room === 'unificada') return 'Sala Unificada';
    return 'Apoio Geral';
}
