'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { supabase, Event, Unavailability } from '@/lib/supabase';
import styles from './disponibilidade.module.css';

type EventType = 'terca' | 'sabado' | 'domingo';

interface CalendarDay {
    date: Date;
    dayOfMonth: number;
    isCurrentMonth: boolean;
    isToday: boolean;
    isPast: boolean;
    event?: Event;
    eventType?: EventType;
    isUnavailable: boolean;
}

const WEEKDAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
const MONTHS = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

const EVENT_LABELS: Record<EventType, string> = {
    terca: 'Terça',
    sabado: 'EBD',
    domingo: 'Domingo',
};

export default function DisponibilidadePage() {
    const { user, isLoading: authLoading } = useAuth();
    const router = useRouter();

    const [currentMonth, setCurrentMonth] = useState(() => {
        const now = new Date();
        // Default to next month for availability
        return new Date(now.getFullYear(), now.getMonth() + 1, 1);
    });

    const [events, setEvents] = useState<Event[]>([]);
    const [unavailabilities, setUnavailabilities] = useState<Set<string>>(new Set());
    const [originalUnavailabilities, setOriginalUnavailabilities] = useState<Set<string>>(new Set());
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [showSaved, setShowSaved] = useState(false);

    // Redirect if not authenticated
    useEffect(() => {
        if (!authLoading && !user) {
            router.push('/login');
        }
    }, [authLoading, user, router]);

    // Ensure events exist via Server Action (bypasses RLS)
    const generateEventsForMonth = useCallback(async (year: number, month: number) => {
        try {
            const { ensureEventsAction } = await import('../actions'); // Dynamically import to avoid server/client mix issues if needed, or just import at top

            // Note: month is 0-indexed here from Date, but DB uses 1-indexed
            // ensureEventsAction expects 1-indexed Month (1-12)
            await ensureEventsAction(month + 1, year);

            // Fetch events (Client Read is allowed by RLS usually)
            const { data, error } = await supabase
                .from('events')
                .select('*')
                .eq('year', year)
                .eq('month', month + 1)
                .order('event_date');

            if (error) {
                console.error('Error fetching events:', error);
                return [];
            }

            return data || [];
        } catch (err) {
            console.error('Error ensuring events:', err);
            return [];
        }
    }, []);

    // Load events and unavailabilities
    const loadData = useCallback(async () => {
        if (!user) return;

        setIsLoading(true);
        try {
            const year = currentMonth.getFullYear();
            const month = currentMonth.getMonth();

            // Generate/fetch events for the month
            const monthEvents = await generateEventsForMonth(year, month);
            setEvents(monthEvents);

            // Fetch user's unavailabilities for these events
            const eventIds = monthEvents.map(e => e.id);
            if (eventIds.length > 0) {
                const { data: unavailData, error } = await supabase
                    .from('unavailabilities')
                    .select('event_id')
                    .eq('volunteer_id', user.id)
                    .in('event_id', eventIds);

                if (error) {
                    console.error('Error fetching unavailabilities:', error);
                } else {
                    const unavailSet = new Set(unavailData?.map(u => u.event_id) || []);
                    setUnavailabilities(unavailSet);
                    setOriginalUnavailabilities(new Set(unavailSet));
                }
            }
        } catch (err) {
            console.error('Error loading data:', err);
        } finally {
            setIsLoading(false);
        }
    }, [user, currentMonth, generateEventsForMonth]);

    useEffect(() => {
        if (user) {
            loadData();
        }
    }, [user, loadData]);

    // Generate calendar days
    const generateCalendarDays = useCallback((): CalendarDay[] => {
        const year = currentMonth.getFullYear();
        const month = currentMonth.getMonth();
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const days: CalendarDay[] = [];

        // Add empty cells for days before the first day of month
        const startDayOfWeek = firstDay.getDay();
        for (let i = 0; i < startDayOfWeek; i++) {
            days.push({
                date: new Date(year, month, -startDayOfWeek + i + 1),
                dayOfMonth: 0,
                isCurrentMonth: false,
                isToday: false,
                isPast: true,
                isUnavailable: false,
            });
        }

        // Add days of the month
        for (let d = 1; d <= lastDay.getDate(); d++) {
            const date = new Date(year, month, d);
            const dayOfWeek = date.getDay();
            const dateStr = date.toISOString().split('T')[0];

            // Find event for this day
            const event = events.find(e => e.event_date === dateStr);

            days.push({
                date,
                dayOfMonth: d,
                isCurrentMonth: true,
                isToday: date.getTime() === today.getTime(),
                isPast: date < today,
                event,
                eventType: event?.event_type as EventType | undefined,
                isUnavailable: event ? unavailabilities.has(event.id) : false,
            });
        }

        // Add empty cells to complete the last week
        const remainingDays = 7 - (days.length % 7);
        if (remainingDays < 7) {
            for (let i = 0; i < remainingDays; i++) {
                days.push({
                    date: new Date(year, month + 1, i + 1),
                    dayOfMonth: 0,
                    isCurrentMonth: false,
                    isToday: false,
                    isPast: false,
                    isUnavailable: false,
                });
            }
        }

        return days;
    }, [currentMonth, events, unavailabilities]);

    // Toggle unavailability
    const toggleUnavailability = (day: CalendarDay) => {
        if (!day.event || day.isPast || !day.isCurrentMonth) return;

        const eventId = day.event.id;
        const newUnavailabilities = new Set(unavailabilities);

        if (newUnavailabilities.has(eventId)) {
            newUnavailabilities.delete(eventId);
        } else {
            newUnavailabilities.add(eventId);
        }

        setUnavailabilities(newUnavailabilities);
        setShowSaved(false);
    };

    // Save unavailabilities
    const saveUnavailabilities = async () => {
        if (!user) return;

        setIsSaving(true);
        try {
            // Get event IDs for current month
            const eventIds = events.map(e => e.id);

            // Delete all current unavailabilities for this month
            await supabase
                .from('unavailabilities')
                .delete()
                .eq('volunteer_id', user.id)
                .in('event_id', eventIds);

            // Insert new unavailabilities
            if (unavailabilities.size > 0) {
                const newUnavailabilities = Array.from(unavailabilities).map(eventId => ({
                    volunteer_id: user.id,
                    event_id: eventId,
                }));

                const { error } = await supabase
                    .from('unavailabilities')
                    .insert(newUnavailabilities);

                if (error) {
                    console.error('Error saving unavailabilities:', error);
                    return;
                }
            }

            setOriginalUnavailabilities(new Set(unavailabilities));
            setShowSaved(true);
            setTimeout(() => setShowSaved(false), 3000);
        } catch (err) {
            console.error('Error saving:', err);
        } finally {
            setIsSaving(false);
        }
    };

    // Check if there are unsaved changes
    const hasChanges = () => {
        if (unavailabilities.size !== originalUnavailabilities.size) return true;
        for (const id of unavailabilities) {
            if (!originalUnavailabilities.has(id)) return true;
        }
        return false;
    };

    // Navigate months
    const goToPreviousMonth = () => {
        setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
    };

    const goToNextMonth = () => {
        setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
    };

    // Calculate stats
    const totalEvents = events.filter(e => {
        const eventDate = new Date(e.event_date);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return eventDate >= today;
    }).length;
    const unavailableCount = Array.from(unavailabilities).filter(id => {
        const event = events.find(e => e.id === id);
        if (!event) return false;
        const eventDate = new Date(event.event_date);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return eventDate >= today;
    }).length;
    const availableCount = totalEvents - unavailableCount;

    if (authLoading || isLoading) {
        return (
            <div className={styles.loading}>
                <div className={styles.loadingSpinner}></div>
                <p className={styles.loadingText}>Carregando calendário...</p>
            </div>
        );
    }

    if (!user) {
        return null;
    }

    const calendarDays = generateCalendarDays();
    const canGoPrevious = currentMonth > new Date();

    return (
        <div className={styles.calendarContainer}>
            <header className={styles.header}>
                <Link href="/dashboard" className={styles.backButton}>
                    ←
                </Link>
                <div className={styles.headerContent}>
                    <h1 className={styles.headerTitle}>Disponibilidade</h1>
                    <p className={styles.headerSubtitle}>Marque os dias que você NÃO pode ir</p>
                </div>
            </header>

            {/* Month Navigation */}
            <div className={styles.monthNav}>
                <button
                    className={styles.monthNavButton}
                    onClick={goToPreviousMonth}
                    disabled={!canGoPrevious}
                >
                    ‹
                </button>
                <span className={styles.monthTitle}>
                    {MONTHS[currentMonth.getMonth()]} {currentMonth.getFullYear()}
                </span>
                <button
                    className={styles.monthNavButton}
                    onClick={goToNextMonth}
                >
                    ›
                </button>
            </div>

            {/* Stats */}
            <div className={styles.statsRow}>
                <div className={`${styles.statCard} ${styles.statAvailable}`}>
                    <div className={styles.statNumber}>{availableCount}</div>
                    <div className={styles.statLabel}>Disponível</div>
                </div>
                <div className={`${styles.statCard} ${styles.statUnavailable}`}>
                    <div className={styles.statNumber}>{unavailableCount}</div>
                    <div className={styles.statLabel}>Indisponível</div>
                </div>
            </div>

            {/* Legend */}
            <div className={styles.legend}>
                <div className={styles.legendItem}>
                    <div className={`${styles.legendDot} ${styles.legendDotAvailable}`}></div>
                    <span>Disponível</span>
                </div>
                <div className={styles.legendItem}>
                    <div className={`${styles.legendDot} ${styles.legendDotUnavailable}`}></div>
                    <span>Indisponível</span>
                </div>
                <div className={styles.legendItem}>
                    <div className={`${styles.legendDot} ${styles.legendDotDisabled}`}></div>
                    <span>Sem culto</span>
                </div>
            </div>

            {/* Calendar */}
            <div className={styles.calendarCard}>
                <div className={styles.weekDays}>
                    {WEEKDAYS.map(day => (
                        <div key={day} className={styles.weekDay}>{day}</div>
                    ))}
                </div>

                <div className={styles.daysGrid}>
                    {calendarDays.map((day, index) => {
                        if (!day.isCurrentMonth) {
                            return <div key={index} className={`${styles.dayCell} ${styles.dayEmpty}`}></div>;
                        }

                        if (!day.event) {
                            return (
                                <div key={index} className={`${styles.dayCell} ${styles.dayDisabled}`}>
                                    <span className={styles.dayNumber}>{day.dayOfMonth}</span>
                                </div>
                            );
                        }

                        if (day.isPast) {
                            return (
                                <div key={index} className={`${styles.dayCell} ${styles.dayPast}`}>
                                    <span className={styles.dayNumber}>{day.dayOfMonth}</span>
                                    <span className={styles.dayType}>{EVENT_LABELS[day.eventType!]}</span>
                                </div>
                            );
                        }

                        const stateClass = day.isUnavailable ? styles.dayUnavailable : styles.dayAvailable;
                        const todayClass = day.isToday ? styles.dayToday : '';

                        return (
                            <div
                                key={index}
                                className={`${styles.dayCell} ${stateClass} ${todayClass}`}
                                onClick={() => toggleUnavailability(day)}
                            >
                                <span className={styles.dayNumber}>{day.dayOfMonth}</span>
                                <span className={styles.dayType}>{EVENT_LABELS[day.eventType!]}</span>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Actions */}
            <div className={styles.actionsCard}>
                <h3 className={styles.actionsTitle}>💡 Como funciona</h3>
                <p className={styles.actionsDescription}>
                    Clique nos dias com culto para alternar entre <strong>disponível</strong> (verde)
                    e <strong>indisponível</strong> (vermelho). Depois, salve suas alterações.
                </p>

                <button
                    className={styles.saveButton}
                    onClick={saveUnavailabilities}
                    disabled={isSaving || !hasChanges()}
                >
                    {isSaving ? (
                        <>
                            <span className={styles.loadingSpinner} style={{ width: 20, height: 20, borderWidth: 2 }}></span>
                            Salvando...
                        </>
                    ) : (
                        <>
                            💾 Salvar Disponibilidade
                        </>
                    )}
                </button>

                {showSaved && (
                    <div className={styles.savedMessage}>
                        ✅ Disponibilidade salva com sucesso!
                    </div>
                )}
            </div>
        </div>
    );
}
