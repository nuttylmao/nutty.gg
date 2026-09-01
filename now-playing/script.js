////////////////
// PARAMETERS //
////////////////

const queryString = window.location.search;
const urlParams = new URLSearchParams(queryString);

////////////////
// CONSTANTS //
////////////////

const REQUIRED_VERSION = '1.0.0';
const SMTC_BRIDGE_DOWNLOAD_URL = 'https://github.com/nuttylmao/smtc-bridge/releases';
let VersionChecked = false;

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
const verticalAlignment = urlParams.get('verticalAlignment') || 'align-to-center';
const textAlignment = urlParams.get('textAlignment') || 'left';
const useCustomColors = GetBooleanParam("useCustomColors", false);
const color1 = urlParams.get('color1') || '#ffffff';
const color2 = urlParams.get('color2') || '#1d1d1d';

const autoHide = GetBooleanParam("autoHide", false);
const showWhilePaused = GetBooleanParam("showWhilePaused", false);
const includedApplications = urlParams.get('includedApplications') || '';
const excludedApplications = urlParams.get('excludedApplications') || '';
const showAlbumArt = GetBooleanParam("showAlbumArt", true);
const showProgressBar = GetBooleanParam("showProgressBar", true);
const swapArtistTrack = GetBooleanParam("swapArtistTrack", false);
const showPrimary = GetBooleanParam("showPrimary", true);
const showSecondary = GetBooleanParam("showSecondary", true);
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
if (font)
	document.body.style.fontFamily = `'${font}'`;
document.body.style.fontSize = `${fontSize}px`;

// Set album art visibility
if (showAlbumArt)
    document.documentElement.style.setProperty('--show-album-art', ``);
else
    document.documentElement.style.setProperty('--show-album-art', `none`);

// Set text alignment
document.documentElement.style.setProperty('--text-alignment', `${textAlignment}`);

