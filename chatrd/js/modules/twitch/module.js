/* ----------------------- */
/* TWITCH MODULE VARIABLES */
/* ----------------------- */

const showTwitch                    = getURLParam("showTwitch", false);

const showTwitchMessages            = getURLParam("showTwitchMessages", true);
const showTwitchFollows             = getURLParam("showTwitchFollows", true);
const showTwitchWatchStreak         = getURLParam("showTwitchWatchStreak", false);
const showTwitchBits                = getURLParam("showTwitchBits", true);
const showTwitchAnnouncements       = getURLParam("showTwitchAnnouncements", true);
const showTwitchSubs                = getURLParam("showTwitchSubs", true);
const showTwitchGiftedSubs          = getURLParam("showTwitchGiftedSubs", true);
const showTwitchGiftedSubsUserTrain = getURLParam("showTwitchGiftedSubsUserTrain", true);
const showTwitchMassGiftedSubs      = getURLParam("showTwitchMassGiftedSubs", true);
const showTwitchRewardRedemptions   = getURLParam("showTwitchRewardRedemptions", true);
const showTwitchRaids               = getURLParam("showTwitchRaids", true);
const showTwitchSharedChat          = getURLParam("showTwitchSharedChat", true);
const showTwitchPronouns            = getURLParam("showTwitchPronouns", false);
const showTwitchViewers             = getURLParam("showTwitchViewers", true);

const twitchAvatars = new Map();
const twitchPronouns = new Map();

const bitsGifAnimations = [
    { min: 1, max: 99, gifId: 1 },
    { min: 100, max: 999, gifId: 100 },
    { min: 1000, max: 4999, gifId: 1000 },
    { min: 5000, max: 9999, gifId: 5000 },
    { min: 10000, max: 99999, gifId: 10000 },
    { min: 100000, max: 1000000000000000, gifId: 100000 },
];

const bitsGiftsClasses = [
    { min: 1,  max: 99, class: 'normal-gift' },
    { min: 100,  max: 499, class: 'bigger-than-100' },
    { min: 500,  max: 999, class: 'bigger-than-500' },
    { min: 1000,  max: 4999, class: 'bigger-than-1000' },
    { min: 5000,  max: 9999, class: 'bigger-than-5000' },
    { min: 10000,  max: 49999, class: 'bigger-than-10000' },
    { min: 50000,  max: 99999, class: 'bigger-than-50000' },
    { min: 100000,  max: 99999999999, class: 'bigger-than-100000' },
];

// TWITCH EVENTS HANDLERS

const twitchMessageHandlers = {
    'Twitch.ChatMessage': (response) => {
        twitchChatMessage(response.data);
    },
    'Twitch.WatchStreak': (response) => {
        twitchWatchStreakMessage(response.data);
    },
    'Twitch.Follow': (response) => {
        twitchFollowMessage(response.data);
    },
    'Twitch.Announcement': (response) => {
        twitchAnnouncementMessage(response.data);
    },
    'Twitch.Cheer': (response) => {
        twitchBitsMessage(response.data);
    },
    'Twitch.AutomaticRewardRedemption': (response) => {
        if (response.data.reward_type === "gigantify_an_emote") {
            twitchChatMessageGiantEmote(response.data);
        }
        else {
            twitchAutomaticRewardRedemption(response.data);
        }
    },
    'Twitch.RewardRedemption': (response) => {
        twitchRewardRedemption(response.data);
    },
    'Twitch.Sub': (response) => {
        twitchSubMessage(response.data);
    },
    'Twitch.ReSub': (response) => {
        twitchReSubMessage(response.data);
    },
    'Twitch.GiftSub': (response) => {
        twitchGiftMessage(response.data);
    },
    'Twitch.GiftBomb': (response) => {
        twitchGiftBombMessage(response.data);
    },
    'Twitch.Raid': (response) => {
        twitchRaidMessage(response.data);
    },
    'Twitch.ChatMessageDeleted': (response) => {
        twitchChatMessageDeleted(response.data);
    },
    'Twitch.UserBanned': (response) => {
        twitchUserBanned(response.data);
    },
    'Twitch.UserTimedOut': (response) => {
        twitchUserBanned(response.data);
    },
    'Twitch.ViewerCountUpdate': (response) => {
        twitchUpdateStatistics(response.data);
    },
    'Twitch.ChatCleared': (response) => {
        twitchChatClearMessages();
    },


    'Twitch.HypeTrainStart' : (response) => { },
    'Twitch.HypeTrainUpdate' : (response) => { },
    'Twitch.HypeTrainLevelUp' : (response) => { },
    'Twitch.HypeTrainEnd' : (response) => { }
};



