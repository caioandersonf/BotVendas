const venom = require('venom-bot');
const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));

const catalogoEstado = {}; // { "numero@c.us": { pagina, produtos, filtrado: [], contexto: 'catalogo' } }

venom
  .create({ session: 'bot-vendas', multidevice: true })
  .then((client) => start(client))
  .catch((erro) => console.log('❌ Erro ao iniciar o bot', erro));

async function start(client) {
  console.log('✅ Bot iniciado com sucesso.');

  let dadosLoja = null;

  try {
    const host = await client.getHostDevice();
    const numeroLimpo = host?.id?.user;
    if (!numeroLimpo) return console.error('❌ Número do bot não encontrado no hostDevice.');
    console.log('📞 Número do bot:', numeroLimpo);

    const res = await fetch(`http://localhost:5000/api/empresas/por-numero-bot/${numeroLimpo}`);
    dadosLoja = await res.json();
    console.log(`🏪 Loja identificada: ${dadosLoja?.nome || 'Desconhecida'}`);
  } catch (err) {
    return console.error('❌ Erro ao buscar dados da loja:', err);
  }

  client.onMessage(async (message) => {
    if (!message.body || message.isGroupMsg) return;
    const texto = message.body.toLowerCase();

    if (texto === 'oi') {
      const msg = `👋 Olá! Você está falando com o atendimento da *${dadosLoja?.nome || 'nossa loja'}*.

Digite:
*1*️⃣ Catálogo de Produtos
*2*️⃣ Cancelar Atendimento

Digite o nome, categoria, cor ou marca para buscar produtos diretamente.

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

      if (filtrados.length === 0) {
        await client.sendText(message.from, `🔍 Nenhum produto encontrado com: "${texto}".`);
      } else {
        catalogoEstado[message.from].filtrado = filtrados;
        catalogoEstado[message.from].pagina = 1;

        const resposta = montarResposta(filtrados.slice(0, 5), 1) + `\n↩️ Digite *voltar* para retornar ao menu anterior.`;
        await client.sendText(message.from, `🔎 Resultados para "${texto}":\n\n` + resposta);
      }
      return;
    }
  });
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
  resposta += '_Digite *mais* para ver outros produtos._';
  return resposta;
}
