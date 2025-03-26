////////////////
// PARAMETERS //
////////////////

const queryString = window.location.search;
const urlParams = new URLSearchParams(queryString);

const sbServerAddress = urlParams.get("address") || "127.0.0.1";
const sbServerPort = urlParams.get("port") || "8080";
const minimumRole = 2;							// 1 - Viewer, 2 - VIP, 3 - Moderator, 4 - Broadcaster
const avatarMap = new Map();
const animationDuration = 8000;
let widgetLocked = false;						// Needed to lock animation from overlapping
let alertQueue = [];

/////////////
// OPTIONS //
/////////////

const showPlatform = GetBooleanParam("showPlatform", true);
const showAvatar = GetBooleanParam("showAvatar", true);
const showTimestamps = GetBooleanParam("showTimestamps", false);
const showBadges = GetBooleanParam("showBadges", true);
const showPronouns = GetBooleanParam("showPronouns", false);
const showUsername = GetBooleanParam("showUsername", true);
const showMessage = GetBooleanParam("showMessage", true);
const font = urlParams.get("font") || "";
const fontSize = urlParams.get("fontSize") || "18";
const background = urlParams.get("background") || "#000000";
const opacity = urlParams.get("opacity") || "0.5";

const hideAfter = GetIntParam("hideAfter") || 0;
const excludeCommands = GetBooleanParam("excludeCommands", true);
const ignoreChatters = urlParams.get("ignoreChatters") || "";

const showTwitchMessages = GetBooleanParam("showTwitchMessages", true);
const showTwitchAnnouncements = GetBooleanParam("showTwitchAnnouncements", true);
const showTwitchSubs = GetBooleanParam("showTwitchSubs", true);
const showTwitchChannelPointRedemptions = GetBooleanParam("showTwitchChannelPointRedemptions", true);
const showTwitchRaids = GetBooleanParam("showTwitchRaids", true);

const showYouTubeMessages = GetBooleanParam("showYouTubeMessages", true);
const showYouTubeSuperChats = GetBooleanParam("showYouTubeSuperChats", true);
const showYouTubeSuperStickers = GetBooleanParam("showYouTubeSuperStickers", true);
const showYouTubeMemberships = GetBooleanParam("showYouTubeMemberships", true);

const showStreamlabsDonations = GetBooleanParam("showStreamlabsDonations", true)
const showStreamElementsTips = GetBooleanParam("showStreamElementsTips", true);
const showPatreonMemberships = GetBooleanParam("showPatreonMemberships", true);
const showKofiDonations = GetBooleanParam("showKofiDonations", true);
const showTipeeeStreamDonations = GetBooleanParam("showTipeeeStreamDonations", true);

// Set fonts for the widget
document.body.style.fontFamily = font;
document.body.style.fontSize = `${fontSize}px`;

// Set the background color
const opacity255 = Math.round(parseFloat(opacity) * 255);
let hexOpacity = opacity255.toString(16);
if (hexOpacity.length < 2) {
	hexOpacity = "0" + hexOpacity;
}
document.documentElement.style.setProperty('--background', `${background}${hexOpacity}`);

// Get a list of chatters to ignore
const ignoreUserList = ignoreChatters.split(',').map(item => item.trim().toLowerCase()) || [];



/////////////////////////
// STREAMER.BOT CLIENT //
/////////////////////////

const client = new StreamerbotClient({
	host: sbServerAddress,
	port: sbServerPort,

	onConnect: (data) => {
		console.log(`Streamer.bot successfully connected to ${sbServerAddress}:${sbServerPort}`)
		console.debug(data);
		SetConnectionStatus(true);
	},

	onDisconnect: () => {
		console.error(`Streamer.bot disconnected from ${sbServerAddress}:${sbServerPort}`)
		SetConnectionStatus(false);
	}
});

client.on('Twitch.ChatMessage', (response) => {
	console.debug(response.data);
	TwitchChatMessage(response.data);
})

client.on('Twitch.Cheer', (response) => {
	console.debug(response.data);
	TwitchChatMessage(response.data);
})

client.on('Twitch.Announcement', (response) => {
	console.debug(response.data);
	TwitchAnnouncement(response.data);
})

client.on('Twitch.Sub', (response) => {
	console.debug(response.data);
	TwitchSub(response.data);
})

client.on('Twitch.ReSub', (response) => {
	console.debug(response.data);
	TwitchResub(response.data);
})

