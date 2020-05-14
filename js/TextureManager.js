//Datei, in der die Texturen verwaltet werden und darauf geachtet wird, dass diese nur einmal geladen wird.
//in textures werden die Texturen des TextureManagers gespeichert

var texturesThumb = {};
var texturesFullSize = {};
var FullSizeImagesHelper = {max: 50, count: 0, array: []};

//Funktion laedt alle Texturen aller Nutzer und ueberspringt schon geladene Texturen.
//Funktion gibt Promise zurueck.
function getAllTexturesOfAllUser() {
    //Rueckgabeparameter wird als leeres Objekt initialisiert.
    let texturesOfAllUsers = {};
    //iteriere ueber alle Nutzer und lade alle Texturen fuer diesen Nutzer
    const promises = Object.keys(window.importedData.allUsers).map(key => {
        let user = window.importedData.allUsers[key];
        //getAllTexturesOfOneUser wird ausgefuert.
        return getAllTexturesOfOneUser(user).then(function (texturesOfOneUser) {
            //nach dem laden von texturesOfOneUser werden alle Nullwerte in diesen gefiltert.
            //texturesOfOneUser = texturesOfOneUser.filter(value => value != null);//funktioniert nicht weil Object und nicht Array
            //falls texturesOfOneUser null ist wird dies nicht gespeichert.
            if (texturesOfOneUser != null)
                //falls ungleich null wird texturesOfOneUser in texturesOfAllUsers[user] gespeichert.
                texturesOfAllUsers[user] = texturesOfOneUser;
        });
    });
    //Wenn ueber alle Nutzer iteriert wurde und alles fertig geladen ist, gebe die Texturen aller Nutzer zurueck
    return Promise.all(promises).then(() => {
        return texturesOfAllUsers;
    });
}


//Funktion, um alle Texturen eines Nutzers zu bekommen (schon geladene Texturen werden nicht erneut geladen). Bspw. fuer Zeitstrahl.
//Funktion gibt Promise zurueck.
function getAllTexturesOfOneUser(user, args=null) {
    //Rueckgabeparameter wird als leeres Objekt initialisiert.
    let texturesOfUser = {};
    //Alle Namen von Bildern werden in imageNames gespeichert
    let imageNames = {};
    //iteriere ueber alle Webseiten bzw. Webseitenzustaende von diesem Nutzer
    for (let website in window.importedData.userStructure[user]) {
        for (let webpage in window.importedData.userStructure[user][website]) {
            //Finde den Namen des Bildes von dieser Webseite (bzw. Webseitenzustandes)
            let imageName = window.importedData.userStructure[user][website][webpage].image;
            if (imageName != null && imageName != "NULL")
                imageNames[imageName] = imageName;
        }
    }
    //iteriere ueber alle Elemente in imageNames
    const promises = Object.keys(imageNames).map(imageName => {
        //Lade die Textur, die zu diesem Bildnamen gehört
        return getTexture(imageNames[imageName], args).then(texture => {
            //Falls zugehoeriges Bild nicht existiert wird null zurueckgegeben
            if (texture != null)
                //Alle existierenden Texturen werden in texturesOfUser gespeichert
                texturesOfUser[imageName] = texture;
        });
    });
    return Promise.all(promises).then(() => {
        //Falls zugehoeriges Bild nicht existiert wird null zurueckgegeben und keine Textur geladen
        return texturesOfUser;
    });
}

