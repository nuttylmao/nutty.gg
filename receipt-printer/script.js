///////////////////
// PAGE ELEMENTS //
///////////////////

const headerEl = document.getElementById('header');
const contentEl = document.getElementById('content');
const footerEl = document.getElementById('footer');

const avatarEl = document.getElementById('avatar');
const titleEl = document.getElementById('title');
const subtitleEl = document.getElementById('subtitle');
const dateEl = document.getElementById('date');



//////////////////////
// GLOBAL VARIABLES //
//////////////////////

const avatarMap = new Map();



/////////////////////////
// STREAMER.BOT CLIENT //
/////////////////////////

// Check local storage
if (localStorage.getItem('sbServerAddress') === null)
    localStorage.setItem('sbServerAddress', '127.0.0.1');
if (localStorage.getItem('sbServerPort') === null)
    localStorage.setItem('sbServerPort', '8080');

document.getElementById('ip').value = localStorage.getItem('sbServerAddress');
document.getElementById('port').value = localStorage.getItem('sbServerPort');

let sbServerAddress = document.getElementById('ip').value;
let sbServerPort = document.getElementById('port').value;

let client = new StreamerbotClient({
    host: sbServerAddress,
    port: sbServerPort,

    onConnect: (data) => {
        console.log(`Streamer.bot successfully connected to ${sbServerAddress}:${sbServerPort}`)
        console.debug(data);

        SetConnectionState(true);
    },

    onDisconnect: () => {
        console.error(`Streamer.bot disconnected from ${sbServerAddress}:${sbServerPort}`)
        SetConnectionState(false);
    }
});

client.on('General.Custom', (response) => {
    console.debug(response.data);
    CustomEvent(response.data);
})


////////////////////
// STREAM PRINTER //
////////////////////

