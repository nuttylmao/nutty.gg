///////////////////
// PAGE ELEMENTS //
///////////////////

const mainWrapper = document.getElementById('main-wrapper');
const albumArtContainer = document.getElementById('album-art-container');
const songInfoContainer = document.getElementById('song-info-container');
const albumArtLayer = document.getElementById('album-art-layer');
const albumArtTransition = document.getElementById('album-art-transition-layer');
// const backgroundLayer = document.getElementById('background-layer');
// const backgroundTransitionLayer = document.getElementById('background-transition-layer');
const trackLabel = document.getElementById('track-label');
const artistLabel = document.getElementById('artist-label');
// const progressContainer = document.getElementById('progress-container');
// const progressBarFill = document.getElementById('progress-bar-fill');
// const currentTimeLabel = document.getElementById('current-time');
// const durationLabel = document.getElementById('duration');



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

// // Set progress bar visibility
// if (!showProgressBar)
//     progressContainer.style.display = 'none';



////////////////////
// CORE FUNCTIONS //
////////////////////

async function ChangeTrack(mediaProps) {
    // Fade in the overlay (shows the new text)
    trackLabel.style.opacity = "0";
    artistLabel.style.opacity = "0";
    // backgroundLayer.style.opacity = "0";
    albumArtLayer.style.opacity = "0";
    
    // Wait for fade (0.5s), then swap the real text and hide overlay
    setTimeout(() => {
        trackLabel.innerText = swapArtistTrack ? mediaProps.Artist : mediaProps.Title;
        artistLabel.innerText = swapArtistTrack ? mediaProps.Title : mediaProps.Artist; 

        // Extract the image source string (use fallback if Windows has no art)
        const newArtUrl = mediaProps.Thumbnail;

        // Set the image
        // backgroundLayer.style.backgroundImage = `url('${newArtUrl}')`;
        albumArtLayer.style.backgroundImage = `url('${newArtUrl}')`;

        // // Apply a tint: Use 30% opacity of the accent color + a dark overlay for contrast
        // // 'rgba(0,0,0,0.6)' ensures the text stays readable
        // backgroundLayer.style.backgroundColor = accent + "80"; // 80 is 50% opacity in hex

        trackLabel.style.opacity = "";
        artistLabel.style.opacity = "";
        // backgroundLayer.style.opacity = "";
        albumArtLayer.style.opacity = "";

        setTimeout(() => {
            // // Set the image
            // backgroundTransitionLayer.style.backgroundImage = `url('${newArtUrl}')`;
            albumArtTransition.style.backgroundImage = `url('${newArtUrl}')`;

            // // Apply a tint: Use 30% opacity of the accent color + a dark overlay for contrast
            // // 'rgba(0,0,0,0.6)' ensures the text stays readable
            // backgroundTransitionLayer.style.backgroundColor = accent + "80"; // 80 is 50% opacity in hex

            SetVisibility(true); // Show the overlay for a few seconds if autoHide is enabled
        }, 250);
    }, 250);
}

function SetProgressInfo(timelineProps, currentPositionMs, accentColorPalette) {
}

function SetAlbumArtSize() {
    const height = songInfoContainer.offsetHeight;
    albumArtContainer.style.height = `${1.5 * height}px`;
    albumArtContainer.style.width = `${1.5 * height}px`;
}

SetAlbumArtSize();