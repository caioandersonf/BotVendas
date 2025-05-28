const venom = require('venom-bot');
const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));

const catalogoEstado = {}; // { "numero@c.us": { pagina, produtos, filtrado: [], contexto: 'catalogo' } }
const estadoFinalizacao = {}; // { "numero@c.us": { etapa, carrinho, nome, cpf, tipoEntrega, endereco, pagamento, troco } }
const carrinhos = {}; // { "numero@c.us": [ { produto, quantidade } ] }
const estadoAdicaoCarrinho = {}; // { "numero@c.us": { produto } }
let numeroLoja = null; // ← agora é global

venom
  .create({ session: 'bot-vendas', multidevice: true })
  .then((client) => start(client))
  .catch((erro) => console.log('❌ Erro ao iniciar o bot', erro));

async function start(client) {
  console.log('✅ Bot iniciado com sucesso.');

  let dadosLoja = null;

  try {
    const host = await client.getHostDevice();
    numeroLoja = host?.id?.user; // ← agora salva globalmente
    if (!numeroLoja) return console.error('❌ Número do bot não encontrado no hostDevice.');
    console.log('📞 Número do bot:', numeroLoja);

    const res = await fetch(`http://localhost:5000/api/empresas/por-numero-bot/${numeroLoja}`);
    dadosLoja = await res.json();
    console.log(`🏪 Loja identificada: ${dadosLoja?.nome || 'Desconhecida'}`);
  } catch (err) {
    return console.error('❌ Erro ao buscar dados da loja:', err);
  }

  client.onMessage(async (message) => {
    if (!message.body || message.isGroupMsg) return;
    const texto = message.body.toLowerCase();

    if (estadoAdicaoCarrinho[message.from]) {
      const fila = estadoAdicaoCarrinho[message.from].fila || [];
      const qtd = parseInt(texto);

      // Validação da quantidade digitada
      if (isNaN(qtd) || qtd < 1) {
        await client.sendText(message.from, '❗ Por favor, digite uma *quantidade válida* (ex: 1, 2, 3...).');
        return;
      }

      const produto = fila.shift(); // pega o primeiro da fila

      if (!produto) {
        delete estadoAdicaoCarrinho[message.from];
        return;
      }

      const estoqueDisponivel = parseInt(produto.quantidade ?? 0);
      if (!carrinhos[message.from]) carrinhos[message.from] = [];

      const existente = carrinhos[message.from].find(p => p.produto.nome === produto.nome);
      const jaNoCarrinho = existente ? existente.quantidade : 0;
      const totalDesejado = qtd + jaNoCarrinho;

      // Validação do estoque
      if (totalDesejado > estoqueDisponivel) {
        await client.sendText(
          message.from,
          `🚫 Estoque insuficiente! Temos apenas *${estoqueDisponivel - jaNoCarrinho} unidade(s)* disponíveis de *${produto.nome}*.`
        );
        fila.unshift(produto); // devolve pra fila para tentar novamente
        return;
      }

      if (existente) {
        existente.quantidade += qtd;
      } else {
        carrinhos[message.from].push({ produto, quantidade: qtd });
      }

      const precoTotal = (parseFloat(produto.preco || 0) * qtd).toFixed(2);
      await client.sendText(message.from, `✅ *${produto.nome}* (${qtd}x) adicionado ao carrinho! 🛒\n💰 Total: R$ ${precoTotal}`);

      // Se ainda tem mais na fila, perguntar o próximo
      if (fila.length > 0) {
        const proximo = fila[0];
        await client.sendText(message.from, `📦 Quantas unidades de *${proximo.nome}* você deseja adicionar ao carrinho?`);
      } else {
        delete estadoAdicaoCarrinho[message.from];
        await client.sendText(message.from, '✅ Todos os produtos foram adicionados ao carrinho!');

        const menu = `👋 O que deseja fazer agora?

    1- 🛍️ Ver Catálogo de Produtos  
    2- 🛒 Ver Carrinho  
    3- 💬 Falar com um Atendente  
    4- ❌ Cancelar Atendimento

    Digite o número da opção ou envie o nome do produto para buscar diretamente.`;
        await client.sendText(message.from, menu);
      }

      return;
    }
  
    if (texto === 'oi') {
      const msg = `👋 Olá! Você está falando com o atendimento da *${dadosLoja?.nome || 'nossa loja'}*.
  
    Escolha uma opção para continuar:
    
    1- 🛍️ Ver Catálogo de Produtos  
    2- 🛒 Ver Carrinho  
    3- 💬 Falar com um Atendente  
    4- ❌ Cancelar Atendimento
    
    Você também pode digitar o nome, categoria, cor ou marca para buscar produtos diretamente.  
    Estamos aqui pra te ajudar! 🤖`;
      await client.sendText(message.from, msg);
      return;
    }
  
    if (texto === '1') {
      try {
        const res = await fetch(`http://localhost:5000/api/empresas/estoque/${dadosLoja.id}`);
        const produtos = await res.json();
  
        if (!Array.isArray(produtos) || produtos.length === 0) {
          return await client.sendText(message.from, '📦 Nenhum produto cadastrado no momento.');
        }
  
        const categorias = [...new Set(produtos.map(p => (p?.categoria || p?.tipo_produto || '').toLowerCase()).filter(Boolean))].join(', ') || 'Nenhuma categoria cadastrada';
        catalogoEstado[message.from] = { pagina: 1, produtos, filtrado: produtos, contexto: 'catalogo' };
  
        const resposta = montarResposta(produtos.slice(0, 5), 1) + `\n🧭 _Digite o nome, categoria, cor ou marca para filtrar._\n📚 Categorias disponíveis: ${categorias}\n↩️ Digite *voltar* para retornar ao menu.`;
        await client.sendText(message.from, resposta);
      } catch (err) {
        console.error('❌ Erro ao buscar catálogo:', err);
        await client.sendText(message.from, '❌ Ocorreu um erro ao buscar os produtos.');
      }
      return;
    }
  
    if (texto === '2') {
      const carrinho = carrinhos[message.from] || [];
      if (carrinho.length === 0) {
        await client.sendText(message.from, '🛒 Seu carrinho está vazio no momento.');
        return;
      }
    
      let resumo = '*🛍️ Itens no seu carrinho:*\n\n';
      let total = 0;
    
      carrinho.forEach((item, i) => {
        const nome = item.produto.nome;
        const preco = parseFloat(item.produto.preco || 0);
        const subtotal = (preco * item.quantidade).toFixed(2);
        total += parseFloat(subtotal);
    
        resumo += `*${i + 1}.* ${nome} - ${item.quantidade}x\n💰 Subtotal: R$ ${subtotal}\n\n`;
      });
    
      resumo += `💰 *Total geral:* R$ ${total.toFixed(2)}`;
      resumo += `\n\n🧾 *Digite "remover X"* para tirar um item (ex: remover 2).`;
      resumo += `\n✅ *Digite "finalizar"* para concluir seu pedido.`;
    
      await client.sendText(message.from, resumo);
      return;
    }    

    if (texto.startsWith('remover')) {
      const carrinho = carrinhos[message.from] || [];
      const index = parseInt(texto.replace(/[^0-9]/g, ''), 10);
    
      if (isNaN(index) || index < 1 || index > carrinho.length) {
        await client.sendText(message.from, '❌ Índice inválido. Verifique o número do item na lista do carrinho.');
        return;
      }
    
      const item = carrinho[index - 1];
    
      if (item.quantidade > 1) {
        item.quantidade -= 1;
        await client.sendText(message.from, `➖ Uma unidade de *${item.produto.nome}* foi removida. Agora restam ${item.quantidade} no carrinho.`);
      } else {
        carrinho.splice(index - 1, 1);
        await client.sendText(message.from, `🗑️ Produto *${item.produto.nome}* removido por completo do carrinho.`);
      }
    
      return;
    }    

    if (texto === 'finalizar') {
      const carrinho = carrinhos[message.from] || [];
      if (carrinho.length === 0) {
        await client.sendText(message.from, '⚠️ Seu carrinho está vazio. Adicione produtos antes de finalizar.');
        return;
      }
    
      estadoFinalizacao[message.from] = {
        etapa: 'nome',
        carrinho,
        telefone: message.from.replace('@c.us', '') //estado.telefone pra poder pegar e enviar pro BD
      };
    
      await client.sendText(message.from, '🧾 Para começar, informe seu *nome completo*.');
      return;
    }    

    if (estadoFinalizacao[message.from]) {
      const estado = estadoFinalizacao[message.from];

      switch (estado.etapa) {
        case 'nome':
          estado.nome = message.body;
          estado.etapa = 'cpf';
          await client.sendText(message.from, '🧾 Agora, informe seu *CPF* para emissão da nota fiscal.');
          break;

        case 'cpf':
          estado.cpf = message.body;
          estado.etapa = 'entrega_ou_retirada';
          await client.sendText(message.from, '📦 Deseja *entrega* ou *retirada*?');
          break;

        case 'entrega_ou_retirada':
          if (texto !== 'entrega' && texto !== 'retirada') {
            await client.sendText(message.from, '❗ Por favor, digite *entrega* ou *retirada*.');
            return;
          }

          estado.tipoEntrega = texto;

          if (texto === 'entrega') {
            estado.etapa = 'cidade';
            await client.sendText(message.from, '🏙️ Informe sua *cidade* para entrega.');
          } else {
            estado.endereco = {};
            estado.etapa = 'pagamento';
            await client.sendText(message.from, '💳 Qual será a forma de pagamento?\n*dinheiro*, *débito*, *crédito* ou *pix*?');
          }
          break;

        case 'cidade':
          estado.endereco = { cidade: message.body };
          estado.etapa = 'bairro';
          await client.sendText(message.from, '🏘️ Agora, informe o *bairro*.');
          break;

        case 'bairro':
          estado.endereco.bairro = message.body;
          estado.etapa = 'rua';
          await client.sendText(message.from, '🚏 Informe o *nome da rua*.');
          break;

        case 'rua':
          estado.endereco.rua = message.body;
          estado.etapa = 'numero';
          await client.sendText(message.from, '🔢 Informe o *número* da residência.');
          break;

        case 'numero':
          estado.endereco.numero = message.body;
          estado.etapa = 'complemento';
          await client.sendText(message.from, '📌 Tem algum *complemento*? Se não, digite "nenhum".');
          break;

        case 'complemento':
          estado.endereco.complemento = message.body;
          estado.etapa = 'pagamento';
          await client.sendText(message.from, '💳 Qual será a forma de pagamento?\n*dinheiro*, *débito*, *crédito* ou *pix*?');
          break;

        case 'pagamento':
          if (!['dinheiro', 'débito', 'credito', 'crédito', 'pix'].includes(texto)) {
            await client.sendText(message.from, '❗ Forma inválida. Escolha entre: *dinheiro*, *débito*, *crédito* ou *pix*.');
            return;
          }
          estado.pagamento = texto;

          if (texto === 'dinheiro') {
            estado.etapa = 'troco';
            await client.sendText(message.from, '💵 Precisa de troco para quanto? Se não precisar, digite "não".');
          } else {
            estado.troco = 'Não se aplica';
            estado.etapa = 'confirmar';
            const resumo = gerarResumoPedido(estado);
            await client.sendText(message.from, resumo + '\n\n✅ *Confirma os dados?* (responda com *sim* ou *não*)');
          }
          break;

        case 'troco':
          estado.troco = message.body;
          estado.etapa = 'confirmar';
          const resumoTroco = gerarResumoPedido(estado);
          await client.sendText(message.from, resumoTroco + '\n\n✅ *Confirma os dados?* (responda com *sim* ou *não*)');
          break;

        case 'confirmar':
          if (texto === 'sim') {
            await client.sendText(message.from, '📨 Pedido encaminhado para aprovação. Em instantes entraremos em contato!');
            await enviarPedidoParaBackend(message.from);

            // Aqui você pode integrar com o backend
            console.log('📝 Pedido confirmado:', estado);

            delete estadoFinalizacao[message.from];
          } else {
            await client.sendText(message.from, '❌ Pedido cancelado. Se quiser começar de novo, digite *finalizar* novamente.');
            delete estadoFinalizacao[message.from];
          }
          break;
      }

      return;
    }
  
    if (texto === '3') {
      await client.sendText(message.from, '💬 Um de nossos atendentes humanos irá te responder em breve. Por favor, aguarde ou envie sua dúvida!');
      return;
    }
  
    if (texto === '4') {
      delete catalogoEstado[message.from];
      delete carrinhos[message.from];
      await client.sendText(message.from, '❌ Atendimento cancelado. Se quiser voltar, digite *oi*.');
      return;
    }
  
    if (texto === 'mais') {
      const estado = catalogoEstado[message.from];
      if (!estado) return await client.sendText(message.from, '⚠️ Nenhum catálogo carregado. Digite *1* para começar.');
  
      const proximaPagina = estado.pagina + 1;
      const inicio = (proximaPagina - 1) * 5;
      const fim = proximaPagina * 5;
      const produtos = estado.filtrado.slice(inicio, fim);
  
      if (produtos.length === 0) return await client.sendText(message.from, '🚫 Não há mais produtos para mostrar.');
  
      const resposta = montarResposta(produtos, proximaPagina);
      catalogoEstado[message.from].pagina = proximaPagina;
      await client.sendText(message.from, resposta);
      return;
    }
  
    if (texto === 'voltar') {
      delete catalogoEstado[message.from];
      return await client.sendText(message.from, '↩️ Retornando ao menu principal. Digite *oi* para começar novamente.');
    }

        if ((texto.includes('quero') || texto.includes('adicionar')) && catalogoEstado[message.from]) {
      // AVISO para casos como: "quero 1 quero 2"
      if (texto.match(/(quero|adicionar)\s+\d+\s+(quero|adicionar)\s+\d+/) && !texto.includes(',')) {
        await client.sendText(message.from, '⚠️ Parece que você quer adicionar múltiplos produtos. Separe com *vírgula*, como: "quero 1, quero 2".');
        return;
      }

      const comandos = texto
        .split(',')
        .map(c => c.trim())
        .filter(c => c.match(/(quero|adicionar)\s+\d+/));

      const estado = catalogoEstado[message.from];

      if (comandos.length > 1) {
        for (const cmd of comandos) {
          const index = parseInt(cmd.replace(/[^0-9]/g, ''), 10);

          if (isNaN(index) || index < 1) {
            await client.sendText(message.from, `❌ Número inválido em "${cmd}". Use por exemplo: "quero 1" ou "adicionar 2".`);
            continue;
          }

          const paginaAtual = estado.pagina;
          const inicio = (paginaAtual - 1) * 5;
          const produto = estado.filtrado[inicio + index - 1];

          if (!produto) {
            await client.sendText(message.from, `❌ Produto ${index} não encontrado nesta página.`);
            continue;
          }

          if (!estadoAdicaoCarrinho[message.from]) {
            estadoAdicaoCarrinho[message.from] = { fila: [] };
          }

          estadoAdicaoCarrinho[message.from].fila.push(produto);
        }

        // Após adicionar todos, perguntar sobre o primeiro
        const fila = estadoAdicaoCarrinho[message.from].fila;
        if (fila.length > 0) {
          const primeiro = fila[0];
          await client.sendText(message.from, `📦 Quantas unidades de *${primeiro.nome}* você deseja adicionar ao carrinho?`);
        }

        return;
      }

      // CASO SEJA SOMENTE 1 COMANDO (quero 2)
      const index = parseInt(texto.replace(/[^0-9]/g, ''), 10);

      if (isNaN(index) || index < 1) {
        await client.sendText(message.from, '❌ Número inválido. Tente "quero 1" ou "adicionar 2".');
        return;
      }

      const paginaAtual = estado.pagina;
      const inicio = (paginaAtual - 1) * 5;
      const produto = estado.filtrado[inicio + index - 1];

      if (!produto) {
        await client.sendText(message.from, `❌ Produto ${index} não encontrado nesta página.`);
        return;
      }

      estadoAdicaoCarrinho[message.from] = { fila: [produto] };
      await client.sendText(message.from, `📦 Quantas unidades de *${produto.nome}* você deseja adicionar ao carrinho?`);
      return;
    }

    if (catalogoEstado[message.from]) {
      const estado = catalogoEstado[message.from];
      const termo = texto.toLowerCase();
    
      const filtrados = estado.produtos.filter(p => {
        const nome = (p.nome || '').toLowerCase();
        const categoria = (p.categoria || p.tipo_produto || '').toLowerCase();
        const cor = (p.cor || '').toLowerCase();
        const marca = (p.marca || '').toLowerCase();
        return nome.includes(termo) || categoria.includes(termo) || cor.includes(termo) || marca.includes(termo);
      });
    
      catalogoEstado[message.from].filtrado = filtrados;
      catalogoEstado[message.from].pagina = 1;
    
      if (filtrados.length === 0) {
        await client.sendText(message.from, `🔍 Nenhum produto encontrado com: "${texto}".`);
      } else {
        const resposta = montarResposta(filtrados.slice(0, 5), 1) + `\n↩️ Digite *voltar* para retornar ao menu anterior.`;
        await client.sendText(message.from, `🔎 Resultados para "${texto}":\n\n` + resposta);
      }
      return;
    }

    // 🔚 Fallback final: nenhuma das opções anteriores foi reconhecida
    await client.sendText(
      message.from,
      '❌ Comando não reconhecido. Por favor, escolha uma opção válida do menu digitando *oi* para começar'
    );
  });
} 

