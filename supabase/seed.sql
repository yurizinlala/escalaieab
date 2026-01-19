-- =====================================================
-- SEED DATA: Dados de Teste para IEAB
-- =====================================================
-- NOTA: PINs são armazenados em hash SHA256 simples para demo
-- Em produção, use bcrypt ou argon2

-- Limpar dados existentes (para re-seed)
TRUNCATE TABLE sessions CASCADE;
TRUNCATE TABLE ebd_pairs_history CASCADE;
TRUNCATE TABLE schedules CASCADE;
TRUNCATE TABLE unavailabilities CASCADE;
TRUNCATE TABLE events CASCADE;
TRUNCATE TABLE volunteers CASCADE;

-- =====================================================
-- VOLUNTÁRIOS
-- =====================================================
-- PIN padrão para todos os usuários de teste: 1234
-- SHA256('1234') = 03ac674216f3e15c761ee1a5e255f067953623c8b388b4459e13f978d7c846f4

-- Admin: Raíssa (PIN: 0000)
-- SHA256('0000') = 9af15b336e6a9619928537df30b2e6a2376569fcf9d7e773eccede65606529a0
INSERT INTO volunteers (phone, pin_hash, name, role, room) VALUES
('84996010166', '9af15b336e6a9619928537df30b2e6a2376569fcf9d7e773eccede65606529a0', 'Raíssa', 'admin', NULL);

-- Voluntário: Yuri (PIN: 1234)
INSERT INTO volunteers (phone, pin_hash, name, role, room) VALUES
('84987074247', '03ac674216f3e15c761ee1a5e255f067953623c8b388b4459e13f978d7c846f4', 'Yuri', 'auxiliar', NULL);

-- Professores de Bebês (3)
INSERT INTO volunteers (phone, pin_hash, name, role, room) VALUES
('84999991001', '03ac674216f3e15c761ee1a5e255f067953623c8b388b4459e13f978d7c846f4', 'Ana Paula', 'professor', 'bebes'),
('84999991002', '03ac674216f3e15c761ee1a5e255f067953623c8b388b4459e13f978d7c846f4', 'Beatriz', 'professor', 'bebes'),
('84999991003', '03ac674216f3e15c761ee1a5e255f067953623c8b388b4459e13f978d7c846f4', 'Carla', 'professor', 'bebes');

-- Professores de Pequenos (3)
INSERT INTO volunteers (phone, pin_hash, name, role, room) VALUES
('84999992001', '03ac674216f3e15c761ee1a5e255f067953623c8b388b4459e13f978d7c846f4', 'Diana', 'professor', 'pequenos'),
('84999992002', '03ac674216f3e15c761ee1a5e255f067953623c8b388b4459e13f978d7c846f4', 'Elena', 'professor', 'pequenos'),
('84999992003', '03ac674216f3e15c761ee1a5e255f067953623c8b388b4459e13f978d7c846f4', 'Fernanda', 'professor', 'pequenos');

-- Professores de Grandes (3)
INSERT INTO volunteers (phone, pin_hash, name, role, room) VALUES
('84999993001', '03ac674216f3e15c761ee1a5e255f067953623c8b388b4459e13f978d7c846f4', 'Gabriela', 'professor', 'grandes'),
('84999993002', '03ac674216f3e15c761ee1a5e255f067953623c8b388b4459e13f978d7c846f4', 'Helena', 'professor', 'grandes'),
('84999993003', '03ac674216f3e15c761ee1a5e255f067953623c8b388b4459e13f978d7c846f4', 'Isabela', 'professor', 'grandes');

-- Auxiliares (2)
INSERT INTO volunteers (phone, pin_hash, name, role, room) VALUES
('84999994001', '03ac674216f3e15c761ee1a5e255f067953623c8b388b4459e13f978d7c846f4', 'Juliana', 'auxiliar', NULL),
('84999994002', '03ac674216f3e15c761ee1a5e255f067953623c8b388b4459e13f978d7c846f4', 'Larissa', 'auxiliar', NULL);

-- =====================================================
-- RESUMO DOS LOGINS DE TESTE:
-- =====================================================
-- | Nome        | Telefone      | PIN  | Função     | Sala     |
-- |-------------|---------------|------|------------|----------|
-- | Raíssa      | 84996010166   | 0000 | Admin      | -        |
-- | Yuri        | 84987074247   | 1234 | Auxiliar   | -        |
-- | Ana Paula   | 84999991001   | 1234 | Professor  | Bebês    |
-- | Beatriz     | 84999991002   | 1234 | Professor  | Bebês    |
-- | Carla       | 84999991003   | 1234 | Professor  | Bebês    |
-- | Diana       | 84999992001   | 1234 | Professor  | Pequenos |
-- | Elena       | 84999992002   | 1234 | Professor  | Pequenos |
-- | Fernanda    | 84999992003   | 1234 | Professor  | Pequenos |
-- | Gabriela    | 84999993001   | 1234 | Professor  | Grandes  |
-- | Helena      | 84999993002   | 1234 | Professor  | Grandes  |
-- | Isabela     | 84999993003   | 1234 | Professor  | Grandes  |
-- | Juliana     | 84999994001   | 1234 | Auxiliar   | -        |
-- | Larissa     | 84999994002   | 1234 | Auxiliar   | -        |
-- =====================================================
