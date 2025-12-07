/* ----------------------- */
/*         OPTIONS         */
/* ----------------------- */

const showPlatform                  = getURLParam("showPlatform", true);
const showPlatformDot               = getURLParam("showPlatformDot", false);
const showAvatar                    = getURLParam("showAvatar", true);
const showTimestamps                = getURLParam("showTimestamps", true);
const ampmTimeStamps                = getURLParam("ampmTimeStamps", false);
const showBadges                    = getURLParam("showBadges", true);
const showPlatformStatistics        = getURLParam("showPlatformStatistics", true);

const chatThreshold                 = 50;
const chatOneLine                   = getURLParam("chatOneLine", false);
const chatHorizontal                = getURLParam("chatHorizontal", false); 
const chatMessageGroup              = getURLParam("chatMessageGroup", false); 
const chatFontSize                  = getURLParam("chatFontSize", 1);
const chatFontFamily                = getURLParam("chatFontFamily", "DM Sans");
const chatBackground                = getURLParam("chatBackground", "#121212"); 
const chatBackgroundOpacity         = getURLParam("chatBackgroundOpacity", 1); 
const chatScrollBar                 = getURLParam("chatScrollBar", false);
const chatField                     = getURLParam("chatField", false);
const chatModeration                = getURLParam("chatModeration", false);

const multiStreamerMode             = getURLParam("multiStreamerMode", false);

const excludeCommands               = getURLParam("excludeCommands", true);
const ignoreChatters                = getURLParam("ignoreChatters", "");
const ignoreUserList                = ignoreChatters.split(',').map(item => item.trim().toLowerCase()) || [];

const hideAfter                     = getURLParam("hideAfter", 0);

const chatContainer                 = document.querySelector('#chat');
const chatTemplate                  = document.querySelector('#chat-message');
const eventTemplate                 = document.querySelector('#event-message');

const userColors = new Map();

const chatRDBody = document.body;
chatRDBody.style.fontFamily = chatFontFamily;

if (showPlatformStatistics == true) {
    var statistics = document.querySelector('#statistics');
    statistics.style.display = '';
    statistics.style.zoom = chatFontSize;
}
if (chatScrollBar == false) { chatContainer.classList.add('noscrollbar'); }
if (chatOneLine == true && !chatHorizontal) { chatContainer.classList.add('oneline'); }
if (chatHorizontal == true) {
    chatContainer.classList.remove('oneline');
    chatContainer.classList.add('horizontal');
}

let backgroundColor = hexToRGBA(chatBackground,chatBackgroundOpacity);
chatContainer.parentElement.style.backgroundColor = backgroundColor;

chatContainer.style.zoom = chatFontSize;

if (chatField) {
    const chatfieldelement = document.getElementById("chat-input");
    chatfieldelement.style.display = '';
}


