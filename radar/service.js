var api = require('./poke.io.js');
var geolib = require('geolib');

import PokemonModel from '../model/pokemon';
import config from '../conf.js';

const service = {
    initialized : false,
    constants: config.radar,
    actualPoint: 0,
    points: [],
    pokemons: [],

    generatePoints: function(startCoords, heartBeatRadius, borderLimit) {
        var points = [];

        var countCircles = (radius) => {
            return Math.floor(2 * Math.PI * radius / (heartBeatRadius));
        };

        var bigCircles = Math.ceil(borderLimit / heartBeatRadius / 2);

        /*var colors  = [
            '#ff0000',
            '#00ff00',
            '#0000ff'
        ]; DEBUG ONLY
        */

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
                }, this.constants.heartbeatRadius * 1.5, 270);
            } else {
                point = geolib.computeDestinationPoint({
                    lat: point.latitude,
                    lng: point.longitude
                }, 0, 0);
                points.push({latitude: point.latitude, longitude: point.longitude /*, DEBUG ONLY scolor: '#000', fcolor: '#000'*/});
            }

            for (var i = 0; i < circles; i++) {
                //var d_channel = Math.floor((255 * i/circles)).toString(16); DEBUG ONLY

                point = geolib.computeDestinationPoint({
                    lat: point.latitude,
                    lng: point.longitude
                }, this.constants.heartbeatRadius * 1.5, degreeStep * i);

                points.push({latitude: point.latitude, longitude: point.longitude /*,DEBUG ONLY scolor: colors[ci%colors.length], fcolor: '#' + d_channel + d_channel + d_channel*/});
            }
        }
        return points;
    },

    init: function() {
        api.init(
            this.constants.login,
            this.constants.password,
            {
                type: 'coords',
                coords: {
                    latitude: this.constants.center.latitude,
                    longitude: this.constants.center.longitude,
                    altitude: 150
                }
            },
            'ptc',
            (err) => {
                if(err)
                    console.log(err)
                else
                    this.initialized = true;
            }
        );

        this.points = service.generatePoints(
            this.constants.center,
            this.constants.heartbeatRadius,
            this.constants.radarLimitRadius
        );
        this._radar();
    },
    _radar: function() {
        if(!this.points[this.actualPoint])
            throw new Error('Point ' + this.actualPoint + ' not found');

        if(!this.points[this.actualPoint].longitude)
            throw new Error('Point ' + this.actualPoint + ' not valid');

        console.log('Scanning point ' + (this.actualPoint+1) + ' of ' + this.points.length + '(' + this.points[this.actualPoint].latitude + ', ' + this.points[this.actualPoint].longitude + ')')
        api.SetLocation({
            type: 'coords',
            coords: {
                latitude: this.points[this.actualPoint].latitude,
                longitude: this.points[this.actualPoint].longitude,
                altitude: 150
            }
        }, (err) => {
            if(err) {
                setTimeout(this._radar.bind(this), this.constants.scanTimeout);
                throw new Error(err);
            }

            this.heartbeat().then((pokemons) => {
                if(this.actualPoint < (this.points.length-1)) {
                    this.actualPoint++;
                } else {
                    this.actualPoint = 0;
                }

                //this.pokemons = this.pokemons.concat(pokemons);

                for(var i in pokemons) {
                    PokemonModel.add(pokemons[i]);
                }

                console.log('Found ' + pokemons.length + ' pokemons');
                setTimeout(this._radar.bind(this), this.constants.scanTimeout);
            }).catch(err => {
                //console.err(err);
                console.error(err + ', replaning scan');
                setTimeout(this._radar.bind(this), this.constants.scanTimeout);
            });
        });
    },
    heartbeat: function() {
        var pokemons = [];
        var promise = (resolve, reject) => {
            api.Heartbeat((err, res) => {
                if (err) {
                    console.error(err);
                    reject(err);
                }

                pokemons = this._processHeartbeat(res);

                resolve(pokemons);
            });
        }
        return new Promise(promise);
    },
    _processHeartbeat: function(res) {
        var pokemons = [];
        for (var i in res.cells) {
            var cell = res.cells[i];
            if (cell.WildPokemon && cell.WildPokemon.length > 0) {
                for(var p in cell.WildPokemon) {

                    var despawn = new Date();
                    despawn.setSeconds(despawn.getSeconds() + Math.floor(Math.abs(cell.WildPokemon[p].TimeTillHiddenMs)/1000));

                    var pokemon = {
                        longitude: cell.WildPokemon[p].Longitude,
                        latitude: cell.WildPokemon[p].Latitude,
                        spawn_id: cell.WildPokemon[p].SpawnPointId,
                        type: cell.WildPokemon[p].pokemon.PokemonId,
                        despawn: despawn,
                        scanned: new Date()
                    };

                    pokemons.push(pokemon);
                }
            }
        }
        return pokemons;
    }
};

service.init();

export default service;
