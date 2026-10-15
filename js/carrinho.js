let carrinho = JSON.parse(localStorage.getItem('carrinho')) || [];
const lista = document.getElementById('lista-pedidos');
const totalElemento = document.getElementById('total-carrinho');
const foneWhatsapp = "5514998897292";
const precosBordas = {
    "Nenhuma": 0, "Cheddar": 8.00, "Catupiry": 8.00,
    "Calabresa com catupiry": 14.00, "4 Queijos": 14.00,
    "Chocolate": 12.00, "Doce de Leite": 12.00
};
const listaBebidas = ["Coca", "Suco", "Guaraná", "Fanta", "Sprite", "Água", "Cerveja"];
function verificarSeEhPizza(nome) {
    if (!nome) return false;
    return nome.toUpperCase().includes("COMBO") || !listaBebidas.some(b => nome.includes(b));
}
function calcularSubtotalItem(item) {
    if (!verificarSeEhPizza(item.nome)) return item.preco * item.quantidade;
    const isCombo = item.nome.toUpperCase().includes("COMBO");
    let valorBorda = 0;
    if (isCombo) {
        valorBorda = (precosBordas[item.borda1 || "Nenhuma"] || 0) + (precosBordas[item.borda2 || "Nenhuma"] || 0);
        return (item.preco + (valorBorda * 0.85)) * item.quantidade;
    } else {
        const borda = item.borda || "Nenhuma";
        if (borda.includes(' / ')) {
            const partes = borda.replace('Borda Meio a Meio (½ ', '').replace(')', '').split(' / ½ ');
            valorBorda = ((precosBordas[partes[0]] || 0) + (precosBordas[partes[1]] || 0)) / 2;
        } else {
            valorBorda = precosBordas[borda] || 0;
        }
        return (item.preco + valorBorda) * item.quantidade;
    }
}
function gerarHTMLBordas(item, index) {
    const isCombo = item.nome.toUpperCase().includes("COMBO");
    
    if (isCombo) {
        let html = `<div class="campo-borda-item" style="margin-top: 6px; display: flex; flex-direction: column; gap: 6px;">`;
        [1, 2].forEach(num => {
            const bordaAtual = num === 1 ? (item.borda1 || "Nenhuma") : (item.borda2 || "Nenhuma");
            html += `<div style="display: flex; align-items: center; gap: 5px; flex-wrap: wrap;">
                <label style="font-size: 0.72rem; color: #888; font-weight: 500; min-width: 85px;">Borda Pizza ${num}:</label>
                <select onchange="alterarBordaCombo(${index}, ${num}, this.value)" style="padding: 1px 4px; border-radius: 4px; border: 1px solid #444; font-size: 0.72rem; background: #222; color: #fff; max-width: 170px; height: 24px; cursor: pointer;">`;
            for (const nb in precosBordas) {
                const sel = bordaAtual === nb ? 'selected' : '';
                const precoAd = precosBordas[nb] > 0 ? ` (+ R$ ${precosBordas[nb].toFixed(2).replace('.', ',')})` : '';
                html += `<option value="${nb}" ${sel}>${nb}${precoAd}</option>`;
            }
            html += `</select></div>`;
        });
        return html + `</div>`;
    } else {
        const borda = item.borda || "Nenhuma";
        if (borda.includes(' / ')) {
            const partes = borda.replace('Borda Meio a Meio (½ ', '').replace(')', '').split(' / ½ ');
            let html = `<div class="campo-borda-item" style="margin-top: 6px; display: flex; flex-wrap: wrap; align-items: center; gap: 4px;">
                <span style="font-size: 0.7rem; color: var(--primary-color, #dfa629); font-weight: bold; width: 100%;">Borda Dividida:</span>
                <select onchange="alterarBordaMeioAMeio(${index}, this.value, '${partes[1]}')" style="padding: 1px 4px; border-radius: 4px; border: 1px solid #444; font-size: 0.72rem; background: #222; color: #fff; max-width: 120px; height: 22px; cursor: pointer;">`;
            for (const nb in precosBordas) html += `<option value="${nb}" ${partes[0] === nb ? 'selected' : ''}>½ ${nb}</option>`;
            html += `</select><span style="font-size: 0.75rem; color: #666;">/</span>
                <select onchange="alterarBordaMeioAMeio(${index}, '${partes[0]}', this.value)" style="padding: 1px 4px; border-radius: 4px; border: 1px solid #444; font-size: 0.72rem; background: #222; color: #fff; max-width: 120px; height: 22px; cursor: pointer;">`;
            for (const nb in precosBordas) html += `<option value="${nb}" ${partes[1] === nb ? 'selected' : ''}>½ ${nb}</option>`;
            return html + `</select><button onclick="converterParaBordaInteira(${index})" style="background: none; border: none; color: #ff4a4a; font-size: 0.65rem; cursor: pointer; padding: 0 2px; text-decoration: underline;">Borda Inteira</button></div>`;
        } else {
            let html = `<div class="campo-borda-item" style="margin-top: 4px; display: flex; align-items: center; gap: 5px; flex-wrap: wrap;">
                <label style="font-size: 0.75rem; color: #888; font-weight: 500;">Borda:</label>
                <select onchange="alterarBorda(${index}, this.value)" style="padding: 1px 4px; border-radius: 4px; border: 1px solid #444; font-size: 0.75rem; background: #222; color: #fff; max-width: 160px; height: 22px; cursor: pointer;">`;
            for (const nb in precosBordas) {
                const precoAd = precosBordas[nb] > 0 ? ` (+ R$ ${precosBordas[nb].toFixed(2).replace('.', ',')})` : '';
                html += `<option value="${nb}" ${borda === nb ? 'selected' : ''} style="background: #222; color: #fff;">${nb}${precoAd}</option>`;
            }
            return html + `</select><button onclick="transformarEmBordaMeioAMeio(${index})" style="background: none; border: none; color: var(--primary-color, #dfa629); font-size: 0.65rem; cursor: pointer; padding: 0 2px; text-decoration: underline;">Dividir Borda</button></div>`;
        }
    }
}
function exibirCarrinho() {
    if (!lista) return;
    lista.innerHTML = '';
    let totalGeral = 0;
    if (carrinho.length === 0) {
        lista.innerHTML = '<p style="text-align: center; padding: 40px; color: #999;">Carrinho vazio.</p>';
        if (totalElemento) totalElemento.innerText = "R$ 0,00";
        return gerenciarPagamento();
    }
    carrinho.forEach((item, index) => {
        const subtotal = calcularSubtotalItem(item);
        totalGeral += subtotal;
        const selectBordaHTML = verificarSeEhPizza(item.nome) ? gerarHTMLBordas(item, index) : '';
        lista.innerHTML += `
            <div class="item-pedido">
                <div class="info-item">
                    <strong>${item.quantidade}x ${item.nome}</strong>
                    ${selectBordaHTML}
                </div>
                <div class="controles-item" style="text-align: right;">
                    <div class="preco-subtotal">R$ ${subtotal.toFixed(2).replace('.', ',')}</div>
                    <div class="btn-group">
                        <button onclick="alterarQuantidade(${index}, -1)">-</button>
                        <span>${item.quantidade}</span>
                        <button onclick="alterarQuantidade(${index}, 1)">+</button>
                    </div>
                    <button class="btn-remover" onclick="removerItem(${index})">remover</button>
                </div>
            </div>`;
    });
    if (totalElemento) totalElemento.innerText = `R$ ${totalGeral.toFixed(2).replace('.', ',')}`;
    gerenciarPagamento();
}
function alterarBorda(index, v) {
    carrinho[index].borda = v;
    salvar();
}
function alterarBordaCombo(index, num, v) {
    carrinho[index][num === 1 ? 'borda1' : 'borda2'] = v;
    salvar();
}
function transformarEmBordaMeioAMeio(index) {
    carrinho[index].borda = `Borda Meio a Meio (½ ${carrinho[index].borda !== "Nenhuma" ? carrinho[index].borda : "Cheddar"} / ½ Catupiry)`;
    salvar();
}
function alterarBordaMeioAMeio(index, m1, m2) {
    carrinho[index].borda = m1 === m2 ? m1 : `Borda Meio a Meio (½ ${m1} / ½ ${m2})`;
    salvar();
}
function converterParaBordaInteira(index) {
    carrinho[index].borda = "Nenhuma";
    salvar();
}
function adicionarAoCarrinho(botao) {
    const item = botao.closest('.item');
    const categoria = item.getAttribute('data-categoria') || 'pizza';
    const nomeBase = (item.querySelector('strong') || item.querySelector('h4')).innerText;
    const select = item.querySelector('.select-preco');
    if (!select || isNaN(parseFloat(select.value))) return alert("Selecione um tamanho/preço válido.");
    
    const textoOpcao = select.options[select.selectedIndex].text;
    const parteLimpa = textoOpcao.replace(/\s*-\s*(R\$\s*\d+,\d+)/i, ' $1').trim();
    const nomeFinal = `${nomeBase} (${parteLimpa})`;
    
    const existente = carrinho.find(p => p.nome === nomeFinal);
    
    if (existente) {
        existente.quantidade++;
    } else {
        carrinho.push({ 
            nome: nomeFinal, 
            preco: parseFloat(select.value), 
            quantidade: 1, 
            categoria, 
            borda: "Nenhuma" 
        });
    }
    
    salvar();
    alert(`${nomeFinal} adicionado ao carrinho!`);
}
function adicionarPizzaMeioAMeio() {
    const tamanho = document.getElementById('pizza-tamanho').value;
    const s1 = document.getElementById('pizza-sabor1').value;
    const s2 = document.getElementById('pizza-sabor2').value;
    if (s1 === s2) return alert("Selecione dois sabores diferentes!");
    if (!s1 || !s2) return alert("Selecione ambos os sabores!");
    const precoFinal = ((cardapioPizzas[s1]?.[tamanho] || 0) + (cardapioPizzas[s2]?.[tamanho] || 0)) / 2;
    const nomeFinal = `Pizza ${tamanho} (½ ${s1} / ½ ${s2})`;
    const existente = carrinho.find(p => p.nome === nomeFinal);
    if (existente) {
        existente.quantidade++;
    } else {
        carrinho.push({ 
            nome: nomeFinal, 
            preco: precoFinal, 
            quantidade: 1, 
            categoria: 'pizza', 
            borda: "Nenhuma" 
        });
    }
    salvar();
    alert(`${nomeFinal} adicionada ao carrinho!`);
}
// ===== VALIDAÇÃO E MÁSCARA DE TELEFONE =====
function aplicarMascaraTelefone(input) {
    let valor = input.value.replace(/\D/g, '');
    if (valor.length > 11) {
        valor = valor.substring(0, 11);
    }
    if (valor.length <= 2) {
        input.value = valor.length ? `(${valor}` : '';
    } else if (valor.length <= 6) {
        input.value = `(${valor.substring(0, 2)}) ${valor.substring(2)}`;
    } else if (valor.length <= 10) {
        input.value = `(${valor.substring(0, 2)}) ${valor.substring(2, 6)}-${valor.substring(6)}`;
    } else {
        input.value = `(${valor.substring(0, 2)}) ${valor.substring(2, 7)}-${valor.substring(7)}`;
    }
}
function validarTelefone(telefone) {
    const numeros = telefone.replace(/\D/g, '');
    if (!/^\d+$/.test(numeros)) {
        return { valido: false, mensagem: "Digite apenas números no telefone." };
    }
    if (numeros.length === 10 || numeros.length === 11) {
        return { valido: true };
    }
    if (numeros.length < 10) {
        return { valido: false, mensagem: "Telefone incompleto. Digite com DDD (10 ou 11 dígitos)." };
    }
    return { valido: false, mensagem: "Telefone inválido." };
}
// ==========================================
function obterInputValorPorMetodo(val) {
    const limpo = val.trim();
    if (limpo === "Cartão de Crédito") return document.getElementById("valor-cartao-de-credito");
    if (limpo === "Cartão de Débito") return document.getElementById("valor-cartao-de-debito");
    if (limpo === "Dinheiro") return document.getElementById("valor-dinheiro") || document.getElementById("valor-Dinheiro");
    if (limpo.toUpperCase() === "PIX") return document.getElementById("valor-pix") || document.getElementById("valor-PIX") || document.getElementById("valor-Pix");
    
    const norm = limpo.toLowerCase().replace(/[áéíóúâêîôûàèìòùãõç]/gi, '');
    return document.getElementById('valor-' + norm.replace(/\s+/g, '-')) || document.querySelector(`input[id*="${norm.split(' ')[0]}"]`);
}
function gerenciarPagamento() {
    const checkboxes = document.querySelectorAll('input[name="metodo"]');
    const selecionados = Array.from(checkboxes).filter(c => c.checked);
    const totalGeral = converterStringParaFloat(totalElemento ? totalElemento.innerText : "R$ 0,00");
    if (selecionados.length > 2) {
        alert("Máximo de 2 formas de pagamento!");
        if (event?.target) event.target.checked = false;
        return;
    }
    checkboxes.forEach(cb => {
        const input = obterInputValorPorMetodo(cb.value);
        if (!input) return;
        if (cb.checked) {
            input.style.display = 'block';
            if (selecionados.length === 1) input.value = 'R$ ' + totalGeral.toFixed(2).replace('.', ',');
            else if (input.value === 'R$ ' + totalGeral.toFixed(2).replace('.', ',')) input.value = '';
        } else {
            input.style.display = 'none';
            input.value = '';
        }
    });
    const boxTroco = document.getElementById('box-troco');
    const inputDinheiro = obterInputValorPorMetodo("Dinheiro");
    if (boxTroco && inputDinheiro) {
        const comDinheiro = selecionados.some(c => c.value === 'Dinheiro');
        if (comDinheiro && converterStringParaFloat(inputDinheiro.value) > totalGeral) {
            boxTroco.style.display = 'block';
        } else {
            boxTroco.style.display = 'none';
            const troco = document.getElementById('troco');
            if (troco) troco.value = '';
        }
    }
}
function converterStringParaFloat(texto) {
    if (!texto) return 0;
    return parseFloat(texto.replace('R$', '').replace(/\s/g, '').replace(/\./g, '').replace(',', '.')) || 0;
}
function mascaraValor(input) {
    let v = input.value.replace(/\D/g, '');
    v = (v / 100).toFixed(2).replace(".", ",");
    v = v.replace(/(\d)(\d{3})(\d{3}),/g, "$1.$2.$3,").replace(/(\d)(\d{3}),/g, "$1.$2,");
    input.value = v ? 'R$ ' + v : '';
}
function finalizarPedido() {
    const endereco = document.getElementById('endereco').value;
    const telefone = document.getElementById('telefone').value;
    const nome = document.getElementById('nome').value;
    const selecionados = document.querySelectorAll('input[name="metodo"]:checked');
    const troco = document.getElementById('troco')?.value || '';
    const obs = document.getElementById('obs')?.value || "";
    
    if (carrinho.length === 0) return alert("Carrinho vazio!");
    if (!nome) return alert("Preencha o nome.");
    if (!endereco) return alert("Preencha o endereço.");
    
    const validacaoTel = validarTelefone(telefone);
    if (!validacaoTel.valido) {
        alert(validacaoTel.mensagem);
        return;
    }
    
    if (selecionados.length === 0) return alert("Escolha uma forma de pagamento.");
    
    let totalGeral = 0;
    let somaPagamento = 0;
    let descPagamento = [];
    let temDinheiro = false;
    carrinho.forEach(item => totalGeral += calcularSubtotalItem(item));
    
    for (let cb of selecionados) {
        if (cb.value === "Dinheiro") temDinheiro = true;
        const val = converterStringParaFloat(obterInputValorPorMetodo(cb.value)?.value);
        if (val <= 0) return alert(`Insira um valor válido para: ${cb.value}`);
        somaPagamento += val;
        descPagamento.push(`${cb.value} (R$ ${val.toFixed(2).replace('.', ',')})`);
    }
    
    if ((somaPagamento - totalGeral) < -0.01) {
        return alert(`Valor insuficiente! Faltam R$ ${(totalGeral - somaPagamento).toFixed(2).replace('.', ',')}`);
    }
    if (!temDinheiro && (somaPagamento - totalGeral) > 0.01) {
        return alert("O valor informado está acima do total do pedido sem envolver dinheiro!");
    }
    let message = "NOVO PEDIDO - PIZZAS PALACE%0A";
    message += "================================%0A%0A";
    
    carrinho.forEach(item => {
        const sub = calcularSubtotalItem(item);
        const isCombo = item.nome.toUpperCase().includes("COMBO");
        let bordaTexto = '';
        if (isCombo) {
            let bordasCombo = [];
            if (item.borda1 && item.borda1 !== 'Nenhuma') {
                bordasCombo.push(`Borda da Pizza 1: ${item.borda1}`);
            }
            if (item.borda2 && item.borda2 !== 'Nenhuma') {
                bordasCombo.push(`Borda da Pizza 2: ${item.borda2}`);
            }
            if (bordasCombo.length > 0) {
                bordaTexto = `%0A${bordasCombo.join('%0A')}`;
            }
        } else if (item.borda && item.borda !== 'Nenhuma') {
            bordaTexto = `%0ABorda: ${item.borda} - Aplicada para ${item.quantidade} unidade(s)`;
        }
        message += `${item.quantidade}x ${item.nome}${bordaTexto}%0A`;
        message += `Subtotal: R$ ${sub.toFixed(2).replace('.', ',')}%0A%0A`;
    });
    message += "================================%0A";
    message += `TOTAL DO PEDIDO: R$ ${totalGeral.toFixed(2).replace('.', ',')}%0A%0A`;
    message += "DADOS DO CLIENTE%0A";
    message += `Nome: ${nome}%0A`;
    message += `Endereço: ${endereco}%0A`;
    message += `Telefone: ${telefone}%0A%0A`;
    message += "FORMA DE PAGAMENTO%0A";
    message += `${descPagamento.join("%0A")}%0A`;
    if (temDinheiro && troco) {
        message += `Troco para: R$ ${troco}%0A`;
    }
    message += "%0A";
    if (obs) {
        message += "OBSERVAÇÕES%0A";
        message += `${obs}%0A%0A`;
    }
    localStorage.removeItem('carrinho');
    window.open(`https://wa.me/${foneWhatsapp}?text=${encodeURIComponent(message.replace(/%0A/g, '\n'))}`, '_blank');
    location.reload();
}
function alterarQuantidade(i, m) {
    carrinho[i].quantidade += m;
    if (carrinho[i].quantidade <= 0) carrinho.splice(i, 1);
    salvar();
}
function removerItem(i) { carrinho.splice(i, 1); salvar(); }
function removerTodos() { if (confirm("Esvaziar carrinho?")) { carrinho = []; salvar(); } }
function salvar() { localStorage.setItem('carrinho', JSON.stringify(carrinho)); exibirCarrinho(); }
document.addEventListener('DOMContentLoaded', () => {
    exibirCarrinho();
    
    const campoTelefone = document.getElementById('telefone');
    if (campoTelefone) {
        campoTelefone.addEventListener('input', function() {
            aplicarMascaraTelefone(this);
        });
        campoTelefone.addEventListener('keydown', function(e) {
            const teclasPermitidas = ['Backspace', 'Tab', 'ArrowLeft', 'ArrowRight', 'Delete', 'Home', 'End'];
            if (teclasPermitidas.includes(e.key)) return;
            if ((e.key >= '0' && e.key <= '9')) return;
            if (e.ctrlKey || e.metaKey || e.altKey) return;
            e.preventDefault();
        });
    }
    
    Object.assign(window, {
        gerenciarPagamento, mascaraValor, aplicarMascaraTelefone, validarTelefone,
        alterarBordaCombo, alterarBordaMeioAMeio,
        transformarEmBordaMeioAMeio, converterParaBordaInteira,
        adicionarAoCarrinho, adicionarPizzaMeioAMeio
    });
});