function addMessageItem(platform, clone, classes, userid, messageid) {
    removeExtraChatMessages();

    let chatmodtwitch = `<div class="chatmoderation">
                <button onclick="executeModCommand(event, '/deletemessage ${messageid}')" title="Remove Message"><i class="fa-solid fa-trash-can"></i></button>
                <button onclick="executeModCommand(event, '/timeout ${userid}')" title="Timeout User"><i class="fa-solid fa-stopwatch"></i></button>
                <button onclick="executeModCommand(event, '/ban ${userid}')" title="Ban User"><i class="fa-solid fa-gavel"></i></button>
            </div>`;

    let chatmodyoutube = `<div class="chatmoderation">
                <button onclick="executeModCommand(event, '/yt/timeout ${userid}')" title="Timeout User"><i class="fa-solid fa-stopwatch"></i></button>
                <button onclick="executeModCommand(event, '/yt/ban ${userid}')" title="Ban User"><i class="fa-solid fa-gavel"></i></button>
            </div>`;

    let chatmodkick = `<div class="chatmoderation">
                <button onclick="executeModCommand(event, '/kick/timeout ${userid}')" title="Timeout User"><i class="fa-solid fa-stopwatch"></i></button>
                <button onclick="executeModCommand(event, '/kick/ban ${userid}')" title="Ban User"><i class="fa-solid fa-gavel"></i></button>
            </div>`;

    if (showSpeakerbot == true && speakerBotChatRead == true) { speakerBotTTSRead(clone, 'chat'); }

    const root = clone.firstElementChild;
    root.classList.add(...classes);
    root.dataset.user = userid;
    root.id = messageid;
    root.style.opacity = '0';

    const messageEl = clone.querySelector('.actual-message');
    const infoEl = clone.querySelector('.info');
    
    getAndReplaceLinks(messageEl).then(() => {
        multiStreamChat(messageEl);
    });

    const platformElement = clone.querySelector('.platform');
    
    if (showPlatform == true) {
        let platformContent;

        if (root.classList.contains('youtube-vertical')) {
            platformContent = `<img src="js/modules/${platform}/images/logo-${platform}-vertical.svg">`;     
        }
        else {
            platformContent = `<img src="js/modules/${platform}/images/logo-${platform}.svg">`;     
        }
        
        platformElement.innerHTML = platformContent;
    }

    if (showPlatformDot == true) {
        platformElement.innerHTML = `<span class="hidden-platform ${platform}"></span>`;
    }

    if (showPlatform == false && showPlatformDot == false) {
        platformElement.remove();
    }

    const timestamp = clone.querySelector('.timestamp');    
    if (timestamp) {
        if (showTimestamps) {
            timestamp.textContent = whatTimeIsIt();
        } else {
            timestamp.remove();
        }
    }

    const dimensionProp = chatHorizontal ? 'Width' : 'Height';

    // Starts it collapsed
    root.style[dimensionProp.toLowerCase()] = '0px';
    
    //if (chatModeration == true) {
    if ((chatModeration == true) && (!root.classList.contains('streamer'))) {    
        switch (platform) {
            case "twitch":
                root.insertAdjacentHTML("beforeend", chatmodtwitch);
                break;

            case "youtube":
                root.insertAdjacentHTML("beforeend", chatmodyoutube);
                break;

            case "kick":
                root.insertAdjacentHTML("beforeend", chatmodkick);
                break;

            default:
                console.warn(`Plataforma desconhecida: ${platform}`);
        }
    }

    if (chatMessageGroup == true && chatContainer.children.length > 0) {
        let lastUserId = chatContainer.firstElementChild.dataset.user;

        let lastClasses = Array.from(chatContainer.firstElementChild.classList);
        lastClasses = lastClasses.filter(c => c !== 'item');
        lastClasses = lastClasses.filter(c => c !== 'grouped');
        lastClasses = lastClasses.join(' ');

        let currentClasses = Array.from( classes ).join(' ');

        if (lastUserId == userid && lastClasses == currentClasses) {
            infoEl.remove();
            root.classList.add('grouped');
        }
    }

    chatContainer.prepend(clone);

    const item = document.getElementById(messageid);
    const itemDimension = item.querySelector('.message')?.[`offset${dimensionProp}`] || 0;


    /*
    // Animates the item
    requestAnimationFrame(() => {
        item.style[dimensionProp.toLowerCase()] = itemDimension + 'px';
        item.style.opacity = '1';
    });

    item.addEventListener('transitionend', () => {
        item.style[dimensionProp.toLowerCase()] = '';
        item.style.opacity = '';
    }, { once: true });
    */

    setTimeout(function () {
    	item.style[dimensionProp.toLowerCase()] = itemDimension + 'px';
        item.style.opacity = '1';
    	setTimeout(function () {
    		item.style[dimensionProp.toLowerCase()] = '';
            item.style.opacity = '';
    	}, 1000);
    }, 10);

    // Hides it after a while
    if (hideAfter > 0) {
        setTimeout(() => {
            item.style.opacity = '0';
            setTimeout(() => {
                item.remove();
            }, 1000);
        }, Math.floor(hideAfter * 1000));
    }
}


