# Awesome Keylogger

Uma aplicação CLI Node.js que registra a atividade de digitação localmente enquanto o programa estiver em execução.

## 🛡️ IMPORTANTE: CONFIGURAÇÃO DO ANTIVÍRUS

**ATENÇÃO**: Keyloggers são frequentemente detectados como malware por antivírus, mesmo quando usados legitimamente. Para usar esta ferramenta:

### Windows Defender
1. Abra **Windows Security** → **Proteção contra vírus e ameaças**
2. Clique em **Gerenciar configurações** em "Configurações de proteção contra vírus e ameaças"
3. Role até **Exclusões** e clique em **Adicionar ou remover exclusões**
4. Clique em **Adicionar uma exclusão** → **Pasta**
5. Selecione a pasta `c:\Awesome-keylogger`

### Outros Antivírus
- **Avast/AVG**: Configurações → Exceções → Adicionar pasta
- **Norton**: Configurações → Antivírus → Exclusões → Configurar
- **McAfee**: Configurações → Verificação em tempo real → Arquivos excluídos

⚠️ **Importante**: Só adicione exceções se você confia na origem do código e entende os riscos.

## ⚠️ AVISO LEGAL E ÉTICO

**IMPORTANTE**: Esta ferramenta deve ser usada apenas com consentimento explícito e para fins legítimos:

- ✅ **Use para**: Monitorar sua própria atividade de digitação, análise de produtividade pessoal, estudos de comportamento próprio
- ❌ **NÃO use para**: Capturar senhas, dados de terceiros sem consentimento, espionagem, atividades ilegais
- 🔒 **Privacidade**: Todos os dados são armazenados localmente no seu computador
- 📝 **Transparência**: O programa só funciona enquanto estiver visível e ativo no terminal

**O usuário é totalmente responsável pelo uso ético e legal desta ferramenta.**

## Características

- 🌐 **Captura global**: Funciona em todo o sistema operacional (requer permissões)
- 🪟 **Rastreamento de janela ativa**: Captura informações da aplicação e janela onde você está digitando
- ⏱️ **Agrupamento por minuto**: Organiza a digitação em intervalos de 1 minuto
- 📅 **Arquivos diários**: Cria um arquivo separado para cada dia
- 🔄 **Tempo real**: Exibe as linhas no console conforme são gravadas
- 🛡️ **Saída limpa**: Pressione Ctrl+C para finalizar com segurança
- 📝 **Logs de sessão**: Registra início e fim de cada sessão
- 🎯 **Captura avançada**: Utiliza biblioteca `node-global-key-listener` para captura global
- 🔍 **Separação clara**: Distingue visualmente entre aplicação e texto digitado nos logs

## Requisitos

- Node.js >= 14.0.0
- Sistema operacional: Windows, macOS, Linux
- Permissões de administrador (para captura global de teclas)
- Dependências: `@futpib/node-global-key-listener`, `active-win`

## Instalação

1. Clone ou baixe este repositório:
```bash
git clone <url-do-repositorio>
cd awesome-keylogger
```

2. Instale as dependências:
```bash
npm install
```

## Uso

### Execução básica

```bash
node index.js
```

### Exemplo de uso

```bash
$ node index.js
🎯 Awesome Keylogger - Captura Global de Teclas Ativada
⚠️  ATENÇÃO: Este programa capturará TODAS as teclas digitadas no sistema!
📝 Use apenas para fins legítimos e com consentimento apropriado.
🛑 Para parar: Pressione Ctrl+C no terminal ou feche esta janela.

Pressione ENTER para dar consentimento e iniciar a captura, ou Ctrl+C para cancelar.
[ENTER]
✅ Captura iniciada! Todas as teclas serão registradas.

18/09/2025 - 09:51:00 - teste corrigido

Finalizando logger...
Logger finalizado.
```

## Formato dos Arquivos

### Localização
Os arquivos são salvos no diretório `typing_logs/` com o formato:
```
typing_logs/typing_log_YYYY-MM-DD.txt
```

### Formato das linhas
```
--- Sessão iniciada em DD/MM/YYYY - HH:MM:SS ---
DD/MM/YYYY - HH:MM:00 - [Aplicação] Título da Janela → texto digitado
DD/MM/YYYY - HH:MM:00 - [Aplicação] Título → texto | [Nova App] Novo Título → mais texto
--- Sessão finalizada em DD/MM/YYYY - HH:MM:SS ---
```

**Legenda do formato:**
- `[Aplicação]`: Nome do programa onde você está digitando
- `Título da Janela`: Título da janela ativa
- `→`: Indica o início do texto digitado
- `|`: Separa diferentes aplicações no mesmo minuto

