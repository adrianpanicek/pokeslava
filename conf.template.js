
const config = {
    port: 80,
    debug: false,
    maintenance: false,
    googleId: '',
    radar: [
        {
            login: 'KalinakOdstup',
            password: '******',
            center: {
                latitude: 48.145999,
                longitude: 17.113959,
            },
            radarLimitRadius: 2500,
            heartbeatRadius: 70, // 0.31 Pokémon Go reduced HB radius to 70
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