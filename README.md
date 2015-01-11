jMatic
======
Simple web application to provide an easy to use interface for HomeMatic
home automation components.

Prerequisites
-------------
- HomeMatic CCU/CCU2 with [XML-API] AddOn.
- HTML5 compatible browser (for localStorage)

Features
--------
- Device widgets that display only important channels/data of HomeMatic components
	- Read-only
	- Write-support for write-enabled channels is planned
- Subscribing to devices
	- only data for subscribed devices are displayed and refreshed which reduces load on the CCU  
- Refreshing data manually and on page load
- Checking battery for every device
- Display and modify system variables
- User defined widgets which are composed of arbitrary channels from different devices
	- Currently only hardcoded in JSON-format
	- UI for dynamic creation is planned

Views
-----
- Device State
- Device Subscription
- Battery Check
- System Variables

Usage
-----
Either copy jMatic to your device and launch index.html locally with a browser and bookmark it.
Or host it on a webserver.
















[XML-API]: http://www.homematic-inside.de/software/xml-api