async function CustomEvent(data) {
    if (data.actionName != 'Receipt Printer | Events')
        return;

    // Get a reference to the template
    const template = document.getElementById('receipt-template');

    // Create a new instance of the template
    const instance = template.content.cloneNode(true);

    // Get divs
    const headerEl = instance.querySelector('#header');
    const contentEl = instance.querySelector('#content');
    const footerEl = instance.querySelector('#footer');
    const avatarEl = instance.querySelector('#avatar');
    const titleEl = instance.querySelector('#title');
    const subtitleEl = instance.querySelector('#subtitle');
    const iconEl = instance.querySelector('#icon');
    const dateEl = instance.querySelector('#date');

    // Set the main contents
    switch (data.__source) {
        // Twitch events
        case ('TwitchCheer'):
            {
                avatarEl.src = await GetAvatar(data.userName, 'twitch');
                titleEl.innerText = `${data.bits} BITS`;
                subtitleEl.innerText = `${data.user}`;

                const messageEl = document.createElement('div');
                messageEl.innerHTML = data.message;

                // Render emotes
                for (i in data.emotes) {
                    const emoteElement = `<img src="${data.emotes[i].imageUrl}" class="emote"/>`;
                    const emoteName = EscapeRegExp(data.emotes[i].name);

                    let regexPattern = emoteName;

                    // Check if the emote name consists only of word characters (alphanumeric and underscore)
                    if (/^\w+$/.test(emoteName)) {
                        regexPattern = `\\b${emoteName}\\b`;
                    }
                    else {
                        // For non-word emotes, ensure they are surrounded by non-word characters or boundaries
                        regexPattern = `(?<=^|[^\\w])${emoteName}(?=$|[^\\w])`;
                    }

                    const regex = new RegExp(regexPattern, 'g');
                    messageEl.innerHTML = messageEl.innerHTML.replace(regex, emoteElement);
                }

                // Render cheermotes
                for (i in data.cheerEmotes) {
                    const bits = data.cheerEmotes[i].bits;
                    const imageUrl = data.cheerEmotes[i].imageUrl;
                    const name = data.cheerEmotes[i].name;
                    const cheerEmoteElement = `<img src="${imageUrl}" class="emote"/>`;
                    const bitsElements = `<span class="bits">${bits}</span>`
                    messageEl.innerHTML = messageEl.innerHTML.replace(new RegExp(`\\b${name}${bits}\\b`, 'i'), cheerEmoteElement + bitsElements);
                }

                contentEl.appendChild(messageEl);

                // Set the platform icon
                SetPlatformIcon(iconEl, 'twitch');
            }
            break;
        case ('TwitchSub'):
            {
                avatarEl.src = await GetAvatar(data.userName, 'twitch');
                titleEl.innerText = `${data.tier} subscriber`;
                subtitleEl.innerText = `${data.user}`;

                const messageEl = document.createElement('div');
                messageEl.innerHTML = '<b>First time subscriber!</b>';

                contentEl.appendChild(messageEl);

                // Set the platform icon
                SetPlatformIcon(iconEl, 'twitch');
            }
            break;
        case ('TwitchReSub'):
            {
                avatarEl.src = await GetAvatar(data.userName, 'twitch');
                titleEl.innerText = `${data.tier} subscriber`;
                subtitleEl.innerText = `${data.user}`;

                const messageEl = document.createElement('div');
                messageEl.innerHTML = `<b>${data.cumulative} months${data.monthStreak > 1 ? ' (' + data.monthStreak + ' in a row!)' : ''}</b>`;
                if (data.messageStripped)
                    messageEl.innerHTML += `<br><br><i>${data.messageStripped}</i>`;

                contentEl.appendChild(messageEl);

                // Set the platform icon
                SetPlatformIcon(iconEl, 'twitch');
            }
            break;
        case ('TwitchGiftSub'):
            {
                // Don't put profile pictures for subs that come from Gift Bombs to avoid rate limits
                if (data.fromGiftBomb)
                    //avatarEl.style.display = 'none';
                    return;
                else
                    avatarEl.src = await GetAvatar(data.recipientUserName, 'twitch');
                titleEl.innerText = `Gifted Sub`;

                const messageEl = document.createElement('div');
                messageEl.innerHTML += `<b>${data.recipientUser}</b><br>received a ${data.tier} sub from<br>`;
                if (data.anonymous)
                    messageEl.innerHTML += `a mysterious admirer...`;
                else
                    messageEl.innerHTML += `<b>${data.user}</b>!`;

                contentEl.appendChild(messageEl);

                // Set the platform icon
                SetPlatformIcon(iconEl, 'twitch');
            }
            break;
        case ('TwitchGiftBomb'):
            {
                avatarEl.src = await GetAvatar(data.userName, 'twitch');
                titleEl.innerHTML = `${data.gifts} × Gifted Subs`;
                subtitleEl.innerHTML += `✧*･ﾟ✧ ${data.tier.toUpperCase()} ✧･ﾟ*✧`;
                if (data.anonymous)
                    subtitleEl.innerHTML += `<br>From a mystery person...`;
                else
                    subtitleEl.innerHTML += `<br>${data.user}`;

                const messageEl = document.createElement('div');
                if (data.totalGifts > 1) {
                    messageEl.innerHTML = `They've gifted <b>${data.totalGifts} subs</b> in total!</br></br>`;
                }

                // Get a list of all recipient users
                Object.keys(data)
                    .filter(key => /^gift\.recipientUser\d+$/.test(key))
                    .forEach((key, index) => {
                        const username = data[key];
                        messageEl.innerHTML += `${username}</br>`;
                    });

                contentEl.appendChild(messageEl);

                // Set the platform icon
                SetPlatformIcon(iconEl, 'twitch');
            }
            break;
        case ('TwitchRaid'):
            {
                avatarEl.src = await GetAvatar(data.userName, 'twitch');

                const messageEl = document.createElement('div');
                messageEl.innerHTML = `<b>${data.user}</b><br>is raiding with a party of<br><b>${data.viewers} viewers!</b>`;

                contentEl.appendChild(messageEl);

                // Set the platform icon
                SetPlatformIcon(iconEl, 'twitch');
            }
            break;

        // YouTube Events
        case ('YouTubeNewSponsor'):
            {
                if (data.profileImageUrl)
                    avatarEl.src = data.profileImageUrl;
                else
                    avatarEl.style.display = 'none';

                titleEl.innerText = `${data.levelName}`;
                subtitleEl.innerText = `${data.user}`;

                contentEl.style.display = 'none';

                // Set the platform icon
                SetPlatformIcon(iconEl, 'youtube');
            }
            break;
        case ('YouTubeGiftMembershipReceived'):
            {
                if (data.profileImageUrl)
                    avatarEl.src = data.profileImageUrl;
                else
                    avatarEl.style.display = 'none';
                titleEl.innerText = `Gifted Membership`;

                const messageEl = document.createElement('div');
                messageEl.innerHTML = `<b>${data.user}</b><br>received a membership from<br><b>${data.gifterUser}</b>!`;

                contentEl.appendChild(messageEl);

                // Set the platform icon
                SetPlatformIcon(iconEl, 'youtube');
            }
            break;
        case ('YouTubeSuperChat'):
            {
                if (data.profileImageUrl)
                    avatarEl.src = data.profileImageUrl;
                else
                    avatarEl.style.display = 'none';
                titleEl.style.fontSize = '2em';
                titleEl.innerText = `${data.amount}`;

                const messageEl = document.createElement('div');
                messageEl.innerHTML = `<b>${data.user}</b><br>sent a Super Chat!`;
                if (data.message)
                    messageEl.innerHTML += `<br><br><i>${data.message}</i>`;

                contentEl.appendChild(messageEl);

                // Set the platform icon
                SetPlatformIcon(iconEl, 'youtube');
            }
            break;
        case ('YouTubeSuperSticker'):
            {
                // TODO: Need to add image URL of Super Sticker
                if (data.profileImageUrl)
                    avatarEl.src = data.profileImageUrl;
                else
                    avatarEl.style.display = 'none';
                titleEl.style.fontSize = '2em';
                titleEl.innerText = `${data.amount}`;

                const messageEl = document.createElement('div');
                messageEl.innerHTML = `<b>${data.user}</b><br>sent a Super Sticker!`;

                contentEl.appendChild(messageEl);

                // Set the platform icon
                SetPlatformIcon(iconEl, 'youtube');
            }
            break;
            break;

        // Kick Events
        case ('KickSubscription'):
        case ('KickResubscription'):
            {
                avatarEl.src = ConvertWEBPToPNG(await GetAvatar(data.user, 'kick'));
                titleEl.innerText = `Subscriber`;
                subtitleEl.innerText = `${data.user}`;

                const messageEl = document.createElement('div');
                if (data.duration > 1)
                    messageEl.innerHTML = `<b>${data.duration} months</b>`;
                else
                    messageEl.innerHTML = '<b>First time subscriber!</b>';

                contentEl.appendChild(messageEl);

                // Set the platform icon
                SetPlatformIcon(iconEl, 'kick');
            }
            break;
        case ('KickGiftSubscription'):
            {
                avatarEl.src = ConvertWEBPToPNG(data["recipient.profilePicture"]);
                titleEl.innerText = `Gifted Sub`;

                const messageEl = document.createElement('div');
                messageEl.innerHTML = `<b>${data["recipient.userName"]}</b><br>received a sub from<br><b>${data.user}</b>!`;

                contentEl.appendChild(messageEl);

                // Set the platform icon
                SetPlatformIcon(iconEl, 'kick');
            }
            break;
        case ('KickMassGiftSubscription'):
            {
                // There is only one sub, so use the same template for a single gifted sub
                if ('recipient.userName' in data) {
                    avatarEl.src = ConvertWEBPToPNG(data["recipient.profilePicture"]);
                    titleEl.innerText = `Gifted Sub`;

                    const messageEl = document.createElement('div');
                    messageEl.innerHTML = `<b>${data["recipient.userName"]}</b><br>received a sub from<br><b>${data.user}</b>!`;

                    contentEl.appendChild(messageEl);
                }
                else {
                    avatarEl.src = ConvertWEBPToPNG(await GetAvatar(data.user, 'kick'));

                    // Calculate how many subs were gived
                    let maxIndex = -1;
                    for (const key in data) {
                        const match = key.match(/^recipient\.(\d+)\./);
                        if (match) {
                            const index = parseInt(match[1], 10);
                            if (index > maxIndex) {
                                maxIndex = index;
                            }
                        }
                    }
                    const totalGifts = maxIndex + 1;

                    titleEl.innerHTML = `${totalGifts} × Gifted Subs`;
                    subtitleEl.innerText = `${data.user}`;

                    const messageEl = document.createElement('div');

                    // Loop through each recipient and include it in the receipt
                    const recipients = {};

                    // Reconstruct recipient objects
                    for (const key in data) {
                        const match = key.match(/^recipient\.(\d+)\.(.+)$/);
                        if (match) {
                            const index = match[1];
                            const field = match[2];

                            if (!recipients[index]) {
                                recipients[index] = {};
                            }

                            recipients[index][field] = data[key];
                        }
                    }

                    // Loop through and print userName
                    for (const index in recipients) {
                        messageEl.innerHTML += `${recipients[index].userName}<br>`;
                    }

                    contentEl.appendChild(messageEl);
                }

                // Set the platform icon
                SetPlatformIcon(iconEl, 'kick');
            }
            break;

        // StreamElements Events
        case ('StreamElementsTip'):
            {
                const avatarURL = await GetAvatar(data.tipUsername, 'twitch');
                if (IsValidUrl(avatarURL))
                    avatarEl.src = avatarURL;
                else
                    avatarEl.style.display = 'none'
                titleEl.style.fontSize = '2em';
                titleEl.innerText = FormatCurrency(data.tipAmount, data.tipCurrency);
                subtitleEl.innerText = `${data.tipUsername}`;

                if (data.tipMessage) {
                    const messageEl = document.createElement('div');
                    messageEl.innerHTML = `<i>${data.tipMessage}</i>`;

                    contentEl.appendChild(messageEl);
                }
                else {
                    contentEl.style.display = 'none';
                }
            }
            break;

        // Streamlabs Events
        case ('StreamlabsDonation'):
            {
                const avatarURL = await GetAvatar(data.donationFrom, 'twitch');
                if (IsValidUrl(avatarURL))
                    avatarEl.src = avatarURL;
                else
                    avatarEl.style.display = 'none'
                titleEl.style.fontSize = '2em';
                titleEl.innerText = data.donationFormattedAmount;
                subtitleEl.innerText = `${data.donationFrom}`;

                if (data.donationMessage) {
                    const messageEl = document.createElement('div');
                    messageEl.innerHTML = `<i>${data.donationMessage}</i>`;

                    contentEl.appendChild(messageEl);
                }
                else {
                    contentEl.style.display = 'none';
                }
            }
            break;

        // Fourthwall Events
        case ('FourthwallDonation'):
            {
                const avatarURL = await GetAvatar(data["fw.username"], 'twitch');
                if (IsValidUrl(avatarURL))
                    avatarEl.src = avatarURL;
                else
                    avatarEl.style.display = 'none'
                titleEl.style.fontSize = '2em';
                titleEl.innerText = FormatCurrency(data["fw.amount"], data["fw.currency"]);
                if (data["fw.username"])
                    subtitleEl.innerText = `${data["fw.username"]}`;
                else if (data["fw.email"])
                    subtitleEl.innerText = `${data["fw.email"]}`;

                if (data.message) {
                    const messageEl = document.createElement('div');
                    messageEl.innerHTML = `<i>${data.message}</i>`;

                    contentEl.appendChild(messageEl);
                }
                else {
                    contentEl.style.display = 'none';
                }
            }
            break;
        // case ('FourthwallGiftPurchase'):
        //     break;
        case ('FourthwallOrderPlaced'):
            {
                // Only print non-free orders
                if (data["fw.total"] <= 0)
                    return;

                const avatarURL = await GetAvatar(data["fw.username"], 'twitch');
                if (IsValidUrl(avatarURL))
                    avatarEl.src = avatarURL;
                else
                    avatarEl.style.display = 'none'
                titleEl.style.fontSize = '2em';
                titleEl.innerText = FormatCurrency(data["fw.total"], data["fw.currency"]);
                if (data["fw.username"])
                    subtitleEl.innerText = `${data["fw.username"]}`;
                else if (data["fw.email"])
                    subtitleEl.innerText = `${data["fw.email"]}`;

                // Compile a list of all items bought                
                const variants = [];

                // Iterate through all keys in the data object
                for (const key in data) {
                    const match = key.match(/^fw\.variants\[(\d+)\]\.(\w+)$/);
                    if (match) {
                        const index = Number(match[1]);
                        const field = match[2];

                        // Make sure the array slot exists
                        if (!variants[index]) {
                            variants[index] = {};
                        }

                        // Assign the field to the appropriate variant object
                        variants[index][field] = data[key];
                    }
                }

                // Print each item on the receipt
                const messageEl = document.createElement('div');
                variants.forEach((variant, i) => {
                    messageEl.innerHTML += `${variant.quantity} × ${variant.name}<br>`;
                });
                messageEl.style.textAlign = 'left';

                // Add a cute thank you message because you're uwu like that
                const thankYouEl = document.createElement('div');
                thankYouEl.innerHTML += `<br><b>Thank you for your purchase!</b>`;

                contentEl.appendChild(messageEl);
                contentEl.appendChild(thankYouEl);
            }
            break;
        case ('FourthwallSubscriptionPurchased'):
            {
                const avatarURL = await GetAvatar(data["fw.nickname"], 'twitch');
                if (IsValidUrl(avatarURL))
                    avatarEl.src = avatarURL;
                else
                    avatarEl.style.display = 'none'
                titleEl.innerText = `New Member`;
                subtitleEl.innerHTML = `${data["fw.nickname"]}`;

                const messageEl = document.createElement('div');
                messageEl.innerHTML = `Thanks for joining at the <b>${FormatCurrency(data["fw.amount"], data["fw.currency"])}</b> tier!`;

                contentEl.appendChild(messageEl);
            }
            break;

        // Custom Code Events
        case ('CustomCodeEvent'):
            {
                switch (data.triggerCustomCodeEventName) {
                    case ('kickIncomingRaid'):
                        {
                            avatarEl.src = ConvertWEBPToPNG(await GetAvatar(data.user, 'kick'));

                            const messageEl = document.createElement('div');
                            messageEl.innerHTML = `<b>${data.user}</b><br>is hosting with a party of<br><b>${data.viewers} viewers!</b>`;

                            contentEl.appendChild(messageEl);

                            // Set the platform icon
                            SetPlatformIcon(iconEl, 'kick');
                        }
                        break;
                }
            }
            break;

        // Don't print any event not excplicitly listed above
        default:
            return;
    }

    // Set the timestamp
    const { DateTime } = luxon;
    const now = DateTime.local();
    const formatted = now.toFormat("cccc, LLLL d',' yyyy HH:mm:ss");

    // Add ordinal suffix manually
    function addOrdinal(n) {
        if (n >= 11 && n <= 13) return 'th';
        switch (n % 10) {
            case 1: return 'st';
            case 2: return 'nd';
            case 3: return 'rd';
            default: return 'th';
        }
    }

    const day = now.day;
    const ordinal = addOrdinal(day);
    const fullFormatted = now.toFormat(`cccc, LLLL '${day}${ordinal}' yyyy HH:mm:ss`);

    dateEl.textContent = fullFormatted;

    // Send it to the print routine!
    const receiptHTML = await GetRenderedHTML(instance);
    console.log(receiptHTML);
    client.doAction({ name: 'Receipt Printer | Print Routine' }, {
        receiptHTML: receiptHTML,
        isTest: data.isTest
    });
}


