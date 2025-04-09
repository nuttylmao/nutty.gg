////////////////
// PARAMETERS //
////////////////

const queryString = window.location.search;
const urlParams = new URLSearchParams(queryString);

const sbServerAddress = urlParams.get("address") || "127.0.0.1";
const sbServerPort = urlParams.get("port") || "8080";
const avatarMap = new Map();

const alertBox = document.getElementById('alertBox');
const avatarElement = document.getElementById('avatar');
const usernameLabel = document.getElementById('username');
const descriptionLabel = document.getElementById('description');
const attributeLabel = document.getElementById('attribute');
const theContentThatShowsFirstInsteadOfSecond = document.getElementById('theContentThatShowsFirstInsteadOfSecond');
const messageLabel = document.getElementById('message');

let widgetLocked = false;						// Needed to lock animation from overlapping
let alertQueue = [];

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

const animationSpeed = GetIntParam("showTwitchSharedChat", 8000);

const furryMode = GetBooleanParam("furryMode", false);

// Set fonts for the widget
document.body.style.fontFamily = font;
document.body.style.fontSize = `${fontSize}px`;

// // Set line spacing
// document.documentElement.style.setProperty('--line-spacing', `${lineSpacing}em`);

// // Set the background color
// const opacity255 = Math.round(parseFloat(opacity) * 255);
// let hexOpacity = opacity255.toString(16);
// if (hexOpacity.length < 2) {
// 	hexOpacity = "0" + hexOpacity;
// }
// document.body.style.background = `${background}${hexOpacity}`;

// // Get a list of chatters to ignore
// const ignoreUserList = ignoreChatters.split(',').map(item => item.trim().toLowerCase()) || [];

// // Set the scroll direction
// switch (scrollDirection) {
// 	case 1:
// 		document.getElementById('messageList').classList.add('normalScrollDirection');
// 		break;
// 	case 2:
// 		document.getElementById('messageList').classList.add('reverseScrollDirection');
// 		break;
// }




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

