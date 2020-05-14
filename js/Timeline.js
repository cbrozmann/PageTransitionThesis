//Diese Datei enthaelt die Visualisierung der Zeitleiste. Sie erbt von Visualization.js.

var pixelPerSecond = 50; //soll ein Textfeld im HTML werden. 
//let defaultTimeTimeline = 10000; //10s
let timelineScale = pixelPerSecond / 1000; //50 pixel/s
let timelineHeight = 512; //Hoehe der TimelineBilder
let padding = 50; //Padding zwischen Bildern, Text vor den Bildern und zwischen Texten
let timelineColor = "#6c7173"; //Farbe der Timelinelinien 
let timelineTextBackgroundColor = "#b7e5db";
let timelineTextSize = 60;//Groesse aller Schrift der Timeline und auch fuer die Informationen
let timelineSteps = 5000;//5 Sekunden
let emptyPlanePadding = padding / 4;//padding ueber den Bildern, unter den Bildern, vor der Timeline und hinter maxTime
let emptyPlaneColor = "#62baac";//Farbe fuer die EmptyPlane, die sich hinter jeder Zeile der Timeline befindet.
let dashedLineColor = "#ff0000";//Wenn ein Element in der Zeitleiste gezeichnet wird gibt es eine gestichelte Linie in dieser Farbe
let dashedLineScale = 0.5; //Scale fuer gestrichelte Linien
let dashedLineDashSize = 3; //DashSize fuer gestrichelte Linien
let dashedLineGapSize = 2; //GapSize fuer gestrichelte Linien Bsp:(GapSize=2/DashSize=3)=>2/3 der Linie sind Luecken
let deleteHoverPlaneOnMouseLeave = false;//wenn ein Bild gepickt wurde und man das danach verlaesst soll das hoverElemen geloescht werden oder erstmal bleiben
let timelineVideoPositionColor="#ff0000";
//"\u00D8" = durchschnitt Symbol	

//loadTimeline wird von VisualizationManager aufgerufen, wenn diese Visualisierung ausgewaehlt wurde.
class Timeline extends Visualization {
    constructor(selectedWebsite = "amazon", frustumSize = 1000, camera_startPosition = {
        x: 0,
        y: 0,
        z: 1000
    }, near = 1, far = 10000, backgroundColor = "#ffffff") {
        //initialisiere Visualization
        super(frustumSize, camera_startPosition, false, near, far, backgroundColor);
        //Methoden von der Timelineklasse sollen auf Variablen der Klasse und Superklasse zugreifen koennen
        this.selectedWebsite = selectedWebsite;
        this.drawOneLayerofOneWebsite = this.drawOneLayerofOneWebsite.bind(this);
        this.drawUserInformation = this.drawUserInformation.bind(this);
        this.drawStatistic = this.drawStatistic.bind(this);
        this.clearHoverContainer = this.clearHoverContainer.bind(this);
        this.drawUserData = this.drawUserData.bind(this);
        this.drawIntersectedImage = this.drawIntersectedImage.bind(this);
        //die Visualisierung wir initialisiert
        this.initialisation();
    }

    initialisation() {
        super.initialisation();
        changeHoverEvents();
        timelineScale = pixelPerSecond / 1000;
        getTexture("checkerboard.png");
        //lade Videooptionen
        this.loadUserVideoOptions();
        //Ende lade Videooptionen
        this.intersected = {};
        //die MaximalZeit fuer die aktuelle Webseite wird bestimmt und als Attribut der Visualisierung gespeichert
        this.maxTime = this.getMaxTime(this.selectedWebsite);
        //setze oberen und rechten Rand
        //this.visualizationBox.max.x = timelineWidth + padding + 1000;
        this.visualizationBox.max.y = Math.max(2 * timelineHeight + 2* padding, 3 * padding + timelineTextSize);
        //Position des Zeitstrahls fuer die Timeline wird gesetzt
        let timelineY = padding;
        let x = 0;
        //Timeline/Zeitstrahl wird gezeichnet
        //drawArrow(this.scene, { x: 0, y: timelineY }, { x: timelineWidth, y: timelineY }, 0, timelineColor, 50, 30);
        //alle 5 cm wird ein Strich gezeichnet bis zur max. Zeit und einer darueber hinaus und die Zeit daruebergeschrieben
        for (let i = 0; i - timelineSteps < this.maxTime; i += timelineSteps) {
            //Bestimme die x Koordinaten, an dem die Zeitmarke sein soll
            let xpos = i * timelineScale;
            //Zeichne einen 5 Pixel großen Strich ueber und unter timelineY
            drawBasicLine(this.scene, {x: x + xpos, y: timelineY - 5}, {
                x: x + xpos,
                y: timelineY + 5
            }, 0, timelineColor);
            //Schreibe mittig ueber den Strich die aktuelle Zeit.(Bsp: 5s)
            drawText(this.scene, String(i / 1000) + " s", {
                x: x + xpos,
                y: timelineY + padding,
                z: 0,
                alignment: "center",
                verticalAlignment: "super",
                frontColor: timelineColor
            }, {size: timelineTextSize});
        }
        this.maxY = timelineY + 5;
        //Zeichnet Layer und gibt Userstatistiken zurueck
        this.drawUserData({withLayer: getWithLayer()});
    }

