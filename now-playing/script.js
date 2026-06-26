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
const albumArt = urlParams.get('albumArt') || 'show';
const showProgressBar = GetBooleanParam("showProgressBar", true);

const targetApplication = urlParams.get('targetApplication') || '';
const autoHide = GetBooleanParam("autoHide", false);
const displayDuration = GetIntParam("displayDuration", 5);
const showAnimation = urlParams.get('showAnimation') || 'fade';
const hideAnimation = urlParams.get('hideAnimation') || 'fade';

////////////////
// PAGE SETUP //
////////////////

// Set fonts for the widget
document.body.style.fontFamily = font;
document.body.style.fontSize = `${fontSize}px`;



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
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;

    return `${minutes}:${('0' + seconds).slice(-2)}`;
}