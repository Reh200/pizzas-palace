let carrinho = JSON.parse(localStorage.getItem('carrinho')) || [];

// ==========================================
// CONFIGURAÇÃO DINÂMICA VIA HTML (APENAS PIZZAS)
// ==========================================
let cardapioPizzas = {};

// Função que lê o HTML para descobrir os sabores e preços reais do cardápio
function mapearCardapioDoHTML() {
    cardapioPizzas = {}; // Reseta o objeto
    
    // Seleciona apenas os articles que NÃO estão dentro da seção de bebidas
    const itens = document.querySelectorAll('section:not(#bebidas) article.item');
    
    itens.forEach(item => {
        // Validação extra por atributo de categoria
        const categoria = item.getAttribute('data-categoria') || 'pizza';
        if (categoria.toLowerCase() === 'bebida' || categoria.toLowerCase() === 'bebidas') {
            return; // Pula o item se ele for categorizado como bebida
        }

        const nomeElement = item.querySelector('strong') || item.querySelector('h4');
        const selectPreco = item.querySelector('.select-preco');
        
        // Verifica se o item possui nome e opções de preço
        if (nomeElement && selectPreco) {
            const nomeSabor = nomeElement.innerText.trim();
            cardapioPizzas[nomeSabor] = {};
            
            // Varre as opções do select (Média, Grande, etc) para capturar os preços
            Array.from(selectPreco.options).forEach(opcao => {
                const valorPreco = parseFloat(opcao.value);
                const textoOpcao = opcao.text.toLowerCase();
                
                if (textoOpcao.includes('grand')) {
                    cardapioPizzas[nomeSabor]['Grande'] = valorPreco;
                } else if (textoOpcao.includes('méd') || textoOpcao.includes('med')) {
                    cardapioPizzas[nomeSabor]['Média'] = valorPreco;
                }
            });
        }
    });
}

// Função para preencher os selects da pizza meio a meio E do combo
function atualizarSaboresDisponiveis() {
    // Primeiro, mapeia o cardápio atualizado do HTML
    mapearCardapioDoHTML();

    // Selects da Meio a Meio
    const sabor1Select = document.getElementById('pizza-sabor1');
    const sabor2Select = document.getElementById('pizza-sabor2');
    
    // Selects do Combo
    const combo1Select = document.getElementById('pizza-combo1');
    const combo2Select = document.getElementById('pizza-combo2');

    const htmlOptions = [];
    htmlOptions.push('<option value="" disabled selected>Selecione um sabor...</option>');
    for (const sabor in cardapioPizzas) {
        htmlOptions.push(`<option value="${sabor}">${sabor}</option>`);
    }
    const optionsString = htmlOptions.join('');

    // Popula Meio a Meio (se existirem na página)
    if (sabor1Select && sabor2Select) {
        sabor1Select.innerHTML = optionsString;
        sabor2Select.innerHTML = optionsString;
    }

    // Popula Combo (se existirem na página)
    if (combo1Select && combo2Select) {
        combo1Select.innerHTML = optionsString;
        combo2Select.innerHTML = optionsString;
    }
}

// Vincula o evento para rodar a leitura assim que a página abrir
document.addEventListener('DOMContentLoaded', atualizarSaboresDisponiveis);


// ==========================================
// 1. Adicionar Item Tradicional (Inteiras / Bebidas)
// ==========================================
function adicionarAoCarrinho(botao) {
    const itemElement = botao.closest('.item');
    const categoria = itemElement.getAttribute('data-categoria') || 'pizza';
    const nomeBase = (itemElement.querySelector('strong') || itemElement.querySelector('h4')).innerText;
    const select = itemElement.querySelector('.select-preco');
    
    if (!select || isNaN(parseFloat(select.value))) {
        return alert("❌ Por favor, selecione um tamanho/preço válido.");
    }

    const preco = parseFloat(select.value);
    const opcaoTexto = select.options[select.selectedIndex].text;

    const detalheOpcao = opcaoTexto.split(/R\$/i)[0].replace(/-$/, '').trim();
    const nomeFinal = `${nomeBase} (${detalheOpcao})`;

    const existente = carrinho.find(p => p.nome === nomeFinal);

    if (existente) {
        existente.quantidade += 1;
    } else {
        carrinho.push({
            nome: nomeFinal,
            preco: preco,
            quantidade: 1,
            categoria: categoria,
            borda: "Nenhuma"
        });
    }

    gravarCarrinho();
}

