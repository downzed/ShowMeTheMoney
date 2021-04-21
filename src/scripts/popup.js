chrome.storage.local.get([consts.LOCALSTORAGE_ITEM_NAME], (result) => {
	let list = result[consts.LOCALSTORAGE_ITEM_NAME] || [];
	const subtext = document.getElementById('ext-popup-subtext');
	const wrapper = document.getElementById('--reOpen-ext-res-list');
	if (list.length === 0) {
		const trackButton = document.createElement('div');
		trackButton.setAttribute('class', 'ext-list-track-btn');
		trackButton.innerHTML = 'Track this restaurant';
		subtext.innerHTML = 'No restaurants being tracked. Start adding!';
		wrapper.appendChild(trackButton);
		return;
	} 
	subtext.innerHTML = 'Currently keeping an eye on:';

	const listContainer = document.createElement('ul');
	listContainer.setAttribute('id', '--reOpen-ext-list');
	
	wrapper.appendChild(listContainer);
	
	list.forEach(item => {
		console.log(item)
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
			listContainer.appendChild(li);
		}
	});

	chrome.extension.sendMessage({ flash: false });
	
});