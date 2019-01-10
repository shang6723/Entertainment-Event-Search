function initMap() {
    var loc = {lat: -25.344, lng: 131.036};
    map = new google.maps.Map(
        document.getElementById('map'), {zoom: 12, center: loc});
    marker = new google.maps.Marker({position: loc, map: map});
}