function addEventItem(platform, clone, classes, userid, messageid) {
    removeExtraChatMessages();

    if (showSpeakerbot == true && speakerBotEventRead == true) { speakerBotTTSRead(clone, 'event'); }
    
    const root = clone.firstElementChild;
    root.classList.add(...classes);
    root.dataset.user = userid;
    root.id = messageid;
    root.style.opacity = '0';

    const platformElement = clone.querySelector('.platform');

    if (showPlatform == true) {
        let platformContent;

        if (showPlatformDot == true) {
            root.classList.add('no-platform');
            platformElement.remove();
        }

        else {
            if (root.classList.contains('youtube-vertical')) {
            platformContent = `<img src="js/modules/${platform}/images/logo-${platform}-vertical.svg">`;     
            }
            else {
                platformContent = `<img src="js/modules/${platform}/images/logo-${platform}.svg">`;     
            }
        }        
        
        platformElement.innerHTML = platformContent;
    }
    
    else {
        root.classList.add('no-platform');
        platformElement.remove();
    }

    const timestamp = clone.querySelector('.timestamp');    
    if (timestamp) {
        if (showTimestamps) {
            timestamp.textContent = whatTimeIsIt();
        } else {
            timestamp.remove();
        }
    }

    const dimensionProp = chatHorizontal ? 'Width' : 'Height';

    // Starts it collapsed
    root.style[dimensionProp.toLowerCase()] = '0px';

    chatContainer.prepend(clone);

    const item = document.getElementById(messageid);
    const itemDimension = item.querySelector('.message')?.[`offset${dimensionProp}`] || 0;

    /*
    // Animates the item
    requestAnimationFrame(() => {
        item.style[dimensionProp.toLowerCase()] = itemDimension + 'px';
        item.style.opacity = '1';
    });

    item.addEventListener('transitionend', () => {
        item.style[dimensionProp.toLowerCase()] = '';
        item.style.opacity = '';
    }, { once: true });
    */

    setTimeout(function () {
    	item.style[dimensionProp.toLowerCase()] = itemDimension + 'px';
        item.style.opacity = '1';
    	setTimeout(function () {
    		item.style[dimensionProp.toLowerCase()] = '';
            item.style.opacity = '';
    	}, 1000);
    }, 10);

    // Hides it after a while
    if (hideAfter > 0) {
        setTimeout(() => {
            item.style.opacity = '0';
            setTimeout(() => {
                item.remove();
            }, 1000);
        }, Math.floor(hideAfter * 1000));
    }
}


function removeItem(element) {
    element.remove();
}


function removeExtraChatMessages() {
    const chatMessages = chatContainer.querySelectorAll(':scope > div');
    const total = chatMessages.length;

    if (total >= chatThreshold) {
        const toRemove = Math.floor(total * 0.25); // 25% do total
        for (let i = 0; i < toRemove; i++) {
            const last = chatContainer.lastElementChild;
            if (last) chatContainer.removeChild(last);
        }
    }
}


function whatTimeIsIt() {
    const now = new Date();
    const hours24 = now.getHours();
    const minutes = now.getMinutes().toString().padStart(2, '0');
    const ampm = hours24 >= 12 ? 'PM' : 'AM';
    const hours12 = (hours24 % 12) || 12;

    if (ampmTimeStamps === true) {
        return `${hours12}:${minutes} ${ampm}`;
    } else {
        return `${hours24}:${minutes}`;
    }
}

// Function to format large numbers (e.g., 1000 => '1K')
function formatNumber(num) {
    if (num >= 1000000) {
        let numStr = (num / 1000000).toFixed(1);
        if (numStr.endsWith('.0')) {
            numStr = numStr.slice(0, -2);
        }
        return numStr + 'M';
    }
    else if (num >= 1000) {
        let numStr = (num / 1000).toFixed(1);
        if (numStr.endsWith('.0')) {
            numStr = numStr.slice(0, -2);
        }
        return numStr + 'K';
    }
    return num.toString();
}


function formatCurrency(amount, currencyCode) {
    if (!currencyCode) { currencyCode = 'USD'; }
    
    return new Intl.NumberFormat(undefined, {
        style: 'currency',
        currency: currencyCode,
        minimumFractionDigits: 0,
        maximumFractionDigits: 2
    }).format(amount);
}


