const queryString = window.location.search;
const urlParams = new URLSearchParams(queryString);

const settingsJson = urlParams.get("settingsJson") || "";

document.addEventListener('DOMContentLoaded', () => {
  const settingsContent = document.getElementById('settings-content');
  const saveButton = document.getElementById('save-settings');

  fetch(settingsJson)
  //fetch('settings.json')
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

          const labelDescriptionDiv = document.createElement('div');

          const label = document.createElement('label');
          label.textContent = setting.label;
          labelDescriptionDiv.appendChild(label);

          if (setting.description) {
            const description = document.createElement('p');
            description.textContent = setting.description;
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
                inputElement.value = setting.defaultValue;
                inputElement.appendChild(optionElement);
              });
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
            default:
              inputElement = document.createElement('input');
              inputElement.type = 'text';
              inputElement.id = setting.id; //Added setting ID
              inputElement.value = setting.defaultValue;
          }

          inputElement.addEventListener('input', function (event) {
            SendDateToParent(data);
          });

          settingItemContent.appendChild(inputElement);

          settingItem.appendChild(labelDescriptionDiv);
          settingItem.appendChild(settingItemContent);
          groupDiv.appendChild(settingItem);
        });

        settingsContent.appendChild(groupDiv);
      }

      // saveButton.addEventListener('click', () => {
      //   SendDateToParent(data);
      // });
      SendDateToParent(data);
    })
    .catch(error => console.error('Error loading settings:', error));
});


// In the iframe's JavaScript:
function SendDateToParent(data) {
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

widgetURLBox.addEventListener('click', () => {
  let loadSettingsBox = document.getElementById('mommy-milkers');
  loadSettingsBox.style.visibility = 'visible';
  loadSettingsBox.style.opacity = 1;
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
    if (inputElement != null)
    {
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
}

function OpenMembershipPage() {
    window.open("https://nutty.gg/supporters/sign_in", '_blank').focus();
}