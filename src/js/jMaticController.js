var ccuIP = '192.168.178.10';

var XMLAPIUri = {
    AllDeviceStates: 'http://' + ccuIP + '/addons/xmlapi/statelist.cgi',
    DeviceState: 'http://' + ccuIP + '/addons/xmlapi/state.cgi?device_id=',
    DeviceList: 'http://' + ccuIP + '/addons/xmlapi/devicelist.cgi',
    SysVarList: 'http://' + ccuIP + '/addons/xmlapi/sysvarlist.cgi',
    GetSysVarChange: function (id, value) {
        return 'http://' + ccuIP + '/addons/xmlapi/statechange.cgi?ise_id=' + id + '&new_value=' + value;
    }
}

var jMaticControllers = angular.module('jMaticControllers', []);

function startLoading(scope) { scope.loading = true; }
function finishLoading(scope) { scope.loading = false; }

jMaticControllers.controller('deviceStateController', function ($scope, $http) {

    finishLoading($scope);

    var hideChannelNames = localStorage.hideChannelNames;
    if (hideChannelNames == null)
        hideChannelNames = false;
    else
        hideChannelNames = hideChannelNames == "true";
    $scope.hideChannelName = hideChannelNames;
    $scope.toggleChannelNames = function () {
        $scope.hideChannelName = !$scope.hideChannelName;
        localStorage.hideChannelNames = $scope.hideChannelName;
    };

    $scope.registeredDevices = loadDeviceDataFromLocalStorage();
    $scope.lastRefreshTime = localStorage.lastRefreshTime;

    $scope.loadStates = function () {

        var deviceIds = []
        for (i = 0; i < $scope.registeredDevices.length; ++i)
        {
            deviceIds.push($scope.registeredDevices[i].id);
        }

        startLoading($scope);

        delete $http.defaults.headers.common['X-Requested-With'];
        $http.get(XMLAPIUri.DeviceState + deviceIds.join())
             .success(function (response) {
                 try {
                     console.log("OK getting deviceStates for IDs " + deviceIds.join());
                     var xmlResponse = x2js.xml_str2json(response);

                     var deviceStates = xmlResponse.state.device;
                     if (deviceStates == null) {
                         setErrorMessage("ERROR no device states received!", 5000);
                         return;
                     }

                     // adjust statelists with only one device
                     deviceStates = makeArrayIfOnlyOneObject(deviceStates);

                     parseStates($scope.registeredDevices, deviceStates);

                     var d = new Date();
                     $scope.lastRefreshTime = d.toLocaleDateString() + " " + d.toLocaleTimeString();
                     localStorage.lastRefreshTime = $scope.lastRefreshTime;

                     saveDeviceDataToLocalStorage($scope.registeredDevices);
                 }
                 catch (e) {
                     setErrorMessage("ERROR parsing device states! " + e, 5000);
                     console.error(e);
                 }
                 finally {
                     finishLoading($scope);
                 }
             })
             .error(function (data, status, headers, config) {
                 try {
                     setErrorMessage("ERROR getting deviceStates for IDs " + deviceIds.join(), 5000);
                     console.log("ERROR getting deviceStates for IDs " + deviceIds.join(), data, status, headers, config);
                 }
                 catch (e) {
                     console.error(e);
                 }
                 finally {
                     finishLoading($scope);
                 }
             });
    }

    $scope.loadStates();
});

