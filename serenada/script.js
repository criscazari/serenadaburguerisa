const SENHA_SISTEMA = "1234"; 

let estoque = JSON.parse(localStorage.getItem("estoque")) || [];
let comandas = JSON.parse(localStorage.getItem("comandas")) || {};
let totalDia = JSON.parse(localStorage.getItem("totalDia")) || 0;
let historico = JSON.parse(localStorage.getItem("historico")) || [];

// Funções de Persistência
function salvarDados(){
    localStorage.setItem("estoque", JSON.stringify(estoque));
    localStorage.setItem("comandas", JSON.stringify(comandas));
    localStorage.setItem("totalDia", JSON.stringify(totalDia));
    localStorage.setItem("historico", JSON.stringify(historico));
}

// Lógica de Estoque
function cadastrarProduto(){
    const nome = document.getElementById("nomeProduto")?.value.trim();
    const preco = parseFloat(document.getElementById("precoProduto")?.value);
    const qtd = parseInt(document.getElementById("estoqueProduto")?.value);

    if(!nome || isNaN(preco) || isNaN(qtd)) return alert("Preencha todos os campos!");
    if(estoque.find(p => p.nome.toLowerCase() === nome.toLowerCase())) return alert("Produto já cadastrado!");

    estoque.push({nome, preco, qtd});
    salvarDados();
    renderizarTudo();
    document.getElementById("nomeProduto").value = ""; 
    document.getElementById("precoProduto").value = ""; 
    document.getElementById("estoqueProduto").value = "";
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

// Lógica de Pedidos
function adicionarItem(){
    const mesaSel = document.getElementById("mesaSelect").value;
    if(mesaSel === "todas") return alert("Selecione uma mesa ou delivery!");
    
    const pIdx = document.getElementById("produtoSelect").value;
    const qtd = parseInt(document.getElementById("qtdItem").value);
    const produto = estoque[pIdx];

    if(!produto || qtd <= 0) return alert("Selecione um produto válido!");
    if(produto.qtd < qtd) return alert("Estoque insuficiente!");

    let idComanda = mesaSel;
    if(mesaSel === "Delivery") {
        const nomeCli = document.getElementById("nomeCliente").value.trim();
        if(!nomeCli) return alert("Informe o nome do cliente para Delivery!");
        idComanda = `DELIVERY: ${nomeCli}`;
    }

    if(!comandas[idComanda]) {
        comandas[idComanda] = { itens: [], taxa: 0, endereco: "" };
        if(mesaSel === "Delivery") {
            comandas[idComanda].taxa = parseFloat(document.getElementById("taxaEntrega").value) || 0;
            comandas[idComanda].endereco = document.getElementById("endCliente").value.trim();
        }
    }

    comandas[idComanda].itens.push({
        nome: produto.nome, 
        qtd, 
        preco: produto.preco, 
        total: produto.preco * qtd, 
        obs: document.getElementById("obsItem").value.trim() 
    });

    produto.qtd -= qtd;
    document.getElementById("obsItem").value = "";
    salvarDados();
    renderizarTudo();
}

// Funções de Renderização (Verificam se o elemento existe na página)
function renderizarTudo() {
    // 1. Tabela de Estoque (estoque.html)
    const tabEstoque = document.getElementById("tabelaEstoque");
    if(tabEstoque) {
        tabEstoque.innerHTML = "";
        estoque.forEach((p, i) => {
            tabEstoque.innerHTML += `
            <tr>
                <td>${p.nome}</td>
                <td>R$ ${p.preco.toFixed(2)}</td>
                <td>
                    <button class="btn-qty" onclick="alterarEstoque(${i}, -1)">-</button>
                    <strong> ${p.qtd} </strong>
                    <button class="btn-qty" onclick="alterarEstoque(${i}, 1)">+</button>
                </td>
                <td><button class="btn-danger" onclick="excluirProduto(${i})">🗑️</button></td>
            </tr>`;
        });
    }

    // 2. Select de Produtos (index.html)
    const selProd = document.getElementById("produtoSelect");
    if(selProd) {
        selProd.innerHTML = estoque.map((p, i) => `<option value="${i}">${p.nome} (R$ ${p.preco.toFixed(2)})</option>`).join("");
    }

    // 3. Mesa/Itens (index.html)
    atualizarMesa();
    
    // 4. Histórico e Totais (index.html)
    atualizarTotalDia();
    atualizarHistoricoUI();
}

// Funções Auxiliares (Simplificadas para o exemplo)
function atualizarMesas(){
    const ms = document.getElementById("mesaSelect");
    if(!ms) return;
    ms.innerHTML = `<option value="todas">Ver Todas</option><option value="Balcão">📍 Balcão</option><option value="Delivery">🛵 Delivery</option>`;
    for(let i=1; i<=20; i++) ms.innerHTML += `<option value="MESA ${i}">Mesa ${i}</option>`;
}

function atualizarTotalDia(){
    const td = document.getElementById("totalDia");
    if(td) td.innerHTML = "Total: R$ " + totalDia.toFixed(2);
}

function toggleCliente() {
    const ms = document.getElementById("mesaSelect");
    const pd = document.getElementById("painelDelivery");
    if(ms && pd) pd.style.display = (ms.value === "Delivery") ? "flex" : "none";
    atualizarMesa();
}

function atualizarMesa(){
    const im = document.getElementById("itensMesa");
    if(!im) return;
    im.innerHTML = "";
    let totalGeral = 0;
    // Lógica de renderização de itens (similar ao seu original)...
    // [Resumo: percorre o objeto 'comandas' e preenche a tabela 'itensMesa']
}

function atualizarHistoricoUI(){
    const th = document.getElementById("tabelaHistorico");
    if(!th) return;
    th.innerHTML = [...historico].reverse().map((p, i) => `
        <tr>
            <td>${p.id}</td><td>${p.data.split(",")[1]}</td><td>${p.local}</td><td>${p.pagamento}</td><td>R$ ${p.total.toFixed(2)}</td>
            <td><button onclick="reimprimirHistorico(${historico.length-1-i})">🖨️</button></td>
        </tr>`).join("");
}

// Inicialização automática
window.onload = () => {
    atualizarMesas();
    renderizarTudo();
};