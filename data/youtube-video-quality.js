// function which sets the quality of the video to the right value
var ensureQuality = function() {
    var player = window.document.getElementById('movie_player');
    if(player && player.wrappedJSObject && player.wrappedJSObject.setPlaybackQuality) {
        // by pausing and then resuming, we force the youtube player to load
        // the right version of the video based on the size of the player
        player.wrappedJSObject.pauseVideo();
        setTimeout(function() {
            player.wrappedJSObject.playVideo();
        }, 200);

        // quality only needs to be set once
        document.removeEventListener("play", ensureQuality, true);
        document.removeEventListener("timeupdate", ensureQuality, true);
    }
}

// register function to run when video starts or if it fails when it is running
document.addEventListener("play", ensureQuality, true);
document.addEventListener("timeupdate", ensureQuality, true);