// Set vertical alignment
switch (verticalAlignment) {
    case 'align-to-top':
        mainContainer.style.alignItems = 'flex-start';
        break;
    case 'align-to-center':
        mainContainer.style.alignItems = 'center';
        break;
    case 'align-to-bottom':
        mainContainer.style.alignItems = 'flex-end';
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
        if (!VersionChecked) {
            CheckSMTCBridgeVersion(data.app_version);
            VersionChecked = true;
        }

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
    setTimeout(() => {
        // Start polling every 1000 milliseconds
        setInterval(FetchMedia, 1000);

        // Run once immediately on script load
        FetchMedia();
    }, 100);
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
    // Parse and clean settings arrays
    const includedList = includedApplications 
        ? includedApplications.split(',').map(app => app.trim().toLowerCase()).filter(Boolean)
        : [];
        
    const excludedList = excludedApplications 
        ? excludedApplications.split(',').map(app => app.trim().toLowerCase()).filter(Boolean)
        : [];

    // Filter out any sessions belonging to excluded apps
    const validSessions = data.sessions.filter(s => {
        const appId = (s.source_app_id || "").toLowerCase();
        // Check if the source app ID matches any exclusion entry
        const isExcluded = excludedList.some(excluded => appId.includes(excluded));
        return !isExcluded;
    });

    let targetSession = null;

    // Priority Check: If user specified included apps, hunt for them in exact order
    if (includedList.length > 0) {
        // Step 1: Look through the included list for an app that is CURRENTLY PLAYING
        for (const targetApp of includedList) {
            targetSession = validSessions.find(s => {
                const matchesApp = (s.source_app_id || "").toLowerCase().includes(targetApp);
                const isPlaying = s.playback_info && (s.playback_info.PlaybackStatus === PlaybackStatus.PLAYING || (showWhilePaused && s.playback_info.PlaybackStatus === PlaybackStatus.PAUSED));
                return matchesApp && isPlaying;
            });
            if (targetSession) break;
        }

        // Step 2: If none of the included apps are playing, fall back to ANY session in the included list (even if paused)
        if (!targetSession) {
            for (const targetApp of includedList) {
                targetSession = validSessions.find(s => 
                    (s.source_app_id || "").toLowerCase().includes(targetApp)
                );
                if (targetSession) break;
            }
        }
    } else {
        // Fallback when no included list is provided:
        // Priority 1: Check Windows' current focused session ID first
        if (data.current_session_id) {
            targetSession = validSessions.find(s => s.source_app_id === data.current_session_id);
        }

        // Priority 2: If the current session isn't available/valid, find any session that is currently playing
        if (!targetSession || targetSession.playback_info.PlaybackStatus !== PlaybackStatus.PLAYING) {
            const playingSession = validSessions.find(s => s.playback_info && (s.playback_info.PlaybackStatus === PlaybackStatus.PLAYING || (showWhilePaused && s.playback_info.PlaybackStatus === PlaybackStatus.PAUSED)));
            if (playingSession) {
                targetSession = playingSession;
            }
        }

        // Priority 3: Ultimate fallback to the first valid session available if nothing else matched
        if (!targetSession && validSessions.length > 0) {
            targetSession = validSessions[0];
        }
    }

    // If a target session was found, update the state of the widget
    if (targetSession) {
        // Extract the relevant properties from the session
        const playbackInfo = targetSession.playback_info;
        const mediaProps = targetSession.media_properties;
        const timelineProps = targetSession.timeline_properties;

        // Calcualte an accent color
        const accentColorPalette = await GetAccentPalette(mediaProps.Thumbnail ?? './images/placeholder.png');

        // 1. Check if playback status has changed and update visibility accordingly
        if (playbackInfo.PlaybackStatus !== CurrentPlaybackStatus) {
            if (playbackInfo.PlaybackStatus === PlaybackStatus.PLAYING || (showWhilePaused && playbackInfo.PlaybackStatus === PlaybackStatus.PAUSED))
                SetVisibility(true);
            else
                SetVisibility(false);
            CurrentPlaybackStatus = playbackInfo.PlaybackStatus;
        }
        

        // 2. Check if the track name/artist have changed - this is our indicator that the next track has loaded
        // Only proceed if the player state is actively playing audio
        if (CurrentPlaybackStatus == PlaybackStatus.PLAYING || (showWhilePaused && CurrentPlaybackStatus == PlaybackStatus.PAUSED)) {
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

            SetProgressInfo(timelineProps, currentPositionMs, accentColorPalette, targetSession.playback_info.PlaybackStatus);
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

// MARQUEE LOGIC
// This is a more advanced marquee implementation that calculates the overflow distance and adjusts the scroll speed accordingly
const labelData = new Map();

function SetLabelText(elementId, text) {
    const label = document.getElementById(elementId);
    if (!label) return;

    labelData.set(elementId, text);
    ApplyMarquee(label, text);

    // Keep it responsive on container resize
    if (!label._resizeObserver) {
        label._resizeObserver = new ResizeObserver(() => {
            const currentText = labelData.get(elementId);
            if (currentText) ApplyMarquee(label, currentText);
        });
        label._resizeObserver.observe(label);
    }
}

// Adjust this value to change scroll speed (pixels per second)
const SCROLL_SPEED_PX_PER_SEC = 30; 
const PAUSE_SEC = 5;

function ApplyMarquee(label, text) {
    label.classList.remove('is-overflowing');
    label.innerHTML = `<span class="scroll-content"></span>`;
    label.querySelector('.scroll-content').textContent = text;
    
    const scrollContent = label.querySelector('.scroll-content');
    
    const textWidth = scrollContent.scrollWidth;
    const containerWidth = label.clientWidth;
    const overflowDistance = textWidth - containerWidth;

    if (overflowDistance > 0) {
        const distancePercent = (overflowDistance / textWidth) * 100;
        
        // --- CONSTANT TIMINGS ---
        const travelSec = overflowDistance / SCROLL_SPEED_PX_PER_SEC;
        const pauseSec = PAUSE_SEC; // Always constant at each end
        
        const totalSec = (travelSec * 2) + (pauseSec * 2);
        const totalMs = totalSec * 1000;
        
        const p1 = (pauseSec / totalSec);
        const p2 = ((pauseSec + travelSec) / totalSec);
        const p3 = ((pauseSec * 2 + travelSec) / totalSec);

        scrollContent.style.setProperty('--scroll-distance', `-${distancePercent}%`);

        // 1. Animate Text Translation
        scrollContent.animate([
            // Stay at start during pause 1 (linear/instant transition into movement)
            { transform: 'translateX(0%)', offset: 0, easing: 'linear' },
            { transform: 'translateX(0%)', offset: p1, easing: 'ease-in-out' }, // <--- Easing starts HERE as it leaves the edge
            
            // Travel to the far end with smooth ease-in-out
            { transform: `translateX(-${distancePercent}%)`, offset: p2, easing: 'linear' }, // <--- Easing ends HERE as it arrives
            
            // Stay at far end during pause 2
            { transform: `translateX(-${distancePercent}%)`, offset: p3, easing: 'ease-in-out' }, // <--- Easing starts HERE for return trip
            
            // Return to start with smooth ease-in-out
            { transform: 'translateX(0%)', offset: 1, easing: 'linear' } // <--- Easing ends HERE back at start
        ], {
            duration: totalMs,
            iterations: Infinity
        });

        // 2. Animate Mask Variables simultaneously to keep soft edges synced
        const maxOffset = 1;
        // Dynamically scale buffer so it never overlaps text segments if overflow is small
        const fadeBuffer = Math.min(0.02, (p2 - p1) / 4);

        const off0 = 0;
        const off1 = p1;
        const off2 = Math.min(p1 + fadeBuffer, p2);
        const off3 = Math.max(off2, p2 - fadeBuffer);
        const off4 = p2;
        const off5 = p3;
        const off6 = Math.min(p3 + fadeBuffer, maxOffset);
        const off7 = 1;

        label._anim = label.animate([
            { '--mask-left': 'black', '--mask-right': 'transparent', offset: off0 },
            { '--mask-left': 'black', '--mask-right': 'transparent', offset: off1 },
            { '--mask-left': 'transparent', '--mask-right': 'transparent', offset: off2 },
            { '--mask-left': 'transparent', '--mask-right': 'transparent', offset: off3 },
            { '--mask-left': 'transparent', '--mask-right': 'black', offset: off4 },
            { '--mask-left': 'transparent', '--mask-right': 'black', offset: off5 },
            { '--mask-left': 'transparent', '--mask-right': 'transparent', offset: off6 },
            { '--mask-left': 'black', '--mask-right': 'transparent', offset: off7 }
        ], {
            duration: totalMs,
            iterations: Infinity
        });

        label.classList.add('is-overflowing');
    }
}