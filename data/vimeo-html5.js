function vimeoHtml5ButtonLoader(startOptions) {
    var options = startOptions;

    var html5Button = null;

    var that = this;

    this.installButton = function() {
        var insertInto = document.getElementById("tools");
        if(!insertInto) {
            console.log("no1");
            return;
        }

        // create the html5 button
        html5Button = document.createElement("a");
        html5Button.classList.add("btn");
        html5Button.textContent = "HTML5";
        html5Button.title = "Play video using HTML5";
        html5Button.style.paddingLeft = "30px";
        html5Button.style.marginRight = "0";
        html5Button.style.borderTopRightRadius = "0";
        html5Button.style.borderBottomRightRadius = "0";
        html5Button.style.cssFloat = "right";
        html5Button.style.backgroundImage = "url(" + options.buttonImageUrl + ")";
        html5Button.style.backgroundRepeat = "no-repeat";
        html5Button.style.backgroundPosition = "5px 55%";
        html5Button.addEventListener("click", function() {
            insertVideoIframe(getVideoId(), document.querySelector('.vimeo_holder'));
        });

        var fullscreenButton = document.createElement("a");
        fullscreenButton.classList.add("btn");
        fullscreenButton.title = "Play video using HTML5";
        fullscreenButton.style.paddingLeft = "20px";
        fullscreenButton.style.marginRight = "0";
        fullscreenButton.style.borderTopLeftRadius = "0";
        fullscreenButton.style.borderBottomLeftRadius = "0";
        fullscreenButton.style.cssFloat = "right";
        fullscreenButton.style.backgroundImage = "url(" + options.fullscreenButtonImageUrl + ")";
        fullscreenButton.style.backgroundRepeat = "no-repeat";
        fullscreenButton.style.backgroundPosition = "6px 50%";
        fullscreenButton.addEventListener("click", function() {
            var player = document.querySelector('.vimeo_holder');
            
            if (player.requestFullscreen) {
                player.requestFullscreen();
            } else if (player.mozRequestFullScreen) {
                player.mozRequestFullScreen();
            }
            
            addExitFullscreenButton(player);
        });

        // insert into dom
        insertInto.appendChild(fullscreenButton);
        insertInto.appendChild(html5Button);
    }


    function insertVideoIframe(video, insertInto) {
        if(!video && !insertInto) {
            return;
        }
        
        var player = document.createElement("iframe");

        player.src = "http://player.vimeo.com/video/" + video + "?autoplay=1";
        player.style.width = "100%";
        player.style.height = "100%";
        player.style.border = "none";
        player.setAttribute('allowfullscreen', 'allowfullscreen');
        player.setAttribute('sandbox', 'allow-same-origin allow-scripts');

        // Remove all childern before inserting iframe
        while(insertInto.hasChildNodes()) {
            insertInto.removeChild(insertInto.firstChild);
        }
        insertInto.appendChild(player);
    }
    
    function addExitFullscreenButton(fullscreenElement) {
        if(!fullscreenElement) {
            return false;
        }
        
        var button = document.createElement("button");
        button.style.position = "absolute";
        button.style.bottom = "5px";
        button.style.right = "5px";
        button.style.width = "20px";
        button.style.height = "20px";
        button.style.border = "none";
        button.style.background = "url(" + options.fullscreenButtonImageUrl + ") no-repeat scroll 50% 50% transparent";
        button.style.zIndex = "10";
        button.addEventListener("click", function() {
            if (document.cancelFullScreen) {
                document.cancelFullScreen();
            } else if (document.mozCancelFullScreen) {
                document.mozCancelFullScreen();
            }
            fullscreenElement.removeChild(button);
        });
        
        fullscreenElement.appendChild(button);
    }

    function getVideoId() {
        var result = /vimeo.com\/([0-9]+)/.exec(window.location);
        if(result[1]) {
            return result[1];
        } else {
            return null;
        }
    }
}

var vimeoHtml5Button = new vimeoHtml5ButtonLoader(self.options);
vimeoHtml5Button.installButton();
