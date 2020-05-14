//In dieser Datei werden die globalen Variablen gespeichert. 
//Alle globalen Variablen werden an das Fenster uebergeben.(Macht JavaScript intern auch ohne explizite Angabe)
//importedFiles soll die Dateien, die hochgeladen wurden enthalten.
window.importedFiles = {};
//importedData soll die impotierten daten enthalten
window.importedData = {};
//soll die Bilder aller Nutzer enthalten 
//Beispiel:window.importedData.images["imagename"] = URL to Image
window.importedData.images = {};
//Checkerboard als Hintergrund für Transparente 
window.importedData.images["checkerboard.png"] = {full: "dataset/checkerboard.png", thumb: "dataset/checkerboard.png"};
//soll die Informationen aller Nutzer enthalten
//Beispiel:window.importedData.userInformation["user_id"] = {user_id,age...}
window.importedData.userInformation = {};
//soll alle Nutzer enthalten
//window.importedData.allUsers = [user_id1,user_id2,...]
window.importedData.allUsers = [];
//soll die Webgroups auf die Bilder der Webgroups mappen koennen
//window.importedData.webGroupToImageMapping["web_group_id"].image = "imagename"
window.importedData.webGroupToImageMapping = {};
//soll in der Form webStructure[Website/Domain][Webpage][State] aufgebaut sein (geeignet fuer Klickpfade, Nutzerfluss und Eigene Visualisierung)
window.importedData.webStructure = {};
//soll in der Form userStructure[User][Website][State] aufgebaut sein (geeigneter fuer Timeline)
window.importedData.userStructure = {};
//soll Blickdaten beinhalten
//importedData.gaze["web_group_id"]["user_id"]=[{duration,timestamp,x,y,user_id,web_group_id},...]
window.importedData.gaze = {};
//soll Mausdaten beinhalten
//importedData.mouse["web_group_id"]["user_id"]=[{type,timestamp,x,y,user_id,web_group_id},...]
window.importedData.mouse = {};
//importedData.gazeShots["shot"]=[{duration,timestamp,x,y,user_id,shot},...]
window.importedData.gazeShots = {};
//importedData.mouseShots["shot"]=[{type,timestamp,x,y,user_id,shot},...]
window.importedData.mouseShots = {};
//importedData.videos["user_id"]["website"]=link
window.importedData.videos = {};

//Variable, die die ausgewaehte Visualisierung als String speichert
window.selectedVisualization = "";
window.selectedWebsite = "";
window.transparent = true;
window.withLayer = false;
window.actionDrivenRender = true;
window.filteredData={};
window.filteredData.userStructure = {};
window.filteredData.webStructure = {};


// //Iteriere ueber alle Web Gruppen in window.importedData.userStructure. User oder Website koennen vorgegeben werden.
// function iterateOverAllUserWebGroups(callback, args = { website: null, user: null }) {
//     //Wenn ein User vorgegeben wurde iteriere nur ueber diesen
//     if (args && args.user != null) {
//         let user = args.user;
//         //wenn eine Website vorgegeben wurde gebe diese mit
//         if (args.website != null)
//             iterateOverAllWebsitesOfOneUser(callback, user, args.website);
//         else iterateOverAllWebsitesOfOneUser(callback, user);
//     }
//     else
//         //wenn kein User vorgegeben iteriere ueber alle Nutzer
//         for (let u in window.importedData.allUsers) {
//             let user = window.importedData.allUsers[u];
//             //wenn eine Website vorgegeben wurde gebe diese mit
//             if (args && args.website != null)
//                 iterateOverAllWebsitesOfOneUser(callback, user, args.website);
//             else iterateOverAllWebsitesOfOneUser(callback, user);
//         }
//     //Funktion um ueber alle Websiten oder nur eine website(wenn diese mitgegeben wurde) zu iterieren
//     function iterateOverAllWebsitesOfOneUser(callback, user, website = null) {
//         //Wenn Website mitgegeben iteriere nur ueber diese Website
//         if (website != null) {
//             let websiteObject = window.importedData.userStructure[user][website];
//             //Iteriere ueber alle Webgruppen der Website
//             iterateOverAllWebGroupsOfWebsite(callback, websiteObject);
//         }
//         //sonst iteriere ueber alle Websites
//         else
//             for (let w in window.importedData.userStructure[user]) {
//                 let websiteObject = window.importedData.userStructure[user][w];
//                 //Iteriere ueber alle Webgruppen der Website
//                 iterateOverAllWebGroupsOfWebsite(callback, websiteObject);
//             }
//         //iteriere ueber alle Webgruppen der Website und fuehre callback aus.
//         function iterateOverAllWebGroupsOfWebsite(callback, websiteObject) {
//             for (let webGroup in websiteObject) {
//                 //fuehre callback Funktion fuer jedes Webgruppenobjekt aus 
//                 callback(websiteObject[webGroup]);
//             }
//         }
//     }
// }