"use strict";

var jMaticControllers = angular.module('jMaticControllers', []);

jMaticControllers.run(function ($rootScope) {
    $rootScope.HomematicType = HomematicType;
    $rootScope.knob_options = {
        min: 0,
        max: 1,
        step: 0.5,
        angleOffset: -125,
        angleArc: 250,
        lineCap: "round"
    }

    $rootScope.setKnobMinMax = function(min, max)
    {
        $.extend($rootScope.knob_options, {
            min: min,
            max: max
        });
    }
});

function startLoading(scope) { scope.loading = true; }
function finishLoading(scope) { scope.loading = false; }

jMaticControllers.controller('deviceStateController', ['$scope', '$http', '$location', 'SharedState', 'Notification', 'LocalStorage', 'CCUXMLAPI', '$timeout', '$interval', '$translate', function ($scope, $http, $location, SharedState, Notification, LocalStorage, CCUXMLAPI, $timeout, $interval, $translate) {

    LocalStorage.initSharedState("showChannelNames", $scope);
    LocalStorage.initSharedState("channelsStacked", $scope);

    $scope.toggleAndSaveSharedState = function (propertyName) {
        SharedState.toggle(propertyName);
        LocalStorage.set(propertyName, SharedState.get(propertyName));
    }

    // region: editing channel
    SharedState.initialize($scope, "editMode");
    SharedState.turnOff('editMode');
    SharedState.initialize($scope, "editChannelDialog");
    SharedState.turnOff('editChannelDialog');
    $scope.tryEditChannel = function (channelState) {
        if (SharedState.isActive("editMode") && channelState.writeable) {
            var customTemperatureRange = LocalStorage.get('customTemperatureRange');
            try {
                customTemperatureRange = JSON.parse(customTemperatureRange);
            } catch (e) {
                // use a fallback
                customTemperatureRange = [10, 25];
            }

            $scope.editChannel = copy(channelState);
            // set custom number constraint for knob
            if ($scope.editChannel.name == 'SET_TEMPERATURE') {
                $scope.editChannel.constraints.min = customTemperatureRange[0];
                $scope.editChannel.constraints.max = customTemperatureRange[1];
            }
            $scope.setKnobMinMax($scope.editChannel.constraints.min, $scope.editChannel.constraints.max);
            SharedState.turnOn('editChannelDialog');
        }
    }

    $scope.SaveChanges = function () {
        var valueToSend = $scope.editChannel.displayValue;

        // map from display value to real value
        if ($scope.editChannel.valueMapping != null) {
            for (var key in $scope.editChannel.valueMapping) {
                if ($scope.editChannel.valueMapping.hasOwnProperty(key)) {
                    var mappingValue = $scope.editChannel.valueMapping[key];
                    if (mappingValue == valueToSend) {
                        valueToSend = key;
                        break;
                    }
                }
            }
        }

        $scope.changeChannelValue($scope.editChannel.id, valueToSend);
    }

    $scope.changeChannelValue = function (id, value) {
        startLoading($scope);

        CCUXMLAPI.ChannelEdit(id, value, {
            success: function (result) {
                if (result.changed._id == id && result.changed._new_value == value) {
                    $translate('CHANGESUCCESS').then(function (text) {
                        Notification.success(text, 2000);
                    });

                    // write succeeded, update the state after giving the CCU some time to update its state...
                    $timeout(function () {
                        $scope.loadStates();
                        finishLoading($scope);
                    }, 500);
                }
                else {
                    $translate('WARN_FAILEDWRITINGDATAPOINT', {value: value, id: id}).then(function (text) {
                        Notification.error(text);
                        console.error(text, data, status, headers, config);
                    });
                }
            },
            error: function () {
                finishLoading($scope);
            }
        });
    }

    // region: loading device data
    $scope.loadStates = function () {
        startLoading($scope);

        // gather all device ids we need to query
        var deviceIds = []
        for (var i = 0; i < $scope.devices.length; ++i)
        {
            var device = $scope.devices[i];
            if (device.subscribed) {
                if (device.type === userdefinedGroupType) {
                    // add all devices that are referenced by this group
                    for (var j = 0; j < device.config.length; ++j) {
                        var cfg = device.config[j];
                        if (deviceIds.indexOf(cfg.device_id) == -1)
                            deviceIds.push(cfg.device_id);
                    }
                }
                else {
                    deviceIds.push(device.id);
                }
            }
        }

        // set flag if there aren't any devices to query
        if (deviceIds.length == 0) {
            $scope.noSubscribedDevices = true;
            return;
        }
        else {
            $scope.noSubscribedDevices = false;
        }

        // execute query
        CCUXMLAPI.DeviceState(deviceIds,
            {
                success: function (deviceStates) {
                    // success
                    try {
                        parseStates($scope.devices, deviceStates);

                        var d = new Date();
                        $scope.lastRefreshTime = d.toLocaleDateString() + " " + d.toLocaleTimeString();
                        LocalStorage.set("lastRefreshTime", $scope.lastRefreshTime);

                        LocalStorage.saveDevices($scope.devices);
                        Notification.clear();
                    }
                    catch (e) {
                        $translate('ERROR_FAILEDPARSINGDEVICESTATES').then(function (text) {
                            Notification.error(text + ' ' + e);
                            console.error(text + ' ' + e);
                        });
                    }
                    finally {
                        finishLoading($scope);
                    }
                },
                error: function () {
                    // error
                    finishLoading($scope);
                }
            }
        );
    }

    $scope.devices = LocalStorage.loadDevices();
    $scope.lastRefreshTime = LocalStorage.get("lastRefreshTime");
    $scope.loadStates();

    finishLoading($scope);

    var refreshPromise; 
    $scope.$on("$destroy", function () {
        if (refreshPromise) {
            $interval.cancel(refreshPromise);
        }
    });
    var refreshInterval = parseInt(LocalStorage.get("deviceStateReloadInterval"));
    if (refreshInterval > 0)
        refreshPromise = $interval($scope.loadStates, refreshInterval);
}]);

