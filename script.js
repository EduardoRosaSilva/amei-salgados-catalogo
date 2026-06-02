const URL_PLANILHA = "https://docs.google.com/spreadsheets/d/e/2PACX-1vS0kfNS_Q5ZidRXjo-oUxUwhTUTmH1o-mGMPUh1v-5OYV_mJ8lYyfUozpSm25txuCUYpCezmowgkB2Y/pub?gid=1596392114&single=true&output=tsv"; 

// NÚMERO DA LANCHONETE (CLIENTE) PARA RECEBER PEDIDOS
const telefoneLanchonete = "5534988979594"; 
const IMG_PADRAO_SALGADO = "static/salgados.jpg";

let carrinho = [];
let saboresMisto = []; 
let selecaoMisto = {};
let centoMistoAtualNome = '';
let centoMistoAtualPreco = 0;

function abrirModalInfo(id) { document.getElementById(id).classList.remove('hidden'); }
function fecharModalInfo(id) { document.getElementById(id).classList.add('hidden'); }

// --- SISTEMA INTELIGENTE DE HORÁRIOS E DATAS ---

// Bloqueia domingos no calendário
document.addEventListener('DOMContentLoaded', () => {
    const dateInput = document.getElementById('dia-pedido');
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    // Define o mínimo como o dia atual (formato YYYY-MM-DD ajustado para fuso local)
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const dayNum = String(today.getDate()).padStart(2, '0');
    dateInput.min = `${year}-${month}-${dayNum}`;
    
    dateInput.addEventListener('input', function(e) {
        const dataSelecionada = this.value; // Formato "YYYY-MM-DD"
        if(!dataSelecionada) return;

        const dayOfWeek = new Date(dataSelecionada + 'T00:00:00').getDay();

        // Regra: Domingos
        if (dayOfWeek === 0) { 
            alert('Estamos fechados aos domingos. Por favor, escolha outra data.');
            this.value = '';
            limparSelectHorarios();
            return;
        }

        atualizarHorariosDisponiveis();
    });
});

function limparSelectHorarios() {
    const selectHorario = document.getElementById('horario-pedido');
    selectHorario.innerHTML = '<option value="" disabled selected>Escolha a data primeiro...</option>';
    selectHorario.disabled = true;
}

// Atualiza a lista suspensa de horários dependendo do dia escolhido
function atualizarHorariosDisponiveis() {
    const dateInput = document.getElementById('dia-pedido').value;
    const selectHorario = document.getElementById('horario-pedido');
    
    if (!dateInput) {
        limparSelectHorarios();
        return;
    }

    selectHorario.disabled = false;
    selectHorario.innerHTML = '<option value="" disabled selected>Escolha o horário...</option>';
    
    const dataEscolhida = new Date(dateInput + 'T00:00:00');
    const diaDaSemana = dataEscolhida.getDay(); 
    
    // Lógica de fechamento (Seg-Sex até 18:30 | Sáb até 17:30)
    let limiteHora = 18;
    let limiteMinuto = 30;
    if (diaDaSemana === 6) { // Sábado
        limiteHora = 17;
    }

    for (let h = 9; h <= limiteHora; h++) {
        for (let m = 0; m <= 30; m += 30) {
            if (h === limiteHora && m > limiteMinuto) continue;
            
            const horaStr = h.toString().padStart(2, '0');
            const minStr = m.toString().padStart(2, '0');
            const timeString = `${horaStr}:${minStr}`;
            
            const option = document.createElement('option');
            option.value = timeString;
            option.textContent = timeString;
            selectHorario.appendChild(option);
        }
    }
}

// --- FIM DO SISTEMA INTELIGENTE DE HORÁRIOS ---

function checarHorarioFuncionamento() {
    const agora = new Date();
    const dia = agora.getDay(); 
    const hora = agora.getHours();
    const min = agora.getMinutes();
    const minutosAtuais = (hora * 60) + min;

    let aberto = false;

    if (dia >= 1 && dia <= 5) {
        if (minutosAtuais >= 540 && minutosAtuais < 1140) {
            aberto = true;
        }
    } 
    else if (dia === 6) {
        if (minutosAtuais >= 540 && minutosAtuais < 1080) {
            aberto = true;
        }
    }

    const spanStatus = document.getElementById('status-loja');
    if (aberto) {
        spanStatus.innerText = "ABERTO PARA PEDIDOS";
        spanStatus.className = "text-[11px] font-bold tracking-widest uppercase text-green-600";
    } else {
        spanStatus.innerText = "FECHADO NO MOMENTO";
        spanStatus.className = "text-[11px] font-bold tracking-widest uppercase text-red-600";
    }
}

