/* ----------------------- */
/* STREAMER.BOT CONNECTION */
/* ----------------------- */

let speakerBotClient = null;

const streamerBotServerAddress      = getURLParam("streamerBotServerAddress", "127.0.0.1");
const streamerBotServerPort         = getURLParam("streamerBotServerPort", "8080");
const showSpeakerbot                = getURLParam("showSpeakerbot", true);
const speakerBotServerAddress       = getURLParam("speakerBotServerAddress", "127.0.0.1");
const speakerBotServerPort          = getURLParam("speakerBotServerPort", "7580");
const speakerBotChatRead            = getURLParam("speakerBotChatRead", false);
const speakerBotEventRead           = getURLParam("speakerBotEventRead", false);
const speakerBotVoiceAlias          = getURLParam("speakerBotVoiceAlias", "Maria");
const speakerBotChatTemplate        = getURLParam("speakerBotChatTemplate", "{user} said {message}");

function getSpeakerBotInstance() {
    if (!speakerBotClient && showSpeakerbot) {
        speakerBotClient = new SpeakerBotClient({
            host: speakerBotServerAddress,
            port: speakerBotServerPort,
            voiceAlias: speakerBotVoiceAlias,
            onConnect: () => {
                notifySuccess({
                    title: 'Connected to Speaker.bot',
                    text: ''
                });
            },
        });
    }
    return speakerBotClient;
}


let streamerBotClientActive = null;

function streamerBotConnect() {
    // 🔎 Se já existe um cliente, encerra a tentativa anterior
    if (streamerBotClientActive) {
        try {
            console.debug("[ChatRD][Settings] Closing previous Streamer.bot connection...");
            streamerBotClientActive.disconnect?.(); // usa se existir na lib
            streamerBotClientActive = null;
        } catch (err) {
            console.error("[ChatRD][Settings] Error closing previous client:", err);
        }
    }

    streamerBotClientActive = new StreamerbotClient({
        host: streamerBotServerAddress,
        port: streamerBotServerPort,
        //autoReconnect: false, // evita reconectar sozinho
        onConnect: () => {
            notifySuccess({
                title: 'Connected to Streamer.bot',
                text: ``
            });
        },
        onDisconnect: () => {
            console.debug("[ChatRD][Settings] Streamer.bot disconnected.");
        }
    });

    return streamerBotClientActive;
}

// mantém o const fixo apontando para a primeira conexão
const streamerBotClient = streamerBotConnect();




function getURLParam(param, defaultValue) {
    const urlParams = new URLSearchParams(window.location.search);
    const value = urlParams.get(param);

    if (value === 'true') return true;
    if (value === 'false') return false;
    if (value === null) return defaultValue;

    return value;
}

function registerPlatformHandlersToStreamerBot(handlers, logPrefix = '') {
    for (const [event, handler] of Object.entries(handlers)) {
        streamerBotClient.on(event, (...args) => {
            if (logPrefix) {
                console.debug(`${logPrefix} ${event}`, args[0]);
            }
            handler(...args);
        });
    }
}
