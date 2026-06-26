////////////////
// PARAMETERS //
////////////////

const queryString = window.location.search;
const urlParams = new URLSearchParams(queryString);


///////////////////
// PAGE ELEMENTS //
///////////////////

const standardLayout = document.getElementById('standard-layout');
const albumArtContainer = document.getElementById('album-art-container');
const songInfoContainer = document.getElementById('song-info-container');
const albumArtLayer = document.getElementById('album-art-layer');
const albumArtTransition = document.getElementById('album-art-transition-layer');
const backgroundLayer = document.getElementById('background-layer');
const backgroundTransitionLayer = document.getElementById('background-transition-layer');
const trackLabel = document.getElementById('track-label');
const artistLabel = document.getElementById('artist-label');
const progressContainer = document.getElementById('progress-container');
const progressBarFill = document.getElementById('progress-bar-fill');
const currentTimeLabel = document.getElementById('current-time');
const durationLabel = document.getElementById('duration');

/////////////////
// GLOBAL VARS //
/////////////////

let CurrentPlaybackStatus;
let CurrentSong;

/////////////
// OPTIONS //
/////////////

const theme = urlParams.get('theme') || 'standard';
const font = urlParams.get("font") || "";
const fontSize = GetIntParam("fontSize", 20);
const width = GetIntParam("width", 500);
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
standardLayout.style.width = `${width}px`;

// Set album art style
switch (albumArt)
{
    case 'none':
        albumArtContainer.style.display = 'none';
        break;
    case 'show':
        albumArtContainer.style.display = '';
        break;
    case 'spinny':
        break;
}

// Set progress bar visibility
if (!showProgressBar)
    progressContainer.style.display = 'none';


/////////////////
// NOW PLAYING //
/////////////////

async function FetchMedia() {
    try {
        const response = await fetch('http://localhost:5000/now-playing');
        const data = await response.json();

        // Update the UI with the received data
        console.log(data);
        UpdateUI(data);

    } catch (error) {
        console.error("Failed to connect to Flask media server:", error);
    }
}

function UpdateUI(data) {
    // Check if the user has provided a specific app in the settings
    const isFiltering = targetApplication && targetApplication.trim() !== "";

    // Decide which ID to look for
    const sessionToFind = isFiltering ? targetApplication : data.current_session_id;

    // Now perform the find
    let targetSession = data.sessions.find(s => {
        // If filtering, check if the source_app_id matches the user's string
        if (isFiltering) {
            return s.source_app_id.toLowerCase() === targetApplication.toLowerCase();
        }
        // Otherwise, match the system's current active session ID
        return s.source_app_id === sessionToFind;
    });

    if (targetSession) {
        // Extract the relevant properties from the session
        const playbackInfo = targetSession.playback_info;
        const mediaProps = targetSession.media_properties;
        const timelineProps = targetSession.timeline_properties;

        // Check if playback status has changed and update visibility accordingly
        if (playbackInfo.PlaybackStatus !== CurrentPlaybackStatus) {
            if (playbackInfo.PlaybackStatus === PlaybackStatus.PLAYING)
                SetVisibility(true);
            else
                SetVisibility(false);
            CurrentPlaybackStatus = playbackInfo.PlaybackStatus;
        }

        // Save current media properties - we can use this to detect track changes and trigger transition animations in the future
        const newTrackKey = `${mediaProps.Title}|${mediaProps.Artist}`;
        if (newTrackKey !== CurrentSong) {
            ChangeTrack(mediaProps);        // Now trigger your cross-fade logic here!
            CurrentSong = newTrackKey;      // Update the tracker with the string key
        }

        if (timelineProps)
        {
            // Parse the Windows timestamp into a JavaScript time object
            const lastUpdateAnchor = Date.parse(timelineProps.LastUpdatedTime.replace(' ', 'T'));

            // Calculate the drift: how many milliseconds have passed since Windows last spoke?
            const driftMs = Date.now() - lastUpdateAnchor;

            // Add that drift to the reported Position
            // Only add drift if the status is 4 (Playing)
            const isPlaying = (targetSession.playback_info.PlaybackStatus === 4);
            const currentPositionMs = isPlaying && timelineProps.EndTime > 0 ? timelineProps.Position + driftMs : timelineProps.Position;

            // Update the label using your naming convention
            currentTimeLabel.innerText =
                ConvertMillisecondsToMinutesSoThatItLooksBetterOnTheOverlay(currentPositionMs);

            durationLabel.innerText =
                ConvertMillisecondsToMinutesSoThatItLooksBetterOnTheOverlay(timelineProps.EndTime);

            // Set progressbar
            // Ensure we don't divide by zero or exceed 100%
            const durationMs = timelineProps.EndTime;
            let progressPercent = durationMs > 0 ? (currentPositionMs / durationMs) * 100 : 0;
            progressPercent = Math.min(100, Math.max(0, progressPercent));
            progressBarFill.style.width = `${progressPercent}%`;
            progressBarFill.style.setProperty('--accent-color', mediaProps.AccentColor);
        }
    }
    else
    {
        standardLayout.style.opacity = "0";
    }
}

