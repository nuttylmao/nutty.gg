////////////////
// PARAMETERS //
////////////////

const queryString = window.location.search;
const urlParams = new URLSearchParams(queryString);

const configJson = urlParams.get("config") || "";


///////////////////
// PAGE ELEMENTS //
///////////////////

const sbConnectDialog = document.getElementById('sb-connect-dialog');
const sbAddressInput = document.getElementById('sb-address');
const sbPortInput = document.getElementById('sb-port');
const sbPasswordInput = document.getElementById('sb-password');
const sbErrorLabel = document.getElementById('sb-error-label');

const sbRequiredActionsDialog = document.getElementById('sb-required-actions-dialog');
const sbRequiredActionsSuccessLabel = document.getElementById('sb-required-actions-success');
const sbRequiredActionsFailureLabel = document.getElementById('sb-required-actions-failure');
const sbRequiredActionsFailureSubtext = document.getElementById('sb-required-actions-failure-subtext');

const sbRequiredActionsList = document.getElementById('sb-required-actions-list');
const sbImportCodeLabel = document.getElementById('sb-import-code');
const sbImportCopyButton = document.getElementById('sb-import-copy-button');

const sbActionsButton = document.getElementById('sb-actions-button');
const sbStatusButton = document.getElementById('sb-status-button');
const sbStatusIcon = document.getElementById('sb-status-icon');

const blurLayer = document.getElementById('blur-layer');

const contentIFrame = document.getElementById('content');


//////////////////////
// GLOBAL VARIABLES //
//////////////////////

let sbClientListeners;



/////////////////////////
// STREAMER.BOT CLIENT //
/////////////////////////

// Check local storage
if (localStorage.getItem('sbServerAddress') === null)
    localStorage.setItem('sbServerAddress', '127.0.0.1');
if (localStorage.getItem('sbServerPort') === null)
    localStorage.setItem('sbServerPort', '8080');

sbAddressInput.value = localStorage.getItem('sbServerAddress');
sbPortInput.value = localStorage.getItem('sbServerPort');
sbPasswordInput.value = localStorage.getItem('sbServerPassword');

const sbServerAddress = sbAddressInput.value;
const sbServerPort = sbPortInput.value;
const sbServerPassword = sbPasswordInput.value;

sbClient = new StreamerbotClient({
    host: sbServerAddress,
    port: sbServerPort,
    password: sbServerPassword,
    immediate: true,

    onConnect: (data) => {
        console.log(`Streamer.bot successfully connected to ${sbServerAddress}:${sbServerPort}`)
        console.debug(data);

        SetConnectionState(true);

        // Notify iframe
        contentIFrame.addEventListener("load", () => {
            NotifyTheContentIFrameThatSBHasConnectedSuccessfullySoItCanDoStuff(data);
        });
        NotifyTheContentIFrameThatSBHasConnectedSuccessfullySoItCanDoStuff();

        // Idk why but listeners get cleared when re-connecting, so copy them back in
        if (sbClientListeners)
            sbClient.listeners = sbClientListeners;
    },

    onDisconnect: () => {
        console.error(`Streamer.bot disconnected from ${sbServerAddress}:${sbServerPort}`)
        SetConnectionState(false);
    },

    onError: (err) => {
        console.error(`Streamer.bot disconnected from ${sbServerAddress}:${sbServerPort}`)
        SetErrorMessage(err);
    }
});

function SetConnectionState(isConnected) {
    if (isConnected) {
        localStorage.setItem('sbServerAddress', sbAddressInput.value);
        localStorage.setItem('sbServerPort', sbPortInput.value);
        localStorage.setItem('sbServerPassword', sbPasswordInput.value);

        sbConnectDialog.style.display = "none";
        blurLayer.style.display = "none";
        sbErrorLabel.style.display = 'none';
        sbStatusIcon.src = 'icons/connected.svg';

        sbStatusButton.title = `Connected to ${sbClient.info.name} (${sbClient.info.version})`;

        // Check required actions
        CheckRequiredActions();
    }
    else {
        sbConnectDialog.style.display = "flex";
        blurLayer.style.display = "block";
        sbStatusIcon.src = 'icons/disconnected.svg';

        SetErrorMessage('Disconnected from Streamer.bot');
    }
}

function SetErrorMessage(error) {
    sbErrorLabel.textContent = error;
    sbErrorLabel.style.display = 'block';
}



////////////
// CONFIG //
////////////

if (configJson) {
    // Set the header/title of the page
    fetch(configJson)
        .then(res => res.json())
        .then(config => {
            const root = document.documentElement;
            const domain = getComputedStyle(root).getPropertyValue('--domain').trim();

            // Set the page title
            parent.document.title = `${domain} • ${config.title}`;

            // Set the title label
            title.textContent = config.title;
        })
        .catch(err => console.error('Failed to load config:', err));
}

