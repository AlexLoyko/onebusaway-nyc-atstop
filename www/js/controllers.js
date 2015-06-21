/*jshint sub:true*/

/**
 * Copyright (c) 2015 Metropolitan Transportation Authority
 *
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not
 * use this file except in compliance with the License. You may obtain a copy of
 * the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
 * License for the specific language governing permissions and limitations under
 * the License.
 *
 * @authors https://github.com/camsys/onebusaway-nyc-atstop/graphs/contributors
 */

angular.module('atstop.controllers', ['configuration', 'filters'])

/**
 * Controller that makes tabs go to the root (cleaning Tab Histories)
 */
.controller('GoHomeCtrl', function($scope, $rootScope, $state, $ionicHistory) {
    var clearHistory = function() {
        $ionicHistory.clearHistory();
        $ionicHistory.nextViewOptions({
            historyRoot: true
        });
    };

    $scope.goHomeTab = function() {
        clearHistory();
        $state.go('tab.home');
    };

    $scope.goFavsTab = function() {
        clearHistory();
        $state.go('tab.favorites');
    };
})

/**
 * Controller that used for searching using autocomplete API.
 */
.controller('SearchCtrl', ['$rootScope', '$scope', '$location', 'SearchService', '$filter', '$ionicLoading', 'RouteService', '$ionicPopup', '$ionicPlatform', 'SearchesService', 'SHOW_BRANDING', 'DefaultTabService', '$ionicTabsDelegate',
    function($rootScope, $scope, $location, SearchService, $filter, $ionicLoading, RouteService, $ionicPopup, $ionicPlatform, SearchesService, SHOW_BRANDING, DefaultTabService, $ionicTabsDelegate) {

        $scope.go = function(path) {
            $location.path(path);
        };

        $scope.data = {
            "results": [],
            "searchKey": '',
            "notifications": '',
            exampleRoutes: [
                "Bx1", "M15-SBS", "Q58"
            ],
            exampleStops: [
                "200460", "308215", "502030"
            ],
            exampleIntersections: [
                "Main Street & Kissena Bl"
            ],
            "searches": [],
            "showSearches": true,
            "showDefaultTips": true,
            "showBranding": SHOW_BRANDING
        };

        $scope.autocomplete = function() {
            if ($scope.data.searchKey.length > 0) {
                SearchService.autocomplete($scope.data.searchKey).then(
                    function(matches) {
                        if (!angular.isUndefined(matches) && matches !== null && matches.length > 0) {
                            $scope.data.results = matches;
                            $scope.data.notifications = "";
                        } else {
                            $scope.data.results = [];
                            $scope.data.notifications = "No matches";
                        }
                    }
                );
            } else {
                $scope.data.results = [];
                $scope.data.notifications = "";
            }
        };

        $scope.searchesGo = function(matches) {
            SearchesService.add(matches);
            switch (matches.type) {
                case "RouteResult":
                    handleRouteSearch(matches);
                    break;
                case "StopResult":
                    $scope.go("/tab/atstop/" + matches.id + '/' + $filter('encodeStopName')(matches.name));
                    break;
                case "GeocodeResult":
                    $scope.go("/tab/geolocation/" + matches.latitude + '/' + matches.longitude + '/' + matches.formattedAddress);
                    break;
                default:
                    $scope.data.results = [];
                    $scope.data.notifications = "No matches";
                    //console.log("undefined type");
                    break;
            }
        };

        // set no sched svc message.
        var handleRouteSearch = function(matches) {
            // console.log(Object.keys(matches.directions).length);
            if (Object.keys(matches.directions).length > 1) {
                // if one direction with no service-- handle on route/stop page.
                if (matches.directions[0].hasUpcomingScheduledService || matches.directions[1].hasUpcomingScheduledService) {
                    $scope.go("/tab/route/" + matches.id + '/' + matches.shortName);
                } else if (!matches.directions[0].hasUpcomingScheduledService && !matches.directions[1].hasUpcomingScheduledService) {
                    noSchedService(matches.shortName);
                } else {

                }
            } else {
                if (matches.directions[0].hasUpcomingScheduledService) {
                    $scope.go("/tab/route/" + matches.id + '/' + matches.shortName);
                } else {
                    noSchedService(matches.shortName);
                }
            }
        };

        var noSchedService = function(routeDirection) {
            $scope.data.notifications = "There is no scheduled service on this route at this time.";
        };

        $scope.searchAndGo = function(term) {
            // for search page, enter searches if only one autocomplete result is returned.
            if ($scope.data.results.length === 1) {
                term = $scope.data.results[0];
            }

            SearchService.search(term).then(
                function(matches) {
                    SearchesService.add(matches);
                    switch (matches.type) {
                        case "RouteResult":
                            handleRouteSearch(matches);
                            break;
                        case "StopResult":
                            $scope.go("/tab/atstop/" + matches.id + '/' + $filter('encodeStopName')(matches.name));
                            break;
                        case "GeocodeResult":
                            $scope.go("/tab/geolocation/" + matches.latitude + '/' + matches.longitude + '/' + matches.formattedAddress);
                            break;
                        default:
                            $scope.data.results = [];
                            $scope.data.notifications = "No matches";
                            //console.log("undefined type");
                            break;
                    }
                }
            );
        };

        $scope.clearSearches = function() {
            SearchesService.clear();
            $scope.data.searches = [];
            $scope.data.showSearches = false;
            $scope.data.showDefaultTips = true;
        };

        var init = (function() {

            var defaultTabIndex = DefaultTabService.getIndex();
            if ($rootScope.redirected === false && defaultTabIndex !== 0) {
                $rootScope.redirected = true;
                $ionicTabsDelegate.select(defaultTabIndex);
            }

            SearchesService.fetchAll().then(function(results) {
                if (results.length > 0) {
                    $scope.data.searches = results;
                    $scope.data.showSearches = true;
                    $scope.data.showDefaultTips = false;
                } else {
                    $scope.data.searches = [];
                    $scope.data.showSearches = false;
                }
            });
        })();
    }
])

