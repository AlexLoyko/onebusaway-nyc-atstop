angular.module('starter.controllers', [])

.controller('MapCtrl', ['$scope', '$location', '$stateParams', 'RouteService', 'VehicleMonitoringService', '$ionicLoading', '$timeout',
    function ($scope, $location, $stateParams, RouteService, VehicleMonitoringService, $ionicLoading, $timeout) {
        $scope.val = true;

        $scope.drawPolylines = function (route) {
            RouteService.getPolylines(route).then(function (results) {
                var stopsAndRoute = {};

                angular.forEach(results.stops, function (val, key) {
                    stopsAndRoute["stops" + key] = {
                        type: "circleMarker",
                        radius: 2,
                        latlngs: {
                            lat: val.lat,
                            lng: val.lon
                        }
                    }
                });

                angular.forEach(results.polylines, function (val, key) {
                    stopsAndRoute[key] = {
                        color: '#008888',
                        weight: 3,
                        latlngs: []
                    }

                    angular.forEach(L.Polyline.fromEncoded(val).getLatLngs(), function (v, k) {
                        stopsAndRoute[key].latlngs.push({
                            lat: v.lat,
                            lng: v.lng
                        });
                    });
                });

                $scope.paths = stopsAndRoute;
            })
        };

        $scope.drawBuses = function (route) {
            $scope.val = true;
            $timeout(function () {
                $scope.val = false;
            }, 30000);


            $scope.markers = {};
            VehicleMonitoringService.getLocations(route).then(function (results) {
                var buses = {};

                angular.forEach(results, function (val, key) {
                    buses[key] = {
                        lat: val.latitude,
                        lng: val.longitude
                    }
                });

                $scope.markers = buses;
            });

        };

        $scope.refresh = function () {
            $scope.drawBuses($stateParams.routeId);
        };

        $scope.map = function () {


            angular.extend($scope, {
                center: {
                    lat: 40.7142700,
                    lng: -74.0059700,
                    zoom: 10
                },
                defaults: {
                    tileLayer: "http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
                    tileLayerOptions: {
                        attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    },
                    scrollWheelZoom: false
                },
                markers: {},
                paths: {}
            });

        };

        $scope.init = (function () {
            $scope.map();
            $scope.drawPolylines($stateParams.routeId);
            $scope.drawBuses($stateParams.routeId);
        })();
}])

.controller('SearchCtrl', ['$scope', '$location', 'SearchService', '$filter', '$ionicLoading', 'RouteService', '$ionicPopup', '$ionicPlatform',

    function ($scope, $location, SearchService, $filter, $ionicLoading, RouteService, $ionicPopup, $ionicPlatform) {

        $scope.init = (function () {
            // do nothing ...
        })();

        $scope.go = function (path) {
            $location.path(path);
        };

        $scope.data = {
            "results": [],
            "searchKey": ''
        };

        $scope.autocomplete = function () {

            if (window.Connection) {
                if (navigator.connection.type == Connection.NONE) {
                    $ionicPopup.alert({
                        title: "Internet Disconnected",
                        content: "The internet is disconnected on your device."
                    })
                        .then(function (result) {
                            if (result) {
                                ionic.Platform.exitApp();
                            }
                        });
                }
            }

            SearchService.autocomplete($scope.data.searchKey).then(
                function (matches) {
                    $scope.data.results = matches;
                }
            );
        };

        $scope.searchAndGo = function (term) {
            SearchService.search(term).then(
                function (matches) {
                    switch (matches.type) {
                    case "RouteResult":
                        $scope.go("/tab/route/" + matches.id + '/' + matches.shortName);
                        break;
                    case "StopResult":
                        $scope.go("/tab/atstop/" + matches.id + '/' + $filter('encodeStopName')(matches.name));
                        break;
                    case "GeocodeResult":
                        $scope.go("/tab/geolocation/" + matches.latitude + '/' + matches.longitude + '/' + matches.formattedAddress);
                        break;
                    default:
                        console.log("undefined type");
                    }
                }
            );

        };
}])

.controller('FavoritesCtrl', ['$scope', '$ionicLoading', 'FavoritesService',
    function ($scope, $ionicLoading, FavoritesService) {
        $scope.data = {
            "favorites": []
        };

        $scope.remove = function (stopId) {
            FavoritesService.remove(stopId);
            $scope.get();
        };

        $scope.get = function () {
            FavoritesService.get().then(function (results) {
                $scope.data.favorites = results;
            });
        };

        $scope.init = (function () {
            $scope.get();
        })();
    }])

