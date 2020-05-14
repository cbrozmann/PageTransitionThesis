//Diese Datei enthaelt die Visualisierung des Nutzerflusses. Sie erbt von Visualization.js.
let userflowWidth = 256,
    userflowHeightPerUser = 64;
let userflowHoverHeight = 550;
let userflowTextColor = "#000000";
let userflowSessionColor = "#777777";
let userflowTextSize = 16;
let userflowEmptyRectangleColor = "#b5e099";
let userflowEdgeColor = "#dae2e4";
let userflowEdgeHoverColor = "#ff0000";
let userflowDropoutColor = "#eb7469";
let userflowHorizontalPadding = 250;
let userflowVerticalPadding = 80;
let userflowHoverZ = 50;
let deleteUserflowHoverEdgeOnMouseLeave = true;
let deleteUserflowHoverNodeOnMouseLeave = false;
let userflowTextBackgroundColor = "#b7e5db";
//let userflowLabelMaxSize = 35;
let userflowNameOverflow = 10;

class Userflow extends Visualization {
    constructor(selectedWebsite = "amazon", frustumSize = 1000, camera_startPosition = {
        x: frustumSize / 2,
        y: -frustumSize / 2 + userflowTextSize + 2 * padding,
        z: 1000
    }, near = 1, far = 10000, backgroundColor = "#f7f7f7") {
        //initialisiere Visualization
        super(frustumSize, camera_startPosition, false, near, far, backgroundColor);
        this.selectedWebsite = selectedWebsite;
        //Methoden von der Clickmapklasse sollen auf Variablen der Klasse und Superklasse zugreifen koennen
        this.getLayer = this.getLayer.bind(this);
        this.drawGraph = this.drawGraph.bind(this);
        this.drawNodes = this.drawNodes.bind(this);
        this.drawEdges = this.drawEdges.bind(this);
        this.drawHeading = this.drawHeading.bind(this);
        this.drawDropouts = this.drawDropouts.bind(this);
        this.drawIntersectionNode = this.drawIntersectionNode.bind(this);
        this.drawIntersectionEdge = this.drawIntersectionEdge.bind(this);
        this.drawIntersectionDropout = this.drawIntersectionDropout.bind(this);
        this.getLayoutedEdges = this.getLayoutedEdges.bind(this);
        this.getRealAttentionFlow = this.getRealAttentionFlow.bind(this);
        //die Visualisierung wir initialisiert
        this.initialisation();
    }

    initialisation() {
        super.initialisation();
        changeHoverEvents();
        this.intersectedNode = {};
        this.intersectedEdge = {};
        this.intersectedDropout = {};
        let withLayer = window.withLayer = false;
        let layer = this.getLayer(withLayer);
        let sortingProperty = "webgroup";
        this.sortingProperty = sortingProperty;
        const sortedNodes = this.getSortedNodes(layer, {
            sortingProperty: this.sortingProperty,
            preloadPictures: false,
            withLayer: withLayer
        });
        //sortedNodes[index][sortingProperty]={rank,count,users} //users[user]={user,start,end,webgroup,image}
        this.nodes = sortedNodes;
        let layoutedNodes = this.getLayoutedNodes(sortedNodes, {
            sortingProperty: this.sortingProperty,
            verticalPadding: userflowVerticalPadding,
            horizontalPadding: userflowHorizontalPadding,
            userflowWidth: userflowWidth,
            userflowHeightPerUser: userflowHeightPerUser
        });
        this.layoutedNodes = layoutedNodes;
        let layoutedEdges = this.getLayoutedEdges(layoutedNodes);
        this.layoutedEdges = layoutedEdges;
        //Erstelle Container fuer Nodes und Edges
        this.nodeContainer = new THREE.Object3D();
        this.nodeTextContainer = new THREE.Object3D();
        this.edgeContainer = new THREE.Object3D();
        this.textContainer = new THREE.Object3D();
        this.dropoutContainer = new THREE.Object3D();
        this.hoverContainer = new THREE.Object3D();
        //der Container wird zu der Scene hinzugefuegt
        this.scene.add(this.nodeContainer);
        this.scene.add(this.nodeTextContainer);
        this.scene.add(this.edgeContainer);
        this.scene.add(this.textContainer);
        this.scene.add(this.dropoutContainer);
        this.scene.add(this.hoverContainer);
        this.drawGraph(layoutedNodes, layoutedEdges);

    }

