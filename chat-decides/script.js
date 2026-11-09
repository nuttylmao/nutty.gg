////////////////
// PARAMETERS //
////////////////

const queryString = window.location.search;
const urlParams = new URLSearchParams(queryString);

let sbDebugMode = true;
const sbServerAddress = urlParams.get("address") || "127.0.0.1";
const sbServerPort = urlParams.get("port") || "8080";


/////////////////
// GLOBAL VARS //
/////////////////

let animationSpeed = 250;
let countdownInterval = null; // global variable to track the running interval



///////////////////
// PAGE ELEMENTS //
///////////////////

const pollContainer = document.getElementById('poll-container');
const questionLabel = document.getElementById('question-label');
const timerLabel = document.getElementById('timer-label');
const responseResultsList = document.getElementById('response-results-list');



/////////////
// OPTIONS //
/////////////

// Appearance
const layout = urlParams.get("layout") || "horizontal";
const font = urlParams.get("font") || "";
const showPercentages = GetBooleanParam("showPercentages", true);
const showTimer = GetBooleanParam("showTimer", true);
const showQuestion = GetBooleanParam("showQuestion", true);

// General
const hidePollAfter = parseInt(urlParams.get("hidePollAfter")) || 15;
const hidePollOnStartup = GetBooleanParam("hidePollOnStartup", false);

// Chat Commands
const minimumRole = parseInt(urlParams.get("minimumRole") || "4");	// 1 - Viewer, 2 - VIP, 3 - Moderator, 4 - Broadcaster
const showPollCommand = urlParams.get("showPollCommand") || "!poll on";
const hidePollCommand = urlParams.get("hidePollCommand") || "!poll off";
const togglePollCommand = urlParams.get("togglePollCommand") || "!poll toggle";



////////////////
// PAGE SETUP //
////////////////

// Set the layout of the widget
switch (layout) {
	case "horizontal":
		responseResultsList.style.flexDirection = "row";
		break;
	case "vertical":
		responseResultsList.style.flexDirection = "column";
		break;
	default:
		console.warn(`Unknown layout: ${layout}. Defaulting to horizontal.`);
		responseResultsList.style.flexDirection = "row";
}

// Set fonts for the widget
if (font)
	document.body.style.fontFamily = `'${font}'`;

// Set timer visibility
if (!showTimer)
    timerLabel.style.display = 'none';

// Set question visibility
if (!showQuestion)
    questionLabel.style.display = 'none';




/////////////////////////
// STREAMER.BOT CLIENT //
/////////////////////////

const connectionStatus = new ConnectionStatus({
    name: "Streamer.bot",
	showDelay: 1000,
    disconnectedMessage: "Connecting to Streamer.bot..."
});

connectionStatus.setConnected(false);

const client = new StreamerbotClient({
	host: sbServerAddress,
	port: sbServerPort,

	onConnect: async (data) => {
		console.log(`Streamer.bot successfully connected to ${sbServerAddress}:${sbServerPort}`)
		console.debug(data);
		connectionStatus.setConnected(true);

        await LoadHTMLTemplate(`./templates/poll-response-template.html`);

		if (!hidePollOnStartup)
			RunTestPoll();
	},

	onDisconnect: () => {
		console.error(`Streamer.bot disconnected from ${sbServerAddress}:${sbServerPort}`)
		connectionStatus.setConnected(false);
	}
});

client.on('Twitch.ChatMessage', (response) => {
	console.debug(response.data);
	ChatMessage(response.data);
})

client.on('Twitch.PollCreated', (response) => {
	console.debug(response.data);
	PollCreated(response.data);
})

client.on('Twitch.PollUpdated', (response) => {
	console.debug(response.data);
	PollUpdated(response.data);
})

client.on('Twitch.PollCompleted', (response) => {
	console.debug(response.data);
	PollCompleted(response.data);
})

client.on('Twitch.PollTerminated', (response) => {
	console.debug(response.data);
	PollCompleted(response.data);
})



////////////////////////
// TWITCH POLL WIDGET //
////////////////////////

class Response {
	constructor(title, votes = 0) {
		this.title = title;
		this.votes = votes;
	}
}

