///////////////////
// PAGE ELEMENTS //
///////////////////

const mainWrapper = document.getElementById('main-wrapper');
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



////////////////
// PAGE SETUP //
////////////////

// This theme has variants
const themeVariant = window.ThemeVariant ? window.ThemeVariant : '';

// Set property visibility
trackLabel.style.display = showPrimary ? '' : 'none';
artistLabel.style.display = showSecondary ? '' : 'none';

// Set container width
if (maxWidth > 0)
    mainWrapper.style.width = `${maxWidth}px`;
else
    mainWrapper.style.width = `100%`;

// Set progress bar visibility
if (!showProgressBar)
    progressContainer.style.display = 'none';

// Theme specific setup
switch (themeVariant) {
    case "matte":
    case "matte-dark":
        backgroundLayer.style.display = 'none';
        backgroundTransitionLayer.style.display = 'none';
        break;
}



////////////////////
// CORE FUNCTIONS //
////////////////////

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
            const newTrackKey = `${mediaProps.Title}|${mediaProps.Artist}`;
            if (newTrackKey !== CurrentSong) {
                ChangeTrack(mediaProps, accentColorPalette);       // Now trigger your cross-fade logic here!
                CurrentSong = newTrackKey;                  // Update the tracker with the string key
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
            progressBarFill.style.setProperty('--accent-color', accentColorPalette.LightVibrant);
            switch (themeVariant) {
                case "matte":
                    progressBarFill.style.setProperty('--accent-color', accentColorPalette.DarkVibrant);
                    break;
                case "matte-dark":
                default:
                    progressBarFill.style.setProperty('--accent-color', accentColorPalette.LightVibrant);
                    break;
            }
        }
    }
    else {
        SetVisibility(false);
    }
}



//////////////////////
// HELPER FUNCTIONS //
//////////////////////

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

async function ChangeTrack(mediaProps, accentColorPalette) {
    // Fade in the overlay (shows the new text)
    trackLabel.style.opacity = "0";
    artistLabel.style.opacity = "0";
    backgroundLayer.style.opacity = "0";
    albumArtLayer.style.opacity = "0";

    // Wait for fade (0.5s), then swap the real text and hide overlay
    setTimeout(async () => {
        trackLabel.innerText = swapArtistTrack ? mediaProps.Artist : mediaProps.Title;
        artistLabel.innerText = swapArtistTrack ? mediaProps.Title : mediaProps.Artist;

        switch (themeVariant) {
            case "matte":
                document.body.style.color = accentColorPalette.DarkVibrant;
                break;
            case "matte-dark":
                document.body.style.color = accentColorPalette.LightVibrant;
                break;
        }

        // Extract the image source string (use fallback if Windows has no art)
        const newArtUrl = mediaProps.Thumbnail;

        // Set the image
        switch (themeVariant) {
            case "matte":
                songInfoContainer.style.backgroundColor = accentColorPalette.LightVibrant;
                break;
            case "matte-dark":
                songInfoContainer.style.backgroundColor = `color-mix(in srgb, ${accentColorPalette.DarkMuted}, black 60%)`;
                break;
        }
        backgroundLayer.style.backgroundImage = `url('${newArtUrl}')`;
        albumArtLayer.style.backgroundImage = `url('${newArtUrl}')`;

        // Apply a tint: Use 30% opacity of the accent color + a dark overlay for contrast
        // 'rgba(0,0,0,0.6)' ensures the text stays readable
        // backgroundLayer.style.backgroundColor = accentColorPalette.LightVibrant + "80"; // 80 is 50% opacity in hex

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
            // backgroundTransitionLayer.style.backgroundColor = accentColorPalette.LightVibrant + "80"; // 80 is 50% opacity in hex

            SetVisibility(true); // Show the overlay for a few seconds if autoHide is enabled
        }, 250);
    }, 250);
}

// function SetAlbumArtSize() {
//     const height = songInfoContainer.offsetHeight;
//     albumArtContainer.style.height = `${height}px`;
//     albumArtContainer.style.width = `${height}px`;
// }

// requestAnimationFrame(() => {
//     SetAlbumArtSize();
// });