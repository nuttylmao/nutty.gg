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

async function ChangeTrack(mediaProps, accentColorPalette) {
    // Fade in the overlay (shows the new text)
    if (trackLabel.innerText != (swapArtistTrack ? mediaProps.Artist : mediaProps.Title))
        trackLabel.style.opacity = "0";
    if (artistLabel.innerText != (swapArtistTrack ? mediaProps.Title : mediaProps.Artist))
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
        const newArtUrl = mediaProps.Thumbnail ?? './images/placeholder.png';

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

        // Apply a tint
        backgroundLayer.style.backgroundColor = accentColorPalette.DarkMuted + "80"; // 80 is 50% opacity in hex

        trackLabel.style.opacity = "";
        artistLabel.style.opacity = "";
        backgroundLayer.style.opacity = "";
        albumArtLayer.style.opacity = "";

        setTimeout(() => {
            // Set the image
            backgroundTransitionLayer.style.backgroundImage = `url('${newArtUrl}')`;
            albumArtTransition.style.backgroundImage = `url('${newArtUrl}')`;

            // Apply a tint
            backgroundTransitionLayer.style.backgroundColor = accentColorPalette.DarkMuted + "80"; // 80 is 50% opacity in hex

            SetVisibility(true); // Show the overlay for a few seconds if autoHide is enabled
        }, 250);
    }, 250);
}

function SetProgressInfo(timelineProps, currentPositionMs, accentColorPalette) {
    // Update the label using your naming convention
    currentTimeLabel.innerText =
        ConvertMillisecondsToHoursMinutesSecondsSoItLooksBetterAndNotCringe(currentPositionMs);

    durationLabel.innerText =
        ConvertMillisecondsToHoursMinutesSecondsSoItLooksBetterAndNotCringe(timelineProps.EndTime);

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