//////////////////////
// HELPER FUNCTIONS //
//////////////////////

async function GetAvatar(username, platform) {

    // First, check if the username is hashed already
    if (avatarMap.has(`${username}-${platform}`)) {
        console.debug(`Avatar found for ${username} (${platform}). Retrieving from hash map.`)
        return avatarMap.get(`${username}-${platform}`);
    }

    // If code reaches this point, the username hasn't been hashed, so retrieve avatar
    switch (platform) {
        case 'twitch':
            {
                console.debug(`No avatar found for ${username} (${platform}). Retrieving from Decapi.`)
                let response = await fetch('https://decapi.me/twitch/avatar/' + username);
                let data = await response.text();
                avatarMap.set(`${username}-${platform}`, data);
                return data;
            }
        case 'kick':
            {
                console.debug(`No avatar found for ${username} (${platform}). Retrieving from Kick.`)
                try {
                    let response = await fetch('https://kick.com/api/v2/channels/' + username);
                    console.log('https://kick.com/api/v2/channels/' + username)
                    let data = await response.json();
                    let avatarURL = data.user.profile_pic;
                    if (!avatarURL)
                        avatarURL = 'https://kick.com/img/default-profile-pictures/default2.jpeg';
                    avatarMap.set(`${username}-${platform}`, avatarURL);
                    return avatarURL;
                }
                catch (error) {
                    console.debug(error);
                    return 'https://kick.com/img/default-profile-pictures/default2.jpeg';
                }
            }
    }
}

