//keys
//FourSquare API clientID = "OUFWP44SIIVPYHWTHMNRMUIBJMLS1WPPTVMHRRWKMOQ15NRJ";
//FourSquare API clientSecret ="K5X2B24TUUIKWR0VW0GPD1PHQBOVQ2YDF4OVZZ4XVLDO1DEZ";
//Google Map: AIzaSyBJ58mKBZaZi_Nt79sPmazkg4aUPaviwfM

//setup windows to display map
$(document).ready(function() {
  function setHeight() {
    windowHeight = $(window).innerHeight();
    $('#map').css('min-height', windowHeight);
    $('#sidebar').css('min-height', windowHeight);
  };
  setHeight();

  $(window).resize(function() {
    setHeight();
  });
});

//delaring map as a global variable
var map;

//Initialize and Load google maps
function initMap() {
    map = new google.maps.Map(document.getElementById('map'), {
        zoom: 13,
        center: {lat: 37.557777, lng: -77.478691},
    });

    ko.applyBindings(new ViewModel());
}

//Handle google map error
function googleMapsLoadError() {
    alert('There was an error occurred while loading Google Maps. Please refresh the page and try again.');
}

//ViewModel based on knockout
function ViewModel(){
    //FourSquare API keys
    var clientID = "OUFWP44SIIVPYHWTHMNRMUIBJMLS1WPPTVMHRRWKMOQ15NRJ";
    var clientSecret = "K5X2B24TUUIKWR0VW0GPD1PHQBOVQ2YDF4OVZZ4XVLDO1DEZ";
    //initialize icon color
    var defaultIcon = makeMarkerIcon('FF6347');
    var highlightedIcon = makeMarkerIcon('0091FF');
    //div for street view
    var contentString = '<div id="content" style="width:200px;height:200px;"></div>';

    var self = this;
    //bind text in the search bar
    this.searchItem = ko.observable("");
    this.markerList = [];

    //display location information
    this.locationInfoDisplay = function(marker, infowindow) {
        if(infowindow.marker != marker) {
            infowindow.setContent('');
            infowindow.marker = marker;
            
            //creating Foursquare URL for API
            var fourSquareURL = 'https://api.foursquare.com/v2/venues/search?ll=' +
                marker.lat + ',' + marker.lng + '&client_id=' + clientID +
                '&client_secret=' + clientSecret + '&query=' + marker.title +
                '&v=20170708' + '&m=foursquare';
            // Foursquare API response
            $.getJSON(fourSquareURL).done(function(marker) {
                var response = marker.response.venues[0];
                self.street = response.location.formattedAddress[0];
                self.city = response.location.formattedAddress[1];
                self.zip = response.location.formattedAddress[3];
                self.category = response.categories[0].shortName;
                //create an object for storing name of place, type of place and address of the place in info window
                self.displayDetails =
                    '<h5 class="category"> (' + self.category + ') </h5>' +
                    '<h6 class="address-heading"> Address: </h6>' +
                    '<p class="address">' + self.street + '</p>' +
                    '<p class="address">' + self.city + '</p>' +
                    '<div id="content"></div>';

                infowindow.setContent(self.infoWindowContent + self.displayDetails);
                }).fail(function() {
                    //error handler for FourSquare API issue
                    alert("Issue loading Foursquare API. Please refresh your page and try again.");
                });
                //add location name to the info window
                this.infoWindowContent = '<div>' + '<h4 class="location-name">' + marker.title + '</h4>';

                //display info window with above info when clicked on the marker
                infowindow.open(map, marker);

                //Google Street view implementation
                var pano = null;
                google.maps.event.addListener(infowindow, 'domready', function() {
                    if (pano != null) {
                        pano.unbind("position");    //not sure how to get position of each marker here
                        pano.setVisible(false);
                    }
                    pano = new google.maps.StreetViewPanorama(document.getElementById("content"), {
                        navigationControl: true,
                        newavigationControlOptions: {style: google.maps.NavigationControlStyle.ANDROID},
                        enableCloseButton: false,
                        addressControl: false,
                        linksControl: false
                    });
                    pano.bindTo("position", marker);    //not sure how to get position of each marker here
                    pano.setVisible(true);
                });
                google.maps.event.addListener(infowindow, 'closeclick', function() {
                    pano.unbind("position");    //not sure how to get position of each marker here
                    pano.setVisible(false);
                    pano = null;
                });

                //close info window when clicked anywhere on the map
                google.maps.event.addListener(map, 'click', function(){
                    infowindow.close();
            });
        }
    };
    //make the marker bounce and change color when clicked on it
    this.makeMarkerBounce = function() {
        self.locationInfoDisplay(this, self.infoWindow);
        this.setAnimation(google.maps.Animation.BOUNCE);
        this.setIcon(highlightedIcon); //change the color when clicked
        //set timeout value for bouncing the marker. it'll stop bouncing after mentioned time
        setTimeout((function() {
            this.setAnimation(null);
        }).bind(this), 1400);
    };

    //looping through the richmondLocations array in data.js, where all the information related to the locations is stored
    this.infoWindow = new google.maps.InfoWindow({
        content: contentString
    });
    for(var i = 0; i < richmondLocations.length; i++) {
        self.locationTitle = richmondLocations[i].title;
        self.locationLat = richmondLocations[i].lat;
        self.locationLng = richmondLocations[i].lng;
        //create marker for maps
        self.marker = new google.maps.Marker({
            map: map,
            position: {
                lat: self.locationLat,
                lng: self.locationLng
            },
            title: self.locationTitle,
            lat: self.locationLat,
            lng: self.locationLng,
            animation: google.maps.Animation.DROP,
            icon: defaultIcon
        });
        this.marker.setMap(map);
        this.markerList.push(this.marker);
        this.marker.addListener('click', self.makeMarkerBounce);
        this.marker.addListener('mouseout', function() {
            this.setIcon(defaultIcon);
        });
    }

    //store the locations in an array named myLocations, so that it can be displayed in the search bar
    this.myLocations = ko.computed(function() {
        var result = [];
        for (var i = 0; i < this.markerList.length; i++) {
            var markerLocation = this.markerList[i];
            if (markerLocation.title.toLowerCase().includes(this.searchItem().toLowerCase())) {
                result.push(markerLocation);
                this.markerList[i].setVisible(true);
            } else {
                this.markerList[i].setVisible(false);
            }
        }
        return result;
    }, this);
}

// This function takes in a COLOR, and then creates a new marker
// icon of that color. The icon will be 21 px wide by 34 high, have an origin
// of 0, 0 and be anchored at 10, 34).
function makeMarkerIcon(markerColor) {
    var markerImage = new google.maps.MarkerImage(
        'http://chart.googleapis.com/chart?chst=d_map_spin&chld=1.15|0|' + markerColor +
        '|40|_|%E2%80%A2',
        new google.maps.Size(21, 34),
        new google.maps.Point(0, 0),
        new google.maps.Point(10, 34),
        new google.maps.Size(21, 34));
    return markerImage;
}
