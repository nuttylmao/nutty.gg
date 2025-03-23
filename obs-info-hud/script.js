////////////////
// PARAMETERS //
////////////////

const queryString = window.location.search;
const urlParams = new URLSearchParams(queryString);

const obsServerAddress = urlParams.get("address") || "127.0.0.1";
const obsServerPort = urlParams.get("port") || "4455";
const obsServerPassword = urlParams.get("password") || "";
const obsMicInput = urlParams.get("audio") || "";
const background = urlParams.get("background") || "";

if (obsMicInput != "")
	document.getElementById("theMotherOfAllVolumeContainers").style.visibility = "visible";

if (background != "")
{
	document.body.style.backgroundImage = `url("frames/${background}.png")`
}

let ws = new WebSocket("ws://" + obsServerAddress + ":" + obsServerPort + "/");

let previousOutputTimecode = 0;
let previousOutputBytes = 0;
let activeFps;

function connectws() {
	if ("WebSocket" in window) {

		ws = new WebSocket("ws://" + obsServerAddress + ":" + obsServerPort + "/");

		// Reconnect
		ws.onclose = function () {
			SetConnectionStatus(false);
			setTimeout(connectws, 5000);
		};

		ws.onopen = async function () {
		}

		ws.onmessage = async function (event) {
			let data = JSON.parse(event.data);

			switch (data.op) {
				case 0:		// Hello OpCode
				case 3:		// Reidentify OpCode
					let salt = data.d.authentication != null ? data.d.authentication.salt : "";
					let challenge = data.d.authentication != null ? data.d.authentication.challenge : "";

					let secret = await sha256(obsServerPassword + salt);
					let base64_secret = hexToBase64(secret);

					let auth_string = await sha256(base64_secret + challenge);
					let base64_auth_string = hexToBase64(auth_string);

					ws.send(
						JSON.stringify({
							op: 1,
							d: {
								rpcVersion: 1,
								authentication: base64_auth_string,
								eventSubscriptions: 1 << 16
							}
						}
						));
					break;
				case 2:		// Identify OpCode
					console.log("Connected to OBS!");
					SetConnectionStatus(true);
					break;
				case 5:		// Event OpCode
					switch (data.d.eventType) {
						case ("InputVolumeMeters"):
							let eventData = data.d.eventData;
							eventData.inputs.forEach((input) => {
								if (input.inputName == obsMicInput) {
									if (input.inputLevelsMul.length == 0) {
										document.getElementById("theMotherOfAllVolumeContainers").style.visibility = `hidden`;
									}
									else {
										let leftMeter = document.getElementById("theGreenShitThatsInsideTheOtherContainerLeft");
										let rightMeter = document.getElementById("theGreenShitThatsInsideTheOtherContainerRight");

										var tl = new TimelineMax();
										tl
											.to(leftMeter, 0.1, { height: + 100 * input.inputLevelsMul[0][1] + "%", ease: Linear.easeNone });

										tl = new TimelineMax();
										tl
											.to(rightMeter, 0.1, { height: + 100 * input.inputLevelsMul[1][1] + "%", ease: Linear.easeNone });

										document.getElementById("theMotherOfAllVolumeContainers").style.visibility = `visible`;
									}
								}
							});
							break;
					}
					break;
				case 7:		// RequestResponse OpCode
					switch (data.d.requestType) {
						case "GetStats":
							{
								let responseData = data.d.responseData;
								activeFps = `${responseData.activeFps.toFixed(1)}`;
								const cpu = `${responseData.cpuUsage.toFixed(1)}%`;
								const memory = `${responseData.memoryUsage.toFixed(1)}MB`;
								
								const averageFrameRenderTime = `${responseData.averageFrameRenderTime.toFixed(1)}ms`;
								const outputSkippedFrames = responseData.outputSkippedFrames;
								const outputTotalFrames = responseData.outputTotalFrames;
								const outputSkippedFramesPerc = outputTotalFrames > 0 ? `${(100 * outputSkippedFrames / outputTotalFrames).toFixed(1)}%` : `0%`;
								const renderSkippedFrames = responseData.renderSkippedFrames;
								const renderTotalFrames = responseData.renderTotalFrames;
								const renderSkippedFramesPerc = `${(100 * renderSkippedFrames / renderTotalFrames).toFixed(1)}%`

								document.getElementById("statsLabel").innerHTML = `CPU: ${cpu} • MEM: ${memory} • RENDER TIME: ${averageFrameRenderTime}`;
								document.getElementById("advancedStatsLabel").innerHTML = `MISSED FRAMES ${outputSkippedFramesPerc} • SKIPPED FRAMES ${renderSkippedFramesPerc}`;
								document.getElementById("fps").innerHTML = `${activeFps}`;

								GetVideoSettings();
							}
							break;
						case "GetVideoSettings":
							{
								let responseData = data.d.responseData;
								const fpsNumerator = responseData.fpsNumerator;
								const fpsDenominator = responseData.fpsDenominator;

								const fps = fpsNumerator / fpsDenominator;
								const fpsMeterValue = activeFps / fps;

								let fpsMeter = document.getElementById("fpsMeter");
								var tl = new TimelineMax();
								tl
									.to(fpsMeter, 0.1, { height: + 100 * fpsMeterValue + "%", ease: Linear.easeNone });

								if (fpsMeterValue >= 1)
									document.getElementById("fpsMeter").style.backgroundColor = `#37d247`;
								else if (fpsMeterValue > 0.9)
									document.getElementById("fpsMeter").style.backgroundColor = `#e5af24`;
								else
									document.getElementById("fpsMeter").style.backgroundColor = `#D12025`;
							}
							break;
						case "GetRecordStatus":
							{
								let responseData = data.d.responseData;

								if (responseData.outputActive === false) {
									document.getElementById("recordingLabel").innerHTML = ``;
									document.getElementById("recordTimecodeLabel").innerHTML = ``;
									document.getElementById("recordOutputFilesize").innerHTML = ``;
									document.getElementById("recordingRing").style.visibility = 'hidden';
									document.getElementById("recordInfo").style.visibility = `hidden`;
								}
								else {
									document.getElementById("recordingLabel").innerHTML = `REC 🔴`;
									document.getElementById("recordTimecodeLabel").innerHTML = `${RemoveMilliseconds(responseData.outputTimecode)}`;
									document.getElementById("recordOutputFilesize").innerHTML = `${ConvertToMegabytes(responseData.outputBytes)}MB`;
									document.getElementById("recordingRing").style.visibility = 'visible';
									document.getElementById("recordInfo").style.visibility = `visible`;
								}
							}
							break;
						case "GetStreamStatus":
							{
								let responseData = data.d.responseData;

								if (responseData.outputActive === false) {
									document.getElementById("streamingRing").style.visibility = 'hidden';
									document.getElementById("streamInfo").style.visibility = `hidden`;
								}
								else {
									let outputTimecode = TimeToMilliseconds(responseData.outputTimecode);
									let outputBytes = responseData.outputBytes;

									let kbps = ((outputBytes - previousOutputBytes) / (outputTimecode - previousOutputTimecode) * 8);

									previousOutputTimecode = outputTimecode;
									previousOutputBytes = outputBytes;

									document.getElementById("streamBitrateLabel").innerHTML = `${Math.floor(kbps)} kb/s`;
									document.getElementById("streamTimecodeLabel").innerHTML = `${RemoveMilliseconds(responseData.outputTimecode)}`;
									GetStreamServiceSettings();

									document.getElementById("streamingRing").style.visibility = 'visible';
									document.getElementById("streamInfo").style.visibility = `visible`;
								}
							}
							break;
						case "GetStreamServiceSettings":
							{
								let responseData = data.d.responseData;
								switch (responseData.streamServiceSettings.service) {
									case "Twitch":
										document.getElementById("streamPlatformLabel").innerHTML = "🟣 Twitch";
										break;
									case "YouTube":
										document.getElementById("streamPlatformLabel").innerHTML = "🔴 YouTube";
										break;
									case undefined:
										document.getElementById("streamPlatformLabel").innerHTML = "🔴 LIVE";
										break;
									default:
										document.getElementById("streamPlatformLabel").innerHTML = `🔴 ${responseData.streamServiceSettings.service}`;
										break;
								}
							}
							break;
						case "GetProfileList":
							{
								let responseData = data.d.responseData;
								document.getElementById("profileLabel").innerHTML = `Profile: ${responseData.currentProfileName}`;
							}
							break;
						case "GetInputMute":
							{
								let responseData = data.d.responseData;
								console.log(responseData);
								if (responseData.inputMuted)
									document.getElementById("micMuteIcon").style.visibility = `visible`;
								else
									document.getElementById("micMuteIcon").style.visibility = `hidden`;
							}
							break;
					}
					break;

			}
		}
	}
}



