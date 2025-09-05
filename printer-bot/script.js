// Construct URL
const currentURL = window.location.href;
let baseURL = currentURL;

if (baseURL.endsWith("index.html"))
    baseURL = baseURL.replace("index.html", "");

const configJson = "?config=" + baseURL + "config.json";

// Implement widget dock core
window.dockWrapper = document.getElementById('dock-wrapper');
dockWrapper.src = `../../.common/core/widget-dock-core${configJson}`;

dockWrapper.addEventListener('load', () => {
    dockWrapper.contentWindow.content.src = window.location.href + '/contents';
});