async function GetRenderedHTML(fragment) {
    if (!(fragment instanceof DocumentFragment)) {
        throw new Error('Argument must be a DocumentFragment');
    }

    // Filter out comment nodes from fragment content
    const nodes = Array.from(fragment.childNodes).filter(
        node => node.nodeType !== Node.COMMENT_NODE
    );

    const bodyContent = nodes
        .map(node => node.outerHTML || node.textContent)
        .join('');

    // Get inline <style> contents
    const inlineStyles = Array.from(document.querySelectorAll('style'))
        .map(style => style.textContent)
        .join('\n');

    // Get all external stylesheet URLs
    const linkHrefs = Array.from(document.querySelectorAll('link[rel="stylesheet"]'))
        .map(link => link.href);

    // Fetch external CSS contents
    const externalCSSContents = await Promise.all(
        linkHrefs.map(async href => {
            try {
                const res = await fetch(href);
                if (!res.ok) throw new Error(`Failed to load CSS from ${href}`);
                return await res.text();
            } catch {
                console.warn(`Could not fetch CSS from ${href}`);
                return '';
            }
        })
    );

    // Combine all CSS into one string
    const combinedCSS = inlineStyles + '\n' + externalCSSContents.join('\n');

    // Build the full standalone HTML string
    const fullHTML = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>Exported Page</title>
  <style>${combinedCSS}</style>
</head>
<body>
  ${bodyContent}
</body>
</html>`.trim();

    return fullHTML;
}

function ConvertWEBPToPNG(URL) {
    return `https://images.weserv.nl/?url=${URL}&output=png`;
}

