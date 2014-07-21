const {data, id} = require("sdk/self");
var pageMod = require("sdk/page-mod");
var simplePrefs = require("sdk/simple-prefs");

const {UserAgentChanger} = require("./UserAgentChanger");
const {URIChanger} = require("./URIChanger");
const {PluginPermissionChanger} = require("./PluginPermissionChanger");

// Internet Explorer 10 on Windows 7
const IEUserAgent = "Mozilla/5.0 (compatible; MSIE 10.0; Windows NT 6.1; Trident/6.0)";

var youtubeIE = new UserAgentChanger("www.youtube.com", IEUserAgent);
var youtubeFlash = new PluginPermissionChanger("http://www.youtube.com", "flash");
var embeddedChanger = new URIChanger("www.youtube.com", function (uri) {
    if ("embed/" !== uri.path.substr(0,6)) {
        return false;
    }
    if (uri.path.indexOf("html5=1") > -1) {
        return false;
    }
    var newUri = uri.clone();
    if (newUri.path.indexOf("?") > -1) {
        newUri.path += '&htlm5=1';
    } else {
        newUri.path += '?htlm5=1';
    }
    return newUri;
});

exports.main = function(options) {
    var settings = {};
    
    // update setting on startup
    simplePrefs.prefs["yt-disable-flash"] = ("deny" == youtubeFlash.status());

    settings["resolution"] = simplePrefs.prefs["resolution"];
    settings["yt-video-quality"] = simplePrefs.prefs["yt-video-quality"];
    settings["yt-loadtype"] = simplePrefs.prefs["yt-loadtype"];
    settings["yt-disable-spf"] = simplePrefs.prefs["yt-disable-spf"];
    settings["yt-disable-flash"] = simplePrefs.prefs["yt-disable-flash"];
    settings["yt-fix-volume"] = simplePrefs.prefs["yt-fix-volume"];
    settings["yt-start-paused"] = simplePrefs.prefs["yt-start-paused"];
    settings["yt-embeded"] = simplePrefs.prefs["yt-embeded"];

    // youtube button
    pageMod.PageMod({
        include: /(http|https):\/\/www\.youtube\.com.*/,
        contentScriptWhen: "ready",
        contentScriptFile: data.url("youtube-html5.js"),
        contentStyleFile: data.url("youtube-html5.css"),
        contentScriptOptions: {
            buttonImageUrl: data.url("html5-play.png"),
            settingsImageUrl: data.url("settings.svg"),
            settings: settings
        },
        onAttach: function(worker) {
            worker.port.on("openSettings", function() {
                require('sdk/deprecated/window-utils').activeBrowserWindow.BrowserOpenAddonsMgr("addons://detail/" + id);
            });
        }
    });
    // ensure right video quality set
    pageMod.PageMod({
        include: /(http|https):\/\/www\.youtube\.com\/watch.*/,
        contentScriptWhen: "start",
        contentScriptFile: data.url("youtube-video-quality.js"),
        contentScriptOptions: {
            settings: settings
        }
    });

    if("ie" == settings["yt-loadtype"]) {
        youtubeIE.register();
    }
    
    if (settings["yt-embeded"]) {
        embeddedChanger.register();
    }
    
    // listen for youtube flash permission changes
    youtubeFlash.onChange(function(newState) {
        settings["yt-disable-flash"] = simplePrefs.prefs["yt-disable-flash"]
            = ("deny" == newState);
    });

    simplePrefs.on("", function(pref) {
        settings[pref] = simplePrefs.prefs[pref];
        
        if("yt-loadtype" == pref) {
            if("ie" == settings["yt-loadtype"]) {
                youtubeIE.register();
            } else {
                // ok to call even when switching from api to iframe,
                // because it does nothing when it is not registered
                youtubeIE.unregister();
            }
        } else if("yt-disable-flash" == pref) {
            if(settings["yt-disable-flash"]) {
                youtubeFlash.deny();
            } else if("deny" == youtubeFlash.status()) {
                youtubeFlash.reset();
            }
        } else if("yt-embeded" == pref) {
            if(settings["yt-embeded"]) {
                embeddedChanger.register();
            } else {
                // ok to call even when switching from api to iframe,
                // because it does nothing when it is not registered
                embeddedChanger.unregister();
            }
        }
        
    });
}

exports.onUnload = function(reason) {
    if("disable" == reason) {
        youtubeFlash.reset();
    }
};