/**
 * Controller that used for showing the favorites.
 */
.controller('FavoritesCtrl', ['$scope', '$ionicLoading', 'FavoritesService', '$q', 'SHOW_BRANDING',
    function($scope, $ionicLoading, FavoritesService, $q, SHOW_BRANDING) {
        $scope.data = {
            "loaded": false,
            "notifications": '',
            "showBranding": SHOW_BRANDING
        };

        $scope.remove = function(id) {
            console.log(id);
            FavoritesService.remove(id);
            get();
        };

        var get = function() {
            $scope.data.favoriteRoutes = [];
            $scope.data.favoriteStops = [];
            $scope.data.favoriteRouteMaps = [];
            var favoritesDefer = $q.defer();

            FavoritesService.get().then(function(results) {
                if (Object.keys(results).length === 0) {
                    $scope.data.notifications = "You have not added any favorites. You can add favorites by clicking the star icon on routes, favorites, or maps.";
                } else if (!angular.isUndefined(results) && results !== null) {
                    angular.forEach(results, function(value) {
                        if (value.type === 'R') {
                            $scope.data.favoriteRoutes.push(value);
                        } else if (value.type === 'RM') {
                            $scope.data.favoriteRouteMaps.push(value);
                        } else {
                            $scope.data.favoriteStops.push(value);
                        }
                    });
                    $scope.data.notifications = "";
                }
                favoritesDefer.resolve();
            });

            favoritesDefer.promise.then(function() {
                $scope.data.loaded = true;
            });
        };

        var init = (function() {
            get();
        })();
    }
])

/**
 * Controller that used for showing upcoming buses for specific stop.
 */
