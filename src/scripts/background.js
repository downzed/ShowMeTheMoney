chrome.extension.onMessage.addListener(function (message, sender, reply) {
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

  const isInMenuPageWithDeliveryMethod = tab.url.indexOf(consts.DELIVERY_MENU_PAGE_URL) !== -1;
  if (!isInMenuPageWithDeliveryMethod) {

    chrome.tabs.sendMessage(tabId, {
      message: consts.CUSTOM_EVENTS.CLEAR_UI_IF_NEED,
    });
    return;
  }

  // tab.url = https://www.10bis.co.il/next/restaurants/menu/delivery/26199/%D7%A7%D7%A8%D7%9F-%D7%91%D7%93%D7%99%D7%A7%D7%95%D7%AA
  const parts = tab.url.split('/');
  const restaurantName = parts[parts.length - 1];
  const restaurantId = parts[parts.length - 2];

  chrome.tabs.sendMessage(tabId, {
    message: consts.CUSTOM_EVENTS.IN_RESTAURANT_DELIVERY_PAGE,
    restaurantId,
    restaurantName,
  });
});
