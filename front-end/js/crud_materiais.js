/**
 * Funções CRUD para Materiais
 */

const API_URL = '/api/materiais';
const API_SALAS = '/api/salas';

/**
 * Exibe toast de feedback
 */
function mostrarToastMaterial(mensagem, tipo = 'success') {
    const toast = document.getElementById('toast');
    const toastMsg = document.getElementById('toast-message');
    if (!toast) return;
    
    toast.className = `fixed bottom-8 right-8 z-[100] ${tipo === 'success' ? 'bg-green-600' : 'bg-red-600'} text-white px-6 py-4 rounded-xl shadow-xl flex items-center gap-3`;
    toastMsg.textContent = mensagem;
    toast.classList.remove('hidden');
    
    setTimeout(() => toast.classList.add('hidden'), 3000);
}

/**
 * Listar materiais da API
 */
async function listarMateriais(filtros = {}) {
    try {
        const url = new URL(API_URL, window.location.origin);
        Object.keys(filtros).forEach(k => url.searchParams.append(k, filtros[k]));
        const response = await fetch(url);
        if (!response.ok) throw new Error('Erro ao buscar materiais');
        return await response.json();
    } catch (error) {
        console.error('Erro:', error);
        return [];
    }
}

/**
 * Listar salas para o select
 */
async function listarSalas() {
    try {
        const response = await fetch(API_SALAS);
        if (!response.ok) throw new Error('Erro ao buscar salas');
        return await response.json();
    } catch (error) {
        console.error('Erro:', error);
        return [];
    }
}

/**
 * Abrir modal para novo material
 */
async function abrirModalNovoMaterial() {
    document.getElementById('materialModalTitle').textContent = 'Novo Material';
    document.getElementById('materialForm').reset();
    document.getElementById('materialId').value = '';
    
    const salas = await listarSalas();
    const select = document.getElementById('materialSalaId');
    select.innerHTML = '<option value="">Selecione uma sala</option>' + 
        salas.map(s => `<option value="${s.id}">${s.nome} (Cap: ${s.capacidade})</option>`).join('');
    
    document.getElementById('materialModal').classList.remove('hidden');
}

/**
 * Abrir modal para editar material
 */
async function abrirModalEditarMaterial(material) {
    document.getElementById('materialModalTitle').textContent = 'Editar Material';
    document.getElementById('materialId').value = material.id;
    document.getElementById('materialCodigo').value = material.codigo || '';
    document.getElementById('materialNome').value = material.nome || '';
    document.getElementById('materialTipo').value = material.tipo || '';
    document.getElementById('materialDescricao').value = material.descricao || '';
    document.getElementById('materialStatus').value = material.status || 'disponivel';
    
    const salas = await listarSalas();
    const select = document.getElementById('materialSalaId');
    select.innerHTML = '<option value="">Selecione uma sala</option>' + 
        salas.map(s => `<option value="${s.id}" ${s.id == material.sala_id ? 'selected' : ''}>${s.nome}</option>`).join('');
    
    document.getElementById('materialModal').classList.remove('hidden');
}

/**
 * Fechar modal
 */
function fecharModalMaterial() {
    document.getElementById('materialModal').classList.add('hidden');
}

/**
 * Salvar material (criar ou atualizar)
 */
async function salvarMaterial(event) {
    event.preventDefault();
    
    const idField = document.getElementById('materialId');
    const id = idField.value;
    const idNum = id ? parseInt(id) : null;
    
    const material = {
        codigo: document.getElementById('materialCodigo').value,
        nome: document.getElementById('materialNome').value,
        sala_id: parseInt(document.getElementById('materialSalaId').value),
        tipo: document.getElementById('materialTipo').value,
        descricao: document.getElementById('materialDescricao').value,
        status: document.getElementById('materialStatus').value
    };
    
    try {
        // Buscar material antigo para comparar status
        let materialAntigo = null;
        if (idNum) {
            const responseAntigo = await fetch('/api/materiais/' + idNum);
            materialAntigo = await responseAntigo.json();
        }
        
        let response;
        if (idNum) {
            response = await fetch('/api/materiais/' + idNum, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(material)
            });
        } else {
            response = await fetch('/api/materiais', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(material)
            });
        }
        
        const result = await response.json();
        
        if (!response.ok) throw new Error(result.erro || 'Erro ao salvar');
        
        // Se status mudou para disponível, mas está em uma sala, remover da sala
        if (materialAntigo && material.status !== 'disponivel' && material.status !== materialAntigo.status) {
            await removerMaterialDasSalas(material.nome);
        }
        
        mostrarToastMaterial(idNum ? 'Material atualizado!' : 'Material criado!');
        fecharModalMaterial();
        carregarMateriais();
    } catch (error) {
        console.error('Erro:', error);
        mostrarToastMaterial('Erro ao salvar material: ' + error.message, 'error');
    }
}

/**
 * Remover material das salas ao mudar status para não disponível
 */
