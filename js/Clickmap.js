//Diese Datei enthaelt die Visualisierung der Klickpfade. Sie erbt von Visualization.js.
let clickmapTextureHeight = 512;
let clickmapHoverTextureHeight=clickmapTextureHeight*3;
let allValuesDown = true;
let linePrecision = 10;
let clickmapCircleSegments = 30;
let zBackground = 0;
let zNodes = 100;
let zEdges = 1;
let zText = 101;
let zHoverContainer = 900;
let deleteClickmapHoverEdgeOnMouseLeave = false;
let deleteClickmapHoverNodeOnMouseLeave = true;
let clickmapHoverArrowColor = "#ff0000";
let clickmapArrowHeadLength = 100;
let clickmapArrowHeadWidth = 100;
let emptyCirclePadding = emptyPlanePadding / 2;
let clickmapPadding = 50;
let suppressNodeSelfCalling = true;
let clickmapTextColor = "#000000";
let clickmapTextSize = 60;
//let clickmapHoverTextSize = 200;
let clickmapTextBackgroundColor = "#b7e5db";
//eyevido nimmt nur letzten 20 Zeichen von URL
let clickmapLabelMaxSize = 35;
let emptyCircleColor = "#62baac";
let clickmapTransitionColor = "#62baac";
let clickmapParallelColor = "#0000ff";
let clickmapBubbleSize = 1;
let clickmapNodeMaxSize = 50;
let suppressParallelTransition = false;
let layoutAlgorithm='grid'; //'grid', 'concentric', 'circle', 'random', 'dagre'


class Clickmap extends Visualization {
    constructor(selectedWebsite = "amazon", frustumSize = 10000, camera_startPosition = {
        x: frustumSize / 2,
        y: -frustumSize / 2,
        z: 1000
    }, near = 1, far = 10000, backgroundColor = "#ffffff") {
        //initialisiere Visualization
        super(frustumSize, camera_startPosition, false, near, far, backgroundColor);
        this.selectedWebsite = selectedWebsite;
        //Methoden von der Clickmapklasse sollen auf Variablen der Klasse und Superklasse zugreifen koennen
        this.initialisation = this.initialisation.bind(this);
        this.layoutAndDrawGraph = this.layoutAndDrawGraph.bind(this);
        this.drawGraph = this.drawGraph.bind(this);
        this.drawNodes = this.drawNodes.bind(this);
        this.drawEdges = this.drawEdges.bind(this);
        this.calculateSizeOnWeight = this.calculateSizeOnWeight.bind(this);
        this.drawArrowLabelText = this.drawArrowLabelText.bind(this);
        this.drawIntersectionEdge = this.drawIntersectionEdge.bind(this);
        this.drawIntersectionNode = this.drawIntersectionNode.bind(this);
        this.isWebgroupOfMainLayer = this.isWebgroupOfMainLayer.bind(this);
        //die Visualisierung wir initialisiert
        this.initialisation();
    }

    initialisation() {
        super.initialisation();
        //setze Standard Hoverevents aus HTML
        changeHoverEvents();
        getTexture("checkerboard.png");
        this.intersectedNode = {};
        this.intersectedEdge = {};
        //berechne die Knoten und Kanten
        let graphData = this.getNodesAndEdges(this.selectedWebsite);
        let nodes = graphData.nodes;
        let edges = graphData.edges;
        this.edges = edges;
        this.nodes = nodes;
        //Erstelle Container fuer Nodes und Edges
        this.nodeContainer = new THREE.Object3D();
        this.edgeContainer = new THREE.Object3D();
        this.hoverContainer = new THREE.Object3D();
        //der Container wird zu der Scene hinzugefuegt
        this.scene.add(this.nodeContainer);
        this.scene.add(this.edgeContainer);
        this.scene.add(this.hoverContainer);
        //Knoten und Edges in dem Format, in dem es cytoscape benoetigt
        this.maxValues = undefined;
        this.layoutAndDrawGraph();
    }

    layoutAndDrawGraph() {
        let cgraphData = this.parseNodesAndEdgesForCytoscape(this.nodes, this.edges);
        this.edgeArray = cgraphData.edgeArray;
        let elements = cgraphData.elements;

        let layoutData = this.getLayoutData([...elements]);
        this.cedges = layoutData.edges;
        this.cnodes = layoutData.nodes;
        //Zeichne den Graphen
        this.drawGraph();
    }

