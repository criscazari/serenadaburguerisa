const SENHA_SISTEMA = "1234"; 

let estoque = JSON.parse(localStorage.getItem("estoque")) || [];
let comandas = JSON.parse(localStorage.getItem("comandas")) || {};
let totalDia = JSON.parse(localStorage.getItem("totalDia")) || 0;
let historico = JSON.parse(localStorage.getItem("historico")) || [];

function fazerLogin(){
    if(document.getElementById("senhaLogin").value === SENHA_SISTEMA) {
        document.getElementById("loginScreen").style.display="none";
    } else alert("Senha incorreta!");
}

function salvarDados(){
    localStorage.setItem("estoque", JSON.stringify(estoque));
    localStorage.setItem("comandas", JSON.stringify(comandas));
    localStorage.setItem("totalDia", JSON.stringify(totalDia));
    localStorage.setItem("historico", JSON.stringify(historico));
}

function toggleCliente() {
    let mesa = mesaSelect.value;
    document.getElementById("painelDelivery").style.display = (mesa === "Delivery") ? "flex" : "none";
    atualizarMesa();
}

function cadastrarProduto(){
    let nome = nomeProduto.value.trim();
    let preco = parseFloat(precoProduto.value);
    let qtd = parseInt(estoqueProduto.value);
    if(!nome || isNaN(preco) || preco <= 0 || isNaN(qtd) || qtd < 0) return alert("Valores inválidos!");
    if(estoque.find(p => p.nome.toLowerCase() === nome.toLowerCase())) return alert("Produto já cadastrado!");
    estoque.push({nome, preco, qtd});
    salvarDados();
    atualizarEstoque();
    nomeProduto.value = ""; precoProduto.value = ""; estoqueProduto.value = "";
}

function atualizarEstoque(){
    tabelaEstoque.innerHTML="";
    produtoSelect.innerHTML="";
    estoque.forEach((p,i)=>{
        tabelaEstoque.innerHTML+=
        `<tr><td>${p.nome}</td><td>R$ ${p.preco.toFixed(2)}</td>
            <td><button onclick="alterarEstoque(${i}, -1)">➖</button> <strong>${p.qtd}</strong> <button onclick="alterarEstoque(${i}, 1)">➕</button></td>
            <td><button class="btn-danger" onclick="excluirProduto(${i})">🗑️</button></td></tr>`;
        produtoSelect.innerHTML+= `<option value="${i}">${p.nome}</option>`;
    });
}

function alterarEstoque(i, n){
    if(estoque[i].qtd + n < 0) return alert("Estoque insuficiente!");
    estoque[i].qtd += n;
    salvarDados();
    atualizarEstoque();
}

function excluirProduto(i) {
    if(confirm(`Excluir ${estoque[i].nome}?`)) {
        estoque.splice(i, 1);
        salvarDados();
        atualizarEstoque();
    }
}

function atualizarMesas(){
    mesaSelect.innerHTML = `<option value="todas">Ver Todas</option> <option value="Balcão">📍 Balcão</option> <option value="Delivery">🛵 Delivery</option>`;
    for(let i=1;i<=20;i++) mesaSelect.innerHTML += `<option value="${i}">Mesa ${i}</option>`;
}

function adicionarItem(){
    let mesaSel = mesaSelect.value;
    if(mesaSel==="todas") return alert("Selecione o destino");
    let pIdx = produtoSelect.value;
    let qtd = parseInt(qtdItem.value);
    let produto = estoque[pIdx];
    if(!produto || qtd <= 0) return alert("Verifique o produto!");
    if(produto.qtd < qtd) return alert("Sem estoque!");
    let idComanda = (mesaSel === "Delivery") ? `DELIVERY: ${nomeCliente.value.trim()}` : (mesaSel === "Balcão" ? "BALCÃO" : `MESA ${mesaSel}`);
    if(!comandas[idComanda]) {
        comandas[idComanda] = { itens: [], taxa: 0, endereco: "" };
        if(mesaSel === "Delivery") { 
            comandas[idComanda].taxa = parseFloat(taxaEntrega.value) || 0; 
            comandas[idComanda].endereco = endCliente.value.trim(); 
        }
    }
    comandas[idComanda].itens.push({ nome: produto.nome, qtd, preco: produto.preco, total: produto.preco * qtd, obs: obsItem.value.trim() });
    produto.qtd -= qtd;
    obsItem.value = "";
    salvarDados(); atualizarEstoque(); atualizarMesa();
}

