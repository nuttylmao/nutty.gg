//////////////////////
// GLOBAL VARIABLES //
//////////////////////

const avatarMap = new Map();
const pronounMap = new Map();



//////////////////////
// HELPER FUNCTIONS //
//////////////////////

function GetBooleanParam(paramName, defaultValue) {
    const urlParams = new URLSearchParams(window.location.search);
    const paramValue = urlParams.get(paramName);

    if (paramValue === null) {
        return defaultValue; // Parameter not found
    }

    const lowercaseValue = paramValue.toLowerCase(); // Handle case-insensitivity

    if (lowercaseValue === 'true') {
        return true;
    } else if (lowercaseValue === 'false') {
        return false;
    } else {
        return paramValue; // Return original string if not 'true' or 'false'
    }
}

function GetIntParam(paramName, defaultValue) {
    const urlParams = new URLSearchParams(window.location.search);
    const paramValue = urlParams.get(paramName);

    if (paramValue === null) {
        return defaultValue; // or undefined, or a default value, depending on your needs
    }

    const intValue = parseInt(paramValue, 10); // Parse as base 10 integer

    if (isNaN(intValue)) {
        return null; // or handle the error in another way, e.g., throw an error
    }

    return intValue;
}

async function GetKickIds(username) {
    // First attempt with the original username
    let url = `https://kick.com/api/v2/channels/${username}`;

    try {
        let response = await fetch(url);
        if (!response.ok) {
            // Retry with underscores replaced by dashes
            const altUsername = username.replace(/_/g, "-");
            url = `https://kick.com/api/v2/channels/${altUsername}`;
            response = await fetch(url);
            if (!response.ok) {
                throw new Error(`HTTP error ${response.status}`);
            }
        }

        const data = await response.json();
        if (data.chatroom && data.chatroom.id) {
            return { chatroomId: data.chatroom.id, channelId: data.chatroom.channel_id };
        } else {
            throw new Error("Chatroom ID not found in response.");
        }
    } catch (error) {
        console.error("Failed to fetch chatroom ID:", error.message);
        return null;
    }
}

async function GetKickSubBadges(username) {
    let url = `https://kick.com/api/v2/channels/${username}`;

    try {
        let response = await fetch(url);
        if (!response.ok) {
            // Retry with underscores replaced by dashes
            const altUsername = username.replace(/_/g, "-");
            url = `https://kick.com/api/v2/channels/${altUsername}`;
            response = await fetch(url);
            if (!response.ok) {
                throw new Error(`HTTP error ${response.status}`);
            }
        }

        const data = await response.json();
        return data.subscriber_badges || [];
    } catch (error) {
        console.error("Failed to fetch subscriber badges:", error.message);
        return [];
    }
}

