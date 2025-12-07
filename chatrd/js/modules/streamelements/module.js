/* ------------------------------- */
/* STREAMELEMENTS MODULE VARIABLES */
/* ------------------------------ */

const showStreamelements            = getURLParam("showStreamelements", false);

const showStreamElementsTips        = getURLParam("showStreamElementsTips", true);

const streamElementsHandlers = {
    'StreamElements.Tip': (response) => {
        streamElementsEventMessage(response.data);
    },
};

if (showStreamelements) {
    registerPlatformHandlersToStreamerBot(streamElementsHandlers, '[Streamelements]');
}


async function streamElementsEventMessage(data) {

    if (showTwitchRewardRedemptions == false) return;

    const template = eventTemplate;
	const clone = template.content.cloneNode(true);
    const messageId = createRandomString(40);
    const userId = createRandomString(40);

    const {
        header,
        platform,
        user,
        action,
        value,
        'actual-message': message
    } = Object.fromEntries(
        [...clone.querySelectorAll('[class]')]
            .map(el => [el.className, el])
    );

    const classes = ['streamelements', 'donation'];

    header.remove();

    
    var money = formatCurrency(data.amount,data.currency);

    user.innerHTML = `<strong>${data.username}</strong>`;
    action.innerHTML = ` donated `;
    value.innerHTML = `<strong>${money}</strong>`;
    
    if (data.message) { message.innerHTML = `${data.message}`; }
    else { message.remove(); }
    

    addEventItem('streamelements', clone, classes, userId, messageId);
}