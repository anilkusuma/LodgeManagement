module.exports = function(UserDetails) {
    var customLib = require('../../server/customlib.js');
    var app = require('../../server/server.js');
    var result = {};
    var util = require('util');
    var multer = require('multer');
    var xlstojson = require("xls-to-json-lc");
    var xlsxtojson = require("xlsx-to-json-lc");
    var crypto = require('crypto');
    var nodemailer = require('nodemailer');
    var fs = require('fs-extra');
    
    UserDetails.updateProfilePic = function(req,res,next){
        customLib.validateCookies(req,function(validated,user){
			if(validated){
                var user = JSON.parse(user);
                var userID = user.userId;
                var userType = user.login[0].userType;
                var schoolId = user.login[0].schoolId;
                result={};
                var storage = multer.diskStorage({ //multers disk storage settings
                    destination: function (req, file, cb) {
                        cb(null, __dirname+'/../../client/SchoolId-'+schoolId+'/UserProfileImages/')  
                    },
                    filename: function (req, file, cb) {
                        cb(null,userID+'.jpg')
                    }
                });
                var upload = multer({ //multer settings
                                storage: storage,
                                fileFilter : function(req, file, callback) { //file filter
                                    if (['jpg', 'png','jpeg'].indexOf(file.originalname.split('.')[file.originalname.split('.').length-1]) === -1) {
                                        return callback(new Error('WRONGFILETYPE'));
                                    }
                                    callback(null, true);
                                }
                            }).single('file');
                var exceltojson; //Initialization
                upload(req,res,function(err){
                    if(err){
                         result={};
                         console.log('error value is '+err);
                         if(err = "WRONGFILETYPE"){
                            result.returnStatus = "WRONGFILETYPE";
                         }else{
                             result.returnStatus = "UPLOADERROR";
                         }
                         res.send(result);
                         return;
                    }
                    /** Multer gives us file info in req.file object */
                    if(!req.file){
                        result={};
                        result.returnStatus = "NOFILEERROR";
                        res.send(result);
                        return;
                    }else{
                        result={};
                        result.returnStatus = "SUCCESS";
                        res.send(result);
                        return;
                    } 
                });   
			}else{
				result = {};
				result.returnStatus="FAILED";
				res.send(result);
			}
        });
    };
    UserDetails.remoteMethod(
        'updateProfilePic',
        {
            isStatice:true,
            accepts:[
                { arg:'req' ,type:'object','http':{source:'req'}},
                { arg:'res' ,type:'object','http':{source:'res'}},
            ],
            http:{path:'/bUpdateProfilePic',verb:'post'}
        }
    );  
}