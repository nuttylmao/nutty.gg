// Search paramaters
const queryString = window.location.search;
const urlParams = new URLSearchParams(queryString);
const settingsJson = urlParams.get("settingsJson") || "";
const widgetURL = urlParams.get("widgetURL") || "";
const showUnmuteIndicator = GetBooleanParam("showUnmuteIndicator", false);

// Page elements
const widgetUrlInputWrapper = document.getElementById('widgetUrlInputWrapper');
const widgetUrlInput = document.getElementById('widgetUrlInput');
const urlLabel = document.getElementById('urlLabel');
const settingsPanel = document.getElementById('settingsPanel');
const widgetPreview = document.getElementById('widgetPreview');
const loadURLBox = document.getElementById('loadUrlBox');
const cancelSettingsButton = document.getElementById('cancelSettingsButton');
const loadSettingsBox = document.getElementById('loadSettingsWrapper');
const unmuteLabel = document.getElementById('unmute-label');

if (showUnmuteIndicator)
	unmuteLabel.style.display = 'inline';



/////////////////////////////
// LOAD FROM SETTINGS.JSON //
/////////////////////////////

fetch(settingsJson)
	.then(response => response.json())
	.then(data => {
		const groupedSettings = {};

		// Group settings by their 'group' property
		data.settings.forEach(setting => {
			if (!groupedSettings[setting.group]) {
				groupedSettings[setting.group] = [];
			}
			groupedSettings[setting.group].push(setting);
		});

		// Render settings for each group
		for (const groupName in groupedSettings) {
			const groupDiv = document.createElement('div');
			groupDiv.classList.add('setting-group');

			const groupHeader = document.createElement('h2');
			groupHeader.textContent = groupName;
			groupDiv.appendChild(groupHeader);

			groupedSettings[groupName].forEach(setting => {
				const settingItem = document.createElement('div');
				settingItem.classList.add('setting-item');
				settingItem.id = `item-${setting.id}`;

				const labelDescriptionDiv = document.createElement('div');

				if (setting.label) {
					const label = document.createElement('label');
					label.textContent = setting.label;
					labelDescriptionDiv.appendChild(label);
				}

				if (setting.description) {
					const description = document.createElement('p');
					description.innerHTML = setting.description;
					labelDescriptionDiv.appendChild(description);
				}

				const settingItemContent = document.createElement('div');
				settingItemContent.classList.add('setting-item-content');

				let inputElement;
				switch (setting.type) {
					case 'text':
						inputElement = document.createElement('input');
						inputElement.type = 'text';
						inputElement.id = setting.id; //Added setting ID
						inputElement.value = setting.defaultValue;
						break;
					case 'checkbox':
						const labelDiv = document.createElement('label');
						labelDiv.classList.add('switch');
						checkBoxElement = document.createElement('input');
						checkBoxElement.type = 'checkbox';
						checkBoxElement.id = setting.id;
						checkBoxElement.checked = setting.defaultValue;
						labelDiv.appendChild(checkBoxElement);

						const slider = document.createElement('span');
						slider.classList.add('slider');
						slider.classList.add('round');
						labelDiv.appendChild(slider);

						// Add event listener to the switchDiv
						labelDiv.addEventListener('click', () => {
							checkBoxElement.checked = !checkBoxElement.checked;
							UpdateSettingItemVisibility();
						});
						inputElement = labelDiv;
						break;
					case 'select':
						inputElement = document.createElement('select');
						inputElement.id = setting.id; //Added setting ID
						setting.options.forEach(option => {
							const optionElement = document.createElement('option');
							optionElement.value = option.value;
							optionElement.textContent = option.label;
							if (option === setting.defaultValue) {
								optionElement.selected = true;
							}
							inputElement.appendChild(optionElement);
						});
						inputElement.value = setting.defaultValue;
						break;
					case 'color':
						inputElement = document.createElement('input');
						inputElement.type = 'color';
						inputElement.id = setting.id; //Added setting ID
						inputElement.value = setting.defaultValue;
						break;
					case 'number':
						inputElement = document.createElement('input');
						inputElement.type = 'number';
						inputElement.id = setting.id; //Added setting ID
						inputElement.value = setting.defaultValue;
						inputElement.min = setting.min;
						inputElement.max = setting.max;
						inputElement.step = setting.step;
						break;
					case 'sb-actions':
						inputElement = document.createElement('input');
						inputElement.type = 'text';
						inputElement.placeholder = 'Type to search...';
						inputElement.id = setting.id; //Added setting ID
						inputElement.value = setting.defaultValue;
						inputElement.setAttribute('list', 'streamer-bot-actions');
						inputElement.autocomplete = 'off';
						break;
					case 'button':
						inputElement = document.createElement('button');
						inputElement.id = setting.id; //Added setting ID
						inputElement.textContent = setting.label;

						inputElement.addEventListener('click', () => {
							widgetPreview.contentWindow[setting.callFunction]();

							const defaultBackgroundColor = "#2e2e2e";
							const defaultTextColor = "white";

							inputElement.style.transitionDuration = '0s'
							inputElement.style.backgroundColor = "#2196f3"
							inputElement.style.color = "#ffffff";

							setTimeout(() => {
								inputElement.style.transitionDuration = '0.2s'
								inputElement.style.backgroundColor = defaultBackgroundColor;
								inputElement.style.color = defaultTextColor;
							}, 100);
						});
						break;
					default:
						inputElement = document.createElement('input');
						inputElement.type = 'text';
						inputElement.id = setting.id; //Added setting ID
						inputElement.value = setting.defaultValue;
				}

				inputElement.addEventListener('input', function (event) {
					RefreshWidgetPreview(data);
				});

				settingItemContent.appendChild(inputElement);

				if (setting.type == 'button') {
					settingItem.style.display = 'block'
					settingItem.appendChild(settingItemContent);
				}
				else {
					settingItem.appendChild(labelDescriptionDiv);
					settingItem.appendChild(settingItemContent);
				}

				groupDiv.appendChild(settingItem);
			});

			settingsPanel.appendChild(groupDiv);
		}

		function UpdateSettingItemVisibility() {
			data.settings.forEach(setting => {
				if (setting.showIf) {
					if (!document.getElementById(setting.showIf).checked)
						document.getElementById(`item-${setting.id}`).style.display = 'none'
					else
						document.getElementById(`item-${setting.id}`).style.display = 'flex'
				}
			});
		}

		UpdateSettingItemVisibility();
		RefreshWidgetPreview(data);
	})
	.catch(error => console.error('Error loading settings:', error));



