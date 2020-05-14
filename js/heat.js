//vom Projektpraktikum adaptiert
function loadHeatmap(canvas, data) {
    //Beginn statischer Teil
    let ctx = canvas.getContext("2d");

    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

    //find the max fixation duration
    let maximum = 0;
    data.forEach(function (item) {
        let dur = parseInt(item[2]);
        if (dur > maximum) {
            maximum = dur;
        }
    });

    //heatmap instance bound to canvas and data with relative fixation maximum
    let heatmap_data = [...data];
    heatmap_data.forEach(function (key, index) {
        heatmap_data[index] = [parseInt(key[0]), parseInt(key[1]), parseInt(key[2])]
    });

    let radius = document.getElementById('radiusHM'),
        blur = document.getElementById('blurHM'),
        transparency = document.getElementById('transparencyHM');

    let heat = simpleheat(canvas).data(heatmap_data).max(maximum);
    heat.radius(+radius.value, +blur.value);
    let alpha = transparency.value;
    heat.draw(0.05, alpha);
    //Ende statischer Teil

    //dynamischer Teil
    let changeType = 'oninput' in radius ? 'oninput' : 'onchange';
    radius[changeType] = blur[changeType] = transparency[changeType] = function (e) {
        alpha = transparency.value;
        heat.radius(+radius.value, +blur.value);
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        heat.draw(0.05, alpha);
        recreateDetailView();
        /////////////////////////////////
        /// texture.needsUpdate = true;//
        /////////////////////////////////
    };
}