// ==========================================
// 2. Adicionar Pizza Meio a Meio
// ==========================================
function adicionarPizzaMeioAMeio() {
    const tamanho = document.getElementById('pizza-tamanho').value;
    const sabor1 = document.getElementById('pizza-sabor1').value;
    const sabor2 = document.getElementById('pizza-sabor2').value;

    if (sabor1 === sabor2) {
        return alert("❌ Para pizzas Meio a Meio, selecione dois sabores diferentes!");
    }

    if (!sabor1 || !sabor2) {
        return alert("❌ Por favor, selecione ambos os sabores!");
    }

    const precoSabor1 = cardapioPizzas[sabor1]?.[tamanho] || 0;
    const precoSabor2 = cardapioPizzas[sabor2]?.[tamanho] || 0;
    
    const precoFinal = (precoSabor1 + precoSabor2) / 2;
    const nomeFinal = `Pizza ${tamanho} (½ ${sabor1} / ½ ${sabor2})`;

    const existente = carrinho.find(p => p.nome === nomeFinal);

    if (existente) {
        existente.quantidade += 1;
    } else {
        carrinho.push({
            nome: nomeFinal,
            preco: precoFinal,
            quantidade: 1,
            categoria: 'pizza',
            borda: "Nenhuma"
        });
    }

    gravarCarrinho();
}

// ==========================================
// 3. Adicionar Combo com 15% OFF (Pizzas + Refrigerante)
// ==========================================
function adicionarComboAoCarrinho() {
    const sabor1 = document.getElementById('pizza-combo1').value;
    const sabor2 = document.getElementById('pizza-combo2').value;
    const refriSelecionado = document.getElementById('refri-combo').value;

    if (!sabor1 || !sabor2 || !refriSelecionado) {
        return alert("❌ Por favor, selecione as duas pizzas e o refrigerante para montar o combo!");
    }

    const precoPizza1 = cardapioPizzas[sabor1]?.['Grande'] || 0;
    const precoPizza2 = cardapioPizzas[sabor2]?.['Grande'] || 0;

    if (precoPizza1 === 0 || precoPizza2 === 0) {
        return alert("❌ Não foi possível identificar o preço das pizzas selecionadas.");
    }

    let precoRefri = 0;
    const refriLower = refriSelecionado.toLowerCase();

    if (refriLower.includes('conquista')) {
        precoRefri = 8.00;
    } else if (refriLower.includes('coca')) {
        precoRefri = 14.00;
    } else {
        precoRefri = 10.00; 
    }

    // Subtotal geral (Pizzas + Refri) antes do desconto
    const subtotalGeral = Number((precoPizza1 + precoPizza2 + precoRefri).toFixed(2));
    
    // Aplica os 15% de desconto sobre o total geral
    const valorDesconto = Number((subtotalGeral * 0.15).toFixed(2));
    
    // Preço final do combo com arredondamento preciso
    const precoFinalCombo = Number((subtotalGeral - valorDesconto).toFixed(2));

    const nomeFinal = `Combo Desconto Realeza (15% OFF): G (${sabor1}) + G (${sabor2}) + ${refriSelecionado}`;

    carrinho.push({
        nome: nomeFinal,
        preco: precoFinalCombo,
        quantidade: 1,
        categoria: 'combo',
        detalhes: {
            pizza1: sabor1,
            pizza2: sabor2,
            bebida: refriSelecionado,
            precoRefri: precoRefri,
            descontoAplicado: valorDesconto
        }
    });

    gravarCarrinho();
}

// Função auxiliar para gravar e atualizar visualmente
function gravarCarrinho() {
    localStorage.setItem('carrinho', JSON.stringify(carrinho));
    if (typeof exibirCarrinho === 'function') exibirCarrinho();
    alert(`✅ Item adicionado ao carrinho!`);
}

// ==========================================
// Script do botão "Voltar ao Topo"
// ==========================================
document.addEventListener("DOMContentLoaded", function() {
    const backToTopBtn = document.getElementById("back-to-top-btn");

    window.onscroll = function() {
        if (backToTopBtn) {
            scrollFunction();
        }
    };

    function scrollFunction() {
        if (document.body.scrollTop > 300 || document.documentElement.scrollTop > 300) {
            backToTopBtn.style.display = "block";
        } else {
            backToTopBtn.style.display = "none";
        }
    }
});

function voltarAoTopo() {
    window.scrollTo({
        top: 0,
        behavior: 'smooth'
    });
}