/* --------------------- */
/* KOFI MODULE VARIABLES */
/* --------------------- */

const showKofi                          = getURLParam("showKofi", false);

const showKofiSubscriptions             = getURLParam("showKofiSubscriptions", true);
const showKofiDonations                 = getURLParam("showKofiDonations", true);
const showKofiOrders                    = getURLParam("showKofiOrders", true);


// KOFI EVENTS HANDLERS

const kofiMessageHandlers = {
    'Kofi.Donation': (response) => {
        kofiDonationMessage(response.data);
    },
    'Kofi.Subscription': (response) => {
        kofiSubMessage(response.data);
    },
    'Kofi.Resubscription': (response) => {
        kofiReSubMessage(response.data);
    },
    'Kofi.ShopOrder': (response) => {
        kofiOrderMessage(response.data);
    },
};

if (showKofi) {
    registerPlatformHandlersToStreamerBot(kofiMessageHandlers, '[Ko-Fi]');
}



// KOFI EVENT FUNCTIONS

async function kofiDonationMessage(data) {

    if (kofiDonationMessage == false) return;

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

    const classes = ['kofi', 'donation'];

    header.remove();

    
    user.innerHTML = `<strong>${data.from}</strong>`;
    action.innerHTML = ` donated `;

    var money = formatCurrency(data.amount,data.currency);
    value.innerHTML = `<strong>${money}</strong>`;

    if (data.message) message.innerHTML = `${data.message}`;

    addEventItem('kofi', clone, classes, userId, messageId);
}



async function kofiSubMessage(data) {

    if (showKofiSubscriptions == false) return;

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

    const classes = ['kofi', 'sub'];

    header.remove();

    
    user.innerHTML = `<strong>${data.from}</strong>`;
    action.innerHTML = ` just subscribed `;

    var money = formatCurrency(data.amount,data.currency);
    value.innerHTML = `<strong>(${money})</strong>`;

    if (data.message) message.innerHTML = `${data.message}`;

    addEventItem('kofi', clone, classes, userId, messageId);
}



async function kofiReSubMessage(data) {

    if (showKofiSubscriptions == false) return;

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

    const classes = ['kofi', 'sub'];

    header.remove();

    
    user.innerHTML = `<strong>${data.from}</strong>`;
    action.innerHTML = ` just resubscribed `;

    var money = formatCurrency(data.amount,data.currency);
    value.innerHTML = `<strong>(${money}) ${data.tier ? '(Tier '+data.tier+')' : ''}</strong>`;

    if (data.message) message.innerHTML = `${data.message}`;

    addEventItem('kofi', clone, classes, userId, messageId);
}



async function kofiOrderMessage(data) {

    if (showKofiOrders == false) return;

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

    const classes = ['kofi', 'sub'];

    header.remove();

    
    user.innerHTML = `<strong>${data.from}</strong>`;
    action.innerHTML = ` just ordered `;
    
    var money = '';
    if (data.amount == 0) money = 'Free';
    else money = formatCurrency(data.amount,data.currency);
    
    value.innerHTML = `<strong>${data.items.length} ${data.items.length > 1 ? 'item' : 'items'} (${money})</strong>`;

    if (data.message) message.innerHTML = `${data.message}`;

    addEventItem('kofi', clone, classes, userId, messageId);
}