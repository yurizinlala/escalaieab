'use client';

import { useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { ArrowLeft, MessageCircle, FileText } from 'lucide-react';
import styles from './exportar.module.css';

const MONTHS = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

export default function ExportarPage() {
    const [selectedDate, setSelectedDate] = useState(() => {
        const now = new Date();
        return new Date(now.getFullYear(), now.getMonth() + 1, 1);
    });
    const [loading, setLoading] = useState(false);

    const handleMonthChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const newMonth = parseInt(e.target.value);
        const newDate = new Date(selectedDate.getFullYear(), newMonth, 1);
        setSelectedDate(newDate);
    };

    const handleYearChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newYear = parseInt(e.target.value);
        const newDate = new Date(newYear, selectedDate.getMonth(), 1);
        setSelectedDate(newDate);
    };

    const fetchSchedule = async () => {
        const year = selectedDate.getFullYear();
        const month = selectedDate.getMonth() + 1;

        const { data: scheduleData, error } = await supabase
            .from('schedules')
            .select(`
        assigned_role,
        assigned_room,
        volunteer:volunteers(name),
        event:events(event_date, event_type)
      `)
            .eq('month', month)
            .eq('year', year)
            .order('event_id');

        if (error) {
            alert('Erro ao buscar dados.');
            return [];
        }

        // Sort chronologically
        return (scheduleData as any[]).sort((a, b) =>
            new Date(a.event.event_date).getTime() - new Date(b.event.event_date).getTime()
        );
    };

    const generatePDF = async () => {
        setLoading(true);
        const schedule = await fetchSchedule();

        if (schedule.length === 0) {
            alert('Nenhuma escala encontrada para este mês.');
            setLoading(false);
            return;
        }

        const doc = new jsPDF();
        const monthName = MONTHS[selectedDate.getMonth()];
        const year = selectedDate.getFullYear();

        // Title
        doc.setFontSize(18);
        doc.setTextColor(40, 40, 40);
        doc.text(`Escala IEAB - ${monthName}/${year}`, 14, 20);

        // Prepare Data for Table
        // Group by Date
        const grouped: Record<string, any[]> = {};
        schedule.forEach(item => {
            const date = item.event.event_date;
            if (!grouped[date]) grouped[date] = [];
            grouped[date].push(item);
        });

        const tableData: any[] = [];

        // Columns: Data, Dia, Bebês, Pequenos, Grandes, Apoio
        Object.entries(grouped).forEach(([dateStr, items]) => {
            const date = new Date(dateStr);
            date.setDate(date.getDate() + 1); // Fix Timezone
            const dayStr = `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}`;
            const weekDay = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'][date.getDay()];

            const row: any = {
                data: dayStr,
                dia: weekDay,
                bebes: '',
                pequenos: '',
                grandes: '',
                apoio: ''
            };

            if (items[0].event.event_type === 'sabado') {
                // EBD Layout
                row.dia = 'Sábado (EBD)';
                row.bebes = '-';
                row.grandes = '-';

                // Find professors/aux
                const profs = items.filter((i: any) => i.assigned_role === 'professor');
                const aux = items.filter((i: any) => i.assigned_role === 'auxiliar');

                row.pequenos = profs.map((p: any) => p.volunteer.name).join(', '); // Put EBD prof in "Pequenos" column or merge?
                // Better: Just put in "Unificada" logic, but standardizing columns is hard.
                // Let's use flexible columns: "Sala 1 / EBD", "Sala 2", "Sala 3"
                // Or stick to room names. EBD usually uses Unificada.

                // Let's put EBD prof in 'Pequenos' column conceptually or just 'Bebes' as 'Sala Principal'.
                // User requested: "Bebês, Pequenos, Grandes, Apoio".
                // For EBD (Unified), let's put in 'Pequenos' and mark others as '-'
                if (profs.length > 0) row.pequenos = profs.map((p: any) => p.volunteer.name).join(' & ');
                if (aux.length > 0) row.apoio = aux.map((a: any) => a.volunteer.name).join(', ');

            } else {
                // Normal Culto
                const bebes = items.filter((i: any) => i.assigned_room === 'bebes').map((v: any) => v.volunteer.name).join(', ');
                const pequenos = items.filter((i: any) => i.assigned_room === 'pequenos').map((v: any) => v.volunteer.name).join(', ');
                const grandes = items.filter((i: any) => i.assigned_room === 'grandes').map((v: any) => v.volunteer.name).join(', ');
                const apoio = items.filter((i: any) => i.assigned_role === 'auxiliar').map((v: any) => v.volunteer.name).join(', ');

                row.bebes = bebes || '-';
                row.pequenos = pequenos || '-';
                row.grandes = grandes || '-';
                row.apoio = apoio || '-';
            }

            tableData.push([row.data, row.dia, row.bebes, row.pequenos, row.grandes, row.apoio]);
        });

        autoTable(doc, {
            head: [['Data', 'Dia', 'Bebês', 'Pequenos', 'Grandes', 'Apoio']],
            body: tableData,
            startY: 30,
            styles: { fontSize: 10, cellPadding: 3 },
            headStyles: { fillColor: [59, 130, 246] },
            alternateRowStyles: { fillColor: [240, 247, 255] },
            columnStyles: {
                0: { cellWidth: 20 },
                1: { cellWidth: 30 },
            }
        });

        doc.save(`Escala_IEAB_${monthName}_${year}.pdf`);
        setLoading(false);
    };

    const copyWhatsApp = async () => {
        setLoading(true);
        const schedule = await fetchSchedule();
        const monthName = MONTHS[selectedDate.getMonth()];

        let text = `*Escala IEAB - ${monthName}/${selectedDate.getFullYear()}*\n\n`;

        const grouped: Record<string, any[]> = {};
        schedule.forEach(item => {
            const date = item.event.event_date;
            if (!grouped[date]) grouped[date] = [];
            grouped[date].push(item);
        });

        Object.entries(grouped).forEach(([dateStr, items]) => {
            const date = new Date(dateStr);
            date.setDate(date.getDate() + 1);
            const day = date.getDate().toString().padStart(2, '0');
            const weekDays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
            const weekDay = weekDays[date.getDay()];

            text += `*${day}/${(date.getMonth() + 1).toString().padStart(2, '0')} - ${weekDay}*\n`;

            const bebes = items.filter((i: any) => i.assigned_room === 'bebes').map((v: any) => v.volunteer.name).join(', ');
            const pequenos = items.filter((i: any) => i.assigned_room === 'pequenos').map((v: any) => v.volunteer.name).join(', ');
            const grandes = items.filter((i: any) => i.assigned_room === 'grandes').map((v: any) => v.volunteer.name).join(', ');
            const apoio = items.filter((i: any) => i.assigned_role === 'auxiliar').map((v: any) => v.volunteer.name).join(', ');
            const abd = items.filter((i: any) => i.event.event_type === 'sabado' && i.assigned_role === 'professor').map((v: any) => v.volunteer.name).join(' & ');

            if (items[0].event.event_type === 'sabado') {
                text += `👶 EBD: ${abd}\n`;
                if (apoio) text += `🤝 Apoio: ${apoio}\n`;
            } else {
                if (bebes) text += `👶 Bebês: ${bebes}\n`;
                if (pequenos) text += `🎨 Pequenos: ${pequenos}\n`;
                if (grandes) text += `📚 Grandes: ${grandes}\n`;
                if (apoio) text += `🤝 Apoio: ${apoio}\n`;
            }
            text += `\n`;
        });

        try {
            await navigator.clipboard.writeText(text);
            alert('Copiado para a área de transferência!');
        } catch (err) {
            alert('Erro ao copiar. Permissão negada.');
        }
        setLoading(false);
    };

    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <Link href="/admin" className={styles.backButton}>
                    <ArrowLeft size={24} />
                </Link>
                <h1 className={styles.title}>Exportar Escala</h1>
            </header>

            <div className={styles.card}>
                <div className={styles.controls}>
                    <label className={styles.label}>Selecione o Mês</label>
                    <div className={styles.dateInputs}>
                        <select
                            value={selectedDate.getMonth()}
                            onChange={handleMonthChange}
                            className={styles.select}
                        >
                            {MONTHS.map((m, i) => (
                                <option key={i} value={i}>{m}</option>
                            ))}
                        </select>
                        <input
                            type="number"
                            value={selectedDate.getFullYear()}
                            onChange={handleYearChange}
                            className={styles.input}
                        />
                    </div>
                </div>

                <div className={styles.actions}>
                    <button className={styles.whatsappButton} onClick={copyWhatsApp} disabled={loading}>
                        <MessageCircle size={18} />
                        Copiar para WhatsApp
                    </button>

                    <button className={styles.pdfButton} onClick={generatePDF} disabled={loading}>
                        <FileText size={18} />
                        {loading ? 'Gerando...' : 'Baixar PDF da Escala'}
                    </button>
                </div>
            </div>
        </div>
    );
}