//Funktion, um alle Texturen eines Nutzers auf einer Website/Domain zu bekommen (schon geladene Texturen werden nicht erneut geladen). Bspw. fuer Zeitstrahl.
//Funktion gibt Promise zurueck.
function getAllTexturesOfOneWebsiteForOneUser(user, website, args = null) {
    //Rueckgabeparameter wird als leeres Objekt initialisiert.
    let texturesOfOneWebsiteForOneUser = {};
    //Alle Namen von Bildern werden in imageNames gespeichert
    let imageNames = {};
    //iteriere ueber alle Webseiten bzw. Webseitenzustaende von diesem Nutzer
    for (let webpage in window.importedData.userStructure[user][website]) {
        //Finde den Namen des Bildes von dieser Webseite (bzw. Webseitenzustandes)
        let imageName = window.importedData.userStructure[user][website][webpage].image;
        if (imageName != null && imageName != "NULL")
            imageNames[imageName] = imageName;
    }
    //iteriere ueber alle Elemente in imageNames
    const promises = Object.keys(imageNames).map(imageName => {
        //Lade die Textur, die zu diesem Bildnamen gehört
        //cancel falls Visualisierung gewechselt wurde und noch Bilder geladen werden
        if (website == getSelectedWebsite()) {
            return getTexture(imageNames[imageName], args).then(texture => {
                //Falls zugehoeriges Bild nicht existiert wird null zurueckgegeben und keine Textur geladen
                if (texture != null)
                    //Alle existierenden Texturen werden in texturesOfUser gespeichert
                    texturesOfOneWebsiteForOneUser[imageName] = texture;
            });
        } else return;
    });
    //cancel falls Visualisierung gewechselt wurde und noch Bilder geladen werden
    if (website == getSelectedWebsite()) {
        return Promise.all(promises).then(() => {
            //Wenn alle Texturen dieser Webseite von diesem Nutzer geladen wurden gebe sie zurueck
            return texturesOfOneWebsiteForOneUser;
        });
    } else return;
}

//Funktion um alle Texturen aus einem Arary zu laden. und gibt ein Objekt zurueck mit der Textur an der stelle array[imageName]
function getAllTexturesOfArray(array, args = null) {//array=[imageName1,imageName2] oder auch {a:imageName1,b:imageName2}
    let texturesOfArray = {};
    //iteriere ueber alle Elemente in imageNames
    const promises = Object.keys(array).map(key => {
        //Lade die Textur, die zu diesem Bildnamen gehört
        //cancel falls Visualisierung gewechselt wurde und noch Bilder geladen werden
        return getTexture(array[key], args).then(texture => {
            //Falls zugehoeriges Bild nicht existiert wird null zurueckgegeben und keine Textur geladen
            if (texture != null)
                //Alle existierenden Texturen werden in texturesOfUser gespeichert
                texturesOfArray[array[key]] = texture;
        });
    });
    return Promise.all(promises).then(() => {
        //Wenn alle Texturen dieser Webseite von diesem Nutzer geladen wurden gebe sie zurueck
        return texturesOfArray;
    });
}


//Funktion, um eine Textur zurueckzugeben. Falls die Textur noch nicht geladen wurde wird diese geladen, in textures[imageName] gespeichert und zurueckgegeben.
//sollte das Laden des Bildes fuer die Textur nicht moeglich sein, wird null zurueckgegeben.
function getTexture(imageName, args = {
    fullSizeImage: defaultFullSizeImage,
    minFilter: defaultMinFilter,
    magFilter: defaultMagFilter
}) {
    //wenn keine Argumente erstelle leeres Objekt
    if (args == null)
        args = {};
    //fehlende Werte werden durch Standardwerte ersetzt
    let minFilter = args.minFilter != null ? args.minFilter : defaultMinFilter,
        magFilter = args.magFilter != null ? args.magFilter : defaultMagFilter,
        fullSizeImage = args.fullSizeImage != null ? args.fullSizeImage : defaultFullSizeImage;
    //benutze entweder Thumbs oder FullSizeImages
    let textures;
    if (fullSizeImage) {
        textures = texturesFullSize;
    } else
        textures = texturesThumb;
    //Pruefe ob dieses Textur schon einmal geladen wurde
    if (textures[imageName])
        //wenn sie geladen wurde gebe sie zurueck
        return textures[imageName];
    else {
        //Pruefe ob es ein Bild mit dem Bildnamen gibt
        if (window.importedData.images[imageName]) {
            //Setze das Bild aus den importierten Bildern als Source/Quelle fuer die Textur.
            let src;
            if (fullSizeImage) {
                src = window.importedData.images[imageName].full;
                handleFullSizeImage(imageName);
            } else src = window.importedData.images[imageName].thumb;
            //Die Textur wird geladen, in textures gespeichert und zurueckgegeben
            textures[imageName] = loadTexture(src, minFilter, magFilter).catch(() => {
                console.log("Fail in getTexture while loading: " + imageName + ". Maybe the image does not exist.");
                return null;
            }).then(texture => {
                texture.minFilter = minFilter;
                texture.magFilter = magFilter;
                return texture;
            });
            return textures[imageName];
        } else {//wenn das Bild nicht schon geladen war und nicht geladen werden konnte, wird eine Fehlermeldung in die Konsole geschrieben
            console.log("Fail in getTexture: " + imageName + " can't be loaded. Maybe the image does not exist.");
            //wenn das Bild nicht geladen werden konnte wird null zurueckgegeben.
            return null;
        }
    }
}

