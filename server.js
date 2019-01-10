var express = require('express');
var request = require('request');
var app = express();
var geohash = require('ngeohash');
var moment = require('moment');
var SpotifyWebApi = require('spotify-web-api-node');
var numeral = require('numeral');


var ticket_key = "apikey=3uRJQp208wxh3Y75zLRg0ZjoTinYAYXm";
var spotifyApi = new SpotifyWebApi({
    clientId: '895b291981534f3daff6d82201008636',
    clientSecret: 'bdedb4310d894b389943977780554bd1',
});

app.use(express.static('public'));

app.get('/', function (req, res) {
   res.send('Hello World');
});

app.get('/autocomplete', function(req, res) {
    // console.log(req.query);
    var url = "https://app.ticketmaster.com/discovery/v2/suggest?apikey=3uRJQp208wxh3Y75zLRg0ZjoTinYAYXm&keyword="+req.query.keyword;
    var data = [];
    if (req.query.keyword == "") {
        res.send(data); 
        res.end();
        return;
    }
    request(url, function (error, response, body) {
        if (!error && response.statusCode == 200) {
            body = JSON.parse(body);
            if (body['_embedded'] != undefined && body['_embedded'].attractions != undefined) {
                for (var i = 0; i < body._embedded.attractions.length; i++) {
                    data.push(body._embedded.attractions[i].name);
                }
            }
        }
        res.send(data);
        res.end();
    });
});

app.get('/searchResult', function(req, res) {
    new Promise(function(resolve, reject) {
        // check whether provide specific location
        google_location(resolve);
      }).then(function() {
        // do ticketmaster search
        ticketmaster_search();
      });


    function google_location (resolve) {
        if (req.query.form_where == 'loc_other') {
            var geolocation_prefix = "https://maps.googleapis.com/maps/api/geocode/json?address=";
            var geolocation_key = "&key=AIzaSyDv2FLoT33RpapdfmXrrh1hGxrI1NclPUI";
            var text_location_value = req.query.form_location.replace(/\s/g, "+");;
            var geolocation_url = geolocation_prefix + text_location_value + geolocation_key;
            request(geolocation_url, function (error, response, body) {
                if (!error && response.statusCode == 200) {
                    body = JSON.parse(body);
                    if (body.results != undefined && body.results[0] != undefined 
                        && body.results[0].geometry != undefined && body.results[0].geometry.location != undefined) {
                            req.query.form_lat = body.results[0].geometry.location.lat.toString();
                            req.query.form_lon = body.results[0].geometry.location.lng.toString();
                    }
                    console.log("google_location", body);
                }
                console.log("req.query", req.query);
                resolve(1);
            });
    
        } else {
            resolve(1);
        }
    }

    function ticketmaster_search () {
        console.log("req.query", req.query);
        console.log(req.url);
        var ticket_prefix = "https://app.ticketmaster.com/discovery/v2/events.json?";
        var ticket_geoPoint = "geoPoint="+geohash.encode(req.query.form_lat, req.query.form_lon);
        var ticket_keyword = "&keyword="+req.query.form_keyword;
        var ticket_segmentid = "&segmentId="+req.query.form_category;
        var ticket_radius = "&radius="+req.query.form_distance;
        var ticket_unit = "&unit="+req.query.form_dis_unit;
        var ticket_url = ticket_prefix+ticket_geoPoint+ticket_keyword+ticket_segmentid+ticket_radius+ticket_unit+"&"+ticket_key;
        console.log(ticket_url);
        var data = [];
        request(ticket_url, function (error, response, body) {
            if (!error && response.statusCode == 200) {
                body = JSON.parse(body);
                if (body._embedded != undefined && body._embedded.events != undefined) {
                    var obj = body._embedded.events;
                    for (var i = 0; i < obj.length; i++) {
                        data[i] = {};
                        if (obj[i].dates.start.localDate != undefined) data[i].date = obj[i].dates.start.localDate;
                        if (obj[i].name != undefined) {
                            data[i].event = obj[i].name;
                            if (obj[i].name.length > 35) {
                                data[i].event_show = obj[i].name.substring(0, 35)+" ...";
                            } else {
                                data[i].event_show = obj[i].name;
                            }
                        }
                        if (obj[i].classifications != undefined) {
                            data[i].category = "";
                            if (obj[i].classifications[0].genre != undefined && obj[i].classifications[0].genre.name.toLowerCase() != "undefined") {
                                data[i].category = obj[i].classifications[0].genre.name;
                            }
                            if (data[i].category != undefined && data[i].category.length > 0) data[i].category += "-";
                            if (obj[i].classifications[0].segment != undefined && obj[i].classifications[0].segment.name.toLowerCase() != "undefined") {
                                data[i].category += obj[i].classifications[0].segment.name;
                            }
                        }
                        if (obj[i]._embedded != undefined) data[i].venue = obj[i]._embedded.venues[0].name;
                        if (obj[i].id != undefined) data[i].id = obj[i].id;
                    }
                }
            }
            // console.log(data);
            res.send(data);
            res.end();
        });
    }
});

