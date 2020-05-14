//Diese Datei soll die generalisierte Klasse der Visualisierungen sein. Diese Klasse ist abstrakt/Prototype und soll von den eigentlichen Visualisierungen spezialisiert werden.
let moreThanOneSelectable = false;

class Visualization {
    //Constructor
    constructor(frustumSize = 1000, cameraStartPosition = {
        x: 0,
        y: 0,
        z: 0
    }, startLeft = true, near = 1, far = 1000, backgroundColor = "#1ab394", cameraMovingFactor = 1000) {
        //Infotext wird erstellt und zum DIv hinzugefügt
        let infotext = document.createRange().createContextualFragment(`<div id="info" style="position: absolute; top: 2px;width: 100%;text-align: center;z-index: 2;display:block;"><p style="font-size:10px;">F: Vollbildansicht, R: Kamera zur Ausgangsposition, Mausrad: Zoom, Maustasten: Navigation, Klick auf Hoverevent: Schließt sich nicht bis zum nächsten Klick.</p></div>`);
        //CanvasDiv ist div in dem der Visualisierungscanvas ist
        document.getElementById("visualizationsCanvasDiv").append(infotext);
        //frustum wird gesetzt
        this.clickIntersected = {};
        this.frustumSize = frustumSize;
        this.backgroundColor = backgroundColor;
        //Kamera-Start-Position wird gesetzt
        this.cameraStartPosition = cameraStartPosition;
        // //Keyboard und clock werden gesetzt fuer Keyboardeingaben
        // this.clock = new THREE.Clock();
        // this.keyboard = new KeyboardState();
        this.startLeft = startLeft;
        //Mauskoordinaten
        this.mouse = new THREE.Vector2();
        //Erstelle HoverContainerfuer Picking
        this.hoverContainer = new THREE.Object3D();
        this.pauseHovering = false;
        //eine Movevariable, die die Bewegung von der Start-Position aus enthaelt
        this.initialMove = {x: 0, y: 0, z: 0, zoom: 0, cameraMovingFactor: cameraMovingFactor};
        //copy initial Move
        this.move = Object.assign({}, this.initialMove);
        //falls Visualisierung einen Rand haben soll, nach links oder rechts.
        this.doLimitPan = false;
        //eine Box um die Visualisierung einzuschraenken
        this.visualizationBox = {
            min: new THREE.Vector2(-Infinity, -Infinity),
            max: new THREE.Vector2(Infinity, Infinity)
        };
        //visualizationsCanvasDiv wird resized.(Canvas div soll den Rahmen fuer den Canvas setzen)
        let wrapper = $("#visualizationsCanvasDiv");
        wrapper.height((window.innerHeight * (wrapper.width() / window.innerWidth)));
        //Das Verhaeltnis von Weite zu Hoehe wird berechnet
        let aspect = wrapper.width() / wrapper.height();
        //camera wird initialisiert mit(left,right,top,bottom,near,far)
        //Wenn Kamera links starten soll(linke Ecke des Canvas = 0) sonst startet Kamera in der Mitte
        if (this.startLeft)
            this.camera = new THREE.OrthographicCamera(0, frustumSize * aspect, frustumSize / 2, frustumSize / -2, near, far);
        else
            this.camera = new THREE.OrthographicCamera(frustumSize * aspect / -2, frustumSize * aspect / 2, frustumSize / 2, frustumSize / -2, near, far);
        //Scene wird initialisiert mit Hintergrundfarbe 
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(backgroundColor);
        //renderer wird initialisiert im Canvas
        this.renderer = new THREE.WebGLRenderer({
            canvas: canvas,
            alpha: true,
            preserveDrawingBuffer: true,
            autoClear: true
        });
        //PixelRatio soll von dem Geraet abghaengen
        this.renderer.setPixelRatio(window.devicePixelRatio);
        //Renderer wird resized auf die Groesse des CanvasDivs
        this.renderer.setSize(wrapper.width(), wrapper.height());
        //Methoden von der Visualizationklasse sollen auf Variablen der Klasse zugreifen koennen
        this.onWindowResize = this.onWindowResize.bind(this);
        this.onMouseMove = this.onMouseMove.bind(this);
        this.onMouseWheel = this.onMouseWheel.bind(this);
        this.onMouseDown = this.onMouseDown.bind(this);
        this.onMouseUp = this.onMouseUp.bind(this);
        this.animate = this.animate.bind(this);
        this.render = this.render.bind(this);
        this.raycastForIntersection = this.raycastForIntersection.bind(this);
        this.onDocumentKeyDown = this.onDocumentKeyDown.bind(this);
        this.initialisation = this.initialisation.bind(this);
        this.copyHoverContainer = this.copyHoverContainer.bind(this);
        //ein resize EventListener wird hinzugefuegt
        window.addEventListener('resize', this.onWindowResize, false);
        this.renderer.domElement.addEventListener('mousemove', this.onMouseMove, false);
        this.renderer.domElement.addEventListener('wheel', this.onMouseWheel, false);
        this.renderer.domElement.addEventListener('mousedown', this.onMouseDown, false);
        this.renderer.domElement.addEventListener('mouseup', this.onMouseUp, false);
        window.addEventListener('keydown', this.onDocumentKeyDown, false);
        //Eventlistener fuer Fullscreen wird gesetzt
        //das visualizationsCanvasDiv im Dokument wird der Variable canvasDiv zugeteilt
        let canvasDiv = document.getElementById("visualizationsCanvasDiv");
        //EvenetListener: bei druecken von 'f' oder doubleclick(wenn dblclick=true) wird Element(wenn nicht definiert document.body) fullScreen gesetzt
        THREEx.FullScreen.bindKey({charCode: 'f'.charCodeAt(0), element: canvasDiv, dblclick: false});
        //Camera wird initialisiert
        this.camera.position.x = this.cameraStartPosition.x;
        this.camera.position.y = this.cameraStartPosition.y;
        this.camera.position.z = this.cameraStartPosition.z;
        this.camera.zoom = 1;
        this.camera.updateProjectionMatrix();
        //Controls wird intiialisiert als Orbit Control nur ohne Rotationen
        this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
        this.controls.target.set(this.cameraStartPosition.x, this.cameraStartPosition.y, this.cameraStartPosition.z);
        this.controls.update();
        this.controls.minPolarAngle = Math.PI / 2;
        this.controls.maxPolarAngle = Math.PI / 2;
        this.controls.minAzimuthAngle = 0; // radians
        this.controls.maxAzimuthAngle = 0; // radians    
        this.controls.enableRotate = false;
        //////////////////////////////////////
        // Set zoom related parameters
        //////////////////////////////////////

        this.controls.enableZoom = true;
        this.controls.zoomSpeed = 0.8;
        this.controls.minDistance = this.camera.near;
        this.controls.maxDistance = this.camera.far;
        this.controls.minZoom = 0.1;
        this.controls.maxZoom = Infinity;


        //////////////////////////////////////
        // Set pan related parameters
        //////////////////////////////////////

        this.controls.enablePan = true;
        this.controls.panSpeed = 1;
        this.controls.screenSpacePanning = true;
        //this.controls.enableDamping = true;
        //linke und rechte Maustaste bewirken das gleiche
        this.controls.mouseButtons.LEFT = this.controls.mouseButtons.RIGHT;
        //Animation wird gestartet
        //Animation updatet die Kamera je nach Tastatureingabe und startet den Renderer
        if (window.actionDrivenRender)
            this.render();
        this.animate();
    }