.controller('AtStopCtrl', ['$ionicScrollDelegate', '$scope', 'AtStopService', '$stateParams', '$q', '$ionicLoading', 'FavoritesService', '$timeout', '$filter', 'datetimeService', '$interval', '$location',
    function($ionicScrollDelegate, $scope, AtStopService, $stateParams, $q, $ionicLoading, FavoritesService, $timeout, $filter, datetimeService, $interval, $location) {
        $scope.data = {
            "link": "map",
            "alerts": "",
            "responseTime": "",
            "loaded": false,
            "favClass": "",
            "results": [],
            "stopName": $stateParams.stopName,
            "notifications": '',
            "alertsHide": false,
            "alertsToggle": false,
            "stopId": $stateParams.stopId,
            "tips": "Pull down for instant refresh."
        };

        $scope.toggleFavorites = function() {
            if (FavoritesService.inFavorites($scope.data.stopId)) {
                FavoritesService.remove($scope.data.stopId);
                $scope.data.favClass = "";
            } else {
                FavoritesService.add($scope.data.stopId, $scope.data.stopName);
                $scope.data.favClass = "button-energized";
            }
        };

        var getBuses = function() {
            var busesDefer = $q.defer();
            AtStopService.getBuses($scope.data.stopId).then(function(results) {
                if (!angular.equals({}, results.arriving)) {
                    $scope.data.responseTime = $filter('date')(results.responseTimestamp, 'shortTime');
                    $scope.data.results = results.arriving;
                    $scope.data.notifications = "";
                } else {
                    $scope.data.results = "";
                    $scope.data.notifications = "We are not tracking any buses to this stop at this time. Check back later for an update.";
                }

                if (results.alerts.length > 0) {
                    $scope.data.alertsHide = true;
                    $scope.data.alerts = results.alerts;
                } else {
                    $scope.data.alertsHide = false;
                }
                busesDefer.resolve();
            });

            busesDefer.promise.then(function() {
                $scope.data.loaded = true;
            });
        };

        $scope.refresh = function() {
            // restart 'refresh' timer
            $interval.cancel($scope.reloadTimeout);
            getBuses();
            $scope.reloadTimeout = $interval(getBuses, 35000);
            $scope.$broadcast('scroll.refreshComplete');
        };

        $scope.toggleAlerts = function() {
            $scope.data.alertsToggle = !$scope.data.alertsToggle;
            $ionicScrollDelegate.resize();
        };

        $scope.$on('$destroy', function() {
            if ($scope.reloadTimeout) {
                $interval.cancel($scope.reloadTimeout);
            }
        });

        var init = (function() {
            if ($location.$$path.indexOf("atstop-favorites") > -1) {
                $scope.data.link = "map-favorites";
            } else if ($location.$$path.indexOf("atstop-gps") > -1) {
                $scope.data.link = "map-gps";
            }

            if (FavoritesService.inFavorites($scope.data.stopId)) {
                $scope.data.favClass = "button-energized";
            } else {
                $scope.data.favClass = "";
            }

            getBuses();
            $scope.reloadTimeout = $interval(getBuses, 35000);
        })();
    }
])

/* Route Stop List Controller
 * Controller that used for showing the routes and stops of routes.
 */
