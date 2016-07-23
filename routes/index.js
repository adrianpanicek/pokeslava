var express = require('express');
var router = express.Router();

import PokemonModel from '../model/pokemon';
import {pokemonNames} from '../const';

router.get('/', function(req, res, next) {
    res.render('index', { title: 'PokéSlava.sk mapa pokémonov v Bratislave'});
});

router.get('/pokemons', function(req, res, next) {
    PokemonModel.list().then((pokemons) => {
        var spokemons = {};
        for(var i in pokemons) {
            pokemons[i].name = pokemonNames
        }
        res.send(pokemons);
    });
});

module.exports = router;
