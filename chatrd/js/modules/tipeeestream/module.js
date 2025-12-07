/* ----------------------------- */
/* TIPEEESTREAM MODULE VARIABLES */
/* ----------------------------- */

const showTipeee                 = getURLParam("showTipeee", false);
const showTipeeeDonations        = getURLParam("showTipeeeDonations", true);

// TIPEEESTREAM EVENTS HANDLERS

const tipeeeHandlers = {
    'TipeeeStream.Donation': (response) => {
        tipeeeStreamDonation(response.data);
    },
};

if (showTipeee) {
    registerPlatformHandlersToStreamerBot(tipeeeHandlers, '[Tipeeestream]');
}




// TIPEEESTREAM EVENTS HANDLERS

async function tipeeeStreamDonation(data) {

    if (tipeeeStreamDonation == false) return;

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

    const classes = ['tipeeestream', 'donation'];

    header.remove();

    
    var money = formatCurrency(data.amount,data.currency);

    user.innerHTML = `<strong>${data.username}</strong>`;
    action.innerHTML = ` donated `;
    value.innerHTML = `<strong>${money}</strong>`;

    if (data.message) message.innerHTML = `: ${data.message}`;

    addEventItem('tipeeestream', clone, classes, userId, messageId);
}