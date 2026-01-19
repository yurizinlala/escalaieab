'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { generateScheduleAction } from '@/app/actions';
import { ArrowLeft, Rocket, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';
import styles from './gerar-escala.module.css';

const MONTHS = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

export default function GerarEscalaPage() {
    const router = useRouter();
    const [selectedDate, setSelectedDate] = useState(() => {
        const now = new Date();
        // Default to next month
        return new Date(now.getFullYear(), now.getMonth() + 1, 1);
    });

    const [isLoading, setIsLoading] = useState(false);
    const [logs, setLogs] = useState<string[]>([]);
    const [success, setSuccess] = useState(false);

    const handleGenerate = async () => {
        setIsLoading(true);
        setLogs([]);
        setSuccess(false);

        try {
            const month = selectedDate.getMonth() + 1;
            const year = selectedDate.getFullYear();

            setLogs(prev => [...prev, `Iniciando solicitação para ${month}/${year}...`]);

            const result = await generateScheduleAction(month, year);

            if (result.logs) {
                setLogs(prev => [...prev, ...result.logs]);
            }

            if (result.success) {
                setSuccess(true);
                setLogs(prev => [...prev, '✅ CONCLUÍDO: Escala gerada com sucesso!']);
            } else {
                setLogs(prev => [...prev, `❌ ERRO: ${result.message}`]);
            }
        } catch (error) {
            setLogs(prev => [...prev, '❌ Erro de comunicação com o servidor.']);
        } finally {
            setIsLoading(false);
        }
    };

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

    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <Link href="/admin" className={styles.backButton}>
                    <ArrowLeft size={24} />
                </Link>
                <h1 className={styles.title}>Gerar Escala Automática</h1>
            </header>

            <div className={styles.configCard}>
                <div className={styles.inputGroup}>
                    <label className={styles.label}>Mês Alvo</label>
                    <div className={styles.dateControls}>
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

                <div className={styles.infoBox}>
                    <p><AlertTriangle size={16} style={{ display: 'inline', marginBottom: -2 }} /> <strong>Atenção:</strong> Ao gerar a escala, qualquer agendamento existente para este mês será removido e substituído.</p>
                </div>

                <button
                    className={styles.generateButton}
                    onClick={handleGenerate}
                    disabled={isLoading}
                >
                    {isLoading ? (
                        <>
                            <span className={styles.spinner}></span>
                            Gerando...
                        </>
                    ) : (
                        <><Rocket size={18} /> Iniciar Geração</>
                    )}
                </button>
            </div>

            <div className={styles.logCard}>
                <h3 className={styles.logTitle}>Log de Execução</h3>
                <div className={styles.logConsole}>
                    {logs.length === 0 ? (
                        <span className={styles.logPlaceholder}>Aguardando início...</span>
                    ) : (
                        logs.map((log, i) => (
                            <div key={i} className={styles.logEntry}>{log}</div>
                        ))
                    )}
                </div>
            </div>

            {success && (
                <div className={styles.actions}>
                    <Link href="/disponibilidade" className={styles.actionButton}>
                        Visualizar Calendário
                    </Link>
                </div>
            )}
        </div>
    );
}
