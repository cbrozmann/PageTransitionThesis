//Diese Datei soll die UserFilter.js aufrufen mit den ausgewaehlten Nutzern 
//und die ausgewaehlte Visualisierung aufrufen. 
//Dieser Klasse gehoert der Canvas und soll den Canvas zwischen Visualisierungswechseln loeschen.
let vis;
let canvas = document.getElementById("visualizationsCanvas");
let gl = canvas.getContext("webgl")
    || canvas.getContext("experimental-webgl");

//Eventlistener, der auf Wechsel der Visualisierung im HTML Dokument reagiert.
//Die neue Visualisierung wird geladen
$('#selectVis').on('change', loadVisualization);
$('#selectWebsite').on('change', loadVisualization);
$('#selectUserVideo').on('change', changeVideo);
$('#selectLayoutAlgorithm').on('change', graphChange);
// $('#toggleTimelineOptions').click(function () {
//     showVisualizationOptions();
// });
// $('#toggleClickmapOptions').click(function () {
//     showVisualizationOptions();
// });

//Funktion, die die im HTML-Code ausgewaehlte Visualisierung ausliest und in der globalen Variable window.selectedVisualization aktualisiert
function getSelectedVisualization() {
    //die ausgewaehlte Visualisierung wird zurueckgegeben
    return $('#selectVis').val();
}

//Funktion, die die im HTML-Code ausgewaehlte Website ausliest und in der globalen Variable window.selectedWebsite aktualisiert
function getSelectedWebsite() {
    //die ausgewaehlte Website wird zurueckgegeben
    return $('#selectWebsite').val();
}

//Funktion,die den Canvas leert und danach die aktuelle Visualisierung auswählt.
function loadVisualization() {
    //Zuerst wird der Canvas geleert
    clearScene();
    //Es wird abgerufen, welche Visualisierung und Website jetzt ausgewaehlt wurde
    let selectedVisualization = getSelectedVisualization();
    let selectedWebsite = getSelectedWebsite();
    if (window.selectedVisualization !== selectedVisualization || window.selectedWebsite !== selectedWebsite) {
        //leere den Canvas + alle Texturen
        clearCanvas();
        $("#myVideo").hide();
        $("#myVideo").innerHTML = "Your Browser does not support video.";
        //window.selectedVisualization ist eine Globale Variable aus GlobalVariableManager, die aktualisiert wird
        window.selectedVisualization = selectedVisualization;
        //window.selectedWebsite ist eine Globale Variable aus GlobalVariableManager, die aktualisiert wird
        window.selectedWebsite = selectedWebsite;
    }
    //Fuer die ausgewaehlte Visualisierung werden die ausgewaehlten Optionen geladen
    let options = getSelectedOptions(selectedVisualization);
    //Zum Schluss wird die ausgewaehlte Visualisierung mit den ausgewaehlten Optionen aufgerufen
    switch (selectedVisualization) {
        case "timeline":
            createFilterOptions();
            selectMainLayer();
            vis = new Timeline(options);
            break;
        case "userflow":
            createFilterOptions();
            selectMainLayer();
            vis = new Userflow(options);
            break;
        case "clickmap":
            createFilterOptions();
            selectMainLayer();
            vis = new Clickmap(options);
            break;
        default:
            break;
    }
}

//Funktion, die die Parameter fuer die aktuell ausgewaelte Visualisierung ausliest.
function getSelectedOptions(selectedVisualization) {
    $('[class$="Options"]').hide();
    checkMoreThanOneSelectable();
    switch (selectedVisualization) {
        case "timeline":
            $('.timelineOptions').show();
            $('.layerSelectionOptions').show();
            $('.detailviewOptions').show();
            window.selectedWebsite = getSelectedWebsite();
            return window.selectedWebsite;
        case "userflow":
            $('.userflowOptions').show();
            $('.detailviewOptions').show();
            $('.layerSelectionOptions').show();
            window.selectedWebsite = getSelectedWebsite();
            return window.selectedWebsite;
            break;
        case "clickmap":
            $('.clickmapOptions').show();
            $('.layerSelectionOptions').show();
            $('.detailviewOptions').show();
            window.selectedWebsite = getSelectedWebsite();
            return window.selectedWebsite;
        default:
            break;
    }
    return null;
}

