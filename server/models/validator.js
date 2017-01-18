module.exports = function(Validator) {
    Validator.authenticate = function(req,res,next){
        if(req.query.validator!= undefined && req.query.selector !=undefined && req.query.userId!= undefined){
            Validator.find({where:{'and':[{'validator':req.query.validator},{'selector':req.query.selector}]},include:'login'},function(err,instance){       			
                if(instance.length !== 0){
                    if(instance[0].userId == req.query.userID){
                        var result ={};
                        result.responseStatus='SUCCESS';
                        res.send(result);
                    }else{
                        var result ={};
                        result.responseStatus='EMPTY';
                        res.send(result);
                    }
                }
                else{
                    var result ={};
                    result.responseStatus='EMPTY';
                    res.send(result);
                }
 		    });
        }else{
            var result ={};
            result.responseStatus='ERROR';
            res.send(result);
        }
    };
    Validator.remoteMethod(
        'authenticate',
        {
            isStatice:true,
            accepts:[
                { arg:'req' ,type:'object','http':{source:'req'}},
                { arg:'res' ,type:'object','http':{source:'res'}},
            ],
            http:{path:'/validate',verb:'get'}
        }
    ); 
}