//In dieser Datei werden die Geometrien hergestellt, die für die erzeugung von Objekten noetig sind.
//font speichert den Font für die TextGeometry
var regularFont = null;
var boldFont = null;

//Funktion um eine PlaneGeometry zu erstellen.//alle clip... Variablen sollen im Intervall [0,1] liegen. 
//Die clip... Variablen geben an, wieviel von dieser Richtung kommend abgeschnitten wird.
function createPlaneGeometry(clipXLeft = 0, clipXRight = 0, clipYTop = 0, clipYBottom = 0, width = 1, height = 1, widthSegments = 1, heightSegments = 1) {
    var geometry = new THREE.PlaneGeometry(width, height, widthSegments, heightSegments);
    //Wenn kein Clipping stattfindet, sind wir fertig
    if (clipXLeft == 0 && clipXRight == 0 && clipYTop == 0 && clipYBottom == 0)
        return geometry;
    else {
        //das Koordinatensystem von einer Plane der Groeße w,h geht von (-w/2,-h/2) bis (w/2,h/2)
        //UV Koordinaten gehen von (0,0), bis (1,1), deshalb muss ein der Offset addiert werden und durch die Range geteilt werden.
        var offset = new THREE.Vector2(width / 2, height / 2);
        var range = new THREE.Vector2(width, height);
        //Die PlaneGeometry besteht aus 2 Dreiecken, das "Zuschneiden" erfolgt durch umrechnen der UV Koordinaten.
        let faces = geometry.faces;
        //geometry.faceVertexUvs[0] enthaelt die UV Koordinaten beider Dreicke, die die Plane ausmachen
        //Es wird zu beginn als leere Liste instatiiert, da wir die UV Koordinaten neu berechnen wollen
        geometry.faceVertexUvs[0] = [];
        //Scale in x und y Richtung ist 100% minus alles, was auf der jeweiligen Achse von beiden Seiten abgeschnitten wird.
        let xScaleClipping = 1 - clipXLeft - clipXRight,
            yScaleClipping = 1 - clipYBottom - clipYTop;

        for (let i = 0; i < faces.length; i++) {//Die Koordinaten beider Dreiecke werden in UV Koordinaten umgerechnet.//Bsp fuer width=1,height=1

            let v1 = geometry.vertices[faces[i].a],//v1 fuer i=0 {x:-0.5,y:0.5,z:0}//v1 fuer i=1 {x:-0.5,y:-0.5,z:0}
                v2 = geometry.vertices[faces[i].b],//v2 fuer i=0 {x:-0.5,y:-0.5,z:0}//v2 fuer i=1 {x:0.5,y:-0.5,z:0}
                v3 = geometry.vertices[faces[i].c];//v3 fuer i=0 {x:0.5,y:0.5,z:0}//v3 fuer i=1 {x:0.5,y:0.5,z:0}

            //in diesem Teil werden die UV Koordinaten des jeweiligen Dreiecks berechnet und hochgeladen
            geometry.faceVertexUvs[0].push([
                //Zuerst wird offset addiert, damit die Koordinaten bei 0 anfangen.
                //Danach wird das Bild durch die Division durch die Range auf das Interval [0,1] runtergerechnet. 
                //Danach wird mit dem Scale multipliziert(1-was auf der Achse weggeschnitten werden soll), da wir etwas wegschneiden und z.B. nur 90% anzeigen wollen.
                //Zum Schluss wird das Bild verschoben um das was links und unten (0,0) abgeschnitten werden soll.
                //Bsp. wir wollen links 5% und rechts 10% abschneiden, dann ist der Scale 85% und wir beginnen ab 5%.
                new THREE.Vector2(((v1.x + offset.x) / range.x) * xScaleClipping + clipXLeft, ((v1.y + offset.y) / range.y) * yScaleClipping + clipYBottom),
                new THREE.Vector2(((v2.x + offset.x) / range.x) * xScaleClipping + clipXLeft, ((v2.y + offset.y) / range.y) * yScaleClipping + clipYBottom),
                new THREE.Vector2(((v3.x + offset.x) / range.x) * xScaleClipping + clipXLeft, ((v3.y + offset.y) / range.y) * yScaleClipping + clipYBottom)
            ]);
        }
        //Wir geben an, dass wir die UV Koordinaten veraendert haben und diese aktualisiert werden muessen.
        geometry.uvsNeedUpdate = true;
        //die Geometry wird zu einer BufferGeometry konvertiert (aus Effizienzgruenden)
        return new THREE.BufferGeometry().fromGeometry(geometry);
    }
}