    drawUserData(args = {x: 0, timelineY: padding, z: 1, withLayer: getWithLayer()}) {
        //wenn der Container schon existiert wird er geleert.
        if (this.userDataContainer != null) {
            this.clearContainer(this.userDataContainer);
        }
        let x = args.x != null ? args.x : 0,
            z = args.z != null ? args.z : 1,
            timelineY = args.timelineY != null ? args.timelineY : padding,
            withLayer = args.withLayer != null ? args.withLayer : getWithLayer();

        //Es werden alle Userlayer fuer die aktuelle Webseite bestimmt userLayers[user]=layerName
        let userLayers = this.getUserLayers(this.selectedWebsite);
        let timelineWidth = this.maxTime * timelineScale;//Bild wird skaliert
        //Es wird ein Conatiner erstellt, in den alle Bilder geladen werden, fuer spaeteres Picking
        this.container = new THREE.Object3D();
        //HoverContainer fuer Picking
        this.hoverContainer = new THREE.Object3D();
        //in userDataContainer werden alle Visuellen Userinformationen geladen
        this.userDataContainer = new THREE.Object3D();
        this.lineContainer=new THREE.Object3D();
        this.userDataContainer.add(this.lineContainer);
        //der Container wird zu der Scene hinzugefuegt
        this.scene.add(this.userDataContainer);
        this.userDataContainer.add(this.container);
        this.userDataContainer.add(this.hoverContainer);
        //Counter fuer alle Layer
        let layerCount = 0;
        //eine Z-Koordinate wird gesetzt
        let statistics = {};
        //iteriere ueber alle Nutzer
        for (let user in window.importedData.allUsers) {
            //in current user wird der aktuell betrachtete Nutzer gespeichert
            const currentUser = window.importedData.allUsers[user];
            statistics[currentUser] = {};
            //in currentWebsite werden die Webseitenaufrufe fuer den aktuellen Nutzer und die ausgewaehlte Website/Domain als Objekt gespeichert
            if (window.filteredData.userStructure[currentUser] && window.filteredData.userStructure[currentUser][this.selectedWebsite] != null) {
                const currentWebsite = window.filteredData.userStructure[currentUser][this.selectedWebsite];
                statistics[currentUser][this.selectedWebsite] = {};
                //Lade alle Texturen fuer den Nutzer und die Webseite
                const userTextures = getAllTexturesOfOneWebsiteForOneUser(currentUser, this.selectedWebsite);
                //iteriere ueber alle Layer des Nutzers
                // if (withLayer) {
                for (let layerNumber in userLayers[currentUser]) {
                    //der in dem Schleifendurchlauf betrachtete Layer
                    let layer = userLayers[currentUser][layerNumber];
                    //berechne die y-Koordinate
                    const y = -(timelineHeight + padding) * ++layerCount;
                    //Text vor der Zeile des Zeitstahls einmal User einmal Layer
                    statistics[currentUser][this.selectedWebsite][layer] = this.drawUserInformation(this.userDataContainer, currentUser, currentWebsite, x - padding, y, z, true, layer);
                    //Zeichne empty Plane als Hintergrund hinter die Zeile des Zeitstrahls
                    drawEmptyPlane(this.userDataContainer, emptyPlaneColor, x - emptyPlanePadding, y - emptyPlanePadding, -1, timelineWidth + 2 * emptyPlanePadding, timelineHeight + 2 * emptyPlanePadding);
                    //die Funktion kann auch auf Attribute der Klasse zugreifen bspw. this.scene
                    this.drawOneLayerofOneWebsite = this.drawOneLayerofOneWebsite.bind(this);
                    //Zeichne einen Layer der Webseite einen Layer in currentWebseite in den container
                    userTextures.then(textures =>
                        this.drawOneLayerofOneWebsite(this.userDataContainer, textures, this.container, currentWebsite, layer, x, y, z));
                }
                // } else {
                //     //finde den besten Layer (z.B. mit den meisten Eyetracking- und Mausdaten)
                //     let bestLayer = getBestLayer(userLayers[currentUser]);
                //     if (bestLayer != null) {
                //         //berechne die y-Koordinate
                //         const y = -(timelineHeight + padding) * ++layerCount;
                //         //Text vor der Zeile des Zeitstahls einmal User einmal Layer
                //         statistics[currentUser][this.selectedWebsite][bestLayer] = this.drawUserInformation(this.userDataContainer, currentUser, currentWebsite, x - padding, y, z, true, bestLayer);
                //         //Zeichne empty Plane als Hintergrund hinter die Zeile des Zeitstrahls
                //         drawEmptyPlane(this.userDataContainer, emptyPlaneColor, x - emptyPlanePadding, y - emptyPlanePadding, -1, timelineWidth + 2 * emptyPlanePadding, timelineHeight + 2 * emptyPlanePadding);
                //         //die Funktion kann auch auf Attribute der Klasse zugreifen bspw. this.scene
                //         this.drawOneLayerofOneWebsite = this.drawOneLayerofOneWebsite.bind(this);
                //         //Zeichne einen Layer der Webseite einen Layer in currentWebseite in den container
                //         userTextures.then(textures =>
                //             this.drawOneLayerofOneWebsite(this.userDataContainer, textures, this.container, currentWebsite, bestLayer, x, y, z));
                //     }
                // }
            }
        }
        //layerCount steht jetzt fest jetzt koennen Linien durchgezogen werden
        const y = -(timelineHeight + padding) * layerCount;
        this.minY = y;
        //alle 5 cm wird ein Strich gezeichnet
        for (let i = 0; i - timelineSteps < this.maxTime; i += timelineSteps) {
            let xpos = i * timelineScale;
            drawBasicLine(this.userDataContainer, {x: xpos, y: timelineY - 5}, {x: xpos, y: y}, 0, timelineColor);
        }
        this.drawStatistic(this.userDataContainer, statistics, x, y, z, true);
    }