async function GetAvatar(username, platform) {
    // First, check if the username is hashed already
    if (avatarMap.has(`${username}-${platform}`)) {
        console.debug(`Avatar found for ${username} (${platform}). Retrieving from hash map.`);
        return avatarMap.get(`${username}-${platform}`);
    }

    // If code reaches this point, the username hasn't been hashed, so retrieve avatar
    switch (platform) {
        case 'twitch': {
            console.debug(`No avatar found for ${username} (${platform}). Retrieving from Decapi.`);
            let response = await fetch('https://decapi.me/twitch/avatar/' + username);
            let data = await response.text();
            avatarMap.set(`${username}-${platform}`, data);
            return data;
        }
        case 'kick': {
            console.debug(`No avatar found for ${username} (${platform}). Retrieving from Kick.`);

            let url = `https://kick.com/api/v2/channels/${username}`;

            try {
                let response = await fetch(url);
                if (!response.ok) {
                    const altUsername = username.replace(/_/g, "-");
                    url = `https://kick.com/api/v2/channels/${altUsername}`;
                    response = await fetch(url);

                    if (!response.ok) {
                        throw new Error(`HTTP error ${response.status}`);
                    }
                }

                let data = await response.json();

                const defaultAvatars = [
                    'https://kick.com/img/default-profile-pictures/default-avatar-1.webp',
                    'https://kick.com/img/default-profile-pictures/default-avatar-2.webp',
                    'https://kick.com/img/default-profile-pictures/default-avatar-3.webp',
                    'https://kick.com/img/default-profile-pictures/default-avatar-4.webp',
                    'https://kick.com/img/default-profile-pictures/default-avatar-5.webp',
                    'https://kick.com/img/default-profile-pictures/default-avatar-6.webp',
                ];

                const avatarURL =
                    data.user?.profile_pic ||
                    defaultAvatars[hashString(`${username}-${platform}`) % defaultAvatars.length];

                avatarMap.set(`${username}-${platform}`, avatarURL);
                return avatarURL;

            } catch (error) {
                console.error("Failed to fetch avatar:", error.message);

                const defaultAvatars = [
                    'https://kick.com/img/default-profile-pictures/default-avatar-1.webp',
                    'https://kick.com/img/default-profile-pictures/default-avatar-2.webp',
                    'https://kick.com/img/default-profile-pictures/default-avatar-3.webp',
                    'https://kick.com/img/default-profile-pictures/default-avatar-4.webp',
                    'https://kick.com/img/default-profile-pictures/default-avatar-5.webp',
                    'https://kick.com/img/default-profile-pictures/default-avatar-6.webp',
                ];

                return defaultAvatars[hashString(`${username}-${platform}`) % defaultAvatars.length];
            }

            function hashString(str) {
                let hash = 0;
                for (let i = 0; i < str.length; i++) {
                    hash = ((hash << 5) - hash) + str.charCodeAt(i);
                    hash |= 0; // convert to 32-bit int
                }
                return Math.abs(hash);
            }
        }
    }
}

async function GetPronouns(platform, username) {
    if (pronounMap.has(username)) {
        console.debug(`Pronouns found for ${username}. Retrieving from hash map.`)
        return pronounMap.get(username);
    }
    else {
        console.debug(`No pronouns found for ${username}. Retrieving from alejo.io.`)
        const response = await client.getUserPronouns(platform, username);
        const userFound = response.pronoun.userFound;
        const pronouns = userFound ? `${response.pronoun.pronounSubject}/${response.pronoun.pronounObject}` : '';

        pronounMap.set(username, pronouns);

        return pronouns;
    }
}

function RenderKickEmotes(message) {
    const emoteRegex = /\[emote:(\d+):([^\]]+)\]/g;

    return message.replace(emoteRegex, (_, id, name) => {
        const imgUrl = `https://files.kick.com/emotes/${id}/fullsize`;
        return `<img src="${imgUrl}" alt="${name}" title="${name}" class="emote" />`;
    });
}

function GetCurrentTimeFormatted() {
    const now = new Date();
    let hours = now.getHours();
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';

    hours = hours % 12;
    hours = hours ? hours : 12; // the hour '0' should be '12'

    const formattedTime = `${hours}:${minutes} ${ampm}`;
    return formattedTime;
}

function DecodeHTMLString(html) {
    var txt = document.createElement("textarea");
    txt.innerHTML = html;
    return txt.value;
}

// Simple HTML escape function to prevent XSS attacks
function EscapeHTML(str) {
    return str.replace(/[&<>"']/g, match => {
        const escape = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };
        return escape[match];
    });
}

