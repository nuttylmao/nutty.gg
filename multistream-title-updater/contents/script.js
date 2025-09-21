//////////////////////
// GLOBAL VARIABLES //
//////////////////////

const sbActionFetchBroadcasts = '9486774d-d706-41d8-85b4-7daff5cd1b0d';
const sbActionUpdateStreamInfo = '1c58eff0-e98a-4fab-86f0-6f5cee1d3ab3';
const sbActionOpenUrl = '14da1d44-6e29-4582-92c3-2c59388be57e';

let currentBroadcastId = '';
let runningActionId = '';
let youtubeTitleOnBroadcastStart = '';


///////////////////
// PAGE ELEMENTS //
///////////////////

const blurLayer = document.getElementById('blur-layer');
const updateAllDialog = document.getElementById('update-all-dialog');
const updateTwitchDialog = document.getElementById('update-twitch-dialog');
const updateKickDialog = document.getElementById('update-kick-dialog');
const updateYouTubeDialog = document.getElementById('update-youtube-dialog');
const broadcastList = document.getElementById('broadcast-list');
const youtubeWarning = document.getElementById('youtube-warning');
const includeYouTubeSettingWrapper = document.getElementById('include-youtube-setting-wrapper');
const includeYouTubeSetting = document.getElementById('include-youtube-setting');
const youtubeTitleOnBroadcastStartLabel = document.getElementById('youtube-title-on-broadcast-start-label');



/////////////////////////
// STREAMER.BOT EVENTS //
/////////////////////////

window.addEventListener("message", (event) => {
    FetchBroadcasts();
});

window.parent.sbClient.on('General.Custom', (response) => {
    console.debug(response.data);
    GeneralCustom(response.data);
})

window.parent.sbClient.on('YouTube.BroadcastStarted', (response) => {
    console.debug(response.data);
    YouTubeBroadcastStarted(response.data);
})

window.parent.sbClient.on('Twitch.StreamUpdate', (response) => {
    console.debug(response.data);
    FetchBroadcasts();
})

window.parent.sbClient.on('YouTube.BroadcastUpdated', (response) => {
    console.debug(response.data);
    FetchBroadcasts();
})



///////////////////////////////
// MULTISTREAM TITLE UPDATER //
///////////////////////////////

async function GeneralCustom(data) {
    // Only run if response matches the ID of the corresponding FetchBroadcasts() call
    if (runningActionId != data.runningActionId)
        return;

    switch(data.actionId) {
        case sbActionFetchBroadcasts:            
            {
                // Iterate through list of broadcasts and add it to the list
                for (const broadcast of data.broadcastList)
                    await AddBroadcast(broadcast);
                
                // Check if YouTube account is connected
                // If yes, count how many YouTube broadcasts there were
                // If 0, show warning
                const broadcasterInfo = await window.parent.sbClient.getBroadcaster();
                if (broadcasterInfo.platforms.youtube)
                {
                    // Only show the warning if there are 0 monitored broadcasts
                    const ytBroadcastCount = data.broadcastList.filter(b => b.platform === "youtube").length;
                    if (ytBroadcastCount <= 0)
                    {
                        youtubeWarning.style.display = 'flex';
                        includeYouTubeSettingWrapper.style.display = 'flex';
                        includeYouTubeSetting.checked = true;
                    }
                    else
                    {
                        youtubeWarning.style.display = 'none';
                        includeYouTubeSettingWrapper.style.display = 'none';
                        includeYouTubeSetting.checked = false;
                    }

                    // Set the URL to the livestreaming dashboard
                    const broadcastButton = youtubeWarning.querySelector('#broadcast-dashboard-button');
                    broadcastButton.onclick = function() {
                        //window.open(data.streamUrl, '_blank');
                        OpenURL(`https://studio.youtube.com/channel/${broadcasterInfo.platforms.youtube.broadcastUserId}/livestreaming`);
                    };
                }
                else
                    youtubeWarning.style.display = 'none';

                // Check if any broadcasts have gone offline
                // 		If so, delete them from the list
                const childDivs = broadcastList.querySelectorAll(":scope > div");
                childDivs.forEach(childDiv => {
                    var result = data.broadcastList.find(obj => {
                        return `id-${obj.id}` === childDiv.id;
                    })
                    if (result == null)
                        childDiv.remove();
                });
            }
            break;
    }
}

