//In dieser Datei werden die Objekte erstellt, die zu der Szene oder einem Container hinzugefuegt werden koennen.
var defaultAlignment = "left", // left, right, center
    defaultVerticalAlignment = "super", //super, sub, middle
    defaultX = 0,
    defaultY = 0,
    defaultZ = 0,
    defaultPoint = {x: defaultX, y: defaultY}, //default x und y
    defaultWidth = 1,
    defaultHeight = 1,
    defaultColor = "#000000", //Farbe in Hexadezimal
    defaultTextSize = 30,
    defaultTextParameter = {size: defaultTextSize, curveSegments: 12, bevelEnabled: false}, //(verwendet in drawText)StandardSchriftgroesse, AnzahlKurvensegmente und keine Abschraegung wird gesetzt
    defaultClipping = 0, //kein zuschneiden
    defaultMinFilter = THREE.LinearMipmapLinearFilter, //(verwendet in drawPlane) Filter fuer Texturen
    defaultMagFilter = THREE.LinearFilter, //(verwendet in drawPlane) Filter fuer Texturen
    defaultScaleToImageSize = false, //(verwendet in drawPlane) texturenGroesse wird an groesse des Bildes angepasst
    defaultDashedLineScale = 0.1, //(verwendet in drawDashedLine)
    defaultDashSize = 3, //(verwendet in drawDashedLine)
    defaultGapSize = 2, //(verwendet in drawDashedLine)
    defaultText = "You forgot to set a Text", //(verwendet in drawText)
    defaultRadius = 512, //(verwendet in drawCircleWithTexture)
    defaultCircleSegments = 40, //(verwendet in drawCircleWithTexture)
    defaultHandleTransparentBackground = true, //(verwendet in drawCircleWithTexture)
    defaultFullSizeImage = false, //verwendet in getTexture
    defaultUserData = null,
    defaultCurveSegments = 1;

//Funktion um Linien zu Zeichnen
function drawBasicLine(scene, startPoint = defaultPoint, endPoint = defaultPoint, zpos = defaultZ, color = defaultColor, linewidth = 1, linecap = 'round', linejoin = 'round') {
    if (scene == null) {
        console.log("Error on drawBasicLine: Scene does not exist.");
        return;
    }
    //Geometrie wird erstellt
    var geometry = createLineGeometry(startPoint, endPoint, zpos);
    //Material wird erstellt
    var material = createLineBasicMaterial(color, linewidth, linecap, linejoin);
    //Linie wird aus Geometie und Material erstellt
    var line = new THREE.Line(geometry, material);
    //das Objekt wird gezeichnet
    drawObject(scene, line);
}

//Funktion um gestrichelte Linien zu zeichnen
function drawDashedLine(scene, startPoint = defaultPoint, endPoint = defaultPoint, zpos = defaultZ, scale = defaultDashedLineScale, dashSize = defaultDashSize, gapSize = defaultGapSize, color = defaultColor, linewidth = 1) {
    if (scene == null) {
        console.log("Error on drawDashedLine: Scene does not exist.");
        return;
    }
    //Geometrie wird erstellt
    var geometry = createLineGeometry(startPoint, endPoint, zpos);
    //Material wird erstellt
    var material = createLineDashedMaterial(color, linewidth, scale, dashSize, gapSize);
    //Linie wird aus Geometie und Material erstellt
    var line = new THREE.Line(geometry, material);
    //die Luecken zwischen den Linien werden berechnet.
    line.computeLineDistances();
    //das Objekt wird gezeichnet
    drawObject(scene, line);
}