//////////////////////
// HELPER FUNCTIONS //
//////////////////////

function obswsSendRequest(ws, data) {
	ws.send(
		JSON.stringify({
			"op": 6,
			"d": data
		}
		));
}

function TimeToMilliseconds(hms) {
	const [hours, minutes, seconds] = hms.split(':');
	const totalSeconds = (+hours) * 60 * 60 + (+minutes) * 60 + (+seconds);
	return totalSeconds * 1000;
}

function RemoveMilliseconds(timecode) {
	const parts = timecode.split('.');
	return parts[0];
}

function ConvertToMegabytes(bytes) {
	return ((bytes / 1024) / 1024).toFixed(2);
}

function CreateGuid() {
	function _p8(s) {
		var p = (Math.random().toString(16) + "000000000").substr(2, 8);
		return s ? "-" + p.substr(0, 4) + "-" + p.substr(4, 4) : p;
	}
	return _p8() + _p8(true) + _p8(true) + _p8();
}

function sha256(ascii) {
	function rightRotate(value, amount) {
		return (value >>> amount) | (value << (32 - amount));
	};

	var mathPow = Math.pow;
	var maxWord = mathPow(2, 32);
	var lengthProperty = 'length'
	var i, j; // Used as a counter across the whole file
	var result = ''

	var words = [];
	var asciiBitLength = ascii[lengthProperty] * 8;

	//* caching results is optional - remove/add slash from front of this line to toggle
	// Initial hash value: first 32 bits of the fractional parts of the square roots of the first 8 primes
	// (we actually calculate the first 64, but extra values are just ignored)
	var hash = sha256.h = sha256.h || [];
	// Round constants: first 32 bits of the fractional parts of the cube roots of the first 64 primes
	var k = sha256.k = sha256.k || [];
	var primeCounter = k[lengthProperty];
	/*/
	var hash = [], k = [];
	var primeCounter = 0;
	//*/

	var isComposite = {};
	for (var candidate = 2; primeCounter < 64; candidate++) {
		if (!isComposite[candidate]) {
			for (i = 0; i < 313; i += candidate) {
				isComposite[i] = candidate;
			}
			hash[primeCounter] = (mathPow(candidate, .5) * maxWord) | 0;
			k[primeCounter++] = (mathPow(candidate, 1 / 3) * maxWord) | 0;
		}
	}

	ascii += '\x80' // Append Ƈ' bit (plus zero padding)
	while (ascii[lengthProperty] % 64 - 56) ascii += '\x00' // More zero padding
	for (i = 0; i < ascii[lengthProperty]; i++) {
		j = ascii.charCodeAt(i);
		if (j >> 8) return; // ASCII check: only accept characters in range 0-255
		words[i >> 2] |= j << ((3 - i) % 4) * 8;
	}
	words[words[lengthProperty]] = ((asciiBitLength / maxWord) | 0);
	words[words[lengthProperty]] = (asciiBitLength)

	// process each chunk
	for (j = 0; j < words[lengthProperty];) {
		var w = words.slice(j, j += 16); // The message is expanded into 64 words as part of the iteration
		var oldHash = hash;
		// This is now the undefinedworking hash", often labelled as variables a...g
		// (we have to truncate as well, otherwise extra entries at the end accumulate
		hash = hash.slice(0, 8);

		for (i = 0; i < 64; i++) {
			var i2 = i + j;
			// Expand the message into 64 words
			// Used below if 
			var w15 = w[i - 15], w2 = w[i - 2];

			// Iterate
			var a = hash[0], e = hash[4];
			var temp1 = hash[7]
				+ (rightRotate(e, 6) ^ rightRotate(e, 11) ^ rightRotate(e, 25)) // S1
				+ ((e & hash[5]) ^ ((~e) & hash[6])) // ch
				+ k[i]
				// Expand the message schedule if needed
				+ (w[i] = (i < 16) ? w[i] : (
					w[i - 16]
					+ (rightRotate(w15, 7) ^ rightRotate(w15, 18) ^ (w15 >>> 3)) // s0
					+ w[i - 7]
					+ (rightRotate(w2, 17) ^ rightRotate(w2, 19) ^ (w2 >>> 10)) // s1
				) | 0
				);
			// This is only used once, so *could* be moved below, but it only saves 4 bytes and makes things unreadble
			var temp2 = (rightRotate(a, 2) ^ rightRotate(a, 13) ^ rightRotate(a, 22)) // S0
				+ ((a & hash[1]) ^ (a & hash[2]) ^ (hash[1] & hash[2])); // maj

			hash = [(temp1 + temp2) | 0].concat(hash); // We don't bother trimming off the extra ones, they're harmless as long as we're truncating when we do the slice()
			hash[4] = (hash[4] + temp1) | 0;
		}

		for (i = 0; i < 8; i++) {
			hash[i] = (hash[i] + oldHash[i]) | 0;
		}
	}

	for (i = 0; i < 8; i++) {
		for (j = 3; j + 1; j--) {
			var b = (hash[i] >> (j * 8)) & 255;
			result += ((b < 16) ? 0 : '') + b.toString(16);
		}
	}
	return result;
};

