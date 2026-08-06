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

const enableLine1 = GetBooleanParam("enableLine1", true);
const line1Format = urlParams.get("line1Format") || "ddd DD MMM YYYY hh:mm:ss A z";
const line1Font = urlParams.get("line1Font") || "";
const line1FontSize = GetIntParam("line1FontSize", 40);
const line1FontWeight = urlParams.get("line1FontWeight") || "400";
const line1FontColor = urlParams.get("line1FontColor") || "#ffffff";
const line1FontOpacity = urlParams.get("line1FontOpacity") || "1";
const line1TextAlignment = urlParams.get("line1TextAlignment") || "center";

const enableLine2 = GetBooleanParam("enableLine2", false);
const line2Format = urlParams.get("line2Format") || "hh:mm:ss A";
const line2Font = urlParams.get("line2Font") || "";
const line2FontSize = GetIntParam("line2FontSize", 40);
const line2FontWeight = urlParams.get("line2FontWeight") || "400";
const line2FontColor = urlParams.get("line2FontColor") || "#ffffff";
const line2FontOpacity = urlParams.get("line2FontOpacity") || "1";
const line2TextAlignment = urlParams.get("line2TextAlignment") || "center";

const enableLine3 = GetBooleanParam("enableLine3", false);
const line3Format = urlParams.get("line3Format") || "ddd DD MMM YYYY";
const line3Font = urlParams.get("line3Font") || "";
const line3FontSize = GetIntParam("line3FontSize", 40);
const line3FontWeight = urlParams.get("line3FontWeight") || "400";
const line3FontColor = urlParams.get("line3FontColor") || "#ffffff";
const line3FontOpacity = urlParams.get("line3FontOpacity") || "1";
const line3TextAlignment = urlParams.get("line3TextAlignment") || "center";



////////////////
// PAGE SETUP //
////////////////

if (!enableLine1)
    line1.style.display = "none";
if (!enableLine2)
    line2.style.display = "none";
if (!enableLine3)
    line3.style.display = "none";



////////////
// CLOCKO //
////////////

UpdateTime();
setInterval(() => {
    UpdateTime();
}, 1000);

function UpdateTime() {
    line1.textContent = dayjs().tz(dayjs.tz.guess()).format(line1Format);
    line2.textContent = dayjs().tz(dayjs.tz.guess()).format(line2Format);
    line3.textContent = dayjs().tz(dayjs.tz.guess()).format(line3Format);
}



/////////////
// STYLING //
/////////////

function ApplyStyling(el, font, fontSize, fontWeight, fontColor, fontOpacity, textAlignment) {
    if (font)
        el.style.fontFamily = `'${font}'`;
    el.style.fontSize = fontSize + "px";
    el.style.fontWeight = fontWeight;
    el.style.color = fontColor;
    el.style.opacity = fontOpacity;
    el.style.textAlign = textAlignment;
}

ApplyStyling(line1, line1Font, line1FontSize, line1FontWeight, line1FontColor, line1FontOpacity, line1TextAlignment);
ApplyStyling(line2, line2Font, line2FontSize, line2FontWeight, line2FontColor, line2FontOpacity, line2TextAlignment);
ApplyStyling(line3, line3Font, line3FontSize, line3FontWeight, line3FontColor, line3FontOpacity, line3TextAlignment);