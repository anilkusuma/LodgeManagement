var app = angular.module('Home', ['ngRoute','scDateTime','mgcrea.ngStrap','ngCookies','summernote','ngFileUpload','ng.deviceDetector','ngTouch']);
var selector = Cookies.get('selector');
var validator= Cookies.get('validator');
var userID = Cookies.get('userID');
var userType = Cookies.get('userType');

if(selector == null || validator== null || userID == null || userType == null){
    window.location = '/login';
}else{
    if(userType == 'ADMIN'){
        app.config(['$routeProvider','$locationProvider','$provide','$sceDelegateProvider',function ($routeProvider,$locationProvider,$provide,$sceDelegateProvider) {
            $sceDelegateProvider.resourceUrlWhitelist([
                'self',
                'https://drive.google.com/**',
                'https://www.youtube.com/**'
            ]);
            $routeProvider
            .when('/approvals', {
                templateUrl: '/modules/Approvals/approvals.html',
                controller: 'appCtr'
            })
            .when('/bookings', {
                templateUrl: '/modules/Bookings/bookings.html',
                controller: 'bookingCtr'
            })
            .otherwise({
                redirectTo :  '/approvals'
            });
            $locationProvider.html5Mode(true);
        }]);
    }else {
        app.config(['$routeProvider','$locationProvider','$provide','$sceDelegateProvider',function ($routeProvider,$locationProvider,$provide,$sceDelegateProvider) {
            $sceDelegateProvider.resourceUrlWhitelist([
                'self',
                'https://drive.google.com/**',
                'https://www.youtube.com/**'
            ]);
            $routeProvider
            .when('/home', {
                templateUrl: '/modules/Reception/reception.html',
                controller: 'recCtr'
            })
            .otherwise({
                redirectTo :  '/home'
            });
            $locationProvider.html5Mode(true);
        }]);
    }
}
app.factory('RootSer',['$http','$rootScope',function($http,$rootScope){
    var RootSers = {};
    return RootSers;
}]);