function RefreshWidgetPreview(data) {
	const settings = {};
	data.settings.forEach(setting => {
		let inputElement = document.getElementById(setting.id);

		if (setting.type === 'checkbox') {
			settings[setting.id] = inputElement.checked;
		} else {
			settings[setting.id] = inputElement.value;
		}
	});

	// Generate parameter string
	const paramString = Object.entries(settings)
		.map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
		.join('&');

	console.debug('Parameter String:', paramString);

	widgetUrlInput.value = widgetURL + "?" + paramString;
	widgetPreview.src = widgetUrlInput.value;
}



//////////////////
// STREAMER.BOT //
//////////////////

// Connect to Streamer.bot and get list of actions
const sbServerAddress = '127.0.0.1';
const sbServerPort = '8080';
const client = new StreamerbotClient({
	host: sbServerAddress,
	port: sbServerPort,

	onConnect: (data) => {
		console.log(`Streamer.bot successfully connected to ${sbServerAddress}:${sbServerPort}`)
		console.debug(data);

		// Get list of actions
		GetSBActions();
	},

	onDisconnect: () => {
		console.error(`Streamer.bot disconnected from ${sbServerAddress}:${sbServerPort}`)
	}
});

async function GetSBActions() {
	const response = await client.getActions();

	console.debug(response);

	const datalistElement = document.createElement('datalist');
	datalistElement.id = 'streamer-bot-actions';

	for (const action of response.actions) {
		const option = document.createElement('option');
		option.value = action.name;
		datalistElement.appendChild(option);
	}

	document.body.appendChild(datalistElement);
}