if (showTwitch) {
    
    const twitchStatistics = `
        <div class="platform" id="twitch" style="display: none;">
            <img src="js/modules/twitch/images/logo-twitch.svg" alt="">
            <span class="viewers"><i class="fa-solid fa-user"></i> <span>0</span></span>
        </div>
    `;

    document.querySelector('#statistics').insertAdjacentHTML('beforeend', twitchStatistics);

    if (showTwitchViewers == true) { document.querySelector('#twitch').style.display = ''; }

    registerPlatformHandlersToStreamerBot(twitchMessageHandlers, '[Twitch]');

}



// ---------------------------
// TWITCH EVENT FUNCTIONS

async function twitchChatMessage(data) {
    
    if (showTwitchMessages == false) return;
    if (ignoreUserList.includes(data.message.username.toLowerCase())) return;
    if (data.message.message.startsWith("!") && excludeCommands == true)  return;

	const template = chatTemplate;
	const clone = template.content.cloneNode(true);
    const messageId = data.messageId;
    const userId = data.message.username;

    const {
        'first-message': firstMessage,
        'shared-chat': sharedChat,
        
        header,
        avatar,
        timestamp,
        platform,
        badges,
        pronouns: pronoun,
        user,
        
        reply,
        'actual-message': message
    } = Object.fromEntries(
        [...clone.querySelectorAll('[class]')]
            .map(el => [el.className, el])
    );

    const classes = ['twitch', 'chat'];

    const [avatarImage, badgeList] = await Promise.all([
        getTwitchAvatar(data.message.username),
        getTwitchBadges(data)
    ]);

    header.remove();

    let streamData = data;

    user.style.color = data.message.color;
    user.textContent = data.message.displayName;

    if (data.message.isMe) {
        message.style.color = data.message.color;
    }

    if (showAvatar) avatar.innerHTML = `<img src="${avatarImage}">`; else avatar.remove();
    if (showBadges) badges.innerHTML = badgeList; else badges.remove();

    if (data.user.role == 4) { classes.push('streamer'); }

    if (data.message.firstMessage) {
        classes.push('first-chatter');
    }
    else { firstMessage.remove(); }
    

    if (data.message.isReply) {
        classes.push('reply');

        let offset = 0;
        let replyTo = `@${data.message.reply.userName}`;
        let replyMessage = streamData.message.message;
        
        if (replyMessage.startsWith(replyTo)) {
            let startIndex = replyTo.length;
            if (replyMessage[startIndex] === " ") {
                startIndex++;
            }
            replyMessage = replyMessage.slice(startIndex);
            offset = startIndex;    
        
            let replyEmotes = (streamData.emotes || [])
            .map(e => ({
                ...e,
                startIndex: e.startIndex - offset,
                endIndex: e.endIndex - offset
            }))
            .sort((a, b) => a.startIndex - b.startIndex);

            streamData.message.message = replyMessage;
            streamData.emotes = replyEmotes;
        }

        reply.insertAdjacentHTML('beforeend', ` <strong>Replying to ${escapeHTML(data.message.reply.userName)}:</strong> ${data.message.reply.msgBody}`);
    }
    else { reply.remove(); }

    if (data.message.isSharedChat) {
        if (showTwitchSharedChat == true) {
            classes.push('shared-chat');

            if (!data.sharedChat.primarySource) {
                let sharedStreamer = data.sharedChat.sourceRoom.name;
                let sharedStreamerAvatar = await getTwitchAvatar( sharedStreamer.toLowerCase() );
                sharedChat.querySelector('span.origin img').src = sharedStreamerAvatar;
                sharedChat.querySelector('span.origin strong').textContent = data.sharedChat.sourceRoom.name;
            }
        }
        else if (!data.sharedChat.primarySource && showTwitchSharedChat == false) {
            return;
        }
    }
    else { sharedChat.remove(); }



    if (showTwitchPronouns === true) {
        const userPronouns = await getTwitchUserPronouns(data.message.username);
        if (userPronouns) {
            pronoun.innerHTML = userPronouns;
        }
    }
    else { pronoun.remove(); }

    

    message.textContent = streamData.message.message;
    await getTwitchEmotes(streamData, message);

    addMessageItem('twitch', clone, classes, userId, messageId);
}




