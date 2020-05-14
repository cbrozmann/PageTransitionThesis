//In dieser Datei wird der Datenimport geregelt. 
//Die importierten Daten werden im GlobalVariableManager gespeichert.
let widthAndHeightExists = false;
let layerExists = false;
let urlExists = false;
//Bei Bereitwerden des Dokumentes wird geprueft ob die API funktioniert.
//Wenn dies nicht funktioniert werden Fehler gemeldet, 
//sonst wird ein Eventhandler fuer den CSV-Import und einer fuer den Bildimport initialisiert
$(document).ready(function () {
    if (isAPIAvailable()) {
        $('#inputGroupFile').bind('change', handleFileSelect);
        $('#inputGroupFile-image').bind('change', handleFileImageSelect);
    }
});

//Funktion die testet ob alle benutzten APIs funktionieren
function isAPIAvailable() {
    //testet alle benutzten APIs, ob diese funktionieren
    if (window.File && window.FileReader && window.FileList && window.Blob) {
        //alle funktionieren. 
        return true;
    } else {
        // source: File API availability - http://caniuse.com/#feat=fileapi
        // source: <output> availability - http://html5doctor.com/the-output-element/
        //wenn nicht alle funktionieren wird eine Meldung geschrieben ueber funktionierende Browser
        document.writeln('The HTML5 APIs used in this form are only available in the following browsers:<br />');
        // 6.0 File API & 13.0 <output>
        document.writeln(' - Google Chrome: 13.0 or later<br />');
        // 3.6 File API & 6.0 <output>
        document.writeln(' - Mozilla Firefox: 6.0 or later<br />');
        // 10.0 File API & 10.0 <output>
        document.writeln(' - Internet Explorer: Not supported (partial support expected in 10.0)<br />');
        // ? File API & 5.1 <output>
        document.writeln(' - Safari: Not supported<br />');
        // ? File API & 9.2 <output>
        document.writeln(' - Opera: Not supported');
        return false;
    }
}

//Funktion, um die Eyevido-Demodaten zu laden
function loadEyevidoData() {
    //relativer Pfad zu CSVs
    let csvRelativePath = "dataset/eyevido/csv/";
    //relativer Pfad zu den Bildern
    let imgRelativePath = "dataset/eyevido/images/";
    //Aufruf der Funktion, um die DemoDaten von den relativen Pfaden hochzuladen
    loadDemoData(csvRelativePath, imgRelativePath);
}

//Funktion, um die StimuliDiscovery-Demodaten zu laden
function loadStimuliDiscoveryData() {
    //relativer Pfad zu CSVs
    let csvRelativePath = "dataset/StimuliDiscovery/csv/";
    //relativer Pfad zu den Bildern
    let imgRelativePath = "dataset/StimuliDiscovery/images/";
    let imgThumbRelativePath = "dataset/StimuliDiscovery/images/thumb/";
    let videoRelativePath = "dataset/StimuliDiscovery/videos/";
    //Aufruf der Funktion, um die DemoDaten von den relativen Pfaden hochzuladen
    loadDemoData(csvRelativePath, imgRelativePath, imgThumbRelativePath, videoRelativePath);
}