    //Methode falls das Fenster in der Groesse veraendert wird
    onWindowResize() {
        //Das Div in dem der VisualizationsCanvas liegt wird var wrapper zugewiesen
        let wrapper = $('#visualizationsCanvasDiv');
        //die Hoehe des divs wird entsprechend dem verhältnis der vorhandenenn hoehe und dem canvas div zu vorhandenen Hoehe angepasst
        wrapper.height((window.innerHeight * (wrapper.width() / window.innerWidth)));
        //Aspect = Hoehen zu Breiten Verhaeltnis
        var aspect = $("#visualizationsCanvasDiv").width() / $("#visualizationsCanvasDiv").height();
        //Wenn Kamera links starten soll(linke Ecke des Canvas = 0) sonst startet Kamera in der Mitte
        if (this.startLeft) {
            this.camera.left = 0;
            this.camera.right = this.frustumSize * aspect;
        } else {
            this.camera.left = this.frustumSize * aspect / -2;
            this.camera.right = this.frustumSize * aspect / 2;
        }
        //Oberes und unteres Ende der Kamera wird gesetzt 
        this.camera.top = this.frustumSize / 2;
        this.camera.bottom = this.frustumSize / -2;
        //Kamera wird aktualisiert
        this.camera.updateProjectionMatrix();
        this.camera.updateMatrixWorld();
        //Renderer Groesse wird neu gesetzt
        this.renderer.setSize(wrapper.width(), wrapper.height());
        if (window.actionDrivenRender)
            this.render();
    }

