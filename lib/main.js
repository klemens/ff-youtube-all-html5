var data = require("sdk/self").data;
var pageMod = require("sdk/page-mod");
var simplePrefs = require("sdk/simple-prefs");

var UserAgentChanger = require("./UserAgentChanger").UserAgentChanger;

exports.main = function(options) {
    var settings = {};
    
    settings["resolution"] = simplePrefs.prefs["resolution"];
    settings["loadtype"] = simplePrefs.prefs["loadtype"];
    settings["emulateIE"] = simplePrefs.prefs["emulateIE"];
    
    // remove red flash alert bar
    pageMod.PageMod({
        include: /(http|https):\/\/www\.youtube\.com.*/,
        contentStyleFile: data.url("youtube-html5.css"),
    });
    
    pageMod.PageMod({
        include: /(http|https):\/\/www\.youtube\.com\/watch.*/,
        contentScriptWhen: "ready",
        contentScriptFile: data.url("youtube-html5.js"),
        contentScriptOptions: {
            buttonImageUrl: data.url("youtube-html5.png"),
            settings: settings
        }
    });
    
    var uac = new UserAgentChanger({
        host: "www.youtube.com",
        userAgent: "Mozilla/5.0 (compatible; MSIE 10.0; Windows NT 6.1; Trident/6.0)"
    });
    if(settings["emulateIE"]) {
        uac.register();
    }
    
    simplePrefs.on("", function(pref) {
        settings[pref] = simplePrefs.prefs[pref];
        
        if("emulateIE" == pref) {
            if(settings["emulateIE"]) {
                uac.register();
            } else {
                uac.unregister();
            }
        }
    });
}
