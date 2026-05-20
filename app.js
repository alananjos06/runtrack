const tituloInput = document.getElementById('titulo');
const distanciaInput = document.getElementById('distancia');
const horasInput = document.getElementById('horas');
const minutosInput = document.getElementById('minutos');
const segundosInput = document.getElementById('segundos');
const btnSalvar = document.getElementById('btnSalvar');
const btnCancelar = document.getElementById('btnCancelar');
const editandoId = document.getElementById('editandoId');
const listaCorridas = document.getElementById('listaCorridas');
const btnTema = document.getElementById('btnTema');

let graficoDistancia = null;
let corridas = [];
let latitudeAtual = null;
let longitudeAtual = null;
let mapa = null;
let marcador = null;

function carregarCorridas() {
    const dados = localStorage.getItem('runtrackCorridas');
    if (dados) corridas = JSON.parse(dados);
    renderizar();
}

function salvar() {
    localStorage.setItem('runtrackCorridas', JSON.stringify(corridas));
}

function calcularPace(distancia, horas, minutos, segundos) {
    const tempoMinutos = (parseInt(horas) || 0) * 60 + (parseInt(minutos) || 0) + (parseInt(segundos) || 0) / 60;
    if (tempoMinutos <= 0 || distancia <= 0) return null;
    const pace = tempoMinutos / distancia;
    const paceMin = Math.floor(pace);
    const paceSeg = Math.round((pace - paceMin) * 60);
    return `${paceMin}:${paceSeg.toString().padStart(2, '0')}`;
}

function criarCorrida(data, distancia, horas, minutos, segundos) {
    const pace = calcularPace(distancia, horas, minutos, segundos);
    return {
        id: Date.now().toString(),
        data,
        distancia: parseFloat(distancia),
        horas: parseInt(horas) || 0,
        minutos: parseInt(minutos) || 0,
        segundos: parseInt(segundos) || 0,
        pace,
        latitude: latitudeAtual,   // ← novo
        longitude: longitudeAtual  // ← novo
    };
}

function adicionarCorrida(corrida) {
    corridas.unshift(corrida);
    salvar();
    renderizar();
    limparFormulario();
}

function atualizarCorrida(id, data, distancia, horas, minutos, segundos) {
    const index = corridas.findIndex(c => c.id === id);
    if (index === -1) return;
    corridas[index].data = data;
    corridas[index].distancia = parseFloat(distancia);
    corridas[index].horas = parseInt(horas) || 0;
    corridas[index].minutos = parseInt(minutos) || 0;
    corridas[index].segundos = parseInt(segundos) || 0;
    corridas[index].pace = calcularPace(distancia, horas, minutos, segundos);
    salvar();
    renderizar();
    limparFormulario();
}

function excluirCorrida(id) {
    corridas = corridas.filter(c => c.id !== id);
    if (editandoId.value === id) limparFormulario();
    salvar();
    renderizar();
}

function editarCorrida(id) {
    const corrida = corridas.find(c => c.id === id);
    if (!corrida) return;
    document.getElementById('data').value = corrida.data;
    distanciaInput.value = corrida.distancia;
    horasInput.value = corrida.horas;
    minutosInput.value = corrida.minutos;
    segundosInput.value = corrida.segundos;
    editandoId.value = corrida.id;
    btnSalvar.textContent = '✏️ Atualizar Corrida';
    btnCancelar.style.display = 'block';
    document.querySelector('.formulario').scrollIntoView({ behavior: 'smooth' });
}

function limparFormulario() {
    document.getElementById('data').value = '';
    distanciaInput.value = '';
    horasInput.value = '0';
    minutosInput.value = '30';
    segundosInput.value = '0';
    editandoId.value = '';
    btnSalvar.textContent = '💾 Registrar Corrida';
    btnCancelar.style.display = 'none';
    latitudeAtual = null;
    longitudeAtual = null;
    document.getElementById('localTexto').textContent = 'Nenhum local definido';
    document.getElementById('mapaContainer').style.display = 'none';
if (marcador) {
    marcador.remove();
    marcador = null;
}
}

