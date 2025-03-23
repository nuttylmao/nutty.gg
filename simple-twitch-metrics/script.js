////////////////////
// URL PARAMETERS //
////////////////////

const queryString = window.location.search;
const urlParams = new URLSearchParams(queryString);
const twitchUsername = urlParams.get("username") || '';

///////////////
// FUNCTIONS //
///////////////

async function UpdateMetrics() {
    document.getElementById("subCountLabel").innerHTML = await GetMetric("https://decapi.me/twitch/subcount");
    document.getElementById("followerCountLabel").innerHTML = await GetMetric("https://decapi.me/twitch/followcount");
    document.getElementById("viewCountLabel").innerHTML = await GetViewCount();

    setTimeout(UpdateMetrics, 15000);
}

UpdateMetrics();

async function GetMetric(url) {
    const response = await fetch(`${url}/${twitchUsername}`);
    const metric = await response.text();

    if (metric.includes("decapi.me"))
        return "-";
    else
        return metric;
}

async function GetViewCount() {    
    const response = await fetch(`https://decapi.me/twitch/viewercount/${twitchUsername}`);
    const viewcount = await response.text();

    return isNaN(Number(viewcount)) ? 0 : Number(viewcount);
}