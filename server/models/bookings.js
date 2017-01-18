'use strict';

module.exports = function(Bookings) {
	var bodyParser = require('body-parser').urlencoded({extended: true});
    var customLib = require('../../server/customlib.js');
    var app = require('../../server/server.js');
    var moment = require('moment');
    var http = require('http');
    var result = {};
	Bookings.saveBooking = function(req,res,next){
        customLib.validateCookies(req,function(validated,user){
			if(validated){
                var user = JSON.parse(user);
                console.log('user details are '+JSON.stringify(user));
                var userID = user.userId;
                var userName = user.login[0].userName;
                var userType = user.login[0].userType;
                var lodgeId = user.login[0].lodgeId;
                var bookingObject = req.body.requestData;
                var booking = {};

                booking.roomId = bookingObject.room.roomId;
                booking.checkInTime = moment.utc(bookingObject.checkIn,'D/MM/YYYY H:mm').format("YYYY-MM-DD HH:mm:ss");
                booking.checkOutTime = moment.utc(bookingObject.checkOut,'D/MM/YYYY H:mm').format("YYYY-MM-DD HH:mm:ss");
                booking.perDayCostOfRoom = bookingObject.costPerDay;
                booking.lodgeId = lodgeId;
                booking.noOfGuests = bookingObject.numberOfGuests.value;
                booking.bookingStatus = "ONGOING";
                booking.bookingUser = userID;

                Bookings.create(booking,function(err,obj){
                	if(err){
                        result = {};
                        console.log(err);
                        result.returnStatus = "ERROR";
                        res.send(result);
                        return;
                    }else{ 
                        booking.bookingId = obj.bookingId;
                    	var Guest ={};
                    	Guest.bookingId = obj.bookingId;
                    	Guest.guestName = bookingObject.guests[0].name;
                    	Guest.guestPhoneNumber = bookingObject.guests[0].mobile;
                    	Guest.guestEmailId = bookingObject.guests[0].emailId;
                    	Guest.lodgeId = lodgeId;
                    	app.models.Guests.create(Guest,function(err,obj){
                    		if(err){
                    			console.log(err);
                    			Bookings.destroyById(Guest.bookingId,function(err){
                                });
                                result = {};
                                result.returnStatus = "ERROR";
                                res.send(result);
                                return;
                            }else{
                                Guest.guestId = obj.guestId;
                                var room = bookingObject.room;
                                room.roomCurrentStatus = booking.bookingId;
                                app.models.Rooms.updateAll({'roomId':room.roomId},room,function(err,info){
                                    if(err){
                                        Bookings.destroyById(Guest.bookingId,function(err){
                                        });
                                        app.models.Guest.destroyById(Guest.guestId,function(err){
                                        });
                                        result = {};
                                        result.returnStatus = "ERROR";
                                        res.send(result);
                                        return;
                                    }else if(info.count == 0){
                                        Bookings.destroyById(Guest.bookingId,function(err){
                                        });
                                        app.models.Guest.destroyById(Guest.guestId,function(err){
                                        });
                                        result = {};
                                        result.returnStatus = "EMPTY";
                                        res.send(result);
                                        return;
                                    }else{
                                        var message = "New Booking : Room "+bookingObject.room.roomNumber+" is booked till "+bookingObject.checkIn+" for Customer "+Guest.guestName+" by User "+userName;
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
    Bookings.remoteMethod(
        'saveBooking',
        {
            isStatice:true,
            accepts:[
                { arg:'req' ,type:'object','http':{source:'req'}},
                { arg:'res' ,type:'object','http':{source:'res'}},
            ],
            http:{path:'/SaveBooking',verb:'post'}
        }
    );

    Bookings.getBookings = function(req,res,next){
        customLib.validateCookies(req,function(validated,user){
            if(validated){
                var user = JSON.parse(user);
                var userID = user.login[0].userId;
                var userType = user.login[0].userType;
                var lodgeId = user.login[0].lodgeId;
                Bookings.find({'where':{'and':[{'lodgeId':lodgeId},{'bookingStatus':'ONGOING'}]},'include':['rooms','guests','userDetails']},function(err,instance){
                	if(err){
                		console.log(err);
                		result={};
                		result.returnStatus= "ERROR";
                		res.send(result);
                	}else if(instance.length ==0){
                		result={};
                		result.returnStatus= "EMPTY";
                		res.send(result);
                	}else{
                		result={};
                		result.returnStatus= "SUCCESS";
                		result.responseData = instance;
                		res.send(result);
                	}
                });
            }else{
                result={};
                result.returnStatus='FAILED';
                res.send(result);
            }
        });
    };
    Bookings.remoteMethod(
        'getBookings',
        {
            isStatice:true,
            accepts:[
                { arg:'req' ,type:'object','http':{source:'req'}},
                { arg:'res' ,type:'object','http':{source:'res'}},
            ],
            http:{path:'/GetBookings',verb:'get'}
        }
    );

    Bookings.getApprovals = function(req,res,next){
        customLib.validateCookies(req,function(validated,user){
            if(validated){
                var user = JSON.parse(user);
                var userID = user.login[0].userId;
                var userType = user.login[0].userType;
                var lodgeId = user.login[0].lodgeId;
                Bookings.find({'where':{'and':[{'lodgeId':lodgeId},{'or':[{'bookingStatus':'CHECKOUT'},{'bookingStatus':'EXTENSION'},{'bookingStatus':'CANCEL'}]}]},'include':['rooms','guests','userDetails','checkOut','cancel','extension']},function(err,instance){
                    if(err){
                        console.log(err);
                        result={};
                        result.returnStatus= "ERROR";
                        res.send(result);
                    }else if(instance.length ==0){
                        result={};
                        result.returnStatus= "EMPTY";
                        res.send(result);
                    }else{
                        result={};
                        var responseData = {};
                        responseData.cancel = [];
                        responseData.extension = [];
                        responseData.checkOut = [];
                        var instance = JSON.parse(JSON.stringify(instance));
                        for(var i=0;i<instance.length;i++){
                            if(instance[i].bookingStatus == "CHECKOUT"){
                                instance[i].requestStatus = instance[i].checkOut.approvalStatus;
                                instance[i].requestType = "checkout request";
                                responseData.checkOut.push(instance[i]);
                            }else if(instance[i].bookingStatus == "CANCEL"){
                                instance[i].requestStatus = instance[i].cancel.approvalStatus;
                                instance[i].requestType = "cancel request";
                                responseData.cancel.push(instance[i]);
                            }else if(instance[i].bookingStatus == "EXTENSION"){
                                instance[i].requestStatus = instance[i].extension.approvalStatus;
                                instance[i].requestType = "extension request";
                                responseData.extension.push(instance[i]);
                            }
                        }
                        result.returnStatus= "SUCCESS";
                        result.responseData = responseData;
                        res.send(result);
                    }
                });
            }else{
                result={};
                result.returnStatus='FAILED';
                res.send(result);
            }
        });
    };
    Bookings.remoteMethod(
        'getApprovals',
        {
            isStatice:true,
            accepts:[
                { arg:'req' ,type:'object','http':{source:'req'}},
                { arg:'res' ,type:'object','http':{source:'res'}},
            ],
            http:{path:'/GetApprovals',verb:'get'}
        }
    );


    Bookings.updateStatus = function(req,res,next){
        customLib.validateCookies(req,function(validated,user){
            if(validated){
                var user = JSON.parse(user);
                var userID = user.login[0].userId;
                var userType = user.login[0].userType;
                var lodgeId = user.login[0].lodgeId;
                Bookings.find({'where':{'and':[{'lodgeId':lodgeId},{'bookingStatus':'ONGOING'}]},'include':['rooms','guests','userDetails']},function(err,instance){
                    if(err){
                        console.log(err);
                        result={};
                        result.returnStatus= "ERROR";
                        res.send(result);
                    }else if(instance.length ==0){
                        result={};
                        result.returnStatus= "EMPTY";
                        res.send(result);
                    }else{
                        result={};
                        result.returnStatus= "SUCCESS";
                        result.responseData = instance;
                        res.send(result);
                    }
                });
            }else{
                result={};
                result.returnStatus='FAILED';
                res.send(result);
            }
        });
    };
    Bookings.remoteMethod(
        'updateStatus',
        {
            isStatice:true,
            accepts:[
                { arg:'req' ,type:'object','http':{source:'req'}},
                { arg:'res' ,type:'object','http':{source:'res'}},
            ],
            http:{path:'/UpdateSeenStatus',verb:'get'}
        }
    );
};