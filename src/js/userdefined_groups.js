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
                    DeviceDataPoints.DataPoint.State.inChannel(2),
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
                    DeviceDataPoints.DataPoint.State.inChannel(1),
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
]