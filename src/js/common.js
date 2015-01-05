var x2js = new X2JS();
var jMaticApp = angular
    .module('jMaticApp', ['ngDialog', 'ngRoute', 'ngAnimate', 'toasty', 'mobile-angular-ui', 'jMaticControllers'])

    .service('Notification', function (toasty) {
        this.error = function (message, timeout) {
            console.error(message);
            toasty.pop.error({
                title: message,
                sound: false,
                showClose: true,
                clickToClose: true,
                timeout: isInt(timeout) ? timeout : 2000
            });
        };
    })

    .config(['$routeProvider', function ($routeProvider) {
        $routeProvider.
            when('/deviceState', {
                templateUrl: 'c_deviceState.html',
                controller: 'deviceStateController',
                reloadOnSearch: false
            }).
            when('/deviceConfig', {
                templateUrl: 'c_deviceConfig.html',
                controller: 'deviceConfigController',
                reloadOnSearch: false
            }).
            when('/batteryCheck', {
                templateUrl: 'c_deviceBatteryCheck.html',
                controller: 'batteryCheckController',
                reloadOnSearch: false
            }).
            when('/sysVars', {
                templateUrl: 'c_systemVariables.html',
                controller: 'sysVarsController',
                reloadOnSearch: false
            }).
            otherwise({
                redirectTo: '/deviceState'
            });
    }]);


// enable auto-focus attribute
jMaticApp.directive('autoFocus', function ($timeout) {
    return {
        restrict: 'AC',
        link: function (_scope, _element) {
            $timeout(function () {
                _element[0].focus();
            }, 0);
        }
    };
});

function loadDeviceDataFromLocalStorage() {
    var registeredDevices = localStorage.registeredDevices;
    try {
        return JSON.parse(registeredDevices);
    }
    catch (e) { }
    return [];
}

function saveDeviceDataToLocalStorage(arrayOfDevices) {
    try {
        var jsonEnocded = JSON.stringify(arrayOfDevices);
        localStorage.registeredDevices = jsonEnocded;
    }
    catch (e) { }
}

function findDevice(deviceArray, deviceId) {
    for (i = 0; i < deviceArray.length; ++i) {
        if (deviceArray[i].id == deviceId)
            return i;
    }
    return -1;
}

function removeDevice(deviceArray, deviceId) {
    var index = -1;
    for (i = 0; i < deviceArray.length; ++i) {
        if (deviceArray[i].id == deviceId) {
            index = i;
            break;
        }
    }

    if (index != -1) {
        deviceArray.splice(index, 1);
    }
}

function makeArrayIfOnlyOneObject(obj) {
    // adjust channels with a single datapoint
    if (obj.constructor != Array) {
        return [obj];
    }
    else {
        return obj;
    }
}

function isInt(obj) {
    return (typeof obj==='number' && (obj%1)===0);
}