//Funktion um eine LineGeometry zu erstellen.
//Nachdem die Linie erstellt wurde(als var line) muss line.computeLineDistances(); ausgefuert werden.
function createLineGeometry(startPoint, endPoint, zpos = 0) {
    //Startposition wird zu einem Vector geparst //zpos wird ignoriert, wenn z in startPoint deklariert ist
    var from = parsePointToVector(startPoint, zpos);
    //Endposition wird zu einem Vector geparst //zpos wird ignoriert, wenn z in endPoint deklariert ist
    var to = parsePointToVector(endPoint, zpos);
    //LineGeometry wird als Geometry erstellt
    var lineGeometry = new THREE.Geometry();
    //Start- und Endpunkt werden als Kannten in die Geometrie geladen.
    lineGeometry.vertices.push(from);
    lineGeometry.vertices.push(to);
    //die Geometrie wird zurueck gegeben
    return lineGeometry;
}

//Funktion um eine TextGeometry zu erstellen.
function createTextGeometry(text, parameters = null, bold = false) {
    //Zuert werden Standardwerte gesetzt, falls diese in attributes fehlen.
    //wenn attributes leer, dann wird es als leere Menge initialisiert
    if (parameters == null) parameters = {};
    //wenn Wert fuer Schriftgroesse fehlt, wird er hier gesetzt
    if (!parameters.size) parameters.size = 40;
    //wenn Wert fuer die Dicke des extrudierten Textes(Tiefe der Buchstaben) fehlt, wird er hier gesetzt
    if (!parameters.height) parameters.height = 0;
    //wenn Wert fuer die Anzahl der Punkte auf Kurven fehlt, wird er hier gesetzt
    if (!parameters.curveSegments) parameters.curveSegments = defaultCurveSegments;
    //wenn boolscher Wert fuer die Abschraegung fehlt, wird er hier gesetzt
    if (!parameters.bevelEnabled) parameters.bevelEnabled = false;
    //wenn Wert wie tief die Abschraegung in den Text gehen soll fehlt, wird er hier gesetzt
    if (!parameters.bevelThickness) parameters.bevelThickness = 10;
    //wenn Wert wie weit weg vom Outline des Textes die Abschraegung gehen soll fehlt, wird er hier gesetzt
    if (!parameters.bevelSize) parameters.bevelSize = 3;
    //wenn Wert wie weit vom Outline des Textes die Abschraegung startet fehlt, wird er hier gesetzt
    if (!parameters.bevelOffset) parameters.bevelOffset = 0;
    //wenn Wert wie viele Segmente die Abschraegung haben soll fehlt, wird er hier gesetzt
    if (!parameters.bevelSegments) parameters.bevelSegments = 5;
    //Ende des Setzens von Standardwerten
    //Wenn der Font noch nicht geladen ist, wird er geladen. Durch zuweisen wird dies nur einmal insgesammt noetig.
    //Wenn der Text in bold geschrieben wird wird boldFont uebergeben sonst wird regularFont uebergeben
    let fontSrc = "";
    let selectedFont;
    if (bold) {
        fontSrc = 'fonts/Arial_Bold.json';
        selectedFont = boldFont;
    } else {
        fontSrc = 'fonts/Arial_Regular.json';
        selectedFont = regularFont;
    }
    if (selectedFont == null) {
        //Font wird geladen und wenn Font geladen dann...
        return loadFont(fontSrc).then(function (font) {
            //Wenn Font geladen, dann wird font globaler var zugewiesen und Text erstellt
            if (bold)
                boldFont = font;
            else
                regularFont = font;
            //Eine Hilfsfunktion, in der die TextGeometry als BufferGeometry erstellt wird.
            return HelperCreateTextGeometry(font, text, parameters);
        });
    } else
        //Eine Hilfsfunktion, in der die TextGeometry als BufferGeometry erstellt wird.
        return HelperCreateTextGeometry(selectedFont, text, parameters);
}

//Die Hilfsfunktion fuer die createTextGeometry Funktion. Diese ist notwendig, da JavaScript asynchron arbeitet.
function HelperCreateTextGeometry(font, text = '', parameters = null) {
    //textgeometry wird mit text, font und Parametern erstellt
    //Beschreibung der Parameter in createTextGeometry
    let textGeometry = new THREE.TextGeometry(text, {
        font: font,
        size: parameters.size,
        height: parameters.height,
        curveSegments: parameters.curveSegments,
        bevelEnabled: parameters.bevelEnabled,
        bevelThickness: parameters.bevelThickness,
        bevelSize: parameters.bevelSize,
        bevelOffset: parameters.bevelOffset,
        bevelSegments: parameters.bevelSegments
    });
    //boundingBox wird erstellt
    textGeometry.computeBoundingBox();
    //die TextGeometry wird zu einer BufferGeometry konvertiert (aus Effizienzgruenden)
    textGeometry.computeVertexNormals();
    let textBufferGeometry = new THREE.BufferGeometry().fromGeometry(textGeometry);
    //die Geometrie wird zurueck gegeben
    return textBufferGeometry;
}

