var data = require("sdk/self").data;
var pageMod = require("sdk/page-mod");
var simplePrefs = require("sdk/simple-prefs");

var UserAgentChanger = require("./UserAgentChanger").UserAgentChanger;

exports.main = function(options) {
    var settings = {};
    
    if("upgrade" == options.loadReason) {
        var version = require("sdk/self").version;
        
        // switch all uses of the previous default to the new one
        if(/2\.0\.0.*/.test(version) && "api" == simplePrefs.prefs["loadtype"]) {
            simplePrefs.prefs["loadtype"] = "ie";
        }
    }
    
    settings["resolution"] = simplePrefs.prefs["resolution"];
    settings["loadtype"] = simplePrefs.prefs["loadtype"];
    settings["yt-disable-spf"] = simplePrefs.prefs["yt-disable-spf"];

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

    var uac = new UserAgentChanger({
        host: "www.youtube.com",
        userAgent: "Mozilla/5.0 (compatible; MSIE 10.0; Windows NT 6.1; Trident/6.0)"
    });
    if("ie" == settings["loadtype"]) {
        uac.register();
    }
    
    simplePrefs.on("", function(pref) {
        settings[pref] = simplePrefs.prefs[pref];
        
        if("loadtype" == pref) {
            if("ie" == settings["loadtype"]) {
                uac.register();
            } else {
                // ok to call even when switching from api to iframe,
                // because it does nothing when it is not registered
                uac.unregister();
            }
        }
    });
}
