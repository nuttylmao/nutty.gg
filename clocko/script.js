/////////////
// IMPORTS //
/////////////

dayjs.extend(window.dayjs_plugin_utc);
dayjs.extend(window.dayjs_plugin_timezone);
dayjs.extend(window.dayjs_plugin_advancedFormat);

////////////////////
// URL PARAMETERS //
////////////////////

const queryString = window.location.search;
const urlParams = new URLSearchParams(queryString);

///////////////////
// PAGE ELEMENTS //
///////////////////

const mainContainer = document.getElementById('main-container');
const line1 = document.getElementById('line1');
const line2 = document.getElementById('line2');
const line3 = document.getElementById('line3');

/////////////
// OPTIONS //
/////////////

const font = urlParams.get("font") || "";

const enableLine1 = GetBooleanParam("enableLine1", true);
const line1Format = urlParams.get("line1Format") || "hh:mm:ss A";
const line1FontSize = GetIntParam("line1FontSize", 50);
const line1FontWeight = urlParams.get("line1FontWeight") || "700";
const line1FontColor = urlParams.get("line1FontColor") || "#ffffff";
const line1FontOpacity = urlParams.get("line1FontOpacity") || "1";
const line1TextTransform = urlParams.get("line1TextTransform") || "none";
const line1TextAlignment = urlParams.get("line1TextAlignment") || "center";

const enableLine2 = GetBooleanParam("enableLine2", true);
const line2Format = urlParams.get("line2Format") || "ddd, MMM D";
const line2FontSize = GetIntParam("line2FontSize", 40);
const line2FontWeight = urlParams.get("line2FontWeight") || "400";
const line2FontColor = urlParams.get("line2FontColor") || "#ffffff";
const line2FontOpacity = urlParams.get("line2FontOpacity") || "0.7";
const line2TextTransform = urlParams.get("line2TextTransform") || "none";
const line2TextAlignment = urlParams.get("line2TextAlignment") || "center";

const enableLine3 = GetBooleanParam("enableLine3", false);
const line3Format = urlParams.get("line3Format") || "ddd DD MMM YYYY hh:mm:ss A z";
const line3FontSize = GetIntParam("line3FontSize", 30);
const line3FontWeight = urlParams.get("line3FontWeight") || "600";
const line3FontColor = urlParams.get("line3FontColor") || "#ffffff";
const line3FontOpacity = urlParams.get("line3FontOpacity") || "1";
const line3TextTransform = urlParams.get("line3TextTransform") || "none";
const line3TextAlignment = urlParams.get("line3TextAlignment") || "center";



////////////////
// PAGE SETUP //
////////////////

// Set the font for the entire page if specified
if (font)
	document.body.style.fontFamily = `'${font}'`;

// Hide lines that are not enabled
if (!enableLine1)
    line1.style.display = "none";
if (!enableLine2)
    line2.style.display = "none";
if (!enableLine3)
    line3.style.display = "none";



////////////
// CLOCKO //
////////////

// Check if any active format string includes milliseconds (e.g., 'S', 'SS', 'SSS')
const usesMilliseconds = 
    (enableLine1 && line1Format.includes('S')) ||
    (enableLine2 && line2Format.includes('S')) ||
    (enableLine3 && line3Format.includes('S'));

UpdateTime();

if (usesMilliseconds) {
    // High-frequency updates for millisecond precision
    function updateFrame() {
        UpdateTime();
        requestAnimationFrame(updateFrame);
    }
    requestAnimationFrame(updateFrame);
} else {
    // Efficient 1-second interval for standard clocks
    setInterval(UpdateTime, 1000);
}

function UpdateTime() {
    const now = dayjs().tz(dayjs.tz.guess());
    
    if (enableLine1) line1.textContent = now.format(line1Format);
    if (enableLine2) line2.textContent = now.format(line2Format);
    if (enableLine3) line3.textContent = now.format(line3Format);
}



/////////////
// STYLING //
/////////////

function ApplyStyling(el, fontSize, fontWeight, fontColor, fontOpacity, textTransform, textAlignment) {
    el.style.fontSize = fontSize + "px";
    el.style.fontWeight = fontWeight;
    el.style.color = fontColor;
    el.style.opacity = fontOpacity;
    el.style.textTransform = textTransform;
    el.style.textAlign = textAlignment;
}

ApplyStyling(line1, line1FontSize, line1FontWeight, line1FontColor, line1FontOpacity, line1TextTransform, line1TextAlignment);
ApplyStyling(line2, line2FontSize, line2FontWeight, line2FontColor, line2FontOpacity, line2TextTransform, line2TextAlignment);
ApplyStyling(line3, line3FontSize, line3FontWeight, line3FontColor, line3FontOpacity, line3TextTransform, line3TextAlignment);