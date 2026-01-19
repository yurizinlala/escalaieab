'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import {
    createVolunteerAction,
    updateVolunteerAction,
    deleteVolunteerAction
} from '@/app/actions';
import {
    ArrowLeft,
    User,
    Phone,
    Shield,
    Plus,
    Edit2,
    Trash2,
    X,
    Save
} from 'lucide-react';
import styles from './equipe.module.css';

interface Volunteer {
    id: string;
    name: string;
    phone: string;
    role: string;
    room: string | null;
    is_active: boolean;
}

export default function EquipePage() {
    const [volunteers, setVolunteers] = useState<Volunteer[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [formData, setFormData] = useState({
        name: '',
        phone: '',
        role: 'auxiliar',
        room: 'null' as string | null,
        pin: ''
    });

    useEffect(() => {
        fetchVolunteers();
    }, []);

    const fetchVolunteers = async () => {
        const { data, error } = await supabase
            .from('volunteers')
            .select('*')
            .eq('is_active', true) // Only active
            .order('name');

        if (data) setVolunteers(data);
        setLoading(false);
    };

    const handleOpenAdd = () => {
        setEditingId(null);
        setFormData({ name: '', phone: '', role: 'auxiliar', room: 'null', pin: '' });
        setIsModalOpen(true);
    };

    const handleOpenEdit = (vol: Volunteer) => {
        setEditingId(vol.id);
        setFormData({
            name: vol.name,
            phone: vol.phone,
            role: vol.role,
            room: vol.room || 'null',
            pin: '' // Don't show PIN, only require if changing? Or assume admin can reset PIN? user didn't specify. 
            // createVolunteerAction requires PIN. updateVolunteerAction does NOT require PIN.
        });
        setIsModalOpen(true);
    };

    const handleDelete = async (id: string, name: string) => {
        if (!confirm(`Tem certeza que deseja remover ${name}?`)) return;

        const result = await deleteVolunteerAction(id);
        if (result.success) {
            fetchVolunteers();
        } else {
            alert('Erro ao remover: ' + result.message);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Basic validation
        if (!formData.name || !formData.phone) return alert('Preencha nome e telefone');
        if (!editingId && !formData.pin) return alert('Defina um PIN inicial');

        if (editingId) {
            const result = await updateVolunteerAction(editingId, {
                name: formData.name,
                phone: formData.phone,
                role: formData.role,
                room: formData.room
            });
            if (!result.success) return alert(result.message);
        } else {
            const result = await createVolunteerAction({
                name: formData.name,
                phone: formData.phone,
                role: formData.role,
                room: formData.room,
                pin: formData.pin
            });
            if (!result.success) return alert(result.message);
        }

        setIsModalOpen(false);
        fetchVolunteers();
    };

    const getRoleLabel = (role: string) => {
        switch (role) {
            case 'admin': return 'Administrador';
            case 'professor': return 'Professor(a)';
            case 'auxiliar': return 'Auxiliar';
            default: return role;
        }
    };

    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <Link href="/admin" className={styles.backButton}>
                    <ArrowLeft size={24} />
                </Link>
                <h1 className={styles.title}>Gerenciar Equipe</h1>
                <button className={styles.addButton} onClick={handleOpenAdd}>
                    <Plus size={20} /> Adicionar
                </button>
            </header>

            {loading ? (
                <p className={styles.loading}>Carregando...</p>
            ) : (
                <div className={styles.list}>
                    {volunteers.map(vol => (
                        <div key={vol.id} className={styles.card}>
                            <div className={styles.avatar}>
                                <User size={24} />
                            </div>
                            <div className={styles.info}>
                                <h3 className={styles.name}>{vol.name}</h3>
                                <div className={styles.details}>
                                    <span className={styles.badge}>
                                        <Shield size={12} /> {getRoleLabel(vol.role)}
                                    </span>
                                    <span className={styles.phone}>
                                        <Phone size={12} /> {vol.phone}
                                    </span>
                                </div>
                            </div>
                            <div className={styles.actions}>
                                <button className={styles.actionBtn} onClick={() => handleOpenEdit(vol)}>
                                    <Edit2 size={18} />
                                </button>
                                <button className={`${styles.actionBtn} ${styles.deleteBtn}`} onClick={() => handleDelete(vol.id, vol.name)}>
                                    <Trash2 size={18} />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {isModalOpen && (
                <div className={styles.modalOverlay}>
                    <div className={styles.modal}>
                        <div className={styles.modalHeader}>
                            <h2>{editingId ? 'Editar Voluntário' : 'Novo Voluntário'}</h2>
                            <button className={styles.closeBtn} onClick={() => setIsModalOpen(false)}>
                                <X size={24} />
                            </button>
                        </div>
                        <form onSubmit={handleSubmit} className={styles.form}>
                            <div className={styles.inputGroup}>
                                <label>Nome</label>
                                <input
                                    value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                    placeholder="Nome completo"
                                    required
                                />
                            </div>
                            <div className={styles.inputGroup}>
                                <label>Telefone</label>
                                <input
                                    value={formData.phone}
                                    onChange={e => setFormData({ ...formData, phone: e.target.value })}
                                    placeholder="(84) 99999-9999"
                                    required
                                />
                            </div>
                            <div className={styles.row}>
                                <div className={styles.inputGroup}>
                                    <label>Função</label>
                                    <select
                                        value={formData.role}
                                        onChange={e => setFormData({ ...formData, role: e.target.value })}
                                    >
                                        <option value="auxiliar">Auxiliar</option>
                                        <option value="professor">Professor(a)</option>
                                        <option value="admin">Administrador</option>
                                    </select>
                                </div>
                                <div className={styles.inputGroup}>
                                    <label>Sala Fixa</label>
                                    <select
                                        value={formData.room || 'null'}
                                        onChange={e => setFormData({ ...formData, room: e.target.value })}
                                    >
                                        <option value="null">Nenhuma</option>
                                        <option value="bebes">Bebês</option>
                                        <option value="pequenos">Pequenos</option>
                                        <option value="grandes">Grandes</option>
                                    </select>
                                </div>
                            </div>
                            {!editingId && (
                                <div className={styles.inputGroup}>
                                    <label>PIN Inicial</label>
                                    <input
                                        value={formData.pin}
                                        onChange={e => setFormData({ ...formData, pin: e.target.value })}
                                        placeholder="4 dígitos"
                                        maxLength={4}
                                        required
                                    />
                                </div>
                            )}

                            <button type="submit" className={styles.saveButton}>
                                <Save size={18} /> Salvar
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
