///////////////////
// PAGE ELEMENTS //
///////////////////

const mainWrapper = document.getElementById('main-wrapper');
const albumArtContainer = document.getElementById('album-art-container');
const songInfoContainer = document.getElementById('song-info-container');
const albumArtLayer = document.getElementById('album-art-layer');
const albumArtTransition = document.getElementById('album-art-transition-layer');
const trackLabel = document.getElementById('track-label');
const artistLabel = document.getElementById('artist-label');
const progressContainer = document.getElementById('progress-container');
const progressBarFill = document.getElementById('progress-bar-fill');
const currentTimeLabel = document.getElementById('current-time');
const durationLabel = document.getElementById('duration');



////////////////
// PAGE SETUP //
////////////////

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

// If text alignment is 'right', swap the album art to the right hand side too
if (textAlignment == 'right') {
    mainWrapper.style.flexDirection = 'row-reverse';
}



////////////////////
// CORE FUNCTIONS //
////////////////////

async function ChangeTrack(mediaProps) {
    if (trackLabel.innerText != (swapArtistTrack ? mediaProps.Artist : mediaProps.Title))
        trackLabel.style.opacity = "0";
    if (artistLabel.innerText != (swapArtistTrack ? mediaProps.Title : mediaProps.Artist))
        artistLabel.style.opacity = "0";
    albumArtLayer.style.opacity = "0";
    
    // Wait for fade (0.5s), then swap the real text and hide overlay
    setTimeout(() => {
        // trackLabel.innerText = swapArtistTrack ? mediaProps.Artist : mediaProps.Title;
        // artistLabel.innerText = swapArtistTrack ? mediaProps.Title : mediaProps.Artist;        
        SetLabelText('track-label', swapArtistTrack ? mediaProps.Artist : mediaProps.Title);
        SetLabelText('artist-label', swapArtistTrack ? mediaProps.Title : mediaProps.Artist);

        // Extract the image source string (use fallback if Windows has no art)
        const newArtUrl = mediaProps.Thumbnail ?? './images/placeholder.png';

        // Set the image
        albumArtLayer.style.backgroundImage = `url('${newArtUrl}')`;

        trackLabel.style.opacity = "";
        artistLabel.style.opacity = "";
        albumArtLayer.style.opacity = "";

        setTimeout(() => {
            // Set the image
            albumArtTransition.style.backgroundImage = `url('${newArtUrl}')`;
            
            SetVisibility(true); // Show the overlay for a few seconds if autoHide is enabled
        }, 250);
    }, 250);
}

function SetProgressInfo(timelineProps, currentPositionMs, accentColorPalette, playbackStatus) {
    // Update the label using your naming convention
    currentTimeLabel.innerText =
        ConvertMillisecondsToHoursMinutesSecondsSoItLooksBetterAndNotCringe(currentPositionMs);

    durationLabel.innerText =
        ConvertMillisecondsToHoursMinutesSecondsSoItLooksBetterAndNotCringe(timelineProps.EndTime);
        
    // Set the pause overlay visibility based on playback status
    if (playbackStatus === PlaybackStatus.PAUSED)
        albumArtContainer.classList.add('is-paused');
    else
        albumArtContainer.classList.remove('is-paused');

    // Set progressbar
    // Ensure we don't divide by zero or exceed 100%
    const durationMs = timelineProps.EndTime;
    let progressPercent = durationMs > 0 ? (currentPositionMs / durationMs) * 100 : 0;
    progressPercent = Math.min(100, Math.max(0, progressPercent));
    progressBarFill.style.width = `${progressPercent}%`;
    
    if (!useCustomColors)
    {
        document.body.style.setProperty('--accent-color', accentColorPalette.LightVibrant);
        document.body.style.color = accentColorPalette.LightVibrant;
    }
    else
    {
        document.body.style.setProperty('--accent-color', color1);
        document.body.style.color = color1;
    }
}


// Helper function to calculate height of album art
const observer = new ResizeObserver(entries => {
    for (let entry of entries) {
        // Get the accurate rendered height of song-info-container
        const infoHeight = entry.contentRect.height;
        
        // Calculate 125% of that height
        const targetSize = infoHeight * 1.5;

        console.log(targetSize);

        // Apply to album art (setting both width & height ensures it stays square)
        albumArtContainer.style.height = `${targetSize}px`;
        albumArtContainer.style.width = `${targetSize}px`;
    }
});

// Start watching the song info container for size changes
observer.observe(songInfoContainer);