function TranslateToFurry(sentence) {
    // Split on <img ...> tags, keeping them in the result
    const parts = sentence.split(/(<img\b[^>]*>)/gi);

    const furryParts = parts.map(part => {
        // If this part is an <img>, leave it unchanged
        if (/^<img\b[^>]*>$/.test(part)) {
            return part;
        }

        // Otherwise, apply furry translation
        const words = part.toLowerCase().split(/\b/);

        return words.map(word => {
            if (/\w+/.test(word)) {
                let newWord = word;

                // Common substitutions
                newWord = newWord.replace(/l/g, 'w');
                newWord = newWord.replace(/r/g, 'w');
                newWord = newWord.replace(/th/g, 'f');
                newWord = newWord.replace(/you/g, 'yous');
                newWord = newWord.replace(/my/g, 'mah');
                newWord = newWord.replace(/me/g, 'meh');
                newWord = newWord.replace(/am/g, 'am');
                newWord = newWord.replace(/is/g, 'is');
                newWord = newWord.replace(/are/g, 'are');
                newWord = newWord.replace(/very/g, 'vewy');
                newWord = newWord.replace(/pretty/g, 'pwetty');
                newWord = newWord.replace(/little/g, 'wittle');
                newWord = newWord.replace(/nice/g, 'nyce');

                // Random additions
                if (Math.random() < 0.15) {
                    newWord += ' nya~';
                } else if (Math.random() < 0.1) {
                    newWord += ' >w<';
                } else if (Math.random() < 0.05) {
                    newWord += ' owo';
                }

                return newWord;
            }
            return word;
        }).join('');
    });

    return furryParts.join('');
}

// Given a string, return a random hex code. The same input always results in the same output
function RandomHex(str) {
    // Simple hash to convert string to a number
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        hash = str.charCodeAt(i) + ((hash << 5) - hash);
        hash |= 0;
    }

    // Use the hash to generate a hue (0–360)
    const hue = Math.abs(hash) % 360;

    // Force super saturation + readable brightness
    const saturation = 100;  // maximum saturation
    const lightness = 55;    // tweak 50–60 depending on your background

    // Convert HSL → RGB → hex
    function hslToHex(h, s, l) {
        s /= 100;
        l /= 100;

        const k = n => (n + h / 30) % 12;
        const a = s * Math.min(l, 1 - l);
        const f = n =>
            l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));

        const r = Math.round(255 * f(0));
        const g = Math.round(255 * f(8));
        const b = Math.round(255 * f(4));

        return (
            "#" +
            r.toString(16).padStart(2, "0") +
            g.toString(16).padStart(2, "0") +
            b.toString(16).padStart(2, "0")
        );
    }

    return hslToHex(hue, saturation, lightness);
}

// Used to construct a message from "parts" variable commonly found in Streamer.bot chat messages
function ConstructMessageFromParts(parts) {
    return parts.map(part => {
        if (part.emoji)
            return ` <img src="${EscapeHTML(part.image)}" alt="${EscapeHTML(part.text)}" title="${EscapeHTML(part.text)}" class="emote"> `;
        if (!part.type)
            return EscapeHTML(part.text);
        if (part.source == 'Twemoji')
            return EscapeHTML(part.text);

        switch (part.type)
        {
            case "text":
                return EscapeHTML(part.text);
            case "cheer":
                // TODO: It seems like Streamer.bot v1.0.5-alpha3 doesn't include the imageUrl for bits in the message parts, only the bits count. We may need to hardcode the image URL format for Twitch bits, or find another way to retrieve it.
                let imageUrl = '';

                if (!part.imageUrl) {
                    const tiers = [100000, 10000, 5000, 1000, 100, 10, 1];
                    const activeTier = tiers.find(tier => part.bits >= tier) || 1;
                    part.imageUrl = `https://d3aqoihi2n8ty8.cloudfront.net/actions/cheer/dark/animated/${activeTier}/4.gif`;
                }

                // Render the cheer emote image
                const emoteImg = `<img src="${EscapeHTML(part.imageUrl)}" alt="${EscapeHTML(part.text)}" title="${EscapeHTML(part.text)}" class="emote">`;
                
                // Render the bits count
                const bitLabel = `<span class="bits">${EscapeHTML(part.bits.toString())}</span>`;
                
                return emoteImg + bitLabel;
            case "mention":
                return part.text;
            default:
                return `<img src="${EscapeHTML(part.imageUrl)}" alt="${EscapeHTML(part.text)}" title="${EscapeHTML(part.text)}" class="emote">`;
        }
    }).join('');
}

