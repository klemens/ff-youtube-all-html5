// Object that contains all functions and data that must be available to the page
var _ytallhtml5 = createObjectIn(unsafeWindow, {defineAs: "_ytallhtml5"});

// Make config options available
_ytallhtml5.options = cloneInto(self.options, unsafeWindow);

runInPageContext(() => {
    // We only need to fix the video and controls sizes if we are changing the player size
    var height = parseInt(_ytallhtml5.options.settings["yt-player-height"]);
    if(height == 0 || height == -2) return;

    // Deleting the matchMedia method prevents the player from querying the
    // page size, which makes if fall back to the size the page (or add-ons
    // like us) specified for the containing div
    delete window.matchMedia;
});

runInPageContext(() => {
    // Hijack the youtube config variable so we can modify it instanly upon setting
    window.ytplayer = {};
    Object.defineProperty(window.ytplayer, "config", {
        get: function() {
            return window._ytallhtml5.config;
        },
        set: function(config) {
            var resolution = null;
            if(_ytallhtml5.options.settings["yt-video-resolution"] === "auto") {
                if(_ytallhtml5.options.settings["yt-player-height"] !== 0) {
                    resolution = _ytallhtml5.findBestResolution(_ytallhtml5.options.settings["yt-player-height"]);
                }
            } else {
                resolution = _ytallhtml5.options.settings["yt-video-resolution"];
            }
            if(resolution) {
                config.args.video_container_override = resolution;
                // suggestedQuality may not work anymore
                config.args.suggestedQuality = _ytallhtml5.resolutionToYTQuality(resolution);
                config.args.vq = _ytallhtml5.resolutionToYTQuality(resolution);
            }

            window._ytallhtml5.config = config;
        }
    });
});

// Apply the selected start options to the video, like start paused
applyStartOptions(self.options.settings["yt-start-option"]);

// This is called when the youtube player has finished loading
// and its API can be used safely
window.wrappedJSObject.onYouTubePlayerReady = function() {
    var player = document.querySelector("#movie_player").wrappedJSObject;

    // set the quality directly, because the config is ignored sometimes
    player.setPlaybackQuality(_ytallhtml5.config.args.vq);

    // set volume to 100% to work aroung a youtube bug which reduces
    // the volume without user interaction
    if(self.options.settings["yt-fix-volume"]) {
        player.setVolume(100);
    }
}


/**
 * Function that returns the 16:9 video resolution for a given player height.
 * Tries to calculate it based on the window size if playerHeight < 0.
 */
exportFunction(function(playerHeight) { // findBestResolution
    if(playerHeight < 0) {
        var sizesReverse = _ytallhtml5.options.playerHeights.slice().reverse();
        for(var i in sizesReverse) {
            if(document.body.clientWidth >= (sizesReverse[i] * 16 / 9)) {
                playerHeight = sizesReverse[i];
                break;
            }
        }
        if(playerHeight < 0) {
            return null;
        }
    }

    return "" + (playerHeight * 16 / 9) + "x" + playerHeight;
}, _ytallhtml5, {defineAs: "findBestResolution"});

/**
 * Function that converts a given resolution to the youtube representation.
 */
exportFunction(function(resolution) { // resolutionToYTQuality
    switch(resolution) {
        case "256x144": return "light";
        case "426x240": return "small";
        case "640x360": return "medium";
        case "853x480": return "large";
        case "1280x720": return "hd720";
        case "1920x1080": return "hd1080";
        case "2560x1440": return "hd1440";
        case "3840x2160": return "hd2160";
        default: return "auto";
    }
}, _ytallhtml5, {defineAs: "resolutionToYTQuality"});

/**
 * Set up listeners to apply the video start options (eg paused).
 */
function applyStartOptions(startOption) {
    if("none" !== startOption) {
        if("paused-if-hidden" === startOption && !document.hidden) {
            // video is visible, so do not pause in this mode
            return;
        }
        var queryParameters = parseUrlQuery(document.location.search);
        if("paused-if-not-playlist" === startOption && ("list" in queryParameters)) {
            // we are watching a playlist, so do not pause in this mode
            return;
        }

        var listener = function(event) {
            document.documentElement.removeEventListener("playing", listener, true);
            event.target.pause();
        };
        document.documentElement.addEventListener("playing", listener, true);
    }
}

/**
 * Parse the query part of a url into a map
 * @see: http://www.techtricky.com/how-to-get-url-parameters-using-javascript/
 */
function parseUrlQuery(query) {
    var params = {};
    query.replace(/[?&]+([^=&]+)=([^&]*)/gi, function(str, key, value) {
        params[key] = value;
    });
    return params;
}


/**
 * This is needed because since firefox 33 it is no longer allowed for
 * content scripts to export complex objects to the page context (eg properties).
 * Because the function is serialized, references do not work. To pass static
 * data to the exported function, use the second parameter. (supports only
 * objects with basic types, not functions etc.)
 * Inspired by Rob W, http://stackoverflow.com/a/9517879
 */
function runInPageContext(func, data) {
    if(!(func instanceof Function) || func.name != "") {
        throw "Please use an anonymous function";
    }

    var serializedData = "";
    if(data instanceof Object) {
        serializedData += "JSON.parse(\"";
        serializedData += JSON.stringify(data).replace("\\", "\\\\", "g")
                                              .replace("\"", "\\\"", "g");
        serializedData += "\")";
    }

    var serializedFunc = "(" + func.toSource() + ")(" + serializedData + ")";
    var script = document.createElement('script');
    script.textContent = serializedFunc;

    var root = document.documentElement;
    root.appendChild(script); // script is run here ...
    root.removeChild(script); // ... so we can remove the tag directly afterwards
}