//Funktion, um die Demodaten zu laden.
//Eingabeparameter: relativer Pfad zu den CSV und Bildern, bzw. URL zu diesen
function loadDemoData(csvRelativePath, imgRelativePath, imgThumbRelativePath = imgRelativePath + "thumb/", videoRelativePath) {
    //output soll geladene Funktionen in die Fileliste hinzufuegen
    let output = '';
    //alle CSV Files, die zu dem Beispieldatensatz gehoeren
    let files = ["user.csv", "web_results.csv", "gaze.csv", "mouse.csv", "mapping.csv", "gaze_shots.csv", "mouse_shots.csv"];
    //Funktion, die ueber alle CSVs iteriert diese parsed, in einer globalen Variable speichert und Daten dieser in den Output hinzufuegt
    for (let idx = 0; idx < files.length; idx++) {
        //waehle den akuellen File aus der Liste aus
        let file = files[idx];
        //erstelle einen Output der Metadaten des Files, sodass man sieht welche Dateien geladen wurden (Name, FileType, FileSize, Last Modified)
        output += createDataOutput(file);
        //ajax=Asynchronous JavaScript and XML. Hier um die Daten zu parsen, wenn sie geladen wurden und zu synchronisieren.
        $.ajax({
            //wir bekommen Dateien
            type: "GET",
            //unter der URL
            url: csvRelativePath + file,
            //vom Typ String (plain Text)
            dataType: "text",
            //bei erfolgreichem Laden wird die Datei geparsed
            success: function (csv) {
                //lese csv mit jquerey.csv als Array von Strings
                let data = $.csv.toArrays(csv);
                //Daten werden geparsed (an ; getrennt und in Array geladen)
                let parsed_data = parseDataStructure(data);
                //geparsete Daten werden in globale Variable geschrieben
                window.importedFiles[file] = parsed_data;
            },
            //bei Fehlern wird die fehlehafte Datei in die Console geschrieben
            error: function (data) {
                console.log("Error");
                console.log(data)
            },
            //der Aufruf ist synchron
            async: false
        });
    }
    //Zum Schluss des Fileimports wird die Fileliste ausgegeben
    $('#file_list').append(output);

    //danach wird aus den Importierten Files die Datenstruktur erstellt
    makeDataStructure();
    makeWebStructureAndRenameWebIds();
    //es wird zu jedem Webauftritt aller Nutzer das zugehoerige Bild/der Shot geladen
    for (let user in window.importedData.userStructure) {
        for (let website in window.importedData.userStructure[user]) {
            for (let result in window.importedData.userStructure[user][website]) {
                let elem = window.importedData.userStructure[user][website][result];
                //if Bedingung, weil nicht alle Bilder existieren. Einige haben keine Hoehe und Breite
                if (widthAndHeightExists) {
                    if (elem && elem.image && elem.image !== "NULL" &&
                        elem.height && elem.height !== "NULL" &&
                        elem.width && elem.width !== "NULL") {
                        window.importedData.images[elem.image] = {};
                        window.importedData.images[elem.image].full = imgRelativePath + elem.image;
                        window.importedData.images[elem.image].thumb = imgThumbRelativePath + elem.image;
                    }
                } else if (elem.image && elem.image !== "NULL") {
                    window.importedData.images[elem.image] = {};
                    window.importedData.images[elem.image].full = imgRelativePath + elem.image;
                    window.importedData.images[elem.image].thumb = imgThumbRelativePath + elem.image;
                }
            }
        }
    }
    //es wird zu jedem zusammengesetzten Stimulus einer Webgruppe das zugehoerige Bild/der Stimulus geladen
    for (let webGroup in window.importedData.webGroupToImageMapping) {
        let elem = window.importedData.webGroupToImageMapping[webGroup];
        //if Bedingung für Fehlerbehandlung, weil nicht alle Bilder existieren muessen.
        if (elem && elem.image && elem.image !== "NULL") {
            window.importedData.images[elem.image] = {};
            window.importedData.images[elem.image].full = imgRelativePath + elem.image;
            window.importedData.images[elem.image].thumb = imgThumbRelativePath + elem.image;
        }
    }
    loadWebsiteOptions();
    //import Videos
    //finde alle Webseiten
    let websites = [];
    for (let user in window.importedData.userStructure) {
        for (let website in window.importedData.userStructure[user]) {
            if (!websites.includes(website))
                websites.push(website);
        }
    }
    window.importedData.videos = {};
    for (let user of window.importedData.allUsers) {
        window.importedData.videos[user] = {};
        for (let website of websites) {
            window.importedData.videos[user][website] = {};
            window.importedData.videos[user][website]["mp4"]=videoRelativePath + user + "_" + website+".mp4";
            window.importedData.videos[user][website]["webm"]=videoRelativePath + user + "_" + website+".webm";
        }
    }
    console.log("window.importedFiles");
    console.log(window.importedFiles);
    console.log("window.importedData");
    console.log(window.importedData);
}

