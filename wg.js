let count = 0;
let avgX = 0;
let avgY = 0;
let tabela = new Map();
let calibrated = false;

window.onload = function () {

    var status = "Start";
    chrome.storage.sync.set({
        status
    });

    //create a hashmap of all the elements in the HTML DOM
    var elements = document.getElementsByTagName("*");
    for (var i = 0; i < elements.length; i++) {
        tabela.set(elements[i].id, 0);
    }

    var heatmap = document.createElement('div');
    heatmap.id = "myHeatmap";
    var body = document.getElementsByTagName("body");
    body[0].appendChild(heatmap);
    var heatmapContainer = document.getElementById("myHeatmap");

    // create a heatmap instance
    var heatmap = h337.create({
        container: heatmapContainer,
        maxOpacity: .4,
        radius: 50,
        blur: .90,
        // backgroundColor with alpha so you can see through it
        backgroundColor: 'rgba(255, 255, 255, 0)'
    });

    //generates de heatmap points and updates the values of the hashmap elements from the HTML DOM
    function pinta(valX, valY) {
        try {
            var elem = document.elementFromPoint(valX, valY);
            if (tabela.get(elem.id) == 0) tabela.set(elem.id, 1); //a=0 => a=1
            else tabela.set(elem.id, tabela.get(elem.id) + 1); //a>1 => a++

            heatmap.addData({
                x: valX,
                y: valY,
                value: 1
            });
        } catch (error) {
            //debug.error(error);
        }
    };

    heatmapContainer.onclick = function (e) {
        var x = e.layerX;
        var y = e.layerY;
        heatmap.addData({
            x: x,
            y: y,
            value: 1
        });
    };

    pontos = 5;
    var arrayX = new Array(pontos);
    var arrayY = new Array(pontos);


    chrome.runtime.onMessage.addListener(
        async function (request, sender, sendResponse) {
            console.log(sender.tab ?
                "from a content script:" + sender.tab.url :
                "from the extension");

            if (request.type === "sh") {
                if (request.sh) {
                    document.getElementById("myHeatmap").style.display = 'block';
                } else {
                    document.getElementById("myHeatmap").style.display = 'none';
                }
                console.log(document.getElementById("myHeatmap").style.display);
            } else {
                if (request.value === "Stop") {
                    document.getElementById("myHeatmap").style.display = 'none';

                    webgazer.setRegression('ridge') /* currently must set regression and tracker */
                        //.setTracker('clmtrackr')
                        .setGazeListener(function (data, clock) {
                            try {
                                //console.log(data.x);
                                //console.log(data.y);
                                arrayX[count] = Math.ceil(data.x);
                                arrayY[count] = Math.ceil(data.y);
                                count++;
                                if (count == pontos) {
                                    var totalX = 0;
                                    var totalY = 0;
                                    for (var i = 0; i < pontos; i++) {
                                        totalX += arrayX[i];
                                        totalY += arrayY[i];
                                    }
                                    var avgX = totalX / pontos;
                                    var avgY = totalY / pontos;
                                    console.log(avgX, " | ", avgY)
                                    arrayX = new Array(pontos)
                                    arrayY = new Array(pontos)
                                    count = 0;
                                    if (calibrated) pinta(avgX, avgY);
                                }
                            } catch (error) {
                                arrayX = new Array(pontos)
                                arrayY = new Array(pontos)
                                count = 0;
                                console.error(error);
                            }; /* data is an object containing an x and y key which are the x and y prediction coordinates (no bounds limiting) */
                            //   console.log(clock); /* elapsed time in milliseconds since webgazer.begin() was called */
                        })
                        .begin();

                    var width = 320;
                    var height = 240;
                    var topDist = '0px';
                    var leftDist = '0px';

                    var setup = function () {
                        var video = document.getElementById('webgazerVideoFeed');
                        video.style.display = 'hidden';
                        video.style.position = 'absolute';
                        video.style.top = topDist;
                        video.style.left = leftDist;
                        video.width = width;
                        video.height = height;
                        video.style.margin = '0px';

                        webgazer.params.imgWidth = width;
                        webgazer.params.imgHeight = height;
                    };

                    function checkIfReady() {
                        if (webgazer.isReady()) {
                            setup();
                        } else {
                            setTimeout(checkIfReady, 100);
                        }
                    }
                    setTimeout(checkIfReady, 100);

                    window.onbeforeunload = function () {
                        webgazer.end();
                    };

                    var canvas = document.createElement('canvas');
                    canvas.id = "myCanvas";
                    var body = document.getElementsByTagName("body");
                    body[0].appendChild(canvas);
                    canvas = document.getElementById("myCanvas");
                    var context = canvas.getContext('2d');
                    var circles = [];
                    context.canvas.width = window.innerWidth;
                    context.canvas.height = window.innerHeight;
                    var w = window.innerWidth;
                    var h = window.innerHeight;

                    var draw = function (context, x, y, fillcolor, radius, linewidth, strokestyle) {
                        context.beginPath();
                        context.arc(x, y, radius, 0, 2 * Math.PI, false);
                        context.fillStyle = fillcolor;
                        context.fill();
                        context.lineWidth = linewidth;
                        context.strokeStyle = strokestyle;
                        context.stroke();
                    };

                    var stroking = function (strokestyle) {
                        context.strokeStyle = strokestyle;

                    };

                    var Circle = function (x, y, radius) {
                        this.left = x - radius;
                        this.top = y - radius;
                        this.right = x + radius;
                        this.bottom = y + radius;
                    };

                    var drawCircle = function (context, x, y, fillcolor, radius, linewidth, strokestyle, circles) {
                        draw(context, x, y, fillcolor, radius, linewidth, strokestyle);
                        var circle = new Circle(x, y, radius);
                        circles.push(circle);
                    };

                    var calibrationPoints = [
                        [40, 40],
                        [w / 2, 40],
                        [w - 40, 40],
                        [40, h / 2],
                        [w / 2, h / 2],
                        [w - 40, h / 2],
                        [40, h - 40],
                        [w / 2, h - 40],
                        [w - 40, h - 40]
                    ];

                    var x = calibrationPoints[0][0];
                    var y = calibrationPoints[0][1];

                    drawCircle(context, x, y, "black", 17, 2, "black", circles);
                    drawCircle(context, x, y, "black", 10, 2, "black", circles);
                    drawCircle(context, x, y, "yellow", 3, 2, "black", circles);

                    var j = 1;
                    var k = 0;
                    document.getElementById('myCanvas').addEventListener("click", function (e) {
                        var clickedX = e.pageX - this.offsetLeft;
                        var clickedY = e.pageY - this.offsetTop;

                        if (clickedX < circles[2].right && clickedX > circles[2].left && clickedY > circles[2].top && clickedY < circles[2].bottom) {
                            if (j < calibrationPoints.length) {
                                var x = calibrationPoints[j][0];
                                var y = calibrationPoints[j][1];
                                context.clearRect(0, 0, canvas.width, canvas.height);
                                circles.pop();
                                circles.pop();
                                circles.pop();
                                drawCircle(context, x, y, "black", 17, 2, "black", circles);
                                drawCircle(context, x, y, "black", 10, 2, "black", circles);
                                drawCircle(context, x, y, "yellow", 3, 2, "black", circles);
                                j++;
                                k++;
                            } else {
                                context.clearRect(0, 0, canvas.width, canvas.height);
                                context.canvas.width = 0;
                                context.canvas.height = 0;

                                // end of calibration
                                calibrated = true;

                                //webgazer.showPredictionPoints(true);
                            }
                        }
                    });

                    function goToPage(page) {
                        location.href = page + ".htm";
                    }

                    document.getElementById('myCanvas').addEventListener("mousemove", function (e) {
                        var clickedX = e.pageX - this.offsetLeft;
                        var clickedY = e.pageY - this.offsetTop;
                        var style1 = "black";
                        var style2 = "black";
                        var style3 = "black";

                        if (k < calibrationPoints.length) {

                            if (clickedX < circles[0].right && clickedX > circles[0].left && clickedY > circles[0].top && clickedY < circles[0].bottom) {
                                style1 = "red";
                            } else {
                                style1 = "black"
                            }
                            if (clickedX < circles[1].right && clickedX > circles[1].left && clickedY > circles[1].top && clickedY < circles[1].bottom) {
                                style2 = "orange"
                            } else {
                                style2 = "black"
                            }
                            if (clickedX < circles[2].right && clickedX > circles[2].left && clickedY > circles[2].top && clickedY < circles[2].bottom) {
                                style3 = "green"
                            } else {
                                style3 = "black"
                            }
                            var x = calibrationPoints[k][0];
                            var y = calibrationPoints[k][1];
                            context.clearRect(0, 0, canvas.width, canvas.height);
                            circles.pop();
                            circles.pop();
                            circles.pop();
                            drawCircle(context, x, y, "black", 17, 2, style1, circles);
                            drawCircle(context, x, y, "black", 10, 2, style2, circles);
                            drawCircle(context, x, y, "yellow", 3, 2, style3, circles);
                        }

                    });
                } else {

                    var wb = XLSX.utils.book_new();
                    wb.Props = {
                        Title: "Element Views",
                        Subject: "Details",
                        Author: "CS",
                        CreatedDate: new Date()
                    };

                    wb.SheetNames.push("Detailed View"); //give your sheet a name
                    var ws = XLSX.utils.aoa_to_sheet([Array.from(tabela.keys()), Array.from(tabela.values())]); //create a sheet from your array of data
                    wb.Sheets["Detailed View"] = ws; //add your data to your sheet
                    wb.SheetNames.push("Hash"); //assign the sheet to the workbook array

                    var wbout = XLSX.write(wb, {
                        bookType: 'xlsx',
                        type: 'binary'
                    });
                    console.log("click");
                    await XLSX.writeFile(wb, "Details.xlsx");

                    document.getElementById("myHeatmap").style.position = "relative";

                    const screenshotTarget = document.documentElement;
                    setTimeout(() => {
                    html2canvas(screenshotTarget).then((canvas) => {
                        const base64image = canvas.toDataURL("image/png");

                        var img = new Image();

                        function split_2() {

                            var w2 = img.width,
                                h2 = img.height / 2;

                                canvas.width = w2;
                                canvas.height = h2;

                                canvas.getContext('2d').drawImage(this, 0, 0, w2, h2);
                                var a = document.createElement("a");
                                a.href = canvas.toDataURL();
                                a.download = "page.png";
                                a.click();

                                canvas.getContext('2d').drawImage(this, -w2, 0, w2, h2);
                                a = document.createElement("a");
                                a.href = canvas.toDataURL();
                                a.download = "heatmap.png";
                                a.click();
 
                        };

                        img.onload = split_2;
                        img.src = base64image;
                    });
                }, 2000);


                    // sleep
                    setTimeout(() => {
                        //location.reload();
                    }, 4000);

                }

                status = request.value;
            }


        }
    );

    heatmapContainer.style.position = "absolute";

};