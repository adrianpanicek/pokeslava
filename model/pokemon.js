import database from './db';

const PokemonModel = {
    collection: null,
    add: function(pokemon) {
        var find = {
            spawn_id: pokemon.spawn_id
        };

        this.collection.update(find, pokemon, {upsert: true});
    },
    list: function() {
        var p = (resolve, reject) => {
            var pokemons = this.collection.find({
                despawn: { $gt: new Date() }
            }).toArray(function(err, pokemons) {
                if(err) reject(err);
                resolve(pokemons);
            });
        };
        return new Promise(p);
    }
};

database((connection) => {
    connection.createCollection('pokemon').then((collection) => {
        PokemonModel.collection = collection;

        collection.createIndex({type: 1});
        collection.createIndex({despawn: 1});

        collection.getIndexes();
        for(var i in indexes) {
            console.log(indexes[i]);
        }
    });
});

export default PokemonModel;