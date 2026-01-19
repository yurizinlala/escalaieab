-- =====================================================
-- SCHEMA: Sistema de Gerenciamento de Escala IEAB
-- =====================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- TABLE: volunteers (Voluntários)
-- =====================================================
CREATE TABLE IF NOT EXISTS volunteers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    phone VARCHAR(20) UNIQUE NOT NULL,
    pin_hash VARCHAR(255) NOT NULL,
    name VARCHAR(100) NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('professor', 'auxiliar', 'admin')),
    room VARCHAR(20) CHECK (room IN ('bebes', 'pequenos', 'grandes') OR room IS NULL),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for phone lookup during login
CREATE INDEX IF NOT EXISTS idx_volunteers_phone ON volunteers(phone);

-- =====================================================
-- TABLE: events (Eventos/Dias de Culto)
-- =====================================================
CREATE TABLE IF NOT EXISTS events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_date DATE NOT NULL,
    event_type VARCHAR(20) NOT NULL CHECK (event_type IN ('terca', 'sabado', 'domingo')),
    month INT NOT NULL,
    year INT NOT NULL,
    is_published BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(event_date)
);

-- Index for querying events by month/year
CREATE INDEX IF NOT EXISTS idx_events_month_year ON events(year, month);

-- =====================================================
-- TABLE: unavailabilities (Indisponibilidades)
-- =====================================================
CREATE TABLE IF NOT EXISTS unavailabilities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    volunteer_id UUID NOT NULL REFERENCES volunteers(id) ON DELETE CASCADE,
    event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(volunteer_id, event_id)
);

-- Index for querying unavailabilities by volunteer
CREATE INDEX IF NOT EXISTS idx_unavailabilities_volunteer ON unavailabilities(volunteer_id);

-- =====================================================
-- TABLE: schedules (Escalas)
-- =====================================================
CREATE TABLE IF NOT EXISTS schedules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    volunteer_id UUID NOT NULL REFERENCES volunteers(id) ON DELETE CASCADE,
    assigned_role VARCHAR(20) NOT NULL CHECK (assigned_role IN ('professor', 'auxiliar')),
    assigned_room VARCHAR(20) CHECK (assigned_room IN ('bebes', 'pequenos', 'grandes', 'unificada')),
    month INT NOT NULL,
    year INT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(event_id, volunteer_id)
);

-- Index for querying schedules by month/year
CREATE INDEX IF NOT EXISTS idx_schedules_month_year ON schedules(year, month);

-- =====================================================
-- TABLE: ebd_pairs_history (Histórico de Duplas EBD)
-- =====================================================
CREATE TABLE IF NOT EXISTS ebd_pairs_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    professor1_id UUID NOT NULL REFERENCES volunteers(id) ON DELETE CASCADE,
    professor2_id UUID NOT NULL REFERENCES volunteers(id) ON DELETE CASCADE,
    month INT NOT NULL,
    year INT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(month, year)
);

-- =====================================================
-- TABLE: sessions (Sessões de Login)
-- Para autenticação customizada com telefone+PIN
-- =====================================================
CREATE TABLE IF NOT EXISTS sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    volunteer_id UUID NOT NULL REFERENCES volunteers(id) ON DELETE CASCADE,
    token VARCHAR(255) UNIQUE NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for token lookup
CREATE INDEX IF NOT EXISTS idx_sessions_token ON sessions(token);
-- Index for cleanup of expired sessions
CREATE INDEX IF NOT EXISTS idx_sessions_expires ON sessions(expires_at);

-- =====================================================
-- TRIGGER: Auto-update updated_at
-- =====================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_volunteers_updated_at
    BEFORE UPDATE ON volunteers
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- RLS: Row Level Security Policies
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE volunteers ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE unavailabilities ENABLE ROW LEVEL SECURITY;
ALTER TABLE schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE ebd_pairs_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;

-- Policies for anon access (needed for login)
-- Volunteers: allow select for login verification
CREATE POLICY "Allow anon to read volunteers for login" ON volunteers
    FOR SELECT USING (true);

-- Events: allow read for all
CREATE POLICY "Allow read events" ON events
    FOR SELECT USING (true);

-- Unavailabilities: allow authenticated operations
CREATE POLICY "Allow all on unavailabilities" ON unavailabilities
    FOR ALL USING (true);

-- Schedules: allow read for all
CREATE POLICY "Allow read schedules" ON schedules
    FOR SELECT USING (true);

-- Sessions: allow all for auth operations
CREATE POLICY "Allow all on sessions" ON sessions
    FOR ALL USING (true);

-- EBD Pairs History: allow read
CREATE POLICY "Allow read ebd_pairs_history" ON ebd_pairs_history
    FOR SELECT USING (true);
