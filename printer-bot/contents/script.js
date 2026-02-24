//////////////////////
// GLOBAL VARIABLES //
//////////////////////

const sbActionPrintRoutine = '5c756513-a1d0-4285-9dbc-21ad34491310';



/////////////////////////
// STREAMER.BOT EVENTS //
/////////////////////////

window.parent.sbClient.on('General.Custom', (response) => {
    console.debug(response.data);
    CustomEvent(response.data);
})



/////////////////
// PRINTER BOT //
/////////////////

async function CustomEvent(data) {
    if (data.actionName != 'Printer Bot | Events')
        return;

    // Get a reference to the template
    const template = document.getElementById('receipt-template');

    // Create a new instance of the template
    const instance = template.content.cloneNode(true);

    // Get divs
    const headerEl = instance.querySelector('#receipt-header');
    const contentEl = instance.querySelector('#receipt-content');
    const footerEl = instance.querySelector('#receipt-footer');
    const avatarEl = instance.querySelector('#receipt-avatar');
    const titleEl = instance.querySelector('#receipt-title');
    const subtitleEl = instance.querySelector('#receipt-subtitle');
    const iconEl = instance.querySelector('#receipt-icon');
    const dateEl = instance.querySelector('#receipt-date');

    // Set the main contents
    switch (data.__source) {
        // Twitch events
        case ('TwitchCheer'):
            {
                avatarEl.src = await GetAvatar(data.userName, 'twitch');
                titleEl.innerText = `${data.bits} BITS`;
                subtitleEl.innerText = `${data.user}`;

                const messageEl = document.createElement('div');
                messageEl.innerHTML = ConstructMessageFromParts(data.parts);

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
                if (data.anonymous)
                    messageEl.innerHTML += `<b>✦･ﾟ A mysterious admirer ･ﾟ✦</b><br>`;
                else
                    messageEl.innerHTML += `<b>${data.user}</b><br>`;
                messageEl.innerHTML += `gifted a ${data.tier} sub to<br><b>${data.recipientUser}</b>`;

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
                if (data.userProfileUrl)
                    avatarEl.src = data.userProfileUrl;
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
                if (data.gifterProfileUrl)
                    avatarEl.src = data.gifterProfileUrl;
                else
                    avatarEl.style.display = 'none';
                titleEl.innerText = `Gifted Membership`;

                const messageEl = document.createElement('div');
                messageEl.innerHTML = `<b>${data.gifterUser}</b><br>gifted a membership to<br><b>${data.user}</b>!`;

                contentEl.appendChild(messageEl);

                // Set the platform icon
                SetPlatformIcon(iconEl, 'youtube');
            }
            break;
        case ('YouTubeSuperChat'):
            {
                if (data.userProfileUrl)
                    avatarEl.src = data.userProfileUrl;
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
                if (data.stickerImageUrl)
                    avatarEl.src = data.stickerImageUrl;
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
                avatarEl.src = ConvertWEBPToPNG(await GetAvatar(data["recipient.userLogin"], 'kick'));
                titleEl.innerText = `Gifted Sub`;

                const messageEl = document.createElement('div');
                messageEl.innerHTML = `<b>${data.user}</b><br>gifted a sub to<br><b>${data["recipient.userName"]}</b>!`;

                contentEl.appendChild(messageEl);

                // Set the platform icon
                SetPlatformIcon(iconEl, 'kick');
            }
            break;
        case ('KickMassGiftSubscription'):
            {
                // There is only one sub, so use the same template for a single gifted sub
                if ('recipient.userName' in data) {
                    avatarEl.src = ConvertWEBPToPNG(await GetAvatar(data["recipient.userLogin"], 'kick'));
                    titleEl.innerText = `Gifted Sub`;

                    const messageEl = document.createElement('div');
                    messageEl.innerHTML = `<b>${data.user}</b><br>gifted a sub to<br><b>${data["recipient.userName"]}</b>!`;

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

                if (data["fw.message"]) {
                    const messageEl = document.createElement('div');
                    messageEl.innerHTML = `<i>${data["fw.message"]}</i>`;

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

                // Check if they left a custom message
                let customMessageEl = document.createElement('div');
                const customMessage = data["fw.statmessageus"];
                if (customMessage) {
                    const txt = document.createElement("textarea");
                    txt.innerHTML = customMessage;
                    customMessageEl.innerHTML += `<br><i>${txt.value}</i>`;
                }

                // Add a cute thank you message because you're uwu like that
                const thankYouEl = document.createElement('div');
                thankYouEl.innerHTML += `<br><b>Thank you for your purchase!</b>`;

                contentEl.appendChild(messageEl);
                contentEl.appendChild(customMessageEl);
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
                    case ('kickKicksGifted'):
                        {
                            if (data.giftType != 'LEVEL_UP')
                                return;

                            avatarEl.src = ConvertWEBPToPNG(`https://files.kick.com/kicks/gifts/${data.gift.toLowerCase().replace(/ /g, "-")}.webp`);
                            avatarEl.style.borderRadius = '0px';
                            titleEl.innerText = `${data.amount} KICKS`;
                            subtitleEl.innerText = `${data.sender}`;

                            const messageEl = document.createElement('div');
                            messageEl.innerHTML = data.message;

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

    window.parent.sbClient.doAction({ id: sbActionPrintRoutine }, {
        receiptHTML: receiptHTML,
        isTest: data.isTest,
        printerName: document.getElementById('printer-name').value,
        paperWidth: document.getElementById('paper-width').value,
        ignoreTestTriggers: document.getElementById('ignore-test-triggers').checked,
        deleteTempFiles: document.getElementById('delete-temp-files').checked
    });
}


//////////////////////
// HELPER FUNCTIONS //
//////////////////////

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

function SetPlatformIcon(el, platform) {
    // Set the platform icon
    let baseURL = window.location.href;
    baseURL = baseURL.replace(/index\.html$/i, '');

    el.src = `${baseURL}/icons/platforms/${platform}.png`;
}



///////////////////////
// PAGE INTERACTIONS //
///////////////////////

let data = {
    "__source": "TwitchSub",
    "tier": "prime",
    "isPrimeSub": true,
    "monthsSubscribed": 1,
    "isTest": false,
    "actionName": "Printer Bot | Events",
    "user": "nutty",
    "userName": "nutty",
    "userType": "twitch"
}

// let data = {
//     "__source": "CustomCodeEvent",
//     "actionName": "Printer Bot | Events",
//     "triggerCustomCodeEventName": "kickKicksGifted",
//     "amount": 100,
//     "message": "Eat my ass",
//     "gift": "Flex",
//     "giftType": "LEVEL_UP",
//     "giftTier": "LEVEL_UP",
//     "sender": "DJSUSAN00",
//     "senderId": "170168",
//     "senderColor": "#1475E1",
//     "eventSource": "kick",
//     "fromKick": true
// }

async function TestPrint() {
    CustomEvent(data);
}



///////////////////
// PAGE SETTINGS //
///////////////////

// Get references
const printerNameInput = document.getElementById('printer-name');
const paperWidthInput = document.getElementById('paper-width');
const ignoreTestTriggersInput = document.getElementById('ignore-test-triggers');
const deleteTempFilesInput = document.getElementById('delete-temp-files');

// Local storage key must be prefixed with the first URL segment
const currentPath = window.location.pathname;
const urlSegment = currentPath.split('/').filter(Boolean)[0];
const storageKey = (id) => `${urlSegment}::${id}`;

function saveSetting(id) {
    const el = document.getElementById(id);
    const value = el.type === "checkbox" ? el.checked : el.value;
    localStorage.setItem(storageKey(id), value);
}

// Add event listeners
[printerNameInput, paperWidthInput, ignoreTestTriggersInput, deleteTempFilesInput].forEach(input => {
    input.addEventListener("input", () => saveSetting(input.id));
    input.addEventListener("change", () => saveSetting(input.id));
});

// Load settings
if (localStorage.getItem(storageKey(printerNameInput.id)))
    printerNameInput.value = localStorage.getItem(storageKey(printerNameInput.id));
if (localStorage.getItem(storageKey(paperWidthInput.id)))
    paperWidthInput.value = localStorage.getItem(storageKey(paperWidthInput.id));
if (localStorage.getItem(storageKey(ignoreTestTriggersInput.id)))
    ignoreTestTriggersInput.checked = JSON.parse(localStorage.getItem(storageKey(ignoreTestTriggersInput.id)));
if (localStorage.getItem(storageKey(deleteTempFilesInput.id)))
    deleteTempFilesInput.checked = JSON.parse(localStorage.getItem(storageKey(deleteTempFilesInput.id)));