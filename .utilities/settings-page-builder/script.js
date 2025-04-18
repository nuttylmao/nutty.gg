// Search paramaters
const queryString = window.location.search;
const urlParams = new URLSearchParams(queryString);
const settingsJson = urlParams.get("settingsJson") || "";

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

  for (const action of response.actions)
  {
    const option = document.createElement('option');  
    option.value = action.name;
    datalistElement.appendChild(option);
  }

  document.body.appendChild(datalistElement);
}

document.addEventListener('DOMContentLoaded', () => {

  const settingsContent = document.getElementById('settings-content');
  const saveButton = document.getElementById('save-settings');

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
                window.parent.callFunction(setting.callFunction);

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
            SendDataToParent(data);
          });

          settingItemContent.appendChild(inputElement);

          if (setting.type == 'button')
          {
            settingItem.style.display = 'block'
            settingItem.appendChild(settingItemContent);
          }
          else
          {
            settingItem.appendChild(labelDescriptionDiv);
            settingItem.appendChild(settingItemContent);
          }

          groupDiv.appendChild(settingItem);
        });

        settingsContent.appendChild(groupDiv);
      }

      function UpdateSettingItemVisibility() {
        data.settings.forEach(setting => {
          if (setting.hideIf)
          {
            if (!document.getElementById(setting.hideIf).checked)
              document.getElementById(`item-${setting.id}`).style.display = 'none'
            else
              document.getElementById(`item-${setting.id}`).style.display = 'flex'
          }
        });
      }

      UpdateSettingItemVisibility();

      // saveButton.addEventListener('click', () => {
      //   SendDataToParent(data);
      // });
      SendDataToParent(data);
    })
    .catch(error => console.error('Error loading settings:', error));
});


// In the iframe's JavaScript:
function SendDataToParent(data) {
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

  console.log('Parameter String:', paramString);

  let widgetURLBox = document.getElementById('widget-url');
  widgetURLBox.value = GetWidgetURL() + "?" + paramString;
  window.parent.reloadWidget(paramString);
}


let saveButton = document.getElementById('save-settings');
let widgetURLBox = document.getElementById('widget-url');
let cancelSettingsButton = document.getElementById('cancel-settings');

saveButton.addEventListener('click', () => {
  navigator.clipboard.writeText(widgetURLBox.value);

  const defaultBackgroundColor = "#2e2e2e";
  const defaultTextColor = "white";

  saveButton.innerText = "Copied to clipboard";
  saveButton.style.backgroundColor = "#00dd63"
  saveButton.style.color = "#ffffff";

  setTimeout(() => {
    saveButton.innerText = "Click to copy URL";
    saveButton.style.backgroundColor = defaultBackgroundColor;
    saveButton.style.color = defaultTextColor;
  }, 3000);
});

function CloseSettings() {
  let loadSettingsBox = document.getElementById('mommy-milkers');
  loadSettingsBox.style.visibility = 'hidden';
  loadSettingsBox.style.opacity = 0;
};

function LoadSettings() {
  let loadURLBox = document.getElementById('load-url');
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

  let loadSettingsBox = document.getElementById('mommy-milkers');
  loadSettingsBox.style.visibility = 'hidden';
  loadSettingsBox.style.opacity = 0;
}

function GetWidgetURL() {
  const parsedUrl = new URL(settingsJson);

  let result = parsedUrl.origin; // Base domain (protocol + hostname + port)

  const pathSegments = parsedUrl.pathname.split('/').filter(segment => segment); // Split and remove empty segments

  if (pathSegments.length > 0) {
    result += '/' + pathSegments[0]; // Add the first path segment
  }

  return result;
  //return 'D:/Projects/GitHub Projects/nutty.gg/multistream-alerts/index.html'
}

function OpenMembershipPage() {
  window.open("https://nutty.gg/supporters/sign_in", '_blank').focus();
}

function OpenLoadSettingsPopup() {
  let loadSettingsBox = document.getElementById('mommy-milkers');
  loadSettingsBox.style.visibility = 'visible';
  loadSettingsBox.style.opacity = 1;
}