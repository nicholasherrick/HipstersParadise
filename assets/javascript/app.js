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

var userKey;
var currentSearch;

function getMapData(search) {
    $("#events > tbody").empty();
    $("#brewerys > tbody").empty();
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
                var state = response[0].address.state;
                var lat = response[0].lat;
                var lon = response[0].lon;

                database.ref('search').push({
                    searchTerm: search,
                    city: city,
                    state: state,
                    lat: lat,
                    lon: lon
                });
                findSuggest(lat + "," + lon);
                getBreweriesByCity(city);
            } else {
                console.log(response);
                console.log('Invalid search');
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
        currentSearch = position.coords.latitude + ',' + position.coords.longitude;
    });
});

$("#search").keypress(function (event) {
    if (event.which == 13) {
        event.preventDefault();
        validateAddress($("#search").val());
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
            $("#brewerys").append(newRow1, newRow2, newRow3);
        }
    });
};

database.ref('.info/connected').on('value', function(snapshot){
    if(snapshot.val() && !localStorage.getItem('userkey')){
        var user = database.ref('users').push(true);
        userKey = user.getKey();
        localStorage.setItem('userkey', userKey);
    } else {
        userKey = localStorage.getItem('userkey');
    }
});

$('#saveButton').on('click', function () {
    database.ref('users/' + userKey).push(currentSearch);
});

database.ref('users/' + userKey).on('child_added', function (snapshot) {
    $('#savedSearches').append('<tr><td>' + snapshot.val() + "</td><td><button class=restoreSearch data-search=" + snapshot.val() + ">Restore Search</button></tr>");
});

$(document.body).on('click', '.restoreSearch', function () {
    let search = $(this).data('search');
    getMapData(search.toString());
});

var modal = document.getElementById("errModal");
var modalJQ = $("#errModal");

function validateAddress(address) {
    var addr;
    var city = "";
    var state = "";
    var zip = "";

    if (address !== undefined && address !== null) {
        if (address.indexOf(",") !== -1) {
            addr = address.split(",");
        }
        else {
            addr = address.split(" ");
        }
        state = addr.pop().trim();
        if (state.match(/^[0-9]+$/) !== null) {
            zip = state;
            state = "";
        }

        city = addr.join(" ").trim();
        console.log("City = " + city);
        console.log("State = " + state);
        console.log("Zip = " + zip);

        $.ajax({
            type: "GET",
            url: "https://us-zipcode.api.smartystreets.com/lookup?auth-id=022252ec-6053-af31-55a2-1c8da629fa60&auth-token=f54PmDZdC6YfHW71XSFZ&city=" + city.trim() + "&state=" + state.trim() + "&zipcode=" + zip.trim(),
            async: true,
            dataType: "json",
            success: function (json) {
                console.log(JSON.stringify(json));

                if (json[0].status === "blank" || json[0].status === "invalid_state" || json[0].status === "invalid_city") {
                    console.log("json[0].status = " + json[0].status);
                    console.log("json[0].reason = " + json[0].reason);

                    // Pop up the modal
                    modal.style.display = "block";
                    $(".modal-content > p").text(json[0].reason);
                }
                else {
                    getMapData(city + "," + state + "," + zip);
                    currentSearch = $('#search').val().trim();
                }
            },
            error: function (xhr, status, err) {
                console.log(err);

            }

        });
    }
    else {
        console.log("Invalid city/state");
    }
}

//
// Modal code
//

$(document.body).on('click', '.close', function () {
    clearErrModal();
});

// When the user clicks anywhere outside of the modal, close it
window.onclick = function (event) {
    if (event.target == modal) {
        clearErrModal();
    }
}

function clearErrModal() {
    // Kill the modal
    modal.style.display = "none";
    $("#search").val("");
}

