var data = require("sdk/self").data;
var pageMod = require("sdk/page-mod");
var simplePrefs = require("sdk/simple-prefs");

exports.main = function(options) {
    var settings = {};
    
    settings["autoplay"] = simplePrefs.prefs["autoplay"];
    settings["resolution"] = simplePrefs.prefs["resolution"];
    simplePrefs.on("", function(pref) {
        settings[pref] = simplePrefs.prefs[pref];
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
}