app.get('/detailResult', function(req, res) {
    console.log(req.url);
    var ticket_detail = "https://app.ticketmaster.com/discovery/v2/events/";
    var ticket_url = ticket_detail+req.query.event_id+"?"+ticket_key;
    console.log(ticket_url);
    var data = {};
    request(ticket_url, function (error, response, body) {
        if (!error && response.statusCode == 200) {
            var obj = JSON.parse(body);
            data.event = {};
            data.team = [];
            if (obj.name != undefined) data.name = obj.name;
            // event part
            if (obj._embedded.attractions != undefined) {
                data.event.team = {};
                data.event.team.title = "Artist/Team(s)";
                data.event.team.value = "";
                for (var i = 0; i < obj._embedded.attractions.length; i++) {
                    if (data.event.team.value.length > 0) data.event.team.value += " | ";
                    data.event.team.value += obj._embedded.attractions[i].name;
                    data.team[i] = obj._embedded.attractions[i].name;
                }
            }
            if (obj._embedded.venues != undefined) {
                data.event.venue = {};
                data.event.venue.title = "Venue";
                data.event.venue.value = obj._embedded.venues[0].name;
            }
            if (obj.dates.start.localDate != undefined) {
                data.event.time = {};
                data.event.time.title = "Time";
                data.event.time.value = moment(obj.dates.start.localDate, "YYYY-MM-DD").format("MMM DD, YYYY");
            }
            if (obj.dates.start.localTime != undefined) {
                data.event.time.value += "  "+obj.dates.start.localTime;
            }
            if (obj.classifications != undefined) {
                data.event.category = {};
                data.event.category.title = "Category";
                data.event.category.value = "";
                if (obj.classifications[0].subGenre != undefined && obj.classifications[0].subGenre.name.toLowerCase() != "undefined") {
                    data.event.category.value = obj.classifications[0].subGenre.name;
                }
                if (obj.classifications[0].genre != undefined && obj.classifications[0].genre.name.toLowerCase() != "undefined") {
                    if (data.event.category.value.length > 0) data.event.category.value += " | ";
                    data.event.category.value += obj.classifications[0].genre.name;
                }
                if (obj.classifications[0].segment != undefined && obj.classifications[0].segment.name.toLowerCase() != "undefined") {
                    if (data.event.category.value.length > 0) data.event.category.value += " | ";
                    data.event.category.value += obj.classifications[0].segment.name;
                    data.category = obj.classifications[0].segment.name;
                }
                if (obj.classifications[0].subType != undefined && obj.classifications[0].subType.name.toLowerCase() != "undefined") {
                    if (data.event.category.value.length > 0) data.event.category.value += " | ";
                    data.event.category.value += obj.classifications[0].subType.name;
                }
                if (obj.classifications[0].type != undefined && obj.classifications[0].type.name.toLowerCase() != "undefined") {
                    if (data.event.category.value.length > 0) data.event.category.value += " | ";
                    data.event.category.value += obj.classifications[0].type.name;
                }
            }
            if (obj.priceRanges != undefined) {
                data.event.price = {};
                data.event.price.title = "Price";
                if (obj.priceRanges[0].min != undefined) {
                    data.event.price.value = "$" + obj.priceRanges[0].min;
                    if (obj.priceRanges[0].max != undefined) {
                        data.event.price.value += " - $" + obj.priceRanges[0].max;
                    }
                } else if (obj.priceRanges[0].max != undefined) {
                    data.event.price.value = "$" + obj.priceRanges[0].max;
                }
            }
            if (obj.dates.status != undefined) {
                data.event.status = {};
                data.event.status.title = "Ticket Status";
                data.event.status.value = obj.dates.status.code;
            }
            if (obj.url != undefined) {
                data.event.url = {};
                data.event.url.title = "Buy Ticket At";
                data.event.url.value = obj.url;
            }
            if (obj.seatmap != undefined) {
                data.event.map = {};
                data.event.map.title = "Seat Map";
                data.event.map.value = obj.seatmap.staticUrl;
            }
        }
        // console.log(data);
        res.send(data);
        res.end();
    });
});