async function removerMaterialDasSalas(nomeMaterial) {
    try {
        const responseSalas = await fetch('/api/salas');
        const salas = await responseSalas.json();
        
        for (const sala of salas) {
            if (sala.recursos && sala.recursos.includes(nomeMaterial)) {
                const recursosArray = sala.recursos.split(',').map(r => r.trim()).filter(r => r !== nomeMaterial);
                await fetch('/api/salas/' + sala.id, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ recursos: recursosArray.join(', ') })
                });
            }
        }
    } catch (error) {
        console.error('Erro ao remover material das salas:', error);
    }
}

/**
 * Excluir material
 */
async function excluirMaterial(id) {
    if (!confirm('Tem certeza que deseja excluir este material?')) return;
    
    try {
        // Buscar material para remover das salas
        const responseBusca = await fetch('/api/materiais/' + id);
        const material = await responseBusca.json();
        
        // Remover das salas
        await removerMaterialDasSalas(material.nome);
        
        const response = await fetch('/api/materiais/' + id, {
            method: 'DELETE'
        });
        
        if (!response.ok) throw new Error('Erro ao excluir');
        
        mostrarToastMaterial('Material excluído!');
        carregarMateriais();
    } catch (error) {
        console.error('Erro:', error);
        mostrarToastMaterial('Erro ao excluir material', 'error');
    }
}

/**
 * Filtrar materiais
 */
async function filtrarMateriais() {
    const busca = document.getElementById('filtroBusca')?.value.toLowerCase() || '';
    const tipo = document.getElementById('filtroTipo')?.value || '';
    const status = document.getElementById('filtroStatus')?.value || '';
    
    const materiais = await listarMateriais();
    
    let filtrados = materiais;
    
    if (busca) {
        filtrados = filtrados.filter(m => 
            m.nome.toLowerCase().includes(busca) || 
            m.codigo.toLowerCase().includes(busca)
        );
    }
    if (tipo) {
        filtrados = filtrados.filter(m => m.tipo === tipo);
    }
    if (status) {
        filtrados = filtrados.filter(m => m.status === status);
    }
    
    renderizarTabelaMateriais(filtrados);
}

/**
 * Renderizar tabela de materiais
 */
let todosMateriais = [];
let paginaAtual = 1;
const materiaisPorPagina = 5;

function renderizarTabelaMateriais(materiais) {
    const tbody = document.querySelector('tbody');
    if (!tbody) {
        console.error('tbody não encontrado!');
        return;
    }
    
    todosMateriais = materiais;
    paginaAtual = 1;
    
    // Atualizar estatísticas
    const disponiveis = materiais.filter(m => m.status === 'disponivel').length;
    const emUso = materiais.filter(m => m.status === 'em_uso').length;
    const manutencao = materiais.filter(m => m.status === 'manutencao').length;
    
    const elTotal = document.getElementById('total-itens');
    const elDisponiveis = document.getElementById('disponiveis');
    const elEmUso = document.getElementById('em-uso');
    const elManutencao = document.getElementById('manutencao');
    
    if (elTotal) elTotal.textContent = materiais.length;
    if (elDisponiveis) elDisponiveis.textContent = disponiveis;
    if (elEmUso) elEmUso.textContent = emUso;
    if (elManutencao) elManutencao.textContent = manutencao;
    
    renderizarPaginaMaterial();
}

function renderizarPaginaMaterial() {
    const tbody = document.querySelector('tbody');
    if (!tbody) return;
    
    tbody.innerHTML = '';
    
    const inicio = (paginaAtual - 1) * materiaisPorPagina;
    const fim = inicio + materiaisPorPagina;
    const materiaisPagina = todosMateriais.slice(inicio, fim);
    const totalPaginas = Math.ceil(todosMateriais.length / materiaisPorPagina);
    
    const statusLabels = {
        'disponivel': { label: 'Disponível', class: 'bg-green-100 text-green-700' },
        'em_uso': { label: 'Em Uso', class: 'bg-yellow-100 text-yellow-700' },
        'manutencao': { label: 'Manutenção', class: 'bg-red-100 text-red-700' }
    };
    
    materiaisPagina.forEach(m => {
        const status = statusLabels[m.status] || statusLabels.disponivel;
        const tr = document.createElement('tr');
        tr.className = 'hover:bg-gray-50 transition-colors';
        
        tr.innerHTML = `
<td class="px-6 py-4 text-sm font-medium text-gray-900">${m.codigo}</td>
<td class="px-6 py-4 text-sm text-gray-900">${m.nome}</td>
<td class="px-6 py-4 text-sm text-gray-500">${m.sala_nome}</td>
<td class="px-6 py-4 text-sm text-gray-500">${m.tipo}</td>
<td class="px-6 py-4">
<span class="px-2 py-1 ${status.class} text-xs rounded-full">${status.label}</span>
</td>
<td class="px-6 py-4 text-right">
<div class="flex items-center justify-end gap-2">
<button class="text-blue-600 hover:text-blue-800 text-sm font-medium" onclick='abrirModalEditarMaterial(${JSON.stringify(m)})'>Editar</button>
<button class="text-red-600 hover:text-red-800 text-sm font-medium" onclick="excluirMaterial(${m.id})">Excluir</button>
</div>
</td>`;
        
        tbody.appendChild(tr);
    });
    
    // Atualizar info da paginação
    const infoEl = document.getElementById('pagination-info');
    if (infoEl) {
        if (todosMateriais.length === 0) {
            infoEl.textContent = 'Nenhum resultado encontrado';
        } else {
            const showing = Math.min(fim, todosMateriais.length);
            infoEl.textContent = `Mostrando ${inicio + 1} a ${showing} de ${todosMateriais.length} materiais`;
        }
    }
    
    // Renderizar botões de paginação
    renderizarBotoesPaginaMaterial(totalPaginas);
}

