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
  'dojo/_base/Color',
  'dojo/json',
  'dojo/on',
  'dojo/topic',
  'dijit/_WidgetsInTemplateMixin',
  'jimu/BaseWidgetSetting',
  'jimu/dijit/TabContainer',
  'jimu/dijit/SimpleTable',
  'jimu/dijit/ColorPicker',
  './SingleChartSetting',
  'dijit/form/NumberTextBox',
  'dijit/form/TextBox',
  'dijit/form/Select'
],
function(declare, lang, array, html, query, Color, json, on, topic, _WidgetsInTemplateMixin,
  BaseWidgetSetting, TabContainer, SimpleTable, ColorPicker, SingleChartSetting, NumberTextBox,
  TextBox, Select) {/* jshint unused: false */
  return declare([BaseWidgetSetting, _WidgetsInTemplateMixin], {
    baseClass: 'jimu-widget-chart-setting',
    tabContainer: null,
    currentSCS: null,

    postCreate: function(){
      this.inherited(arguments);
      this._bindEvents();
      this._initTab();
      this.setConfig(this.config);
    },

    setConfig: function(config){
      this._reset();
      this._showChartsSection();
      this.config = config;

      if(this.config){
        this._initChartsTable(this.config);
        if(this.config.highLightColor){
          var newColor = new Color(this.config.highLightColor);
          this.highLightColor.setColor(newColor);
        }
      }
    },

    getConfig: function(){
      var config = {
        layers:[]
      };
      var trs = this.chartsTable.getRows();
      var tr,singleConfig;
      for(var i=0;i<trs.length;i++){
        tr = trs[i];
        if(tr.dijit){
          singleConfig = tr.dijit.getConfig();
          if(!singleConfig){
            return false;
          }
        }
        else{
          singleConfig = tr.singleConfig;
        }
        config.layers.push(lang.clone(singleConfig));
      }
      var color = this.highLightColor.getColor();
      config.highLightColor = color.toHex();
      return config;
    },

    _onBtnAddChartSourceClicked: function(){
      var result = this.chartsTable.addRow({
        label: '',
        labelField: ''
      });

      if(result.success && result.tr){
        this._createSingleChartSetting(result.tr, true, null);
        this._showSingleChartSection();
      }
    },

    _bindEvents: function(){
      this.own(on(this.chartsTable,'actions-edit',lang.hitch(this,function(tr){
        this._createSingleChartSetting(tr, false, tr.singleConfig);
        this._showSingleChartSection();
      })));

      this.own(on(this.chartsTable,'row-delete',lang.hitch(this,function(tr){
        var singleChart = tr.dijit;
        if(singleChart){
          singleChart.destroy();
        }
        delete tr.dijit;
      })));

      this.own(on(this.chartsTable,'rows-clear',lang.hitch(this,function(trs){
        array.forEach(trs,lang.hitch(this, function(tr){
          var singleChart = tr.dijit;
          if(singleChart){
            singleChart.destroy();
          }
          delete tr.dijit;
        }));
      })));
    },

    _showChartsSection:function(){
      html.setStyle(this.chartsSection,'display','block');
      html.setStyle(this.singleChartSection,'display','none');
    },

    _showSingleChartSection:function(){
      html.setStyle(this.chartsSection,'display','none');
      html.setStyle(this.singleChartSection,'display','block');
    },

    //tr.dijit, tr.singleConfig
    _createSingleChartSetting: function(trDom, isNewAdd, /* optional */ singleConfig){
      var args = {
        map: this.map,
        nls: this.nls,
        isNewAdd: isNewAdd,
        config: singleConfig
      };

      var scs = new SingleChartSetting(args);
      scs.placeAt(this.singleChartSection);
      scs.startup();

      this.own(on(scs, 'edit', lang.hitch(this, function(singleConfig){
        trDom.singleConfig = lang.clone(singleConfig);
        this.chartsTable.editRow(trDom, {
          label: singleConfig.label || '',
          labelField: singleConfig.labelField || ''
        });
        if (trDom.dijit) {
          trDom.dijit.destroy();
        }
        trDom.dijit = null;
        delete trDom.dijit;
        this._showChartsSection();
      })));

      this.own(on(scs, 'cancel', lang.hitch(this, function(){
        if (trDom.dijit) {
          trDom.dijit.destroy();
        }
        trDom.dijit = null;
        delete trDom.dijit;
        if(isNewAdd){
          this.chartsTable.deleteRow(trDom);
        }
        this._showChartsSection();
      })));

      trDom.dijit = scs;
      return trDom;
    },

    _initTab:function(){
      this.tabContainer = new TabContainer({
        tabs:[{
          title:this.nls.chartSources,
          content:this.sourcesTabNode
        },{
          title:this.nls.general,
          content:this.generalTabNode
        }],
        isNested: true
      },this.viewStack);

      this.tabContainer.startup();
    },

    _reset:function(){
      this.chartsTable.clear();
    },

    _initChartsTable:function(config){
      this.chartsTable.clear();
      var layers = config && config.layers;
      if(!(layers && layers.length > 0)){
        return;
      }
      array.forEach(layers, lang.hitch(this,function(singleConfig){
        var rowData = {
          label: singleConfig.label || '',
          labelField: singleConfig.labelField || ''
        };
        var result = this.chartsTable.addRow(rowData);
        if(result.success){
          result.tr.singleConfig = lang.clone(singleConfig);
        }
      }));
    }
  });
});