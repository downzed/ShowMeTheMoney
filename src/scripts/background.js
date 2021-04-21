chrome.storage.local.clear(function () {
  const error = chrome.runtime.lastError;
  if (error) {
    console.error(error);
  }
});

chrome.extension.onMessage.addListener(function (message, sender, reply) {
  if (message.refreshLocalStorage) {
    chrome.storage.local.set({ [consts.LOCALSTORAGE_ITEM_NAME]: message.list });
  }  
  if (message.flash) {
    chrome.browserAction.setBadgeText({text: '+'})
    return;
  }
  chrome.browserAction.setBadgeText({ text: '' })
});

chrome.tabs.onUpdated.addListener(function (tabId, changeInfo, tab) {

  if (changeInfo.status !== 'complete') {
    return;
  }
  const isInMenuPage = consts.MENU_PAGE_URLS.filter(url => tab.url.indexOf(url) !== -1 )
  if (!isInMenuPage) {
    return;
  }

  // tab.url = https://www.10bis.co.il/next/restaurants/menu/delivery/26199/%D7%A7%D7%A8%D7%9F-%D7%91%D7%93%D7%99%D7%A7%D7%95%D7%AA
  const parts = tab.url.split('/'); 
  const restaurantName = parts[parts.length - 1];
  const restaurantId = parts[parts.length - 2];
  const deliveryMethod = parts[parts.length - 3];

  chrome.tabs.sendMessage(tabId, {
    message: consts.CUSTOM_EVENTS.IN_RESTAURANT_PAGE,
    deliveryMethod,
    restaurantId,
    restaurantName
  });

});