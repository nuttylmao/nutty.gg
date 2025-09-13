//////////////////////
// GLOBAL VARIABLES //
//////////////////////

const sbActionFetchBroadcasts = '9486774d-d706-41d8-85b4-7daff5cd1b0d';
const sbActionUpdateStreamInfo = '1c58eff0-e98a-4fab-86f0-6f5cee1d3ab3';
const sbActionOpenUrl = '14da1d44-6e29-4582-92c3-2c59388be57e';

let currentBroadcastId = '';


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



/////////////////////////
// STREAMER.BOT EVENTS //
/////////////////////////

window.addEventListener("message", (event) => {
    FetchBroadcasts();
});

window.parent.sbClient.on('General.Custom', (response) => {
    GeneralCustom(response.data);
})



///////////////////////////////
// MULTISTREAM TITLE UPDATER //
///////////////////////////////

async function GeneralCustom(data) {
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
                    const ytBroadcastCount = data.broadcastList.filter(b => b.platform === "youtube").length;
                    if (ytBroadcastCount <= 0)
                        youtubeWarning.style.display = 'inline';
                    else
                        youtubeWarning.style.display = 'none';
                }
                else
                    youtubeWarning.style.display = 'none';

                // Check if any broadcasts have gone offline
                // 		If so, delete them from the list
                const childDivs = broadcastList.querySelectorAll(":scope > div");
                childDivs.forEach(childDiv => {
                    var result = data.broadcastList.find(obj => {
                        return obj.id === childDiv.id
                    })
                    if (result == null)
                        childDiv.remove();
                });
            }
            break;
    }
}

async function FetchBroadcasts() {
    // Fetch from Streamer.bot
    await window.parent.sbClient.doAction({ id: sbActionFetchBroadcasts});
}

async function AddBroadcast(data) {
    // Get a reference to the template
    const template = document.getElementById('broadcast-template');

    const existingDiv = broadcastList.querySelector(`#${data.id}`);

    // Create a new instance of the template
    const instance = existingDiv ? existingDiv : template.content.cloneNode(true);

    // Get divs
    const broadcastEl = instance.querySelector('.broadcast');
    const platformIconEl = instance.querySelector('#platform-icon');
    const titleEl = instance.querySelector('#broadcast-title');
    const categoryEl = instance.querySelector('#broadcast-category');
    const kickWarningEl = instance.querySelector('#kick-warning');
    const streamButtonEl = instance.querySelector('#broadcast-stream-button');
    const dashboardButtonEl = instance.querySelector('#broadcast-dashboard-button');
    const editButtonEl = instance.querySelector('#broadcast-edit-button');

    // Set properties
    if (!existingDiv)
        broadcastEl.id = data.id;

    // Set the platform icon
    platformIconEl.src = `icons/platforms/${data.platform}.png`;
    
    // Set the stream title
    if (data.title)
        titleEl.textContent = data.title;
    
    // Set the stream category
    if (data.category)
        categoryEl.textContent = data.category;

    // Streamer.bot does not provide title/category for Kick, so pull from API
    if (data.platform == 'kick')
    {
        let response = await fetch('https://kick.com/api/v1/channels/' + data.userLogin);
        let response_data = await response.json();
        
        // The current title is only provided if the stream if currently live
        if (response_data.livestream)
        {
            titleEl.textContent = response_data.livestream.session_title;
            categoryEl.textContent = response_data.livestream.categories[0].name;
            kickWarningEl.style.display = 'none';
        }
        else if (response_data.previous_livestreams)
        {
            titleEl.textContent = response_data.previous_livestreams[0].session_title;
            categoryEl.textContent = response_data.previous_livestreams[0].categories[0].name;
            kickWarningEl.style.display = 'inline';
        }
        else
        {
            kickWarningEl.style.display = 'inline';
        }
    }
    
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
                document.getElementById('update-twitch-title-input').value = titleEl.textContent;
                document.getElementById('update-twitch-category-input').value = categoryEl.textContent;
                updateTwitchDialog.style.display = "flex";
                break;
            case 'kick':
                document.getElementById('update-kick-title-input').value = titleEl.textContent;
                document.getElementById('update-kick-category-input').value = categoryEl.textContent;
                updateKickDialog.style.display = "flex";
                break;
            case 'youtube':
                currentBroadcastId = broadcastEl.id;
                document.getElementById('update-youtube-title-input').value = data.title;
                document.getElementById('update-youtube-description-input').value = data.description;
                document.getElementById('update-youtube-category-input').value = data.category;
                document.getElementById('update-youtube-privacy-select').value = data.privacy;
                updateYouTubeDialog.style.display = "flex";
                break;
        }
        blurLayer.style.display = "block";
    };

    if (!existingDiv)
        broadcastList.appendChild(instance);
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
            title: document.getElementById('update-all-title-input').value,
            category: document.getElementById('update-all-category-input').value
        }
    );

    CloseUpdateAllDialog();
}

async function UpdateTwitchSubmit() {
    await window.parent.sbClient.doAction(
        action = {
            id: sbActionUpdateStreamInfo
        },
        args = {
            platform: 'twitch',
            title: document.getElementById('update-twitch-title-input').value,
            category: document.getElementById('update-twitch-category-input').value,
            tags: document.getElementById('update-twitch-tags-input').value
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
            title: document.getElementById('update-kick-title-input').value,
            category: document.getElementById('update-kick-category-input').value
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
            title: document.getElementById('update-youtube-title-input').value,
            description: document.getElementById('update-youtube-description-input').value,
            category: document.getElementById('update-youtube-category-input').value,
            tags: document.getElementById('update-youtube-tags-input').value,
            privacy: document.getElementById('update-youtube-privacy-select').value,
            broadcastId: currentBroadcastId
        }
    );

    CloseUpdateYouTubeDialog();
}





////////////////////////////
// REFRESH BROADCAST LIST //
////////////////////////////

setInterval(FetchBroadcasts, 5000);