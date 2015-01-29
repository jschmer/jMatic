var x2js = new X2JS();
var jMaticApp = angular
    .module('jMaticApp', ['ngRoute', 'ngAnimate', 'toasty', 'mobile-angular-ui', 'jMaticControllers', 'pascalprecht.translate'])

    .service('Notification', function (toasty) {
        this.error = function (message, timeout) {
            console.error(message);
            toasty.pop.error({
                title: "Error",
                msg: message,
                sound: false,
                showClose: true,
                clickToClose: true,
                timeout: isInt(timeout) ? timeout : 0
            });
        };

        this.success = function (message, timeout) {
            console.info(message);
            toasty.pop.success({
                title: "Success",
                msg: message,
                sound: false,
                showClose: true,
                clickToClose: true,
                timeout: isInt(timeout) ? timeout : 0
            });
        };
    })

    .service("LocalStorage", function () {
        this.loadDevices = function () {
            var registeredDevices = localStorage.registeredDevices;
            try {
                return JSON.parse(registeredDevices);
            }
            catch (e) { }
            return [];
        };

        this.saveDevices = function (arrayOfDevices) {
            try {
                var jsonEnocded = JSON.stringify(arrayOfDevices);
                localStorage.registeredDevices = jsonEnocded;
            }
            catch (e) { }
        };

        this.initSharedState = function (booleanPropertyName, sharedState, scope) {
            var boolValue = localStorage[booleanPropertyName];
            boolValue = boolValue == null ? false : boolValue == "true";
            sharedState.initialize(scope, booleanPropertyName);
            sharedState.set(booleanPropertyName, boolValue);
        };

        this.get = function (key) {
            if (localStorage.hasOwnProperty(key))
                return localStorage[key];
            else
                return undefined;
        };

        this.set = function (key, value) {
            localStorage[key] = value;
        };
    })

    .factory("CCUXMLAPI", function (LocalStorage) {
        // TODO: put http request stuff in here

        function getIP() {
            return LocalStorage.get('CCU-IP');
        }

        return {
            AllDeviceStates: function () { return 'http://' + getIP() + '/addons/xmlapi/statelist.cgi'; },
            DeviceState: function () { return 'http://' + getIP() + '/addons/xmlapi/state.cgi?device_id='; },
            DeviceList: function () { return 'http://' + getIP() + '/addons/xmlapi/devicelist.cgi'; },
            SysVarList: function () { return 'http://' + getIP() + '/addons/xmlapi/sysvarlist.cgi'; },
            ChannelEdit: function (id, value) {
                return 'http://' + getIP() + '/addons/xmlapi/statechange.cgi?ise_id=' + id + '&new_value=' + value;
            },
        };
    })

    .config(['$routeProvider', '$translateProvider', function ($routeProvider, $translateProvider) {
        $routeProvider.
            when('/deviceState', {
                templateUrl: 'deviceState.html',
                controller: 'deviceStateController',
                reloadOnSearch: false
            }).
            when('/editDeviceState/:deviceId', {
                templateUrl: 'editDeviceState.html',
                controller: 'editDeviceStateController',
                reloadOnSearch: false
            }).
            when('/deviceConfig', {
                templateUrl: 'deviceConfig.html',
                controller: 'deviceConfigController',
                reloadOnSearch: false
            }).
            when('/batteryCheck', {
                templateUrl: 'deviceBatteryCheck.html',
                controller: 'batteryCheckController',
                reloadOnSearch: false
            }).
            when('/sysVars', {
                templateUrl: 'systemVariables.html',
                controller: 'sysVarsController',
                reloadOnSearch: false
            }).
            when('/appConfig', {
                templateUrl: 'applicationConfig.html',
                controller: 'appConfigController',
                reloadOnSearch: false
            }).
            otherwise({
                redirectTo: '/deviceState'
            });

        // load defined languages
        if (typeof (lang) !== "undefined") {
            for (keycode in lang) {
                if (lang.hasOwnProperty(keycode)) {
                    $translateProvider.translations(keycode, lang[keycode]);
                }
            }
        }

        $translateProvider
            .preferredLanguage('en')
            .fallbackLanguage('en');
    }])
    .run(function (LocalStorage, $translate) {
        var currentLang = LocalStorage.get('lang');
        if (typeof (currentLang) !== "undefined")
            $translate.use(currentLang);
    })
;


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
    return (typeof obj === 'number' && (obj % 1) === 0);
}

function copy(obj) {
    return $.extend({}, obj);
}