////////////////
// PARAMETERS //
////////////////

const queryString = window.location.search;
const urlParams = new URLSearchParams(queryString);

const sbServerAddress = urlParams.get("address") || "127.0.0.1";
const sbServerPort = urlParams.get("port") || "8080";
const minimumRole = 2;							// 1 - Viewer, 2 - VIP, 3 - Moderator, 4 - Broadcaster
const avatarMap = new Map();
const pronounMap = new Map();
const animationDuration = 8000;
let widgetLocked = false;						// Needed to lock animation from overlapping
let alertQueue = [];

/////////////////
// GLOBAL VARS //
/////////////////

const kickPusherWsUrl = 'wss://ws-us2.pusher.com/app/32cbd69e4b950bf97679?protocol=7&client=js&version=7.6.0&flash=false';
let kickSubBadges = [];



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

const hideAfter = GetIntParam("hideAfter", 0);
const excludeCommands = GetBooleanParam("excludeCommands", true);
const ignoreChatters = urlParams.get("ignoreChatters") || "";
const groupConsecutiveMessages = GetBooleanParam("groupConsecutiveMessages", true);

const showTwitchMessages = GetBooleanParam("showTwitchMessages", true);
const showTwitchAnnouncements = GetBooleanParam("showTwitchAnnouncements", true);
const showTwitchSubs = GetBooleanParam("showTwitchSubs", true);
const showTwitchChannelPointRedemptions = GetBooleanParam("showTwitchChannelPointRedemptions", true);
const showTwitchRaids = GetBooleanParam("showTwitchRaids", true);
const showTwitchSharedChat = GetBooleanParam("showTwitchSharedChat", true);

const enableKickSupport = GetBooleanParam("enableKickSupport", false);
const kickUsername = urlParams.get("kickUsername") || "";
const showKickMessages = GetBooleanParam("showKickMessages", true);
// const showKickFollows = GetBooleanParam("showKickFollows", false);
const showKickSubs = GetBooleanParam("showKickSubs", true);
const showKickChannelPointRedemptions = GetBooleanParam("showKickChannelPointRedemptions", true);
const showKickHosts = GetBooleanParam("showKickHosts", true);

const showYouTubeMessages = GetBooleanParam("showYouTubeMessages", true);
const showYouTubeSuperChats = GetBooleanParam("showYouTubeSuperChats", true);
const showYouTubeSuperStickers = GetBooleanParam("showYouTubeSuperStickers", true);
const showYouTubeMemberships = GetBooleanParam("showYouTubeMemberships", true);

const showStreamlabsDonations = GetBooleanParam("showStreamlabsDonations", true)
const showStreamElementsTips = GetBooleanParam("showStreamElementsTips", true);
const showPatreonMemberships = GetBooleanParam("showPatreonMemberships", true);
const showKofiDonations = GetBooleanParam("showKofiDonations", true);
const showTipeeeStreamDonations = GetBooleanParam("showTipeeeStreamDonations", true);
const showFourthwallAlerts = GetBooleanParam("showFourthwallAlerts", true);

const furryMode = GetBooleanParam("furryMode", false);

const animationSpeed = GetIntParam("animationSpeed", 0.5);

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

// Set the animation speed
document.documentElement.style.setProperty('--animation-speed', `${animationSpeed}s`);



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

client.on('Fourthwall.OrderPlaced', (response) => {
	console.debug(response.data);
	FourthwallOrderPlaced(response.data);
})

client.on('Fourthwall.Donation', (response) => {
	console.debug(response.data);
	FourthwallDonation(response.data);
})

client.on('Fourthwall.SubscriptionPurchased', (response) => {
	console.debug(response.data);
	FourthwallSubscriptionPurchased(response.data);
})

client.on('Fourthwall.GiftPurchase', (response) => {
	console.debug(response.data);
	FourthwallGiftPurchase(response.data);
})

client.on('Fourthwall.GiftDrawStarted', (response) => {
	console.debug(response.data);
	FourthwallGiftDrawStarted(response.data);
})

