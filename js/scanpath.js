//vom Projektpraktikum adaptiert
function loadScanpath(canvas, data, mouse = false) {

    //initialize 2d canvas
    let ctx = canvas.getContext("2d");

    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    ctx.lineWidth = 2;

    // drawing scanpath
    function drawScanpath(scaling, transparency) {
        const splitData = splitUsers(data);
        scaling = scaling / 3;
        Object.keys(splitData).forEach(function (userId) {
            ctx.globalAlpha = transparency;
            let userData = splitData[userId];
            let idName = userId + "Color";
            let userColorBox = document.getElementById(idName);
            let userColor = userColorBox.value;
            ctx.fillStyle = userColor;
            ctx.strokeStyle = userColor;


            // draw the connecting lines of a scan path
            ctx.beginPath();
            userData.forEach(function (d) {
                ctx.lineTo(d[0], d[1]);
            });
            ctx.stroke();

            userData.forEach(function (d) {
                ctx.beginPath();
                if (!mouse) {
                    ctx.strokeStyle = 'grey';
                    ctx.arc(d[0], d[1], (scaling * d[2] / 25), 0, 2 * Math.PI);
                    ctx.fill();
                    ctx.stroke();
                    ctx.strokeStyle = userColor;
                } else if (d[2] === "click") {
                    ctx.strokeStyle = 'grey';
                    ctx.fillStyle = "black";
                    // make clicks twice as big
                    ctx.arc(d[0], d[1], scaling * 20, 0, 2 * Math.PI);
                    ctx.fill();
                    ctx.stroke();
                    // change back color
                    ctx.fillStyle = userColor;
                    ctx.strokeStyle = userColor;

                } else {
                    ctx.strokeStyle = 'grey';
                    ctx.arc(d[0], d[1], scaling * 10, 0, 2 * Math.PI);
                    ctx.fill();
                    ctx.stroke();
                    ctx.strokeStyle = userColor;
                }

            });

            // settings for indicator numbers
            ctx.textBaseline = 'middle';
            ctx.textAlign = 'center';
            ctx.strokeStyle = 'grey';
            ctx.fillStyle = 'white';
            let counter = 1;
            userData.forEach(function (d) {
                if (!mouse) {
                    ctx.font = (scaling * d[2] / 25) + "pt sans-serif";
                } else if (d[2] === "click") {
                    ctx.font = (scaling * 20) + "pt sans-serif";
                } else {
                    ctx.font = (scaling * 10) + "pt sans-serif";
                }
                // draw every number
                ctx.fillText(String(counter), d[0], d[1]);
                ctx.strokeText(String(counter), d[0], d[1]);

                counter++;
            });

            ctx.globalAlpha = 1;

        });
    }

    let radius = mouse ? document.getElementById('radiusMP') : document.getElementById('radiusSP');
    let transparency = mouse ? document.getElementById('transparencyMP') : document.getElementById('transparencySP');
    let changeType = 'oninput' in radius ? 'oninput' : 'onchange';
    //MOVED TO filtering.js
    //const colors = assignColors(allUserIds);

    drawScanpath(radius.value, (transparency.value / 100));

    radius[changeType] = transparency[changeType] = function (e) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        drawScanpath(radius.value, (transparency.value / 100));
        recreateDetailView();
    };

    // splitting input data according to user_id
    function splitUsers(data) {
        return data.reduce(function (acc, d) {
            if (!acc[d[3]]) {
                acc[d[3]] = [];
            }
            acc[d[3]].push(d);
            return acc;
        }, {});
    }
}


