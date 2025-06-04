////////////////
// PARAMETERS //
////////////////

const queryString = window.location.search;
const urlParams = new URLSearchParams(queryString);

let sbDebugMode = true;
const sbServerAddress = urlParams.get("address") || "127.0.0.1";
const sbServerPort = urlParams.get("port") || "8080";

///////////////////
// PAGE ELEMENTS //
///////////////////

const timerBar = document.getElementById('timer-bar');
const adLabel = document.getElementById('ad-label');
const timerLabel = document.getElementById('timer-label');
const adsRemainingLabel = document.getElementById('ads-remaining-label');
const timeRemainingLabel = document.getElementById('time-remaining-label');
const upcomingAdWarningContainer = document.getElementById('upcoming-ad-warning-container');
const countdownLabel = document.getElementById('countdown-label');

/////////////
// OPTIONS //
/////////////

// Appearance
const barColor = urlParams.get("barColor") || "#FFCC00";
const barThickness = GetIntParam("barThickness", 4);
const barPosition = urlParams.get("barPosition") || "bottom";
const timerColor = urlParams.get("timerColor") || "#FFCC00";
const timerPosition = urlParams.get("timerPosition") || "top-left";

// General
const showUpcomingAdWarning = GetBooleanParam("showUpcomingAdWarning", true);
const warningSeconds = GetIntParam("warningSeconds", 10);

/////////////////
// GLOBAL VARS //
/////////////////

let singleAdLength = 30;
let timerBarLocked = false;
let timerLabelLocked = false;
let upcomingAdWarningLocked = false;
let upcomingAdWarningStartDelay;

/////////////////
// PAGEE SETUP //
/////////////////

// Set the colors
timerBar.style.background = barColor;
adLabel.style.background = timerColor;

// Set the position of the bar
switch (barPosition) {
	case "none":
		timerBar.style.display = "none";
		break;
	case "bottom":
		timerBar.style.height = barThickness + "px";
		timerBar.style.bottom = "0px";
		timerBar.style.left = "0px";
		break;

	case "top":
		timerBar.style.height = barThickness + "px";
		timerBar.style.top = "0px";
		timerBar.style.left = "0px";
		break;

	case "left":
		timerBar.style.width = barThickness + "px";
		timerBar.style.bottom = "0px";
		timerBar.style.left = "0px";
		break;

	case "right":
		timerBar.style.width = barThickness + "px";
		timerBar.style.bottom = "0px";
		timerBar.style.right = "0px";
		break;
}