jMaticControllers.controller('deviceConfigController', ['$scope', '$http', 'Notification', 'LocalStorage', 'CCUXMLAPI', '$translate', function ($scope, $http, Notification, LocalStorage, CCUXMLAPI, $translate) {

    $scope.listOrder = 'name';

    finishLoading($scope);

    $scope.devices = LocalStorage.loadDevices();

    $scope.userdefinedGroupType = userdefinedGroupType;

    // load user defined groups from hardcoded userdefined_groups object
    if (typeof (userdefined_groups) !== "undefined" && typeof (userdefined_groups.length) !== "undefined") {
        var updateCache = false;

        // add virtual groups to config
        for (var i = 0; i < userdefined_groups.length; i += 1) {
            var grp = userdefined_groups[i];

            // insert device names in the group config
            for (var j = 0; j < grp.config.length; j += 1) {
                var groupdevice = grp.config[j];

                var deviceIndex = findDevice($scope.devices, groupdevice.device_id);
                if (deviceIndex != -1) {
                    groupdevice.name = $scope.devices[deviceIndex].name;
                }
                else {
                    groupdevice.name = 'Unknown device';
                }

                // insert display name for datapoints
                for (var k = 0; k < groupdevice.datapoints.length; k += 1) {
                    groupdevice.datapoints[k].displayName = translate(groupdevice.datapoints[k].datapointName);
                }
            }

            var deviceIndex = findDevice($scope.devices, grp.id);
            if (deviceIndex != -1) {
                var existingDevice = $scope.devices[deviceIndex];


                // got an existing device, update it (and keep the state!)
                $scope.devices[deviceIndex] = {
                    id: grp.id,
                    name: grp.name,
                    type: userdefinedGroupType,
                    config: grp.config,
                    subscribed: existingDevice.subscribed,
                    available: true,
                    state: existingDevice.state,
                };

                updateCache = true;
            }
            else {
                // got a new device/virtual group, add with defaults
                $scope.devices.push({
                    id: grp.id,
                    name: grp.name,
                    type: userdefinedGroupType,
                    config: grp.config,
                    subscribed: false,
                    available: true,
                    state: null,
                });
            }
        }

        if (updateCache)
            LocalStorage.saveDevices($scope.devices);
    }

    $scope.showDeviceDetails = function (event) {
        var target = $(event.target);
        var parent = target.parent().parent();
        var details = parent.next();
        details.toggle();

        // switch caret direction
        target.toggleClass("fa-caret-right fa-caret-down");
    }

    $scope.isUserdefinedConfig = function (type) {
        return type === userdefinedGroupType;
    }

    $scope.loadDevices = function () {
        startLoading($scope);

        // invalidate the availability of all devices before loading from the CCU to flag redundant/missing device configurations,
        // excluding user defined groups (these aren't on the CCU anyway!)
        for (var i = 0; i < $scope.devices.length; ++i)
            if ($scope.devices[i].type !== userdefinedGroupType)
                $scope.devices[i].available = false;

        CCUXMLAPI.DeviceList({
            success: function (deviceArray) {
                console.log(deviceArray.length + " devices loaded!");

                try {
                    for (var i = 0; i < deviceArray.length; i += 1) {
                        var device = deviceArray[i];
                        device = createDeviceModel(device);
                        device.available = true;

                        var deviceIndex = findDevice($scope.devices, device.id);
                        if (deviceIndex != -1) {
                            // got a registered device, update it (and keep the state!)
                            device.state = $scope.devices[deviceIndex].state;
                            device.subscribed = $scope.devices[deviceIndex].subscribed;
                            $scope.devices[deviceIndex] = device;
                        }
                        else {
                            // got a new device
                            $scope.devices.push(device);
                        }
                    }

                    $scope.persistDeviceConfig($scope.devices);
                    Notification.clear();
                } catch (e) {
                    $translate('ERROR_FAILEDPARSINGDEVICES').then(function (text) {
                        Notification.error(text + ' ' + e);
                        console.error(text + ' ' + e);
                    });
                }
                finally {
                    finishLoading($scope);
                }
            },
            error: function () {
                finishLoading($scope);
            }
        });
    }

    $scope.persistDeviceConfig = function (devices) {
        LocalStorage.saveDevices(typeof(devices) === 'undefined' ? $scope.devices : devices);
    }

    $scope.toggleSubscription = function (deviceId) {
        var deviceIndex = findDevice($scope.devices, deviceId);
        if (deviceIndex != -1) {
            var device = $scope.devices[deviceIndex];
            device.subscribed = !device.subscribed;

            // clear device channel data if unsubscribed
            if (device.subscribed == false)
                device.state = null;

            $scope.persistDeviceConfig();
        }
    }

    $scope.setListOrder = function (orderBy) {
        $scope.listOrder = orderBy;
    }

    $scope.deleteDevice = function (deviceId) {
        var deviceIndex = findDevice($scope.devices, deviceId);
        if (deviceIndex != -1) {
            var device = $scope.devices[deviceIndex];
            $scope.devices.splice(deviceIndex, 1);

            $translate('DEVICEDELETEDSUCCESS', { deviceName: device.name }).then(function (text) {
                Notification.success(text, 2000);
            });
            $scope.persistDeviceConfig($scope.devices);
        }
        else {
            $translate('ERROR_DEVICENOTFOUND', {deviceId: deviceId}).then(function (text) {
                Notification.error(text);
            });
        }
    }
}]);