client.on('Twitch.GiftSub', (response) => {
	console.debug(response.data);
	TwitchGiftSub(response.data);
})

client.on('Twitch.GiftBomb', (response) => {
	console.debug(response.data);
	TwitchGiftBomb(response.data);
})

client.on('Twitch.RewardRedemption', (response) => {
	console.debug(response.data);
	TwitchRewardRedemption(response.data);
})

client.on('Twitch.Raid', (response) => {
	console.debug(response.data);
	TwitchRaid(response.data);
})

client.on('Twitch.ChatMessageDeleted', (response) => {
	console.debug(response.data);
	TwitchChatMessageDeleted(response.data);
})

client.on('Twitch.UserBanned', (response) => {
	console.debug(response.data);
	TwitchUserBanned(response.data);
})

client.on('Twitch.UserTimedOut', (response) => {
	console.debug(response.data);
	TwitchUserBanned(response.data);
})

client.on('Twitch.ChatCleared', (response) => {
	console.debug(response.data);
	TwitchChatCleared(response.data);
})

client.on('YouTube.Message', (response) => {
	console.debug(response.data);
	YouTubeMessage(response.data)
})

client.on('YouTube.SuperChat', (response) => {
	console.debug(response.data);
	YouTubeSuperChat(response.data);
})

client.on('YouTube.SuperSticker', (response) => {
	console.debug(response.data);
	YouTubeSuperSticker(response.data);
})

client.on('YouTube.NewSponsor', (response) => {
	console.debug(response.data);
	YouTubeNewSponsor(response.data);
})

client.on('YouTube.GiftMembershipReceived', (response) => {
	console.debug(response.data);
	YouTubeGiftMembershipReceived();
})

client.on('Streamlabs.Donation', (response) => {
	console.debug(response.data);
	StreamlabsDonation(response.data);
})

client.on('StreamElements.Tip', (response) => {
	console.debug(response.data);
	StreamElementsTip(response.data);
})

client.on('Patreon.PledgeCreated', (response) => {
	console.debug(response.data);
	PatreonPledgeCreated(response.data);
})

client.on('Kofi.Donation', (response) => {
	console.debug(response.data);
	KofiDonation(response.data);
})

client.on('Kofi.Subscription', (response) => {
	console.debug(response.data);
	KofiSubscription(response.data);
})

client.on('Kofi.Resubscription', (response) => {
	console.debug(response.data);
	KofiResubscription(response.data);
})

client.on('Kofi.ShopOrder', (response) => {
	console.debug(response.data);
	KofiShopOrder(response.data);
})

client.on('TipeeeStream.Donation', (response) => {
	console.debug(response.data);
	TipeeeStreamDonation(response.data);
})



/////////////////////
// HORIZONTAL CHAT //
/////////////////////

