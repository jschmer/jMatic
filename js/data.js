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
    this.subscribed = false;
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
    function DataPoint_t(channelIndex, datapointName, valueConversionFn, hideIf, thresholdIf, writeable) {
        if (typeof (channelIndex) == "object") {
            var params = channelIndex;

            this.channelIndex      = params.channelIndex;
            this.datapointName     = params.datapointName;
            this.valueConversionFn = params.valueConversionFn;
            this.hideIf            = params.hideIf;
            this.thresholdIf       = params.thresholdIf;
            this.writeable         = params.writeable;
        }
        else {
            this.channelIndex      = channelIndex;
            this.datapointName     = datapointName;
            this.valueConversionFn = valueConversionFn;
            this.hideIf            = hideIf;
            this.thresholdIf       = thresholdIf;
            this.writeable         = writeable;
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
            writeable         : this.writeable,
        }
    };

    this.DataPoint = {
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
            thresholdIf: ThresholdFunctions.temperatureThreshold,
            writeable: true
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
    };

    this.getByName = function (name, index) {
        index = (typeof index !== 'undefined' ? index : 0);

        for (propname in this.DataPoint) {
            if (this.DataPoint.hasOwnProperty(propname)) {
                var datapoint = this.DataPoint[propname];
                if (datapoint.datapointName === name)
                    return datapoint.inChannel(index);
            }
        }

        throw "Datapoint with name " + name + " does not exist!";
    }

    this.DefaultData = [
        this.DataPoint.Default,
    ];

    this.VirtualGroupData = {
        forDevice: 'VirtualGroup',
        datapoints: [
            this.DataPoint.LowBat,
            this.DataPoint.ControlMode.inChannel(1),
            this.DataPoint.Humidity.inChannel(1),
            this.DataPoint.SetTemperature.inChannel(1),
            this.DataPoint.ActualTemperature.inChannel(1),
            this.DataPoint.State.inChannel(2),
        ]
    };

    this.WindowSensorData = {
        forDevice: 'WindowSensor',
        datapoints: [
            this.DataPoint.LowBat,
            this.DataPoint.State.inChannel(1),
            this.DataPoint.Error.inChannel(1),
        ]}
    ;

    this.HeaterData = {
        forDevice: 'Heater',
        datapoints: [
            this.DataPoint.LowBat,
            this.DataPoint.ControlMode.inChannel(4),
            this.DataPoint.FaultReporting.inChannel(4),
            this.DataPoint.ValveState.inChannel(4),
            this.DataPoint.ActualTemperature.inChannel(4),
            this.DataPoint.SetTemperature.inChannel(4),
        ]
    };

    this.ThermostatData = {
        forDevice: 'HM-TC-IT-WM-W-EU', //'Thermostat',
        datapoints: [
            this.DataPoint.LowBat,
            this.DataPoint.ControlMode.inChannel(2),
            this.DataPoint.Humidity.inChannel(2),
            this.DataPoint.ActualTemperature.inChannel(2),
            this.DataPoint.SetTemperature.inChannel(2),
        ]
    };
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
    for (var key in DeviceDataPoints) {
        if (DeviceDataPoints.hasOwnProperty(key)) {
            if (typeof (DeviceDataPoints[key].forDevice) != "undefined" && DeviceDataPoints[key].forDevice == type) {
                return DeviceDataPoints[key].datapoints;
            }
        }
    }
    return DeviceDataPoints.DefaultData;
}