// Used to construct a message from "emotes" variable commonly found in Streamer.bot chat messages
function RenderMessageWithEmotesHTML(originalMessage, emotes) {
    if (!emotes || emotes.length === 0) return originalMessage;

    // Sort emotes by startIndex
    emotes.sort((a, b) => a.startIndex - b.startIndex);

    let html = '';
    let cursor = 0;

    emotes.forEach(emote => {
        // Add text before the emote
        if (emote.startIndex > cursor) {
            html += EscapeHTML(originalMessage.slice(cursor, emote.startIndex));
        }

        // Add emote image
        html += `<img src="${EscapeHTML(emote.imageUrl)}" alt="${EscapeHTML(emote.name)}" title="${EscapeHTML(emote.name)}" class="emote">`;

        cursor = emote.endIndex + 1;
    });

    // Add remaining text after last emote
    if (cursor < originalMessage.length) {
        html += EscapeHTML(originalMessage.slice(cursor));
    }

    return html;
}

async function LoadHTMLTemplate(name) {
    const response = await fetch(name);

    if (!response.ok) {
        throw new Error(`Failed to load template: ${name}`);
    }

    const html = await response.text();

    const tempDiv = document.createElement("div");
    tempDiv.innerHTML = html;

    const template = tempDiv.querySelector("template");

    if (!template) {
        throw new Error(`No <template> found in ${name}.html`);
    }

    // Avoid duplicate registration
    if (!document.getElementById(template.id)) {
        document.body.appendChild(template.cloneNode(true));
    }
}

function ConvertMillisecondsToHoursMinutesSecondsSoItLooksBetterAndNotCringe(time) {
    if (isNaN(time) || time <= 0) return "0:00";

    const totalSeconds = Math.floor(time / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    // Format seconds with a leading zero
    const paddedSeconds = ('0' + seconds).slice(-2);

    if (hours > 0) {
        // Format minutes with a leading zero if hours are present
        const paddedMinutes = ('0' + minutes).slice(-2);
        return `${hours}:${paddedMinutes}:${paddedSeconds}`;
    }

    return `${minutes}:${paddedSeconds}`;
}

async function GetAccentPalette(imageUrl) {
    // 1. Dynamic Loader: Load Vibrant.js
    if (typeof Vibrant === 'undefined') {
        await new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = "https://cdnjs.cloudflare.com/ajax/libs/node-vibrant/3.1.6/vibrant.min.js";
            script.onload = resolve;
            script.onerror = reject;
            document.head.appendChild(script);
        });
    }

    return new Promise((resolve) => {
        // Vibrant can take the URL directly!
        Vibrant.from(imageUrl).getPalette((err, palette) => {
            if (err) {
                console.warn("Vibrant failed, using fallback.");
                return resolve({
                    Vibrant: "#ffffff",
                    Muted: "#cccccc",
                    DarkVibrant: "#000000"
                });
            }

            // Extract Hex from each swatch
            const hexPalette = {};
            for (let role in palette) {
                if (palette[role]) {
                    hexPalette[role] = palette[role].getHex();
                }
            }
            resolve(hexPalette);
        });
    });
}

