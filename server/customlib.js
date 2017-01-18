module.exports.isEmptyObject = function(obj) {
      for (var key in obj) {
        if (Object.prototype.hasOwnProperty.call(obj, key)) {
          return false;
        }
      }
      return true;   
 };
module.exports.getRandom = function(length) {
    return Math.floor(Math.pow(10, length-1) + Math.random() * 9 * Math.pow(10, length-1)); 
};

module.exports.validateCookies = function(req,callback){
	var app = require('./server.js');
	var customLib = require('./customlib.js');
    if(req.query.validator != undefined && req.query.selector != undefined && req.query.userId != undefined){
		app.models.Validator.find({where:{'and':[{'validator':req.query.validator},{'selector':req.query.selector}]},include:'login'},function(err,instance){       			
			if(instance.length !== 0){
                if(instance[0].userId == req.query.userId){
				    callback(true,JSON.stringify(instance[0]));
			     }else{
				    callback(false,null);
			     }
            }
            else{
                callback(false,null);
            }
 		});
	}else if(!customLib.isEmptyObject(req.headers.cookie)){
    	var lists = req.headers.cookie.split("; ");
        var cookies = {};
        for(i=0;i<lists.length;i++){
        	var c = lists[i].split("=");
            if(c.length>=2)
            	cookies[c[0]] = c[1];
		}
		app.models.Validator.find({where:{'and':[{'validator':cookies.validator},{'selector':cookies.selector}]},include:'login'},function(err,instance){       			
			if(instance.length !== 0){
                if(instance[0].userId == cookies.userID){
				    callback(true,JSON.stringify(instance[0]));
			    }else{
				    callback(false,null);
			    }
            }
            else{
                callback(false,null);
            }
 		});
	} else{
		callback(false,null);
	}
};
module.exports.validateSelectors = function(validator,selector,userId,callback){
	var app = require('./server.js');
	var customLib = require('./customlib.js');
	app.models.VtsValidator.find({where:{'and':[{'validator':validator},{'selector':selector}]}},function(err,instance){ 
		if(instance.length !== 0){
			if(instance[0].userId == userId){
				callback(true);
			}
			else{
				callback(false);
			}
		}else{
			callback(false);
		}
	});
};


module.exports.sendPromotionalSms = function(mobileNumber,message,callback){
	var http = require('http');
	var app = require('./server.js');
	var apiKey = "VPQuvtNmLDE-xatKc0fIrUvzfz46bZcTPEYK4lDdhW";
	var numbers = '91'+mobileNumber;
	var message = message;
	var sender = "TXTLCL";
	var dataString = "apiKey="+apiKey+"&numbers="+numbers+"&message="+message+"&sender="+sender;
    var path='http://api.textlocal.in/send/?'+dataString;
    console.log('path is  '+path);
	var req = http.get(path, function(resp){
   		resp.setEncoding('utf8');
    	resp.on('data', function(responseText){
    		console.log('responseText is : '+responseText);
    		responseText = JSON.parse(responseText);
    		if(responseText.status == 'success'){
    			callback("SUCCESS",mobileNumber);
    		}else{
    			callback("FAILED",mobileNumber);
    		}
    	});
	});
	req.end();
};

module.exports.sendTransactionalSms = function(mobileNumbers,message,callback){
	var http = require('http');
	var app = require('./server.js');
	var apiKey = "qNlytfe4Exg-vwWMvXAnmneZC3hMsNXxe9BIaHLAUI";
	var numbers = mobileNumbers;
	var message = message;
	var sender = "APAGON";
	var dataString = "apiKey="+apiKey+"&numbers="+numbers+"&message="+message+"&sender="+sender;
    var path='http://api.textlocal.in/send/?'+dataString;
    console.log('path is  '+path);
	var req = http.get(path, function(resp){
   		resp.setEncoding('utf8');
    	resp.on('data', function(responseText){
    		console.log('responseText is : '+responseText);
    		responseText = JSON.parse(responseText);
    		if(responseText.status == 'success'){
    			console.log('message sent' + numbers);
    			callback("SUCCESS");
    		}else{
    			callback("FAILED");
    		}
    	});
	});
	req.end();
};

module.exports.sendSmsToAdmin = function(lodgeId,message,callback){
	var app = require('./server.js');
	var customLib = require('./customlib.js');
	app.models.Login.find({'where':{'and':[{'userType':'ADMIN'},{'lodgeId':lodgeId}]},'include':'users'},function(err,instance){
        if(err){
            console.log(err);
            callback("ERROR");
        }else if(instance.length==0){
            console.log('No Admin For Lodge'+lodgeId);
            callback("EMPTY");
        }else{
            var mobileNumbers = '';
            for(var i=0;i<instance.length;i++){
                var temp = JSON.stringify(instance[i]);
                instance[i] = JSON.parse(temp);
                if(i==0){
                    mobileNumbers = '91'+instance[0].users.mobileNumber;
                }else{
                    mobileNumbers = mobileNumbers+','+'91'+instance[0].users.mobileNumber;
                }
            }
            customLib.sendTransactionalSms(mobileNumbers,message,function(status){
            });
            callback("SUCCESS");
        }
    }); 
};