client.on('Fourthwall.GiftDrawEnded', (response) => {
	console.debug(response.data);
	FourthwallGiftDrawEnded(response.data);
})



///////////////////////////
// KICK PUSHER WEBSOCKET //
///////////////////////////

// Connect and handle Pusher WebSocket
async function KickConnect() {
	if (!enableKickSupport)
		return;

	// Channel to subscribe to (you'll need the correct channel name here)
	const chatroomId = await GetKickChatroomId(kickUsername);

	// Cache subscriber badges
	kickSubBadges = await GetKickSubBadges(kickUsername);

	const websocket = new WebSocket(kickPusherWsUrl);

	websocket.onopen = function () {
		console.log(`Kick successfully conntected to ${kickUsername}.`);
	}

	websocket.onmessage = function (response) {
		try {
			let data = JSON.parse(response.data);

			console.debug(data);

			// When connection is established, subscribe to a channel
			if (data.event === 'pusher:connection_established') {
				const socketData = JSON.parse(data.data);
				console.log(`[Pusher] Socket established with ID: ${socketData.socket_id}`);

				// Now subscribe to a channel
				let subscribeMessage = {
					event: 'pusher:subscribe',
					data: {
						channel: `chatroom_${chatroomId}`
					}
				};

				websocket.send(JSON.stringify(subscribeMessage));

				// Now subscribe to a channel
				subscribeMessage = {
					event: 'pusher:subscribe',
					data: {
						channel: `chatrooms.${chatroomId}.v2`
					}
				};

				websocket.send(JSON.stringify(subscribeMessage));
				console.log(`[Pusher] Sent subscription request to channel: ${chatroomId}`);
			}

			// Event handlers
			const eventArgs = JSON.parse(data.data);
			const event = data.event.split('\\').pop();
			switch (event) {
				case 'ChatMessageEvent':
					KickChatMessage(eventArgs);
					break;
				//// 'Follows' unsupported by pusher
				// case 'FollowEvent':
				// 	break;
				case 'SubscriptionEvent':
					KickSubscription(eventArgs);
					break;
				case 'GiftedSubscriptionsEvent':
					KickGiftedSubscriptions(eventArgs);
					break;
				case 'RewardRedeemedEvent':
					KickRewardRedeemed(eventArgs);
					break;
				case 'StreamHostEvent':
					KickStreamHost(eventArgs);
					break;
				case 'MessageDeletedEvent':
					KickMessageDeleted(eventArgs);
					break;
				case 'UserBannedEvent':
					KickUserBanned(eventArgs);
					break;
			}
		}
		catch (error) {
			console.error(error);
		}
	}
}

// Try connect when window is loaded
window.addEventListener('load', KickConnect);



//////////////////////
// TIKFINITY CLIENT //
//////////////////////

let tikfinityWebsocket = null;

function TikfinityConnect() {
	if (tikfinityWebsocket) return; // Already connected

	tikfinityWebsocket = new WebSocket("ws://localhost:21213/");

	tikfinityWebsocket.onopen = function () {
		console.log(`TikFinity successfully connected...`)
	}

	tikfinityWebsocket.onclose = function () {
		console.error(`TikFinity disconnected...`)
		tikfinityWebsocket = null;
		setTimeout(tikfinityConnect, 1000); // Schedule a reconnect attempt
	}

	tikfinityWebsocket.onerror = function () {
		console.error(`TikFinity failed for some reason...`)
		tikfinityWebsocket = null;
		setTimeout(tikfinityConnect, 1000); // Schedule a reconnect attempt
	}

	tikfinityWebsocket.onmessage = function (response) {
		let payload = JSON.parse(response.data);

		let event = payload.event;
		let data = payload.data;

		console.debug('Event: ' + event);

		switch (event) {
			case 'chat':
				TikTokChat(data);
				break;
			case 'gift':
				TikTokGift(data);
				break;
			case 'subscribe':
				TikTokSubscribe(data);
				break;
		}
	}
}