//Funktion um den CSV Upload vom User auszufuehren
function handleFileSelect(evt) {
    let files = evt.target.files; // FileList object
    // read the file metadata
    let output = '';
    for (let index = 0; index < files.length; index++) {
        let file = files[index];
        //erstelle einen Output der Metadaten des Files, sodass man sieht welche Dateien geladen wurden (Name, FileType, FileSize, Last Modified)
        output += createDataOutput(file);
        //Jeder einzelne File wird in proceedData weiterverarbeitet
        proceedData(file);
    }
    $('#file_list').append(output);
}

//Funktion fuer ImageUpload von User
function handleFileImageSelect(evt) {
    let files = evt.target.files; // FileList object
    // read the file metadata
    let output = '';
    //es wird ueber alle Files iteriert
    for (let index = 0; index < files.length; index++) {
        //aktueller File aus der Liste wird ausgewaehlt
        let file = files[index];
        //wenn das Bild von einem Imagetyp ist,
        let imageType = /image.*/;
        if (file.type.match(imageType)) {
            //wird es in den Output hinzugefuegt, und gelesen
            //erstelle einen Output der Metadaten des Files, sodass man sieht welche Dateien geladen wurden (Name, FileType, FileSize, Last Modified)
            output += createDataOutput(file);
            let reader = new FileReader();
            //Die Funktion, wenn das Bild gelesen wurde wird definiert
            reader.onload = function (event) {
                //wird es in die globale Variable hinzugefuegt
                window.importedData.images[file.name] = event.target.result;
            }
            //Bild(file) wird geladen
            reader.readAsDataURL(file);
        } else {
            //Fehlermeldung falls Bild nicht von einem Imagetyp
            console.log("File not supported!")
        }
    }
    //die Fileliste wird aktualisiert
    $('#file_list').append(output);
}

//Funktion, die die Namen der Spalten nimmt und daraufhin einen Array zurueckgibt mit
//copiedData[Zeilennumer][Spaltenname]=Element in dieser Zeile und Spalte
function parseDataStructure(data) {
    //Speichere Daten in zwischenvariale
    let copiedData = [...data];
    //Gehe die Erste Zeile lang(Namen der Spalten) und teile nach ;
    let header = copiedData.shift()[0].split(";");
    //copiedData=copiedData.slice(1);
    //Gehe ueber alle aufzaehlbaren Zeilen

    // for (let row in copiedData) {
    //     for (let thisRow in copiedData[row]) {
    //         element = thisRow.split(";");
    //         element.forEach(function (value,index){
    //             copiedData[row][header[index]] = value;
    //         });
    //     }
    // }
    Object.keys(copiedData).forEach(function (row) {
        //fuer jede Zeile
        copiedData[row].forEach(function (thisRow) {
            //Teile den String nach nach ;
            thisRow.split(";").map(function (element, index) {
                //speichere jedes Element in Variable[aufzaehlare Zeile][Spaltenname]
                copiedData[row][header[index]] = element;
            })
        })
        //Das Element 0, in der die urspruengliche CSV Zeile steht, wird entfernt(quasi wird thisRow nachtraeglich entfernt)
        copiedData[row].splice(copiedData[row]["0"]);
    });
    //die geparsete Daten werden zurueckgegeben
    return copiedData;
}

