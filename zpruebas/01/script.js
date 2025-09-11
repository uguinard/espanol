const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
if (!SpeechRecognition) {
    alert("Tu navegador no soporta el reconocimiento de voz. Por favor, usa Google Chrome.");
}

// --- BASE DE DATOS DE AGENTES VÁLIDOS ---
const VALID_AGENTS = [
    { name: "pingüino valiente", code: "pe uno uve nueve seis jota" },
    { name: "jirafa risueña", code: "jota tres ere cuatro uno ge" },
    { name: "tigre silencioso", code: "te siete ese dos ocho te" },
    { name: "delfín curioso", code: "de cero ce cinco tres ene" },
    { name: "koala dormilón", code: "ka seis de uno siete ele" },
    { name: "loro hablador", code: "ele dos hache cinco cuatro ere" },
    { name: "zorro astuto", code: "zeta nueve a uno cero o" },
    { name: "búho nocturno", code: "be dos ene seis cinco hache" },
    { name: "panda mimoso", code: "pe cuatro eme ocho tres a" },
    { name: "cebra veloz", code: "ce siete uve dos nueve a" }
];

const CHARACTERS_DATA = {
    'charA': {
        codename: "Agente Alfa", name: "Vanesa", gender: "female", age: 29, language: "Español e inglés",
        origin: "España", residence: "Madrid", img: "https://i.pravatar.cc/150?u=vanesa",
        responses: { name: "Mi nombre real es Vanesa.", age: "Tengo veintinueve años.", language: "Hablo español e inglés con fluidez.", origin: "Soy originaria de España.", residence: "Actualmente vivo en Madrid." }
    },
    'charB': {
        codename: "Agente Beta", name: "Pedro", gender: "male", age: 34, language: "Español y portugués",
        origin: "México", residence: "Ciudad de México", img: "https://i.pravatar.cc/150?u=pedro",
        responses: { name: "Me llamo Pedro, un placer.", age: "Acabo de cumplir treinta y cuatro años.", language: "Domino el español y el portugués.", origin: "Vengo de México.", residence: "Mi residencia está en Ciudad de México." }
    },
    'charC': {
        codename: "Agente Gamma", name: "María", gender: "female", age: 31, language: "Español y francés",
        origin: "Colombia", residence: "Bogotá", img: "https://i.pravatar.cc/150?u=maria",
        responses: { name: "Puedes llamarme María.", age: "Tengo treinta y un años.", language: "Mis idiomas son el español y el francés.", origin: "Soy de Colombia.", residence: "Resido en Bogotá." }
    }
};
const KEYWORD_MAP = {
    name: ['nombre', 'llamas', 'llamo', 'quién eres'], age: ['edad', 'años', 'cuántos'], language: ['idioma', 'lengua', 'hablas'],
    origin: ['origen', 'dónde eres', 'vienes', 'país'], residence: ['vives', 'residencia', 'dónde vives']
};

const dom = {
    identificationScreen: document.getElementById('identification-screen'), gameContainer: document.getElementById('game-container'),
    authStatus: document.getElementById('auth-status'), startAuthBtn: document.getElementById('start-auth-btn'),
    charactersContainer: document.getElementById('characters-container'), recordBtn: document.getElementById('record-btn'),
    statusText: document.getElementById('status-text'), transcriptText: document.getElementById('transcript-text'),
    dossierFields: {
        codename: document.getElementById('dossier-codename'), name: document.getElementById('dossier-name'), age: document.getElementById('dossier-age'),
        language: document.getElementById('dossier-language'), origin: document.getElementById('dossier-origin'), residence: document.getElementById('dossier-residence')
    }
};

let gameState = { mode: 'identification', authenticated: false, selectedCharId: null, interviewActive: false };
let recognition = new SpeechRecognition();
let voices = [];

const synth = window.speechSynthesis;
function loadVoices() { voices = synth.getVoices(); }
loadVoices();
if (synth.onvoiceschanged !== undefined) { synth.onvoiceschanged = loadVoices; }

function speak(text, gender, onEndCallback) {
    if (synth.speaking) synth.cancel();
    const utterThis = new SpeechSynthesisUtterance(text);
    let targetVoice = null;
    if (gender === 'male') {
        targetVoice = voices.find(v => v.lang === 'es-ES' && v.name.includes('Google'));
    } else {
        targetVoice = voices.find(v => v.lang === 'es-US' && v.name.includes('Google'));
    }
    utterThis.voice = targetVoice || voices.find(v => v.lang.startsWith('es-'));
    utterThis.lang = utterThis.voice ? utterThis.voice.lang : 'es-ES';
    if (onEndCallback) utterThis.onend = onEndCallback;
    synth.speak(utterThis);
}

function initGame() {
    setupRecognition();
    dom.startAuthBtn.onclick = () => {
        recognition.start();
        dom.startAuthBtn.disabled = true;
        dom.startAuthBtn.textContent = "ESCUCHANDO...";
    };
}

