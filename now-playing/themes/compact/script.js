///////////////////
// PAGE ELEMENTS //
///////////////////

const mainWrapper = document.getElementById('main-wrapper');
const albumArtContainer = document.getElementById('album-art-container');
const songInfoContainer = document.getElementById('song-info-container');
const progressBar = document.getElementById('progress-bar');
const progressBarTrack = document.getElementById('progress-bar-track');
const trackLabel = document.getElementById('track-label');
const artistLabel = document.getElementById('artist-label');
const trackLabelBackground = document.getElementById('track-label-background');
const artistLabelBackground = document.getElementById('artist-label-background');
const songLabel = document.getElementById('song-label');
const songLabelBackground = document.getElementById('song-label-background');



////////////////
// PAGE SETUP //
////////////////

// This theme has variants
const themeVariant = window.ThemeVariant ? window.ThemeVariant : '';

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

async function ChangeTrack(mediaProps, accentColorPalette) {
    // Fade in the overlay (shows the new text)
    songLabel.style.opacity = "0";
    songLabelBackground.style.opacity = "0";
    
    // Wait for fade (0.5s), then swap the real text and hide overlay
    setTimeout(() => {
        // trackLabel.innerText = swapArtistTrack ? mediaProps.Artist : mediaProps.Title;
        // artistLabel.innerText = swapArtistTrack ? mediaProps.Title : mediaProps.Artist;
        // trackLabelBackground.innerText = swapArtistTrack ? mediaProps.Artist : mediaProps.Title;
        // artistLabelBackground.innerText = swapArtistTrack ? mediaProps.Title : mediaProps.Artist;
        if (swapArtistTrack) {
            SetSongInfo(mediaProps.Artist, mediaProps.Title);
        } else {
            SetSongInfo(mediaProps.Title, mediaProps.Artist);
        }

        // Extract the image source string (use fallback if Windows has no art)
        
        // Set the pill color
        switch (themeVariant) {
            case "compact-inverted":
                progressBarTrack.style.backgroundColor = accentColorPalette.LightVibrant;
                progressBar.style.background = `color-mix(in srgb, ${accentColorPalette.DarkMuted}, black 60%)`;
                songLabel.style.color = accentColorPalette.LightVibrant;
                songLabelBackground.style.color = accentColorPalette.DarkVibrant;
                break;
            default:
                progressBarTrack.style.backgroundColor = `color-mix(in srgb, ${accentColorPalette.DarkMuted}, black 60%)`;
                progressBar.style.background = accentColorPalette.LightVibrant;
                songLabel.style.color = accentColorPalette.DarkVibrant;
                songLabelBackground.style.color = accentColorPalette.LightVibrant;
                break;
        }

        songLabel.style.opacity = "";
        songLabelBackground.style.opacity = "";

        setTimeout(() => {
            SetVisibility(true); // Show the overlay for a few seconds if autoHide is enabled
        }, 250);
    }, 250);
}

function SetProgressInfo(timelineProps, currentPositionMs, accentColorPalette) {
    // Set progressbar
    // Ensure we don't divide by zero or exceed 100%
    const durationMs = timelineProps.EndTime;

    // If the duration is 0, that means the session isn't returning any timeline info, so just put the progress at 100%
    if (durationMs <= 0 || !showProgressBar)
    {
        progressBarTrack.style.display = 'none';
        return;
    }
    else
        progressBarTrack.style.display = '';

    // Calculate the progress percentage
    let progressPercent = durationMs > 0 ? (currentPositionMs / durationMs) * 100 : 0;
    progressPercent = Math.min(100, Math.max(0, progressPercent));

    // Calculate how much needs to be hidden (the right-side offset)
    const clipRight = 100 - progressPercent;

    // Update the clip-path
    progressBar.style.clipPath = `inset(0 ${clipRight}% 0 0)`;
    progressBarTrack.style.clipPath = `inset(0 0 0 ${progressPercent}%)`;
    
    // // Set the progress bar but with a transition for smoothness
    // const clipRight = progressPercent;
    // const transitionWidth = '1em';
    // progressBar.style.maskImage = `linear-gradient(to right, black calc(${clipRight}% - ${transitionWidth}), transparent ${clipRight}%)`
    // progressBarTrack.style.maskImage = `linear-gradient(to right, transparent calc(${clipRight}% - ${transitionWidth}), black ${clipRight}%)`;
}

// MARQUEE LOGIC
// This is a more advanced marquee implementation that calculates the overflow distance and adjusts the scroll speed accordingly

// Call this function whenever the track changes
function SetSongInfo(trackName, artistName) {
    // Update main text and background layer simultaneously
    UpdateSingleSongLabel('song-label', trackName, artistName);
    UpdateSingleSongLabel('song-label-background', trackName, artistName);
}

function UpdateSingleSongLabel(containerId, trackName, artistName) {
    const container = document.getElementById(containerId);
    if (!container) return;

    // 1. Structure the inner HTML with a wrapper so we can measure exact inline width
    container.classList.remove('is-overflowing');
    container.innerHTML = `
        <span class="scroll-content">
            <span class="track-label">${trackName}</span>
            <span class="artist-label">${artistName}</span>
        </span>
    `;

    const scrollContent = container.querySelector('.scroll-content');
    
    // 2. Measure total width of (Track + Artist) against parent width
    const textWidth = scrollContent.scrollWidth;
    const containerWidth = container.clientWidth;
    const overflowDistance = textWidth - containerWidth;

    // 3. If the combined row overflows, set the CSS variables and add class
    if (overflowDistance > 0) {
        const distancePercent = (overflowDistance / textWidth) * 100;
        const travelTime = overflowDistance / SCROLL_SPEED_PX_PER_SEC;
        const totalDuration = (travelTime * 2) + 3; // 3 seconds total for start/end pauses

        scrollContent.style.setProperty('--scroll-distance', `-${distancePercent}%`);
        container.style.setProperty('--marquee-duration', `${totalDuration}s`);

        container.classList.add('is-overflowing');
    }

    // 4. Attach ResizeObserver once to handle responsive window resizes
    if (!container._resizeObserver) {
        container._resizeObserver = new ResizeObserver(() => {
            UpdateSingleSongLabel(containerId, trackName, artistName);
        });
        container._resizeObserver.observe(container);
    }
}