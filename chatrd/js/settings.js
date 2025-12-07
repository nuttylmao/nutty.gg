let streamerBotClient = null
let streamerBotConnected = false;
let kickWebSocket = null;
let tikfinityWebSocket = null;
let speakerBotClient = null;




/* -------------------------
   Salvar configurações no localStorage
-------------------------- */
function saveSettingsToLocalStorage() {
    const checkboxes = document.querySelectorAll("input[type=checkbox]:not(.avoid)");
    const textfields = document.querySelectorAll("input[type=text]:not(.avoid)");
    const numberfields = document.querySelectorAll("input[type=number]:not(.avoid)");
    const colorfields = document.querySelectorAll("input[type=color]:not(.avoid)");
    const selects = document.querySelectorAll("select:not(.avoid)");
    const ranges = document.querySelectorAll("input[type=range]:not(.avoid)");
    const settings = {};

    checkboxes.forEach(cb => settings[cb.name] = cb.checked);
    ranges.forEach(r => settings[r.name] = r.value);
    textfields.forEach(tf => settings[tf.name] = tf.value);
    numberfields.forEach(nf => settings[nf.name] = nf.value);
    colorfields.forEach(cf => settings[cf.name] = cf.value);
    selects.forEach(s => settings[s.name] = s.value);

    localStorage.setItem("chatrdWidgetSettings", JSON.stringify(settings));

    generateUrl();
}


async function saveYouTubeCustomEmotes() {
    try {	
    	const youtubeMemberEmotes = document.querySelector("textarea[name=youTubeCustomEmotes]:not(.avoid)");
        youtubeSaveMemberEmotes(JSON.parse(youtubeMemberEmotes.value));
    }
	catch (err) {
        console.error("[ChatRD] Emotes JSON inválido", err);
    }
}

async function loadYouTubeCustomEmotes() {

    youtubeLoadMemberEmotes().then(settings => {
        if (settings) {
    		const youtubeMemberEmotes = document.querySelector("textarea[name=youTubeCustomEmotes]:not(.avoid)");
            console.log('[ChatRD][Settings] YouTube Member Emotes Loaded', settings);
            youtubeMemberEmotes.value = JSON.stringify(settings);
            populateEmoteList();
        }
    });
    
}

/* -------------------------
   Carregar configurações do localStorage
-------------------------- */
async function loadSettingsFromLocalStorage() {
    const saved = localStorage.getItem("chatrdWidgetSettings");
    if (!saved) return;

    const settings = JSON.parse(saved);

    Object.keys(settings).forEach(key => {
        const input = document.querySelector(`[name="${key}"]`);
        if (input) {
            if (input.type === "checkbox") {
                input.checked = settings[key];
            } else {
                input.value = settings[key];
            }
        }
    });

    document.querySelector('#font-value').textContent = Math.floor(document.querySelector('#font-slider').value * 100) + '%';
    document.querySelector('#bg-opacity-value').textContent = Math.floor(document.querySelector('#bg-opacity-slider').value * 100) + '%';
}

async function saveStreamerBotSettings() {
    const streamerBotServerAddress = document.querySelector('input[type=text][name=streamerBotServerAddress]').value;
    const streamerBotServerPort = document.querySelector('input[type=text][name=streamerBotServerPort]').value;

    const settings = {
        streamerBotServerAddress : streamerBotServerAddress,
        streamerBotServerPort : streamerBotServerPort
    }

    localStorage.setItem("chatrdStreamerBotSettings", JSON.stringify(settings));
}

async function loadStreamerBotSettings() {
    const saved = localStorage.getItem("chatrdStreamerBotSettings");
    if (!saved) return;

    const settings = JSON.parse(saved);

    Object.keys(settings).forEach(key => {
        const input = document.querySelector(`[type=text][name="${key}"]`);
        input.value = settings[key];
    });
}