function hexToBase64(hexstring) {
	return btoa(hexstring.match(/\w{2}/g).map(function (a) {
		return String.fromCharCode(parseInt(a, 16));
	}).join(""));
}



//////////////////////
// WEBSOCKET STATUS //
//////////////////////

// This function sets the visibility of the Streamer.bot status label on the overlay
function SetConnectionStatus(connected) {
	let statusContainer = document.getElementById("statusContainer");
	
	if (connected) {
		statusContainer.style.background = "#2FB774";
		statusContainer.innerText = "Connected!";
		mainContainer.style.visibility = `visible`;
		var tl = new TimelineMax();
		tl
			.to(statusContainer, 2, { opacity: 0, ease: Linear.easeNone });
	}
	else {
		statusContainer.style.background = "#D12025";
		statusContainer.innerText = "Connecting...";
		statusContainer.style.opacity = 1;
		mainContainer.style.visibility = `hidden`;
	}
}

connectws();

setInterval(GetStreamStatus, 1000);
function GetStreamStatus() {
	if (ws.readyState !== WebSocket.CLOSED) {
		let data =
		{
			"requestType": "GetStreamStatus",
			"requestId": CreateGuid(),
			"requestData": {
			}
		}
		obswsSendRequest(ws, data);
	}
}

function GetStreamServiceSettings() {
	let data =
	{
		"requestType": "GetStreamServiceSettings",
		"requestId": CreateGuid(),
		"requestData": {
		}
	}
	obswsSendRequest(ws, data);
}

setInterval(GetProfileList, 200);
function GetProfileList() {
	let data =
	{
		"requestType": "GetProfileList",
		"requestId": CreateGuid(),
		"requestData": {
		}
	}
	obswsSendRequest(ws, data);
}

setInterval(GetStats, 1000);
function GetStats() {
	let data =
	{
		"requestType": "GetStats",
		"requestId": CreateGuid(),
		"requestData": {
		}
	}
	obswsSendRequest(ws, data);
}

setInterval(GetRecordStatus, 500);
function GetRecordStatus() {
	let data =
	{
		"requestType": "GetRecordStatus",
		"requestId": CreateGuid(),
		"requestData": {
		}
	}
	obswsSendRequest(ws, data);
}


if (obsMicInput != "")
{
	setInterval(GetInputMute, 500);
	function GetInputMute() {
		let data =
		{
			"requestType": "GetInputMute",
			"requestId": CreateGuid(),
			"requestData": {
				"inputName": obsMicInput
			}
		}
		obswsSendRequest(ws, data);
	}
}


function GetVideoSettings() {
	let data =
	{
		"requestType": "GetVideoSettings",
		"requestId": CreateGuid(),
		"requestData": {
		}
	}
	obswsSendRequest(ws, data);
}