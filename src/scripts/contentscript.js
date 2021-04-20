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
        <div class='--reOpen-ext--text'>
          <div>
            wanna be notified when restaurant is back to open?
          </div>
          <button id="sureButton">
            sure
          </button>
          <button>
            pass
          </button>
        </div>
      `;
      
      rootEl.classList.add('--reOpen-ext--root');
      rootEl.innerHTML = menuBody;
      document.body.insertBefore(rootEl, document.body.firstChild);

      function close() {
        if (!rootEl.innerHTML) {
          return;
        }

        logger('Clearing ui');
        setTimeout(() => {
          rootEl.classList.remove('--reOpen-ext--root');
          rootEl.classList.remove('--reOpen-ext--with-opacity');
        }, 200);
      }

      chrome.storage.local.get([consts.LOCALSTORAGE_ITEM_NAME], (result) => {
        let list = result[consts.LOCALSTORAGE_ITEM_NAME]
        if (list.indexOf(request.restaurantId) > -1) {
          logger(window.decodeURI(request.restaurantName) + ' Already in queue');
          chrome.extension.sendMessage({ flash: true })
          return;
        }
        setTimeout(() => {
          logger('Presenting ui');
          rootEl.classList.add('--reOpen-ext--with-opacity');
        }, 100);

        let sureButton = document.getElementById('sureButton');
        let passButton = document.getElementById('passButton');

        sureButton.onclick = () => {
          list.push(request.restaurantId)
          chrome.storage.local.set({ [consts.LOCALSTORAGE_ITEM_NAME]: list });
          rootEl.innerHTML = 'added';
          setTimeout(close, 200);
        }
        passButton.onclick = close;
      });
    });
  },
  [consts.CUSTOM_EVENTS.CLEAR_UI_IF_NEED]: close
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