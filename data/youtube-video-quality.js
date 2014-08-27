var uw = window.wrappedJSObject;

// contains some helper functions to modify the player configuration
var youtubeConfig = {
    findResolution: function(playerSize) {
        if(!playerSize) {
            return null;
        } else if(playerSize < 0) {
            var sizesReverse = self.options.playerSizes.slice().reverse();
            for(var i in sizesReverse) {
                if(document.body.clientWidth >= (sizesReverse[i] * 16 / 9)) {
                    playerSize = sizesReverse[i];
                    break;
                }
            }
            if(playerSize < 0) {
                return null;
            }
        }

        return "" + (playerSize * 16 / 9) + "x" + playerSize;
    },
    resolutionToQuality: function(resolution) {
        switch(resolution) {
            case "640x360": return "medium";
            case "1280x720": return "hd720";
            default: return "auto";
        }
    }
};

// modify the player config directly when it is first set (usually through
// a script tag in the html body); this works because the player is created
// afterwards and uses the modified configuration
// inspired by YouTubeCenter (https://github.com/YePpHa/YouTubeCenter)
uw.ytplayer = {};
Object.defineProperty(uw.ytplayer, "config", {
    get: function() {
        return youtubeConfig._config;
    },
    set: function(config) {
        var resolution = null;
        if(self.options.settings["yt-video-resolution"] === "auto") {
            resolution = youtubeConfig.findResolution(self.options.settings["yt-player-size"]);
        } else {
            resolution = self.options.settings["yt-video-resolution"];
        }
        if(resolution) {
            config.args.video_container_override = resolution;
            config.args.suggestedQuality = youtubeConfig.resolutionToQuality(resolution);
        }

        youtubeConfig._config = config;
    }
});

// This is called when the youtube player has finished loading
// and its API can be used safely
uw.onYouTubePlayerReady = function() {
    var player = document.querySelector("#movie_player").wrappedJSObject;

    // set volume to 100% to work aroung a youtube bug which reduces
    // the volume without user interaction
    if(self.options.settings["yt-fix-volume"]) {
        player.setVolume(100);
    }

    if(self.options.settings["yt-start-paused"]) {
        player.pauseVideo();
    }
}

// function which sets the quality, size and volume of the video to the right values
var ensureYTParameters = function(event) {
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
        annotation.style.transformOrigin = "0 0";
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
