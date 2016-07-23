var MongoClient = require('mongodb').MongoClient;

const connection = {
    host: 'localhost',
    port: 27017,
    database: 'pokemon',

    instance: null,
    _collections: {
    },
    addCollection: function(name, parameters = {}) {
        var p = (resolve, reject) => {
            parameters.strict = true;

            db.createCollection(name, parameters, (err, collection) => {
                this._collections[name] = collection;
                resolve(collection);
            })
        };
        return new Promise(p);
    }
};

function database(callback) {
    if(connection.instance) {
        callback(connection);
    } else {
        MongoClient.connect('mongodb://' + connection.host + ':' + connection.port + '/' + connection.database, function(err, conn) {
            if (err) throw new Error(err);
            connection.instance = conn;
            callback(conn);
        });
    }
}

export default database;