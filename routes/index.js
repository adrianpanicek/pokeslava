var express = require('express');
var router = express.Router();

import PokemonModel from '../model/pokemon';
import PokeStopModel from '../model/pokestop';
import config from '../conf';
import {pokemonNames} from '../const';

router.get('/', function(req, res, next) {
    res.render('index', {
        title: 'PokéSlava.sk mapa pokémonov v Bratislave',
        maintenance: config.maintenance
    });
});

router.get('/pokestops', function(req, res, next) {
    PokeStopModel.list().then(pokestops => {
        res.send(pokestops);
    });
});

router.get('/pokemons', function(req, res, next) {
    PokemonModel.list().then((pokemons) => {
        for(var i in pokemons) {
            pokemons[i].name = pokemonNames[pokemons[i].type];
        }
        res.send(pokemons);
    });
});

module.exports = router;
