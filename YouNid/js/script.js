if (localStorage.getItem('tema') == 'escuro') document.body.classList.add('escuro');

let camposPerfil = ['nome', 'telefone', 'nascimento', 'cep', 'rua', 'numero', 'complemento', 'bairro', 'cidade', 'uf'];

function trocarTema() {
  localStorage.setItem('tema', document.body.classList.toggle('escuro') ? 'escuro' : 'claro');
}

function pegarLista(nome) {
  return JSON.parse(localStorage.getItem(nome)) || [];
}

function salvarLista(nome, lista) {
  localStorage.setItem(nome, JSON.stringify(lista));
}

function formatarPreco(valor) {
  return 'R$ ' + valor.toFixed(2).replace('.', ',');
}

function valor(id) {
  return document.getElementById(id).value;
}

function usuarioLogado() {
  return pegarLista('usuarios').find(u => u.email == localStorage.getItem('logado'));
}

function vazio(texto) {
  return '<p class="vazio">' + texto + '</p>';
}

function somenteNumeros(campo) {
  campo.value = campo.value.replace(/\D/g, '');
}

function somenteLetras(campo) {
  campo.value = campo.value.replace(/[^A-Za-zÀ-ÿ ]/g, '');
}

function mascaraCPF(campo) {
  campo.value = campo.value.replace(/\D/g, '').replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d{1,2})$/, '$1-$2');
}

function mascaraTelefone(campo) {
  campo.value = campo.value.replace(/\D/g, '').replace(/^(\d{2})(\d)/, '($1) $2').replace(/(\d)(\d{4})$/, '$1-$2');
}

function mascaraData(campo) {
  campo.value = campo.value.replace(/\D/g, '').replace(/(\d{2})(\d)/, '$1/$2').replace(/(\d{2})(\d)/, '$1/$2');
}

function mascaraCEP(campo) {
  campo.value = campo.value.replace(/\D/g, '').replace(/(\d{5})(\d)/, '$1-$2');
}

function cadastrar(evento) {
  evento.preventDefault();
  let usuarios = pegarLista('usuarios');
  if (valor('senha') != valor('confirmarSenha')) return alert('As senhas não são iguais.');
  if (usuarios.find(u => u.email == valor('email'))) return alert('Este e-mail já está cadastrado.');
  let usuario = { email: valor('email'), cpf: valor('cpf'), senha: valor('senha') };
  for (let campo of camposPerfil) usuario[campo] = valor(campo);
  usuario.uf = usuario.uf.toUpperCase();
  usuarios.push(usuario);
  salvarLista('usuarios', usuarios);
  localStorage.setItem('logado', usuario.email);
  alert('Conta criada com sucesso!');
  location.href = 'produtos.html';
}

function entrar(evento) {
  evento.preventDefault();
  let usuario = pegarLista('usuarios').find(u => u.email == valor('loginEmail') && u.senha == valor('loginSenha'));
  if (!usuario) return alert('E-mail ou senha incorretos.');
  localStorage.setItem('logado', usuario.email);
  alert('Bem-vindo(a), ' + usuario.nome + '!');
  location.href = 'index.html';
}

function sair() {
  localStorage.removeItem('logado');
  location.href = 'index.html';
}

function iniciarCardapio() {
  let busca = new URLSearchParams(location.search).get('busca');
  if (busca != null) document.getElementById('buscaPratos').value = busca;
  buscarPratos();
}

function buscarPratos() {
  let texto = valor('buscaPratos').toLowerCase();
  let encontrados = 0;
  for (let card of document.querySelectorAll('.card')) {
    let achou = card.querySelector('h3').innerText.toLowerCase().includes(texto);
    card.style.display = achou ? 'flex' : 'none';
    if (achou) encontrados++;
  }
  for (let titulo of document.querySelectorAll('.titulo-categoria')) titulo.style.display = texto == '' ? 'block' : 'none';
  document.getElementById('nenhum').style.display = encontrados == 0 ? 'block' : 'none';
}

function adicionar(nome, preco, imagem) {
  let carrinho = pegarLista('carrinho');
  let item = carrinho.find(i => i.nome == nome);
  if (item) item.quantidade++;
  else carrinho.push({ nome: nome, preco: preco, imagem: imagem, quantidade: 1 });
  salvarLista('carrinho', carrinho);
  alert(nome + ' foi adicionado ao carrinho!');
}

function calcularTotal(carrinho) {
  let total = 0;
  for (let item of carrinho) total += item.preco * item.quantidade;
  return total;
}

