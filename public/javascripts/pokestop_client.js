var pokestop_client = {
    pokestops: {},

    addMarkerForPokeStop: function(pokestop, index) {
        var icon_image = '/images/pokestop.png';
        var text = false;
        if(pokestop.LureInfo) {
            var date = new Date(pokestop.LureInfo.LureExpiresTimestampMs*1)
            if(+date < +new Date() && +date > +new Date() + 1600000) { // sometimes lure modules drop weird dates
                text = false;
            } else {
                icon_image = '/images/lure.png';
                var minutes = date.getMinutes();
                var seconds = date.getSeconds();
                text = 'Lure platný do: ' + date.getHours() + ':' +
                    ((minutes < 10)? "0" + minutes : minutes) + ':' +
                    ((seconds < 10)? "0" + seconds : seconds);
            }
        }

        var icon = {
            url: icon_image, // url
            scaledSize: new google.maps.Size(12, 12), // scaled size
            origin: new google.maps.Point(0, 0), // origin
            anchor: new google.maps.Point(6, 6) // anchor
        };

        pokestop.marker = new google.maps.Marker({
            position: {
                lat: pokestop.Latitude,
                lng: pokestop.Longitude
            },
            map: map,
            icon: icon
        });

        if(text) {
            pokestop.infoWindow = new google.maps.InfoWindow({
                content: '<h3 data-pokestop-id="' + index + '">' + text + '</h3>'
            });
        }

        pokestop.marker.addListener('click', function() {
            pokestop.infoWindow.open(map, pokestop.marker);
        });

        return pokestop;
    },

    fetchData: function(callback) {
        $.get('/pokestops', {}, callback);
    },

    reload: function() {
        var self = this;
        this.fetchData(function(data) {
            var found = {};
            for(var i in self.pokestops) {
                for(var d in data) {
                    if(data[d]._id == self.pokestops[i]._id) {
                        found[self.pokestops[i]._id] = true;
                        break;
                    }
                }
                if(!found[self.pokestops[i]._id])
                    self.pokestops[i].marker.setMap(null);
            }
            for(var d in data) {
                if(found[data[d]._id])
                    continue;

                self.pokestops[data[d]._id] = data[d];
                self.pokestops[data[d]._id] = self.addMarkerForPokeStop(self.pokestops[data[d]._id], data[d]._id);
            }

            setTimeout(self.reload.bind(self), 20000);
        });
    }
}

$(document).ready(function() {
    pokestop_client.reload();

    google.maps.event.addListener(map, 'zoom_changed', function() {
        var zoom = map.getZoom();
        // set visibility depending on zoom level
        for(var i in pokestop_client.pokestops) {
            pokestop_client.pokestops[i].marker.setVisible(zoom >= 15);
        }
    });
});