function PollCreated(data) {
	// Set the question title
	questionLabel.innerText = data.title;
	
	// Calculate total votes
	const totalVotes = data.choices.reduce((sum, object) => {
		return sum + object.votes;
	}, 0);

	// Clear response list
	responseResultsList.replaceChildren();

	// Only proceed if there are exactly 2 choices, otherwise we don't know how to display it
	if (data.choices.length > 2) {
		console.warn("Poll has less than 2 choices. Not displaying.");
		return;
	}

	// Iterate through each of the responses and create a div for each using an HTML template
	data.choices.forEach((choice, index) => {
        const choiceNum = index + 1;

		// Make a clone div from the template
		const template = document.querySelector('#poll-response-template');
		const clone = template.content.cloneNode(true);

		// Page elements
		const responseTitle = clone.querySelector('.response-title');
		const responseVotes = clone.querySelector('.response-votes');
		// const responseVoteCount = clone.querySelector('.response-vote-count');
		const responseVotePercentage = clone.querySelector('.response-vote-percentage');
        const responseBarTrack = clone.querySelector('.response-bar-track');
        const responseBarTotal = clone.querySelector('#response-bar-total');
		const responseContainer = clone.querySelector('.response-container');

		// Set the theme colors
		responseContainer.dataset.theme = choiceNum == 1 ? "pink" : "blue";

		// Set the percentage visibility
		if (showPercentages)
			responseVotes.style.display = '';
		else
			responseVotes.style.display = 'none';

		// Set the response title
		responseTitle.innerText = choice.title;

		// Set the votes label
		let perc = totalVotes == 0 ? 0 : choice.votes / totalVotes * 100;
		responseVotePercentage.innerText = Math.round(perc);
		// responseVoteCount.innerText = choice.votes;

		// Set the bar width
        responseBarTotal.style.width = perc + '%';

		// Change the ID of the div so we can find it later
		responseContainer.setAttribute('id', choice.id);

		// Finally add the div to the list of responses
		responseResultsList.appendChild(clone);
	});

	SetVisibility(true);

	// Setup the animated countdown
	if (showTimer)
		timerLabel.style.display = '';
	
	StartCountdown(data.ends_at);
}

function PollUpdated(data) {	
	// Calculate total votes
	let totalVotes = data.choices.reduce((sum, object) => {
		return sum + object.votes;
	}, 0);
	
	// Iterate through each of the responses and update the votes totals
	data.choices.forEach((choice, index) => {
        const choiceNum = index + 1;

		// Find the div that matches the response
		let choiceEl = document.getElementById(choice.id);

		// Page elements
		const responseTitle = choiceEl.querySelector('.response-title');
		const responseVoteCount = choiceEl.querySelector('.response-vote-count');
		const responseVotePercentage = choiceEl.querySelector('.response-vote-percentage');
        const responseBarTotal = choiceEl.querySelector('#response-bar-total');
		const responseContainer = choiceEl.querySelector('.response-container');

		// Set the votes label
		let perc = totalVotes == 0 ? 0 : (choice.votes / totalVotes) * 100;
        AnimateNumber(responseVotePercentage, parseInt(responseVotePercentage.innerText), Math.round(perc), 500);
        // AnimateNumber(responseVoteCount, parseInt(responseVoteCount.innerText), choice.votes, 500);

		// Set the bar width
        responseBarTotal.style.width = perc + '%';
	});
}

function PollCompleted(data) {
    // Determine the max number of votes
    const maxVotes = Math.max(...data.choices.map(c => c.votes));

    // Iterate through each choice
    data.choices.forEach((choice, index) => {
        const choiceNum = index + 1;
        const choiceContainer = document.getElementById(choice.id);

        if (!choiceContainer)
            return;

        if (choice.votes < maxVotes) {
            // Fade out losing choices
            choiceContainer.style.opacity = '0.5';
    		choiceContainer.style.filter = 'saturate(0)';
        } else {
            // Winners stay full opacity
            choiceContainer.style.opacity = '1';

			// Set the winner to green
			choiceContainer.dataset.theme = "winner";
        }
    });

	// Instantly set label to 00:00
    if (countdownInterval) {
        clearInterval(countdownInterval);
        countdownInterval = null;
    }

    timerLabel.textContent = "00:00";

	// After a delay, hide the poll
	setTimeout(() => { SetVisibility(false); }, hidePollAfter * 1000);
}