//Funktion um eine Ebene zu zeichnen bzw. ein Plane Objekt einer Scene hinzuzufuegen
function drawPlane(scene, texturename, x = defaultX, y = defaultY, z = defaultZ, args = {
    scaleToImageSize: defaultScaleToImageSize,
    clipXLeft: defaultClipping,
    clipXRight: defaultClipping,
    clipYTop: defaultClipping,
    clipYBottom: defaultClipping,
    width: defaultWidth,
    height: defaultHeight,
    minFilter: defaultMinFilter,
    magFilter: defaultMagFilter,
    fullSizeImage: defaultFullSizeImage,
    handleTransparentBackground: defaultHandleTransparentBackground,
    userData: defaultUserData
}) {
    //wenn keine Argumente erstelle leeres Objekt
    if (!args)
        args = {};
    //setzte Standardwerte, wenn diese fehlen
    let minFilter = args.minFilter != null ? args.minFilter : defaultMinFilter,
        magFilter = args.magFilter != null ? args.magFilter : defaultMagFilter,
        fullSizeImage = args.fullSizeImage != null ? args.fullSizeImage : defaultFullSizeImage;
    //loesche Properties aus args, da nicht mehr benoetigt
    args.minFilter = null;
    args.magFilter = null;
    //Lade Textur und wenn geladen
    return getTexture(texturename, {
        fullSizeImage: fullSizeImage,
        minFilter: minFilter,
        magFilter: magFilter
    }).then(function (texture) {
        //Ausgelagert, da Texturen meist schon vorgeladen werden muessen um die Groesse und Weite dieser zu erhalten
        drawPlaneWithTexture(scene, texture, x, y, z, args);
    });
}

function drawEmptyPlane(scene, color = defaultColor, x = defaultX, y = defaultY, z = defaultZ, width = defaultWidth, height = defaultHeight, userData = null) {
    if (scene == null) {
        console.log("Error on drawEmptyPlane: Scene does not exist.");
        return;
    }
    //Geometrie wird erstellt
    var geometry = createPlaneGeometry(0, 0, 0, 0, width, height);
    //Material wird erstellt
    var material = createOneColoredPlaneMaterial(color);
    //Mesh wird aus Geometie und Material erstellt
    var mesh = new THREE.Mesh(geometry, material);
    //Positionierung
    mesh.position.x = x + width / 2;//wird auf (0/0) hochgerechnet
    mesh.position.y = y + height / 2;//wird auf (0/0) hochgerechnet
    mesh.position.z = z;
    //Userdaten werden uebergeben(fuer hovering)
    mesh.userData = userData;
    //das Objekt wird gezeichnet
    drawObject(scene, mesh);
}

