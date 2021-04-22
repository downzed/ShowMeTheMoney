function createEmptyPage(wrapperElement, subtext) {
	const trackButton = document.createElement('div');
	
	trackButton.setAttribute('class', 'ext-list-track-btn');
  const header = document.getElementsByClassName('ext-popup-header')[0];
  const successDiv = document.createElement('div');
  successDiv.setAttribute('class', 'ext-popup-success');
  successDiv.innerHTML = `
    <img src='../../icons/animation.gif' class='success-image'/>
    <div id='ext-popup-subtext'>
    This restaurant has been added!
    <br />
    We'll let you know once it opens up.
    </div>
  `;
	trackButton.innerHTML = 'Track this restaurant';

	chrome.storage.local.get([consts.LOCALSTORAGE_QUE_NAME], (result) => {
		const localQueItem = result[consts.LOCALSTORAGE_QUE_NAME] || {};
		if (Object.keys(localQueItem).length > 0) {
			trackButton.onclick = function () {
				let list = [];
				list.push(localQueItem);

				chrome.storage.local.set({ [consts.LOCALSTORAGE_ITEM_NAME]: list }, function (){
          setTimeout(function () {
            header.style.display = 'none';
            trackButton.style.display = 'none';
            wrapperElement.style.height = '228px';
            wrapperElement.appendChild(successDiv);
            chrome.storage.local.remove(consts.LOCALSTORAGE_QUE_NAME);
            setTimeout(() => {
              window.location.reload();
            }, 1000);
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
			chrome.extension.sendMessage({ flash: false })
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