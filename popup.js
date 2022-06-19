window.onload = function () {
    let button = document.getElementById('button');

    button.addEventListener('click', updateButton);

    let checkbox = document.getElementById('sh');

    checkbox.addEventListener('change', showHide);

    chrome.storage.sync.get("status", ({status}) => {
        button.value = status;
    });

    chrome.storage.sync.get("sh", ({sh}) => {
        checkbox.checked = sh;
        console.log(sh);
    });

    function showHide() {
        let showhide = this.checked;

        let sh = this.checked;
        chrome.storage.sync.set({sh});

        chrome.tabs.query({
            active: true,
            currentWindow: true
        }, function (tabs) {
            chrome.tabs.sendMessage(tabs[0].id, {
                sh: showhide,
                type: "sh"
            }, function () {
            });
        });

    }

    function updateButton() {
        if (button.value === 'Start') {
            button.value = 'Stop';
        } else {
            button.value = 'Start';
        }

        let status = button.value;
        chrome.storage.sync.set({status});

        // Send message to background saying whether it started or not
        chrome.tabs.query({
            active: true,
            currentWindow: true
        }, function (tabs) {
            chrome.tabs.sendMessage(tabs[0].id, {
                value: button.value,
                type: "ss"
            }, function (response) {
                if (response !== null)
                    console.log(response.farewell);
            });
        });

        window.close();
    }
}