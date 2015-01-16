

var jMaticControllers = angular.module('jMaticControllers', []);

function startLoading(scope) { scope.loading = true; }
function finishLoading(scope) { scope.loading = false; }

jMaticControllers.controller('deviceStateController', function ($scope, $http, $location, SharedState, Notification, LocalStorage, CCUXMLAPI) {

    LocalStorage.initSharedState("showChannelNames", SharedState, $scope);
    LocalStorage.initSharedState("channelsStacked", SharedState, $scope);

    $scope.toggleAndSaveSharedState = function (propertyName) {
        SharedState.toggle(propertyName);
        LocalStorage.set(propertyName, SharedState.get(propertyName));
    }

    $scope.editDevice = function (deviceId) {
        $location.path('/editDeviceState/' + deviceId);
    }

    $scope.loadStates = function () {

        var deviceIds = []
        for (i = 0; i < $scope.devices.length; ++i)
        {
            var device = $scope.devices[i];
            if (device.subscribed) {
                if (device.type === "UserdefinedVirtualGroup") {
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

        if (deviceIds.length == 0) {
            $scope.noSubscribedDevices = true;
            return;
        }
        else {
            $scope.noSubscribedDevices = false;
        }

        startLoading($scope);

        delete $http.defaults.headers.common['X-Requested-With'];
        $http.get(CCUXMLAPI.DeviceState() + deviceIds.join())
             .success(function (response) {
                 try {
                     console.log("OK getting deviceStates for IDs " + deviceIds.join());
                     var xmlResponse = x2js.xml_str2json(response);

                     var deviceStates = xmlResponse.state.device;
                     if (deviceStates == null) {
                         Notification.error("ERROR no device states received!", 5000);
                         return;
                     }

                     // adjust statelists with only one device
                     deviceStates = makeArrayIfOnlyOneObject(deviceStates);

                     parseStates($scope.devices, deviceStates);

                     var d = new Date();
                     $scope.lastRefreshTime = d.toLocaleDateString() + " " + d.toLocaleTimeString();
                     LocalStorage.set("lastRefreshTime", $scope.lastRefreshTime);

                     LocalStorage.saveDevices($scope.devices);
                 }
                 catch (e) {
                     Notification.error("ERROR parsing device states! " + e, 5000);
                     console.error(e);
                 }
                 finally {
                     finishLoading($scope);
                 }
             })
             .error(function (data, status, headers, config) {
                 try {
                     Notification.error("ERROR getting deviceStates! Is your CCU reachable?", 5000);
                     console.log("ERROR getting deviceStates! Is your CCU reachable?", data, status, headers, config);
                 }
                 catch (e) {
                     console.error(e);
                 }
                 finally {
                     finishLoading($scope);
                 }
             });
    }

    $scope.devices = LocalStorage.loadDevices();
    $scope.lastRefreshTime = LocalStorage.get("lastRefreshTime");
    $scope.loadStates();

    finishLoading($scope);
});

jMaticControllers.controller('editDeviceStateController', function ($scope, $http, SharedState, Notification, LocalStorage, CCUXMLAPI, $routeParams) {

    LocalStorage.initSharedState("showChannelNames", SharedState, $scope);
    $scope.toggleAndSaveSharedState = function (propertyName) {
        SharedState.toggle(propertyName);
        LocalStorage.set(propertyName, SharedState.get(propertyName));
    }

    SharedState.turnOff('editChannelDialog');
    $scope.HomematicType = HomematicType;
    $scope.tryEditChannel = function (channelState) {
        if (channelState.writeable) {
            $scope.editChannel = copy(channelState);
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

        delete $http.defaults.headers.common['X-Requested-With'];
        $http.get(CCUXMLAPI.ChannelEdit(id, value))
             .success(function (response) {
                 try {
                     console.log("OK changing systemVariable " + id);
                     var result = x2js.xml_str2json(response).result;
                     if (typeof (result.changed) !== "undefined") {
                         // change succeeded
                         $scope.loadStates();
                     }
                     else {
                         // change failed
                         Notification.error("ERROR changing systemVariable " + id, 5000);
                         console.log("ERROR changing systemVariable " + id, data, status, headers, config);
                     }
                 } finally {
                     finishLoading($scope);
                 }
             })
             .error(function (data, status, headers, config) {
                 finishLoading($scope);
                 Notification.error("ERROR changing systemVariable " + id, 5000);
                 console.log("ERROR changing systemVariable " + id, data, status, headers, config);
             });
    }

    $scope.loadStates = function () {

        var deviceIds = []
        for (i = 0; i < $scope.devices.length; ++i) {
            var device = $scope.devices[i];
            if (device.subscribed) {
                if (device.type === "UserdefinedVirtualGroup") {
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

        if (deviceIds.length == 0) {
            $scope.noSubscribedDevices = true;
            return;
        }
        else {
            $scope.noSubscribedDevices = false;
        }

        startLoading($scope);

        delete $http.defaults.headers.common['X-Requested-With'];
        $http.get(CCUXMLAPI.DeviceState() + deviceIds.join())
             .success(function (response) {
                 try {
                     console.log("OK getting deviceStates for IDs " + deviceIds.join());
                     var xmlResponse = x2js.xml_str2json(response);

                     var deviceStates = xmlResponse.state.device;
                     if (deviceStates == null) {
                         Notification.error("ERROR no device states received!", 5000);
                         return;
                     }

                     // adjust statelists with only one device
                     deviceStates = makeArrayIfOnlyOneObject(deviceStates);

                     parseStates($scope.devices, deviceStates);

                     var d = new Date();
                     $scope.lastRefreshTime = d.toLocaleDateString() + " " + d.toLocaleTimeString();
                     LocalStorage.set("lastRefreshTime", $scope.lastRefreshTime);

                     LocalStorage.saveDevices($scope.devices);
                 }
                 catch (e) {
                     Notification.error("ERROR parsing device states! " + e, 5000);
                     console.error(e);
                 }
                 finally {
                     finishLoading($scope);
                 }
             })
             .error(function (data, status, headers, config) {
                 try {
                     Notification.error("ERROR getting deviceStates! Is your CCU reachable?", 5000);
                     console.log("ERROR getting deviceStates! Is your CCU reachable?", data, status, headers, config);
                 }
                 catch (e) {
                     console.error(e);
                 }
                 finally {
                     finishLoading($scope);
                 }
             });
    }

    $scope.devices = LocalStorage.loadDevices();
    $scope.lastRefreshTime = LocalStorage.get("lastRefreshTime");

    var editedDeviceId = $routeParams.deviceId;
    $scope.editedDevice = null;
    for (var i = 0; i < $scope.devices.length; ++i) {
        if ($scope.devices[i].id == editedDeviceId) {
            $scope.editedDevice = $scope.devices[i];
            break;
        }
    }

    if ($scope.editedDevice == null) {
        Notification.error("Device with id '" + editedDeviceId + "' not found!");
    }

    finishLoading($scope);
});

jMaticControllers.controller('deviceConfigController', function ($scope, $http, Notification, LocalStorage, CCUXMLAPI) {

    $scope.listOrder = 'name';

    finishLoading($scope);

    $scope.devices = LocalStorage.loadDevices();

    // load user defined groups
    if (typeof (userdefined_groups) !== "undefined" && typeof (userdefined_groups.length) !== "undefined") {
        var updateCache = false;

        // add virtual groups to config
        for (var i = 0; i < userdefined_groups.length; i += 1) {
            var grp = userdefined_groups[i];

            var deviceIndex = findDevice($scope.devices, grp.id);
            if (deviceIndex != -1) {
                var existingDevice = $scope.devices[deviceIndex];

                // got an existing device, update it (and keep the state!)
                $scope.devices[deviceIndex] = {
                    id: grp.id,
                    name: grp.name,
                    type: 'UserdefinedVirtualGroup',
                    config: grp.config,
                    subscribed: existingDevice.subscribed,
                    state: existingDevice.state,
                };

                updateCache = true;
            }
            else {
                // got a new device/virtual group, add with defaults
                $scope.devices.push({
                    id: grp.id,
                    name: grp.name,
                    type: 'UserdefinedVirtualGroup',
                    config: grp.config,
                    subscribed: false,
                    state: null,
                });
            }
        }

        if (updateCache)
            LocalStorage.saveDevices($scope.devices);
    }

    $scope.loadDevices = function () {
        startLoading($scope);

        delete $http.defaults.headers.common['X-Requested-With'];
        $http.get(CCUXMLAPI.DeviceList())
             .success(function (response) {
                 try {
                     console.log("OK getting devicelist!");
                     var deviceArray = x2js.xml_str2json(response).deviceList.device;
                     console.log("OK converting to json!");

                     console.log(deviceArray.length + " devices loaded!");
                     for (var i = 0; i < deviceArray.length; i += 1) {
                         device = deviceArray[i];
                         device = createDeviceModel(device);

                         var deviceIndex = findDevice($scope.devices, device.id);
                         if (deviceIndex != -1) {
                             // got a registered device, update it (and keep the state!)
                             device.state = $scope.devices[deviceIndex].state;
                             device.subscribed = $scope.devices[deviceIndex].subscribed;
                             $scope.devices[deviceIndex] = device;
                         }
                         else {
                             $scope.devices.push(device);
                         }
                     }
                 }
                 finally {
                     finishLoading($scope);
                 }
             })
             .error(function (data, status, headers, config) {
                 try {
                     Notification.error("ERROR getting devicelist!", 5000);
                     console.log("ERROR getting devicelist:", data, status, headers, config);
                 }
                 finally {
                     finishLoading($scope);
                 }
             });
    }

    $scope.persistDeviceConfig = function () {
        LocalStorage.saveDevices($scope.devices);
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

    $scope.loadDevices();
});

jMaticControllers.controller('batteryCheckController', function ($scope, $http, Notification, CCUXMLAPI) {

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

        delete $http.defaults.headers.common['X-Requested-With'];
        $http.get(CCUXMLAPI.AllDeviceStates())
             .success(function (response) {
                 try {
                     console.log("OK getting all deviceStates");
                     var deviceStates = x2js.xml_str2json(response).stateList.device;

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
                 } finally {
                     finishLoading($scope);
                 }
             })
             .error(function (data, status, headers, config) {
                 try {
                     Notification.error("ERROR getting deviceStates!", 5000);
                     console.log("ERROR getting deviceStates", data, status, headers, config);
                 } finally {
                     finishLoading($scope);
                 }
             });
    }

    $scope.loadStates();
});

jMaticControllers.controller('sysVarsController', function ($scope, $http, Notification, SharedState, CCUXMLAPI) {

    finishLoading($scope);

    $scope.HomematicType = HomematicType;

    $scope.systemVars = []
    /*
     [
        {
           id: zahl,
           name: "",
           type: "",
           displayValue: "", // already mapped
           value: "",
           min: zahl | null,
           max: zahl | null,
           valueMapping: // for displaying a dropdown box of valid values for input? (enum, bool, alarm)
           {
               mapping: value,
               mapping: value,
               ...
           } | null,
        },
        ...
     ]
     */
    $scope.loadSysVars = function () {

        startLoading($scope);

        delete $http.defaults.headers.common['X-Requested-With'];
        $http.get(CCUXMLAPI.SysVarList())
             .success(function (response) {
                 try {
                     console.log("OK getting all systemVariables");
                     var sysVars = x2js.xml_str2json(response).systemVariables.systemVariable;

                     // iterate through sysvars
                     $scope.systemVars = []
                     for (var i = 0; i < sysVars.length; ++i) {
                         var sysVar = sysVars[i];

                         var parsedSysVar = parseSystemVariable(sysVar);
                         //console.log(parsedSysVar);
                         $scope.systemVars.push(parsedSysVar);
                     }
                 } finally {
                     finishLoading($scope);
                 }
             })
             .error(function (data, status, headers, config) {
                 try {
                     Notification.error("ERROR getting systemVariables!", 5000);
                     console.log("ERROR getting systemVariables", data, status, headers, config);
                 } finally {
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

    SharedState.turnOff('editChannelDialog');
    $scope.ShowInputDialog = function (systemVariableData) {
        var dialogSysVarData = {};
        jQuery.extend(dialogSysVarData, systemVariableData);

        $scope.editChannel = dialogSysVarData;
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

        delete $http.defaults.headers.common['X-Requested-With'];
        $http.get(CCUXMLAPI.ChannelEdit(id, value))
             .success(function (response) {
                 try {
                     console.log("OK changing systemVariable " + id);
                     var result = x2js.xml_str2json(response).result;
                     if (typeof (result.changed) !== "undefined") {
                         // change succeeded
                         $scope.loadSysVars();
                     }
                     else {
                         // change failed
                         Notification.error("ERROR changing systemVariable " + id, 5000);
                         console.log("ERROR changing systemVariable " + id, data, status, headers, config);
                     }
                 } finally{
                     finishLoading($scope);
                 }
             })
             .error(function (data, status, headers, config) {
                 finishLoading($scope);
                 Notification.error("ERROR changing systemVariable " + id, 5000);
                 console.log("ERROR changing systemVariable " + id, data, status, headers, config);
             });
    }

    $scope.loadSysVars();
});

jMaticControllers.controller('appConfigController', function ($scope, $http, Notification, LocalStorage, $translate) {

    $scope.ccuIP = LocalStorage.get('CCU-IP');
    $scope.currentLang = LocalStorage.get('lang');
    if (typeof ($scope.currentLang) === "undefined")
        $scope.currentLang = $translate.use();

    $scope.$watch("ccuIP", function (newValue, oldValue) {
        if ($scope.ccuIP.length > 0) {
            LocalStorage.set('CCU-IP', $scope.ccuIP);
        }
    });

    $scope.changeLanguage = function (langKey) {
        $translate.use(langKey);
        $scope.currentLang = langKey;
        LocalStorage.set("lang", langKey);
    };

    finishLoading($scope);
});

// Startup controller
jMaticControllers.controller('MainController', function ($rootScope, $scope) {

    // User agent displayed in home page
    $scope.userAgent = navigator.userAgent;

    // Needed for the loading screen
    $rootScope.$on('$routeChangeStart', function () {
        $rootScope.loading = true;
    });

    $rootScope.$on('$routeChangeSuccess', function () {
        $rootScope.loading = false;
    });
});