// Try connect when window is loaded
window.addEventListener('load', TikfinityConnect);



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
	const userInfoDiv = instance.querySelector("#userInfo");
	const avatarDiv = instance.querySelector("#avatar");
	const timestampDiv = instance.querySelector("#timestamp");
	const platformDiv = instance.querySelector("#platform");
	const badgeListDiv = instance.querySelector("#badgeList");
	const pronounsDiv = instance.querySelector("#pronouns");
	const usernameDiv = instance.querySelector("#username");
	const messageDiv = instance.querySelector("#message");

	// Set Shared Chat
	// If the message is from Shared Chat AND the user indicated that they do NOT
	// want shared chat messages, don't show it on screen
	const isSharedChat = data.isSharedChat;
	if (isSharedChat && !showTwitchSharedChat) {
		if (!data.sharedChat.primarySource)
			return;
	}

	// Set timestamp
	if (showTimestamps) {
		timestampDiv.classList.add("timestamp");
		timestampDiv.innerText = GetCurrentTimeFormatted();
	}

	// Set the username info
	if (showUsername) {
		if (data.message.displayName.toLowerCase() == data.message.username.toLowerCase())
			usernameDiv.innerText = data.message.displayName;
		else
			usernameDiv.innerText = `${data.message.displayName} (${data.message.username})`;
		usernameDiv.style.color = data.message.color;
	}

	// Set pronouns
	const pronouns = await GetPronouns('twitch', data.message.username);
	if (pronouns && showPronouns) {
		pronounsDiv.classList.add("pronouns");
		pronounsDiv.innerText = pronouns;
	}

	// Set the message data
	let message = data.message.message;
	const messageColor = data.message.color;

	// Set furry mode
	if (furryMode)
		message = TranslateToFurry(message);

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
		messageDiv.innerHTML = messageDiv.innerHTML.replace(regex, emoteElement);
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
		const avatarURL = await GetAvatar(username, 'twitch');
		const avatar = new Image();
		avatar.src = avatarURL;
		avatar.classList.add("avatar");
		avatarDiv.appendChild(avatar);
	}

	// Hide the header if the same username sends a message twice in a row
	const messageList = document.getElementById("messageList");
	if (groupConsecutiveMessages && messageList.children.length > 0) {
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
			const emoteName = EscapeRegExp(data.parts[i].text);
	
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
			message = message.replace(regex, emoteElement);
		}
	}

	ShowAlert(message, background);
}

async function TwitchSub(data) {
	if (!showTwitchSubs)
		return;

	let username = data.user.name;
	if (data.user.name.toLowerCase() != data.user.login.toLowerCase())
		username = `${data.user.name} (${data.user.login})`;
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

	let username = data.user.name;
	if (data.user.name.toLowerCase() != data.user.login.toLowerCase())
		username = `${data.user.name} (${data.user.login})`;
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

	let username = data.user.name;
	if (data.user.name.toLowerCase() != data.user.login.toLowerCase())
		username = `${data.user.name} (${data.user.login})`;
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

	//// The below is incorrect (Streamer.bot documentation is wrong)
	// const username = data.displayName;
	// const gifts = data.gifts;
	// const subTier = data.subTier;
	let username = data.user.name;
	if (data.user.name.toLowerCase() != data.user.login.toLowerCase())
		username = `${data.user.name} (${data.user.login})`;
	const gifts = data.recipients.length;
	const subTier = data.sub_tier.charAt(0);

	let message = `🎁 ${username} gifted ${gifts} Tier ${subTier} subs!`;

	ShowAlert(message, 'twitch');
}