    //default initialisation sollte in den Visualisierungen ueberschrieben werden
    initialisation() {
        this.clearContainer(this.scene);
        this.clickContainer = new THREE.Object3D();
        this.scene.add(this.clickContainer);
    }

    //Methode um Mousekoordinaten zu berechnen und zu aktualisieren
    onMouseMove(event) {
        //Mausposition soll fuer den Canvas(bzw. auch den CanvasDiv berechnet werden)
        event.preventDefault();
        let wrapper = $('#visualizationsCanvasDiv');
        const pos = this.getCanvasRelativePosition(event);
        //in mouse(2d Vektor) wird aktuelle x und y Position der Maus in der Szene gespeichert
        //wert zwischen -1 und 1, wenn auf Canvas und |1|> wenn nicht auf Canvas
        this.mouse.x = (pos.x / wrapper.width()) * 2 - 1;
        this.mouse.y = -(pos.y / wrapper.height()) * 2 + 1;
        //rendert das Bild neu
        if (window.actionDrivenRender)
            this.render();
    }

    onMouseDown() {
        this.lastPosition = {x: this.mouse.x, y: this.mouse.y};
    }

    onMouseUp() {
        if (this.lastPosition != null) {
            if (this.lastPosition.x == this.mouse.x && this.lastPosition.y == this.mouse.y) {
                this.pauseHovering = false;
                if (!moreThanOneSelectable)
                    this.clearContainer(this.clickContainer);
                this.raycastForIntersection(this.scene, this.clickIntersected, (intersected) => {
                    if (intersected != null) {
                        if (intersected.length > 0) {
                            let selected = intersected[0];
                            if (selected != null && selected.object != null) {
                                let elem = selected.object;
                                if ((elem.userData == "Hoverevent" || (elem.parent != null && elem.parent.userData == "Hoverevent"))) {
                                    this.copyHoverContainer(this.clickContainer);
                                    // this.clickContainer.add(elem.parent);
                                    this.pauseHovering = true;
                                }
                                // else if (elem.userData == "Hoverevent") {
                                //     this.copyHoverContainer(this.clickContainer);
                                //     // this.clickContainer.add(elem);
                                //     this.pauseHovering = true;
                                // }
                            }
                        }
                    }
                }, {useIntersectionArray: true, recursive: true, linePrecision: linePrecision});
            }
        }
    }

    copyHoverContainer(container) {
        let test = this.hoverContainer.clone(true);
        container.add(test);
        // copyContainer(this.hoverContainer, container);
        // function copyContainer(container, resultContainer){
        //     if(container && container.children && container.children.length>0){
        //         for(let child of container.children){
        //             let newChild = new THREE.Object3D();
        //             if(child && child.children && container.children.length>0){
        //                 copyContainer(child.children, newChild);
        //             }
        //             else newChild=child;
        //             resultContainer.add(newChild);
        //         }
        //     }
        // }
    }