.controller('RouteCtrl', ['$scope', 'RouteService', '$stateParams', '$location', '$q', '$ionicLoading', '$ionicScrollDelegate', 'FavoritesService',
    function($scope, RouteService, $stateParams, $location, $q, $ionicLoading, $ionicScrollDelegate, FavoritesService) {

        $scope.data = {
            "loaded": false,
            "routeName": $stateParams.routeName,
            "favClass": "",
            "direction": [],
            "directionName": "",
            "direction_": [],
            "directionName_": "",
            "mapUrl": "map",
            "atStopUrl": "atstop",
            "routeId": $stateParams.routeId,
            "routeName": $stateParams.routeName,
            "groups": []
        };

        var oneDirection = false;
        $scope.data.groups = [];
        $scope.data.groups[0] = {
            name: "",
            items: [],
            shown: false
        };

        $scope.data.groups[1] = {
            name: "",
            items: [],
            shown: false
        };

        $scope.toggleFavorites = function() {
            //type-R (for route) FTW
            var fav = [$stateParams.routeId, $stateParams.routeName, 'R'];
            if (FavoritesService.inFavorites(fav[0])) {
                FavoritesService.remove(fav[0]);
                $scope.data.favClass = "";
            } else {
                FavoritesService.add(fav[0], fav[1], fav[2]);
                $scope.data.favClass = "button-energized";
            }
        };

        $scope.toggleGroup = function(group) {
            if ($scope.isGroupShown(group)) {
                $scope.shownGroup = null;
            } else {
                $scope.shownGroup = group;
            }
            $ionicScrollDelegate.resize();
            $ionicScrollDelegate.scrollTop();
        };

        $scope.isGroupShown = function(group) {
            return $scope.shownGroup === group;
        };

        var getDirectionsAndStops = function() {
            var directionsDefer = $q.defer();
            var stopsDefer = $q.defer();

            RouteService.getDirections($stateParams.routeId).then(function(results) {
                if (Object.keys(results).length > 1) {
                    oneDirection = false;
                    angular.forEach(results, function(val, key) {
                        if (val.directionId === 0) {
                            $scope.data.directionName = val.destination;
                            $scope.data.groups[0].name = val.destination;
                        }

                        if (val.directionId === 1) {
                            $scope.data.directionName_ = val.destination;
                            $scope.data.groups[1].name = val.destination;
                        }
                    });
                } else {
                    // with one direction, set destination and remove second group.
                    oneDirection = true;
                    $scope.data.directionName = results[0].destination;
                    $scope.data.groups[0].name = results[0].destination;
                    $scope.data.groups.splice(1);
                    $scope.toggleGroup($scope.data.groups[0]);
                }
                directionsDefer.resolve();
            });

            directionsDefer.promise.then(function() {
                RouteService.getStops($stateParams.routeId, "0").then(function(results) {
                    $scope.data.direction = results;
                    $scope.data.groups[0].items = results;
                    if (oneDirection === false) {
                        //console.log("1D 4eva!");
                        RouteService.getStops($stateParams.routeId, "1").then(function(results2) {
                            $scope.data.direction_ = results2;
                            $scope.data.groups[1].items = results2;
                        });
                    }
                    stopsDefer.resolve();
                });
            });

            $q.all([directionsDefer.promise.then(function() {
                // console.log("resolved");
            }), stopsDefer.promise.then(function() {
                // console.log("resolved");
            })]).then(function() {
                $scope.data.loaded = true;
            });
        };

        var init = (function() {
            if ($location.$$path.indexOf("favorites") > -1) {
                $scope.data.mapUrl = "map-favorites";
                $scope.data.atStopUrl = "atstop-favorites";
            }

            var fav = [$stateParams.routeId, $stateParams.routeName, 'R'];
            if (FavoritesService.inFavorites($stateParams.routeId)) {
                $scope.data.favClass = "button-energized";
            }

            getDirectionsAndStops();
        })();
    }
])

/**
 * Controller that used for showing About Information from config.js
 */
.controller('AboutCtrl', ['$rootScope', '$scope', '$ionicScrollDelegate', 'DefaultTabService', 'PRIV_POLICY_TEXT', 'SHOW_BRANDING', 'BRAND_ABOUT_TEXT',
    function($rootScope, $scope, $ionicScrollDelegate, DefaultTabService, PRIV_POLICY_TEXT, SHOW_BRANDING, BRAND_ABOUT_TEXT) {
        $scope.data = {
            showBranding: SHOW_BRANDING,
            hideText: true,
            brandAboutText: BRAND_ABOUT_TEXT,
            privText: PRIV_POLICY_TEXT,
            confirmed: DefaultTabService.getIndex() !== 0
        };

        $scope.change = function(val) {
            $rootScope.redirected = true;
            if (val === true) {
                DefaultTabService.setIndex(2);
                console.log(DefaultTabService.getIndex());
            } else {
                DefaultTabService.resetIndex();
                console.log(DefaultTabService.getIndex());
            }
        };

        $scope.toggleText = function() {
            // resize the content since the Privacy Policy text is too big
            $ionicScrollDelegate.resize();
            $scope.data.hideText = !$scope.data.hideText;
        };
    }
])

/**
 * Controller that used for showing stops and routes on Maps
 */