function atualizarResumo() {
    const total = corridas.length;
    const kmTotal = corridas.reduce((s, c) => s + c.distancia, 0);
    const paces = corridas.filter(c => c.pace).map(c => c.pace);
    const melhorPace = paces.length ? paces.reduce((a, b) => (a < b ? a : b)) : null;
    const tempoMin = corridas.reduce((s, c) => s + c.horas * 60 + c.minutos + c.segundos / 60, 0);
    const horas = Math.floor(tempoMin / 60);
    const mins = Math.round(tempoMin % 60);

    document.getElementById('totalCorridas').textContent = total;
    document.getElementById('totalDistancia').textContent = kmTotal.toFixed(1);
    document.getElementById('melhorPace').textContent = melhorPace || '--';
    document.getElementById('tempoTotal').textContent = `${horas}h ${mins}min`;
}

function atualizarGrafico() {
    const ctx = document.getElementById('graficoDistancia').getContext('2d');
    
    // Pega as últimas 10 corridas em ordem cronológica (mais antiga primeiro)
    const dados = [...corridas].reverse().slice(-10);
    
    const labels = dados.map(c => {
        const [ano, mes, dia] = c.data.split('-');
        return `${dia}/${mes}`;
    });
    
    const valores = dados.map(c => c.distancia);
    
    if (graficoDistancia) {
        graficoDistancia.destroy();
    }
    
    graficoDistancia = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Distância (km)',
                data: valores,
                borderColor: document.body.classList.contains('dark') ? '#6ab88a' : '#4f8c6b',
                backgroundColor: document.body.classList.contains('dark') 
                    ? 'rgba(106, 184, 138, 0.1)' 
                    : 'rgba(79, 140, 107, 0.1)',
                fill: true,
                tension: 0.3,
                pointBackgroundColor: document.body.classList.contains('dark') ? '#6ab88a' : '#4f8c6b',
                pointRadius: 4,
                pointHoverRadius: 6,
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    grid: {
                        color: document.body.classList.contains('dark') 
                            ? 'rgba(255,255,255,0.05)' 
                            : 'rgba(0,0,0,0.05)'
                    },
                    ticks: {
                        callback: function(value) {
                            return value + ' km';
                        },
                        color: document.body.classList.contains('dark') ? '#a0a0a0' : '#8f8f8f'
                    }
                },
                x: {
                    grid: {
                        display: false
                    },
                    ticks: {
                        color: document.body.classList.contains('dark') ? '#a0a0a0' : '#8f8f8f'
                    }
                }
            }
        }
    });
}

function renderizar() {
    listaCorridas.innerHTML = '';
    
    if (corridas.length === 0) {
        listaCorridas.innerHTML = '<p class="vazio">Nenhuma corrida registrada. Que tal sair pra correr? 🏃‍♀️</p>';
        atualizarResumo();
        atualizarGrafico();
        return;
    }

    corridas.forEach(corrida => {
        const card = document.createElement('div');
        card.className = 'card-corrida';
        card.innerHTML = `
            <div class="info">
                <span class="data">${new Date(corrida.data + 'T00:00:00').toLocaleDateString('pt-BR')}</span>
                <span class="distancia">${corrida.distancia.toFixed(1)} km</span>
                <span class="detalhes">
                    Tempo: ${corrida.horas}h ${corrida.minutos}min ${corrida.segundos}s
                    ${corrida.pace ? `· Pace: ${corrida.pace}/km` : ''}
                </span>
                    ${corrida.latitude ? `<span class="local-corrida">📍 Local salvo</span>` : ''}
            </div>
            <div class="acoes">
                <button class="btn-editar" onclick="editarCorrida('${corrida.id}')">✏️</button>
                <button class="btn-excluir" onclick="excluirCorrida('${corrida.id}')">🗑️</button>
            </div>
        `;
        listaCorridas.appendChild(card);
    });

    atualizarResumo();
}

function pegarLocalizacao() {
    if (!navigator.geolocation) {
        alert('Seu navegador não suporta geolocalização');
        return;
    }

    document.getElementById('btnPegarLocal').textContent = '📍 Obtendo localização...';
    document.getElementById('btnPegarLocal').disabled = true;

    navigator.geolocation.getCurrentPosition(
        function(posicao) {
            latitudeAtual = posicao.coords.latitude;
            longitudeAtual = posicao.coords.longitude;
            
            document.getElementById('localTexto').textContent = 
                `📍 ${latitudeAtual.toFixed(4)}, ${longitudeAtual.toFixed(4)}`;
            document.getElementById('btnPegarLocal').textContent = '📍 Pegar minha localização';
            document.getElementById('btnPegarLocal').disabled = false;
            
            mostrarMapa(latitudeAtual, longitudeAtual);
        },
        function(erro) {
            alert('Erro ao obter localização. Permita o acesso ao GPS.');
            document.getElementById('btnPegarLocal').textContent = '📍 Pegar minha localização';
            document.getElementById('btnPegarLocal').disabled = false;
        }
    );
}