/* -------------------------
   Configurar eventos para salvar mudanças
-------------------------- */
function pushChangeEvents() {
    const checkboxes = document.querySelectorAll("input[type=checkbox]:not(.avoid)");
    const textfields = document.querySelectorAll("input[type=text]:not(.avoid)");
    const numberfields = document.querySelectorAll("input[type=number]:not(.avoid)");
    const colorfields = document.querySelectorAll("input[type=color]:not(.avoid)");
    const selects = document.querySelectorAll("select:not(.avoid)");
    const ranges = document.querySelectorAll("input[type=range]:not(.avoid)");

    [...checkboxes, ...textfields, ...numberfields, ...colorfields, ...selects, ...ranges].forEach(el => {
        el.addEventListener('change', saveSettingsToLocalStorage);
        el.addEventListener('input', saveSettingsToLocalStorage);
    });

    document.querySelector('#font-slider').addEventListener('input', function () {
        document.querySelector('#font-value').textContent = Math.floor(this.value * 100) + '%';
    });

    document.querySelector('#bg-opacity-slider').addEventListener('input', function () {
        document.querySelector('#bg-opacity-value').textContent = Math.floor(this.value * 100) + '%';
    });
}

/* -------------------------
   Gerar URL de preview
-------------------------- */
function generateUrl() {
    const streamerBotServerAddress = document.querySelector('input[type=text][name=streamerBotServerAddress]').value;
    const streamerBotServerPort = document.querySelector('input[type=text][name=streamerBotServerPort]').value;

    const outputField = document.getElementById("outputUrl");
    outputField.value = '';

    const baseUrlObj = new URL(window.location.href);

    // Garante que o pathname termine com "chat.html"
    if (!baseUrlObj.pathname.endsWith("chat.html")) {
        if (baseUrlObj.pathname.endsWith("/") || baseUrlObj.pathname === "") {
            baseUrlObj.pathname += "chat.html";
        } else if (baseUrlObj.pathname.endsWith("index.html")) {
            baseUrlObj.pathname = baseUrlObj.pathname.replace(/index\.html$/, "chat.html");
        } else {
            baseUrlObj.pathname += "/chat.html";
        }
    }

    const baseUrl = baseUrlObj.toString();

    const checkboxes = document.querySelectorAll("input[type=checkbox]:not(.avoid)");
    const textfields = document.querySelectorAll("input[type=text]:not(.avoid)");
    const numberfields = document.querySelectorAll("input[type=number]:not(.avoid)");
    const colorfields = document.querySelectorAll("input[type=color]:not(.avoid)");
    const selects = document.querySelectorAll("select:not(.avoid)");
    const ranges = document.querySelectorAll("input[type=range]:not(.avoid)");

    const params = new URLSearchParams();

    selects.forEach(s => params.set(s.name, s.value));
    ranges.forEach(r => params.set(r.name, r.value));
    checkboxes.forEach(cb => params.set(cb.name, cb.checked));
    colorfields.forEach(cf => params.set(cf.name, cf.value));
    textfields.forEach(tf => params.set(tf.name, tf.value));
    numberfields.forEach(nf => params.set(nf.name, nf.value));

    var finalChatRDURL = baseUrl + '?' + params.toString() + `&streamerBotServerAddress=${streamerBotServerAddress}&streamerBotServerPort=${streamerBotServerPort}`; 
    outputField.value = finalChatRDURL
    const iframe = document.querySelector('#preview iframe');
    if (iframe) { iframe.src = finalChatRDURL; }
}


/* -------------------------
   Copiar URL para clipboard
-------------------------- */
function copyUrl() {
    const output = document.getElementById("outputUrl");
    const value = output.value;
    const button = document.querySelector('.url-bar button');
    const buttonDefaultText = 'Copy URL';

    navigator.clipboard.writeText(value).then(() => {
        button.textContent = 'ChatRD URL Copied!';
        button.style.backgroundColor = "#00dd63";

        setTimeout(() => {
            button.textContent = buttonDefaultText;
            button.removeAttribute('style');
        }, 3000);
    }).catch(err => {
        console.error("Failed to copy: ", err);
    });
}