async function TwitchRewardRedemption(data) {
	if (!showTwitchChannelPointRedemptions)
		return;

	let username = data.user_name;
	if (data.user_name.toLowerCase() != data.user_login.toLowerCase())
		username = `${data.user_name} (${data.user_login})`;
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

	let username = data.from_broadcaster_user_name;
	if (data.from_broadcaster_user_name.toLowerCase() != data.from_broadcaster_user_login.toLowerCase())
		username = `${data.from_broadcaster_user_name} (${data.from_broadcaster_user_login})`;
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

	// Set furry mode
	if (furryMode)
		messageDiv.innerText = TranslateToFurry(data.message);

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
	if (groupConsecutiveMessages && messageList.children.length > 0) {
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
	const amount = (data.attributes.will_pay_amount_cents / 100).toFixed(2);
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
	let formattedAmount = "";

	if (amount == 0)
		formattedAmount = ""
	else if (currency == "USD")
		formattedAmount = `($${amount})`;
	else
		formattedAmount = `(${currency} ${amount})`;

	message = `${kofiIcon} ${user} ordered ${itemTotal} item(s) on Ko-fi ${formattedAmount}`;
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

function FourthwallOrderPlaced(data) {
	if (!showFourthwallAlerts)
		return;

	let user = data.username;
	const orderTotal = data.total;
	const currency = data.currency;
	const item = data.variants[0].name;
	const itemsOrdered = data.variants.length;

	let message = "";

	// If there user did not provide a username, just say "Someone"
	if (user == undefined)
		user = "Someone"

	// If the user ordered more than one item, write how many items they ordered
	message += `${user} ordered ${item}`;
	if (itemsOrdered > 1)
		message += ` and ${itemsOrdered - 1} other item(s)!`

	// If the user spent money, put the order total
	if (orderTotal == 0)
		message += ``;
	else if (currency == "USD")
		message += ` ($${orderTotal})`;
	else
		message += ` (${orderTotal} ${currency})`;

	ShowAlert(message, 'fourthwall');
}

function FourthwallDonation(data) {
	if (!showFourthwallAlerts)
		return;

	let user = data.username;
	const amount = data.amount;
	const currency = data.currency;

	let message = "";
	if (currency == "USD")
		message = `${user} donated $${amount}`;
	else
		message = `${user} donated ${currency} ${amount}`;

	ShowAlert(message, 'fourthwall');
}

function FourthwallSubscriptionPurchased(data) {
	if (!showFourthwallAlerts)
		return;

	let user = data.nickname;
	const amount = data.amount;
	const currency = data.currency;

	let message = "";
	if (currency == "USD")
		message = `${user} subscribed $${amount}`;
	else
		message = `${user} donsubscribedated ${currency} ${amount}`;

	ShowAlert(message, 'fourthwall');
}

function FourthwallGiftPurchase(data) {
	if (!showFourthwallAlerts)
		return;

	let user = data.username;
	const total = data.total;
	const currency = data.currency;
	const gifts = data.gifts.length;
	const itemName = data.offer.name;

	let message = "";

	// If the user ordered more than one item, write how many items they ordered
	message += `${user} gifted`;

	// If there is more than one gifted item, display the number of gifts
	if (gifts > 1)
		message += ` ${gifts} x `;

	// The name of the item to be given away
	message += ` ${itemName}`;

	// If the user spent money, put the order total
	if (currency == "USD")
		message += ` ($${total})`;
	else
		message += ` (${currency}${total})`;

	ShowAlert(message, 'fourthwall');
}

function FourthwallGiftDrawStarted(data) {
	if (!showFourthwallAlerts)
		return;

	const durationSeconds = data.durationSeconds;
	const itemName = data.offer.name;

	let message = "";
	message += `${user} gifted`;

	// If the user ordered more than one item, write how many items they ordered
	message += `🎁 ${itemName} Giveaway! • Type !join in the next ${durationSeconds} seconds for your chance to win!`;

	ShowAlert(message, 'fourthwall');
}

function FourthwallGiftDrawEnded(data) {
	if (!showFourthwallAlerts)
		return;

	let message = `🥳 GIVEAWAY ENDED 🥳`;

	ShowAlert(message, 'fourthwall');

	message = `Congratulations ${GetWinnersList(data.gifts)}!`;

	ShowAlert(message, 'fourthwall');
}

async function KickChatMessage(data) {
	if (!showKickMessages)
		return;

	// Don't post messages starting with "!"
	if (data.content.startsWith("!") && excludeCommands)
		return;

	// Don't post messages from users from the ignore list
	if (ignoreUserList.includes(data.sender.username.toLowerCase()))
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
		usernameDiv.innerText = data.sender.username;
		usernameDiv.style.color = data.sender.identity.color;
	}

	// Set the message data
	let message = data.content;

	// Set furry mode
	if (furryMode)
		message = TranslateToFurry(message);

	// Set message text
	if (showMessage) {
		messageDiv.innerText = message;
	}

	// Render platform
	if (showPlatform) {
		const platformElements = `<img src="icons/platforms/kick.png" class="platform"/>`;
		platformDiv.innerHTML = platformElements;
	}

	// Render badges
	if (showBadges) {
		badgeListDiv.innerHTML = "";
		for (i in data.sender.identity.badges) {
			const badge = new Image();
			badge.src = GetKickBadgeURL(data.sender.identity.badges[i]);
			badge.classList.add("badge");
			badgeListDiv.appendChild(badge);
		}
	}

	// Render emotes
	function replaceEmotes(message) {
		const emoteRegex = /\[emote:(\d+):([^\]]+)\]/g;

		return message.replace(emoteRegex, (_, id, name) => {
			const imgUrl = `https://files.kick.com/emotes/${id}/fullsize`;
			return `<img src="${imgUrl}" alt="${name}" title="${name}" class="emote" />`;
		});
	}
	messageDiv.innerHTML = replaceEmotes(message);

	// Render avatars
	if (showAvatar) {
		const username = data.sender.slug;
		const avatarURL = await GetAvatar(username, 'kick');
		const avatar = new Image();
		avatar.src = avatarURL;
		avatar.classList.add("avatar");
		avatarDiv.appendChild(avatar);
	}

	// Hide the header if the same username sends a message twice in a row
	const messageList = document.getElementById("messageList");
	if (groupConsecutiveMessages && messageList.children.length > 0) {
		const lastPlatform = messageList.lastChild.dataset.platform;
		const lastUserId = messageList.lastChild.dataset.userId;
		if (lastPlatform == "kick" && lastUserId == data.sender.id)
			userInfoDiv.style.display = "none";
	}

	AddMessageItem(instance, data.id, 'kick', data.sender.id);
}