//Funktion um vom User hochgeladene CSV Datei zu weiterzuverarbeiten
function proceedData(file) {
    //ein Reader wird initialisiert
    let reader = new FileReader();
    //datei wird als Text(String) gelesen
    reader.readAsText(file);
    reader.onload = function (event) {
        //wenn die Datei geladen ist, in csv gespeichert
        let csv = event.target.result;
        //danach wird die CSV geparsed in einen Array, der in einer globalen Variable(importedFiles) gespeichert wird
        //lese csv mit jquerey.csv als Array von Strings
        let data = $.csv.toArrays(csv);
        //Daten werden geparsed (an ; getrennt und in Array geladen)
        let parsed_data = parseDataStructure(data);
        //geparsete Daten werden in globale Variable geschrieben
        window.importedFiles[file] = parsed_data;
        //mithilfe der globalen Variable werd eine Datenstruktur erstellt
        makeDataStructure();
        loadWebsiteOptions();
    };
    //bei Fehlern kommt eine Fehlermeldung
    reader.onerror = function () {
        alert('Unable to read ' + file.fileName);
    };
}

//Funktion um window.importedData mit Werten zu fuellen, bzw. die Datenstruktur zu erstellen
//gaze.csv, mouse.csv, executed_studies.csv, web_results.csv needed to work properly
function makeDataStructure() {
    //Wenn noch keine User geladen wurden werden die globalen Variablen als leerinitialisiert 
    if (!window.importedData.allUsers) {
        window.importedData.userInformation = {};
        window.importedData.allUsers = [];
        window.importedData.userStructure = {};
        window.importedData.webGroupToImageMapping = {};
        window.importedData.gaze = {};
        window.importedData.mouse = {};
        window.importedData.gazeShots = {};
        window.importedData.mouseShots = {};
    }
    //man iteriert ueber alle Files
    for (let file in window.importedFiles) {
        //man iteriert ueber alle Zeilen der importierten files
        for (let row in window.importedFiles[file]) {
            //elem speichert die aktuelle Zeile als Array. 
            //Die Header aus den CSVs sind die einzelnen Elemente in diesem Array
            let elem = window.importedFiles[file][row];
            //Anfang bearbeiten von user.csv
            if (file.startsWith("user.csv")) {
                //Daten aus executed_studies.csv werden in importedData.userInformation gespeichert
                let temp = window.importedData.userInformation;
                //Die Informationen, die der Nutzer besitzt werden alle weitergegeben. Dabei muss die Spalte "user_id" existieren und darf nicht leer sein.
                let line = {};
                //Jede einzelne Information des Nutzers wird weitergegeben
                for (let value in elem)
                    line[value] = elem[value];
                //Attribute werden in importedData.userInformation["user_id"] gespeichert
                temp[elem["user_id"]] = line;
                //ausserdem wird jede user_id in allUsers gepushed
                window.importedData.allUsers.push(elem["user_id"]);
            }
            //Ende bearbeiten von user.csv

            //Anfang bearbeiten von web_results.csv
            if (file.startsWith("web_results.csv")) {
                //Daten aus web_results.csv werden in importedData.userStructure gespeichert
                let temp = window.importedData.userStructure;
                //zuerst werden die zwingend erforderlichen Werte gesetzt
                let line = {
                    //folgende Attribute hat importedData.userStructure["user_id"]["web_id"]["result_id"]
                    //result_id: elem["id"],
                    user_id: elem["user_id"],
                    web_id: elem["web_id"],
                    web_group_id: elem["web_group_id"],
                    image: elem["image"] || elem["screenshot"],
                    duration: elem["duration"],
                };
                //danach werden optionale Werte ergaenzt
                //URL optional
                if (elem["url"]) {
                    line.url = elem["url"];
                }
                //width und height optional
                if (elem["width"] && elem["height"]) {
                    line.width = elem["width"];
                    line.height = elem["height"];
                    widthAndHeightExists = true;
                }
                //created option1
                if (elem["created"]) {
                    line.created = elem["created"];
                }
                //timestamp option2
                else if (elem["timestamp"])
                    line.timestamp = elem["timestamp"];
                //step optional, falls created oder timestamp nicht eindeutig oder leere Werte aufweist
                if (elem["step"]) {
                    line.step = elem["step"];
                }
                //layer optional
                if (elem["layer"]) {
                    layerExists = true;
                    line.layer = elem["layer"];
                }
                //es wird eine leere Datenstruktur erstellt, falls diese nicht schon vorhanden ist
                createEmptyDataStructure(temp, [elem["user_id"], elem["web_id"]], true);
                //Attribute werden in importedData.userStructure["user_id"]["result_id"] gespeichert
                temp[elem["user_id"]][elem["web_id"]].push(line);

            }
            //Ende bearbeiten von web_results.csv

            //Anfang bearbeiten von gaze.csv
            if (file.startsWith("gaze.csv")) {
                //Daten aus gaze.csv werden in importedData.gaze gespeichert
                let temp = window.importedData.gaze;
                let line = {
                    //folgende Attribute hat importedData.gaze["web_group_id"]["user_id"]
                    web_group_id: elem["web_group_id"],
                    user_id: elem["user_id"],
                    timestamp: elem["timestamp"],
                    x: elem["x"],
                    y: elem["y"],
                    duration: elem["duration"],
                };
                //es wird eine leere Datenstruktur erstellt, falls diese nicht schon vorhanden ist
                createEmptyDataStructure(temp, [elem["web_group_id"], elem["user_id"]], true);
                //Attribute werden in importedData.gaze["web_group_id"]["user_id"] gespeichert
                temp[elem["web_group_id"]][elem["user_id"]].push(line);
            }
            //Ende bearbeiten von gaze.csv

            //Anfang bearbeiten von gaze_shots.csv
            if (file.startsWith("gaze_shots.csv")) {
                //Daten aus gaze_shots.csv werden in importedData.gazeShots gespeichert
                let temp = window.importedData.gazeShots;
                let line = {
                    //folgende Attribute hat importedData.gazeShots["shot"]
                    shot: elem["shot"],
                    user_id: elem["user_id"],
                    timestamp: elem["timestamp"],
                    x: elem["x"],
                    y: elem["y"],
                    duration: elem["duration"],
                };
                //es wird eine leere Datenstruktur erstellt, falls diese nicht schon vorhanden ist
                createEmptyDataStructure(temp, [elem["shot"]], true);
                //Attribute werden in importedData.gazeShots["shot"]gespeichert
                temp[elem["shot"]].push(line);
            }
            //Ende bearbeiten von gaze_shots.csv

            //Anfang bearbeiten von mouse.csv
            if (file.startsWith("mouse.csv")) {
                //Daten aus mouse.csv werden in importedData.mouse gespeichert
                let temp = window.importedData.mouse;
                let line = {
                    //folgende Attribute hat importedData.mouse["web_group_id"]["user_id"]
                    web_group_id: elem["web_group_id"],
                    user_id: elem["user_id"],
                    timestamp: elem["timestamp"],
                    x: elem["x"],
                    y: elem["y"],
                    type: elem["type"],
                };
                //es wird eine leere Datenstruktur erstellt, falls diese nicht schon vorhanden ist
                createEmptyDataStructure(temp, [elem["web_group_id"], elem["user_id"]], true);
                //Attribute werden in importedData.mouse["web_group_id"]["user_id"] gespeichert
                temp[elem["web_group_id"]][elem["user_id"]].push(line);
            }
            //Ende bearbeiten von mouse.csv

            //Anfang bearbeiten von mouse_shots.csv
            if (file.startsWith("mouse_shots.csv")) {
                //Daten aus mouse_shots.csv werden in importedData.mouseShots gespeichert
                let temp = window.importedData.mouseShots;
                let line = {
                    //folgende Attribute hat importedData.mouseShots["shot"]
                    shot: elem["shot"],
                    user_id: elem["user_id"],
                    timestamp: elem["timestamp"],
                    x: elem["x"],
                    y: elem["y"],
                    type: elem["type"],
                };
                //es wird eine leere Datenstruktur erstellt, falls diese nicht schon vorhanden ist
                createEmptyDataStructure(temp, [elem["shot"]], true);
                //Attribute werden in importedData.mouseShots["shot"] gespeichert
                temp[elem["shot"]].push(line);
            }
            //Ende bearbeiten von mouse_shots.csv

            //Anfang bearbeiten von mapping.csv
            if (file.startsWith("mapping.csv")) {
                //Daten aus mapping.csv werden in importedData.webGroupToImageMapping gespeichert
                let temp = window.importedData.webGroupToImageMapping;
                let line = {
                    //folgende Attribute hat importedData.webGroupToImageMapping["web_group_id"]
                    //web_id: elem["web_id"],
                    web_group_id: elem["web_group_id"],
                    image: elem["screenshot"] || elem["image"],
                };
                //layer optional
                if (elem["layer"]) {
                    layerExists = true;
                    line.layer = elem["layer"];
                }
                //Attribute werden in importedData.webGroupToImageMapping["web_group_id"] gespeichert
                temp[elem["web_group_id"]] = line;
            }
            //Ende bearbeiten von mapping.csv
        }
    }
    //TODO// import window.importedData.webStructure
}

