﻿"use strict";

var lang = {
    "en": {
        'JMATIC': 'jMatic',
        'TITLE_DEVICE_STATE': 'Device State',
        'TITLE_DEVICE_STATE_EDIT': 'Edit Device State',
        'TITLE_DEVICE_CONFIG': 'Subscription Config',
        'TITLE_BATTERY_CHECK': 'Battery Check',
        'TITLE_SYSVARS': 'System Variables',
        'TITLE_PROGRAMS': 'Programs',
        'TITLE_APP_CONFIG': 'Settings',
        'BUTTON_LANG_DE': 'de',
        'BUTTON_LANG_EN': 'en',
        'APP_CONFIG_LANGUAGE': 'Language ',
        'APP_CONFIG_DEVICESTATERELOADINTERVAL': 'Device state reload interval (seconds)',
        'APP_CONFIG_CUSTOMTEMPERATURERANGE': 'Custom temperature input range (°C)',
        'NAME': 'Name',
        'TYPE': 'Type',
        'SHOW_NAMES': 'Show Names',
        'HIDE_NAMES': 'Hide Names',
        'STACK_LAYOUT': 'Stack Layout',
        'FLOW_LAYOUT': 'Flow Layout',
        'MENU': 'Menu',
        'LEGEND': 'Legend',
        'DEVICE_DELETE': 'Delete device in jMatic',
        'DEVICE_CONFIG_MISSING_ON_CCU': 'Device configuration is missing on your CCU (device was probably deleted there!)',
        'DEVICE_CONFIG_SYNCHRONIZE': 'Synchronize device configuration in jMatic with your devices registered on your CCU',
        'DEVICE_REGISTERED': 'Device is registered in jMatic',
        'DETAILS': 'Details',
        'ID': 'Id',
        'DESCRIPTION': 'Description',

        'SUCCESS': 'Success',
        'CHANGESUCCESS': 'Change succeeded!',
        'DEVICEDELETEDSUCCESS': 'Device {{deviceName}} deleted!',
        'RUNNINGPROGRAMSUCCESS': 'Running program {{programName}} successful!',

        'ERROR': 'Error',
        'CCU_REACHABLE': 'Is your CCU reachable?',
        'WARN_NODEVICESTATES': 'No device states received!',
        'WARN_NODEVICES': 'No devices received!',
        'WARN_NOSYSVARS': 'No system variables received!',
        'WARN_FAILEDWRITINGDATAPOINT': 'Writing {{value}} to datapoint with id {{id}} failed!',
        'WARN_FAILEDWRITINGSYSVAR': 'Writing {{value}} to system variable with id {{id}} failed!',
        'WARN_NOPROGRAMS': 'No programs received!',
        'WARN_FAILEDRUNNINGPROGRAM': 'Running program with id {{id}} failed!',
        'ERROR_FAILEDPARSINGDEVICESTATES': 'Failed parsing device states!',
        'ERROR_FAILEDPARSINGDEVICES': 'Failed parsing device list!',
        'ERROR_FAILEDPARSINGSYSVARS': 'Failed parsing system variables!',
        'ERROR_FAILEDPARSINGPROGRAMLIST': 'Failed parsing program list!',
        'ERROR_FAILEDGETTINGDEVICESTATES': 'Failed getting device states!',
        'ERROR_FAILEDGETTINGDEVICES': 'Failed getting devices!',
        'ERROR_FAILEDGETTINGSYSVARS': 'Failed getting system variable list!',
        'ERROR_FAILEDWRITINGCHANNEL': 'Failed writing to datapoint!',
        'ERROR_FAILEDGETTINGPROGRAMLIST': 'Failed getting program list!',
        'ERROR_FAILEDRUNNINGPROGRAM': 'Failed running program!',
        'ERROR_DEVICENOTFOUND': 'Device with id {{deviceId}} not found!',
    },
    "de": {
        'TITLE_DEVICE_STATE': 'Gerätestatus',
        'TITLE_DEVICE_STATE_EDIT': 'Gerätestatus ändern',
        'TITLE_DEVICE_CONFIG': 'Abo-Konfiguration',
        'TITLE_BATTERY_CHECK': 'Batteriecheck',
        'TITLE_SYSVARS': 'Systemvariablen',
        'TITLE_PROGRAMS': 'Programme',
        'TITLE_APP_CONFIG': 'Einstellungen',
        'APP_CONFIG_LANGUAGE': 'Sprache ',
        'APP_CONFIG_DEVICESTATERELOADINTERVAL': 'Gerätestatus Aktualisierungs-Intervall (Sekunden)',
        'APP_CONFIG_CUSTOMTEMPERATURERANGE': 'Temperaturbereich für Eingaben (°C)',
        'NAME': 'Name',
        'TYPE': 'Typ',
        'SHOW_NAMES': 'Mit Namen',
        'HIDE_NAMES': 'Ohne Namen',
        'STACK_LAYOUT': 'Tabellarisch',
        'FLOW_LAYOUT': 'Fließend',
        'MENU': 'Menü',
        'LEGEND': 'Legende',
        'DEVICE_DELETE': 'Konfiguration in jMatic löschen',
        'DEVICE_CONFIG_MISSING_ON_CCU': 'Geräte-Konfiguration fehlt auf deiner CCU-Zentrale (Gerät wurde wahrscheinlich dort gelöscht!)',
        'DEVICE_CONFIG_SYNCHRONIZE': 'Geräte-Konfigurationen in jMatic mit den Konfiguration auf der CCU-Zentrale synchronisieren',
        'DEVICE_REGISTERED': 'Gerät ist in jMatic registriert',
        'DESCRIPTION': 'Beschreibung',

        'SUCCESS': 'Erfolgreich',
        'CHANGESUCCESS': 'Änderung erfolgreich!',
        'DEVICEDELETEDSUCCESS': 'Gerät {{deviceName}} gelöscht!',
        'RUNNINGPROGRAMSUCCESS': 'Programm {{programName}} ausgeführt!',

        'ERROR': 'Fehler',
        'CCU_REACHABLE': 'Ist diene CCU erreichbar?',
        'WARN_NODEVICESTATES': 'Keine Gerätedaten erhalten!',
        'WARN_NODEVICES': 'Keine Geräte erhalten!',
        'WARN_NOSYSVARS': 'Keine Systemvariablen erhalten!',
        'WARN_FAILEDWRITINGDATAPOINT': 'Schreiben des Wertes {{value}} in den Datenpunkt mit der ID {{id}} fehlgeschlagen!',
        'WARN_FAILEDWRITINGSYSVAR': 'Schreiben des Wertes {{value}} in die Systemvariable mit der ID {{id}} fehlgeschlagen!',
        'WARN_NOPROGRAMS': 'Keine Programme erhalten!',
        'WARN_FAILEDRUNNINGPROGRAM': 'Ausführen des Programms mit der ID {{id}} fehlgeschlagen!',
        'ERROR_FAILEDPARSINGDEVICESTATES': 'Auswerten der Gerätedaten fehlgeschlagen!',
        'ERROR_FAILEDPARSINGDEVICES': 'Auswerten der Geräteliste fehlgeschlagen!',
        'ERROR_FAILEDPARSINGSYSVARS': 'Auswerten der Systemvariablen fehlgeschlagen!',
        'ERROR_FAILEDPARSINGPROGRAMLIST': 'Auswerten der Programmliste fehlgeschlagen!',
        'ERROR_FAILEDGETTINGDEVICESTATES': 'Gerätedaten lesen fehlgeschlagen!',
        'ERROR_FAILEDGETTINGDEVICES': 'Geräte lesen fehlgeschlagen!',
        'ERROR_FAILEDGETTINGSYSVARS': 'Systemvariablen lesen fehlgeschlagen!',
        'ERROR_FAILEDWRITINGCHANNEL': 'Datenpunkt schreiben fehlgeschlagen!',
        'ERROR_FAILEDGETTINGPROGRAMLIST': 'Programmliste lesen fehlgeschlagen!',
        'ERROR_FAILEDRUNNINGPROGRAM': 'Programm ausführen fehlgeschlagen!',
        'ERROR_DEVICENOTFOUND': 'Gerät mit der id {{deviceId}} nicht gefunden!',
    }
};