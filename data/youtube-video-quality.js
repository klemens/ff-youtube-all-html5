// Object that contains all functions and data that must be available to the page
var _ytallhtml5 = createObjectIn(unsafeWindow, {defineAs: "_ytallhtml5"});

// Make config options available
_ytallhtml5.options = cloneInto(self.options, unsafeWindow);


/**
 * Hijack the youtube config variable so we can modify it instanly upon setting
 */
runInPageContext(function(params) {
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
            }

            window._ytallhtml5.config = config;
        }
    });
}, {});

// This is called when the youtube player has finished loading
// and its API can be used safely
window.wrappedJSObject.onYouTubePlayerReady = function() {
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
        case "640x360": return "medium";
        case "853x480": return "large";
        case "1280x720": return "hd720";
        case "1920x1080": return "hd1080";
        case "2560x1440": return "highres";
        default: return "auto";
    }
}, _ytallhtml5, {defineAs: "resolutionToYTQuality"});

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