/* -------------------------
   Mostrar/esconder plataformas
-------------------------- */
function setupPlatformToggles() {
    const platforms = document.querySelectorAll('.platform');

    platforms.forEach(platform => {
        const platformId = platform.id;
        const toggleName = `show${capitalize(platformId)}`;
        const toggle = platform.querySelector(`input[name="${toggleName}"]`);
        const setupDiv = platform.querySelector('.setup');

        if (toggle && setupDiv) {
            // Removido: initializeTransitionStyles(setupDiv);
            
            // Defina o overflow no CSS ou aqui, se preferir
            setupDiv.style.overflow = 'hidden';
            setupDiv.style.transition = 'max-height 0.4s ease, opacity 0.4s ease';

            setVisible(setupDiv, toggle.checked);

            toggle.removeEventListener('change', toggle._handler || (() => { }));

            const handler = () => setVisible(setupDiv, toggle.checked);
            toggle._handler = handler;
            toggle.addEventListener('change', handler);
        }
    });

    function setVisible(element, visible) {
        if (visible) {
            // Remove 'display: none' para que a altura possa ser calculada
            element.style.display = 'block';

            // Força o elemento a iniciar com altura e opacidade zero
            element.style.maxHeight = '0px';
            element.style.opacity = '0';
            element.offsetHeight; // Força a renderização
            
            // Inicia a transição para a altura real e opacidade completa
            element.style.maxHeight = element.scrollHeight + 'px';
            element.style.opacity = '1';

            // Remove os estilos após a transição de abertura
            element.addEventListener('transitionend', function handler() {
                element.style.maxHeight = null;
                element.style.opacity = null;
                element.removeEventListener('transitionend', handler);
            });

        }
        
        else {
            // Define o maxHeight para a altura atual antes de iniciar a transição de fechamento
            element.style.maxHeight = element.scrollHeight + 'px';
            element.offsetHeight; // Força a renderização
            
            // Inicia a transição para fechar o elemento
            element.style.maxHeight = '0px';
            element.style.opacity = '0';

            // Esconde o elemento com 'display: none' após a transição
            setTimeout(() => {
                if (element.style.opacity === '0') {
                    element.style.display = 'none';
                }
            }, 400); // O tempo precisa ser o mesmo da transição (0.4s)
        }
    }

    // A função initializeTransitionStyles() foi removida.
    // O estilo de transição foi movido para a função principal para ser definido uma única vez.
    
    function capitalize(str) {
        return str.charAt(0).toUpperCase() + str.slice(1);
    }
}

/* -------------------------
   Navegação no footer
-------------------------- */
function setupFooterNavBar() {
    document.querySelectorAll('.nav-bar a').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const targetId = this.getAttribute('href');
            if (!targetId || !targetId.startsWith('#')) return;

            const targetElement = document.querySelector(targetId);
            if (targetElement) {
                const offset = 20;
                const y = targetElement.getBoundingClientRect().top + window.scrollY - offset;
                window.scrollTo({ top: y, behavior: 'smooth' });
            }
        });
    });
}

/* -------------------------
   Modal para adicionar emotes
-------------------------- */
function setupAddEmoteModal() {
    const modal = document.getElementById("addEmoteModal");
    const nameInput = document.getElementById("newEmoteName");
    const urlInput = document.getElementById("newEmoteURL");
    const confirmBtn = document.getElementById("confirmAddEmote");
    const cancelBtn = document.getElementById("cancelAddEmote");
    const addButton = document.querySelector("#addEmoteButton");
    const textarea = document.querySelector("textarea[name=youTubeCustomEmotes]");

    if (!modal || !addButton || !textarea) return;

    // ESC global → aciona cancelBtn
    document.addEventListener("keydown", (event) => {
        if (event.key === "Escape" && !modal.classList.contains("hidden")) {
            cancelBtn.click();
        }
    });

    // ENTER nos inputs → aciona confirmBtn
    [nameInput, urlInput].forEach(input => {
        input.addEventListener("keydown", (event) => {
            if (event.key === "Enter") {
                event.preventDefault(); // evita submit/form
                confirmBtn.click();
            }
        });
    });

    addButton.onclick = (event) => {
        event.preventDefault();
        if (streamerBotConnected) {
            nameInput.value = "";
            urlInput.value = "";
            modal.classList.remove("hidden");
            nameInput.focus();
        } else {
            alert("Streamer.bot is Offline!");
        }
    };

    cancelBtn.onclick = (e) => {
        e.preventDefault();
        modal.classList.add("hidden");
    };

    confirmBtn.onclick = (e) => {
        e.preventDefault();
        const name = nameInput.value.trim();
        const url = urlInput.value.trim();

        if (!name || !url) {
            alert("Both fields are required.");
            return;
        }

        let emotes;
        try {
            emotes = JSON.parse(JSON.parse(textarea.value));
        }
        catch (err) {
            console.error("Invalid JSON", err);
            alert("Emote data is invalid.");
            return;
        }

        if (emotes[name]) {
            alert(`Emote "${name}" already exists.`);
            return;
        }

        emotes[name] = url;
        textarea.value = JSON.stringify(JSON.stringify(emotes));
        saveYouTubeCustomEmotes();
        modal.classList.add("hidden");
        setTimeout(() => populateEmoteList(), 1000);
    };
}


