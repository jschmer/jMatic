var deviceTypes = {
    'HM-CC-VG-1': 'VirtualGroup',
    'HM-Sec-SCo': 'WindowSensor',
    'HM-CC-RT-DN': 'Heater',
    'HM-TC-IT-WM-W-EU': 'Thermostat',
}

function Device() {
    this.id = -1;
    this.name = "Unknown";
    this.type = 'Unknown';
    this.state = null;
}

var Type = {
    bool: 0,
    int: 1,
    float: 2,
    string: 3
}

var TypeValueConversionFn = {}
TypeValueConversionFn[Type.bool] = function (stringVal) { return stringVal == "true"; }
TypeValueConversionFn[Type.int] = function (stringVal) { return parseInt(stringVal); }
TypeValueConversionFn[Type.float] = function (stringVal) { return parseFloat(stringVal); }
TypeValueConversionFn[Type.string] = function (stringVal) { return stringVal; }

var SysVarDataType = {
    logic: 2,
    number: 4,
    option: 16,
    string: 20
}

var HMdataType = {
    1: Type.bool, // action
    2: Type.bool,
    4: Type.float,
    8: Type.int,
    16: Type.int, // option/enum
    20: Type.string
}

var ControlModeState = {
    Auto: 0,
    Manual: 1,
    Party: 2,
    Boost: 3
}
var ControlModeStates = {
    0: "Auto",
    1: "Manuell",
    2: "Party",
    3: "Boost",
}
function getControlModeString(mode) {
    return ControlModeStates[mode];
}

var FaultReportingStates = {
    0: "Kein Fehler",
    1: "VALVE_TIGHT",
    2: "ADJUSTING_RANGE_TOO_LARGE",
    3: "ADJUSTING_RANGE_TOO_SMALL",
    4: "COMMUNICATION_ERROR",
    5: "",
    6: "LOWBAT",
    7: "VALVE_ERROR_POSITION",
}
function getFaultReportingString(state) {
    return FaultReportingStates[state];
}

var ErrorState = {
    NoError: 0,
    Error: 1
}
var ErrorStates = {
    0: "Nein",
    1: "Ja",
}
function getErrorString(state) {
    return ErrorStates[state];
}

function getWindowOpenClosedString(state) {
    if (state == false)
        return "Zu";
    else
        return "Auf";
}

var HideFunctions = {
    hideIfFalse: function(value) {
        return value == false;
    },
    hideIfNoError: function(value) {
        return value == 0; // ??
    },
}

var ThresholdFunctions = {
    always: function () { return true; },
    humidityThreshold: function (value) {
        return value > 65;
    },
    controlMode: function (value) {
        return value != ControlModeState.Auto;
    },
    temperatureThreshold: function (value) {
        return value < 17;
    },
    trueState: function (value) { return value == true; }
}

