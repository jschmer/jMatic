"use strict";

var x2js = new X2JS();
var jMaticApp = angular
    .module('jMaticApp', ['ngRoute', 'ngAnimate', 'angular-toasty', 'mobile-angular-ui', 'jMaticControllers', 'pascalprecht.translate'])

    .constant('jMaticAppConfig', {
        successToastTimeout: 3000
    })

    .service('Notification', ['toasty', '$translate', 'jMaticAppConfig', function (toasty, $translate, jMaticAppConfig) {
        function isUpper(str) {
            return str == str.toUpperCase();
        }

        function launchError(messageText, timeout) {
            $translate('ERROR').then(function (error) {
                toasty.error({
                    title: error,
                    msg: messageText,
                    sound: false,
                    showClose: true,
                    clickToClose: true,
                    timeout: isInt(timeout) ? timeout : 0
                });
            });
        }

        function launchSuccess(messageText, timeout) {
            $translate('SUCCESS').then(function (success) {
                toasty.success({
                    title: success,
                    msg: messageText,
                    sound: false,
                    showClose: true,
                    clickToClose: true,
                    timeout: isInt(timeout) ? timeout : jMaticAppConfig.successToastTimeout
                });
            });
        }

        this.error = function (message /* or translation id */, timeout) {
            console.error(message);

            // all uppercase? => translation ID
            if (isUpper(message)) {
                $translate(message).then(function (translatedMessage) {
                    launchError(translatedMessage, timeout);
                });
            }
            else {
                launchError(message, timeout);
            }
        };

        this.success = function (message /* or translation id */, timeout) {
            console.info(message);

            // all uppercase? => translation ID
            if (isUpper(message)) {
                $translate(message).then(function (translatedMessage) {
                    launchSuccess(translatedMessage, timeout);
                });
            }
            else {
                launchSuccess(message, timeout);
            }
        };

        this.clear = function()
        {
            toasty.clear();
        }
    }])

    .service("LocalStorage", ['SharedState', function (SharedState) {
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
    }])

    .factory("CCUXMLAPI", ['LocalStorage', '$http', 'Notification', '$translate', function (LocalStorage, $http, Notification, $translate) {
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
            ProgramList: function () { return 'http://' + getIP() + '/addons/xmlapi/programlist.cgi'; },
            RunProgram: function (id) { return 'http://' + getIP() + '/addons/xmlapi/runprogram.cgi?program_id=' + id; },
        }

        function executeHttpGet(params) {
            delete $http.defaults.headers.common['X-Requested-With'];
            $http.get(params.uri)
                 .success(params.success)
                 .error(params.error);
        }

        // when CCU isn't reachable
        function genericErrorFn(messageID, response, status, headers, config, errorCallback) {
            $translate(messageID).then(function (text) {
                $translate('CCU_REACHABLE').then(function (ccu_text) {
                    Notification.error(text + ' ' + ccu_text);
                    console.error(text + ' ' + ccu_text, response, status, headers, config);
                });
            });


            if (errorCallback) errorCallback();
        }

        function warn_NoDeviceStates() {
            $translate('WARN_NODEVICESTATES').then(function (text) {
                Notification.error(text);
            });
        }

        function error_FailedParsingDeviceStates(except) {
            $translate('ERROR_FAILEDPARSINGDEVICESTATES').then(function (text) {
                Notification.error(text + ' ' + except);
                console.error(text + ' ' + except);
            });
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
                                warn_NoDeviceStates();
                                return;
                            }
                            console.log("OK converting device states to json!");

                            // adjust statelists with only one device
                            deviceStates = makeArrayIfOnlyOneObject(deviceStates);
                        }
                        catch (e) {
                            error_FailedParsingDeviceStates(e);
                            return;
                        }

                        if (callbacks.success) callbacks.success(deviceStates);
                    },
                    error: function (response, status, headers, config) {
                        genericErrorFn('ERROR_FAILEDGETTINGDEVICESTATES', response, status, headers, config, callbacks.error);
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
                                warn_NoDeviceStates();
                                return;
                            }
                            console.log("OK converting device states to json!");

                            // adjust statelists with only one device
                            deviceStates = makeArrayIfOnlyOneObject(deviceStates);
                        }
                        catch (e) {
                            error_FailedParsingDeviceStates(e);
                            return;
                        }

                        if (callbacks.success) callbacks.success(deviceStates);
                    },
                    error: function (response, status, headers, config) {
                        genericErrorFn('ERROR_FAILEDGETTINGDEVICESTATES', response, status, headers, config, callbacks.error);
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
                                $translate('WARN_NODEVICES').then(function (text) {
                                    Notification.error(text);
                                });
                                return;
                            }
                            console.log("OK converting device list to json!");

                            // adjust device arrays with only one device
                            deviceArray = makeArrayIfOnlyOneObject(deviceArray);
                        }
                        catch (e) {
                            $translate('ERROR_FAILEDPARSINGDEVICES').then(function (text) {
                                Notification.error(text + ' ' + e);
                                console.error(text + ' ' + e);
                            });
                            return;
                        }

                        if (callbacks.success) callbacks.success(deviceArray);
                    },
                    error: function (response, status, headers, config) {
                        genericErrorFn('ERROR_FAILEDGETTINGDEVICES', response, status, headers, config, callbacks.error);
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
                                $translate('WARN_NOSYSVARS').then(function (text) {
                                    Notification.error(text);
                                });
                                return;
                            }
                            console.log("OK converting system variable list to json!");

                            // adjust sysvar list with only one system variable
                            sysVars = makeArrayIfOnlyOneObject(sysVars);
                        }
                        catch (e) {
                            $translate('ERROR_FAILEDPARSINGSYSVARS').then(function (text) {
                                Notification.error(text + ' ' + e);
                                console.error(text + ' ' + e);
                            });
                            return;
                        }

                        if (callbacks.success) callbacks.success(sysVars);
                    },
                    error: function (response, status, headers, config) {
                        genericErrorFn('ERROR_FAILEDGETTINGSYSVARS', response, status, headers, config, callbacks.error);
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
                                $translate('WARN_FAILEDWRITINGDATAPOINT', { value: value, id: id }).then(function (text) {
                                    Notification.error(text);
                                    console.error(text, response, status, headers, config);
                                });
                                return;
                            }
                            console.log("OK converting write result to json!");
                        }
                        catch (e) {
                            $translate('WARN_FAILEDWRITINGDATAPOINT', { value: value, id: id }).then(function (text) {
                                Notification.error(text + ' ' + e);
                                console.error(text + ' ' + e);
                            });
                            return;
                        }

                        if (callbacks.success) callbacks.success(result);
                    },
                    error: function (response, status, headers, config) {
                        genericErrorFn('ERROR_FAILEDWRITINGCHANNEL', response, status, headers, config, callbacks.error);
                    }
                });
            },
            ProgramList: function (callbacks) {
                if (!callbacks) callbacks = {}

                executeHttpGet({
                    uri: URI.ProgramList(),
                    success: function (response, status, headers, config) {
                        console.log("OK getting program list!");

                        try {
                            var programList = x2js.xml_str2json(response).programList.program;
                            if (programList == null) {
                                $translate('WARN_NOPROGRAMS').then(function (text) {
                                    Notification.error(text);
                                });
                                return;
                            }
                            console.log("OK converting program list to json!");

                            // adjust program list with only one program
                            programList = makeArrayIfOnlyOneObject(programList);
                        }
                        catch (e) {
                            $translate('ERROR_FAILEDPARSINGPROGRAMLIST').then(function (text) {
                                Notification.error(text + ' ' + e);
                                console.error(text + ' ' + e);
                            });
                            return;
                        }

                        if (callbacks.success) callbacks.success(programList);
                    },
                    error: function (response, status, headers, config) {
                        genericErrorFn('ERROR_FAILEDGETTINGPROGRAMLIST', response, status, headers, config, callbacks.error);
                    }
                });
            },
            RunProgram: function (id, callbacks) {
                if (!callbacks) callbacks = {}

                executeHttpGet({
                    uri: URI.RunProgram(id),
                    success: function (response, status, headers, config) {
                        console.log("OK running program " + id);

                        try {
                            var result = x2js.xml_str2json(response).result.started;
                            if (result == null) {
                                $translate('WARN_FAILEDRUNNINGPROGRAM', { id: id }).then(function (text) {
                                    Notification.error(text);
                                });
                                return;
                            }
                            console.log("OK converting result of running program to json!");
                        }
                        catch (e) {
                            $translate('WARN_FAILEDRUNNINGPROGRAM', { id: id }).then(function (text) {
                                Notification.error(text + ' ' + e);
                                console.error(text + ' ' + e);
                            });
                            return;
                        }

                        if (callbacks.success) callbacks.success(result);
                    },
                    error: function (response, status, headers, config) {
                        genericErrorFn('ERROR_FAILEDRUNNINGPROGRAM', response, status, headers, config, callbacks.error);
                    }
                });
            },
        };
    }])

    .config(['$routeProvider', '$translateProvider', '$animateProvider', 'toastyConfigProvider', function ($routeProvider, $translateProvider, $animateProvider, toastyConfigProvider) {
        $routeProvider.
            when('/deviceState', {
                templateUrl: 'views/partials/deviceState.html',
                controller: 'deviceStateController',
                reloadOnSearch: false
            }).
            when('/deviceConfig', {
                templateUrl: 'views/partials/deviceConfig.html',
                controller: 'deviceConfigController',
                reloadOnSearch: false
            }).
            when('/batteryCheck', {
                templateUrl: 'views/partials/deviceBatteryCheck.html',
                controller: 'batteryCheckController',
                reloadOnSearch: false
            }).
            when('/sysVars', {
                templateUrl: 'views/partials/systemVariables.html',
                controller: 'sysVarsController',
                reloadOnSearch: false
            }).
            when('/appConfig', {
                templateUrl: 'views/partials/applicationConfig.html',
                controller: 'appConfigController',
                reloadOnSearch: false
            }).
            when('/programs', {
                templateUrl: 'views/partials/programs.html',
                controller: 'programController',
                reloadOnSearch: false
            }).
            otherwise({
                redirectTo: '/deviceState'
            });

        // load defined languages
        if (typeof (lang) !== "undefined") {
            for (var keycode in lang) {
                if (lang.hasOwnProperty(keycode)) {
                    $translateProvider.translations(keycode, lang[keycode]);
                }
            }
        }

        $translateProvider
            .preferredLanguage('en')
            .fallbackLanguage('en');

        // disable animations for ng-show/hide for elements with fa-spinner class
        $animateProvider.classNameFilter(/^((?!(fa-spinner)).)*$/);

        toastyConfigProvider.setConfig({
            limit: 3,
            sound: false,
            shake: false
        });
    }])

    .run(['LocalStorage', '$translate', function (LocalStorage, $translate) {
        var currentLang = LocalStorage.get('lang');
        if (typeof (currentLang) !== "undefined")
            $translate.use(currentLang);
    }])
