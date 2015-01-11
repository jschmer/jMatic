# Data Structures
---

### Devices with state
---
***localStorage.registeredDevices***: (JSON encoded string)  
Used in views **Device State** and **Device Subscription**
```javascript
[
	{
		id: int,
		name: "string",
		type: "HomeMatic Device Type",
		subscribed: boolean,
		state:  {
					CHANNELNAME_DEVICEID: {
						propTypeName: "CHANNELNAME",
						displayName: "translated channel name",
						hide: boolean,
						value: Converted boolean/int/float/string,
						unconvertedValue: Unconverted real value from XML API,
						unit: string,
						thresholdExceeded: boolean
					},
					...
				}
	},
	...
]
```

### UI config
---
***localStorage.channelsStacked***: boolean  
Used in view **Device State**. Affects layout of device channels.  
`true:` stacked layout, vertically stacked  
`false:` flow layout, horizontally stacked

***localStorage.lastRefreshTime***: datetime string  
Used in view **Device State**. Stores the last time the device states were successfully refreshed.

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