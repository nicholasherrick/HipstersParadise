var firebaseConfig = {
    apiKey: "AIzaSyDlFw-SrUXQdgRDqUvTkPZcwQm-tgIIgAw",
    authDomain: "hipsters-paradise.firebaseapp.com",
    databaseURL: "https://hipsters-paradise.firebaseio.com",
    projectId: "hipsters-paradise",
    storageBucket: "hipsters-paradise.appspot.com",
    messagingSenderId: "343184641394",
    appId: "1:343184641394:web:45d963e7f2ac119f2421eb"
};
firebase.initializeApp(firebaseConfig);
database = firebase.database();


function getMapData(search) {
    var url = "https://nominatim.openstreetmap.org/?format=json&limit=1&addressdetails=1&countrycodes=US&q="
    var queryTerm = '';
    for (let i = 0; i < search.length; i++) {
        if (search[i] === ' ') {
            queryTerm += '+';
        } else {
            queryTerm += search[i].toLowerCase();
        }
    }
    $.ajax({
        type: "GET",
        url: url + queryTerm,
        success: function (response) {
            if (response[0] !== undefined && response[0].address.city) {
                console.log(response);
                var city = response[0].address.city;
                //var postcode = response[0].address.postcode;
                var state = response[0].address.state;
                var lat = response[0].lat;
                var lon = response[0].lon;

                database.ref('search').push({
                    searchTerm: search,
                    city: city,
                    //postcode: postcode,
                    state: state,
                    lat: lat,
                    lon: lon
                });
                findSuggest(lat + "," + lon);
                getBreweriesByCity(city);
            } else {
                console.log(response);
                console.log('Incorrect search');
                findSuggest(0);
            }
        },
        error: function (xhr, ajaxOptions, thrownError) {
            console.log(xhr.status);
            console.log(thrownError);
        }
    });
}

$('#getLocation').on('click', function () {
    navigator.geolocation.getCurrentPosition(function (position) {
        getMapData(position.coords.latitude + ',' + position.coords.longitude);
    });
});

$("#search").keypress(function (event) {
    if (event.which == 13) {
        event.preventDefault();
        $("tbody").empty();
        getMapData($("#search").val().trim().split(" ").join("_"));
    }
});

function findSuggest(coordinates) {
    if (coordinates === 0) {
        showVenues(0);
    }
    else {
        $.ajax({
            type: "GET",
            url: "https://app.ticketmaster.com/discovery/v2/suggest.json?latlong=" + coordinates + "&apikey=G8wASZPn3DFcYGef4xr5K2DUzqvDxQJ2",
            async: true,
            dataType: "json",
            success: function (json) {
                console.log(JSON.stringify(json));
                showVenues(json);
            },
            error: function (xhr, status, err) {
                console.log(err);
            }
        });
    }
}

function showVenues(json) {
    if (json !== 0 && json._embedded.venues !== undefined) {
        var events = json._embedded.venues;
        console.log(events);

        for (var i = 0; i < events.length; i++) {
            console.log(JSON.stringify(events[i]));
            var newRow = $("<tr>").append(
                $("<td><a href=\"" + events[i].url + "\" style=\"display:block;\">" + events[i].name + "</a></td>")
            );
            $("#events > tbody").append(newRow);
        }
    }
    else {
        var newRow = $("<tr>").append(
            $("<td>0 Events Found</td>")
        );
        $("#events > tbody").append(newRow);
    }
}

function getBreweriesByCity(city) {
    var queryURL = "https://api.openbrewerydb.org/breweries?by_city=" + city + "&page=1&per_page=5";
    $.ajax({
        url: queryURL,
        method: "GET"
    }).then(function(response) {
        console.log(response);
        for (var i = 0; i < response.length; i++) {
            var newRow1 = $("<tr>").append(
                $("<td><a href=\"" + response[i].website_url + "\" style=\"display:block;\">" + response[i].name + "</a></td>")
            );
            var newRow2 = $("<tr>").append(
                $("<td>" + response[i].street + " " + response[i].postal_code + "</td>")
            );
            var newRow3 = $("<tr>").append(
                $("<td>" + response[i].phone + "</td>")
            );
            $("#brewreys").append(newRow1, newRow2, newRow3);
        }
    });
};