/* -------------------------
   Lista de emotes
-------------------------- */
function populateEmoteList() {
    const textarea = document.querySelector("textarea[name=youTubeCustomEmotes]");
    const emoteList = document.querySelector("#youtube .emote-list");
    if (!textarea || !emoteList) return;

    emoteList.querySelectorAll(".emote-item").forEach(item => {
        if (item.querySelector("button")?.id !== "addEmoteButton") {
            item.remove();
        }
    });

    let emotes;
    try {
        emotes = JSON.parse(JSON.parse(textarea.value));
    } catch (e) {
        console.error("[ChatRD][Settings] Invalid JSON in YouTube Emotes textarea", e);
        return;
    }

    const addButtonSpan = emoteList.querySelector("#addEmoteButton")?.parentElement;

    for (const [emoteName, emoteUrl] of Object.entries(emotes)) {
        const span = document.createElement("span");
        span.classList.add("emote-item");
        span.innerHTML = `
            <img data-emote="${emoteName}" src="${emoteUrl}" alt="">
            <em>${emoteName}</em>
            <button class="delete"><i class="fa-solid fa-trash-can"></i></button>
        `;

        span.querySelector(".delete").addEventListener("click", (event) => {
            event.preventDefault();
            if (confirm(`Are you sure you want to delete '${emoteName}'?`)) {
                delete emotes[emoteName];
                textarea.value = JSON.stringify(JSON.stringify(emotes));
                saveYouTubeCustomEmotes();
                setTimeout(() => populateEmoteList(), 1000);
            }
        });

        emoteList.insertBefore(span, addButtonSpan || null);
    }
}

/* -------------------------
   Funções YouTube <-> Streamer.bot
-------------------------- */
function youtubeSaveMemberEmotes(data) {
    if (!streamerBotClient) return;
    const json = JSON.stringify(data);
    streamerBotClient.doAction({ name: "[YouTube] Member Emotes" }, {
        "chatrdytcustomemotes": json,
    }).then((res) => {
        console.debug('[ChatRD][Settings] Saving YouTube Member Emotes... ', res);
    });
}

function youtubeLoadMemberEmotes() {
    if (!streamerBotClient) return Promise.resolve(null);
    return streamerBotClient.getGlobals().then((globals) => {
        console.debug('[ChatRD][Settings] Loading Global Vars...', globals);
        const emoteglobal = globals.variables?.chatrdytcustomemotes;
        if (!emoteglobal) {
            console.warn('[ChatRD][Settings] Global variable "chatrdytcustomemotes" not found.');
            return null;
        }
        try {
            return JSON.parse(emoteglobal.value);
        } catch (e) {
            console.error('[ChatRD][Settings] Failed to parse YouTube Member Emote JSON', e);
            return null;
        }
    });
}