app.get('/teamResult_spotify', function(req, res) {
    // console.log(req.query);
    var data = {};
    data.index = req.query.index;
    spotifyApi.clientCredentialsGrant().then(
        function(spotify_data) {
            console.log('The access token expires in ' + spotify_data.body['expires_in']);
            // Save the access token so that it's used in future calls
            spotifyApi.setAccessToken(spotify_data.body['access_token']);
            spotifyApi.searchArtists(req.query.team).then(
                function(spotify_data) {
                    if (spotify_data.body.artists != undefined && spotify_data.body.artists.items != undefined) {
                        var obj = spotify_data.body.artists.items;
                        for (var i = 0; i < obj.length; i++) {
                            if (obj[i].name.toLowerCase() == req.query.team.toLowerCase()) {
                                data.name = req.query.team;
                                data.follower = numeral(obj[i].followers.total).format('0,0');
                                data.popularity = obj[i].popularity;
                                data.url = obj[i].external_urls.spotify;
                                break;
                            }
                        }
                    }
                    console.log(data);
                    res.send(data);
                    res.end()
                },
                function(err) {
                    console.error('Spotify search error', err);
                }
            );
        },
        function(err) {
            console.log('Spotify token error', err);
        }
    );
});

app.get('/teamResult_google', function(req, res) {
    // console.log(req.query);
    var data = {};
    data.index = req.query.index;
    var param = "&cx=014009795432502317208:eijfnspucju&imgSize=huge&imgType=news&num=8&searchType=image&key=AIzaSyC1iNWoRBK86cY-R5c4gIjuUAjba8rDMFA";
    var url = "https://www.googleapis.com/customsearch/v1?q="+encodeURI(req.query.team)+param;
    // console.log(url);
    request(url, function (error, response, body) {
        if (!error && response.statusCode == 200) {
            body = JSON.parse(body);
            if (body.items != undefined) {
                data.photo = [];
                for (var i = 0; i < body.items.length; i++) {
                    data.photo.push(body.items[i].link);
                }
            }
        }
        // console.log(data);
        res.send(data);
        res.end()
    });
});


