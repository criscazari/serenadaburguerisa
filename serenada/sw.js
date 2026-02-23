// Inicialização de dados
let estoque = JSON.parse(localStorage.getItem("estoque")) || [];
let totalDia = JSON.parse(localStorage.getItem("totalDia")) || 0;

// Função chamada pelo botão "Adicionar" no seu HTML
function adicionarProduto() {
    const nome = document.getElementById("nomeProduto").value.trim();
    const preco = parseFloat(document.getElementById("precoProduto").value);

    if (!nome || isNaN(preco)) {
        alert("Preencha o nome e o preço corretamente!");
        return;
    }

    // Adiciona ao array
    estoque.push({ nome, preco, qtd: 1 });
    
    // Limpa os campos
    document.getElementById("nomeProduto").value = "";
    document.getElementById("precoProduto").value = "";

    salvarERenderizar();
}

function alterarEstoque(index, valor) {
    if (estoque[index].qtd + valor >= 0) {
        estoque[index].qtd += valor;
        salvarERenderizar();
    }
}

function excluirProduto(index) {
    if (confirm("Deseja excluir este item?")) {
        estoque.splice(index, 1);
        salvarERenderizar();
    }
}

function salvarERenderizar() {
    // Salva no navegador
    localStorage.setItem("estoque", JSON.stringify(estoque));
    
    // Atualiza a tabela na tela
    const tabela = document.getElementById("listaProdutos");
    tabela.innerHTML = "";
    let totalCálculo = 0;

    estoque.forEach((p, i) => {
        totalCálculo += (p.preco * p.qtd);
        tabela.innerHTML += `
            <tr>
                <td>${p.nome}</td>
                <td>R$ ${p.preco.toFixed(2)}</td>
                <td>
                    <button class="btn-qty" onclick="alterarEstoque(${i}, -1)">-</button>
                    <span class="qty-display">${p.qtd}</span>
                    <button class="btn-qty" onclick="alterarEstoque(${i}, 1)">+</button>
                    <button class="btn-danger" style="width:30px; margin-left:10px" onclick="excluirProduto(${i})">🗑️</button>
                </td>
            </tr>
        `;
    });

    document.getElementById("valorTotal").innerText = `R$ ${totalCálculo.toFixed(2)}`;
}

// Alternar Tema (Escuro/Claro)
function toggleTheme() {
    document.body.classList.toggle("light-theme");
}

// Carregar dados ao abrir a página
window.onload = salvarERenderizar;