async function TwitchChatMessage(data) {
	if (!showTwitchMessages)
		return;

	// Don't post messages starting with "!"
	if (data.message.message.startsWith("!") && excludeCommands)
		return;

	// Don't post messages from users from the ignore list
	if (ignoreUserList.includes(data.message.username.toLowerCase()))
		return;

	// Get a reference to the template
	const template = document.getElementById('messageTemplate');

	// Create a new instance of the template
	const instance = template.content.cloneNode(true);

	// Get divs
	const messageContainer = instance.querySelector(".messageContainer");
	const userInfoDiv = instance.querySelector("#userInfo");
	const avatarDiv = instance.querySelector("#avatar");
	const timestampDiv = instance.querySelector("#timestamp");
	const platformDiv = instance.querySelector("#platform");
	const badgeListDiv = instance.querySelector("#badgeList");
	const pronounsDiv = instance.querySelector("#pronouns");
	const usernameDiv = instance.querySelector("#username");
	const messageDiv = instance.querySelector("#message");

	// Set timestamp
	if (showTimestamps) {
		timestampDiv.classList.add("timestamp");
		timestampDiv.innerText = GetCurrentTimeFormatted();
	}

	// Set the username info
	if (showUsername) {
		usernameDiv.innerText = data.message.displayName;
		usernameDiv.style.color = data.message.color;
	}

	// Set pronouns
	const pronouns = await GetPronouns('twitch', 'caffeinedaydream');
	if (pronouns && showPronouns) {
		pronounsDiv.classList.add("pronouns");
		pronounsDiv.innerText = pronouns;
	}

	// Set the message data
	const message = data.message.message;
	const messageColor = data.message.color;

	// Set message text
	if (showMessage) {
		messageDiv.innerText = message;
	}

	// Set the "action" color
	if (data.message.isMe)
		messageDiv.style.color = messageColor;

	// Render platform
	if (showPlatform) {
		const platformElements = `<img src="icons/platforms/twitch.png" class="platform"/>`;
		platformDiv.innerHTML = platformElements;
	}
	

	// Render badges
	if (showBadges) {
		badgeListDiv.innerHTML = "";
		for (i in data.message.badges) {
			const badge = new Image();
			badge.src = data.message.badges[i].imageUrl;
			badge.classList.add("badge");
			badgeListDiv.appendChild(badge);
		}
	}

	// Render emotes
	for (i in data.emotes) {
		const emoteElement = `<img src="${data.emotes[i].imageUrl}" class="emote"/>`;
		messageDiv.innerHTML = messageDiv.innerHTML.replace(new RegExp(`\\b${data.emotes[i].name}\\b`), emoteElement);
	}

	// Render cheermotes
	for (i in data.cheerEmotes) {
		// const cheerEmoteElement = `<img src="${data.cheerEmotes[i].imageUrl}" class="emote"/>`;
		// messageDiv.innerHTML = messageDiv.innerHTML.replace(new RegExp(`\\b${data.cheerEmotes[i].name}\\b`), cheerEmoteElement);
		const bits = data.cheerEmotes[i].bits;
		const imageUrl = data.cheerEmotes[i].imageUrl;
		const name = data.cheerEmotes[i].name;
		const cheerEmoteElement = `<img src="${imageUrl}" class="emote"/>`;
		const bitsElements = `<span class="bits">${bits}</span>`
		messageDiv.innerHTML = messageDiv.innerHTML.replace(new RegExp(`\\b${name}${bits}\\b`, 'i'), cheerEmoteElement + bitsElements);
	}

	// Render avatars
	if (showAvatar) {
		const username = data.message.username;
		const avatarURL = await GetAvatar(username);
		const avatar = new Image();
		avatar.src = avatarURL;
		avatar.classList.add("avatar");
		avatarDiv.appendChild(avatar);
	}

	// Hide the header if the same username sends a message twice in a row
	const messageList = document.getElementById("messageList");
	if (messageList.children.length > 0) {
		const lastPlatform = messageList.lastChild.dataset.platform;
		const lastUserId = messageList.lastChild.dataset.userId;
		if (lastPlatform == "twitch" && lastUserId == data.user.id)
			userInfoDiv.style.display = "none";
	}

	AddMessageItem(instance, data.message.msgId, 'twitch', data.user.id);
}

async function TwitchAnnouncement(data) {
	if (!showTwitchAnnouncements)
		return;

	let background = null;

	// Set the card background colors
	switch (data.announcementColor) {
		case "BLUE":
			background = 'announcementBlue';
			break;
		case "GREEN":
			background = 'announcementGreen';
			break;
		case "ORANGE":
			background = 'announcementOrange';
			break;
		case "PURPLE":
			background = 'announcementPurple';
			break;
	}

	let message = data.text;

	// Render emotes
	for (i in data.parts) {
		if (data.parts[i].type == `emote`) {
			const emoteElement = `<img src="${data.parts[i].imageUrl}" class="emote"/>`;
			message = message.replace(new RegExp(`\\b${data.parts[i].text}\\b`), emoteElement);
		}
	}

	ShowAlert(message, background);
}

async function TwitchSub(data) {
	if (!showTwitchSubs)
		return;

	const username = data.user.name;
	const subTier = data.sub_tier;
	const isPrime = data.is_prime;

	let message = '';

	if (!isPrime)
		message = `${username} subscribed with Tier ${subTier.charAt(0)}`;
	else
		message = `${username} used their Prime Sub`, 'twitch';

	ShowAlert(message, 'twitch');
}

async function TwitchResub(data) {
	if (!showTwitchSubs)
		return;

	const username = data.user.name;
	const subTier = data.subTier;
	const isPrime = data.isPrime;
	const cumulativeMonths = data.cumulativeMonths;

	let message = '';

	if (!isPrime)
		message = `${username} resubscribed with Tier ${subTier.charAt(0)} (${cumulativeMonths} months)`;
	else
		message = `${username} used their Prime Sub (${cumulativeMonths} months)`;

	ShowAlert(message, 'twitch');
}

