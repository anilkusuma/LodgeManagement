module.exports = function(Login) {
    var customLib = require('../../server/customlib.js');
    var crypto = require('crypto');
    var app = require('../../server/server.js');
    var result = {};
    Login.authenticate = function(req,res,next){
        var password = req.query.password;
        if(password != undefined && password !== null){
            password = crypto.createHash('sha1').update(password).digest('Hex');
        }
        Login.find({where:{'and':[{'userName':req.query.userName},{'userPassword':password}]}},function(err,instance){
            if(instance.length!=0){
                result = instance[0].toJSON();
                var selector = customLib.getRandom(8);
                var validator = customLib.getRandom(8);
                validator = validator.toString();
                var loginId = instance[0].loginId;
                validator = crypto.createHash('sha1').update(validator).digest('Hex');
                app.models.Validator.create({'userId':loginId,'selector':selector,'validator':validator},function(err,object){
                    if(err)
                    {
                        result.validator = err;
                        result.validatorStatus="FAILED";
                    }
                    else
                    {
                         result.validator = object;
                         result.validatorStatus="SUCCESS";
                    }
                    result.loginStatus = "SUCCESS";
                    res.send(result);
                });
            }else{
				result = {};
                result.loginStatus="FAILURE";
                result.validatorStatus = "FAILED";
                result.failureReason="COMBINATIONDOESNOTEXIST";
                res.send(result);
            }
        });
    };
    Login.remoteMethod(
        'authenticate',
        {
            isStatice:true,
            accepts:[
                { arg:'req' ,type:'object','http':{source:'req'}},
                { arg:'res' ,type:'object','http':{source:'res'}},
            ],
            http:{path:'/login',verb:'get'}
        }
    ); 

    Login.userDetails = function(req,res,next){
        customLib.validateCookies(req,function(validated,user){
			console.log('status is'+validated);
			if(validated){
                var user = JSON.parse(user);
                var userID = user.userId;
                var userType = user.login[0].userType;
                var lodgeId = user.login[0].lodgeId;
                console.log('userType is '+user.login[0].userType);
                
                app.models.UserDetails.find({where:{'userId':userID}},function(err,instance){
                    if(instance.length!=0){
                        result = {};
                        result.responseData = instance;
                        result.userType = userType;
                        result.lodgeId = lodgeId;
                        result.userStatus = "SUCCESS";
                        result.loginStatus = "SUCCESS";
                        res.send(result);
                    }else{
                        result = {};
                        result.userType = userType;
                        result.lodgeId = lodgeId;
                        result.loginStatus="SUCCESS";
                        result.userStatus = "EMPTY";
                        result.failureReason="NOUSERDETAILS";
                        res.send(result);
                    }
                }); 
			}else{
				result = {};
				result.loginStatus="FAILED";
				result.vehicleStatus = "FAILED";
				result.failureReason="COMBINATIONDOESNOTEXIST";
				res.send(result);
			}
        });
    };
    Login.remoteMethod(
        'userDetails',
        {
            isStatice:true,
            accepts:[
                { arg:'req' ,type:'object','http':{source:'req'}},
                { arg:'res' ,type:'object','http':{source:'res'}},
            ],
            http:{path:'/bUserDetails',verb:'get'}
        }
    ); 
    
    
    Login.updatePassword = function(req,res,next){
        customLib.validateCookies(req,function(validated,user){
			if(validated){
                var user = JSON.parse(user);
                var userID = user.userId;
                var userType = user.login[0].userType;
                var password = req.query.oldPassword;
                password = crypto.createHash('sha1').update(password).digest('Hex');
                Login.find({where:{'and':[{'loginId':userID},{'userPassword':password}]}},function(err,instance){
                    if(instance.length!=0){
                        var newPassword = req.query.newPassword;
                        newPassword = crypto.createHash('sha1').update(newPassword).digest('Hex');
                        Login.updateAll({'loginId':userID},{'userPassword':newPassword},function(err,info){
                            if(err)
                            {
                                result = {};
                                result.returnStatus = 'ERROR';
                                console.log('error values is'+err);
                                res.send(result);
                            }
                            else if(info.count == 1)
                            {
                                result = {};
                                result.returnStatus = 'SUCCESS';
                                res.send(result);
                            }else{
                                result = {};
                                result.returnStatus = 'ERROR';
                                res.send(result);
                            }
                        });
                    }else{
                        result = {};
                        result.returnStatus="EMPTY";
                        res.send(result);
                    }
                });
            }else{
				result = {};
				result.loginStatus="FAILED";
				result.vehicleStatus = "FAILED";
				result.failureReason="COMBINATIONDOESNOTEXIST";
				res.send(result);
			}
        });
    };
    Login.remoteMethod(
        'updatePassword',
        {
            isStatice:true,
            accepts:[
                { arg:'req' ,type:'object','http':{source:'req'}},
                { arg:'res' ,type:'object','http':{source:'res'}},
            ],
            http:{path:'/bUpdatePassword',verb:'get'}
        }
    ); 

};