.controller('AtStopCtrl', ['$scope', 'AtStopService', '$stateParams', '$q', '$ionicLoading', 'FavoritesService', '$timeout',
    function ($scope, AtStopService, $stateParams, $q, $ionicLoading, FavoritesService, $timeout) {
        $scope.data = {
            "val": true,
            "inFavorites": false,
            "results": [],
            "stopName": $stateParams.stopName
        };

        $scope.addToFavorites = function () {
            FavoritesService.add($stateParams.stopId, $stateParams.stopName);
            $scope.data.inFavorites = true;
        };

        $scope.removeFromFavorites = function () {
            FavoritesService.remove($stateParams.stopId);
        };

        $scope.getBuses = function () {
            $scope.data.val = true;
            $timeout(function () {
                $scope.data.val = false;
            }, 30000);

            var getBuses = AtStopService.getBuses($stateParams.stopId).then(function (results) {
                $scope.data.results = results;
            });

            $q.all([getBuses]).then(function () {});
        };

        $scope.refresh = function () {
            $scope.getBuses();
        };

        $scope.init = (function () {
            $scope.data.inFavorites = FavoritesService.inFavorites($stateParams.stopId);
            $scope.getBuses();
        })();
}])

.controller('GeolocationCtrl', ['$scope', 'GeolocationService', '$stateParams', '$ionicLoading', '$q',
    function ($scope, GeolocationService, $stateParams, $ionicLoading, $q) {
        $scope.data = {
            "routes": [],
            "stops": [],
            "address": $stateParams.address
        };

        $scope.getRoutesAndStops = function () {
            var getRoutes = GeolocationService.getRoutes($stateParams.latitude, $stateParams.longitude).then(function (results) {
                $scope.data.routes = results;
            });

            var getStops = GeolocationService.getStops($stateParams.latitude, $stateParams.longitude).then(function (results) {
                $scope.data.stops = results;
            });

            $q.all([getRoutes, getStops]).then(function () {});
        };

        $scope.init = (function () {
            $scope.getRoutesAndStops();
        })();
}])

.controller('StopcodeCtrl', ['$scope', 'StopcodeService', '$stateParams', '$q', '$ionicLoading',
    function ($scope, StopcodeService, $stateParams, $q, $ionicLoading) {
        $scope.data = {
            "routes": []
        };

        $scope.getRoutes = function () {
            var getRoutes = StopcodeService.getRoutes($stateParams.stopId).then(function (results) {
                $scope.data.routes = results.routes;
            });

            $q.all([getRoutes]).then(function () {});
        };

        $scope.init = (function () {
            $scope.getRoutes();
        })();
}])

.controller('RouteCtrl', ['$scope', 'RouteService', '$stateParams', '$location', '$q', '$ionicLoading',
    function ($scope, RouteService, $stateParams, $location, $q, $ionicLoading) {
        $scope.data = {
            "routeName": $stateParams.routeName,
            "direction": [],
            "directionName": "",
            "direction_": [],
            "directionName_": ""
        };

        $scope.getDirectionsAndStops = function () {
            var getDirections = RouteService.getDirections($stateParams.routeId).then(function (results) {
                angular.forEach(results, function (val, key) {
                    if (val.directionId == 0) {
                        $scope.data.directionName = val.destination;
                    }

                    if (val.directionId == 1) {
                        $scope.data.directionName_ = val.destination;
                    }
                });
            });

            var getStops = RouteService.getStops($stateParams.routeId, "0").then(function (results) {
                $scope.data.direction = results;
            });

            var getStops_ = RouteService.getStops($stateParams.routeId, "1").then(function (results) {
                $scope.data.direction_ = results;
            });

            $q.all([getDirections, getStops, getStops_]).then(function () {});
        };


        $scope.init = (function () {
            $scope.getDirectionsAndStops();
        })();
}])

.controller('NearbyStopsCtrl', ['$scope', 'GeolocationService', '$cordovaGeolocation', '$ionicLoading', '$q',
    function ($scope, GeolocationService, $cordovaGeolocation, $ionicLoading, $q) {
        $scope.data = {
            "stops": []
        };

        $scope.refresh = function () {
            $scope.getNearbyStops();
        };

        $scope.getNearbyStops = function () {
            $cordovaGeolocation
                .getCurrentPosition()
                .then(function (position) {
                    var lat = position.coords.latitude
                    var long = position.coords.longitude

                    var getStops = GeolocationService.getStops(lat, lon).then(function (results) {
                        $scope.data.stops = results;

                        console.log(results);
                    });

                    $q.all([getStops]).then(function () {});
                }, function (err) {
                    $scope.data.stops = [];
                    console.log(err);
                }, {
                    maximumAge: 600000,
                    timeout: 10000,
                    enableHighAccuracy: false
                });
        }

        $scope.init = (function () {
            $scope.getNearbyStops();
        })();
}]);