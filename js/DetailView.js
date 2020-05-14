//Erstellt die Detailviewtextur
let detailViewTexture = null;
let fullCanvas = document.createElement("canvas");
let imageCanvas = document.createElement("canvas");
let heatmapCanvas = document.createElement("canvas");
let gazePathCanvas = document.createElement("canvas");
let mousePathCanvas = document.createElement("canvas");
let clicksCanvas = document.createElement("canvas");

function getDataArrayClickmap(webgroupId, file = "gaze") {//file="gaze" oder "mouse"
    let temp = window.importedData[file];
    let xyDurationArray = [];
    let selectedLayer = getSelectedUserAndLayer();
    for (let user in temp[webgroupId]) {
        //Filtering
        if (selectedLayer != null && selectedLayer[user] != null && selectedLayer[user].includes(getLayerOfWebgroup(webgroupId))) {
            let dataArray = temp[webgroupId][user];
            for (let i = 0; i < dataArray.length; i++) {
                let currentGazeEntry = dataArray[i];
                if (file === "gaze") {
                    xyDurationArray.push([parseInt(currentGazeEntry.x), parseInt(currentGazeEntry.y), parseInt(currentGazeEntry.duration), currentGazeEntry.user_id, parseInt(currentGazeEntry.timestamp)]);
                } else if (file === "mouse") {
                    xyDurationArray.push([parseInt(currentGazeEntry.x), parseInt(currentGazeEntry.y), currentGazeEntry.type, currentGazeEntry.user_id, parseInt(currentGazeEntry.timestamp)]);
                }
            }
        }
    }
    return xyDurationArray;
}

function getDataArrayUserflow(webgroupId, userData, file = "gaze") { //userdata im format {user,start,end} //file="gaze" oder "mouse"
    let temp = window.importedData[file];
    let xyDurationArray = [];
    for (let userDatum of userData) {
        if (userDatum.user != null && userDatum.start != null && userDatum.end != null) {
            let user = userDatum.user;
            //Wenn Daten vorhanden
            if (temp[webgroupId] != null && temp[webgroupId][user] != null) {
                let dataArray = temp[webgroupId][user];
                for (let i = 0; i < dataArray.length; i++) {
                    let currentGazeEntry = dataArray[i];
                    if (userDatum.start <= currentGazeEntry.timestamp && currentGazeEntry.timestamp <= userDatum.end)
                        if (file === "gaze") {
                            xyDurationArray.push([parseInt(currentGazeEntry.x), parseInt(currentGazeEntry.y), parseInt(currentGazeEntry.duration), currentGazeEntry.user_id, parseInt(currentGazeEntry.timestamp)]);
                        } else if (file === "mouse") {
                            xyDurationArray.push([parseInt(currentGazeEntry.x), parseInt(currentGazeEntry.y), currentGazeEntry.type, currentGazeEntry.user_id, parseInt(currentGazeEntry.timestamp)]);
                        }
                }
            }
        }
    }
    return xyDurationArray;
}

function getDataArrayTimeline(shotName, file = "gaze") {//file="gaze" oder "mouse"
    let temp = window.importedData[(file + "Shots")];
    let xyDurationArray = [];
    let dataArray = temp[shotName];
    if (dataArray != null) {
        for (let i = 0; i < dataArray.length; i++) {
            let currentGazeEntry = dataArray[i];
            if (file === "gaze") {
                xyDurationArray.push([parseInt(currentGazeEntry.x), parseInt(currentGazeEntry.y), parseInt(currentGazeEntry.duration), currentGazeEntry.user_id, parseInt(currentGazeEntry.timestamp)]);
            } else if (file === "mouse") {
                xyDurationArray.push([parseInt(currentGazeEntry.x), parseInt(currentGazeEntry.y), currentGazeEntry.type, currentGazeEntry.user_id, parseInt(currentGazeEntry.timestamp)]);
            }
        }
    }
    return xyDurationArray;
}

function recreateDetailView() {
    drawSelectedVisOnCanvas();
    detailViewTexture.needsUpdate = true;
}

