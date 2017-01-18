
String.prototype.toTitleCase = function(){
  return this.replace(/\b(\w+)/g, function(m,p){ return p[0].toUpperCase() + p.substr(1).toLowerCase() })
}

var hidePreloader = function(option,callback){
    $('.sub-preloaderDiv').hide();
    $('#main').css('display','block');
    $('#main').css('justify-content','inherit');
    $('#main').css('align-items','inherit');
    $(".container .page-content").fadeIn(200,callback);
};
var showPreloader = function(){
    $(".container .page-content").hide();
    $('#main').css('display','flex');
    $('#main').css('justify-content','center');
    $('#main').css('align-items','center');
    $('.sub-preloaderDiv').show();
};
function toggleFullScreen(elem) {
    elem = document.getElementById(elem);
    if ((document.fullScreenElement !== undefined && document.fullScreenElement === null) || (document.msFullscreenElement !== undefined && document.msFullscreenElement === null) || (document.mozFullScreen !== undefined && !document.mozFullScreen) || (document.webkitIsFullScreen !== undefined && !document.webkitIsFullScreen)) {
        if (elem.requestFullScreen) {
            elem.requestFullScreen();
        }
        else if (elem.mozRequestFullScreen) {
            elem.mozRequestFullScreen();
        }
        else if (elem.webkitRequestFullScreen) {
            elem.webkitRequestFullScreen(Element.ALLOW_KEYBOARD_INPUT);
        }
    }
    else {
        if (document.cancelFullScreen) {
            document.cancelFullScreen();
        }
        else if (document.mozCancelFullScreen) {
            document.mozCancelFullScreen();
        }
        else if (document.webkitCancelFullScreen) {
            document.webkitCancelFullScreen();
        }
    }
};
    


    


