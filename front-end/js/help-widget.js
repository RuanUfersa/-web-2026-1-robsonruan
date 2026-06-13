(function () {
  var HELP = {
    '/index.html': {
      title: 'In\u00EDcio',
      text: 'Vis\u00E3o geral do sistema SIFU com acesso r\u00E1pido a todos os m\u00F3dulos: Gest\u00E3o de Salas, Reservas e Empr\u00E9stimos, Invent\u00E1rio, Ocorr\u00EAncias, Painel Institucional e Hub de IA.'
    },
    '/painel_institucional/code.html': {
      title: 'Painel Institucional',
      text: 'Dashboard com indicadores e gr\u00E1ficos do sistema. Acompanhe o total de reservas ativas, salas dispon\u00EDveis, ocorr\u00EAncias pendentes e materiais cadastrados em tempo real.'
    },
    '/gestao_salas/code.html': {
      title: 'Gest\u00E3o de Salas',
      text: 'Gerencie as salas de estudo: visualize, cadastre, edite, altere status (dispon\u00EDvel, ocupado, manuten\u00E7\u00E3o) e vincule recursos do invent\u00E1rio a cada sala.'
    },
    '/inventario/code.html': {
      title: 'Invent\u00E1rio de Materiais',
      text: 'Controle os materiais e equipamentos da biblioteca. Cadastre novos itens, edite informa\u00E7\u00F5es, vincule a salas e acompanhe o status de cada material.'
    },
    '/reservas_emprestimos/code.html': {
      title: 'Reservas e Empr\u00E9stimos',
      text: 'Gerencie reservas de salas e empr\u00E9stimos de materiais. Visualize reservas ativas, filtre por status, data ou cargo, e registre novas reservas.'
    },
    '/ocorrencias/code.html': {
      title: 'Ocorr\u00EAncias',
      text: 'Registre e acompanhe ocorr\u00EAncias da biblioteca. Cadastre problemas, visualize fotos, edite status (em an\u00E1lise, resolvido, cancelado) e mantenha o hist\u00F3rico de eventos.'
    },
    '/ia_relatorios/code.html': {
      title: 'Hub de IA e Relat\u00F3rios',
      text: 'Central de intelig\u00EAncia com relat\u00F3rios gerenciais e an\u00E1lises. Utilize o assistente de IA para consultar dados do sistema e gerar insights.'
    },
    '/conta/code.html': {
      title: 'Gerenciar Conta',
      text: 'Configure seu perfil de usu\u00E1rio: altere nome, foto e visualize suas informa\u00E7\u00F5es cadastrais integradas ao login Google/@ufersa.edu.br.'
    }
  };

  function getHelp() {
    var path = window.location.pathname;
    if (path.endsWith('/')) path += 'index.html';
    return HELP[path] || HELP['/index.html'];
  }

  var overlay = document.createElement('div');
  overlay.id = 'help-global-overlay';
  overlay.style.cssText = 'display:none;position:fixed;inset:0;z-index:99999;background:rgba(0,0,0,0.4);backdrop-filter:blur(4px);align-items:center;justify-content:center;';
  overlay.innerHTML =
    '<div style="background:#fff;border-radius:16px;padding:32px;max-width:480px;width:90%;margin:20px;box-shadow:0 25px 50px rgba(0,0,0,0.25);position:relative;font-family:\'Public Sans\',system-ui,sans-serif;">' +
    '<button id="help-global-close" style="position:absolute;top:16px;right:16px;width:32px;height:32px;border:none;background:#f1f3ff;border-radius:50%;cursor:pointer;display:flex;align-items:center;justify-content:center;color:#747780;font-size:18px;">\u2715</button>' +
    '<div style="width:48px;height:48px;border-radius:12px;background:#082853;display:flex;align-items:center;justify-content:center;margin-bottom:16px;color:#fff;font-size:24px;">\u2753</div>' +
    '<h2 id="help-global-title" style="margin:0 0 8px;font-size:20px;font-weight:700;color:#082853;font-family:\'Manrope\',sans-serif;"></h2>' +
    '<p id="help-global-text" style="margin:0;font-size:14px;line-height:1.7;color:#44474f;"></p>' +
    '</div>';

  document.body.appendChild(overlay);

  var titleEl = document.getElementById('help-global-title');
  var textEl = document.getElementById('help-global-text');
  var closeBtn = document.getElementById('help-global-close');

  function open() {
    var h = getHelp();
    titleEl.textContent = h.title;
    textEl.textContent = h.text;
    overlay.style.display = 'flex';
  }

  function close() {
    overlay.style.display = 'none';
  }

  closeBtn.addEventListener('click', close);
  overlay.addEventListener('click', function (e) {
    if (e.target === overlay) close();
  });

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') close();
  });

  document.addEventListener('click', function (e) {
    var el = e.target.closest('[data-help-btn]');
    if (el) {
      e.preventDefault();
      open();
    }
  });

  var icons = document.querySelectorAll('.material-symbols-outlined');
  for (var i = 0; i < icons.length; i++) {
    if (icons[i].textContent.trim() === 'help' || icons[i].getAttribute('data-icon') === 'help') {
      var btn = icons[i].closest('button');
      if (btn) btn.setAttribute('data-help-btn', '');
    }
  }
})();
