function createDeviceModel(deviceNode) {
    deviceObj = new Device();
    deviceObj.id = parseInt(deviceNode._ise_id);
    deviceObj.name = deviceNode._name;
    deviceObj.type = deviceTypes[deviceNode._device_type];

    if (typeof (deviceObj.type) == "undefined")
        deviceObj.type = deviceNode._device_type;

    return deviceObj;
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
            chanID: datapoint._ise_id,
            propName: datapoint._type,
            value: TypeValueConversionFn[dataType](datapoint._value),
            unit: datapoint._valueunit
        }
    }
}

function getChannelState(datapoint, stateObject) {
    var dp = getPropValue(stateObject, datapoint.channelIndex, datapoint.datapointName);
    if (dp == null) return null;

    var hideChannel  = datapoint.hideIf            != null ? datapoint.hideIf(dp.value) : false;
    var displayValue = datapoint.valueConversionFn != null ? datapoint.valueConversionFn(dp.value) : dp.value;
    var threshold    = datapoint.thresholdIf       != null ? datapoint.thresholdIf(dp.value) : false;
    var writeable    = datapoint.writeable         != null ? datapoint.writeable : false;

    return {
        chanID: dp.chanID,
        propTypeName: dp.propName,
        displayName: translate(dp.propName),
        hide: hideChannel,
        value: displayValue,
        unconvertedValue: dp.value,
        unit: dp.unit,
        thresholdExceeded: threshold,
        writeable: writeable,
    }
}

function getMissingDatapointState(datapoint) {
    return {
        chanID: undefined,
        propTypeName: datapoint.datapointName,
        displayName: datapoint.datapointName,
        hide: false,
        value: "Datapoint '" + datapoint.datapointName + "' on channel " + datapoint.channelIndex + " not found!",
        unconvertedValue: "",
        unit: "",
        thresholdExceeded: true,
        writeable: datapoint.writeable != null ? datapoint.writeable : false
    }
}

function flagChangedValues(oldState, newState) {
    // flag changed values
    if (newState != null) {
        for (var propName in newState) {
            if (!newState.hasOwnProperty(propName))
                continue;

            if (!oldState.hasOwnProperty(propName)) {
                // prop is new -> always flagged changed
                newState[propName].changed = true;
            }
            else {
                var oldPropObject = oldState[propName];
                var newPropObject = newState[propName];

                if (oldPropObject.unconvertedValue != newPropObject.unconvertedValue) {
                    newPropObject.changed = true;
                }
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

function parseState(device, stateObject) {
    oldState = device.state;
    device.state = {};

    var data = getDeviceDataPointsForType(device.type);

    for (var i = 0; i < data.length; ++i) {
        var dataInstance = data[i];

        var channelState = getChannelState(dataInstance, stateObject);

        if (channelState == null) {
            device.state[dataInstance.datapointName] = getMissingDatapointState(dataInstance);
            console.error(device.state[dataInstance.datapointName]);
            continue;
        }
        else {
            device.state[channelState.propTypeName] = channelState;
        }

    }

    flagChangedValues(oldState, device.state);
}

function parseUserdefinedVirtualGroupState(userdefinedGroup, allDeviceStates) {
    oldState = userdefinedGroup.state;
    userdefinedGroup.state = {};

    // parse all data defined in userdefinedGroup.config and
    // move them into userdefinedGroup.state
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
            // get datapoint instance with functions, userdefinedGroup config data is deserialized, e.g. no functions attached to this object!
            dataInstance = DeviceDataPoints.getByName(dataInstance.datapointName, dataInstance.channelIndex);

            var channelState = getChannelState(dataInstance, deviceStateData);

            if (channelState == null) {
                var propName = dataInstance.datapointName + "_" + deviceId;
                userdefinedGroup.state[propName] = getMissingDatapointState(dataInstance);
                console.error(userdefinedGroup.state[propName]);
                continue;
            }
            else {
                var propName = channelState.propTypeName + "_" + deviceId;
                userdefinedGroup.state[propName] = channelState;
            }
        }
    }

    flagChangedValues(oldState, userdefinedGroup.state);
}

function parseSystemVariable(syVarXMLnode) {
    var name = syVarXMLnode._name;
    var variable = syVarXMLnode._variable;
    var value = syVarXMLnode._value;
    var value_list = syVarXMLnode._value_list;
    var ise_id = syVarXMLnode._ise_id;
    var min = syVarXMLnode._min;
    var max = syVarXMLnode._max;
    var unit = syVarXMLnode._unit;
    var sysVarType = parseInt(syVarXMLnode._type);
    var subtype = parseInt(syVarXMLnode._subtype);
    var logged = syVarXMLnode._logged;
    var visible = syVarXMLnode._visible;
    var timestamp = syVarXMLnode._timestamp;
    var value_name_0 = syVarXMLnode._value_name_0;
    var value_name_1 = syVarXMLnode._value_name_1;

    var variableDataType = HMdataType[sysVarType];
    var parsedValue = TypeValueConversionFn[variableDataType](value);

    var sysVarObject = {
        id: ise_id,
        name: name,
        type: variableDataType,
        sysVarType: sysVarType,
        displayValue: parsedValue,
        value: value,
        min: undefined,
        max: undefined,
        unit: undefined,
        valueMapping: undefined
    }

    switch (sysVarType) {
        case SysVarDataType.logic:
            var valueMapping = {
                false: value_name_0,
                true: value_name_1
            }

            $.extend(sysVarObject, {
                displayValue: valueMapping[parsedValue],
                valueMapping: valueMapping
            });
            break;
        case SysVarDataType.number:
            $.extend(sysVarObject, {
                min: min,
                max: max,
                unit: unit
            });
            break;
        case SysVarDataType.option:
            var displayValues = value_list.split(";")
            var valueMapping = {}
            for (var i = 0; i < displayValues.length; ++i)
                valueMapping[i] = displayValues[i];

            $.extend(sysVarObject, {
                displayValue: valueMapping[parsedValue],
                valueMapping: valueMapping
            });
            break;
    }

    return sysVarObject;
}