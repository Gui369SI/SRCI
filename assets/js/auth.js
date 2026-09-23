/* ==========================================================================
   SRCI — Auth & Session Guard Helper
   ========================================================================== */

window.SRCI_AUTH = {
  // Retorna o usuário logado atualmente ou null
  getUser: async function () {
    if (!window.supabaseClient) return null;
    const { data: { session }, error } = await window.supabaseClient.auth.getSession();
    if (error || !session) return null;
    return session.user;
  },

  // Retorna o perfil completo do usuário logado na tabela public.perfis
  getProfile: async function () {
    const user = await this.getUser();
    if (!user) return null;

    const { data, error } = await window.supabaseClient
      .from('perfis')
      .select('*')
      .eq('id', user.id)
      .single();

    if (error) {
      console.error("Erro ao buscar perfil do usuário:", error);
      return null;
    }
    return data;
  },

  // Login via e-mail corporativo e senha
  login: async function (email, password) {
    if (!window.supabaseClient) throw new Error("Cliente Supabase não inicializado.");
    const { data, error } = await window.supabaseClient.auth.signInWithPassword({
      email: email,
      password: password
    });
    if (error) throw error;
    return data;
  },

  // Logout do sistema
  logout: async function () {
    if (!window.supabaseClient) return;
    await window.supabaseClient.auth.signOut();
    window.location.href = 'index.html';
  },

  // Redefinição de senha por e-mail
  resetPassword: async function (email) {
    if (!window.supabaseClient) throw new Error("Cliente Supabase não inicializado.");
    const { data, error } = await window.supabaseClient.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin + '/index.html'
    });
    if (error) throw error;
    return data;
  },

  // Redireciona o usuário pós-login com base na sua função/perfil (RF-04)
  redirectUserByRole: function (perfil) {
    switch (perfil) {
      case 'solicitante':
        window.location.href = 'dashboard.html';
        break;
      case 'aprovador':
        window.location.href = 'aprovacoes.html';
        break;
      case 'almoxarife':
      case 'admin':
        window.location.href = 'dashboard.html';
        break;
      default:
        window.location.href = 'dashboard.html';
    }
  },

  // Guard de proteção de páginas internas
  checkAuth: async function (requiredRoles = []) {
    const user = await this.getUser();
    if (!user) {
      window.location.href = 'index.html';
      return null;
    }

    const profile = await this.getProfile();
    if (!profile) {
      console.warn("Perfil não localizado no banco public.perfis.");
    } else if (requiredRoles.length > 0 && !requiredRoles.includes(profile.perfil)) {
      alert("Acesso negado: seu perfil (" + profile.perfil + ") não possui permissão para acessar esta página.");
      this.redirectUserByRole(profile.perfil);
      return null;
    }

    this.renderHeaderAndNavigation(profile);
    return profile;
  },

  // Renderiza a Sidebar/TopBar comum em todas as páginas estáticas
  renderHeaderAndNavigation: function (profile) {
    const sidebarEl = document.getElementById('app-sidebar');
    if (!sidebarEl) return;

    const perfil = profile ? profile.perfil : 'solicitante';
    const nome = profile ? profile.nome : 'Usuário';
    const setor = profile ? profile.setor : 'Geral';

    const currentPage = window.location.pathname.split('/').pop() || 'dashboard.html';

    let navHtml = `
      <a href="dashboard.html" class="nav-item ${currentPage === 'dashboard.html' ? 'active' : ''}">
        <span class="material-symbols-outlined">dashboard</span>
        <span>Dashboard</span>
      </a>
      <a href="requisitar.html" class="nav-item ${currentPage === 'requisitar.html' ? 'active' : ''}">
        <span class="material-symbols-outlined">add_box</span>
        <span>Nova Requisição</span>
      </a>
      <a href="minhas-requisicoes.html" class="nav-item ${currentPage === 'minhas-requisicoes.html' ? 'active' : ''}">
        <span class="material-symbols-outlined">history</span>
        <span>Minhas Requisições</span>
      </a>
    `;

    if (perfil === 'aprovador' || perfil === 'admin' || perfil === 'almoxarife') {
      navHtml += `
        <a href="aprovacoes.html" class="nav-item ${currentPage === 'aprovacoes.html' ? 'active' : ''}">
          <span class="material-symbols-outlined">fact_check</span>
          <span>Fila de Aprovação</span>
        </a>
      `;
    }

    navHtml += `
      <a href="estoque.html" class="nav-item ${currentPage === 'estoque.html' ? 'active' : ''}">
        <span class="material-symbols-outlined">inventory_2</span>
        <span>Consulta de Estoque</span>
      </a>
    `;

    if (perfil === 'almoxarife' || perfil === 'admin') {
      navHtml += `
        <a href="entradas.html" class="nav-item ${currentPage === 'entradas.html' ? 'active' : ''}">
          <span class="material-symbols-outlined">move_to_inbox</span>
          <span>Entradas de Compras</span>
        </a>
        <a href="relatorios.html" class="nav-item ${currentPage === 'relatorios.html' ? 'active' : ''}">
          <span class="material-symbols-outlined">analytics</span>
          <span>Relatórios e Consumo</span>
        </a>
      `;
    }

    if (perfil === 'admin') {
      navHtml += `
        <a href="admin.html" class="nav-item ${currentPage === 'admin.html' ? 'active' : ''}">
          <span class="material-symbols-outlined">admin_panel_settings</span>
          <span>Gestão de Usuários</span>
        </a>
      `;
    }

    const initial = nome ? nome.charAt(0).toUpperCase() : 'U';

    sidebarEl.innerHTML = `
      <div class="app-sidebar-header">
        <a href="dashboard.html" class="app-sidebar-brand">
          <span class="material-symbols-outlined" style="font-size: 24px; color: #3581CA;">inventory</span>
          <span>SRCI — Insumos</span>
        </a>
      </div>
      <nav class="app-nav">
        ${navHtml}
      </nav>
      <div class="sidebar-user">
        <div class="user-avatar">${initial}</div>
        <div class="user-info">
          <div class="user-name" title="${nome}">${nome}</div>
          <div class="user-role">${perfil} • ${setor}</div>
        </div>
        <button onclick="SRCI_AUTH.logout()" class="btn btn-sm btn-secondary btn-icon" title="Sair do Sistema" style="border-color: rgba(255,255,255,0.2); color: #ffffff; background: transparent;">
          <span class="material-symbols-outlined" style="font-size: 18px;">logout</span>
        </button>
      </div>
    `;
  }
};
