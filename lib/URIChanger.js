const {Ci, Cu} = require('chrome');

Cu.import("resource://gre/modules/Services.jsm");

// export URIChanger
exports.URIChanger = URIChanger;

// save all object to unregister them on unload
var objects = [];

/**
 * Class to redirect a request based on a callback. (Note that the callback gets
 * called again for the rewritten uri)
 *
 * @param callback Function The function to modify the url; should return the new
 *                          (cloned) uri or null if no redirect is needed
 */
function URIChanger(callback) {
    this.callback = callback;

    // save for unregister on unload
    objects.push(this);
}

/**
 * Start changing the uri
 */
URIChanger.prototype.register = function() {
    if(!this.observer) {
        var observer = {
            callback: this.callback,
            observe: function(subject, topic, data) {
                var request = subject.QueryInterface(Ci.nsIHttpChannel);
                var newUri = this.callback(request.URI);
                if (newUri) {
                    request.redirectTo(newUri);
                }
            }
        };

        this.observer = observer;
    }

    Services.obs.addObserver(this.observer, "http-on-modify-request", false);
}

/**
 * Stop changing the uri. Does nothing when the changer is not registered
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
