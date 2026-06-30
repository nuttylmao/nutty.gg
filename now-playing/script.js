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

const REQUIRED_VERSION = '0.0.1';
const SMTC_BRIDGE_DOWNLOAD_URL = 'https://github.com/nuttylmao/smtc-bridge/releases';
let smtcBridgePopup = null;
let versionCheckPopup = null;
let skipVersionCheck = false;
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
    // Check if the theme inherits from a base theme
    let baseTheme = theme;
    try {
        const response = await fetch(`./themes/${theme}/inherits.json`);
        if (response.ok) {
            const config = await response.json();
            baseTheme = config['base-theme'];
        }
    } catch (e) {
        // No inheritance file found, assume it is a base theme
    }
    
    // Fetch the HTML structure from the base theme folder
    const response = await fetch(`./themes/${baseTheme}/index.html`);
    const html = await response.text();

    mainContainer.innerHTML = html;
    
    // Swap the CSS file
    const link = document.getElementById('theme-style');
    link.href = `./themes/${baseTheme}/style.css`;
    
    // Load the theme-specific JS
    // We remove the old script tag and add a new one
    const oldScript = document.getElementById('theme-script');
    if (oldScript) oldScript.remove();

    const script = document.createElement('script');
    script.src = `./themes/${baseTheme}/script.js`;
    script.id = 'theme-script';
    document.body.appendChild(script);

    // If the base theme != theme, that means this is a variant, so load the variant's CSS
    if (baseTheme != theme)
    {
        // Load the variant CSS
        const baseLink = document.createElement('link');
        baseLink.rel = 'stylesheet';
        baseLink.className = 'theme-style'; // Use class for easy batch removal
        baseLink.href = `./themes/${theme}/style.css`;
        document.head.appendChild(baseLink);

        window.ThemeVariant = theme;
    }
}

LoadTheme();



/////////////////
// NOW PLAYING //
/////////////////

async function FetchMedia() {
    try {
        const response = await fetch('http://localhost:5000/now-playing');
        const data = await response.json();

        // Remove the SMTC Bridge popup if it's on screen
        CloseSMTCBridgePopup();

        // Check the SMTC Bridge version
        CheckSMTCBridgeVersion(data.app_version);

        // Update the UI with the received data
        // console.log(data);
        UpdatePlayerState(data);
    } catch (error) {
        console.error("Failed to connect to Flask media server:", error);

        // Show a popup to instruct the user to install SMTC Bridge
        ShowWaitingForSMTCBridgePopup();
    }
}

window.addEventListener('DOMContentLoaded', () => {
    // Start polling every 1000 milliseconds
    setInterval(FetchMedia, 1000);

    // Run once immediately on script load
    FetchMedia();
});



////////////
// POPUPS //
////////////

function ShowWaitingForSMTCBridgePopup() {
    const newPopup = showPopup(
        '/.common/resources/smtc-bridge-icon.png', 
        'Waiting for SMTC Bridge', 
        'Please launch SMTC Bridge',
        '', // Attribute text
        'linear-gradient(0deg, #111111 0%, #11001f 100%)',
        { 
            text: 'Download', 
            action: () => { 
                window.open(SMTC_BRIDGE_DOWNLOAD_URL, "_blank");
            } 
        }
    );

    if (newPopup) {
        smtcBridgePopup = newPopup;
    }
}


function ShowSMTCBridgeUpdateRequiredPopup(installedVersion) {
    const newPopup = showPopup(
        '/.common/resources/smtc-bridge-icon.png',
        'Update Required',
        'Your version of SMTC Bridge is out of date.',
        `<b>Installed Version: ${installedVersion}</b><br><b>New Version: ${REQUIRED_VERSION}</b>`,
        'linear-gradient(0deg, #1b0005 0%, #4f000d 100%)',
        { 
            text: 'Download', 
            action: () => { 
                window.open(SMTC_BRIDGE_DOWNLOAD_URL, "_blank");
            } 
        }
    );

    if (newPopup) {
        versionCheckPopup = newPopup;
    }
}

function ShowSMTCBridgeUpdateAvailablePopup(installedVersion) {
    const newPopup = showPopup(
        '/.common/resources/smtc-bridge-icon.png',
        'Update Available',
        'A new version of SMTC Bridge is available.',
        `<b>Installed Version: ${installedVersion}</b><br><b>New Version: ${REQUIRED_VERSION}</b>`,
        'linear-gradient(0deg, #2a004f 0%, #4f2675 100%)',
        { 
            text: 'Download', 
            action: () => { 
                window.open(SMTC_BRIDGE_DOWNLOAD_URL, "_blank");
            } 
        }
    );

    if (newPopup) {
        versionCheckPopup = newPopup;
    }

    setTimeout(() => {
        CloseVersionCheckPopup();
    }, 10000);
}

function CloseSMTCBridgePopup()
{
    if (smtcBridgePopup) {
        smtcBridgePopup.close();
        smtcBridgePopup = null;
    }
}

function CloseVersionCheckPopup()
{
    if (versionCheckPopup) {
        versionCheckPopup.close();
        versionCheckPopup = null;
    }
}

//////////////////////
// HELPER FUNCTIONS //
//////////////////////

function CheckSMTCBridgeVersion(installedVersion) {
    // Check that the server/client are on the same SMTC Bridge version
    // const VersionStatus = VersionCheck(REQUIRED_VERSION, installedVersion);
    const versionStatus = VersionCheck(REQUIRED_VERSION, installedVersion);
    
    if (skipVersionCheck)
        return;

    switch (versionStatus)
    {
        case 'incompatible':
            ShowSMTCBridgeUpdateRequiredPopup(installedVersion);
            skipVersionCheck = false;
            break;
        case 'soft-warning':
            ShowSMTCBridgeUpdateAvailablePopup(installedVersion);
            skipVersionCheck = true;
            break;
        default:
            CloseVersionCheckPopup();
            break;
    }
}

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