function ChatMessage(data) {
	// Check role permissions
	if (data.user.role < parseInt(minimumRole)){
		console.log(`User ${data.user.username} does not have permission to use chat commands. Required role: ${minimumRole}, user role: ${data.user.role}`);
		return;
	}

	// Chat commands
	switch (data.text) {
		case showPollCommand:
			SetVisibility(true);
			break;
		case hidePollCommand:
			SetVisibility(false);
			break;
		case togglePollCommand:
			ToggleVisibility();
			break;
	}
}

function SetVisibility(isVisible) {
	if (isVisible)
		pollContainer.style.opacity = 1;
	else
		pollContainer.style.opacity = 0;
}

function ToggleVisibility() {
	if (pollContainer.style.opacity > 0)
		pollContainer.style.opacity = 0;
	else
		pollContainer.style.opacity = 1;
}



//////////////////////
// HELPER FUNCTIONS //
//////////////////////

function secondsBetween(utcStartDate, utcEndDate) {
	const startDate = new Date(utcStartDate);
	const endDate = new Date(utcEndDate);

	return Math.round((endDate - startDate) / 1000);
}

function AnimateNumber(element, start, end, duration = animationSpeed) {
    const startTime = performance.now();

    function Update(currentTime) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / (duration/2), 1);
        const value = Math.round(start + (end - start) * progress);
        element.innerText = value;

        if (progress < 1) {
            requestAnimationFrame(Update);
        }
    }

    requestAnimationFrame(Update);
}

function StartCountdown(endsAt) {
    // Clear any existing countdown
    if (countdownInterval) {
        clearInterval(countdownInterval);
        countdownInterval = null;
    }

    function update() {
        // let remaining = secondsBetween(Date.now(), endsAt);
		// 		Date.now() seems to be slightly ahead of the server time, causing the timer bar
		// 		to start a few seconds in. Subtracting 2 seconds seems to sync it up better, but
		// 		this may need adjustment or a more robust solution in the future.
        let remaining = secondsBetween(Date.now(), endsAt) - 2;

        if (remaining <= 0) {
            timerLabel.textContent = "00:00";
            clearInterval(countdownInterval);
            countdownInterval = null;
            return;
        }

        const hrs = Math.floor(remaining / 3600);
        const mins = Math.floor((remaining % 3600) / 60);
        const secs = remaining % 60;

        if (hrs > 0) {
            // h:mm:ss
            timerLabel.textContent =
                hrs + ":" +
                mins.toString().padStart(2, "0") + ":" +
                secs.toString().padStart(2, "0");
        } else {
            // mm:ss (always show minutes, even if 0)
            timerLabel.textContent =
                mins.toString().padStart(2, "0") + ":" +
                secs.toString().padStart(2, "0");
        }
    }

    update(); // initial call
    countdownInterval = setInterval(update, 1000);
}



///////////////
// TEST POLL //
///////////////

function RunTestPoll() {
	let now = new Date();
		let ends = new Date(now.getTime()); // +1 minutes

		let data = {
			"ends_at": ends.toISOString(),
			"title": "Type /poll in chat to create a poll",
			"choices": [
				{
					"id": "1",
					"title": "Good choice",
					"votes": 0
				},
				{
					"id": "2",
					"title": "Bad choice",
					"votes": 0
				}
			],
			"channel_points_voting": {
				"is_enabled": false,
				"amount_per_vote": 0
			},
			"started_at": now.toISOString()
		};

		
		setTimeout(() => {
			PollCreated(data);
		
			// // Simulate poll creation and updates
			// setTimeout(() => {
			// 	data.choices[0].votes = 15;
			// 	data.choices[1].votes = 10;
			// 	PollUpdated(data);

			// 	setTimeout(() => {
			// 		data.choices[0].votes = 20;
			// 		data.choices[1].votes = 20;
			// 		PollUpdated(data);

			// 		setTimeout(() => {
			// 			data.choices[0].votes = 25;
			// 			data.choices[1].votes = 30;
			// 			PollUpdated(data);

			// 			setTimeout(() => {
			// 				PollCompleted(data);
			// 			}, 2000);
			// 		}, 2000);
			// 	}, 2000);
			// }, 2000);
		}, 100);
}