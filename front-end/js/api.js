/**
 * Módulo de Comunicação com a API
 * 
 * Este arquivo centraliza todas as chamadas AJAX para o backend,
 * facilitando alterações futuras e mantendo o código organizado.
 * 
 * @author Robson Ruan
 * @version 1.0.0
 */

const API_BASE = window.location.hostname === 'localhost' 
    ? 'http://localhost:3000/api' 
    : '/api';

/**
 * Função genérica para fazer requisições FETCH
 */
async function fetchAPI(endpoint, options = {}) {
    const url = API_BASE + endpoint;
    const defaults = {
        headers: {
            'Content-Type': 'application/json'
        }
    };
    
    try {
        const response = await fetch(url, { ...defaults, ...options });
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.erro || 'Erro na requisição');
        }
        
        return data;
    } catch (error) {
        console.error('Erro na API:', error);
        throw error;
    }
}

/**
 * API de Salas
 */
export const salasAPI = {
    listar: () => fetchAPI('/salas', { method: 'GET' }),
    criar: (data) => fetchAPI('/salas', { method: 'POST', body: JSON.stringify(data) }),
    atualizar: (id, data) => fetchAPI('/salas/' + id, { method: 'PUT', body: JSON.stringify(data) }),
    excluir: (id) => fetchAPI('/salas/' + id, { method: 'DELETE' })
};

/**
 * API de Reservas
 */
export const reservasAPI = {
    listar: () => fetchAPI('/reservas', { method: 'GET' }),
    criar: (data) => fetchAPI('/reservas', { method: 'POST', body: JSON.stringify(data) }),
    atualizar: (id, data) => fetchAPI('/reservas/' + id, { method: 'PUT', body: JSON.stringify(data) }),
    excluir: (id) => fetchAPI('/reservas/' + id, { method: 'DELETE' })
};

/**
 * API de Ocorrências
 */
export const ocorrenciasAPI = {
    listar: () => fetchAPI('/ocorrencias', { method: 'GET' }),
    criar: (data) => fetchAPI('/ocorrencias', { method: 'POST', body: JSON.stringify(data) }),
    atualizar: (id, data) => fetchAPI('/ocorrencias/' + id, { method: 'PUT', body: JSON.stringify(data) }),
    excluir: (id) => fetchAPI('/ocorrencias/' + id, { method: 'DELETE' })
};

/**
 * API de Inventário
 */
export const inventarioAPI = {
    listar: () => fetchAPI('/materiais', { method: 'GET' }),
    criar: (data) => fetchAPI('/materiais', { method: 'POST', body: JSON.stringify(data) }),
    atualizar: (id, data) => fetchAPI('/materiais/' + id, { method: 'PUT', body: JSON.stringify(data) }),
    excluir: (id) => fetchAPI('/materiais/' + id, { method: 'DELETE' })
};

export default {
    salasAPI,
    reservasAPI,
    ocorrenciasAPI,
    inventarioAPI
};