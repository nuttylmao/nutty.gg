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
let isSpinning = false;



/////////////
// SOUNDS //
/////////////

const tickSound = new Audio('./sounds/tick.wav');
tickSound.volume = 0.5;
const winnerSound = new Audio('./sounds/winner.wav');
winnerSound.volume = 0.5;



///////////////////
// PAGE ELEMENTS //
///////////////////

const fiftyFiftyContainer = document.getElementById('fifty-fifty-container');
const optionsList = document.getElementById('options-list');



/////////////
// OPTIONS //
/////////////

// Options
const optionOneLabel = urlParams.get("optionOneLabel") || "Heads";
const optionTwoLabel = urlParams.get("optionTwoLabel") || "Tails";

// Appearance
const layout = urlParams.get("layout") || "horizontal";
const font = urlParams.get("font") || "";

// General
const hideOverlayAfter = GetBooleanParam("hideOverlayAfter", false);
const hideOverlayOnStartup = GetBooleanParam("hideOverlayOnStartup", false);

// Chat Commands
const minimumRole = parseInt(urlParams.get("minimumRole") || "4"); // 3 - Moderator, 4 - Broadcaster
const spinCommand = urlParams.get("spinCommand") || "!spin";
const showOverlayCommand = urlParams.get("showOverlayCommand") || "!5050 on";
const hideOverlayCommand = urlParams.get("hideOverlayCommand") || "!5050 off";
const toggleOverlayCommand = urlParams.get("toggleOverlayCommand") || "!5050 toggle";



////////////////
// PAGE SETUP //
////////////////

// Set the layout of the widget
switch (layout) {
	case "horizontal":
		optionsList.style.flexDirection = "row";
		break;
	case "vertical":
		optionsList.style.flexDirection = "column";
		break;
	default:
		console.warn(`Unknown layout: ${layout}. Defaulting to horizontal.`);
		optionsList.style.flexDirection = "row";
}

// Set fonts for the widget
if (font)
	document.body.style.fontFamily = `'${font}'`;




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

		await LoadHTMLTemplate(`./templates/option-template.html`);

		SetupOverlay();
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



/////////////////
// FIFTY FIFTY //
/////////////////

function SetupOverlay() {
	const options = [
		{ id: "option-one", title: optionOneLabel, theme: "pink" },
		{ id: "option-two", title: optionTwoLabel, theme: "blue" }
	];

	options.forEach((option, index) => {
		// Make a clone div from the template
		const template = document.querySelector('#option-template');
		const clone = template.content.cloneNode(true);

		// Page elements
		const optionTitle = clone.querySelector('.option-title');
		const optionContainer = clone.querySelector('.option-container');

		// Set the theme colors
		optionContainer.dataset.theme = option.theme;

		// Set the option title
		optionTitle.innerText = option.title;

		// Change the ID so we can find it later
		optionContainer.id = option.id;

		// Add the option to the overlay
		optionsList.appendChild(clone);
	});

	if (!hideOverlayOnStartup)
		SetVisibility(true);
}

async function Spin() {
    if (isSpinning) {
		console.log("Spin already in progress. Ignoring new spin request.");
		return;
	}
    isSpinning = true;
	SetVisibility(true);
	
	console.log("Spin starting.");

    try {
        const choiceContainers = [...document.querySelectorAll('.option-container')];
        const totalOptions = choiceContainers.length;

        if (totalOptions < 2) return;

        const animationDuration = 10000;
        const totalSpins = 50;

        // Randomly select the winner
        const winnerIndex = Math.floor(Math.random() * totalOptions);
        const winner = choiceContainers[winnerIndex];

        // Reset all options
        choiceContainers.forEach((container, index) => {
            container.style.opacity = '0.5';
            container.style.filter = 'saturate(0)';
            container.dataset.theme = index === 0 ? 'pink' : 'blue';
        });

        // Generate the roulette sequence
        const startIndex = Math.floor(Math.random() * totalOptions);
        const sequence = [];

        for (let i = 0; i < totalSpins; i++) {
            sequence.push(choiceContainers[(startIndex + i) % totalOptions]);
        }

        // Ensure the final selection is the winner
        sequence.push(winner);

        // Calculate progressively longer delays
        const weights = sequence.map((_, index) => {
            const progress = index / (sequence.length - 1);
            return 1 + Math.pow(progress, 3) * 80;
        });

        const totalWeight = weights.reduce((sum, weight) => sum + weight, 0);

        const delays = weights.map(weight =>
            animationDuration * (weight / totalWeight)
        );

        // Run the roulette animation
        for (let i = 0; i < sequence.length; i++) {
            choiceContainers.forEach(container => {
                container.style.opacity = '0.5';
                container.style.filter = 'saturate(0)';
    			container.classList.remove('active');
            });

            const choiceContainer = sequence[i];
            choiceContainer.style.opacity = '1';
            choiceContainer.style.filter = 'none';
			choiceContainer.classList.add('active');

			// Play tick sound
			tickSound.currentTime = 0;
			tickSound.play();

            await new Promise(resolve => setTimeout(resolve, delays[i]));
        }

        // Set the winner to green
        winner.dataset.theme = "winner";
        winner.style.opacity = '1';
        winner.style.filter = 'none';

		// Play winner sound
		winnerSound.currentTime = 0;
		winnerSound.play();

        // Wait 5 seconds before resetting
        await new Promise(resolve => setTimeout(resolve, 5000));

        // Restore default appearance
        choiceContainers.forEach((container, index) => {
            container.style.opacity = '1';
            container.style.filter = 'none';
            container.dataset.theme = index === 0 ? 'pink' : 'blue';
			container.classList.remove('active');
        });

    } finally {
        isSpinning = false;
		if (hideOverlayAfter)
			SetVisibility(false);
		console.log("Spin completed.");
    }
}

function ChatMessage(data) {
	// Check role permissions
	if (data.user.role < parseInt(minimumRole)) {
		console.log(`User ${data.user.name} does not have permission to use chat commands. Required role: ${minimumRole}, user role: ${data.user.role}`);
		return;
	}

	// Strip white space and unicode characters from the command
	// Idk why Streamer.bot sometimes attaches unicode characters to the command, but this is a workaround for that
	const command = data.text.replace(/[^\x20-\x7E]/g, '').trim();
	
	// Chat commands
	switch (command) {
		case spinCommand:
			Spin();
			break;
		case showOverlayCommand:
			SetVisibility(true);
			break;
		case hideOverlayCommand:
			SetVisibility(false);
			break;
		case toggleOverlayCommand:
			ToggleVisibility();
			break;
	}
}

function SetVisibility(isVisible) {
	if (isVisible)
		fiftyFiftyContainer.style.opacity = 1;
	else
		fiftyFiftyContainer.style.opacity = 0;
}

function ToggleVisibility() {
	if (fiftyFiftyContainer.style.opacity > 0)
		fiftyFiftyContainer.style.opacity = 0;
	else
		fiftyFiftyContainer.style.opacity = 1;
}