jMaticControllers.controller('batteryCheckController', ['$scope', '$http', 'Notification', 'CCUXMLAPI', '$translate', function ($scope, $http, Notification, CCUXMLAPI, $translate) {

    finishLoading($scope);

    $scope.deviceStates = []
    /*
     state {
        name: "",
        lowBat: true/false,
        channels: [{
            name: "",
            value: ""
        }];
     }
     */
    $scope.loadStates = function () {

        startLoading($scope);

        CCUXMLAPI.AllDeviceStates({
            success: function (deviceStates) {
                // success
                try {
                    var batteryDataPoints = ["LOWBAT", "BATTERY_STATE"];

                    // iterate through device states and its channels
                    for (var i = 0; i < deviceStates.length; ++i) {
                        var deviceState = deviceStates[i];

                        var deviceData = {
                            name: deviceState._name,
                            channels: []
                        };

                        for (var j = 0; j < batteryDataPoints.length; ++j) {
                            var datapointName = batteryDataPoints[j];

                            for (var k = 0; k < deviceState.channel.length; ++k) {
                                if (deviceState.channel[k].datapoint == null)
                                    continue;
                                // adjust channels with a single datapoint
                                if (deviceState.channel[k].datapoint.constructor != Array) {
                                    deviceState.channel[k].datapoint = [deviceState.channel[k].datapoint];
                                }

                                var dp = getPropValue(deviceState, k, datapointName);
                                if (dp != null) {
                                    if (datapointName == "LOWBAT") {
                                        deviceData.lowBat = dp.value;
                                    }
                                    else {
                                        deviceData.channels.push({
                                            propname: dp.propName,
                                            displayName: translate(dp.propName),
                                            value: dp.value,
                                            unit: dp.unit
                                        });
                                    }
                                    break;
                                }
                            }
                        }

                        $scope.deviceStates.push(deviceData);
                    }
                    Notification.clear();
                }
                catch (e) {

                }
                finally {
                    finishLoading($scope);
                }
            },
            error: function () {
                // error
                finishLoading($scope);
            }
        });
    }

    $scope.loadStates();
}]);

