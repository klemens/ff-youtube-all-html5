function youtubeHtml5ButtonLoader(startOptions) {
    var options = startOptions;
    var button = null;
    var observer = null;
    var that = this;

    this.installButton = function() {
        // create the button
        button = document.createElement("button");

        // assign properties
        button.id = "youtube-html5-button";
        button.className = "yt-uix-button yt-uix-button-default";
        button.innerHTML = "HTML5";
        button.title = "Play video using HTML5";
        button.style.marginLeft = "25px";
        button.style.marginTop = "3px";
        button.style.paddingLeft = "30px";
        button.style.cssFloat = "right";
        button.style.backgroundImage = "url(" + options.buttonImageUrl + ")";
        button.style.backgroundRepeat = "no-repeat";
        button.style.backgroundPosition = "5px 50%";

        // assign onclick listener
        button.onclick = this.onButtonClick;

        // insert into dom
        var insertInto = document.getElementById("yt-masthead-content");
        if(insertInto) {
            insertInto.insertBefore(button, insertInto.firstChild);
        }
    }

    this.registerObserver = function() {
        if(observer != null) return;

        observer = new MutationObserver(function(mutations) {
            mutations.forEach(function(mutation) {
                for(var i = 0; i < mutation.addedNodes.length; ++i) {
                    if(mutation.addedNodes[i] instanceof HTMLAnchorElement &&
                       mutation.addedNodes[i].href.contains("get.adobe.com/flashplayer")) {
                        that.onButtonClick();
                        observer.disconnect();
                        return;
                    }
                }
            });
        });

        var insertInto = document.getElementById("player-api");
        if(insertInto) {
            observer.observe(insertInto, { childList: true, subtree: true });
        } else {
            observer = null;
        }
    }

    this.onButtonClick = function() {
        var url = getUrlParams();
        if(url && url.v) {
            var insertInto = document.getElementById("player-api");

            if(insertInto) {
                resizePlayer(insertInto, options.settings["resolution"]);

                insertVideoIframe(url.v, insertInto);
            }
        }

        button.blur();
    }


    function resizePlayer(player, resolution) {
        if(resolution == 0 || !player) return;

        // Sidebar has negative top margin by default
        var sidebar = document.getElementById("watch7-sidebar");
        if(sidebar)
            sidebar.style.marginTop = "25px";

        player.style.width = (resolution * 16 / 9) + "px";
        player.style.height = (resolution + 30) + "px"; // 30px for nav
    }

    function insertVideoIframe(video, insertInto) {
        var player = document.createElement("iframe");

        player.src = "https://www.youtube.com/embed/" + video + "?rel=0&autoplay=1";
        player.width = "100%";
        player.height = "100%";
        player.setAttribute('allowfullscreen', '');

        if(insertInto) {
            insertInto.innerHTML = "";
            insertInto.appendChild(player);
        }
    }

    // http://www.techtricky.com/how-to-get-url-parameters-using-javascript/
    function getUrlParams() {
        var params = {};
        window.location.search.replace(/[?&]+([^=&]+)=([^&]*)/gi, function(str, key, value) {
            params[key] = value;
        });
        return params;
    }
}

var youtubeHtml5Button = new youtubeHtml5ButtonLoader(self.options);

youtubeHtml5Button.installButton();
if(self.options.settings["autostart"])
    youtubeHtml5Button.registerObserver();