    onMouseWheel(event) {
        event.preventDefault();
        if (window.actionDrivenRender)
            this.render();
    }

    //Methode um die Mouseposition relativ zu dem Canvas zu bestimmen
    getCanvasRelativePosition(event) {
        const rect = canvas.getBoundingClientRect();
        return {
            x: event.clientX - rect.left,
            y: event.clientY - rect.top,
        };
    }

    //startet die Animation loop
    animate() {
        if (!window.actionDrivenRender)
            this.render();
        //aktualisiert die Camera
        //this.controls.update();
        //Zeichnet das Bild zum naechsten Visualisierungszeitpunkt (requestanimationFrame) und nimmt eine Callbackfunktion
        requestAnimationFrame(this.animate);
    }

    // Die Render Methode
    render() {
        //Code to Limit the Panning on left,top,right,bottom
        if (this.doLimitPan) {
            //Code aus https://jsfiddle.net/hw9p5njr/1/ um einen Rand fuer das Panning zu machen
            //Linker Rand wird geprüft.
            let x1 = this.camera.position.x + (this.camera.left / this.camera.zoom);
            let x1a = Math.max(x1, this.visualizationBox.min.x);
            let pos_x = x1a - (this.camera.left / this.camera.zoom);
            //Rechter Rand wird geprüft
            let x2 = pos_x + (this.camera.right / this.camera.zoom);
            let x2a = Math.min(x2, this.visualizationBox.max.x);
            pos_x = x2a - (this.camera.right / this.camera.zoom);
            //unterer Rand wird geprüft
            let y1 = this.camera.position.y + (this.camera.bottom / this.camera.zoom);
            let y1a = Math.max(y1, this.visualizationBox.min.y);
            let pos_y = y1a - (this.camera.bottom / this.camera.zoom);
            //oberer Rand wird geprüft
            let y2 = pos_y + (this.camera.top / this.camera.zoom);
            let y2a = Math.min(y2, this.visualizationBox.max.y);
            pos_y = y2a - (this.camera.top / this.camera.zoom);

            this.camera.position.set(pos_x, pos_y, this.camera.position.z);
            this.camera.lookAt(pos_x, pos_y, this.controls.target.z);
            this.controls.target.set(pos_x, pos_y, 0);
            this.controls.update();
        }
        //Funktion wird mit dem renderer gesetzt
        this.renderer.render(this.scene, this.camera);
        this.controls.update();
    }

    //Methode um einen Container sauber zu leeren
    clearContainer(container) {
        if (container && container.children)
            while (container.children.length > 0) {
                let obj = container.children[0];
                if (obj && obj.children != null)
                    for (let child in obj.children)
                        this.clearContainer(obj.children[child]);
                //entfernt Geometry
                if (obj && obj.geometry) obj.geometry.dispose();
                //entfernt Material, egal ob Liste oder nur ein Material
                if (obj && obj.material) {
                    if (Array.isArray(obj.material)) {
                        for (let i = 0; i < obj.material.length; i++)
                            this.disposeAllMaterialProperties(obj.material[i]);
                    } else this.disposeAllMaterialProperties(obj.material);
                }
                //entfernt, nachdem alle Materialien und Geometrien entfernt wurden das Objekt aus der Liste
                container.remove(container.children[0]);
            }
    }

