////////////////
// PARAMETERS //
////////////////

const queryString = window.location.search;
const urlParams = new URLSearchParams(queryString);

let sbDebugMode = true;
const sbServerAddress = urlParams.get("address") || "127.0.0.1";
const sbServerPort = urlParams.get("port") || "8080";
const lineThickness = urlParams.get("lineThickness") || 4;
const barPosition = urlParams.get("barPosition") || "bottom";			// none, bottom, top, left, right
const timerPosition = urlParams.get("timerPosition") || "topLeft";		// none, topLeft, topRight, bottomLeft, bottomRight
const showMidRollCountdown = urlParams.get("timerPosition") || true;

/////////////////
// GLOBAL VARS //
/////////////////

let ws;
let singleAdLength = 30;



///////////////////////////////////
// SRTEAMER.BOT WEBSOCKET SERVER //
///////////////////////////////////

// This is the main function that connects to the Streamer.bot websocket server
function connectws() {
	if ("WebSocket" in window) {
		ws = new WebSocket("ws://" + sbServerAddress + ":" + sbServerPort + "/");

		// Reconnect
		ws.onclose = function () {
			SetConnectionStatus(false);
			setTimeout(connectws, 5000);
		};

		// Connect
		ws.onopen = async function () {
			SetConnectionStatus(true);

			console.log("Subscribe to events");
			ws.send(
				JSON.stringify({
					request: "Subscribe",
					id: "subscribe-events-id",
					events: {
						// This is the list of Streamer.bot websocket events to subscribe to
						// See full list of events here:
						// https://wiki.streamer.bot/en/Servers-Clients/WebSocket-Server/Requests
						twitch: [
							"AdRun",
							"AdMidRoll"
						]
					}
				})
			);

			ws.onmessage = function (event) {
				// Grab message and parse JSON
				const msg = event.data;
				const wsdata = JSON.parse(msg);

				if (typeof wsdata.event == "undefined") {
					return;
				}

				// Print data to log for debugging purposes
				if (sbDebugMode)
				{
					console.log(wsdata.data);
					console.log(wsdata.event.type);
				}

				// Check for events to trigger
				// See documentation for all events here:
				// https://wiki.streamer.bot/en/Servers-Clients/WebSocket-Server/Events
				switch (wsdata.event.source) {

					// Twitch Events
					case 'Twitch':
						switch (wsdata.event.type) {
							case ('AdRun'):
								AdRun(wsdata.data);
								break;
							case ('AdMidRoll'):
								AdMidRoll(wsdata.data);
								break;
						}
						break;

				}
			};
		}
	}
}



///////////////////////
// TWITCH AD OVERLAY //
///////////////////////

function AdRun(data) {
	if (data.length_seconds <= 0)
	{
		TimerBarAnimation(singleAdLength);
		HugeTittiesAnimation(singleAdLength);
	}
	else
	{
		TimerBarAnimation(data.length_seconds);
		HugeTittiesAnimation(data.length_seconds);
	}
}

function AdMidRoll(data) {
	if (!showMidRollCountdown)
		return;

	//MidRollAnimation(data.length);
	MidRollAnimation(5);
}

function TimerBarAnimation(adLength) {
	let timerBar = document.getElementById("timerBar");
	
	switch (barPosition) {
		case "none":
			timerBar.style.display = "none";
			break;
		case "bottom":
			timerBar.style.height = lineThickness + "px";
			timerBar.style.bottom = "0px";
			timerBar.style.left = "0px";

			// Start Animation
			tl = new TimelineMax();
			tl
				.to(timerBar, 0.5, { width: window.innerWidth + "px", ease: Cubic.ease })
				.to(timerBar, adLength, { width: "0px", ease: Linear.easeNone })
			break;

		case "top":
			timerBar.style.height = lineThickness + "px";
			timerBar.style.top = "0px";
			timerBar.style.left = "0px";

			// Start Animation
			tl = new TimelineMax();
			tl
				.to(timerBar, 0.5, { width: window.innerWidth + "px", ease: Cubic.ease })
				.to(timerBar, adLength, { width: "0px", ease: Linear.easeNone })
			break;

		case "left":
			timerBar.style.width = lineThickness + "px";
			timerBar.style.bottom = "0px";
			timerBar.style.left = "0px";

			// Start Animation
			tl = new TimelineMax();
			tl
				.to(timerBar, 0.5, { height: window.innerHeight + "px", ease: Cubic.ease })
				.to(timerBar, adLength, { height: "0px", ease: Linear.easeNone })
			break;

		case "right":
			timerBar.style.width = lineThickness + "px";
			timerBar.style.bottom = "0px";
			timerBar.style.right = "0px";

			// Start Animation
			tl = new TimelineMax();
			tl
				.to(timerBar, 0.5, { height: window.innerHeight + "px", ease: Cubic.ease })
				.to(timerBar, adLength, { height: "0px", ease: Linear.easeNone })
			break;
	}
}

