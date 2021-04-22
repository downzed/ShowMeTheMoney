let isInMenuPage;
let tenBisTabId;

function getListLength() {
  chrome.storage.local.get([consts.LOCALSTORAGE_ITEM_NAME], (result) => {
    let list = result[consts.LOCALSTORAGE_ITEM_NAME] || [];
    
    if (list.length) {
      chrome.browserAction.setBadgeText({text: list.length > 5 ? '+5' : list.length.toString()});
      chrome.browserAction.setBadgeBackgroundColor({color: '#ea7702'});
      return;
    }

    chrome.browserAction.setBadgeText({ text: '' });
  })
};

getListLength();

chrome.extension.onMessage.addListener(function (message, sender, reply) {
  if (message.flash) {
    chrome.browserAction.setBadgeText({text: '!'});
    return;
  }

  getListLength();
});

const registerTabId = id => {tenBisTabId = id};

// notification listener
chrome.runtime.onMessage.addListener(data => {
  if (data.type !== 'notification') {
    return; 
  }

  chrome.notifications.create('', data.options, notificationId => {
    chrome.notifications.onClicked.addListener(() => {

      console.log('data notification', data);
      chrome.tabs.create({ url: data.restaurantUrl }); 

    });
  });
});

// init
chrome.tabs.onUpdated.addListener(function (tabId, changeInfo, tab) {
  if (changeInfo.status !== 'complete') {
    return;
  }

  registerTabId(tabId);

  isInMenuPage = consts.MENU_PAGE_URLS.filter(url => tab.url.indexOf(url) !== -1 )
  if (!isInMenuPage) {
    chrome.storage.local.remove(consts.LOCALSTORAGE_QUE_NAME);
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

// popup state managment
chrome.tabs.onActivated.addListener(function (activeInfo) {
  if (tenBisTabId && (activeInfo.tabId === tenBisTabId) && isInMenuPage) {
    // console.log(`123, ${tenBisTabId}`)
    // chrome.storage.local.remove(consts.LOCALSTORAGE_QUE_NAME);
  }
});