/**
 * Funções CRUD para Gestão de Salas
 */

const BASE_URL = 'https://2791fnzy75.execute-api.us-east-1.amazonaws.com';
const API_URL = BASE_URL + '/api/salas';

let recursosSelecionados = [];
let todosMateriais = [];

/**
 * Exibe toast de feedback
 */
function mostrarToast(mensagem, tipo = 'success') {
    const toast = document.getElementById('toast');
    const toastMsg = document.getElementById('toastMessage');
    
    toast.className = `fixed bottom-8 right-8 ${tipo === 'success' ? 'bg-green-600' : 'bg-red-600'} text-white px-6 py-4 rounded-xl shadow-xl z-50 flex items-center gap-3`;
    toastMsg.textContent = mensagem;
    toast.classList.remove('hidden');
    
    setTimeout(() => toast.classList.add('hidden'), 3000);
}

/**
 * Abrir modal para nova sala
 */
async function abrirModalNovaSala() {
    document.getElementById('modalTitle').textContent = 'Nova Sala';
    document.getElementById('salaForm').reset();
    document.getElementById('salaId').value = '';
    
    await carregarMateriais();
    recursosSelecionados = [];
    atualizarRecursosUI();
    
    document.getElementById('salaModal').classList.remove('hidden');
}

/**
 * Carregar todos os materiais da API
 */
async function carregarMateriais() {
    try {
        const response = await fetch(BASE_URL + '/api/materiais?_=' + Date.now());
        todosMateriais = await response.json();
    } catch (error) {
        console.error('Erro ao carregar materiais:', error);
        todosMateriais = [];
    }
}

/**
 * Atualizar a UI de recursos: lista + dropdown de adicionar
 */