jMaticControllers.controller('sysVarsController', ['$scope', '$http', 'Notification', 'SharedState', 'CCUXMLAPI', '$timeout', '$translate', function ($scope, $http, Notification, SharedState, CCUXMLAPI, $timeout, $translate) {

    finishLoading($scope);

    $scope.systemVars = []

    $scope.loadSysVars = function () {

        startLoading($scope);

        CCUXMLAPI.SysVarList({
            success: function (sysVarList) {
                console.log("Got " + sysVarList.length + " system variables");

                try {
                    $scope.systemVars = []
                    for (var i = 0; i < sysVarList.length; ++i) {
                        var sysVar = sysVarList[i];

                        var parsedSysVar = parseSystemVariable(sysVar);
                        $scope.systemVars.push(parsedSysVar);
                    }
                    Notification.clear();
                } catch (e) {
                    $translate('ERROR_FAILEDPARSINGSYSVARS').then(function (text) {
                        Notification.error(text + ' ' + e);
                        console.error(text + ' ' + e);
                    });
                } finally {
                    finishLoading($scope);
                }
            },
            error: function () {
                finishLoading($scope);
            }
        });
    }

    $scope.TypeToString = function (type) {
        switch (type) {
            case 0: return "Bool";
            case 1: return "Int";
            case 2: return "Float";
            case 3: return "String";
            default: return "Unknown";
        }
    }

    SharedState.initialize($scope, 'editChannelDialog');
    SharedState.turnOff('editChannelDialog');
    $scope.ShowInputDialog = function (systemVariableData) {
        var dialogSysVarData = {};
        jQuery.extend(dialogSysVarData, systemVariableData);

        $scope.editChannel = dialogSysVarData;
        $scope.setKnobMinMax($scope.editChannel.constraints.min, $scope.editChannel.constraints.max);
    };

    $scope.SaveChanges = function () {
        var valueToSend = $scope.editChannel.displayValue;

        // map from display value to real value
        if ($scope.editChannel.valueMapping != null) {
            for (var key in $scope.editChannel.valueMapping) {
                if ($scope.editChannel.valueMapping.hasOwnProperty(key)) {
                    var mappingValue = $scope.editChannel.valueMapping[key];
                    if (mappingValue == valueToSend) {
                        valueToSend = key;
                        break;
                    }
                }
            }
        }

        $scope.changeSysVar($scope.editChannel.id, valueToSend);
    }

    $scope.changeSysVar = function (id, value) {
        startLoading($scope);

        CCUXMLAPI.ChannelEdit(id, value, {
            success: function (result) {
                if (result.changed._id == id && result.changed._new_value == value) {
                    $translate('CHANGESUCCESS').then(function (text) {
                        Notification.success(text, 2000);
                    });

                    // write succeeded, update the state after giving the CCU some time to update its state...
                    $timeout(function () {
                        $scope.loadSysVars();
                        finishLoading($scope);
                    }, 500);
                }
                else {
                    $translate('WARN_FAILEDWRITINGSYSVAR', { value: value, id: id }).then(function (text) {
                        Notification.error(text);
                        console.error(message);
                    });
                }
            },
            error: function () {
                finishLoading($scope);
            }
        });
    }

    $scope.loadSysVars();
}]);