//Funktion um eine BoxBufferGeometry zu erstellen. //default aller Werte ist 1
function createBoxBufferGeometry(width = 1, height = 1, depth = 1, widthSegments = 1, heightSegments = 1, depthSegments = 1) {
    return new BoxBufferGeometry(
        width, //die Laenge der Kanten parallel zur x-Achse //Weite
        height, //die Laenge der Kanten parallel zur y-Achse //Hoehe
        depth, //die Laenge der Kanten parallel zur z-Achse //Tiefe
        widthSegments, //die Anzahl an segmentierten rechteckigen Flaechen an der Weite der Seiten
        heightSegments, //die Anzahl an segmentierten rechteckigen Flaechen an der Hoehe der Seiten
        depthSegments //die Anzahl an segmentierten rechteckigen Flaechen an der Hoehe der Seiten
    );
}

//Funktion um die Geometry fuer einen Kreis zu Erstellen bzw. ein x-Ecke wobei 
function createCircleGeometry(radius = 256, segments = 40, scalex = 1, scaley = 1) {

    //geometry wird als CircleGeometry erstellt
    var geometry = new THREE.CircleGeometry(radius, segments);
    //wenn ein Scaling in eine Richtung stattfinden soll. 
    if (scalex != 1 || scaley != 1) {
        //aendere UV-Mapping an den Dreicken, die den Kreis bilden
        let faces = geometry.faces;
        //Es wird zu beginn als leere Liste instatiiert, da wir die UV Koordinaten neu berechnen wollen
        geometry.faceVertexUvs[0] = [];

        for (let i = 0; i < faces.length; i++) {//Die Koordinaten beider Dreiecke werden in UV Koordinaten umgerechnet.//Bsp fuer width=1,height=1

            let v1 = geometry.vertices[faces[i].a],//v1 fuer i=0 {x:-0.5,y:0.5,z:0}//v1 fuer i=1 {x:-0.5,y:-0.5,z:0}
                v2 = geometry.vertices[faces[i].b],//v2 fuer i=0 {x:-0.5,y:-0.5,z:0}//v2 fuer i=1 {x:0.5,y:-0.5,z:0}
                v3 = geometry.vertices[faces[i].c];//v3 fuer i=0 {x:0.5,y:0.5,z:0}//v3 fuer i=1 {x:0.5,y:0.5,z:0}

            //in diesem Teil werden die UV Koordinaten des jeweiligen Dreiecks berechnet und hochgeladen
            geometry.faceVertexUvs[0].push([
                //Zuerst wird durch den Durchmesser geteilt, dadurch hat man Werte zwischen -0.5 und 0.5
                //Danach wird das Bild so skaliert, wie das vorher bestimmt wurde(im Normalfall ist einer der Scalingwerte 1).
                //Zuletzt wird 0.5 addiert, damit man ohne Scaling Werte zwischen 0 und 1 erhaelt.
                new THREE.Vector2(((v1.x / (2 * radius)) * scalex + 0.5), (v1.y / (2 * radius)) * scaley + 0.5),
                new THREE.Vector2(((v2.x / (2 * radius)) * scalex + 0.5), (v2.y / (2 * radius)) * scaley + 0.5),
                new THREE.Vector2(((v3.x / (2 * radius)) * scalex + 0.5), (v3.y / (2 * radius)) * scaley + 0.5)
            ]);
        }
        //Wir geben an, dass wir die UV Koordinaten veraendert haben und diese aktualisiert werden muessen.
        geometry.uvsNeedUpdate = true;
    }
    //die Geometry wird zu einer BufferGeometry konvertiert (aus Effizienzgruenden)
    let bufferGeometry = new THREE.BufferGeometry().fromGeometry(geometry);
    //die Geometrie wird zurueck gegeben
    return bufferGeometry;
}


//Hilfsfunktion, um einen Punkt gegeben als Menge {x?,y?,z?} in einen Vector3 zu parsen
//kann auch mit{x,y}, zpos aufgerufen werden, da zpos hauefig als extra Variable verwendet wird.
function parsePointToVector(point, zpos = 0) {
    return new THREE.Vector3(
        (point.x) != null ? point.x : 0,//wenn es eine x Koordinate gibt, wird diese genommen andernfalls 0
        (point.y) != null ? point.y : 0,//wenn es eine y Koordinate gibt, wird diese genommen andernfalls 0
        (point.z) != null ? point.z : zpos//wenn es eine z Koordinate gibt, wird diese genommen, sonst wird die zpos genommen, die standardmaessig mit 0 initialisiert ist
    );
}

//loader laed den Font
function loadFont(fontName) {
    return new Promise(resolve => {
        //in den FontLoader wird ein Font geladen
        new THREE.FontLoader().load(fontName, resolve);
    });
}