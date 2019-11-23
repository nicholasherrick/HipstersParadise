// Initialise the firebase database.
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

// Initialise variables.
var userKey;
var currentSearch;

// Grabs the map data from the openstreetmap API and turns city data into latitude and longitude, as well as handling errors.
function getMapData(search) {
    $("#events > tbody").empty();
    $("#breweries > tbody").empty();
    $("#image-div").empty();
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
                getPicture(city);
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

// Checks the getLocation button and saves the search for later.
$('#getLocation').on('click', function () {
    navigator.geolocation.getCurrentPosition(function (position) {
        getMapData(position.coords.latitude + ',' + position.coords.longitude);
        currentSearch = position.coords.latitude + ',' + position.coords.longitude;
    });
});

// checks when the enter key is pressed while the search bar is focused
$("#search").keypress(function (event) {
    if (event.which == 13) {
        event.preventDefault();
        validateAddress($("#search").val());
    }
});

// takes in coordinates and searches for venues nearby using the ticketmaster API
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

// 
function showVenues(json) {
    if (json !== 0 && json._embedded.venues !== undefined) {
        var events = json._embedded.venues;
        console.log(events);

        for (var i = 0; i < events.length; i++) {
            console.log(JSON.stringify(events[i]));
            var newRow = $("<tr>").append(
                $("<td><a target='_blank' href=\"" + events[i].url + "\" style=\"display:block;\">" + events[i].name + "</a></td>")
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
            if (response[i].website_url === undefined || response[i].website_url.length == 0) {
                var newRow1 = $("<tr>").append(
                    $("<td>" + response[i].name + " (no website)</td>")
                );
                var newRow2 = $("<tr>").append(
                    $("<td>" + response[i].street + " " + response[i].postal_code + "</td>")
                );
                var newRow3 = $("<tr>").append(
                    $("<td>" + response[i].phone + "</td>")
                );
                $("#breweries").append(newRow1, newRow2, newRow3);
            } else {
                var newRow1 = $("<tr>").append(
                    $("<td><a target='_blank' href=\"" + response[i].website_url + "\" style=\"display:block;\">" + response[i].name + "</a></td>")
                );
                var newRow2 = $("<tr>").append(
                    $("<td>" + response[i].street + " " + response[i].postal_code + "</td>")
                );
                var newRow3 = $("<tr>").append(
                    $("<td>" + response[i].phone + "</td>")
                );
                $("#breweries").append(newRow1, newRow2, newRow3);
            }
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

$('#clear-searches').on('click', function(){
    database.ref('users/' + userKey).remove();
    $('#savedSearches').empty();
})

database.ref('users/' + userKey).on('child_added', function (snapshot) {
    $('#savedSearches').append("<tr class = 'border-b-2 border-solid border-black'><td class = 'p-1 py-2'>" 
    + snapshot.val()
    + "</td><td><button class = 'restoreSearch hover:bg-transparent bg-gray-300' data-search="
    + snapshot.val() + ">Restore Search</button></tr>");
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
            // url: "https://us-zipcode.api.smartystreets.com/lookup?key=33707087724145303&city=" + city.trim() + "&state=" + state.trim() + "&zipcode=" + zip.trim(),
            url: "https://us-zipcode.api.smartystreets.com/lookup?key=1782604764000742&city=" + city.trim() + "&state=" + state.trim() + "&zipcode=" + zip.trim(),
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

function getPicture(city) {
    var queryURL = "https://cors-anywhere.herokuapp.com/https://api.flickr.com/services/rest/?method=flickr.photos.search&api_key=ca370d51a054836007519a00ff4ce59e&per_page=4&content_type=1&format=json&nojsoncallback=1&tags=" + city;
    $.ajax({
        url: queryURL,
        method: "GET"
    }).then(function(response) {
        console.log(response);
        for (var i = 0; i < response.photos.photo.length; i++) {
            var image = $("<img>");
            var flickrImages = "http://farm" + response.photos.photo[i].farm + ".staticflickr.com/" + response.photos.photo[i].server + "/" + response.photos.photo[i].id + "_" + response.photos.photo[i].secret + ".jpg"
            image.attr("src", flickrImages);
            image.attr("class", "w-full sm:w-1/4 m-0 sm:m-2 border border-solid border-black rounded-0 sm:rounded-lg");

            image.attr("alt", "Pictures of " + city);
            $("#image-div").append(image);
            console.log(image);
        }
    });
};