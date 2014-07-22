///////////////////////////////////////////////////////////////////////////
// Copyright © 2014 Esri. All Rights Reserved.
//
// Licensed under the Apache License Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//    http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.
///////////////////////////////////////////////////////////////////////////

define([
    'dojo/_base/declare',
    'dojo/_base/lang',
    'dojo/_base/array',
    'dojo/_base/html',
    'dojo/_base/query',
    'dojo/on',
    'dijit/_WidgetsInTemplateMixin',
    'jimu/BaseWidgetSetting',
    'jimu/dijit/URLInput',
    'dijit/form/NumberSpinner',
    'dijit/form/TextBox',
    'dijit/form/Select'
  ],
  function(declare, lang, array, html, query, on, _WidgetsInTemplateMixin, BaseWidgetSetting, URLInput, NumberSpinner, TextBox, Select) {/*jshint unused: false*/
    return declare([BaseWidgetSetting, _WidgetsInTemplateMixin], {
      baseClass: 'jimu-widget-directions-setting',

      postCreate: function() {
        this.inherited(arguments);
        this.setConfig(this.config);
      },

      setConfig: function(config) {
        this.config = config;
        if(!this.config){
          return;
        }
        this.routeUrl.set('value',this.config.routeTaskUrl||'');
        this.locatorUrl.set('value',this.config.locatorUrl||'');
        var geocoderOptions = this.config.geocoderOptions;
        if(geocoderOptions){
          this.autoComplete.checked = geocoderOptions.autoComplete === true;
          this.maxLocations.set('value',geocoderOptions.maxLocations);
          this.minCharacters.set('value',geocoderOptions.minCharacters);
          this.searchDelay.set('value',geocoderOptions.searchDelay);
          var arcgisGeocoder = geocoderOptions.arcgisGeocoder;
          if(arcgisGeocoder){
            this.placeholder.set('value',arcgisGeocoder.placeholder||'');
          }
        }
        var routeOptions = this.config.routeOptions;
        if(routeOptions){
          this.directionsLanguage.set('value',routeOptions.directionsLanguage);
          this.directionsLengthUnits.set('value',routeOptions.directionsLengthUnits);
          this.directionsOutputType.set('value',routeOptions.directionsOutputType);
          this.impedanceAttribute.set('value',routeOptions.impedanceAttribute);
        }
      },

      getConfig: function() {
        this.config = {
          "routeTaskUrl": this.routeUrl.get('value'),
          "locatorUrl": this.locatorUrl.get('value'),
          "geocoderOptions": {
            "autoComplete": this.autoComplete.checked,
            "maxLocations": this.maxLocations.get('value'),
            "minCharacters": this.minCharacters.get('value'),
            "searchDelay": this.searchDelay.get('value'),
            "arcgisGeocoder": {
              "placeholder": this.placeholder.get('value')
            }
          },
          "routeOptions": {
            "directionsLanguage": this.directionsLanguage.get('value'),
            "directionsLengthUnits": this.directionsLengthUnits.get('value'),
            "directionsOutputType": this.directionsOutputType.get('value'),
            "impedanceAttribute": this.impedanceAttribute.get('value')
          }
        };
        return this.config;
      }

    });
  });