function gerarResumoPedido(estado) {
  const itens = estado.carrinho.map((item, i) => {
    const preco = parseFloat(item.produto.preco || 0);
    const subtotal = (preco * item.quantidade).toFixed(2);
    return `*${i + 1}.* ${item.produto.nome} - ${item.quantidade}x | 💰 Subtotal: R$ ${subtotal}`;
  }).join('\n');

  const total = estado.carrinho.reduce((sum, item) => {
    return sum + parseFloat(item.produto.preco || 0) * item.quantidade;
  }, 0).toFixed(2);

  const endereco = estado.tipoEntrega === 'entrega'
    ? `📍 *Endereço:* ${estado.endereco.rua}, ${estado.endereco.numero} - ${estado.endereco.bairro}, ${estado.endereco.cidade}\n📌 *Complemento:* ${estado.endereco.complemento}`
    : '🏬 *Retirada na loja*';

  return `📋 *Resumo do Pedido:*\n\n👤 *Nome:* ${estado.nome}\n🧾 *CPF:* ${estado.cpf}\n🚚 *Tipo:* ${estado.tipoEntrega}\n${endereco}\n\n💳 *Pagamento:* ${estado.pagamento}\n💵 *Troco:* ${estado.troco}\n\n🛒 *Itens:*\n${itens}\n\n💰 *Total:* R$ ${total}`;
}