function HugeTittiesAnimation(adLength) {

	let hugeTittiesContainer = document.getElementById("hugeTittiesContainer");

	switch (timerPosition) {
		case "none":
			hugeTittiesContainer.style.display = "none";
			break;
		case "topLeft":
			hugeTittiesContainer.style.top = "0px";
			hugeTittiesContainer.style.left = "0px";
			break;
		case "topRight":
			hugeTittiesContainer.style.top = "0px";
			hugeTittiesContainer.style.right = "0px";
			break;
		case "bottomLeft":
			hugeTittiesContainer.style.bottom = "0px";
			hugeTittiesContainer.style.left = "0px";
			break;
		case "bottomRight":
			hugeTittiesContainer.style.bottom = "0px";
			hugeTittiesContainer.style.right = "0px";
			break;
	}

	// Calculate starting time
	let startingTime = adLength % singleAdLength;
	if (startingTime == 0)
		startingTime = singleAdLength;

	// Estimate how many ads there should be
	let adsTotal = Math.ceil(adLength / singleAdLength);
	let adsRemaining = 1;

	// Start the countdown timer
	let adsRemainingContainer = document.getElementById("adsRemainingContainer");
	let timerContainer = document.getElementById("timerContainer");

	var timerThingy = setInterval(function () {
		startingTime--;
		if (startingTime == 0 && adsRemaining < adsTotal) {
			adsRemaining++;
			startingTime = singleAdLength;
		}
		if (startingTime == 0 && adsRemaining == adsTotal) {
			clearInterval(timerThingy);
			SetVisibility(false);
			return;
		}
		adsRemainingContainer.innerText = adsRemaining + " of " + adsTotal;
		timerContainer.innerText = startingTime.toString().toHHMMSS();

		// Show the widget
		SetVisibility(true);
	}, 1000)
}

function MidRollAnimation(countdownLength) {
	let midRollContainer = document.getElementById("midRollContainer");
	let midRollCountdownContainer = document.getElementById("midRollCountdownContainer");
	let width = midRollContainer.getBoundingClientRect().width;
	
	// Set the starting position of the countdown box
	midRollContainer.style.right = -width + "px";
	midRollCountdownContainer.innerHTML = countdownLength;

	// Slide the countdown box on screen
	ShowMidRollCountdown(true);

	// Start the countdown timer
	let startingTime = countdownLength;

	var timerThingy = setInterval(function () {
		startingTime--;
		midRollCountdownContainer.innerText = startingTime;
		if (startingTime == 0) {
			clearInterval(timerThingy);
			ShowMidRollCountdown(false);
			return;
		}
	}, 1000)
}

function SetVisibility(isVisible) {
	let hugeTittiesContainer = document.getElementById("hugeTittiesContainer");

	var tl = new TimelineMax();
	tl
		.to(hugeTittiesContainer, 0.5, { opacity: isVisible, ease: Linear.easeNone });
}

function ShowMidRollCountdown(isVisible) {
	let midRollContainer = document.getElementById("midRollContainer");
	let width = midRollContainer.getBoundingClientRect().width;

	var tl = new TimelineMax();

	if (isVisible)
	{
		tl
			.to(midRollContainer, 0.5, { right: "-10px", ease: Power1.easeInOut })
	}
	else
	{
		tl
			.to(midRollContainer, 0.5, { right: -width + "px", ease: Power1.easeInOut })
	}
}



//////////////////////
// HELPER FUNCTIONS //
//////////////////////

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



///////////////////////////////////
// STREAMER.BOT WEBSOCKET STATUS //
///////////////////////////////////

function SetConnectionStatus(connected) {
	let statusContainer = document.getElementById("statusContainer");
	if (connected) {
		statusContainer.style.background = "#2FB774";
		statusContainer.innerText = "Connected!";
		var tl = new TimelineMax();
		tl
			.to(statusContainer, 2, { opacity: 0, ease: Linear.easeNone })
		//.call(removeElement, [div]);
	}
	else {
		statusContainer.style.background = "#D12025";
		statusContainer.innerText = "Connecting...";
		statusContainer.style.opacity = 1;
	}
}

connectws();