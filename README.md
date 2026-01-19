# Escala IEAB - Ministério Infantil

Sistema de gerenciamento de escalas para o Ministério Infantil da Igreja Evangélica Avivamento Bíblico (IEAB). Desenvolvido para facilitar a organização de voluntários, geração de escalas automáticas e gestão de indisponibilidades.

## 🚀 Funcionalidades

*   **Autenticação**: Login simples via Telefone e PIN de 4 dígitos.
*   **Gestão de Voluntários**: Cadastro, edição e remoção de voluntários (Professores e Auxiliares).
*   **Disponibilidade**: Calendário interativo para voluntários marcarem dias indisponíveis.
*   **Geração Automática**: Algoritmo que gera escalas mensais respeitando:
    *   Sábados (EBD): Dupla fixa de professores.
    *   Terças: 3 Professores (Bebês, Pequenos, Grandes) + 1 Auxiliar.
    *   Domingos: 2 Professores (Bebês, Pequenos) + 1 Auxiliar.
    *   Regras de não-repetição (descanso) e equidade.
*   **Exportação**: Geração de PDF e texto formatado para WhatsApp.
*   **PWA**: Aplicativo Progressivo (Instalável no celular).

## 🛠️ Tecnologias

*   **Frontend**: [Next.js 14](https://nextjs.org/) (App Router, TypeScript).
*   **Backend**: [Supabase](https://supabase.com/) (PostgreSQL, Auth, Realtime).
*   **Estilização**: CSS Modules (Design System próprio).
*   **Ícones**: Lucide React.
*   **PDF**: jsPDF + autoTable.

## 📦 Instalação Local

1.  **Clone o repositório**:
    ```bash
    git clone https://github.com/yurizinlala/escalaieab.git
    cd escalaieab
    ```

2.  **Instale as dependências**:
    ```bash
    npm install
    ```

3.  **Configure o Supabase**:
    *   Crie um projeto no Supabase.
    *   Execute o script SQL localizado em `supabase/schema.sql` no Editor SQL do Supabase.
    *   (Opcional) Popule com dados de teste via `supabase/seed.sql` (mas cuidado com dados reais).

4.  **Variáveis de Ambiente**:
    Crie um arquivo `.env.local` na raiz:
    ```env
    NEXT_PUBLIC_SUPABASE_URL=sua_url_supabase
    NEXT_PUBLIC_SUPABASE_ANON_KEY=sua_anon_key
    SUPABASE_SERVICE_ROLE_KEY=sua_service_role_key # Necessário para geração de escala (Admin)
    ADMIN_PHONE=seu_telefone_admin
    ```

5.  **Rodar o projeto**:
    ```bash
    npm run dev
    ```
    Acesse http://localhost:3000

## 🚀 Deploy (Vercel)

1.  Faça fork/clone deste repositório no seu GitHub.
2.  Crie um novo projeto na [Vercel](https://vercel.com/).
3.  Importe o repositório.
4.  Nas configurações do projeto na Vercel, adicione as mesmas variáveis de ambiente do passo 4.
5.  Clique em **Deploy**.

## 📱 Uso do Admin

*   **Login**: Use o telefone e PIN cadastrados.
*   **Painel Admin**: Acesso exclusivo para usuários com role `admin`.
*   **Fluxo de Geração**:
    1.  Vá em "Gerar Escala".
    2.  Selecione o mês/ano.
    3.  O sistema verificará os voluntários e regras.
    4.  Se houver conflitos, ajuste manualmente em "Editar Escala".
    5.  Exporte e envie para o grupo.

---
Desenvolvido por Antigravity.
