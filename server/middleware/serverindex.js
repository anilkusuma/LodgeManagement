module.exports = serveindex;
var customeLib = require('../customlib.js');
var path = require('path');
function serveindex(){
    return function(req, res){
        customeLib.validateCookies(req,function(validated,user){
            var user = JSON.parse(user);
  	  	    if(validated){
                res.sendFile(path.resolve('../client/home.html'));
  		      }else{
  			       res.sendFile(path.resolve('../client/login.html'));
  		      }
        });
    }
}