function makeWebStructureAndRenameWebIds() {
    if (window.importedFiles && window.importedFiles["web_results.csv"]) {
        let WebIdToWebsite = {};
        //man iteriert ueber alle Zeilen der importierten files
        for (let row in window.importedFiles["web_results.csv"]) {
            //elem speichert die aktuelle Zeile als Array. 
            //Die Header aus den CSVs sind die einzelnen Elemente in diesem Array
            let elem = window.importedFiles["web_results.csv"][row];
            let temp = window.importedData.webStructure;

            //create Line
            let line = {
                web_id: elem["web_id"],
                user: elem["user_id"],
                duration: elem["duration"],
            };
            //created option1
            if (elem["created"]) {
                line.created = elem["created"];
            }
            //timestamp option2
            else if (elem["timestamp"])
                line.timestamp = elem["timestamp"];
            //step optional, falls created oder timestamp nicht eindeutig oder leere Werte aufweist
            if (elem["step"]) {
                line.step = elem["step"];
            }
            //wenn URL in der csv vorhanden wird darueber die Struktur angelegt.
            //andernfalls ueber web_id und web_group_id
            if (elem["url"]) {
                urlExists = true;
                //wenn URL http enthaelt teile die URL so, dass man domain und webseite bekommt
                if (elem["url"].includes("http")) {
                    let webpage = elem["url"].split("//")[1];
                    let website = webpage.split("/")[0];
                    WebIdToWebsite[line.web_id] = website;
                    //es wird eine leere Datenstruktur erstellt, falls diese nicht schon vorhanden ist
                    createEmptyDataStructure(temp, [website, webpage, elem["web_group_id"], elem["user_id"]], true);
                    //Attribute werden in importedData.webStructure[domain][webpage]["web_group_id"] gespeichert
                    temp[website][webpage][elem["web_group_id"]][elem["user_id"]].push(line);
                }
                //wenn url nicht http enthaelt setze web_id als website
                else {
                    //es wird eine leere Datenstruktur erstellt, falls diese nicht schon vorhanden ist
                    createEmptyDataStructure(temp, [elem["web_id"], elem["url"], elem["web_group_id"], elem["user_id"]], true);
                    //Attribute werden in importedData.webStructure[domain][webpage]["web_group_id"] gespeichert
                    temp[elem["web_id"]][elem["url"]][elem["web_group_id"]][elem["user_id"]].push(line);
                }
            }
            //wenn keine URL Feld in web_results vorhanden
            else {
                createEmptyDataStructure(temp, [elem["web_id"], elem["web_group_id"], elem["user_id"]], true);
                temp[elem["web_id"]][elem["web_group_id"]][elem["user_id"]].push(line);
            }
        }
        //fix for dataset1
        //gehe ueber alle Websites, die nur mit web_ids gefuellt wurden und aendere den key des Objekts zum Websitenamen
        window.importedData.webStructure = renameKeys(window.importedData.webStructure, WebIdToWebsite);
        //gehe ueber alle user und ersetze die WebIds durch Domainnamen
        for (let user in window.importedData.userStructure) {
            window.importedData.userStructure[user] = renameKeys(window.importedData.userStructure[user], WebIdToWebsite);
        }
    }
}

