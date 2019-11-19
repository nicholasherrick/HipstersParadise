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
            if(response[0].address.city){
                console.log(response);
                var city = response[0].address.city;
                //var postcode = response[0].address.postcode;
                var state = response[0].address.state;
                var lat = response[0].lat;
                var lon = response[0].lon;
            }else{
                console.log(response);
                console.log('Incorrect search');
            }
            database.ref('search').push({
                searchTerm: search,
                city: city,
                //postcode: postcode,
                state: state,
                country: country,
                lat: lat,
                lon: lon
            })
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