function FormatCurrency(amount, currency) {
    const isISOCode = /^[A-Z]{3}$/.test(currency);

    if (isISOCode) {
        try {
            return new Intl.NumberFormat(undefined, {
                style: 'currency',
                currency: currency,
                currencyDisplay: 'symbol',
            }).format(amount);
        } catch {
            return `${amount.toFixed(2)} ${currency}`;
        }
    }

    // Handle some common symbols that go before the number
    const symbolsBefore = ['$', '€', '£', '¥', '₹'];

    if (symbolsBefore.includes(currency)) {
        return `${currency}${amount.toFixed(2)}`;
    }

    // Otherwise default to appending after
    return `${amount.toFixed(2)} ${currency}`;
}

function IsValidUrl(string) {
    try {
        new URL(string);
        return true;
    } catch {
        return false;
    }
}

function EscapeRegExp(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // $& means the whole matched string
}

function SetPlatformIcon(el, platform) {
    // Set the platform icon
    let baseURL = window.location.href;
    baseURL = baseURL.replace(/index\.html$/i, '');

    el.src = `${baseURL}/icons/platforms/${platform}.png`;
}



///////////////////////////////////
// STREAMER.BOT WEBSOCKET STATUS //
///////////////////////////////////

function SetConnectionState(isConnected) {
    if (isConnected) {
        document.getElementById('ip').disabled = true;
        document.getElementById('port').disabled = true;
        document.getElementById('connect-button').style.backgroundColor = '#e43b3b';
        document.getElementById('connect-button').innerText = 'Disconnect';

        localStorage.setItem('sbServerAddress', document.getElementById('ip').value);
        localStorage.setItem('sbServerPort', document.getElementById('port').value);
    }
    else {
        document.getElementById('ip').disabled = false;
        document.getElementById('port').disabled = false;
        document.getElementById('connect-button').style.backgroundColor = '#3be477';
        document.getElementById('connect-button').innerText = 'Connect';
    }
}

function Connect() {
    if (document.getElementById('ip').disabled)
        client.disconnect();
    else
    {
        client.options.host = document.getElementById('ip').value;
        client.options.port = document.getElementById('port').value;
        client.connect();
    }
}