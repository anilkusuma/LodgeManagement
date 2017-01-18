'use strict';
module.exports = function(Extension) {
	var bodyParser = require('body-parser').urlencoded({extended: true});
    var customLib = require('../../server/customlib.js');
    var app = require('../../server/server.js');
    var moment = require('moment');
    var http = require('http');
    var result = {};
	Extension.requestExtension = function(req,res,next){
        customLib.validateCookies(req,function(validated,user){
			if(validated){
                var user = JSON.parse(user);
                var userID = user.userId;
                var userName = user.login[0].userName;
                var userType = user.login[0].userType;
                var lodgeId = user.login[0].lodgeId;
                var object = req.body.requestData;
                var request = {};

                request.bookingId = object.bookingId;
                request.lodgeId = lodgeId;
                request.currentCheckoutTime=moment(object.currentCheckOutTime,'D/MM/YYYY H:mm').format("YYYY-MM-DD HH:mm:ss");
                request.extendedCheckOutDate = moment(object.newCheckOutTime,'D/MM/YYYY H:mm').format("YYYY-MM-DD HH:mm:ss");
                request.requestingUser = userID;
                request.approvalStatus = "WAITING";
		        request.roomNumber = object.roomNumber;
		        request.extensionReason = object.extensionReason;
		        request.guestName = object.guestName;
		        console.log('request is '+JSON.stringify(request));
                Extension.create(request,function(err,obj){
                	request.extId = obj.extId;
                	if(err){
                        result = {};
                        console.log(err);
                        result.returnStatus = "ERROR";
                        res.send(result);
                        return;
                    }else{ 
                    	var booking ={};
                    	booking.bookingId = request.bookingId;
						app.models.Bookings.findById(booking.bookingId,function(err, instance) {
							if(err){
								console.log(err);
                                Extension.destroyById(request.extId,function(err){
                                });
                                result = {};
                                result.returnStatus = "ERROR";
                                res.send(result);
                                return;
							}else if(instance.length == 0){
								console.log('No booking for bookingId '+booking.bookingId);
                                Extension.destroyById(request.extId,function(err){
                                });
                                result = {};
                                result.returnStatus = "EMPTY";
                                res.send(result);
                                return;
							}else{
								booking.bookingStatus = "EXTENSION";
                                booking.extensionId = request.extId;
							    instance.updateAttributes(booking,function(err,info){
							    	if(err){
		                                console.log(err);
		                                Extension.destroyById(request.extId,function(err){
		                                });
		                                result = {};
		                                result.returnStatus = "ERROR";
		                                res.send(result);
		                                return;
		                            }else if(info.count==0){
		                                console.log('No booking for bookingId '+booking.bookingId);
		                                Extension.destroyById(request.extId,function(err){
		                                });
		                                result = {};
		                                result.returnStatus = "EMPTY";
		                                res.send(result);
		                                return;
		                            }else{
		                            	var message = "Extension Request for Room : "+request.roomNumber+" up to "+object.newCheckOutTime+" by User "+user.login[0].userName+" for guest "+request.guestName+".";
		                            	customLib.sendSmsToAdmin(lodgeId,message,function(status){
		                            	});
		                            	result = {};
		                            	result.returnStatus = "SUCCESS";
		                                res.send(result);
		                                return;
		                            }
							    });
							}
						});
                    }
                });
            }else{
                result = {};
                result.returnStatus = "FAILED";
                res.send(result);
            }
        });
    };
    Extension.remoteMethod(
        'requestExtension',
        {
            isStatice:true,
            accepts:[
                { arg:'req' ,type:'object','http':{source:'req'}},
                { arg:'res' ,type:'object','http':{source:'res'}},
            ],
            http:{path:'/ExtendRoom',verb:'post'}
        }
    );

    Extension.ExtensionAdmin = function(req,res,next){
        customLib.validateCookies(req,function(validated,user){
            if(validated){
                var object = req.body.requestData;
                var user = JSON.parse(user);
                object.user = user;
                object.userID = user.userId;
                object.userName = user.login[0].userName;
                object.userType = user.login[0].userType;
                object.lodgeId = user.login[0].lodgeId;
                Extension.ExtendUpdateAdmin(object,function(status){
                    var result = {};
                    result.returnStatus = status;
                    res.send(result);
                });
            }else{
                result = {};
                result.returnStatus = "FAILED";
                res.send(result);
            }
        });
    };
    Extension.remoteMethod(
        'ExtensionAdmin',
        {
            isStatice:true,
            accepts:[
                { arg:'req' ,type:'object','http':{source:'req'}},
                { arg:'res' ,type:'object','http':{source:'res'}},
            ],
            http:{path:'/ExtendAdmin',verb:'post'}
        }
    );

    Extension.ExtendUpdateAdmin = function(object,callback){
        var request = {};
        request.bookingId = object.bookingId;
        request.lodgeId = object.lodgeId;
        request.currentCheckoutTime=moment(object.currentCheckOutTime,'D/MM/YYYY H:mm').format("YYYY-MM-DD HH:mm:ss");
        request.extendedCheckOutDate = moment(object.newCheckOutTime,'D/MM/YYYY H:mm').format("YYYY-MM-DD HH:mm:ss");
        request.requestingUser = object.userID;
        request.approvalStatus = "APPROVED";
        request.approvalAckState = "NOTIFIED";
        request.roomNumber = object.roomNumber;
        request.extensionReason = object.extensionReason;
        request.guestName = object.guestName;
        request.roomId = object.roomId;

        Extension.create(request,function(err,obj){
            request.extId = obj.extId;
            if(err){
                result = {};
                console.log(err);
                callback("ERROR");
                return;
            }else{ 
                app.models.Rooms.findById(request.roomId,function(err,instance){
                    if(err){
                        console.log(err);
                        callback("ERROR");
                        return;
                    }else if(instance.length == 0){
                        callback("EMPTY");
                        return;
                    }else{
                        var roomUpdate ={};
                        roomUpdate.roomCurrentStatus = null;
                        instance.updateAttributes(roomUpdate,function(err,info){
                            if(err){
                                console.log(err);
                                callback("ERROR");
                                return;
                            }else if(info.count==0){
                                console.log('No room found for roomId '+object.roomId);
                                callback("EMPTY");
                                return;
                            }else{
                                app.models.Bookings.findById(request.bookingId,function(err, instance) {
                                    if(err){
                                        console.log(err);
                                        Extension.destroyById(request.extId,function(err){
                                        });
                                        callback("ERROR");
                                        return;
                                    }else if(instance.length == 0){
                                        console.log('No booking for bookingId '+booking.bookingId);
                                        Cancel.destroyById(request.extId,function(err){
                                        });
                                        callback("EMPTY");
                                        return;
                                    }else{
                                        var booking ={};
                                        booking.bookingId = request.bookingId;
                                        booking.bookingStatus = "ONGOING";
                                        booking.checkOutTime = request.extendedCheckOutDate;
                                        instance.updateAttributes(booking,function(err,info){
                                            if(err){
                                                console.log(err);
                                                Extension.destroyById(request.extId,function(err){
                                                });
                                                callback("ERROR");
                                                return;
                                            }else if(info.count==0){
                                                console.log('No booking for bookingId '+booking.bookingId);
                                                Extension.destroyById(request.extId,function(err){
                                                });
                                                callback("EMPTY");
                                                return;
                                            }else{
                                                //var message = "Extension Request for Room : "+request.roomNumber+" up to "+object.newCheckOutTime+" by User "+object.user.login[0].userName+" for guest "+request.guestName+".";
                                                // customLib.sendSmsToAdmin(lodgeId,message,function(status){
                                                // });
                                                callback("SUCCESS");
                                                return;
                                            }
                                        });
                                    }
                                });
                            }
                        });
                    }
                });
            }
        });
    };

    Extension.approveExtension = function(req,res,next){
        customLib.validateCookies(req,function(validated,user){
            if(validated){
                var user = JSON.parse(user);
                var userID = user.userId;
                var userName = user.login[0].userName;
                var userType = user.login[0].userType;
                var lodgeId = user.login[0].lodgeId;
                var object = req.body.requestData;
                console.log('request is '+JSON.stringify(object));
                Extension.updateApproveExtension(object,function(status){
                    var result = {};
                    result.returnStatus = status;
                    res.send(result);
                });
                
            }else{
                result = {};
                result.returnStatus = "FAILED";
                res.send(result);
            }
        });
    };
    Extension.remoteMethod(
        'approveExtension',
        {
            isStatice:true,
            accepts:[
                { arg:'req' ,type:'object','http':{source:'req'}},
                { arg:'res' ,type:'object','http':{source:'res'}},
            ],
            http:{path:'/ApproveRequest',verb:'post'}
        }
    );

    Extension.updateApproveExtension = function(object,callback){
        Extension.findById(object.extId,function(err,instance){
            if(err){
                console.log(err);
                callback("ERROR")
                return;
            }else if(instance.length == 0){
                callback("EMPTY");
                return;
            }else{
                var extensionUpdate ={};
                extensionUpdate.approvalStatus = "APPROVED";
                extensionUpdate.approvalAckState = "PENDING";
                instance.updateAttributes(extensionUpdate,function(err,info){
                    if(err){
                        console.log(err);
                        callback("ERROR");
                        return;
                    }else if(info.count==0){
                        console.log('No request found for extensionId '+object.extensionId);
                        callback("EMPTY");
                        return;
                    }else{
                        app.models.Rooms.findById(object.roomId,function(err,instance){
                            if(err){
                                console.log(err);
                                callback("ERROR");
                                return;
                            }else if(instance.length == 0){
                                callback("EMPTY");
                                return;
                            }else{
                                var roomUpdate ={};
                                roomUpdate.roomCurrentStatus = null;
                                instance.updateAttributes(roomUpdate,function(err,info){
                                    if(err){
                                        console.log(err);
                                        callback("ERROR");
                                        return;
                                    }else if(info.count==0){
                                        console.log('No room found for roomId '+object.roomId);
                                        callback("EMPTY");
                                        return;
                                    }else{
                                        app.models.Bookings.findById(object.bookingId,function(err,instance){
                                            if(err){
                                                console.log(err);
                                                callback("ERROR");
                                                return;
                                            }else if(instance.length == 0){
                                                callback("EMPTY");
                                                return;
                                            }else{
                                                var bookingUpdate ={};
                                                bookingUpdate.checkOutTime = moment(object.checkOut,'D/MM/YYYY H:mm').format("YYYY-MM-DD HH:mm:ss");
                                                bookingUpdate.bookingStatus = "ONGOING";
                                                bookingUpdate.extensionId = null;
                                                instance.updateAttributes(bookingUpdate,function(err,info){
                                                    if(err){
                                                        console.log(err);
                                                        callback("ERROR");
                                                        return;
                                                    }else if(info.count==0){
                                                        console.log('No booking found for roomId '+object.bookingId);
                                                        callback("EMPTY");
                                                        return;
                                                    }else{
                                                        //var message = "Extension request for Room number : "+request.roomNumber+" by User "+user.login[0].userName+" . Amount paid by guest is "+object.amountPaid+" for "+request.duration;
                                                        // customLib.sendSmsToAdmin(lodgeId,message,function(status){
                                                        // });
                                                        callback("SUCCESS");
                                                        return;
                                                    }
                                                });
                                            }
                                        });
                                    }
                                });
                            }
                        });
                    }
                });
            }
        });
    };


    Extension.rejectExtension = function(req,res,next){
        customLib.validateCookies(req,function(validated,user){
            if(validated){
                var user = JSON.parse(user);
                var userID = user.userId;
                var userName = user.login[0].userName;
                var userType = user.login[0].userType;
                var lodgeId = user.login[0].lodgeId;
                var object = req.body.requestData;
                console.log('request is '+JSON.stringify(object));
                Extension.updateRejectExtension(object,function(status){
                    var result={};
                    result.returnStatus = status;
                    res.send(result);
                });
            }else{
                result = {};
                result.returnStatus = "FAILED";
                res.send(result);
            }
        });
    };
    Extension.remoteMethod(
        'rejectExtension',
        {
            isStatice:true,
            accepts:[
                { arg:'req' ,type:'object','http':{source:'req'}},
                { arg:'res' ,type:'object','http':{source:'res'}},
            ],
            http:{path:'/RejectRequest',verb:'post'}
        }
    );


    Extension.updateRejectExtension = function(object,callback){
        Extension.findById(object.extId,function(err,instance){
            if(err){
                console.log(err);
                callback("ERROR")
                return;
            }else if(instance.length == 0){
                callback("EMPTY");
                return;
            }else{
                var extensionUpdate ={};
                extensionUpdate.approvalStatus = "REJECTED";
                extensionUpdate.approvalAckState = "PENDING";
                instance.updateAttributes(extensionUpdate,function(err,info){
                    if(err){
                        console.log(err);
                        callback("ERROR");
                        return;
                    }else if(info.count==0){
                        console.log('No request found for checkoutId '+object.checkoutId);
                        callback("EMPTY");
                        return;
                    }else{
                        app.models.Bookings.findById(object.bookingId,function(err,instance){
                            if(err){
                                console.log(err);
                                callback("ERROR");
                                return;
                            }else if(instance.length == 0){
                                callback("EMPTY");
                                return;
                            }else{
                                var bookingUpdate ={};
                                bookingUpdate.bookingStatus = "ONGOING";
                                bookingUpdate.extensionId = null;
                                instance.updateAttributes(bookingUpdate,function(err,info){
                                    if(err){
                                        console.log(err);
                                        callback("ERROR");
                                        return;
                                    }else if(info.count==0){
                                        console.log('No booking found for roomId '+object.bookingId);
                                        callback("EMPTY");
                                        return;
                                    }else{
                                        //var message = "Extension request for Room number : "+request.roomNumber+" by User "+user.login[0].userName+" . Amount paid by guest is "+object.amountPaid+" for "+request.duration;
                                        // customLib.sendSmsToAdmin(lodgeId,message,function(status){
                                        // });
                                        callback("SUCCESS");
                                        return;
                                    }
                                });
                            }
                        });
                    }
                });
            }
        });
    };

}