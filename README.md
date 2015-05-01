# At Stop #

A hybrid mobile app that provides information about when the next bus will arrive at your stop. The app uses free [MTA Bus Time Developer API](http://bustime.mta.info/wiki/Developers/Index)'s to get the real-time location of the buses serving a particular stop. The app is built on top of [Ionic Framework](http://ionicframework.com/).


### Setting up the project ###

* (Wait before cloning this repo) 
* First, install [Ionic Framework](http://ionicframework.com/getting-started/).
* Second, start a new project using `ionic start atstop blank`.
* Then, in the project root:
  * Setup SASS running `ionic setup sass`.
  * Install ngCordova running `bower install ngCordova`.
  * `git init`
  * `git remote add origin PATH/TO/THIS/REPO`
  * `git fetch --all`
  * `git reset --hard origin/master`
  * Remove `www/img/ionic.png` and `www/css/style.css` files.
  * Rename `www/js/config.tmpl.js` to `config.js` (in the same folder)
  * Get a MTA Bus Time Developer API key. Go [here](http://spreadsheets.google.com/viewform?hl=en&formkey=dG9kcGIxRFpSS0NhQWM4UjA0V0VkNGc6MQ#gid=0) to request one. You will receive the key within half an hour.
  * Insert your key into the `API_KEY` field of `config.js`.
  * Set the API end point via the `API_END_POINT` constant in the same file (e.g. `http://app.prod.obanyc.com/`)
 
#### Required Cordova Plugins
Using `ionic plugin add [name]`, install the following plugins:
 * org.apache.cordova.network-information
 * org.apache.cordova.geolocation
 * org.apache.cordova.inappbrowser
  
### Running and testing ###
* Use the `ionic serve` function of [Ionic Framework](http://ionicframework.com/docs/guide/testing.html)
* In order to build the native mobile app, use `ionic build [platform]`

### Project License ###
The project uses the [Apache License, version 2.0](http://opensource.org/licenses/Apache-2.0).