    //Methode um die Userinformationen zu drucken
    drawUserInformation(scene, currentUser, currentWebsite = null, x = defaultX - padding, y = defaultY, z = defaultZ, withLayer = true, layer = null) {
        //leerer Array in den alle Texte gepushed werden muessen
        let returnParameter = {};
        let texts = [];
        //user ist das erste Element in texts und muss als einziges dicke gedruckt werden
        let userText = "Nutzer: " + currentUser;
        texts.push(userText);
        //wenn es layer gibt werden diese zum texts Array hinzugefuegt
        if (withLayer) {
            let layerText = "Layer: " + layer;
            texts.push(layerText);
        }
        //Verweildauer wird berechnet und geschrieben
        //Verweildauer ist die Summe aller Dauern (alternativ haette hoechste max. Zeit geklappt)
        let sumOfDuration = 0;
        for (let webGroup in currentWebsite) {
            if (currentWebsite[webGroup].layer === layer)
                sumOfDuration += currentWebsite[webGroup].duration != null ? parseInt(currentWebsite[webGroup].duration) : 0;
        }
        returnParameter.sumOfDuration = sumOfDuration;
        let durationText = "Verweildauer: " + (sumOfDuration > 0 ? this.getDurationText(sumOfDuration) : "-");
        texts.push(durationText);
        //Anzahl Klicks wird berechnet und geschrieben
        let sumOfClicks = 0;
        let mouse = window.importedData.mouse;
        for (let webGroup in currentWebsite) {
            if (currentWebsite[webGroup].layer === layer) {
                let webGroupId = currentWebsite[webGroup].web_group_id;
                if (mouse[webGroupId]) {
                    for (let elem in mouse[webGroupId][currentUser]) {
                        let mouseAction = mouse[webGroupId][currentUser][elem];
                        if (mouseAction.type === "click")
                            sumOfClicks++;
                    }
                }
            }
        }
        returnParameter.sumOfClicks = sumOfClicks;
        let clickText = String(sumOfClicks) + " Klicks";
        texts.push(clickText);
        //die Texte werden neben
        if (texts.length % 2 === 1) {
            let ypos;
            let verticalAlignment;
            for (let i = 0; i < texts.length; i++) {
                //die erste Haelfte (ohne mittleres Element) wird ueber der Mitte gezeichnet
                if (i < texts.length / 2) {
                    //Bsp: 5 Elemente. Element 0 soll 2 mal padding +1,5mal Textsize darueber nach unten hin ueber der Mitte der Element enden
                    ypos = (texts.length / 2 - i) * (padding + timelineTextSize) - timelineTextSize / 2 + y + timelineHeight / 2;
                    verticalAlignment = "super";
                }
                    //die zweite Haelfte darunter(ohne mittleres Element)
                //Bsp: 5 Elemente. Element 3(Mitte ist 2) soll 0.5 Textsize + 1mal padding nach oben hin Enden ausgehend von der Mitte des Objektes.
                else if (i > texts.length - texts.length / 2) {
                    ypos = -(i - texts.length / 2) * (padding + timelineTextSize) + timelineTextSize / 2 + y + timelineHeight / 2;
                    verticalAlignment = "sub";
                } else {
                    //das mittlere Element wird mittig mit der Mitte der Zeile plaziert.
                    ypos = y + timelineHeight / 2;
                    verticalAlignment = "middle";
                }
                drawText(scene, texts[i], {
                    x: x,
                    y: ypos,
                    z: z,
                    alignment: "right",
                    verticalAlignment: verticalAlignment,
                    frontColor: timelineColor,
                    bold: (i === 0)
                }, {size: timelineTextSize});
            }
        } else {
            let ypos;
            let verticalAlignment;
            for (let i = 0; i < texts.length; i++) {
                //die erst Haelfte wird ueber der Mitte gezeichnet
                if (i < texts.length / 2) {
                    //Bsp: 4 Elemente. Element 0 soll 1.5 mal padding + 1mal Textsize darueber nach unten hin ueber der Mitte der Timelinezeile enden
                    ypos = (texts.length / 2 - i - 1) * (padding + timelineTextSize) + y + (timelineHeight + padding) / 2;
                    verticalAlignment = "super";
                }
                    //die zweite Haelfte unter der Mitte
                //Bsp: 4 Elemente. Element 3(Mitte ist 2) soll 1 Textsize + 1.5mal padding nach oben hin Enden ausgehend von der Mitte des Objektes.
                else {
                    ypos = -(i - texts.length / 2) * (padding + timelineTextSize) + y + (timelineHeight - padding) / 2;
                    verticalAlignment = "sub";
                }
                drawText(scene, texts[i], {
                    x: x,
                    y: ypos,
                    z: z,
                    alignment: "right",
                    verticalAlignment: verticalAlignment,
                    frontColor: timelineColor,
                    bold: (i === 0)
                }, {size: timelineTextSize});
            }
            return returnParameter;
        }

        //der untere Rand der Schrift ist 0.5 padding ueber der Bildmitte("super") fuer diesen Layer((timelinHeight+padding)/2). Die Schrift Endet padding vor der Zeitleiste(right)

        //if (withLayer)
        //der obere Rand der Schrift ist 0.5 padding unter der Bildmitte("sb") fuer diesen Layer ((timelinHeight-padding)/2). Die Schrift Endet padding vor der Zeitleiste(right)
        //drawText(this.scene, texts[1], { x: x, y: y + (timelineHeight - padding) / 2, z: z, alignment: "right", verticalAlignment: "sub", frontColor: timelineColor, bold: false }, { size: timelineTextSize });
    }

