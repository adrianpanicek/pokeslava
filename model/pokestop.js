import database from './db';

const PokeStopModel = {
    collection: null,
    add: function(pokestop) {
        var find = {
            _id: pokestop.FortId
        };

        pokestop._id = pokestop.FortId;
        if(pokestop.LureInfo)
            pokestop.LureInfo.LureExpiresTimestampMs = pokestop.LureInfo.LureExpiresTimestampMs.toString();

        this.collection.update(find, pokestop, {upsert: true});
    },
    list: function() {
        var p = (resolve, reject) => {
            this.collection.find().toArray(function(err, pokemons) {
                if(err) reject(err);
                resolve(pokemons);
            });
        };
        return new Promise(p);
    }
};

database((connection) => {
    connection.createCollection('pokestop').then((collection) => {
        PokeStopModel.collection = collection;
    });
});

export default PokeStopModel;