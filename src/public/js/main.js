/* -.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.
* File Name   : main.js
* Created at  : 2020-12-23
* Updated at  : 2020-12-25
* Author      : jeefo
* Purpose     :
* Description :
* Reference   :
.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.*/
// ignore:start
"use strict";

/* globals google*/
/* exported initMap*/

// ignore:end

let map;
const SB_talbai = {lat: 47.91892969657719, lng: 106.9175906283425};

function initMap () {
    const traffic_layer       = new google.maps.TrafficLayer();
    const directions_service  = new google.maps.DirectionsService();
    const directions_renderer = new google.maps.DirectionsRenderer();

    map = new google.maps.Map(document.getElementById("map"), {
        zoom   : 16,
        center : SB_talbai,
    });
    map.setOptions({
        styles: [
            {
                featureType: "poi.business",
                stylers: [{ visibility: "off" }],
            },
            {
                featureType: "transit",
                elementType: "labels.icon",
                stylers: [{ visibility: "off" }],
            },
        ]
    });

    traffic_layer.setMap(map);
    directions_renderer.setMap(map);

    if ("geolocation" in navigator) {
        navigator.geolocation.getCurrentPosition(pos => {
            const {latitude, longitude} = pos.coords;
            const position = {lat: latitude, lng: longitude};

            map.setZoom(18);
            map.setCenter(position);
            const marker = new google.maps.Marker({map, position});

            const request = {
                origin      : position,
                destination : SB_talbai,
                travelMode  : google.maps.TravelMode.DRIVING,
                waypoints   : [
                    {
                        location: {
                            lat: 47.93033811320862,
                            lng: 106.92055216033305
                        },
                        stopover: true
                    }
                ],
            };
            directions_service.route(request, (res, status) => {
                console.log(status, res);
                if (status === "OK") {
                    directions_renderer.setDirections(res);
                }
            });

            console.log(marker);
        });
    }
}