//Funktion um eine Textur zu laden. Die Funktion benutzt dafuer Promise
function loadTexture(src, minFilter, magFilter) {
    return new Promise(function (resolve, reject) {
        //Es wird eine Variable als TexturLader deklariert.
        let textureLoader = new THREE.TextureLoader()
        //crossOrigin = Anonymous ermoeglicht auch Bilder vom eigenen System als Quelle zu benutzen
        textureLoader.crossOrigin = "Anonymous";
        //Die Filter des TexturLaders werden gesetzt.
        textureLoader.minFilter = minFilter;
        textureLoader.magFilter = magFilter;
        //onLoadFunktion ruft resolve auf. //on Progress nichts //onError ruft reject(null) auf
        return textureLoader.load(src, resolve, {}, reject);
    });
}

//Leere das Textureobject um Referenzierungen zu loeschen und fue GarbageCollector frei zu machen
function clearTextures() {
    texturesThumb = {};
    texturesFullSize = {};
}

function handleFullSizeImage(imageName) {
    if (!FullSizeImagesHelper.array.includes(imageName)) {
        //loesche bild, dass nichtmehr im cache sein soll
        let toDelete = FullSizeImagesHelper.array[FullSizeImagesHelper.count];
        delete texturesFullSize[toDelete];
        FullSizeImagesHelper.array[FullSizeImagesHelper.count] = imageName;
        //Erhoehe Zaehler um 1 und rechne Modulo falls ueber max
        FullSizeImagesHelper.count = (++FullSizeImagesHelper.count) % FullSizeImagesHelper.max;
    }
    // wenn Bild im Cache 
    // else {
    // }
}

//deaktiviert Mipmapps und setzt defaultFilter
function defaultTextureOperation(texture) {
    if (texture != null) {
        texture.minFilter = defaultMinFilter;
        texture.magFilter = defaultMagFilter;
        texture.generateMipmaps = false;
    }
    return texture;
}

//https://stackoverflow.com/questions/21485545/is-there-a-way-to-tell-if-an-es6-promise-is-fulfilled-rejected-resolved
//Funktion um isResolved,isRejected und isFulfilled in Promises abfragen zu koennen
function MakeQuerablePromise(promise) {
    // Don't create a wrapper for promises that can already be queried.
    if (promise.isResolved) return promise;

    var isResolved = false;
    var isRejected = false;

    // Observe the promise, saving the fulfillment in a closure scope.
    var result = promise.then(
        function (v) {
            isResolved = true;
            return v;
        },
        function (e) {
            isRejected = true;
            throw e;
        });
    result.isFulfilled = function () {
        return isResolved || isRejected;
    };
    result.isResolved = function () {
        return isResolved;
    }
    result.isRejected = function () {
        return isRejected;
    }
    return result;
}