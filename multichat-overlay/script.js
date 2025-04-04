////////////////
// PARAMETERS //
////////////////

const queryString = window.location.search;
const urlParams = new URLSearchParams(queryString);

const sbServerAddress = urlParams.get("address") || "127.0.0.1";
const sbServerPort = urlParams.get("port") || "8080";
const avatarMap = new Map();

/////////////
// OPTIONS //
/////////////

const showPlatform = GetBooleanParam("showPlatform", true);
const showAvatar = GetBooleanParam("showAvatar", true);
const showTimestamps = GetBooleanParam("showTimestamps", true);
const showBadges = GetBooleanParam("showBadges", true);
const showPronouns = GetBooleanParam("showPronouns", true);
const showUsername = GetBooleanParam("showUsername", true);
const showMessage = GetBooleanParam("showMessage", true);
const font = urlParams.get("font") || "";
const fontSize = urlParams.get("fontSize") || "30";
const lineSpacing = urlParams.get("lineSpacing") || "1.7";
const background = urlParams.get("background") || "#000000";
const opacity = urlParams.get("opacity") || "0.85";

const hideAfter = GetIntParam("hideAfter", 0);
const excludeCommands = GetBooleanParam("excludeCommands", true);
const ignoreChatters = urlParams.get("ignoreChatters") || "";
const scrollDirection = GetIntParam("scrollDirection", 1);
const inlineChat = GetBooleanParam("inlineChat", false);
const imageEmbedPermissionLevel = GetIntParam("imageEmbedPermissionLevel", 20);

const showTwitchMessages = GetBooleanParam("showTwitchMessages", true);
const showTwitchAnnouncements = GetBooleanParam("showTwitchAnnouncements", true);
const showTwitchSubs = GetBooleanParam("showTwitchSubs", true);
const showTwitchChannelPointRedemptions = GetBooleanParam("showTwitchChannelPointRedemptions", true);
const showTwitchRaids = GetBooleanParam("showTwitchRaids", true);
const showTwitchSharedChat = GetIntParam("showTwitchSharedChat", 2);

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

// Set fonts for the widget
document.body.style.fontFamily = font;
document.body.style.fontSize = `${fontSize}px`;

// Set line spacing
document.documentElement.style.setProperty('--line-spacing', `${lineSpacing}em`);

// Set the background color
const opacity255 = Math.round(parseFloat(opacity) * 255);
let hexOpacity = opacity255.toString(16);
if (hexOpacity.length < 2) {
	hexOpacity = "0" + hexOpacity;
}
document.body.style.background = `${background}${hexOpacity}`;

// Get a list of chatters to ignore
const ignoreUserList = ignoreChatters.split(',').map(item => item.trim().toLowerCase()) || [];

// Set the scroll direction
switch (scrollDirection) {
	case 1:
		document.getElementById('messageList').classList.add('normalScrollDirection');
		break;
	case 2:
		document.getElementById('messageList').classList.add('reverseScrollDirection');
		break;
}




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

