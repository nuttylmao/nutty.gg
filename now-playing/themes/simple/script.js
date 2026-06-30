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
if (textAlignment == 'right')
    document.getElementById('yet-another-wrapper-yup').appendChild(document.getElementById('album-art-container'));



////////////////////
// CORE FUNCTIONS //
////////////////////

async function ChangeTrack(mediaProps) {
    trackLabel.style.opacity = "0";
    artistLabel.style.opacity = "0";
    albumArtLayer.style.opacity = "0";
    
    // Wait for fade (0.5s), then swap the real text and hide overlay
    setTimeout(() => {
        trackLabel.innerText = swapArtistTrack ? mediaProps.Artist : mediaProps.Title;
        artistLabel.innerText = swapArtistTrack ? mediaProps.Title : mediaProps.Artist; 

        // Extract the image source string (use fallback if Windows has no art)
        const newArtUrl = mediaProps.Thumbnail;

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

function SetProgressInfo(timelineProps, currentPositionMs, accentColorPalette) {
    // Update the label using your naming convention
    currentTimeLabel.innerText =
        ConvertMillisecondsToHoursMinutesSecondsSoItLooksBetterAndNotCringe(currentPositionMs);

    durationLabel.innerText =
        ConvertMillisecondsToHoursMinutesSecondsSoItLooksBetterAndNotCringe(timelineProps.EndTime);
}