function setupRecognition() {
    recognition.lang = 'es-ES';
    recognition.continuous = true;
    recognition.interimResults = false;

    recognition.onstart = () => {
        if (gameState.mode === 'identification') {
            dom.authStatus.textContent = "Escuchando... ¡Habla ahora!";
            dom.authStatus.classList.add('listening');
        }
    };
    
    recognition.onresult = (event) => {
        let finalTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
            if (event.results[i].isFinal) finalTranscript += event.results[i][0].transcript;
        }
        if (finalTranscript.trim()) {
            if (gameState.mode === 'identification') {
                processIdentification(finalTranscript.toLowerCase().trim());
            } else if (gameState.interviewActive) {
                dom.transcriptText.textContent = `Has dicho: "${finalTranscript.trim()}"`;
                processTranscript(finalTranscript.toLowerCase().trim());
            }
        }
    };
    
    recognition.onend = () => {
        if ((gameState.mode === 'identification' && !gameState.authenticated) || (gameState.mode === 'interrogation' && gameState.interviewActive)) {
            try { recognition.start(); } catch(e) { /* Evita errores si se detiene manualmente */ }
        }
    };
    
    recognition.onerror = (event) => {
        let errorMsg = "Error de micrófono. Refresca la página.";
        if (event.error === 'not-allowed') {
            errorMsg = "Permiso de micrófono denegado. Habilítalo en los ajustes de tu navegador.";
        }
         if (gameState.mode === 'identification') {
            dom.authStatus.textContent = errorMsg;
            dom.startAuthBtn.disabled = false;
            dom.startAuthBtn.textContent = "COMENZAR IDENTIFICACIÓN";
        } else {
            dom.statusText.textContent = errorMsg;
        }
    };
}

function processIdentification(transcript) {
    let isAuthenticated = false;
    let agentName = "";

    const cleanedTranscript = transcript.replace(/[^a-z0-9ñ\s]/g, '');

    for (const agent of VALID_AGENTS) {
        if (cleanedTranscript.includes(agent.name) && cleanedTranscript.includes(agent.code)) {
            isAuthenticated = true;
            agentName = agent.name.split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
            break;
        }
    }

    if (isAuthenticated) {
        gameState.authenticated = true;
        recognition.stop();
        dom.authStatus.textContent = `IDENTIDAD CONFIRMADA: ${agentName}`;
        
        const welcomeMessage = `Bienvenido, Agente ${agentName}. Su misión comienza ahora.`;
        speak(welcomeMessage, 'female', () => {
            dom.identificationScreen.style.display = 'none';
            dom.gameContainer.classList.remove('hidden');
            startInterrogationMode();
        });
    } else {
        dom.authStatus.textContent = "CREDENCIALES INVÁLIDAS. INTÉNTELO DE NUEVO.";
        speak("Identificación denegada. Las credenciales no coinciden. Vuelve a intentarlo.", 'female');
    }
}

function startInterrogationMode() {
    gameState.mode = 'interrogation';
    Object.keys(CHARACTERS_DATA).forEach(charId => {
        const char = CHARACTERS_DATA[charId];
        const card = document.createElement('div');
        card.className = 'character-card';
        card.id = charId;
        card.innerHTML = `<img src="${char.img}" alt="${char.codename}"><span class="character-codename">${char.codename}</span>`;
        card.onclick = () => selectCharacter(charId);
        dom.charactersContainer.appendChild(card);
    });
    dom.recordBtn.onclick = toggleInterview;
}

function selectCharacter(charId) {
    if (gameState.interviewActive) return;
    gameState.selectedCharId = charId;
    document.querySelectorAll('.character-card').forEach(c => c.classList.remove('selected'));
    document.getElementById(charId).classList.add('selected');
    clearDossier();
    dom.dossierFields.codename.textContent = CHARACTERS_DATA[charId].codename;
    dom.dossierFields.codename.classList.add('filled');
    
    const intro = `Agente ${CHARACTERS_DATA[charId].codename} presentándose. Estoy listo para el interrogatorio.`;
    dom.statusText.textContent = "Presiona 'Iniciar' para comenzar.";
    speak(intro, CHARACTERS_DATA[charId].gender);
}

function clearDossier() { Object.values(dom.dossierFields).forEach(field => { field.textContent = ''; field.classList.remove('filled'); }); }

function toggleInterview() {
    if (!gameState.selectedCharId) {
        dom.statusText.textContent = "¡Primero debes seleccionar un agente!";
        return;
    }
    gameState.interviewActive = !gameState.interviewActive;
    if (gameState.interviewActive) {
        dom.recordBtn.textContent = "Terminar Interrogatorio";
        dom.recordBtn.classList.add('listening');
        dom.statusText.textContent = "Micrófono activado. ¡Pregunta!";
        recognition.start();
    } else {
        dom.recordBtn.textContent = "Iniciar Interrogatorio";
        dom.recordBtn.classList.remove('listening');
        dom.statusText.textContent = "Interrogatorio terminado.";
        recognition.stop();
        synth.cancel();
    }
}

function processTranscript(transcript) {
    const character = CHARACTERS_DATA[gameState.selectedCharId];
    
    for (const field in KEYWORD_MAP) {
        if (KEYWORD_MAP[field].some(keyword => transcript.includes(keyword))) {
            const value = character[field];
            const response = character.responses[field];
            
            if (dom.dossierFields[field].classList.contains('filled')) {
                speak(`Ya te he dado esa información. Pregúntame otra cosa.`, character.gender);
                return;
            }
            
            fillDossierField(field, value.toString());
            const followUpPrompt = () => {
                if (isDossierComplete()) {
                    speak("Expediente completo. Excelente trabajo, agente.", character.gender);
                    toggleInterview();
                } else {
                    speak("¿Cuál es tu siguiente pregunta?", character.gender);
                }
            };
            speak(response, character.gender, followUpPrompt);
            return;
        }
    }
    speak("No entendí la pregunta. ¿Puedes reformularla?", character.gender);
}

function fillDossierField(field, value) {
    const fieldEl = dom.dossierFields[field];
    if (fieldEl.classList.contains('filled')) return;
    fieldEl.textContent = value;
    fieldEl.classList.add('filled');
    dom.statusText.textContent = `Dato confirmado: ${field.toUpperCase()}`;
}

function isDossierComplete() {
    return Object.keys(dom.dossierFields).every(field => field === 'codename' || dom.dossierFields[field].classList.contains('filled'));
}

document.addEventListener('DOMContentLoaded', initGame);
