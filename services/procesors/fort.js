import PokeStop from '../../model/pokestop';

var pokestopProcesor = function(data) {
    var promise = (resolve, reject) => {
        PokeStop.add(data);
        resolve(true);
    };
    return new Promise(promise);
};

export default pokestopProcesor;