//Funktion um eine Ebene zu zeichnen bzw. ein Plane Objekt einer Scene hinzuzufuegen, wenn Textur schon vorhanden
function drawPlaneWithTexture(scene, texture, x = defaultX, y = defaultY, z = defaultZ, args = {
    scaleToImageSize: defaultScaleToImageSize,
    clipXLeft: defaultClipping,
    clipXRight: defaultClipping,
    clipYTop: defaultClipping,
    clipYBottom: defaultClipping,
    width: defaultWidth,
    height: defaultHeight,
    handleTransparentBackground: defaultHandleTransparentBackground,
    userData: defaultUserData
}) {
    //Fehlermeldung falls falsche Eingaben
    if (scene == null) {
        console.log("Error on drawPlaneWithTexture: Scene does not exist.");
        return;
    }
    if (texture == null) {
        console.log("Error on drawPlaneWithTexture: Texture does not exist.");
        return;
    }
    //wenn keine Argumente erstelle leeres Objekt
    if (!args)
        args = {};
    //setzte Standardwerte, wenn diese fehlen
    let scaleToImageSize = args.scaleToImageSize != null ? args.scaleToImageSize : defaultScaleToImageSize,
        clipXLeft = args.clipXLeft != null ? args.clipXLeft : defaultClipping,
        clipXRight = args.clipXRight != null ? args.clipXRight : defaultClipping,
        clipYBottom = args.clipYBottom != null ? args.clipYBottom : defaultClipping,
        clipYTop = args.clipYTop != null ? args.clipYTop : defaultClipping,
        width = args.width != null ? args.width : defaultWidth,
        height = args.height != null ? args.height : defaultHeight,
        handleTransparentBackground = args.handleTransparentBackground != null ? args.handleTransparentBackground : defaultHandleTransparentBackground,
        userData = args.userData !== undefined ? args.userData : defaultUserData;

    //Wenn auf die Groesse des Ursprungsbildes skaliert werden soll wird diese als Groesse genommen -Clipping.
    if (scaleToImageSize) {
        width = texture.image.naturalWidth * (1 - clipXLeft - clipXRight);
        height = texture.image.naturalHeight * (1 - clipYTop - clipYBottom);
    }
    //Erstelle Promise mit Geometrie und Material geladen
    let promises = [
        createPlaneGeometry(clipXLeft, clipXRight, clipYTop, clipYBottom, width, height),
        createPlaneMaterial(texture),
    ];
    //wenn transparenter Hintergrund betrachtet werden soll
    if (handleTransparentBackground) {
        promises.push(getTexture("checkerboard.png").then(
            function (texture2) {//das checkerboardbild ist 8x8 Pixel gross
                texture2.wrapS = texture2.wrapT = THREE.RepeatWrapping;
                let sWrapScale = width / 8;
                let tWrapScale = height / 8;
                texture2.offset.set(0, 0);
                texture2.repeat.set(sWrapScale, tWrapScale);
                return createPlaneMaterial(texture2, false);
            }));
    }
    //Wenn Geometrie und Material geladen
    let plane = Promise.all(promises).then(result => {
        let geometry = result[0];
        let material = result[1];
        if (result.length > 2 && result[2] != null) {
            let material2 = result[2];
            let group = new THREE.Group();
            let backgroundMesh = new THREE.Mesh(geometry, material2);
            group.add(new THREE.Mesh(geometry, material));
            group.add(backgroundMesh);
            return group;
        } else
            //Erstelle Mesh aus Geometrie und Material
            return new THREE.Mesh(geometry, material);
    });
    //Wenn Mesh/plane geladen
    return plane.then(function (mesh) {
        //Positionierung
        mesh.position.x = x + width / 2;//wird auf (0/0) hochgerechnet
        mesh.position.y = y + height / 2;//wird auf (0/0) hochgerechnet
        mesh.position.z = z;
        //Userdaten werden uebergeben(fuer hovering)
        mesh.userData = userData;
        //das Objekt wird gezeichnet
        drawObject(scene, mesh);
    });
}

//Funktion um eine Ebene zu zeichnen bzw. ein Plane Objekt einer Scene hinzuzufuegen, wenn Textur schon vorhanden
function drawCircleWithTexture(scene, texture, x = defaultX, y = defaultY, z = defaultZ, radius = defaultRadius, segments = defaultCircleSegments, scale = true, transparent = window.transparent) {
    //Fehlermeldung falls falsche Eingaben
    if (scene == null) {
        console.log("Error on drawCircleWithTexture: Scene does not exist.");
        return;
    }
    if (texture == null) {
        console.log("Error on drawCircleWithTexture: Texture does not exist.");
        return;
    }
    //scale
    let scalex = 1;
    let scaley = 1;
    if (scale) {
        if (texture.image != null && texture.image.width != null && texture.image.height != null) {
            let width = texture.image.width;
            let height = texture.image.height;
            if (width < height) {
                scaley = width / height;
            } else
                scalex = height / width;
        }
    }
    //Erstelle Promise mit Geometrie und Material geladen
    let promises = [
        createCircleGeometry(radius, segments, scalex, scaley),
        createPlaneMaterial(texture, transparent),
    ];
    //Wenn Geometrie und Material geladen
    let circle = Promise.all(promises).then(result => {
        //Erstelle Mesh aus Geometrie und Material
        return new THREE.Mesh(result[0], result[1]);
    });
    //Wenn Mesh/plane geladen
    return circle.then(function (mesh) {
        //Positionierung
        mesh.position.x = x + radius;//wird auf (0/0) hochgerechnet
        mesh.position.y = y + radius;//wird auf (0/0) hochgerechnet
        mesh.position.z = z;
        //das Objekt wird gezeichnet
        drawObject(scene, mesh);
    });
}

