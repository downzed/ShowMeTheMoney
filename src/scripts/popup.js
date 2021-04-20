chrome.storage.local.get([consts.LOCALSTORAGE_ITEM_NAME], (result) => {
	let list = result[consts.LOCALSTORAGE_ITEM_NAME] || [];
	let container = document.getElementById('--reOpen-ext-list')
	if (list.length) {
		list.forEach(item => {
			const li = document.createElement('li')
			li.innerHTML = item;
			container.appendChild(li)
		});
		chrome.extension.sendMessage({ flash: false })
	}
});