////////////////
// PARAMETERS //
////////////////

const queryString = window.location.search;
const urlParams = new URLSearchParams(queryString);

////////////////
// CONSTANTS //
////////////////

const REQUIRED_VERSION = '0.0.1';
const SMTC_BRIDGE_DOWNLOAD_URL = 'https://github.com/nuttylmao/smtc-bridge/releases';

///////////////////
// PAGE ELEMENTS //
///////////////////

const mainContainer = document.getElementById('main-container');

/////////////
// OPTIONS //
/////////////

const smtcBridgeAddress = urlParams.get('smtcBridgeAddress') || '127.0.0.1';
const smtcBridgePort = urlParams.get('smtcBridgePort') || '5000';

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

let smtcBridgePopup = null;
let versionCheckPopup = null;
let errorPopup = null;
let skipVersionCheck = false;
let CurrentPlaybackStatus;
let CurrentSongKey;
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
        const response = await fetch(`http://${smtcBridgeAddress}:${smtcBridgePort}/now-playing`);
        const data = await response.json();

        // Remove the SMTC Bridge popup if it's on screen
        CloseSMTCBridgePopup();

        // Check for errors in the response
        if (data.error) {
            ShowErrorPopup(data.error);
            return;
        }
        else {
            CloseErrorPopup();
        }

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
    const newPopup = SplashscreenPopup(
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
    const newPopup = SplashscreenPopup(
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
    const newPopup = SplashscreenPopup(
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

function ShowErrorPopup(errorMessage) {
    const newPopup = SplashscreenPopup(
        '/.common/resources/smtc-bridge-icon.png',
        'SMTC Bridge Error',
        `I'm a shit programmer and I fucked something up.`,
        `Error: ${errorMessage}`,
        'linear-gradient(0deg, #1b0005 0%, #4f000d 100%)'
    );

    if (newPopup) {
        errorPopup = newPopup;
    }
}

function CloseErrorPopup() {
    if (errorPopup) {
        errorPopup.close();
        errorPopup = null;
    }
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

// Each theme must implement the following
async function UpdatePlayerState(data) {
    // Check if the user has provided a target application in the settings
    const isFiltering = targetApplication && targetApplication.trim() !== "";

    // Search for the session that matches the target application
    const sessionToFind = isFiltering ? targetApplication : data.current_session_id;
    let targetSession = data.sessions.find(s => {
        // If filtering, check if the source_app_id matches the user's string
        if (isFiltering) {
            return s.source_app_id.toLowerCase() === targetApplication.toLowerCase();
        }
        // Otherwise, match the system's current active session ID
        return s.source_app_id === sessionToFind;
    });

    // If a target session was found, update the state of the widget
    if (targetSession) {
        // Extract the relevant properties from the session
        const playbackInfo = targetSession.playback_info;
        const mediaProps = targetSession.media_properties;
        const timelineProps = targetSession.timeline_properties;

        // Calcualte an accent color
        const accentColorPalette = await GetAccentPalette(mediaProps.Thumbnail);

        // 1. Check if playback status has changed and update visibility accordingly
        if (playbackInfo.PlaybackStatus !== CurrentPlaybackStatus) {
            if (playbackInfo.PlaybackStatus === PlaybackStatus.PLAYING)
                SetVisibility(true);
            else
                SetVisibility(false);
            CurrentPlaybackStatus = playbackInfo.PlaybackStatus;
        }
        

        // 2. Check if the track name/artist have changed - this is our indicator that the next track has loaded
        // Only proceed if the player state is actively playing audio
        if (CurrentPlaybackStatus == PlaybackStatus.PLAYING) {
            const newTrackKey = `${mediaProps.Title}-${mediaProps.Artist}-${mediaProps.Thumbnail}`;
            if (newTrackKey !== CurrentSongKey) {
                ChangeTrack(mediaProps, accentColorPalette);        // Now trigger your cross-fade logic here!
                CurrentSongKey = newTrackKey;                       // Update the tracker with the string key
            }
        }

        // 3. Update the progress info
        if (timelineProps) {
            // Parse the Windows timestamp into a JavaScript time object
            const lastUpdateAnchor = Date.parse(timelineProps.LastUpdatedTime.replace(' ', 'T'));

            // Calculate the drift (i.e. how many milliseconds have passed since Windows last updated)
            const driftMs = Date.now() - lastUpdateAnchor;

            // Add that drift to the reported Position
            // Only add drift if the status is PLAYING
            const isPlaying = (targetSession.playback_info.PlaybackStatus === PlaybackStatus.PLAYING);
            const currentPositionMs = isPlaying && timelineProps.EndTime > 0 ? timelineProps.Position + driftMs : timelineProps.Position;

            SetProgressInfo(timelineProps, currentPositionMs, accentColorPalette);
        }
    }
    else {
        SetVisibility(false);
    }
}

function SetVisibility(visible) {
    // Always clear any pending hide timers whenever we change visibility
    if (hideTimeout) {
        clearTimeout(hideTimeout);
        hideTimeout = null;
    }

    if (visible) {
        mainWrapper.style.animation = `${showAnimation} 0.5s ease-out forwards`;

        // Only set a new timer if autoHide is enabled
        if (autoHide) {
            hideTimeout = setTimeout(() => {
                SetVisibility(false);
            }, displayDuration * 1000);
        }
    } else {
        mainWrapper.style.animation = `${hideAnimation} 0.5s ease-out forwards`;
    }
}