//Funktion um einen einfarbigen Kreis zu erstellen
function drawEmptyCircle(scene, color = defaultColor, x = defaultX, y = defaultY, z = defaultZ, radius = defaultRadius, segments = defaultCircleSegments) {
    if (scene == null) {
        console.log("Error on drawEmptyPlane: Scene does not exist.");
        return;
    }
    //Geometrie wird erstellt
    var geometry = createCircleGeometry(radius, segments);
    //Material wird erstellt
    var material = createOneColoredPlaneMaterial(color);
    //Mesh wird aus Geometie und Material erstellt
    var mesh = new THREE.Mesh(geometry, material);
    //Positionierung
    mesh.position.x = x + radius;//wird auf (0/0) hochgerechnet
    mesh.position.y = y + radius;//wird auf (0/0) hochgerechnet
    mesh.position.z = z;
    //das Objekt wird gezeichnet
    drawObject(scene, mesh);
}

//Funktion um einen Text zu Zeichnen
function drawText(scene, text = defaultText, args = {
    x: defaultX,
    y: defaultY,
    z: defaultZ,
    alignment: defaultAlignment,
    verticalAlignment: defaultVerticalAlignment,
    frontColor: defaultColor,
    sideColor: this.frontColor,
    bold: false
}, parameters = defaultTextParameter, userData = null) {
    //Fehlermeldung falls falsche Eingaben
    if (scene == null) {
        console.log("Error on drawText: Scene does not exist.");
        return;
    }
    //fehlende Werte werden durch Standardwerte ersetzt
    let x = args.x != null ? args.x : defaultX;
    let y = args.y != null ? args.y : defaultY;
    let z = args.z != null ? args.z : defaultZ;
    let alignment = args.alignment != null ? args.alignment : defaultAlignment;
    let verticalAlignment = args.verticalAlignment != null ? args.verticalAlignment : defaultVerticalAlignment;
    let frontColor = args.frontColor != null ? args.frontColor : defaultColor;
    let sideColor = args.sideColor != null ? args.sideColor : frontColor;
    let bold = args.bold != null ? args.bold : false;
    //Erstelle Promise mit Geometrie und Material geladen
    let promises = [
        createTextGeometry(text, parameters, bold),
        createTextMaterial(frontColor, sideColor)
    ];
    //Wenn Geometrie und Material geladen
    return Promise.all(promises).then(function (result) {
        var geometry = result[0];
        var material = result[1];
        //Erstelle Mesh mit Geometrie und Material
        var mesh = new THREE.Mesh(geometry, material);
        //Berechne die Bounding Box, die Textgeometrie haette
        geometry.computeBoundingBox();
        //Berechne den Offset von Links und rechts
        var max = geometry.boundingBox.max,
            min = geometry.boundingBox.min;
        //x-Position wird je nach alignment gesetzt
        switch (alignment) {
            case "left":
                mesh.position.x = x - min.x; //offset von "links" wird von x abgezogen
                break;
            case "right":
                mesh.position.x = x - max.x; //offset von "rechts" wird von x abgezogen
                break;
            case "center":
                mesh.position.x = x - (max.x - min.x) / 2; //center ist default
                break;
            default:
                console.log("Wrong alignment: " + alignment + ", allowed are left, right, center. It was changed to left.");
                mesh.position.x = x - min.x;
                break;
        }
        //y-Position wird je nach verticalAlignment gesetzt
        switch (verticalAlignment) {
            case "super":
                mesh.position.y = y - min.y; //offset von "unten" wird von y abgezogen
                break;
            case "sub":
                mesh.position.y = y - max.y; //offset von "oben" wird von y abgezogen
                break;
            case "middle":
                mesh.position.y = y; //middle ist default
                break;
            default:
                console.log("Wrong verticalAlignment: " + verticalAlignment + ", allowed are super, sub, middle. It was changed to middle.");
                mesh.position.y = y;
                break;
        }
        //z-Position wird gesetzt
        mesh.position.z = z;
        mesh.userData = userData;
        //das Objekt wird gezeichnet
        drawObject(scene, mesh);
    });
}

