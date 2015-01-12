jMatic
======
Simple web application to provide an easy to use interface for HomeMatic
home automation components. Intended for my personal use case, so there can be
a lot missing/unsupported devices and weird interpretations of datapoints.
Currently using this for controlling my heating control system.

Warning
-------
This thing is a work in progress and currently a bit messy. Deal with it or fix it!
Especially the language is a mix of en/de.

Prerequisites
-------------
- HomeMatic CCU/CCU2 with [XML-API] AddOn.
- HTML5 compatible browser (for persistance in localStorage)

Features
--------
- Device widgets that display only important datapoints of HomeMatic components
	- Read-only
	- Write-support for write-enabled datapoints is planned
	- Highlight datapoints (red font color) if the value exceeds some hardcoded threshold
	- Highlight changed values (bold font weight)
- Subscribing to devices
	- only data for subscribed devices are displayed and refreshed which reduces load on the CCU  
- Refreshing data manually and on page load
- Checking battery for every device
- Display and modify system variables
- User defined widgets which are composed of arbitrary datapoints from different devices
	- Currently only hardcoded in JSON-format
	- UI for dynamic creation is planned

Usage
-----
Either copy jMatic to your device and launch index.html locally with a browser and bookmark it.
Or host it on a webserver.

Views
-----
Device State  
![Device States](../master/doc/screenshots/DeviceState_Flow.png?raw=true)

Device Subscription  
![Device Subscription](../master/doc/screenshots/DeviceSubscription.png?raw=true)

Battery Check  
![Battery Check](../master/doc/screenshots/BatteryCheck.png?raw=true)

System Variables  
![System Variables](../master/doc/screenshots/SystemVariables.png?raw=true)

[XML-API]: http://www.homematic-inside.de/software/xml-api
