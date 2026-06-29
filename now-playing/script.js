////////////////
// PARAMETERS //
////////////////

const queryString = window.location.search;
const urlParams = new URLSearchParams(queryString);


///////////////////
// PAGE ELEMENTS //
///////////////////

const mainContainer = document.getElementById('main-container');

/////////////
// OPTIONS //
/////////////

const theme = urlParams.get('theme') || 'standard';
const font = urlParams.get("font") || "";
const fontSize = GetIntParam("fontSize", 20);
const maxWidth = GetIntParam("maxWidth", 500);
const textAlignment = urlParams.get('textAlignment') || 'left';

const targetApplication = urlParams.get('targetApplication') || '';
const showAlbumArt = GetBooleanParam("showAlbumArt", true);
const showProgressBar = GetBooleanParam("showProgressBar", true);
const swapArtistTrack = GetBooleanParam("swapArtistTrack", false);
const showPrimary = GetBooleanParam("showPrimary", true);
const showSecondary = GetBooleanParam("showSecondary", true);
const autoHide = GetBooleanParam("autoHide", false);
const displayDuration = GetIntParam("displayDuration", 5);
const showAnimation = urlParams.get('showAnimation') || 'slide-in-from-bottom';
const hideAnimation = urlParams.get('hideAnimation') || 'slide-out-bottom';

/////////////////
// GLOBAL VARS //
/////////////////

let CurrentPlaybackStatus;
let CurrentSong;
let hideTimeout = null;

////////////////
// PAGE SETUP //
////////////////

// Set fonts for the widget
document.body.style.fontFamily = font;
document.body.style.fontSize = `${fontSize}px`;

// Set album art visibility
if (showAlbumArt)
    document.documentElement.style.setProperty('--show-album-art', ``);
else
    document.documentElement.style.setProperty('--show-album-art', `none`);

// Set text alignment
document.documentElement.style.setProperty('--text-alignment', `${textAlignment}`);
switch (textAlignment)
{
    case 'left':
        document.documentElement.style.setProperty('--justify-content', `flex-start`);
        document.documentElement.style.setProperty('--trailing-fade', `linear-gradient(to right, black calc(100% - 1em), transparent 100%)`);
        break;
    case 'center':
        document.documentElement.style.setProperty('--justify-content', `center`);
        document.documentElement.style.setProperty('--trailing-fade', `linear-gradient(to right, black calc(100% - 1em), transparent 100%)`);
        break;
    case 'right':
        document.documentElement.style.setProperty('--justify-content', `flex-end`);
        document.documentElement.style.setProperty('--trailing-fade', ``);
        break;
}



////////////////
// LOAD THEME //
////////////////

// Load the theme
async function LoadTheme()
{
    const response = await fetch(`./themes/${theme}/index.html`);
    const html = await response.text();

    mainContainer.innerHTML = html;
    
    // Swap the CSS file
    const link = document.getElementById('theme-style');
    link.href = `./themes/${theme}/style.css`;
    
    // Load the theme-specific JS
    // We remove the old script tag and add a new one
    const oldScript = document.getElementById('theme-script');
    if (oldScript) oldScript.remove();

    const script = document.createElement('script');
    script.src = `./themes/${theme}/script.js`;
    script.id = 'theme-script';
    document.body.appendChild(script);
}

LoadTheme();



/////////////////
// NOW PLAYING //
/////////////////

async function FetchMedia() {
    try {
        const response = await fetch('http://localhost:5000/now-playing');
        const data = await response.json();

        // Update the UI with the received data
        // console.log(data);
        UpdatePlayerState(data);

    } catch (error) {
        console.error("Failed to connect to Flask media server:", error);
    }
}

// Start polling every 1000 milliseconds
setInterval(FetchMedia, 1000);

// Run once immediately on script load
FetchMedia();



//////////////////////
// HELPER FUNCTIONS //
//////////////////////

function ConvertMillisecondsToMinutesSoThatItLooksBetterOnTheOverlay(time) {
    if (isNaN(time) || time <= 0) return "0:00";

    const totalSeconds = Math.floor(time / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    // Format seconds with a leading zero
    const paddedSeconds = ('0' + seconds).slice(-2);

    if (hours > 0) {
        // Format minutes with a leading zero if hours are present
        const paddedMinutes = ('0' + minutes).slice(-2);
        return `${hours}:${paddedMinutes}:${paddedSeconds}`;
    }

    return `${minutes}:${paddedSeconds}`;
}