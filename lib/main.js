const {data, id, version} = require("sdk/self");
const {viewFor} = require("sdk/view/core");
var pageMod = require("sdk/page-mod");
var simplePrefs = require("sdk/simple-prefs");
var contextMenu = require("sdk/context-menu");
var tabs = require("sdk/tabs");

const {UserAgentChanger} = require("./UserAgentChanger");
const {URIChanger} = require("./URIChanger");
const {PluginPermissionChanger} = require("./PluginPermissionChanger");
const {CookieChanger, modifyPrefCookie} = require("./CookieChanger");

// Internet Explorer 10 on Windows 7
const IEUserAgent = "Mozilla/5.0 (compatible; MSIE 10.0; Windows NT 6.1; Trident/6.0)";
// available player sizes (see yt-player-height setting)
const playerHeights = [360, 480, 720, 1080, 1440];

var youtubeIE = new UserAgentChanger("www.youtube.com", IEUserAgent);
var youtubeFlash = new PluginPermissionChanger("https://www.youtube.com", "flash");
var youtubeEmbedFlash = new URIChanger(function(uri) {
    if(("www.youtube.com" !== uri.host && "www.youtube-nocookie.com" !== uri.host) ||
       "/embed/" !== uri.path.substr(0,7) ||
       -1 !== uri.path.indexOf("html5=1")) {
        return null;
    }
    var newUri = uri.clone();
    newUri.path += (-1 === newUri.path.indexOf("?")) ? "?html5=1" : "&html5=1";
    return newUri;
});
var youtubeTheaterMode = new CookieChanger("www.youtube.com", (cookies) => {
    cookies.set("wide", "1");
});
var youtubeHTML5Test = new CookieChanger("www.youtube.com", (cookies) => {
    modifyPrefCookie(cookies, "f2", "40000000");
});
var youtubeDisableAutoplay = new CookieChanger("www.youtube.com", (cookies) => {
    // f5=20030 -> autoplay enabled (default)
    // f5=30030 -> autoplay disabled
    modifyPrefCookie(cookies, "f5", "30030");
});

function createContextMenuEntry() {
    return contextMenu.Item({
        label: "Open video without playlist",
        image: data.url("html5-play.png"),
        context: contextMenu.SelectorContext("a[href]"),
        contentScriptFile: data.url("context-menu.js"),
        onMessage: function(video) {
            var currentTab = tabs.activeTab;
            var tabWindow = viewFor(currentTab.window);

            // open as a child of the current tab when TST is installed
            if("TreeStyleTabService" in tabWindow) {
                tabWindow.TreeStyleTabService.readyToOpenChildTab(viewFor(currentTab));
            }

            tabs.open({
                url: "https://www.youtube.com/watch?v=" + video
            });
        }
    });
}

var buttonContentScript = null;
var videoContentScript = null;
function createContentScripts(settings) {
    // destroy existing content scripts
    if(buttonContentScript && buttonContentScript.destroy) {
        buttonContentScript.destroy();
    }
    if(videoContentScript && videoContentScript.destroy) {
        videoContentScript.destroy();
    }

    // script for showing the button, resizing the player and disabling spf
    buttonContentScript = pageMod.PageMod({
        include: /(http|https):\/\/www\.youtube\.com.*/,
        contentScriptWhen: "ready",
        contentScriptFile: data.url("youtube-html5.js"),
        contentStyleFile: data.url("youtube-html5.css"),
        contentScriptOptions: {
            buttonImageUrl: data.url("html5-play.png"),
            settingsImageUrl: data.url("settings.svg"),
            playerHeights: playerHeights,
            version: version,
            settings: settings
        },
        onAttach: function(worker) {
            worker.port.on("openSettings", function() {
                require('sdk/window/utils').getMostRecentBrowserWindow().BrowserOpenAddonsMgr("addons://detail/" + id);
            });
        }
    });

    // script for setting the video resolution and volume and pausing the video
    videoContentScript = pageMod.PageMod({
        include: /(http|https):\/\/www\.youtube\.com\/watch.*/,
        contentScriptWhen: "start",
        contentScriptFile: data.url("youtube-video-quality.js"),
        contentScriptOptions: {
            playerHeights: playerHeights,
            settings: settings
        }
    });
}


