///////////////////
// PAGE ELEMENTS //
///////////////////

const mainWrapper = document.getElementById('main-wrapper');
// Color Boxes
const boxVibrant = document.getElementById('box-vibrant');
const boxMuted = document.getElementById('box-muted');
const boxDarkVibrant = document.getElementById('box-dark-vibrant');
const boxDarkMuted = document.getElementById('box-dark-muted');
const boxLightVibrant = document.getElementById('box-light-vibrant');
const boxLightMuted = document.getElementById('box-light-muted');

// Primary Text Labels (for Hex codes)
const labelVibrant = document.getElementById('label-vibrant');
const labelMuted = document.getElementById('label-muted');
const labelDarkVibrant = document.getElementById('label-dark-vibrant');
const labelDarkMuted = document.getElementById('label-dark-muted');
const labelLightVibrant = document.getElementById('label-light-vibrant');
const labelLightMuted = document.getElementById('label-light-muted');



/////////////////
// GLOBAL VARS //
/////////////////

const colorRoles = ['Vibrant', 'Muted', 'DarkVibrant', 'DarkMuted', 'LightVibrant', 'LightMuted'];



////////////////
// PAGE SETUP //
////////////////

// Set container width
if (maxWidth > 0)
    mainWrapper.style.width = `${maxWidth}px`;
else
    mainWrapper.style.width = `100%`;

// Set primary and secondary text visibility
if (showPrimary)
    document.documentElement.style.setProperty('--show-primary', '');
else
    document.documentElement.style.setProperty('--show-primary', 'none');

if (showSecondary)
    document.documentElement.style.setProperty('--show-secondary', '');
else
    document.documentElement.style.setProperty('--show-secondary', 'none');



////////////////////
// CORE FUNCTIONS //
////////////////////

async function ChangeTrack(mediaProps, accentColorPalette) {    
    // Map elements for easy lookup
    const labels = {
        Vibrant: labelVibrant,
        Muted: labelMuted,
        DarkVibrant: labelDarkVibrant,
        DarkMuted: labelDarkMuted,
        LightVibrant: labelLightVibrant,
        LightMuted: labelLightMuted
    };

    const boxes = {
        Vibrant: boxVibrant,
        Muted: boxMuted,
        DarkVibrant: boxDarkVibrant,
        DarkMuted: boxDarkMuted,
        LightVibrant: boxLightVibrant,
        LightMuted: boxLightMuted
    };

    // Fade out all labels
    colorRoles.forEach(role => {
        labels[role].style.opacity = 0;
    });

    // Wait for fade, then swap text, colors, and restore opacity
    setTimeout(() => {
        colorRoles.forEach(role => {
            const colorValue = accentColorPalette[role];
            
            labels[role].textContent = colorValue;
            boxes[role].style.setProperty('--box-bg', colorValue);
            boxes[role].style.color = colorValue;
            labels[role].style.opacity = '';
        });
    }, 250);
}

function SetProgressInfo(timelineProps, currentPositionMs, accentColorPalette, playbackStatus) {
    const durationMs = timelineProps.EndTime;

    let progressPercent = durationMs > 0 ? (currentPositionMs / durationMs) * 100 : 0;
    progressPercent = Math.min(100, Math.max(0, progressPercent));

    if (durationMs <= 0 || !showProgressBar)
        progressPercent = 100;

    const clipRight = 100 - progressPercent;
    
    const boxes = {
        Vibrant: boxVibrant,
        Muted: boxMuted,
        DarkVibrant: boxDarkVibrant,
        DarkMuted: boxDarkMuted,
        LightVibrant: boxLightVibrant,
        LightMuted: boxLightMuted
    };

    // Update variables for each box dynamically via loop
    colorRoles.forEach(role => {
        const box = boxes[role];
        if (box && accentColorPalette[role]) {
            box.style.setProperty('--box-bg', accentColorPalette[role]);
            box.style.setProperty('--clip-right', `${clipRight}%`);
        }
    });
}