function YouTubeBroadcastStarted(data) {
    if (!includeYouTubeSetting.checked)
        return;

    setTimeout(async () => {
        await window.parent.sbClient.doAction(
            action = {
                id: sbActionUpdateStreamInfo
            },
            args = {
                platform: 'youtube',
                title: youtubeTitleOnBroadcastStart,
                broadcastId: data.id
            }
        );
    }, 1000);
}

async function FetchBroadcasts() {
    // Fetch from Streamer.bot
    const response = await window.parent.sbClient.doAction({ id: sbActionFetchBroadcasts});
    runningActionId = response.args.runningActionId;
}

async function FetchKickInfo() {
    // Fetch from Streamer.bot
    const broadcasterInfo = await window.parent.sbClient.getBroadcaster();
    
    if (broadcasterInfo.platforms.kick) {
        const userLogin = broadcasterInfo.platforms.kick.broadcasterLogin;

        let kickData = {
            platform: 'kick',
            id: 'kick',
            streamUrl: `https://www.kick.com/${userLogin.replaceAll('_', '-')}`,
            dashboardUrl: 'https://dashboard.kick.com/stream',
            userLogin: userLogin
        }
        AddBroadcast(kickData);
    }
    else {
        const kickBroadcastDiv = document.getElementById('id-kick');
        if (kickBroadcastDiv)
            kickBroadcastDiv.remove();
    }
}

async function AddBroadcast(data) {
    // Get a reference to the template
    const template = document.getElementById('broadcast-template');

    const existingDiv = broadcastList.querySelector(`#id-${data.id}`);

    // Create a new instance of the template
    let instance;

    if (existingDiv)
        instance = existingDiv;
    else {
        instance = template.content.firstElementChild.cloneNode(true);
        instance.id = `id-${data.id}`;
        broadcastList.appendChild(instance);
    }

    // Get divs
    const platformIconEl = instance.querySelector('#platform-icon');
    const titleEl = instance.querySelector('#broadcast-title');
    const categoryEl = instance.querySelector('#broadcast-category');
    const kickWarningEl = instance.querySelector('#kick-warning');
    const streamButtonEl = instance.querySelector('#broadcast-stream-button');
    const dashboardButtonEl = instance.querySelector('#broadcast-dashboard-button');
    const editButtonEl = instance.querySelector('#broadcast-edit-button');

    // Streamer.bot does not provide title/category for Kick, so pull from API
    if (data.platform == 'kick')
    {
        let response = await fetch('https://kick.com/api/v1/channels/' + data.userLogin);
        let response_data = await response.json();
        
        // The current title is only provided if the stream if currently live
        if (response_data.livestream)
        {
            data.title = response_data.livestream.session_title;
            data.category = response_data.livestream.categories[0].name;
            kickWarningEl.style.display = 'none';
        }
        else if (response_data.previous_livestreams.length > 0)
        {
            data.title = response_data.previous_livestreams[0].session_title;
            data.category = response_data.previous_livestreams[0].categories[0].name;
            kickWarningEl.style.display = 'inline';
        }
        else
        {
            data.title = '';
            data.category = '';
            kickWarningEl.style.display = 'inline';
        }
    }

    // Flash green to show that it updated
    if (titleEl.textContent != data.title || categoryEl.textContent != data.category)
    {
        instance.style.backgroundColor = getComputedStyle(document.documentElement).getPropertyValue('--confirm-flash');
        setTimeout(() => {
            instance.style.backgroundColor = '';
        }, 1000);
    }

    // Set the platform icon
    platformIconEl.src = `icons/platforms/${data.platform}.png`;

    // Special logo for YouTube shorts
    if (data.platform == 'youtube') {
        const targets = ["vertical", "shorts"];

        const isShort = data.tags.some(item =>
            targets.some(target => item.toLowerCase() === target.toLowerCase())
        );
        if (isShort)
            platformIconEl.src = `icons/platforms/youtube-shorts.png`;
    }
    
    // Set the stream title
    if (data.title)
        titleEl.textContent = data.title;
    
    // Set the stream category
    if (data.category)
        categoryEl.textContent = data.category;
    
    streamButtonEl.onclick = function() {
        //window.open(data.streamUrl, '_blank');
        OpenURL(data.streamUrl);
    };

    dashboardButtonEl.onclick = function() {
        //window.open(data.dashboardUrl, '_blank');
        OpenURL(data.dashboardUrl);
    };

    editButtonEl.onclick = function() {
        switch (data.platform) {
            case 'twitch':
                document.getElementById('twitch-title-input').value = data.title;
                document.getElementById('twitch-category-input').value = data.category;
                document.getElementById('twitch-tags-input').value = data.tags.join(", ");
                ValidateTwitchDialog();
                updateTwitchDialog.style.display = "flex";
                break;
            case 'kick':
                document.getElementById('kick-title-input').value = titleEl.textContent;
                document.getElementById('kick-category-input').value = categoryEl.textContent;
                ValidateKickDialog();
                updateKickDialog.style.display = "flex";
                break;
            case 'youtube':
                currentBroadcastId = data.id;
                document.getElementById('youtube-title-input').value = data.title;
                document.getElementById('youtube-description-input').value = data.description;
                document.getElementById('youtube-category-input').value = data.category;
                document.getElementById('youtube-tags-input').value = data.tags.join(", ");
                document.getElementById('youtube-privacy-select').value = data.privacy;
                ValidateYouTubeDialog();
                updateYouTubeDialog.style.display = "flex";
                break;
        }
        blurLayer.style.display = "block";
    };
}




