(function () {
  'use strict'

  const KEY = 'sifu-theme'

  function load () {
    try { return JSON.parse(localStorage.getItem(KEY)) || {} } catch { return {} }
  }

  function save (s) {
    localStorage.setItem(KEY, JSON.stringify(s))
  }

  let s = Object.assign({ dark: false, cb: 'none', fs: 100 }, load())

  const LABELS = {
    none: 'Padr\u00e3o',
    protanopia: 'Protanopia (vermelho)',
    deuteranopia: 'Deuteranopia (verde)',
    tritanopia: 'Tritanopia (azul)'
  }

  const FILTERS = {
    protanopia: [
      '0.567','0.433','0','0','0',
      '0.558','0.442','0','0','0',
      '0','0.242','0.758','0','0',
      '0','0','0','1','0'
    ],
    deuteranopia: [
      '0.625','0.375','0','0','0',
      '0.700','0.300','0','0','0',
      '0','0.300','0.700','0','0',
      '0','0','0','1','0'
    ],
    tritanopia: [
      '0.950','0.050','0','0','0',
      '0','0.433','0.567','0','0',
      '0','0.475','0.525','0','0',
      '0','0','0','1','0'
    ]
  }

  function apply () {
    document.documentElement.classList.toggle('dark', s.dark)
    const cb = s.cb
    let filterVal = 'none'
    if (cb !== 'none' && FILTERS[cb]) {
      filterVal = 'url(#sifu-cb-' + cb + ')'
    }
    document.documentElement.style.setProperty('--cb-filter', filterVal)
    document.documentElement.style.setProperty('--font-scale', String(s.fs / 100))
    updateUI()
  }

  function updateUI () {
    const panel = document.getElementById('sifu-theme-panel')
    if (!panel) return
    const darkBtn = panel.querySelector('[data-theme-dark]')
    if (darkBtn) {
      darkBtn.classList.toggle('bg-primary', s.dark)
      darkBtn.classList.toggle('text-white', s.dark)
      darkBtn.classList.toggle('bg-[#E8EDFF]', !s.dark)
      darkBtn.classList.toggle('text-slate-600', !s.dark)
      darkBtn.innerHTML = s.dark
        ? '<span class="material-symbols-outlined text-[20px]">dark_mode</span>'
        : '<span class="material-symbols-outlined text-[20px]">light_mode</span>'
    }
    const cbBtn = panel.querySelector('[data-theme-cb]')
    if (cbBtn) {
      const modes = ['none', 'protanopia', 'deuteranopia', 'tritanopia']
      const idx = modes.indexOf(s.cb)
      cbBtn.innerHTML = '<span class="material-symbols-outlined text-[20px]">visibility</span> ' + LABELS[s.cb]
    }
    const val = panel.querySelector('[data-theme-fs-val]')
    if (val) val.textContent = s.fs + '%'
    const slider = panel.querySelector('[data-theme-fs]')
    if (slider) slider.value = s.fs
  }

  function injectSVGFilters () {
    if (document.getElementById('sifu-cb-filters')) return
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
    svg.id = 'sifu-cb-filters'
    svg.style.cssText = 'position:absolute;width:0;height:0;overflow:hidden'
    const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs')
    svg.appendChild(defs)
    for (const key in FILTERS) {
      const filter = document.createElementNS('http://www.w3.org/2000/svg', 'filter')
      filter.id = 'sifu-cb-' + key
      const matrix = document.createElementNS('http://www.w3.org/2000/svg', 'feColorMatrix')
      matrix.setAttribute('type', 'matrix')
      matrix.setAttribute('values', FILTERS[key].join(' '))
      filter.appendChild(matrix)
      defs.appendChild(filter)
    }
    document.body.prepend(svg)
  }

  function injectFont () {
    if (document.getElementById('sifu-theme-font')) return
    if (document.querySelector('link[href*="Material+Symbols"]')) return
    var link = document.createElement('link')
    link.id = 'sifu-theme-font'
    link.rel = 'stylesheet'
    link.href = 'https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap'
    document.head.appendChild(link)
  }

  function injectStyles () {
    if (document.getElementById('sifu-theme-style')) return
    const style = document.createElement('style')
    style.id = 'sifu-theme-style'
    style.textContent = [
      'html { font-size: calc(16px * var(--font-scale, 1)); }',
      'body { -webkit-filter: var(--cb-filter, none); filter: var(--cb-filter, none); }',
      '.font-manrope { font-family: "Manrope",sans-serif; }',
      '.bg-primary { background-color: #082853; }',
      '.text-primary { color: #082853; }',
      '#sifu-theme-panel { transform-origin: bottom right; }',
      '#sifu-theme-panel[data-open="true"] { display: block; }',
      '#sifu-theme-panel[data-open="false"] { display: none; }',
      '#sifu-theme-btn { border-radius: 10px 0 0 10px !important; }',
      '#sifu-theme-btn { transition: transform 0.3s ease; }',
      '#sifu-theme-btn:hover { transform: rotate(60deg); }',
      '@media (max-width: 768px) { #sifu-theme-panel { right: 16px !important; left: auto !important; min-width: 260px; } }'
    ].join('\n')
    document.head.appendChild(style)
  }

  function createPanel () {
    if (document.getElementById('sifu-theme-btn')) return

    const btn = document.createElement('button')
    btn.id = 'sifu-theme-btn'
    btn.setAttribute('aria-label', 'Configura\u00e7\u00f5es de acessibilidade')
    btn.title = 'Configura\u00e7\u00f5es de acessibilidade'
    btn.innerHTML = '<span class="material-symbols-outlined text-[24px]">settings_accessibility</span>'
    btn.className = 'fixed right-0 top-1/2 -translate-y-1/2 z-[9999] w-10 h-12 rounded-l-xl bg-primary text-white shadow-xl flex items-center justify-center hover:scale-110 active:scale-95 transition-all cursor-pointer border-2 border-white/20 border-r-0'
    btn.onclick = function () {
      const panel = document.getElementById('sifu-theme-panel')
      const open = panel.getAttribute('data-open') === 'true'
      panel.setAttribute('data-open', String(!open))
    }
    document.body.appendChild(btn)

    const panel = document.createElement('div')
    panel.id = 'sifu-theme-panel'
    panel.setAttribute('data-open', 'false')
    panel.className = 'fixed right-14 top-1/2 -translate-y-1/2 z-[9999] w-80 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-[#E8EDFF] dark:border-slate-800 overflow-hidden transition-all duration-200'
    panel.innerHTML = [
      '<div class="px-5 py-4 border-b border-[#E8EDFF] dark:border-slate-800 flex items-center justify-between">',
        '<span class="font-manrope font-bold text-sm text-[#082853] dark:text-white">Acessibilidade</span>',
        '<button onclick="document.getElementById(\'sifu-theme-panel\').setAttribute(\'data-open\',\'false\')" class="text-slate-400 hover:text-slate-600 dark:hover:text-white">',
          '<span class="material-symbols-outlined text-[18px]">close</span>',
        '</button>',
      '</div>',
      '<div class="px-5 py-4 space-y-5">',
        '<div>',
          '<div class="flex items-center justify-between mb-2">',
            '<span class="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Modo escuro</span>',
          '</div>',
          '<button data-theme-dark onclick="SifuTheme.toggleDark()" class="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm transition-all ' + (s.dark ? 'bg-primary text-white' : 'bg-[#E8EDFF] text-slate-600') + '">',
            '<span class="material-symbols-outlined text-[20px]">' + (s.dark ? 'dark_mode' : 'light_mode') + '</span>',
            s.dark ? 'Escuro' : 'Claro',
          '</button>',
        '</div>',
        '<div>',
          '<div class="flex items-center justify-between mb-2">',
            '<span class="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Simula\u00e7\u00e3o daltonismo</span>',
          '</div>',
          '<button data-theme-cb onclick="SifuTheme.cycleColorblind()" class="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm bg-[#F1F3FF] dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-[#E8EDFF] dark:hover:bg-slate-700 transition-all">',
            '<span class="material-symbols-outlined text-[20px]">visibility</span>',
            LABELS[s.cb],
          '</button>',
        '</div>',
        '<div>',
          '<div class="flex items-center justify-between mb-2">',
            '<span class="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Tamanho da fonte</span>',
            '<span data-theme-fs-val class="text-xs font-bold text-primary dark:text-[#99CC33]">' + s.fs + '%</span>',
          '</div>',
          '<div class="flex items-center gap-3">',
            '<button onclick="SifuTheme.adjustFontSize(-10)" class="w-9 h-9 rounded-full bg-[#F1F3FF] dark:bg-slate-800 text-slate-600 dark:text-slate-300 flex items-center justify-center hover:bg-[#E8EDFF] dark:hover:bg-slate-700 transition-all text-lg font-bold">\u2212</button>',
            '<input data-theme-fs type="range" min="80" max="150" value="' + s.fs + '" oninput="SifuTheme.setFontSize(parseInt(this.value))" class="flex-1 h-1.5 bg-[#E8EDFF] dark:bg-slate-700 rounded-full appearance-none cursor-pointer accent-primary">',
            '<button onclick="SifuTheme.adjustFontSize(10)" class="w-9 h-9 rounded-full bg-[#F1F3FF] dark:bg-slate-800 text-slate-600 dark:text-slate-300 flex items-center justify-center hover:bg-[#E8EDFF] dark:hover:bg-slate-700 transition-all text-lg font-bold">+</button>',
          '</div>',
        '</div>',
      '</div>',
      '<div class="px-5 py-3 bg-[#F9F9FF] dark:bg-slate-950/50 border-t border-[#E8EDFF] dark:border-slate-800">',
        '<button onclick="SifuTheme.reset()" class="w-full text-xs text-slate-400 hover:text-primary dark:hover:text-[#99CC33] transition-colors font-medium">Restaurar padr\u00f5es</button>',
      '</div>'
    ].join('')
    document.body.appendChild(panel)
    updateUI()
  }

  window.SifuTheme = {
    s: s,
    toggleDark: function () {
      s.dark = !s.dark
      save(s)
      apply()
    },
    cycleColorblind: function () {
      const modes = ['none', 'protanopia', 'deuteranopia', 'tritanopia']
      const idx = modes.indexOf(s.cb)
      s.cb = modes[(idx + 1) % modes.length]
      save(s)
      apply()
    },
    setFontSize: function (v) {
      s.fs = Math.max(80, Math.min(150, v))
      save(s)
      apply()
    },
    adjustFontSize: function (delta) {
      var cur = s.fs
      s.fs = Math.max(80, Math.min(150, cur + delta))
      save(s)
      apply()
    },
    reset: function () {
      s = { dark: false, cb: 'none', fs: 100 }
      save(s)
      apply()
    }
  }

  function init () {
    injectFont()
    injectSVGFilters()
    injectStyles()
    apply()
    createPanel()
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init)
  } else {
    init()
  }
})()
