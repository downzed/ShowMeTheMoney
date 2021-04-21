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
const invokeOnClosedRestaurantModalAppearing = (tryNumber = 0, cb) => {
  if (tryNumber === 0) {
    logger('Checking closed modal appears in the DOM');
  }

  if (tryNumber === consts.searchForCloseModalOptions.MAX_NUMBER_OF_TRIES) {
    logger('Couldnt find closed modal, giving up');
    return;
  }
 
  const closedModalEl = document.querySelector('[data-id=closed-restaurant-modal]');

  if (!closedModalEl) {

    setTimeout(() => {
      // has no address lets re-try.
      logger(`has closed modal? try number: ${tryNumber} failed`);
      return invokeOnClosedRestaurantModalAppearing(tryNumber + 1, cb);
    }, consts.searchForCloseModalOptions.WAIT_BEFORE_NEXT_TRY_MS);

    return;
  }

  const allInnerButtons = closedModalEl.querySelectorAll('button');
  const targetButton = allInnerButtons[allInnerButtons.length - 1];

  cb(targetButton);
};

const invokeByRequestMessage = {
  [consts.CUSTOM_EVENTS.IN_RESTAURANT_PAGE]: request => {
    logger('------------------------------------------');
    logger('restaurant info', {
      deliveryMethod: request.deliveryMethod,
      restaurantId: request.restaurantId,
      restaurantName: request.restaurantName,
    });
    
    

    invokeOnClosedRestaurantModalAppearing(undefined, targetButton => {
      logger('Found closed modal and took control over the button', targetButton);

      const addressInfo = getAddressFromContextCookie();

      if (!addressInfo) {
        console.error('[ReOpen EXT]', addressInfo);
        throw new Error('wtf ... why cant we get addressInfo??');
        return;
      }

      logger('addressInfo', addressInfo);

      // on click will take 10bis's closed modal off the dom.
      // so success / error state should be invoked differently.
      const restaurantLogoNode = document.querySelector('[class*="DiagonalHeaderView__CircleImage"');
      const restaurantNameNode = document.querySelector('[class*="RestaurantInfo__RestaurantName"').innerText;
      const resImg = restaurantLogoNode?.getAttribute('src') || 'https://d25t2285lxl5rf.cloudfront.net/images/shops/default.png';

      targetButton.onclick = event => {
        // send fetch request with everything we currently have
        event.preventDefault();
        
        console.log('user clicked to notify him');

        // TODO: change logic to check for addressId || restId before clicking 'Notify Me'
        chrome.storage.local.get([consts.LOCALSTORAGE_ITEM_NAME], (result) => {
          let list = result[consts.LOCALSTORAGE_ITEM_NAME] || [];

          const restaurantItem = {
            resId: request.restaurantId,
            resName: restaurantNameNode,
            resImg
          };

          if (list.length && list.indexOf(restaurantItem) > -1) {
            logger(restaurantItem.resName + ' Already in queue');
            chrome.extension.sendMessage({ flash: true })
            return;
          }
          list.push(restaurantItem);
          chrome.storage.local.set({ [consts.LOCALSTORAGE_ITEM_NAME]: list });
          chrome.extension.sendMessage({ flash: true })
        });
      };

      targetButton.innerHTML = 'Notify me';
      chrome.storage.local.set({
        [consts.LOCALSTORAGE_QUE_NAME]: {
          resId: request.restaurantId,
          resName: restaurantNameNode,
          resImg
        }
      });
    });
  },
};

chrome.runtime.onMessage.addListener(
  function (request, sender, sendResponse) {
    // listen for messages sent from background.js
    try {
      invokeByRequestMessage[request.message](request);
    } catch (error) {
      logger('Message not recognized', { message: request.message });
      console.error('[ReOpen EXT]', error);
    };
  }
);