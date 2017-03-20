/******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};

/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {

/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId])
/******/ 			return installedModules[moduleId].exports;

/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			exports: {},
/******/ 			id: moduleId,
/******/ 			loaded: false
/******/ 		};

/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);

/******/ 		// Flag the module as loaded
/******/ 		module.loaded = true;

/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}


/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;

/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;

/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";

/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(0);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	__webpack_require__(1);

	angular.module('videogular.plugins.vimeo', [])
	    .directive('vgVimeo', ['VG_STATES', function (VG_STATES) {
	            return {
	                restrict: 'A',
	                require: '^videogular',
	                link: function (scope, elem, attr, API) {
	                    var player, videoWidth, videoHeight, currentTime, duration, paused, volume;

	                    function getVideoId(url) {
	                        var vimeoUrlRegExp = /^.+vimeo.com\/(.*\/)?([^#\?]*)/;
	                        var m = url.match(vimeoUrlRegExp);
	                        return m ? m[2] || m[1] : null;
	                    }

	                    function updateMetadata() {
	                        var event = new CustomEvent('loadedmetadata');
	                        API.mediaElement[0].dispatchEvent(event);
	                    }

	                    function configurePlayer() {
	                        Object.defineProperties(API.mediaElement[0], {
	                                'currentTime': {
	                                    get: function () {
	                                        return currentTime;
	                                    },
	                                    set: function (value) {
	                                        currentTime = value;
	                                        player.vimeo('seekTo', value);
	                                    },
	                                    configurable: true
	                                },
	                                'duration': {
	                                    get: function () {
	                                        return duration;
	                                    },
	                                    configurable: true
	                                },
	                                'paused': {
	                                    get: function () {
	                                        return paused;
	                                    },
	                                    configurable: true
	                                },
	                                'videoWidth': {
	                                    get: function () {
	                                        return videoWidth;
	                                    },
	                                    configurable: true
	                                },
	                                'videoHeight': {
	                                    get: function () {
	                                        return videoHeight;
	                                    },
	                                    configurable: true
	                                },
	                                'volume': {
	                                    get: function () {
	                                        return volume;
	                                    },
	                                    set: function (value) {
	                                        volume = value;
	                                        player.vimeo('setVolume', value);
	                                    },
	                                    configurable: true
	                                }
	                            }
	                        );
	                        API.mediaElement[0].play = function () {
	                            player.vimeo('play');
	                        };
	                        API.mediaElement[0].pause = function () {
	                            player.vimeo('pause');
	                        };

	                        player
	                            .vimeo('getVolume', function (value) {
	                                volume = value;
	                                API.onVolumeChange();
	                            })
	                            .vimeo('getCurrentTime', function (value) {
	                                currentTime = value;
	                                updateMetadata();
	                            })
	                            .vimeo('getDuration', function (value) {
	                                duration = value;
	                                updateMetadata();
	                            })
	                    }

	                    function createVimeoIframe(id) {

	                        var optionsArr = attr.vgVimeo !== null ? attr.vgVimeo.split(";") : null;
	                        var playerVars = {
	                            'api': 1,
	                            'player_id': 'vimeoplayer',
	                            'autoplay': false,
	                            'loop': false
	                        };

	                        if (optionsArr) {
	                            optionsArr.forEach(function (item) {
	                                var keyValuePair = item.split("=");
	                                if (playerVars.hasOwnProperty(keyValuePair[0])) {
	                                    playerVars[keyValuePair[0]] = keyValuePair[1] || 0;
	                                }
	                            });
	                        }

	                        var params = Object.keys(playerVars).map(function (i) {
	                            return encodeURIComponent(i) + "=" + encodeURIComponent(playerVars[i]);
	                        }).join('&')

	                        return $('<iframe>', {
	                            src: '//player.vimeo.com/video/' + id + '?' + params,
	                            frameborder: 0,
	                            scrolling: 'no'
	                        }).css({
	                            'width': '100%',
	                            'height': '100%',
	                            //'margin-top': '-200px'
	                        });
	                    }

	                    function wirePlayer() {

	                        player
	                            .on('ready', function () {
	                                configurePlayer();
	                            })
	                            .on('play', function () {
	                                paused = false;
	                                var event = new CustomEvent('playing');
	                                API.mediaElement[0].dispatchEvent(event);
	                                API.setState(VG_STATES.PLAY);
	                            })
	                            .on('pause', function () {
	                                paused = true;
	                                var event = new CustomEvent('pause');
	                                API.mediaElement[0].dispatchEvent(event);
	                                API.setState(VG_STATES.PAUSE);
	                            })
	                            .on('finish', function () {
	                                API.onComplete();
	                            })
	                            .on('playProgress', function (event, data) {
	                                currentTime = data.seconds;
	                                duration = data.duration;
	                                API.onUpdateTime({
	                                    target: API.mediaElement[0]
	                                });
	                            });

	                    }

	                    function onSourceChange(url) {
	                        if (!url) {
	                            if (player) {
	                                player.destroy();
	                            }
	                            return
	                        }

	                        var id = getVideoId(url);
	                        if (!id) {
	                            return;
	                        }

	                        player = createVimeoIframe(id);
	                        // Swap video element with Vimeo iFrame
	                        $(API.mediaElement[0]).replaceWith(player);
	                        wirePlayer(player);
	                    }

	                    scope.$watch(function () {
	                            return API.sources;
	                        },
	                        function (newVal, oldVal) {
	                            if (newVal && newVal.length > 0 && newVal[0].src) {
	                                onSourceChange(newVal[0].src.toString());
	                            }
	                            else {
	                                onSourceChange(null);
	                            }
	                        }
	                    );
	                }
	            };
	        }]
	    );

/***/ },
/* 1 */
/***/ function(module, exports) {

	/**!
	 * Simple jQuery Vimeo API -- By Jeremy Rue
	 * 
	 * Description: A jQuery plugin to easily control Vimeo videos through their API.
	 * Author: Jeremy Rue, jrue@berkeley.edu 
	 * License: MIT
	 * Version: 0.10.3
	 */
	;(function($, window) {

	    var vimeoJqueryAPI = {

	        //catches return messages when methods like getVolume are called. 
	        //counter is if multiple calls are made before one returns.
	        catchMethods : {methodreturn:[], count:0},

	        //This kicks things off on window message event
	        init : function(d){
	            var vimeoVideo,
	                vimeoAPIurl,
	                data;

	            //is this window message from vimeo?
	            if(!d.originalEvent.origin.match(/vimeo/ig)){
	                return;
	            }

	            //make sure data was sent
	            if(!("data" in d.originalEvent)){
	                return;
	            }
	          
	           

	            //store data as JSON object
	            data = $.type(d.originalEvent.data) === "string" ? $.parseJSON(d.originalEvent.data) : d.originalEvent.data;

	            //make sure data is not blank
	            if(!data){
	                return;
	            }

	            //get the id of this vimeo video, hopefully they set it.
	            vimeoVideo = this.setPlayerID(data);

	            //check to see if player_ids were set in query string. If not, wait until next message comes through.
	            if(vimeoVideo.length){

	                vimeoAPIurl  = this.setVimeoAPIurl(vimeoVideo);

	                //If this is an event message, like ready or paused
	                if(data.hasOwnProperty("event"))
	                    this.handleEvent(data, vimeoVideo, vimeoAPIurl);

	                //IF this is a return event message, like getVolume or getCurrentTime
	                if(data.hasOwnProperty("method"))
	                    this.handleMethod(data, vimeoVideo, vimeoAPIurl);

	            }

	        },

	        setPlayerID : function(d){

	            return $("iframe[src*=" + d.player_id + "]");

	        },

	        setVimeoAPIurl : function(d){

	            //prepend vimeo url with proper protocol
	            if(d.attr('src').substr(0, 4) !== 'http'){
	                return 'https:'+d.attr('src').split('?')[0];
	            } else {
	                return d.attr('src').split('?')[0];
	            }
	        },

	        handleMethod : function(d, vid, api){

	            //If the message is returned from a method call, store it for later.
	            this.catchMethods.methodreturn.push(d.value);

	        },

	        handleEvent : function(d, vid, api){

	            switch (d.event.toLowerCase()) {
	                case 'ready':
	                
	                    for(var prop in $._data(vid[0], "events")){
	                        if(prop.match(/loadProgress|playProgress|play|pause|finish|seek|cuechange/)){
	                            vid[0].contentWindow.postMessage(JSON.stringify({method: 'addEventListener', value: prop}), api);
	                        }
	                    }

	                    //if methods are sent before video is ready, call them now
	                    if(vid.data("vimeoAPICall")){
	                        var vdata = vid.data("vimeoAPICall");
	                        for(var i=0; i< vdata.length; i++){
	                            vid[0].contentWindow.postMessage(JSON.stringify(vdata[i].message), vdata[i].api);
	                        }
	                        vid.removeData("vimeoAPICall");
	                    }

	                    //this video is ready
	                    vid.data("vimeoReady", true);
	                    vid.triggerHandler("ready");

	                    break;

	                case 'seek':
	                    vid.triggerHandler("seek", [d.data]);
	                    break;

	                case 'loadprogress':
	                    vid.triggerHandler("loadProgress", [d.data]);
	                    break;

	                case 'playprogress':
	                    vid.triggerHandler("playProgress", [d.data]);
	                    break;

	                case 'pause':
	                    vid.triggerHandler("pause");
	                    break;

	                case 'finish':
	                    vid.triggerHandler("finish");
	                    break;

	                case 'play':
	                    vid.triggerHandler("play");
	                    break;

	                case 'cuechange':
	                    vid.triggerHandler("cuechange");
	                    break;
	            }
	        }
	    };
	    
	    var loadIframe = $.fn.vimeoLoad = function(){

	        //save the current src attribute
	        var url    = $(this).attr('src'),
	            change = false;
	      
	        if(url.substr(0, 6) !== 'https:'){
	            url = url.substr(0,4) === 'http' ? 'https' + url.substr(4) : 'https:' + url;
	            change = true;
	        }

	        //if they haven't added "player_id" in their query string, let's add one.
	        if(url.match(/player_id/g) === null){
	          
	            change = true;
	          
	            //is there already a query string? If so, use &, otherwise ?. 
	            var firstSeperator = (url.indexOf('?') === -1 ? '?' : '&');

	            //setup a serialized player_id with jQuery (use an unusual name in case someone manually sets the same name)
	            var param = $.param({"api": 1, "player_id": "vvvvimeoVideo-" + Math.floor((Math.random() * 10000000) + 1).toString()});
	          
	            url = url + firstSeperator + param;            

	        }
	      
	        if(change){
	          $(this).attr("src", url);
	        }
	  

	        return this;
	    };

	    jQuery(document).ready(function(){

	        //go through every iframe with "vimeo.com" in src attribute, and verify it has "player_id" query string
	        $("iframe[src*='vimeo.com']").each(function(){loadIframe.call(this);});
	    });
	    
	    $(["loadProgress","playProgress","play","pause","finish","seek","cuechange"]).each(function(i,e){
	        jQuery.event.special[e] = {
	          setup: function(data, namespace, eventHandle){
	            
	            var src = $(this).attr("src");
	            if($(this).is("iframe") && src.match(/vimeo/gi)){
	              
	              var element = $(this);
	            
	              if(typeof element.data("vimeoReady") !== "undefined"){
	                  element[0].contentWindow.postMessage(JSON.stringify({
	                    method: 'addEventListener', 
	                    value: e
	                  }), vimeoJqueryAPI.setVimeoAPIurl($(this)));
	              } else {
	                  var _data = typeof element.data("vimeoAPICall") !== "undefined" ? element.data("vimeoAPICall") : [];
	                  _data.push({message:e, api:vimeoJqueryAPI.setVimeoAPIurl(element)});
	                  element.data("vimeoAPICall", _data);
	              }
	            }
	          }
	        };
	    });


	    //this is what kicks things off. Whenever Vimeo sends window message to us, was check to see what it is.
	    $(window).on("message", function(e){ vimeoJqueryAPI.init(e); });

	    /**
	     *  Vimeo jQuery method plugin
	     *
	     * @param element {jQuery Object} The element this was called on (verifies it's an iframe)
	     * @param option1 {string} The method to send to vimeo.
	     * @param option2 {string|function} If a string, it's the value (i.e. setVolume 2) otherwise, it's a callback function
	     */
	    $.vimeo = function(element, option1, option2) {

	        var message = {},
	            catchMethodLength = vimeoJqueryAPI.catchMethods.methodreturn.length;

	        if(typeof option1 === "string")  
	            message.method = option1;

	        if(typeof option2 !== undefined && typeof option2 !== "function") 
	            message.value  = option2;

	        //call method, but check if video was ready, otherwise cue it up with jQuery data to be called when video is ready
	        if(element.is('iframe') && message.hasOwnProperty("method")){
	            if(element.data("vimeoReady")){
	                element[0].contentWindow.postMessage(JSON.stringify(message), vimeoJqueryAPI.setVimeoAPIurl(element));
	            } else {
	                var _data = element.data("vimeoAPICall") ? element.data("vimeoAPICall") : [];
	                _data.push({message:message, api:vimeoJqueryAPI.setVimeoAPIurl(element)});
	                element.data("vimeoAPICall", _data);
	            }
	        }

	        //If this method will return data, (starts with "get") then use callback once return message comes through
	        if((option1.toString().substr(0, 3) === "get" || option1.toString() === "paused") && typeof option2 === "function"){
	            (function(cml, func, i){
	                var interval = window.setInterval(function(){

	                    if(vimeoJqueryAPI.catchMethods.methodreturn.length != cml){
	                        window.clearInterval(interval);
	                        func(vimeoJqueryAPI.catchMethods.methodreturn[i]);
	                    }
	                }, 10);
	            })(catchMethodLength, option2, vimeoJqueryAPI.catchMethods.count);
	            vimeoJqueryAPI.catchMethods.count++;
	        } 
	        return element;
	    };

	    $.fn.vimeo = function(option1, option2) {
	            return $.vimeo(this, option1, option2);
	    };

	})(jQuery, window);

/***/ }
/******/ ]);