/////////////////////////
// BUTTON CLICK EVENTS //
/////////////////////////

function CopyURLToClipboard() {
	// Copy to clipboard
	navigator.clipboard.writeText(widgetUrlInput.value);

	// Create the "Copied!" message
	const copiedMessage = document.createElement('span');
	copiedMessage.textContent = 'Copied to clipboard!';
	copiedMessage.style.textAlign = 'center';
	copiedMessage.style.fontWeight = 'absolute';
	copiedMessage.style.position = 'absolute';
	copiedMessage.style.top = '50%';
	copiedMessage.style.left = '50%';
	copiedMessage.style.transform = 'translate(-50%, -50%)';
	copiedMessage.style.backgroundColor = '#00dd63'; // Green with some transparency
	copiedMessage.style.color = 'white';
	copiedMessage.style.padding = '5px 10px';
	copiedMessage.style.borderRadius = '5px';
	copiedMessage.style.fontWeight = '500';
	copiedMessage.style.zIndex = '2'; // Ensure it's above the input and label
	copiedMessage.style.opacity = '0'; // Start with opacity 0 for fade-in
	copiedMessage.style.transition = 'opacity 0.2s ease-in-out';

	widgetUrlInputWrapper.appendChild(copiedMessage);

	// Force a reflow to trigger the transition
	void copiedMessage.offsetWidth;

	// Fade in the message
	copiedMessage.style.opacity = '1';

	// Fade out and remove the message after 3 seconds
	setTimeout(() => {
		copiedMessage.style.opacity = '0';
		setTimeout(() => {
			widgetUrlInputWrapper.removeChild(copiedMessage);
		}, 500); // Wait for the fade-out
	}, 5000);
}

function CloseSettings() {
	loadSettingsBox.style.visibility = 'hidden';
	loadSettingsBox.style.opacity = 0;
};

function LoadSettings() {
	const url = new URL(loadURLBox.value);

	url.searchParams.forEach((value, key) => {

		const inputElement = document.getElementById(key);
		if (inputElement != null) {
			if (inputElement.type == 'checkbox')
				inputElement.checked = value.toLocaleLowerCase() == 'true';
			else
				inputElement.value = value;
		}
	});

	loadURLBox.value = '';

	loadSettingsBox.style.visibility = 'hidden';
	loadSettingsBox.style.opacity = 0;
}

function OpenMembershipPage() {
	window.open("https://nutty.gg/collections/member-exclusive-widgets", '_blank').focus();
}

function OpenLoadSettingsPopup() {
	loadSettingsBox.style.visibility = 'visible';
	loadSettingsBox.style.opacity = 1;
}



//////////////////////
// HELPER FUNCTIONS //
//////////////////////

function GetBooleanParam(paramName, defaultValue) {
	const urlParams = new URLSearchParams(window.location.search);
	const paramValue = urlParams.get(paramName);

	if (paramValue === null) {
		return defaultValue; // Parameter not found
	}

	const lowercaseValue = paramValue.toLowerCase(); // Handle case-insensitivity

	if (lowercaseValue === 'true') {
		return true;
	} else if (lowercaseValue === 'false') {
		return false;
	} else {
		return paramValue; // Return original string if not 'true' or 'false'
	}
}

function GetIntParam(paramName, defaultValue) {
	const urlParams = new URLSearchParams(window.location.search);
	const paramValue = urlParams.get(paramName);

	if (paramValue === null) {
		return defaultValue; // or undefined, or a default value, depending on your needs
	}

	console.log(paramValue);

	const intValue = parseInt(paramValue, 10); // Parse as base 10 integer

	if (isNaN(intValue)) {
		return null; // or handle the error in another way, e.g., throw an error
	}

	return intValue;
}


// Handle first window interaction
window.addEventListener('message', (event) => {
	if (event.origin === new URL(widgetPreview.src).origin && event.data === 'iframe-interacted') {
		iframeHasBeenInteractedWith = true;
		console.log('Iframe has been interacted with!');
		unmuteLabel.style.display = 'none';
	}
});