jMaticControllers.controller('deviceConfigController', function ($scope, $http) {

    finishLoading($scope);

    $scope.registeredDevices = loadDeviceDataFromLocalStorage();

    $scope.loadDevices = function () {
        startLoading($scope);

        delete $http.defaults.headers.common['X-Requested-With'];
        $http.get(XMLAPIUri.DeviceList)
             .success(function (response) {
                 try {
                     console.log("OK getting devicelist!");
                     var deviceArray = x2js.xml_str2json(response).deviceList.device;
                     console.log("OK converting to json!");

                     $scope.availableDevices = [];

                     console.log(deviceArray.length + " devices loaded!");
                     for (var i = 0; i < deviceArray.length; i += 1) {
                         device = deviceArray[i];
                         device = createDeviceModel(device);

                         var registeredDeviceIndex = findDevice($scope.registeredDevices, device.id);
                         if (registeredDeviceIndex != -1) {
                             // got a registered device, update it (and keep the state!)
                             device.state = $scope.registeredDevices[registeredDeviceIndex].state;
                             $scope.registeredDevices[registeredDeviceIndex] = device;
                         }
                         else {
                             $scope.availableDevices.push(device);
                         }
                     }
                 }
                 finally {
                     finishLoading($scope);
                 }
             })
             .error(function (data, status, headers, config) {
                 try {
                     setErrorMessage("ERROR getting devicelist!", 5000);
                     console.log("ERROR getting devicelist:", data, status, headers, config);
                 }
                 finally {
                     finishLoading($scope);
                 }
             });
    }

    $scope.registerDevice = function (deviceId) {
        var deviceIndex = findDevice($scope.availableDevices, deviceId);
        if (deviceIndex != -1) {
            var device = $scope.availableDevices[deviceIndex];
            $scope.registeredDevices.push(device);
            removeDevice($scope.availableDevices, deviceId);

            saveDeviceDataToLocalStorage($scope.registeredDevices);
        }
    }

    $scope.unregisterDevice = function (deviceId) {
        var deviceIndex = findDevice($scope.registeredDevices, deviceId);
        if (deviceIndex != -1) {
            $scope.availableDevices.push($scope.registeredDevices[deviceIndex]);
            removeDevice($scope.registeredDevices, deviceId);

            saveDeviceDataToLocalStorage($scope.registeredDevices);
        }
    }

    $scope.loadDevices();
});

jMaticControllers.controller('batteryCheckController', function ($scope, $http) {

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
        $http.get(XMLAPIUri.AllDeviceStates)
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
                     setErrorMessage("ERROR getting deviceStates", 5000);
                     console.log("ERROR getting deviceStates", data, status, headers, config);
                 } finally {
                     finishLoading($scope);
                 }
             });
    }

    $scope.loadStates();
});

jMaticControllers.controller('sysVarsController', function ($scope, ngDialog, $http) {

    finishLoading($scope);

    $scope.SysVarDataType = SysVarDataType;

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
        $http.get(XMLAPIUri.SysVarList)
             .success(function (response) {
                 try {
                     console.log("OK getting all systemVariables");
                     var sysVars = x2js.xml_str2json(response).systemVariables.systemVariable;

                     // iterate through sysvars
                     $scope.systemVars = []
                     for (var i = 0; i < sysVars.length; ++i) {
                         var sysVar = sysVars[i];

                         var parsedSysVar = parseSystemVariable(sysVar);
                         console.log(parsedSysVar);
                         $scope.systemVars.push(parsedSysVar);
                     }
                 } finally {
                     finishLoading($scope);
                 }
             })
             .error(function (data, status, headers, config) {
                 try {
                     setErrorMessage("ERROR getting systemVariables", 5000);
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

    $scope.ShowInputDialog = function (systemVariableData) {
        var dialogSysVarData = {};
        jQuery.extend(dialogSysVarData, systemVariableData);

        var dlg = ngDialog.open({
            template: 'c_systemVariables_input_template',
            scope: $scope,
            className: 'ngdialog-theme-plain',
            data: dialogSysVarData
        });

        dlg.closePromise.then(function (data) {
            console.log(data.id + ' has been dismissed with ' + data.value);

            if (data.value === 'OK') {
                var valueToSend = dialogSysVarData.displayValue;

                // map from display value to real value
                if (dialogSysVarData.valueMapping != null) {
                    for (var key in dialogSysVarData.valueMapping) {
                        if (dialogSysVarData.valueMapping.hasOwnProperty(key)) {
                            var mappingValue = dialogSysVarData.valueMapping[key];
                            if (mappingValue == valueToSend) {
                                valueToSend = key;
                                break;
                            }
                        }
                    }
                }

                $scope.changeSysVar(dialogSysVarData.id, valueToSend);
            }
        });
    };

    $scope.changeSysVar = function (id, value) {
        delete $http.defaults.headers.common['X-Requested-With'];
        $http.get(XMLAPIUri.GetSysVarChange(id, value))
             .success(function (response) {
                 console.log("OK changing systemVariable " + id);
                 var result = x2js.xml_str2json(response).result;
                 if (typeof (result.changed) !== "undefined") {
                     // change succeeded
                     $scope.loadSysVars();
                 }
                 else {
                     // change failed
                     setErrorMessage("ERROR changing systemVariable " + id, 5000);
                     console.log("ERROR changing systemVariable " + id, data, status, headers, config);
                 }
             })
             .error(function (data, status, headers, config) {
                 setErrorMessage("ERROR changing systemVariable " + id, 5000);
                 console.log("ERROR changing systemVariable " + id, data, status, headers, config);
             });
    }

    $scope.loadSysVars();
});

//
// For this trivial demo we have just a unique MainController 
// for everything
//
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