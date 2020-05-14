//In dieser Datei werden die Materialien hergestellt, die für die erzeugung von Objekten noetig sind.

//Funktion, die LineBasicMaterial(durchgezogene Linie) erstellt und zurueck gibt.
function createLineBasicMaterial(color = 0x000000, linewidth = 1, linecap = 'round', linejoin = 'round') {
    //Erstelle das Material
    var lineMaterial = new THREE.LineBasicMaterial({
        //Farbe der Linie in Hex
        color: color,
        //Liniendicke/Linienbreite
        linewidth: linewidth, //wird bei den meisten Plattformen als 1 Interpretiert egal was gesetzt wird.
        //definiert das Aussehen der Enden der Linie
        linecap: linecap, //ignored by WebGLRenderer //moeglich sind 'butt', 'round' and 'square'
        //aussehen wenn sich Linien schneiden
        linejoin: linejoin //ignored by WebGLRenderer //moeglich sind 'round', 'bevel' and 'miter'
    });
    //Gebe das Material zurueck
    return lineMaterial;
}

//Funktion, die LineDashedMaterial(gestrichelte Linie) erstellt und zurueck gibt.
//Nachdem die Linie erstellt wurde(als var line) muss line.computeLineDistances(); ausgefuert werden.
function createLineDashedMaterial(color = 0x000000, linewidth = 1, scale = 0.1, dashSize = 3, gapSize = 2) {
    //Erstelle das Material
    var lineMaterial = new THREE.LineDashedMaterial({
        //Farbe der Linie in Hex
        color: color,
        //Liniendicke/Linienbreite
        linewidth: linewidth,
        //Der Massstab des gestrichelten Parts der Linie.
        //The scale of the dashed part of a line. Default is 1.
        scale: scale,
        //Die Groesse des Striches. Damit ist luecke und Strich gemeint
        //The size of the dash. This is both the gap with the stroke. Default is 3.
        dashSize: dashSize,
        //Groesse der Luecke beachte gapSize/dashSize = Anteil der Luecke an der Linie
        //The size of the gap. Default is 1.
        gapSize: gapSize,
    });
    //Gebe das Material zurueck
    return lineMaterial;
}

//Die Funktion erstellt fuer Planes MeshBasicMaterial mithilfe einer Textur.
function createPlaneMaterial(texture, transparent = window.transparent) {
    //Erstelle das Material
    var planeMaterial = new THREE.MeshBasicMaterial({
        //Die Textur wird auf das Material gemappt(als waeren die Farben des Bildes die Farbe)
        map: texture,
        //Es soll die Vorderseite und die Rueckseite des Plane bemalt werden.
        side: THREE.DoubleSide,
        transparent: transparent,
        depthWrite: true,
    });
    //Gebe das Material zurueck
    return planeMaterial;
}

//Die Funktion erstellt fuer Planes MeshBasicMaterial mit nur einer Farbe.
function createOneColoredPlaneMaterial(color) {
    //Erstelle das Material
    var planeMaterial = new THREE.MeshBasicMaterial({
        //Die Textur wird auf das Material gemappt(als waeren die Farben des Bildes die Farbe)
        color: color,
        //Es soll die Vorderseite und die Rueckseite des Plane bemalt werden.
        side: THREE.DoubleSide,
        depthWrite: false,
    });
    //Gebe das Material zurueck
    return planeMaterial;
}

//Die Funktion erstellt fuer Texte 2 MeshBasicMaterial. Die erste ist fuer die Vorderseite die zweite fuer die Seite
function createTextMaterial(frontColor = 0x000000, sideColor = frontColor) {
    //Erstelle die Materialien
    var textMaterials = [
        //Material fuer Vorne
        new THREE.MeshBasicMaterial({color: frontColor}),
        //Material fuer die Seite //da wegen 2D nur von vorne sichtbar, aktuell irrelevant.
        new THREE.MeshBasicMaterial({color: sideColor})
    ];
    //Gebe die Materialien zurueck
    return textMaterials;
}