    drawGraph() {
        // der Rest des Codes wird erst ausgefuehrt nachdem alle Texturen geladen wurden.
        this.drawNodes();
        this.drawEdges();
    }

    //Methode um alle Knoten zu zeichnen
    drawNodes() {
        //loesche alle Inhalte, die schon im Container sind
        this.clearContainer(this.nodeContainer);
        this.nodeImageContainer = new THREE.Object3D();
        //Erstelle Container fuer Nodelabels
        let textContainer = new THREE.Object3D();
        //Erstelle Container fuer leere Kreise
        let emptyCircleContainer = new THREE.Object3D();
        this.nodeContainer.add(this.nodeImageContainer);
        this.nodeContainer.add(textContainer);
        this.nodeContainer.add(emptyCircleContainer);
        let nodes = this.cnodes;
        // alle Texturen zusammen geladen
        // let imageArray = this.getImageArray(this.nodes);
        // let textures = getAllTexturesOfArray(imageArray);
        // textures.then(textureArray => {
        //Zeichne Knoten
        nodes.forEach((node) => {
            let imageName = this.nodes[node.id].image;
            // alle Texturen zusammen geladen
            // let texture = textureArray[imageName];
            //jede Textur einzeln geladen
            let texture = getTexture(imageName);
            let nodeSize = this.nodes[node.id].size;
            let radius = (nodeSize / clickmapNodeMaxSize) * clickmapTextureHeight / 2;
            let x = node.x - radius;//Weil Bilder in draw auf (0,0) normalisiert werden
            let y = node.y - radius;
            //jede Textur einzeln geladen
            texture.then((imageTexture) => {
                drawCircleWithTexture(this.nodeImageContainer, imageTexture, x, y, zNodes, radius, clickmapCircleSegments, true);
                drawEmptyCircle(emptyCircleContainer, emptyCircleColor, x - emptyCirclePadding, y - emptyCirclePadding, zBackground, radius + emptyCirclePadding, clickmapCircleSegments, true);
                //wenn das Bild durchsichtig sein kann, dann soll der Hintergrund die Hintergrundfarbe haben
                if (defaultHandleTransparentBackground) {
                    getTexture("checkerboard.png").then((backgroundTexture) => {
                        backgroundTexture.wrapS = backgroundTexture.wrapT = THREE.RepeatWrapping;
                        backgroundTexture.offset.set(0, 0);
                        backgroundTexture.repeat.set(clickmapTextureHeight / 8, clickmapTextureHeight / 8);
                        drawCircleWithTexture(emptyCircleContainer, backgroundTexture, x, y, zBackground, radius, clickmapCircleSegments, true, false);
                    });
                }
            });
        });
        //drawNodeTexts
        let textPadding = clickmapPadding;
        nodes.forEach((node) => {
            let nodeSize = this.nodes[node.id].size;
            let radius = (nodeSize / clickmapNodeMaxSize) * clickmapTextureHeight / 2;
            let text = node.id;
            if (text.length > clickmapLabelMaxSize) {
                text = text.substring(text.length - 1 - clickmapLabelMaxSize, text.length);
            }
            drawText(textContainer, text, {
                x: node.x,
                y: node.y - radius - textPadding,
                z: zText,
                bold: false,
                alignment: "center",
                verticalAlignment: "sub",
                frontColor: clickmapTextColor
            }, {size: clickmapTextSize});
        });
    }

    //Methode um alle Kanten zu zeichnen
    drawEdges() {
        this.clearContainer(this.edgeContainer);
        this.edgeArrowContainer = new THREE.Object3D();
        //Erstelle Container fuer Edgelabels
        let textContainer = new THREE.Object3D();
        this.edgeContainer.add(this.edgeArrowContainer);
        this.edgeContainer.add(textContainer);
        let edges = this.cedges;
        //Zeichne Kanten
        edges.forEach((edge) => {
            let start = edge.source;
            let end = edge.target;
            let e = this.edgeArray[edge.id];
            //wenn ein Knoten sich nicht selbst aufrufen soll
            if (suppressNodeSelfCalling) {
                if (e.source === e.target) {
                    //mache return
                    return;
                }
            }
            //Bestimme ob Kante direkte Transition oder parallel
            let isParallel = false;
            let selectedEdge = this.edges[e.source][e.target];
            for (let user in selectedEdge) {
                for (let timestamp in selectedEdge[user]) {
                    //wenn fuer irgendeinen Nutzer die Edgeduration>0, dann ist es parallele Kante
                    isParallel = isParallel || selectedEdge[user][timestamp].duration > 0;
                }
            }
            //suche Farbe aus je nachdem ob Kante Paralelitaet oder Transition anzeigt
            let color;
            if (isParallel) {
                if (suppressParallelTransition) {
                    return;
                }
                color = clickmapParallelColor;
            } else {
                color = clickmapTransitionColor;
            }
            let edgeInformation = this.edgeArray[edge.id];
            let properties = this.edges[edgeInformation.source][edgeInformation.target];
            let userNumber = String(this.getUserCountInProperties(properties));
            //Zeichne Pfeile
            drawArrow(this.edgeArrowContainer, start, end, zEdges, color, userNumber*clickmapArrowHeadLength, userNumber*clickmapArrowHeadWidth, {id: edge.id}, true);
            //Zeichne Labeltext
            this.drawArrowLabelText(edge.id, textContainer, clickmapTextColor, zText, clickmapTextSize);
        });
    }