    drawGraph(nodes = this.layoutedNodes, edges = this.layoutedEdges, zRectangle = 10, zText = zRectangle + 1, zEdge = zRectangle - 1, padding = 10, y = padding) {
        this.drawNodes(nodes, zRectangle, zText, padding);
        this.drawEdges(edges.edges, zEdge);
        let xs = [];
        for (let index = 0; index < nodes.length; index++) {
            xs.push(nodes[index][0].x);
        }
        this.drawHeading(edges.overview, xs, y, zText, padding);
        this.drawDropouts(edges.dropped, zEdge);
        this.preloadImages();
    }

    preloadImages() {
        let imageArray = [];
        for (let index in this.nodes) {
            for (let webgroup in this.nodes[index]) {
                if (this.nodes[index][webgroup] != null && this.nodes[index][webgroup].users != null) {
                    let user = Object.values(this.nodes[index][webgroup].users)[0];
                    let image = user.image;
                    if (!imageArray.includes(image)) {
                        imageArray.push(image);
                    }
                }
            }
            getAllTexturesOfArray(imageArray, {fullSizeImage: false});
        }
    }

    render() {
        super.render();
        //raycast Nodes
        this.raycastForIntersection(
            this.nodeContainer,
            this.intersectedNode,
            this.drawIntersectionNode,
            {
                deleteOnMouseLeave: deleteUserflowHoverNodeOnMouseLeave,
                useIntersectionArray: false,
                getImageName: false,
                clearHoverContainerOnNewIntersection: true,
                recursive: false
            });
        //raycast Edges
        this.raycastForIntersection(
            this.edgeContainer,
            this.intersectedEdge,
            this.drawIntersectionEdge,
            {
                deleteOnMouseLeave: deleteUserflowHoverEdgeOnMouseLeave,
                useIntersectionArray: false,
                getImageName: false,
                clearHoverContainerOnNewIntersection: true,
                recursive: false
            });
        //raycast Dropouts
        this.raycastForIntersection(
            this.dropoutContainer,
            this.intersectedDropout,
            this.drawIntersectionDropout,
            {
                deleteOnMouseLeave: deleteUserflowHoverEdgeOnMouseLeave,
                useIntersectionArray: false,
                getImageName: false,
                clearHoverContainerOnNewIntersection: true,
                recursive: false
            });
    }