//Funktion um einen Canvas mir mehreren Zeilen Text zu erstellen
function createMultiLineTextCanvas(texts, args = {
    textSize: defaultTextSize,
    fontColor: defaultColor,
    padding: padding,
    backgroundColor: null,
    adjustSizeToText: false,
    height: 1,
    width: 1,
    font: "Arial",
    adjustWidthToText: false,
    adjustHeightToText: false
}) {
    //wenn Werte in args fehlen, werden diese mit defaultWerten ersetzt
    if (args == null)
        args = {};
    let textSize = args.textSize != null ? args.textSize : defaultTextSize,
        fontColor = args.fontColor != null ? args.fontColor : defaultColor,
        padding = args.padding != null ? args.padding : padding,
        backgroundColor = args.backgroundColor != null ? args.backgroundColor : null,
        adjustSizeToText = args.adjustSizeToText != null ? args.adjustSizeToText : false,
        height = args.height != null ? args.height : 1,
        width = args.width != null ? args.width : 1,
        font = args.font != null ? args.font : "Arial",
        adjustWidthToText = args.adjustWidthToText != null ? args.adjustWidthToText : false,
        adjustHeightToText = args.adjustHeightToText != null ? args.adjustHeightToText : false;
    //neues Canvas-Element wird erstellt
    var textCanvas = document.createElement('canvas');
    let ctx = textCanvas.getContext('2d');
    //Font wird gesetzt
    ctx.font = textSize + "px " + font;
    //Breite, die der laengste Text hat wird berechnet
    let maxWidth = 0;
    for (let index in texts) {
        let text = texts[index];
        var textInfo = ctx.measureText(text); // TextMetrics object
        if (textInfo.width > maxWidth)
            maxWidth = textInfo.width;
    }
    //Wenn Canvas an die Textgroesse angepasst werden soll, dann wird er entsprechend der Texte erstellt
    if (adjustSizeToText) {
        //Canvas wird resized auf naechsthoehere 2er Potenz
        textCanvas.width = pow2ceil(padding + maxWidth);
        textCanvas.height = pow2ceil((textSize + padding) * texts.length);
    } else {
        //Wenn Breite an die Textgroesse angepasst werden soll maxWidt+
        if (adjustWidthToText)
            textCanvas.width = 2 * padding + maxWidth;
        else
            textCanvas.width = width;
        if (adjustHeightToText)
            textCanvas.height = pow2ceil((textSize + padding) * texts.length);
        else
            textCanvas.height = height;
    }
    //Text soll linkszentiert geschrieben werden
    ctx.textAlign = "left";
    //TextBaseline top wird gegeben (der Text steht unter dem Punkt (x,y))
    ctx.textBaseline = "top";
    //Font muss nochmal gesetzt werden (nach jedem resize)
    ctx.font = textSize + "px " + font;
    //Canvas wird geleert
    ctx.clearRect(0, 0, textCanvas.width, textCanvas.height);
    //Farbe fuer Text wird gesetzt
    if (backgroundColor != null) {
        ctx.fillStyle = backgroundColor;
        ctx.fillRect(0, 0, textCanvas.width, textCanvas.height);
    }
    //x-Koordinate der Texte ist padding weit weg vom Rand
    let textX = padding;
    //Fontcolor wird gesetzt
    ctx.fillStyle = fontColor;
    //Count wird gesetzt, weil Funktion auch fuer Objekte funktionier bsp. {url:http:\\..,index2:blabla}
    let count = 0;
    for (let index in texts) {
        let text = texts[index];
        let textY = padding + count * (padding + textSize);
        //Text wird an (textX,textY) geschrieben, da alignment left steht der Text rechts daneben, da Baseline Top steht er darunter
        ctx.fillText(text, textX, textY);
        count++;
    }
    // canvas contents will be used for a texture
    return textCanvas;
}

//Funktion, die die naesthoere 2er Potenz einer Zahl zurueckgibt
function pow2ceil(v) {
    var p = 2;
    while (v >>= 1) {
        p <<= 1;
    }
    return p;
}