    //Zeichne Labeltext eines Pfeils
    drawArrowLabelText(id = 0, container = this.scene, color = clickmapTextColor, z = zText, textSize = clickmapTextSize,userData=null) {
        let edge = this.cedges[id];
        let mid = edge.mid;
        let e = this.edgeArray[id];
        let properties = this.edges[e.source][e.target];
        let text = String(this.getUserCountInProperties(properties));
        drawText(container, text, {
            x: mid.x,
            y: mid.y,
            z: z,
            bold: false,
            alignment: "center",
            verticalAlignment: "middle",
            frontColor: color
        }, {size: textSize},userData);
    }

    //renderer wird um Picking erweitert
    render() {
        super.render();
        //raycast Nodes
        this.raycastForIntersection(
            this.nodeImageContainer,
            this.intersectedNode,
            this.drawIntersectionNode,
            {
                deleteOnMouseLeave: deleteClickmapHoverNodeOnMouseLeave,
                useIntersectionArray: false,
                getImageName: true,
                clearHoverContainerOnNewIntersection: true,
                recursive: false
            });
        //raycastEdges
        this.raycastForIntersection(
            this.edgeArrowContainer,
            this.intersectedEdge,
            this.drawIntersectionEdge,
            {
                deleteOnMouseLeave: deleteClickmapHoverEdgeOnMouseLeave,
                useIntersectionArray: false,
                getImageName: false,
                clearHoverContainerOnNewIntersection: true,
                recursive: true,
                linePrecision: linePrecision
            });
    }

    //Methode die bei Intersection mit einer Kanten aufgerufen wird.
    drawIntersectionEdge(intersect) {
        let backgroundColor=document.getElementById(getSelectedVisualization()+"BackgroundColor").value;
        //setze intersectedNode = null
        if (this.intersectedNode && this.intersectedNode.val != null)
            this.intersectedNode.val = null;
        let id = intersect.userData.id;
        let edge = this.cedges[id];
        let edgeInformation = this.edgeArray[edge.id];
        let properties = this.edges[edgeInformation.source][edgeInformation.target];
        let userNumber = String(this.getUserCountInProperties(properties));
        drawArrow(this.hoverContainer, edge.source, edge.target, zHoverContainer, clickmapHoverArrowColor, userNumber*clickmapArrowHeadLength, userNumber*clickmapArrowHeadWidth,"Hoverevent",true);
        this.drawArrowLabelText(id, this.hoverContainer, backgroundColor, zHoverContainer, clickmapTextSize,"Hoverevent");
        this.drawArrowLabelText(id, this.hoverContainer, clickmapHoverArrowColor, zHoverContainer, clickmapTextSize*4, "Hoverevent");
    }

