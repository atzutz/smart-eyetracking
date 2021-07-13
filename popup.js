window.onload = function () {
 
    const button = document.getElementsByTagName('input');

    button[0].addEventListener('click', updateButton);

    chrome.storage.sync.get("status", ({ status }) => {
        button[0].value = status;
    });

    function updateButton() {
        if (button[0].value === 'Start') {
            button[0].value = 'Stop';
        } else {
            button[0].value = 'Start';
        }

        var status = button[0].value;
        chrome.storage.sync.set({ status });

        // Send message to background saying whether it started or not
        chrome.tabs.query({
            active: true,
            currentWindow: true
        }, function (tabs) {
            chrome.tabs.sendMessage(tabs[0].id, {
                value: button[0].value
            }, function (response) {
                if (response !== null) 
                    console.log(response.farewell);
            });
        });

        window.close();
        
    }
}