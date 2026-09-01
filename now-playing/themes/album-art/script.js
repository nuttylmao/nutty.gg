///////////////////
// PAGE ELEMENTS //
///////////////////

const mainWrapper = document.getElementById('main-wrapper');
const songInfoContainer = document.getElementById('song-info-container');
const albumArtContainer = document.getElementById('album-art-container');
const albumArtLayer = document.getElementById('album-art-layer');
const albumArtTransition = document.getElementById('album-art-transition-layer');
const textInfoContainer = document.getElementById('text-info-container');
const trackLabel = document.getElementById('track-label');
const artistLabel = document.getElementById('artist-label');
const progressBar = document.getElementById('progress-bar');



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

mainWrapper.style.height = `${mainWrapper.style.clientWidth}px`;

// Set progress bar visibility
if (!showProgressBar)
    progressBar.style.display = 'none';



////////////////////
// CORE FUNCTIONS //
////////////////////

async function ChangeTrack(mediaProps, accentColorPalette) {
    // Fade in the overlay (shows the new text)
    if (trackLabel.innerText != (swapArtistTrack ? mediaProps.Artist : mediaProps.Title))
        trackLabel.style.opacity = "0";
    if (artistLabel.innerText != (swapArtistTrack ? mediaProps.Title : mediaProps.Artist))
        artistLabel.style.opacity = "0";
    albumArtLayer.style.opacity = "0";
    
    // Wait for fade (0.5s), then swap the real text and hide overlay
    setTimeout(() => {
        SetLabelText('track-label', swapArtistTrack ? mediaProps.Artist : mediaProps.Title);
        SetLabelText('artist-label', swapArtistTrack ? mediaProps.Title : mediaProps.Artist);

        // Extract the image source string (use fallback if Windows has no art)
        const newArtUrl = mediaProps.Thumbnail ?? './images/placeholder.png';

        // Set the image
        albumArtLayer.style.backgroundImage = `url('${newArtUrl}')`;

        // Apply a tint
        if (!useCustomColors)
        {
            const baseColor = accentColorPalette.DarkMuted;
            // Solid from 0% to 30%, then fading to 0% opacity at 100%
            textInfoContainer.style.background = `linear-gradient(to top, ${baseColor}FF 0%, ${baseColor}FF 10%, ${baseColor}00 100%)`;
            if (!showAlbumArt)
                songInfoContainer.style.background = accentColorPalette.LightVibrant;

            // Apply text color
            document.body.style.color = accentColorPalette.LightVibrant;
        }
        else
        {
            const baseColor = color2;
            // Solid from 0% to 30%, then fading to 0% opacity at 100%
            textInfoContainer.style.background = `linear-gradient(to top, ${baseColor}FF 0%, ${baseColor}FF 10%, ${baseColor}00 100%)`;
            if (!showAlbumArt)
                songInfoContainer.style.background = color1;

            // Apply text color
            document.body.style.color = color1;
        }

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
    progressBar.style.width = `${progressPercent}%`;    
    if (!useCustomColors)
        document.body.style.setProperty('--accent-color', accentColorPalette.LightVibrant);
    else
        document.body.style.setProperty('--accent-color', color1);
}