    //Methode die bei Intersection mit einem Knoten aufgerufen wird.
    drawIntersectionNode(imageName) {
        if (this.intersectedEdge && this.intersectedEdge.val != null)
            this.intersectedEdge.val = null;
        let nodeId = undefined;
        for (let i in this.nodes) {
            let imageNameNode = this.nodes[i].image;
            if (imageName === imageNameNode) {
                nodeId = i;
                break;
            }
        }
        // noinspection EqualityComparisonWithCoercionJS
        if (nodeId != undefined) {
            //position
            const vector = this.getMouseKoordinates();
            //imageTexture
            let texture1 = getTexture(imageName, {fullSizeImage: false});
            let webGroup = this.nodes[nodeId].webgroup;
            let gazeArray = getDataArrayClickmap(webGroup);
            let mouseArray = getDataArrayClickmap(webGroup, "mouse");
            //canvasTexture
            let texts = [];
            let webgroupText = "Webgruppe: " + this.nodes[nodeId].webgroup;
            //Splitte Webgrouptext wenn er zu lang ist
            while (webgroupText.length > clickmapLabelMaxSize) {
                let text = webgroupText.substring(0, clickmapLabelMaxSize);
                texts.push(text);
                webgroupText = webgroupText.substring(clickmapLabelMaxSize, webgroupText.length);
            }
            //der rest des webgrouptextes wird gepushed
            texts.push(webgroupText);
            //finde user, die zu Node gehoeren und schreibe sie im Format: x Probanden(x1, x2, ...)
            let userNames = [];
            let properties = this.nodes[nodeId];
            let userText = "";
            for (let i in properties) {
                if (window.importedData.allUsers.includes(i))
                    userNames.push(i);
            }
            if (userNames.length > 1) {
                userText = userText + userNames.length + " Probanden (" + userNames[0] + ", ";
                for (let i = 1; i < userNames.length - 1; i++)
                    userText += userNames[i] + ", ";
                userText += userNames[userNames.length - 1] + ")";
            } else {
                if (userNames.length > 0) {
                    userText = userText + userNames.length + " Proband (" + userNames[0] + ")";
                }
            }
            texts.push(userText);
            //schreibe Gewichtungsfaktoren
            let weightValues = this.getAllWeightValues(nodeId, properties);
            let dwellTime = "Summe Verweildauern: "+this.getDurationText(weightValues.dwellTime);
            let fixationDuration = "Summe Fixationsdauern: "+ this.getDurationText(weightValues.fixationDuration);
            let fixationCount = "Anzahl Fixationen: "+ weightValues.fixationCount;
            let clicks = "Summe Klicks: "+ weightValues.clickCount;
            let mouse = "Summe Mausinteraktionen: "+ weightValues.mouseDataCount;
            let shots = "Enthaltene Shots: "+ weightValues.shotsIncluded;
            texts.push(dwellTime);
            texts.push(fixationDuration);
            texts.push(fixationCount);
            texts.push(clicks);
            texts.push(mouse);
            texts.push(shots);
            //erstelle mit den Texten einen Textcanvas der Groesse 2*clickmapTextureHeight und auch doppelter Textgroesse
            //Breite des Textcanvas ist abhaenig von der Textgroesse
            let height=clickmapHoverTextureHeight;
            let textCanvas = createMultiLineTextCanvas(texts, {
                textSize: clickmapTextSize * 2,
                fontColor: clickmapTextColor,
                padding: clickmapPadding,
                adjustWidthToText: true,
                height: height,
                backgroundColor: clickmapTextBackgroundColor
            });
            //aus canvas wird Textur erstellt.
            let texture2 = new THREE.CanvasTexture(textCanvas);
            texture1.then((imageTexture) => {
                if (imageTexture && imageTexture.image) {
                    let width1 = height * imageTexture.image.naturalWidth / imageTexture.image.naturalHeight;
                    drawDetailview(this.hoverContainer, imageName, texture2, vector.x, vector.y, zHoverContainer, {
                        height: height,
                        width: width1,
                        gazeArray: gazeArray,
                        mouseArray: mouseArray
                    }, {height: height, width: texture2.image.width}, window.transparent, true);
                }
            });
        }
    }