var DeviceDataPoints = new function () {
    function DataPoint_t(channelIndex, datapointName, valueConversionFn, hideIf, thresholdIf) {
        if (typeof (channelIndex) == "object") {
            var params = channelIndex;

            this.channelIndex      = params.channelIndex;
            this.datapointName     = params.datapointName;
            this.valueConversionFn = params.valueConversionFn;
            this.hideIf            = params.hideIf;
            this.thresholdIf       = params.thresholdIf;
        }
        else {
            this.channelIndex      = channelIndex;
            this.datapointName     = datapointName;
            this.valueConversionFn = valueConversionFn;
            this.hideIf            = hideIf;
            this.thresholdIf       = thresholdIf;
        }

        if (this.channelIndex == null)
            this.channelIndex = 0;
    }
    DataPoint_t.prototype.inChannel = function (index) {
        // copy object! (would change the channel of the one object in place all the time otherwise...)
        return {
            channelIndex      : index,
            datapointName     : this.datapointName,
            valueConversionFn : this.valueConversionFn,
            hideIf            : this.hideIf,
            thresholdIf       : this.thresholdIf,
        }
    };

    var DataPoint = {
        LowBat: new DataPoint_t({
            datapointName: "LOWBAT",
            hideIf: HideFunctions.hideIfFalse,
            thresholdIf: ThresholdFunctions.always
        }),
        ControlMode: new DataPoint_t({
            datapointName: "CONTROL_MODE",
            valueConversionFn: getControlModeString,
            thresholdIf: ThresholdFunctions.controlMode
        }),
        Humidity: new DataPoint_t({
            datapointName: "ACTUAL_HUMIDITY",
            thresholdIf: ThresholdFunctions.humidityThreshold
        }),
        SetTemperature: new DataPoint_t({
            datapointName: "SET_TEMPERATURE",
            thresholdIf: ThresholdFunctions.temperatureThreshold
        }),
        ActualTemperature: new DataPoint_t({
            datapointName: "ACTUAL_TEMPERATURE",
            thresholdIf: ThresholdFunctions.temperatureThreshold
        }),
        State: new DataPoint_t({
            datapointName: "STATE",
            valueConversionFn: getWindowOpenClosedString,
            thresholdIf: ThresholdFunctions.trueState // window open
        }),
        Error: new DataPoint_t({
            datapointName: "ERROR",
            valueConversionFn: getErrorString,
            hideIf: HideFunctions.hideIfNoError,
            thresholdIf: ThresholdFunctions.always
        }),
        FaultReporting: new DataPoint_t({
            datapointName: "FAULT_REPORTING",
            valueConversionFn: getFaultReportingString,
            hideIf: HideFunctions.hideIfNoError,
            thresholdIf: ThresholdFunctions.always
        }),
        ValveState: new DataPoint_t({ datapointName: "VALVE_STATE" }),
    }

    this.DefaultData = [
        DataPoint.Default,
    ];

    this.VirtualGroupData = [
        DataPoint.LowBat,
        DataPoint.ControlMode.inChannel(1),
        DataPoint.Humidity.inChannel(1),
        DataPoint.SetTemperature.inChannel(1),
        DataPoint.ActualTemperature.inChannel(1),
        DataPoint.State.inChannel(2),
    ];

    this.WindowSensorData = [
        DataPoint.LowBat,
        DataPoint.State.inChannel(1),
        DataPoint.Error.inChannel(1),
    ];

    this.HeaterData = [
        DataPoint.LowBat,
        DataPoint.ControlMode.inChannel(4),
        DataPoint.FaultReporting.inChannel(4),
        DataPoint.ValveState.inChannel(4),
        DataPoint.ActualTemperature.inChannel(4),
        DataPoint.SetTemperature.inChannel(4),
    ];

    this.ThermostatData = [
        DataPoint.LowBat,
        DataPoint.ControlMode.inChannel(2),
        DataPoint.Humidity.inChannel(2),
        DataPoint.ActualTemperature.inChannel(2),
        DataPoint.SetTemperature.inChannel(2),
    ];
}

// Datapoint name translation
var Translation = {
    "LOWBAT": "Low Battery",
    "BATTERY_STATE": "Battery",
    "ACTUAL_HUMIDITY": "Luftfeuchte",
    "ACTUAL_TEMPERATURE": "Temperatur",
    "SET_TEMPERATURE": "Zieltemperatur",
    "VALVE_STATE": "Ventilstatus",
    "ERROR": "Sabotage",
    "STATE": "Status",
    "CONTROL_MODE": "Modus",
    "FAULT_REPORTING": "Fehler",
}

function translate(string) {
    // if has translation: translate
    if (Translation.hasOwnProperty(string))
        return Translation[string];
        // else: return input string
    else
        return string;
}

function getDeviceDataPointsForType(type) {
    if (type == 'VirtualGroup') {
        return DeviceDataPoints.VirtualGroupData;
    }
    else if (type == 'WindowSensor') {
        return DeviceDataPoints.WindowSensorData;
    }
    else if (type == 'Heater') {
        return DeviceDataPoints.HeaterData;
    }
    else if (type == 'Thermostat') {
        return DeviceDataPoints.ThermostatData;
    }
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