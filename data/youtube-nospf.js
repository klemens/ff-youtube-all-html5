// inspired by Maciej Katafiasz (http://mathrick.org)
// http://userscripts.org/scripts/review/170194

// disable spf links on non-video sites when not using ie emulation
if("ie" != self.options.settings["loadtype"] && window.wrappedJSObject.ytspf &&
   window.wrappedJSObject.ytspf.enabled) {
    window.addEventListener("click", function(event) {
        if(/\/watch.*/.test(window.location.pathname)) {
            return;
        }

        // check if click came from a link
        var target = event.target;
        while(target) {
            if(target instanceof HTMLAnchorElement &&
               target.classList.contains("spf-link")) {
                event.stopPropagation();
                return;
            }
            target = target.parentNode;
        }
    }, true);
}
