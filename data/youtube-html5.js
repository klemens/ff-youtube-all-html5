// http://www.techtricky.com/how-to-get-url-parameters-using-javascript/
function getUrlParams() {
    var params = {};
    window.location.search.replace(/[?&]+([^=&]+)=([^&]*)/gi, function(str, key, value) {
        params[key] = value;
    });
    return params;
}

function resizePlayerWindow(player, resolution) {
    if(resolution == 0 || !player) return;
    
    // Sidebar has negative top margin by default
    var sidebar = document.getElementById("watch7-sidebar");
    if(sidebar)
        sidebar.style.marginTop = "25px";
    
    player.style.width = (resolution * 16 / 9) + "px";
    player.style.height = (resolution + 30) + "px";
}

// create the button
var youtubeHtml5Button = document.createElement("button");
// assign properties
youtubeHtml5Button.id = "youtube-html5-button";
youtubeHtml5Button.className = "yt-uix-button yt-uix-button-default";
youtubeHtml5Button.innerHTML = "HTML5";
youtubeHtml5Button.title = "Play video using HTML5";
youtubeHtml5Button.style.marginLeft = "25px";
youtubeHtml5Button.style.marginTop = "3px";
youtubeHtml5Button.style.paddingLeft = "30px";
youtubeHtml5Button.style.cssFloat = "right";
youtubeHtml5Button.style.backgroundImage = "url(" + self.options.buttonImageUrl + ")";
youtubeHtml5Button.style.backgroundRepeat = "no-repeat";
youtubeHtml5Button.style.backgroundPosition = "5px 50%";

// insert into dom
var insertInto = document.getElementById("yt-masthead-content");
var insertBefore = document.getElementById("masthead-search");
if(insertInto && insertBefore)
    insertInto.insertBefore(youtubeHtml5Button, insertInto.firstChild);

// assign click handler
youtubeHtml5Button.onclick = function() {
    var url = getUrlParams();
    if(url && url.v) {
        var player = document.createElement("iframe");
        player.src = "https://www.youtube.com/embed/" + url.v + "?rel=0";
        if(self.options.options["autoplay"])
            player.src += "&autoplay=1";
        player.width = "100%";
        player.height = "100%";
        player.setAttribute('allowfullscreen', '');
        
        var insertInto = document.getElementById("player-api");
        if(insertInto) {
            if(self.options.options["resolution"])
                resizePlayerWindow(insertInto, self.options.options["resolution"]);

            insertInto.innerHTML = "";
            insertInto.appendChild(player);
        }
        
        youtubeHtml5Button.blur();
    }
};