function createRandomString(length) {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    let result = "";
    for (let i = 0; i < length; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}


function createRandomColor(platform, username) {
    if (userColors.get(platform).has(username)) {
        return userColors.get(platform).get(username);
    }
    else {
        const randomColor = "hsl(" + Math.random() * 360 + ", 100%, 75%)";
        userColors.get(platform).set(username, randomColor);
        return randomColor;
    }
}


function hexToRGBA(hexadecimal,opacity) {
    const hex = hexadecimal;
    const alpha = parseFloat(opacity);
    
    // Converter hex para RGB
    const r = parseInt(hex.substr(1, 2), 16);
    const g = parseInt(hex.substr(3, 2), 16);
    const b = parseInt(hex.substr(5, 2), 16);

    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}


function stripStringFromHtml(html) {
    let doc = new DOMParser().parseFromString(html, 'text/html');
    return doc.body.textContent || "";
}


async function cleanStringOfHTMLButEmotes(string) {
    // Cria um elemento DOM temporário
    const container = document.createElement('div');
    container.innerHTML = string;

    // Substitui <img class="emote" alt="..."> por texto do alt
    const emotes = container.querySelectorAll('img.emote[alt]');
    emotes.forEach(img => {
        const altText = img.getAttribute('alt');
        const textNode = document.createTextNode(altText);
        img.replaceWith(textNode);
    });

    // Remove todo o restante do HTML
    return container.textContent || "";
}


function formatSubMonthDuration(months) {
    /*if (months < 12) {
        return `${months} ${months === 1 ? 'Month' : 'Months'}`;
    }

    const years = Math.floor(months / 12);
    const remainingMonths = months % 12;

    const yearText = `${years} ${years === 1 ? 'Year' : 'Years'}`;

    const monthText = remainingMonths > 0 
        ? ` and ${remainingMonths} ${remainingMonths === 1 ? 'Month' : 'Months'}`
        : '';

    return `${yearText}${monthText}`;*/
    return `${months} ${months === 1 ? 'Month' : 'Months'}`;
}


const pushNotify = (data) => {

    const SimpleNotify = {
        effect: 'fade',
        speed: 500,
        customClass: 'toasty',
        customIcon: '',
        showIcon: true,
        showCloseButton: true,
        autoclose: true,
        autotimeout: 5000,
        notificationsGap: null,
        notificationsPadding: null,
        type: 'outline',
        position: 'x-center bottom',
        customWrapper: '',
    };
    const mergedData = {
        ...SimpleNotify,
        ...data
    }
    new Notify (mergedData);
    
}

const notifyError = (err) => {
    err.status = 'error';
    pushNotify(err);
}

const notifyInfo = (info) => {
    info.status = 'info';
    pushNotify(info);
}

const notifyWarning = (warn) => {
    warn.status = 'warning';
    pushNotify(warn);
}


const notifySuccess = (success) => {
    success.status = 'success';
    pushNotify(success);
}


function animateCounter(element, start, end, duration) {
    let startTime = null;
    
    function step(timestamp) {
        if (!startTime) startTime = timestamp;
        const progress = Math.min((timestamp - startTime) / duration, 1);
        const value = Math.floor(start + (end - start) * progress);
        element.textContent = value;
        if (progress < 1) {
            requestAnimationFrame(step);
        }
    }
    
    requestAnimationFrame(step);
}


/* -------------------------- */
/* ---- CHAT INPUT UTILS ---- */
/* -------------------------- */

const chatcommandslist = document.getElementById('chat-autocomplete-list');
let chatcurrentFocus = -1;

const chatInputSend = document.getElementById("chat-input-send");
const chatInputForm = document.querySelector("#chat-input form");
const chatInput = chatInputForm.querySelector("input[type=text]")

let chatcommands = {
    "Twitch" : [
        { "name" : "/me", "usage" : "Creates a colored message. <b>Usage: /me [message]</b>"  },
        { "name" : "/clip", "usage" : "Creates a 30s clip. <b>Usage: /clip</b>"  },
        { "name" : "/announce", "usage" : "Sends an announcement. <b>Usage: /announce [message]</b>"  },
        { "name" : "/announceblue", "usage" : "Sends an announcement in blue. <b>Usage: /announceblue [message]</b>"  },
        { "name" : "/announcegreen", "usage" : "Sends an announcement in green. <b>Usage: /announcegreen [message]</b>"  },
        { "name" : "/announceorange", "usage" : "Sends an announcement in orange. <b>Usage: /announceorange [message]</b>"  },
        { "name" : "/announcepurple", "usage" : "Sends an announcement in purple. <b>Usage: /announcepurple [message]</b>"  },
        { "name" : "/clear", "usage" : "Clear Chat Messages. <b>Usage: /clear</b>"  },
        { "name" : "/slow", "usage" : "Activates slow mode. <b>Usage: /slow [duration]</b>"  },
        { "name" : "/slowoff", "usage" : "Deactivates slow mode. <b>Usage: /slowoff</b>"  },
        { "name" : "/subscribers", "usage" : "Activates subscribers only mode. <b>Usage: /subscribers</b>"  },
        { "name" : "/subscribersoff", "usage" : "Deactivates subscribers only mode. <b>Usage: /subscribersoff</b>"  },
        { "name" : "/emoteonly", "usage" : "Activates emote only mode. <b>Usage: /emoteonly</b>"  },
        { "name" : "/emoteonlyoff", "usage" : "Deactivates emote only mode. <b>Usage: /emoteonlyoff</b>"  },
        { "name" : "/commercial", "usage" : "Add a commercial break. <b>Usage: /commercial [duration]</b>"  },
        { "name" : "/timeout", "usage" : "Timeouts a user. <b>Usage: /timeout [user] [duration] [reason]</b>"  },
        { "name" : "/untimeout", "usage" : "Removes timeout from a user. <b>Usage: /untimeout [user]</b>"  },
        { "name" : "/ban", "usage" : "Bans a user. <b>Usage: /ban [user] [reason]</b>"  },
        { "name" : "/unban", "usage" : "Unbans a user. <b>Usage: /unban [user]</b>"  },
        { "name" : "/mod", "usage" : "Mod a user. <b>Usage: /mod [user]</b>"  },
        { "name" : "/unmod", "usage" : "Removes mod from a user. <b>Usage: /unmod [user]</b>"  },
        { "name" : "/vip", "usage" : "Adds user to VIP. <b>Usage: /vip [user]</b>"  },
        { "name" : "/unvip", "usage" : "Removes user from VIP. <b>Usage: /unvip [user]</b>"  },
        { "name" : "/shoutout", "usage" : "Shoutouts a user. <b>Usage: /shoutout [user]</b>"  },
        { "name" : "/raid", "usage" : "Raids a user. <b>Usage: /raid [user]</b>"  },
        { "name" : "/unraid", "usage" : "Removes the outcoming raid. <b>Usage: /unraid</b>"  },
        { "name" : "/settitle", "usage" : "Sets the stream title. <b>Usage: /settitle [title]</b>"  },
        { "name" : "/setgame", "usage" : "Sets the stream game. <b>Usage: /setgame [game]</b>"  },
    ],
    "YouTube" : [
        { "name" : "/yt/title", "usage" : "Sets the stream title. <b>Usage: /yt/title [title]</b>"  },
        { "name" : "/yt/timeout", "usage" : "Times out a user by ID. <b>Usage: /yt/timeout [user id] [duration]</b>"  },
        { "name" : "/yt/timeout/name", "usage" : "Times out a user name. <b>Usage: /yt/timeout/name [user name] [duration]</b>"  },
        { "name" : "/yt/ban", "usage" : "Bans a user by ID. <b>Usage: /yt/ban [user id]</b>"  },
        { "name" : "/yt/ban/name", "usage" : "Bans a user by user name. <b>Usage: /yt/ban/name [user name]</b>"  }
    ],
    "Kick" : [
        { "name" : "/kick/title", "usage" : "Sets the stream title. <b>Usage: /kick/title [title]</b>"  },
        { "name" : "/kick/category", "usage" : "Sets the stream category. <b>Usage: /kick/category [category]</b>"  },
        { "name" : "/kick/timeout", "usage" : "Times out a user. <b>Usage: /kick/timeout [user] [duration]</b>"  },
        { "name" : "/kick/untimeout", "usage" : "Removes timeout from a user. <b>Usage: /kick/untimeout [user]</b>"  },
        { "name" : "/kick/ban", "usage" : "Bans a user. <b>Usage: /kick/ban [user]</b>"  },
        { "name" : "/kick/unban", "usage" : "Unbans a user. <b>Usage: /kick/unban [user]</b>"  }
    ]
};



function highlightItem(items) {
    if (!items) return;

    items.forEach(item => item.classList.remove('active'));

    if (chatcurrentFocus >= items.length) chatcurrentFocus = 0;
    if (chatcurrentFocus < 0) chatcurrentFocus = items.length - 1;

    items[chatcurrentFocus].classList.add('active');
    items[chatcurrentFocus].scrollIntoView({ block: "nearest" });
}




chatInput.addEventListener('input', function () {
    const value = this.value.trim();
    chatcommandslist.innerHTML = '';
    chatcurrentFocus = -1;
    if (!value.startsWith('/')) return;
        Object.entries(chatcommands).forEach(([groupName, commands]) => {
        
        const filtered = commands.filter(cmd => cmd.name.startsWith(value));

        if (filtered.length === 0) return;

        const groupTitle = document.createElement('div');
        groupTitle.textContent = groupName;
        chatcommandslist.appendChild(groupTitle);
        filtered.forEach(cmd => {
            const item = document.createElement('div');
            item.classList.add('autocomplete-item');
            item.innerHTML = `<strong>${cmd.name}</strong><small> ${cmd.usage}</small>`;
            item.addEventListener('click', () => {
                chatInput.value = cmd.name + ' ';
                chatcommandslist.innerHTML = '';
            });
            chatcommandslist.appendChild(item);
        });
    });
});

chatInput.addEventListener('keydown', function (e) {
    const items = chatcommandslist.querySelectorAll('.autocomplete-item');
    
    if (items.length === 0) return;
    
    if (e.key === 'ArrowDown') {
        chatcurrentFocus++;
        highlightItem(items);
    }
    else if (e.key === 'ArrowUp') {
        chatcurrentFocus--;
        highlightItem(items);
    }
    
    else if (e.key === 'Enter') {
        e.preventDefault();
        if (chatcurrentFocus > -1 && items[chatcurrentFocus]) {
            items[chatcurrentFocus].click();
        }
    }
});




chatInputForm.addEventListener("submit", function(event) {
    event.preventDefault();

    var chatSendPlatforms = [];

    if (showTwitch == true && showTwitchMessages == true) { chatSendPlatforms.push('twitch'); }
    if (showYoutube == true && showYouTubeMessages == true) { chatSendPlatforms.push('youtube'); }
    if (showTiktok == true && showTikTokMessages == true) { chatSendPlatforms.push('tiktok'); }
    if (showKick == true && showKickMessages == true) { chatSendPlatforms.push('kick'); }

    chatSendPlatforms = chatSendPlatforms.join(',')

    const chatInput = chatInputForm.querySelector("input[type=text]")
    const chatInputText = chatInput.value;

    // Sends Message to Twitch and YouTube 
    streamerBotClient.doAction(
    { name : "[Twitch][YouTube][Kick] Msgs/Cmds" },
    {
        "type": "chat",
        "platforms": chatSendPlatforms,
        "message": chatInputText,
    }
    ).then( (sendchatstuff) => {
        console.debug('[ChatRD] Sending Chat to Streamer.Bot', sendchatstuff);
    });
    
    // Sends Message to TikTok that are not commands
    if (chatSendPlatforms.includes('tiktok')) {
        if (!chatInputText.startsWith('/')) {
            streamerBotClient.doAction(
            { name : "[TikTok] Msgs" },
            {
                "ttkmessage": chatInputText,
            }
            ).then( (sendchatstuff) => {
                console.debug('[ChatRD] Sending TikTok Chat to Streamer.Bot', sendchatstuff);
            });
        }
    }

    chatInput.value = '';
});

chatInputSend.addEventListener("click", function () {
    chatInputForm.requestSubmit();
});

document.addEventListener('click', function (e) {
    if (e.target !== chatcommandslist) {
        chatcommandslist.innerHTML = '';
    }
});






async function speakerBotTTSRead(clone,type) {

    var TTSMessage = "";

    const {
        header,
        user,
        action,
        value,
        'actual-message': message
    } = Object.fromEntries(
        [...clone.querySelectorAll('[class]')]
            .map(el => [el.className, el])
    );

    if (type == "chat") {
        var cleanmessage = "";
        
        if (message == null) { cleanmessage = "<br>"; }
        else { cleanmessage = message.innerHTML; }

        var strippedmessage = await cleanStringOfHTMLButEmotes(cleanmessage);


        const tts = {
            user: user.textContent,
            message: strippedmessage
        }


        TTSMessage = renderTemplate(speakerBotChatTemplate, tts);
    }

    if (type == "event") {
        
        var cleanvalue = "";
        if (value == null) { cleanvalue = ""; }
        else { cleanvalue = value.innerHTML; }

        var cleanmessage = "";
        if (message == null) { cleanmessage = "<br>"; }
        else { cleanmessage = message.innerHTML; }

        var strippedmessage = await cleanStringOfHTMLButEmotes(cleanmessage);
        var strippedaction = await cleanStringOfHTMLButEmotes(action.innerHTML);
        var strippedvalue = await cleanStringOfHTMLButEmotes(cleanvalue);

        TTSMessage = user.textContent + strippedaction + strippedvalue + ". " + strippedmessage;
    }


    var speakerbotThisStuff = getSpeakerBotInstance();
    speakerbotThisStuff.speak(TTSMessage);

    /*streamerBotClient.doAction({ name : "[Speakerbot] TTS" },
    {
        "message": TTSMessage,
        "alias" : speakerBotVoiceAlias
    }
    ).then( (response) => {
        console.debug('[ChatRD][Streamer.bot -> Speaker.bot] Sending TTS...', response);
    });*/

}


function renderTemplate(template, data) {
    return template.replace(/\{(\w+)\}/g, (match, key) => {
        return key in data ? data[key] : match;
    });
}


async function cleanStringOfHTMLButEmotes(string) {
    // Cria um elemento DOM temporário
    const container = document.createElement('div');
    container.innerHTML = string;

    // Substitui <img class="emote" alt="..."> por texto do alt
    const emotes = container.querySelectorAll('img.emote[alt]');
    emotes.forEach(img => {
        const altText = img.getAttribute('alt');
        const textNode = document.createTextNode(altText);
        img.replaceWith(textNode);
    });

    // Remove todo o restante do HTML
    return container.textContent || "";
}


async function executeModCommand(event, command) {
    event.preventDefault();
    chatInput.value = command;
    chatInputForm.requestSubmit();
}

async function getAndReplaceLinks(el) {
  const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT, null);
  const urlRegex = /\b((?:https?:\/\/|www\.)[^\s<>"')]+)\b/g;
  const nodes = [];

  // coleta os nós de texto
  while (walker.nextNode()) {
    const node = walker.currentNode;
    if (!node.parentElement.closest('a,script,style,textarea,code,pre')) {
      nodes.push(node);
    }
  }

  nodes.forEach(node => {
    const text = node.nodeValue;
    let match, lastIndex = 0;
    const frag = document.createDocumentFragment();

    while ((match = urlRegex.exec(text))) {
      const raw = match[1];

      // texto antes do link
      if (match.index > lastIndex) {
        frag.appendChild(document.createTextNode(text.slice(lastIndex, match.index)));
      }

      // cria <a>
      const clean = raw.replace(/[.,!?;:)\]\}]+$/, '');
      const a = document.createElement('a');
      a.href = clean.startsWith('http') ? clean : `https://${clean}`;
      a.textContent = clean;
      a.target = '_blank';
      a.rel = 'noopener noreferrer';
      frag.appendChild(a);

      // se tinha pontuação colada, mantém
      if (clean.length < raw.length) {
        frag.appendChild(document.createTextNode(raw.slice(clean.length)));
      }

      lastIndex = match.index + raw.length;
    }

    if (lastIndex === 0) return; // nada casou

    if (lastIndex < text.length) {
      frag.appendChild(document.createTextNode(text.slice(lastIndex)));
    }

    node.parentNode.replaceChild(frag, node);
  });
}