    //Funktion, die mithilfe von Cytoscape die Positionen fuer nodes und edges berechnet
    getLayoutData(elements) {
        let helperDiv = document.createElement("div");
        helperDiv.style.zIndex = "-1";
        document.body.append(helperDiv);
        helperDiv.style.width = "1920px";
        helperDiv.style.height = "1080px";
        //defaultWidth ist 30, darauf sind auch alle Paddings und aehnliches eingestellt bei Cytoscape

        let nodeSize = clickmapNodeMaxSize;
        let cy = cytoscape({
            container: helperDiv,
            elements: elements,

            style: [
                {
                    selector: 'node',
                    style: {
                        label: 'data(id)',
                        width: 'data(size)',
                        height: 'data(size)',
                        shape: 'ellipse'
                    }
                },
                {
                    selector: 'edge',
                    style: {
                        'source-endpoint': "outside-to-line",
                        'target-endpoint': "outside-to-line",
                        'curve-style': "straight"
                    }
                },
            ],

            layout: {
                // name: 'grid'
                name: layoutAlgorithm
            },
            //styleEnabled: false,

        });
        //     cytoscape.stylesheet()
        //         .selector('node')
        //         .css({
        //
        //                 width: "data(width)"
        // })
        //     ;

        let layout = cy.layout({name: layoutAlgorithm});
        layout.run();
        let cnodes = [];
        let cedges = [];
        //Scaling mit BubbleSize
        let scaleX = (clickmapTextureHeight / nodeSize);
        // noinspection JSSuspiciousNameCombination
        let scaleY = scaleX;
        if (allValuesDown)
            scaleY *= -1;

        cy.ready(function () {
            cy.nodes().map((node) => {
                let position = node.position();
                let x = position.x * scaleX;
                let y = position.y * scaleY;
                let cnode = {id: node.id(), x: x, y: y};
                cnodes.push(cnode);
            });
            cy.edges().map((edge) => {
                let id = edge.id();
                let sourcePosition = edge.sourceEndpoint();
                let source = new THREE.Vector2(sourcePosition.x * scaleX, sourcePosition.y * scaleY);
                let targetPosition = edge.targetEndpoint();
                let target = new THREE.Vector2(targetPosition.x * scaleX, targetPosition.y * scaleY);
                let midpointPosition = edge.midpoint();
                let midpoint = new THREE.Vector2(midpointPosition.x * scaleX, midpointPosition.y * scaleY);
                let cedge = {id: id, source: source, target: target, mid: midpoint};
                cedges.push(cedge);
            });
            document.body.removeChild(helperDiv);
            cy.elements().removeData();
            cy.removeData();
        });
        return {nodes: cnodes, edges: cedges};
    }

    getNodesAndEdges(website, args = {sortingProperty: "webgroup", preloadPictures: true, withLayer: getWithLayer()}) {
        let sortingProperty = args.sortingProperty ? args.sortingProperty : "webgroup"; //Werte sortingProperty: "webgroup" oder "image";//zum leichteren aendern von sortieren nach imageName oder webgroup_id
        let preloadPictures = args.preloadPictures ? args.preloadPictures : true; //bei preloadPictures ist Boolen ob schon bei dem ersten vorkommen eines Bildes diese geladen werden sollen. 
        let withLayer = args.withLayer ? args.withLayer : getWithLayer(); //Wenn nur Nodes und Edges der Mainlayer gezeichnet werden sollen
        //nodes und edges fuer Rueckgabe. nodesHelper ist nur HelferVariable, in der alle Knotennamen als String einmalig gespeichert werden
        let nodesHelper = [];
        let nodes = {};
        let edges = {};
        for (let user of window.importedData.allUsers) {
            //erstelle einen Array mit allen Elementen fuer diesen
            let unsortedArray = [];
            //iteriere ueber alle Webgruppen
            for (let webgroup in window.filteredData.webStructure[website]) {
                //Wenn nur MainLayer angezeigt werden soll und webgruppe nicht Teil des MainLayers
                // if (!withLayer && !this.isWebgroupOfMainLayer(webgroup)) {
                //     continue;
                // }
                let currentWebGroup = window.filteredData.webStructure[website][webgroup];
                //wenn der Nutzer in der Webgruppe vorkommt
                if (currentWebGroup[user] != null) {
                    //Wenn Daten existieren
                    for (let interaction in currentWebGroup[user]) {
                        if (currentWebGroup[user][interaction].duration && currentWebGroup[user][interaction].timestamp) {
                            let start = parseInt(currentWebGroup[user][interaction].timestamp);
                            let end = start + parseInt(currentWebGroup[user][interaction].duration);
                            let imageName;
                            if (window.importedData.webGroupToImageMapping[webgroup].image != null) {
                                imageName = window.importedData.webGroupToImageMapping[webgroup].image;
                                //eventuell getTexture hier starten
                                if (preloadPictures)
                                    getTexture(imageName);
                            } else imageName = null;
                            //pushe Objekt mit Startzeit, Endzeit, Bildnamen und Webgruppe
                            unsortedArray.push({start: start, end: end, image: imageName, webgroup: webgroup});
                        }
                    }
                }
            }
            //Nach Zeiten sortierter Array eines Nutzers
            let sortedArray = sortArrayByProperty(unsortedArray,"start","end");
            //iteriere ueber sorted Array
            //Erstelle nodes Array
            for (let i = 0; i < sortedArray.length; i++) {
                let elem = sortedArray[i];//elem={start:s,end:e,image:img,webgroup:w}
                let id = elem[sortingProperty];
                if (!nodesHelper.includes(id)) {
                    nodesHelper.push(id);
                    nodes[id] = {image: elem.image, webgroup: elem.webgroup};
                }
                //Erstelle Objekt mit Nodeinformationen
                if (nodes[id][user] == null) {
                    nodes[id][user] = [{start: elem.start, end: elem.end}];
                } else {
                    //Falls mehrfache Nutzerinteraktion pushe in den Array
                    nodes[id][user].push({start: elem.start, end: elem.end});
                }
            }
            //berechne alle Kanten aus sortedArray
            let edgesUser = this.calculateAllEdgesInSortedArray(sortedArray, sortingProperty);//[{source:sortingProperty,target:sortingProperty,start:timestamp,duration:duration}]
            //versuche die Kanten des Nutzers in edges einzufuegen
            for (let elem in edgesUser) {
                let source = edgesUser[elem].source;
                let target = edgesUser[elem].target;
                let start = edgesUser[elem].start;
                let duration = edgesUser[elem].duration;
                //wenn noch keine Kante von diesem Knoten ausgegangen erstelle leeres Objekt
                if (edges[source] == null) {
                    edges[source] = {};
                }
                //wenn noch keine Kante von source nach target, dann erstelle leeres Objekt
                if (edges[source][target] == null) {
                    edges[source][target] = {};
                }
                //erstelle edges[source][target][user] start und duration in Array
                if (edges[source][target][user] == null) {
                    edges[source][target][user] = [{start: start, duration: duration}];
                } else {
                    edges[source][target][user].push({start: start, duration: duration});
                }
            }
        }
        //gebe Knoten und Kanten zurueck
        return {nodes: nodes, edges: edges};
    }