/* -------------------------
   Conexão com Streamer.bot
-------------------------- */
function streamerBotConnect() {
    const streamerBotStatus = document.getElementById('streamerBotStatus');

    const streamerBotServerAddress = document.querySelector('input[type=text][name=streamerBotServerAddress]').value;
    const streamerBotServerPort = document.querySelector('input[type=text][name=streamerBotServerPort]').value;

    // 🔎 Se já existe um cliente, encerra a tentativa anterior
    if (streamerBotClient) {
        try {
            console.debug("[ChatRD][Settings] Closing previous Streamer.bot connection...");
            streamerBotClient.disconnect?.(); // usa se existir
            streamerBotClient = null;
        } catch (err) {
            console.error("[ChatRD][Settings] Error closing previous client:", err);
        }
    }

    streamerBotClient = new StreamerbotClient({
        host: streamerBotServerAddress,
        port: streamerBotServerPort,
        onConnect: () => {
            console.debug(`[ChatRD][Settings] Connected to Streamer.bot successfully!`);
            streamerBotConnected = true;

            streamerBotStatus.classList.add('connected');
            streamerBotStatus.querySelector('small').textContent = `Connected`;

            loadSettingsFromLocalStorage();
            pushChangeEvents();
            generateUrl();
            setupFooterNavBar();
            setupAddEmoteModal();
            setupPlatformToggles();
            speakerBotConnection();
            loadYouTubeCustomEmotes();
        },
        onDisconnect: () => {
            streamerBotStatus.classList.remove('connected');
            streamerBotStatus.querySelector('small').textContent = `Awaiting for connection`;
            streamerBotConnected = false;
            console.debug(`[ChatRD][Settings] Streamer.bot Disconnected!`);
        }
    });
}


async function speakerBotConnection() {
    const speakerBotStatus = document.getElementById('speakerBotStatus');

    const speakerBotServerAddress = document.querySelector('input[type=text][name=speakerBotServerAddress]').value;
    const speakerBotServerPort = document.querySelector('input[type=text][name=speakerBotServerPort]').value;
    const speakerBotVoiceAlias = document.querySelector('input[type=text][name=speakerBotVoiceAlias]').value;

    const showSpeakerbot = document.querySelector('input[type=checkbox][name=showSpeakerbot]').checked;

    if (!showSpeakerbot) {
        // Se não é pra mostrar, desconecta caso esteja ativo
        if (speakerBotClient && speakerBotClient.ws && speakerBotClient.ws.readyState !== WebSocket.CLOSED) {
            console.log("[ChatRD][Settings] Disconnecting SpeakerBot...");
            speakerBotClient.disconnect();
        }
        return;
    }

    // Se já está conectado ou conectando, não cria outro
    if (speakerBotClient && speakerBotClient.ws && speakerBotClient.ws.readyState !== WebSocket.CLOSED) {
        console.log("[ChatRD][Settings] SpeakerBot WebSocket is already on!.");
        return;
    }

    // Cria nova instância
    speakerBotClient = new SpeakerBotClient({
        host: speakerBotServerAddress,
        port: speakerBotServerPort,
        voiceAlias: speakerBotVoiceAlias,

        onConnect: () => {
            speakerBotStatus.classList.add('connected');
            speakerBotStatus.querySelector('small').textContent = `Connected`;
        },

        onDisconnect: () => {
            speakerBotStatus.classList.remove('connected');
            speakerBotStatus.querySelector('small').textContent = `Awaiting for connection`;
        }
    });
}


/* -------------------------
   Inicialização
-------------------------- */
document.addEventListener('DOMContentLoaded', () => {
    loadStreamerBotSettings();
    setTimeout(() => { streamerBotConnect(); }, 1000);

    const streamerBotServerAddressSwitch = document.querySelector('input[type=text][name=streamerBotServerAddress]');
    const streamerBotServerPortSwitch = document.querySelector('input[type=text][name=streamerBotServerPort]');

    streamerBotServerAddressSwitch.addEventListener('input', () => {
        saveStreamerBotSettings();
        streamerBotConnect();
        generateUrl();
    });
    streamerBotServerPortSwitch.addEventListener('input', () => {
        saveStreamerBotSettings();
        streamerBotConnect();
        generateUrl();
    });

    const speakerBotSwitcher = document.querySelector('input[type=checkbox][name=showSpeakerbot]');
    speakerBotSwitcher.addEventListener('change', () => {
        speakerBotConnection();
    });
});