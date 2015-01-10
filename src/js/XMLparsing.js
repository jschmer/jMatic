function createDeviceModel(deviceNode) {
    deviceObj = new Device();
    deviceObj.id = parseInt(deviceNode._ise_id);
    deviceObj.name = deviceNode._name;
    deviceObj.type = deviceTypes[deviceNode._device_type];

    return deviceObj;
}


function parseState(device, stateObject) {
    oldState = device.state;
    device.state = {};

    var data = getDeviceDataPointsForType(device.type);

    for (var i = 0; i < data.length; ++i) {
        var dataInstance = data[i];
        var dp = getPropValue(stateObject, dataInstance.channelIndex, dataInstance.datapointName);
        if (dp == null) {
            device.state[dataInstance.datapointName] = {
                propTypeName: dataInstance.datapointName,
                displayName: dataInstance.datapointName,
                hide: false,
                value: "Datapoint '" + dataInstance.datapointName + "' on channel " + dataInstance.channelIndex + " not found!",
                unconvertedValue: "",
                unit: "",
                thresholdExceeded: true,
            }
            console.error(device.state[dataInstance.datapointName]);
            continue;
        }

        var hideChannel = dataInstance.hideIf != null ? dataInstance.hideIf(dp.value) : false;
        var displayValue = dataInstance.valueConversionFn != null ? dataInstance.valueConversionFn(dp.value) : dp.value;
        var threshold = dataInstance.thresholdIf != null ? dataInstance.thresholdIf(dp.value) : false;

        device.state[dp.propName] = {
            propTypeName: dp.propName,
            displayName: translate(dp.propName),
            hide: hideChannel,
            value: displayValue,
            unconvertedValue: dp.value,
            unit: dp.unit,
            thresholdExceeded: threshold,
        }
    }

    // flag changed values
    if (oldState != null) {
        for (var propName in oldState) {
            if (!device.state.hasOwnProperty(propName) || !oldState.hasOwnProperty(propName))
                continue;

            var oldPropObject = oldState[propName];
            var newPropObject = device.state[propName];

            if (oldPropObject.unconvertedValue != newPropObject.unconvertedValue) {
                newPropObject.changed = true;
            }
        }
    }
}

function parseUserdefinedVirtualGroupState(userdefinedGroup, allDeviceStates) {
    oldState = userdefinedGroup.state;
    userdefinedGroup.state = {};

    for (var j = 0; j < userdefinedGroup.config.length; ++j) {
        var cfg = userdefinedGroup.config[j];

        var deviceId = cfg.device_id;
        var datapoints = cfg.datapoints;

        // find device state in allDeviceStates
        var deviceStateData = null;
        for (var k = 0; k < allDeviceStates.length; ++k) {
            if (allDeviceStates[k]._ise_id == deviceId) {
                deviceStateData = allDeviceStates[k];
                break;
            }
        }

        if (!deviceStateData) {
            console.warn("Couldn't find state data for device id " + deviceId + " in XML data!");
            continue;
        }

        // parse datapoints
        for (var i = 0; i < datapoints.length; ++i) {
            var dataInstance = datapoints[i];

            // get datapoint instance with functions
            dataInstance = DeviceDataPoints.getByName(dataInstance.datapointName, dataInstance.channelIndex);

            var dp = getPropValue(deviceStateData, dataInstance.channelIndex, dataInstance.datapointName);
            if (dp == null) {
                userdefinedGroup.state[dataInstance.datapointName + "_" + deviceId] = {
                    propTypeName: dataInstance.datapointName,
                    displayName: dataInstance.datapointName,
                    hide: false,
                    value: "Datapoint '" + dataInstance.datapointName + "' on channel " + dataInstance.channelIndex + " for device (" + deviceId + ") not found!",
                    unconvertedValue: "",
                    unit: "",
                    thresholdExceeded: true,
                }
                console.error(userdefinedGroup.state[dataInstance.datapointName]);
                continue;
            }

            var hideChannel = dataInstance.hideIf != null ? dataInstance.hideIf(dp.value) : false;
            var displayValue = dataInstance.valueConversionFn != null ? dataInstance.valueConversionFn(dp.value) : dp.value;
            var threshold = dataInstance.thresholdIf != null ? dataInstance.thresholdIf(dp.value) : false;

            userdefinedGroup.state[dp.propName + "_" + deviceId] = {
                propTypeName: dp.propName,
                displayName: translate(dp.propName),
                hide: hideChannel,
                value: displayValue,
                unconvertedValue: dp.value,
                unit: dp.unit,
                thresholdExceeded: threshold,
            }
        }
    }

    // flag changed values
    if (oldState != null) {
        for (var propName in oldState) {
            if (!userdefinedGroup.state.hasOwnProperty(propName) || !oldState.hasOwnProperty(propName))
                continue;

            var oldPropObject = oldState[propName];
            var newPropObject = userdefinedGroup.state[propName];

            if (oldPropObject.unconvertedValue != newPropObject.unconvertedValue) {
                newPropObject.changed = true;
            }
        }
    }
}

function parseStates(devices, stateObject) {

    // iterate through device states and parse states for native devices
    for (var i = 0; i < stateObject.length; ++i) {
        var deviceState = stateObject[i];
        var deviceIndex = findDevice(devices, deviceState._ise_id);
        parseState(devices[deviceIndex], deviceState);
    }

    // parse state for userdefined virtual groups
    for (var i = 0; i < devices.length; ++i) {
        var device = devices[i];

        if (device.type === "UserdefinedVirtualGroup") {
            //console.log(device.config);
            parseUserdefinedVirtualGroupState(devices[i], stateObject);
        }

    }
}

function getPropValue(stateObject, channelIndex, datapointName) {
    // adjust channels with a single datapoint
    stateObject.channel[channelIndex].datapoint = makeArrayIfOnlyOneObject(stateObject.channel[channelIndex].datapoint);

    // find datapoint
    var datapoint = null;
    for (var i = 0; i < stateObject.channel[channelIndex].datapoint.length; ++i) {
        var dp = stateObject.channel[channelIndex].datapoint[i];
        if (dp._name.indexOf(datapointName) != -1) {
            datapoint = dp;
            break;
        }
    }

    if (datapoint == null)
        return null;
    else {
        var dataType = HMdataType[parseInt(datapoint._valuetype)];

        return {
            propName: datapoint._type,
            value: TypeValueConversionFn[dataType](datapoint._value),
            unit: datapoint._valueunit
        }
    }
}