// Generic popup
function SplashscreenPopup(iconSrc, title, subtitle, attribute, background, button) {
    // 1. Check if a popup is already on screen
    const existingOverlay = document.getElementById('global-common-overlay');
    
    // If it exists AND isn't already in the middle of fading out, DO NOTHING
    if (existingOverlay && !existingOverlay.classList.contains('common-closing')) {
        return null; 
    }
    
    // If there IS a popup but it IS fading out, kill it instantly to make room for the new one
    if (existingOverlay) {
        existingOverlay.remove();
    }

    // 2. Inject global styles if they don't already exist in the head
    if (!document.getElementById('global-common-popup-styles')) {
        const styleSheet = document.createElement('style');
        styleSheet.id = 'global-common-popup-styles';
        styleSheet.innerText = `
            #global-common-overlay {
                position: fixed;
                top: 0;
                left: 0;
                width: 100vw;
                height: 100vh;
                background: transparent;
                backdrop-filter: blur(20px);
                -webkit-backdrop-filter: blur(20px);
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 999999;
                animation: commonFadeIn 2s cubic-bezier(0.16, 1, 0.3, 1) forwards;
            }
            .common-popup-card {
                width: 90%;
                max-width: 500px;
                border-radius: 24px;
                box-sizing: border-box;
                display: flex;
                flex-direction: row;
                align-items: stretch;
                overflow: hidden;
                box-shadow: 0 30px 60px rgba(0,0,0,0.4), 
                            0 0 0 1px rgba(255, 255, 255, 0.08);
                animation: commonScaleIn 2.5s cubic-bezier(0.16, 1, 0.3, 1) forwards;
                gap: 32px;
                padding: 32px;
            }
            .common-popup-icon-container {
                display: flex;
                align-items: center;
                justify-content: center;
                background: transparent;
            }
            .common-popup-img {
                height: 48px;
                width: auto;
                object-fit: contain;
                display: block;
                }
            .common-popup-text-content {
                flex: 1;
                display: flex;
                flex-direction: column;
                justify-content: center;
                text-align: left;
                gap: 8px;
            }
            .common-popup-title {
                font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                font-size: 22px;
                font-weight: 700;
                color: #ffffff;
                letter-spacing: -0.02em;
                line-height: 1.2;
            }
            .common-popup-title:last-child {
                margin-bottom: 0;
            }
            .common-popup-subtitle {
                font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                font-size: 14px;
                font-weight: 400;
                color: rgba(255, 255, 255, 0.65);
                margin: 0;
                line-height: 1.5;
            }
            .common-popup-attribute {
                font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                font-size: 13px;
                color: rgba(255, 255, 255, 0.4);
                word-break: break-all;
            }
            /* 💎 GLASSMORPHIC BUTTON STYLES */
            .common-popup-button {
                margin-top: 6px;
                padding: 10px 20px;
                border-radius: 12px;
                border: 1px solid rgba(255, 255, 255, 0.15);
                background: rgba(255, 255, 255, 0.1);
                color: #ffffff;
                font-family: system-ui, sans-serif;
                font-size: 13px;
                font-weight: 600;
                cursor: pointer;
                transition: background 0.2s ease, border-color 0.2s ease, transform 0.1s ease;
                text-align: center;
                width: fit-content;
            }
            .common-popup-button:hover {
                background: rgba(255, 255, 255, 0.2);
                border-color: rgba(255, 255, 255, 0.3);
            }
            .common-popup-button:active {
                transform: scale(0.97);
            }
            @keyframes commonFadeIn {
                from { opacity: 0; } to { opacity: 1; }
            }
            @keyframes commonScaleIn {
                from { transform: scale(0.95) translateY(10px); opacity: 0; }
                to { transform: scale(1) translateY(0); opacity: 1; }
            }
            #global-common-overlay.common-closing {
                animation: commonFadeOut 2s cubic-bezier(0.16, 1, 0.3, 1) forwards;
            }
            .common-closing .common-popup-card {
                animation: commonScaleOut 2.5s cubic-bezier(0.16, 1, 0.3, 1) forwards;
            }
            @keyframes commonFadeOut {
                from { opacity: 1; } to { opacity: 0; }
            }
            @keyframes commonScaleOut {
                from { transform: scale(1) translateY(0); opacity: 1; }
                to { transform: scale(0.95) translateY(10px); opacity: 0; }
            }
        `;
        document.head.appendChild(styleSheet);
    }

    // 3. Create elements
    const overlay = document.createElement('div');
    overlay.id = 'global-common-overlay';

    const card = document.createElement('div');
    card.className = 'common-popup-card';
    card.style.background = background || 'linear-gradient(135deg, #1a1a1e 0%, #111113 100%)';

    // 4. Construct Inner Content (Strict Conditional Rendering)
    const iconMarkup = iconSrc 
        ? `<div class="common-popup-icon-container">
               <img src="${iconSrc}" class="common-popup-img" alt="Alert Icon" />
           </div>` 
        : '';
        
    const titleMarkup = title 
        ? `<label class="common-popup-title">${title}</label>` 
        : '';
        
    const subtitleMarkup = subtitle 
        ? `<label class="common-popup-subtitle">${subtitle}</label>` 
        : '';
        
    const attributeMarkup = attribute 
        ? `<label class="common-popup-attribute">${attribute}</label>`
        : '';

    // Render button conditional markup
    const buttonMarkup = (button && button.text)
        ? `<button class="common-popup-button">${button.text}</button>`
        : '';

    card.innerHTML = `
        ${iconMarkup}
        <div class="common-popup-text-content">
            ${titleMarkup}
            ${subtitleMarkup}
            ${attributeMarkup}
            ${buttonMarkup}
        </div>
    `;

    // 5. Setup Action Listeners if Button Exists
    if (button && button.text && button.action) {
        const actionBtn = card.querySelector('.common-popup-button');
        if (actionBtn) {
            actionBtn.addEventListener('click', () => {
                if (typeof button.action === 'function') {
                    button.action();
                } else if (typeof button.action === 'string') {
                    window.open(button.action, '_blank');
                }
            });
        }
    }

    // 6. Append to page DOM
    overlay.appendChild(card);
    document.body.appendChild(overlay);

    return {
        element: overlay,
        close: () => {
            overlay.classList.add('common-closing');
            overlay.addEventListener('animationend', (event) => {
                if (event.target === overlay) {
                    overlay.remove();
                }
            });
        }
    };
}

