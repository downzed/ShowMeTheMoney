function createEmptyPage(wrapperElement, subtext) {
	const trackButton = document.createElement('div');
	trackButton.setAttribute('class', 'ext-list-track-btn');
	trackButton.innerHTML = 'Track this restaurant';
	chrome.storage.local.get([consts.LOCALSTORAGE_QUE_NAME], (result) => {
		const resItem = result[consts.LOCALSTORAGE_QUE_NAME] || {};
		if (resItem) {
			trackButton.onclick = function () {
				let list = [];
				list.push(resItem);
				chrome.storage.local.set({ [consts.LOCALSTORAGE_ITEM_NAME]: list });
				setTimeout(function () {
					window.location.reload()
				}, 100)
			}
		}
	})
	subtext.innerHTML = 'No restaurants being tracked. Start adding!';
	wrapperElement.appendChild(trackButton);
}

function createListItems(list, containerElement) {
	list.forEach(item => {
		if (item) {
			const li = document.createElement('li');
			const innerHTML = `
				<div class="ext-list-item">
					<div class="ext-list-item-details">
						<img class="ext-rest-logo" src='${item.resImg}'/>
						${item.resName}
					</div>
					<img class="ext-close-icon" src='../icons/remove-icon.png'></img>
				</div>
			`;

			li.innerHTML = innerHTML;
			containerElement.appendChild(li);
			setTimeout(function () {
				const closeIcon = document.getElementsByClassName('ext-close-icon')[0];
				closeIcon.onclick = e => handleRemoveItem(item, list);
			}, 100)
		}
	});
}

function handleRemoveItem(removeItem, list) {
	if (list.indexOf(removeItem) > -1) {
		list = list.filter(item => item.resId !== removeItem.resId);
		chrome.extension.sendMessage({ refreshLocalStorage: true, list });
		setTimeout(function(){
			window.location.reload()
		}, 100)
	}
	return list;
}

chrome.storage.local.get([consts.LOCALSTORAGE_ITEM_NAME], (result) => {
	
	let list = result[consts.LOCALSTORAGE_ITEM_NAME] || [];

	const subtext = document.getElementById('ext-popup-subtext');
	const wrapper = document.getElementById('--reOpen-ext-res-list');

	if (list.length === 0) {
		createEmptyPage(wrapper, subtext)
		return;
	} 

	const listContainer = document.createElement('ul');
	listContainer.setAttribute('id', '--reOpen-ext-list');
	
	subtext.innerHTML = 'Currently keeping an eye on:';

	wrapper.appendChild(listContainer);

	createListItems(list, listContainer)

	chrome.extension.sendMessage({ flash: false });
	
});