.controller('MapCtrl', ['MapService', 'FavoritesService', '$scope', '$location', '$stateParams', '$timeout', 'leafletData', '$filter', '$q', '$interval', 'MAPBOX_KEY', 'MAP_TILES', 'MAP_ATTRS',
    function(MapService, FavoritesService, $scope, $location, $stateParams, $timeout, leafletData, $filter, $q, $interval, MAPBOX_KEY, MAP_TILES, MAP_ATTRS) {
        $scope.markers = {};
        $scope.paths = {};
        $scope.url = "atstop";
        $scope.tips = "Map refreshes automatically";
        $scope.data = {
            favClass: ""
        };

        $scope.toggleFavorites = function() {
            //hack to have Favorite RouteMap ID and Favorite Route ID not collide.
            //routeId+MAP is the key, but inside the favorite object the id just routeId (see FavoritesService).
            var id = $stateParams.routeId.concat('MAP');
            if (FavoritesService.inFavorites(id)) {
                FavoritesService.remove(id);
                $scope.data.favClass = "";
            } else {
                FavoritesService.add(id, $stateParams.routeName, 'RM');
                $scope.data.favClass = "button-energized";
            }
        };

        $scope.refresh = function() {
            //console.log("refresh");

            leafletData.getMap().then(function(map) {
                map.closePopup();
            });

            $interval.cancel($scope.reloadTimeout);
            $scope.reloadTimeout = $interval($scope.refresh, 35000);
            showBusAndStopMarkers($stateParams.routeId, $stateParams.stopId);
        };

        // show route polylines
        var showRoutePolylines = function(route) {
            MapService.getRoutePolylines(route).then(function(res) {
                $scope.paths = res;

                // fit to polylines
                leafletData.getMap().then(function(map) {
                    map.fitBounds([
                        [$scope.paths['p0']['latlngs'][0]['lat'], $scope.paths['p0']['latlngs'][0]['lng']],
                        [$scope.paths['p0']['latlngs'][$scope.paths['p0']['latlngs'].length - 1]['lat'], $scope.paths['p0']['latlngs'][$scope.paths['p0']['latlngs'].length - 1]['lng']]
                    ]);
                });
            });
        };

        var showBusAndStopMarkers = function(route, stop) {
            //start countdown on markers refresh
            $scope.$broadcast('timer-set-countdown', 35);
            $scope.$broadcast('timer-start');
            $scope.markers = {};

            MapService.getBusMarkers(route).then(function(res) {
                angular.extend($scope.markers, res);
            });
            MapService.getStopMarkers(route, stop).then(function(res) {
                angular.extend($scope.markers, res);
            });
        };

        // map
        var map = function() {
            angular.extend($scope, {
                events: {
                    markers: {
                        enable: ['click'],
                        logic: 'emit'
                    }
                },
                center: {},
                defaults: {
                    scrollWheelZoom: false
                },
                markers: {},
                paths: {},
                layers: {
                    baselayers: {
                        xyz: {
                            url: MAP_TILES,
                            type: 'xyz',
                            name: 'base',
                            layerOptions: {
                                attribution: $filter('hrefToJS')(MAP_ATTRS)
                            },
                            options: {
                                reuseTiles: true,
                                access_token: MAPBOX_KEY
                            }
                        }
                    },
                    overlays: {
                        stops: {
                            type: 'group',
                            name: 'stops',
                            visible: false
                        },
                        currentStop: {
                            type: 'group',
                            name: 'currentStop',
                            visible: true
                        }
                    }
                }
            });

            leafletData.getMap().then(function(map) {
                //leaflet attrib not required
                map.attributionControl.setPrefix('');
                //New Angular Leaflet Directive should have this functionality now.
                //L.Util.requestAnimFrame(map.invalidateSize, map, false, map._container);
            });

        };

        // map click event
        $scope.$on('leafletDirectiveMarker.click', function(event, args) {
            var object = $scope.markers[args.modelName];
            var content = '';
            var latLng = [];
            var popup = L.popup();

            if ($filter('isUndefinedOrEmpty')(object.stopName)) {
                content = "Vehicle " + object.vehicleId + "<br> <h4>" + object.destination + "</h4>" + "<br> <h5>Next Stop: " + object.nextStop + "</h5>";
                latLng = [object.lat, object.lng];
                popup.setContent(content).setLatLng(latLng);
            } else {
                content = '<p>' + object.stopName + '</p>' + '<a href="#/tab/' + $scope.url + '/' + object.stopId + '/' + object.stopName + '" class="button button-clear button-full button-small">See upcoming buses</a>';
                latLng = [object.lat, object.lng];
                popup.setContent(content).setLatLng(latLng);
            }

            leafletData.getMap().then(function(map) {
                popup.openOn(map);
            });
        });

        var toggleLayer = function(type) {
            $scope.layers.overlays[type].visible = !$scope.layers.overlays[type].visible;
        };

        var isLayerVisible = function(type) {
            return $scope.layers.overlays[type].visible;
        };

        $scope.$on('leafletDirectiveMap.zoomend', function(event, args) {
            if (args.leafletEvent.target._zoom > 14 && !isLayerVisible('stops')) {
                toggleLayer('stops');
            } else if (args.leafletEvent.target._zoom <= 14 && isLayerVisible('stops')) {
                toggleLayer('stops');
            }
        });

        $scope.$on('$destroy', function() {
            if ($scope.reloadTimeout) {
                $interval.cancel($scope.reloadTimeout);
            }
        });

        var init = (function() {
            if ($location.$$path.indexOf("map-favorites") > -1) {
                $scope.url = "atstop-favorites";
            } else if ($location.$$path.indexOf("map-gps") > -1) {
                $scope.url = "atstop-gps";
            }

            if (FavoritesService.inFavorites($stateParams.routeId.concat('MAP'))) {
                $scope.data.favClass = "button-energized";
            }

            map();
            showRoutePolylines($stateParams.routeId);
            showBusAndStopMarkers($stateParams.routeId, $stateParams.stopId);

            if ($scope.center.zoom > 14) {
                toggleLayer('stops');
            }

            $scope.reloadTimeout = $interval($scope.refresh, 35000);
        })();
    }
])


