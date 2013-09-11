function youtubeHtml5ButtonLoader(startOptions) {
    var options = startOptions;
    var videoSizes = [480, 720, 1080];

    var html5Button = null;
    var observer = null;
    var started = false;
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
            that.startAndResize(options.settings["resolution"]);
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

    this.registerObserver = function() {
        var check = function(node) {
            return (node instanceof HTMLDivElement) &&
                    node.classList.contains("ytp-error");
        }

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
                    that.startAndResize(options.settings["resolution"]);
                    observer.disconnect();
                }
            });
        }

        var insertInto = document.getElementById("player-legacy") ||
                         document.getElementById("player");
        if(insertInto) {
            observer.observe(insertInto, { childList: true, subtree: true });
        }
    }

    this.startAndResize = function(size) {
        var url = getUrlParams();

        html5Button.blur();

        if(url && url.v) {
            resizePlayer(size);

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

            started = true;
            ++tries;
            html5Button.classList.add("yt-uix-button-toggled");

            return true;
        }

        return false;
    }


    function resizePlayer(height) {
        var player = document.getElementById("player-api-legacy") ||
                     document.getElementById("player-api");

        height = parseInt(height);

        if(height == 0 || !player) return;

        // try to calculate the heigt based on site width
        if(height < 0) {
            var playerSize = player.getBoundingClientRect();
            var availableWidth = window.innerWidth - playerSize.left - 10;

            var sizesReverse = videoSizes.slice().reverse();
            for(var i in sizesReverse) {
                if(availableWidth > sizesReverse[i] / 9 * 16) {
                    height = sizesReverse[i];
                    break;
                }
            }

            if(height < 0) return;
        }

        // Sidebar has negative top margin by default
        var sidebar = document.getElementById("watch7-sidebar");
        if(sidebar) {
            sidebar.style.marginTop = "25px";
        }

        var topbar = document.getElementById("yt-masthead-content");
        if(topbar) {
            topbar.style.maxWidth = (height * 16 / 9) + "px";
        }

        player.style.width = (height * 16 / 9) + "px";
        player.style.height = (height + 30) + "px"; // 30px for nav
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

youtubeHtml5Button.installButton();
youtubeHtml5Button.registerObserver();