    //Methode um einen Layer einer Webseite fuer einen Nutzer zu zeichnen
    drawOneLayerofOneWebsite(scene, textures, container, currentWebsite, layer, x = 0, y = 0, z = 0) {
        //die Groesse der TimeLine wird mithilfe der maximalZeit aller Nutzer und einer globalen Scalevariable berechnet
        let timelineWidth = this.maxTime * timelineScale;//Bild wird skaliert
        //es wird ueber alle WebGruppen der aktuellenWebseite iteriert
        for (let webGroup in currentWebsite) {
            //nur die mit dem gleichen Layer werden benutzt
            if (currentWebsite[webGroup].layer === layer) {
                //die Textur wird aus dem Array in texture gespeichert
                let texture = textures[currentWebsite[webGroup].image];
                //Das Seitenverhaeltnis wird bestimmt (Breite/Hoehe)
                let aspect = texture.image.naturalWidth / texture.image.naturalHeight;
                //Die Texturbreite ist das Seitenverhaeltnis *TimelineHöhe(Konstant)
                let textureWidth = aspect * timelineHeight;
                //Platz den der Textur aufgrund ihrer Duration zugeteilt wird
                let spaceForTexture = currentWebsite[webGroup].duration != null ? timelineWidth * (parseInt(currentWebsite[webGroup].duration) / this.maxTime) : 0;
                //Verhaeltnis Platz, den dem Bild zugeteilt wurde zu Texturweite
                let percentualSpace = spaceForTexture / textureWidth;
                //Clipping in X Richtung wird als 0 initialisiert
                let clipX = 0;
                //x wird wenn vorhanden als timelineWidth*timestamp/maxTime berechnet sonst als 0
                let xpos = currentWebsite[webGroup].timestamp != null ? timelineWidth * (parseInt(currentWebsite[webGroup].timestamp) / this.maxTime) : 0;
                //Wenn der Textur weniger Platz zusteht, als sie gross ist
                if (percentualSpace <= 1) {
                    //bestimme Clipping
                    clipX = 1 - percentualSpace;
                    //Bestimme die neue Texturweite
                    textureWidth *= (1 - clipX);
                    //Zeichne einen Plane, in dem von rechts der auszuschneidende Teil ausgeschnitten wird in den Container
                    drawPlaneWithTexture(container, texture, x + xpos, y, z, {
                        scaleToImageSize: false,
                        clipXLeft: 0,
                        clipXRight: clipX,
                        width: textureWidth,
                        height: timelineHeight,
                        handleTransparentBackground: defaultHandleTransparentBackground
                    });
                    //Zeichne eine gestrichelte Linie in die Szene
                    drawDashedLine(scene, {x: x + xpos + textureWidth, y: y}, {
                        x: x + xpos + textureWidth,
                        y: y + timelineHeight
                    }, z + 1, dashedLineScale, dashedLineDashSize, dashedLineGapSize, dashedLineColor);
                }
                //Wenn der Textur mehr Platz zusteht, als es gross ist
                else {
                    //Zeichne die Textur ohne Clipping in den Container
                    drawPlaneWithTexture(container, texture, x + xpos, y, z, {
                        scaleToImageSize: false,
                        width: textureWidth,
                        height: timelineHeight,
                        handleTransparentBackground: defaultHandleTransparentBackground
                    });
                    //Der x Wert wird nach die Textur gezogen
                    xpos = xpos + textureWidth;
                    //der noch zur Verfuegung stehende Platz wird berechnet
                    let width = spaceForTexture - textureWidth;
                    //Die Texte fuer duration, url und web_group_id werden gesetzt
                    let texts = this.getTextsFromWebGroup(currentWebsite[webGroup]);
                    //let webGroupText = "Web Group: " + (currentWebsite[webGroup].web_group_id != null ? currentWebsite[webGroup].web_group_id : "-");
                    //texts.push(webGroupText);
                    //der Text wird mehrzeilig in einen Canvas geschrieben und dann als Plane in die Szene gelade
                    drawMultiLineTextCanvas(scene, texts, {
                        x: x + xpos,
                        y: y,
                        z: z,
                        textSize: timelineTextSize,
                        padding: padding,
                        backgroundColor: timelineTextBackgroundColor,
                        adjustSizeToText: false,
                        height: timelineHeight,
                        width: width,
                        font: "Arial",
                        fontColor: timelineColor
                    });
                    //Zeichne eine gestrichelte Linie in die Szene
                    drawDashedLine(scene, {x: x + xpos + width, y: y}, {
                        x: x + xpos + width,
                        y: y + timelineHeight
                    }, z + 1, dashedLineScale, dashedLineDashSize, dashedLineGapSize, dashedLineColor);
                }
            }
        }
    }

