import PokemonModel from '../../model/pokemon';

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
        resolve(true);
    }
    return new Promise(promise);
};

export default pokemonProcesor;