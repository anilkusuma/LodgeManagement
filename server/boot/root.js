'use strict';

module.exports = function(server) {
	var customeLib = require('../customlib.js');
  	var path = require('path');
  	var router = server.loopback.Router();
  	router.get('/',function(req,res){
      	customeLib.validateCookies(req,function(validated,user){
	        var user = JSON.parse(user);
	  	  	if(validated){
	            res.sendFile(path.resolve('../client/home.html'));
    		}else{
    			res.sendFile(path.resolve('../client/login.html'));
    		}
		});
  	});
  	server.use(router);
};
