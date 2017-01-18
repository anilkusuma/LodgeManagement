app.factory('RecService',['$http','$rootScope',function($http,$rootScope){
    var RecServices = {};
    RecServices.getRooms = function(callback){
        var url=$rootScope.baseUrl+ '/api/RoomTypes/bGetRooms';
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
    RecServices.saveBooking = function(data,callback){
        var url=$rootScope.baseUrl+ '/api/Bookings/SaveBooking';
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
    RecServices.checkOutRoom = function(data,callback){
        var url=$rootScope.baseUrl+ '/api/Checkouts/CheckoutRequest';
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
    RecServices.extendRoom = function(data,callback){
        var url=$rootScope.baseUrl+ '/api/Extensions/ExtendRoom';
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
    RecServices.cancelRoom = function(data,callback){
        var url=$rootScope.baseUrl+ '/api/Cancels/CancelBooking';
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
    RecServices.getBookings = function(callback){
        var url=$rootScope.baseUrl+ '/api/Bookings/GetBookings';
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
    return RecServices;
}]);
app.controller('recCtr', ['$http','$rootScope','RecService','$routeParams','$scope','$timeout','$location','Upload',function ($http,$rootScope,RecService,$routeParams,$scope,$timeout,$location,Upload) {
    var getBookings = function(){

        RecService.getBookings(function(status,bookings){
            console.log('getBookings called'+status);
            if(status=="SUCCESS"){
                for(var i=0;i<bookings.length;i++){
                    var checkIn = moment(bookings[i].checkInTime,'ddd MMM DD YYYY HH:mm:ss').format('D/MM/YYYY H:mm');
                    var checkOut = moment(bookings[i].checkOutTime,'ddd MMM DD YYYY HH:mm:ss').format('D/MM/YYYY H:mm');
                    if(moment().isAfter(moment(checkOut,'D/MM/YYYY H:mm'))){
                        bookings[i].checkoutMessage = 'Time stayed after checkout time';
                        bookings[i].crossedCheckOutTime = 'crossedCheckOutTime';
                        var duration = moment.duration(moment().diff(moment(checkOut,'D/MM/YYYY H:mm')));
                    }else{
                        bookings[i].checkoutMessage = 'Time left to checkout';
                        bookings[i].crossedCheckOutTime = 'notCrossedCheckOutTime';
                        var duration = moment.duration(moment(checkOut,'D/MM/YYYY H:mm').diff(moment()));
                    }
                    bookings[i].remainingHours = parseInt(duration.asHours());
                    bookings[i].remainingMins = parseInt(duration.asMinutes()) - bookings[i].remainingHours*60;
                }
                $scope.bookings = bookings;
                // $scope.bookings = $scope.bookings.concat($scope.bookings);
                // $scope.bookings = $scope.bookings.concat($scope.bookings);
                // $scope.bookings = $scope.bookings.concat($scope.bookings);
                // $scope.bookings = $scope.bookings.concat($scope.bookings);
                // $scope.bookings = $scope.bookings.concat($scope.bookings);
                hidePreloader();
                $rootScope.checkoutTimer=$timeout(updateTimers,60001,true);
                $timeout(function(){
                    $('.tooltipped').tooltip({delay: 50});
                },0,false);
            }else if(status == "EMPTY"){
                $scope.bookings = [];
                hidePreloader();
            }else if(status == "FAILED"){
                $rootScope.logout();
            }else{
                hidePreloader();
            }
        });
    };
    var updateTimers = function(){
        for(var i=0;i<$scope.bookings.length;i++){
            var checkIn = moment($scope.bookings[i].checkInTime,'ddd MMM DD YYYY HH:mm:ss').format('D/MM/YYYY H:mm');
            var checkOut = moment($scope.bookings[i].checkOutTime,'ddd MMM DD YYYY HH:mm:ss').format('D/MM/YYYY H:mm');
            if(moment().isAfter(moment(checkOut,'D/MM/YYYY H:mm'))){
                $scope.bookings[i].checkoutMessage = 'Time stayed after checkout time';
                $scope.bookings[i].crossedCheckOutTime = 'crossedCheckOutTime';
                var duration = moment.duration(moment().diff(moment(checkOut,'D/MM/YYYY H:mm')));
            }else{
                $scope.bookings[i].checkoutMessage = 'Time left to checkout';
                $scope.bookings[i].crossedCheckOutTime = 'notCrossedCheckOutTime';
                var duration = moment.duration(moment(checkOut,'D/MM/YYYY H:mm').diff(moment()));
            }
            $scope.bookings[i].remainingHours = parseInt(duration.asHours());
            $scope.bookings[i].remainingMins = parseInt(duration.asMinutes()) - $scope.bookings[i].remainingHours*60;
        }
        $rootScope.checkoutTimer=$timeout(updateTimers,60001,true);
    }
    if($rootScope.userDetailsDone){
        showPreloader();
        getBookings();
    }else{
        $scope.DetailDoneEvent = $scope.$on('DetailsDone',function(event,data){
                                    showPreloader();
                                    getBookings();
                                });
    }
    
    $scope.$on('refreshBookings',function(event,args){
        showPreloader();
        getBookings();
    });
    $scope.bookRoom = function(){
        $scope.$broadcast('bookRoom');
    };
    $scope.checkOutRoom = function(booking){
        $scope.checkOut = {};
        $scope.checkOut.bookingId = booking.bookingId;
        $scope.checkOut.roomNumber = booking.rooms.roomNumber;
        $scope.checkOut.checkInTime = moment(booking.checkInTime,'ddd MMM DD YYYY HH:mm:ss').format('D/MM/YYYY H:mm');
        var checkIn = moment(booking.checkInTime,'ddd MMM DD YYYY HH:mm:ss').format('D/MM/YYYY H:mm');
        var duration = moment.duration(moment().diff(moment(checkIn,'D/MM/YYYY H:mm')));
        var days = duration.asDays();

        if(duration.hours() > 3){
            days = days+1;
        }
        $scope.checkOut.amountToBePaid = parseInt(days)*booking.perDayCostOfRoom;
        $scope.checkOut.amountPaid = $scope.checkOut.amountToBePaid;
        $('#checkOutModal').openModal({dismissible: false},1);
    };
    $scope.cancelCheckout = function(){
        $('#checkOutModal').closeModal();
    };

    $scope.completeCheckout= function(){
        var valid=true;
        if(!$scope.checkOut.amountPaid < 0){
            valid = false;
            var html = 'Cost per day can not be less then 0';
            $('#cost-error,.errorNameCost').addClass('error');
            $('#cost-error').text(html);
            $('.errorNameCost').show();
        }

        var checkInVal = $('#checkInTimeInput').val();
        var checkOutVal = $('#checkOutTimeInput').val();
        var checkInTime = moment(checkInVal,'D/MM/YYYY H:mm');
        var checkOutTime = moment(checkOutVal,'D/MM/YYYY H:mm');
        if(moment(checkInTime).isAfter(checkOutTime)){
            valid = false;
            var html = 'Checkout can not be less then checkin';
            $('#checkout-error,.errorCheckout').addClass('error');
            $('#checkout-error').text(html);
            $('.errorCheckout').show();
        }
        if(!valid){
            Materialize.toast('Please correct the errors',1000);
            return;
        }

        var data = {
            'checkIn': checkInVal,
            'checkOut': checkOutVal,
            'bookingId': $scope.checkOut.bookingId,
            'amountToBePaid':$scope.checkOut.amountToBePaid,
            'amountPaid':$scope.checkOut.amountPaid,
            'roomNumber':$scope.checkOut.roomNumber,
            'guestFeedback':$scope.checkOut.guestFeedback
        }
        $('#checkOutModal').closeModal();
        console.log('data is '+JSON.stringify(data));
        RecService.checkOutRoom(data,function(status){
            if(status == "SUCCESS"){
                Materialize.toast('Checkout Complete',2000);
            }else{
                Materialize.toast('Error',2000);
            }
            $scope.$emit('refreshBookings');
        });
        return;
    };


    $scope.extendBooking = function(booking){
        $scope.extend = {};
        $scope.extend.bookingId = booking.bookingId;
        $scope.extend.roomNumber = booking.rooms.roomNumber;
        $scope.extend.checkInTime = moment(booking.checkInTime,'ddd MMM DD YYYY HH:mm:ss').format('D/MM/YYYY H:mm');
        $scope.extend.currentCheckOutTime = moment(booking.checkOutTime,'ddd MMM DD YYYY HH:mm:ss').format('D/MM/YYYY H:mm');
        $scope.extend.extensionReason = 'Customer wants to extend booking';
        $scope.extend.guestName = booking.guests[0].guestName;

        $('#extensionModal').openModal({dismissible: false},1);
        $timeout(function(){
            $('#checkOutExtend').val(moment(booking.checkOutTime,'ddd MMM DD YYYY HH:mm:ss').add(1,'days').format('D/MM/YYYY H:mm'));
            $('.reasonCol label').addClass('active');
        },0,true);
    };
    $scope.cancelExtend = function(){
        $('#extensionModal').closeModal();
    };

    $scope.completeExtend= function(){
        var valid=true;


        var checkInVal = $('#checkInExtend').val();
        var checkOutVal = $('#checkOutExtend').val();
        var checkInTime = moment(checkInVal,'D/MM/YYYY H:mm');
        var checkOutTime = moment(checkOutVal,'D/MM/YYYY H:mm');
        if(moment(checkInTime).isAfter(checkOutTime)){
            valid = false;
            var html = 'Extension time can not be less then current checkout time';
            $('#checkout-error,.errorCheckout').addClass('error');
            $('#checkout-error').text(html);
            $('.errorCheckout').show();
        }
        if(!valid){
            Materialize.toast('Please correct the errors',1000);
            return;
        }

        var data = {
            'currentCheckOutTime': checkInVal,
            'newCheckOutTime': checkOutVal,
            'bookingId': $scope.extend.bookingId,
            'extensionReason':$scope.extend.extensionReason,
            'guestName':$scope.extend.guestName,
            'roomNumber':$scope.extend.roomNumber
        }
        $('#extensionModal').closeModal();
        console.log('data is '+JSON.stringify(data));
        RecService.extendRoom(data,function(status){
            if(status == "SUCCESS"){
                Materialize.toast('Extension Complete',2000);
            }else{
                Materialize.toast('Error',2000);
            }
            $scope.$emit('refreshBookings');
        });
        return;
    };



    $scope.cancelBooking = function(booking){
        $scope.cancel = {};
        $scope.cancel.bookingId = booking.bookingId;
        $scope.cancel.roomNumber = booking.rooms.roomNumber;
        $scope.cancel.checkInTime = moment(booking.checkInTime,'ddd MMM DD YYYY HH:mm:ss').format('D/MM/YYYY H:mm');
        $scope.cancel.cancelationTime = moment().format('D/MM/YYYY H:mm');
        $scope.cancel.cancelReason = 'Customer wants to cancel booking';
        $scope.cancel.guestName = booking.guests[0].guestName;
        $('#cancelModal').openModal({dismissible: false},1);
        $timeout(function(){
            $('.reasonCol label').addClass('active');
        },0,true);
    };
    $scope.cancelCancel = function(){
        $('#cancelModal').closeModal();
    };

    $scope.completeCancel= function(){
        var valid=true;
        if(!$scope.cancel.cancelReason.replace(/\s/g, '').length){
            valid = false;
            var html = 'Reason for cancelation is Mandatory';
            $('#reason-error,.errorReason').addClass('error');
            $('#reason-error').text(html);
            $('.errorReason').show();
        }

        if(!valid){
            Materialize.toast('Please correct the errors',1000);
            return;
        }

        var data = {
            'bookingId': $scope.cancel.bookingId,
            'checkInTime': $scope.cancel.checkInTime,
            'cancelationTime': $scope.cancel.cancelationTime,
            'cancelReason':$scope.cancel.cancelReason,
            'guestName':$scope.cancel.guestName,
            'roomNumber':$scope.cancel.roomNumber
        }
        $('#cancelModal').closeModal();
        console.log('data is '+JSON.stringify(data));
        RecService.cancelRoom(data,function(status){
            if(status == "SUCCESS"){
                Materialize.toast('Booking Canceled',2000);
            }else{
                Materialize.toast('Error',2000);
            }
            $scope.$emit('refreshBookings');
        });
        return;
    };


}]);

app.controller('recBookCtr',['$http','$rootScope','RecService','$scope','$timeout','$location',function ($http,$rootScope,RecService,$scope,$timeout,$location) {
    $scope.cancelBooking = function(){
        $('#bookRoomModal').closeModal();
    };
    $scope.inputFocused = function(type){
        $('.errorName').hide();
    };
    
    $scope.saveBooking = function(){
        var valid=true;
        if(!$scope.newBooking.costPerDay < 0){
            valid = false;
            var html = 'Cost per day can not be less then 0';
            $('#cost-error,.errorNameCost').addClass('error');
            $('#cost-error').text(html);
            $('.errorNameCost').show();
        }
        if(!$scope.newBooking.Guests[0].name.replace(/\s/g, '').length){
            valid = false;
            var html = 'Primary Guest Details Are Mandatory';
            $('#name-error,.errorname').addClass('error');
            $('#name-error').text(html);
            $('.errorname').show();
        }
        if(!$scope.newBooking.Guests[0].mobile.replace(/\s/g, '').length){
            valid = false;
            var html = 'Primary Guest Details Are Mandatory';
            $('#mobile-error,.errorNameMobile').addClass('error');
            $('#mobile-error').text(html);
            $('.errorNameMobile').show();
        }
        if(!$scope.newBooking.Guests[0].emailId.replace(/\s/g, '').length){
            valid = false;
            var html = 'Primary Guest Details Are Mandatory';
            $('#email-error,.errorNameEmail').addClass('error');
            $('#email-error').text(html);
            $('.errorNameEmail').show();
        }
        var checkIn = $('#checkIn').val();
        var checkOut = $('#checkOut').val();
        var checkInTime = moment(checkIn,'D/MM/YYYY H:mm');
        var checkOutTime = moment(checkOut,'D/MM/YYYY H:mm');
        if(moment(checkInTime).isAfter(checkOutTime)){
            valid = false;
            var html = 'Checkout can not be less then checkin';
            $('#checkout-error,.errorCheckout').addClass('error');
            $('#checkout-error').text(html);
            $('.errorCheckout').show();
        }
        if(!valid){
            Materialize.toast('Please correct the errors',1000);
            return;
        }

        var data = {
            'checkIn': checkIn,
            'checkOut': checkOut,
            'roomType': $scope.newBooking.RoomType,
            'room':$scope.newBooking.Room,
            'costPerDay':$scope.newBooking.costPerDay,
            'numberOfGuests':$scope.newBooking.numberOfGuests,
            'guests':$scope.newBooking.Guests
        }
        $('#bookRoomModal').closeModal();
        RecService.saveBooking(data,function(status){
            if(status == "SUCCESS"){
                Materialize.toast('Booking Saved',2000);
            }else{
                Materialize.toast('Error',2000);
            }
            $scope.$emit('refreshBookings');
        });
        return;
    };
    
    $scope.$on('bookRoom',function(event,args){
        RecService.getRooms(function(status,rooms){
            if(status == "SUCCESS"){
                $scope.newBooking = {};
                $scope.newBooking.checkInTime = '';
                $scope.newBooking.checkOutTime = '';
                $scope.newBooking.roomTypeOptions = rooms;
                $scope.newBooking.RoomType = rooms[0];
                $scope.newBooking.roomOptions = rooms[0].rooms;
                $scope.newBooking.Room = $scope.newBooking.roomOptions[0];
                $scope.newBooking.costPerDay = parseInt(rooms[0].costPerDay);
                var guest = {};
                guest.name = '';
                guest.mobile = '';
                guest.emailId = '';
                $scope.newBooking.Guests = [];
                $scope.newBooking.Guests.push(guest);
                $scope.newBooking.roomOccupantsOptions = [{'value':1},{'value':2},{'value':3},{'value':4},{'value':5},{'value':6},{'value':7},{'value':8},{'value':9},{'value':10},{'value':11},{'value':12}];
                $scope.newBooking.numberOfGuests = {'value':1};
                $('#bookRoomModal').openModal({dismissible: false},1);
                $timeout(function(){
                    $('select').material_select();
                },0,false);
            }else if(status == "EMPTY"){
                Materialize.toast('No room available for booking',2000,false);
                return;
            }else if(status == "FAILED"){
                Materialize.toast('Session Expired, login again',2000,false);
                $rootScope.logout();
                return;
            }
        });
    });

    $scope.roomTypeChanged = function(){
        $scope.newBooking.roomOptions = $scope.newBooking.RoomType.rooms;
    };
}]);