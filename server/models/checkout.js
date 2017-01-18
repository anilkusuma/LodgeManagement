module.exports = function(Checkout) {
	var bodyParser = require('body-parser').urlencoded({extended: true});
    var customLib = require('../../server/customlib.js');
    var app = require('../../server/server.js');
    var moment = require('moment');
    var http = require('http');
    var result = {};
	Checkout.requestCheckout = function(req,res,next){
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
                request.checkOutTime=moment(object.checkOut,'D/MM/YYYY H:mm').format("YYYY-MM-DD HH:mm:ss");
                request.requestingUser = userID;
                request.approvalStatus = "WAITING";
                
		        var duration = moment.duration(moment(object.checkOut,'D/MM/YYYY H:mm').diff(moment(object.checkIn,'D/MM/YYYY H:mm')));
		        var days = duration.asDays();
                //console.log('duration is '+duration.asDays()+' '+duration.hours()+'\nCheck in is '+object.checkIn+'\nCheckout is '+object.checkOut);
		        if(duration.hours() > 3){
		            days = days+1;
		        }
		        request.duration = parseInt(days)+' days';
		        request.roomNumber = object.roomNumber;
		        //console.log('request is '+JSON.stringify(request));
                Checkout.create(request,function(err,obj){
                	request.checkOutId = obj.checkoutId;
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
							console.log('instance is '+JSON.stringify(instance));
							if(err){
								console.log(err);
                                Checkout.destroyById(request.checkOutId,function(err){
                                });
                                result = {};
                                result.returnStatus = "ERROR";
                                res.send(result);
                                return;
							}else if(instance.length == 0){
								console.log('No booking for bookingId '+booking.bookingId);
                                Checkout.destroyById(request.checkOutId,function(err){
                                });
                                result = {};
                                result.returnStatus = "EMPTY";
                                res.send(result);
                                return;
							}else{
								booking.amountPaid = object.amountPaid;
								booking.actualAmountToBePaid = object.amountToBePaid;
								booking.bookingStatus = "CHECKOUT";
                                booking.guestFeedback = object.guestFeedback;
                                booking.checkoutId = request.checkOutId;
							    instance.updateAttributes(booking,function(err,info){
							    	if(err){
		                                console.log(err);
		                                Checkout.destroyById(request.checkOutId,function(err){
		                                });
		                                result = {};
		                                result.returnStatus = "ERROR";
		                                res.send(result);
		                                return;
		                            }else if(info.count==0){
		                                console.log('No booking for bookingId '+booking.bookingId);
		                                Checkout.destroyById(request.checkOutId,function(err){
		                                });
		                                result = {};
		                                result.returnStatus = "EMPTY";
		                                res.send(result);
		                                return;
		                            }else{
		                            	var message = "Checkout request for Room number : "+request.roomNumber+" by User "+user.login[0].userName+" . Amount paid by guest is "+object.amountPaid+" for "+request.duration;
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
    Checkout.remoteMethod(
        'requestCheckout',
        {
            isStatice:true,
            accepts:[
                { arg:'req' ,type:'object','http':{source:'req'}},
                { arg:'res' ,type:'object','http':{source:'res'}},
            ],
            http:{path:'/CheckoutRequest',verb:'post'}
        }
    );


    Checkout.CheckoutAdmin = function(req,res,next){
        customLib.validateCookies(req,function(validated,user){
            if(validated){
                var object = req.body.requestData;
                var user = JSON.parse(user);
                object.user = user;
                object.userID = user.userId;
                object.userName = user.login[0].userName;
                object.userType = user.login[0].userType;
                object.lodgeId = user.login[0].lodgeId;
                Checkout.CheckoutUpdateAdmin(object,function(status){
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
    Checkout.remoteMethod(
        'CheckoutAdmin',
        {
            isStatice:true,
            accepts:[
                { arg:'req' ,type:'object','http':{source:'req'}},
                { arg:'res' ,type:'object','http':{source:'res'}},
            ],
            http:{path:'/CheckoutAdmin',verb:'post'}
        }
    );

    Checkout.CheckoutUpdateAdmin = function(object,callback){
        var request = {};
        request.bookingId = object.bookingId;
        request.lodgeId = object.lodgeId;
        request.checkOutTime=moment(object.checkOut,'D/MM/YYYY H:mm').format("YYYY-MM-DD HH:mm:ss");
        request.requestingUser = object.userID;
        request.approvalStatus = "APPROVED";
        var duration = moment.duration(moment(object.checkOut,'D/MM/YYYY H:mm').diff(moment(object.checkIn,'D/MM/YYYY H:mm')));
        var days = duration.asDays();
        if(duration.hours() > 3){
            days = days+1;
        }
        request.duration = parseInt(days)+' days';
        request.roomNumber = object.roomNumber;
        request.roomId = object.roomId;
        request.approvalAckState = "NOTIFIED";
        Checkout.create(request,function(err,obj){
            request.checkoutId = obj.checkoutId;
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
                                        Checkout.destroyById(request.checkoutId,function(err){
                                        });
                                        callback("ERROR");
                                        return;
                                    }else if(instance.length == 0){
                                        console.log('No booking for bookingId '+booking.bookingId);
                                        Cancel.destroyById(request.checkoutId,function(err){
                                        });
                                        callback("EMPTY");
                                        return;
                                    }else{
                                        var booking ={};
                                        booking.bookingId = request.bookingId;
                                        booking.bookingStatus = "COMPLETE";
                                        booking.checkOutTime = request.checkOutTime;
                                        booking.checkoutId = request.checkoutId;
                                        booking.amountPaid = object.amountPaid;
                                        booking.actualAmountToBePaid = object.amountToBePaid;
                                        booking.guestFeedback = object.guestFeedback;
                                        instance.updateAttributes(booking,function(err,info){
                                            if(err){
                                                console.log(err);
                                                Checkout.destroyById(request.checkoutId,function(err){
                                                });
                                                callback("ERROR");
                                                return;
                                            }else if(info.count==0){
                                                console.log('No booking for bookingId '+booking.bookingId);
                                                Checkout.destroyById(request.checkoutId,function(err){
                                                });
                                                callback("EMPTY");
                                                return;
                                            }else{
                                                var message = "Checkout request for Room number : "+request.roomNumber+" by User "+object.user.login[0].userName+" . Amount paid by guest is "+object.amountPaid+" for "+request.duration;
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

    Checkout.approveCheckout = function(req,res,next){
        customLib.validateCookies(req,function(validated,user){
            if(validated){
                var user = JSON.parse(user);
                var userID = user.userId;
                var userName = user.login[0].userName;
                var userType = user.login[0].userType;
                var lodgeId = user.login[0].lodgeId;
                var object = req.body.requestData;
                console.log('request is '+JSON.stringify(object));
                Checkout.updateApproveCheckout(object,function(status){
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
    Checkout.remoteMethod(
        'approveCheckout',
        {
            isStatice:true,
            accepts:[
                { arg:'req' ,type:'object','http':{source:'req'}},
                { arg:'res' ,type:'object','http':{source:'res'}},
            ],
            http:{path:'/ApproveRequest',verb:'post'}
        }
    );

    Checkout.updateApproveCheckout = function(object,callback){
        Checkout.findById(object.checkoutId,function(err,instance){
            if(err){
                console.log(err);
                callback("ERROR")
                return;
            }else if(instance.length == 0){
                callback("EMPTY");
                return;
            }else{
                var checkoutUpdate ={};
                checkoutUpdate.approvalStatus = "APPROVED";
                checkoutUpdate.approvalAckState = "PENDING";
                instance.updateAttributes(checkoutUpdate,function(err,info){
                    if(err){
                        console.log(err);
                        result = {};
                        result.returnStatus = "ERROR";
                        res.send(result);
                        return;
                    }else if(info.count==0){
                        console.log('No request found for checkoutId '+object.checkoutId);
                        result = {};
                        result.returnStatus = "EMPTY";
                        res.send(result);
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
                                                bookingUpdate.bookingStatus = "COMPLETE";
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
                                                        //var message = "Checkout request for Room number : "+request.roomNumber+" by User "+user.login[0].userName+" . Amount paid by guest is "+object.amountPaid+" for "+request.duration;
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


    Checkout.rejectCheckout = function(req,res,next){
        customLib.validateCookies(req,function(validated,user){
            if(validated){
                var user = JSON.parse(user);
                var userID = user.userId;
                var userName = user.login[0].userName;
                var userType = user.login[0].userType;
                var lodgeId = user.login[0].lodgeId;
                var object = req.body.requestData;
                console.log('request is '+JSON.stringify(object));
                Checkout.updateRejectCheckout(object,function(status){
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
    Checkout.remoteMethod(
        'rejectCheckout',
        {
            isStatice:true,
            accepts:[
                { arg:'req' ,type:'object','http':{source:'req'}},
                { arg:'res' ,type:'object','http':{source:'res'}},
            ],
            http:{path:'/RejectRequest',verb:'post'}
        }
    );


    Checkout.updateRejectCheckout = function(object,callback){
        Checkout.findById(object.checkoutId,function(err,instance){
            if(err){
                console.log(err);
                callback("ERROR")
                return;
            }else if(instance.length == 0){
                callback("EMPTY");
                return;
            }else{
                var checkoutUpdate ={};
                checkoutUpdate.approvalStatus = "REJECTED";
                checkoutUpdate.approvalAckState = "PENDING";
                instance.updateAttributes(checkoutUpdate,function(err,info){
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
                                bookingUpdate.amountPaid = null;
                                bookingUpdate.bookingStatus = "ONGOING";
                                bookingUpdate.actualAmountToBePaid = null;
                                bookingUpdate.guestFeedback = null;
                                bookingUpdate.checkoutId = null;
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
                                        //var message = "Checkout request for Room number : "+request.roomNumber+" by User "+user.login[0].userName+" . Amount paid by guest is "+object.amountPaid+" for "+request.duration;
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