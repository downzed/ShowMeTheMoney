
const rootEl = document.createElement('div');

const getAddressFromContextCookie = (docCookie = document.cookie) => {
  const cookieName = 'WebApplication.Context';
  const cookieAsJson = Object.fromEntries(docCookie.split('; ').map(x => x.split(/=(.*)$/,2).map(decodeURIComponent)));
  
  try {
    const {longitude, latitude} = JSON.parse(cookieAsJson['lastlatlng']);
    const paramsString = cookieAsJson['WebApplication.Context'];
    let searchParams = new URLSearchParams(paramsString);
  
    const addressId = searchParams.get('AddressId');
    const cityId = searchParams.get('SearchCityId');
    const streetId = searchParams.get('SearchStreetId');
    const houseNumber = searchParams.get('SearchHouseNumber');

    const addressKey = `${cityId}-${streetId}-${houseNumber}`;
    return {
      addressKey,
      addressId,
      longitude,
      latitude
    }
  } catch (error) {
    // probably user doesnt have lastlatlng in the cookie 
    // (means that he didnt set an address)
    logger('probably without address at all', error);
    return;
  }
};

const invokeOnRestaurantClosed = (tryNumber = 0, cb) => {
  
  if (tryNumber === 0) {
    logger('Checking if closed');
  }

  if (tryNumber === consts.searchIfClosedOptions.MAX_NUMBER_OF_TRIES) {
    logger('Couldnt find, giving up, the restaurants is probably open');
    return;
  }

  // this element we will decide if the restaurant is closed.
  const closedEl = document.querySelectorAll("[class^=MenuPageCover__ClosedCoverText]")[0];
  
  if (!closedEl) {
    setTimeout(() => {
      logger(`isClosed try number: ${tryNumber} failed`);
      return invokeOnRestaurantClosed(tryNumber + 1, cb)
    }, consts.searchIfClosedOptions.WAIT_BEFORE_NEXT_TRY_MS);

    return;
  }

  cb(closedEl);
};

const invokeOnHavingAddress = (tryNumber = 0, cb) => {
  if (tryNumber === 0) {
    logger('Checking if has address');
  }

  if (tryNumber === consts.searchIfHasAddressOptions.MAX_NUMBER_OF_TRIES) {
    logger('Couldnt find address, giving up');
    return;
  }

  // this element we will decide if the restaurant is closed.
  const currentAddressEl = document.querySelectorAll("[class^=styledaddress__ActiveAddressWrapper]")[0];
  if (!currentAddressEl?.innerHTML) {
    setTimeout(() => {
      // has no address lets re-try.
      logger(`hasAddress? try number: ${tryNumber} failed`);
      return invokeOnHavingAddress(tryNumber + 1, cb);
    }, consts.searchIfHasAddressOptions.WAIT_BEFORE_NEXT_TRY_MS)

    return;
  }

  cb(currentAddressEl);
};

const invokeByRequestMessage = {
  [consts.CUSTOM_EVENTS.IN_RESTAURANT_PAGE]: request => {
    logger('------------------------------------------');
    logger('restaurant info', {
      deliveryMethod: request.deliveryMethod,
      restaurantId: request.restaurantId,
      restaurantName: request.restaurantName
    });

    // confirming current restaurant is closed
    invokeOnRestaurantClosed(undefined, closedEl => {
      logger('Restaurant found as closed', closedEl);

      // confirming user has active address
      invokeOnHavingAddress(undefined, activeAddressEl => {
        // everything is fine lets build the ui ^^
        logger('Found active address', activeAddressEl);

        const addressInfo = getAddressFromContextCookie();

        if (!addressInfo) {
          console.error('[ReOpen EXT]', addressInfo);
          throw new Error('wtf ... why cant we get addressInfo??');
          return;
        }

        logger('addressInfo', addressInfo);

        const menuBody = `
          <h1 class='--reOpen-ext--text'>
            wanna be notify when restaurant is back to open?
          </h1>
        `;
        
        rootEl.classList.add('--reOpen-ext--root');
        rootEl.innerHTML = menuBody;

        document.body.insertBefore(rootEl, document.body.firstChild);

        setTimeout(() => { // just for opacity effect.
          logger('Presenting ui');
          rootEl.classList.add('--reOpen-ext--with-opacity');
        }, 1000);
      });
    });
  },
  [consts.CUSTOM_EVENTS.CLEAR_UI_IF_NEED]: () => {
    if (!rootEl.innerHTML) {
      return;
    }

    logger('Clearing ui');
    
    rootEl.classList.remove('--reOpen-ext--with-opacity');

    setTimeout(() => { // just for opacity effect.
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