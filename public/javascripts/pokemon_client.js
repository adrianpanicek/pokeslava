var pokemon_client = {
    pokemons: {},

    addMarkerForPokemon: function(pokemon, index) {
        if(+Date.parse(pokemon.despawn) > +new Date() + 16000000) { // Temporary hide weird permanent pokemons
            return pokemon;
        }
        var icon = {
            url: '/images/icons/' + pokemon.type + '.png', // url
            scaledSize: new google.maps.Size(38, 38), // scaled size
            origin: new google.maps.Point(0, 0), // origin
            anchor: new google.maps.Point(19, 19) // anchor
        };

        pokemon.marker = new google.maps.Marker({
            position: {
                lat: pokemon.latitude,
                lng: pokemon.longitude
            },
            map: map,
            icon: icon
        });
        pokemon.infoWindow = new google.maps.InfoWindow({
            content: '<h3 class="pokemon-name">' + pokemon.name + '</h3>'
            + '<small class="despawn-counter" data-pokemon-id="'+index+'">' + this.timeTillDespawn(Date.parse(pokemon.despawn)) + '</small>'
        });
        pokemon.marker.addListener('click', function() {
            pokemon.infoWindow.open(map, pokemon.marker);
        });
        return pokemon;
    },

    fetchData: function(callback) {
        $.get('/pokemons', {}, callback);
    },

    reload: function() {
        var self = this;
        this.fetchData(function(data) {
            var found = {};
            for(var i in self.pokemons) {
                for(var d in data) {
                    if(data[d]._id == self.pokemons[i]._id) {
                        found[self.pokemons[i]._id] = true;
                        break;
                    }
                }
                if(!found[self.pokemons[i]._id])
                    self.pokemons[i].marker.setMap(null);
            }
            for(var d in data) {
                if(found[data[d]._id])
                    continue;

                self.pokemons[data[d]._id] = data[d];
                self.pokemons[data[d]._id] = self.addMarkerForPokemon(self.pokemons[data[d]._id], data[d]._id);
            }

            setTimeout(self.reload.bind(self), 10000);
        });
    },

    timeTillDespawn: function(despawn) {
        var tseconds = Math.floor((+despawn - +new Date()) / 1000);
        var seconds = tseconds % 60; // seconds left in minute
        var minutes = Math.floor(tseconds / 60);
        return minutes + ":" + ((seconds < 10)? '0': '') + seconds + "s";
    },

    findPokemon: function(pokemons, id) {
        if (this.pokemons[id])
            return this.pokemons[id];

        return null;
    },

    reloadCounters: function() {
        var self = this;
        $('.despawn-counter').each(function() {
            var pokemon_id = $(this).attr('data-pokemon-id');
            if(!pokemon_id)
                return;

            var pokemon = self.findPokemon(self.pokemons, pokemon_id);
            if(!pokemon)
                return;

            var despawn_date = Date.parse(pokemon.despawn);
            var time = self.timeTillDespawn(despawn_date);
            $(this).text(time);
        });
        setTimeout(this.reloadCounters.bind(this), 1000);
    }
}

$(document).ready(function() {
    pokemon_client.reload();
    pokemon_client.reloadCounters();
});