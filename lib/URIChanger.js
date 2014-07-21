const {Ci, Cu} = require('chrome');

Cu.import("resource://gre/modules/Services.jsm");

// export URIChanger
exports.URIChanger = URIChanger;

// save all object to unregister them on unload
var objects = [];

/**
 * Small wrapper to change the user agent that gets send to a specific host
 *
 * @param host String Host to change the user agent for, eg. "www.youtube.com"
 * @param changer Function The function to modify the url
 */
function URIChanger(host, changer) {
    this.host = host;
    this.changer = changer;

    // save for unregister on unload
    objects.push(this);
}

/**
 * Start changing the user agent for the specified host
 */
URIChanger.prototype.register = function() {
    if(!this.observer) {
        var observer = {
            host: this.host,
            changer: this.changer,
            observe: function(subject, topic, data) {
                var request = subject.QueryInterface(Ci.nsIHttpChannel);
                if(this.host == request.URI.host) {
                    var newUri = changer(request.URI);
                    if (newUri) {
                        request.redirectTo(newUri);
                    }
                }
            }
        };

        this.observer = observer;
    }

    Services.obs.addObserver(this.observer, "http-on-modify-request", false);
}

/**
 * Stop changing the user agent. Does nothing when the changer is not registered
 */
URIChanger.prototype.unregister = function() {
    if(this.observer) {
        Services.obs.removeObserver(this.observer, "http-on-modify-request");
        delete this.observer;
    }
}

/**
 * Unregister objects on unload
 */
require("sdk/system/unload").when(function() {
    for(let obj of objects) {
        obj.unregister();
    }
    objects = [];
});
