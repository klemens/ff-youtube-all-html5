function youtubeHtml5ButtonLoader(startOptions) {
    var options = startOptions;
    var videoSizes = [480, 720, 1080];

    var html5Button = null;
    var observer = null;
    var tries = 0;

    var that = this;

    this.installButton = function() {
        var insertInto = document.getElementById("yt-masthead-content");
        if(!insertInto) {
            return;
        }

        // create outer span
        var buttonGroup = document.createElement("span");
        buttonGroup.className = "yt-uix-button-group";
        buttonGroup.style.marginLeft = "25px";
        buttonGroup.style.marginTop = "3px";
        buttonGroup.style.cssFloat = "right";

        // create the html5 button
        html5Button = document.createElement("button");
        html5Button.className = "yt-uix-button start yt-uix-button-default";
        html5Button.textContent = "HTML5";
        html5Button.title = "Play video using HTML5";
        html5Button.style.paddingLeft = "30px";
        html5Button.style.backgroundImage = "url(" + options.buttonImageUrl + ")";
        html5Button.style.backgroundRepeat = "no-repeat";
        html5Button.style.backgroundPosition = "5px 50%";
        html5Button.addEventListener("click", function() {
            that.startVideo();
            html5Button.blur();
        });
        buttonGroup.appendChild(html5Button);

        // create sizes menu
        var sizeMenu = document.createElement("button");
        sizeMenu.className = "end flip yt-uix-button yt-uix-button-default yt-uix-button-empty"
        buttonGroup.appendChild(sizeMenu);

        var arrowImage = document.createElement("img");
        arrowImage.className = "yt-uix-button-arrow";
        arrowImage.src = "//s.ytimg.com/yts/img/pixel-vfl3z5WfW.gif";
        sizeMenu.appendChild(arrowImage);

        var sizeList = document.createElement("ol");
        sizeList.className = "yt-uix-button-menu hid";
        sizeMenu.appendChild(sizeList);

        // Insert values into the list
        for(var i in videoSizes) {
            var li = document.createElement("li");
            sizeList.appendChild(li);

            var span = document.createElement("span");
            span.className = "yt-uix-button-menu-item";
            span.textContent = "Resize to " + videoSizes[i] + "p";
            span.dataset.videosize = videoSizes[i];
            span.addEventListener("click", function(event) {
                resizePlayer(event.target.dataset.videosize);
            });
            li.appendChild(span);
        }

        // insert into dom
        insertInto.insertBefore(buttonGroup, insertInto.firstChild);
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

    this.startVideoOnError = function() {
        var check = function(node) {
            return (node instanceof HTMLDivElement) &&
                    node.classList.contains("ytp-error");
        }

        // check if the error is already shown
        var error = document.querySelector("#movie_player > .ytp-error");
        if(error && window.getComputedStyle(error).display != "none") {
            youtubeHtml5Button.startVideo();
            return;
        }

        // otherwise wait for it
        if(observer == null) {
            observer = new MutationObserver(function(mutations) {
                var found = false;

                mutations.forEach(function(mutation) {
                    found = found || check(mutation.target);
                    for(var i = 0; i < mutation.addedNodes.length; ++i) {
                        found = found || check(mutation.addedNodes[i]);
                    }
                });

                if(found) {
                    that.startVideo();
                    observer.disconnect();
                }
            });
        }

        var observee = document.getElementById("player-legacy") ||
                       document.getElementById("player");
        if(observee) {
            observer.observe(observee, { childList: true, subtree: true });
        }
    }

    this.isVideoSite = function() {
        return /\/watch.*/.test(window.location.pathname);
    }
    
    this.reset = function() {
        if(html5Button) {
            html5Button.classList.remove("yt-uix-button-toggled");
        }
        
        tries = 0;
        
        if(observer) {
            observer.disconnect();
            disconnect = null;
        }
    }

    this.startVideo = function() {
        var url = getUrlParams();

        if(url && url.v) {
            if(tries == 0) {
                if(options.settings["loadtype"] == "api") {
                    insertVideoApi(url.v);
                } else if(options.settings["loadtype"] == "iframe") {
                    var insertInto = document.getElementById("player-api-legacy") ||
                                     document.getElementById("player-api");
                    insertVideoIframe(url.v, insertInto);
                }
            } else if(tries > 0) {
                var insertInto = document.getElementById("player-api-legacy") ||
                                 document.getElementById("player-api");
                insertVideoIframe(url.v, insertInto);
            } else {
                return false;
            }

            ++tries;
            html5Button.classList.add("yt-uix-button-toggled");

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


    function resizePlayer(height) {
        var playerApi = document.getElementById("player-api-legacy") ||
                        document.getElementById("player-api");
        var player = document.getElementById("player-legacy") ||
                     document.getElementById("player");

        height = parseInt(height);

        if(height == 0 || !playerApi || !player) return;

        // this differs between youtube designs, known: 225px, 0px (new)
        var leftPadding = parseInt(window.getComputedStyle(player).
                                   getPropertyValue('padding-left'));

        // try to calculate the heigt based on site width
        if(height < 0) {
            var availableWidth = window.innerWidth - leftPadding;

            var sizesReverse = videoSizes.slice().reverse();
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
            sidebar.style.marginTop = "5px";
        }

        // new youtube design (09-2013)
        if(0 == leftPadding) {
            player.style.width = (height * 16 / 9) + "px";
            player.style.marginBottom = "28px";
        }

        playerApi.style.width = (height * 16 / 9) + "px";
        playerApi.style.height = (height + 30) + "px"; // 30px for nav
    }

    function insertVideoApi(video) {
        var player = window.document.getElementById('movie_player');

        if(player && player.wrappedJSObject && player.wrappedJSObject.loadVideoById) {
            setTimeout(function() {
                player.wrappedJSObject.loadVideoById(video);
            }, 100);
        }
    }

    function insertVideoIframe(video, insertInto) {
        var player = document.createElement("iframe");

        player.src = "https://www.youtube.com/embed/" + video + "?rel=0&autoplay=1";
        player.width = "100%";
        player.height = "100%";
        player.setAttribute('allowfullscreen', '');

        if(insertInto) {
            // Remove all childern before inserting iframe
            while(insertInto.hasChildNodes()) {
                insertInto.removeChild(insertInto.firstChild);
            }
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

// remove flash plugin from the supported plugin list
// this makes youtube think flash is disabled when click_to_play is enabled
if(!(window.wrappedJSObject.ytplayer && window.wrappedJSObject.ytplayer.config &&
     window.wrappedJSObject.ytplayer.config.args["live_playback"])) {
    youtubeHtml5Button.hideFlashPlugin();
}

youtubeHtml5Button.installButton();

// autostart if not using the ie method
if("ie" != self.options.settings["loadtype"]) {
    youtubeHtml5Button.startVideoOnError();

    spfObserver = new MutationObserver(function(mutations) {
        mutations.forEach(function(mutation) {
            for(var i = 0; i < mutation.removedNodes.length; ++i) {
                if(mutation.removedNodes[i].id && mutation.removedNodes[i].id == "progress") {
                    youtubeHtml5Button.reset();

                    var error = document.querySelector("#movie_player > .ytp-error");
                    if(window.getComputedStyle(error).display != "none") {
                        youtubeHtml5Button.startVideo();
                    }
                    return;
                }
            }
        });
    });
    spfObserver.observe(document.body, { childList: true });
}