    //Methodu um aus einem sortierten Array mit allen Knoten eines Users
    calculateAllEdgesInSortedArray(sortedArray, sortingProperty = "webgroup") { //namingProperty soll "webgroup" oder "image" sein
        let edgesUser = [];
        let minStart = 0;
        for (let i = 0; i < sortedArray.length; i++) {
            let elem = sortedArray[i];//elem={start:s1,end:e1,image:img,webgroup:w}
            //pruefe fuer Knoten elem auf "intersection" mit anderen
            for (let j = minStart; j < sortedArray.length; j++) {
                //Der Knoten wird nicht mit sich selbst verglichen
                if (i === j)
                    continue;
                let elem2 = sortedArray[j];//elem2={start:s2,end:e2,image:img2,webgroup:w2}
                //wenn das Ende des ersten Knotens ab start kleiner ist als der Anfang von elem und timestamps werden nur groesser weil sortiert, dann wird beim naechsen mal ab dem Knoten danach geprueft
                if (elem2.end < elem.start) {
                    minStart = j + 1;
                    continue;
                }
                //elem2.end >= elem.start
                //   s1           e1
                //   [...e2..............]
                //wenn elem2 vor dem Ende von elem startet gibt es in jedem Fall intersection
                if (elem.end >= elem2.start) {
                    let edge = {source: elem[sortingProperty], target: elem2[sortingProperty]};
                    //s1 vor e2 und s2 vor e1
                    if (elem.end >= elem2.end) {
                        //e1 endet nach e2, also ist e2 ende der duration
                        if (elem.start >= elem2.start) {
                            //s1 startet nach s2 also start duration bei s1
                            //wenn elem mit dem Ende von elem2 startet, dann keine Rueckkante
                            if (elem.start === elem2.end) {
                                continue;
                            }
                            edge.start = elem.start;
                            edge.duration = elem2.end - edge.start;
                            edgesUser.push(edge);
                        }
                            //elem.end >= elem2.start
                            //elem.end >= elem2.end
                        //elem.start < elem2.start
                        else {
                            //s2 startet nach s1 also start duration bei s2
                            edge.start = elem2.start;
                            edge.duration = elem2.end - edge.start;
                            edgesUser.push(edge);
                        }
                    }
                        //elem.end >= elem2.start
                    //elem.end < elem2.end
                    else { //e1 endet vor e2, also ist e1 ende der duration
                        if (elem.start >= elem2.start) {
                            //s1 startet nach s2 also start duration bei s1
                            //wenn elem mit dem Ende von elem2 startet, dann keine Rueckkante
                            if (elem.start === elem2.end) {
                                continue;
                            }
                            edge.start = elem.start;
                            edge.duration = elem.end - edge.start;
                            edgesUser.push(edge);
                        }
                            //elem.end >= elem2.start
                            //elem.end < elem2.end
                        //elem.start < elem2.start
                        else {//s2 startet nach s1 also start duration bei s2
                            edge.start = elem2.start;
                            edge.duration = elem.end - edge.start;
                            edgesUser.push(edge);
                        }
                    }
                }
                //elem.end < elem2.start
                else //wenn elem.end kleiner ist als elem2.start und elem2 wird nur groesser(weil sortiert) kann Schleife beendet werden
                    break;
            }
        }
        //Ende Iteration ueber sortedArray
        return edgesUser;//[{source:namingProperty,target:namingProperty,start:timestamp,duration:duration}]
    }