async function TwitchGiftSub(data) {
	if (!showTwitchSubs)
		return;

	const username = data.user.name;
	const subTier = data.subTier;
	const recipient = data.recipient.name;
	const fromCommunitySubGift = data.fromCommunitySubGift;

	// Don't post alerts for gift bombs
	if (fromCommunitySubGift)
		return;

	let message = `🎁 ${username} gifted a Tier ${subTier.charAt(0)} subscription to ${recipient}`;

	ShowAlert(message, 'twitch');
}

async function TwitchGiftBomb(data) {
	if (!showTwitchSubs)
		return;
	
	const username = data.displayName;
	const gifts = data.gifts;
	const subTier = data.subTier;

	let message = `🎁 ${username} gifted ${gifts} Tier ${subTier} subs!`;

	ShowAlert(message, 'twitch');
}

async function TwitchRewardRedemption(data) {
	if (!showTwitchChannelPointRedemptions)
		return;

	const username = data.user_name;
	const rewardName = data.reward.title;
	const cost = data.reward.cost;
	const userInput = data.user_input;
	const channelPointIcon = `<img src="icons/badges/twitch-channel-point.png" class="platform"/>`;

	let message = `${username} redeemed ${rewardName} ${channelPointIcon} ${cost}`;

	ShowAlert(message, 'twitch');
}

async function TwitchRaid(data) {
	if (!showTwitchRaids)
		return;

	const username = data.from_broadcaster_user_login;
	const viewers = data.viewers;

	let message = `${username} is raiding with a party of ${viewers}`;

	ShowAlert(message, 'twitch');
}

function TwitchChatMessageDeleted(data) {
	const messageList = document.getElementById("messageList");

	// Maintain a list of chat messages to delete
	const messagesToRemove = [];

	// ID of the message to remove
	const messageId = data.messageId;

	// Find the items to remove
	for (let i = 0; i < messageList.children.length; i++) {
		if (messageList.children[i].id === messageId) {
			messagesToRemove.push(messageList.children[i]);
		}
	}

	// Remove the items
	messagesToRemove.forEach(item => {
		messageList.removeChild(item);
	});
}

function TwitchUserBanned(data) {
	const messageList = document.getElementById("messageList");

	// Maintain a list of chat messages to delete
	const messagesToRemove = [];

	// ID of the message to remove
	const userId = data.user_id;

	// Find the items to remove
	for (let i = 0; i < messageList.children.length; i++) {
		if (messageList.children[i].dataset.userId === userId) {
			messagesToRemove.push(messageList.children[i]);
		}
	}

	// Remove the items
	messagesToRemove.forEach(item => {
		messageList.removeChild(item);
	});
}

function TwitchChatCleared(data) {
	const messageList = document.getElementById("messageList");

	while (messageList.firstChild) {
		messageList.removeChild(messageList.firstChild);
	}
}

