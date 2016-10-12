///////////////////////////////////////////////////////////////////////////
// Copyright (c) 2016 Esri. All Rights Reserved.
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

/*global define*/
define([
    'dojo/_base/declare',
    'dojo/_base/lang',
    'dojo/on',
    'dojo/topic',
    'dojo/_base/array',
    'dijit/_WidgetBase',
    'dijit/_TemplatedMixin',
    'dijit/_WidgetsInTemplateMixin',
    'esri/tasks/Geoprocessor',
    'esri/tasks/query',
    'esri/tasks/QueryTask',
    'dojo/text!./templates/TabDeleteGRG.html'
], function (
    dojoDeclare,
    dojoLang,
    dojoOn,
    dojoTopic,
    array,
    dijitWidgetBase,
    dijitTemplatedMixin,
    dijitWidgetsInTemplate,
    Geoprocessor,
    Query,
    QueryTask,
    templateStr
) {
    'use strict';
    return dojoDeclare([dijitWidgetBase, dijitTemplatedMixin, dijitWidgetsInTemplate], {
        templateString: templateStr,
        baseClass: 'jimu-widget-TabLine',

        constructor: function (args) {
          dojoDeclare.safeMixin(this, args);
        },

        postCreate: function () {       
          this.gpDelete = new Geoprocessor("https://hgis-ags10-4-1.gigzy.local/ags/rest/services/DeleteGRG/GPServer/Delete%20GRG");
          
          this.own(dojoOn(
            this.deleteGRGButton, 
            'click', dojoLang.hitch(this, this.deleteGRG)
          ));
          
          this.syncEvents();
          
          this.updateGridList();
        },

        syncEvents: function () {
          dojoTopic.subscribe('DD_WIDGET_OPEN', dojoLang.hitch(this, this.setGraphicsShown));
          dojoTopic.subscribe('DD_WIDGET_CLOSE', dojoLang.hitch(this, this.setGraphicsHidden));
        },
       
        updateGridList: function () {          
          var queryTask = new QueryTask("https://hgis-ags10-4-1.gigzy.local/ags/rest/services/GRG_Layer/FeatureServer/0");
          var query = new Query();
          query.returnGeometry = false;
          query.outFields = ["grg_name"];
          query.where = "1=1";
          query.returnDistinctValues = true;
          queryTask.execute(query,dojoLang.hitch(this,this.processResults));
        },
        
        processResults: function (results) {
          array.forEach(results.features, dojoLang.hitch(this, function (feature) {            
            this.grgName.addOption([{value: feature.attributes.grg_name, label: feature.attributes.grg_name}]);
          }));
        },
           
        deleteGRG: function () {          
          var params = { 
            "GRG_Name": this.grgName.value, 
          };
          if (this.grgName.value != "")
          {
            this.map.setMapCursor("wait");
            this.gpDelete.submitJob(params, dojoLang.hitch(this,this.gpDeleteComplete));            
          }                    
        },
        
        gpDeleteComplete: function () {          
          this.map.setMapCursor("default");
          this.grgName.removeOption(this.grgName.value);
          this.grgName._setDisplay("")
          
          //refresh each of the feature layers to up date grids after deletion
          for(var j = 0; j < this.map.graphicsLayerIds.length; j++) {
            this.map.getLayer(this.map.graphicsLayerIds[j]).refresh();
          }
        },
        
        setGraphicsHidden: function () {
          if (this._grahicsLayerGRG) {
            this._grahicsLayerGRG.hide();
          }
        },
        
        setGraphicsShown: function () {
          if (this._grahicsLayerGRG) {
            this._grahicsLayerGRG.show();
          }
        }
    });
});