function KickSubscription(data) {
	if (!showKickSubs)
		return;
	
	// Set the text
	const username = data.username;
	const months = data.months;

	let message = '';
	if (months <= 1)
		message = `${username} just subscribed for the first time!`;
	else
		message = `${username} resubscribed! (${months} months)`;

	ShowAlert(message, 'kick');
}

function KickGiftedSubscriptions(data) {
	if (!showKickSubs)
		return;
	
	// Set the text
	const gifter = data.gifter_username;
	const giftedUsers = data.gifted_usernames;

	let message = `${gifter} gifted ${giftedUsers.length} subscription${giftedUsers.length === 1 ? '' : 's'} to the community!`

	ShowAlert(message, 'kick');
}

function KickRewardRedeemed(data) {
	if (!showKickChannelPointRedemptions)
		return;

	const username = data.username;
	const rewardName = data.reward_title;
	const message = `${username} redeemed ${rewardName}`;

	ShowAlert(message, 'kick');
}

function KickStreamHost(data) {
	if (!showKickHosts)
		return;

	const username = data.host_username;
	const viewers = data.number_viewers;
	const message = `${username} is raiding with a party of ${viewers}`;

	ShowAlert(message, 'kick');
}

function KickMessageDeleted(data) {
	const messageList = document.getElementById("messageList");

	// Maintain a list of chat messages to delete
	const messagesToRemove = [];

	// ID of the message to remove
	const messageId = data.message.id;

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

function KickUserBanned(data) {
	const messageList = document.getElementById("messageList");

	// Maintain a list of chat messages to delete
	const messagesToRemove = [];

	// ID of the message to remove
	const userId = data.user.id;

	// Find the items to remove
	for (let i = 0; i < messageList.children.length; i++) {
		if (messageList.children[i].dataset.userId == userId) {
			messagesToRemove.push(messageList.children[i]);
		}
	}

	// Remove the items
	messagesToRemove.forEach(item => {
		messageList.removeChild(item);
	});
}

async function TikTokChat(data) {
	// Don't post messages starting with "!"
	if (data.comment.startsWith("!") && excludeCommands)
		return;

	// Don't post messages from users from the ignore list
	if (ignoreUserList.includes(data.comment.toLowerCase()))
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
		usernameDiv.innerText = data.nickname;
		usernameDiv.style.color = '#9e9e9e';
	}

	// Set the message data
	let message = data.comment;

	// Set furry mode
	if (furryMode)
		message = TranslateToFurry(message);

	// Set message text
	if (showMessage) {
		messageDiv.innerText = message;
	}

	// Render platform
	if (showPlatform) {
		const platformElements = `<img src="icons/platforms/tiktok.png" class="platform"/>`;
		platformDiv.innerHTML = platformElements;
	}

	// Render badges
	if (showBadges) {
		badgeListDiv.innerHTML = "";

		if (data.isModerator) {
			const badge = new Image();
			badge.src = `icons/badges/youtube-moderator.svg`;
			badge.style.filter = `invert(100%)`;
			badge.style.opacity = 0.8;
			badge.classList.add("badge");
			badgeListDiv.appendChild(badge);
		}

		for (i in data.userBadges) {
			if (data.userBadges[i].type == 'image') {
				const badge = new Image();
				badge.src = data.userBadges[i].url;
				badge.classList.add("badge");
				badgeListDiv.appendChild(badge);
			}
		}
	}

	// Render avatars
	if (showAvatar) {
		const avatar = new Image();
		avatar.src = data.profilePictureUrl;
		avatar.classList.add("avatar");
		avatarDiv.appendChild(avatar);
	}

	// Hide the header if the same username sends a message twice in a row
	const messageList = document.getElementById("messageList");
	if (groupConsecutiveMessages && messageList.children.length > 0) {
		const lastPlatform = messageList.lastChild.dataset.platform;
		const lastUserId = messageList.lastChild.dataset.userId;
		if (lastPlatform == "tiktok" && lastUserId == data.userId)
			userInfoDiv.style.display = "none";
	}

	AddMessageItem(instance, data.msgId, 'tiktok', data.userId);
}