function drawDetailview(scene, imageName, textTexture, x = defaultX, y = defaultY, z = defaultZ, argsImage = {
    scaleToImageSize: false,
    clipXLeft: defaultClipping,
    clipXRight: defaultClipping,
    clipYTop: defaultClipping,
    clipYBottom: defaultClipping,
    width: defaultWidth,
    height: defaultHeight,
    gazeArray: [],
    mouseArray: [],
    userData: defaultUserData
}, argsText = {
    scaleToImageSize: false,
    clipXLeft: defaultClipping,
    clipXRight: defaultClipping,
    clipYTop: defaultClipping,
    clipYBottom: defaultClipping,
    width: defaultWidth,
    height: defaultHeight
}, handleTransparentBackground = defaultHandleTransparentBackground, updateWithHighQuality = true) {
    if (scene == null) {
        console.log("Error on drawPlaneWith2Textures: Scene does not exist.");
        return;
    }
    //get Texture
    let textureLowQuality = getTexture(imageName, {fullSizeImage: false});
    let textureHighQuality = undefined;
    if (updateWithHighQuality)
        textureHighQuality = getTexture(imageName, {fullSizeImage: true});

    let clipXLeft1 = argsImage.clipXLeft != null ? argsImage.clipXLeft : defaultClipping,
        clipXRight1 = argsImage.clipXRight != null ? argsImage.clipXRight : defaultClipping,
        clipYTop1 = argsImage.clipYTop != null ? argsImage.clipYTop : defaultClipping,
        clipYBottom1 = argsImage.clipYBottom != null ? argsImage.clipYBottom : defaultClipping,
        //scaleToImageSize1 = args1.scaleToImageSize != null ? args1.scaleToImageSize : defaultScaleToImageSize,
        width1 = argsImage.width != null ? argsImage.width : defaultWidth,
        height1 = argsImage.height != null ? argsImage.height : defaultHeight;
    //
    let userData = argsImage.userData != null ? argsImage.userData : "Hoverevent";
    let gazeArray = argsImage.gazeArray != null ? argsImage.gazeArray : [],
        mouseArray = argsImage.mouseArray != null ? argsImage.mouseArray : [];

    let clipXLeft2 = argsText.clipXLeft != null ? argsText.clipXLeft : defaultClipping,
        clipXRight2 = argsText.clipXRight != null ? argsText.clipXRight : defaultClipping,
        clipYTop2 = argsText.clipYTop != null ? argsText.clipYTop : defaultClipping,
        clipYBottom2 = argsText.clipYBottom != null ? argsText.clipYBottom : defaultClipping,
        //scaleToImageSize2 = args2.scaleToImageSize != null ? args2.scaleToImageSize : defaultScaleToImageSize,
        width2 = argsText.width != null ? argsText.width : defaultWidth,
        height2 = argsText.height != null ? argsText.height : defaultHeight;
    let width = width1 + width2,
        height = Math.max(height1, height2);
    textureLowQuality.then((textureLowQuality) => {
        const promises = [
            createPlaneGeometry(clipXLeft1, clipXRight1, clipYTop1, clipYBottom1, width1, height1),
            createPlaneGeometry(clipXLeft2, clipXRight2, clipYTop2, clipYBottom2, width2, height2),
            createPlaneMaterial(textureLowQuality),
            createPlaneMaterial(textTexture)];

        if (handleTransparentBackground) {
            promises.push(getTexture("checkerboard.png").then(
                function (textureBackground) {//das checkerboardbild ist 8x8 Pixel gross
                    textureBackground.wrapS = textureBackground.wrapT = THREE.RepeatWrapping;
                    let sWrapScale = width1 / 8;
                    let tWrapScale = height1 / 8;
                    textureBackground.offset.set(0, 0);
                    textureBackground.repeat.set(sWrapScale, tWrapScale);
                    return createPlaneMaterial(textureBackground, false);
                }));
        }
        let meshImage = undefined;
        let plane = Promise.all(promises).then(result => {
            let geometry1 = result[0],
                geometry2 = result[1],
                material1 = result[2],
                material2 = result[3];
            let group = new THREE.Group();
            meshImage = new THREE.Mesh(geometry1, material1);
            let meshText = new THREE.Mesh(geometry2, material2);
            meshText.position.x = width / 2;
            group.add(meshImage);
            group.add(meshText);
            if (result.length > 4 && result[4] != null) {
                let backgroundMaterial = result[4];
                let backgroundMesh = new THREE.Mesh(geometry1, backgroundMaterial);
                group.add(backgroundMesh);
            }
            return group;
            //Erstelle Mesh aus Geometrie und Material
        });
        return plane.then(function (meshGroup) {
            //Positionierung
            meshGroup.position.x = x; //+ width / 2;//wird auf (0/0) hochgerechnet
            meshGroup.position.y = y + height / 2;//wird auf (0/0) hochgerechnet
            meshGroup.position.z = z;
            //Userdaten werden uebergeben(fuer hovering)
            meshGroup.userData = userData;
            //das Objekt wird gezeichnet
            drawObject(scene, meshGroup);
            if (updateWithHighQuality) {
                createDetailView(imageName, gazeArray, mouseArray).then((textureHighQuality) => {
                    let highQualityMaterial = createPlaneMaterial(textureHighQuality);
                    if (meshImage && meshImage.material) {
                        meshImage.material = highQualityMaterial;
                        if (window.actionDrivenRender)
                            vis.render();
                    }
                });
            }
        });
    });
}