exports.main = function(options) {
    var settings = {};
    var openSingleVideo = null;

    // update setting on startup
    simplePrefs.prefs["yt-disable-flash"] = ("deny" == youtubeFlash.status());

    // name change resolution -> yt-player-height
    if("resolution" in simplePrefs.prefs) {
        simplePrefs.prefs["yt-player-height"] = simplePrefs.prefs["resolution"];
        delete simplePrefs.prefs["resolution"];
    }

    // pref change: yt-start-paused(bool) -> yt-start-option(menulist)
    if("yt-start-paused" in simplePrefs.prefs) {
        simplePrefs.prefs["yt-start-option"] =
            simplePrefs.prefs["yt-start-paused"] ? "paused" : "none";
        delete simplePrefs.prefs["yt-start-paused"];
    }

    // change deleted api and embed and legacy ie method to default
    if("api" === simplePrefs.prefs["yt-loadtype"] ||
       "iframe" === simplePrefs.prefs["yt-loadtype"] ||
       "ie" === simplePrefs.prefs["yt-loadtype"]) {
        simplePrefs.prefs["yt-loadtype"] = "html5-test";
    }

    settings["yt-player-height"] = simplePrefs.prefs["yt-player-height"];
    settings["yt-video-resolution"] = simplePrefs.prefs["yt-video-resolution"];
    settings["yt-loadtype"] = simplePrefs.prefs["yt-loadtype"];
    settings["yt-disable-spf"] = simplePrefs.prefs["yt-disable-spf"];
    settings["yt-disable-flash"] = simplePrefs.prefs["yt-disable-flash"];
    settings["yt-fix-volume"] = simplePrefs.prefs["yt-fix-volume"];
    settings["yt-start-option"] = simplePrefs.prefs["yt-start-option"];
    settings["yt-video-playback-rate"] = simplePrefs.prefs["yt-video-playback-rate"];
    settings["yt-disable-autoplay"] = simplePrefs.prefs["yt-disable-autoplay"];
    settings["yt-hide-annotations"] = simplePrefs.prefs["yt-hide-annotations"];
    settings["yt-enable-context-menu"] = simplePrefs.prefs["yt-enable-context-menu"];

    createContentScripts(settings);

    if("ie-legacy" == settings["yt-loadtype"]) {
        youtubeIE.register();
    } else if("html5-test" == settings["yt-loadtype"]) {
        youtubeHTML5Test.register();
    }

    if (settings["yt-disable-flash"]) {
        youtubeEmbedFlash.register();
    }

    if(-2 == settings["yt-player-height"]) {
        youtubeTheaterMode.register();
    }

    if(settings["yt-enable-context-menu"]) {
        openSingleVideo = createContextMenuEntry();
    }

    if(settings["yt-disable-autoplay"]) {
        youtubeDisableAutoplay.register();
    }

    // listen for youtube flash permission changes
    youtubeFlash.onChange(function(newState) {
        settings["yt-disable-flash"] = simplePrefs.prefs["yt-disable-flash"]
            = ("deny" == newState);
    });

    simplePrefs.on("", function(pref) {
        settings[pref] = simplePrefs.prefs[pref];

        if("yt-loadtype" == pref) {
            if("ie-legacy" == settings["yt-loadtype"]) {
                youtubeHTML5Test.unregister();
                youtubeIE.register();
            } else if("html5-test" == settings["yt-loadtype"]) {
                youtubeIE.unregister();
                youtubeHTML5Test.register();
            } else {
                youtubeIE.unregister();
                youtubeHTML5Test.unregister();
            }
        } else if("yt-disable-flash" == pref) {
            if(settings["yt-disable-flash"]) {
                youtubeFlash.deny();
                youtubeEmbedFlash.register();
            } else if("deny" == youtubeFlash.status()) {
                youtubeFlash.reset();
                youtubeEmbedFlash.unregister();
            }
        } else if("yt-player-height" == pref) {
            if(-2 == settings["yt-player-height"]) {
                youtubeTheaterMode.register();
            } else {
                youtubeTheaterMode.unregister();
            }
        } else if("yt-enable-context-menu" == pref) {
            if(settings["yt-enable-context-menu"]) {
                openSingleVideo = createContextMenuEntry();
            } else {
                openSingleVideo.destroy();
                openSingleVideo = null;
            }
        } else if("yt-disable-autoplay" == pref) {
            if(settings["yt-disable-autoplay"]) {
                youtubeDisableAutoplay.register();
            } else {
                youtubeDisableAutoplay.unregister();
            }
        }

        // recreate content scripts, so they work with the new settings
        // (will destroy existing scripts, but not attach to existing tabs)
        createContentScripts(settings);
    });
}

exports.onUnload = function(reason) {
    if("disable" == reason) {
        youtubeFlash.reset();
    }
};
