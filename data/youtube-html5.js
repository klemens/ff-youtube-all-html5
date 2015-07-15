function youtubeHtml5ButtonLoader(startOptions) {
    var options = startOptions;

    var html5Button = null;

    var that = this;

    this.installButton = function() {
        var insertInto = document.getElementById("yt-masthead-user")
                         || document.getElementById("yt-masthead-signin")
                         || document.getElementById("yt-masthead-content");
        if(!insertInto) {
            return;
        }

        // create the html5 button
        html5Button = document.createElement("button");
        html5Button.className = "yt-uix-button yt-uix-button-default yt-uix-button-size-default yt-uix-button-empty yt-uix-tooltip";
        html5Button.dataset.tooltipText = "YouTube ALL HTML5 - " + options.version;
        html5Button.style.backgroundImage = "url(" + options.buttonImageUrl + ")";
        html5Button.style.backgroundRepeat = "no-repeat";
        html5Button.style.backgroundPosition = "5px 50%";
        html5Button.style.padding = "0 5px 0 30px";
        html5Button.style.marginRight = "15px";

        var arrowImage = document.createElement("img");
        arrowImage.className = "yt-uix-button-arrow";
        arrowImage.src = "//s.ytimg.com/yts/img/pixel-vfl3z5WfW.gif";
        html5Button.appendChild(arrowImage);

        var menuList = document.createElement("ol");
        menuList.className = "yt-uix-button-menu hid";
        html5Button.appendChild(menuList);

        // Insert values into the list
        for(var i in options.playerHeights) {
            var li = document.createElement("li");
            menuList.appendChild(li);

            var span = document.createElement("span");
            span.className = "yt-uix-button-menu-item";
            span.style.padding = "0 1em";
            span.textContent = "Resize to " + options.playerHeights[i] + "p";
            span.dataset.playersize = options.playerHeights[i];
            span.addEventListener("click", function(event) {
                resizePlayer(event.target.dataset.playersize);
            });
            li.appendChild(span);
        }

        // add force playback link
        var li = document.createElement("li");
        menuList.appendChild(li);
        var span = document.createElement("span");
        span.className = "yt-uix-button-menu-item";
        span.style.padding = "0 1em";
        span.textContent = "Force playback";
        span.addEventListener("click", function() {
            that.startVideo();
        });
        li.appendChild(span);

        // add settings link
        li = document.createElement("li");
        menuList.appendChild(li);
        span = document.createElement("span");
        span.className = "yt-uix-button-menu-item";
        span.style.padding = "0 1em 0 2.8em";
        span.style.backgroundImage = "url(" + options.settingsImageUrl + ")";
        span.style.backgroundRepeat = "no-repeat";
        span.style.backgroundSize = "14px";
        span.style.backgroundPosition = "1em 5px";
        span.textContent = "Settings";
        span.addEventListener("click", function(event) {
            self.port.emit("openSettings", "");
        });
        li.appendChild(span);

        // insert into dom
        insertInto.insertBefore(html5Button, insertInto.firstChild);
    }

    this.showButton = function() {
        if(html5Button) {
            html5Button.parentNode.style.removeProperty("display");
        } else {
            that.installButton();
        }
    }

    this.hideButton = function() {
        if(html5Button) {
            html5Button.parentNode.style.setProperty("display", "none");
        }
    }

    this.isVideoSite = function() {
        return /\/watch.*/.test(window.location.pathname);
    }

    this.isPlaylistSite = function() {
        return !! (getUrlParams().list);
    }

    this.startVideo = function() {
        var url = getUrlParams();

        if(url && url.v) {
            var insertInto = document.getElementById("player-api-legacy") ||
                             document.getElementById("player-api");
            insertVideoIframe(url.v, insertInto);

            return true;
        }

        return false;
    }

    this.hideFlashPlugin = function() {
        // By Alexander Schlarb, alexander4456@xmine128.tk
        var unsafeNavigator = window.navigator.wrappedJSObject;

        // Generate new plugins list
        var plugins = [];
        for(var i = 0; i < unsafeNavigator.plugins.length; ++i) {
            var plugin = unsafeNavigator.plugins[i];

            if(plugin.name != "Shockwave Flash") {
                plugins.push(plugin);
            }
        }

        // Use fake plugins list overwrite
        unsafeNavigator.__defineGetter__("plugins", function() {
            return plugins;
        });

        // Generate new MIME types list
        var mimeTypes = [];
        for(var i = 0; i < unsafeNavigator.mimeTypes.length; ++i) {
            var mimeType = unsafeNavigator.mimeTypes[i];

            if(mimeType.type != "application/x-shockwave-flash") {
                mimeTypes.push(mimeType);
            }
        }

        // Register fake mime types list overwrite
        unsafeNavigator.__defineGetter__("mimeTypes", function() {
            return mimeTypes;
        });
    }

    this.autoSizeVideo = function() {
        resizePlayer(options.settings["yt-player-height"]);
    }


    function resizePlayer(height) {
        var playerApi = document.getElementById("player-api-legacy") ||
                        document.getElementById("player-api");
        var player = document.getElementById("player-legacy") ||
                     document.getElementById("player");

        height = parseInt(height);

        if(height == 0 || height == -2 || !playerApi || !player) return;

        // this differs between youtube designs, known: 225px, 0px (new)
        var leftPadding = parseInt(window.getComputedStyle(player).
                                   getPropertyValue('padding-left'));

        // try to calculate the heigt based on site width
        if(height < 0) {
            var availableWidth = document.body.clientWidth - leftPadding;

            var sizesReverse = options.playerHeights.slice().reverse();
            for(var i in sizesReverse) {
                if(availableWidth >= (sizesReverse[i] * 16 / 9)) {
                    height = sizesReverse[i];
                    break;
                }
            }

            if(height < 0) return;
        }

        // Sidebar has negative top margin by default
        var sidebar = document.getElementById("watch7-sidebar");
        if(sidebar) {
            sidebar.style.transition = "none";
            sidebar.style.marginTop = "0";
            sidebar.style.top = "0";
        }

        // Fix playlist position
        var playlist = document.getElementById("watch-appbar-playlist");
        if(playlist) {
            playlist.style.setProperty("margin-left", "0", "important");
            playlist.style.marginTop = "10px";
        }

        var placeholderPlayer = document.getElementById("placeholder-player");
        if(placeholderPlayer) {
            placeholderPlayer.style.display = "none";
        }

        player.style.width = (height * 16 / 9) + "px";
        player.style.marginBottom = "10px";
        player.style.maxWidth = "none";
        playerApi.style.position = "relative";
        playerApi.style.margin = "auto";
        playerApi.style.left = "auto";
        playerApi.style.width = (height * 16 / 9) + "px";
        playerApi.style.height = (height + 30) + "px"; // 30px for nav
    }

    function insertVideoIframe(video, insertInto) {
        if(!insertInto) {
            return;
        }

        var player = document.createElement("iframe");

        player.src = location.protocol + "//www.youtube.com/embed/" + video + "?rel=0&autoplay=1";
        player.id = "fallbackIframe";
        player.width = "100%";
        player.height = "100%";
        player.setAttribute('allowfullscreen', '');

        // Remove all childern before inserting iframe
        while(insertInto.hasChildNodes()) {
            insertInto.removeChild(insertInto.firstChild);
        }
        insertInto.appendChild(player);

        // handle iframe to video quality script
        dispatchEvent("registerIframe", { id: player.id });

        // listen for iframe video end and proceed to next video on playlist sites
        var autoplayButton = document.querySelector(".toggle-autoplay");
        var nextVideoButton = document.querySelector(".next-playlist-list-item");
        if(that.isPlaylistSite()) {
            document.documentElement.addEventListener("iframeStopped", function(event) {
                if(autoplayButton.classList.contains("yt-uix-button-toggled")) {
                    nextVideoButton.click();
                }
            });
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

    function dispatchEvent(type, detail) {
        var event = document.createEvent('CustomEvent');
        event.initCustomEvent(type, true, true, detail);
        document.documentElement.dispatchEvent(event);
    }
}

var youtubeHtml5Button = new youtubeHtml5ButtonLoader(self.options);

// remove flash plugin from the supported plugin list
// this makes youtube think flash is disabled when click_to_play is enabled
if(!(window.wrappedJSObject.ytplayer && window.wrappedJSObject.ytplayer.config &&
     window.wrappedJSObject.ytplayer.config.args["live_playback"])) {
    youtubeHtml5Button.hideFlashPlugin();
}

// install button if we are on a video site
if(youtubeHtml5Button.isVideoSite()) {
    youtubeHtml5Button.installButton();
    youtubeHtml5Button.autoSizeVideo();
}

// check if spf is enabled
if(window.wrappedJSObject.ytspf && window.wrappedJSObject.ytspf.enabled) {
    if(self.options.settings["yt-disable-spf"]) {
        // disbale spf by disposing the spf object
        // inspired by YePpHa's YouTubeCenter (https://github.com/YePpHa/YouTubeCenter)
        if(window.wrappedJSObject.spf && window.wrappedJSObject.spf.dispose) {
            window.wrappedJSObject.spf.dispose();
        }
    } else {
        // listen for spf page changes, update button (and start video)
        var spfObserver = new MutationObserver(function(mutations) {
            mutations.forEach(function(mutation) {
                for(var i = 0; i < mutation.removedNodes.length; ++i) {
                    if(mutation.removedNodes[i].id && mutation.removedNodes[i].id == "progress") {
                        if(youtubeHtml5Button.isVideoSite()) {
                            youtubeHtml5Button.showButton();
                            youtubeHtml5Button.autoSizeVideo();
                        } else {
                            youtubeHtml5Button.hideButton();
                        }

                        return;
                    }
                }
            });
        });
        spfObserver.observe(document.body, { childList: true });
    }
}
