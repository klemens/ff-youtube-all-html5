var data = require("sdk/self").data;
var pageMod = require("sdk/page-mod");

exports.main = function(options) {
    pageMod.PageMod({
        include: /(http|https):\/\/www\.youtube\.com\/watch.*/,
        contentScriptWhen: "ready",
        contentScriptFile: data.url("youtube-html5.js"),
        contentScriptOptions: {
            buttonImageUrl: data.url("youtube-html5.png")
        }
    });
}
