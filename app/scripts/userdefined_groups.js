﻿"use strict";

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
    {
        id: 1,
        name: "WC",
        config: [
            {
                device_id: 2632, // window sensor
                datapoints: [
                    DeviceDataPoints.DataPoint.WindowState.inChannel(1),
                ]
            },
            {
                device_id: 2553, // heater
                datapoints: [
                    DeviceDataPoints.DataPoint.ControlMode.inChannel(4),
                    DeviceDataPoints.DataPoint.ActualTemperature.inChannel(4),
                    DeviceDataPoints.DataPoint.SetTemperature.inChannel(4),
                    DeviceDataPoints.DataPoint.ValveState.inChannel(4),
                ]
            },
        ]
    },
    {
        id: 2,
        name: "Wohnzimmer",
        config: [
            {
                device_id: 2287, // virtualgroup
                datapoints: [
                    DeviceDataPoints.DataPoint.ControlMode.inChannel(1),
                    DeviceDataPoints.DataPoint.Humidity.inChannel(1),
                    DeviceDataPoints.DataPoint.ActualTemperature.inChannel(1),
                    DeviceDataPoints.DataPoint.SetTemperature.inChannel(1),
                    DeviceDataPoints.DataPoint.WindowState.inChannel(2),
                ]
            },
            {
                device_id: 3413, // heater balkon
                datapoints: [
                    DeviceDataPoints.DataPoint.ValveState.inChannel(4),
                ]
            },
            {
                device_id: 2147, // heater window
                datapoints: [
                    DeviceDataPoints.DataPoint.ValveState.inChannel(4),
                ]
            },
        ]
    },
    {
        id: 3,
        name: "Küche",
        config: [
            {
                device_id: 2997, // virtualgroup
                datapoints: [
                    DeviceDataPoints.DataPoint.ControlMode.inChannel(1),
                    DeviceDataPoints.DataPoint.Humidity.inChannel(1),
                    DeviceDataPoints.DataPoint.ActualTemperature.inChannel(1),
                    DeviceDataPoints.DataPoint.SetTemperature.inChannel(1),
                    DeviceDataPoints.DataPoint.WindowState.inChannel(2),
                ]
            },
            {
                device_id: 2918, // heater
                datapoints: [
                    DeviceDataPoints.DataPoint.ValveState.inChannel(4),
                ]
            },
        ]
    },
]