    drawStatistic(scene, statistics, x, y, z, withLayer = true) {
        let sumOfClicks = 0;
        let sumOfDuration = 0;
        let countLayer = 0;
        let countUser = this.getUserCountInProperties(window.filteredData.userStructure);
        let minClickLayer = Infinity;
        let minClickUser = Infinity;
        let maxClickLayer = 0;
        let maxClickUser = 0;
        let minDurationLayer = Infinity;
        let durationUser = this.getDurationUser(this.selectedWebsite);
        let maxDurationLayer = 0;
        for (let user in statistics) {
            let clicksUser = 0;
            // countUser++;
            for (let website in statistics[user]) {
                if (statistics[user][website].sumOfClicks) {
                    sumOfClicks += statistics[user][website].sumOfClicks;
                    clicksUser += statistics[user][website].sumOfClicks;
                    sumOfDuration += statistics[user][website].sumOfDuration;
                    countLayer++;
                } else {
                    for (let layer in statistics[user][website]) {
                        let durationOfLayer = 0;
                        let clicksOfLayer = 0;
                        if (statistics[user][website][layer].sumOfClicks) {
                            clicksOfLayer += statistics[user][website][layer].sumOfClicks;
                            durationOfLayer += statistics[user][website][layer].sumOfDuration;
                            countLayer++;
                            if (clicksOfLayer < minClickLayer)
                                minClickLayer = clicksOfLayer;
                            if (clicksOfLayer > maxClickLayer)
                                maxClickLayer = clicksOfLayer;
                            if (durationOfLayer < minDurationLayer)
                                minDurationLayer = durationOfLayer;
                            if (durationOfLayer > maxDurationLayer)
                                maxDurationLayer = durationOfLayer;
                            sumOfClicks += clicksOfLayer;
                            clicksUser += clicksOfLayer;
                            sumOfDuration += durationOfLayer;
                        }
                    }
                }
                if (minClickUser > clicksUser)
                    minClickUser = clicksUser;
                if (maxClickUser < clicksUser)
                    maxClickUser = clicksUser;
            }
        }
        let statisticText = [];
        let durationPerLayer = {
            header: "Verweildauer pro Layer: ",
            mean: this.getDurationText(sumOfDuration / countLayer),
            min: this.getDurationText(minDurationLayer),
            max: this.getDurationText(maxDurationLayer)
        };
        statisticText.push(durationPerLayer);
        let clickPerLayer = {
            header: "Anzahl Klicks pro Layer: ",
            mean: (sumOfClicks / countLayer).toFixed(1),
            min: minClickLayer,
            max: maxClickLayer
        };
        statisticText.push(clickPerLayer);
        let durationPerUser = {
            header: "Verweildauer pro User: ",
            mean: this.getDurationText(durationUser.meanDurationUser),
            min: this.getDurationText(durationUser.minDurationUser),
            max: this.getDurationText(durationUser.maxDurationUser)
        };
        statisticText.push(durationPerUser);
        let clickPerUser = {
            header: "Anzahl Klicks pro User: ",
            mean: (sumOfClicks / countUser).toFixed(1),
            min: minClickUser,
            max: maxClickUser
        };
        statisticText.push(clickPerUser);
        for (let i = 0; i < statisticText.length; i++) {
            drawText(scene, statisticText[i].header, {
                x: x - padding,
                y: y - (i * timelineTextSize) - ((i + 1) * padding),
                z: z,
                alignment: "right",
                verticalAlignment: "sub",
                blod: false,
                frontColor: timelineColor
            }, {size: timelineTextSize});
            drawText(scene, "\u00D8: " + statisticText[i].mean, {
                x: x + padding,
                y: y - (i * timelineTextSize) - ((i + 1) * padding),
                z: z,
                alignment: "left",
                verticalAlignment: "sub",
                blod: false,
                frontColor: timelineColor
            }, {size: timelineTextSize});
            drawText(scene, "Min: " + statisticText[i].min, {
                x: x + 2 * padding + 10 * timelineTextSize,
                y: y - (i * timelineTextSize) - ((i + 1) * padding),
                z: z,
                alignment: "left",
                verticalAlignment: "sub",
                blod: false,
                frontColor: timelineColor
            }, {size: timelineTextSize});
            drawText(scene, "Max: " + statisticText[i].max, {
                x: x + 3 * padding + 20 * timelineTextSize,
                y: y - (i * timelineTextSize) - ((i + 1) * padding),
                z: z,
                alignment: "left",
                verticalAlignment: "sub",
                blod: false,
                frontColor: timelineColor
            }, {size: timelineTextSize});
        }
        //setze untere Bounding Box fuer die Visualisierung
        // this.visualizationBox.min.y = y - (statisticText.length * timelineTextSize) - ((statisticText.length + 1) * padding);
        this.doLimitPan = true;
    }

