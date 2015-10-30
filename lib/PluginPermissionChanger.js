const {Cu} = require("chrome");

Cu.import("resource://gre/modules/Services.jsm");

// plugin states
const UNSET = 0;
const ALLOW = 1;
const DENY = 2;
const CLICK_TO_PLAY = 3;

// export PluginPermissionChanger
exports.PluginPermissionChanger = PluginPermissionChanger;

// save the observers to unload them on shutdown
var observers = [];

/**
 * Small wrapper class to change permissions of a plugin on a specific site.
 *
 * @param url String Complete URL of the website, eg "https://www.youtube.com"
 * @param plugin String Name of the plugin, eg "flash"
 */
function PluginPermissionChanger(uri, plugin) {
    this.uri = Services.io.newURI(uri, null, null);
    this.plugin = "plugin:" + plugin;
}

/**
 * Get the status of the plugin, corresponds to the other functions
 *
 * @return String One of "allow", "deny", "ask" and "unset"
 */
PluginPermissionChanger.prototype.status = function() {
    var perm = Services.perms.testPermission(this.uri, this.plugin);
    return permissionToString(perm);
};

/**
 * Always execute the plugin
 */
PluginPermissionChanger.prototype.allow = function() {
    Services.perms.add(this.uri, this.plugin, ALLOW);
};

/**
 * Never execute the plugin
 */
PluginPermissionChanger.prototype.deny = function() {
    Services.perms.add(this.uri, this.plugin, DENY);
};

/**
 * Ask before executing the plugin
 */
PluginPermissionChanger.prototype.ask = function() {
    Services.perms.add(this.uri, this.plugin, CLICK_TO_PLAY);
};

/**
 * Reset to default setting
 */
PluginPermissionChanger.prototype.reset = function() {
    try {
        // remove takes URI since firefox 42, see bug 1170200
        Services.perms.remove(this.uri, this.plugin);
    } catch(e) {
        // remove took an hostname before firefox 42
        Services.perms.remove(this.uri.asciiHost, this.plugin);
    }
};

/**
 * Register a function that will be called when the permission is changed.
 * The callback gets passed the new state as its first argument. (see status())
 * Multiple functions can be registered and do not have to be removed on unload.
 *
 * @param callback Function Callback function that takes one argument
 */
PluginPermissionChanger.prototype.onChange = function(callback) {
    var uri = this.uri;
    var type = this.plugin;

    var observer = {
        observe: function(subject, topic, data) {
            // subject no longer has a host propery in firefox 42 (see above)
            if(subject.type == type &&
               (
                   (subject.host && subject.host == uri.asciiHost) ||
                   (subject.principal && subject.principal.URI.equals(uri))
               )) {
                if("deleted" == data) {
                    callback(permissionToString(UNSET));
                } else {
                    callback(permissionToString(subject.capability));
                }
            }
        }
    };

    // save for unload
    observers.push(observer);

    Services.obs.addObserver(observer, "perm-changed", false);
};


/**
 * Helper function to turn the constants into strings
 */
function permissionToString(permission) {
    switch(permission) {
        case ALLOW: return "allow";
        case DENY: return "deny";
        case CLICK_TO_PLAY: return "ask";
    }
    return "unset";
}

/**
 * Remove observer on unload
 */
require("sdk/system/unload").when(function() {
    for(let observer of observers) {
        Services.obs.removeObserver(observer, "perm-changed");
    }
    observers = [];
});
