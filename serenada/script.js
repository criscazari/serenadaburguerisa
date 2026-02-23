/* =========================
   CONFIGURAÇÃO INICIAL
========================= */
const SENHA_SISTEMA = "1234"; 

let estoque = JSON.parse(localStorage.getItem("estoque")) || [];
let comandas = JSON.parse(localStorage.getItem("comandas")) || {};
let totalDia = JSON.parse(localStorage.getItem("totalDia")) || 0;
let historico = JSON.parse(localStorage.getItem("historico")) || [];

/* =========================
   INICIALIZAÇÃO DOM
========================= */
document.addEventListener("DOMContentLoaded", function() {
    atualizarEstoque();
    atualizarMesas();
    atualizarTotalDia();
    atualizarHistoricoUI();
});

/* =========================
   LOGIN
========================= */
function fazerLogin(){
    const senha = document.getElementById("senhaLogin").value;
    if(senha === SENHA_SISTEMA){
        document.getElementById("loginScreen").style.display="none";
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
    localStorage.setItem("totalDia", JSON.stringify(totalDia));
    localStorage.setItem("historico", JSON.stringify(historico));
}

/* =========================
   TOGGLE DELIVERY
========================= */
function toggleCliente(){
    const mesaSelect = document.getElementById("mesaSelect");
    const painel = document.getElementById("painelDelivery");
    let mesa = mesaSelect.value;
    painel.style.display = (mesa === "Delivery") ? "flex" : "none";
    atualizarMesa();
}

/* =========================
   CADASTRAR PRODUTO
========================= */
function cadastrarProduto(){
    let nome = document.getElementById("nomeProduto").value.trim();
    let preco = parseFloat(document.getElementById("precoProduto").value);
    let qtd = parseInt(document.getElementById("estoqueProduto").value);

    if(!nome || isNaN(preco) || preco <= 0 || isNaN(qtd) || qtd < 0)
        return alert("Valores inválidos!");

    if(estoque.find(p => p.nome.toLowerCase() === nome.toLowerCase()))
        return alert("Produto já cadastrado!");

    estoque.push({nome, preco, qtd});
    salvarDados();
    atualizarEstoque();

    document.getElementById("nomeProduto").value="";
    document.getElementById("precoProduto").value="";
    document.getElementById("estoqueProduto").value="";
}

/* =========================
   ATUALIZAR ESTOQUE
========================= */
function atualizarEstoque(){
    const tabelaEstoque = document.getElementById("tabelaEstoque");
    const produtoSelect = document.getElementById("produtoSelect");
    if(!tabelaEstoque || !produtoSelect) return;

    tabelaEstoque.innerHTML="";
    produtoSelect.innerHTML="";

    estoque.forEach((p,i)=>{
        tabelaEstoque.innerHTML+=`
        <tr>
            <td>${p.nome}</td>
            <td>R$ ${p.preco.toFixed(2)}</td>
            <td>
                <button onclick="alterarEstoque(${i},-1)">➖</button>
                <strong>${p.qtd}</strong>
                <button onclick="alterarEstoque(${i},1)">➕</button>
            </td>
            <td>
                <button class="btn-danger" onclick="excluirProduto(${i})">🗑️</button>
            </td>
        </tr>`;

        produtoSelect.innerHTML+=`<option value="${i}">${p.nome}</option>`;
    });
}

/* =========================
   ALTERAR ESTOQUE
========================= */
function alterarEstoque(i,n){
    if(estoque[i].qtd + n < 0)
        return alert("Estoque insuficiente!");

    estoque[i].qtd += n;
    salvarDados();
    atualizarEstoque();
}

/* =========================
   EXCLUIR PRODUTO
========================= */
function excluirProduto(i){
    if(confirm(`Excluir ${estoque[i].nome}?`)){
        estoque.splice(i,1);
        salvarDados();
        atualizarEstoque();
    }
}

/* =========================
   MESAS
========================= */
function atualizarMesas(){
    const mesaSelect = document.getElementById("mesaSelect");
    if(!mesaSelect) return;

    mesaSelect.innerHTML=`
        <option value="todas">Ver Todas</option>
        <option value="Balcão">📍 Balcão</option>
        <option value="Delivery">🛵 Delivery</option>`;

    for(let i=1;i<=20;i++){
        mesaSelect.innerHTML+=`<option value="${i}">Mesa ${i}</option>`;
    }
}

/* =========================
   ATUALIZAR MESA
========================= */
function atualizarMesa(){
    const mesaSelect = document.getElementById("mesaSelect");
    const nomeCliente = document.getElementById("nomeCliente");
    const itensMesa = document.getElementById("itensMesa");
    const totalMesa = document.getElementById("totalMesa");

    if(!mesaSelect || !itensMesa || !totalMesa) return;

    let mesaSel = mesaSelect.value;
    let nomeCli = nomeCliente ? nomeCliente.value.trim() : "";

    let idBusca =
        (mesaSel === "Delivery") ? `DELIVERY: ${nomeCli}` :
        (mesaSel === "Balcão") ? "BALCÃO" :
        `MESA ${mesaSel}`;

    itensMesa.innerHTML="";
    let totalGeral=0;

    const renderLinhas = (id)=>{
        let subtotal=0;

        comandas[id].itens.forEach((item,index)=>{
            subtotal+=item.total;

            itensMesa.innerHTML+=`
            <tr>
                <td>${id}</td>
                <td>${item.nome}</td>
                <td>${item.obs || "-"}</td>
                <td>${item.qtd}</td>
                <td>R$ ${item.total.toFixed(2)}</td>
                <td>
                    <button class="btn-danger"
                    onclick="removerItem('${id}',${index})">❌</button>
                </td>
            </tr>`;
        });

        if(comandas[id].taxa > 0){
            subtotal += comandas[id].taxa;
        }

        return subtotal;
    };

    if(mesaSel==="todas"){
        for(let id in comandas){
            totalGeral+=renderLinhas(id);
        }
    } else if(comandas[idBusca]){
        totalGeral=renderLinhas(idBusca);
    }

    totalMesa.innerHTML="Total: R$ "+totalGeral.toFixed(2);
}

/* =========================
   REMOVER ITEM
========================= */
function removerItem(id,idx){
    let item=comandas[id].itens[idx];
    let p=estoque.find(p=>p.nome===item.nome);
    if(p) p.qtd+=item.qtd;

    comandas[id].itens.splice(idx,1);
    if(comandas[id].itens.length===0)
        delete comandas[id];

    salvarDados();
    atualizarEstoque();
    atualizarMesa();
}

/* =========================
   TOTAL DIA
========================= */
function atualizarTotalDia(){
    const el=document.getElementById("totalDia");
    if(el)
        el.innerHTML="Total: R$ "+totalDia.toFixed(2);
}