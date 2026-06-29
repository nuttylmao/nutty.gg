///////////////////
// PAGE ELEMENTS //
///////////////////

const mainWrapper = document.getElementById('main-wrapper');
const albumArtContainer = document.getElementById('album-art-container');
const songInfoContainer = document.getElementById('song-info-container');
const progressBar = document.getElementById('progress-bar');
const trackLabel = document.getElementById('track-label');
const artistLabel = document.getElementById('artist-label');
const trackLabelBackground = document.getElementById('track-label-background');
const artistLabelBackground = document.getElementById('artist-label-background');
const songLabel = document.getElementById('song-label');
const songLabelBackground = document.getElementById('song-label-background');



////////////////
// PAGE SETUP //
////////////////

// Set property visibility
trackLabel.style.display = showPrimary ? '' : 'none';
artistLabel.style.display = showSecondary ? '' : 'none';
trackLabelBackground.style.display = showPrimary ? '' : 'none';
artistLabelBackground.style.display = showSecondary ? '' : 'none';

// Set container width
if (maxWidth > 0)
    mainWrapper.style.width = `${maxWidth}px`;
else
    mainWrapper.style.width = `100%`;



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
        if (CurrentPlaybackStatus == PlaybackStatus.PLAYING)
        {
            const newTrackKey = `${mediaProps.Title}|${mediaProps.Artist}`;
            if (newTrackKey !== CurrentSong) {
                ChangeTrack(mediaProps, accentColorPalette);        // Now trigger your cross-fade logic here!
                CurrentSong = newTrackKey;      // Update the tracker with the string key
            }
        }

        // 3. Update the progress info
        if (timelineProps)
        {
            // Parse the Windows timestamp into a JavaScript time object
            const lastUpdateAnchor = Date.parse(timelineProps.LastUpdatedTime.replace(' ', 'T'));

            // Calculate the drift (i.e. how many milliseconds have passed since Windows last updated)
            const driftMs = Date.now() - lastUpdateAnchor;

            // Add that drift to the reported Position
            // Only add drift if the status is PLAYING
            const isPlaying = (targetSession.playback_info.PlaybackStatus === PlaybackStatus.PLAYING);
            const currentPositionMs = isPlaying && timelineProps.EndTime > 0 ? timelineProps.Position + driftMs : timelineProps.Position;

            // Set progressbar
            // Ensure we don't divide by zero or exceed 100%
            const durationMs = timelineProps.EndTime;
            let progressPercent = durationMs > 0 ? (currentPositionMs / durationMs) * 100 : 0;
            progressPercent = Math.min(100, Math.max(0, progressPercent));

            // Calculate how much needs to be hidden (the right-side offset)
            const clipRight = 100 - progressPercent;

            // Update the clip-path
            progressBar.style.clipPath = `inset(0 ${clipRight}% 0 0)`;
            
            // const clipRight = progressPercent;
            // progressBar.style.maskImage = `linear-gradient(to right, black calc(${clipRight}% - 4em), transparent ${clipRight}%)`
        }
    }
    else
    {
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

async function ChangeTrack(mediaProps, accentColor) {
    // Fade in the overlay (shows the new text)
    songLabel.style.opacity = "0";
    songLabelBackground.style.opacity = "0";
    
    // Wait for fade (0.5s), then swap the real text and hide overlay
    setTimeout(() => {
        trackLabel.innerText = swapArtistTrack ? mediaProps.Artist : mediaProps.Title;
        artistLabel.innerText = swapArtistTrack ? mediaProps.Title : mediaProps.Artist;
        trackLabelBackground.innerText = swapArtistTrack ? mediaProps.Artist : mediaProps.Title;
        artistLabelBackground.innerText = swapArtistTrack ? mediaProps.Title : mediaProps.Artist;

        // Extract the image source string (use fallback if Windows has no art)
        
        // Set the pill color
        songInfoContainer.style.background = accentColor.DarkMuted + "80";
        progressBar.style.background = accentColor.LightVibrant;
        songLabel.style.color = accentColor.DarkVibrant;
        songLabelBackground.style.color = accentColor.LightVibrant;

        songLabel.style.opacity = "";
        songLabelBackground.style.opacity = "";

        // // If text is too long, add a marquee
        // requestAnimationFrame(() => {
        //     const containerWidth = songInfoContainer.clientWidth;
        //     const textWidth = trackLabel.clientWidth + artistLabel.clientWidth;
            

        //     console.log(containerWidth);
        //     console.log(textWidth);

        //     if (textWidth > containerWidth) {
        //         songLabel.classList.add('scrolling-text');
        //         songLabelBackground.classList.add('scrolling-text');
        //         // Calculate speed: 50 pixels per second is a good standard
        //         const duration = (textWidth + containerWidth) / 50; 
        //         console.log(duration);
        //         document.documentElement.style.setProperty('--scroll-duration', `${duration}s`);
        //         document.documentElement.style.setProperty('--container-width', `${textWidth}px`);
        //         document.documentElement.style.setProperty('--text-width', `-${textWidth}px`);
        //     } else {
        //         songLabel.classList.remove('scrolling-text');
        //         songLabelBackground.classList.remove('scrolling-text');
        //     }
        // });

        setTimeout(() => {
            SetVisibility(true); // Show the overlay for a few seconds if autoHide is enabled
        }, 250);
    }, 250);
}