function YouTubeMessage(data) {
	if (!showYouTubeMessages)
		return;

	// Don't post messages starting with "!"
	if (data.message.startsWith("!") && excludeCommands)
		return;

	// Don't post messages from users from the ignore list
	if (ignoreUserList.includes(data.user.name.toLowerCase()))
		return;

	// Get a reference to the template
	const template = document.getElementById('messageTemplate');

	// Create a new instance of the template
	const instance = template.content.cloneNode(true);

	// Get divs
	const userInfoDiv = instance.querySelector("#userInfo");
	const avatarDiv = instance.querySelector("#avatar");
	const timestampDiv = instance.querySelector("#timestamp");
	const platformDiv = instance.querySelector("#platform");
	const badgeListDiv = instance.querySelector("#badgeList");
	const usernameDiv = instance.querySelector("#username");
	const messageDiv = instance.querySelector("#message");

	// Set timestamp
	if (showTimestamps) {
		timestampDiv.classList.add("timestamp");
		timestampDiv.innerText = GetCurrentTimeFormatted();
	}

	// Set the message data
	if (showUsername) {
		usernameDiv.innerText = data.user.name;
		usernameDiv.style.color = "#f70000";	// YouTube users do not have colors, so just set it to red
	}

	if (showMessage) {
		messageDiv.innerText = data.message;
	}

	// Render platform
	if (showPlatform) {
		const platformElements = `<img src="icons/platforms/youtube.png" class="platform"/>`;
		platformDiv.innerHTML = platformElements;
	}

	// Render badges
	if (data.user.isOwner && showBadges) {
		const badge = new Image();
		badge.src = `icons/badges/youtube-broadcaster.svg`;
		badge.style.filter = `invert(100%)`;
		badge.style.opacity = 0.8;
		badge.classList.add("badge");
		badgeListDiv.appendChild(badge);
	}

	if (data.user.isModerator && showBadges) {
		const badge = new Image();
		badge.src = `icons/badges/youtube-moderator.svg`;
		badge.style.filter = `invert(100%)`;
		badge.style.opacity = 0.8;
		badge.classList.add("badge");
		badgeListDiv.appendChild(badge);
	}

	if (data.user.isSponsor && showBadges) {
		const badge = new Image();
		badge.src = `icons/badges/youtube-member.svg`;
		badge.style.filter = `invert(100%)`;
		badge.style.opacity = 0.8;
		badge.classList.add("badge");
		badgeListDiv.appendChild(badge);
	}

	if (data.user.isVerified && showBadges) {
		const badge = new Image();
		badge.src = `icons/badges/youtube-verified.svg`;
		badge.style.filter = `invert(100%)`;
		badge.style.opacity = 0.8;
		badge.classList.add("badge");
		badgeListDiv.appendChild(badge);
	}

	// Render emotes
	for (i in data.emotes) {
		const emoteElement = `<img src="${data.emotes[i].imageUrl}" class="emote"/>`;
		messageDiv.innerHTML = messageDiv.innerHTML.replace(data.emotes[i].name, emoteElement);
	}

	// Render avatars
	if (showAvatar) {
		const avatar = new Image();
		avatar.src = data.user.profileImageUrl;
		avatar.classList.add("avatar");
		avatarDiv.appendChild(avatar);
	}

	// Hide the header if the same username sends a message twice in a row
	const messageList = document.getElementById("messageList");
	if (messageList.children.length > 0) {
		const lastPlatform = messageList.lastChild.dataset.platform;
		const lastUserId = messageList.lastChild.dataset.userId;
		if (lastPlatform == "youtube" && lastUserId == data.user.id)
			userInfoDiv.style.display = "none";
	}

	AddMessageItem(instance, data.eventId, 'youtube', data.user.id);
}

function YouTubeSuperChat(data) {
	if (!showYouTubeSuperChats)
		return;

	let message = `🪙 ${data.user.name} sent a Super Chat (${data.amount})`;

	ShowAlert(message, 'youtube');
}

function YouTubeSuperSticker(data) {
	if (!showYouTubeSuperStickers)
		return;

	let message = `${data.user.name} sent a Super Sticker (${data.amount})`;

	ShowAlert(message, 'youtube');
}

function YouTubeNewSponsor(data) {
	if (!showYouTubeMemberships)
		return;

	// Set message text
	let message = `⭐ New ${data.levelName} • Welcome ${data.user.name}!`;

	ShowAlert(message, 'youtube');
}

function YouTubeGiftMembershipReceived(data) {
	if (!showYouTubeMemberships)
		return;

	let message = `🎁 ${data.gifter.name} gifted a membership to ${data.user.name} (${data.tier})!`;

	ShowAlert(message, 'youtube');
}

function StreamlabsDonation(data) {
	if (!showStreamlabsDonations)
		return;

	const donater = data.from;
	const formattedAmount = data.formattedAmount;
	const currency = data.currency;

	let message = `🪙 ${donater} donated ${currency}${formattedAmount}`;

	ShowAlert(message, 'streamlabs');
}

function StreamElementsTip(data) {
	if (!showStreamElementsTips)
		return;

	const donater = data.username;
	const formattedAmount = `$${data.amount}`;
	const currency = data.currency;

	let message = `🪙 ${donater} donated ${currency}${formattedAmount}`;

	ShowAlert(message, 'streamelements');
}

function PatreonPledgeCreated(data) {
	if (!showPatreonMemberships)
		return;

	const user = data.attributes.full_name;
	const amount = (data.attributes.will_pay_amount_cents/100).toFixed(2);
	const patreonIcon = `<img src="icons/platforms/patreon.png" class="platform"/>`;

	let message = `${patreonIcon} ${user} joined Patreon ($${amount})`;

	ShowAlert(message, 'patreon');
}