async function twitchWatchStreakMessage(data) {

    if (showTwitchWatchStreak == false) return;

    const template = eventTemplate;
	const clone = template.content.cloneNode(true);
    const messageId = data.msgId;
    const userId = data.userName.toLowerCase();

    const {
        header,
        platform,
        user,
        action,
        value,
        'actual-message': message
    } = Object.fromEntries(
        [...clone.querySelectorAll('[class]')]
            .map(el => [el.className, el])
    );

    const classes = ['twitch', 'watch-streak'];

    header.remove();
    
    user.textContent = data.displayName;

    action.innerHTML = ` watched `;
    value.innerHTML = `<strong>${data.watchStreak} consecutive streams</strong>!`;
    message.textContent = data.message;
    await getTwitchEmotesForWatchedStreakMessage(data, message);

    addEventItem('twitch', clone, classes, userId, messageId);
}



async function twitchChatMessageGiantEmote(data) {
    
    if (showTwitchMessages == false) return;
    
    const userMessages = chatContainer.querySelectorAll(`.chat.twitch[data-user="${data.user_login}"]`);

    if (userMessages.length === 0) return;

    const firstMessage = userMessages[0];
    const emoteImages = firstMessage.querySelectorAll(`img[data-emote-id="${data.gigantified_emote.id}"]`);

    if (emoteImages.length === 0) return;

    emoteImages.forEach(img => {
        img.classList.add("gigantified");
        if (img.src.endsWith("2.0")) {
            img.src = img.src.replace("2.0", "3.0");
        }
    });
}




async function twitchFollowMessage(data) {

    if (showTwitchFollows == false) return;

    const template = eventTemplate;
	const clone = template.content.cloneNode(true);
    const messageId = createRandomString(40);
    const userId = data.user_name.toLowerCase();

    const {
        header,
        platform,
        user,
        action,
        value,
        'actual-message': message
    } = Object.fromEntries(
        [...clone.querySelectorAll('[class]')]
            .map(el => [el.className, el])
    );

    const classes = ['twitch', 'follow'];

    header.remove();
    message.remove();
    value.remove();

    
    user.textContent = data.user_name;

    action.innerHTML = ` followed you`;

    addEventItem('twitch', clone, classes, userId, messageId);
}



