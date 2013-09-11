const {Cc, Ci} = require('chrome');

exports.UserAgentChanger = function(newOptions) {
    var options = newOptions;
    var registered = false;
    
    this.register = function() {
        if(!registered && options.host && options.userAgent) {
            var observerService = Cc["@mozilla.org/observer-service;1"].getService(Ci.nsIObserverService);
            observerService.addObserver(this, "http-on-modify-request", false);
            registered = true;
        } else {
            registered = false;
        }
        
        return registered;
    }
    this.unregister = function() {
        if(registered) {
            var observerService = Cc["@mozilla.org/observer-service;1"].getService(Ci.nsIObserverService);
            observerService.removeObserver(this, "http-on-modify-request");
            registered = false;
        }
    }
    
    this.observe = function(subject, topic, data) {
        if("http-on-modify-request" == topic) {
            var httpChannel = subject.QueryInterface(Ci.nsIHttpChannel);
            
            if(options.host == httpChannel.URI.host) {
                httpChannel.setRequestHeader("User-Agent", options.userAgent, false);
            }
        }
    }
}