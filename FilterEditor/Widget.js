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
    'dojo/_base/array',
    'dojo/_base/lang',
    'dojo/dom',
    'dojo/on',
    'dojo/aspect',
    'dijit/_WidgetsInTemplateMixin',
    'jimu/BaseWidget',
    'jimu/LayerInfos/LayerInfos',
    'jimu/dijit/Message',
    'esri/dijit/Legend',
    'jimu/dijit/CheckBox',
    "dijit/layout/TabContainer",
    "dijit/layout/ContentPane",

    './FilterEditor',
],
  function (
    declare,
    array,
    lang,
    dom,
    on,
    aspect,
    _WidgetsInTemplateMixin,
    BaseWidget,
    LayerInfos,
    Message,
    Legend,
    CheckBox,
    TabContainer,
    ContentPane,
    FilterEditor) {
      var clazz = declare([BaseWidget, _WidgetsInTemplateMixin], {

          name: 'FilterEditor',
          baseClass: 'jimu-widget-FilterEditor',
          startup: function () {
              this.inherited(arguments);

               var layerList = [
                   {
                       "featureLayer": {
                          "url": "http://sampleserver6.arcgisonline.com/arcgis/rest/services/Wildfire/FeatureServer/0"
                       }
                   },
                   {
                       "featureLayer": {
                           "url": "http://sampleserver6.arcgisonline.com/arcgis/rest/services/Wildfire/FeatureServer/1"
                       }
                   },
                   {
                       "featureLayer": {
                           "url": "http://sampleserver6.arcgisonline.com/arcgis/rest/services/Wildfire/FeatureServer/2"
                       }
                   },
                   {
                       "featureLayer": {
                           "url": "http://sampleserver6.arcgisonline.com/arcgis/rest/services/RedlandsEmergencyVehicles/FeatureServer/0"
                       }
                   }
              ];

              var filterEditor = new FilterEditor({
                  inputFeatureLayers: layerList,
                  map: this.map,
                  toolbarOptions: { displayEditorToolbar: true, enableUndoRedo: false, mergeVisible: true, cutVisible: false, reshapeVisible: true },
                  templatePickerOptions: { columnnsToDisplay: 4, height: 325 }

              }, this.filterEditorDiv);

              filterEditor.startup();
          }
      });

      return clazz;
  });