async function twitchAnnouncementMessage(data) {

    if (showTwitchAnnouncements == false) return;

    const template = chatTemplate;
	const clone = template.content.cloneNode(true);
    const messageId = data.messageId;
    const userId = data.user.name.toLowerCase();

    const {
        'first-message': firstMessage,
        'shared-chat': sharedChat,
        
        header,
        timestamp,
        platform,
        badges,
        avatar,
        pronouns: pronoun,
        user,
        
        reply,
        'actual-message': message
    } = Object.fromEntries(
        [...clone.querySelectorAll('[class]')]
            .map(el => [el.className, el])
    );

    const classes = ['twitch', 'announcement'];

    classes.push(data.announcementColor.toLowerCase());

    firstMessage.remove();
    sharedChat.remove();
    timestamp.remove();
    //platform.remove();
    avatar.remove();
    pronoun.remove();
    reply.remove();

    const [badgeList] = await Promise.all([
        getTwitchAnnouncementBadges(data)
    ]);

    header.innerHTML = `<span><i class="fa-solid fa-bullhorn"></i> Announcement</span>`;

    user.style.color = data.user.color;
    user.textContent = data.user.name;

    
    message.textContent = data.text;
    await getTwitchEmotesOnParts(data, message);

    if (showBadges) badges.innerHTML = badgeList; else badges.remove();

    addMessageItem('twitch', clone, classes, userId, messageId);
}



async function twitchRewardRedemption(data) {

    if (showTwitchRewardRedemptions == false) return;

    const template = eventTemplate;
	const clone = template.content.cloneNode(true);
    const messageId = createRandomString(40);
    const userId = data.user_name.toLowerCase();

    const {
        header,
        platform,
        user,
        action,
        value,
        'actual-message': message
    } = Object.fromEntries(
        [...clone.querySelectorAll('[class]')]
            .map(el => [el.className, el])
    );

    const classes = ['twitch', 'reward'];

    header.remove();
    
    user.textContent = data.user_name;
    action.innerHTML = ` redeemed `;
    value.innerHTML = `<strong>${data.reward.title}</strong> (${data.reward.cost})`;

    value.innerHTML = `
        <div class="gift-info">
            <span class="gift-image"><strong>${data.reward.title}</strong></span>
            <span class="gift-value"><img src="js/modules/twitch/images/icon-channel-points.svg" alt="Channel Points"> ${data.reward.cost}</span>
        </div>
    `;
    
    var userInput = data.user_input ? `${data.user_input}` : '';
    message.textContent = userInput;

    addEventItem('twitch', clone, classes, userId, messageId);
}



async function twitchAutomaticRewardRedemption(data) {

    if (showTwitchRewardRedemptions == false) return;

    const template = eventTemplate;
	const clone = template.content.cloneNode(true);
    const messageId = createRandomString(40);
    const userId = data.user_login.toLowerCase();

    const {
        header,
        platform,
        user,
        action,
        value,
        'actual-message': message
    } = Object.fromEntries(
        [...clone.querySelectorAll('[class]')]
            .map(el => [el.className, el])
    );

    const classes = ['twitch', 'reward'];

    header.remove();

    let title;

    switch (data.reward_type) {
        case "send_highlighted_message" :
            title = "Highlight My Message";
        break;

        case "chosen_sub_emote_unlock" :
            title = "Unlock an Emote for 24 hours";
        break;

        case "chosen_sub_emote_unlock" :
            title = "Unlock a Random Sub Emote";
        break;

        case "chosen_modified_sub_emote_unlock" :
            title = "Modify a Single Emote";
        break;

    }
    
    user.textContent = data.user_name;
    action.innerHTML = ` redeemed `;

    value.innerHTML = `
        <div class="gift-info">
            <span class="gift-image"><strong>${title}</strong></span>
            <span class="gift-value"><img src="js/modules/twitch/images/icon-channel-points.svg" alt="Channel Points"> ${data.cost}</span>
        </div>
    `;
    
    /*var userInput = data.user_input ? `${data.user_input}` : '';
    message.textContent = `${userInput}`;*/
    message.remove();
    
    addEventItem('twitch', clone, classes, userId, messageId);
}



