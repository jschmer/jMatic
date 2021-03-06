# Data Structures
---
Most of this is derived from the HomeMatic documentation found here: http://www.eq-3.de/downloads.html  
Search for 'Script' in the category 'HomeMatic' and download type 'Skripte'.
'HomeMatic Script Teil 4 CCU2 - Datenpunkte' is the most important documentation for jMatic.


### Devices
---
HomeMatic devices are structured as follows:
```
|- Device
|  |- Channel
|  |  |- Datapoint (for example LOWBAT)
|  |  |- Datapoint (for example ACTUAL_TEMPERATURE)
|  |  |- ...
|  |
|  |- Channel
|  |  |- Datapoint
|  |  |- ...
|  |- ...
|
|- Device
|- ...
```

### Adding a new device widget
---
Data for devices is configured in js/data.js.  
First extend the DeviceDataPoints.DataPoint structure with the datapoints you want to use
for your new device. Datapoints are identified by
- name
- channel (defaults to 0, every device has 0 to n channels)
- optional functions:
  - converting the raw value (e.g. convert true/false to meaningful strings YES/NO, possibly use translation here too)
  - determine if the datapoint should be hidden in the UI (e.g. only show the 'error' state)
  - determine if the value has exceeded a threshold (e.g. highlight humidity if exceeding 60%)
  
Example for an Error-Datapoint:
```javascript
Error: new DataPoint_t({
           datapointName: "ERROR",
           valueConversionFn: getErrorString,     // translate the error number/string
           hideIf: HideFunctions.hideIfNoError,   // show only if there is an error
           thresholdIf: ThresholdFunctions.always // always highlight
           writeable: true,                       // datapoint can be edited
           constraints: {                         // optional numerical constraints on the datapoint value
               min: 0,
               max: 40
           }
       }),
```
Then extend the DeviceDataPoints object with a new property for your new device.
Example for a heater device:
```javascript
this.HeaterData = {
    forDevice: 'Heater', // or the device code 'HM-CC-RT-DN'
    datapoints: [
        this.DataPoint.LowBat,                          // implicitly channel 0
        this.DataPoint.ControlMode.inChannel(4),        // explicitly channel 4
        this.DataPoint.FaultReporting.inChannel(4),
        this.DataPoint.ValveState.inChannel(4),
        this.DataPoint.ActualTemperature.inChannel(4),
        this.DataPoint.SetTemperature.inChannel(4),
    ]
};
```

Optionally extend the deviceTypeNames map with your new device to provide a menaingful name
instead of a cryptic device code. If you provide a new name here you have to update the 
forDevice property of your DeviceDataPoints!
```javascript
var deviceTypeNames = {
    'HM-CC-VG-1': 'VirtualGroup',
    'HM-Sec-SCo': 'WindowSensor',
    'HM-CC-RT-DN': 'Heater',
    'HM-TC-IT-WM-W-EU': 'Thermostat',
}
```

### Devices with state
---
Persisted in ***localStorage.registeredDevices***: (JSON encoded string)  
Used in views **Device State** and **Device Subscription**
```javascript
[
	{
		id: int,
		name: "string",
		type: "HomeMatic Device Type" (an entry from deviceTypeNames map or raw device type code),
		subscribed: boolean,
		state:  {
					CHANNELNAME_DEVICEID: channel_data_structure
					or
					CHANNELNAME: channel_data_structure
					, ...
				}
	},
	...
]
```

### Channel data structure
---
Used in views **Device State**, **Device Subscription** and **System variables**
```javascript
channel: {
    id: int,
    name: string,
    displayName: string,
    valueType: enum(bool, int, float, string),
    homematicType: enum(logic, number, option, string),
    displayValue: Converted boolean/int/float/string, // == value
    value: Unconverted value from XML API as a string, // == unconvertedValue
    writeable: boolean,
    
    // specifics for different homematicTypes
    constraints: {
        min: number, // used for number 
        max: number, // used for number
    }
    unit: string, // used for number
    valueMapping: { // used for logic, option
      value0: mappedValue0,
      value1: mappedValue1,
      ...
    },
    
    // data to drive the ui
    ui: {
        hide: boolean,
        thresholdExceeded: boolean,
        changed: boolean // value changed
    }
}
```

### UI config
---
Persisted in ***localStorage.channelsStacked***: boolean  
Used in view **Device State**. Affects layout of device channels.  
`true:` stacked layout, vertically stacked  
`false:` flow layout, horizontally stacked

Persisted in ***localStorage.lastRefreshTime***: datetime string  
Used in view **Device State**. Stores the last time the device states were successfully refreshed.

### Userdefined widgets
---
You can compose datapoints from multiple devices into one userdefined widget.
These are defined in the file 'userdefined_groups.js' and are unique for every HomeMatic installation.
The sample provided won't work with your setup but you get the idea behind it when looking at it:
The userdefined_groups variable is just a list of objects defining your custom widgets.
You need to assign an ID, a name and a config to your widget. The config contains a list of object definitions that
specify the device and datapoints you want to include for your custom widget.
An example:
```javascript
var userdefined_groups = [
    {
        id: 0,
        name: "Badezimmer",
        config: [
            {
                device_id: 2517, // virtualgroup
                datapoints: [
                    DeviceDataPoints.DataPoint.ControlMode.inChannel(1),
                    DeviceDataPoints.DataPoint.Humidity.inChannel(1),
                    DeviceDataPoints.DataPoint.ActualTemperature.inChannel(1),
                    DeviceDataPoints.DataPoint.SetTemperature.inChannel(1),
                    DeviceDataPoints.DataPoint.WindowState.inChannel(2),
                ]
            },
            {
                device_id: 2377, // heater
                datapoints: [
                    DeviceDataPoints.DataPoint.ValveState.inChannel(4),
                ]
            },
        ]
    },
]
```
You can get the device_id from the **Device Subscription** view. The HomeMatic documentation 'Datenpunkte' 
helps finding out in which channel a datapoint is located. The datapoints themselves are found by name inside the channel.

# Misc
---
#### Why compiling the templates?
AngularJS uses XMLHttpRequest for fetching the current views.
This is not allowed for local files because of security concerns.  
We compile all the templates into a single javascript file where the
templates get injected into the templateCache of the application.
AngularJS can fetch the view from the cache and everything works fine
if it runs locally (not web-hosted).  
If you don't want to compile the templates then host the application
with a webserver and adjust the paths to the templates in the routing configuration.