const PROFILE_API = 'https://2791fnzy75.execute-api.us-east-1.amazonaws.com/profile';

function parseJWT(token) {
    try {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(atob(base64).split('').map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)).join(''));
        return JSON.parse(jsonPayload);
    } catch (e) { return null; }
}

async function carregarUserProfile() {
    const idToken = sessionStorage.getItem('id_token');
    if (!idToken) return;

    const payload = parseJWT(idToken);
    if (!payload || payload.exp * 1000 <= Date.now()) return;

    const userId = payload['cognito:username'] || payload.sub || payload.email || '';
    const email = payload.email || '';
    const savedFoto = localStorage.getItem('profile_foto_url');
    const savedNome = localStorage.getItem('profile_nome');

    let nome = savedNome || payload.name || payload.given_name || 'Funcionário';
    let picture = savedFoto || payload.picture || '';

    try {
        const res = await fetch(PROFILE_API + '?id=' + encodeURIComponent(userId));
        if (res.ok) {
            const data = await res.json();
            if (data && data.nome) {
                nome = data.nome;
                picture = data.fotoUrl || picture;
                if (data.fotoUrl) localStorage.setItem('profile_foto_url', data.fotoUrl);
                if (data.nome) localStorage.setItem('profile_nome', data.nome);
            }
        }
    } catch (e) {}

    atualizarInterface(nome, email, picture);
}

function atualizarInterface(nome, email, picture) {
    const nameEl = document.getElementById('user-name');
    const roleEl = document.getElementById('user-role');
    const picEl = document.getElementById('user-picture');
    const fallbackEl = document.getElementById('user-avatar-fallback');

    if (nameEl) nameEl.textContent = nome;
    if (roleEl) roleEl.textContent = email || 'Funcionário';

    const greetingEl = document.getElementById('user-greeting');
    if (greetingEl) greetingEl.textContent = nome.split(' ')[0];

    if (picEl && fallbackEl) {
        if (picture) {
            picEl.src = picture + '?t=' + Date.now();
            picEl.classList.remove('hidden');
            fallbackEl.classList.add('hidden');
        } else {
            fallbackEl.textContent = nome.charAt(0).toUpperCase();
            fallbackEl.classList.remove('hidden');
            picEl.classList.add('hidden');
        }
    }

    const navPic = document.getElementById('nav-user-picture');
    const navFallback = document.getElementById('nav-user-fallback');
    if (navPic && navFallback) {
        if (picture) {
            navPic.src = picture + '?t=' + Date.now();
            navPic.classList.remove('hidden');
            navFallback.classList.add('hidden');
        } else {
            navFallback.textContent = nome.charAt(0).toUpperCase();
            navFallback.classList.remove('hidden');
            navPic.classList.add('hidden');
        }
    }
}

document.addEventListener('DOMContentLoaded', carregarUserProfile);