async function twitchBitsMessage(data) {

    if (showTwitchBits == false) return;

    const template = eventTemplate;
	const clone = template.content.cloneNode(true);
    const messageId = data.messageId;
    const userId = data.user.name.toLowerCase();

    const {
        header,
        platform,
        user,
        action,
        value,
        'actual-message': message
    } = Object.fromEntries(
        [...clone.querySelectorAll('[class]')]
            .map(el => [el.className, el])
    );

    const classes = ['twitch', 'bits'];

    header.remove();
    
    user.textContent = data.user.name;
    action.innerHTML = ` cheered with `;

    var bits = data.message.bits > 1 ? 'bits' : 'bit';

    const match = bitsGifAnimations.find(lv => data.message.bits >= lv.min && data.message.bits <= lv.max);
    
    const bitsMatch = bitsGiftsClasses.find(lv => data.message.bits >= lv.min && data.message.bits <= lv.max);
    classes.push(bitsMatch.class);

    value.innerHTML = `
        <div class="gift-info">
            <span class="gift-image"><strong>${data.message.bits} ${bits}</strong></span>
            <span class="gift-value"><img src="https://d3aqoihi2n8ty8.cloudfront.net/actions/cheer/dark/animated/${match.gifId}/4.gif" alt="${data.message.bits} ${bits}"></span>
        </div>
    `;

    data.message.message = data.message.message.replace(/\bCheer\d+\b/g, '').replace(/\s+/g, ' ').trim();
    message.textContent = data.message.message;
    await getTwitchEmotes(data, message);

    addEventItem('twitch', clone, classes, userId, messageId);
}



async function twitchSubMessage(data) {

    if (showTwitchSubs == false) return;

    const template = eventTemplate;
	const clone = template.content.cloneNode(true);
    const messageId = createRandomString(40);
    const userId = data.user.name.toLowerCase();

    const {
        header,
        platform,
        user,
        action,
        value,
        'actual-message': message
    } = Object.fromEntries(
        [...clone.querySelectorAll('[class]')]
            .map(el => [el.className, el])
    );

    const classes = ['twitch', 'sub'];

    header.remove();
    message.remove();

    
    user.textContent = data.user.name;

    action.innerHTML = ` subscribed for `;

    //var months = data.duration_months > 1 ? 'months' : 'month';
    var months = formatSubMonthDuration(data.duration_months);
    var tier = data.is_prime ? 'Prime' : 'Tier '+Math.floor(data.sub_tier/1000);

    //value.innerHTML = `<strong>${months} (${tier})</strong>`;
    value.innerHTML = `
        <div class="gift-info">
            <span class="gift-image"><strong>${months}</strong></span>
            <span class="gift-value">${tier}</span>
        </div>
    `;

    addEventItem('twitch', clone, classes, userId, messageId);
}



async function twitchReSubMessage(data) {

    if (showTwitchSubs == false) return;

    const template = eventTemplate;
	const clone = template.content.cloneNode(true);
    const messageId = createRandomString(40);
    const userId = data.user.name.toLowerCase();

    const {
        header,
        platform,
        user,
        action,
        value,
        'actual-message': message
    } = Object.fromEntries(
        [...clone.querySelectorAll('[class]')]
            .map(el => [el.className, el])
    );

    const classes = ['twitch', 'resub'];
    
    header.remove();
    
    user.textContent = data.user.name;

    action.innerHTML = ` subscribed for `;

    //var months = data.cumulativeMonths > 1 ? 'months' : 'month';
    var months = formatSubMonthDuration(data.cumulativeMonths);
    var tier = data.isPrime ? 'Prime' : 'Tier '+Math.floor(data.subTier/1000);
    
    //value.innerHTML = `<strong>${months} (${tier})</strong>`;
    value.innerHTML = `
        <div class="gift-info">
            <span class="gift-image"><strong>${months}</strong></span>
            <span class="gift-value">${tier}</span>
        </div>
    `;

    message.textContent = data.text;
    await getTwitchEmotesOnParts(data, message);

    addEventItem('twitch', clone, classes, userId, messageId);
}



