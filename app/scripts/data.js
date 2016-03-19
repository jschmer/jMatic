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
    function DataPoint_t(channelIndex, datapointName, overrideName, valueConversionFn, hideIf, thresholdIf, writeable, constraints) {
        if (typeof (channelIndex) == "object") {
            var params = channelIndex;

            this.channelIndex      = params.channelIndex;
            this.datapointName     = params.datapointName;
            this.overrideName      = (typeof (params.overrideName) != "undefined") ? params.overrideName : this.datapointName;
            this.valueConversionFn = params.valueConversionFn;
            this.hideIf            = params.hideIf;
            this.thresholdIf       = params.thresholdIf;
            this.writeable         = params.writeable;
            this.constraints       = params.constraints;
        }
        else {
            this.channelIndex      = channelIndex;
            this.datapointName     = datapointName;
            this.overrideName      = (typeof (overrideName) != "undefined") ? overrideName : this.datapointName;
            this.valueConversionFn = valueConversionFn;
            this.hideIf            = hideIf;
            this.thresholdIf       = thresholdIf;
            this.writeable         = writeable;
            this.constraints       = constraints;
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
            thresholdIf: ThresholdFunctions.controlMode
        }),
        Humidity: new DataPoint_t({
            datapointName: "ACTUAL_HUMIDITY",
            thresholdIf: ThresholdFunctions.humidityThreshold
        }),
        SetTemperature: new DataPoint_t({
            datapointName: "SET_TEMPERATURE",
            thresholdIf: ThresholdFunctions.setTemperatureThreshold,
            writeable: true,
            constraints: {
                min: 4.5,
                max: 30.5
            }
        }),
        ActualTemperature: new DataPoint_t({
            datapointName: "ACTUAL_TEMPERATURE",
            thresholdIf: ThresholdFunctions.currentTemperatureThreshold
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
        Power: new DataPoint_t({ datapointName: "POWER" }),
        Current: new DataPoint_t({ datapointName: "CURRENT" }),
        Voltage: new DataPoint_t({ datapointName: "VOLTAGE" }),
        Frequency: new DataPoint_t({ datapointName: "FREQUENCY" }),
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