//Funktion um CSVs auszulesen, zu parsen und in einer globalen Variable zu speichern
function parseCSVAndSaveInImportedFiles(csv) {
    //read csv mit jquerey.csv als Array of Strings
    let data = $.csv.toArrays(csv);
    //daten werden geparsed (an ; getrennt und in Array geladen)
    let parsed_data = parseDataStructure(data);
    //geparsete Daten werden in globale Variable geschrieben
    window.importedFiles[file.name] = parsed_data;
}

function checkDataStructure() {
    // TODO: implement some checks for data integrity
    return true;
}

// Hilfsfunktion um Fehler beim einfuegen von Elementen zu verhindern.
//Ziel ist es ein Array obj[ks[0]][ks[1]]...[ks[n]] anzulegen.
//obj[ks[0]][ks[1]]...[ks[n]]=[](arr=True) oder obj[ks[0]][ks[1]]...[ks[n]]={}(arr=false)
function createEmptyDataStructure(obj, ks, arr) {
    //Wenn die Groesse ueber 1 ist,
    if (ks.length > 1) {
        //wird falls nicht schon vorhanden obj[erste Elmeent von ks] als leere Menge initialisiert
        if (!obj[ks[0]]) {
            obj[ks[0]] = {};
        }
        //danach wird auf obj[erste Elmeent von ks] die restliche Liste von KS angewandt
        createEmptyDataStructure(obj[ks[0]], ks.slice(1), arr);
    }
    //wenn die Laenge von ks=1 ist
    else if (ks.length = 1) {
        //wird das letzte element in ks entweder
        if (!obj[ks[0]]) {
            if (arr) {
                //leere Liste (arr=true)
                obj[ks[0]] = [];
            }
            //oder als leere Menge initialisiert (arr=false)
            else {
                obj[ks[0]] = {};
            }
        }
    }
}