async function twitchGiftMessage(data) {

    const isSub = showTwitchSubs === false;
    const isGift = showTwitchGiftedSubs === false;
    const isGiftTrain = showTwitchGiftedSubsUserTrain === false;

    if (
        (!data.fromCommunitySubGift && (isSub || isGift)) ||
        (data.fromCommunitySubGift && (isSub || isGiftTrain))
    ) {
        return;
    }

    const template = eventTemplate;
	const clone = template.content.cloneNode(true);
    const messageId = createRandomString(40);
    const userId = data.user.name.toLowerCase();

    const {
        header,
        platform,
        user,
        action,
        value,
        'actual-message': message
    } = Object.fromEntries(
        [...clone.querySelectorAll('[class]')]
            .map(el => [el.className, el])
    );

    const classes = ['twitch', 'giftsub'];

    header.remove();
    message.remove();

    
    user.textContent = data.user.name;

    //var months = data.durationMonths > 1 ? 'months' : 'month';
    var months = formatSubMonthDuration(data.durationMonths);
    var subs = data.durationMonths > 1 ? 'subscriptions' : 'subscription'

    action.innerHTML = ` gifted <strong>${months}</strong> of <strong>Tier ${Math.floor(data.subTier/1000)}</strong> ${subs} to `;
    
    value.innerHTML = `<strong>${escapeHTML(data.recipient.name)}</strong>`;

    addEventItem('twitch', clone, classes, userId, messageId);
}



async function twitchGiftBombMessage(data) {

    if (showTwitchSubs == false || showTwitchMassGiftedSubs == false) return;

    const template = eventTemplate;
	const clone = template.content.cloneNode(true);
    const messageId = createRandomString(40);
    const userId = data.user.name.toLowerCase();

    const {
        header,
        platform,
        user,
        action,
        value,
        'actual-message': message
    } = Object.fromEntries(
        [...clone.querySelectorAll('[class]')]
            .map(el => [el.className, el])
    );

    const classes = ['twitch', 'giftbomb'];

    header.remove();
    value.remove();

    
    user.textContent = data.user.name;

    var subs = data.total > 1 ? 'subs' : 'sub';
    action.innerHTML = ` gifted <strong>${data.total} Tier ${Math.floor(data.sub_tier/1000)} ${subs}</strong> to the Community`;

    message.innerHTML = `They've gifted a total of <strong>${data.cumulative_total} subs</strong>`;

    addEventItem('twitch', clone, classes, userId, messageId);
}



async function twitchRaidMessage(data) {

    if (showTwitchRaids == false) return;

    const template = eventTemplate;
	const clone = template.content.cloneNode(true);
    const messageId = createRandomString(40);
    const userId = data.from_broadcaster_user_name.toLowerCase();

    const {
        header,
        platform,
        user,
        action,
        value,
        'actual-message': message
    } = Object.fromEntries(
        [...clone.querySelectorAll('[class]')]
            .map(el => [el.className, el])
    );

    const classes = ['twitch', 'raid'];

    header.remove();
    message.remove();

    
    user.textContent = data.from_broadcaster_user_name;

    var viewers = data.viewers > 1 ? 'viewers' : 'viewer';
    action.innerHTML = ` raided the channel with `;
    value.innerHTML = `<strong>${data.viewers} ${viewers}</strong>`;

    addEventItem('twitch', clone, classes, userId, messageId);
}



async function twitchChatMessageDeleted(data) {
    document.getElementById(data.messageId)?.remove();
}



async function twitchUserBanned(data) {
    chatContainer.querySelectorAll(`[data-user="${data.targetUser.login}"]`).forEach(element => {
        element.remove();
    });
}



async function twitchChatClearMessages() {
    chatContainer.querySelectorAll(`.item.twitch`).forEach(element => {
        element.remove();
    });
}