//////////////////////
// HELPER FUNCTIONS //
//////////////////////

async function OpenURL(url) {
    await window.parent.sbClient.doAction(
        action = {
            id: sbActionOpenUrl
        },
        args = {
            url: url
        }
    );
}



///////////////////////
// PAGE INTERACTIONS //
///////////////////////

function OpenUpdateAllDialog() {
    updateAllDialog.style.display = "flex";
    blurLayer.style.display = "block";
}

function CloseUpdateAllDialog() {
    updateAllDialog.style.display = "none";
    blurLayer.style.display = "none";
}

function CloseUpdateTwitchDialog() {
    updateTwitchDialog.style.display = "none";
    blurLayer.style.display = "none";
}

function CloseUpdateKickDialog() {
    updateKickDialog.style.display = "none";
    blurLayer.style.display = "none";
}

function CloseUpdateYouTubeDialog() {
    updateYouTubeDialog.style.display = "none";
    blurLayer.style.display = "none";
}

async function UpdateAllSubmit() {
    await window.parent.sbClient.doAction(
        action = {
            id: sbActionUpdateStreamInfo
        },
        args = {
            platform: 'all',
            title: document.getElementById('all-title-input').value,
            category: document.getElementById('all-category-input').value
        }
    );

    // Set the YouTube title for next broadcast start
    if (includeYouTubeSetting.checked)
    {
        youtubeTitleOnBroadcastStart = document.getElementById('all-title-input').value;
        if (youtubeTitleOnBroadcastStart)
            youtubeTitleOnBroadcastStartLabel.textContent = `Title will be set to '${youtubeTitleOnBroadcastStart}' when broadcast starts.`;
    }
    else {
        youtubeTitleOnBroadcastStart = '';
        youtubeTitleOnBroadcastStartLabel.textContent = '';
    }

    CloseUpdateAllDialog();
}

async function UpdateTwitchSubmit() {
    await window.parent.sbClient.doAction(
        action = {
            id: sbActionUpdateStreamInfo
        },
        args = {
            platform: 'twitch',
            title: document.getElementById('twitch-title-input').value,
            category: document.getElementById('twitch-category-input').value,
            tags: document.getElementById('twitch-tags-input').value
        }
    );

    CloseUpdateTwitchDialog();
}

async function UpdateKickSubmit() {
    await window.parent.sbClient.doAction(
        action = {
            id: sbActionUpdateStreamInfo
        },
        args = {
            platform: 'kick',
            title: document.getElementById('kick-title-input').value,
            category: document.getElementById('kick-category-input').value
        }
    );

    CloseUpdateKickDialog();
}

async function UpdateYouTubeSubmit() {
    await window.parent.sbClient.doAction(
        action = {
            id: sbActionUpdateStreamInfo
        },
        args = {
            platform: 'youtube',
            title: document.getElementById('youtube-title-input').value,
            description: document.getElementById('youtube-description-input').value,
            category: document.getElementById('youtube-category-input').value,
            tags: document.getElementById('youtube-tags-input').value,
            privacy: document.getElementById('youtube-privacy-select').value,
            broadcastId: currentBroadcastId
        }
    );

    CloseUpdateYouTubeDialog();
}



/////////////////////
// DATA VALIDATION //
/////////////////////

const GLOBAL_TITLE_MAX = 100;
const TWITCH_TITLE_MAX = 140;
const TWITCH_TAGS_MAX = 10;
const KICK_TITLE_MAX = 100;
const YOUTUBE_TITLE_MAX = 100;
const YOUTUBE_DESCRIPTION_MAX = 5000;
const YOUTUBE_TAGS_MAX = 500;

