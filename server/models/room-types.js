'use strict';
module.exports = function(RoomTypes) { 
    var customLib = require('../customlib.js');
    var app = require('../server.js');
	RoomTypes.getRoomTypes = function(req,res,next){
        customLib.validateCookies(req,function(validated,user){
			if(validated){
                var user = JSON.parse(user);
                var userID = user.userId;
                var userType = user.login[0].userType;
                var lodgeId = user.login[0].lodgeId;
                RoomTypes.find({where:{'lodgeId':lodgeId},include:'rooms'},function(err,instance){
                	if(err){
                		var result = {};
                		result.responseData = err;
                        result.returnStatus = "ERROR";
                        res.send(result);
                	}
                    if(instance.length!=0){
                        var result = {};
                        var responseData = [];
                        var rooms = [];
                        var temp = JSON.stringify(instance);
                        var roomTypes = JSON.parse(temp);
                        for(var i=0;i<roomTypes.length;i++){
                            var rooms = roomTypes[i].rooms;
                            roomTypes[i].rooms = [];
                            for(var j=0;j<rooms.length;j++){
                                if(rooms[j].roomCurrentStatus == null){
                                    roomTypes[i].rooms.push(rooms[j]);
                                }
                            }
                            if(roomTypes[i].rooms.length>0){
                                responseData.push(roomTypes[i]);
                            }
                        }
                        //console.log('responseData '+JSON.stringify(responseData)+'\n'+temp);
                        if(responseData.length == 0){
                            var result = {};
                            result.returnStatus = "EMPTY";
                            res.send(result);
                        }else{
                            var result = {};
                            result.responseData = responseData;
                            result.returnStatus = "SUCCESS";
                            res.send(result);
                        }
                    }else{
                        var result = {};
                        result.returnStatus = "EMPTY";
                        res.send(result);
                    }
                }); 
			}else{
				var result = {};
				result.returnStatus="FAILED";
				res.send(result);
			}
        });
    };
    RoomTypes.remoteMethod(
        'getRoomTypes',
        {
            isStatice:true,
            accepts:[
                { arg:'req' ,type:'object','http':{source:'req'}},
                { arg:'res' ,type:'object','http':{source:'res'}},
            ],
            http:{path:'/bGetRooms',verb:'get'}
        }
    ); 
   
};
