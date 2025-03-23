///////////////
// PARAMETRS //
///////////////

const baseURL = "https://nuttylmao.github.io/youtube-music-widget";
const queryString = window.location.search;
const urlParams = new URLSearchParams(queryString);

const token = urlParams.get("token") || "";
const visibilityDuration = urlParams.get("duration") || 0;
// const hideAlbumArt = urlParams.has("hideAlbumArt");


/////////////////
// GLOBAL VARS //
/////////////////

let animationSpeed = 0.5;
let currentState = 0;


////////////
// SOCKET //
////////////

function connectws() {
	const socket = io("http://localhost:9863/api/v1/realtime", {
		transports: ['websocket'],
		auth: {
			token: token
		}
	});

	socket.on("state-update", (state) => {
		console.debug(state);
		UpdatePlayer(state);
	});

	socket.on("playlist-created", (playlist) => {
		console.debug(playlist);
	});

	socket.on("playlist-delete", (playlistId) => {
		console.debug(playlistId);
	});

	socket.on('connect', function () {
		SetConnectionStatus(true);
	});

	socket.on('disconnect', function () {
		SetConnectionStatus(false);
		setTimeout(connectws, 5000);
	});
}

function UpdatePlayer(state) {

	if (state.player.trackState != currentState) {
		// Set thumbnail
		const songInfo = state.video;
		const thumbnail = songInfo.thumbnails[songInfo.thumbnails.length - 1].url;
		console.debug(thumbnail);
		// UpdateAlbumArt(document.getElementById("albumArt"), thumbnail);
		UpdateAlbumArt(document.getElementById("backgroundImage"), thumbnail);
		UpdateAlbumArt(document.getElementById("backgroundImageBack"), thumbnail);

		// Set song info
		console.debug(`Artist: ${songInfo.author}`);
		console.debug(`Title: ${songInfo.title}`);
		UpdateTextLabel(document.getElementById("artistLabel"), songInfo.author);
		UpdateTextLabel(document.getElementById("songLabel"), songInfo.title);

		// Set player visibility
		switch (state.player.trackState) {
			case -1:
				console.debug("Player State: Unknown");
				SetVisibility(false);
				break;
			case 0:
				console.debug("Player State: Paused");
				SetVisibility(false);
				break;
			case 2:
				console.debug("Player State: Buffering");
				SetVisibility(false);
				break;
			case 1:
				console.debug("Player State: Playing");
				setTimeout(() => {
					SetVisibility(true);
				}, animationSpeed * 1000);
				break;
		}

		if (visibilityDuration > 0) {
			setTimeout(() => {
				SetVisibility(false);
			}, visibilityDuration * 1000);
		}

		currentState = state.player.trackState;
	}

	// Set progressbar	
	const songInfo = state.video;
	const progress = ((state.player.videoProgress / songInfo.durationSeconds) * 100);
	const progressTime = ConvertSecondsToMinutesSoThatItLooksBetterOnTheOverlay(state.player.videoProgress);
	const duration = ConvertSecondsToMinutesSoThatItLooksBetterOnTheOverlay(songInfo.durationSeconds - state.player.videoProgress);
	console.debug(`Progress: ${progressTime}`);
	console.debug(`Duration: ${duration}`);
	// document.getElementById("progressBar").style.width = `${progress}%`;
	// document.getElementById("progressTime").innerHTML = progressTime;
	// document.getElementById("duration").innerHTML = `-${duration}`;
	document.getElementById("backgroundImage").style.clipPath = `inset(0 ${100 - progress}% 0 0)`;

}

function UpdateTextLabel(div, text) {
	if (div.innerHTML != text) {
		div.setAttribute("class", "text-fade");
		setTimeout(() => {
			div.innerHTML = text;
			div.setAttribute("class", ".text-show");
		}, animationSpeed * 250);
	}
}

function UpdateAlbumArt(div, imgsrc) {
	if (div.src != imgsrc) {
		div.setAttribute("class", "text-fade");
		setTimeout(() => {
			div.src = imgsrc;
			div.setAttribute("class", "text-show");
		}, animationSpeed * 500);
	}
}

//////////////////////
// HELPER FUNCTIONS //
//////////////////////

function ConvertSecondsToMinutesSoThatItLooksBetterOnTheOverlay(time) {
	const minutes = Math.floor(time / 60);
	const seconds = Math.trunc(time - minutes * 60);

	return `${minutes}:${('0' + seconds).slice(-2)}`;
}

function SetVisibility(isVisible) {
	widgetVisibility = isVisible;

	const mainContainer = document.getElementById("mainContainer");

	if (isVisible) {
		mainContainer.style.opacity = 1;
		mainContainer.style.bottom = "50%";
	}
	else {
		mainContainer.style.opacity = 0;
		mainContainer.style.bottom = "calc(50% - 20px)";
	}
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

		console.log("Connected!");
	}
	else {
		// statusContainer.style.background = "#D12025";
		// statusContainer.innerText = "Connecting...";
		// statusContainer.style.opacity = 1;
		// setTimeout(() => {
		// 	statusContainer.style.transition = "all 2s ease";
		// 	statusContainer.style.opacity = 0;
		// }, 10);
		SetVisibility(false);
		console.log("Not connected...");
	}
}



//////////////////////////////////////////////////////////////////////////////////////////
// RESIZER THING BECAUSE I THINK I KNOW HOW RESPONSIVE DESIGN WORKS EVEN THOUGH I DON'T //
//////////////////////////////////////////////////////////////////////////////////////////

let outer = document.getElementById('mainContainer'),
	maxWidth = outer.clientWidth+100,
	maxHeight = outer.clientHeight;

window.addEventListener("resize", resize);

resize();
function resize() {
	const scale = window.innerWidth / maxWidth;
	outer.style.transform = 'translate(-50%, 50%) scale(' + scale + ')';
}



/////////////////////////////////////////////////////////////////////
// IF THE USER PUT IN THE HIDEALBUMART PARAMATER, THEN YOU SHOULD  //
//   HIDE THE ALBUM ART, BECAUSE THAT'S WHAT IT'S SUPPOSED TO DO   //
/////////////////////////////////////////////////////////////////////

// if (hideAlbumArt) {
// 	document.getElementById("albumArtBox").style.display = "none";
// 	document.getElementById("songInfoBox").style.width = "calc(100% - 20px)";
// }

if (token == "") {
	console.log("No token detected...");
	window.open(`${baseURL}/configure`);
}
else
	connectws();