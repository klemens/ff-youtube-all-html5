const events = require("sdk/system/events");
const {Ci} = require("chrome");

// export CookieChanger
exports.CookieChanger = CookieChanger;
exports.Cookies = Cookies;
exports.modifyPrefCookie = modifyPrefCookie;

// save all CookieChangers
var listeners = [];

/**
 * Class to modify cookies on http requests
 *
 * @param host string The hostname for wich you want to change cookies
 * @param callback Function The function to modify the cookies
 */
function CookieChanger(host, callback) {
    this.host = host;
    this.callback = callback;
    this.active = false;

    listeners.push(this);
}

/**
 * Start changing cookies
 */
CookieChanger.prototype.register = function() {
    this.active = true;
}

/**
 * Stop changing cookies
 */
CookieChanger.prototype.unregister = function() {
    this.active = false;
}


/**
 * Class to parse the http request "Cookie" header
 */
function Cookies(cookieString) {
    this.cookies = new Map();

    cookieString.split(/; */).forEach((cookie) => {
        var i = cookie.indexOf("=");

        if(i == -1) {
            return;
        }

        this.cookies.set(cookie.substring(0, i), cookie.substring(i + 1));
    });
}

/**
 * Serializes the Cookie object into a proper "Cookie" http header
 */
Cookies.prototype.unparse = function() {
    var cookieList = [];

    this.cookies.forEach((value, key) => {
        cookieList.push(key + "=" + value);
    });

    return cookieList.join("; ");
}

/**
 * Check if the given cookie exists
 */
Cookies.prototype.has = function(key) {
    return this.cookies.has(key);
}

/**
 * Get the value of the given cookie
 */
Cookies.prototype.get = function(key) {
    return this.cookies.get(key);
}

/**
 * Set the cookie key to value
 */
Cookies.prototype.set = function(key, value) {
    this.cookies.set(key, value);
}


/**
 * Set single keys in the PREF cookie used by youtube to store settings
 *
 * @param cookies Cookies The cookies instance to modify
 * @param key string The key to set or replace if existing, eg. "f2"
 * @param value string The value for the given key
 */
function modifyPrefCookie(cookies, key, value) {
    var entry = key + "=" + value;

    if(cookies.has("PREF")) {
        var pref = cookies.get("PREF");
        var pattern = new RegExp(key + "=[^&]+");

        if(pref.length == 0) {
            pref = entry;
        } else if(-1 == pref.search(pattern)) {
            pref += "&" + entry;
        } else {
            pref = pref.replace(pattern, entry);
        }
        cookies.set("PREF", pref);
    } else {
        cookies.set("PREF", entry);
    }
}


// Event listener that calls the other registered listeners based on
// the active state and the given hostname.
// The cookie header is only parsed when at least one callback is applicable.
function httpListener(event) {
    var request = event.subject.QueryInterface(Ci.nsIHttpChannel);
    var host = request.URI.host;

    var applicableListeners = listeners.filter((listener) => {
        return listener.active && listener.host === host;
    });

    if(applicableListeners.length > 0) {
        var cookieString = "";
        try {
            cookieString = request.getRequestHeader("Cookie");
        } catch(ex) {}

        var cookies = new Cookies(cookieString);

        applicableListeners.forEach((listener) => {
            listener.callback(cookies);
        });

        // setting an empty string (no cookies) deletes the header
        request.setRequestHeader("Cookie", cookies.unparse(), false);
    }
}

// Register httpListener function
events.on("http-on-modify-request", httpListener);

// Unregister httpListener on unload
require("sdk/system/unload").when(function() {
    events.off("http-on-modify-request", httpListener);
    listeners = [];
});