    parseNodesAndEdgesForCytoscape(nodes, edges) {
        let elements = [];
        let data = {};
        //knoten werden zu result hinzuegfuegt
        for (let key in nodes) {
            //2Abziehen fuer image und webgroup
            const id = key;
            //zaehle die Nutzer, die zu der Nutzergruppe dieses Knotens gehoeren
            let size = this.calculateSizeOnWeight(id);
            // noinspection JSSuspiciousNameCombination
            data = {size: size, id: id};
            let cnode = {data: data};
            elements.push(cnode);
        }
        //fuege alle Knoten zu edgeArray hinzu
        let edgeArray = [];
        for (let source in edges) {
            for (let target in edges[source]) {
                let edge = {source: source, target: target};
                edgeArray.push(edge);
            }
        }
        //gebe jedem Knoten die Position im Array als Id
        for (let i = 0; i < edgeArray.length; i++) {
            let cedge = {data: {id: i, source: edgeArray[i].source, target: edgeArray[i].target}};
            elements.push(cedge);
        }
        return {edgeArray: edgeArray, elements: elements};
    }

    getImageArray(nodes) {
        //suche alle Bilder der Knoten und lade sie in Array
        let imageArray = [];
        for (let i in nodes) {
            //erstelle Array mit allen Bildern der Knoten
            let imageName = nodes[i].image;
            if (imageName != null && imageName !== "")
                imageArray.push(imageName);
        }
        return imageArray;
    }

    // getUserCountInProperties(properties) {
    //     let usercount = 0;
    //     for (let i in properties) {
    //         if (window.importedData.allUsers.includes(i))
    //             usercount++;
    //     }
    //     return usercount;
    // }

    isWebgroupOfMainLayer(webgroup) {
        //bestimme alle Layer der Webseite
        if (this.mainLayer == null) {
            let layers = getAllLayersOfWebsite(this.selectedWebsite);
            this.mainLayer = getBestLayer(layers);
        }
        //Pruefe ob layer der Webgruppe = MainLayer
        if (window.importedData.webGroupToImageMapping[webgroup] != null) {
            let layer = window.importedData.webGroupToImageMapping[webgroup].layer;
            if (layer === this.mainLayer) {
                return true;
            }
        }
        return false;
    }

