////////////////////
// URL PARAMETERS //
////////////////////

const queryString = window.location.search;
const urlParams = new URLSearchParams(queryString);
const twitchUsername = urlParams.get("username") || '';

///////////////
// FUNCTIONS //
///////////////

async function UpdateUptime() {
    document.getElementById("uptimeLabel").innerHTML = await GetUptime();

    setTimeout(UpdateUptime, 30000);
}

UpdateUptime();

async function GetUptime() {
    const response = await fetch(`https://decapi.me/twitch/uptime/${twitchUsername}`);
    const metric = await response.text();

    if (metric.includes("second"))
    {
        return removeTextAfterLastComma(metric);
    }
    else
        return metric;
}

function removeTextAfterLastComma(str) {
    const lastCommaIndex = str.lastIndexOf(',');
    if (lastCommaIndex !== -1) {
      return str.substring(0, lastCommaIndex);
    } else {
      return str; // No comma found, return the original string
    }
  }