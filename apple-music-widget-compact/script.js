///////////////
// PARAMETRS //
///////////////

const queryString = window.location.search;
const urlParams = new URLSearchParams(queryString);

const visibilityDuration = urlParams.get("duration") || 0;
// const hideAlbumArt = urlParams.has("hideAlbumArt");


/////////////////
// GLOBAL VARS //
/////////////////

let animationSpeed = 0.5;



//////////////////////
// WEBSOCKET SERVER //
//////////////////////

// This is the main function that connects to the Streamer.bot websocket server
function connectws() {
	if ("WebSocket" in window) {
		//const ws = new WebSocket("ws://" + sbServerAddress + ":" + sbServerPort + "/");
		const CiderApp = io("http://localhost:10767/", {
			transports: ['websocket']
		});

		CiderApp.on("disconnect", (event) => {
			SetConnectionStatus(false);
			setTimeout(connectws, 5000);
		});

		CiderApp.on("connect", (event) => {
			SetConnectionStatus(true);
		});

		// Set up websocket artwork/information handling
		CiderApp.on("API:Playback", ({ data, type }) => {
			switch (type) {
				// Song changes
				case ("playbackStatus.nowPlayingItemDidChange"):
					UpdateSongInfo(data);
					break;

				// Progress bar moves
				case ("playbackStatus.playbackTimeDidChange"):
					UpdateProgressBar(data);
					break;

				// Pause/unpause
				case ("playbackStatus.playbackStateDidChange"):
					UpdatePlaybackState(data);
					break;
			}
		});
	}
}



////////////////////////
// NOW PLAYING WIDGET //
////////////////////////

function UpdateSongInfo(data) {
	// Set the user's info
	let albumArtUrl = data.artwork.url;
	albumArtUrl = albumArtUrl.replace("{w}", data.artwork.width);
	albumArtUrl = albumArtUrl.replace("{h}", data.artwork.height);

	// UpdateAlbumArt(document.getElementById("albumArt"), albumArtUrl);
	UpdateAlbumArt(document.getElementById("backgroundImage"), albumArtUrl);

	setTimeout(() => {
		UpdateTextLabel(document.getElementById("songLabel"), data.name);
		UpdateTextLabel(document.getElementById("artistLabel"), data.artistName);
	}, animationSpeed * 500);

	setTimeout(() => {
		// document.getElementById("albumArtBack").src = albumArtUrl;
		document.getElementById("backgroundImageBack").src = albumArtUrl;
	}, 2 * animationSpeed * 500);

	if (visibilityDuration > 0) {
		setTimeout(() => {
			SetVisibility(false);
		}, visibilityDuration * 1000);
	}
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

function UpdateProgressBar(data) {
	const progress = ((data.currentPlaybackTime / data.currentPlaybackDuration) * 100);
	const progressTime = ConvertSecondsToMinutesSoThatItLooksBetterOnTheOverlay(data.currentPlaybackTime);
	const duration = ConvertSecondsToMinutesSoThatItLooksBetterOnTheOverlay(data.currentPlaybackTimeRemaining);
	// document.getElementById("progressBar").style.width = `${progress}%`;
	// document.getElementById("progressTime").innerHTML = progressTime;
	// document.getElementById("duration").innerHTML = `-${duration}`;
	document.getElementById("backgroundImage").style.clipPath = `inset(0 ${100 - progress}% 0 0)`;
}

function UpdatePlaybackState(data) {
	console.log(data);
	switch (data.state) {
		case ("paused"):
		case ("stopped"):
			SetVisibility(false);
			break;
		case ("playing"):
			UpdateSongInfo(data.attributes);
			setTimeout(() => {
				SetVisibility(true);
			}, animationSpeed * 500);
			break;
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
		var tl = new TimelineMax();
		tl
			.to(mainContainer, animationSpeed, { bottom: "50%", ease: Power1.easeInOut }, 'label')
			.to(mainContainer, animationSpeed, { opacity: 1, ease: Power1.easeInOut }, 'label')
	}
	else {
		var tl = new TimelineMax();
		tl
			.to(mainContainer, animationSpeed, { bottom: "45%", ease: Power1.easeInOut }, 'label')
			.to(mainContainer, animationSpeed, { opacity: 0, ease: Power1.easeInOut }, 'label')
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
		var tl = new TimelineMax();
		tl
			.to(statusContainer, 2, { opacity: 0, ease: Linear.easeNone });
		console.log("Connected to Cider!");
	}
	else {
		// statusContainer.style.background = "#D12025";
		// statusContainer.innerText = "Connecting...";
		// statusContainer.style.opacity = 1;
		console.log("Not connected to Cider...");
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

// if (hideAlbumArt)
// {
// 	document.getElementById("albumArtBox").style.display = "none";
// 	document.getElementById("songInfoBox").style.width = "calc(100% - 20px)";
// }


connectws();