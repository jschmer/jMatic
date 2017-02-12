"use strict";

// datapoint name translations
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

// map device type code to display name
// TODO: translate properly with the $translate service
var deviceTypeNames = {
    'HM-CC-VG-1': 'VirtualGroup',
    'HM-Sec-SCo': 'WindowSensor',
    'HM-CC-RT-DN': 'Heater',
    'HM-TC-IT-WM-W-EU': 'Thermostat',
    'HM-ES-PMSw1-Pl': 'WirelessOutlet'
}
var userdefinedGroupType = 'UserdefinedVirtualGroup';

// map device type display name to device code
var deviceTypeCode = {}
for (var key in deviceTypeNames) {
    if (deviceTypeNames.hasOwnProperty(key)) {
        deviceTypeCode[deviceTypeNames[key]] = key;
    }
}

// device constructor
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

// value conversion functions from string to native javascript type
var TypeValueConversionFn = {}
TypeValueConversionFn[Type.bool] = function (stringVal) { return stringVal == "true"; }
TypeValueConversionFn[Type.int] = function (stringVal) { return parseInt(stringVal); }
TypeValueConversionFn[Type.float] = function (stringVal) { return parseFloat(stringVal); }
TypeValueConversionFn[Type.string] = function (stringVal) { return stringVal; }

// homematic variable data types
var HomematicType = {
    none: 0,
    logic: 2,
    number: 4,
    option: 16,
    string: 20
}

// homematic logical datapoint type
var HMdataType = {
    1: Type.bool, // action
    2: Type.bool,
    4: Type.float,
    8: Type.int,
    16: Type.int, // option/enum
    20: Type.string
}

// datapoint value translations
var ControlModeState = {
    Auto: 0,
    Manual: 1,
    Party: 2,
    Boost: 3
}

function parseDisplayValue(displayValue, mapping) {
    // map from display value to real value
    if (mapping != null) {
        for (var key in mapping) {
            if (mapping.hasOwnProperty(key)) {
                var mappedValue = mapping[key];
                if (mappedValue == displayValue) {
                    return key;
                }
            }
        }
    }
    return displayValue;
}

var ValueConversionFunctions = {
    // TODO: translate properly with the $translate service
    ControlModeStates: {
        0: "Auto",
        1: "Manuell",
        2: "Party",
        3: "Boost",
    },
    getControlModeString: function(mode) {
        return ValueConversionFunctions.ControlModeStates[mode];
    },
    controlModePushInsteadOf: function (channelData, currentValue, newValue) {
        switch (parseInt(newValue)) {
            case ControlModeState.Auto:
                return { newChannelName: "AUTO_MODE", newValue: "true" };
            case ControlModeState.Manual:
                return { newChannelName: "MANU_MODE", newValue: "18.0" };
            case ControlModeState.Boost:
                return { newChannelName: "BOOST_MODE", newValue: "true" };
            default:
                return { newChannelName: channelData.name, newValue: value };
        }
    },

    // TODO: translate properly with the $translate service
    FaultReportingStates: {
        0: "Kein Fehler",
        1: "VALVE_TIGHT",
        2: "ADJUSTING_RANGE_TOO_LARGE",
        3: "ADJUSTING_RANGE_TOO_SMALL",
        4: "COMMUNICATION_ERROR",
        5: "",
        6: "LOWBAT",
        7: "VALVE_ERROR_POSITION",
    },
    getFaultReportingString: function(state) {
        return ValueConversionFunctions.FaultReportingStates[state];
    },

    ErrorState: {
        NoError: 0,
        Error: 1
    },
    // TODO: translate properly with the $translate service
    ErrorStates: {
        0: "Nein",
        1: "Ja",
    },
    getErrorString: function(state) {
        return ValueConversionFunctions.ErrorStates[state];
    },

    // TODO: translate properly with the $translate service
    getWindowOpenClosedString: function(state) {
        if (state == false)
            return "Zu";
        else
            return "Auf";
    },

    getSwitchOnOffString: function(state) {
        if (state == false)
            return "Aus";
        else
            return "An";
    },

    roundFloat: function(precision) {
        return function(value) {
            return value.toFixed(precision);
        };
    }
}

// datapoint state functions (hide if, threshold if)
var HideFunctions = {
    hideAlways: function (value) {
        return true;
    },
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
    currentTemperatureThreshold: function (value) {
        return value < 17;
    },
    setTemperatureThreshold: function (value) {
        return value < 17 || value > 21 ;
    },
    trueState: function (value) { return value == true; }
}

