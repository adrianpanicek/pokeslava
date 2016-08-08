import { Pokeio } from '../pokeio/poke.io';
var geolib = require('geolib');

import config from '../conf.js';

class Radar {
    constructor(settings) {
        this.settings = settings;
        this.api = new Pokeio();

        this.initialized = false;
        this.actualPoint = (settings.scanOffset)? settings.scanOffset : 0;
        this.emptyResponses = 0;
        this.failedLogins = 0;
        this.points = [];

        this.heartbeatProcesors = {};
    }

    generatePoints(startCoords, heartBeatRadius, borderLimit) {
        var points = [];

        var countCircles = (radius) => {
            return Math.floor(2 * Math.PI * radius / (heartBeatRadius));
        };

        var bigCircles = Math.ceil(borderLimit / heartBeatRadius / 2);

        if(config.debug) {
            var colors  = [
                 '#ff0000',
                 '#00ff00',
                 '#0000ff'
             ];
        }

        var point = {
            latitude: startCoords.latitude,
            longitude: startCoords.longitude
        };
        for(var ci = 0; ci < bigCircles; ci++) { // Circle index
            var radius = ci * heartBeatRadius;
            var circles = countCircles(radius);
            var degreeStep = 360 / circles;

            if(ci > 0) {
                point = geolib.computeDestinationPoint({
                    lat: point.latitude,
                    lng: point.longitude
                }, this.settings.heartbeatRadius * 1.5, 270);
            } else {
                point = geolib.computeDestinationPoint({
                    lat: point.latitude,
                    lng: point.longitude
                }, 0, 0);

                var p = {
                    latitude: point.latitude,
                    longitude: point.longitude
                };

                if(config.debug) {
                    p.scolor = '#000'; // Stroke color
                    p.fcolor = '#000'; // Fill color
                }

                points.push(p);
            }

            for (var i = 0; i < circles; i++) {
                point = geolib.computeDestinationPoint({
                    lat: point.latitude,
                    lng: point.longitude
                }, this.settings.heartbeatRadius * 1.5, degreeStep * i);

                var p = {
                    latitude: point.latitude,
                    longitude: point.longitude
                };

                if(config.debug) {
                    var d_channel = Math.floor((255 * i / circles)).toString(16);
                    p.scolor = colors[ci%colors.length];
                    p.fcolor = '#' + d_channel + d_channel + d_channel;
                }

                points.push(p);
            }
        }
        return points;
    }

    login() {
        var self = this;
        var p = (resolve, reject) => {
            self.api.init(
                this.settings.login,
                this.settings.password,
                {
                    type: 'coords',
                    coords: {
                        latitude: this.settings.center.latitude,
                        longitude: this.settings.center.longitude,
                        altitude: 150
                    }
                },
                'ptc',
                (err) => {
                    if (err) {
                        reject(err);
                        return;
                    } else {
                        this.initialized = true;
                        resolve();
                        return;
                    }
                }
            );
        }
        return new Promise(p);
    }

    init() {
        this.login().then(() => {
            this.points = this.generatePoints(
                this.settings.center,
                this.settings.heartbeatRadius,
                this.settings.radarLimitRadius
            );
            this.failedLogins = 0;
            _radar(this);
        }).catch((err) => {
            console.log(err);
            if(this.failedLogins > 5) {
                this.api.GetAccessToken(this.settings.login, this.settings.password, () => {
                    console.log('Regained token');
                    this.api.GetApiEndpoint((err, api_endpoint) => {
                        if (err) {
                            console.error('GetApiPoint: ' + err);
                        }
                    });
                });
            }
            this.failedLogins++;
            setTimeout(this.init.bind(this), 10000);
        });
    }

    heartbeat() {
        var promise = (resolve, reject) => {
            this.api.Heartbeat((err, res) => {
                if (err || !res || !res.cells) {
                    console.error(err);
                    reject(err);
                    return;
                }

                _processHeartbeat(res, this);

                resolve(res);
            });
        }
        return new Promise(promise);
    }

    addProcesor(cell_type, callback) {
        if(!this.heartbeatProcesors[cell_type]) {
            this.heartbeatProcesors[cell_type] = [callback];
        } else {
            this.heartbeatProcesors[cell_type].push(callback);
        }
    }
}

function _radar(service) {
    if(!service.points[service.actualPoint])
        throw new Error('Point ' + service.actualPoint + ' not found');

    if(!service.points[service.actualPoint].longitude)
        throw new Error('Point ' + service.actualPoint + ' not valid');

    if(config.debug)
        console.log(service.settings.login + ': Scanning point ' + (service.actualPoint+1) + ' of ' + service.points.length + '(' + service.points[service.actualPoint].latitude + ', ' + service.points[service.actualPoint].longitude + ')')

    service.api.SetLocation({
        type: 'coords',
        coords: {
            latitude: service.points[service.actualPoint].latitude,
            longitude: service.points[service.actualPoint].longitude,
            altitude: 150
        }
    }, (err) => {
        if(err) {
            setTimeout(() => {_radar(service)}, service.settings.scanTimeout);
            throw new Error(err);
        }

        service.heartbeat().then((res) => {
            if(service.actualPoint < (service.points.length-1)) {
                service.actualPoint++;
            } else {
                service.actualPoint = 0;
            }

            service.emptyResponses = 0;

            setTimeout(() => { _radar(service) }, service.settings.scanTimeout);
        }).catch(err => {
            if(service.emptyResponses > 2) {
                service.init().then(() => {
                    service.emptyResponses = 0;
                }).catch((err) => {
                    console.log('Failed reinitialization ' + err);
                });
                setTimeout(() => {_radar(service)}, 10000);
            } else {
                console.error(err + ', replaning scan');
                service.emptyResponses++;
                setTimeout(() => {_radar(service)}, service.settings.scanTimeout);
            }
        });
    });
}

function _processHeartbeat(res, service) {
    var pokemons = [];
    for (var i in res.cells) {
        var cell = res.cells[i];
        for(var i in service.heartbeatProcesors) {
            if(!cell[i] || !cell[i].length)
                continue;

            for(var p in service.heartbeatProcesors[i]) {
                var procesor = service.heartbeatProcesors[i][p];

                for(var c in cell[i]) {
                    procesor(cell[i][c]).then(result => {

                    }).catch(err => {

                    });
                }
            }
        }
    }
    return pokemons;
}

export default Radar;