//Funktion um Canvas zu leeren
function clearCanvas() {
    clearTextures();
    let visualization = window.selectedVisualization !== "" ? window.selectedVisualization : getSelectedVisualization();
    showVisualizationOptions(true, visualization);
    //Canvas leeren bringt nicht viel, besser waere scene.children=[];
    //oder renderer.clear(true,true,true) um color,depth und stencile buffer zu leeren
    gl.clearColor(26 / 255, 179 / 255, 148 / 255, 1.0);//r,g,b,a in Floatnotation //Eyevido Grün
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT | gl.STENCIL_BUFFER_BIT);
    // if (vis && vis.scene)
    //     vis.scene = new THREE.Scene();
}

function clearScene() {
    if (vis && vis.scene) {
        if (typeof vis.clearContainer === 'function')
            vis.clearContainer(vis.scene);
        vis.scene.dispose();
    }
    if (vis && vis.renderer)
        vis.renderer.dispose();
}

function showVisualizationOptions(hide = false, visualization = getSelectedVisualization()) {
    // Weise die Checkbox zu
    let selectedVisualization = visualization;
    let checkBoxName = "toggle" + selectedVisualization + "Options";
    let checkBox = document.getElementById(checkBoxName);
    // Weise das output Element zu
    let output = document.getElementById(selectedVisualization + "SettingsDiv");
    // If the checkbox is checked, display the output text
    if (!hide && checkBox.checked === true) {
        output.style.display = "block";
    } else {
        if (checkBox != null)
            checkBox.checked = false;
        if (output != null)
            output.style.display = "none";
    }
}

function changeWithLayer() {
    let checked = getWithLayer();
    window.withLayer = (checked === true);
    if (vis instanceof Timeline) {
        vis.drawUserData({withLayer: window.withLayer});
    }
    if (vis instanceof Clickmap) {
        loadVisualization();
    }
}

function getWithLayer() {
    let checkBoxName = getSelectedVisualization() + "WithLayer";
    let checkBox = document.getElementById(checkBoxName);
    if (checkBox != null)
        return checkBox.checked;
    return false;
}

//Aenderungen im HTML, nachdem ganze Visualisierung neu gezeichnet werden muss
function parameterChange() {
    if (vis instanceof Timeline) {
        timelineColor = document.getElementById("timelineColor").value;
        timelineTextBackgroundColor = document.getElementById("textBackgroundColor").value;
        emptyPlaneColor = document.getElementById("emptyPlaneColor").value;
        dashedLineColor = document.getElementById("dashedLineColor").value;
        pixelPerSecond = parseInt(document.getElementById("pixelPerSecond").value);
        timelineTextSize = parseInt(document.getElementById("timelineTextSize").value);
        timelineVideoPositionColor = document.getElementById("timelineVideoPositionColor").value;
    }
    if (vis instanceof Clickmap) {
        clickmapTextColor = document.getElementById("clickmapTextColor").value;
        clickmapTextBackgroundColor = document.getElementById("clickmapTextBackgroundColor").value;
        clickmapHoverArrowColor = document.getElementById("clickmapHoverArrowColor").value;
        suppressParallelTransition = document.getElementById("suppressParallelTransition").checked;
        clickmapTransitionColor = document.getElementById("clickmapTransitionColor").value;
        clickmapParallelColor = document.getElementById("clickmapParallelColor").value;
        clickmapArrowHeadLength = parseInt(document.getElementById("clickmapArrowHeadLength").value);
        clickmapArrowHeadWidth = parseInt(document.getElementById("clickmapArrowHeadWidth").value);
        emptyCircleColor = document.getElementById("emptyCircleColor").value;
        clickmapCircleSegments = parseInt(document.getElementById("clickmapCircleSegments").value);
    }
    if (vis instanceof Userflow) {
        userflowVerticalPadding = parseInt(document.getElementById("userflowVerticalPadding").value);
        userflowHorizontalPadding = parseInt(document.getElementById("userflowHorizontalPadding").value);
        userflowHeightPerUser = parseInt(document.getElementById("userflowHeightPerUser").value);
        userflowWidth = parseInt(document.getElementById("userflowWidth").value);
        userflowTextSize = parseInt(document.getElementById("userflowTextSize").value);
        userflowHoverHeight = parseInt(document.getElementById("userflowHoverHeight").value);
        userflowSessionColor = document.getElementById("userflowSessionColor").value;
        userflowTextColor = document.getElementById("userflowTextColor").value;
        userflowEmptyRectangleColor = document.getElementById("userflowEmptyRectangleColor").value;
        userflowEdgeColor = document.getElementById("userflowEdgeColor").value;
        userflowDropoutColor = document.getElementById("userflowDropoutColor").value;
        userflowTextBackgroundColor = document.getElementById("userflowTextBackgroundColor").value;
        userflowEdgeHoverColor = document.getElementById("userflowEdgeHoverColor").value;
    }
    vis.initialisation();
    changeBackground();
}