function atualizarMesa(){
    let mesaSel = mesaSelect.value;
    let nomeCli = nomeCliente.value.trim();
    let idBusca = (mesaSel === "Delivery") ? `DELIVERY: ${nomeCli}` : (mesaSel === "Balcão" ? "BALCÃO" : `MESA ${mesaSel}`);
    itensMesa.innerHTML="";
    let totalGeral=0;
    const renderLinhas = (id) => {
        let subtotal = 0;
        comandas[id].itens.forEach((item, index) => {
            subtotal += item.total;
            itensMesa.innerHTML += `<tr><td>${id}</td><td>${item.nome}</td><td class="obs-text">${item.obs || "-"}</td><td>${item.qtd}</td><td>R$ ${item.total.toFixed(2)}</td>
            <td><button class="btn-danger" onclick="removerItem('${id}',${index})">❌</button></td></tr>`;
        });
        if(comandas[id].taxa > 0) {
            itensMesa.innerHTML += `<tr style="color:#03dac6"><td>-</td><td>TAXA DE ENTREGA</td><td colspan="2">${comandas[id].endereco}</td><td>R$ ${comandas[id].taxa.toFixed(2)}</td><td></td></tr>`;
            subtotal += comandas[id].taxa;
        }
        return subtotal;
    };
    if(mesaSel === "todas"){
        for(let id in comandas) totalGeral += renderLinhas(id);
    } else if(comandas[idBusca]){
        totalGeral = renderLinhas(idBusca);
    }
    totalMesa.innerHTML = "Total: R$ " + totalGeral.toFixed(2);
}

function removerItem(id, idx){
    let item = comandas[id].itens[idx];
    let p = estoque.find(p=>p.nome===item.nome);
    if(p) p.qtd += item.qtd;
    comandas[id].itens.splice(idx,1);
    if(comandas[id].itens.length===0) delete comandas[id];
    salvarDados(); atualizarEstoque(); atualizarMesa();
}

function fecharMesa(){
    let mesaSel = mesaSelect.value;
    let nomeCli = nomeCliente.value.trim();
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
    if(mesaSel === "Delivery") { nomeCliente.value=""; endCliente.value=""; taxaEntrega.value=""; }
    
    salvarDados(); 
    atualizarMesa(); 
    atualizarTotalDia(); 
    atualizarHistoricoUI();
}

function atualizarHistoricoUI(){
    tabelaHistorico.innerHTML = "";
    [...historico].reverse().forEach((p, index) => {
        const realIdx = historico.length - 1 - index; 
        tabelaHistorico.innerHTML += `
        <tr class="historico-row">
            <td>${p.id}</td>
            <td>${p.data}</td>
            <td>${p.local}</td>
            <td>${p.pagamento}</td>
            <td style="color:#03dac6">R$ ${p.total.toFixed(2)}</td>
            <td>
                <button class="btn-primary btn-reprint" onclick="reimprimirHistorico(${realIdx})" title="Reimprimir Cupom">🖨️</button>
            </td>
        </tr>`;
    });
}

function reimprimirHistorico(index) {
    const p = historico[index];
    if(!p.dadosCompletos) return alert("Registro sem dados detalhados para reimpressão.");
    imprimirCupom(p.id, p.local, p.dadosCompletos, p.total, p.pagamento);
}

