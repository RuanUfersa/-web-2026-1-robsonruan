/**
 * Script de Debug - Teste da API
 */

console.log('--- INICIANDO APP.JS ---');

async function inicializarGestaoSalas() {
    console.log('Carregando salas...');
    
    try {
        const response = await fetch('/api/salas');
        console.log('Status response:', response.status);
        
        const data = await response.json();
        console.log('Dados recebidos:', data);
        
        if (data && Array.isArray(data)) {
            console.log('SUCESSO: ' + data.length + ' salas carregadas!');
            alert('API funcionando! ' + data.length + ' salas encontradas.');
        } else {
            console.log('ERRO: dados inválidos', data);
        }
    } catch (error) {
        console.log('ERRO na API:', error.message);
        alert('Erro ao conectar API: ' + error.message);
    }
}

window.inicializarGestaoSalas = inicializarGestaoSalas;
window.carregarSalas = async () => {
    const r = await fetch('/api/salas');
    return r.json();
};