function pegarLocalizacao() {
    if (!navigator.geolocation) {
        alert('Seu navegador não suporta geolocalização');
        return;
    }

    document.getElementById('btnPegarLocal').textContent = '📍 Obtendo localização...';
    document.getElementById('btnPegarLocal').disabled = true;

    navigator.geolocation.getCurrentPosition(
        function(posicao) {
            latitudeAtual = posicao.coords.latitude;
            longitudeAtual = posicao.coords.longitude;
            
            document.getElementById('localTexto').textContent = 
                `📍 ${latitudeAtual.toFixed(4)}, ${longitudeAtual.toFixed(4)}`;
            document.getElementById('btnPegarLocal').textContent = '📍 Pegar minha localização';
            document.getElementById('btnPegarLocal').disabled = false;
            
            mostrarMapa(latitudeAtual, longitudeAtual);
        },
        function(erro) {
            alert('Erro ao obter localização. Permita o acesso ao GPS.');
            document.getElementById('btnPegarLocal').textContent = '📍 Pegar minha localização';
            document.getElementById('btnPegarLocal').disabled = false;
        }
    );
}

function pegarLocalizacao() {
    if (!navigator.geolocation) {
        alert('Seu navegador não suporta geolocalização');
        return;
    }

    document.getElementById('btnPegarLocal').textContent = '📍 Obtendo localização...';
    document.getElementById('btnPegarLocal').disabled = true;

    navigator.geolocation.getCurrentPosition(
        function(posicao) {
            latitudeAtual = posicao.coords.latitude;
            longitudeAtual = posicao.coords.longitude;
            
            document.getElementById('localTexto').textContent = 
                `📍 ${latitudeAtual.toFixed(4)}, ${longitudeAtual.toFixed(4)}`;
            document.getElementById('btnPegarLocal').textContent = '📍 Pegar minha localização';
            document.getElementById('btnPegarLocal').disabled = false;
            
            mostrarMapa(latitudeAtual, longitudeAtual);
        },
        function(erro) {
            alert('Erro ao obter localização. Permita o acesso ao GPS.');
            document.getElementById('btnPegarLocal').textContent = '📍 Pegar minha localização';
            document.getElementById('btnPegarLocal').disabled = false;
        }
    );
}

function mostrarMapa(lat, lng) {
    const container = document.getElementById('mapaContainer');
    container.style.display = 'block';

    if (mapa) {
        mapa.setView([lat, lng], 15);
        if (marcador) marcador.remove();
    } else {
        mapa = L.map('mapa').setView([lat, lng], 15);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; OpenStreetMap'
        }).addTo(mapa);
    }

    marcador = L.marker([lat, lng]).addTo(mapa)
        .bindPopup('🏃‍♀️ Local da corrida')
        .openPopup();

    // Corrige o tamanho do mapa depois de mostrar
    setTimeout(() => {
        mapa.invalidateSize();
    }, 100);
}
document.getElementById('btnPegarLocal').addEventListener('click', pegarLocalizacao);


// Eventos
btnSalvar.addEventListener('click', () => {
    const data = document.getElementById('data').value;
    const distancia = distanciaInput.value;
    const horas = horasInput.value;
    const minutos = minutosInput.value;
    const segundos = segundosInput.value;

    if (!data || !distancia) {
        alert('Preencha data e distância!');
        return;
    }

    if (editandoId.value) {
        atualizarCorrida(editandoId.value, data, distancia, horas, minutos, segundos);
    } else {
        adicionarCorrida(criarCorrida(data, distancia, horas, minutos, segundos));
    }
});

btnCancelar.addEventListener('click', limparFormulario);

// Tema
const temaSalvo = localStorage.getItem('runtrackTema');
if (temaSalvo === 'dark') {
    document.body.classList.add('dark');
    btnTema.textContent = '☀️';
}

btnTema.addEventListener('click', () => {
    document.body.classList.toggle('dark');
    const isDark = document.body.classList.contains('dark');
    btnTema.textContent = isDark ? '☀️' : '🌙';
    localStorage.setItem('runtrackTema', isDark ? 'dark' : 'light');
    
    // Recria o gráfico com as cores do novo tema
    if (corridas.length > 0) atualizarGrafico();
});

// Iniciar
carregarCorridas();