function KofiDonation(data) {
	if (!showKofiDonations)
		return;

	const user = data.from;
	const amount = data.amount;
	const currency = data.currency;
	const kofiIcon = `<img src="icons/platforms/kofi.png" class="platform"/>`;

	let message = "";
	if (currency == "USD")
		message = `${kofiIcon} ${user} donated $${amount}`;
	else
		message = `${kofiIcon} ${user} donated ${currency} ${amount}`;

	ShowAlert(message, 'kofi');
}

function KofiSubscription(data) {
	if (!showKofiDonations)
		return;

	const user = data.from;
	const amount = data.amount;
	const currency = data.currency;
	const kofiIcon = `<img src="icons/platforms/kofi.png" class="platform"/>`;

	let message = "";
	if (currency == "USD")
		message = `${kofiIcon} ${user} subscribed ($${amount})`;
	else
		message = `${kofiIcon} ${user} subscribed (${currency} ${amount})`;

	ShowAlert(message, 'kofi');
}

function KofiResubscription(data) {
	if (!showKofiDonations)
		return;

	const user = data.from;
	const tier = data.tier;
	const kofiIcon = `<img src="icons/platforms/kofi.png" class="platform"/>`;

	let message = `${kofiIcon} ${user} subscribed (${tier})`;

	ShowAlert(message, 'kofi');
}

function KofiShopOrder(data) {
	if (!showKofiDonations)
		return;

	const user = data.from;
	const amount = data.amount;
	const currency = data.currency;
	const itemTotal = data.items.length;
	const kofiIcon = `<img src="icons/platforms/kofi.png" class="platform"/>`;

	let message = "";
	if (currency == "USD")
		message = `${kofiIcon} ${user} ordered ${itemTotal} item(s) on Ko-fi ($${amount})`;
	else
		message = `${kofiIcon} ${user} ordered ${itemTotal} item(s) on Ko-fi (${currency} ${amount})`;

	ShowAlert(message, 'kofi');
}

function TipeeeStreamDonation(data) {
	if (!showTipeeeStreamDonations)
		return;

	const user = data.username;
	const amount = data.amount;
	const currency = data.currency;
	const tipeeeStreamIcon = `<img src="icons/platforms/tipeeeStream.png" class="platform"/>`;

	let message = "";
	if (currency == "USD")
		message = `${tipeeeStreamIcon} ${user} donated $${amount}`;
	else
		message = `${tipeeeStreamIcon} ${user} donated ${currency} ${amount}`;

	ShowAlert(message, 'tipeeeStream');
}



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