app.controller('HomeMain',['$scope','$rootScope','$http','$location','$window','$cookies','$timeout','RootSer','deviceDetector',function($scope,$rootScope,$http,$window,$location,$cookies,$timeout,RootSer,deviceDetector){
    if(deviceDetector.isDesktop()){
        $rootScope.desktop=true;
    }else{
        $rootScope.desktop=false;
    }

    $rootScope.baseUrl = '';
    $rootScope.userDetails = {};
    $rootScope.userDetailsDone = false;

    $rootScope.$on('$routeChangeStart', function(event, current) {
        $('.lean-overlay').remove(); 
    });

    var showPage = function(){

        var name = $rootScope.userDetails.firstName+' '+$rootScope.userDetails.lastName;

        $scope.username = name;
        $scope.userRoal = $rootScope.userDetails.userType.toTitleCase();


        $timeout(function(){
            if(deviceDetector.isDesktop()){
                $(".button-collapse").sideNav();
            }else{
                $(".button-collapse").sideNav({
                    closeOnClick: true
                });
            }
            $('.dropdown-button').dropdown({
                hover: true,
                belowOrigin: true
            });
            $('.tooltipped').tooltip({delay: 50});
            $('select').material_select();
        },0,false);
        

        $('.main-preloaderDiv').hide();
        $(document.body).css('justify-content','inherit');
        $(document.body).css('align-items','inherit');
        var numDivs = $('#header,#main,#footer').length;
        $('#header,#main,#footer').fadeIn(200,function(){
            if(--numDivs > 0) return;
            $rootScope.userDetailsDone = true;
            //showPreloader();
            $rootScope.$broadcast('DetailsDone');
        });
    }

    $scope.adminType = false;
    $scope.userType=false;

    $rootScope.getUserDetails = function(){
        var selector = $cookies.get('selector');
        var validator = $cookies.get('validator');
        var userID = $cookies.get('userID');
        var userType = $cookies.get('userType');

        if(selector == null || validator == null || userID == null || userType == null){
            $cookies.remove('selector');
            $cookies.remove('validator');
            $cookies.remove('userID');
            $cookies.remove('userType');

            window.location = '/login';
        }else{
            var url=$rootScope.baseUrl+ '/api/Logins/bUserDetails';
            $http({
                method: 'GET',
                url: url
            }).then(function successCallback(response) {
                var data = response.data;
                if(data.loginStatus == "SUCCESS" && data.userStatus == "SUCCESS" ){
                    $rootScope.userDetails.userId = userID;
                    if(data.userType == "RECEPTION"){
                        showPreloader();
                        $('#main,footer').css('padding-left','0px');
                        $scope.recType = true;
                        $rootScope.userDetails.lodgeId = data.lodgeId;
                        $rootScope.userDetails.userType = "RECEPTION";
                        $rootScope.userDetails.userId = data.responseData[0].userId;
                        $rootScope.userDetails.firstName = data.responseData[0].firstName;
                        $rootScope.userDetails.lastName = data.responseData[0].lastName;
                        $rootScope.userDetails.dateOfBirth = moment.utc(data.responseData[0].dateOfBirth).format('Do MMMM YYYY');
                        $rootScope.userDetails.sex = data.responseData[0].sex;
                        $rootScope.userDetails.address = data.responseData[0].address;
                        $rootScope.userDetails.mobileNumber = data.responseData[0].mobileNumber;
                        $rootScope.userDetails.emailId = data.responseData[0].emailId;
                    }
                    else if(data.userType == "ADMIN"){
                        $scope.adminType = true;
                        $rootScope.userDetails.lodgeId = data.lodgeId;
                        $rootScope.userDetails.userType = "ADMIN";
                        $rootScope.userDetails.userId = data.responseData[0].userId;
                        $rootScope.userDetails.firstName = data.responseData[0].firstName;
                        $rootScope.userDetails.lastName = data.responseData[0].lastName;
                        $rootScope.userDetails.dateOfBirth = moment.utc(data.responseData[0].dateOfBirth).format('Do MMMM YYYY');
                        $rootScope.userDetails.sex = data.responseData[0].sex;
                        $rootScope.userDetails.address = data.responseData[0].address;
                        $rootScope.userDetails.mobileNumber = data.responseData[0].mobileNumber;
                        $rootScope.userDetails.emailId = data.responseData[0].emailId;
                    }
                    console.log('user details are '+JSON.stringify($rootScope.userDetails));
                    showPage();
                }
                else if(data.loginStatus == "SUCCESS" && data.userStatus == "FAILED"){
                    Materialize.toast('Unexpected Error.Please Login Again',2000,'rounded',function(){
                        $cookies.remove('selector');
                        $cookies.remove('validator');
                        $cookies.remove('userID');
                        $cookies.remove('userType');
                        window.location = '/login';
                    });
                }
                else if(data.loginStatus == "FAILURE"){
                    Materialize.toast('Unexpected Error.Please Login Again',2000,'rounded',function(){
                        $cookies.remove('selector');
                        $cookies.remove('validator');
                        $cookies.remove('userID');
                        $cookies.remove('userType');
                        window.location = '/login';
                    });
                }      
            },function errorCallback(response) {
                Materialize.toast('Unexpected Error.Please Login Again',2000,'rounded',function(){
                    $cookies.remove('selector');
                    $cookies.remove('validator');
                    $cookies.remove('userID');
                    $cookies.remove('userType');
                    window.location = '/login';
                });
            });
        }
        $timeout(function(){
            $('.collapsible').collapsible({
                accordion : true 
            });
        },0,false);
    };

    var init = function(){
        $rootScope.getUserDetails();
    };

    init();



    $rootScope.logout = function(){
        $cookies.remove('selector');
        $cookies.remove('validator');
        $cookies.remove('userID');
        $cookies.remove('userType');
        window.location = '/login';
    }

    $timeout(function(){
        $('.collapsible').collapsible({
            accordion : true 
        });
    },0,false);

    $timeout(function(){
        $('.collapsible').collapsible({
            accordion : true 
        });
    },2000,false);
}]);
