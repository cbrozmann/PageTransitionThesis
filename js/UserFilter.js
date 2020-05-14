//Diese Datei soll die User Daten aus der GlobalVariableManager.js holen 
//und die User Daten auf die Nutzer reduzieren, die er vom VisualizationLoader bekommt.

//let colorPalette = ["royalblue", "burlywood", "lightgreen", "silver", "teal"];
let colorPalette = ["#4169e1", "#deb887", "#90ee90", "#c0c0c0", "#008080"];


function createFilterOptions(forAllWebsites = false) {
    let layers = {};
    if (forAllWebsites) {

    } else {
        let selectedWebsite = getSelectedWebsite();
        //iteriere uber alle Nutzer
        for (let user in window.importedData.allUsers) {
            //currentUser ist der User aus dem aktuellen Schleifendurchlauf
            let currentUser = window.importedData.allUsers[user];
            //currentWebsite sind die Daten fuer currentUser und die ausgewaehlte Webseite
            let currentWebsite = window.importedData.userStructure[currentUser][selectedWebsite];
            //current user wird in Layers angelegt und bekommt einen leeren Array
            layers[currentUser] = [];
            //iteriere ueber alle Web_Gruppen bzw. Web_group_ids fuer die ausgewaehlt Webseite
            for (let webGroup in currentWebsite) {
                let layer = currentWebsite[webGroup].layer;
                //speichere alle Layer, die in den Nutzerdaten vorkommen nur ein mal
                if (!layers[currentUser].includes(layer))
                    layers[currentUser].push(layer);
            }
            //sortiere den Layerarray fuer den Nutzer am Ende alphabetisch
            layers[currentUser].sort();
        }
        //Gebe die Layer aller Nutzer zurueck
        loadUserAndLayerList(layers, false);
    }
}

$("#allLayerSelect").click(() => {
    selectAllLayers();
});

$("#mainLayerSelect").click(() => {
    selectMainLayer();
});

function selectAllLayers() {
    $('[class$="CheckboxSelection"]').each(function (index, item) {
        item.checked = true;
    });
    handleSingleSelect();
}

function selectAllLayersOfUser(userID) {
    let item = $("#" + userID);
    let setTo = item.is(":checked");
    let parent = item.parent();
    parent.find("input.layerCheckboxSelection:checkbox").each(function () {
        $(this)[0].checked = setTo;
    });
    handleSingleSelect();
}

function selectMainLayer() {
    let mainLayer = getBestLayer(getAllLayersOfWebsite(getSelectedWebsite()));
    $('[class*="layerCheckboxSelection"]').each(function (index, item) {
        item.checked = (mainLayer === item.value);
    });
    handleSingleSelect();
}

function removeFilteredLayer() {
    let layers = getSelectedUserAndLayer();
    let website = getSelectedWebsite();
    let filteredWebStructure = {};
    let filteredUserStructure = {};
    for (let user in layers) {
        //create filtered UserStructure
        if (layers[user].length > 0) {
            filteredUserStructure[user] = {};
            filteredUserStructure[user][website] = [];
            let fullStructureForWebsite = window.importedData.userStructure[user][website];
            let fUserStructure = filteredUserStructure[user][website];
            for (let elem of fullStructureForWebsite) {
                if (elem && elem.layer != null) {
                    if (layers[user].includes(elem.layer)) {
                        fUserStructure.push(elem);
                    }
                }
            }
            //create filtered WebStructure
            if (filteredWebStructure[website] == null) {
                filteredWebStructure[website] = {};
            }
            let webStructureHelper = window.importedData.webStructure[website];
            let fWebStructure = filteredWebStructure[website];
            for (let webgroup in webStructureHelper) {
                if (window.importedData.webGroupToImageMapping && window.importedData.webGroupToImageMapping[webgroup] && window.importedData.webGroupToImageMapping[webgroup].layer != null) {
                    let webgroupLayer = window.importedData.webGroupToImageMapping[webgroup].layer;
                    if (layers[user].includes(webgroupLayer)) {
                        //webgroupInformationen muessen uebernommen werden
                        if (webStructureHelper[webgroup] && webStructureHelper[webgroup][user]) {
                            if (fWebStructure[webgroup] == null) {
                                fWebStructure[webgroup] = {[user]: webStructureHelper[webgroup][user]};
                            } else {
                                fWebStructure[webgroup][user] = webStructureHelper[webgroup][user];
                            }
                        }
                    }
                }
            }
        }
    }
    window.filteredData.userStructure = filteredUserStructure;
    window.filteredData.webStructure = filteredWebStructure;
    if (vis && vis.initialisation != null)
        vis.initialisation();
}

