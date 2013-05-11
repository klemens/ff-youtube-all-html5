// http://www.techtricky.com/how-to-get-url-parameters-using-javascript/
function getUrlParams() {
    var params = {};
    window.location.search.replace(/[?&]+([^=&]+)=([^&]*)/gi, function(str, key, value) {
        params[key] = value;
    });
    return params;
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
        player.src = "https://www.youtube.com/embed/" + url.v + "?rel=0&autoplay=1";
        player.width = "100%";
        player.height = "100%";
        player.setAttribute('allowfullscreen', '');
        
        var insertInto = document.getElementById("player-api");
        if(insertInto) {
            insertInto.innerHTML = "";
            insertInto.appendChild(player);
        }
        
        youtubeHtml5Button.blur();
    }
};