// Start polling every 1000 milliseconds
setInterval(FetchMedia, 1000);

// Run once immediately on script load
FetchMedia();



//////////////////////
// HELPER FUNCTIONS //
//////////////////////

let hideTimeout = null; // Store the timer in a global/outer variable

function SetVisibility(visible) {
    // Always clear any pending hide timers whenever we change visibility
    if (hideTimeout) {
        clearTimeout(hideTimeout);
        hideTimeout = null;
    }

    if (visible) {
        standardLayout.style.animation = `${showAnimation} 0.5s ease-out forwards`;
        
        // Only set a new timer if autoHide is enabled
        if (autoHide) {
            hideTimeout = setTimeout(() => {
                SetVisibility(false);
            }, displayDuration * 1000);
        }
    } else {
        standardLayout.style.animation = `${hideAnimation} 0.5s ease-out forwards`;
    }
}

async function ChangeTrack(mediaProps) {
    // Fade in the overlay (shows the new text)
    trackLabel.style.opacity = "0";
    artistLabel.style.opacity = "0";
    backgroundLayer.style.opacity = "0";
    albumArtLayer.style.opacity = "0";
    
    // Wait for fade (0.5s), then swap the real text and hide overlay
    setTimeout(() => {
        trackLabel.innerText = mediaProps.Title;
        artistLabel.innerText = mediaProps.Artist;        

        // Extract the image source string (use fallback if Windows has no art)
        const newArtUrl = mediaProps.Base64Image;
        const accent = mediaProps.AccentColor || "#ffffff";

        // Set the image
        backgroundLayer.style.backgroundImage = `url('${newArtUrl}')`;
        albumArtLayer.style.backgroundImage = `url('${newArtUrl}')`;

        // Apply a tint: Use 30% opacity of the accent color + a dark overlay for contrast
        // 'rgba(0,0,0,0.6)' ensures the text stays readable
        backgroundLayer.style.backgroundColor = accent + "80"; // 80 is 50% opacity in hex

        trackLabel.style.opacity = "";
        artistLabel.style.opacity = "";
        backgroundLayer.style.opacity = "";
        albumArtLayer.style.opacity = "";

        setTimeout(() => {
            // Set the image
            backgroundTransitionLayer.style.backgroundImage = `url('${newArtUrl}')`;
            albumArtTransition.style.backgroundImage = `url('${newArtUrl}')`;

            // Apply a tint: Use 30% opacity of the accent color + a dark overlay for contrast
            // 'rgba(0,0,0,0.6)' ensures the text stays readable
            backgroundTransitionLayer.style.backgroundColor = accent + "80"; // 80 is 50% opacity in hex

            SetVisibility(true); // Show the overlay for a few seconds if autoHide is enabled
        }, 250);
    }, 250);
}

window.addEventListener('resize', syncHeights);
syncHeights();

function syncHeights() {
    requestAnimationFrame(() => {        
        const height = songInfoContainer.offsetHeight;
        console.log(height);
        if (height > 0) {
            albumArtContainer.style.height = `${height}px`;
        }
    });
}

function ConvertMillisecondsToMinutesSoThatItLooksBetterOnTheOverlay(time) {
    if (isNaN(time) || time <= 0) return "0:00";

    const totalSeconds = Math.floor(time / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;

    return `${minutes}:${('0' + seconds).slice(-2)}`;
}