async function twitchUpdateStatistics(data) {
    if (showPlatformStatistics == false || showTwitchViewers == false) return;

    const viewers = formatNumber(DOMPurify.sanitize(data.viewerCount))  || "0";
    document.querySelector('#statistics #twitch .viewers span').textContent = viewers;
}













// ---------------------------
// TWITCH UTILITY FUNCTIONS

async function getTwitchAvatar(user) {
    if (twitchAvatars.has(user)) {
        console.debug(`Twitch avatar found for ${user}!`);
        return twitchAvatars.get(user);
    }

    console.debug(`Twitch avatar not found for ${user}! Getting it from DECAPI!`);
    
    try {
        const response = await fetch(`https://decapi.me/twitch/avatar/${user}`);
        let avatar = await response.text();
        
        if (!avatar) {
            avatar = 'https://static-cdn.jtvnw.net/user-default-pictures-uv/cdd517fe-def4-11e9-948e-784f43822e80-profile_image-300x300.png';
        }

        twitchAvatars.set(user, avatar);
        return avatar;
    }
    catch (err) {
        console.error(`Failed to fetch avatar for ${user}:`, err);
        return 'https://static-cdn.jtvnw.net/user-default-pictures-uv/cdd517fe-def4-11e9-948e-784f43822e80-profile_image-300x300.png';
    }
}





async function getTwitchBadges(data) {
    const badges = data.message.badges;
    return badges
        .map(badge => `<img src="${badge.imageUrl}" class="badge">`)
        .join('');
}



async function getTwitchEmotes(data, messageElement) {
    const message = data.message.message;
    const emotes = (data.emotes || []).sort((a, b) => a.startIndex - b.startIndex);

    // Limpa o conteúdo (vamos recriar com nodes)
    messageElement.innerHTML = "";

    let lastIndex = 0;

    for (const emote of emotes) {
        // texto antes do emote
        if (lastIndex < emote.startIndex) {
            const text = message.slice(lastIndex, emote.startIndex);
            messageElement.appendChild(document.createTextNode(text));
        }

        let emoteUrl = emote.imageUrl;

        // Detecta Twemoji
        const isTwemoji =
            String(emote.type || "").toLowerCase() === "twemoji" ||
            /(twemoji|jdecked)/i.test(emote.imageUrl || "");

        if (isTwemoji) {
            const codePoints = Array.from(emote.name).map(c => c.codePointAt(0).toString(16));
            let fileName = codePoints.join("-");
            fileName = fileName.replace(/-fe0f/g, ""); // remove FE0F
            emoteUrl = `https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/72x72/${fileName}.png`;
        }

        if (!emoteUrl || emoteUrl.trim() === "") {
            messageElement.appendChild(document.createTextNode(emote.name));
        }
        else {
            const img = document.createElement("img");
            img.src = emoteUrl;
            img.alt = emote.name;
            img.className = "emote";
            img.dataset.emoteId = emote.id || "";
            img.onerror = () => (img.outerHTML = emote.name);
            messageElement.appendChild(img);
        }

        lastIndex = emote.endIndex + 1;
    }

    // texto final depois do último emote
    if (lastIndex < message.length) {
        const text = message.slice(lastIndex);
        messageElement.appendChild(document.createTextNode(text));
    }
}



