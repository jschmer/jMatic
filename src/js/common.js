var x2js = new X2JS();
var jMaticApp = angular
    .module('jMaticApp', ['ngDialog', 'ngRoute', 'mobile-angular-ui', 'jMaticControllers'])
    .config(['$routeProvider', function ($routeProvider) {
        $routeProvider.
            when('/deviceState', {
                templateUrl: 'c_deviceState.html',
                controller: 'deviceStateController'
            }).
            when('/deviceConfig', {
                templateUrl: 'c_deviceConfig.html',
                controller: 'deviceConfigController'
            }).
            when('/batteryCheck', {
                templateUrl: 'c_deviceBatteryCheck.html',
                controller: 'batteryCheckController'
            }).
            when('/sysVars', {
                templateUrl: 'c_systemVariables.html',
                controller: 'sysVarsController'
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

var timeoutFn = null;
function setErrorMessage(text, duration) {
    $('#errorMessage').text(text);
    $('#errorMessageBox').show();

    if (timeoutFn != null) clearTimeout(timeoutFn);
    timeoutFn = setTimeout(function () {
        $('#errorMessageBox').hide();
        $('#errorMessage').text("");
    }, duration);
}

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