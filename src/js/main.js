/**
 * @license
 * Copyright (c) 2014, 2020, Oracle and/or its affiliates.
 * Licensed under The Universal Permissive License (UPL), Version 1.0
 * as shown at https://oss.oracle.com/licenses/upl/
 * @ignore
 */
'use strict';

/**
 * Example of Require.js boostrap javascript
 */

 // The UserAgent is used to detect IE11. Only IE11 requires ES5.
(function () {
  
  function _ojIsIE11() {
    var nAgt = navigator.userAgent;
    return nAgt.indexOf('MSIE') !== -1 || !!nAgt.match(/Trident.*rv:11./);
  };
  var _ojNeedsES5 = _ojIsIE11();

  requirejs.config(
    {
      baseUrl: 'js',

      paths:
      /* DO NOT MODIFY 
      ** All paths are dynamicaly generated from the path_mappings.json file.
      ** Add any new library dependencies in path_mappings.json file
      */
      // injector:mainReleasePaths
      {
        'knockout': 'libs/knockout/knockout-3.5.1.debug',
        'jquery': 'libs/jquery/jquery-3.5.1',
        'jqueryui-amd': 'libs/jquery/jqueryui-amd-1.12.1',
        'hammerjs': 'libs/hammer/hammer-2.0.8',
        'ojdnd': 'libs/dnd-polyfill/dnd-polyfill-1.0.2',
        'ojs': 'libs/oj/v9.2.0/debug' + (_ojNeedsES5 ? '_es5' : ''),
        'ojL10n': 'libs/oj/v9.2.0/ojL10n',
        'ojtranslations': 'libs/oj/v9.2.0/resources',
        'text': 'libs/require/text',
        'signals': 'libs/js-signals/signals',
        'customElements': 'libs/webcomponents/custom-elements.min',
        'proj4': 'libs/proj4js/dist/proj4-src',
        'css': 'libs/require-css/css',
        'touchr': 'libs/touchr/touchr',
        'corejs': 'libs/corejs/shim',
        'chai': 'libs/chai/chai-4.2.0',
        'regenerator-runtime': 'libs/regenerator-runtime/runtime'
      }
      // endinjector
    }
  );
}());

/**
 * A top-level require call executed by the Application.
 * Although 'knockout' would be loaded in any case (it is specified as a  dependency
 * by some modules), we are listing it explicitly to get the reference to the 'ko'
 * object in the callback
 */
require(['ojs/ojbootstrap', 'knockout', 'appController', 'ojs/ojknockout', 'ojs/ojbutton', 'ojs/ojtoolbar', 'ojs/ojmenu', 'jquery', 'ojs/ojformlayout', 'ojs/ojselectcombobox', 'ojs/ojdatetimepicker', 'ojs/ojvalidation-datetime', 'ojs/ojtimezonedata', 'ojs/ojlabel', 'ojs/ojbutton'],
  function (Bootstrap, ko, app) { // this callback gets executed when all required modules are loaded

      Bootstrap.whenDocumentReady().then(
        function() {
          /*
            Parameters send from the webview are saved in a window object named "webviewParameters". In this sample
            the parameters contain information provided by the user in the bot conversation. 
          */ 
          let webviewParameters = window.webviewParameters != null ? window.webviewParameters['parameters'] : null;

          /*
            helper function to read named webview parameter
          */
          
          let getWebviewParam = (arrParams, key, defaultValue) => {
            if (arrParams) {
              let param = arrParams.find(e => {
                return e.key === key;
              });
              return param ? param.value : defaultValue;
              }
          return defaultValue;
          };

          /*
            Setting default values for the origin and destination of a trip in case no 
            information is provided in the request 
          */ 
          
          self.origin = ko.observable(getWebviewParam(webviewParameters, 'origin', 'CDG'));
          self.destination = ko.observable(getWebviewParam(webviewParameters, 'destination', 'SFO'));                            
                  
          /*
            When the user submits ot cancels the web form, control need to be passed back to the bot, 
            For this a callback URL is passed from the webview to the web application. The parameter
            holding the information is "webview.done" 
          */
          var webViewCallback = getWebviewParam(webviewParameters, 'webview.onDone', null);

          /*
            Get current date
          */ 
          let today = new Date();

          /*
            Get the departure date from the webview parameters. If not found, set variable to null. In a second step, replace 
            the null date with the current date
          */       

          let dateInRequest = getWebviewParam(webviewParameters, 'departureDateInMS', null);
          
          //if date is provided in request, create new JS Date and parse to ISO string
          self.departureDate = ko.observable(dateInRequest != null ? (new Date(new Number(dateInRequest))).toISOString() : today.toISOString());
          let _minDate = new Date(self.departureDate());
          _minDate.setUTCHours(0, 0, 0, 0)

          /*
            Set the calendar range so that return date cannot be before departure date. Departure date
            cannot be selected before current date (its not a time machine) 
          */       
          self.minDateDeparture = ko.observable(_minDate.toISOString());
          self.minDateReturn = ko.observable(self.departureDate());

          /*
            If departure date is passed from webview, use it. If not, set it to the same value as departure date 
          */       
          self.returnDate = ko.observable(getWebviewParam(webviewParameters, 'departureDate', self.departureDate()));

          self.buttonClick = function (event) {
            if (event.currentTarget.id === 'Submit') {
    
             /*
               Get the values from the web form and send them to the bot
             */ 
              let data = {};
              data.origin = self.origin();
              data.destination = self.destination();
    
              //return date in milliseconds
              data.departureDate = (new Date(self.departureDate())).getTime();
              data.returnDate = (new Date(self.returnDate())).getTime();
             /*
               Add a status property to the  response to make it easy for the bot designer to tell 
               whether a user submitted a form or pressed cancel
             */           
              data.status = "success"
              //JQuery post call          
              $.post(webViewCallback, JSON.stringify(data));
            }else {
              /*
                In case of cancel, return data object that has a status property for cancel only 
               */ 
                let data = {};
                data.status = "cancel"
      
                //JQuery post call          
                $.post(webViewCallback, JSON.stringify(data));          
              }
      
              const sleep = (milliseconds) => {
                return new Promise(resolve => setTimeout(resolve, milliseconds))
              }
      
              //Closes the browser tab the window is opened in. When closing the browser 
              //tab, ensure the ajax call gets trough before the the tab closes. Thus adding 
              //a "sleep" time
              sleep(500).then(() => {                  
                  window.open('', '_self').close();          
              })         
              return true;
          }

          function init() {
            // Bind your ViewModel for the content of the whole page body.
            ko.applyBindings(app, document.getElementById('globalBody'));
          }

          // If running in a hybrid (e.g. Cordova) environment, we need to wait for the deviceready
          // event before executing any code that might interact with Cordova APIs or plugins.
          if (document.body.classList.contains('oj-hybrid')) {
            document.addEventListener("deviceready", init);
          } else {
            init();
          }
        }
      );
    }
);