// Set the position of the timer
switch (timerPosition) {
	case "none":
		timerLabel.style.display = "none";
		break;
	case "top-left":
		timerLabel.style.top = "0px";
		timerLabel.style.left = "0px";
		break;
	case "top-right":
		timerLabel.style.top = "0px";
		timerLabel.style.right = "0px";
		break;
	case "bottom-left":
		timerLabel.style.bottom = "0px";
		timerLabel.style.left = "0px";
		break;
	case "bottom-right":
		timerLabel.style.bottom = "0px";
		timerLabel.style.right = "0px";
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

client.on('Twitch.AdRun', (response) => {
	console.debug(response.data);
	TwitchAdRun(response.data);
})

client.on('Twitch.UpcomingAd', (response) => {
	console.debug(response.data);
	TwitchUpcomingAd(response.data);
})



/////////////////////
// TWITCH AD TIMER //
/////////////////////

function TwitchAdRun(data) {
	const duration = data.length_seconds;
	
	// Unset the upcoming ad countdown warning
	upcomingAdWarningStartDelay = null;

	// Slide the warning off screen
	let width = upcomingAdWarningContainer.getBoundingClientRect().width;
	upcomingAdWarningContainer.style.right = -width + "px";

	TimerBarAnimation(duration);
	TimerLabelAnimation(duration);
}

function TwitchUpcomingAd(data) {
	// Twitch does not give us ANY data to work with, so we will just
	// assume each UpcomingAd warning is 5 minutes
	const warningMinute = 5;

	if (!upcomingAdWarningStartDelay)
		upcomingAdWarningStartDelay = warningMinute * 60 - warningSeconds;

	// Start the countdown animation
	setTimeout(() => {
		console.debug('Upcoming Ad Warning Countdown start...');
		if (upcomingAdWarningStartDelay)
			UpcomingAdWarning(warningSeconds);
	}, upcomingAdWarningStartDelay * 1000);
}

function TimerBarAnimation(duration) {
	// Check if the widget is in the middle of an animation
	if (timerBarLocked)
		return;

	timerBarLocked = true;

	// If the bar is top/bottom, animate horizontally
	// If the bar is left/right, animate vertically
	switch (barPosition) {
		case "bottom":
		case "top":
			timerBar.style.transition = 'width 0.5s ease-in-out';
			timerBar.style.width = '100%';
			setTimeout(() => {
				timerBar.style.transition = `width ${duration}s linear`;
				timerBar.style.width = '0%';
			}, 500);
			break;

		case "left":
		case "right":
			timerBar.style.transition = 'height 0.5s ease-in-out';
			timerBar.style.height = '100%';
			setTimeout(() => {
				timerBar.style.transition = `height ${duration}s linear`;
				timerBar.style.height = '0%';
			}, 500);
			break;
	}

	// Unlock the widget
	setTimeout(() => {
		timerBarLocked = false;
	}, duration * 1000);
}

function TimerLabelAnimation(duration) {
	// Check if the widget is in the middle of an animation
	if (timerLabelLocked)
		return;

	timerLabelLocked = true;

	// Calculate starting time
	let startingTime = duration % singleAdLength;
	if (startingTime == 0)
		startingTime = singleAdLength;

	// Estimate how many ads there should be
	let adsTotal = Math.ceil(duration / singleAdLength);
	let adsRemaining = 1;

	function updateTimer() {
		// Show the labels BEFORE decrementing
		adsRemainingLabel.innerText = `${adsRemaining} of ${adsTotal} • `;
		timeRemainingLabel.innerText = startingTime.toString().toHHMMSS();
		timerLabel.style.opacity = 1;

		// Decrement time
		startingTime--;

		// Check for transitions
		if (startingTime < 0 && adsRemaining < adsTotal) {
			adsRemaining++;
			startingTime = singleAdLength - 1; // -1 since 1 second has already passed
		}

		if (startingTime < 0 && adsRemaining === adsTotal) {
			clearInterval(timerThingy);
			timerLabel.style.opacity = 0;
		}
	}

	// Run immediately
	updateTimer();

	// Then every second
	var timerThingy = setInterval(updateTimer, 1000);

	// Unlock the widget
	setTimeout(() => {
		timerLabelLocked = false;
	}, duration * 1000);
}

function UpcomingAdWarning(warningSeconds) {
	if (!showUpcomingAdWarning)
		return;
	
	// Check if the widget is in the middle of an animation
	if (upcomingAdWarningLocked)
		return;

	upcomingAdWarningLocked = true;

	// Set the starting position of the countdown box
	countdownLabel.innerHTML = formatTime(warningSeconds);

	// Slide the countdown box on screen
	upcomingAdWarningContainer.style.right = "0px";

	// Start the countdown timer
	let startingTime = warningSeconds;

	var timerThingy = setInterval(function () {
		startingTime--;
		countdownLabel.innerText = formatTime(startingTime);
		if (startingTime == 0) {
			countdownLabel.innerText = 'NOW!';
			clearInterval(timerThingy);
			return;
		}
	}, 1000)

	// Unlock the widget
	setTimeout(() => {
		upcomingAdWarningLocked = false;
	}, warningSeconds * 1000);
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

String.prototype.toHHMMSS = function () {
	var sec_num = parseInt(this, 10); // don't forget the second param
	var hours = Math.floor(sec_num / 3600);
	var minutes = Math.floor((sec_num - (hours * 3600)) / 60);
	var seconds = sec_num - (hours * 3600) - (minutes * 60);

	if (hours < 10) { hours = "0" + hours; }
	//if (minutes < 10) {minutes = "0"+minutes;}
	if (seconds < 10) { seconds = "0" + seconds; }
	//return hours+':'+minutes+':'+seconds;
	return minutes + ':' + seconds;
}

function IsNullOrWhitespace(str) {
	return /^\s*$/.test(str);
}

function formatTime(seconds) {
  seconds = Math.floor(seconds); // Round down to nearest whole second

  if (seconds < 60) {
    return `${seconds}`;
  }

  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;

  // Pad seconds with a leading zero if less than 10
  const paddedSecs = secs.toString().padStart(2, '0');

  return `${mins}:${paddedSecs}`;
}

////////////////////
// TEST FUNCTIONS //
////////////////////

function testAd() {
	const data = {
		"length_seconds": 15,
		"timestamp": "0001-01-01T00:00:00",
		"is_automatic": true,
		"requester_user_id": "54983562",
		"requester_user_login": "nutty",
		"requester_user_name": "nutty",
		"is_test": false
	}

	TwitchAdRun(data)
}

function testUpcomingAdWarning() {
	UpcomingAdWarning(warningSeconds);
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