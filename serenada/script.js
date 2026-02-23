const SENHA_SISTEMA = "1234"; 

// Carregamento inicial de dados
let estoque = JSON.parse(localStorage.getItem("estoque")) || [];
let comandas = JSON.parse(localStorage.getItem("comandas")) || {};
let totalDia = JSON.parse(localStorage.getItem("totalDia")) || 0;
let historico = JSON.parse(localStorage.getItem("historico")) || [];

// --- FUNÇÃO DE PERSISTÊNCIA ---
function salvarDados(){
    localStorage.setItem("estoque", JSON.stringify(estoque));
    localStorage.setItem("comandas", JSON.stringify(comandas));
    localStorage.setItem("totalDia", JSON.stringify(totalDia));
    localStorage.setItem("historico", JSON.stringify(historico));
}

// --- GESTÃO DE ESTOQUE ---
function cadastrarProduto(){
    const inputNome = document.getElementById("nomeProduto");
    const inputPreco = document.getElementById("precoProduto");
    const inputQtd = document.getElementById("estoqueProduto");

    if(!inputNome || !inputPreco || !inputQtd) return;

    let nome = inputNome.value.trim();
    let preco = parseFloat(inputPreco.value);
    let qtd = parseInt(inputQtd.value);

    if(!nome || isNaN(preco) || preco <= 0 || isNaN(qtd) || qtd < 0) return alert("Valores inválidos!");
    if(estoque.find(p => p.nome.toLowerCase() === nome.toLowerCase())) return alert("Produto já cadastrado!");

    estoque.push({nome, preco, qtd});
    salvarDados();
    renderizarTudo();

    inputNome.value = ""; inputPreco.value = ""; inputQtd.value = "";
}

function alterarEstoque(i, n){
    if(estoque[i].qtd + n < 0) return alert("Estoque insuficiente!");
    estoque[i].qtd += n;
    salvarDados();
    renderizarTudo();
}

function excluirProduto(i) {
    if(confirm(`Excluir ${estoque[i].nome}?`)) {
        estoque.splice(i, 1);
        salvarDados();
        renderizarTudo();
    }
}

// --- GESTÃO DE PEDIDOS (PDV) ---
function adicionarItem(){
    const mesaSelect = document.getElementById("mesaSelect");
    const produtoSelect = document.getElementById("produtoSelect");
    const qtdItem = document.getElementById("qtdItem");
    const obsItem = document.getElementById("obsItem");

    if(!mesaSelect || !produtoSelect) return;

    let mesaSel = mesaSelect.value;
    if(mesaSel === "todas") return alert("Selecione o destino");
    
    let pIdx = produtoSelect.value;
    let qtd = parseInt(qtdItem.value);
    let produto = estoque[pIdx];

    if(!produto || qtd <= 0) return alert("Verifique produto/quantidade!");
    if(produto.qtd < qtd) return alert("Sem estoque!");

    let idComanda = (mesaSel === "Delivery") ? `DELIVERY: ${document.getElementById("nomeCliente").value.trim()}` : (mesaSel === "Balcão" ? "BALCÃO" : `MESA ${mesaSel}`);
    
    if(!comandas[idComanda]) {
        comandas[idComanda] = { itens: [], taxa: 0, endereco: "" };
        if(mesaSel === "Delivery") { 
            comandas[idComanda].taxa = parseFloat(document.getElementById("taxaEntrega").value) || 0; 
            comandas[idComanda].endereco = document.getElementById("endCliente").value.trim(); 
        }
    }

    comandas[idComanda].itens.push({ nome: produto.nome, qtd, preco: produto.preco, total: produto.preco * qtd, obs: obsItem.value.trim() });
    produto.qtd -= qtd;
    obsItem.value = "";
    
    salvarDados(); 
    renderizarTudo();
}

