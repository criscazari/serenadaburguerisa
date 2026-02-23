let produtos = [];
let total = 0;

function adicionarProduto(){
    const nome = document.getElementById("nomeProduto").value;
    const preco = parseFloat(document.getElementById("precoProduto").value);

    if(!nome || isNaN(preco)){
        alert("Preencha corretamente!");
        return;
    }

    produtos.push({nome, preco});
    total += preco;

    atualizarTabela();
    atualizarTotal();

    document.getElementById("nomeProduto").value = "";
    document.getElementById("precoProduto").value = "";
}

function removerProduto(index){
    total -= produtos[index].preco;
    produtos.splice(index,1);

    atualizarTabela();
    atualizarTotal();
}

function atualizarTabela(){
    const lista = document.getElementById("listaProdutos");
    lista.innerHTML = "";

    produtos.forEach((produto, index)=>{
        lista.innerHTML += `
        <tr>
            <td>${produto.nome}</td>
            <td>R$ ${produto.preco.toFixed(2)}</td>
            <td>
                <button class="btn-danger" onclick="removerProduto(${index})">
                    Remover
                </button>
            </td>
        </tr>
        `;
    });
}

function atualizarTotal(){
    document.getElementById("valorTotal").innerText =
        "R$ " + total.toFixed(2);
}

function toggleTheme(){
    document.body.classList.toggle("light");
}