async function TikTokGift(data) {
	if (data.giftType === 1 && !data.repeatEnd) {
		// Streak in progress => show only temporary
		console.debug(`${data.uniqueId} is sending gift ${data.giftName} x${data.repeatCount}`);
		return;
	}

	// Streak ended or non-streakable gift => process the gift with final repeat_count
	console.debug(`${data.uniqueId} has sent gift ${data.giftName} x${data.repeatCount}`);

	const giftImg = `<img src=${data.giftPictureUrl} class="platform"/>`;

	const message = `${data.nickname} sent ${giftImg}x${data.repeatCount}`;

	ShowAlert(message, 'tiktok');
}

async function TikTokSubscribe(data) {
	let username = data.nickname;

	const message = `${username} subscribed on TikTok`;

	ShowAlert(message, 'tiktok');
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
				let response = await fetch('https://kick.com/api/v2/channels/' + username);
				console.log('https://kick.com/api/v2/channels/' + username)
				let data = await response.json();
				let avatarURL = data.user.profile_pic;
				if (!avatarURL)
					avatarURL = 'https://kick.com/img/default-profile-pictures/default2.jpeg';
				avatarMap.set(`${username}-${platform}`, avatarURL);
				return avatarURL;
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

function AddMessageItem(element, elementID, platform, userId) {
	// Calculate the height of the div before inserting
	const tempDiv = document.getElementById('IPutThisHereSoICanCalculateHowBigEachMessageIsSupposedToBeBeforeIAddItToTheMessageList');
	const tempDivTwoElectricBoogaloo = document.createElement('div');
	tempDivTwoElectricBoogaloo.style.display = 'inline';
	tempDivTwoElectricBoogaloo.appendChild(element);
	tempDiv.appendChild(tempDivTwoElectricBoogaloo);

	setTimeout(function () {
		const calculatedWidth = tempDivTwoElectricBoogaloo.offsetWidth + "px";

		// Create a new line item to add to the message list later
		var lineItem = document.createElement('li');
		lineItem.id = elementID;
		lineItem.dataset.platform = platform;
		lineItem.dataset.userId = userId;

		// Move the element from the temp div to the new line item
		lineItem.appendChild(tempDiv.firstElementChild);

		// Add the line item to the list and animate it
		// We need to manually set the height as straight CSS can't animate on "height: auto"
		messageList.appendChild(lineItem);
		setTimeout(function () {
			lineItem.className = lineItem.className + " show";
			lineItem.style.maxWidth = calculatedWidth;
			// After it's done animating, remove the width constraint in case the div needs to get longer
			setTimeout(function () {
				lineItem.style.maxWidth = "none";
			}, 1000);
		}, 10);

		// Remove old messages that have gone off screen to save memory
		while (messageList.clientWidth > 10 * window.innerWidth) {
			messageList.removeChild(messageList.firstChild);
		}

		if (hideAfter > 0) {
			setTimeout(function () {
				lineItem.style.opacity = 0;
				setTimeout(function () {
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
	const backgroundDiv = document.querySelector("#background");
	const alertBoxDiv = document.querySelector("#alertBox");
	const alertBoxContent = document.querySelector("#alertBoxContent");

	// Set the message text
	alertBoxContent.innerHTML = message;

	// Set the background
	alertBoxDiv.classList.add(background);

	// Start the animation
	widgetLocked = true;
	// messageListDiv.style.animation = 'hideAlertBox 0.5s ease-in-out forwards';
	// backgroundDiv.style.animation = 'hideAlertBox 0.5s ease-in-out forwards';
	alertBoxDiv.style.animation = 'showAlertBox 0.5s ease-in-out forwards';

	// To stop the animation (remove the animation property):
	setTimeout(() => {
		// messageListDiv.style.animation = 'showAlertBox 0.5s ease-in-out forwards';
		// backgroundDiv.style.animation = 'showAlertBox 0.5s ease-in-out forwards';
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

function GetWinnersList(gifts) {
	const winners = gifts.map(gift => gift.winner);
	const numWinners = winners.length;

	if (numWinners === 0) {
		return "";
	} else if (numWinners === 1) {
		return winners[0];
	} else if (numWinners === 2) {
		return `${winners[0]} and ${winners[1]}`;
	} else {
		const lastWinner = winners.pop();
		const secondLastWinner = winners.pop();
		return `${winners.join(", ")}, ${secondLastWinner} and ${lastWinner}`;
	}
}

function TranslateToFurry(sentence) {
	const words = sentence.toLowerCase().split(/\b/);

	const furryWords = words.map(word => {
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
	});

	return furryWords.join('');
}

function EscapeRegExp(string) {
	return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // $& means the whole matched string
}

async function GetKickChatroomId(username) {
	const url = `https://kick.com/api/v2/channels/${username}`;

	try {
		const response = await fetch(url);
		if (!response.ok) {
			throw new Error(`HTTP error ${response.status}`);
		}

		const data = await response.json();
		if (data.chatroom && data.chatroom.id) {
			return data.chatroom.id;
		} else {
			throw new Error("Chatroom ID not found in response.");
		}
	} catch (error) {
		console.error("Failed to fetch chatroom ID:", error.message);
		return null;
	}
}

async function GetKickSubBadges(username) {
	const response = await fetch(`https://kick.com/api/v2/channels/${username}`);
	const data = await response.json();

	return data.subscriber_badges || [];
}

function GetKickBadgeURL(data) {
	switch (data.type) {
		case 'subscriber':
			return CalculateKickSubBadge(data.count);
		default:
			return `icons/badges/kick-${data.type}.svg`;
	}
}

function CalculateKickSubBadge(months) {
  if (!Array.isArray(kickSubBadges)) return null;

  // Filter for eligible badges, then get the one with the highest 'months'
  const badge = kickSubBadges
    .filter(b => b.months <= months)
    .sort((a, b) => b.months - a.months)[0];

  return badge?.badge_image?.src || `icons/badges/kick-subscriber.svg`;
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