jMaticControllers.controller('appConfigController', ['$scope', '$http', 'Notification', 'LocalStorage', '$translate', function ($scope, $http, Notification, LocalStorage, $translate) {

    $scope.ccuIP = LocalStorage.get('CCU-IP');
    $scope.deviceStateReloadInterval = LocalStorage.get('deviceStateReloadInterval');
    if (!$scope.deviceStateReloadInterval)
        $scope.deviceStateReloadInterval = 0;
    else
        $scope.deviceStateReloadInterval = parseInt($scope.deviceStateReloadInterval) / 1000;

    $scope.currentLang = LocalStorage.get('lang');
    if (typeof ($scope.currentLang) === "undefined")
        $scope.currentLang = $translate.use();

    var customTemperatureRange = LocalStorage.get('customTemperatureRange');
    try {
        customTemperatureRange = JSON.parse(customTemperatureRange);
    } catch (e) {
        // use a fallback
        customTemperatureRange = [10, 25];
    }

    $scope.customTemperatureRangeMin = customTemperatureRange[0];
    $scope.customTemperatureRangeMax = customTemperatureRange[1];

    $scope.$watch("ccuIP", function (newValue, oldValue) {
        if ($scope.ccuIP.length > 0) {
            LocalStorage.set('CCU-IP', $scope.ccuIP);
        }
    });

    $scope.$watch("deviceStateReloadInterval", function (newValue, oldValue) {
        if (parseInt($scope.deviceStateReloadInterval) >= 0) {
            LocalStorage.set('deviceStateReloadInterval', parseInt($scope.deviceStateReloadInterval)*1000);
        }
    });

    $scope.$watch("customTemperatureRangeMin", function (newValue, oldValue) {
        if (parseInt($scope.customTemperatureRangeMin) >= 0) {
            LocalStorage.set('customTemperatureRange', JSON.stringify([$scope.customTemperatureRangeMin, $scope.customTemperatureRangeMax]));
        }
    });

    $scope.$watch("customTemperatureRangeMax", function (newValue, oldValue) {
        if (parseInt($scope.customTemperatureRangeMax) >= 0) {
            LocalStorage.set('customTemperatureRange', JSON.stringify([$scope.customTemperatureRangeMin, $scope.customTemperatureRangeMax]));
        }
    });

    $scope.changeLanguage = function (langKey) {
        $translate.use(langKey);
        $scope.currentLang = langKey;
        LocalStorage.set("lang", langKey);
    };

    finishLoading($scope);
}]);

jMaticControllers.controller('programController', ['$scope', '$http', 'Notification', 'SharedState', 'CCUXMLAPI', '$timeout', '$translate', function ($scope, $http, Notification, SharedState, CCUXMLAPI, $timeout, $translate) {

    finishLoading($scope);

    $scope.programs = []

    $scope.runProgram = function (prog, element) {
        prog.running = true;

        // delay stopping the program run by half a second
        // to be able to notice totally fast programs in the ui
        function programRunFinished(prog) {
            $timeout(function () {
                prog.running = false;
            }, 500);
        }

        CCUXMLAPI.RunProgram(prog.id, {
            success: function (result) {
                try {
                    if (result._program_id != prog.id) {
                        $translate('WARN_FAILEDRUNNINGPROGRAM', {id: prog.id}).then(function (text) {
                            Notification.error(text);
                            console.error(text);
                        });
                    }
                    else {
                        $translate('RUNNINGPROGRAMSUCCESS', {programName: prog.name}).then(function (text) {
                            Notification.success(text, 2000);
                        });
                    }
                }
                finally {
                    programRunFinished(prog);
                }
            },
            error: function () {
                programRunFinished(prog);
            }
        });
    }

    $scope.loadPrograms = function () {

        startLoading($scope);

        CCUXMLAPI.ProgramList({
            success: function (progList) {
                console.log("Got " + progList.length + " programs");

                try {
                    $scope.programs = []
                    for (var i = 0; i < progList.length; ++i) {
                        var prog = progList[i];

                        $scope.programs.push({
                            id: prog._id,
                            name: prog._name,
                            desc: prog._description,
                            active: prog._active
                        });
                    }
                    Notification.clear();
                } catch (e) {
                    $translate('ERROR_FAILEDPARSINGPROGRAMLIST').then(function (text) {
                        Notification.error(text + ' ' + e);
                        console.error(text + ' ' + e);
                    });
                } finally {
                    finishLoading($scope);
                }
            },
            error: function () {
                finishLoading($scope);
            }
        });
    }
    
    $scope.loadPrograms();
}]);

// Startup controller
jMaticControllers.controller('MainController', ['$rootScope', '$scope', function ($rootScope, $scope) {

    // User agent displayed in home page
    $scope.userAgent = navigator.userAgent;

    // Needed for the loading screen
    $rootScope.$on('$routeChangeStart', function () {
        $rootScope.loading = true;
    });

    $rootScope.$on('$routeChangeSuccess', function () {
        $rootScope.loading = false;
    });
}]);