function atualizarRecursosUI() {
    const listEl = document.getElementById('salaRecursosList');
    if (!listEl) return;
    
    if (recursosSelecionados.length === 0) {
        listEl.innerHTML = '<p class="text-xs text-slate-400 italic">Nenhum recurso vinculado</p>';
    } else {
        listEl.innerHTML = recursosSelecionados.map(nome => {
            const escaped = nome.replace(/'/g, "\\'");
            return `
            <div class="flex items-center justify-between bg-surface-container-low px-3 py-2 rounded-lg">
                <span class="text-sm font-medium text-primary">${nome}</span>
                <button type="button" onclick='removerRecurso("${escaped}")' class="text-error hover:text-red-700 text-xs font-bold">Remover</button>
            </div>`;
        }).join('');
    }
    
    const select = document.getElementById('selectAddRecurso');
    if (!select) return;
    
    const nomesMateriais = new Set(recursosSelecionados);
    const disponiveis = todosMateriais.filter(m => 
        m.status === 'disponivel' && !nomesMateriais.has(m.nome)
    );
    select.innerHTML = '<option value="">Selecione um material...</option>' + 
        disponiveis.map(m => `<option value="${m.nome}">${m.codigo} - ${m.nome}</option>`).join('');
}

function adicionarRecurso() {
    const select = document.getElementById('selectAddRecurso');
    if (!select) return;
    const nome = select.value;
    if (!nome) return;
    recursosSelecionados.push(nome);
    select.value = '';
    atualizarRecursosUI();
}

function removerRecurso(nome) {
    recursosSelecionados = recursosSelecionados.filter(r => r !== nome);
    atualizarRecursosUI();
}

/**
 * Abrir modal para editar sala
 */
async function abrirModalEditarSala(sala) {
    document.getElementById('modalTitle').textContent = 'Editar Sala';
    document.getElementById('salaId').value = sala.id;
    document.getElementById('salaNome').value = sala.nome || '';
    document.getElementById('salaCapacidade').value = sala.capacidade || '';
    document.getElementById('salaTipo').value = sala.tipo || 'colaborativo';
    document.getElementById('salaStatus').value = sala.status || 'disponivel';
    
    await carregarMateriais();
    
    recursosSelecionados = sala.recursos
        ? (Array.isArray(sala.recursos) ? [...sala.recursos] : sala.recursos.split(',').map(r => r.trim()))
        : [];
    atualizarRecursosUI();
    
    document.getElementById('salaModal').classList.remove('hidden');
}

/**
 * Fechar modal
 */
function fecharModal() {
    document.getElementById('salaModal').classList.add('hidden');
}

/**
 * Buscar todas as salas da API
 */
async function listarSalas() {
    try {
        const response = await fetch(API_URL + '?_=' + Date.now());
        if (!response.ok) throw new Error('Erro ao buscar salas');
        return await response.json();
    } catch (error) {
        console.error('Erro:', error);
        mostrarToast('Erro ao carregar salas', 'error');
        return [];
    }
}

/**
 * Salvar sala (criar ou atualizar)
 */
async function salvarSala(event) {
    event.preventDefault();
    
    const idField = document.getElementById('salaId');
    const id = idField.value;
    const idNum = id || null;
    
    // Validar disponibilidade dos materiais selecionados antes de salvar
    if (recursosSelecionados.length > 0) {
        try {
            const respMat = await fetch(BASE_URL + '/api/materiais');
            const materiais = await respMat.json();
            const naoDisponiveis = [];
            const aindaDisponiveis = [];
            for (const nome of recursosSelecionados) {
                const nomeNorm = nome.replace(/["\\]/g, '').trim();
                const material = materiais.find(m => {
                    const mn = m.nome.replace(/["\\]/g, '').trim();
                    return mn === nomeNorm;
                });
                if (material && material.status === 'disponivel') {
                    aindaDisponiveis.push(nome);
                } else {
                    naoDisponiveis.push(nome);
                }
            }
            if (naoDisponiveis.length > 0) {
                mostrarToast('Materiais não disponíveis foram removidos: ' + naoDisponiveis.join(', '), 'error');
                recursosSelecionados = aindaDisponiveis;
                atualizarRecursosUI();
            }
        } catch (e) {
            console.error('Erro ao validar materiais:', e);
        }
    }
    
    const recursosString = recursosSelecionados.join(', ');
    
    const sala = {
        nome: document.getElementById('salaNome').value,
        capacidade: parseInt(document.getElementById('salaCapacidade').value),
        tipo: document.getElementById('salaTipo').value,
        recursos: recursosString,
        status: document.getElementById('salaStatus').value
    };
    
    try {
        let response;
        if (idNum) {
            // Se editando, buscar recursos antigos para liberar
            const salasAntigas = await listarSalas();
            const salaAntiga = salasAntigas.find(s => s.id === idNum);
            if (salaAntiga && salaAntiga.recursos) {
                await atualizarStatusMateriais(Array.isArray(salaAntiga.recursos) ? salaAntiga.recursos : salaAntiga.recursos.split(',').map(r => r.trim()), 'disponivel');
            }
            
            response = await fetch(BASE_URL + '/api/salas/' + idNum, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(sala)
            });
        } else {
            response = await fetch(BASE_URL + '/api/salas', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(sala)
            });
        }
        
        const result = await response.json();
        
        if (!response.ok) throw new Error(result.erro || 'Erro ao salvar');
        
        // Atualizar status dos materiais para "em_uso"
        if (recursosSelecionados.length > 0) {
            await atualizarStatusMateriais(recursosSelecionados, 'em_uso');
        }
        
        mostrarToast(idNum ? 'Sala atualizada!' : 'Sala criada!');
        fecharModal();
        await carregarSalas();
    } catch (error) {
        console.error('Erro:', error);
        mostrarToast('Erro ao salvar sala: ' + error.message, 'error');
    }
}

/**
 * Atualizar status dos materiais
 */
async function atualizarStatusMateriais(nomesMateriais, novoStatus) {
    try {
        const response = await fetch(BASE_URL + '/api/materiais?_=' + Date.now());
        const materiais = await response.json();
        
        for (const nomeMaterial of nomesMateriais) {
            const nomeNormalizado = nomeMaterial.replace(/["\\]/g, '').trim();
            
            const material = materiais.find(m => {
                const nomeMaterialJson = m.nome.replace(/["\\]/g, '').trim();
                return nomeMaterialJson === nomeNormalizado || 
                      nomeNormalizado.includes(nomeMaterialJson) || 
                      nomeMaterialJson.includes(nomeNormalizado);
            });
            
            if (material) {
                // Evitar race condition: só definir como em_uso se ainda estiver disponivel
                if (novoStatus === 'em_uso' && material.status !== 'disponivel') continue;
                
                const putResp = await fetch(BASE_URL + '/api/materiais/' + material.id, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ status: novoStatus })
                });
                if (!putResp.ok) {
                    const putErr = await putResp.json();
                    console.error('Falha ao atualizar status do material', material.nome, putErr);
                }
            }
        }
    } catch (error) {
        console.error('Erro ao atualizar status dos materiais:', error);
    }
}

/**
 * Sincronizar status dos materiais com salas (chamado ao carregar)
 */
async function sincronizarMateriaisComSalas() {
    try {
        const responseMateriais = await fetch(BASE_URL + '/api/materiais?_=' + Date.now());
        const materiais = await responseMateriais.json();
        
        const responseSalas = await fetch(BASE_URL + '/api/salas?_=' + Date.now());
        const salas = await responseSalas.json();
        
        // Primeiro, liberar todos os materiais
        for (const material of materiais) {
            if (material.status === 'em_uso') {
                const putResp = await fetch(BASE_URL + '/api/materiais/' + material.id, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ status: 'disponivel' })
                });
                if (!putResp.ok) {
                    const putErr = await putResp.json();
                    console.error('Falha ao liberar material', material.nome, putErr);
                }
            }
        }
        
        // Depois, marcar como em_uso os que estão em salas
        for (const sala of salas) {
            if (sala.recursos) {
                const recursosArray = Array.isArray(sala.recursos) ? sala.recursos : sala.recursos.split(',').map(r => r.trim());
                
                for (const nomeMaterial of recursosArray) {
                    const nomeNormalizado = nomeMaterial.replace(/["\\]/g, '').trim();
                    
                    const material = materiais.find(m => {
                        const nomeMaterialJson = m.nome.replace(/["\\]/g, '').trim();
                        return nomeMaterialJson === nomeNormalizado || 
                              nomeNormalizado.includes(nomeMaterialJson) || 
                              nomeMaterialJson.includes(nomeNormalizado);
                    });
                    
                    if (material && material.status === 'disponivel') {
                        const putResp = await fetch(BASE_URL + '/api/materiais/' + material.id, {
                            method: 'PUT',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ status: 'em_uso' })
                        });
                        if (!putResp.ok) {
                            const putErr = await putResp.json();
                            console.error('Falha ao vincular material', material.nome, putErr);
                        }
                    }
                }
            }
        }
    } catch (error) {
        console.error('Erro ao sincronizar materiais:', error);
    }
}

/**
 * Excluir sala
 */
async function excluirSala(id) {
    if (!confirm('Tem certeza que deseja excluir esta sala?')) return;
    
    try {
        // Buscar sala para liberar materiais
        const salas = await listarSalas();
        const sala = salas.find(s => s.id === id);
        if (sala && sala.recursos) {
            await atualizarStatusMateriais(Array.isArray(sala.recursos) ? sala.recursos : sala.recursos.split(',').map(r => r.trim()), 'disponivel');
        }
        
        const response = await fetch(`${API_URL}/${id}`, {
            method: 'DELETE'
        });
        
        if (!response.ok) throw new Error('Erro ao excluir');
        
        mostrarToast('Sala excluída!');
        carregarSalas();
    } catch (error) {
        console.error('Erro:', error);
        mostrarToast('Erro ao excluir sala', 'error');
    }
}

/**
 * Imagens placeholder por tipo de sala
 */
const imagensSalas = {
    'colaborativo': 'https://lh3.googleusercontent.com/aida-public/AB6AXuCPF_8EQJBRwTemKkUT3sbisfvduXMjUikTpdFZSR2Necq9ek32vtsjQ76REeld26scbqrrv0yvpDq7GqpUgkWR1BD4qKy4mIQI-3PFKtlIG5mjMXV7A42ifnIraIAFtVFGpGNqR2LcPAsfOK0YDB55esVce3i_l5eK4DuG-k2fLdMgBmUW6EV9y24F4icsQTcIPagnMuDhchVmC5sYNHgTtibducOJdnAAir3CA-525kj4Au-YyTQsIyZqCMItrY7kA3VMDyjW_hs',
    'foco': 'https://lh3.googleusercontent.com/aida-public/AB6AXuAZwvJw8Z2SoMq8wwCHC-tiSeQhDSX7pOcMoaWGlak_bIsCGxrvTDMCXT7o2V25W_PxTGuOBJ6Ub5FxDXRpHlwdLtQNyhIbGwTzy56EeoToX2inPQEmUdU_t5xWhkMdIZnzCqv4l7Pw9BVvtbMhMXAsNKDK1f7KSF4xFDz2dbysQfqMK-9TKt0WMOQ34FViWDm8uV2UZUdQuVAPS88gW2YrI7H8htl3618rRTRXQcBMYIe96Fo33kPMAjxH3mie4KhgmPvDTVHCli4',
    'seminario': 'https://lh3.googleusercontent.com/aida-public/AB6AXuAPQ-mG6HJPcv37frA43NjdR2bOh0Q-O0eZG0lCCwixsOnQGHRH9Piib9OTVYefgnF2h_hMRrvxYOvpyxF8mKnoerhGU7vIPHn4qUpyb4OidprIdunoW2uFT6zT4klaLSOh6zk2YKV6btePqUnnyE3P6wfYtSsTvVJtELaivOrdQvqmB-nq8er66dxqhA4doGgQ2FBdcrQke2vbJCuiWHWrAdCfK4TvdKk_f8U2rvxWIJTVKCPndzb6pPBYWxPp7cak9fO-dS7uTsk',
    'criativo': 'https://lh3.googleusercontent.com/aida-public/AB6AXuA5FOwNmNwD8mgfCybx7wGEXEBTjITA_k1JAjHdFlii_X9P6KlPA1XKGXt-HxLyIQXZ1EkcQV9na27HAFGUFIIYUKZSCNAeMCqwRiC8bRy_8lSTkZFwkodLy53ALNr4StdLvfWBFYEG74yybz0nD4CZms9z9l8KXDXuq1O0OPnkpqFRcrtWGnte7GcBr0pTMzwRLoOcggYjD3o96wPH6XutTBP6f3oSIL0TYTKivcJU_MsW3JHkIfRFJ4zFcJO4IbvvmwRkPTKnE8A',
    'reuniao': 'https://lh3.googleusercontent.com/aida-public/AB6AXuCPF_8EQJBRwTemKkUT3sbisfvduXMjUikTpdFZSR2Necq9ek32vtsjQ76REeld26scbqrrv0yvpDq7GqpUgkWR1BD4qKy4mIQI-3PFKtlIG5mjMXV7A42ifnIraIAFtVFGpGNqR2LcPAsfOK0YDB55esVce3i_l5eK4DuG-k2fLdMgBmUW6EV9y24F4icsQTcIPagnMuDhchVmC5sYNHgTtibducOJdnAAir3CA-525kj4Au-YyTQsIyZqCMItrY7kA3VMDyjW_hs'
};

const defaultImage = 'https://lh3.googleusercontent.com/aida-public/AB6AXuCPF_8EQJBRwTemKkUT3sbisfvduXMjUikTpdFZSR2Necq9ek32vtsjQ76REeld26scbqrrv0yvpDq7GqpUgkWR1BD4qKy4mIQI-3PFKtlIG5mjMXV7A42ifnIraIAFtVFGpGNqR2LcPAsfOK0YDB55esVce3i_l5eK4DuG-k2fLdMgBmUW6EV9y24F4icsQTcIPagnMuDhchVmC5sYNHgTtibducOJdnAAir3CA-525kj4Au-YyTQsIyZqCMItrY7kA3VMDyjW_hs';

/**
 * Renderizar cards de salas
 */
function renderizarSalas(salas) {
    const container = document.getElementById('salas-grid');
    if (!container) return;
    const loading = document.getElementById('salas-loading');
    if (loading) loading.remove();
    
    // Calcular estatísticas
    const total = salas.length;
    const disponiveis = salas.filter(s => s.status === 'disponivel').length;
    const ocupados = salas.filter(s => s.status === 'ocupado').length;
    const manutencao = salas.filter(s => s.status === 'manutencao').length;
    const ocupacao = total > 0 ? Math.round((ocupados / total * 100)) : 0;
    
    // Atualizar cards de estatísticas
    document.getElementById('salas-disponiveis').innerHTML = disponiveis + ' <span class="text-sm font-normal text-on-surface-variant">/ ' + total + ' Salas</span>';
    document.getElementById('salas-manutencao').innerHTML = manutencao + ' <span class="text-sm font-normal text-on-surface-variant">Salas</span>';
    document.getElementById('ocupacao-media').textContent = ocupacao + '%';
    document.getElementById('barra-disponiveis').style.width = (total > 0 ? (disponiveis / total * 100) : 0) + '%';
    
    const addCardHTML = `
<div class="group border-2 border-dashed border-outline-variant bg-transparent rounded-2xl overflow-hidden flex flex-col items-center justify-center p-12 transition-all duration-500 hover:bg-surface-container-low hover:border-primary/50 hover:shadow-xl hover:shadow-primary/5 cursor-pointer active:scale-[0.98]" onclick="abrirModalNovaSala()">
<div class="w-16 h-16 rounded-full bg-surface-container-high flex items-center justify-center mb-4 group-hover:scale-110 group-hover:bg-primary transition-all duration-300">
<span class="material-symbols-outlined text-primary text-3xl group-hover:text-white transition-colors">add</span>
</div>
<h3 class="text-lg font-bold text-primary mb-1 transition-colors group-hover:text-primary">Adicionar Nova Sala</h3>
<p class="text-sm text-on-surface-variant text-center max-w-[200px]">Registre um novo espaço colaborativo no sistema</p>
</div>`;
    
    container.innerHTML = '';
    
    const statusLabels = {
        'disponivel': { label: 'Disponível', class: 'bg-secondary-container/90 text-on-secondary-container' },
        'ocupado': { label: 'Ocupado', class: 'bg-surface-variant/90 text-on-surface-variant' },
        'manutencao': { label: 'Manutenção', class: 'bg-error-container/90 text-on-error-container' }
    };
    
    salas.forEach(sala => {
        const status = statusLabels[sala.status] || statusLabels['disponivel'];
        const recursos = sala.recursos ? (Array.isArray(sala.recursos) ? sala.recursos : sala.recursos.split(',').map(r => r.trim())) : [];
        const imagemUrl = imagensSalas[sala.tipo] || defaultImage;
        
        const card = document.createElement('div');
        card.className = 'bg-surface-container-lowest rounded-2xl overflow-hidden flex flex-col transition-all duration-300 hover:translate-y-[-8px] hover:shadow-2xl hover:shadow-primary/10 border border-transparent hover:border-primary/5';
        
        // Gerar HTML dos recursos
        let recursosHTML = '';
        if (recursos.length > 0) {
            recursosHTML = recursos.slice(0, 6).map(r => `
<div class="flex items-center gap-2">
<span class="material-symbols-outlined text-outline text-[18px]">check</span>
<span class="text-xs font-medium text-on-surface">${r}</span>
</div>
`).join('');
        } else {
            recursosHTML = `
<div class="flex items-center gap-2 col-span-2">
<span class="material-symbols-outlined text-slate-300 text-[18px]">block</span>
<span class="text-xs font-medium text-slate-400">Nenhum recurso vinculado</span>
</div>`;
        }
        
        card.innerHTML = `
<div class="relative h-48 w-full overflow-hidden">
<img alt="Interior da Sala" class="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" src="${imagemUrl}">
<div class="absolute top-4 left-4 ${status.class} px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 shadow-sm">
<span class="w-1.5 h-1.5 rounded-full bg-current animate-pulse"></span> ${status.label}
</div>

</div>
<div class="p-6">
<div class="flex justify-between items-start mb-6">
<div>
<h3 class="text-xl font-bold text-primary mb-1">${sala.nome}</h3>
<p class="text-sm text-on-surface-variant flex items-center gap-1">
<span class="material-symbols-outlined text-[16px]">groups</span> Capacidade: ${sala.capacidade} pessoas
</p>
</div>
</div>
<div class="grid grid-cols-2 gap-y-4 gap-x-2 py-4 border-y border-surface-container/50 mb-6">
${recursosHTML}
</div>
<div class="flex gap-2">
<button class="flex-1 py-2.5 bg-surface-container-low text-primary text-sm font-bold rounded-lg hover:bg-primary hover:text-white active:scale-[0.97] transition-all duration-200" onclick='abrirModalEditarSala(${JSON.stringify(sala)})'>Gerenciar</button>
<button class="px-3 py-2.5 bg-surface-container-low text-primary rounded-lg hover:bg-surface-container transition-colors active:scale-90" onclick='excluirSala("${sala.id}")'>
<span class="material-symbols-outlined text-[20px]">delete</span>
</button>
</div>
</div>`;
        
        container.appendChild(card);
    });
    
    // Adicionar card "Adicionar Nova Sala"
    container.innerHTML += addCardHTML;
    
    console.log(`Renderizadas ${salas.length} salas`);
}

/**
 * Carregar salas da API e renderizar
 */
async function carregarSalas() {
    const salas = await listarSalas();
    console.log('Salas carregadas:', salas);
    if (salas && Array.isArray(salas)) {
        renderizarSalas(salas);
    }
}

/**
 * Inicializar gestão de salas
 */
async function inicializarGestaoSalas() {
    await sincronizarMateriaisComSalas();
    await carregarSalas();
    
    // Configurar formulário
    document.getElementById('salaForm').addEventListener('submit', salvarSala);
    
    // Fechar modal ao clicar fora
    document.getElementById('salaModal').addEventListener('click', function(e) {
        if (e.target === this) fecharModal();
    });
    
    // Pesquisa de salas
    const inputPesquisa = document.getElementById('pesquisa-salas');
    if (inputPesquisa) {
        inputPesquisa.addEventListener('input', async function() {
            const termo = this.value.toLowerCase().trim();
            const todasSalas = await listarSalas();
            
            if (!termo) {
                renderizarSalas(todasSalas);
            } else {
                const filtradas = todasSalas.filter(sala => {
                    const nomeMatch = sala.nome && sala.nome.toLowerCase().includes(termo);
                    const statusMatch = sala.status && sala.status.toLowerCase().includes(termo);
                    return nomeMatch || statusMatch;
                });
                renderizarSalas(filtradas);
            }
        });
    }
}

// Disponibilizar funções globalmente
window.abrirModalNovaSala = abrirModalNovaSala;
window.abrirModalEditarSala = abrirModalEditarSala;
window.fecharModal = fecharModal;
window.excluirSala = excluirSala;
window.carregarSalas = carregarSalas;
window.inicializarGestaoSalas = inicializarGestaoSalas;
window.adicionarRecurso = adicionarRecurso;
window.removerRecurso = removerRecurso;