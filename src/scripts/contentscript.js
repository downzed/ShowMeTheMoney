const MAX_NUMBER_OF_TRIES = 5;
const WAIT_BEFORE_NEXT_TRY_MS = 1000;
const rootEl = document.createElement('div');

const invokeOnRestaurantClosed = (tryNumber = 0, cb) => {
  if (tryNumber === 0) {
    logger('Checking if closed');
  }

  if (tryNumber === MAX_NUMBER_OF_TRIES) {
    logger('Couldnt find, giving up, the restaurants is probably open');
    return;
  }

  // this element we will decide if the restaurant is closed.
  const closedEl = document.querySelectorAll("[class^=MenuPageCover__ClosedCoverText]")[0];
  
  if (!closedEl) {
    setTimeout(() => {
      logger(`try number: ${tryNumber}`);
      return invokeOnRestaurantClosed(tryNumber + 1, cb)
    }, WAIT_BEFORE_NEXT_TRY_MS);

    return;
  }

  cb(closedEl);
};

const invokeByRequestMessage = {
  [consts.CUSTOM_EVENTS.IN_RESTAURANT_DELIVERY_PAGE]: request => {
    // extra prop example.. todo: delete at end.
    logger('------------------------------------------');
    logger('restaurant', {restaurantId: request.restaurantId, restaurantName: request.restaurantName});

    invokeOnRestaurantClosed(undefined, closedEl => {
      logger('Restaurant found as closed', closedEl);

      // todo: onClick event (clicking on wanting a notification)
      // fetch data for request.restaurantId ...

      // lets present the window ui to offer the notification.
      // how can we design it easier?
      const menuBody = `
        <h1 class='--reOpen-ext--text'>
          wanna be notify when restaurant is back to open?
        </h1>
      `;
      
      rootEl.classList.add('--reOpen-ext--root');
      rootEl.innerHTML = menuBody;

      document.body.insertBefore(rootEl, document.body.firstChild);
      setTimeout(() => {
        logger('Presenting ui');
        rootEl.classList.add('--reOpen-ext--with-opacity');
      }, 1000);
    });
  },
  [consts.CUSTOM_EVENTS.CLEAR_UI_IF_NEED]: () => {
    if (!rootEl.innerHTML) {
      return;
    }

    logger('Clearing ui');
    rootEl.classList.remove('--reOpen-ext--with-opacity');
    setTimeout(() => {
      rootEl.innerHTML = '';
    }, 1000);
  },
};

chrome.runtime.onMessage.addListener(
  function(request, sender, sendResponse) {
    // listen for messages sent from background.js
    try {
      invokeByRequestMessage[request.message](request);
    } catch(error) {
      logger('Message not recognized', {message: request.message});
      console.error('[ReOpen EXT]', error);
    };   
  }
);