client.on('Twitch.AutomaticRewardRedemption', (response) => {
	console.debug(response.data);
	TwitchAutomaticRewardRedemption(response.data);
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
	YouTubeGiftMembershipReceived(response.data);
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



///////////////////////
// MULTICHAT OVERLAY //
///////////////////////

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
	const messageContainerDiv = instance.querySelector("#messageContainer");
	const firstMessageDiv = instance.querySelector("#firstMessage");
	const sharedChatDiv = instance.querySelector("#sharedChat");
	const sharedChatChannelDiv = instance.querySelector("#sharedChatChannel");
	const replyDiv = instance.querySelector("#reply");
	const replyUserDiv = instance.querySelector("#replyUser");
	const replyMsgDiv = instance.querySelector("#replyMsg");
	const userInfoDiv = instance.querySelector("#userInfo");
	const avatarDiv = instance.querySelector("#avatar");
	const timestampDiv = instance.querySelector("#timestamp");
	const platformDiv = instance.querySelector("#platform");
	const badgeListDiv = instance.querySelector("#badgeList");
	const pronounsDiv = instance.querySelector("#pronouns");
	const usernameDiv = instance.querySelector("#username");
	const messageDiv = instance.querySelector("#message");

	// Set First Time Chatter
	const firstMessage = data.message.firstMessage;
	if (firstMessage && showMessage) {
		firstMessageDiv.style.display = 'block';
		messageContainerDiv.classList.add("highlightMessage");
	}

	// Set Shared Chat
	console.log(showTwitchSharedChat);
	const isSharedChat = data.isSharedChat;
	if (isSharedChat) {
		if (showTwitchSharedChat > 1) {
			if (!data.sharedChat.primarySource)
			{
				const sharedChatChannel = data.sharedChat.sourceRoom.name;
				sharedChatDiv.style.display = 'block';
				sharedChatChannelDiv.innerHTML = `💬 ${sharedChatChannel}`;
				messageContainerDiv.classList.add("highlightMessage");
			}
		}
		else if (!data.sharedChat.primarySource && showTwitchSharedChat == 0)
			return;
	}

	// Set Reply Message
	const isReply = data.message.isReply;
	if (isReply && showMessage) {
		const replyUser = data.message.reply.userName;
		const replyMsg = data.message.reply.msgBody;

		replyDiv.style.display = 'block';
		replyUserDiv.innerText = replyUser;
		replyMsgDiv.innerText = replyMsg;
	}

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
	const pronouns = await GetPronouns('twitch', data.message.username);
	if (pronouns && showPronouns) {
		pronounsDiv.classList.add("pronouns");
		pronounsDiv.innerText = pronouns;
	}

	// Set the message data
	let message = data.message.message;
	const messageColor = data.message.color;
	const role = data.message.role;

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

	// Remove the line break
	if (inlineChat)
	{
		instance.querySelector("#colon-separator").style.display = `inline`;
		instance.querySelector("#line-space").style.display = `none`;
	}

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
	// EXCEPT when the scroll direction is set to reverse (scrollDirection == 2)
	const messageList = document.getElementById("messageList");
	if (messageList.children.length > 0 && scrollDirection != 2) {
		const lastPlatform = messageList.lastChild.dataset.platform;
		const lastUserId = messageList.lastChild.dataset.userId;
		if (lastPlatform == "twitch" && lastUserId == data.user.id)
			userInfoDiv.style.display = "none";
	}

	// Embed image
	if (IsThisUserAllowedToPostImagesOrNotReturnTrueIfTheyCanReturnFalseIfTheyCannot(imageEmbedPermissionLevel, data, 'twitch') && IsImageUrl(message)) {
		const image = new Image();

		image.onload = function () {
			image.style.padding = "20px 0px";
			image.style.width = "100%";
			messageDiv.innerHTML = '';
			messageDiv.appendChild(image);

			AddMessageItem(instance, data.message.msgId, 'twitch', data.user.id);
		};

		const urlObj = new URL(message);
		urlObj.search = '';
		urlObj.hash = '';

		image.src = "https://external-content.duckduckgo.com/iu/?u=" + urlObj.toString();
	}
	else {
		AddMessageItem(instance, data.message.msgId, 'twitch', data.user.id);
	}
}

async function TwitchAutomaticRewardRedemption(data) {
	// Get a reference to the template
	const template = document.getElementById('messageTemplate');

	// Create a new instance of the template
	const instance = template.content.cloneNode(true);

	// Get divs
	const messageContainerDiv = instance.querySelector("#messageContainer");
	const firstMessageDiv = instance.querySelector("#firstMessage");
	const replyDiv = instance.querySelector("#reply");
	const replyUserDiv = instance.querySelector("#replyUser");
	const replyMsgDiv = instance.querySelector("#replyMsg");
	const userInfoDiv = instance.querySelector("#userInfo");
	const avatarDiv = instance.querySelector("#avatar");
	const timestampDiv = instance.querySelector("#timestamp");
	const platformDiv = instance.querySelector("#platform");
	const badgeListDiv = instance.querySelector("#badgeList");
	const usernameDiv = instance.querySelector("#username");
	const messageDiv = instance.querySelector("#message");

	if (data.reward_type != 'gigantify_an_emote')
		return;

	userInfoDiv.style.display = "none";

	// Show the gigantified emote
	const gigaEmote = data.gigantified_emote.imageUrl;
	const image = new Image();
	image.src = gigaEmote;
	image.style.padding = "20px 0px";
	image.style.width = "50%";

	image.onload = function () {
		messageDiv.innerHTML = '';
		messageDiv.appendChild(image);
	}

	AddMessageItem(instance, data.id);
}

async function TwitchAnnouncement(data) {
	if (!showTwitchAnnouncements)
		return;

	// Get a reference to the template
	const template = document.getElementById('cardTemplate');

	// Create a new instance of the template
	const instance = template.content.cloneNode(true);

	// Get divs
	const cardDiv = instance.querySelector("#card");
	const headerDiv = instance.querySelector("#header");
	const avatarDiv = instance.querySelector("#avatar");
	const timestampDiv = instance.querySelector("#timestamp");
	const iconDiv = instance.querySelector("#icon");
	const titleDiv = instance.querySelector("#title");
	const contentDiv = instance.querySelector("#contentDiv");

	// Set the card background colors
	switch (data.announcementColor) {
		case "BLUE":
			cardDiv.classList.add('announcementBlue');
			break;
		case "GREEN":
			cardDiv.classList.add('announcementGreen');
			break;
		case "ORANGE":
			cardDiv.classList.add('announcementOrange');
			break;
		case "PURPLE":
			cardDiv.classList.add('announcementPurple');
			break;
	}

	// Set the card header
	iconDiv.innerText = "📢";
	titleDiv.innerText = "Announcement";

	// Get a reference to the message template
	const contentTemplate = document.getElementById('messageTemplate');

	// Create a new instance of the template
	const content = contentTemplate.content.cloneNode(true);

	// Set timestamp
	if (showTimestamps) {
		content.querySelector("#timestamp").classList.add("timestamp");
		content.querySelector("#timestamp").innerText = GetCurrentTimeFormatted();
	}
	content.querySelector("#username").innerText = data.user.name;
	content.querySelector("#username").style.color = data.user.color;
	content.querySelector("#message").innerText = data.text;

	// Remove the line break
	content.querySelector("#colon-separator").style.display = `inline`;
	content.querySelector("#line-space").style.display = `none`;

	// Render platform
	content.querySelector("#platform").style.display = `none`;

	// Render badges
	content.querySelector("#badgeList").innerHTML = "";
	for (i in data.user.badges) {
		const badge = new Image();
		badge.src = data.user.badges[i].imageUrl;
		badge.classList.add("badge");
		content.querySelector("#badgeList").appendChild(badge);
	}

	// Set pronouns
	const pronouns = await GetPronouns('twitch', data.user.login);
	if (pronouns) {
		content.querySelector("#pronouns").classList.add("pronouns");
		content.querySelector("#pronouns").innerText = pronouns;
	}

	// Render emotes
	for (i in data.parts) {
		if (data.parts[i].type == `emote`) {
			const emoteElement = `<img src="${data.parts[i].imageUrl}" class="emote"/>`;
			content.querySelector("#message").innerHTML = content.querySelector("#message").innerHTML.replace(new RegExp(`\\b${data.parts[i].text}\\b`), emoteElement);
		}
	}

	// Insert the modified template instance into the DOM
	instance.querySelector("#content").appendChild(content);

	AddMessageItem(instance, data.messageId);
}

async function TwitchSub(data) {
	if (!showTwitchSubs)
		return;

	// Get a reference to the template
	const template = document.getElementById('cardTemplate');

	// Create a new instance of the template
	const instance = template.content.cloneNode(true);

	// Get divs
	const cardDiv = instance.querySelector("#card");
	const headerDiv = instance.querySelector("#header");
	const avatarDiv = instance.querySelector("#avatar");
	const iconDiv = instance.querySelector("#icon");
	const titleDiv = instance.querySelector("#title");
	const contentDiv = instance.querySelector("#contentDiv");

	// Set the card background colors
	cardDiv.classList.add('twitch');

	// Set the card header
	for (i in data.user.badges) {
		if (data.user.badges[i].name == "subscriber") {
			const badge = new Image();
			badge.src = data.user.badges[i].imageUrl;
			badge.classList.add("badge");
			iconDiv.appendChild(badge);
		}
	}

	// Set the text
	const username = data.user.name;
	const subTier = data.sub_tier;
	const isPrime = data.is_prime;

	if (!isPrime)
		titleDiv.innerText = `${username} subscribed with Tier ${subTier.charAt(0)}`;
	else
		titleDiv.innerText = `${username} used their Prime Sub`;

	AddMessageItem(instance, data.messageId);
}

async function TwitchResub(data) {
	if (!showTwitchSubs)
		return;

	// Get a reference to the template
	const template = document.getElementById('cardTemplate');

	// Create a new instance of the template
	const instance = template.content.cloneNode(true);

	// Get divs
	const cardDiv = instance.querySelector("#card");
	const headerDiv = instance.querySelector("#header");
	const avatarDiv = instance.querySelector("#avatar");
	const iconDiv = instance.querySelector("#icon");
	const titleDiv = instance.querySelector("#title");
	const contentDiv = instance.querySelector("#content");

	// Set the card background colors
	cardDiv.classList.add('twitch');

	// Set the card header
	for (i in data.user.badges) {
		if (data.user.badges[i].name == "subscriber") {
			const badge = new Image();
			badge.src = data.user.badges[i].imageUrl;
			badge.classList.add("badge");
			iconDiv.appendChild(badge);
		}
	}

	// Set the text
	const username = data.user.name;
	const subTier = data.subTier;
	const isPrime = data.isPrime;
	const cumulativeMonths = data.cumulativeMonths;
	const message = data.text;

	if (!isPrime)
		titleDiv.innerText = `${username} resubscribed with Tier ${subTier.charAt(0)} (${cumulativeMonths} months)`;
	else
		titleDiv.innerText = `${username} used their Prime Sub (${cumulativeMonths} months)`;
	contentDiv.innerText = `${message}`;

	AddMessageItem(instance, data.messageId);
}

async function TwitchGiftSub(data) {
	if (!showTwitchSubs)
		return;

	// Get a reference to the template
	const template = document.getElementById('cardTemplate');

	// Create a new instance of the template
	const instance = template.content.cloneNode(true);

	// Get divs
	const cardDiv = instance.querySelector("#card");
	const headerDiv = instance.querySelector("#header");
	const avatarDiv = instance.querySelector("#avatar");
	const iconDiv = instance.querySelector("#icon");
	const titleDiv = instance.querySelector("#title");
	const contentDiv = instance.querySelector("#content");

	// Set the card background colors
	cardDiv.classList.add('twitch');

	// Set the card header
	for (i in data.user.badges) {
		if (data.user.badges[i].name == "subscriber") {
			const badge = new Image();
			badge.src = data.user.badges[i].imageUrl;
			badge.classList.add("badge");
			iconDiv.appendChild(badge);
		}
	}

	// Set the text
	const username = data.user.name;
	const subTier = data.subTier;
	const recipient = data.recipient.name;
	const cumlativeTotal = data.cumlativeTotal;

	titleDiv.innerText = `${username} gifted a Tier ${subTier.charAt(0)} subscription to ${recipient}`;
	if (cumlativeTotal > 0)
		contentDiv.innerText = `They've gifted ${cumlativeTotal} subs in total!`;

	AddMessageItem(instance, data.messageId);
}

async function TwitchRewardRedemption(data) {
	if (!showTwitchChannelPointRedemptions)
		return;

	// Get a reference to the template
	const template = document.getElementById('cardTemplate');

	// Create a new instance of the template
	const instance = template.content.cloneNode(true);

	// Get divs
	const cardDiv = instance.querySelector("#card");
	const headerDiv = instance.querySelector("#header");
	const avatarDiv = instance.querySelector("#avatar");
	const iconDiv = instance.querySelector("#icon");
	const titleDiv = instance.querySelector("#title");
	const contentDiv = instance.querySelector("#content");

	// Set the card background colors
	cardDiv.classList.add('twitch');

	if (showAvatar) {
		// Render avatars
		const username = data.user_login;
		const avatarURL = await GetAvatar(username);
		const avatar = new Image();
		avatar.src = avatarURL;
		avatar.classList.add("avatar");
		avatarDiv.appendChild(avatar);
	}

	// Set the text
	const username = data.user_name;
	const rewardName = data.reward.title;
	const cost = data.reward.cost;
	const userInput = data.user_input;
	const channelPointIcon = `<img src="icons/badges/twitch-channel-point.png" class="platform"/>`;

	titleDiv.innerHTML = `${username} redeemed ${rewardName} ${channelPointIcon} ${cost}`;
	contentDiv.innerText = `${userInput}`;

	AddMessageItem(instance, data.messageId);
}

async function TwitchRaid(data) {
	if (!showTwitchRaids)
		return;

	// Get a reference to the template
	const template = document.getElementById('cardTemplate');

	// Create a new instance of the template
	const instance = template.content.cloneNode(true);

	// Get divs
	const cardDiv = instance.querySelector("#card");
	const headerDiv = instance.querySelector("#header");
	const avatarDiv = instance.querySelector("#avatar");
	const iconDiv = instance.querySelector("#icon");
	const titleDiv = instance.querySelector("#title");
	const contentDiv = instance.querySelector("#content");

	// Set the card background colors
	cardDiv.classList.add('twitch');

	if (showAvatar) {
		// Render avatars
		const username = data.from_broadcaster_user_login;
		const avatarURL = await GetAvatar(username);
		const avatar = new Image();
		avatar.src = avatarURL;
		avatar.classList.add("avatar");
		avatarDiv.appendChild(avatar);
	}


	// Set the text
	const username = data.from_broadcaster_user_login;
	const viewers = data.viewers;

	titleDiv.innerText = `${username} is raiding`;
	contentDiv.innerText = `with a party of ${viewers}`;

	AddMessageItem(instance, data.messageId);
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
		item.style.opacity = 0;
		item.style.height = 0;
		setTimeout(function () {
			messageList.removeChild(item);
		}, 1000);
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

	// Remove the line break
	if (inlineChat)
	{
		instance.querySelector("#colon-separator").style.display = `inline`;
		instance.querySelector("#line-space").style.display = `none`;
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
		// messageDiv.innerHTML = messageDiv.innerHTML.replace(new RegExp(`\\b${data.emotes[i].name}\\b`), emoteElement);
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
	// EXCEPT when the scroll direction is set to reverse (scrollDirection == 2)
	const messageList = document.getElementById("messageList");
	if (messageList.children.length > 0 && scrollDirection != 2) {
		const lastPlatform = messageList.lastChild.dataset.platform;
		const lastUserId = messageList.lastChild.dataset.userId;
		if (lastPlatform == "youtube" && lastUserId == data.user.id)
			userInfoDiv.style.display = "none";
	}

	// Embed image
	const message = data.message;
	if (IsThisUserAllowedToPostImagesOrNotReturnTrueIfTheyCanReturnFalseIfTheyCannot(imageEmbedPermissionLevel, data, 'youtube') && IsImageUrl(message)) {
		const image = new Image();

		image.onload = function () {
			image.style.padding = "20px 0px";
			image.style.width = "100%";
			messageDiv.innerHTML = '';
			messageDiv.appendChild(image);

			AddMessageItem(instance, data.message.msgId, 'youtube', data.user.id);
		};

		const urlObj = new URL(message);
		urlObj.search = '';
		urlObj.hash = '';

		image.src = "https://external-content.duckduckgo.com/iu/?u=" + urlObj.toString();
	}
	else {
		AddMessageItem(instance, data.eventId, 'youtube', data.user.id);
	}
}

function YouTubeSuperChat(data) {
	if (!showYouTubeSuperChats)
		return;

	// Get a reference to the template
	const template = document.getElementById('cardTemplate');

	// Create a new instance of the template
	const instance = template.content.cloneNode(true);

	// Get divs
	const cardDiv = instance.querySelector("#card");
	const headerDiv = instance.querySelector("#header");
	const avatarDiv = instance.querySelector("#avatar");
	const iconDiv = instance.querySelector("#icon");
	const titleDiv = instance.querySelector("#title");
	const contentDiv = instance.querySelector("#content");

	// Set the card background colors
	cardDiv.classList.add('youtube');

	// Set message text
	titleDiv.innerText = `🪙 ${data.user.name} sent a Super Chat (${data.amount})`;
	contentDiv.innerText = `${data.message}!`;

	AddMessageItem(instance, data.eventId);
}

function YouTubeSuperSticker(data) {
	if (!showYouTubeSuperStickers)
		return;

	// Get a reference to the template
	const template = document.getElementById('cardTemplate');

	// Create a new instance of the template
	const instance = template.content.cloneNode(true);

	// Get divs
	const cardDiv = instance.querySelector("#card");
	const headerDiv = instance.querySelector("#header");
	const avatarDiv = instance.querySelector("#avatar");
	const iconDiv = instance.querySelector("#icon");
	const titleDiv = instance.querySelector("#title");
	const contentDiv = instance.querySelector("#content");

	// Set the card background colors
	cardDiv.classList.add('youtube');

	const stickerTemplate = document.getElementById('stickerTemplate');

	// Create a new instance of the template
	const stickerInstance = stickerTemplate.content.cloneNode(true);

	// Render sticker
	stickerInstance.querySelector("#stickerImg").src = FindFirstImageUrl(data);
	stickerInstance.querySelector("#stickerLabel").innerText = `${data.user.name} sent a Super Sticker (${data.amount})`;

	contentDiv.appendChild(stickerInstance);

	AddMessageItem(instance, data.eventId);
}

function YouTubeNewSponsor(data) {
	if (!showYouTubeMemberships)
		return;

	// Get a reference to the template
	const template = document.getElementById('cardTemplate');

	// Create a new instance of the template
	const instance = template.content.cloneNode(true);

	// Get divs
	const cardDiv = instance.querySelector("#card");
	const headerDiv = instance.querySelector("#header");
	const avatarDiv = instance.querySelector("#avatar");
	const iconDiv = instance.querySelector("#icon");
	const titleDiv = instance.querySelector("#title");
	const contentDiv = instance.querySelector("#content");

	// Set the card background colors
	cardDiv.classList.add('youtube');

	// Set message text
	titleDiv.innerText = `⭐ New ${data.levelName}`;
	contentDiv.innerText = `Welcome ${data.user.name}!`;

	AddMessageItem(instance, data.eventId);
}

function YouTubeGiftMembershipReceived(data) {
	if (!showYouTubeMemberships)
		return;

	// Get a reference to the template
	const template = document.getElementById('cardTemplate');

	// Create a new instance of the template
	const instance = template.content.cloneNode(true);

	// Get divs
	const cardDiv = instance.querySelector("#card");
	const headerDiv = instance.querySelector("#header");
	const avatarDiv = instance.querySelector("#avatar");
	const iconDiv = instance.querySelector("#icon");
	const titleDiv = instance.querySelector("#title");
	const contentDiv = instance.querySelector("#content");

	// Set the card background colors
	cardDiv.classList.add('youtube');

	// Set message text
	titleDiv.innerText = `🎁 ${data.gifter.name} gifted a membership`;
	contentDiv.innerText = `to ${data.user.name} (${data.tier})!`;

	AddMessageItem(instance, data.eventId);
}

async function StreamlabsDonation(data) {
	if (!showStreamlabsDonations)
		return;

	// Get a reference to the template
	const template = document.getElementById('cardTemplate');

	// Create a new instance of the template
	const instance = template.content.cloneNode(true);

	// Get divs
	const cardDiv = instance.querySelector("#card");
	const headerDiv = instance.querySelector("#header");
	const avatarDiv = instance.querySelector("#avatar");
	const iconDiv = instance.querySelector("#icon");
	const titleDiv = instance.querySelector("#title");
	const contentDiv = instance.querySelector("#content");

	// Set the card background colors
	cardDiv.classList.add('streamlabs');

	// Set the text
	const donater = data.from;
	const formattedAmount = data.formattedAmount;
	const currency = data.currency;
	const message = data.message;

	titleDiv.innerText = `🪙 ${donater} donated ${currency}${formattedAmount}`;
	contentDiv.innerText = `${message}`;

	AddMessageItem(instance);
}

async function StreamElementsTip(data) {
	if (!showStreamElementsTips)
		return;

	// Get a reference to the template
	const template = document.getElementById('cardTemplate');

	// Create a new instance of the template
	const instance = template.content.cloneNode(true);

	// Get divs
	const cardDiv = instance.querySelector("#card");
	const headerDiv = instance.querySelector("#header");
	const avatarDiv = instance.querySelector("#avatar");
	const iconDiv = instance.querySelector("#icon");
	const titleDiv = instance.querySelector("#title");
	const contentDiv = instance.querySelector("#content");

	// Set the card background colors
	cardDiv.classList.add('streamelements');

	// Set the text
	const donater = data.username;
	const formattedAmount = `$${data.amount}`;
	const currency = data.currency;
	const message = data.message;

	titleDiv.innerText = `🪙 ${donater} donated ${currency}${formattedAmount}`;
	contentDiv.innerText = `${message}`;

	AddMessageItem(instance, data.id);
}

function KofiDonation(data) {
	if (!showKofiDonations)
		return;

	// Get a reference to the template
	const template = document.getElementById('cardTemplate');

	// Create a new instance of the template
	const instance = template.content.cloneNode(true);

	// Get divs
	const cardDiv = instance.querySelector("#card");
	const headerDiv = instance.querySelector("#header");
	const avatarDiv = instance.querySelector("#avatar");
	const iconDiv = instance.querySelector("#icon");
	const titleDiv = instance.querySelector("#title");
	const contentDiv = instance.querySelector("#content");

	// Set the card background colors
	cardDiv.classList.add('kofi');

	// Set the text
	const user = data.from;
	const amount = data.amount;
	const currency = data.currency;
	const message = data.message;
	const kofiIcon = `<img src="icons/platforms/kofi.png" class="platform"/>`;

	if (currency == "USD")
		titleDiv.innerHTML = `${kofiIcon} ${user} donated $${amount}`;
	else
		titleDiv.innerHTML = `${kofiIcon} ${user} donated ${currency} ${amount}`;

	if (message != null)
		contentDiv.innerHTML = `${message}`;

	AddMessageItem(instance, data.id);
}

function KofiSubscription(data) {
	if (!showKofiDonations)
		return;

	// Get a reference to the template
	const template = document.getElementById('cardTemplate');

	// Create a new instance of the template
	const instance = template.content.cloneNode(true);

	// Get divs
	const cardDiv = instance.querySelector("#card");
	const headerDiv = instance.querySelector("#header");
	const avatarDiv = instance.querySelector("#avatar");
	const iconDiv = instance.querySelector("#icon");
	const titleDiv = instance.querySelector("#title");
	const contentDiv = instance.querySelector("#content");

	// Set the card background colors
	cardDiv.classList.add('kofi');

	// Set the text
	const user = data.from;
	const amount = data.amount;
	const currency = data.currency;
	const message = data.message;
	const kofiIcon = `<img src="icons/platforms/kofi.png" class="platform"/>`;

	if (currency == "USD")
		titleDiv.innerHTML = `${kofiIcon} ${user} subscribed ($${amount})`;
	else
		titleDiv.innerHTML = `${kofiIcon} ${user} subscribed (${currency} ${amount})`;

	if (message != null)
		contentDiv.innerHTML = `${message}`;

	AddMessageItem(instance, data.id);
}

function KofiResubscription(data) {
	if (!showKofiDonations)
		return;

	// Get a reference to the template
	const template = document.getElementById('cardTemplate');

	// Create a new instance of the template
	const instance = template.content.cloneNode(true);

	// Get divs
	const cardDiv = instance.querySelector("#card");
	const headerDiv = instance.querySelector("#header");
	const avatarDiv = instance.querySelector("#avatar");
	const iconDiv = instance.querySelector("#icon");
	const titleDiv = instance.querySelector("#title");
	const contentDiv = instance.querySelector("#content");

	// Set the card background colors
	cardDiv.classList.add('kofi');

	// Set the text
	const user = data.from;
	const tier = data.tier;
	const message = data.message;
	const kofiIcon = `<img src="icons/platforms/kofi.png" class="platform"/>`;

	titleDiv.innerHTML = `${kofiIcon} ${user} subscribed (${tier})`;
	if (message != null)
		contentDiv.innerHTML = `${message}`;

	AddMessageItem(instance, data.id);
}

function KofiShopOrder(data) {
	if (!showKofiDonations)
		return;

	// Get a reference to the template
	const template = document.getElementById('cardTemplate');

	// Create a new instance of the template
	const instance = template.content.cloneNode(true);

	// Get divs
	const cardDiv = instance.querySelector("#card");
	const headerDiv = instance.querySelector("#header");
	const avatarDiv = instance.querySelector("#avatar");
	const iconDiv = instance.querySelector("#icon");
	const titleDiv = instance.querySelector("#title");
	const contentDiv = instance.querySelector("#content");

	// Set the card background colors
	cardDiv.classList.add('kofi');

	// Set the text
	const user = data.from;
	const amount = data.amount;
	const currency = data.currency;
	const message = data.message;
	const itemTotal = data.items.length;
	const kofiIcon = `<img src="icons/platforms/kofi.png" class="platform"/>`;
	let formattedAmount = "";

	if (amount == 0)
		formattedAmount = ""
	else if (currency == "USD")
		formattedAmount = `($${amount})`;
	else
		formattedAmount = `(${currency} ${amount})`;

	titleDiv.innerHTML = `${kofiIcon} ${user} ordered ${itemTotal} item(s) on Ko-fi ${formattedAmount}`;
	if (message != null)
		contentDiv.innerHTML = `${message}`;

	AddMessageItem(instance, data.id);
}

function TipeeeStreamDonation(data) {
	if (!showTipeeeStreamDonations)
		return;

	// Get a reference to the template
	const template = document.getElementById('cardTemplate');

	// Create a new instance of the template
	const instance = template.content.cloneNode(true);

	// Get divs
	const cardDiv = instance.querySelector("#card");
	const headerDiv = instance.querySelector("#header");
	const avatarDiv = instance.querySelector("#avatar");
	const iconDiv = instance.querySelector("#icon");
	const titleDiv = instance.querySelector("#title");
	const contentDiv = instance.querySelector("#content");

	// Set the card background colors
	cardDiv.classList.add('tipeeeStream');

	// Set the text
	const user = data.username;
	const amount = data.amount;
	const currency = data.currency;
	const message = data.message;
	const tipeeeStreamIcon = `<img src="icons/platforms/tipeeeStream.png" class="platform"/>`;

	if (currency == "USD")
		titleDiv.innerHTML = `${tipeeeStreamIcon} ${user} donated $${amount}`;
	else
		titleDiv.innerHTML = `${tipeeeStreamIcon} ${user} donated ${currency} ${amount}`;

	if (message != null)
		contentDiv.innerHTML = `${message}`;

	AddMessageItem(instance, data.id);
}

function FourthwallOrderPlaced(data) {
	if (!showFourthwallAlerts)
		return;

	// Get a reference to the template
	const template = document.getElementById('cardTemplate');

	// Create a new instance of the template
	const instance = template.content.cloneNode(true);

	// Get divs
	const cardDiv = instance.querySelector("#card");
	const headerDiv = instance.querySelector("#header");
	const avatarDiv = instance.querySelector("#avatar");
	const iconDiv = instance.querySelector("#icon");
	const titleDiv = instance.querySelector("#title");
	const contentDiv = instance.querySelector("#content");

	// Set the card background colors
	cardDiv.classList.add('blank');
	titleDiv.classList.add('centerThatShitHomie');
	contentDiv.classList.add('centerThatShitHomie');

	// Set the text
	let user = data.username;
	const orderTotal = data.total;
	const currency = data.currency;
	const item = data.variants[0].name;
	const itemsOrdered = data.variants.length;
	const message = DecodeHTMLString(data.statmessageus);
	const itemImageUrl = data.variants[0].image;
	const fourthwallProductImage = `<img src="${itemImageUrl}" class="productImage"/>`;

	let contents = "";

	contents += fourthwallProductImage;

	contents += "<br><br>";

	// If there user did not provide a username, just say "Someone"
	if (user == undefined)
		user = "Someone"

	// If the user ordered more than one item, write how many items they ordered
	contents += `${user} ordered ${item}`;
	if (itemsOrdered > 1)
		contents += ` and ${itemsOrdered - 1} other item(s)!`

	// If the user spent money, put the order total
	if (orderTotal == 0)
		contents += ``;
	else if (currency == "USD")
		contents += ` ($${orderTotal})`;
	else
		contents += ` (${orderTotal} ${currency})`;

	titleDiv.innerHTML = contents;

	// Add the custom message from the user
	if (message.trim() != "")
		contentDiv.innerHTML = `${message}`;
	else
		contentDiv.style.display = 'none'

	AddMessageItem(instance, data.id);
}

function FourthwallDonation(data) {
	if (!showFourthwallAlerts)
		return;

	// Get a reference to the template
	const template = document.getElementById('cardTemplate');

	// Create a new instance of the template
	const instance = template.content.cloneNode(true);

	// Get divs
	const cardDiv = instance.querySelector("#card");
	const headerDiv = instance.querySelector("#header");
	const avatarDiv = instance.querySelector("#avatar");
	const iconDiv = instance.querySelector("#icon");
	const titleDiv = instance.querySelector("#title");
	const contentDiv = instance.querySelector("#content");

	// Set the card background colors
	cardDiv.classList.add('fourthwall');

	// Set the text
	let user = data.username;
	const amount = data.amount;
	const currency = data.currency;
	const message = data.message;

	let contents = "";

	// If the user ordered more than one item, write how many items they ordered
	contents += `${user} donated`;

	// If the user spent money, put the order total
	if (currency == "USD")
		contents += ` $${amount}`;
	else
		contents += ` ${currency} ${amount}`;

	titleDiv.innerHTML = contents;

	// Add the custom message from the user
	if (message.trim() != "")
		contentDiv.innerHTML = `${message}`;
	else
		contentDiv.style.display = 'none'

	AddMessageItem(instance, data.id);
}

function FourthwallSubscriptionPurchased(data) {
	if (!showFourthwallAlerts)
		return;

	// Get a reference to the template
	const template = document.getElementById('cardTemplate');

	// Create a new instance of the template
	const instance = template.content.cloneNode(true);

	// Get divs
	const cardDiv = instance.querySelector("#card");
	const headerDiv = instance.querySelector("#header");
	const avatarDiv = instance.querySelector("#avatar");
	const iconDiv = instance.querySelector("#icon");
	const titleDiv = instance.querySelector("#title");
	const contentDiv = instance.querySelector("#content");

	// Set the card background colors
	cardDiv.classList.add('fourthwall');

	// Set the text
	let user = data.nickname;
	const amount = data.amount;
	const currency = data.currency;

	let contents = "";

	// If the user ordered more than one item, write how many items they ordered
	contents += `${user} subscribed`;

	// If the user spent money, put the order total
	if (currency == "USD")
		contents += ` ($${amount})`;
	else
		contents += ` (${currency} ${amount})`;

	titleDiv.innerHTML = contents;
	contentDiv.style.display = 'none'

	AddMessageItem(instance, data.id);
}

function FourthwallGiftPurchase(data) {
	console.log(data);
	if (!showFourthwallAlerts)
		return;

	// Get a reference to the template
	const template = document.getElementById('cardTemplate');

	// Create a new instance of the template
	const instance = template.content.cloneNode(true);

	// Get divs
	const cardDiv = instance.querySelector("#card");
	const headerDiv = instance.querySelector("#header");
	const avatarDiv = instance.querySelector("#avatar");
	const iconDiv = instance.querySelector("#icon");
	const titleDiv = instance.querySelector("#title");
	const contentDiv = instance.querySelector("#content");

	// Set the card background colors
	cardDiv.classList.add('blank');
	titleDiv.classList.add('centerThatShitHomie');
	contentDiv.classList.add('centerThatShitHomie');

	// Set the text
	let user = data.username;
	const total = data.total;
	const currency = data.currency;
	const gifts = data.gifts.length;
	const itemName = data.offer.name;
	const itemImageUrl = data.offer.imageUrl;
	const fourthwallProductImage = `<img src="${itemImageUrl}" class="productImage"/>`;
	const message = DecodeHTMLString(data.statmessageus);

	let contents = "";

	contents += fourthwallProductImage;

	contents += "<br><br>";

	// If the user ordered more than one item, write how many items they ordered
	contents += `${user} gifted`;

	// If there is more than one gifted item, display the number of gifts
	if (gifts > 1)
		contents += ` ${gifts} x `;

	// The name of the item to be given away
	contents += ` ${itemName}`;

	// If the user spent money, put the order total
	if (currency == "USD")
		contents += ` ($${total})`;
	else
		contents += ` (${currency}${total})`;

	titleDiv.innerHTML = contents;

	// Add the custom message from the user
	if (message.trim() != "")
		contentDiv.innerHTML = `${message}`;
	else
		contentDiv.style.display = 'none'

	AddMessageItem(instance, data.id);
}

function FourthwallGiftDrawStarted(data) {
	if (!showFourthwallAlerts)
		return;

	// Get a reference to the template
	const template = document.getElementById('cardTemplate');

	// Create a new instance of the template
	const instance = template.content.cloneNode(true);

	// Get divs
	const cardDiv = instance.querySelector("#card");
	const headerDiv = instance.querySelector("#header");
	const avatarDiv = instance.querySelector("#avatar");
	const iconDiv = instance.querySelector("#icon");
	const titleDiv = instance.querySelector("#title");
	const contentDiv = instance.querySelector("#content");

	// Set the card background colors
	cardDiv.classList.add('fourthwall');
	titleDiv.classList.add('centerThatShitHomie');
	contentDiv.classList.add('centerThatShitHomie');

	// Set the text
	const durationSeconds = data.durationSeconds;
	const itemName = data.offer.name;

	let contents = "";

	// If the user ordered more than one item, write how many items they ordered
	contents += `<h3>🎁 ${itemName} Giveaway!</h3>`;

	titleDiv.innerHTML = contents;
	contentDiv.innerHTML = `Type !join in the next ${durationSeconds} seconds for your chance to win!`;
	//contentDiv.style.display = `none`;

	AddMessageItem(instance, data.id);
}

function FourthwallGiftDrawEnded(data) {
	if (!showFourthwallAlerts)
		return;

	// Get a reference to the template
	const template = document.getElementById('cardTemplate');

	// Create a new instance of the template
	const instance = template.content.cloneNode(true);

	// Get divs
	const cardDiv = instance.querySelector("#card");
	const headerDiv = instance.querySelector("#header");
	const avatarDiv = instance.querySelector("#avatar");
	const iconDiv = instance.querySelector("#icon");
	const titleDiv = instance.querySelector("#title");
	const contentDiv = instance.querySelector("#content");

	// Set the card background colors
	cardDiv.classList.add('fourthwall');
	titleDiv.classList.add('centerThatShitHomie');
	contentDiv.classList.add('centerThatShitHomie');

	let contents = "";

	// If the user ordered more than one item, write how many items they ordered
	contents += `<h3>🥳 GIVEAWAY ENDED 🥳</h3>`;
	//contents += `Congratulations ${GetWinnersList(data.gifts)}!`

	titleDiv.innerHTML = contents;
	contentDiv.innerHTML = `Congratulations ${GetWinnersList(data.gifts)}!`;
	//contentDiv.style.display = `none`;

	AddMessageItem(instance, data.id);
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

	console.log(paramValue);

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

// function IsImageUrl(url) {
// 	return url.match(/^http.*\.(jpeg|jpg|gif|png)$/) != null;
// }

function IsImageUrl(url) {
	try {
		const { pathname } = new URL(url);
		// Only check the pathname since query parameters are not included in it.
		return /\.(png|jpe?g|webp|gif)$/i.test(pathname);
	} catch (error) {
		// Return false if the URL is invalid.
		return false;
	}
}

function AddMessageItem(element, elementID, platform, userId) {
	// Calculate the height of the div before inserting
	const tempDiv = document.getElementById('IPutThisHereSoICanCalculateHowBigEachMessageIsSupposedToBeBeforeIAddItToTheMessageList');
	const tempDivTwoElectricBoogaloo = document.createElement('div');
	tempDivTwoElectricBoogaloo.appendChild(element);
	tempDiv.appendChild(tempDivTwoElectricBoogaloo);

	setTimeout(function () {
		const calculatedHeight = tempDivTwoElectricBoogaloo.offsetHeight + "px";

		// Create a new line item to add to the message list later
		var lineItem = document.createElement('li');
		lineItem.id = elementID;
		lineItem.dataset.platform = platform;
		lineItem.dataset.userId = userId;

		// Set scroll direction
		if (scrollDirection == 2)
			lineItem.classList.add('reverseLineItemDirection');

		// Move the element from the temp div to the new line item
		lineItem.appendChild(tempDiv.firstElementChild);

		// Add the line item to the list and animate it
		// We need to manually set the height as straight CSS can't animate on "height: auto"
		messageList.appendChild(lineItem);
		setTimeout(function () {
			lineItem.className = lineItem.className + " show";
			lineItem.style.maxHeight = calculatedHeight;
			// After it's done animating, remove the height constraint in case the div needs to get bigger
			setTimeout(function () {
				lineItem.style.maxHeight = "none";
			}, 1000);
		}, 10);

		// Remove old messages that have gone off screen to save memory
		while (messageList.clientHeight > 5 * window.innerHeight) {
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

function DecodeHTMLString(html) {
	var txt = document.createElement("textarea");
	txt.innerHTML = html;
	return txt.value;
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

function IsThisUserAllowedToPostImagesOrNotReturnTrueIfTheyCanReturnFalseIfTheyCannot(targetPermissions, data, platform) {
	return GetPermissionLevel(data, platform) >= targetPermissions;
}

function GetPermissionLevel(data, platform) {
	switch (platform) {
		case 'twitch':
			if (data.message.role >= 4)
				return 40;
			else if (data.message.role >= 3)
				return 30;
			else if (data.message.role >= 2)
				return 20;
			else if (data.message.role >= 2 || data.message.subscriber)
				return 15;
			else
				return 10;
		case 'youtube':
			if (data.user.isOwner)
				return 40;
			else if (data.user.isModerator)
				return 30;
			else if (data.user.isSponsor)
				return 15;
			else
				return 10;
	}
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