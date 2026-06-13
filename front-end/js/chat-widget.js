(function () {
  if (document.getElementById('chat-global')) return;

  var state = {
    isOpen: false,
    isPinned: JSON.parse(localStorage.getItem('chat_pinned') || 'false'),
    pos: JSON.parse(localStorage.getItem('chat_position') || '{"bottom":24,"right":24}'),
    messages: JSON.parse(localStorage.getItem('chat_messages') || '[]'),
    isDragging: false,
    startX: 0,
    startY: 0,
    origX: 0,
    origY: 0,
    wasDragged: false
  };

  var p = state.pos;

  var el = document.createElement('div');
  el.id = 'chat-global';
  el.innerHTML =
    '<div id="chat-global-toggle" class="fixed z-50 w-14 h-14 bg-[#14C286] text-white rounded-full shadow-xl hover:bg-[#10a36d] hover:scale-110 active:scale-95 flex items-center justify-center text-2xl transition-all cursor-pointer" style="bottom:' + p.bottom + 'px;right:' + p.right + 'px">\uD83D\uDCAC</div>' +
    '<div id="chat-global-dialog" class="fixed z-50 bg-white rounded-2xl shadow-2xl w-80 overflow-hidden ' + (state.isOpen ? '' : 'hidden') + '" style="bottom:' + p.bottom + 'px;right:' + p.right + 'px">' +
    '<div id="chat-global-header" class="bg-[#082853] text-white px-4 py-3 flex items-center justify-between select-none cursor-move">' +
    '<span class="font-semibold text-sm flex items-center gap-2"><span>\uD83E\uDD16</span> Assistente Virtual</span>' +
    '<div class="flex items-center gap-1">' +
    '<button id="chat-pin-btn" class="w-7 h-7 flex items-center justify-center rounded hover:bg-white/10 transition-all text-sm" title="' + (state.isPinned ? 'Chat fixado \u2014 clique para soltar' : 'Fixar chat') + '">\uD83D\uDCCC</button>' +
    '<button id="chat-close-btn" class="w-7 h-7 flex items-center justify-center rounded hover:bg-white/10 transition-all text-sm" title="Fechar">\u2715</button>' +
    '</div></div>' +
    '<div id="chat-global-messages" class="h-64 p-4 overflow-y-auto bg-gray-50 text-sm space-y-2"></div>' +
    '<div class="p-4 border-t bg-white">' +
    '<div class="flex gap-2">' +
    '<input id="chat-global-input" type="text" placeholder="Digite sua mensagem..." class="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#082853] focus:ring-1 focus:ring-[#082853]/20">' +
    '<button id="chat-global-send" class="px-4 py-2 bg-[#082853] text-white rounded-lg text-sm hover:bg-[#1a3a6e] transition-colors font-medium">Enviar</button>' +
    '</div></div></div>';

  document.body.appendChild(el);

  var toggle = document.getElementById('chat-global-toggle');
  var dialog = document.getElementById('chat-global-dialog');
  var header = document.getElementById('chat-global-header');
  var closeBtn = document.getElementById('chat-close-btn');
  var pinBtn = document.getElementById('chat-pin-btn');
  var messagesEl = document.getElementById('chat-global-messages');
  var input = document.getElementById('chat-global-input');
  var sendBtn = document.getElementById('chat-global-send');

  if (state.isPinned) pinBtn.style.color = '#FFD700';

  function persist() {
    localStorage.setItem('chat_messages', JSON.stringify(state.messages));
    localStorage.setItem('chat_position', JSON.stringify(state.pos));
    localStorage.setItem('chat_pinned', JSON.stringify(state.isPinned));
  }

  function addMessage(text, isUser) {
    var div = document.createElement('div');
    div.className = 'flex ' + (isUser ? 'justify-end' : 'justify-start');
    div.innerHTML = isUser
      ? '<span class="inline-block bg-[#082853] text-white px-3 py-1.5 rounded-xl max-w-[85%] break-words">' + esc(text) + '</span>'
      : '<span class="inline-block bg-gray-200 text-gray-800 px-3 py-1.5 rounded-xl max-w-[85%] break-words">\uD83E\uDD16 ' + esc(text) + '</span>';
    messagesEl.appendChild(div);
    messagesEl.scrollTop = messagesEl.scrollHeight;
  }

  function esc(t) {
    var d = document.createElement('div');
    d.textContent = t;
    return d.innerHTML;
  }

  function restoreMessages() {
    messagesEl.innerHTML = '';
    if (state.messages.length === 0) {
      addMessage('Ol\u00E1! Como posso ajud\u00E1-lo hoje?');
    } else {
      state.messages.forEach(function (m) { addMessage(m.text, m.isUser); });
    }
  }

  function applyPos(elem, pos) {
    elem.style.bottom = pos.bottom + 'px';
    elem.style.right = pos.right + 'px';
    elem.style.left = '';
    elem.style.top = '';
  }

  function toggleChat(show) {
    state.isOpen = show !== undefined ? show : !state.isOpen;
    dialog.classList.toggle('hidden', !state.isOpen);
    toggle.classList.toggle('hidden', state.isOpen);
    if (state.isOpen) {
      applyPos(dialog, state.pos);
      restoreMessages();
    } else {
      applyPos(toggle, state.pos);
    }
  }

  function updatePinAppearance() {
    pinBtn.style.color = state.isPinned ? '#FFD700' : '';
    pinBtn.title = state.isPinned ? 'Chat fixado \u2014 clique para soltar' : 'Fixar chat';
  }

  function sendMessage() {
    var text = input.value.trim();
    if (!text) return;
    input.value = '';
    state.messages.push({ text: text, isUser: true });
    addMessage(text, true);
    persist();

    var idToken = sessionStorage.getItem('id_token');
    var CHAT_API_URL = 'https://api.robsonruan.sifu1.web.ufersa.dev.br/chatbot';

    fetch(CHAT_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': idToken ? 'Bearer ' + idToken : ''
      },
      body: JSON.stringify({ chat: text })
    })
    .then(function (r) { return r.ok ? r.json() : r.json().then(function (e) { throw new Error(e.message || 'Erro'); }); })
    .then(function (data) {
      var reply = data.message || data.response || 'Resposta recebida!';
      state.messages.push({ text: reply, isUser: false });
      addMessage(reply);
      persist();
    })
    .catch(function (err) {
      var msg = err.message === 'Failed to fetch' ? 'Erro de conex\u00E3o com a API.' : 'Erro: ' + err.message;
      state.messages.push({ text: msg, isUser: false });
      addMessage(msg);
      persist();
    });
  }

  toggle.addEventListener('click', function () { toggleChat(true); });
  closeBtn.addEventListener('click', function () { toggleChat(false); });

  pinBtn.addEventListener('click', function (e) {
    e.stopPropagation();
    state.isPinned = !state.isPinned;
    updatePinAppearance();
    if (!state.isPinned) {
      state.pos = { bottom: 24, right: 24 };
      applyPos(dialog, state.pos);
      applyPos(toggle, state.pos);
    }
    persist();
  });

  sendBtn.addEventListener('click', sendMessage);
  input.addEventListener('keydown', function (e) {
    if (e.key === 'Enter') { e.preventDefault(); sendMessage(); }
  });

  header.addEventListener('mousedown', function (e) {
    if (e.target.tagName === 'BUTTON') return;
    state.isDragging = true;
    state.wasDragged = false;
    var rect = dialog.getBoundingClientRect();
    state.startX = e.clientX;
    state.startY = e.clientY;
    state.origX = rect.left;
    state.origY = rect.top;
    dialog.style.cursor = 'grabbing';
    dialog.style.bottom = '';
    dialog.style.right = '';
    dialog.style.left = rect.left + 'px';
    dialog.style.top = rect.top + 'px';
    e.preventDefault();
  });

  document.addEventListener('mousemove', function (e) {
    if (!state.isDragging) return;
    var dx = e.clientX - state.startX;
    var dy = e.clientY - state.startY;
    if (Math.abs(dx) > 3 || Math.abs(dy) > 3) state.wasDragged = true;
    dialog.style.left = (state.origX + dx) + 'px';
    dialog.style.top = (state.origY + dy) + 'px';
  });

  document.addEventListener('mouseup', function () {
    if (!state.isDragging) return;
    state.isDragging = false;
    dialog.style.cursor = '';
    if (state.wasDragged) {
      var rect = dialog.getBoundingClientRect();
      state.pos = {
        bottom: window.innerHeight - rect.bottom,
        right: window.innerWidth - rect.right
      };
      applyPos(dialog, state.pos);
      applyPos(toggle, state.pos);
      persist();
    }
  });

  restoreMessages();
  updatePinAppearance();
})();