    //Methode um Mausintersections mittels Raycasting zu finden
    raycastForIntersection(container = this.scene, intersected = this.intersected, callback = (function () {
    }), args = {
        deleteOnMouseLeave: true,
        useIntersectionArray: false,
        getImageName: false,
        clearHoverContainerOnNewIntersection: true,
        recursive: false,
        linePrecision: 1
    }) {
        //fehlende Werte in args werden durch defaultWerte ersetzt
        let deleteOnMouseLeave = args.deleteOnMouseLeave != null ? args.deleteOnMouseLeave : true,
            useIntersectionArray = args.useIntersectionArray != null ? args.useIntersectionArray : false,
            getImageName = args.getImageName != null ? args.getImageName : false,
            clearHover = args.clearHoverContainerOnNewIntersection != null ? args.clearHoverContainerOnNewIntersection : true,
            recursive = args.recursive != null ? args.recursive : false,
            linePrecision = args.linePrecision != null ? args.linePrecision : 1;
        //erstelle Raycaster
        if (!this.pauseHovering) {
            let raycaster = new THREE.Raycaster();
            raycaster.linePrecision = linePrecision;
            //setze Raycaster mit Mausposition und Kamera
            raycaster.setFromCamera(this.mouse, this.camera);
            //wenn der Container existiert
            if (container != null) {
                //pruefe auf Intersections mit dem Container
                let intersects = raycaster.intersectObjects(container.children, recursive);
                //wenn intersections
                if (intersects.length > 0) {
                    //wenn der ganze Array behandelt werden soll gebe ihn in die Callbackfunktion
                    if (useIntersectionArray) {
                        callback(intersects);
                    } else {
                        if (intersected == null) {
                            intersected = {};
                        }
                        // wenn die naeste intersection ungleich der schon ausgewaehlten intersection
                        if (intersected.val !== intersects[0].object) {

                            //die (raeumlich) naehste Intersection wird ausgewaehlt
                            intersected.val = intersects[0].object;
                            let intersect = intersects[0].object;
                            if (clearHover) {
                                this.clearContainer(this.hoverContainer);
                            }
                            //extrahiere aus source den Bildnamen und fuehre damit drawIntersectedImage aus
                            if (getImageName) {
                                //Wenn das Material eine SourceURL hat.
                                if (intersect.material && intersect.material.map && intersect.material.map.image && intersect.material.map.image.src) {
                                    //source bekommt den Wert der SourceURL
                                    let source = intersect.material.map.image.src;
                                    //teile die URL an /
                                    let split = source.split("/");
                                    //Der letzte Teil der URL ist der Bildname
                                    let imageName = split[split.length - 1];
                                    //Wenn texture pot als canvasTexture und title uebergeben // let imageName = this.intersected.material.map.image.title;
                                    callback(imageName);
                                }
                            }
                            //Wenn nicht der Bildname gesucht wird wird callbackfunktion sofort aufgerufen
                            else
                                callback(intersected.val);
                        }
                    }
                }
                //wenn keine intersection
                else {
                    //wenn das HoverPlane geloescht werden soll, wenn man das Bild verlaessst tue dies
                    if (intersected != null && intersected.val != null && deleteOnMouseLeave) {
                        this.clearContainer(this.hoverContainer);
                        intersected.val = null;
                    }
                }
            }
        }
    }

    //Methode um ein Material sauber zu leeren
    disposeAllMaterialProperties(material) {
        if (material) {
            //in case of map, bumpMap, normalMap, envMap ...
            Object.keys(material).forEach(prop => {
                if (!material[prop])
                    return;
                if (material[prop] !== null && typeof material[prop].dispose === 'function')
                    material[prop].dispose();
            });
            material.dispose();
        }
    }

    getDurationText(duration, decimalPlaces = 1) {
        return ((duration / 1000).toFixed(decimalPlaces) + " s");
    }

    onDocumentKeyDown(event) {
        let keyCode = event.keyCode;
        if (keyCode === 82 && this.controls) {//wenn r gedrueckt wurde richte Kamera auf Anfang
            this.controls.reset();
        }
    }

    //Bestimme Mausekoordinaten in Weltkoordinaten
    getMouseKoordinates() {
        const vector = new THREE.Vector3();
        vector.set(this.mouse.x, this.mouse.y, (this.camera.near + this.camera.far) / (this.camera.near - this.camera.far));
        vector.unproject(this.camera);
        return vector;
    }

    getUserCountInProperties(properties) {
        let usercount = 0;
        for (let i in properties) {
            if (window.importedData.allUsers.includes(i))
                usercount++;
        }
        return usercount;
    }

}

