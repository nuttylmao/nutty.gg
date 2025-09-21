//////////////////////
// GLOBAL VARIABLES //
//////////////////////

const avatarMap = new Map();
const pronounMap = new Map();



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

	const intValue = parseInt(paramValue, 10); // Parse as base 10 integer

	if (isNaN(intValue)) {
		return null; // or handle the error in another way, e.g., throw an error
	}

	return intValue;
}

async function GetKickIds(username) {
    // First attempt with the original username
    let url = `https://kick.com/api/v2/channels/${username}`;

    try {
        let response = await fetch(url);
        if (!response.ok) {
            // Retry with underscores replaced by dashes
            const altUsername = username.replace(/_/g, "-");
            url = `https://kick.com/api/v2/channels/${altUsername}`;
            response = await fetch(url);
            if (!response.ok) {
                throw new Error(`HTTP error ${response.status}`);
            }
        }

        const data = await response.json();
        if (data.chatroom && data.chatroom.id) {
            return { chatroomId: data.chatroom.id, channelId: data.chatroom.channel_id };
        } else {
            throw new Error("Chatroom ID not found in response.");
        }
    } catch (error) {
        console.error("Failed to fetch chatroom ID:", error.message);
        return null;
    }
}

async function GetKickSubBadges(username) {
    let url = `https://kick.com/api/v2/channels/${username}`;

    try {
        let response = await fetch(url);
        if (!response.ok) {
            // Retry with underscores replaced by dashes
            const altUsername = username.replace(/_/g, "-");
            url = `https://kick.com/api/v2/channels/${altUsername}`;
            response = await fetch(url);
            if (!response.ok) {
                throw new Error(`HTTP error ${response.status}`);
            }
        }

        const data = await response.json();
        return data.subscriber_badges || [];
    } catch (error) {
        console.error("Failed to fetch subscriber badges:", error.message);
        return [];
    }
}

async function GetAvatar(username, platform) {
    // First, check if the username is hashed already
    if (avatarMap.has(`${username}-${platform}`)) {
        console.debug(`Avatar found for ${username} (${platform}). Retrieving from hash map.`);
        return avatarMap.get(`${username}-${platform}`);
    }

    // If code reaches this point, the username hasn't been hashed, so retrieve avatar
    switch (platform) {
        case 'twitch': {
            console.debug(`No avatar found for ${username} (${platform}). Retrieving from Decapi.`);
            let response = await fetch('https://decapi.me/twitch/avatar/' + username);
            let data = await response.text();
            avatarMap.set(`${username}-${platform}`, data);
            return data;
        }
        case 'kick': {
            console.debug(`No avatar found for ${username} (${platform}). Retrieving from Kick.`);

            let url = `https://kick.com/api/v2/channels/${username}`;
            try {
                let response = await fetch(url);
                if (!response.ok) {
                    // Retry with underscores replaced by dashes
                    const altUsername = username.replace(/_/g, "-");
                    url = `https://kick.com/api/v2/channels/${altUsername}`;
                    response = await fetch(url);
                    if (!response.ok) {
                        throw new Error(`HTTP error ${response.status}`);
                    }
                }

                let data = await response.json();
                let avatarURL = data.user?.profile_pic || 'https://kick.com/img/default-profile-pictures/default2.jpeg';
                avatarMap.set(`${username}-${platform}`, avatarURL);
                return avatarURL;
            } catch (error) {
                console.error("Failed to fetch avatar:", error.message);
                return 'https://kick.com/img/default-profile-pictures/default2.jpeg';
            }
        }
    }
}

async function GetPronouns(platform, username) {
	if (pronounMap.has(username)) {
		console.debug(`Pronouns found for ${username}. Retrieving from hash map.`)
		return pronounMap.get(username);
	}
	else {
		console.debug(`No pronouns found for ${username}. Retrieving from alejo.io.`)
		const response = await client.getUserPronouns(platform, username);
		const userFound = response.pronoun.userFound;
		const pronouns = userFound ? `${response.pronoun.pronounSubject}/${response.pronoun.pronounObject}` : '';

		pronounMap.set(username, pronouns);

		return pronouns;
	}
}

function GetCurrentTimeFormatted() {
	const now = new Date();
	let hours = now.getHours();
	const minutes = String(now.getMinutes()).padStart(2, '0');
	const ampm = hours >= 12 ? 'PM' : 'AM';

	hours = hours % 12;
	hours = hours ? hours : 12; // the hour '0' should be '12'

	const formattedTime = `${hours}:${minutes} ${ampm}`;
	return formattedTime;
}

function DecodeHTMLString(html) {
	var txt = document.createElement("textarea");
	txt.innerHTML = html;
	return txt.value;
}

function TranslateToFurry(sentence) {
	const words = sentence.toLowerCase().split(/\b/);

	const furryWords = words.map(word => {
		if (/\w+/.test(word)) {
			let newWord = word;

			// Common substitutions
			newWord = newWord.replace(/l/g, 'w');
			newWord = newWord.replace(/r/g, 'w');
			newWord = newWord.replace(/th/g, 'f');
			newWord = newWord.replace(/you/g, 'yous');
			newWord = newWord.replace(/my/g, 'mah');
			newWord = newWord.replace(/me/g, 'meh');
			newWord = newWord.replace(/am/g, 'am');
			newWord = newWord.replace(/is/g, 'is');
			newWord = newWord.replace(/are/g, 'are');
			newWord = newWord.replace(/very/g, 'vewy');
			newWord = newWord.replace(/pretty/g, 'pwetty');
			newWord = newWord.replace(/little/g, 'wittle');
			newWord = newWord.replace(/nice/g, 'nyce');

			// Random additions
			if (Math.random() < 0.15) {
				newWord += ' nya~';
			} else if (Math.random() < 0.1) {
				newWord += ' >w<';
			} else if (Math.random() < 0.05) {
				newWord += ' owo';
			}

			return newWord;
		}
		return word;
	});

	return furryWords.join('');
}

function EscapeRegExp(string) {
	return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // $& means the whole matched string
}