async function carregarCardapio() {
    checarHorarioFuncionamento(); 
    setInterval(checarHorarioFuncionamento, 60000); 
    
    try {
        const urlSemCache = URL_PLANILHA + "&t=" + new Date().getTime();
        const response = await fetch(urlSemCache);
        const data = await response.text();
        const delimitador = data.includes('\t') ? '\t' : (data.includes(';') ? ';' : ',');
        const linhas = data.split('\n').slice(1); 

        saboresMisto = [];
        let centosMistosHTML = '', promocoesHTML = '', combosHTML = '', fritosHTML = '', assadosHTML = '', bebidasHTML = '';

        const nomesEsgotados = [];
        const produtosRaw = linhas.map(l => l.split(delimitador));

        produtosRaw.forEach(cols => {
            const nome = cols[0] ? cols[0].trim().replace(/"/g, '') : '';
            const status = cols[3] ? cols[3].trim().toUpperCase() : '';
            const cat = cols[2] ? cols[2].trim().toUpperCase() : '';
            if (nome && (cat.includes('FRITO') || cat.includes('ASSADO')) && (status !== 'DISPONIVEL' && status !== 'TRUE')) {
                nomesEsgotados.push(nome);
            }
        });

        produtosRaw.forEach((colunas, index) => {
            try {
                if(colunas.length < 2) return; 
                
                const nome = colunas[0] ? colunas[0].trim().replace(/"/g, '') : '';
                const precoOriginal = colunas[1] ? colunas[1].trim() : '';
                const precoLimpo = precoOriginal.replace(/[^0-9,.-]/g, ''); 
                const preco = parseFloat(precoLimpo.replace(',', '.')); 
                
                if (!nome || isNaN(preco)) return;

                const categoria = colunas[2] ? colunas[2].trim().toUpperCase() : '';
                const statusUnidade = colunas[3] ? colunas[3].trim().toUpperCase() : '';
                const img = colunas[4] ? colunas[4].trim() : ''; 
                const observacao = colunas[5] ? colunas[5].trim() : '';
                
                let isDisponivel = (statusUnidade === 'DISPONIVEL' || statusUnidade === 'TRUE');

                if (isDisponivel && (categoria.includes('COMBO') || categoria.includes('CENTO') || categoria.includes('PROMO'))) {
                    if (nomesEsgotados.some(esgotado => nome.includes(esgotado))) isDisponivel = false;
                }

                if (categoria.includes('FRITO') || categoria.includes('ASSADO')) {
                    saboresMisto.push({ nome: nome, disponivel: isDisponivel });
                }

                const nomeSafe = encodeURIComponent(nome);
                const catSafe = encodeURIComponent(categoria);
                
                if (categoria === 'CENTO MISTO') {
                    document.getElementById('personalizado').classList.remove('hidden');
                    const opacidade = isDisponivel ? "" : "opacity-60 grayscale-[50%]";
                    const btnStatus = isDisponivel 
                        ? `<button onclick="abrirModalMisto('${nomeSafe}', ${preco})" class="bg-red-600 text-white text-sm font-bold px-5 py-2.5 rounded-lg shadow-sm hover:bg-red-700 transition">Montar Agora</button>`
                        : `<span class="text-xs font-bold text-red-500 bg-red-50 px-3 py-2 rounded-lg">Indisponível</span>`;

                    centosMistosHTML += `
                        <div class="bg-white rounded-xl shadow-sm border border-slate-200 flex overflow-hidden hover:shadow-md transition ${opacidade}">
                            <div class="w-32 h-auto flex-shrink-0 bg-slate-100"><img src="${img || IMG_PADRAO_SALGADO}" class="w-full h-full object-cover" onerror="this.src='${IMG_PADRAO_SALGADO}'"></div>
                            <div class="p-4 flex flex-col justify-between w-full">
                                <div>
                                    <h4 class="font-bold text-slate-800 leading-tight text-sm md:text-base">${nome}</h4>
                                    <p class="text-[10px] md:text-xs text-slate-500 mt-1 line-clamp-2">Escolha seus sabores favoritos (100 un).</p>
                                </div>
                                <div class="flex justify-between items-center mt-3">
                                    <span class="font-bold text-red-600">R$ ${preco.toFixed(2).replace('.', ',')}</span>
                                    ${btnStatus}
                                </div>
                            </div>
                        </div>
                    `;
                }
                else {
                    const html = gerarCardHTML(nome, preco, categoria, img || IMG_PADRAO_SALGADO, isDisponivel, nomeSafe, catSafe, observacao);
                    if (categoria.includes('PROMOÇÃO') || categoria.includes('PROMOCAO')) { 
                        document.getElementById('secao-promocoes').classList.remove('hidden'); 
                        promocoesHTML += html; 
                    }
                    else if (categoria.includes('COMBO')) { document.getElementById('secao-combos').classList.remove('hidden'); combosHTML += html; }
                    else if (categoria.includes('BEBIDA')) { document.getElementById('secao-bebidas').classList.remove('hidden'); bebidasHTML += html; }
                    else if (categoria.includes('FRITO')) { document.getElementById('secao-fritos').classList.remove('hidden'); fritosHTML += html; }
                    else if (categoria.includes('ASSADO')) { document.getElementById('secao-assados').classList.remove('hidden'); assadosHTML += html; }
                }
            } catch(e) {
                console.warn('Linha ignorada devido a erro de formatação:', index, e);
            }
        });

        document.getElementById('container-centos-mistos').innerHTML = centosMistosHTML;
        document.getElementById('container-promocoes').innerHTML = promocoesHTML;
        document.getElementById('container-combos').innerHTML = combosHTML;
        document.getElementById('container-fritos').innerHTML = fritosHTML;
        document.getElementById('container-assados').innerHTML = assadosHTML;
        document.getElementById('container-bebidas').innerHTML = bebidasHTML;
        document.getElementById('loading-spinner').classList.add('hidden');
        document.getElementById('conteudo-cardapio').classList.remove('hidden');

    } catch (erro) {
        console.error("Erro fatal:", erro);
        document.getElementById('loading-spinner').innerHTML = `<p class="text-red-600 font-bold text-center">Erro ao sincronizar cardápio. Tente recarregar a página.</p>`;
    }
}

function gerarCardHTML(nome, preco, categoria, imgUrl, isDisponivel, nomeSafe, catSafe, observacao = '') {
    const opacidade = isDisponivel ? "" : "opacity-60 grayscale-[50%]";
    const selo = isDisponivel ? "" : `<div class="absolute top-2 right-2 bg-red-600 text-white text-[10px] font-bold px-2 py-1 rounded shadow-md">ESGOTADO</div>`;
    
    // Cria o HTML da observação se ela existir
    const obsHTML = observacao ? `<p class="text-[11px] text-slate-500 mt-1 leading-tight line-clamp-2">${observacao}</p>` : '';
    
    const botoes = isDisponivel ? `
        <div class="flex items-center bg-slate-100 rounded-lg">
            <button onclick="removerItemPorChave('${nomeSafe}')" class="w-8 h-8 font-bold text-slate-500">-</button>
            <span class="qtd-item font-bold text-sm w-5 text-center" data-nome="${nomeSafe}">0</span>
            <button onclick="adicionarItemPorChave('${nomeSafe}', ${preco}, '${catSafe}')" class="w-8 h-8 font-bold text-red-600">+</button>
        </div>
    ` : `<span class="text-[10px] font-bold text-red-500 bg-red-50 px-2 py-1 rounded">Indisponível</span>`;

    return `<div class="bg-white rounded-xl shadow-sm border border-slate-200 flex overflow-hidden relative ${opacidade} card-produto">${selo}<div class="w-24 h-24 md:w-32 md:h-32 flex-shrink-0 bg-slate-100"><img src="${imgUrl}" class="w-full h-full object-cover" onerror="this.src='${IMG_PADRAO_SALGADO}'"></div><div class="p-3 md:p-4 flex flex-col justify-between w-full"><div><h4 class="font-bold text-sm md:text-base text-slate-800">${nome}</h4>${obsHTML}</div><div class="flex justify-between items-center mt-2"><span class="font-bold text-sm md:text-base text-red-600">R$ ${preco.toFixed(2).replace('.', ',')}</span>${botoes}</div></div></div>`;
}

function abrirModalMisto(nomeCodificado, preco) { 
    centoMistoAtualNome = decodeURIComponent(nomeCodificado);
    centoMistoAtualPreco = preco;
    document.getElementById('titulo-modal-misto').innerText = centoMistoAtualNome;
    selecaoMisto = {}; 
    saboresMisto.forEach(s => selecaoMisto[s.nome] = 0); 
    document.getElementById('modal-misto').classList.remove('hidden'); 
    renderizarListaMisto(); 
}

function fecharModalMisto() { document.getElementById('modal-misto').classList.add('hidden'); }

function alterarQtdMisto(nomeCodificado, delta) { 
    const nomeReal = decodeURIComponent(nomeCodificado);
    const item = saboresMisto.find(s => s.nome === nomeReal);
    if(!item || !item.disponivel) return;
    let total = Object.values(selecaoMisto).reduce((a, b) => a + b, 0); 
    if (delta > 0 && total + delta > 100) return; 
    if (selecaoMisto[nomeReal] + delta < 0) return; 
    selecaoMisto[nomeReal] += delta; 
    renderizarListaMisto(); 
}

function renderizarListaMisto() { 
    let total = Object.values(selecaoMisto).reduce((a, b) => a + b, 0); 
    document.getElementById('misto-contador').innerText = total; 
    const btn = document.getElementById('btn-confirmar-misto'); 
    btn.disabled = total !== 100;
    if (total === 100) {
        btn.className = "w-full bg-green-500 text-white font-bold py-4 rounded-xl shadow-lg transition uppercase tracking-widest";
        btn.innerText = `Adicionar (R$ ${centoMistoAtualPreco.toFixed(2).replace('.', ',')})`;
    } else {
        btn.className = "w-full bg-slate-300 text-slate-500 font-bold py-4 rounded-xl uppercase tracking-widest";
        btn.innerText = `Faltam ${100 - total} unidades`;
    }
    
    const lista = document.getElementById('lista-opcoes-misto'); 
    lista.innerHTML = ''; 
    saboresMisto.forEach(item => { 
        const nomeSafe = encodeURIComponent(item.nome);
        const controle = item.disponivel ? `
            <div class="flex items-center gap-1 bg-slate-100 rounded p-1">
                <button onclick="alterarQtdMisto('${nomeSafe}', -10)" class="w-7 h-7 bg-white rounded text-xs font-bold text-slate-500">-10</button>
                <button onclick="alterarQtdMisto('${nomeSafe}', -1)" class="w-7 h-7 bg-white rounded font-bold text-slate-500">-</button>
                <span class="w-6 text-center font-bold text-slate-800">${selecaoMisto[item.nome]}</span>
                <button onclick="alterarQtdMisto('${nomeSafe}', 1)" class="w-7 h-7 bg-white rounded text-red-600 font-bold">+</button>
                <button onclick="alterarQtdMisto('${nomeSafe}', 10)" class="w-7 h-7 bg-white rounded text-red-600 text-xs font-bold">+10</button>
            </div>` : `<span class="text-red-500 font-bold text-xs uppercase">Esgotado</span>`;
        lista.innerHTML += `<div class="flex justify-between items-center bg-white p-3 rounded-xl border ${item.disponivel ? '' : 'opacity-50'} shadow-sm"><span class="text-sm font-semibold text-slate-700">${item.nome}</span>${controle}</div>`;
    }); 
}

function adicionarMistoAoCarrinho() { 
    let subItensArray = Object.entries(selecaoMisto).filter(e => e[1] > 0).map(e => `${e[1]}x ${e[0]}`);
    adicionarItemComSubItens(centoMistoAtualNome, centoMistoAtualPreco, 'CENTO MISTO', subItensArray); 
    fecharModalMisto(); 
}

function adicionarItemPorChave(chaveCodificada, preco = 0, catCodificada = '') {
    const chave = decodeURIComponent(chaveCodificada);
    const categoria = decodeURIComponent(catCodificada) || 'OUTROS';
    const ex = carrinho.find(i => i.chave === chave); 
    if (ex) { 
        ex.quantidade += 1; 
    } else { 
        carrinho.push({ chave: chave, nome: chave, preco: preco, quantidade: 1, categoria: categoria, subItens: null }); 
    } 
    atualizarCarrinhoVisual(); 
}

function adicionarItemComSubItens(nome, preco, categoria, subItens) {
    const chave = nome + "|" + subItens.join(','); 
    const ex = carrinho.find(i => i.chave === chave); 
    if (ex) { 
        ex.quantidade += 1; 
    } else { 
        carrinho.push({ chave: chave, nome: nome, preco: preco, quantidade: 1, categoria: categoria, subItens: subItens }); 
    } 
    atualizarCarrinhoVisual(); 
}

function removerItemPorChave(chaveCodificada) { 
    const chave = decodeURIComponent(chaveCodificada);
    const idx = carrinho.findIndex(i => i.chave === chave); 
    if (idx !== -1) { 
        if (carrinho[idx].quantidade > 1) { 
            carrinho[idx].quantidade -= 1; 
        } else { 
            carrinho.splice(idx, 1); 
        } 
    } 
    atualizarCarrinhoVisual(); 
}

function atualizarCarrinhoVisual() { 
    document.querySelectorAll('.qtd-item').forEach(s => { 
        const nomeBase = decodeURIComponent(s.getAttribute('data-nome'));
        const ex = carrinho.find(i => i.chave === nomeBase); 
        s.innerText = ex ? ex.quantidade : "0"; 
    }); 
    
    const div = document.getElementById('lista-carrinho'); 
    div.innerHTML = ''; 
    let total = 0, qtd = 0; 
    
    carrinho.forEach(i => { 
        total += (i.preco * i.quantidade); 
        qtd += i.quantidade; 
        
        const chaveSafe = encodeURIComponent(i.chave);
        const catSafe = encodeURIComponent(i.categoria || 'OUTROS');
        
        let subHTML = i.subItens ? `<div class="text-[11px] text-slate-500 mt-1 leading-tight border-l-2 border-slate-200 pl-2 ml-1">${i.subItens.join('<br>')}</div>` : '';

        div.innerHTML += `
        <div class="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex justify-between items-center">
            <div class="w-2/3 pr-2">
                <p class="font-semibold text-sm text-slate-800 leading-tight">${i.nome}</p>
                ${subHTML}
                <p class="text-red-600 font-bold mt-2">R$ ${(i.preco * i.quantidade).toFixed(2).replace('.', ',')}</p>
            </div>
            <div class="flex items-center bg-slate-100 rounded-lg">
                <button onclick="removerItemPorChave('${chaveSafe}')" class="w-8 h-8 font-bold text-slate-500 hover:bg-slate-200 rounded-l-lg transition">-</button>
                <span class="font-bold text-sm w-6 text-center text-slate-800">${i.quantidade}</span>
                <button onclick="adicionarItemPorChave('${chaveSafe}', ${i.preco}, '${catSafe}')" class="w-8 h-8 font-bold text-red-600 hover:bg-red-100 rounded-r-lg transition">+</button>
            </div>
        </div>`; 
    }); 
    
    const totalFormatado = `R$ ${total.toFixed(2).replace('.', ',')}`;
    
    document.getElementById('valor-total-step1').innerText = totalFormatado; 
    document.getElementById('valor-flutuante').innerText = totalFormatado; 
    document.getElementById('badge-itens').innerText = qtd; 
    document.getElementById('btn-flutuante').classList.toggle('hidden', carrinho.length === 0); 
    document.getElementById('cart-count-top').innerText = totalFormatado;
}

function toggleCarrinho() { document.getElementById('modal-carrinho').classList.toggle('hidden'); }
function irParaCheckout() { document.getElementById('step-carrinho').classList.add('hidden'); document.getElementById('step-checkout').classList.remove('hidden'); }
function voltarParaCarrinho() { document.getElementById('step-checkout').classList.add('hidden'); document.getElementById('step-carrinho').classList.remove('hidden'); }

function mostrarSucesso() {
    document.getElementById('modal-carrinho').classList.add('hidden');
    document.getElementById('step-checkout').classList.add('hidden');
    document.getElementById('step-carrinho').classList.remove('hidden');
    document.getElementById('modal-sucesso').classList.remove('hidden');
}

function fecharSucesso() {
    document.getElementById('modal-sucesso').classList.add('hidden');
    
    document.getElementById('nome-cliente').value = '';
    document.getElementById('dia-pedido').value = '';
    limparSelectHorarios();
    document.getElementById('obs-pedido').value = '';
    
    carrinho = [];
    atualizarCarrinhoVisual();
}

function enviarPedido() { 
    const n = document.getElementById('nome-cliente').value; 
    const diaReq = document.getElementById('dia-pedido').value;
    const horaReq = document.getElementById('horario-pedido').value;
    const obs = document.getElementById('obs-pedido').value; 
    
    if (!n) return alert("Por favor, informe seu nome."); 
    if (!diaReq || !horaReq) return alert("Por favor, informe a data e o horário para retirada.");
    
    const partesData = diaReq.split('-');
    const dataRetirada = `${partesData[2]}/${partesData[1]}/${partesData[0]}`;

    const dataAtual = new Date();
    const dataFormatada = dataAtual.toLocaleDateString('pt-BR');
    const horaFormatada = dataAtual.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

    let t = `*NOVO PEDIDO PARA RETIRADA | AMEI SALGADOS*\n`; 
    t += `📅 *Pedido feito em:* ${dataFormatada} às ${horaFormatada}\n`;
    t += `👤 *Cliente:* ${n}\n`;
    t += `⏰ *RETIRADA PARA:* ${dataRetirada} às ${horaReq}\n\n`;
    
    const grupos = {};
    carrinho.forEach(item => {
        const cat = item.categoria || 'OUTROS';
        if(!grupos[cat]) grupos[cat] = [];
        grupos[cat].push(item);
    });

    const ordem = ['CENTO MISTO', 'COMBO', 'PROMOÇÃO', 'SALGADO FRITO', 'SALGADO ASSADO', 'BEBIDAS', 'OUTROS'];
    const categoriasPresentes = Object.keys(grupos).sort((a, b) => {
        let indexA = ordem.findIndex(o => a.includes(o));
        let indexB = ordem.findIndex(o => b.includes(o));
        if (indexA === -1) indexA = 99;
        if (indexB === -1) indexB = 99;
        return indexA - indexB;
    });

    categoriasPresentes.forEach(categoria => {
        t += `*${categoria}*\n`;
        grupos[categoria].forEach(i => {
            t += `• ${i.quantidade}x ${i.nome}\n`;
            if (i.subItens && i.subItens.length > 0) {
                i.subItens.forEach(sub => {
                    t += `   ${sub}\n`;
                });
            }
        });
        t += `\n`;
    });
    
    if (obs.trim() !== '') {
        t += `*OBSERVAÇÕES:*\n${obs}\n\n`;
    }

    let totalPedido = carrinho.reduce((acc, i) => acc + (i.preco * i.quantidade), 0);
    t += `*TOTAL:* R$ ${totalPedido.toFixed(2).replace('.', ',')}\n\n`;

    t += `📍 *Retirada em:* Av. Seme Simão, 1319 - Granada`;
    
    window.open(`https://wa.me/${telefoneLanchonete}?text=${encodeURIComponent(t)}`, '_blank'); 
    
    mostrarSucesso();
}

window.addEventListener('DOMContentLoaded', carregarCardapio);


// ==========================================
// 🔒 TRAVA DE SEGURANÇA (ESPANTA-CURIOSOS)
// ==========================================
// Desativa o clique com o botão direito do rato
document.addEventListener('contextmenu', event => event.preventDefault());

// Desativa teclas de atalho para ferramentas de programador
document.onkeydown = function(e) {
    // Bloqueia F12
    if(e.key === 'F12' || e.keyCode === 123) {
        return false;
    }
    // Bloqueia Ctrl+Shift+I (Inspecionar)
    if(e.ctrlKey && e.shiftKey && (e.key === 'I' || e.key === 'i')) {
        return false;
    }
    // Bloqueia Ctrl+Shift+C (Inspecionar Elemento)
    if(e.ctrlKey && e.shiftKey && (e.key === 'C' || e.key === 'c')) {
        return false;
    }
    // Bloqueia Ctrl+Shift+J (Console)
    if(e.ctrlKey && e.shiftKey && (e.key === 'J' || e.key === 'j')) {
        return false;
    }
    // Bloqueia Ctrl+U (Ver código-fonte)
    if(e.ctrlKey && (e.key === 'U' || e.key === 'u')) {
        return false;
    }
};