function imprimirCupom(idPedido, idLocal, obj, total, formaPag){
    let janela = window.open("", "", "width=300,height=600");
    let cupom = `<pre style="font-family:monospace">SERENADA PUB & BURGER\nCNPJ: 00.000.000/0001-00\n----------------------------\nPEDIDO ID: ${idPedido}\nLOCAL: ${idLocal}\nDATA: ${new Date().toLocaleString()}\n----------------------------\n`;
    obj.itens.forEach(i => { 
        cupom += `${i.qtd}x ${i.nome.padEnd(15)} R$${i.total.toFixed(2)}\n`; 
        if(i.obs) cupom += `   * ${i.obs}\n`; 
    });
    if(obj.taxa > 0) cupom += `----------------------------\nENTREGA: R$ ${obj.taxa.toFixed(2)}\n`;
    cupom += `----------------------------\nPAGAMENTO: ${formaPag}\nTOTAL: R$ ${total.toFixed(2)}\n----------------------------\nObrigado pela preferência!\n</pre>`;
    janela.document.write(cupom); 
    janela.print(); 
    janela.close();
}

function zerarSistema() {
    if(prompt("Senha Mestre:") === SENHA_SISTEMA) {
        if(confirm("Zerar tudo?")) {
            comandas = {}; totalDia = 0; historico = [];
            salvarDados(); location.reload();
        }
    } else alert("Senha incorreta!");
}

function atualizarTotalDia(){
    document.getElementById("totalDia").innerHTML="Total: R$ "+totalDia.toFixed(2);
}

function fecharCaixa(){
    if(totalDia === 0) return alert("Não há vendas registradas!");
    
    if(confirm("Encerrar caixa e gerar CSV?")) {
        let csvContent = "ID Pedido;Data;Local/Mesa;Pagamento;Itens;Total (R$)\n";
        historico.forEach(h => {
            let totalFormatado = h.total.toFixed(2).replace('.', ','); 
            csvContent += `${h.id};${h.data};${h.local};${h.pagamento};"${h.itensVendidos}";${totalFormatado}\n`;
        });
        
        csvContent += `\n; ; ; ;TOTAL DO DIA;${totalDia.toFixed(2).replace('.', ',')}`;
        
        const blob = new Blob(["\ufeff" + csvContent], { type: "text/csv;charset=utf-8;" });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        const dataArquivo = new Date().toLocaleDateString().replace(/\//g, '-');
        
        link.setAttribute("href", url);
        link.setAttribute("download", `vendas_detalhado_${dataArquivo}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        totalDia = 0;
        historico = [];
        salvarDados();
        atualizarTotalDia();
        atualizarHistoricoUI();
        alert("Caixa encerrado e arquivo gerado!");
    }
}

function limparHistoricoVisual() {
    if(confirm("Deseja limpar apenas a lista visual do histórico?\n\n(Isso NÃO apaga o faturamento do dia nem as mesas abertas).")) {
        historico = [];
        atualizarHistoricoUI();
        alert("Visualização limpa!");
    }
}

function importarCSV(event) {
    const arquivo = event.target.files[0];
    if (!arquivo) return;

    const leitor = new FileReader();
    leitor.onload = function(e) {
        const conteudo = e.target.result;
        const linhas = conteudo.replace(/\ufeff/g, "").split("\n");
        let novosItensHistorico = [];

        linhas.forEach((linha, index) => {
            if (index === 0 || linha.trim() === "" || linha.includes("TOTAL DO DIA")) return;
            const colunas = linha.match(/(".*?"|[^;]+)/g);

            if (colunas && colunas.length >= 6) {
                novosItensHistorico.push({
                    id: colunas[0].trim(),
                    data: colunas[1].trim(),
                    local: colunas[2].trim(),
                    pagamento: colunas[3].trim(),
                    itensVendidos: colunas[4].replace(/"/g, "").trim(),
                    total: parseFloat(colunas[5].replace(",", "."))
                });
            }
        });

        if (novosItensHistorico.length > 0) {
            if(confirm(`Encontrados ${novosItensHistorico.length} pedidos. Carregar na tela?`)) {
                historico = [...novosItensHistorico, ...historico]; 
                atualizarHistoricoUI();
            }
        } else {
            alert("Arquivo inválido!");
        }
    };
    leitor.readAsText(arquivo, "UTF-8");
    event.target.value = "";
}

function gerarRelatorioCompleto(){ 
    alert(`Resumo atual do faturamento: R$ ${totalDia.toFixed(2)}\nPedidos no histórico: ${historico.length}`);
}

// Inicialização Final
atualizarEstoque();
atualizarMesas();
atualizarTotalDia();
atualizarHistoricoUI();