//berechnet den besten Layer und gibt ihn zurueck
function getBestLayer(layers = []) {
    //finde den besten Layer (z.B. mit den meisten Eyetracking- und Mausdaten)
    // let bestLayerHelper = {};
    // for (let layerNumber in layers) {
    //     //der in dem Schleifendurchlauf betrachtete Layer
    //     const layer = layers[layerNumber];
    //     // bestLayerHelper[layer] = 0;
    //     bestLayerHelper[layer] = 0 - layer.length;
    // }
    let bestLayerHelper = layers.sort((a, b) => a.length - b.length);
    //suche Layer mit der hoechsten Zahl in bestLayerHelper
    //wenn es einen bestLayer gibt schreibe ihn in result
    if (bestLayerHelper.length > 0) {
        //gebe besten Layer zurueck
        return bestLayerHelper[0];
    }
    //wenn keine Layer in Layers gebe null zurueck
    return null;
}

function getAllLayersOfWebsite(selectedWebsite) {
    let layers = [];
    for (let webgroupId in window.importedData.webStructure[selectedWebsite]) {
        if (window.importedData.webGroupToImageMapping[webgroupId] != null) {
            let layer = window.importedData.webGroupToImageMapping[webgroupId].layer;
            if (!layers.includes(layer)) {
                layers.push(layer);
            }
        }
    }
    return layers;
}

//Funktion um den Array nach Zeit zu sortieren
function sortArrayByProperty(array, prop = "start", prop2 = "end") {//array[i]={start:x,end:y,image:z,webgroup:w}
    //wenn <0, dann davor sortiert, wenn =0 gleicher Rang, wenn >0, dann danach sortiert
    return array.sort(function (a, b) {
        //Wenn Startzeitpunkt vorher, dann sortiere davor
        let difference = a[prop] - b[prop];
        //Wenn gleich sortiere nach Endzeit
        if (difference === 0)
            return a[prop2] - b[prop2];
        return difference;
    });
}

function getAllNodesOfWebsiteForOneUser(website, user, args = {
    sortByStartTime: true,
    withLayer: false,
    preloadPictures: false
}) {
    let preloadPictures = args.preloadPictures != null ? args.preloadPictures : false; //bei preloadPictures ist Boolen ob schon bei dem ersten vorkommen eines Bildes diese geladen werden sollen.
    let withLayer = args.withLayer != null ? args.withLayer : getWithLayer(); //Wenn nur Nodes und Edges der Mainlayer gezeichnet werden sollen
    let sortByStartTime = args.sortByStartTime != null ? args.sortByStartTime : true; //Wenn der Array sortiert werden soll
    let mainLayer = getBestLayer(getAllLayersOfWebsite(website));
    if (window.importedData.allUsers.includes(user)) {
        //erstelle einen Array mit allen Elementen fuer diesen
        let unsortedArray = [];
        //iteriere ueber alle Webgruppen
        for (let webgroup in window.importedData.webStructure[website]) {
            //Wenn nur MainLayer angezeigt werden soll und webgruppe nicht Teil des MainLayers
            if (!withLayer && !isWebgroupOfLayer(webgroup, mainLayer)) {
                continue;
            }
            let currentWebGroup = window.importedData.webStructure[website][webgroup];
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
        if (sortByStartTime) {
            //Nach Zeiten sortierter Array eines Nutzers
            let sortedArray = sortArrayByProperty(unsortedArray, "start", "end");
            return sortedArray;
        } else return unsortedArray;
    } else console.log("User: " + user + " does not exist");
    return null;
}

//Testet ob eine Webgroup zu einem Layer gehört
function isWebgroupOfLayer(webgroup, layer) {
    if (window.importedData.webGroupToImageMapping[webgroup] != null) {
        let testLayer = window.importedData.webGroupToImageMapping[webgroup].layer;
        if (testLayer === layer) {
            return true;
        }
    }
    return false;
}