function drawSelectedVisOnCanvas() {
    //Zeichne ausgewaehlte Visualisierungen auf Canvas
    let ctxFull = fullCanvas.getContext("2d");
    ctxFull.clearRect(0, 0, ctxFull.canvas.width, ctxFull.canvas.height);
    ctxFull.drawImage(imageCanvas, 0, 0, ctxFull.canvas.width, ctxFull.canvas.height);
    if (document.getElementById("showHeatmapOnDetailview").checked === true)
        ctxFull.drawImage(heatmapCanvas, 0, 0, ctxFull.canvas.width, ctxFull.canvas.height);
    if (document.getElementById("showGazePathOnDetailview").checked === true)
        ctxFull.drawImage(gazePathCanvas, 0, 0, ctxFull.canvas.width, ctxFull.canvas.height);
    if (document.getElementById("showMousePathOnDetailview").checked === true)
        ctxFull.drawImage(mousePathCanvas, 0, 0, ctxFull.canvas.width, ctxFull.canvas.height);
    if (document.getElementById("showClicksOnDetailview").checked === true)
        ctxFull.drawImage(clicksCanvas, 0, 0, ctxFull.canvas.width, ctxFull.canvas.height);
}

function createDetailView(imageName, gazeArray, mouseArray) {
    let highQualityImageTexture = getTexture(imageName, {fullSizeImage: true});
    let ctxFull = fullCanvas.getContext("2d");
    let ctxHeat = heatmapCanvas.getContext("2d");
    let ctxScan = gazePathCanvas.getContext("2d");
    let ctxMouse = mousePathCanvas.getContext("2d");
    let ctxClicks = clicksCanvas.getContext("2d");
    let ctxImage = imageCanvas.getContext("2d");
    return highQualityImageTexture.then((texture) => {
        let img = texture.image;
        let w = texture.image.naturalWidth;
        let h = texture.image.naturalHeight;

        clearAndResize(ctxFull, w, h);
        clearAndResize(ctxHeat, w, h);
        clearAndResize(ctxScan, w, h);
        clearAndResize(ctxMouse, w, h);
        clearAndResize(ctxClicks, w, h);
        clearAndResize(ctxImage, w, h);

        ctxImage.drawImage(img, 0, 0, ctxImage.canvas.width, ctxImage.canvas.height);
        //lade verschiedene Visualisierungen
        loadHeatmap(heatmapCanvas, gazeArray);
        loadScanpath(gazePathCanvas, gazeArray, false);
        loadScanpath(mousePathCanvas, mouseArray, true);
        let clicks = mouseArray.filter(mouse => mouse[2] === "click");
        loadClicks(clicksCanvas, clicks);
        //Zeichne ausgewaehlte Visualisierungen auf Canvas
        drawSelectedVisOnCanvas();
        detailViewTexture = new THREE.CanvasTexture(fullCanvas);
        return detailViewTexture;
    });
}

function loadClicks(canvas, clickData) {
    let ctx = canvas.getContext("2d");
    let radius = document.getElementById('radiusClicks');
    clickData.forEach(function (click) {
        ctx.beginPath();
        ctx.arc(click[0], click[1], radius.value, 0, 2 * Math.PI);
        let userId = click[3];
        let userColor = document.getElementById(userId + "Color").value;
        ctx.fillStyle = userColor;
        ctx.fill();
        ctx.lineWidth = 2;
        ctx.strokeStyle = "white";
        ctx.stroke();
    });
    let changeType = 'oninput' in radius ? 'oninput' : 'onchange';
    radius[changeType] = function (e) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        loadClicks(canvas, clickData);
        recreateDetailView();
    };
}

function getLayerOfWebgroup(webgroup) {
    if (window.importedData.webGroupToImageMapping[webgroup] != null) {
        return window.importedData.webGroupToImageMapping[webgroup].layer;
    }
}

function triggerChangeHMOptions() {
    let radius = document.getElementById('radiusHM');
    let changeType = 'oninput' in radius ? 'oninput' : 'onchange';
    let f = radius[changeType];
    f();
}

function triggerChangeSPOptions() {
    let radius = document.getElementById('radiusSP');
    let changeType = 'oninput' in radius ? 'oninput' : 'onchange';
    let f = radius[changeType];
    f();
}

function triggerChangeMPOptions() {
    let radius = document.getElementById('radiusMP');
    let changeType = 'oninput' in radius ? 'oninput' : 'onchange';
    let f = radius[changeType];
    f();
}

function triggerChangeClickOptions() {
    let radius = document.getElementById('radiusClicks');
    let changeType = 'oninput' in radius ? 'oninput' : 'onchange';
    let f = radius[changeType];
    f();
}


function clearAndResize(ctx, width, height) {
    ctx.canvas.width = width;
    ctx.canvas.height = height;
    ctx.clearRect(0, 0, width, height);
}
