// function which sets the quality, size and volume of the video to the right values
var ensureYTParameters = function(event) {
    // run this part of the function only on the beginning of the video
    if(!ensureYTParameters.runOnce) {
        var player = window.document.getElementById('movie_player');
        if(player && player.wrappedJSObject) {
            ensureYTParameters.runOnce = true;

            // set volume to 100% to work aroung a youtube bug which reduces
            // the volume without user interaction
            if(self.options.settings["yt-fix-volume"]) {
                player.wrappedJSObject.setVolume(100);
            }

            // set desired video quality and pause/play the video to enforce it
            if("auto" == self.options.settings["yt-video-quality"]) {
                var height = parseInt(window.getComputedStyle(player).width) * 9 / 16;
                if(height >= 720) {
                    player.wrappedJSObject.setPlaybackQuality("hd720");
                } // else: medium is already the default
            } else {
                player.wrappedJSObject.setPlaybackQuality(self.options.settings["yt-video-quality"]);
            }
            player.wrappedJSObject.pauseVideo();
            setTimeout(function() {
                player.wrappedJSObject.playVideo();
            }, 200);
        }
    }

    // continually maximize video size, because youtube changes this eg. when
    // switching to fullscreen and back or using the player size button
    if(event.target.style) {
        event.target.style.width = "100%";
        event.target.style.height = "100%";
        event.target.style.top = "0";
        event.target.style.left = "0";
    }

    // scale annotations, because they are not scaled automatically (see above);
    // however, they are scaled automatically in fullscreen mode
    var scale = 1;
    var fullscreenElement = document.mozFullScreenElement || document.fullscreenElement;
    if(!fullscreenElement) {
        scale = parseInt(document.getElementById("player-api").style.width)
                / parseInt(document.querySelector(".html5-video-content").style.width);
    }
    for(var annotation of document.querySelectorAll(".video-annotations")) {
        annotation.style.transform = "scale(" + scale + ")";
    }
}

// register function to run when video is running
document.addEventListener("timeupdate", ensureYTParameters, true);

// register function to let the main script register inserted iframes
document.documentElement.addEventListener("registerIframe", function(event) {
    var iframe = document.getElementById(event.detail.id);

    var handleIframe = function() {
        var player = iframe.contentDocument.getElementById('player1');
        if(player && player.wrappedJSObject.setVolume && !handleIframe.runOnce) {
            // set volume to 100% to work aroung a youtube bug which reduces
            // the volume without user interaction
            if(self.options.settings["yt-fix-volume"]) {
                player.wrappedJSObject.setVolume(100);
            }

            // listen for video end and inform listeners
            player.wrappedJSObject.addEventListener("onStateChange", function(state) {
                if(0 == state) {
                    var event = document.createEvent('CustomEvent');
                    event.initCustomEvent("iframeStopped", true, true, null);
                    document.documentElement.dispatchEvent(event);
                }
            });

            // ensure that only one event handler (above) is attached
            handleIframe.runOnce = true;
            iframe.contentDocument.removeEventListener("timeupdate", handleIframe, true);
        }
    };

    iframe.addEventListener("load", function() {
        iframe.contentDocument.addEventListener("timeupdate", handleIframe, true);
    });
}, false);
