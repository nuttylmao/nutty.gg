const widgetContainer = document.getElementById('widgetContainer');

const settingsPageURL = '/.common/core/settings-core';

const currentURL = window.location.href;

let settingsJSON;
let baseURL = currentURL;

if (baseURL.endsWith("index.html"))
    baseURL = baseURL.replace("index.html", "");

settingsJSON = "?settingsJson=" + baseURL + "settings.json";

const lastSlashIndex = baseURL.lastIndexOf("/");
let widgetURL = "&widgetURL=" + baseURL.replace("/settings", "");
let theme = "&theme=elgato";

console.debug("Window Ref: " + window.location.href);
console.debug("Base URL: " + baseURL);
console.debug("Settings JSON: " + settingsJSON);
console.debug("Widget URL: " + widgetURL);
console.debug("Theme: " + theme);

widgetContainer.src = settingsPageURL + settingsJSON + widgetURL + theme;