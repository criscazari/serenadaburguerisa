/* =========================
   VARIÁVEIS GLOBAIS
========================= */
let estoque = JSON.parse(localStorage.getItem("estoque")) || [];
let comandas = JSON.parse(localStorage.getItem("comandas")) || {};
let historico = JSON.parse(localStorage.getItem("historico")) || [];
let totalDia = parseFloat(localStorage.getItem("totalDia")) || 0;

/* =========================
   LOGIN
========================= */
function fazerLogin(){
    const senha = document.getElementById("senhaLogin").value;
    if(senha === "1234"){
        document.getElementById("loginScreen").style.display = "none";
    } else {
        alert("Senha incorreta!");
    }
}

/* =========================
   SALVAR DADOS
========================= */
function salvarDados(){
    localStorage.setItem("estoque", JSON.stringify(estoque));
    localStorage.setItem("comandas", JSON.stringify(comandas));
    localStorage.setItem("historico", JSON.stringify(historico));
    localStorage.setItem("totalDia", totalDia);
}

/* =========================
   TEMA
========================= */
function toggleTheme(){
    document.body.classList.toggle("light-theme");
}

/* =========================
   CADASTRAR PRODUTO
========================= */
function cadastrarProduto(){
    const nome = document.getElementById("nomeProduto").value.trim();
    const preco = parseFloat(document.getElementById("precoProduto").value);
    const qtd = parseInt(document.getElementById("estoqueProduto").value);

    if(!nome || preco <= 0 || qtd < 0){
        return alert("Preencha corretamente!");
    }

    estoque.push({ nome, preco, qtd });
    salvarDados();
    atualizarEstoque();
}

/* =========================
   ATUALIZAR ESTOQUE
========================= */
function atualizarEstoque(){
    const tabela = document.getElementById("tabelaEstoque");
    const select = document.getElementById("produtoSelect");

    tabela.innerHTML = "";
    select.innerHTML = "";

    estoque.forEach((prod, i)=>{
        tabela.innerHTML += `
            <tr>
                <td>${prod.nome}</td>
                <td>R$ ${prod.preco.toFixed(2)}</td>
                <td>${prod.qtd}</td>
                <td><button onclick="removerProduto(${i})">❌</button></td>
            </tr>
        `;

        select.innerHTML += `<option value="${i}">${prod.nome}</option>`;
    });
}

function removerProduto(i){
    estoque.splice(i,1);
    salvarDados();
    atualizarEstoque();
}

/* =========================
   MESA SELECT
========================= */
function inicializarMesas(){
    const mesaSelect = document.getElementById("mesaSelect");
    mesaSelect.innerHTML = `
        <option value="todas">Selecione</option>
        <option value="1">Mesa 1</option>
        <option value="2">Mesa 2</option>
        <option value="3">Mesa 3</option>
        <option value="Balcão">Balcão</option>
        <option value="Delivery">Delivery</option>
    `;
}

function toggleCliente(){
    const mesa = document.getElementById("mesaSelect").value;
    const painel = document.getElementById("painelDelivery");

    painel.style.display = mesa === "Delivery" ? "flex" : "none";
    atualizarMesa();
}

/* =========================
   ADICIONAR ITEM
========================= */
function adicionarItem(){
    const mesaSel = document.getElementById("mesaSelect").value;
    if(mesaSel === "todas") return alert("Selecione destino!");

    const prodIndex = document.getElementById("produtoSelect").value;
    const qtd = parseInt(document.getElementById("qtdItem").value);
    const obs = document.getElementById("obsItem").value.trim();
    const nomeCliente = document.getElementById("nomeCliente").value.trim();
    const taxaEntrega = parseFloat(document.getElementById("taxaEntrega").value) || 0;

    let produto = estoque[prodIndex];
    if(!produto || qtd <= 0) return alert("Quantidade inválida!");
    if(produto.qtd < qtd) return alert("Estoque insuficiente!");

    let id =
        mesaSel === "Delivery" ? `DELIVERY: ${nomeCliente}` :
        mesaSel === "Balcão" ? "BALCÃO" :
        `MESA ${mesaSel}`;

    if(!comandas[id]){
        comandas[id] = { itens: [], taxa: mesaSel === "Delivery" ? taxaEntrega : 0 };
    }

    comandas[id].itens.push({
        nome: produto.nome,
        qtd,
        preco: produto.preco,
        total: produto.preco * qtd,
        obs
    });

    produto.qtd -= qtd;

    salvarDados();
    atualizarEstoque();
    atualizarMesa();
}

