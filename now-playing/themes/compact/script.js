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
        trackLabel.innerText = swapArtistTrack ? mediaProps.Artist : mediaProps.Title;
        artistLabel.innerText = swapArtistTrack ? mediaProps.Title : mediaProps.Artist;
        trackLabelBackground.innerText = swapArtistTrack ? mediaProps.Artist : mediaProps.Title;
        artistLabelBackground.innerText = swapArtistTrack ? mediaProps.Title : mediaProps.Artist;

        // Extract the image source string (use fallback if Windows has no art)
        
        // Set the pill color
        switch (themeVariant) {
            case "compact-inverted":
                songInfoContainer.style.backgroundColor = accentColorPalette.LightVibrant;
                progressBar.style.background = `color-mix(in srgb, ${accentColorPalette.DarkMuted}, black 60%)`;
                songLabel.style.color = accentColorPalette.LightVibrant;
                songLabelBackground.style.color = accentColorPalette.DarkVibrant;
                break;
            default:
                songInfoContainer.style.backgroundColor = `color-mix(in srgb, ${accentColorPalette.DarkMuted}, black 60%)`;
                progressBar.style.background = accentColorPalette.LightVibrant;
                songLabel.style.color = accentColorPalette.DarkVibrant;
                songLabelBackground.style.color = accentColorPalette.LightVibrant;
                break;
        }

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
    
    // const clipRight = progressPercent;
    // progressBar.style.maskImage = `linear-gradient(to right, black calc(${clipRight}% - 4em), transparent ${clipRight}%)`
}