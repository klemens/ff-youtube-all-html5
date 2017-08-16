// Object that contains all functions and data that must be available to the page
var _ytallhtml5 = createObjectIn(unsafeWindow, {defineAs: "_ytallhtml5"});

// Make config options available
_ytallhtml5.options = cloneInto(self.options, unsafeWindow);

runInPageContext(() => {
    // We only need to fix the video and controls sizes if we are changing the player size
    var height = parseInt(_ytallhtml5.options.settings["yt-player-height"]);
    if(height == 0 || height == -2) return;

    // Deleting the matchMedia method prevents the player in the old design
    // from querying the page size, which makes if fall back to the size the
    // page (or add-ons like us) specified for the containing div.
    // This does not work for the new polymer design, so we have to adjust
    // dynamically (returning undefined while polymer is still loading seems
    // unproblematic).
    window._matchMedia = window.matchMedia;
    delete window.matchMedia;
    Object.defineProperty(window, "matchMedia", {
        get: function() {
            if(document.getElementById("polymer-app") !== null) {
                return window._matchMedia;
            } else {
                return undefined;
            }
        }
    });
});

runInPageContext(() => {
    // Hijack the youtube config variable so we can modify it instanly upon setting
    delete window.ytplayer;
    window._ytplayer = {};
    Object.defineProperty(window, "ytplayer", {
        get: function() {
            var resolution = null;
            if(_ytallhtml5.options.settings["yt-video-resolution"] === "auto") {
                if(_ytallhtml5.options.settings["yt-player-height"] !== 0) {
                    resolution = _ytallhtml5.findBestResolution(_ytallhtml5.options.settings["yt-player-height"]);
                }
            } else {
                resolution = _ytallhtml5.options.settings["yt-video-resolution"];
            }
            if(resolution) {
                _ytplayer.config = _ytplayer.config || {};
                _ytplayer.config.args = _ytplayer.config.args || {};

                _ytplayer.config.args.video_container_override = resolution;
                // suggestedQuality may not work anymore
                _ytplayer.config.args.suggestedQuality = _ytallhtml5.resolutionToYTQuality(resolution);
                _ytplayer.config.args.vq = _ytallhtml5.resolutionToYTQuality(resolution);
            }

            return window._ytplayer;
        },
        set: function(value) {
            window._ytplayer = value;
        }
    });
});

// Apply the selected start options to the video, like start paused
applyStartOptions(self.options.settings["yt-start-option"]);

// Disable autoplay by updating the local cookies, which is necessary if
// youtube ever writes this pref, because the local value overwrites the
// value sent to the server (which is also modified) in this case
if(self.options.settings["yt-disable-autoplay"]) {
    // extract PREF cookie (https://developer.mozilla.org/en-US/docs/Web/API/Document/cookie)
    let pref = document.cookie.replace(/(?:(?:^|.*;\s*)PREF\s*\=\s*([^;]*).*$)|^.*$/, "$1");
    if(pref) {
        let pattern = /f5=[^&]+/;
        if(-1 == pref.search(pattern)) {
            pref += "&f5=30030";
        } else {
            pref = pref.replace(pattern, "f5=30030");
        }
        // The domain is the same that is used by youtube to ensure that the
        // cookie is overwritten instead of just added alongside
        document.cookie = "PREF=" + pref + "; domain=.youtube.com";
    }
}

// Manage theater mode (setting local cookie like above)
if(-2 == self.options.settings["yt-player-height"]) {
    document.cookie = "wide=1; domain=.youtube.com";
}

// This is called when the youtube player has finished loading
// and its API can be used safely
window.wrappedJSObject.onYouTubePlayerReady = function() {
    var player = document.querySelector("#movie_player");
    if(!player) {
        return;
    }

    player = player.wrappedJSObject;

    // set the volume of the video if requested
    var volume = self.options.settings["yt-video-volume"];
    if(volume !== -1) {
        player.setVolume(volume);
    }

    // set the playback rate of the video if requested
    var playbackRate = parseFloat(self.options.settings["yt-video-playback-rate"]);
    if(playbackRate !== 1) {
        player.setPlaybackRate(playbackRate);
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