async function getTwitchEmotesForWatchedStreakMessage(data, messageElement) {
    const message = data.message;
    const emotes = (data.emotes || []).sort((a, b) => a.startIndex - b.startIndex);

    // Limpa o conteúdo (vamos recriar com nodes)
    messageElement.innerHTML = "";

    let lastIndex = 0;

    for (const emote of emotes) {
        // texto antes do emote
        if (lastIndex < emote.startIndex) {
            const text = message.slice(lastIndex, emote.startIndex);
            messageElement.appendChild(document.createTextNode(text));
        }

        let emoteUrl = emote.imageUrl;

        // Detecta Twemoji
        const isTwemoji =
            String(emote.type || "").toLowerCase() === "twemoji" ||
            /(twemoji|jdecked)/i.test(emote.imageUrl || "");

        if (isTwemoji) {
            const codePoints = Array.from(emote.name).map(c => c.codePointAt(0).toString(16));
            let fileName = codePoints.join("-");
            fileName = fileName.replace(/-fe0f/g, ""); // remove FE0F
            emoteUrl = `https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/72x72/${fileName}.png`;
        }

        if (!emoteUrl || emoteUrl.trim() === "") {
            messageElement.appendChild(document.createTextNode(emote.name));
        }
        else {
            const img = document.createElement("img");
            img.src = emoteUrl;
            img.alt = emote.name;
            img.className = "emote";
            img.dataset.emoteId = emote.id || "";
            img.onerror = () => (img.outerHTML = emote.name);
            messageElement.appendChild(img);
        }

        lastIndex = emote.endIndex + 1;
    }

    // texto final depois do último emote
    if (lastIndex < message.length) {
        const text = message.slice(lastIndex);
        messageElement.appendChild(document.createTextNode(text));
    }
}





async function getTwitchEmotesOnParts(data, messageElement) {
    // Limpa o conteúdo atual do elemento
    messageElement.innerHTML = "";

    // Texto completo da mensagem
    let messageText = data.text;
    let cursor = 0; // índice atual no texto

    for (const part of data.parts) {
        // Se parte não é emote, apenas insere texto cru
        if (part.type !== 'emote') {
            // adiciona texto
            messageElement.appendChild(document.createTextNode(part.text));
            cursor += part.text.length;
            continue;
        }

        // Parte é emote
        const emoteName = part.text;
        let emoteUrl = part.imageUrl;

        // Detecta Twemoji
        const isTwemoji =
            String(part.emoteType || part.type).toLowerCase() === 'twemoji' ||
            /(twemoji|jdecked)/i.test(emoteUrl || '');

        if (isTwemoji) {
            const codePoints = Array.from(emoteName).map(c => c.codePointAt(0).toString(16));
            let fileName = codePoints.join('-');
            fileName = fileName.replace(/-fe0f/g, ''); // remove FE0F
            emoteUrl = `https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/72x72/${fileName}.png`;
        }

        // Se não houver URL válida, só mostra o nome do emote
        if (!emoteUrl || emoteUrl.trim() === '') {
            messageElement.appendChild(document.createTextNode(emoteName));
            cursor += emoteName.length;
            continue;
        }

        // Cria o <img> do emote
        const img = document.createElement('img');
        img.src = emoteUrl;
        img.alt = emoteName;
        img.className = 'emote';
        img.dataset.emoteId = part.id || '';
        img.onerror = () => (img.outerHTML = emoteName);

        // Anexa o <img>
        messageElement.appendChild(img);
        cursor += emoteName.length;
    }
}








async function getTwitchAnnouncementBadges(data) {
    const badges = data.user.badges;
    return badges
        .map(badge => `<img src="${badge.imageUrl}" class="badge">`)
        .join('');
}


async function getTwitchUserPronouns(username) {
    if (twitchPronouns.has(username)) {
        console.debug(`Pronouns found for ${username}. Getting it from Map...`);
        return twitchPronouns.get(username);
    }

    console.debug(`Pronouns not found for ${username} in the Map! Retrieving...`);
    
    try {
        const response = await streamerBotClient.getUserPronouns('twitch', username);

        const pronoun = response?.pronoun?.userFound
            ? `<em>${response.pronoun.pronounSubject}/${response.pronoun.pronounObject}</em>`
            : '';

        twitchPronouns.set(username, pronoun);
        return pronoun;
    }
    
    catch (err) {
        console.error(`Couldn't retrieve pronouns for ${username}:`, err);
        return '';
    }
}