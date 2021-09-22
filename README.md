# Smart Eye Tracking

Smart EyeTracking is a **Chrome Extension** that uses a webcam to **analyse the movement of the user eyes** and produces as output two files: one with the **heatmap on top of the page screenshot** and the other one contains the list of **IDs and Classes of the elements belonging to a specific page and the number of times the user looked into them**, accordingly.

## Tools and Technologies

This project was developed using **JavaScript, HTML, CSS** and the following libraries:

- **webgazer.js** (scan the user face, calibrate and detect the eyes movement)
- **heatmap.js** (produce the heatmap while the user looks into the page)
- **html2canvas.js** (generate and output the printscreen with the heatmap on top)
- **xlxs.js** (generate and output the XLXS file)

## Usage

To use and test this Chrome Extension, please follow the instructions bellow:

1. Clone this repository.
2. Open Google Chrome and access [Chrome Extensions](chrome://extensions "Chrome Extensions").
3. Enable "Developer Mode" (top-right of the screen).
4. Upload Extension (select the folder that contains this repository and make sure there's no sub-folder between the one uploaded and the files cloned).
5. Activate it.
6. Navigate to any page and then start the analysis by doing the calibration with the 9-dot look-and-click method. (*Note:* Make sure the camera is turned on and allowed on Google Chrome)
7. Stop whenever the analysis is completed and wait for the results to be downloaded.

## Authors

This project was developed under the **Innovation Week Experience of Critical Software** (12-16 July 2021) by:

- **André Jesus** (andre02jesus@gmail.com)
- **João Calhau** (ximaxerpt@gmail.com)
- **João Pires** (joaocarlosmrp@gmail.com)