    render() {
        //update Funktion von Visualization.js
        super.render();
        //erstelle Raycaster
        this.raycastForIntersection(this.container, this.intersected, this.drawIntersectedImage, {
            deleteOnMouseLeave: deleteHoverPlaneOnMouseLeave,
            getImageName: true,
            clearHoverContainerOnNewIntersection: true,
            useIntersectionArray: false,
            recursive: true
        });
    }

    drawIntersectedImage(imageName, z = 10) {
        //berechne die Position in der Welt, an der die Maus ist
        const vector = this.getMouseKoordinates();
        //die ersteTexture ist das Bild auf der die Maus steht
        let texture1 = getTexture(imageName, {fullSizeImage: false});
        //finde die WebGroupId zu der das Bild gehoert.
        let webGroupId;
        for (let user in window.importedData.userStructure)
            for (let website in window.importedData.userStructure[user])
                for (let webGroup in window.importedData.userStructure[user][website])
                    if (window.importedData.userStructure[user][website][webGroup].image === imageName)
                        webGroupId = window.importedData.userStructure[user][website][webGroup];
        //bekomme die Texte fuer den Canvas aus der WebGroup
        // noinspection EqualityComparisonWithCoercionJS
        if (webGroupId != undefined) {
            let texts = this.getTextsFromWebGroup(webGroupId);
            //erstelle mit den Texten einen Textcanvas der Groesse 2*TimlineHeight und auch doppelter Textgroesse
            //Breite des Textcanvas ist abhaenig von der Textgroesse
            let textCanvas = createMultiLineTextCanvas(texts, {
                textSize: timelineTextSize * 2,
                fontColor: timelineColor,
                padding: padding,
                adjustWidthToText: true,
                height: 2 * timelineHeight,
                backgroundColor: timelineTextBackgroundColor
            });
            //aus canvas wird Textur erstellt.
            let textTexture = new THREE.CanvasTexture(textCanvas);
            //getDataArrayTimeline
            let shotName = getShotNameFromImageName(imageName);
            let gazeArray = getDataArrayTimeline(shotName);
            let mouseArray = getDataArrayTimeline(shotName, "mouse");
            //deaktiviert Mipmaps und setzt defaultFilter
            //texture2 = defaultTextureOperation(texture2);
            texture1.then((imageTexture) => {
                if (imageTexture && imageTexture.image) {
                    this.clearHoverContainer();
                    let height = 2 * timelineHeight;
                    let width1 = height * imageTexture.image.naturalWidth / imageTexture.image.naturalHeight;
                    drawDetailview(this.hoverContainer, imageName, textTexture, vector.x, vector.y, z, {
                        height: height,
                        width: width1,
                        gazeArray: gazeArray,
                        mouseArray: mouseArray
                    }, {height: height, width: textTexture.image.width}, defaultHandleTransparentBackground);
                }
            });
        }
        //drawPlane(this.hoverContainer, imageName, x, y, z, true);
    }