;


// enable auto-focus attribute
jMaticApp.directive('autoFocus', ['$timeout', function ($timeout) {
    return {
        restrict: 'AC',
        link: function (_scope, _element) {
            $timeout(function () {
                _element[0].focus();
            }, 0);
        }
    };
}]);


jMaticApp.directive('knob', ['$timeout', function ($timeout) {
    'use strict';
    return {
        restrict: 'EA',
        replace: true,
        template: '<input value="{{ knobData }}"/>',
        scope: {
            knobData: '=',
            knobOptions: '&'
        },
        link: function ($scope, $element) {
            var knobInit = $scope.knobOptions() || {};
            knobInit.release = function (newValue) {
                $timeout(function () {
                    $scope.knobData = newValue;
                    $scope.$apply();
                });
            };
            $scope.$watch('knobData', function (newValue, oldValue) {
                if (newValue != oldValue) {
                    $($element).val(newValue).change();
                }
            });
            $($element).val($scope.knobData).knob(knobInit);
        }
    };
}]);

function findDevice(deviceArray, deviceId) {
    for (var i = 0; i < deviceArray.length; ++i) {
        if (deviceArray[i].id == deviceId)
            return i;
    }
    return -1;
}

function removeDevice(deviceArray, deviceId) {
    var index = -1;
    for (var i = 0; i < deviceArray.length; ++i) {
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