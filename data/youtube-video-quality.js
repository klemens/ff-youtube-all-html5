// function which sets the quality, size and volume of the video to the right values
var ensureYTParameters = function(event) {
    // run this part of the function only on the beginning of the video
    if(!ensureYTParameters.runOnce) {
        var player = window.document.getElementById('movie_player');
        if(player && player.wrappedJSObject) {
            ensureYTParameters.runOnce = true;

            // pause/play the video to enforce video quality
            player.wrappedJSObject.pauseVideo();
            setTimeout(function() {
                player.wrappedJSObject.playVideo();
            }, 200);
        }
    }

    // continually maximize video size, because youtube changes this eg. when
    // switching to fullscreen and back
    if(event.target.style && event.target.style.width != "100%") {
        event.target.style.width = "100%";
        event.target.style.height = "100%";
    }
}

// register function to run when video is running
document.addEventListener("timeupdate", ensureYTParameters, true);