### Exemplo de arquivo
```
--- Sessão iniciada em 17/09/2025 - 18:44:58 ---
17/09/2025 - 18:45:00 - [Chrome] Google Search → pesquisar keylogger nodejs
17/09/2025 - 18:46:00 - [Chrome] Google Search → tutorial | [VSCode] index.js → function processKey
17/09/2025 - 18:47:00 - [VSCode] index.js → console.log('teste') | [Terminal] PowerShell → node index.js
--- Sessão finalizada em 17/09/2025 - 18:47:12 ---
```

**Explicação do exemplo:**
- **18:45**: Usuário digitou "pesquisar keylogger nodejs" no Google Chrome
- **18:46**: Começou digitando no Chrome, depois mudou para VSCode e digitou código
- **18:47**: Continuou no VSCode, depois mudou para o Terminal e executou comando

## Funcionalidades

### Captura de janela ativa
- **Detecção automática**: Identifica automaticamente qual aplicação e janela está ativa
- **Informações capturadas**: Nome da aplicação (ex: Chrome, VSCode, Notepad) e título da janela
- **Separação visual**: Usa símbolos `→` e `|` para distinguir aplicação do texto digitado
- **Transições**: Registra quando você muda de uma aplicação para outra

### Tratamento de teclas especiais
- **Enter**: Convertido em espaço
- **Backspace**: Remove o último caractere digitado
- **Ctrl+C**: Finaliza o programa com segurança
- **Caracteres de controle**: Ignorados (exceto os mencionados acima)

### Normalização de texto
- Espaços múltiplos são compactados em um só
- Espaços no início e fim são removidos
- Linhas vazias (após normalização) não são gravadas

### Mudança de dia
- Automaticamente cria novo arquivo quando muda de dia
- Finaliza a sessão no arquivo anterior
- Inicia nova sessão no novo arquivo

## Configuração

Você pode modificar as configurações no início do arquivo `index.js`:

```javascript
const CONFIG = {
    LOG_DIR: 'typing_logs',        // Diretório dos logs
    FILE_PREFIX: 'typing_log_',    // Prefixo dos arquivos
    DEBUG: false,                  // Modo debug (true/false)
    GLOBAL_CAPTURE: true           // Captura global (true/false)
};
```

## Segurança e Privacidade

### O que a aplicação FAZ:
- ✅ Captura teclas globalmente em todo o sistema
- ✅ Identifica aplicação e janela ativa onde você está digitando
- ✅ Armazena dados localmente no seu computador
- ✅ Funciona enquanto o programa estiver em execução
- ✅ Permite saída limpa a qualquer momento (Ctrl+C)
- ✅ Agrupa digitação por minutos para melhor organização
- ✅ Separa visualmente aplicação do texto digitado nos logs

### O que a aplicação NÃO FAZ:
- ❌ Não envia dados para servidores externos
- ❌ Não se inicia automaticamente com o sistema
- ❌ Não roda como serviço em background (após fechar o terminal)
- ❌ Não captura senhas de forma oculta (sempre visível no terminal)
- ❌ Não instala hooks permanentes no sistema

## Solução de Problemas

### Erro de permissão de escrita
```
Erro ao criar diretório de logs: EACCES: permission denied
```
**Solução**: Execute o programa em um diretório onde você tenha permissão de escrita.

### Terminal não responde
```
O terminal parece travado após Ctrl+C
```
**Solução**: Pressione Ctrl+C novamente ou feche o terminal e abra um novo.

### Arquivo não é criado
```
Nenhum arquivo aparece na pasta typing_logs
```
**Solução**: Certifique-se de que você digitou algo e esperou pelo menos um minuto completo.

## Desenvolvimento

### Estrutura do projeto
```
awesome-keylogger/
├── index.js                  # Arquivo principal
├── package.json             # Configurações do projeto
├── package-lock.json        # Lock das dependências
├── README.md               # Este arquivo
└── typing_logs/            # Diretório dos logs (criado automaticamente)
    └── typing_log_YYYY-MM-DD.txt
```

### Testando

1. Execute o programa:
```bash
node index.js
```

2. Pressione ENTER para dar consentimento

3. Digite em qualquer aplicação e espere 1-2 minutos

4. Pressione Ctrl+C no terminal para finalizar

5. Verifique o arquivo criado em `typing_logs/`

## Licença

MIT License - Veja o arquivo LICENSE para detalhes.

## Contribuição

Contribuições são bem-vindas! Por favor:

1. Faça um fork do projeto
2. Crie uma branch para sua feature
3. Commit suas mudanças
4. Push para a branch
5. Abra um Pull Request

## Suporte

Se encontrar problemas ou tiver sugestões, abra uma issue no repositório do projeto.

---

**Lembre-se: Use esta ferramenta de forma ética e responsável!**