function mostrarCarrinho() {
  let carrinho = pegarLista('carrinho');
  let usuario = usuarioLogado();
  let html = '';
  carrinho.forEach((item, i) => html += `<div class="item"><img src="${item.imagem}" alt="${item.nome}">
    <div class="item-info"><h4>${item.nome}</h4><span>${formatarPreco(item.preco)} cada</span></div>
    <div class="quantidade"><button onclick="mudarQuantidade(${i}, -1)">-</button><span>${item.quantidade}</span><button onclick="mudarQuantidade(${i}, 1)">+</button></div>
    <strong>${formatarPreco(item.preco * item.quantidade)}</strong><button class="remover" onclick="mudarQuantidade(${i}, -${item.quantidade})">Remover</button></div>`);
  document.getElementById('itensCarrinho').innerHTML = html || vazio('Seu carrinho está vazio. <a href="produtos.html" class="link">Ver cardápio</a>');
  document.getElementById('total').innerText = formatarPreco(calcularTotal(carrinho));
  document.getElementById('endereco').innerText = usuario ? usuario.rua + ', ' + usuario.numero + ' - ' + usuario.bairro + ', ' + usuario.cidade + '/' + usuario.uf : 'Entre na sua conta para informar o endereço.';
}

function mudarQuantidade(posicao, quantidade) {
  let carrinho = pegarLista('carrinho');
  carrinho[posicao].quantidade += quantidade;
  if (carrinho[posicao].quantidade < 1) carrinho.splice(posicao, 1);
  salvarLista('carrinho', carrinho);
  mostrarCarrinho();
}

function finalizarPedido() {
  let usuario = usuarioLogado();
  let carrinho = pegarLista('carrinho');
  let pedidos = pegarLista('pedidos');
  if (!usuario) {
    alert('Entre na sua conta para finalizar o pedido.');
    return location.href = 'cadastro.html#login';
  }
  if (carrinho.length == 0) return alert('Seu carrinho está vazio.');
  pedidos.push({ numero: pedidos.length + 1, email: usuario.email, data: new Date().toLocaleString('pt-BR'), pagamento: document.querySelector('input[name="pagamento"]:checked').value, total: calcularTotal(carrinho), itens: carrinho });
  salvarLista('pedidos', pedidos);
  salvarLista('carrinho', []);
  alert('Pedido realizado com sucesso!');
  location.href = 'pedidos.html';
}

function mostrarPedidos() {
  let usuario = usuarioLogado();
  let lista = document.getElementById('listaPedidos');
  if (!usuario) return lista.innerHTML = vazio('Entre na sua conta para ver seus pedidos. <a href="cadastro.html#login" class="link">Entrar</a>');
  let texto = valor('buscaPedidos').toLowerCase();
  let html = '';
  for (let pedido of pegarLista('pedidos').reverse()) {
    let itens = '';
    let nomes = '';
    for (let item of pedido.itens) {
      itens += `<div class="pedido-item"><img src="${item.imagem}" alt="${item.nome}"><span>${item.quantidade}x ${item.nome}</span></div>`;
      nomes += item.nome.toLowerCase() + ' ';
    }
    if (pedido.email == usuario.email && (String(pedido.numero).includes(texto) || nomes.includes(texto))) html += `<div class="pedido">
      <div class="pedido-topo"><div><strong>Pedido #${pedido.numero}</strong><br><small>${pedido.data}</small></div><span class="status">Confirmado</span></div>
      <div class="pedido-itens">${itens}</div>
      <div class="pedido-rodape"><span>Pagamento: ${pedido.pagamento}</span><strong>Total: ${formatarPreco(pedido.total)}</strong></div></div>`;
  }
  lista.innerHTML = html || vazio('Nenhum pedido encontrado.');
}

function carregarPerfil() {
  let usuario = usuarioLogado();
  if (!usuario) return document.getElementById('perfil').innerHTML = vazio('Entre na sua conta para ver seu perfil. <a href="cadastro.html#login" class="link">Entrar</a>');
  document.getElementById('nomeUsuario').innerText = usuario.nome;
  document.getElementById('emailUsuario').innerText = usuario.email;
  document.getElementById('email').value = usuario.email;
  document.getElementById('cpf').value = usuario.cpf;
  for (let campo of camposPerfil) document.getElementById(campo).value = usuario[campo];
}

function salvarPerfil(evento) {
  evento.preventDefault();
  let usuarios = pegarLista('usuarios');
  let usuario = usuarios.find(u => u.email == localStorage.getItem('logado'));
  for (let campo of camposPerfil) usuario[campo] = valor(campo);
  usuario.uf = usuario.uf.toUpperCase();
  salvarLista('usuarios', usuarios);
  alert('Dados atualizados com sucesso!');
  location.reload();
}
