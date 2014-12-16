angular.module('starter', ['ionic', 'starter.controllers', 'starter.services', 'leaflet-directive', 'ngCordova', 'angular-data.DSCacheFactory'])

// global timeout variable
.value('httpTimeout', 5000)

.run(function($rootScope, $ionicPlatform, $ionicPopup, $cordovaNetwork) {
	$ionicPlatform.ready(function() {
		if (window.cordova && window.cordova.plugins.Keyboard) {
			cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true);
		}
		if (window.StatusBar) {
			StatusBar.styleDefault();
		}
		if ($cordovaNetwork.isOffline()) {
			$ionicPopup.alert({
				title: "Internet Disconnected",
				content: "The internet is not available on your device."
			})
				.then(function(result) {
					if (result) {
						ionic.Platform.exitApp();
					}
				});
		}
	});
})

.config(function($httpProvider, $ionicConfigProvider) {
	$ionicConfigProvider.tabs.position('bottom');

	$httpProvider.interceptors.push(function($rootScope) {
		return {
			request: function(config) {
				$rootScope.$broadcast('loading:show');
				return config;
			},
			requestError: function(rejection) {
				$rootScope.$broadcast('requestRejection', rejection);
				return rejection;
			},
			response: function(response) {
				$rootScope.$broadcast('loading:hide');
				return response;
			},
			responseError: function(rejection) {
				$rootScope.$broadcast('requestRejection', rejection);
				return rejection;
			}
		}
	})
})


.run(function($rootScope, $ionicHistory, $ionicLoading, $ionicPopup, $cordovaNetwork, $timeout, $ionicTabsDelegate) {
	//Erase Ionic History for Tab Change
	$rootScope.$on('$stateChangeStart',
		function(event, toState, toParams, fromState, fromParams) {
			console.log(toState.url);

			if (toState.url == "/home" || toState.url == "/favorites" || toState.url == "/nearby-stops-and-routes") {
				$ionicHistory.clearHistory();
			}
		}
	);

	// State Change Event
	$rootScope.$on('$stateChangeStart',
		function(event, toState, toParams, fromState, fromParams) {
			$ionicLoading.show();
		});

	// State Change Event
	$rootScope.$on('$stateChangeSuccess', function(event, toState, toParams, fromState, fromParams) {
		$timeout(function() {
			$ionicLoading.hide()
		}, 2000);
	});

	$rootScope.$on('loading:show', function() {
		$ionicLoading.show({
			template: 'Loading',
			showBackdrop: false
		})
	});

	$rootScope.$on('loading:hide', function() {
		$ionicLoading.hide()
	});

	$rootScope.$on('requestRejection', function(obj, data) {
		$ionicLoading.hide();

		if (data.config.url.indexOf("autocomplete") == -1) {
			var popup = $ionicPopup.alert({
				title: "Error",
				content: "Something went wrong. Please check your internet connection."
			});
			$timeout(function() {
				popup.close(); //close the popup after 3 seconds
			}, 3000);
		}

	});
})


.directive('ngEnter', function() {
	return function(scope, element, attrs) {
		element.bind("keydown keypress", function(event) {
			if (event.which === 13) {
				scope.$apply(function() {
					scope.$eval(attrs.ngEnter);
				});
				event.preventDefault();
			}
		});
	};
})

.config(function($stateProvider, $urlRouterProvider) {
	$stateProvider

	.state('tab', {
		url: "/tab",
		abstract: true,
		templateUrl: "templates/tabs.html"
	})

	.state('tab.home', {
		url: '/home',
		cache: false,
		views: {
			'tab-home': {
				templateUrl: 'templates/tab-home.html',
				controller: 'SearchCtrl'
			}
		}
	})

	.state('tab.favorites', {
		url: '/favorites',
		cache: false,
		views: {
			'tab-favorites': {
				templateUrl: 'templates/tab-favorites.html',
				controller: 'FavoritesCtrl'
			}
		}
	})

	.state('tab.nearby-stops-and-routes', {
		url: '/nearby-stops-and-routes',
		cache: false,
		views: {
			'tab-nearby-stops-and-routes': {
				templateUrl: 'templates/tab-nearby-stops-and-routes.html',
				controller: 'NearbyStopsAndRoutesCtrl'
			}
		}
	})

	.state('tab.atstop-gps', {
		url: '/atstop-gps/:stopId/:stopName',
		cache: false,
		views: {
			'tab-nearby-stops-and-routes': {
				templateUrl: 'templates/atstop.html',
				controller: 'AtStopCtrl'
			}
		}
	})

	.state('tab.route', {
		url: '/route/:routeId/:routeName',
		views: {
			'tab-home': {
				templateUrl: 'templates/route.html',
				controller: 'RouteCtrl'
			}
		}
	})

	.state('tab.geolocation', {
		url: '/geolocation/:latitude/:longitude/:address',
		cache: false,
		views: {
			'tab-home': {
				templateUrl: 'templates/tab-nearby-stops-and-routes.html',
				controller: 'NearbyStopsAndRoutesCtrl'
			}
		}
	})

	.state('tab.stopcode', {
		url: '/stopcode/:stopId',
		views: {
			'tab-home': {
				templateUrl: 'templates/stopcode.html',
				controller: 'StopcodeCtrl'
			}
		}
	})

	.state('tab.atstop', {
		url: '/atstop/:stopId/:stopName',
		cache: false,
		views: {
			'tab-home': {
				templateUrl: 'templates/atstop.html',
				controller: 'AtStopCtrl'
			}
		}
	})

	.state('tab.atstop-favorites', {
		url: '/atstop-favorites/:stopId/:stopName',
		cache: false,
		views: {
			'tab-favorites': {
				templateUrl: 'templates/atstop.html',
				controller: 'AtStopCtrl'
			}
		}
	})

	.state('tab.map', {
		url: '/map/:routeId/:stopId',
		cache: false,
		views: {
			'tab-home': {
				templateUrl: 'templates/map.html',
				controller: 'MapCtrl'
			}
		}
	})

	.state('tab.map-favorites', {
		url: '/map-favorites/:routeId/:stopId',
		cache: false,
		views: {
			'tab-favorites': {
				templateUrl: 'templates/map.html',
				controller: 'MapCtrl'
			}
		}
	})

	.state('tab.about', {
		url: '/about',
		views: {
			'tab-home': {
				templateUrl: 'templates/about.html',
				controller: 'AboutCtrl'
			}
		}
	})

	// if none of the above states are matched, use this as the fallback
	$urlRouterProvider.otherwise('/tab/home');

});