async function CheckRequiredActions() {
    if (configJson) {
        console.debug('Checking required actions...')

        // Set the header/title of the page
        fetch(configJson)
            .then(res => res.json())
            .then(async config => {
                // Clear the required actions list
                const sbRequiredActionsList = document.getElementById('sb-required-actions-list');
                sbRequiredActionsList.innerHTML = '';

                // Set the import code
                sbImportCodeLabel.textContent = config.sbImportCode;

                // Assume all actions are found
                SetRequiredActionState(true);

                // Check each required action
                if (config.requiredSbActions) {
                    // Get a full list of actions currently installed in Streamer.bot
                    const response = await sbClient.getActions();

                    // Iterate over required SB actions and check if they're present
                    config.requiredSbActions.forEach(req => {
                        const exists = response.actions.some(act => act.id === req.id);

                        console.debug(`${req.name}: ${exists ? 'Found' : 'Missing'}`)

                        // As soon as one is found that doesn't exist, throw up warning
                        if (!exists)
                            SetRequiredActionState(false);

                        // container div
                        const item = document.createElement('div');
                        item.className = 'sb-required-action';

                        // name label
                        const nameLabel = document.createElement('label');
                        nameLabel.textContent = req.name;

                        // status label
                        const statusLabel = document.createElement('label');
                        statusLabel.className = 'sb-required-action-found';
                        //statusLabel.textContent = exists ? '✅' : '❌';
                        statusLabel.textContent = exists ? 'Found' : 'Missing';
                        statusLabel.style.color = exists ? '#00d26a' : '#f92f60';
                        statusLabel.style.fontWeight = 500;

                        // append labels to div
                        item.appendChild(nameLabel);
                        item.appendChild(statusLabel);

                        // append div to list
                        sbRequiredActionsList.appendChild(item);
                    });
                }
                else {
                    // There are no required actions, so hide the button
                    sbActionsButton.style.display = 'none';
                }
            })
            .catch(err => console.error('Failed to load config:', err));
    }
}

function SetRequiredActionState(isSuccess) {
    if (isSuccess) {
        sbRequiredActionsSuccessLabel.style.display = 'block';
        sbRequiredActionsFailureLabel.style.display = 'none';
        sbRequiredActionsFailureSubtext.style.display = 'none';

        sbActionsButton.title = `All actions found`;

        sbActionsButton.textContent = '✅';
    }
    else {
        sbRequiredActionsSuccessLabel.style.display = 'none';
        sbRequiredActionsFailureLabel.style.display = 'block';
        sbRequiredActionsFailureSubtext.style.display = 'block';

        sbActionsButton.title = `You are missing Streamer.bot actions`;

        sbActionsButton.textContent = '⚠️';

        OpenRequiredActionsDialog();
    }
}


///////////////////////
// PAGE INTERACTIONS //
///////////////////////

function Connect() {
    sbClientListeners = sbClient.listeners;
    sbClient.options.host = sbAddressInput.value;
    sbClient.options.port = sbPortInput.value;
    sbClient.options.password = sbPasswordInput.value;
    sbClient.connect();
}

function CopyImportCode() {
    const textToCopy = sbImportCodeLabel.textContent;
    navigator.clipboard.writeText(textToCopy)
        .then(() => {
            console.debug('Copied to clipboard!');

            // Click feedback
            const root = document.documentElement;
            const successColor = getComputedStyle(root).getPropertyValue('--success-color').trim();
            const buttonColor = getComputedStyle(root).getPropertyValue('--button-color').trim();
            sbImportCopyButton.textContent = 'Copied!';
            sbImportCopyButton.style.background = successColor;
            setTimeout(() => {
                sbImportCopyButton.textContent = 'Copy';
                sbImportCopyButton.style.background = buttonColor;
            }, 1500);
        })
        .catch(err => console.error('Failed to copy text: ', err));
}

function OpenConnectDialog() {
    sbConnectDialog.style.display = "flex";
    blurLayer.style.display = "block";
}

function ClosenConnectDialog() {
    sbConnectDialog.style.display = "none";
    blurLayer.style.display = "none";
}

function OpenRequiredActionsDialog() {
    sbRequiredActionsDialog.style.display = "flex";
    blurLayer.style.display = "block";
}

function CloseRequiredActionsDialog() {
    sbRequiredActionsDialog.style.display = "none";
    blurLayer.style.display = "none";
}

function NotifyTheContentIFrameThatSBHasConnectedSuccessfullySoItCanDoStuff(data) {
    contentIFrame.contentWindow.postMessage(
        { type: "sbClientConnected", data },
        "*" // replace with iframe origin for security if needed
    );
}