///////////////////
// PAGE ELEMENTS //
///////////////////

const mainWrapper = document.getElementById('main-wrapper');
const albumArtContainer = document.getElementById('album-art-container');
// const songInfoContainer = document.getElementById('song-info-container');
const albumArtLayer = document.getElementById('album-art-layer');
const albumArtTransition = document.getElementById('album-art-transition-layer');
const progressCircle = document.getElementById('progress-pie-circle');

///////////////
// CONSTANTS //
///////////////

const circumference = 157.1;




////////////////
// PAGE SETUP //
////////////////

// Set container width
if (maxWidth > 0)
    mainWrapper.style.width = `${maxWidth}px`;
else
    mainWrapper.style.width = `100%`;

// Set progress bar visibility
if (!showProgressBar)
    progressCircle.style.display = 'none';



////////////////////
// CORE FUNCTIONS //
////////////////////

async function ChangeTrack(mediaProps) {
    // // Fade in the overlay (shows the new text)
    albumArtLayer.style.opacity = "0";
    
    // Wait for fade (0.5s), then swap the real text and hide overlay
    setTimeout(() => {

        // Extract the image source string (use fallback if Windows has no art)
        const newArtUrl = mediaProps.Thumbnail ?? './images/placeholder.png';

        // Set the image
        albumArtLayer.style.backgroundImage = `url('${newArtUrl}')`;
        albumArtLayer.style.opacity = "";

        setTimeout(() => {
            // Set the image
            albumArtTransition.style.backgroundImage = `url('${newArtUrl}')`;
            SetVisibility(true); // Show the overlay for a few seconds if autoHide is enabled
        }, 250);
    }, 250);
}

function SetProgressInfo(timelineProps, currentPositionMs, accentColorPalette) {
    // Set progressbar
    // Ensure we don't divide by zero or exceed 100%
    const durationMs = timelineProps.EndTime;
    progressPercent = durationMs > 0 ? (currentPositionMs / durationMs) * 100 : 0;
    progressPercent = Math.min(100, Math.max(0, progressPercent));
    if (!useCustomColors)
        document.documentElement.style.setProperty('--accent-color', `${accentColorPalette.LightVibrant}`);
    else
        document.documentElement.style.setProperty('--accent-color', color1);
    
    // Calculate the offset. 
    // 0% progress = 157.1 offset. 100% progress = 0 offset.
    const offset = circumference - (progressPercent / 100) * circumference;
    progressCircle.style.strokeDashoffset = offset;
}