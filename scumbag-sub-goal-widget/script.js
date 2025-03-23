////////////////////
// URL PARAMETERS //
////////////////////

const queryString = window.location.search;
const urlParams = new URLSearchParams(queryString);
const followMode = urlParams.has("followMode");
const twitchUsername = urlParams.get("username") || '';
const defaultGoalLabel = !followMode ? 'SUB GOAL' : 'FOLLOW GOAL'
const goal = urlParams.get("goal") || defaultGoalLabel;

///////////////
// FUNCTIONS //
///////////////

async function UpdateMetrics() {
    document.getElementById("goalLabel").innerHTML = `${goal}: `;
    if (!followMode)
        document.getElementById("subCountLabel").innerHTML = await GetSubCount(`https://decapi.me/twitch/subcount`);
    else
        document.getElementById("subCountLabel").innerHTML = await GetSubCount(`https://decapi.me/twitch/followcount`);

    setTimeout(UpdateMetrics, 10000);
}

UpdateMetrics();

async function GetSubCount(url) {
    const response = await fetch(`${url}/${twitchUsername}`);
    const metric = await response.text();

    if (metric.includes("decapi.me"))
        return "-";
    else
        return `${metric}/${parseInt(metric) + 1}`;
}