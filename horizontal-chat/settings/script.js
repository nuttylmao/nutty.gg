const widgetContainer = document.getElementById('widgetContainer');

const settingsPageURL = '../../.utilities/settings-page-builder';

const currentURL = window.location.href;

let settingsJSON;
let baseURL = currentURL;

if (baseURL.endsWith("index.html"))
    baseURL = baseURL.replace("index.html", "");

settingsJSON = "?settingsJson=" + baseURL + "settings.json";

const lastSlashIndex = baseURL.lastIndexOf("/");
let widgetURL = "&widgetURL=" + baseURL.replace("/settings", "");

console.debug("Window Ref: " + window.location.href);
console.debug("Base URL: " + baseURL);
console.debug("Settings JSON: " + settingsJSON);
console.debug("Widget URL: " + widgetURL);

widgetContainer.src = settingsPageURL + settingsJSON + widgetURL;

function callFunction(functionName) {
    console.debug(`Calling ${functionName}`);
    let widget = document.getElementById("widget");
    widget.contentWindow[functionName]();
}