app.get('/venueResult', function(req, res) {
    // console.log(req.query);
    var url = "https://app.ticketmaster.com/discovery/v2/venues?"+ticket_key+"&keyword="+encodeURI(req.query.venue);
    var data = {};
    data.name = req.query.venue;
    data.data = {};
    // console.log(url);
    request(url, function (error, response, body) {
        if (!error && response.statusCode == 200) {
            body = JSON.parse(body);
            if (body._embedded != undefined && body._embedded.venues != undefined) {
                var obj = body._embedded.venues;
                if (obj[0].location != undefined && obj[0].location.longitude != undefined) {
                    data.lon = obj[0].location.longitude;
                }
                if (obj[0].location != undefined && obj[0].location.latitude != undefined) {
                    data.lat = obj[0].location.latitude;
                }
                if (obj[0].address != undefined) {
                    data.data.address = {};
                    data.data.address.title = "Address";
                    data.data.address.value = obj[0].address.line1;
                } 
                if (obj[0].city != undefined) {
                    data.data.city = {};
                    data.data.city.title = "City";
                    data.data.city.value = obj[0].city.name;
                    if (obj[0].state != undefined) {
                        data.data.city.value += ", "+obj[0].state.stateCode;
                    }
                }    
                if (obj[0].boxOfficeInfo != undefined && obj[0].boxOfficeInfo.phoneNumberDetail != undefined) {
                    data.data.phone = {};
                    data.data.phone.title = "Phone Number";
                    data.data.phone.value = obj[0].boxOfficeInfo.phoneNumberDetail;
                }
                if (obj[0].boxOfficeInfo != undefined && obj[0].boxOfficeInfo.openHoursDetail != undefined) {
                    data.data.hour = {};
                    data.data.hour.title = "Open Hours";
                    data.data.hour.value = obj[0].boxOfficeInfo.openHoursDetail;
                }
                if (obj[0].generalInfo != undefined && obj[0].generalInfo.generalRule != undefined) {
                    data.data.generalrule = {};
                    data.data.generalrule.title = "General Rule";
                    data.data.generalrule.value = obj[0].generalInfo.generalRule;
                }
                if (obj[0].generalInfo != undefined && obj[0].generalInfo.childlRule != undefined) {
                    data.data.childrule = {};
                    data.data.childrule.title = "Child Rule";
                    data.data.childrule.value = obj[0].generalInfo.childlRule;
                }
            }
        }
        // console.log(data);
        res.send(data);
        res.end();
    });
});

app.get('/upcomingResult', function(req, res) {
    // console.log(req.query);
    var venue_url = "https://api.songkick.com/api/3.0/search/venues.json?query="+encodeURI(req.query.venue)+"&apikey=e8wCXg57Ber4xpYk";
    var data = [];
    // console.log(venue_url);
    request(venue_url, function (error, response, body) {
        if (!error && response.statusCode == 200) {
            body = JSON.parse(body);
            if (body.resultsPage != undefined && body.resultsPage.results != undefined && body.resultsPage.results.venue != undefined) {
                var id = body.resultsPage.results.venue[0].id;
                var upcoming_url = "https://api.songkick.com/api/3.0/venues/"+id+"/calendar.json?apikey=e8wCXg57Ber4xpYk";
                // console.log(upcoming_url);
                request(upcoming_url, function (error, response, body) {
                    if (!error && response.statusCode == 200) {
                        body = JSON.parse(body);
                        if (body.resultsPage != undefined && body.resultsPage.results != undefined && body.resultsPage.results.event != undefined) {
                            var obj = body.resultsPage.results.event;
                            for (var i = 0; i < obj.length; i++) {
                                data[i] = {};
                                if (obj[i].displayName != undefined) {
                                    data[i].name = obj[i].displayName;
                                }
                                if (obj[i].performance != undefined) {
                                    data[i].artist = "";
                                    for (var j = 0; j < obj[i].performance.length; j++) {
                                        if (data[i].artist.length > 0) data[i].artist += ", ";
                                        data[i].artist += obj[i].performance[j].displayName;
                                    }
                                }
                                if (obj[i].start != undefined ) {
                                    data[i].date = "";
                                    if (obj[i].start.date != undefined) {
                                        data[i].date = moment(obj[i].start.date, "YYYY-MM-DD").format("MMM DD, YYYY");
                                    }
                                    if (obj[i].start.time != undefined) {
                                        data[i].date += " " + obj[i].start.time;
                                    }
                                }
                                if (obj[i].type != undefined) {
                                    data[i].type = obj[i].type;
                                }
                                if (obj[i].uri != undefined) {
                                    data[i].url = obj[i].uri;
                                }
                            }
                        }
                    }
                    // console.log(data);
                    res.send(data);
                    res.end();
                });
            } else {
                res.send(data);
                res.end();
            }
        }
    });
});


var server = app.listen(8081, function () {
   var host = server.address().address;
   var port = server.address().port;

   console.log("Example app listening at http://%s:%s", host, port);
})