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
  'dojo/dom-class',
  'dijit/_WidgetsInTemplateMixin',
  'jimu/BaseWidgetSetting',
  'jimu/dijit/_QueryableLayerSourcePopup',
  'jimu/utils',
  'jimu/filterUtils',
  './QueryLayer',
  'dijit/form/ValidationTextBox',
  'jimu/dijit/SimpleTable',
  'jimu/dijit/TabContainer'
],
function(declare, lang, array, on, domClass, _WidgetsInTemplateMixin, BaseWidgetSetting,
  _QueryableLayerSourcePopup, jimuUtils,  FilterUtils, QueryLayer, ValidationTextBox) {

  return declare([BaseWidgetSetting, _WidgetsInTemplateMixin], {
    baseClass: 'jimu-widget-query-setting',
    currentSQS: null,
    querySet: [],
    txtGroupName: [],

    postMixInProperties: function(){
      this.inherited(arguments);
    },

    postCreate:function(){
      this.inherited(arguments);
      this.startUp();
    },

    startUp:function() {

      this.querySet = [];
      this.txtGroupName = [];

      if(this.config){
        this.setConfig(this.config);
      }

      this.addNewFilterSet();
    },

    setConfig:function(config){
      /*
      if(this.currentSQS){
        this.currentSQS.destroy();
      }
      this.currentSQS = null;
      this.queryList.clear();

      this.config = config;
      var queries = this.config && this.config.queries;
      var validConfig = queries && queries.length >= 0;
      if(validConfig){
        array.forEach(queries, lang.hitch(this, function(singleConfig, index){
          var addResult = this.queryList.addRow({name: singleConfig.name || ''});
          var tr = addResult.tr;
          tr.singleConfig = lang.clone(singleConfig);
          if(index === 0){
            this.queryList.selectRow(tr);
          }
        }));
      }
      */
    },

    getConfig: function () {

        if(this.querySet.length <= 0) {
          return false;
        } else {
          var config = {
            filterSets:[]
          };
          array.forEach(this.querySet, lang.hitch(this, function(qs, i) {
            var groupBlock = {
              name: this.txtGroupName[i].value,
              filters: []
            };
            var results = qs.getConfig();
            array.forEach(results.queries, lang.hitch(this, function(qry) {
              groupBlock.filters.push({
                name: qry.name,
                url: qry.url,
                filter: qry.filter
              });
            }));
            config.filterSets.push(groupBlock);
          }));


          this.config = lang.clone(config);
          return config;
        }

    },

    addNewFilterSet:function(){
      var addResult = this.filterList.addRow({name:''});
      var tr = addResult.tr;
      var tdContent = tr.insertCell(0);
      var tdAction = tr.insertCell(1);
      //if(index === 0){
        //this.filterList.selectRow(tr);
      //}
      domClass.add(tdContent, "filter-set-style");
      domClass.add(tdAction, "filter-set-style");

      this.addFilterSetName({cell: tdContent});
      //this.addFilterSetName()
    },

    addFilterSetName: function(params) {
      this.txtGroupName.push(
        new ValidationTextBox({
          name: "txtFilterName",
          value: "",
          placeHolder: "Type a filter name",
          required: "true"
        })
      );
      this.txtGroupName[this.txtGroupName.length - 1].placeAt(params.cell);

      this.querySet.push(
        new QueryLayer({
        map: this.map,
        nls: this.nls,
        appConfig: this.appConfig,
        config: this.config
        })
      );
      this.querySet[this.querySet.length - 1].placeAt(params.cell);

    },

    test: function() {

    }


  });
});