.controller('NearbyStopsAndRoutesCtrl', ['$ionicLoading', 'MapService', '$stateParams', '$window', '$location', '$scope', 'GeolocationService', '$q', '$ionicPopup', '$cordovaGeolocation', '$filter', 'RouteService', 'AtStopService', 'leafletData', '$ionicScrollDelegate', '$timeout', '$interval', 'MAPBOX_KEY', 'MAP_TILES', 'MAP_ATTRS',
    function($ionicLoading, MapService, $stateParams, $window, $location, $scope, GeolocationService, $q, $ionicPopup, $cordovaGeolocation, $filter, RouteService, AtStopService, leafletData, $ionicScrollDelegate, $timeout, $interval, MAPBOX_KEY, MAP_TILES, MAP_ATTRS) {
        $scope.markers = {};
        $scope.paths = {};
        $scope.url = "atstop";
        $scope.left = false;
        $scope.data = {
            "returnShow": false,
            "title": "Nearby Stops",
            "loaded": true,
            "showMap": false,
            "stops": [],
            "routes": [],
            "markers": {},
            "lat": "",
            "lon": "",
            "notifications": "",
            "val": false,
            "showRoutes": false,
            "showStops": true,
            "results": [],
            "mapHeight": Math.floor(document.getElementsByTagName('html')[0].clientHeight / 2) - 90,
            "listHeight": Math.floor(document.getElementsByTagName('html')[0].clientHeight / 2),
            "tips": "Pull the list to refresh",
            "nearbyStops": []
        };


        $scope.back = function() {
            $scope.data.returnShow = false;
            if ($scope.reloadTimeout) {
                $interval.cancel($scope.reloadTimeout);
            }
            $scope.data.stops = $scope.data.nearbyStops;
            showNearbyStops();
            $scope.data.notifications = "";
            $scope.data.showMap = true;
        };

        $scope.refresh = function() {
            $scope.data.notifications = "";
            if ($scope.reloadTimeout) {
                $interval.cancel($scope.reloadTimeout);
            }

            if ($location.$$path === "/tab/nearby-stops-and-routes") {
                getNearbyStopsAndRoutesGPS();
            } else {
                getNearbyStopsAndRoutes($stateParams.latitude, $stateParams.longitude);
            }
            tick();
            $scope.$broadcast('scroll.refreshComplete');
        };


        var stopsInTimeout = [];

        $scope.lineInView = function(index, inview, inviewpart, event) {
            if (inview == true) {
                var stopInArray = stopsInTimeout.some(function(stop) {
                    return stop === event.inViewTarget.id;
                });
                if (!stopInArray) {
                    stopsInTimeout.push(event.inViewTarget.id);
                    tick();
                }
            }

            return false;
        };

        var tick = function() {
            var arrivals = {};
            var promises = [];
            angular.forEach(stopsInTimeout, function(stop) {
                promises.push(
                    AtStopService.getBuses({'stop':stop, 'sort':false}).then(function(results) {
                        // console.log(results);
                        if (!angular.equals({}, results.arriving)) {
                            arrivals[stop] = results.arriving;
                        }
                    })
                );
            });
            
            $q.all(promises).then(function() {
                //There is probably a better way to do this, I would like to limit piecemeal updates to $scope
                angular.forEach($scope.data.stops, function(s) {
                    s.arriving = arrivals[s.id];
                    //console.log(s.id, arrivals[s.id]);
                });
            });

            if (!$scope.$$phase) {
                $scope.$apply();
            }
        };

        var getNearbyStopsAndRoutes = function(lat, lon) {
            GeolocationService.getStops(lat, lon).then(function(results) {
                if (!angular.isUndefined(results) && results !== null && results.length > 0) {
                    angular.forEach(results, function(stop) {
                        stop['dist'] = MapService.getDistanceInM(lat, lon, stop['lat'], stop['lon']);
                    });
                    $scope.data.stops = results;
                    $scope.data.stops.push({
                        id: "current_location",
                        lat: lat,
                        lon: lon
                    });
                    $scope.data.nearbyStops = results;
                    showNearbyStops();
                    $scope.data.notifications = "";
                    $scope.data.showMap = true;
                } else {
                    $scope.data.showMap = false;
                    $scope.data.notifications = "No nearby stops found.";
                }
            });
        };

        var getNearbyStopsAndRoutesGPS = function() {
            //console.log("getNearbyStopsAndRoutesGPS called");

            $scope.loading = true;

            var timeoutVal = 10000;
            var fired = false;
            var timeout = $timeout(function() {
                $scope.data.showMap = false;
                $scope.data.notifications = "Pull to refresh.";
                $scope.loading = false;
                if ($scope.left !== true) {
                    var popup = $ionicPopup.alert({
                        content: "Cannot access your position. Check if location services are enabled."
                    });
                    $timeout(function() {
                        popup.close();
                    }, 3000);
                } else {
                    console.log("You left the current page! Destroying ...");
                }
            }, timeoutVal + 5000);

            // Unfortunately, this function is asynchronous. So, we cannot cancel it. However, we have a trick for this. DO NOT show the popup if a user left the page.
            $cordovaGeolocation.getCurrentPosition({
                    enableHighAccuracy: false,
                    timeout: timeoutVal,
                    maximumAge: 0
                }).then(
                    function(position) {
                        $scope.loading = false;
                        $timeout.cancel(timeout);
                        $scope.data.notifications = "";
                        $scope.data.val = true;
                        getNearbyStopsAndRoutes(position.coords.latitude, position.coords.longitude);
                    },
                    function(error) {
                        $scope.data.showMap = false;
                        $scope.data.notifications = "Pull to refresh.";
                        $ionicLoading.hide();
                        $timeout.cancel(timeout);
                        if ($scope.left !== true) {
                            var popup = $ionicPopup.alert({
                                content: "Cannot access your position. Check if location services are enabled."
                            });
                            $timeout(function() {
                                popup.close();
                            }, 3000);
                        } else {
                            console.log("You left the current page! Destroying ...");
                        }
                    }
                )
                .finally(function() {
                    $scope.data.showMap = false;
                    $scope.data.notifications = "Pull to refresh.";
                    $scope.loading = false;
                    $timeout.cancel(timeout);
                });
        };

        var showNearbyStops = function() {
            $scope.markers = {};
            $scope.paths = {};
            leafletData.getMap().then(function(map) {
                map.closePopup();
            });

            var stops = [];
            angular.forEach($scope.data.stops, function(v, k) {
                if (v["id"] != "current_location") {
                    stops['s' + k] = {
                        lat: v["lat"],
                        lng: v["lon"],
                        stopId: v["id"],
                        stopName: $filter('encodeStopName')(v['name']),
                        icon: {
                            iconUrl: 'img/stop_icons/stop.svg',
                            iconSize: [20, 20]
                        },
                        focus: false
                    };
                } else {
                    //console.log(v["lat"], v["lon"]);
                    stops['currentLocation'] = {
                        lat: parseFloat(v["lat"]),
                        lng: parseFloat(v["lon"]),
                        stopId: v["currentLocation"],
                        stopName: "Current Location",
                        icon: {
                            iconUrl: 'img/stop_icons/stop-blue.svg',
                            iconSize: [20, 20]
                        },
                        focus: false,
                        clickable: false
                    };
                }
            });

            //set zoom around nearest stop
            leafletData.getMap().then(function(map) {
                map.setView(stops['s0'], 15, {
                    animate: true
                });
            });

            $scope.markers = stops;
        };

        // map
        var map = function() {
            var mapCenter = {};

            angular.extend($scope, {
                events: {
                    markers: {
                        enable: ['click'],
                        logic: 'emit'
                    }
                },
                center: mapCenter,
                defaults: {
                    tileLayer: MAP_TILES,
                    tileLayerOptions: {
                        attribution: $filter('hrefToJS')(MAP_ATTRS)
                    },
                    scrollWheelZoom: false,
                    key: MAPBOX_KEY,
                    zoomControl: false
                },
                markers: {},
                paths: {}
            });

            leafletData.getMap().then(function(map) {
                map.attributionControl.setPrefix('');
            });
        };

        // show route polylines
        $scope.showRoutePolylines = function(route) {
            $scope.paths = {};
            MapService.getRoutePolylines(route).then(function(res) {
                $scope.paths = res;
            });
        };

        var showBusMarkers = function(route) {
            leafletData.getMap().then(function(map) {
                map.closePopup();
            });

            MapService.getBusMarkers(route).then(function(res) {
                angular.extend($scope.markers, res);
            });
        };

        $scope.$on('$destroy', function() {
            $scope.left = true;
            if ($scope.reloadTimeout) {
                $interval.cancel($scope.reloadTimeout);
            }
        });

        // refresh specific route
        $scope.showCurrentStop = function(route, stop, lat, lon, name) {
            $scope.data.returnShow = true;
            $interval.cancel($scope.reloadTimeout);
            drawCurrentStop(route, stop, lat, lon, name);
            $scope.reloadTimeout = $interval(function() {
                drawCurrentStop(route, stop, lat, lon, name);
            }, 35000);
        };

        // show current stop
        var drawCurrentStop = function(route, stop, lat, lon, name) {
            $scope.markers = {};
            leafletData.getMap().then(function(map) {
                map.closePopup();
            });

            $scope.markers['currentStop'] = {
                lat: lat,
                lng: lon,
                icon: {
                    iconUrl: 'img/stop_icons/stop-blue.svg',
                    iconSize: [20, 20]
                },
                focus: false,
                stopId: stop,
                stopName: $filter('encodeStopName')(name)
            };

            leafletData.getMap().then(function(map) {
                map.closePopup();
                map.setView($scope.markers['currentStop'], 13, {
                    animate: true
                });
            });

            showBusMarkers(route);
        };

        var slideTo = function(location) {
            location = $location.hash(location);
            $timeout(function() {
                $ionicScrollDelegate.anchorScroll("#" + location);
            });
        };

        // map click event
        $scope.$on('leafletDirectiveMarker.click', function(event, args) {
            var object = $scope.markers[args.modelName];
            var content = '';
            var latlng = [];
            var popup = L.popup();
            if ($filter('isUndefinedOrEmpty')(object.stopName)) {
                content = "Vehicle " + object.vehicleId + "<br> <h4>" + object.destination + "</h4>" + "<br> <h5>Next Stop: " + object.nextStop + "</h5>";
            } else {
                if (object.stopName === "Current Location") {
                    content = "<p>Current Location</p>";
                } else {
                    slideTo(object.stopId);
                    content = '<p>' + object.stopName + '</p>' + '<a href="#/tab/' + $scope.url + '/' + object.stopId + '/' + object.stopName + '" class="button button-clear button-full button-small">See upcoming buses</a>';
                }
            }

            latLng = [object.lat, object.lng];
            popup.setContent(content).setLatLng(latLng);

            leafletData.getMap().then(function(map) {
                popup.openOn(map);
            });
        });

        var init = (function() {
            map();
            if ($location.$$path === "/tab/nearby-stops-and-routes") {
                //console.log("GPS Mode");
                $scope.data.title = "Nearby Stops";
                $scope.url = "atstop-gps";
                getNearbyStopsAndRoutesGPS();
                tick();
            } else {
                $scope.data.title = $stateParams.address;
                getNearbyStopsAndRoutes($stateParams.latitude, $stateParams.longitude);
            }

            tick();
        })();
    }
]);