    calculateSizeOnWeight(webgroupId, nodeMaxSize = clickmapNodeMaxSize) {
        let nodeMinSize = (parseInt(document.getElementById("clickmapMinBubbleSize").value) / 100) * nodeMaxSize;
        if (this.maxValues == null) {
            this.maxValues = {};
            this.maxValues.fixationCount = -Infinity;
            this.maxValues.fixationDuration = -Infinity;
            this.maxValues.mouseDataCount = -Infinity;
            this.maxValues.clickCount = -Infinity;
            this.maxValues.userCount = -Infinity;
            this.maxValues.shotsIncluded = -Infinity;
            this.maxValues.dwellTime = -Infinity;
            if (window.filteredData && window.filteredData.webStructure && window.filteredData.webStructure[this.selectedWebsite] != null) {
                let fixationCounts = [],
                    fixationDurations = [],
                    mouseDataCounts = [],
                    clickCounts = [],
                    userCounts = [],
                    shotsIncludeds = [],
                    dwellTimes = [];
                for (let webgroup in window.filteredData.webStructure[this.selectedWebsite]) {
                    let v = this.getAllWeightValues(webgroup, this.nodes[webgroup]);
                    fixationCounts.push(v.fixationCount);
                    fixationDurations.push(v.fixationDuration);
                    mouseDataCounts.push(v.mouseDataCount);
                    clickCounts.push(v.clickCount);
                    userCounts.push(v.userCount);
                    shotsIncludeds.push(v.shotsIncluded);
                    dwellTimes.push(v.dwellTime);
                }
                this.maxValues.fixationCount = Math.max(...fixationCounts);
                this.maxValues.fixationDuration = Math.max(...fixationDurations);
                this.maxValues.mouseDataCount = Math.max(...mouseDataCounts);
                this.maxValues.clickCount = Math.max(...clickCounts);
                this.maxValues.userCount = Math.max(...userCounts);
                this.maxValues.shotsIncluded = Math.max(...shotsIncludeds);
                this.maxValues.dwellTime = Math.max(...dwellTimes);
            }
        }
        let fixationCountRatio = parseInt(document.getElementById("clickmapFixationCountRatio").value);
        let fixationDurationRatio = parseInt(document.getElementById("clickmapFixationDurationRatio").value);
        let mouseDataCountRatio = parseInt(document.getElementById("clickmapMouseDataCountRatio").value);
        let clickCountRatio = parseInt(document.getElementById("clickmapClickCountRatio").value);
        let userCountRatio = parseInt(document.getElementById("clickmapUserCountRatio").value);
        let shotsIncludedRatio = parseInt(document.getElementById("clickmapShotsIncludedRatio").value);
        let dwellTimeRatio = parseInt(document.getElementById("clickmapDwellTimeRatio").value);
        let ratioSum = fixationCountRatio + fixationDurationRatio + mouseDataCountRatio + clickCountRatio + userCountRatio + shotsIncludedRatio + dwellTimeRatio;
        if (ratioSum === 0) {
            let nodeSize = nodeMaxSize * clickmapBubbleSize;
            this.nodes[webgroupId].size = nodeSize;
            return nodeSize;
        }
        let w = this.getAllWeightValues(webgroupId, this.nodes[webgroupId]);
        let fixationCountValue = w.fixationCount / this.maxValues.fixationCount * fixationCountRatio / ratioSum;
        let fixationDurationValue = w.fixationDuration / this.maxValues.fixationDuration * fixationDurationRatio / ratioSum;
        let mouseDataCountValue = w.mouseDataCount / this.maxValues.mouseDataCount * mouseDataCountRatio / ratioSum;
        let clickCountValue = w.clickCount / this.maxValues.clickCount * clickCountRatio / ratioSum;
        let userCountValue = w.userCount / this.maxValues.userCount * userCountRatio / ratioSum;
        let shotsIncludedValue = w.shotsIncluded / this.maxValues.shotsIncluded * shotsIncludedRatio / ratioSum;
        let dwellTimeValue = w.dwellTime / this.maxValues.dwellTime * dwellTimeRatio / ratioSum;
        let sizingFactor = fixationCountValue + fixationDurationValue + mouseDataCountValue + clickCountValue + userCountValue + shotsIncludedValue + dwellTimeValue;
        let nodeSize = nodeMinSize + ((nodeMaxSize - nodeMinSize) * sizingFactor);
        nodeSize *= clickmapBubbleSize;
        this.nodes[webgroupId].size = nodeSize;
        return nodeSize;
    }

    getAllWeightValues(webgroup, properties) {//properties=this.nodes[webgroup]
        //HilfsWerte, die sich automatisch bestimmen lassen(schon gefiltert)
        let gazeArray = getDataArrayClickmap(webgroup, "gaze");//[x,y,duration,user_id,timestamp]
        let mouseArray = getDataArrayClickmap(webgroup, "mouse");//[x,y,type,user_id,timestamp]
        let clicks = mouseArray.filter(mouse => mouse[2] === "click");

        //Werte bestimmen
        let fixationCount = gazeArray.length;
        let mouseDataCount = mouseArray.length;
        let clickCount = clicks.length;
        //Anzahl Shots,die Stimulus ergeben, Nutzeranzahl. Verweildauer
        let userCount = 0;
        let shotsIncluded = 0;
        let dwellTime = 0;
        for (let i in properties) {
            if (window.importedData.allUsers.includes(i)) {
                userCount++;
                shotsIncluded += properties[i].length;
                for (let visit of properties[i]) {
                    if (visit && visit.start != null && visit.end != null)
                        dwellTime += (visit.end - visit.start);
                }
            }
        }
        let fixationDuration = 0;
        for (let gaze of gazeArray) {
            fixationDuration += gaze[2];//duration
        }
        return {
            fixationCount: fixationCount,
            fixationDuration: fixationDuration,
            mouseDataCount: mouseDataCount,
            clickCount: clickCount,
            userCount: userCount,
            shotsIncluded: shotsIncluded,
            dwellTime: dwellTime
        };
    }
}