/* =========================
   ATUALIZAR MESA
========================= */
function atualizarMesa(){
    const mesaSel = document.getElementById("mesaSelect").value;
    const tabela = document.getElementById("itensMesa");
    const totalDiv = document.getElementById("totalMesa");

    tabela.innerHTML = "";
    totalDiv.innerHTML = "Total: R$ 0.00";

    let id =
        mesaSel === "Balcão" ? "BALCÃO" :
        mesaSel === "Delivery" ? null :
        `MESA ${mesaSel}`;

    if(mesaSel === "Delivery"){
        const nomeCliente = document.getElementById("nomeCliente").value.trim();
        id = `DELIVERY: ${nomeCliente}`;
    }

    if(!id || !comandas[id]) return;

    let total = 0;

    comandas[id].itens.forEach((item,i)=>{
        total += item.total;
        tabela.innerHTML += `
            <tr>
                <td>${id}</td>
                <td>${item.nome}</td>
                <td>${item.obs}</td>
                <td>${item.qtd}</td>
                <td>R$ ${item.total.toFixed(2)}</td>
                <td><button onclick="removerItem('${id}',${i})">❌</button></td>
            </tr>
        `;
    });

    total += comandas[id].taxa || 0;
    totalDiv.innerHTML = "Total: R$ " + total.toFixed(2);
}

function removerItem(id,i){
    comandas[id].itens.splice(i,1);
    salvarDados();
    atualizarMesa();
}

/* =========================
   FECHAR MESA
========================= */
function fecharMesa(){
    const mesaSel = document.getElementById("mesaSelect").value;

    let id =
        mesaSel === "Balcão" ? "BALCÃO" :
        mesaSel === "Delivery" ? null :
        `MESA ${mesaSel}`;

    if(mesaSel === "Delivery"){
        const nomeCliente = document.getElementById("nomeCliente").value.trim();
        id = `DELIVERY: ${nomeCliente}`;
    }

    if(!id || !comandas[id]) return alert("Nenhuma comanda aberta!");

    let total = comandas[id].itens.reduce((s,i)=>s+i.total,0);
    total += comandas[id].taxa || 0;

    historico.push({
        id,
        data: new Date().toLocaleString(),
        total
    });

    totalDia += total;

    delete comandas[id];

    salvarDados();
    atualizarMesa();
    atualizarHistoricoUI();
    atualizarTotalDia();

    alert("Conta fechada!");
}

/* =========================
   HISTÓRICO
========================= */
function atualizarHistoricoUI(){
    const tabela = document.getElementById("tabelaHistorico");
    tabela.innerHTML = "";

    historico.forEach((h,i)=>{
        tabela.innerHTML += `
            <tr>
                <td>${i+1}</td>
                <td>${h.data}</td>
                <td>${h.id}</td>
                <td>-</td>
                <td>R$ ${h.total.toFixed(2)}</td>
                <td>-</td>
            </tr>
        `;
    });
}

function limparHistoricoVisual(){
    if(confirm("Limpar histórico?")){
        historico = [];
        salvarDados();
        atualizarHistoricoUI();
    }
}

/* =========================
   CAIXA
========================= */
function atualizarTotalDia(){
    document.getElementById("totalDia").innerHTML =
        "Total: R$ " + totalDia.toFixed(2);
}

function fecharCaixa(){
    alert("Total do dia: R$ " + totalDia.toFixed(2));
}

function zerarSistema(){
    if(confirm("Tem certeza que deseja zerar tudo?")){
        localStorage.clear();
        location.reload();
    }
}

/* =========================
   INICIALIZAÇÃO
========================= */
window.onload = function(){
    inicializarMesas();
    atualizarEstoque();
    atualizarHistoricoUI();
    atualizarTotalDia();
};