var userdefined_groups = [
    {
        id: 0,
        name: "Badezimmer",
        config: [
            {
                device_id: 2517, // virtualgroup
                channels: [
                    {
                        channel_id: 2529,
                        datapoints: [2535, 2530, 2548, 2531] // control mode, humidity, actual temp, set temp
                    },
                    {
                        channel_id: 2549,
                        datapoints: [2550] // window state
                    }
                ]
            },
            {
                device_id: 2377, // heater
                channels: [
                    {
                        channel_id: 2410,
                        datapoints: [2453] // valve state
                    }
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
                channels: [
                    {
                        channel_id: 2661,
                        datapoints: [2686] // window state
                    },
                ]
            },
            {
                device_id: 2553, // heater
                channels: [
                    {
                        channel_id: 2586,
                        datapoints: [2593, 2629, 2587, 2628] // control mode, valve state, actual temp, set temp
                    },
                ]
            },
        ]
    },
]