    drawIntersectionNode(node, z = 50, rankName = "rank", usersName = "users", padding = 10) {
        if (node != null && node.userData != null) {
            //userdata=[index,rank]
            let userdata = node.userData;
            if (Array.isArray(userdata) && userdata.length > 1) {
                let index = userdata[0];
                let rank = userdata[1];
                let nodes = this.nodes[index];
                let users = undefined;
                nodes = Object.values(nodes);
                //finde Knoten, der getroffen wurde
                for (let i of nodes) {
                    if (i[rankName] == rank) {
                        users = i[usersName];
                        break;
                    }
                }
                //finde zugehoeriges Bild
                if (users !== undefined) {
                    let user1 = Object.values(users)[0];
                    if (user1 != null) {
                        let imageName = user1.image;
                        let webgroup = user1.webgroup;
                        if (imageName != null) {
                            let lowTexure = getTexture(imageName, {fullSizeImage: false});
                            //position Ermitteln
                            const vector = this.getMouseKoordinates();
                            //TextCanvas erstellen
                            let texts = [];
                            let nodeName = user1[this.sortingProperty];
                            texts.push(nodeName);
                            let userDataForDetailView = [];
                            for (let user of Object.keys(users)) {
                                let userInfo = users[user];
                                let userText = "Nutzer: " + userInfo.user;
                                let startTimeText = "Startzeit: " + this.getDurationText(userInfo.start);
                                let endTimeText = "Endzeit: " + this.getDurationText(userInfo.end);
                                texts.push(userText);
                                texts.push(startTimeText);
                                texts.push(endTimeText);
                                userDataForDetailView.push({
                                    user: userInfo.user,
                                    start: userInfo.start,
                                    end: userInfo.end
                                });
                            }
                            let gazeArray = getDataArrayUserflow(webgroup, userDataForDetailView);
                            let mouseArray = getDataArrayUserflow(webgroup, userDataForDetailView, "mouse");
                            //erstelle mit den Texten einen Textcanvas der Groesse 2*TimlineHeight und auch doppelter Textgroesse
                            //Breite des Textcanvas ist abhaenig von der Textgroesse
                            let textCanvas = createMultiLineTextCanvas(texts, {
                                textSize: userflowTextSize * 2,
                                fontColor: userflowTextColor,
                                padding: padding,
                                adjustWidthToText: true,
                                height: userflowHoverHeight,
                                backgroundColor: userflowTextBackgroundColor
                            });
                            //aus canvas wird Textur erstellt.
                            let textTexture = new THREE.CanvasTexture(textCanvas);
                            lowTexure.then((imageTexture) => {
                                if (imageTexture && imageTexture.image) {
                                    this.clearContainer(this.hoverContainer);
                                    let height = userflowHoverHeight;
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
                    }
                }
            }
        }
    }

    drawIntersectionEdge(intersectedEdge) {
        if (intersectedEdge != null && intersectedEdge.userData != null) {
            let edgeIndex = intersectedEdge.userData[0];
            drawBezierEdge(this.layoutedEdges.edges[edgeIndex], this.hoverContainer, userflowHoverZ, userflowEdgeHoverColor, "Hoverevent");
            let userInfo = intersectedEdge.userData[1];
            let index = userInfo[0];
            let target = userInfo[1];
            let source = userInfo[2];
            let users = this.edges[index][target][source]["users"];
            let text = arrayToCommaSeparatedString(users);
            const vector = this.getMouseKoordinates();
            this.drawHoverText(vector, this.hoverContainer, text);
        }
    }

    drawIntersectionDropout(dropout) {
        if (dropout != null && dropout.userData != null) {
            let userData = dropout.userData;
            let missingUsers = userData.missingUsers;
            let drop = this.layoutedEdges.dropped[userData.dropoutIndex];
            if (drop != null) {
                drawDropout(drop, this.hoverContainer, userflowHoverZ, userflowEdgeHoverColor, "Hoverevent");
                let text = arrayToCommaSeparatedString(missingUsers);
                const vector = this.getMouseKoordinates();
                this.drawHoverText(vector, this.hoverContainer, text);
            }
        }
    }


    drawHeading(overview, xs, y = padding, z = 10, padding = padding) {
        //loesche alle Inhalte, die schon im Container sind
        this.clearContainer(this.textContainer);
        this.textContainer = new THREE.Object3D();
        //der Container wird zu der Scene hinzugefuegt
        this.scene.add(this.textContainer);
        for (let index = 0; index < overview.length; index++) {
            //Ueberschrift Session wird berechnet
            let sumMax = 0;
            let sumActual = 0;
            for (let node in overview[index]) {
                sumMax += overview[index][node].max;
                sumActual += overview[index][node].actual;
            }
            let dropout = sumMax - sumActual;
            //Ueberschrift Session wird geschrieben
            let sessionText = "";
            //Sizungen werden hinzugefuegt;
            sessionText += sumMax + " Sitzungen, ";
            //Abbrueche werden hinzugefuegt
            sessionText += dropout + " Abbr\u00fcche"; //\u00fc=ue
            //sessionText wird geschrieben
            drawText(this.textContainer, sessionText, {
                x: xs[index],
                y: y,
                z: z,
                frontColor: userflowSessionColor,
                bold: false,
                alignment: "left",
                verticalAlignment: "super"
            }, {size: userflowTextSize});
            //Ueberschriften Interaktion wird geschrieben
            let interactionText = "";
            if (index === 0) {
                interactionText = "Startseiten";
            } else interactionText = index + ". Interaktion";
            drawText(this.textContainer, interactionText, {
                x: xs[index],
                y: y + 2 * padding + userflowTextSize,
                z: z,
                frontColor: userflowTextColor,
                bold: true,
                alignment: "left",
                verticalAlignment: "super"
            }, {size: userflowTextSize});
        }
    }

    drawEdges(edges = this.layoutedEdges.edges, zEdge = 5) {
        //loesche alle Inhalte, die schon im Container sind
        this.clearContainer(this.edgeContainer);
        this.edgeContainer = new THREE.Object3D();
        //der Container wird zu der Scene hinzugefuegt
        this.scene.add(this.edgeContainer);
        for (let edge in edges) {
            drawBezierEdge(edges[edge], this.edgeContainer, zEdge, userflowEdgeColor, [edge, edges[edge].edgeInformation])
        }
    }

    drawNodes(nodes = this.layoutedNodes, zRectangle = 10, zText = zRectangle + 1, padding = 10) {
        //loesche alle Inhalte, die schon im Container sind
        this.clearContainer(this.nodeContainer);
        this.clearContainer(this.nodeTextContainer);
        this.nodeContainer = new THREE.Object3D();
        this.nodeTextContainer = new THREE.Object3D();
        //der Container wird zu der Scene hinzugefuegt
        this.scene.add(this.nodeContainer);
        this.scene.add(this.nodeTextContainer);
        for (let index in nodes) {
            for (let node in nodes[index]) {
                let width = nodes[index][node].width;
                let height = nodes[index][node].height;
                let x = nodes[index][node].x;
                let y = nodes[index][node].y;
                let name = nodes[index][node].name;
                let count = String(nodes[index][node].count);
                drawEmptyPlane(this.nodeContainer, userflowEmptyRectangleColor, x, y, zRectangle, width, height, [index, node]);
                let drawName = this.getDrawName(name);
                let xText = x + padding;
                let yName = y + height - padding;
                let yCount = yName - padding - userflowTextSize;
                //draw Name
                drawText(this.nodeTextContainer, drawName, {
                    x: xText,
                    y: yName,
                    z: zText,
                    frontColor: userflowTextColor,
                    bold: false,
                    alignment: "left",
                    verticalAlignment: "sub"
                }, {size: userflowTextSize});
                //draw Count
                drawText(this.nodeTextContainer, count, {
                    x: xText,
                    y: yCount,
                    z: zText,
                    frontColor: userflowTextColor,
                    bold: true,
                    alignment: "left",
                    verticalAlignment: "sub"
                }, {size: userflowTextSize});
            }
        }
    }

    //sortiert die Layer aus (aktuell sucht nur Mainlayer)
    getLayer(withLayer = window.withLayer) {
        let layers = getAllLayersOfWebsite(this.selectedWebsite);
        if (!withLayer) {
            return getBestLayer(layers);
        } else
            return layers;
    }

    //bestimmt alle Knoten und Reihenfolgen
    // getNodes(layer, args = {
    //     sortingProperty: "webgroup",
    //     preloadPictures: false,
    //     withLayer: getWithLayer()
    // }, iterationName = "iteration") {
    //     let sortingProperty = args.sortingProperty ? args.sortingProperty : "webgroup"; //Werte sortingProperty: "webgroup" oder "image";//zum leichteren aendern von sortieren nach imageName oder webgroup_id
    //     let preloadPictures = args.preloadPictures ? args.preloadPictures : false; //bei preloadPictures ist Boolen ob schon bei dem ersten vorkommen eines Bildes diese geladen werden sollen.
    //     let withLayer = args.withLayer ? args.withLayer : getWithLayer(); //Wenn nur Nodes und Edges der Mainlayer gezeichnet werden sollen
    //     //nodes und edges fuer Rueckgabe. nodesHelper ist nur HelferVariable, in der alle Knotennamen als String einmalig gespeichert werden
    //     let nodes = {};
    //     for (let user of window.importedData.allUsers) {
    //         const sortedNodeArray = getAllNodesOfWebsiteForOneUser(this.selectedWebsite, user, {
    //             withLayer: withLayer,
    //             preloadPictures: preloadPictures,
    //             sortByStartTime: true
    //         });
    //         //Wenn nur Mainlayer
    //         if (!withLayer) {
    //             let countHelper = 0;
    //             for (let i = 0; i < sortedNodeArray.length; i++) {
    //                 let value = sortedNodeArray[i][sortingProperty];
    //                 if (nodes[value] == null) {
    //                     nodes[value] = {};
    //                 }
    //                 //Wenn noch kein Wert fuer diese Person existiert erstelle Array
    //                 if (nodes[value][user] == null) {
    //                     nodes[value][user] = [];
    //                 } //Wenn schon Wert vorhanden
    //                 //ueberspringe wenn Transition Knoten nicht aendert
    //                 if (nodes[value][user][nodes[value][user].length - 1] != null && nodes[value][user][nodes[value][user].length - 1][iterationName] === (i + countHelper - 1)) {
    //                     //Wenn Element schon vorhanden ersetze Endtime durch Endtime spaeteres Element
    //                     let last = nodes[value][user].pop();
    //                     last.end = sortedNodeArray[i].end;
    //                     nodes[value][user].push(last);
    //                     countHelper--;
    //                     continue;
    //                 }
    //                 //echte Transition wird gepushed
    //                 nodes[value][user].push({
    //                     [iterationName]: i + countHelper,
    //                     start: sortedNodeArray[i].start,
    //                     end: sortedNodeArray[i].end,
    //                     image: sortedNodeArray[i].image,
    //                     webgroup: sortedNodeArray[i].webgroup
    //                 });
    //             }
    //         }
    //     }
    //     return nodes;
    // }

    getSortedNodes(layer, args = {
        sortingProperty: "webgroup",
        preloadPictures: false,
        withLayer: getWithLayer(),
        rankName: "rank",
        countName: "count",
        usersName: "users"
    }) {
        //defaultWerte fuer Funktion werden gesetzt
        let sortingProperty = args.sortingProperty != null ? args.sortingProperty : this.sortingProperty;
        let preloadPictures = args.preloadPictures != null ? args.preloadPictures : false;
        let withLayer = args.withLayer !== undefined ? args.withLayer : getWithLayer();
        let rankName = args.rankName != null ? args.rankName : "rank";
        let countName = args.countName != null ? args.countName : "count";
        let usersName = args.usersName != null ? args.usersName : "users";
        let iterationName = "iteration";
        // let nodes = this.getNodes(layer, {
        //     sortingProperty: sortingProperty,
        //     preloadPictures: preloadPictures,
        //     withLayer: withLayer
        // }, iterationName);
        let nodes = this.getRealAttentionFlow();
        let nodeSequence = this.getNodeSequence(nodes, iterationName);
        let aggregatedNodeSequence = this.getAggregatedNodeSequence(nodeSequence, sortingProperty, rankName, countName, usersName);
        return aggregatedNodeSequence;
    }

    //erstellt aus den Knoten eine Sortiertesequenz
    getNodeSequence(nodes, iteration = "iteration") {
        let nodeSequence = [];
        let maxIteration = [];
        //finde MaxIteration.
        for (let i in nodes) {
            for (let property in nodes[i]) {
                if (Array.isArray(nodes[i][property])) {
                    let userProperty = nodes[i][property];
                    for (let j in userProperty) {
                        let iterationOfUser = userProperty[j][iteration];
                        maxIteration.push(iterationOfUser);
                    }
                }
            }
        }
        maxIteration = Math.max(...maxIteration);
        //initialisiere nodeSequence mit MaxIteration+1 vielen leeren Arrays
        for (let i = 0; i < maxIteration + 1; i++) {
            nodeSequence[i] = [];
        }
        //fuelle die leeren Arrays in drawing Order
        for (let i in nodes) {
            for (let user in nodes[i]) {
                if (Array.isArray(nodes[i][user])) {
                    let userProperty = nodes[i][user];
                    for (let j in userProperty) {
                        let iterationOfUser = userProperty[j][iteration];
                        nodeSequence[iterationOfUser].push({
                            user: user,
                            start: userProperty[j].start,
                            end: userProperty[j].end,
                            webgroup: userProperty[j].webgroup,
                            image: userProperty[j].image
                        });
                    }
                }
            }
        }
        return nodeSequence;
    }

    //Aggregiert die Knotensequenz
    getAggregatedNodeSequence(nodeSequence, sortingProperty = "webgroup", rankName = "rank", countName = "count", usersName = "users") {
        let aggregatedNodeSequence = [];
        let helper = [];
        for (let i in nodeSequence) {
            for (let j in nodeSequence[i]) {
                if (nodeSequence[i][j] != null && nodeSequence[i][j][sortingProperty] != null) {
                    if (helper[i] == null)
                        helper[i] = {};
                    let prop = nodeSequence[i][j][sortingProperty];
                    if (helper[i][prop] == null)
                        helper[i][prop] = [];
                    helper[i][prop].push(nodeSequence[i][j]);
                }
            }
            let helperStep = [];
            for (let prop in helper[i]) {
                helperStep.push(helper[i][prop]);
            }
            //Die Propertys werden absteigend nach Anzahl Nutzer sortiert
            let sortedArray = helperStep.sort((a, b) => {let userdifference=b.length - a.length;
            if(userdifference!=0){
                return userdifference;
            }
            else{
                if(b.length>0){
                    return a[0][sortingProperty].localeCompare(b[0][sortingProperty], 'en', { numeric: true });
                }
                //sollte nicht eintretten
                return userdifference;
            }
            });
            //der sortierte Array wird benutzt um den Rang jedes Knoten zu bestimmen
            let step = {};
            for (let rank in sortedArray) {
                let prop = sortedArray[rank][0][sortingProperty];
                if (step[prop] == null) {
                    step[prop] = {};
                }
                //Weise jedem Schritt
                step[prop][rankName] = parseInt(rank);
                step[prop][countName] = sortedArray[rank].length;
                step[prop][usersName] = {};
                for (let number in sortedArray[rank]) {
                    let user = sortedArray[rank][number].user;
                    step[prop][usersName][user] = sortedArray[rank][number];
                }
            }
            aggregatedNodeSequence[i] = step;
        }
        return aggregatedNodeSequence; //hat die Form [index]=>[sortingProperty]=>userarray,rang
    }

    getLayoutedNodes(nodes, args = {
        sortingProperty: this.sortingProperty,
        userflowWidth: userflowWidth,
        userflowHeightPerUser: userflowHeightPerUser,
        verticalPadding: padding,
        horizontalPadding: padding
    }) {
        let sortingProperty = args.sortingProperty != null ? args.sortingProperty : this.sortingProperty;
        let userflowWidth = args.userflowWidth != null ? args.userflowWidth : userflowWidth;
        let userflowHeightPerUser = args.userflowHeightPerUser != null ? args.userflowHeightPerUser : userflowHeightPerUser;
        let verticalPadding = args.verticalPadding != null ? args.verticalPadding : padding;
        let horizontalPadding = args.horizontalPadding != null ? args.horizontalPadding : padding;
        //sortedNodes[index][sortingProperty]={rank,count,users} //users[user]={user,start,end,webgroup,image}
        //layout gibt Position links unten an
        //layoutedNodes mit leeren Arrays initialisiert
        let layoutedNodes = [];
        for (let i = 0; i < nodes.length; i++) {
            layoutedNodes[i] = [];
        }
        let xStart = 0;
        for (let index = 0; index < nodes.length; index++) {
            //fuer jeden Rang (Anzahl an Propertys von Objekt)
            let yStart = 0;
            for (let rank = 0; rank < Object.keys(nodes[index]).length; rank++) {
                for (let node in nodes[index]) {
                    if (nodes[index][node].rank == rank) {
                        let count = nodes[index][node].count;
                        let height = count * userflowHeightPerUser;
                        let width = userflowWidth;
                        let name = node;
                        let x = xStart;
                        let y = yStart - height;
                        let layoutedNode = {name: name, count: count, x: x, y: y, width: width, height: height};
                        layoutedNodes[index].push(layoutedNode);
                        yStart -= (height + verticalPadding);
                    }
                }
            }
            xStart += userflowWidth + horizontalPadding;
        }
        return layoutedNodes;
    }

    getDrawName(name, splitChar = "_") {
        //zuerst wird der Teil bis 2 mal Splitchar ausgegeben, dann ..., dann letzten 10(bzw. userflowNameOverflow viele) Zeichen
        let parts = name.split(splitChar);
        //die ersten 2 Namensteile werden bestimmt
        if (parts.length > 1) {
            let firstPart = parts[0] + splitChar + parts[1];
            //Wenn Name abgekuerzt werden muss
            if (name.length - (firstPart.length + userflowNameOverflow + 3) > 0) {
                let result = firstPart + "..." + name.substring(name.length - userflowNameOverflow, name.length);
                return result;
            }
        }
        return name;
    }

    getLayoutedEdges(nodes, usersName = "users", countName = "count", rankName = "rank") {
        let edges = this.getEdges(nodes, usersName, countName, rankName);
        this.edges = edges;
        let layoutedEdges = [];
        let dropout = [];
        let edgeOverview = [];
        for (let index = 0; index < nodes.length - 1; index++) {
            edgeOverview[index] = [];
            let targetHelper = [];
            for (let node in nodes[index]) {
                let width = nodes[index][node].width;
                let height = nodes[index][node].height;
                let x = nodes[index][node].x;
                let y = nodes[index][node].y;
                let name = nodes[index][node].name;
                let rank = node;
                let nodeUsers = Object.keys(this.nodes[index][name][usersName]);
                let users = [];
                let count = nodes[index][node][countName];
                let keyCount = 0;
                //key ist userName
                //finde Zielknoten
                let startX = x + width;
                if (edges[index]) {
                    for (let targetNode in edges[index]) {
                        let startYTop = y + height - (keyCount * userflowHeightPerUser);
                        //Wenn Ziel gefunden
                        if (edges[index][targetNode][name] != null) {
                            let targetCount = edges[index][targetNode][name][countName];
                            for (let user of edges[index][targetNode][name][usersName])
                                users.push(user);
                            keyCount += targetCount;
                            if (targetHelper[targetNode] == null) {
                                targetHelper[targetNode] = 0;
                            }
                            if (this.nodes[index + 1][targetNode] != null && this.nodes[index + 1][targetNode][rankName] != null) {
                                let rank = this.nodes[index + 1][targetNode][rankName];
                                //     if (this.nodes[index + 1][webgroup][usersName][user] != null) {
                                let endX = nodes[index + 1][rank].x;
                                let usersBefore = targetHelper[targetNode];
                                targetHelper[targetNode] += targetCount;
                                //calculate users before
                                let startYBottom = startYTop - (targetCount * userflowHeightPerUser);
                                let endYTop = nodes[index + 1][rank].y + nodes[index + 1][rank].height - usersBefore * userflowHeightPerUser;
                                let endYBottom = endYTop - (targetCount * userflowHeightPerUser);
                                layoutedEdges.push({
                                    startTop: new THREE.Vector2(startX, startYTop),
                                    startBottom: new THREE.Vector2(startX, startYBottom),
                                    endTop: new THREE.Vector2(endX, endYTop),
                                    endBottom: new THREE.Vector2(endX, endYBottom),
                                    edgeInformation: [index, targetNode, name]
                                });
                            }
                        }
                    }
                }
                if (count !== keyCount) {
                    let missingUsers = [];
                    for (let i of nodeUsers) {
                        if (!users.includes(i)) {
                            missingUsers.push(i);
                        }
                    }
                    let top = new THREE.Vector2(startX, y + (count - keyCount) * userflowHeightPerUser);
                    let bottom = new THREE.Vector2(startX, y);
                    let dropped = {top: top, bottom: bottom, index: index, name: name, missingUsers: missingUsers};
                    dropout.push(dropped);
                }
                edgeOverview[index][name] = {max: count, actual: keyCount};
            }
        }
        //fuege letzte Nodereihe hinzu mit alle als dropOut
        for (let node of nodes[nodes.length - 1]) {
            let startX = node.x + node.width;
            let top = new THREE.Vector2(startX, node.y + node.height);
            let bottom = new THREE.Vector2(startX, node.y);
            let missingUsers = Object.keys(this.nodes[nodes.length - 1][node.name][usersName]);
            let dropped = {
                top: top,
                bottom: bottom,
                index: nodes.length - 1,
                name: node.name,
                missingUsers: missingUsers
            };
            dropout.push(dropped);
        }
        //fuege letzte Nodereihe hinzu mit alle als dropOut
        for (let node of nodes[nodes.length - 1]) {
            let name = node.name;
            let edge = {};
            edge[name] = {max: node[countName], actual: 0};
            edgeOverview.push(edge);
        }
        //rueckgabe
        return {edges: layoutedEdges, overview: edgeOverview, dropped: dropout};
    }

    getEdges(nodes, usersName = "users", countName = "count", rankName = "rank") {
        let edges = [];
        for (let index = 0; index < nodes.length - 1; index++) {
            let edgesHelper = {};
            for (let node in nodes[index]) {
                let name = nodes[index][node].name;
                // let count = nodes[index][node][countName];
                let users = this.nodes[index][name][usersName];
                //key ist userName
                for (let user of Object.keys(users)) {
                    //finde Zielknoten
                    for (let webgroup in this.nodes[index + 1]) {
                        //Wenn Ziel gefunden
                        if (this.nodes[index + 1][webgroup] && this.nodes[index + 1][webgroup][usersName]) {
                            if (this.nodes[index + 1][webgroup][usersName][user] != null) {
                                //zaehle nutzer, die schon vorher zu dem Knoten uebergegangen sind
                                let usersBefore = 0;
                                if (edgesHelper[webgroup] == null) {
                                    edgesHelper[webgroup] = {
                                        [countName]: 1,
                                        [name]: {[countName]: 1, [usersName]: [user]}
                                    };
                                } else {
                                    if (edgesHelper[webgroup][countName] != null) {
                                        //wie viele Nutzer sind vorher schon zum Knoten uebergegangen
                                        usersBefore = edgesHelper[webgroup][countName]++;
                                        //wenn von diesem Knoten keiner uebergegangen ist initialisiere mit 1
                                        if (edgesHelper[webgroup][name] == null) {
                                            edgesHelper[webgroup][name] = {[countName]: 1, [usersName]: [user]};
                                        } else {
                                            //sonst zaehle um 1 hoch
                                            if (edgesHelper[webgroup][name][countName] != null) {
                                                edgesHelper[webgroup][name][countName]++;
                                                edgesHelper[webgroup][name][usersName].push(user);
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
            //sort edgesHelper by rank
            let keysSorted = Object.keys(edgesHelper).sort((a, b) => {
                return this.nodes[index + 1][a][rankName] - this.nodes[index + 1][b][rankName]
            });
            let result = [];
            for (let key of keysSorted) {
                result[key] = edgesHelper[key];
            }
            edges.push(result);
        }
        return edges;
    }

    drawDropouts(dropouts = this.layoutedEdges.dropped, zEdge = 10) {
        //loesche alle Inhalte, die schon im Container sind
        this.clearContainer(this.dropoutContainer);
        this.dropoutContainer = new THREE.Object3D();
        //der Container wird zu der Scene hinzugefuegt
        this.scene.add(this.dropoutContainer);

        for (let dropout in dropouts) {
            let userData = {
                index: dropouts[dropout].index,
                node: dropouts[dropout].name,
                missingUsers: dropouts[dropout].missingUsers,
                dropoutIndex: dropout
            };
            drawDropout(dropouts[dropout], this.dropoutContainer, zEdge, userflowDropoutColor, userData);
        }
    }

    drawHoverText(vector, container = this.scene, text = "") {
        drawText(container, text, {
            x: vector.x,
            y: vector.y,
            z: userflowHoverZ + 1,
            frontColor: userflowTextColor,
            alignment: "center",
            verticalAlignment: "super"
        }, {size: userflowTextSize * 2});
    }

    getRealAttentionFlow(sortingProperty = "web_group_id", iterationName = "iteration") {
        let selectedLayer = getSelectedUserAndLayer();
        let nodes = {};
        for (let user of window.importedData.allUsers) {
            let gazeArray = [];
            for (let webgroup in window.importedData.gaze) {
                if (selectedLayer != null && selectedLayer[user] != null && selectedLayer[user].includes(getLayerOfWebgroup(webgroup))) {
                    for (let gazeEntry in window.importedData.gaze[webgroup][user]) {
                        gazeArray.push(window.importedData.gaze[webgroup][user][gazeEntry]);
                        //Filtering
                    }
                }
            }
            gazeArray = sortArrayByProperty(gazeArray, "timestamp", "duration");

            let countHelper = 0;
            for (let i = 0; i < gazeArray.length; i++) {
                let value = gazeArray[i][sortingProperty];
                if (nodes[value] == null) {
                    nodes[value] = {};
                }
                //Wenn noch kein Wert fuer diese Person existiert erstelle Array
                if (nodes[value][user] == null) {
                    nodes[value][user] = [];
                } //Wenn schon Wert vorhanden
                //ueberspringe wenn Transition Knoten nicht aendert
                if (nodes[value][user][nodes[value][user].length - 1] != null && nodes[value][user][nodes[value][user].length - 1][iterationName] === (i + countHelper - 1)) {
                    //Wenn Element schon vorhanden ersetze Endtime durch Endtime spaeteres Element
                    let last = nodes[value][user].pop();
                    last.end = parseInt(gazeArray[i].timestamp) + parseInt(gazeArray[i].duration);
                    nodes[value][user].push(last);
                    countHelper--;
                    continue;
                }
                //echte Transition wird gepushed
                const start = parseInt(gazeArray[i].timestamp);
                let end = parseInt(gazeArray[i].timestamp) + parseInt(gazeArray[i].duration);
                let webgroup = gazeArray[i].web_group_id;
                let image = window.importedData.webGroupToImageMapping[webgroup].image;
                nodes[value][user].push({
                    [iterationName]: i + countHelper,
                    start: start,
                    end: end,
                    image: image,
                    webgroup: webgroup
                });
            }
        }
        return nodes;
    }
}

/**
 * @return {string}
 */
function arrayToCommaSeparatedString(array) {
    let text = "";
    for (let i = 0; i < array.length - 1; i++) {
        text += array[i] + ", ";
    }
    text += array[array.length - 1];
    return text;
}