client.on('Twitch.Cheer', (response) => {
	console.debug(response.data);
	TwitchChatMessage(response.data);
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

async function TwitchSub(data) {
	if (!showTwitchSubs)
		return;

	// Set the text
	const username = data.user.name;
	const subTier = data.sub_tier;
	const isPrime = data.is_prime;

	// Render avatars
	const avatarURL = await GetAvatar(username);

	if (!isPrime)
		UpdateAlertBox('twitch', avatarURL, `${username}`, `subscribed with Tier ${subTier.charAt(0)}`);
	else
		UpdateAlertBox('twitch', avatarURL, `${username}`, `used their Prime Sub`);
}

async function TwitchResub(data) {
	if (!showTwitchSubs)
		return;

	// Set the text
	const username = data.user.name;
	const subTier = data.subTier;
	const isPrime = data.isPrime;
	const cumulativeMonths = data.cumulativeMonths;
	const message = data.text;

	// Render avatars
	const avatarURL = await GetAvatar(username);

	if (!isPrime)
		UpdateAlertBox(
			'twitch',
			avatarURL,
			`${username}`,
			`resubscribed with Tier ${subTier.charAt(0)}`,
			`${cumulativeMonths} months`,
			message
		);
	else
		UpdateAlertBox(
			'twitch',
			avatarURL,
			`${username}`,
			`used their Prime Sub`,
			`${cumulativeMonths} months`,
			message
		);
}

async function TwitchGiftSub(data) {
	if (!showTwitchSubs)
		return;

	// Set the text
	const username = data.user.name;
	const subTier = data.subTier;
	const recipient = data.recipient.name;
	const cumlativeTotal = data.cumlativeTotal;

	// Render avatars
	const avatarURL = await GetAvatar(username);
	
	let messageText = '';
	if (cumlativeTotal > 0)
		messageText = `They've gifted ${cumlativeTotal} subs in total!`;

	UpdateAlertBox(
		'twitch',
		avatarURL,
		`${username}`,
		`gifted a Tier ${subTier.charAt(0)} subscription`,
		`to ${recipient}`,
		messageText
	);
}

async function TwitchRewardRedemption(data) {
	if (!showTwitchChannelPointRedemptions)
		return;

	const username = data.user_name;
	const rewardName = data.reward.title;
	const cost = data.reward.cost;
	const userInput = data.user_input;
	const channelPointIcon = `<img src="icons/badges/twitch-channel-point.png" class="platform" style="height: 1em"/>`;

	// Render avatars
	const avatarURL = await GetAvatar(data.user_login);

	UpdateAlertBox(
		'twitch',
		avatarURL,
		`${username} redeemed`,
		`${rewardName} ${channelPointIcon} ${cost}`,
		'',
		userInput
	);
}

async function TwitchRaid(data) {
	if (!showTwitchRaids)
		return;

	// Render avatars
	const avatarURL = await GetAvatar(data.from_broadcaster_user_login);

	// Set the text
	const username = data.from_broadcaster_user_login;
	const viewers = data.viewers;

	UpdateAlertBox(
		'twitch',
		avatarURL,
		`${username}`,
		`is raiding with a party of ${viewers}`,
		'',
		''
	);
}

function YouTubeSuperChat(data) {
	if (!showYouTubeSuperChats)
		return;
	
	// Render avatars
	const avatarURL = data.user.profileImageUrl;

	UpdateAlertBox(
		'youtube',
		avatarURL,
		`🪙 ${data.user.name}`,
		`sent a Super Chat (${data.amount})`,
		'',
		data.message
	);
}

function YouTubeSuperSticker(data) {
	if (!showYouTubeSuperStickers)
		return;
	
	// Render avatars
	const avatarURL = FindFirstImageUrl(data);

	UpdateAlertBox(
		'youtube',
		avatarURL,
		`${data.user.name}`,
		`sent a Super Sticker (${data.amount})`,
		'',
		''
	);
}

function YouTubeNewSponsor(data) {
	if (!showYouTubeMemberships)
		return;
	
	// Render avatars
	const avatarURL = data.user.profileImageUrl;

	UpdateAlertBox(
		'youtube',
		avatarURL,
		`⭐ New ${data.levelName}`,
		`Welcome ${data.user.name}!`,
		'',
		''
	);
}

function YouTubeGiftMembershipReceived(data) {
	if (!showYouTubeMemberships)
		return;
	
	// Render avatars
	const avatarURL = data.user.profileImageUrl;

	UpdateAlertBox(
		'youtube',
		avatarURL,
		`${data.gifter.name}`,
		`gifted a membership`,
		`to ${data.user.name} (${data.tier})!`,
		''
	);
}

async function StreamlabsDonation(data) {
	if (!showStreamlabsDonations)
		return;

	// Set the text
	const donater = data.from;
	const formattedAmount = data.formattedAmount;
	const currency = data.currency;
	const message = data.message;

	UpdateAlertBox(
		'streamlabs',
		'',
		`${donater}`,
		`donated ${currency}${formattedAmount}`,
		``,
		message
	);
}

async function StreamElementsTip(data) {
	if (!showStreamElementsTips)
		return;

	// Set the text
	const donater = data.username;
	const formattedAmount = `$${data.amount}`;
	const currency = data.currency;
	const message = data.message;

	UpdateAlertBox(
		'streamelements',
		''
		`${donater}`,
		`donated ${currency}${formattedAmount}`,
		``,
		message
	);
}

function PatreonPledgeCreated(data) {
	if (!showPatreonMemberships)
		return;

	const user = data.attributes.full_name;
	const amount = (data.attributes.will_pay_amount_cents/100).toFixed(2);
	const patreonIcon = `<img src="icons/platforms/patreon.png" class="platform"/>`;
	
	// Render avatars
	const avatarURL = 'icons/platforms/patreon.png';
	
	UpdateAlertBox(
		'patreon',
		avatarURL,
		`${user}`,
		`joined Patreon ($${amount})`,
		``,
		``
	);
}

function KofiDonation(data) {
	if (!showKofiDonations)
		return;

	// Set the text
	const user = data.from;
	const amount = data.amount;
	const currency = data.currency;
	const message = data.message;
	
	// Render avatars
	const avatarURL = 'icons/platforms/kofi.png';

	if (currency == "USD")
		UpdateAlertBox(
			'kofi',
			avatarURL,
			`${user}`,
			`donated $${amount}`,
			``,
			message
		);
	else
		UpdateAlertBox(
			'kofi',
			`${user}`,
			`donated ${currency} ${amount}`,
			``,
			message
		);
}

function KofiSubscription(data) {
	if (!showKofiDonations)
		return;

	// Set the text
	const user = data.from;
	const amount = data.amount;
	const currency = data.currency;
	const message = data.message;
	
	// Render avatars
	const avatarURL = 'icons/platforms/kofi.png';

	if (currency == "USD")
		UpdateAlertBox(
			'kofi',
			avatarURL,
			`${user}`,
			`subscribed ($${amount})`,
			``,
			message
		);
	else
		UpdateAlertBox(
			'kofi',
			`${user}`,
			`subscribed (${currency} ${amount})`,
			``,
			message
		);
}

function KofiResubscription(data) {
	if (!showKofiDonations)
		return;

	// Set the text
	const user = data.from;
	const tier = data.tier;
	const message = data.message;
	
	// Render avatars
	const avatarURL = 'icons/platforms/kofi.png';

	UpdateAlertBox(
		'kofi',
		avatarURL,
		`${user}`,
		`subscribed (${tier})`,
		``,
		message
	);
}

function KofiShopOrder(data) {
	if (!showKofiDonations)
		return;

	// Set the text
	const user = data.from;
	const amount = data.amount;
	const currency = data.currency;
	const message = data.message;
	const itemTotal = data.items.length;
	let formattedAmount = "";

	if (amount == 0)
		formattedAmount = ""
	else if (currency == "USD")
		formattedAmount = `$${amount}`;
	else
		formattedAmount = `${currency} ${amount}`;
	
	// Render avatars
	const avatarURL = 'icons/platforms/kofi.png';

	UpdateAlertBox(
		'kofi',
		avatarURL,
		`${user}`,
		`ordered ${itemTotal} item(s) on Ko-fi `,
		`${formattedAmount}`,
		message
	);
}

function TipeeeStreamDonation(data) {
	if (!showTipeeeStreamDonations)
		return;

	// Set the text
	const user = data.username;
	const amount = data.amount;
	const currency = data.currency;
	const message = data.message;
	
	// Render avatars
	const avatarURL = 'icons/platforms/tipeeeStream.png';

	if (currency == "USD")
		UpdateAlertBox(
			'tipeeeStream',
			avatarURL,
			`${user}`,
			`donated $${amount}`,
			``,
			message
		);
	else
		UpdateAlertBox(
			'tipeeeStream',
			avatarURL,
			`${user}`,
			`donated ${currency} ${amount}`,
			``,
			message
		);
}

function FourthwallOrderPlaced(data) {
	if (!showFourthwallAlerts)
		return;

	// Set the text
	let user = data.username;
	const orderTotal = data.total;
	const currency = data.currency;
	const item = data.variants[0].name;
	const itemsOrdered = data.variants.length;
	const message = DecodeHTMLString(data.statmessageus);
	const itemImageUrl = data.variants[0].image;

	// If there user did not provide a username, just say "Someone"
	if (user == undefined)
		user = "Someone";

	let attributeText = ""

	// If the user ordered more than one item, write how many items they ordered
	if (itemsOrdered > 1)
		attributeText += `and ${itemsOrdered - 1} other item(s)!`;

	// If the user spent money, put the order total
	if (orderTotal == 0)
		attributeText += ``;
	else if (currency == "USD")
		attributeText += ` ($${orderTotal})`;
	else
		attributeText += ` (${orderTotal} ${currency})`;

	UpdateAlertBox(
		'fourthwall',
		itemImageUrl,
		`${user}`,
		`ordered ${item}`,
		attributeText,
		message
	);
}

function FourthwallDonation(data) {
	if (!showFourthwallAlerts)
		return;

	// Set the text
	let user = data.username;
	const amount = data.amount;
	const currency = data.currency;
	const message = data.message;

	let formattedAmount = '';
	
	// If the user spent money, put the order total
	if (currency == "USD")
		formattedAmount += ` $${amount}`;
	else
		formattedAmount += ` ${currency} ${amount}`;

	UpdateAlertBox(
		'fourthwall',
		'',
		`${user}`,
		`donated ${formattedAmount}`,
		'',
		message
	);
}

function FourthwallSubscriptionPurchased(data) {
	if (!showFourthwallAlerts)
		return;

	// Set the text
	let user = data.nickname;
	const amount = data.amount;
	const currency = data.currency;
	
	let formattedAmount = '';
	
	// If the user spent money, put the order total
	if (currency == "USD")
		formattedAmount += ` ($${amount})`;
	else
		formattedAmount += ` (${currency} ${amount})`;

	UpdateAlertBox(
		'fourthwall',
		'',
		`${user}`,
		`subscribed ${formattedAmount}`,
		'',
		''
	);
}

function FourthwallGiftPurchase(data) {
	console.log(data);
	if (!showFourthwallAlerts)
		return;

	// Set the text
	let user = data.username;
	const total = data.total;
	const currency = data.currency;
	const gifts = data.gifts.length;
	const itemName = data.offer.name;
	const itemImageUrl = data.offer.imageUrl;
	const message = DecodeHTMLString(data.statmessageus);

	let contents = '';
	let attributesText = '';

	// If there is more than one gifted item, display the number of gifts
	if (gifts > 1)
		contents += ` ${gifts} x `;

	// The name of the item to be given away
	contents += ` ${itemName}`;

	// If the user spent money, put the order total
	if (currency == "USD")
		attributesText = `$${total}`;
	else
		attributesText = `${currency}${total}`;

	UpdateAlertBox(
		'fourthwall',
		itemImageUrl,
		`${user}`,
		`gifted ${contents}`,
		attributesText,
		message
	);
}

function FourthwallGiftDrawStarted(data) {
	if (!showFourthwallAlerts)
		return;

	// Set the text
	const durationSeconds = data.durationSeconds;
	const itemName = data.offer.name;

	UpdateAlertBox(
		'fourthwall',
		'',
		`<span style="font-size: 1.2em">🎁 ${itemName} Giveaway!</span>`,
		`Type !join in the next ${durationSeconds} seconds for your chance to win!`,
		'',
		''
	);
}

function FourthwallGiftDrawEnded(data) {
	if (!showFourthwallAlerts)
		return;
	
	// Render avatars
	if (showAvatar) {
		avatar.src = '';
	}

	UpdateAlertBox(
		'fourthwall',
		`<span style="font-size: 1.2em">🥳 GIVEAWAY ENDED 🥳</span>`,
		`Congratulations ${GetWinnersList(data.gifts)}!`,
		'',
		''
	);
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

// function GetCurrentTimeFormatted() {
// 	const now = new Date();
// 	let hours = now.getHours();
// 	const minutes = String(now.getMinutes()).padStart(2, '0');
// 	const ampm = hours >= 12 ? 'PM' : 'AM';

// 	hours = hours % 12;
// 	hours = hours ? hours : 12; // the hour '0' should be '12'

// 	const formattedTime = `${hours}:${minutes} ${ampm}`;
// 	return formattedTime;
// }

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

// async function GetPronouns(platform, username) {
// 	const response = await client.getUserPronouns(platform, username);
// 	const userFound = response.pronoun.userFound;
// 	const pronouns = `${response.pronoun.pronounSubject}/${response.pronoun.pronounObject}`;

// 	if (userFound)
// 		return `${response.pronoun.pronounSubject}/${response.pronoun.pronounObject}`;
// 	else
// 		return '';
// }

// function IsImageUrl(url) {
// 	return url.match(/^http.*\.(jpeg|jpg|gif|png)$/) != null;
// }

// function IsImageUrl(url) {
// 	try {
// 		const { pathname } = new URL(url);
// 		// Only check the pathname since query parameters are not included in it.
// 		return /\.(png|jpe?g|webp|gif)$/i.test(pathname);
// 	} catch (error) {
// 		// Return false if the URL is invalid.
// 		return false;
// 	}
// }

// function AddMessageItem(element, elementID, platform, userId) {
// 	// Calculate the height of the div before inserting
// 	const tempDiv = document.getElementById('IPutThisHereSoICanCalculateHowBigEachMessageIsSupposedToBeBeforeIAddItToTheMessageList');
// 	const tempDivTwoElectricBoogaloo = document.createElement('div');
// 	tempDivTwoElectricBoogaloo.appendChild(element);
// 	tempDiv.appendChild(tempDivTwoElectricBoogaloo);

// 	setTimeout(function () {
// 		const calculatedHeight = tempDivTwoElectricBoogaloo.offsetHeight + "px";

// 		// Create a new line item to add to the message list later
// 		var lineItem = document.createElement('li');
// 		lineItem.id = elementID;
// 		lineItem.dataset.platform = platform;
// 		lineItem.dataset.userId = userId;

// 		// Set scroll direction
// 		if (scrollDirection == 2)
// 			lineItem.classList.add('reverseLineItemDirection');

// 		// Move the element from the temp div to the new line item
// 		lineItem.appendChild(tempDiv.firstElementChild);

// 		// Add the line item to the list and animate it
// 		// We need to manually set the height as straight CSS can't animate on "height: auto"
// 		messageList.appendChild(lineItem);
// 		setTimeout(function () {
// 			lineItem.className = lineItem.className + " show";
// 			lineItem.style.maxHeight = calculatedHeight;
// 			// After it's done animating, remove the height constraint in case the div needs to get bigger
// 			setTimeout(function () {
// 				lineItem.style.maxHeight = "none";
// 			}, 1000);
// 		}, 10);

// 		// Remove old messages that have gone off screen to save memory
// 		while (messageList.clientHeight > 5 * window.innerHeight) {
// 			messageList.removeChild(messageList.firstChild);
// 		}

// 		if (hideAfter > 0) {
// 			setTimeout(function () {
// 				lineItem.style.opacity = 0;
// 				setTimeout(function () {
// 					messageList.removeChild(lineItem);
// 				}, 1000);
// 			}, hideAfter * 1000);
// 		}

// 	}, 200);
// }

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

// function IsThisUserAllowedToPostImagesOrNotReturnTrueIfTheyCanReturnFalseIfTheyCannot(targetPermissions, data, platform) {
// 	return GetPermissionLevel(data, platform) >= targetPermissions;
// }

// function GetPermissionLevel(data, platform) {
// 	switch (platform) {
// 		case 'twitch':
// 			if (data.message.role >= 4)
// 				return 40;
// 			else if (data.message.role >= 3)
// 				return 30;
// 			else if (data.message.role >= 2)
// 				return 20;
// 			else if (data.message.role >= 2 || data.message.subscriber)
// 				return 15;
// 			else
// 				return 10;
// 		case 'youtube':
// 			if (data.user.isOwner)
// 				return 40;
// 			else if (data.user.isModerator)
// 				return 30;
// 			else if (data.user.isSponsor)
// 				return 15;
// 			else
// 				return 10;
// 	}
// }

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

// function TranslateToFurry(sentence) {
// 	const words = sentence.toLowerCase().split(/\b/);

// 	const furryWords = words.map(word => {
// 		if (/\w+/.test(word)) {
// 			let newWord = word;

// 			// Common substitutions
// 			newWord = newWord.replace(/l/g, 'w');
// 			newWord = newWord.replace(/r/g, 'w');
// 			newWord = newWord.replace(/th/g, 'f');
// 			newWord = newWord.replace(/you/g, 'yous');
// 			newWord = newWord.replace(/my/g, 'mah');
// 			newWord = newWord.replace(/me/g, 'meh');
// 			newWord = newWord.replace(/am/g, 'am');
// 			newWord = newWord.replace(/is/g, 'is');
// 			newWord = newWord.replace(/are/g, 'are');
// 			newWord = newWord.replace(/very/g, 'vewy');
// 			newWord = newWord.replace(/pretty/g, 'pwetty');
// 			newWord = newWord.replace(/little/g, 'wittle');
// 			newWord = newWord.replace(/nice/g, 'nyce');

// 			// Random additions
// 			if (Math.random() < 0.15) {
// 				newWord += ' nya~';
// 			} else if (Math.random() < 0.1) {
// 				newWord += ' >w<';
// 			} else if (Math.random() < 0.05) {
// 				newWord += ' owo';
// 			}

// 			return newWord;
// 		}
// 		return word;
// 	});

// 	return furryWords.join('');
// }

function UpdateAlertBox(platform, avatarURL, usernameText, descriptionText, attributeText, message) {
	// Check if the widget is in the middle of an animation
	// If any alerts are requested while the animation is playing, it should be added to the alert queue
	if (widgetLocked) {
		console.debug("Animation is progress, added alert to queue");
		let data = { platform: platform, avatarURL: avatarURL, usernameText: usernameText, descriptionText: descriptionText, attributeText: attributeText, message: message };
		alertQueue.push(data);
		return;
	}

	// Start the animation
	widgetLocked = true;

	// Set the card background colors
	alertBox.classList = '';
	alertBox.classList.add(platform);

	// Render avatars
	if (showAvatar) {
		avatarElement.src = avatarURL;
	}

	// Set labels
	usernameLabel.innerHTML = usernameText != null ? usernameText : '';
	descriptionLabel.innerHTML = descriptionText != null ? descriptionText : '';
	attributeLabel.innerHTML = attributeText != null ? attributeText : '';
	messageLabel.innerHTML = message != null ? `${message}` : '';
	messageLabel.style.opacity = 0;

	alertBox.style.height = theContentThatShowsFirstInsteadOfSecond.offsetHeight + 40 + "px";
	alertBox.style.animation = 'slideInFromTop 0.5s ease-out forwards';

	// (1) Set timeout (5 seconds)
	// (2) Set the message label
	// (3) Calculate the height of message label
	// (4) Set the height of alertBox
	//		(a) Add in the CSS animation when this is working

	setTimeout(() => {

		alertBox.style.transition = 'all 0.5s ease-in-out';
		alertBox.style.height = messageLabel.offsetHeight + 40 + "px";
		theContentThatShowsFirstInsteadOfSecond.style.opacity = 0;
		messageLabel.style.opacity = 1;

		setTimeout(() => {
			alertBox.style.animation = 'slideBackUp 0.5s ease-out forwards';

			setTimeout(() => {
				alertBox.style.transition = '';
				theContentThatShowsFirstInsteadOfSecond.style.opacity = 1;
				messageLabel.style.opacity = 0;
				alertBox.style.height = '0px';
				widgetLocked = false;
				if (alertQueue.length > 0) {
					console.debug("Pulling next alert from the queue");
					let data = alertQueue.shift();
					UpdateAlertBox(data.platform, data.avatarURL, data.usernameText, data.descriptionText, data.attributeText, data.message)
				}
			}, 1000);
		}, messageLabel.innerText.trim() != '' ? animationSpeed : 0);

	}, animationSpeed);

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