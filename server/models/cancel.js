'use strict';

module.exports = function(Cancel) {
	var bodyParser = require('body-parser').urlencoded({extended: true});
    var customLib = require('../../server/customlib.js');
    var app = require('../../server/server.js');
    var moment = require('moment');
    var http = require('http');
    var result = {};
	Cancel.requestCancelation = function(req,res,next){
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
                request.checkiInTime=moment(object.checkInTime,'D/MM/YYYY H:mm').format("YYYY-MM-DD HH:mm:ss");
                request.cancelRequestTime = moment(object.cancelationTime,'D/MM/YYYY H:mm').format("YYYY-MM-DD HH:mm:ss");
                request.requestingUser = userID;
                request.approvalStatus = "WAITING";
		        request.roomNumber = object.roomNumber;
		        request.cancelReason = object.cancelReason;
		        request.guestName = object.guestName;
		        console.log('request is '+JSON.stringify(request));
                Cancel.create(request,function(err,obj){
                	request.cancId = obj.cancId;
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
                                Cancel.destroyById(request.cancId,function(err){
                                });
                                result = {};
                                result.returnStatus = "ERROR";
                                res.send(result);
                                return;
							}else if(instance.length == 0){
								console.log('No booking for bookingId '+booking.bookingId);
                                Cancel.destroyById(request.cancId,function(err){
                                });
                                result = {};
                                result.returnStatus = "EMPTY";
                                res.send(result);
                                return;
							}else{
								booking.bookingStatus = "CANCEL";
                                booking.cancelId = request.cancId;
							    instance.updateAttributes(booking,function(err,info){
							    	if(err){
		                                console.log(err);
		                                Cancel.destroyById(request.cancId,function(err){
		                                });
		                                result = {};
		                                result.returnStatus = "ERROR";
		                                res.send(result);
		                                return;
		                            }else if(info.count==0){
		                                console.log('No booking for bookingId '+booking.bookingId);
		                                Cancel.destroyById(request.cancId,function(err){
		                                });
		                                result = {};
		                                result.returnStatus = "EMPTY";
		                                res.send(result);
		                                return;
		                            }else{
		                            	var message = "Cancel Booking for Room : "+request.roomNumber+" by User "+user.login[0].userName+" . Cancel reason is \" "+request.cancelReason+"\".";
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
    Cancel.remoteMethod(
        'requestCancelation',
        {
            isStatice:true,
            accepts:[
                { arg:'req' ,type:'object','http':{source:'req'}},
                { arg:'res' ,type:'object','http':{source:'res'}},
            ],
            http:{path:'/CancelBooking',verb:'post'}
        }
    );


    Cancel.Cancelation = function(req,res,next){
        customLib.validateCookies(req,function(validated,user){
            if(validated){
                var object = req.body.requestData;
                var user = JSON.parse(user);
                object.user = user;
                object.userID = user.userId;
                object.userName = user.login[0].userName;
                object.userType = user.login[0].userType;
                object.lodgeId = user.login[0].lodgeId;
                Cancel.CancelUpdateAdmin(object,function(status){
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
    Cancel.remoteMethod(
        'Cancelation',
        {
            isStatice:true,
            accepts:[
                { arg:'req' ,type:'object','http':{source:'req'}},
                { arg:'res' ,type:'object','http':{source:'res'}},
            ],
            http:{path:'/CancelAdmin',verb:'post'}
        }
    );

    Cancel.CancelUpdateAdmin = function(object,callback){
        var request = {};
        request.bookingId = object.bookingId;
        request.lodgeId = object.lodgeId;
        request.checkiInTime=moment(object.checkInTime,'D/MM/YYYY H:mm').format("YYYY-MM-DD HH:mm:ss");
        request.cancelRequestTime = moment(object.cancelationTime,'D/MM/YYYY H:mm').format("YYYY-MM-DD HH:mm:ss");
        request.requestingUser = object.userID;
        request.approvalStatus = "APPROVED";
        request.approvalAckState = "NOTIFIED";
        request.roomNumber = object.roomNumber;
        request.cancelReason = object.cancelReason;
        request.guestName = object.guestName;
        request.roomId = object.roomId;
        Cancel.create(request,function(err,obj){
            request.cancId = obj.cancId;
            if(err){
                result = {};
                console.log(err);
                callback("ERROR");
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
                                        Cancel.destroyById(request.cancId,function(err){
                                        });
                                        callback("ERROR");
                                        return;
                                    }else if(instance.length == 0){
                                        console.log('No booking for bookingId '+booking.bookingId);
                                        Cancel.destroyById(request.cancId,function(err){
                                        });
                                        callback("EMPTY");
                                        return;
                                    }else{
                                        var booking ={};
                                        booking.bookingId = request.bookingId;
                                        booking.bookingStatus = "CANCELED";
                                        booking.cancelId = request.cancId;
                                        booking.checkOutTime = request.cancelRequestTime;
                                        instance.updateAttributes(booking,function(err,info){
                                            if(err){
                                                console.log(err);
                                                Cancel.destroyById(request.cancId,function(err){
                                                });
                                                callback("ERROR");
                                                return;
                                            }else if(info.count==0){
                                                console.log('No booking for bookingId '+booking.bookingId);
                                                Cancel.destroyById(request.cancId,function(err){
                                                });
                                                callback("EMPTY");
                                            }else{
                                                //var message = "Cancel Booking for Room : "+request.roomNumber+" by User "+object.user.login[0].userName+" . Cancel reason is \" "+request.cancelReason+"\".";
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

    Cancel.approveCancel = function(req,res,next){
        customLib.validateCookies(req,function(validated,user){
            if(validated){
                var user = JSON.parse(user);
                var userID = user.userId;
                var userName = user.login[0].userName;
                var userType = user.login[0].userType;
                var lodgeId = user.login[0].lodgeId;
                var object = req.body.requestData;
                console.log('request is '+JSON.stringify(object));
                Cancel.updateApproveCancel(object,function(status){
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
    Cancel.remoteMethod(
        'approveCancel',
        {
            isStatice:true,
            accepts:[
                { arg:'req' ,type:'object','http':{source:'req'}},
                { arg:'res' ,type:'object','http':{source:'res'}},
            ],
            http:{path:'/ApproveRequest',verb:'post'}
        }
    );

    Cancel.updateApproveCancel = function(object,callback){
        Cancel.findById(object.cancId,function(err,instance){
            if(err){
                console.log(err);
                callback("ERROR")
                return;
            }else if(instance.length == 0){
                callback("EMPTY");
                return;
            }else{
                var cancelUpdate ={};
                cancelUpdate.approvalStatus = "APPROVED";
                cancelUpdate.approvalAckState = "PENDING";
                instance.updateAttributes(cancelUpdate,function(err,info){
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
                                                bookingUpdate.bookingStatus = "CANCELED";
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
                                                        //var message = "Cancel request for Room number : "+request.roomNumber+" by User "+user.login[0].userName+" . Amount paid by guest is "+object.amountPaid+" for "+request.duration;
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


    Cancel.rejectCancel = function(req,res,next){
        customLib.validateCookies(req,function(validated,user){
            if(validated){
                var user = JSON.parse(user);
                var userID = user.userId;
                var userName = user.login[0].userName;
                var userType = user.login[0].userType;
                var lodgeId = user.login[0].lodgeId;
                var object = req.body.requestData;
                console.log('request is '+JSON.stringify(object));
                Cancel.updateRejectCancel(object,function(status){
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
    Cancel.remoteMethod(
        'rejectCancel',
        {
            isStatice:true,
            accepts:[
                { arg:'req' ,type:'object','http':{source:'req'}},
                { arg:'res' ,type:'object','http':{source:'res'}},
            ],
            http:{path:'/RejectRequest',verb:'post'}
        }
    );


    Cancel.updateRejectCancel = function(object,callback){
        Cancel.findById(object.cancId,function(err,instance){
            if(err){
                console.log(err);
                callback("ERROR")
                return;
            }else if(instance.length == 0){
                callback("EMPTY");
                return;
            }else{
                var cancelUpdate ={};
                cancelUpdate.approvalStatus = "REJECTED";
                cancelUpdate.approvalAckState = "PENDING";
                instance.updateAttributes(cancelUpdate,function(err,info){
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
                                bookingUpdate.cancelId = null;
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
                                        //var message = "Cancel request for Room number : "+request.roomNumber+" by User "+user.login[0].userName+" . Amount paid by guest is "+object.amountPaid+" for "+request.duration;
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
};
