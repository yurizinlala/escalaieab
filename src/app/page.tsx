'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

export default function HomePage() {
  const { user, isLoading, isAdmin } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading) {
      if (!user) {
        router.push('/login');
      } else if (isAdmin) {
        router.push('/admin');
      } else {
        router.push('/dashboard');
      }
    }
  }, [user, isLoading, isAdmin, router]);

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      gap: '16px',
      flexDirection: 'column'
    }}>
      <div className="spinner" style={{
        width: '48px',
        height: '48px',
        border: '4px solid rgba(255,255,255,0.1)',
        borderTopColor: '#8b5cf6',
        borderRadius: '50%',
        animation: 'spin 0.8s linear infinite'
      }}></div>
      <p style={{ color: '#64748b', fontSize: '14px' }}>Carregando...</p>
    </div>
  );
}
