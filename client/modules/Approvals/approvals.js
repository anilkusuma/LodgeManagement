app.factory('AppService',['$http','$rootScope',function($http,$rootScope){
    var AppServices = {};
    AppServices.getApprovals = function(callback){
        var url=$rootScope.baseUrl+ '/api/Bookings/GetApprovals';
        $http({
            method: 'GET',
            url: url
        }).then(function successCallback(response) {
            if(response.data.returnStatus == "FAILED"){
                $rootScope.logout();
                return;
            }
            callback(response.data.returnStatus,response.data.responseData);
        },function errorCallback(response) {
            callback("ERROR");
        });
    };
    AppServices.approveCheckout = function(data,callback){
        var url=$rootScope.baseUrl+ '/api/Checkouts/ApproveRequest';
        var d = {};
        d.requestData = data;
        $http({
            method: 'POST',
            url: url,
            data:d
        }).then(function successCallback(response) {
            if(response.data.returnStatus == "FAILED"){
                $rootScope.logout();
                return;
            }
            callback(response.data.returnStatus);
        },function errorCallback(response) {
            callback("ERROR");
        });
    };
    AppServices.rejectCheckout = function(data,callback){
        var url=$rootScope.baseUrl+ '/api/Checkouts/RejectRequest';
        var d = {};
        d.requestData = data;
        $http({
            method: 'POST',
            url: url,
            data:d
        }).then(function successCallback(response) {
            if(response.data.returnStatus == "FAILED"){
                $rootScope.logout();
                return;
            }
            callback(response.data.returnStatus);
        },function errorCallback(response) {
            callback("ERROR");
        });
    };
    AppServices.approveExtension = function(data,callback){
        var url=$rootScope.baseUrl+ '/api/Extensions/ApproveRequest';
        var d = {};
        d.requestData = data;
        $http({
            method: 'POST',
            url: url,
            data:d
        }).then(function successCallback(response) {
            if(response.data.returnStatus == "FAILED"){
                $rootScope.logout();
                return;
            }
            callback(response.data.returnStatus);
        },function errorCallback(response) {
            callback("ERROR");
        });
    };
    AppServices.rejectExtension = function(data,callback){
        var url=$rootScope.baseUrl+ '/api/Extensions/RejectRequest';
        var d = {};
        d.requestData = data;
        $http({
            method: 'POST',
            url: url,
            data:d
        }).then(function successCallback(response) {
            if(response.data.returnStatus == "FAILED"){
                $rootScope.logout();
                return;
            }
            callback(response.data.returnStatus);
        },function errorCallback(response) {
            callback("ERROR");
        });
    };
    AppServices.approveCancel = function(data,callback){
        var url=$rootScope.baseUrl+ '/api/Cancels/ApproveRequest';
        var d = {};
        d.requestData = data;
        $http({
            method: 'POST',
            url: url,
            data:d
        }).then(function successCallback(response) {
            if(response.data.returnStatus == "FAILED"){
                $rootScope.logout();
                return;
            }
            callback(response.data.returnStatus);
        },function errorCallback(response) {
            callback("ERROR");
        });
    };
    AppServices.rejectCancel = function(data,callback){
        var url=$rootScope.baseUrl+ '/api/Cancels/RejectRequest';
        var d = {};
        d.requestData = data;
        $http({
            method: 'POST',
            url: url,
            data:d
        }).then(function successCallback(response) {
            if(response.data.returnStatus == "FAILED"){
                $rootScope.logout();
                return;
            }
            callback(response.data.returnStatus);
        },function errorCallback(response) {
            callback("ERROR");
        });
    };
    return AppServices;
}]);
app.controller('appCtr', ['$http','$rootScope','AppService','$routeParams','$scope','$timeout','$location','Upload',function ($http,$rootScope,AppService,$routeParams,$scope,$timeout,$location,Upload) {
    var getApprovals = function(){
        AppService.getApprovals(function(status,bookings){
            if(status=="SUCCESS"){
                $scope.allBookings = bookings;
                if($scope.approval.Filter.id == 0){
                    showPreloader();
                    $scope.apps.length = 0;
                    $scope.apps=$scope.apps.concat($scope.allBookings.cancel);
                    $scope.apps=$scope.apps.concat($scope.allBookings.checkOut);
                    $scope.apps=$scope.apps.concat($scope.allBookings.extension);
                    hidePreloader();
                }else if($scope.approval.Filter.id == 1){
                    showPreloader();
                    $scope.apps=[];
                    $scope.apps=$scope.apps.concat($scope.allBookings.cancel);
                    hidePreloader();

                }else if($scope.approval.Filter.id == 2){
                    showPreloader();
                    $scope.apps=[];
                    $scope.apps=$scope.apps.concat($scope.allBookings.checkOut);
                    hidePreloader();
                }else if($scope.approval.Filter.id == 3){
                    showPreloader();
                    $scope.apps=[];
                    $scope.apps=$scope.apps.concat($scope.allBookings.extension);
                    hidePreloader();
                }
            }else if(status == "EMPTY"){
                $scope.allBookings =[];
                $scope.apps = [];
                hidePreloader();
                Materialize.toast('No pending approvals',2000);
            }else if(status == "FAILED"){
                $rootScope.logout();
            }else{
                $scope.allBookings =[];
                $scope.apps = [];
                hidePreloader();
            }
            $timeout(function(){
                $('.tooltipped').tooltip({delay: 50});
                $('select').material_select();
            },0,false);
        });
    };
    var init = function(){
        $scope.approval = {};
        $scope.apps = [];
        $scope.allBookings = [];
        $scope.approval.filterOptions = [{'id':0,'type':'ALL'},{'id':1,'type':'CANCEL'},{'id':2,'type':'CHECKOUT'},{'id':3,'type':'EXTENDED'}];
        $scope.approval.Filter = $scope.approval.filterOptions[0];
        getApprovals();
    };
    $scope.filterChanged = function(){
        if($scope.allBookings.length !=0){
            if($scope.approval.Filter.id == 0){
                showPreloader();
                $scope.apps=[];
                $scope.apps=$scope.apps.concat($scope.allBookings.cancel);
                $scope.apps=$scope.apps.concat($scope.allBookings.checkOut);
                $scope.apps=$scope.apps.concat($scope.allBookings.extension);
                hidePreloader();
            }else if($scope.approval.Filter.id == 1){
                showPreloader();
                $scope.apps=[];
                $scope.apps=$scope.apps.concat($scope.allBookings.cancel);
                hidePreloader();
            }else if($scope.approval.Filter.id == 2){
                showPreloader();
                $scope.apps=[];
                $scope.apps=$scope.apps.concat($scope.allBookings.checkOut);
                hidePreloader();
            }else if($scope.approval.Filter.id == 3){
                showPreloader();
                $scope.apps=[];
                $scope.apps=$scope.apps.concat($scope.allBookings.extension);
                hidePreloader();
            }
            $timeout(function(){
                $('.tooltipped').tooltip({delay: 50});
                $('select').material_select();
            },0,false);
        }
    }
    $scope.$on('refreshApprovals',function(event,args){
        showPreloader();
        getApprovals();
    });

    $scope.confirmApproveClicked = function(){
        $('#approveModal').closeModal();
        if($scope.approveRequest.approveRequestType == "CHECKOUT"){
            AppService.approveCheckout($scope.approveRequest,function(status){
                if(status == "SUCCESS"){
                    Materialize.toast('Checkout Approved',2000);
                    $scope.$emit('refreshApprovals');
                }else{
                    Materialize.toast('Approval failed, try again',2000);
                    $scope.$emit('refreshApprovals');
                }
            });
        }else if($scope.approveRequest.approveRequestType == "CANCEL"){
            AppService.approveCancel($scope.approveRequest,function(status){
                if(status == "SUCCESS"){
                    Materialize.toast('Cancel Approved',2000);
                    $scope.$emit('refreshApprovals');
                }else{
                    Materialize.toast('Approval failed, try again',2000);
                    $scope.$emit('refreshApprovals');
                }
            });
        }else if($scope.approveRequest.approveRequestType == "EXTENSION"){
            AppService.approveExtension($scope.approveRequest,function(status){
                if(status == "SUCCESS"){
                    Materialize.toast('Extension Approved',2000);
                    $scope.$emit('refreshApprovals');
                }else{
                    Materialize.toast('Approval failed, try again',2000);
                    $scope.$emit('refreshApprovals');
                }
            });
        }
    };
    $scope.cancelApproveClicked = function(){
        $('#approveModal').closeModal();
    };
    $scope.confirmRejectClicked=function(){
        $('#rejectModal').closeModal();
        if($scope.rejectRequest.rejectRequestType == "CHECKOUT"){
            AppService.rejectCheckout($scope.rejectRequest,function(status){
                if(status == "SUCCESS"){
                    Materialize.toast('Checkout Rejected',2000);
                    $scope.$emit('refreshApprovals');
                }else{
                    Materialize.toast('Reject failed, try again',2000);
                    $scope.$emit('refreshApprovals');
                }
            });
        }else if($scope.rejectRequest.rejectRequestType == "CANCEL"){
            AppService.rejectCancel($scope.rejectRequest,function(status){
                if(status == "SUCCESS"){
                    Materialize.toast('Cancel Rejected',2000);
                    $scope.$emit('refreshApprovals');
                }else{
                    Materialize.toast('Reject failed, try again',2000);
                    $scope.$emit('refreshApprovals');
                }
            });
        }else if($scope.rejectRequest.rejectRequestType == "EXTENSION"){
            AppService.rejectExtension($scope.rejectRequest,function(status){
                if(status == "SUCCESS"){
                    Materialize.toast('Extension Rejected',2000);
                    $scope.$emit('refreshApprovals');
                }else{
                    Materialize.toast('Reject failed, try again',2000);
                    $scope.$emit('refreshApprovals');
                }
            });
        }
    };
    $scope.cancelRejectClicked = function(){
        $('#rejectModal').closeModal();
    };
    $scope.callApproveRequest = function(appr){
        if(appr.bookingStatus == "CHECKOUT"){
            $scope.approveRequest = {};
            $scope.approveRequest.approveRequestType = "CHECKOUT";
            $scope.approveRequest.checkoutId = appr.checkOut.checkoutId;
            $scope.approveRequest.bookingId = appr.bookingId;
            $scope.approveRequest.roomId = appr.rooms.roomId;
            $scope.approveRequest.checkOut = moment(appr.checkOut.checkOutTime,'ddd MMM DD YYYY HH:mm:ss').format('D/MM/YYYY H:mm');
        }else if(appr.bookingStatus == "CANCEL"){
            $scope.approveRequest = {};
            $scope.approveRequest.approveRequestType = "CANCEL";
            $scope.approveRequest.cancId = appr.cancel.cancId;
            $scope.approveRequest.bookingId = appr.bookingId;
            $scope.approveRequest.roomId = appr.rooms.roomId;
            $scope.approveRequest.checkOut = moment(appr.cancel.cancelRequestTime,'ddd MMM DD YYYY HH:mm:ss').format('D/MM/YYYY H:mm');
        }else if(appr.bookingStatus == "EXTENSION"){
            $scope.approveRequest = {};
            $scope.approveRequest.approveRequestType = "EXTENSION";
            $scope.approveRequest.extId = appr.extension.extId;
            $scope.approveRequest.bookingId = appr.bookingId;
            $scope.approveRequest.roomId = appr.rooms.roomId;
            $scope.approveRequest.checkOut = moment(appr.extension.extendedCheckOutDate,'ddd MMM DD YYYY HH:mm:ss').format('D/MM/YYYY H:mm');
        }
        $('#approveModal').openModal({dismissible: false},1);
   };
   $scope.callRejectRequest = function(appr){
        if(appr.bookingStatus == "CHECKOUT"){
            $scope.rejectRequest = {};
            $scope.rejectRequest.rejectRequestType = "CHECKOUT";
            $scope.rejectRequest.checkoutId = appr.checkOut.checkoutId;
            $scope.rejectRequest.bookingId = appr.bookingId;
            $scope.rejectRequest.roomId = appr.rooms.roomId;
        }else if(appr.bookingStatus == "CANCEL"){
            $scope.rejectRequest = {};
            $scope.rejectRequest.rejectRequestType = "CANCEL";
            $scope.rejectRequest.cancId = appr.cancel.cancId;
            $scope.rejectRequest.bookingId = appr.bookingId;
            $scope.rejectRequest.roomId = appr.rooms.roomId;
        }else if(appr.bookingStatus == "EXTENSION"){
            $scope.rejectRequest = {};
            $scope.rejectRequest.rejectRequestType = "EXTENSION";
            $scope.rejectRequest.extId = appr.extension.extId;
            $scope.rejectRequest.bookingId = appr.bookingId;
            $scope.rejectRequest.roomId = appr.rooms.roomId;
        }
        $('#rejectModal').openModal({dismissible: false},1);
   };

   if($rootScope.userDetailsDone){
        showPreloader();
        init();
    }else{
        $scope.DetailDoneEvent = $scope.$on('DetailsDone',function(event,data){
                                    showPreloader();
                                    init();
                                });
    }

}]);