function GetIntParam(paramName) {
	const urlParams = new URLSearchParams(window.location.search);
	const paramValue = urlParams.get(paramName);

	if (paramValue === null) {
		return null; // or undefined, or a default value, depending on your needs
	}

	const intValue = parseInt(paramValue, 10); // Parse as base 10 integer

	if (isNaN(intValue)) {
		return null; // or handle the error in another way, e.g., throw an error
	}

	return intValue;
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

async function GetAvatar(username) {
	if (avatarMap.has(username)) {
		console.debug(`Avatar found for ${username}. Retrieving from hash map.`)
		return avatarMap.get(username);
	}
	else {
		console.debug(`No avatar found for ${username}. Retrieving from Decapi.`)
		let response = await fetch('https://decapi.me/twitch/avatar/' + username);
		let data = await response.text()
		avatarMap.set(username, data);
		return data;
	}
}

async function GetPronouns(platform, username) {
	const response = await client.getUserPronouns(platform, username);
	const userFound = response.pronoun.userFound;
	const pronouns = `${response.pronoun.pronounSubject}/${response.pronoun.pronounObject}`;

	if (userFound)
		return `${response.pronoun.pronounSubject}/${response.pronoun.pronounObject}`;
	else
		return '';
}

function AddMessageItem(element, elementID, platform, userId) {
	// Calculate the height of the div before inserting
	const tempDiv = document.getElementById('IPutThisHereSoICanCalculateHowBigEachMessageIsSupposedToBeBeforeIAddItToTheMessageList');
	tempDiv.appendChild(element);

	setTimeout(function () {
		const calculatedWidth = tempDiv.offsetWidth + "px";
		//console.log(calculatedWidth);

		// Create a new line item to add to the message list later
		var lineItem = document.createElement('li');
		lineItem.id = elementID;
		lineItem.dataset.platform = platform;
		lineItem.dataset.userId = userId;

		// Move the element from the temp div to the new line item
		while (tempDiv.firstChild) {
			lineItem.appendChild(tempDiv.firstChild);
		}

		// Add the line item to the list and animate it
		// We need to manually set the height as straight CSS can't animate on "height: auto"
		messageList.appendChild(lineItem);
		setTimeout(function () {
			lineItem.className = lineItem.className + " show";
			lineItem.style.width = calculatedWidth;
		}, 10);

		// Remove old messages that have gone off screen to save memory
		while (messageList.clientWidth > 10 * window.innerWidth) {
			messageList.removeChild(messageList.firstChild);
		}

		tempDiv.innerHTML = '';
		
		if (hideAfter > 0)
		{
			setTimeout(function () {
				lineItem.style.opacity = 0;
				setTimeout(function() {
					messageList.removeChild(lineItem);
				}, 1000);
			}, hideAfter * 1000);
		}

	}, 200);
}

// I used Gemini for this shit so if it doesn't work, blame Google
function FindFirstImageUrl(jsonObject) {
	if (typeof jsonObject !== 'object' || jsonObject === null) {
		return null; // Handle invalid input
	}

	function iterate(obj) {
		if (Array.isArray(obj)) {
			for (const item of obj) {
				const result = iterate(item);
				if (result) {
					return result;
				}
			}
			return null;
		}

		for (const key in obj) {
			if (obj.hasOwnProperty(key)) {
				if (key === 'imageUrl') {
					return obj[key]; // Found it! Return the value.
				}

				if (typeof obj[key] === 'object' && obj[key] !== null) {
					const result = iterate(obj[key]); // Recursive call for nested objects
					if (result) {
						return result; // Propagate the found value
					}
				}
			}
		}
		return null; // Key not found in this level
	}

	return iterate(jsonObject);
}

function ShowAlert(message, background = null, duration = animationDuration) {

	// Check if the widget is in the middle of an animation
	// If any alerts are requested while the animation is playing, it should be added to the alert queue
	if (widgetLocked) {
		console.debug("Animation is progress, added alert to queue");
		let data = { message: message, background: background, duration: duration };
		alertQueue.push(data);
		return;
	}

	// Get divs
	const messageListDiv = document.querySelector("#messageList");
	const alertBoxDiv = document.querySelector("#alertBox");

	// Set the message text
	alertBoxDiv.innerHTML = message;

	// Set the background
	alertBoxDiv.classList.add(background);

	// Start the animation
	widgetLocked = true;
	messageListDiv.style.animation = 'hideAlertBox 0.5s ease-in-out forwards';
	alertBoxDiv.style.animation = 'showAlertBox 0.5s ease-in-out forwards';

	// To stop the animation (remove the animation property):
	setTimeout(() => {
		messageListDiv.style.animation = 'showAlertBox 0.5s ease-in-out forwards';
		alertBoxDiv.style.animation = 'hideAlertBox 0.5s ease-in-out forwards';
		setTimeout(() => {
			alertBoxDiv.classList = '';
			widgetLocked = false;
			if (alertQueue.length > 0) {
				console.debug("Pulling next alert from the queue");
				let data = alertQueue.shift();
				ShowAlert(data.message, data.background, data.duration);
			}
		}, 500);
	}, duration); // Remove after 5 seconds
}



///////////////////////////////////
// STREAMER.BOT WEBSOCKET STATUS //
///////////////////////////////////

// This function sets the visibility of the Streamer.bot status label on the overlay
function SetConnectionStatus(connected) {
	let statusContainer = document.getElementById("statusContainer");
	if (connected) {
		statusContainer.style.background = "#2FB774";
		statusContainer.innerText = "Connected!";
		statusContainer.style.opacity = 1;
		setTimeout(() => {
			statusContainer.style.transition = "all 2s ease";
			statusContainer.style.opacity = 0;
		}, 10);
	}
	else {
		statusContainer.style.background = "#D12025";
		statusContainer.innerText = "Connecting...";
		statusContainer.style.transition = "";
		statusContainer.style.opacity = 1;
	}
}

// let data = {
// 	"isAnonymous": false,
// 	"gifts": 10,
// 	"totalGifts": 0,
// 	"subTier": 1, /* 0 - Prime, 1 - Tier 1, 2 - Tier 2, 3 - Tier 3 */
// 	"userName": "<username of gifter>",
// 	"displayName": "<displayname of gifter>",
// 	"role": 1 /* 1 - Viewer, 2 - VIP, 3 - Moderator, 4 - Broadcaster  */
//   }

// TwitchGiftBomb(data);