function renderizarBotoesPaginaMaterial(totalPaginas) {
    const container = document.getElementById('pagination-buttons');
    if (!container) {
        console.error('container pagination-buttons não encontrado!');
        return;
    }
    
    container.innerHTML = '';
    
    if (totalPaginas <= 1) return;
    
    // Botão anterior
    const btnPrev = document.createElement('button');
    btnPrev.className = 'px-3 py-1 border rounded-lg text-sm hover:bg-gray-100' + (paginaAtual === 1 ? ' opacity-50 cursor-not-allowed' : '');
    btnPrev.innerHTML = '« Anterior';
    btnPrev.onclick = () => { 
        if (paginaAtual > 1) { paginaAtual--; renderizarPaginaMaterial(); } 
    };
    if (paginaAtual === 1) btnPrev.disabled = true;
    container.appendChild(btnPrev);
    
    // Botões de páginas
    for (let i = 1; i <= totalPaginas; i++) {
        const btn = document.createElement('button');
        btn.className = 'w-8 h-8 flex items-center justify-center rounded-lg text-xs font-bold ' + (i === paginaAtual ? 'bg-[#082853] text-white' : 'hover:bg-gray-100 text-[#082853]');
        btn.textContent = i;
        btn.onclick = () => { paginaAtual = i; renderizarPaginaMaterial(); };
        container.appendChild(btn);
    }
    
    // Botão próximo
    const btnNext = document.createElement('button');
    btnNext.className = 'px-3 py-1 border rounded-lg text-sm hover:bg-gray-100' + (paginaAtual === totalPaginas ? ' opacity-50 cursor-not-allowed' : '');
    btnNext.innerHTML = 'Próxima »';
    btnNext.onclick = () => { 
        if (paginaAtual < totalPaginas) { paginaAtual++; renderizarPaginaMaterial(); } 
    };
    if (paginaAtual === totalPaginas) btnNext.disabled = true;
    container.appendChild(btnNext);
}

/**
 * Carregar materiais
 */
async function carregarMateriais() {
    const materiais = await listarMateriais();
    if (materiais) {
        renderizarTabelaMateriais(materiais);
    }
}

/**
 * Inicializar materiais
 */
async function inicializarMateriais() {
    await sincronizarMateriaisComSalas();
    await carregarMateriais();
    
    const form = document.getElementById('materialForm');
    if (form) form.addEventListener('submit', salvarMaterial);
    
    const modal = document.getElementById('materialModal');
    if (modal) modal.addEventListener('click', e => { if (e.target === modal) fecharModalMaterial(); });
    
    // Event listeners para filtros
    const filtros = ['filtroTipo', 'filtroStatus'];
    filtros.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.addEventListener('change', filtrarMateriais);
    });
    
    // Filtro de busca com evento input (tempo real)
    const filtroBusca = document.getElementById('filtroBusca');
    if (filtroBusca) filtroBusca.addEventListener('input', filtrarMateriais);
}

/**
 * Sincronizar status dos materiais com salas
 */
async function sincronizarMateriaisComSalas() {
    try {
        const responseSalas = await fetch('/api/salas');
        const salas = await responseSalas.json();
        
        const responseMateriais = await fetch('/api/materiais');
        const materiais = await responseMateriais.json();
        
        for (const material of materiais) {
            let encontrado = false;
            
            for (const sala of salas) {
                if (sala.recursos) {
                    const recursosArray = sala.recursos.split(',').map(r => r.replace(/["\\]/g, '').trim());
                    const nomeNormalizado = material.nome.replace(/["\\]/g, '').trim();
                    
                    if (recursosArray.some(r => r === nomeNormalizado || r.includes(nomeNormalizado) || nomeNormalizado.includes(r))) {
                        if (material.status !== 'em_uso') {
                            await fetch('/api/materiais/' + material.id, {
                                method: 'PUT',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ status: 'em_uso' })
                            });
                        }
                        encontrado = true;
                        break;
                    }
                }
            }
            
            if (!encontrado && material.status === 'em_uso') {
                await fetch('/api/materiais/' + material.id, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ status: 'disponivel' })
                });
            }
        }
    } catch (error) {
        console.error('Erro ao sincronizar materiais:', error);
    }
}

window.abrirModalNovoMaterial = abrirModalNovoMaterial;
window.abrirModalEditarMaterial = abrirModalEditarMaterial;
window.fecharModalMaterial = fecharModalMaterial;
window.excluirMaterial = excluirMaterial;
window.carregarMateriais = carregarMateriais;
window.inicializarMateriais = inicializarMateriais;