document.addEventListener("DOMContentLoaded", function () {
});


function escapeHTML(str) {
    const div = document.createElement('div');
    div.innerText = str;   // ou textContent
    return div.innerHTML;
}

async function multiStreamChat(element) {
    if (multiStreamerMode == true) {
        const platforms = {
            twitch: 'Purple Platform',
            youtube: 'Red Platform',
            kick: 'Green Platform',
            tiktok: 'Short Video App'
        };

        const platformClasses = {
            twitch: 'purple',
            youtube: 'red',
            kick: 'green',
            tiktok: 'vertical'
        };

        const regex = new RegExp(`\\b(${Object.keys(platforms).join('|')})\\b`, 'gi');

        function replaceInTextNode(node) {
            const text = node.textContent;
            const parts = text.split(regex);

            // If there are no matches, do nothing
            if (parts.length === 1) return;

            const fragment = document.createDocumentFragment();

            for (const part of parts) {
                const key = part.toLowerCase();
                const replacement = platforms[key];
                if (replacement) {
                    const em = document.createElement('em');
                    em.classList.add('msm-platform'); // base class
                    if (platformClasses[key]) em.classList.add(platformClasses[key]); // add color class
                    em.textContent = replacement;
                    fragment.appendChild(em);
                } else {
                    fragment.appendChild(document.createTextNode(part));
                }
            }

            node.replaceWith(fragment);
        }

        function traverse(node) {
            // Ignore <a> elements and their children
            if (node.nodeType === Node.ELEMENT_NODE) {
                if (node.tagName === 'A') return;
                for (const child of node.childNodes) traverse(child);
            } else if (node.nodeType === Node.TEXT_NODE) {
                replaceInTextNode(node);
            }
        }

        traverse(element);
    }
}
