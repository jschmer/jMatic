"use strict";

function createDeviceModel(deviceNode) {
    var deviceObj = new Device();
    deviceObj.id = parseInt(deviceNode._ise_id);
    deviceObj.name = deviceNode._name;
    deviceObj.type = deviceTypeNames[deviceNode._device_type];

    if (typeof (deviceObj.type) == "undefined")
        deviceObj.type = deviceNode._device_type;

    return deviceObj;
}

function createChannelModel(id, name, displayName, overrideName, valueType, homematicType, displayValue, value, min, max, unit, valueMapping, hide, thresholdExceeded, writeable) {
    var channel = {}

    if (typeof (id) == "object") {
        var params = id;

        channel.id            = params.id;
        channel.name          = params.name;
        channel.overrideName  = params.overrideName;
        channel.displayName   = params.displayName;
        channel.valueType     = params.valueType;
        channel.homematicType = params.homematicType;
        channel.displayValue  = params.displayValue;
        channel.value         = params.value;
        channel.writeable                 = params.writeable;
        // homematicType specifics
        channel.constraints = {
            min: params.min,
            max: params.max,
        };
        channel.unit                      = params.unit;
        channel.valueMapping              = params.valueMapping;
        // flags for the UI
        channel.ui = {
            hide: params.hide,
            thresholdExceeded: params.thresholdExceeded,
        };
    }
    else {
        channel.id                = id;
        channel.name              = name;
        channel.overrideName      = overrideName;
        channel.displayName       = displayName;
        channel.valueType         = valueType;
        channel.homematicType     = homematicType;
        channel.displayValue      = displayValue;
        channel.value             = value;
        channel.writeable         = writeable;
        // homematicType specifics
        channel.constraints = {
            min: min,
            max: max,
        };
        channel.unit              = unit;
        channel.valueMapping      = valueMapping;
        // flags for the UI
        channel.ui = {
            hide: hide,
            thresholdExceeded: thresholdExceeded,
        };
    }

    return channel;
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
        var homematicType = parseInt(datapoint._valuetype);
        var dataType = HMdataType[homematicType];

        // TODO: parse additional data (value type, ...) see channel data structure for data needed

        return {
            chanID: datapoint._ise_id,
            propName: datapoint._type,
            homematicType: homematicType,
            valueType: dataType,
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

    var constraints = {
        min: undefined,
        max: undefined
    };
    if (datapoint.constraints) {
        constraints.min = datapoint.constraints.min;
        constraints.max = datapoint.constraints.max;
    }

    return createChannelModel({
        id: dp.chanID,
        name: dp.propName,
        overrideName: datapoint.overrideName,
        displayName: translate(dp.propName),
        valueType: dp.valueType,
        homematicType: dp.homematicType,
        displayValue: displayValue,
        value: dp.value,
        writeable: writeable,
        min: constraints.min,
        max: constraints.max,
        unit: dp.unit,
        valueMapping: undefined,
        hide: hideChannel,
        thresholdExceeded: threshold,
    });
}

function getMissingDatapointState(datapoint) {
    return createChannelModel({
        id: undefined,
        name: datapoint.datapointName,
        overrideName: undefined,
        displayName: datapoint.datapointName,
        valueType: undefined,
        homematicType: undefined,
        displayValue: "Datapoint '" + datapoint.datapointName + "' on channel " + datapoint.channelIndex + " not found!",
        value: undefined,
        writeable: false,
        constraints: {
            min: undefined,
            max: undefined,
        },
        unit: undefined,
        valueMapping: undefined,
        ui: {
            hide: false,
            thresholdExceeded: true,
        },
    });
}

function flagChangedValues(oldState, newState) {
    // flag changed values
    if (newState != null) {
        for (var propName in newState) {
            if (!newState.hasOwnProperty(propName))
                continue;

            if (oldState == null || !oldState.hasOwnProperty(propName)) {
                // prop is new -> always flagged changed
                newState[propName].ui.changed = true;
            }
            else {
                var oldPropObject = oldState[propName];
                var newPropObject = newState[propName];

                if (oldPropObject.value != newPropObject.value) {
                    newPropObject.ui.changed = true;
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
        if (deviceIndex != -1)
            parseState(devices[deviceIndex], deviceState);
    }

    // parse state for userdefined virtual groups
    for (var i = 0; i < devices.length; ++i) {
        var device = devices[i];

        if (device.type === userdefinedGroupType) {
            //console.log(device.config);
            parseUserdefinedVirtualGroupState(devices[i], stateObject);
        }

    }
}

function patchValueHistory(dataInstance, channelState, oldChannelState) {
    if (dataInstance.keepHistory > 0) {
        console.log("Keep history for channel " + channelState.name);

        if (oldChannelState == null
            || typeof (oldChannelState.valueHistory) == "undefined") {
            // No history available yet, create it
            channelState.valueHistory = [channelState.value];
        }
        else {
            channelState.valueHistory = oldChannelState.valueHistory.concat([channelState.value]);

            // Keep last x values, according to configuration
            channelState.valueHistory = channelState.valueHistory.slice(Math.max(0, channelState.valueHistory.length - dataInstance.keepHistory));
        }

        // Determine value change direction (up, stay, down) based on history values
        var direction = 0;
        for (var i = 1; channelState.valueHistory.length > 1 && i < channelState.valueHistory.length; ++i) {
            var val1 = channelState.valueHistory[i - 1];
            var val2 = channelState.valueHistory[i];

            if (val2 > val1) {
                direction += 1; // going up
            }
            else if (val2 < val1) {
                direction -= 1; // going down
            }
        }

        if (direction > 0) {
            channelState.valueDirection = "up";
        }
        else if (direction == 0) {
            channelState.valueDirection = "stay";
        }
        else {
            channelState.valueDirection = "down";
        }
    }
    else {
        channelState.valueDirection = "hide";
    }
}

function parseState(device, stateObjectForDevice) {
    var oldState = device.state;
    device.state = {};

    var data = getDeviceDataPointsForType(device.type);

    for (var i = 0; i < data.length; ++i) {
        var dataInstance = data[i];

        var channelState = getChannelState(dataInstance, stateObjectForDevice);

        if (channelState == null) {
            device.state[dataInstance.datapointName] = getMissingDatapointState(dataInstance);
            console.error(device.state[dataInstance.datapointName]);
            continue;
        }
        else {
            var oldChannelState = null;
            if (oldState != null)
                oldChannelState = oldState[channelState.name]
            patchValueHistory(dataInstance, channelState, oldChannelState);

            device.state[channelState.name] = channelState;
        }

    }

    flagChangedValues(oldState, device.state);
}

function parseUserdefinedVirtualGroupState(userdefinedGroup, allDeviceStates) {
    var oldState = userdefinedGroup.state;
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
                var propName = channelState.name + "_" + deviceId;
                var oldChannelState = null;
                if (oldState != null)
                    oldChannelState = oldState[propName]
                patchValueHistory(dataInstance, channelState, oldChannelState);

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

    var channelData = createChannelModel({
        id: ise_id,
        name: name,
        displayName: name,
        valueType: variableDataType,
        homematicType: sysVarType,
        displayValue: parsedValue,
        value: value
    });

    switch (sysVarType) {
        case HomematicType.logic:
            var valueMapping = {
                false: value_name_0,
                true: value_name_1
            }

            $.extend(channelData, {
                displayValue: valueMapping[parsedValue],
                valueMapping: valueMapping
            });
            break;
        case HomematicType.number:
            $.extend(channelData, {
                constraints: {
                    min: min,
                    max: max,
                },
                unit: unit
            });
            break;
        case HomematicType.option:
            var displayValues = value_list.split(";")
            var valueMapping = {}
            for (var i = 0; i < displayValues.length; ++i)
                valueMapping[i] = displayValues[i];

            $.extend(channelData, {
                displayValue: valueMapping[parsedValue],
                valueMapping: valueMapping
            });
            break;
    }

    return channelData;
}