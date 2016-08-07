import PokemonModel from '../../model/pokemon';
import conf from '../../conf';

var pokemonProcesor = function(data) {
    var promise = (resolve, reject) => {
        if (data.TimeTillHiddenMs > 16000000) { // Weird permanent pokemons
            console.log('Permanent pokemon');
            return;
        }

        var despawn = new Date();
        despawn.setSeconds(despawn.getSeconds() + Math.floor(Math.abs(data.TimeTillHiddenMs) / 1000));

        var pokemon = {
            longitude: data.Longitude,
            latitude: data.Latitude,
            spawn_id: data.SpawnPointId,
            type: data.pokemon.PokemonId,
            despawn: despawn,
            scanned: new Date()
        };

        PokemonModel.add(pokemon);
        if(conf.debug) {
            pokemons.push(pokemon);
            debugReporter();
        }
        resolve(true);
    }
    return new Promise(promise);
};

var pokemons = [];
var debugging = 0;
var interval = null;
var debugReporter = function() {
    if(debugging == 0) {
        debugging = +new Date();
    }
    if(+new Date() - debugging > 3600000) {
        pokemons = [];
        debugging = +new Date();
    }
    console.log('Processing ' + ((pokemons.length / (+new Date() - debugging)) * 60000) + ' per minute');

    if(!interval)
        interval = setInterval(debugReporter, 10000);
};

export default pokemonProcesor;