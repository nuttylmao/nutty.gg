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
                    // Retry with underscores replaced by dashes
                    const altUsername = username.replace(/_/g, "-");
                    url = `https://kick.com/api/v2/channels/${altUsername}`;
                    response = await fetch(url);
                    if (!response.ok) {
                        throw new Error(`HTTP error ${response.status}`);
                    }
                }

                let data = await response.json();
                let avatarURL = data.user?.profile_pic || 'https://kick.com/img/default-profile-pictures/default2.jpeg';
                avatarMap.set(`${username}-${platform}`, avatarURL);
                return avatarURL;
            } catch (error) {
                console.error("Failed to fetch avatar:", error.message);
                return 'https://kick.com/img/default-profile-pictures/default2.jpeg';
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
            return ` <img src="${part.image}" alt="${part.text}" title="${part.text}" class="emote"> `;
        if (!part.type)
            return part.text;
        if (part.source == 'Twemoji')
            return part.text;

        switch (part.type)
        {
            case "text":
                return part.text;
            case "cheer":
                // Render the cheer emote image
                const emoteImg = `<img src="${part.imageUrl}" alt="${part.text}" title="${part.text}" class="emote">`;
                
                // Render the bits count
                const bitLabel = `<span class="bits">${part.bits}</span>`;
                
                return emoteImg + bitLabel;
            default:
                return `<img src="${part.imageUrl}" alt="${part.text}" title="${part.text}" class="emote">`;
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
            html += escapeHTML(originalMessage.slice(cursor, emote.startIndex));
        }

        // Add emote image
        html += `<img src="${emote.imageUrl}" alt="${escapeHTML(emote.name)}" title="${escapeHTML(emote.name)}" class="emote">`;

        cursor = emote.endIndex + 1;
    });

    // Add remaining text after last emote
    if (cursor < originalMessage.length) {
        html += escapeHTML(originalMessage.slice(cursor));
    }
    
    // Simple HTML escape function
    function escapeHTML(str) {
        return str.replace(/[&<>"']/g, match => {
            const escape = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };
            return escape[match];
        });
    }

    return html;
}