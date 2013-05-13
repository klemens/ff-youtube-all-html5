var data = require("sdk/self").data;
var pageMod = require("sdk/page-mod");
var simplePrefs = require("sdk/simple-prefs");

exports.main = function(options) {
    var options = {};
    
    options["autoplay"] = simplePrefs.prefs["autoplay"];
    options["resolution"] = simplePrefs.prefs["resolution"];
    simplePrefs.on("", function(pref) {
        options[pref] = simplePrefs.prefs[pref];
    });
    
    pageMod.PageMod({
        include: /(http|https):\/\/www\.youtube\.com\/watch.*/,
        contentScriptWhen: "ready",
        contentScriptFile: data.url("youtube-html5.js"),
        contentScriptOptions: {
            buttonImageUrl: data.url("youtube-html5.png"),
            options: options
        }
    });
}
