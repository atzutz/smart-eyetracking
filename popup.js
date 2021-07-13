window.onload = function () {
    const button = document.getElementsByTagName('input');

    button[0].addEventListener('click', updateButton);

    function updateButton() {
        if (button[0].value === 'Start') {
            button[0].value = 'Stop';
        } else {
            button[0].value = 'Start';
        }
        // Send message to background saying whether it started or not

    }
}