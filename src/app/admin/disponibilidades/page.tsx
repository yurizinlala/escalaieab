'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { ArrowLeft, Calendar } from 'lucide-react';
import styles from './disponibilidades.module.css';

const MONTHS = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

interface Unavailability {
    volunteer: { name: string };
    event: { event_date: string; event_type: string };
}

export default function DisponibilidadesPage() {
    const [month, setMonth] = useState(new Date().getMonth() + 1); // Next Month default?
    const [year, setYear] = useState(new Date().getFullYear());
    const [data, setData] = useState<Unavailability[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        // Default to next month if current day > 20
        const now = new Date();
        if (now.getDate() > 20) {
            setMonth(now.getMonth() + 2 > 12 ? 1 : now.getMonth() + 2);
            if (now.getMonth() + 2 > 12) setYear(now.getFullYear() + 1);
        } else {
            setMonth(now.getMonth() + 1);
        }
    }, []);

    useEffect(() => {
        const fetch = async () => {
            setLoading(true);
            const { data: result, error } = await supabase
                .from('unavailabilities')
                .select(`
                    volunteer:volunteers(name),
                    event:events(event_date, event_type)
                `)
                .eq('event.month', month) // This filter on joined table might be tricky in simple query
                .order('volunteer_id');

            // Supabase filtering on joined tables usually works like this:
            // !inner on events to filter by month

            const { data: filtered, error: err } = await supabase
                .from('unavailabilities')
                .select(`
                    volunteer:volunteers(name),
                    event:events!inner(event_date, event_type, month, year)
                `)
                .eq('event.month', month)
                .eq('event.year', year);

            if (filtered) setData(filtered as any);
            setLoading(false);
        };
        fetch();
    }, [month, year]);

    // Group by Volunteer
    const grouped = data.reduce((acc, curr) => {
        const name = curr.volunteer.name;
        if (!acc[name]) acc[name] = [];
        acc[name].push(curr.event.event_date);
        return acc;
    }, {} as Record<string, string[]>);

    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <Link href="/admin" className={styles.backButton}>
                    <ArrowLeft size={24} />
                </Link>
                <h1 className={styles.title}>Disponibilidades</h1>
            </header>

            <div className={styles.filters}>
                <select
                    value={month}
                    onChange={(e) => setMonth(Number(e.target.value))}
                    className={styles.select}
                >
                    {MONTHS.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
                </select>
                <input
                    type="number"
                    value={year}
                    onChange={(e) => setYear(Number(e.target.value))}
                    className={styles.input}
                />
            </div>

            {loading ? <p className={styles.loading}>Carregando...</p> : (
                <div className={styles.grid}>
                    {Object.entries(grouped).length === 0 ? (
                        <p className={styles.empty}>Nenhuma indisponibilidade registrada.</p>
                    ) : (
                        Object.entries(grouped).map(([name, dates]) => (
                            <div key={name} className={styles.card}>
                                <h3 className={styles.name}>{name}</h3>
                                <div className={styles.dates}>
                                    {dates.sort().map(date => {
                                        const d = new Date(date);
                                        d.setDate(d.getDate() + 1);
                                        return (
                                            <span key={date} className={styles.dateBadge}>
                                                {d.getDate()}/{d.getMonth() + 1}
                                            </span>
                                        );
                                    })}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            )}
        </div>
    );
}