// datapoint definition
var DeviceDataPoints = new function () {
    // datapoint constructor
    function DataPoint_t(channelIndex, datapointName, overrideName, valueConversionFn, setValueConversionFn, hideIf, thresholdIf, writeable, constraints, keepHistory, valueMapping, pushInsteadOf) {
        if (typeof (channelIndex) == "object") {
            var params = channelIndex;

            this.channelIndex         = params.channelIndex;
            this.datapointName        = params.datapointName;
            this.overrideName         = (typeof (params.overrideName) != "undefined") ? params.overrideName : this.datapointName;
            this.valueConversionFn    = params.valueConversionFn;
            this.setValueConversionFn = params.setValueConversionFn;
            this.hideIf               = params.hideIf;
            this.thresholdIf          = params.thresholdIf;
            this.writeable            = params.writeable;
            this.constraints          = params.constraints;
            this.keepHistory = (typeof (params.keepHistory) != "undefined") ? params.keepHistory : 0;
            this.valueMapping         = params.valueMapping;
            this.pushInsteadOf        = params.pushInsteadOf;
        }
        else {
            this.channelIndex         = channelIndex;
            this.datapointName        = datapointName;
            this.overrideName         = (typeof (overrideName) != "undefined") ? overrideName : this.datapointName;
            this.valueConversionFn    = valueConversionFn;
            this.setValueConversionFn = setValueConversionFn;
            this.hideIf               = hideIf;
            this.thresholdIf          = thresholdIf;
            this.writeable            = writeable;
            this.constraints          = constraints;
            this.keepHistory          = (typeof (keepHistory) != "undefined") ? keepHistory : 0;
            this.valueMapping         = valueMapping;
            this.pushInsteadOf        = pushInsteadOf;
        }

        if (this.channelIndex == null)
            this.channelIndex = 0;
    }
    DataPoint_t.prototype.inChannel = function (index) {
        // copy object! (would change the channel of the one object in place all the time otherwise...)
        return $.extend({}, this, { channelIndex: index });
    };
    DataPoint_t.prototype.constraints = function (constraints) {
        return $.extend({}, this, { constraints: constraints });
    };
    DataPoint_t.prototype.writeable = function (state) {
        return $.extend({}, this, { writeable: typeof (state) === "undefined" || state == true });
    };

    this.DataPoint = {
        LowBat: new DataPoint_t({
            datapointName: "LOWBAT",
            hideIf: HideFunctions.hideIfFalse,
            thresholdIf: ThresholdFunctions.always
        }),
        ControlMode: new DataPoint_t({
            datapointName: "CONTROL_MODE",
            valueConversionFn: ValueConversionFunctions.getControlModeString,
            thresholdIf: ThresholdFunctions.controlMode,
            writeable: true,
            valueMapping: ValueConversionFunctions.ControlModeStates,
            pushInsteadOf: ValueConversionFunctions.controlModePushInsteadOf
        }),
        AutoMode: new DataPoint_t({
            datapointName: "AUTO_MODE",
            writeable: true,
            hideIf: HideFunctions.hideAlways,
        }),
        ManuMode: new DataPoint_t({
            datapointName: "MANU_MODE",
            writeable: true,
            hideIf: HideFunctions.hideAlways,
        }),
        BoostMode: new DataPoint_t({
            datapointName: "BOOST_MODE",
            writeable: true,
            hideIf: HideFunctions.hideAlways,
        }),
        Humidity: new DataPoint_t({
            datapointName: "ACTUAL_HUMIDITY",
            thresholdIf: ThresholdFunctions.humidityThreshold,
            keepHistory: 3
        }),
        SetTemperature: new DataPoint_t({
            datapointName: "SET_TEMPERATURE",
            thresholdIf: ThresholdFunctions.setTemperatureThreshold,
            writeable: true,
            constraints: {
                min: 4.5,
                max: 30.5
            },
            keepHistory: 3
        }),
        ActualTemperature: new DataPoint_t({
            datapointName: "ACTUAL_TEMPERATURE",
            thresholdIf: ThresholdFunctions.currentTemperatureThreshold,
            keepHistory: 3
        }),
        WindowState: new DataPoint_t({
            datapointName: "STATE",
            overrideName: "WINDOW_STATE", // overrides the datapoint name in the ui class
            valueConversionFn: ValueConversionFunctions.getWindowOpenClosedString,
            thresholdIf: ThresholdFunctions.trueState, // window open
        }),
        Error: new DataPoint_t({
            datapointName: "ERROR",
            valueConversionFn: ValueConversionFunctions.getErrorString,
            hideIf: HideFunctions.hideIfNoError,
            thresholdIf: ThresholdFunctions.always
        }),
        FaultReporting: new DataPoint_t({
            datapointName: "FAULT_REPORTING",
            valueConversionFn: ValueConversionFunctions.getFaultReportingString,
            hideIf: HideFunctions.hideIfNoError,
            thresholdIf: ThresholdFunctions.always
        }),
        ValveState: new DataPoint_t({ datapointName: "VALVE_STATE" }),
        Power: new DataPoint_t({
            datapointName: "POWER",
            keepHistory: 3
        }),
        Current: new DataPoint_t({
            datapointName: "CURRENT",
            keepHistory: 3
        }),
        Voltage: new DataPoint_t({
            datapointName: "VOLTAGE",
            keepHistory: 3
        }),
        Frequency: new DataPoint_t({
            datapointName: "FREQUENCY",
            keepHistory: 3
        }),
        EnergyCounter: new DataPoint_t({
            datapointName: "ENERGY_COUNTER",
            valueConversionFn: ValueConversionFunctions.roundFloat(0),
        }),
        SwitchState: new DataPoint_t({
            datapointName: "STATE",
            overrideName: "SWITCH_STATE", // overrides the datapoint name in the ui class
            valueConversionFn: ValueConversionFunctions.getSwitchOnOffString,
            writeable: true
        }),
    };

    this.getByName = function (name, index) {
        index = (typeof index !== 'undefined' ? index : 0);

        for (var propname in this.DataPoint) {
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
            this.DataPoint.AutoMode.inChannel(1),
            this.DataPoint.ManuMode.inChannel(1),
            this.DataPoint.BoostMode.inChannel(1),
            this.DataPoint.Humidity.inChannel(1),
            this.DataPoint.SetTemperature.inChannel(1),
            this.DataPoint.ActualTemperature.inChannel(1),
            this.DataPoint.WindowState.inChannel(2),
        ]
    };

    this.WindowSensorData = {
        forDevice: 'WindowSensor',
        datapoints: [
            this.DataPoint.LowBat,
            this.DataPoint.WindowState.inChannel(1),
            this.DataPoint.Error.inChannel(1),
        ]
    };

    this.HeaterData = {
        forDevice: 'Heater',
        datapoints: [
            this.DataPoint.LowBat,
            this.DataPoint.ControlMode.inChannel(4),
            this.DataPoint.AutoMode.inChannel(4),
            this.DataPoint.ManuMode.inChannel(4),
            this.DataPoint.BoostMode.inChannel(4),
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
            this.DataPoint.AutoMode.inChannel(2),
            this.DataPoint.ManuMode.inChannel(2),
            this.DataPoint.BoostMode.inChannel(2),
            this.DataPoint.Humidity.inChannel(2),
            this.DataPoint.ActualTemperature.inChannel(2),
            this.DataPoint.SetTemperature.inChannel(2),
        ]
    };

    this.WirelessOutlet = {
        forDevice: 'HM-ES-PMSw1-Pl', //'WirelessOutlet',
        datapoints: [
            this.DataPoint.SwitchState.inChannel(1),
            this.DataPoint.Power.inChannel(2),
            this.DataPoint.Current.inChannel(2),
            this.DataPoint.Voltage.inChannel(2),
            this.DataPoint.Frequency.inChannel(2),
            this.DataPoint.EnergyCounter.inChannel(2),
        ]
    };
}

function getDeviceDataPointsForType(typeName) {
    var code = deviceTypeCode[typeName];

    for (var key in DeviceDataPoints) {
        if (DeviceDataPoints.hasOwnProperty(key)) {
            if (typeof (DeviceDataPoints[key].forDevice) != "undefined"
                && (DeviceDataPoints[key].forDevice == typeName || DeviceDataPoints[key].forDevice == code))
            {
                return DeviceDataPoints[key].datapoints;
            }
        }
    }
    return DeviceDataPoints.DefaultData;
}