function montarResposta(produtos, pagina) {
  let resposta = `🛍️ *Catálogo de Produtos (página ${pagina}):*\n\n`;
  produtos.forEach((p, i) => {
    const preco = parseFloat(p.preco || 0).toFixed(2);
    const nome = p.nome || 'Produto';
    const marca = p.marca ?? '-';
    const tamanho = p.tamanho ?? '-';
    const cor = p.cor ?? '-';
    const qtd = p.quantidade ?? 0;

    resposta += `*${i + 1}.* ${nome} (${marca})\n🧵 *Tamanho:* ${tamanho} | 🎨 *Cor:* ${cor}\n💰 *Preço:* R$ ${preco}\n📦 *Estoque:* ${qtd}\n\n`;
  });
  resposta += '_Digite *quero 1*, *quero 2* ou *adicionar 3* para selecionar um produto._';
  resposta += '\n_Você também pode selecionar *vários produtos* de uma vez separando por vírgula (ex: quero 1, quero 2)._';
  resposta += '\n_Digite *mais* para ver outros produtos._';
  return resposta;
}

async function enviarPedidoParaBackend(numeroCliente) {
  const pedido = estadoFinalizacao[numeroCliente];
  if (!pedido || !pedido.carrinho || pedido.carrinho.length === 0) {
    console.log("⚠️ Pedido incompleto ou carrinho vazio.");
    return;
  }

  const payload = {
    numero_bot: numeroLoja,
    cliente: {
      nome: pedido.nome,
      cpf: pedido.cpf,
      telefone: numeroCliente.replace('@c.us', '')
    },
    entrega: {
      tipo: pedido.tipoEntrega,
      cidade: pedido.endereco?.cidade || "",
      bairro: pedido.endereco?.bairro || "",
      rua: pedido.endereco?.rua || "",
      numero: pedido.endereco?.numero || "",
      complemento: pedido.endereco?.complemento || ""
    },
    pagamento: {
      forma: pedido.pagamento,
      troco: pedido.troco || null
    },
    produtos: pedido.carrinho.map(item => ({
      nome: item.produto.nome,
      quantidade: item.quantidade,
      preco: item.produto.preco
    })),
    observacao: pedido.observacao || ''
  };

  try {
    const resposta = await fetch("http://localhost:3000/api/pedidos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    if (resposta.ok) {
      console.log("✅ Pedido enviado com sucesso ao backend!");
    } else {
      console.error("❌ Erro ao enviar pedido:", await resposta.text());
    }
  } catch (err) {
    console.error("❌ Erro de rede ao enviar pedido:", err);
  }
}