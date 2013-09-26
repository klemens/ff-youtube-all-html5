var data = require("sdk/self").data;
var pageMod = require("sdk/page-mod");
var simplePrefs = require("sdk/simple-prefs");

const {UserAgentChanger} = require("./UserAgentChanger");
const {PluginPermissionChanger} = require("./PluginPermissionChanger");

// Internet Explorer 10 on Windows 7
const IEUserAgent = "Mozilla/5.0 (compatible; MSIE 10.0; Windows NT 6.1; Trident/6.0)";

var youtubeIE = new UserAgentChanger("www.youtube.com", IEUserAgent);
var youtubeFlash = new PluginPermissionChanger("http://www.youtube.com", "flash");

exports.main = function(options) {
    var settings = {};
    
    if("upgrade" == options.loadReason) {
        var version = require("sdk/self").version;
        
        // switch all uses of the previous default to the new one
        if(/2\.0\.0.*/.test(version) && "api" == simplePrefs.prefs["loadtype"]) {
            simplePrefs.prefs["loadtype"] = "ie";
        }
    }
    
    // update setting on startup
    simplePrefs.prefs["yt-disable-flash"] = ("deny" == youtubeFlash.status());

    settings["resolution"] = simplePrefs.prefs["resolution"];
    settings["loadtype"] = simplePrefs.prefs["loadtype"];
    settings["yt-disable-spf"] = simplePrefs.prefs["yt-disable-spf"];
    settings["yt-disable-flash"] = simplePrefs.prefs["yt-disable-flash"];

    // youtube button
    pageMod.PageMod({
        include: /(http|https):\/\/www\.youtube\.com.*/,
        contentScriptWhen: "ready",
        contentScriptFile: data.url("youtube-html5.js"),
        contentStyleFile: data.url("youtube-html5.css"),
        contentScriptOptions: {
            buttonImageUrl: data.url("html5-play.png"),
            settings: settings
        }
    });

    // vimeo button
    pageMod.PageMod({
        include: /(http|https):\/\/vimeo.com\/([0-9]+).*/,
        contentScriptWhen: "ready",
        contentScriptFile: data.url("vimeo-html5.js"),
        contentScriptOptions: {
            buttonImageUrl: data.url("html5-play.png"),
            fullscreenButtonImageUrl: data.url("fullscreen.png")
        }
    });

    if("ie" == settings["loadtype"]) {
        youtubeIE.register();
    }
    
    // listen for youtube flash permission changes
    youtubeFlash.onChange(function(newState) {
        settings["yt-disable-flash"] = simplePrefs.prefs["yt-disable-flash"]
            = ("deny" == newState);
    });

    simplePrefs.on("", function(pref) {
        settings[pref] = simplePrefs.prefs[pref];
        
        if("loadtype" == pref) {
            if("ie" == settings["loadtype"]) {
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
        }
    });
}

exports.onUnload = function(reason) {
    if("disable" == reason) {
        youtubeFlash.reset();
    }
};
