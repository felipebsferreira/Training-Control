# Deploy no Hostinger

Este projeto está hospedado no plano **Unlimited** do Hostinger, domínio `trainingcontrol.mokusai.com.br`. O backend é implantado pelo produto de **Node.js via Git** do hPanel (import direto do GitHub — não é o "Node.js Selector" clássico do cPanel, nem uma VPS); o frontend é buildado localmente e copiado manualmente para `public_html` pelo Gerenciador de Arquivos.

Este documento serve tanto de referência para reimplantar este projeto quanto de checklist geral para qualquer app Node.js+Prisma+MySQL nesse mesmo produto do Hostinger — várias das peculiaridades abaixo são da infraestrutura deles, não deste código específico.

## Arquitetura do deploy

```
GitHub (main) ──push──> hPanel Node.js App ──deploy──> .builds/versions/<uuid>/nodejs/
                                                          (cópia isolada de backend/, recriada a cada deploy)

frontend/dist (build local) ──upload manual──> public_html/
                                                  (backend aponta pra cá via FRONTEND_DIST_PATH)

MySQL remoto (hPanel → Bancos de Dados) <── DATABASE_URL
```

O backend serve a própria API (`/api/*`) e, em produção, também os arquivos estáticos do frontend a partir de `FRONTEND_DIST_PATH` (ver `backend/src/app.js`) — não existe um Nginx separado dividindo as rotas nesse plano, então o Express faz os dois papéis.

## Passo a passo

### 1. Backend — conectar o app Node.js ao GitHub

No hPanel: **Node.js → Criar aplicação → conectar repositório Git**.

- **Diretório raiz**: `backend`
- **Configuração predefinida**: Express
- **Arquivo de entrada**: `deploy-entry.js` (não `src/server.js` diretamente — ver por quê na seção de detalhes técnicos abaixo)
- **Gerenciador de pacotes**: npm

Variáveis de ambiente (seção de env vars do app Node.js):

```
NODE_ENV=production
DATABASE_URL=mysql://<usuario>:<senha>@<ip-publico-do-banco>:3306/<banco>?connection_limit=3&pool_timeout=10
JWT_SECRET=<string aleatória longa>
FRONTEND_URL=https://trainingcontrol.mokusai.com.br
FRONTEND_DIST_PATH=/home/<user-id>/domains/trainingcontrol.mokusai.com.br/public_html
```

Depois de configurar, faça o deploy inicial. `deploy-entry.js` instala as dependências e gera o Prisma Client sozinho durante o boot — não precisa rodar `npm install` manualmente.

### 2. Banco de dados

1. Crie o banco e o usuário MySQL em hPanel → Bancos de Dados → MySQL Databases.
2. Em **MySQL Remoto**, adicione `%` (qualquer host) à lista de acesso — o container do app não conecta nem por `localhost` nem passa pelo IP que normalmente seria liberado para acesso externo comum; sem isso a autenticação falha mesmo com credenciais corretas (ver detalhes técnicos, item 5).
3. Rode as migrations **da sua máquina local**, apontando pro banco remoto:
   ```bash
   DATABASE_URL="mysql://<usuario>:<senha>@<ip-publico>:3306/<banco>" npx prisma migrate deploy --schema backend/prisma/schema.prisma
   ```
   (`prisma migrate dev` não roda de forma não-interativa — ver `CLAUDE.md` para o fluxo de migration manual quando precisar.)

### 3. Frontend — build local + upload manual

```bash
npm run build -w frontend
```

Isso gera `frontend/dist/`. Copie o **conteúdo** dessa pasta (não a pasta em si) para `public_html` via Gerenciador de Arquivos do hPanel. Repita isso a cada mudança no frontend — não há build automático desse lado.

### 4. Após qualquer mudança de variável de ambiente

Clicar em **Restart** não é suficiente — o app continua servindo o snapshot antigo das variáveis. É preciso fazer um **redeploy** completo (novo deploy a partir do Git) para que a mudança tenha efeito. Isso foi confirmado observando o app continuar reportando o valor antigo de `DATABASE_URL` após várias trocas + Restart, só mudando de fato após um deploy novo.

## Detalhes técnicos e armadilhas conhecidas

1. **Diretório isolado e recriado a cada deploy.** Com "Diretório raiz: backend", o hPanel copia só o conteúdo de `backend/` para `.builds/versions/<uuid>/nodejs/` — sem a pasta `frontend/` ao lado, sem `node_modules` pré-instalado (nem dependências normais, nem dev). É por isso que `deploy-entry.js` roda `npm install` e `npx prisma generate` sozinho, restrito ao próprio diretório.

2. **`lsnode.js` (OpenLiteSpeed) carrega o arquivo de entrada via `require()`, não `import()`.** Um módulo ESM com `await` no nível superior quebra com `ERR_REQUIRE_ASYNC_MODULE`. `deploy-entry.js` faz um `import("./src/server.js")` dinâmico e **sem `await`** propositalmente — é essa a razão de existir um arquivo de entrada separado em vez de apontar direto pro `server.js`.

3. **`npm`/`npx` não são resolvíveis via `PATH`** quando chamados com `execSync` a partir do processo Node desse host (falha instantânea, sem saída nenhuma — mesmo funcionando normalmente por SSH na mesma conta). `deploy-entry.js` resolve os dois a partir de `path.dirname(process.execPath)` (são sempre irmãos do binário `node` em execução) em vez de confiar no `PATH`.

4. **Mudança de variável de ambiente exige redeploy, não só Restart** (detalhado no passo 4 acima).

5. **Remote MySQL bloqueia a conexão de saída do próprio app**, mesmo ele rodando "dentro" da mesma conta Hostinger do banco. Nem `localhost` nem o IP público do banco funcionaram até liberar `%` em MySQL Remoto. O erro do Prisma (`Authentication failed`) é idêntico tanto para credencial errada quanto para IP não liberado — se as credenciais já foram confirmadas corretas por fora (ex: testando com um client MySQL direto da sua máquina), o próximo suspeito é sempre a whitelist, não a senha. Vale considerar restringir de `%` para um IP/faixa específica depois, se o suporte Hostinger conseguir informar o IP de saída real desse produto — `%` deixa a porta 3306 exposta pra internet, protegida só pela senha.

6. **`PrismaClientRustPanicError: PANIC: timer has gone away`** — bug conhecido do engine Rust/Tokio do Prisma, ligado a hospedagens que suspendem/congelam o processo Node quando ocioso (comportamento comum em planos compartilhados). Quando o processo "descongela", o timer interno do pool de conexões perde a referência de tempo e o engine entra em panic na primeira query. Resolvido adicionando `?connection_limit=3&pool_timeout=10` na `DATABASE_URL`, o que mantém o pool pequeno e recicla conexões ociosas rápido em vez de reaproveitar uma que pode ter "acordado" quebrada. Se voltar a acontecer, o próximo recurso é `engineType = "binary"` no bloco `generator client` do `schema.prisma` (roda o engine como processo filho separado) — não testado neste projeto, não foi necessário.

7. **Senha do banco só com caracteres alfanuméricos.** Uma senha com caracteres especiais percent-encoded (`%3F`, `%3D` etc.) produziu uma inconsistência entre o tamanho reportado pela `URL` nativa do Node e o esperado — nunca totalmente diagnosticado, mas some ao usar uma senha só alfanumérica. Mais simples evitar caracteres especiais na senha do banco do que investigar a fundo.