function fecharMesa(){
    const mesaSelect = document.getElementById("mesaSelect");
    if(!mesaSelect) return;

    let mesaSel = mesaSelect.value;
    let nomeCli = document.getElementById("nomeCliente")?.value.trim() || "";
    let idBusca = (mesaSel === "Delivery") ? `DELIVERY: ${nomeCli}` : (mesaSel === "Balcão" ? "BALCÃO" : `MESA ${mesaSel}`);
    
    if(!comandas[idBusca]) return alert("Selecione uma conta aberta.");
    
    let pag = prompt("Pagamento:\n1-Dinheiro | 2-Pix | 3-Cartão");
    let formas = {"1":"Dinheiro", "2":"Pix", "3":"Cartão"};
    if(!formas[pag]) return alert("Cancelado.");
    
    let totalFinal = comandas[idBusca].itens.reduce((s,i)=>s+i.total,0) + (comandas[idBusca].taxa || 0);
    let pedidoID = "#" + Date.now().toString().slice(-6);
    let resumoItens = comandas[idBusca].itens.map(i => `${i.qtd}x ${i.nome}`).join(", ");
    
    historico.push({ 
        id: pedidoID, 
        data: new Date().toLocaleString(), 
        local: idBusca, 
        pagamento: formas[pag], 
        itensVendidos: resumoItens, 
        total: totalFinal,
        dadosCompletos: JSON.parse(JSON.stringify(comandas[idBusca])) 
    });

    imprimirCupom(pedidoID, idBusca, comandas[idBusca], totalFinal, formas[pag]);
    
    totalDia += totalFinal;
    delete comandas[idBusca];
    
    salvarDados(); 
    renderizarTudo();
}

