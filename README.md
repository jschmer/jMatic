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
- HTML5 compatible browser (for persistence in localStorage)
- Tested with
  - Firefox 31
  - Internet Explorer 11 (localStorage not working when launching the file::// directly!)
  - Google Chrome 39
  - Google Chrome for Android 39

Features
--------
- Device widgets that display only important datapoints of HomeMatic components
	- Read-only datapoints
	- Write-support for write-enabled datapoints
	- Highlight datapoints (red font color) if the value exceeds some hardcoded threshold
	- Highlight changed values (bold font weight)
- Subscribing to devices
	- only data for subscribed devices are displayed and refreshed which reduces load on the CCU  
- Refreshing data manually, on page load and periodically
- Checking battery for every device
- Display and modify system variables
- Run programs
- User defined widgets which are composed of arbitrary datapoints from different devices
	- Currently only hardcoded in JSON-format (userdefined_groups.js)

Usage
-----
Either copy jMatic to your device and launch index.html locally with a browser and bookmark it.
Or host it on a webserver. IE11 only works with a hosted version.

Create package
--------------
run: `npm install & bower install & grunt build`

Note: grunt build needs python installed for compiling views into the angular template cache!

Views
-----
Device State  
![Device States](./doc/screenshots/DeviceState_Flow.png?raw=true)
![Device States with channel nammes](./doc/screenshots/DeviceState_Names.png?raw=true)
![Editing a device state](./doc/screenshots/DeviceState_EditRemperature.png?raw=true)

Device Subscription  
![Device Subscription](./doc/screenshots/DeviceSubscription.png?raw=true)

Battery Check  
![Battery Check](./doc/screenshots/BatteryCheck.png?raw=true)

System Variables  
![System Variables](./doc/screenshots/SystemVariables.png?raw=true)

Settings  
![Settings](./doc/screenshots/Settings.png?raw=true)

Dependencies
------------
Built with [jQuery], [X2JS], [angularJS] and [Mobile Angular UI].


[XML-API]: http://www.homematic-inside.de/software/xml-api
[jQuery]: http://jquery.com/
[X2JS]: https://code.google.com/p/x2js/
[angularJS]: https://angularjs.org/
[Mobile Angular UI]: http://mobileangularui.com/