//Funktion, die die Metadaten eines Files (Name,Typ,Groesse,letze Aenderungen) als Output fuer die Fileliste erstellt
function createDataOutput(file) {
    //+FileName (dick) //Fehlerbehandlung, da bei loadDemoData() kein File.name sondern nur File 
    let output = '<span style="font-weight:bold;">' + (file.name ? escape(file.name) : escape(file)) + '</span><br />\n';
    //+FileTyp
    output += ' - FileType: ' + (file.type || 'n/a') + '<br />\n';
    //+FileSize
    output += ' - FileSize: ' + (file.size || 'n/a') + ' bytes<br />\n';
    //+Last Modified
    output += ' - Last Modified: ' + (file.lastModifiedDate ? file.lastModifiedDate.toLocaleDateString() : 'n/a') + '<br />\n';
    //output wird zurueckgegeben
    return output;
}

//laedt WebsiteOptionen zu
function loadWebsiteOptions() {
    let websites = [];
    for (let user in window.importedData.userStructure) {
        for (let website in window.importedData.userStructure[user]) {
            if (!websites.includes(website))
                websites.push(website);
        }
    }
    let box = $("#selectWebsite");
    box.empty();
    for (let i = 0; i < websites.length; i++) {
        if (i == 0)
            box.append("<option selected='selected' value='" + websites[i] + "'>" + websites[i] + "</option>");
        else
            box.append("<option value='" + websites[i] + "'>" + websites[i] + "</option>");
    }
}

function renameKeys(obj, newKeys) {
    const keyValues = Object.keys(obj).map(key => {
        const newKey = newKeys[key] || key;
        return {[newKey]: obj[key]};
    });
    return deepmerge.all(keyValues);
}  