// --- IMPORTAR CSV (CORRIGIDO) ---
function importarCSV(event) {
    const arquivo = event.target.result || event.target.files[0];
    if (!arquivo) return;

    const leitor = new FileReader();
    leitor.onload = function(e) {
        const conteudo = e.target.result;
        // Divide por linhas e remove o BOM e espaços extras
        const linhas = conteudo.replace(/\ufeff/g, "").split("\n");
        let novosItens = [];

        linhas.forEach((linha, index) => {
            // Pula o cabeçalho, linhas vazias ou a linha de TOTAL
            if (index === 0 || linha.trim() === "" || linha.includes("TOTAL DO DIA")) return;

            // Regex para separar por ponto-e-vírgula, respeitando o que está entre aspas (os itens)
            const colunas = linha.match(/(".*?"|[^;]+)/g);

            if (colunas && colunas.length >= 6) {
                novosItens.push({
                    id: colunas[0].trim(),
                    data: colunas[1].trim(),
                    local: colunas[2].trim(),
                    pagamento: colunas[3].trim(),
                    itensVendidos: colunas[4].replace(/"/g, "").trim(),
                    total: parseFloat(colunas[5].replace(",", "."))
                });
            }
        });

        if (novosItens.length > 0) {
            if(confirm(`Deseja importar ${novosItens.length} registros para o histórico?`)) {
                historico = [...historico, ...novosItens];
                salvarDados();
                renderizarTudo();
                alert("Importação concluída!");
            }
        } else {
            alert("Nenhum dado válido encontrado no arquivo!");
        }
    };
    leitor.readAsText(arquivo, "UTF-8");
    // Reseta o input para permitir importar o mesmo arquivo novamente se necessário
    event.target.value = "";
}

// --- FECHAR CAIXA E EXPORTAR CSV ---
function fecharCaixa(){
    if(historico.length === 0) return alert("Não há vendas para fechar o caixa.");

    if(confirm(`Encerrar caixa e gerar relatório?\nTotal: R$ ${totalDia.toFixed(2)}`)) {
        let csvContent = "Pedido ID;Data;Local;Pagamento;Itens;Total (R$)\n";
        
        historico.forEach(h => {
            let totalFormatado = h.total.toFixed(2).replace('.', ',');
            csvContent += `${h.id};${h.data};${h.local};${h.pagamento};"${h.itensVendidos}";${totalFormatado}\n`;
        });
        
        csvContent += `\n; ; ; ;TOTAL DO DIA;${totalDia.toFixed(2).replace('.', ',')}`;

        const blob = new Blob(["\ufeff" + csvContent], { type: "text/csv;charset=utf-8;" });
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = `caixa_${new Date().toLocaleDateString().replace(/\//g, '-')}.csv`;
        link.click();

        totalDia = 0;
        historico = [];
        salvarDados();
        renderizarTudo();
    }
}

// --- RENDERIZAÇÃO ---
function renderizarTudo() {
    atualizarEstoqueUI();
    atualizarPedidoUI();
    atualizarHistoricoUI();
    atualizarTotalDiaUI();
}

function atualizarEstoqueUI(){
    const tab = document.getElementById("tabelaEstoque");
    const sel = document.getElementById("produtoSelect");
    if(tab) {
        tab.innerHTML = "";
        estoque.forEach((p,i) => {
            tab.innerHTML += `<tr><td>${p.nome}</td><td>R$ ${p.preco.toFixed(2)}</td>
                <td><button class="btn-qty" onclick="alterarEstoque(${i}, -1)">-</button> <strong>${p.qtd}</strong> <button class="btn-qty" onclick="alterarEstoque(${i}, 1)">+</button></td>
                <td><button class="btn-danger" onclick="excluirProduto(${i})">🗑️</button></td></tr>`;
        });
    }
    if(sel) {
        sel.innerHTML = "";
        estoque.forEach((p,i) => { sel.innerHTML += `<option value="${i}">${p.nome}</option>`; });
    }
}

function atualizarPedidoUI(){
    const mesaSelect = document.getElementById("mesaSelect");
    const itensMesa = document.getElementById("itensMesa");
    if(!mesaSelect || !itensMesa) return;

    let mesaSel = mesaSelect.value;
    let nomeCli = document.getElementById("nomeCliente")?.value.trim() || "";
    let idBusca = (mesaSel === "Delivery") ? `DELIVERY: ${nomeCli}` : (mesaSel === "Balcão" ? "BALCÃO" : `MESA ${mesaSel}`);
    
    itensMesa.innerHTML = "";
    let totalGeral = 0;

    const renderLinhas = (id) => {
        let subtotal = 0;
        if(!comandas[id]) return 0;
        comandas[id].itens.forEach((item, index) => {
            subtotal += item.total;
            itensMesa.innerHTML += `<tr><td>${id}</td><td>${item.nome}</td><td>${item.obs || "-"}</td><td>${item.qtd}</td><td>R$ ${item.total.toFixed(2)}</td>
            <td><button class="btn-danger" onclick="removerItem('${id}',${index})">❌</button></td></tr>`;
        });
        if(comandas[id].taxa > 0) {
            itensMesa.innerHTML += `<tr style="color:#03dac6"><td>-</td><td>TAXA</td><td colspan="2">${comandas[id].endereco}</td><td>R$ ${comandas[id].taxa.toFixed(2)}</td><td></td></tr>`;
            subtotal += comandas[id].taxa;
        }
        return subtotal;
    };

    if(mesaSel === "todas"){
        for(let id in comandas) totalGeral += renderLinhas(id);
    } else {
        totalGeral = renderLinhas(idBusca);
    }
    document.getElementById("totalMesa").innerHTML = "Total: R$ " + totalGeral.toFixed(2);
}

function atualizarHistoricoUI(){
    const tab = document.getElementById("tabelaHistorico");
    if(!tab) return;
    tab.innerHTML = "";
    [...historico].reverse().forEach((p, index) => {
        const realIdx = historico.length - 1 - index; 
        tab.innerHTML += `<tr><td>${p.id}</td><td>${p.data}</td><td>${p.local}</td><td>${p.pagamento}</td>
            <td style="color:#03dac6">R$ ${p.total.toFixed(2)}</td>
            <td><button class="btn-primary" onclick="reimprimirHistorico(${realIdx})">🖨️</button></td></tr>`;
    });
}

function atualizarTotalDiaUI(){
    const display = document.getElementById("totalDia");
    if(display) display.innerHTML = "Total: R$ " + totalDia.toFixed(2);
}

function exportarEstoque(){
    if(estoque.length === 0) return alert("Não há produtos no estoque.");

    let csv = "Produto;Preco;Quantidade\n";

    estoque.forEach(p => {
        csv += `${p.nome};${p.preco.toFixed(2).replace(".", ",")};${p.qtd}\n`;
    });

    const blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);

    link.setAttribute("href", url);
    link.setAttribute("download", "estoque_serenada.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// --- UTILITÁRIOS ---
function gerarRelatorioExcel(){
    if(historico.length === 0) return alert("Não há vendas registradas.");

    let csv = "RELATÓRIO DE VENDAS - SERENADA PUB & BURGER\n\n";
    csv += "Pedido ID;Data;Local;Pagamento;Itens;Total (R$)\n";

    historico.forEach(h => {
        csv += `${h.id};${h.data};${h.local};${h.pagamento};"${h.itensVendidos}";${h.total.toFixed(2).replace(".", ",")}\n`;
    });

    csv += `\n;;;;TOTAL DO DIA;${totalDia.toFixed(2).replace(".", ",")}`;

    const blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    const dataArquivo = new Date().toLocaleDateString().replace(/\//g, "-");

    link.setAttribute("href", url);
    link.setAttribute("download", `relatorio_serenada_${dataArquivo}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

function reimprimirHistorico(index) {
    const pedido = historico[index];
    if (!pedido || !pedido.dadosCompletos) return alert("Sem detalhes para impressão.");
    imprimirCupom(pedido.id, pedido.local, pedido.dadosCompletos, pedido.total, pedido.pagamento);
}

function toggleCliente() {
    const mesaSelect = document.getElementById("mesaSelect");
    const painel = document.getElementById("painelDelivery");
    if(mesaSelect && painel) {
        painel.style.display = (mesaSelect.value === "Delivery") ? "flex" : "none";
        atualizarPedidoUI();
    }
}

function removerItem(id, idx){
    let item = comandas[id].itens[idx];
    let p = estoque.find(p=>p.nome===item.nome);
    if(p) p.qtd += item.qtd;
    comandas[id].itens.splice(idx,1);
    if(comandas[id].itens.length===0) delete comandas[id];
    salvarDados(); renderizarTudo();
}

function imprimirCupom(idPedido, idLocal, obj, total, formaPag){
    let janela = window.open("", "", "width=300,height=600");
    let cupom = `<pre style="font-family:monospace">SERENADA PUB & BURGER\n----------------------------\nID: ${idPedido}\nLOCAL: ${idLocal}\nDATA: ${new Date().toLocaleString()}\n----------------------------\n`;
    obj.itens.forEach(i => { cupom += `${i.qtd}x ${i.nome.padEnd(15)} R$${i.total.toFixed(2)}\n`; });
    cupom += `----------------------------\nTOTAL: R$ ${total.toFixed(2)}\nPGTO: ${formaPag}\n----------------------------\n</pre>`;
    janela.document.write(cupom); janela.document.close();
    setTimeout(() => { janela.print(); janela.close(); }, 500);
}

function zerarSistema() {
    if(prompt("Senha Mestre:") === SENHA_SISTEMA) {
        if(confirm("Apagar tudo?")) { localStorage.clear(); location.reload(); }
    }
}

window.onload = () => {
    const mSelect = document.getElementById("mesaSelect");
    if(mSelect) {
        mSelect.innerHTML = `<option value="todas">Ver Todas</option><option value="Balcão">📍 Balcão</option><option value="Delivery">🛵 Delivery</option>`;
        for(let i=1;i<=20;i++) mSelect.innerHTML += `<option value="${i}">Mesa ${i}</option>`;
    }
    renderizarTudo();
};