    //Methode um alle Layer aller Nutzer fuer eine bestimmte Webseite zu erhalten
    getUserLayers(website) {
        //layers wird als leeres Objekt instantiiert
        let layers = {};
        //iteriere uber alle Nutzer
        for (let user in window.importedData.allUsers) {
            //currentUser ist der User aus dem aktuellen Schleifendurchlauf
            let currentUser = window.importedData.allUsers[user];
            //currentWebsite sind die Daten fuer currentUser und die ausgewaehlte Webseite
            if (window.filteredData.userStructure[currentUser] && window.filteredData.userStructure[currentUser][website]) {
                let currentWebsite = window.filteredData.userStructure[currentUser][website];
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
        }
        //Gebe die Layer aller Nutzer zurueck
        return layers;
    }

    clearHoverContainer() {
        this.clearContainer(this.hoverContainer);
    }

    //Bestimme die Maximalzeit fuer die Webseite
    getMaxTime(website) {
        //HelperVariable um alle Endzeiten von Webaufrufen zu erhalten.
        let helperMaxTimestamp = [];
        //iteriere uber alle Nutzer
        for (let user in window.importedData.allUsers) {
            //currentUser ist der User aus dem aktuellen Schleifendurchlauf
            let currentUser = window.importedData.allUsers[user];
            //currentWebsite sind die Daten fuer currentUser und die ausgewaehlte Webseite
            if (window.filteredData.userStructure[currentUser] && window.filteredData.userStructure[currentUser][website]) {
                let currentWebsite = window.filteredData.userStructure[currentUser][website];
                //iteriere ueber alle Web_Gruppen bzw. Web_group_ids fuer die ausgewaehlt Webseite
                for (let webGroup in currentWebsite) {
                    //Bestimme Timpstamps und Durations jedes Aufrufs
                    let timestamp = currentWebsite[webGroup].timestamp;
                    let duration = currentWebsite[webGroup].duration;
                    //wenn beide ungleich null fuege die Endzeit zum Array hinzu.
                    if (timestamp != null && duration != null)
                        helperMaxTimestamp.push(parseInt(timestamp) + parseInt(duration));
                }
            }
        }
        //bestimme die Maximalzeit aller Endzeiten im Array und gebe sie zurueck
        return Math.max(...helperMaxTimestamp);
    }

    getDurationUser(website) {
        let helperDurations = [];
        //iteriere uber alle Nutzer
        for (let user in window.importedData.allUsers) {
            //HelperVariable um alle Endzeiten von Webaufrufen zu erhalten.
            let helperMaxTimestamp = [];
            //currentUser ist der User aus dem aktuellen Schleifendurchlauf
            let currentUser = window.importedData.allUsers[user];
            //currentWebsite sind die Daten fuer currentUser und die ausgewaehlte Webseite
            if (window.filteredData.userStructure[currentUser] && window.filteredData.userStructure[currentUser][website] != null) {
                let currentWebsite = window.filteredData.userStructure[currentUser][website];
                //iteriere ueber alle Web_Gruppen bzw. Web_group_ids fuer die ausgewaehlt Webseite
                for (let webGroup in currentWebsite) {
                    //Bestimme Timpstamps und Durations jedes Aufrufs
                    let timestamp = currentWebsite[webGroup].timestamp;
                    let duration = currentWebsite[webGroup].duration;
                    //wenn beide ungleich null fuege die Endzeit zum Array hinzu.
                    if (timestamp != null && duration != null)
                        helperMaxTimestamp.push(parseInt(timestamp) + parseInt(duration));
                }
                //bestimme die Maximalzeit aller Endzeiten im Array
                let maxTimeUser = Math.max(...helperMaxTimestamp);
                helperDurations.push(maxTimeUser);
            }
        }
        let minDurationUser = Math.min(...helperDurations);
        let maxDurationUser = Math.max(...helperDurations);
        let i = 0;
        let sum = 0;
        for (; i < helperDurations.length; i++) {
            sum += helperDurations[i];
        }
        let meanDurationUser = sum / i;
        //gebe die Maximalzeiten zurueck
        return {minDurationUser: minDurationUser, maxDurationUser: maxDurationUser, meanDurationUser: meanDurationUser};
    }

    getTextsFromWebGroup(webGroup) {
        let texts = [];
        let durationText = "Dauer: " + (webGroup.duration != null ? this.getDurationText(parseInt(webGroup.duration)) : "-");
        texts.push(durationText);
        let urlText = "URL: " + (webGroup.url != null ? webGroup.url : "-");
        texts.push(urlText);
        return texts;
    }

    //Zeichne eine Linie, die einen Zeitpunk anzeigt in die Zeit Leiste
    drawTimelineTimestep(time, z = 1, color = timelineVideoPositionColor) {//Zeit in Sekunden
        this.clearContainer(this.lineContainer);
        let x = time * 1000 * timelineScale;
        let yTop = this.maxY;
        let yBottom = this.minY;
        drawBasicLine(this.lineContainer, {x: x, y: yTop}, {x: x, y: yBottom}, z, color);
    }

    loadUserVideoOptions() {
        //lade Videooptionen
        let shownUser = [];
        let userLayers = getSelectedUserAndLayer();
        for (let user in userLayers) {
            if (userLayers[user].length > 0) {
                shownUser.push(user);
            }
        }
        let box = $("#selectUserVideo");
        box.empty();
        for (let i = 0; i < shownUser.length + 1; i++) {
            if (i == 0)
                box.append("<option selected='selected' value='noUser'>Kein Nutzer</option>");
            else
                box.append("<option value='" + shownUser[i - 1] + "'>" + shownUser[i - 1] + "</option>");
        }
        //Ende lade Videooptionen
    }
}

function getShotNameFromImageName(imageName = "") {
    let nameParts = imageName.split(".");
    if (nameParts.length > 0) {
        let result = nameParts[0];
        for (let i = 1; i < nameParts.length - 1; i++) {
            result += "." + nameParts[i];
        }
        return result;
    }
    return null;
}