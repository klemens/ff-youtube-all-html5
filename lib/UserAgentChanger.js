const {Ci, Cu} = require('chrome');

Cu.import("resource://gre/modules/Services.jsm");

// export UserAgentChanger
exports.UserAgentChanger = UserAgentChanger;

// save all object to unregister them on unload
var objects = [];

/**
 * Small wrapper to change the user agent that gets send to a specific host
 *
 * @param host String Host to change the user agent for, eg. "www.youtube.com"
 * @param userAgent String The new user agent to be send
 */
function UserAgentChanger(host, userAgent) {
    this.host = host;
    this.userAgent = userAgent;

    // save for unregister on unload
    objects.push(this);
}

/**
 * Start changing the user agent for the specified host
 */
UserAgentChanger.prototype.register = function() {
    if(!this.observer) {
        var observer = {
            host: this.host,
            userAgent: this.userAgent,
            observe: function(subject, topic, data) {
                var request = subject.QueryInterface(Ci.nsIHttpChannel);

                if(this.host == request.URI.host) {
                    request.setRequestHeader("User-Agent", this.userAgent, false);
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
UserAgentChanger.prototype.unregister = function() {
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