function getSelectedUserAndLayer() {
    let layers = {};
    $('#userList').each(function () {
        $(this).find("input.userCheckboxSelection:checkbox").each(function () {
            let item = $(this);
            layers[item.val()] = [];
            let listElement = item.parent();
            listElement.find("input.layerCheckboxSelection:checkbox").each(function () {
                if ($(this).is(":checked")) {
                    layers[item.val()].push($(this).val());
                }
            });
        });
    });
    return layers;
}

function handleSingleSelect() {
    $('#userList').each(function () {
        $(this).find("input.userCheckboxSelection:checkbox").each(function () {
            let item = $(this);
            let listElement = item.parent();
            let selected = false;
            listElement.find("input.layerCheckboxSelection:checkbox").each(function () {
                if ($(this).is(":checked")) {
                    selected = true;
                }
            });
            item[0].checked = !!selected;
        });
    });
    removeFilteredLayer();
}

//laedt WebsiteOptionen zu
function loadUserAndLayerList(layers, manyWebsites = false, clearList = true) {
    let array = [];
    if (manyWebsites) {

    } else
        for (let user in layers) {
            array.push(user);
            array.push(layers[user]);
        }
    let userListName = 'userList';
    let list = document.getElementById(userListName);
    let newDiv = document.createElement('div');
    arrToUl(newDiv, array);
    let newList = newDiv.children[0];
    let savedId = list.id;
    if (clearList) {
        list.innerHTML = newList.innerHTML;
        list.id = savedId;
    } else {
        list.appendChild(newList);
    }
}

function filter() {

}

//from https://stackoverflow.com/questions/41352837/javascript-how-to-create-unordered-list-from-array
function arrToUl(root, arr, prefix = "", className = "user") {
    let count = 0;
    let nextclass = "";
    if (className === "website") {
        nextclass = "user";
    } else if (className === "user") {
        nextclass = "layer";
    }
    let ul = document.createElement('ul');
    ul.style = "list-style-type:none";
    let li;

    root.appendChild(ul); // append the created ul to the root

    arr.forEach(function (item, index) {
        if (Array.isArray(item)) { // if it's an arrays
            arrToUl(li, item, prefix + arr[index - 1] + "_", nextclass); // call arrToUl with the li as the root
            return;
        }

        // li.appendChild(document.createTextNode(item)); // append the text to the li
        li = document.createElement('li'); // create a new list item
        //eigener Code Anfang
        let boxCN = className + "CheckboxSelection";
        let boxValue = item;
        let boxId = prefix + item;
        let boxEvent;
        if (className === "user") {
            boxEvent = "selectAllLayersOfUser('" + boxId + "')";
        } else {
            boxEvent = "handleSingleSelect()";
        }
        let checkboxBsp = '<input type="checkbox" class="' + boxCN + '" id="' + boxId + '" value="' + boxValue + '" onchange="' + boxEvent + '">';
        // let newCheckBox = document.createElement('input');
        // newCheckBox.type = 'checkbox';
        // newCheckBox.className = className + "CheckboxSelection";
        // newCheckBox.id = prefix + item; // need unique Ids!
        // newCheckBox.value = item;
        // newCheckBox.onchange = handleSingleSelect;
        li.innerHTML += (checkboxBsp);

        //create label
        let label = document.createElement('label')
        label.htmlFor = boxId;
        label.appendChild(document.createTextNode(item));
        label.style = "display: inline-block; vertical-align: middle; padding: 0 5px;";
        li.appendChild(label);
        if (className === "user") {
            let id = item + "Color";
            let color = colorPalette[(count % colorPalette.length)];
            let userColor = '<input id="' + id + '" name="' + id + '" onchange="parameterChange()" type="color" value="'+color+'">';
            li.innerHTML+= (userColor);
            count++;
        }
        //eigener Code Ende
        ul.appendChild(li); // append the list item to the ul
    });
}