const allTitleInput = document.getElementById("all-title-input");
const twitchTitleInput = document.getElementById("twitch-title-input");
const twitchTagsInput = document.getElementById("twitch-tags-input");
const kickTitleInput = document.getElementById("kick-title-input");
const youtubeTitleInput = document.getElementById("youtube-title-input");
const youtubeDescriptionInput = document.getElementById("youtube-description-input");
const youtubeTagsInput = document.getElementById("youtube-tags-input");

// Function to update char count and handle validation
function ValidateUpdateAllDialog() {
    // Get references to elements
    const allTitleCharLimit = document.getElementById('all-title-char-limit');
    const allCharCount = document.getElementById('all-title-char-count');
    const allTitleCharMax = document.getElementById('all-title-char-max');
    const allUpdateButton = document.getElementById('all-submit-button');

    // Validate title field
    const currentLength = allTitleInput.value.length;
    allCharCount.textContent = currentLength;
    allTitleCharMax.textContent = GLOBAL_TITLE_MAX;
    
    if (currentLength > GLOBAL_TITLE_MAX)
        allTitleCharLimit.style.color = getComputedStyle(document.documentElement).getPropertyValue('--error-text-color');
    else
        allTitleCharLimit.style.color = ""; // reset to default

    // Set button interactability (yes, that is a word — look it up)
    if (currentLength > GLOBAL_TITLE_MAX)
        allUpdateButton.disabled = true;
    else
        allUpdateButton.disabled = false;
}

// Function to update char count and handle validation
function ValidateTwitchDialog() {
    // Get references to elements
    const twitchTitleCharLimit = document.getElementById('twitch-title-char-limit');
    const twitchCharCount = document.getElementById('twitch-title-char-count');
    const twitchTitleCharMax = document.getElementById('twitch-title-char-max');
    const twitchTagsCharLimit = document.getElementById('twitch-tags-char-limit');
    const twitchTagsCharCount = document.getElementById('twitch-tags-char-count');
    const twitchTagsCharMax = document.getElementById('twitch-tags-char-max');
    const twitchTagsTooLongWarning = document.getElementById('twitch-tags-too-long-warning');
    const twitchUpdateButton = document.getElementById('twitch-submit-button');

    // Validate title field
    const currentLength = twitchTitleInput.value.length;
    twitchCharCount.textContent = currentLength;
    twitchTitleCharMax.textContent = TWITCH_TITLE_MAX;
    
    if (currentLength > TWITCH_TITLE_MAX)
        twitchTitleCharLimit.style.color = getComputedStyle(document.documentElement).getPropertyValue('--error-text-color');
    else
        twitchTitleCharLimit.style.color = ""; // reset to default

    // Validate tags field
    // Split by comma, trim each tag, sum lengths
    const tagsArray = twitchTagsInput.value
        .split(',')
        .map(tag => tag.trim())
        .filter(tag => tag.length > 0);

    const tagsLength = tagsArray.length;
    twitchTagsCharCount.textContent = tagsLength;
    twitchTagsCharMax.textContent = TWITCH_TAGS_MAX;

    if (tagsLength > TWITCH_TAGS_MAX)
        twitchTagsCharLimit.style.color = getComputedStyle(document.documentElement).getPropertyValue('--error-text-color');
    else
        twitchTagsCharLimit.style.color = ""; // reset to default

    // Also check that each tag is under 25 characters
    const hasLongTag = tagsArray.some(tag => tag.length > 25);
    if (hasLongTag) {
        twitchTagsTooLongWarning.style.display = 'inline';
        twitchTagsCharLimit.style.color = getComputedStyle(document.documentElement).getPropertyValue('--error-text-color');
    }
    else {
        twitchTagsTooLongWarning.style.display = 'none';
        twitchTagsCharLimit.style.color = ""; // reset to default
    }

    // Set button interactability (yes, that is a word — look it up)
    if (currentLength > TWITCH_TITLE_MAX || tagsLength > TWITCH_TAGS_MAX || hasLongTag)
        twitchUpdateButton.disabled = true;
    else
        twitchUpdateButton.disabled = false;
}

