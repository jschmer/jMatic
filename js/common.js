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

    .service("LocalStorage", function (SharedState) {
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

        this.initSharedState = function (booleanPropertyName, scope) {
            var boolValue = localStorage[booleanPropertyName];
            boolValue = boolValue == null ? false : boolValue == "true";
            SharedState.initialize(scope, booleanPropertyName);
            SharedState.set(booleanPropertyName, boolValue);
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

    .factory("CCUXMLAPI", function (LocalStorage, $http, Notification) {
        function getIP() {
            return LocalStorage.get('CCU-IP');
        }

        var URI = {
            AllDeviceStates: function () { return 'http://' + getIP() + '/addons/xmlapi/statelist.cgi'; },
            DeviceState: function (ids) { return 'http://' + getIP() + '/addons/xmlapi/state.cgi?device_id=' + ids.join(); },
            DeviceList: function () { return 'http://' + getIP() + '/addons/xmlapi/devicelist.cgi'; },
            SysVarList: function () { return 'http://' + getIP() + '/addons/xmlapi/sysvarlist.cgi'; },
            ChannelEdit: function (id, value) {
                return 'http://' + getIP() + '/addons/xmlapi/statechange.cgi?ise_id=' + id + '&new_value=' + value;
            },
        }

        function executeHttpGet(params) {
            delete $http.defaults.headers.common['X-Requested-With'];
            $http.get(params.uri)
                 .success(params.success)
                 .error(params.error);
        }

        function genericErrorFn(message, response, status, headers, config, errorCallback) {
            Notification.error(message);
            console.error(message, response, status, headers, config);

            if (errorCallback) errorCallback();
        }

        // Executes HTTP GET requests on the CCU and converts the response to JSON
        // Every method takes a callbacks object with success and error functions that get executed in
        // their corresponding handler depending on the outcome of the http request
        return {
            AllDeviceStates: function (callbacks) {
                if (!callbacks) callbacks = {}

                executeHttpGet({
                    uri: URI.AllDeviceStates(),
                    success: function (response, status, headers, config) {
                        console.log("OK getting all deviceStates");

                        try {
                            var deviceStates = x2js.xml_str2json(response).stateList.device;
                            if (deviceStates == null) {
                                Notification.error("No device states received!");
                                return;
                            }
                            console.log("OK converting device states to json!");

                            // adjust statelists with only one device
                            deviceStates = makeArrayIfOnlyOneObject(deviceStates);
                        }
                        catch (e) {
                            Notification.error("Failed parsing device states! " + e);
                            console.error(e);
                            return;
                        }

                        if (callbacks.success) callbacks.success(deviceStates);
                    },
                    error: function (response, status, headers, config) {
                        genericErrorFn("Failed getting device states! Is your CCU reachable?", response, status, headers, config, callbacks.error);
                    }
                });

                return 'http://' + getIP() + '/addons/xmlapi/statelist.cgi';
            },
            DeviceState: function (ids, callbacks) {
                if (!isArray(ids)) {
                    var msg = ids + " is not an array!";
                    console.error(msg);
                    throw msg;
                }
                if (!callbacks) callbacks = {}

                executeHttpGet({
                    uri: URI.DeviceState(ids),
                    success: function (response, status, headers, config) {
                        console.log("OK getting deviceStates for IDs " + ids.join());

                        try {
                            var deviceStates = x2js.xml_str2json(response).state.device;
                            if (deviceStates == null) {
                                Notification.error("No device states received!");
                                return;
                            }
                            console.log("OK converting device states to json!");

                            // adjust statelists with only one device
                            deviceStates = makeArrayIfOnlyOneObject(deviceStates);
                        }
                        catch (e) {
                            Notification.error("Failed parsing device states! " + e);
                            console.error(e);
                            return;
                        }

                        if (callbacks.success) callbacks.success(deviceStates);
                    },
                    error: function (response, status, headers, config) {
                        genericErrorFn("Failed getting device states! Is your CCU reachable?", response, status, headers, config, callbacks.error);
                    }
                });
            },
            DeviceList: function (callbacks) {
                if (!callbacks) callbacks = {}

                executeHttpGet({
                    uri: URI.DeviceList(),
                    success: function (response, status, headers, config) {
                        console.log("OK getting devicelist!");

                        try {
                            var deviceArray = x2js.xml_str2json(response).deviceList.device;
                            if (deviceArray == null) {
                                Notification.error("No device states received!");
                                return;
                            }
                            console.log("OK converting device list to json!");

                            // adjust device arrays with only one device
                            deviceArray = makeArrayIfOnlyOneObject(deviceArray);
                        }
                        catch (e) {
                            Notification.error("Failed parsing devices! " + e);
                            console.error(e);
                            return;
                        }

                        if (callbacks.success) callbacks.success(deviceArray);
                    },
                    error: function (response, status, headers, config) {
                        genericErrorFn("Failed getting devices! Is your CCU reachable?", response, status, headers, config, callbacks.error);
                    }
                });
            },
            SysVarList: function (callbacks) {
                if (!callbacks) callbacks = {}

                executeHttpGet({
                    uri: URI.SysVarList(),
                    success: function (response, status, headers, config) {
                        console.log("OK getting system variable list!");

                        try {
                            var sysVars = x2js.xml_str2json(response).systemVariables.systemVariable;
                            if (sysVars == null) {
                                Notification.error("No system variables received!");
                                return;
                            }
                            console.log("OK converting system variable list to json!");

                            // adjust sysvar list with only one system variable
                            sysVars = makeArrayIfOnlyOneObject(sysVars);
                        }
                        catch (e) {
                            Notification.error("Failed parsing system variables! " + e);
                            console.error(e);
                            return;
                        }

                        if (callbacks.success) callbacks.success(sysVars);
                    },
                    error: function (response, status, headers, config) {
                        genericErrorFn("Failed getting system variable list! Is your CCU reachable?", response, status, headers, config, callbacks.error);
                    }
                });
            },
            ChannelEdit: function (id, value, callbacks) {
                console.info("Writing value " + value + " to channel " + id);
                if (!callbacks) callbacks = {}

                executeHttpGet({
                    uri: URI.ChannelEdit(id, value),
                    success: function (response, status, headers, config) {
                        console.log("OK changing channel " + id);

                        try {
                            var result = x2js.xml_str2json(response).result;
                            if (result == null) {
                                // write failed
                                var message = "Writing " + value + " to system variable with id " + id + " failed!";
                                Notification.error(message);
                                console.error(message, response, status, headers, config);
                                return;
                            }
                            console.log("OK converting write result to json!");
                        }
                        catch (e) {
                            Notification.error("Failed parsing device states! " + e);
                            console.error(e);
                            return;
                        }

                        if (callbacks.success) callbacks.success(result);
                    },
                    error: function (response, status, headers, config) {
                        genericErrorFn("Failed writing channel state! Is your CCU reachable?", response, status, headers, config, callbacks.error);
                    }
                });
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

function isArray(obj) {
    return Object.prototype.toString.call(obj) === "[object Array]";
}

function copy(obj) {
    return $.extend({}, obj);
}