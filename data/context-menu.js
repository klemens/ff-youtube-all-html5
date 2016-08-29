// http://www.techtricky.com/how-to-get-url-parameters-using-javascript/
function parseUrlQuery(query) {
    var params = {};
    query.replace(/[?&]+([^=&]+)=([^&]*)/gi, function(str, key, value) {
        params[key] = value;
    });
    return params;
}

self.on("click", function(node, data) {
    self.postMessage(parseUrlQuery(node.search).v);
});

self.on("context", function(link) {
    // link could be any descendant of the a-tag
    while(!(link instanceof HTMLAnchorElement)) {
        if(link.parentElement !== null) {
            link = link.parentElement;
        } else {
            // should not happen, as this function is
            // only called for clicks on "a[href]"
            return false;
        }
    }

    // link points to a youtube video
    if(link.hostname != "www.youtube.com" ||
       link.pathname != "/watch") {
        return false;
    }

    var parameters = parseUrlQuery(link.search);

    // check that the video link is not broken
    if(!("v" in parameters)) {
        return false;
    }

    // show the entry for video links which include a playlist
    return ("list" in parameters);
});