function graphChange() {
    if (vis instanceof Clickmap) {
        layoutAlgorithm = document.getElementById("selectLayoutAlgorithm").value;
        vis.layoutAndDrawGraph()
    }
    if (vis instanceof Userflow) {
        userflowSessionColor = document.getElementById("userflowSessionColor").value;
        userflowTextColor = document.getElementById("userflowTextColor").value;
        userflowTextSize = parseInt(document.getElementById("userflowTextSize").value);
        vis.drawGraph();
    }
}

//Aenderungen im HTML, nachdem Nodes neu gezeichnet werden muessen
function nodeChange() {
    if (vis instanceof Clickmap) {
        emptyCircleColor = document.getElementById("emptyCircleColor").value;
        clickmapCircleSegments = parseInt(document.getElementById("clickmapCircleSegments").value);
    }
    if (vis instanceof Userflow) {
        userflowEmptyRectangleColor = document.getElementById("userflowEmptyRectangleColor").value;
    }
    vis.drawNodes();
}

//Aenderungen im HTML, nachdem Edges neu gezeichnet werden muessen
function edgeChange() {
    if (vis instanceof Clickmap) {
        suppressParallelTransition = document.getElementById("suppressParallelTransition").checked;
        clickmapTransitionColor = document.getElementById("clickmapTransitionColor").value;
        clickmapParallelColor = document.getElementById("clickmapParallelColor").value;
        clickmapArrowHeadLength = parseInt(document.getElementById("clickmapArrowHeadLength").value);
        clickmapArrowHeadWidth = parseInt(document.getElementById("clickmapArrowHeadWidth").value);
    }
    if (vis instanceof Userflow) {
        userflowEdgeColor = document.getElementById("userflowEdgeColor").value;
    }
    vis.drawEdges();
}

function dropoutChange() {
    if (vis instanceof Userflow) {
        userflowDropoutColor = document.getElementById("userflowDropoutColor").value;
        vis.drawDropouts();
    }
}

//Aenderungen, die nur Hoverevents betreffen und kein neuladen erfordern
function changeHoverEvents() {
    if (vis instanceof Timeline) {
        deleteHoverPlaneOnMouseLeave = document.getElementById("deleteHoverPlaneOnMouseLeave").checked;
        timelineVideoPositionColor = document.getElementById("timelineVideoPositionColor").value;
    }
    if (vis instanceof Clickmap) {
        deleteClickmapHoverEdgeOnMouseLeave = document.getElementById("deleteClickmapHoverEdgeOnMouseLeave").checked;
        deleteClickmapHoverNodeOnMouseLeave = document.getElementById("deleteClickmapHoverNodeOnMouseLeave").checked;
        clickmapTextBackgroundColor = document.getElementById("clickmapTextBackgroundColor").value;
        clickmapHoverArrowColor = document.getElementById("clickmapHoverArrowColor").value;
    }
    if (vis instanceof Userflow) {
        deleteUserflowHoverEdgeOnMouseLeave = document.getElementById("deleteUserflowHoverEdgeOnMouseLeave").checked;
        deleteUserflowHoverNodeOnMouseLeave = document.getElementById("deleteUserflowHoverNodeOnMouseLeave").checked;
        userflowTextBackgroundColor = document.getElementById("userflowTextBackgroundColor").value;
        userflowEdgeHoverColor = document.getElementById("userflowEdgeHoverColor").value;
        userflowHoverHeight = parseInt(document.getElementById("userflowHoverHeight").value);
    }
    if (document.getElementById(getSelectedVisualization() + "ActionDrivenRender") != null)
        window.actionDrivenRender = document.getElementById(getSelectedVisualization() + "ActionDrivenRender").checked;
}

