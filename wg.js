let count = 0;
let avgX = 0;
let avgY = 0;
let tabelaIDs = new Map();
let tabelaClasses = new Map();
let calibrated = false;

window.onload = function () {

    var status = "Start";
    chrome.storage.sync.set({
        status
    });

    var sh = false;
    chrome.storage.sync.set({
        sh
    });

    tabelaIDs.set("Id","Views");
    tabelaClasses.set("Class","Views");

    var elements = document.getElementsByTagName("*");    
    for (var i = 0; i < elements.length; i++) {
        tabelaIDs.set(elements[i].id, 0);
        tabelaClasses.set(elements[i].className, 0);
    }

    //generates de heatmap points and updates the values of the hashmap elements from the HTML DOM
    function pinta(valX, valY) {
        try {
            heatmap.addData({
                x: valX,
                y: valY,
                value: 1
            });

            var elem = document.elementFromPoint(valX, valY);
            tabelaIDs.set(elem.id, tabelaIDs.get(elem.id) + 1); //a>1 => a++
            tabelaClasses.set(elem.className, tabelaClasses.get(elem.className) + 1); //a>1 => a++

        } catch (error) {
            //debug.error(error);
        }
    };

    var heatmap = document.createElement('div');
    heatmap.id = "myHeatmap";
    var body = document.getElementsByTagName("body");
    body[0].appendChild(heatmap);

    document.getElementById("myHeatmap").style.width = document.documentElement.scrollWidth + "px";
    document.getElementById("myHeatmap").style.height = document.documentElement.scrollHeight + "px";

    while (document.getElementById("myHeatmap").style.height != document.documentElement.scrollHeight + 'px' ||
        document.getElementById("myHeatmap").style.width != document.documentElement.scrollWidth + 'px') {}

    var heatmapContainer = document.getElementById("myHeatmap");

    // create a heatmap instance
    heatmap = h337.create({
        container: heatmapContainer,
        maxOpacity: .4,
        radius: 50,
        blur: .90,
        backgroundColor: 'rgba(255, 255, 255, 0)'
    });

    document.getElementById("myHeatmap").onclick = function (e) {
        if (calibrated) {
            var x = e.layerX;
            var y = e.layerY;
            heatmap.addData({
                x: x,
                y: y,
                value: 1
            });
        }
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
                sh = request.sh;
            } else {
                if (request.value === "Stop") {

                    document.getElementById("myHeatmap").style.display = 'none';

                    webgazer.setRegression('ridge') /* currently must set regression and tracker */
                        //.setTracker('clmtrackr')
                        .setGazeListener(function (data, clock) {
                            try {
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
                                    avgX += window.pageXOffset;
                                    avgY += window.pageYOffset;
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
                        .showFaceFeedbackBox(false)
                        .showFaceOverlay(false)
                        .showPredictionPoints(false)
                        .begin();

                    var width = 320;
                    var height = 240;
                    var topDist = '0px';
                    var leftDist = '0px';

                    var setup = function () {
                        var video = document.getElementById('webgazerVideoFeed');
                        video.style.display = 'none';
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
                    context.canvas.width = document.documentElement.scrollWidth;
                    context.canvas.height = document.documentElement.scrollHeight;
                    var w = document.documentElement.scrollWidth;
                    var h = document.documentElement.scrollHeight;

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

                    webgazer.pause();

                    var d = new Date();
                    var dia = d.getDate();
                    var mes = d.getMonth();
                    var ano = d.getFullYear();
                    var horas = d.getHours();
                    var min = d.getMinutes();

                    var wb = XLSX.utils.book_new();
                    wb.Props = {
                        Title: "Element Views",
                        Subject: "Details",
                        Author: "CS",
                        CreatedDate: new Date()
                    };


                    finalInput = [Array.from(tabelaIDs.keys()), Array.from(tabelaIDs.values()), [""], Array.from(tabelaClasses.keys()), Array.from(tabelaClasses.values())];
                    var aoa = [];
                    for (var i = 0; i < finalInput.length; ++i) {
                        for (var j = 0; j < finalInput[i].length; ++j) {
                            if (!aoa[j]) aoa[j] = [];
                            aoa[j][i] = finalInput[i][j];
                        }
                    }


                    wb.SheetNames.push("Detailed View"); //give your sheet a name
                    var ws = XLSX.utils.aoa_to_sheet(aoa); //create a sheet from your array of data
                    wb.Sheets["Detailed View"] = ws; //add your data to your sheet


                    var wbout = XLSX.write(wb, {
                        bookType: 'xlsx',
                        type: 'binary'
                    });
                    console.log("click");
                    await XLSX.writeFile(wb, "Details" + dia + mes + ano + "_" + horas + min + ".xlsx");

                    window.scrollTo(0, 0);
                    
                    document.getElementById("myHeatmap").style.position = "absolute";
                    document.getElementById("myHeatmap").style.top = 0;
                    document.getElementById("myHeatmap").style.left = 0;
                    document.getElementById("myHeatmap").style.zIndex = 2500;
                    document.getElementById("myHeatmap").style.display = 'block';

                    while (document.getElementById("myHeatmap").style.display != 'block') {}
                    
                    const screenshotTarget = document.documentElement;
                    html2canvas(screenshotTarget).then((canvas) => {
                        const base64image = canvas.toDataURL("image/png");
                        var a = document.createElement("a");
                        a.href = base64image;
                        a.download = "heatmap_" + dia + mes + ano + "_" + horas + min + ".png";
                        a.click();
                    });

                    setTimeout(function(){ 
                        location.reload(); 
                    }, 5000);

                }

                status = request.value;
            }


        }
    );

    document.getElementById("myHeatmap").style.position = "absolute";
    document.getElementById("myHeatmap").style.pointerEvents = "none";

};