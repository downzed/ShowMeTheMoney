function createEmptyPage(wrapperElement, subtext) {
	const trackButton = document.createElement('div');
	
	trackButton.setAttribute('class', 'ext-list-track-btn');
	trackButton.innerHTML = 'Track this restaurant';

	chrome.storage.local.get([consts.LOCALSTORAGE_QUE_NAME], (result) => {
		const resItem = result[consts.LOCALSTORAGE_QUE_NAME] || {};
		if (Object.keys(resItem).length > 0) {
			trackButton.onclick = function () {
				let list = [];
				list.push(resItem);
				chrome.storage.local.set({ [consts.LOCALSTORAGE_ITEM_NAME]: list }, function (){
					setTimeout(function () {
						window.location.reload()
					}, 100)
				});
			}
		} else {
			trackButton.style.pointerEvents = 'none';
			trackButton.style.backgroundColor = '#dedede';
			trackButton.style.color = '#444';
		}
	});
	
	subtext.innerHTML = 'No restaurants being tracked. Start adding!';
	wrapperElement.appendChild(trackButton);
}

function handleRemoveItem(removeItem) {
	chrome.storage.local.get([consts.LOCALSTORAGE_ITEM_NAME], (result) => {
		let list = result[consts.LOCALSTORAGE_ITEM_NAME] || [];
		
		list = list.filter((item) => item.resId !== removeItem.resId);
		
		chrome.storage.local.set({ [consts.LOCALSTORAGE_ITEM_NAME]: list }, function () {
			setTimeout(function () {
				window.location.reload()
			}, 500)
		});
	});
}

function createListItems(list, containerElement) {
	list.forEach((item, index) => {
		if (item) {
			const li = document.createElement('li');
			const innerHTML = `
				<div class="ext-list-item item-index-${index}">
					<div class="ext-list-item-details">
						<img class="ext-rest-logo" src='${item.resImg}'/>
						${item.resName}
					</div>
				</div>
			`;

			li.innerHTML = innerHTML;

			containerElement.appendChild(li);
			const extListItem = document.getElementsByClassName('item-index-'+index)[0];
			const removeIconElement = document.createElement('img');
			removeIconElement.setAttribute('class', 'ext-remove-icon');
			removeIconElement.setAttribute('src', '../icons/remove-icon.png');
			removeIconElement.onclick = e => { handleRemoveItem(item) }
			extListItem.appendChild(removeIconElement);
		}
	});
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