
const config = {
    port: 80,
    debug: false,
    radar: [
        {
            login: 'KalinakOdstup',
            password: '******',
            center: {
                latitude: 48.145999,
                longitude: 17.113959,
            },
            radarLimitRadius: 2500,
            heartbeatRadius: 100,
            scanTimeout: 1000
        }
    ],
    mongodb: {
        host: 'localhost',
        port: 27017,
        database: 'pokemon'
    }
};

export default config;