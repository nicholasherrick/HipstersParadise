var city;
var postcode;
var state;
var country;
var lat;
var lon;



function getMapData(search) {
    var url = "https://nominatim.openstreetmap.org/?format=json&limit=1&addressdetails=1&q="
    var queryTerm = '';
    for(let i = 0; i<search.length; i++){
        if(search[i] === ' '){
            queryTerm += '+';
        }else{
            queryTerm += search[i].toLowerCase();
        }
    }
    $.ajax({
        type: "GET",
        url: url + queryTerm,
        success: function (response) {
            if(response[0]){
                console.log(response);
                city = response[0].address.city;
                postcode = response[0].address.postcode;
                state = response[0].address.state;
                country = response[0].address.country;
                lat = response[0].lat;
                lon = response[0].lon;
            }else{
                console.log(response);
                console.log('Incorrect search');
            }
        },
        error: function (xhr, ajaxOptions, thrownError) {
            console.log(xhr.status);
            console.log(thrownError);
        }
    });
}



$('#getLocation').on('click', function(){
    navigator.geolocation.getCurrentPosition(function(position) {
        getMapData(position.coords.latitude + ',' + position.coords.longitude); 
    });
})