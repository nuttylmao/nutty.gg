///////////////////
// PAGE ELEMENTS //
///////////////////

const mainWrapper = document.getElementById('main-wrapper');
const albumArtContainer = document.getElementById('album-art-container');
const songInfoContainer = document.getElementById('song-info-container');
const progressBar = document.getElementById('progress-bar');
const progressBarTrack = document.getElementById('progress-bar-track');
const songLabel = document.getElementById('song-label');
const songLabelBackground = document.getElementById('song-label-background');



////////////////
// PAGE SETUP //
////////////////

// This theme has variants
const themeVariant = window.ThemeVariant ? window.ThemeVariant : '';

// Set property visibility
if (!showPrimary)
    document.documentElement.style.setProperty('--show-primary', `none`);
if (!showSecondary)
    document.documentElement.style.setProperty('--show-secondary', `none`);

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
        if (swapArtistTrack) {
            SetSongInfo(mediaProps.Artist, mediaProps.Title);
        } else {
            SetSongInfo(mediaProps.Title, mediaProps.Artist);
        }

        // Extract the image source string (use fallback if Windows has no art)
        
        // Set the pill color
        if (!useCustomColors)
        {
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
        }
        else
        {
            switch (themeVariant) {
                case "compact-inverted":
                    progressBarTrack.style.backgroundColor = `color-mix(in srgb, ${color1}, black 60%)`;
                    progressBar.style.background = color2;
                    songLabel.style.color = color1;
                    songLabelBackground.style.color = color2;
                    break;
                default:
                    progressBarTrack.style.backgroundColor = color2;
                    progressBar.style.background = color1;
                    songLabel.style.color = color2;
                    songLabelBackground.style.color = color1;
                    break;
            }
        }

        songLabel.style.opacity = "";
        songLabelBackground.style.opacity = "";

        setTimeout(() => {
            SetVisibility(true); // Show the overlay for a few seconds if autoHide is enabled
        }, 250);
    }, 250);
}

function SetProgressInfo(timelineProps, currentPositionMs, accentColorPalette, playbackStatus) {
    // Set progressbar
    // Ensure we don't divide by zero or exceed 100%
    const durationMs = timelineProps.EndTime;

    // Calculate the progress percentage
    let progressPercent = durationMs > 0 ? (currentPositionMs / durationMs) * 100 : 0;
    progressPercent = Math.min(100, Math.max(0, progressPercent));

    // If the duration is 0, that means the session isn't returning any timeline info, so just put the progress at 100%
    if (durationMs <= 0 || !showProgressBar)
        progressPercent = 100;

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
        
    // Set the pause overlay visibility based on playback status
    if (playbackStatus === PlaybackStatus.PAUSED)
        songInfoContainer.classList.add('is-paused');
    else
        songInfoContainer.classList.remove('is-paused');
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

    let scrollContent = container.querySelector('.scroll-content');

    const currentTrackEl = container.querySelector('.track-label');
    const currentArtistEl = container.querySelector('.artist-label');
    
    if (!scrollContent || !currentTrackEl || currentTrackEl.textContent !== trackName || currentArtistEl.textContent !== artistName) {
        container.classList.remove('is-overflowing');
        container.innerHTML = `
            <span class="scroll-content">
                <span class="track-label">${trackName}</span>
                <span class="artist-label">${artistName}</span>
            </span>
        `;
        scrollContent = container.querySelector('.scroll-content');
    }

    const updateMetrics = () => {
        scrollContent = container.querySelector('.scroll-content');

        const textWidth = scrollContent.scrollWidth;
        const containerWidth = container.clientWidth;
        const overflowDistance = textWidth - containerWidth;

        if (overflowDistance > 0) {
            const distancePercent = (overflowDistance / textWidth) * 100;
            
            // --- CONSTANT TIMINGS ---
            const travelSec = overflowDistance / SCROLL_SPEED_PX_PER_SEC;
            const pauseSec = PAUSE_SEC; 
            
            const totalSec = (travelSec * 2) + (pauseSec * 2);
            const totalMs = totalSec * 1000;
            
            const p1 = (pauseSec / totalSec);
            const p2 = ((pauseSec + travelSec) / totalSec);
            const p3 = ((pauseSec * 2 + travelSec) / totalSec);

            scrollContent.style.setProperty('--scroll-distance', `-${distancePercent}%`);

            // Clear any previous active animations to prevent stacking on resize
            if (scrollContent._anim) scrollContent._anim.cancel();
            if (container._anim) container._anim.cancel();

            // 1. Animate Text Translation inside container
            scrollContent._anim = scrollContent.animate([
                { transform: 'translateX(0%)', offset: 0, easing: 'linear' },
                { transform: 'translateX(0%)', offset: p1, easing: 'ease-in-out' },
                { transform: `translateX(-${distancePercent}%)`, offset: p2, easing: 'linear' },
                { transform: `translateX(-${distancePercent}%)`, offset: p3, easing: 'ease-in-out' },
                { transform: 'translateX(0%)', offset: 1, easing: 'linear' }
            ], {
                duration: totalMs,
                iterations: Infinity
            });

            // 2. Animate Mask Variables simultaneously to keep soft edges synced
            const maxOffset = 1;
            const fadeBuffer = Math.min(0.02, (p2 - p1) / 4); // Dynamically scale buffer if text overflow is tiny

            const off0 = 0;
            const off1 = p1;
            const off2 = Math.min(p1 + fadeBuffer, p2);
            const off3 = Math.max(off2, p2 - fadeBuffer);
            const off4 = p2;
            const off5 = p3;
            const off6 = Math.min(p3 + fadeBuffer, maxOffset);
            const off7 = 1;

            container._anim = container.animate([
                { '--mask-left': 'black', '--mask-right': 'transparent', offset: off0 },
                { '--mask-left': 'black', '--mask-right': 'transparent', offset: off1 },
                { '--mask-left': 'transparent', '--mask-right': 'transparent', offset: off2 },
                { '--mask-left': 'transparent', '--mask-right': 'transparent', offset: off3 },
                { '--mask-left': 'transparent', '--mask-right': 'black', offset: off4 },
                { '--mask-left': 'transparent', '--mask-right': 'black', offset: off5 },
                { '--mask-left': 'transparent', '--mask-right': 'transparent', offset: off6 },
                { '--mask-left': 'black', '--mask-right': 'transparent', offset: off7 }
            ], {
                duration: totalMs,
                iterations: Infinity
            });

            container.classList.add('is-overflowing');
        } else {
            container.classList.remove('is-overflowing');
            if (scrollContent._anim) scrollContent._anim.cancel();
            if (container._anim) container._anim.cancel();
        }
    };

    updateMetrics();

    if (!container._resizeObserver) {
        container._resizeObserver = new ResizeObserver(() => {
            updateMetrics();
        });
        container._resizeObserver.observe(container);
    }
}