// Function to update char count and handle validation
function ValidateKickDialog() {
    // Get references to elements
    const kickTitleCharLimit = document.getElementById('kick-title-char-limit');
    const kickCharCount = document.getElementById('kick-title-char-count');
    const kickTitleCharMax = document.getElementById('kick-title-char-max');
    const kickUpdateButton = document.getElementById('kick-submit-button');

    // Validate title field
    const currentLength = kickTitleInput.value.length;
    kickCharCount.textContent = currentLength;
    kickTitleCharMax.textContent = KICK_TITLE_MAX;

    if (currentLength > KICK_TITLE_MAX)
        kickTitleCharLimit.style.color = getComputedStyle(document.documentElement).getPropertyValue('--error-text-color');
    else
        kickTitleCharLimit.style.color = ""; // reset to default

    // Set button interactability (yes, that is a word — look it up)
    if (currentLength > KICK_TITLE_MAX)
        kickUpdateButton.disabled = true;
    else
        kickUpdateButton.disabled = false;
}

function ValidateYouTubeDialog() {
    // Get references to elements
    const youtubeTitleCharLimit = document.getElementById('youtube-title-char-limit');
    const youtubeTitleCharCount = document.getElementById('youtube-title-char-count');
    const youtubeTitleCharMax = document.getElementById('youtube-title-char-max');
    const youtubeDescriptionCharLimit = document.getElementById('youtube-description-char-limit');
    const youtubeDescriptionCharCount = document.getElementById('youtube-description-char-count');
    const youtubeDescriptionCharMax = document.getElementById('youtube-description-char-max');
    const youtubeTagsCharLimit = document.getElementById('youtube-tags-char-limit');
    const youtubeTagsCharCount = document.getElementById('youtube-tags-char-count');
    const youtubeTagsCharMax = document.getElementById('youtube-tags-char-max');
    const youtubeUpdateButton = document.getElementById('youtube-submit-button');

    // Validate title field
    const titleLength = youtubeTitleInput.value.length;
    youtubeTitleCharCount.textContent = titleLength;
    youtubeTitleCharMax.textContent = YOUTUBE_TITLE_MAX;

    if (titleLength > YOUTUBE_TITLE_MAX)
        youtubeTitleCharLimit.style.color = getComputedStyle(document.documentElement).getPropertyValue('--error-text-color');
    else
        youtubeTitleCharLimit.style.color = ""; // reset to default

    // Validate description field
    const descriptionLength = youtubeDescriptionInput.value.length;
    youtubeDescriptionCharCount.textContent = descriptionLength;
    youtubeDescriptionCharMax.textContent = YOUTUBE_DESCRIPTION_MAX;

    if (descriptionLength > YOUTUBE_DESCRIPTION_MAX)
        youtubeDescriptionCharLimit.style.color = getComputedStyle(document.documentElement).getPropertyValue('--error-text-color');
    else
        youtubeDescriptionCharLimit.style.color = ""; // reset to default

    // Validate tags field
    // Split by comma, trim each tag, sum lengths
    const tagsArray = youtubeTagsInput.value
        .split(',')
        .map(tag => tag.trim())
        .filter(tag => tag.length > 0);

    const tagsLength = tagsArray.reduce((sum, tag) => sum + tag.length, 0) + (tagsArray.length > 0 ? tagsArray.length - 1 : 0);
    youtubeTagsCharCount.textContent = tagsLength;
    youtubeTagsCharMax.textContent = YOUTUBE_TAGS_MAX;

    if (tagsLength > YOUTUBE_TAGS_MAX)
        youtubeTagsCharLimit.style.color = getComputedStyle(document.documentElement).getPropertyValue('--error-text-color');
    else
        youtubeTagsCharLimit.style.color = ""; // reset to default

    // Set button interactability (yes, that is a word — look it up)
    if (titleLength > YOUTUBE_TITLE_MAX || descriptionLength > YOUTUBE_DESCRIPTION_MAX || tagsLength > YOUTUBE_TAGS_MAX)
        youtubeUpdateButton.disabled = true;
    else
        youtubeUpdateButton.disabled = false;
}

// Attach event listener
allTitleInput.addEventListener("input", ValidateUpdateAllDialog);
twitchTitleInput.addEventListener("input", ValidateTwitchDialog);
twitchTagsInput.addEventListener("input", ValidateTwitchDialog);
kickTitleInput.addEventListener("input", ValidateKickDialog);
youtubeTitleInput.addEventListener("input", ValidateYouTubeDialog);
youtubeDescriptionInput.addEventListener("input", ValidateYouTubeDialog);
youtubeTagsInput.addEventListener("input", ValidateYouTubeDialog);

// Initial check (in case the input has prefilled text)
ValidateUpdateAllDialog();
ValidateTwitchDialog();
ValidateKickDialog();
ValidateYouTubeDialog();




////////////////////////////
// REFRESH BROADCAST LIST //
////////////////////////////

setInterval(FetchKickInfo, 5000);