function drawArrow(scene, start_point = defaultPoint, end_point = defaultPoint, zpos = defaultZ, color = defaultColor, headLength = null, headWidth = null, userData = null, lineIntersectable = false) {
    //Startposition wird zu einem Vektor from uebersetzt
    //parsePointToVector in GeometryFactory
    let from = parsePointToVector(start_point, zpos);
    //Endposition wird zu einem Vektor to uebersetzt
    let to = parsePointToVector(end_point, zpos);
    //Richtungsvektor wird berechnet
    let direction = to.clone().sub(from);
    //Laenge des Richtungsvektors wird berechnet
    let length = direction.length();
    //ArrowHelper(dir : Vector3, origin : Vector3, length : Number, hex : Number, headLength : Number, headWidth : Number )
    let arrowHelper = null;
    let color2 = new THREE.Color(color);
    if (headLength != null && headWidth != null)
        arrowHelper = new THREE.ArrowHelper(direction.normalize(), from, length, color2, headLength, headWidth);
    else
        arrowHelper = new THREE.ArrowHelper(direction.normalize(), from, length, color2); //pfeil initialisiert
    arrowHelper.userData = userData;
    arrowHelper.cone.userData = userData;
    arrowHelper.line.userData = userData;

    if (lineIntersectable) {
        let endPoint = new THREE.Vector3();
        endPoint.addVectors(from, direction.normalize().multiplyScalar(length - (headLength != null ? headLength : 0)));
        let geometry = new THREE.Geometry();
        geometry.vertices.push(from);
        geometry.vertices.push(endPoint);
        let material = arrowHelper.line.material;
        var line = new THREE.Line(geometry, material);
        //Userdaten werden uebergeben(fuer hovering)
        line.userData = userData;
        let object = new THREE.Object3D();
        object.add(line);
        object.add(arrowHelper);
        drawObject(scene, object);
    } else
        //arrowHelper.line.material.linewidth = 3; //pfeildicke wird zugewiesen
        drawObject(scene, arrowHelper);//pfeil wird zu szene hinzugefuegt
}