function VersionCheck(requiredVersion, installedVersion) {
    const [rMajor, rMinor, rPatch] = requiredVersion.split('.').map(Number);
    const [iMajor, iMinor, iPatch] = installedVersion.split('.').map(Number);

    // Compare Major
    if (iMajor > rMajor) return 'compatible';
    if (iMajor < rMajor) return 'incompatible';

    // Major matches, compare Minor
    if (iMinor > rMinor) return 'compatible';
    if (iMinor < rMinor) return 'incompatible'; // or 'incompatible' depending on your policy

    // Major and Minor match, compare Patch
    if (iPatch >= rPatch) return 'compatible';

    return 'soft-warning'; // Installed patch is lower than required
}

function SanitizeHTML(htmlString) {
    // 1. Parse the string into a temporary DOM document
    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlString, 'text/html');

    // 2. Define allowed tags and attributes
    const allowedTags = ['IMG', 'SPAN', 'B', 'I', 'BR', 'EM', 'STRONG'];
    const allowedAttrs = ['src', 'class'];

    // 3. Walk through all elements in the parsed document
    const allElements = doc.body.querySelectorAll('*');
    allElements.forEach(el => {
        // Check if it's an <img> tag and enforce class restrictions
        if (el.tagName === 'IMG') {
            const className = el.getAttribute('class') || '';
            // Split classes by whitespace in case there are multiple (e.g., class="emote custom")
            const classes = className.split(/\s+/);
            
            // Must contain either 'emote' or 'bits' to be allowed
            const hasValidClass = classes.includes('emote') || classes.includes('bits');
            
            if (!hasValidClass) {
                // Unwrap or remove the unauthorized <img> tag
                const parent = el.parentNode;
                while (el.firstChild) {
                    parent.insertBefore(el.firstChild, el);
                }
                parent.removeChild(el);
                return;
            }
        }

        // If any other tag isn't in our allowed list, unwrap it
        if (!allowedTags.includes(el.tagName)) {
            const parent = el.parentNode;
            while (el.firstChild) {
                parent.insertBefore(el.firstChild, el);
            }
            parent.removeChild(el);
            return;
        }

        // Strip out any attributes not explicitly allowed (like onerror, onload, etc.)
        Array.from(el.attributes).forEach(attr => {
            if (!allowedAttrs.includes(attr.name.toLowerCase())) {
                el.removeAttribute(attr.name);
            }
        });
    });

    return doc.body.innerHTML;
}