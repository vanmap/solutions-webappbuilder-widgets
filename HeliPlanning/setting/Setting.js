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
    'dojo/on',
    'dijit/_WidgetsInTemplateMixin',
    'jimu/BaseWidgetSetting',
    'jimu/dijit/SimpleTable'
  ],
  function(declare, lang, array, on, _WidgetsInTemplateMixin, BaseWidgetSetting) {
    return declare([BaseWidgetSetting, _WidgetsInTemplateMixin], {
      baseClass: 'jimu-widget-HeliPlanning-setting',
      HeliParams:null,

      postMixInProperties:function(){
        this.inherited(arguments);
      },
      
      postCreate: function() {
        this.inherited(arguments);
        this.own(on(this.btnAddAirframe, 'click', lang.hitch(this, this._addAirframe)));
        this.own(on(this.airframeTable, 'row-delete'));
        this.setConfig(this.config);
      },

      startup: function() {
        this.inherited(arguments);
      },

      setConfig: function(config) {
        this.config = config;
        this._setAirframeTable(this.config.HeliParams);
      },

      _setAirframeTable:function(HeliParams){
        this.airframeTable.clear();
        array.forEach(HeliParams, lang.hitch(this, function(item){
          var rowData = {
            vehicle:item.vehicle,
            maxSpeed:item.maxSpeed,
            cruiseSpeed:item.cruiseSpeed
          };
          var result = this.airframeTable.addRow(rowData);
        }));
      },
      
      getConfig: function() {
        var config = {
          HeliParams:[],
        };
        config.HeliParams = this._getConfig();
        return config;
      },

      _getConfig:function(){
        var result = [];
        var trs = this.airframeTable.getRows();
        result = array.map(trs, lang.hitch(this, function(tr){
          var data = this.airframeTable.getRowData(tr);
          var heliInfo = {
            vehicle:data.vehicle,
            maxSpeed:data.maxSpeed,
            cruiseSpeed:data.cruiseSpeed,
          };
          return heliInfo;
        }));
        return result;
      },

      _addAirframe:function(){
        var rowData = {
          vehicle:'Helicopter Name (Double click to change)',
          maxSpeed:'Double Click to add value',
          cruiseSpeed:'Double Click to add value'
        };
        this.airframeTable.addRow(rowData);        
      }      
    });
  });