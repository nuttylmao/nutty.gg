let settingsContainer = document.getElementById('settings-container');
settingsContainer.src = `../../".utilities"/settings-page-builder?settingsJson=${window.location.href}/settings.json`
console.log(settingsContainer.src);

function reloadWidget(data) {
    let widget = document.getElementById("widget");
    widget.src = `${getParentUrl()}?${data}`;
}

function getParentUrl() {
    const currentUrl = window.location.href;
    const urlParts = currentUrl.split('/');

    // Remove the last part of the URL (the current page/file)
    urlParts.pop();

    // Remove the last part again to go one directory up
    urlParts.pop();

    // Reconstruct the URL
    const parentUrl = urlParts.join('/');

    // Ensure there's a trailing slash if necessary (if it was a directory)
    if (urlParts.length > 2 && !parentUrl.endsWith('/')) {
        return parentUrl + '/';
    }

    return parentUrl;
}