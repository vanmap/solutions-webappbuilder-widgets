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
  'dojo/dom-construct',
  'dijit/_WidgetsInTemplateMixin',
  'jimu/BaseWidgetSetting',
  'jimu/utils',
  'jimu/filterUtils',
  './QueryLayer',
  'dijit/form/ValidationTextBox',
  'jimu/dijit/SimpleTable',
  'jimu/dijit/TabContainer'
],
function(declare, lang, array, on, domClass, domConstruct, _WidgetsInTemplateMixin, BaseWidgetSetting,
  jimuUtils,  FilterUtils, QueryLayer, ValidationTextBox) {

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

    },

    setConfig:function(config){
      /*
      if(this.currentSQS){
        this.currentSQS.destroy();
      }
      this.currentSQS = null;
      this.queryList.clear();
      */

      this.config = config;
      var filterSets = this.config && this.config.filterSets;
      var validConfig = filterSets && filterSets.length >= 0;
      if(validConfig){

        array.forEach(filterSets, lang.hitch(this, function(singleConfig){
          this.addNewFilterSet({status:'reload', filterSet: singleConfig});
        }));

      } else {
        this.addNewFilterSet({status:'new', filterSet: ""});
      }
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

    addNewFilterSet:function(params){
      var addResult = this.filterList.addRow({name:''});
      var tr = addResult.tr;
      var cell = tr.cells[0];

console.log(this.filterList.getRows());

      this.rowColor();

      this.addFilterSetName({cell: cell, status: params.status, filterSet: params.filterSet});
      this.addFilterSetParams({cell: cell, status: params.status, filterSet: params.filterSet});
    },

    addFilterSetName: function(params) {
      var defaultVal = "";
      if(params.status === "reload") {
        defaultVal = params.filterSet.name;
      }
      var spanLabel = domConstruct.create("span",{
        innerHTML: "Filter set name ",
      });
      domConstruct.place(spanLabel, params.cell);

      this.txtGroupName.push(
        new ValidationTextBox({
          name: "txtFilterName",
          value: defaultVal,
          placeHolder: "Type a filter set name",
          required: "true",
          'class': 'filter-name-textbox'
        })
      );
      this.txtGroupName[this.txtGroupName.length - 1].placeAt(params.cell);
    },

    addFilterSetParams: function(params) {
      var passConfig = this.config;
      if(params.status === "reload") {
        var customConfig = lang.clone(params.filterSet);
        customConfig.queries = params.filterSet.filters;
        delete customConfig.filters;
        passConfig = customConfig;
      }
      this.querySet.push(
        new QueryLayer({
        map: this.map,
        nls: this.nls,
        appConfig: this.appConfig,
        config: passConfig
        })
      );
      this.querySet[this.querySet.length - 1].placeAt(params.cell);
      //this.querySet[this.querySet.length - 1]._updateConfig();
      //this.querySet[this.querySet.length - 1].postCreate();
    },

    rowColor: function() {
      array.forEach(this.filterList.getRows(), lang.hitch(this, function(row, i) {
        if(i % 2 === 0) {
          domClass.remove(row, "row-background-color-even");
          domClass.add(row, "row-background-color-odd");
        } else {
          domClass.remove(row, "row-background-color-odd");
          domClass.add(row, "row-background-color-even");
        }
      }));
    },

    test: function() {

    }


  });
});