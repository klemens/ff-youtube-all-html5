// inspired by Maciej Katafiasz (http://mathrick.org)
// http://userscripts.org/scripts/review/170194

// disable spf links on non-video sites
if(!(/\/watch.*/.test(window.location.pathname))) {
    var stopPropagation = function(event) {
        event.stopPropagation();
    }
    
    var spfLinks = document.querySelectorAll("a.spf-link");
    for(var i = 0; i < spfLinks.length; ++i) {
        spfLinks[i].addEventListener("click", stopPropagation, true);
    }
}