function changeBackground() {
    if (vis && vis.scene && vis.scene.background)
        vis.scene.background = new THREE.Color(document.getElementById(getSelectedVisualization() + "BackgroundColor").value);
}

function showLayerSelection() {
    let checkBox = document.getElementById("toggleLayerSelectionOptions");
    let output = document.getElementById("layerSelectionDiv");
    if (checkBox.checked === true) {
        output.style.display = "block";
    } else {
        output.style.display = "none";
    }
}

function showDetailviewOptions() {
    let checkBox = document.getElementById("toggleDetailviewOptions");
    let output = document.getElementById("detailviewSelectionDiv");
    if (checkBox.checked === true) {
        output.style.display = "block";
    } else {
        output.style.display = "none";
    }
}

function weightChange() {
    if (vis instanceof Clickmap) {
        clickmapBubbleSize = parseFloat(document.getElementById("clickmapBubbleSize").value);
        clickmapArrowHeadLength = parseInt(document.getElementById("clickmapArrowHeadLength").value);
        clickmapArrowHeadWidth = parseInt(document.getElementById("clickmapArrowHeadWidth").value);
        clickmapCircleSegments = parseInt(document.getElementById("clickmapCircleSegments").value);
        vis.layoutAndDrawGraph();
    }
}

function changeVideo() {
    if (vis instanceof Timeline) {
        let defaultText = "Your browser does not support HTML5 video.";
        let vid = document.getElementById("myVideo");
        let website = getSelectedWebsite();
        let user = document.getElementById("selectUserVideo").value;
        if (user == "noUser" || user == "unloaded") {
            vid.innerHTML = defaultText;
            vid.style.display = "none";
            if ($("#videoPlayer_wrapper") && typeof $("#videoPlayer_wrapper").resizable === "function") {
                $("#videoPlayer_wrapper").resizable('disable');
            }
            $("#videoPlayer_wrapper").hide();
        } else {
            vid.style.display = "block";
            $("#videoPlayer_wrapper").resizable();
            $("#videoPlayer_wrapper").show();
            if (window.importedData.videos && window.importedData.videos[user] && window.importedData.videos[user][website] && window.importedData.videos[user][website].mp4 != null && window.importedData.videos[user][website].webm != null) {
                let vidMp4 = window.importedData.videos[user][website].mp4;
                let vidWebM = window.importedData.videos[user][website].webm;
                if (vid && typeof vid.pause === "function") {
                    // safe to use the function
                    vid.pause();
                }
                vid.innerHTML =
                    '<source src = "' + vidMp4 + '" type = "video/mp4" codecs="avc1.42E01E, mp4a.40.2"> \n' +
                    '<source src = "' + vidWebM + '" type = "video/webm"> \n' +
                    'Your browser does not support HTML5 video.';
                vid.load();
            }
        }
    }
}

function changeMoreThanOneSelectable() {
    let box = document.getElementById(getSelectedVisualization() + "MoreThanOneSelectable");
    if (box && box.checked != null)
        moreThanOneSelectable = !!box.checked;
}

function checkMoreThanOneSelectable() {
    let box = document.getElementById(getSelectedVisualization() + "MoreThanOneSelectable");
    if (box && box.checked != null)
        box.checked = moreThanOneSelectable;
}