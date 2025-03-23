///////////////
// PARAMETRS //
///////////////

const queryString = window.location.search;
const urlParams = new URLSearchParams(queryString);

const client_id = urlParams.get("client_id") || "";
const client_secret = urlParams.get("client_secret") || "";
let refresh_token = urlParams.get("refresh_token") || "";
let access_token = "";

const visibilityDuration = urlParams.get("duration") || 0;
// const hideAlbumArt = urlParams.has("hideAlbumArt");

let currentState = false;
let currentSongUri = "";



/////////////////
// SPOTIFY API //
/////////////////

// Update the access token - this expires so needs to be refreshed with refresh_token
async function RefreshAccessToken() {
	console.debug(`Client ID: ${client_id}`);
	console.debug(`Client Secret: ${client_secret}`);
	console.debug(`Refresh Token: ${refresh_token}`);

    let body = "grant_type=refresh_token";
    body += "&refresh_token=" + refresh_token;
    body += "&client_id=" + client_id;

	const response = await fetch("https://accounts.spotify.com/api/token", {
		method: "POST",
		headers: {
			'Authorization': `Basic ${btoa(client_id + ":" + client_secret)}`,
			'Content-Type': 'application/x-www-form-urlencoded'
		},
		body: body
	});

	// If we got a response, save the access token
	if (response.ok)
	{
		const responseData = await response.json();
		console.debug(responseData);
		//refresh_token = responseData.refresh_token;			// Unsure if we need to replace the refresh_token but do it just in case
		access_token = responseData.access_token;			// Save access token for all future API calls
	}
	else
	{
		console.error(`${response.status}`);
	}
}

async function GetCurrentlyPlaying(refreshInterval) {
	try {
		// Get the current player information from Spotify
		const response = await fetch("https://api.spotify.com/v1/me/player/currently-playing", {
			method: "GET",
			headers: {
				'Authorization': `Bearer ${access_token}`,
				'Content-Type': 'application/json'
			}
		})
	
		// If we got a response, save the access token
		if (response.ok)
		{
			const responseData = await response.json();
			console.debug(responseData);
			UpdatePlayer(responseData);
		}
		else
		{
			switch (response.status)
			{
				case 401:
					console.debug(`${response.status}`)
					RefreshAccessToken();
					break;
				default:
					console.error(`${response.status}`)
			}
		}
		// Refresh
		setTimeout(() => {
			GetCurrentlyPlaying()
		}, 1000);
	}
	catch (error)
	{
		console.debug(error);
		SetVisibility(false);
		
		// Try again in 2 seconds
		setTimeout(() => {
			GetCurrentlyPlaying()
		}, 2000);
	}
}

function UpdatePlayer(data) {
	const isPlaying = data.is_playing;							// The play/pause state of the player
	const songUri = data.item.uri;
	const albumArt = data.item.album.images.length > 0 ?
		`${data.item.album.images[0].url}`
		: `images/placeholder-album-art.png`;					// The album art URL
	const artist = `${data.item.artists[0].name}`;				// Name of the artist
	const name = `${data.item.name}`;							// Name of the song
	const duration = `${data.item.duration_ms/1000}`;			// The duration of the song in seconds
	const progress = `${data.progress_ms/1000}`;				// The current position in seconds

	// Set the visibility of the player, but only if the state is different than the last time we checked
	if (isPlaying != currentState) {

		// Set player visibility
		if (!isPlaying)
		{
			console.debug("Hiding player...");
			SetVisibility(false);
		}
		else
		{
			console.debug("Showing player...");
			setTimeout(() => {
				SetVisibility(true);

				if (visibilityDuration > 0) {
					setTimeout(() => {
						SetVisibility(false, false);
					}, visibilityDuration * 1000);
				}
			}, 500);
		}
	}

	if (songUri != currentSongUri) {		
		if (isPlaying) {
			console.debug("Showing player...");
			setTimeout(() => {
				SetVisibility(true);

				if (visibilityDuration > 0) {
					setTimeout(() => {
						SetVisibility(false, false);
					}, visibilityDuration * 1000);
				}
			}, 500);
	
			currentSongUri = songUri;
		}
	}

	// Set thumbnail
	// UpdateAlbumArt(document.getElementById("albumArt"), albumArt);
	UpdateAlbumArt(document.getElementById("backgroundImage"), albumArt);

	// Set song info
	UpdateTextLabel(document.getElementById("artistLabel"), artist);
	UpdateTextLabel(document.getElementById("songLabel"), name);
	
	// Set progressbar
	const progressPerc = ((progress / duration) * 100);			// Progress expressed as a percentage
	const progressTime = ConvertSecondsToMinutesSoThatItLooksBetterOnTheOverlay(progress);
	const timeRemaining = ConvertSecondsToMinutesSoThatItLooksBetterOnTheOverlay(duration - progress);
	console.debug(`Progress: ${progressTime}`);
	console.debug(`Time Remaining: ${timeRemaining}`);
	// document.getElementById("progressBar").style.width = `${progressPerc}%`;
	// document.getElementById("progressTime").innerHTML = progressTime;
	// document.getElementById("timeRemaining").innerHTML = `-${timeRemaining}`;
	document.getElementById("backgroundImage").style.clipPath = `inset(0 ${100 - progressPerc}% 0 0)`;

	setTimeout(() => {
		// document.getElementById("albumArtBack").src = albumArt;
		document.getElementById("backgroundImageBack").src = albumArt;
	}, 1000);
}

function UpdateTextLabel(div, text) {
	if (div.innerText != text) {
		div.setAttribute("class", "text-fade");
		setTimeout(() => {
			div.innerText = text;
			div.setAttribute("class", ".text-show");
		}, 500);
	}
}

function UpdateAlbumArt(div, imgsrc) {
	if (div.src != imgsrc) {
		div.setAttribute("class", "text-fade");
		setTimeout(() => {
			div.src = imgsrc;
			div.setAttribute("class", "text-show");
		}, 500);
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

function SetVisibility(isVisible, updateCurrentState = true) {
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

	if (updateCurrentState)
		currentState = isVisible;
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



////////////////////////////////
// KICK OFF THE WHOLE WIDGET  //
////////////////////////////////

RefreshAccessToken();
GetCurrentlyPlaying();			// This is a recursive function, so just run it once