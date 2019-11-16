$("#search-button").on("click", function getBreweriesByCity() {
    event.preventDefault();
    var byCity = $("#search").val().toLowerCase().trim().split(" ").join("_");
    var queryURL = "https://api.openbrewerydb.org/breweries?by_city=" + byCity;
    $.ajax({
        url: queryURL,
        method: "GET"
    }).then(function(response) {
        console.log(response);
        for (var i =0; i < response.length; i++) {
            var div = $("#div-3");
            var name = response[i].name;
            var city = response[i].city;
            var address = response[i].street + " " + response[i].postal_code;
            var newText1 = $("<p>");
            var newText2 = $("<p>");
            var newText3 = $("<p>");
            newText1.append(name);
            newText2.append("City: " + city);
            newText3.append("Address: " + address);
            div.append(newText1);
            div.append(newText2);
            div.append(newText3);
        }
    });
});