//Zeichne mehrere Zeilen in einen Canvas und zeichne damit einen Plane
function drawMultiLineTextCanvas(scene, texts = [defaultText], args = {
    x: defaultX,
    y: defaultY,
    z: defaultZ,
    textSize: defaultTextSize,
    fontColor: defaultColor,
    padding: padding,
    backgroundColor: null,
    adjustSizeToText: false,
    height: 1,
    width: 1,
    font: "Arial",
    userData: defaultUserData
}) {
    //Canvas wird als Textur fuer ein Plane der Groesse des Canvases benutzt
    let textCanvas = createMultiLineTextCanvas(texts, args);
    var texture = new THREE.CanvasTexture(textCanvas);
    //deaktiviert Mipmaps und setzt defaultFilter
    //texture = defaultTextureOperation(texture);
    //wenn Werte in args fehlen, werden diese mit defaultWerten ersetzt
    if (args == null)
        args = {};
    let x = args.x != null ? args.x : defaultX,
        y = args.y != null ? args.y : defaultY,
        z = args.z != null ? args.z : defaultZ,
        height = args.height != null ? args.height : defaultHeight,
        width = args.width != null ? args.width : defaultWidth,
        userData = args.userData !== null ? args.userData : defaultUserData;
    drawPlaneWithTexture(scene, texture, x, y, z, {
        scaleToImageSize: false,
        width: width,
        height: height,
        userData: userData
    });
}

function drawBezierEdge(edge, container = vis.scene, z = 10, color = userflowEdgeColor, userData = null) {
    //edge muss startTop,startBottom,endTop und endBottom beinhalten
    let bezierShape = new THREE.Shape();
    bezierShape.moveTo(edge.startTop.x, edge.startTop.y);
    bezierShape.bezierCurveTo(edge.endTop.x - userflowWidth / 2, edge.startTop.y, edge.startTop.x + userflowWidth / 2, edge.endTop.y, edge.endTop.x, edge.endTop.y);
    bezierShape.lineTo(edge.endBottom.x, edge.endBottom.y);
    bezierShape.bezierCurveTo(edge.startBottom.x + userflowWidth / 2, edge.endBottom.y, edge.endBottom.x - userflowWidth / 2, edge.startBottom.y, edge.startBottom.x, edge.startBottom.y);
    bezierShape.lineTo(edge.startTop.x, edge.startTop.y);
    let geometry = new THREE.ShapeBufferGeometry(bezierShape);
    let material = createOneColoredPlaneMaterial(color);
    let mesh = new THREE.Mesh(geometry, material);
    mesh.position.z = z;
    mesh.userData = userData;
    drawObject(container, mesh);
}

function drawDropout(dropout, container = vis.scene, z = 10, color = userflowDropoutColor, userData = null, padding = userflowVerticalPadding / 4) {
    let bottom = dropout.bottom;
    let top = dropout.top;
    let xEnd = bottom.x + (top.y - bottom.y);
    let yEnd = bottom.y - padding;
    let dropoutShape = new THREE.Shape();
    dropoutShape.moveTo(top.x, top.y);
    dropoutShape.bezierCurveTo(xEnd, top.y, xEnd, yEnd, xEnd, yEnd);
    dropoutShape.lineTo(bottom.x, yEnd);
    dropoutShape.lineTo(top.x, top.y);
    let geometry = new THREE.ShapeBufferGeometry(dropoutShape);
    let material = createOneColoredPlaneMaterial(color);
    let mesh = new THREE.Mesh(geometry, material);
    mesh.position.z = z;
    mesh.userData = userData;
    drawObject(container, mesh);
}


//Funktion um ein Objekt zu zeichnen bzw. der Szene hinzuzufuegen(Scene kann dabei auch ein Container sein)
function drawObject(scene, object) {
    scene.add(object);
    //rendert das Bild neu, wenn vis und Renderfunktion vorhanden sind.
    if (window.actionDrivenRender && vis && typeof vis.render === 'function')
        vis.render();
}