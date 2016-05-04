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
    'dojo/_base/query',
    'dojo/_base/html',
    'dojo/_base/array',
    'dojo/dom-class',
    'dojo/dom-construct',
    'dojo/on',
    'dijit/_WidgetsInTemplateMixin',
    'jimu/BaseWidget',
    'jimu/dijit/Message',
    'jimu/utils',
    'jimu/filterUtils',
    'jimu/dijit/FilterParameters',
    'jimu/LayerInfos/LayerInfos',
    'esri/layers/FeatureLayer'
  ],
  function(declare, lang, query, html, array, domClass, domConstruct, on, _WidgetsInTemplateMixin,
    BaseWidget, Message, jimuUtils, FilterUtils, FilterParameters, LayerInfos,
    FeatureLayer) {

    return declare([BaseWidget, _WidgetsInTemplateMixin], {
      name: 'Query',
      baseClass: 'jimu-widget-query',
      isValidConfig:false,
      currentAttrs:null,

      operationalLayers: null,

      currentSingleTask: null,

      defaultDef: [],
      layerList: [],
      filterList: [],

      _getCurrentAttrs: function(){
        if(this.currentSingleTask){
          return this.currentSingleTask.getCurrentAttrs();
        }
        return null;
      },

      /*
      test:
      http://map.floridadisaster.org/GIS/rest/services/Events/FL511_Feeds/MapServer/4
      http://maps.usu.edu/ArcGIS/rest/services/MudLake/MudLakeMonitoringSites/MapServer/0
      http://sampleserver6.arcgisonline.com/arcgis/rest/services/USA/MapServer/0
      1. if queryType is 1, it means that the query supports OrderBy and Pagination.
         such as: http://services2.arcgis.com/K1Xet5rYYN1SOWtq/ArcGIS/rest/services/
         USA_hostingFS/FeatureServer/0
      2. if queryType is 2, it means that the query supports objectIds, but
         doesn't support OrderBy or Pagination.
         such as: http://sampleserver6.arcgisonline.com/arcgis/rest/services/USA/MapServer
      3. if queryType is 3, it means that the query doesn't support objectIds.
      */

      postMixInProperties: function(){
        this.inherited(arguments);
        this.operationalLayers = [];
        if(this.config){
          this._updateConfig();
        }
      },

      _updateConfig: function(){
        if(this.config && this.config.filterSets && this.config.filterSets.length > 0){
          array.forEach(this.config.filterSets, lang.hitch(this, function(Configs){
            array.forEach(Configs, lang.hitch(this, function(singleConfig){
              this._rebuildFilter(singleConfig.url, singleConfig.filter);
            }));
          }));
        }
      },

      _rebuildFilter: function(url, filter){
        try{
          if(filter){
            delete filter.expr;
            var filterUtils = new FilterUtils();
            filterUtils.isHosted = jimuUtils.isHostedService(url);
            filterUtils.getExprByFilterObj(filter);
          }
        }catch(e){
          console.log(e);
        }
      },

      postCreate:function(){
        this.inherited(arguments);
        this._createMapLayerList();
        this._initSelf();
      },

      onOpen: function(){
      },

      onActive: function(){
        this.map.setInfoWindowOnClick(false);
      },

      onDeActive: function(){
      },

      onClose:function(){
        this.inherited(arguments);
      },

      destroy:function(){
        this.inherited(arguments);
      },


      _createMapLayerList: function() {
        this.defaultDef = [];
        this.layerList = [];
        LayerInfos.getInstance(this.map, this.map.itemInfo)
          .then(lang.hitch(this, function(operLayerInfos) {
            if(operLayerInfos._layerInfos && operLayerInfos._layerInfos.length > 0) {
              this.layerList = operLayerInfos._layerInfos;
                  array.forEach(this.layerList, lang.hitch(this, function(layer) {
                    if(layer.originOperLayer.layerType !== "ArcGISTiledMapServiceLayer" && typeof(layer.originOperLayer.featureCollection) === 'undefined') {

                      if(typeof(layer.layerObject._defnExpr) !== 'undefined') {
                        this.defaultDef.push({layer: layer.id, definition: layer.layerObject._defnExpr, visible: layer.layerObject.visible});
                      }
                      else if(typeof(layer.layerObject.defaultDefinitionExpression) !== 'undefined' &&
                        typeof(layer.layerObject.getDefinitionExpression()) === 'function' ) {
                        this.defaultDef.push({layer: layer.id, definition: layer.layerObject.getDefinitionExpression(), visible: layer.layerObject.visible});
                      }
                      else if(typeof(layer.layerObject.layerDefinitions) !== 'undefined') {
                        this.defaultDef.push({layer: layer.id, definition: layer.layerObject.layerDefinitions, visible: layer._visible});
                      }
                      else {
                        this.defaultDef.push({layer: layer.id, definition: "1=1", visible: layer.layerObject.visible});
                      }
                    }
                  }));
            }
          }));
      },

      _isConfigValid:function(){
        return this.config && typeof this.config === 'object';
      },

      _initSelf:function(){

        this.isValidConfig = this._isConfigValid();
        if(!this.isValidConfig){
          html.setStyle(this.queriesNode, 'display', 'none');
          html.setStyle(this.invalidConfigNode, {
            display:'block',
            left:0
          });
          html.setStyle(this.btnClearAll, 'display', 'none');
          return;
        }

        var filters = this.config.filterSets;

        if(filters.length === 0){
          html.setStyle(this.queriesNode, 'display', 'none');
          html.setStyle(this.noQueryTipSection, 'display', 'block');
          html.setStyle(this.btnClearAll, 'display', 'none');
          return;
        }

        array.forEach(filters, lang.hitch(this, function(singleConfig, index){
          var name = singleConfig.name;
          var strTr = '<tr class="single-query jimu-table-row">' +
          '<td class="first-td"></td>' +
          '<td class="second-td">' +
            '<div class="query-name-div"></div><div class="query-name-input-hide"></div>' +
          '</td>' +
          '<td class="third-td">' +
            '<div class="arrow"></div>' +
          '</td>' +
          '</tr>';
          var tr = html.toDom(strTr);
          var queryNameDiv = query(".query-name-div", tr)[0];
          queryNameDiv.innerHTML = jimuUtils.stripHTML(name);
          html.place(tr, this.queriesTbody);
          this.own(on(queryNameDiv, "click", lang.hitch(this, this._onQueryListClicked)));

          tr.singleConfig = singleConfig;
          if(index % 2 === 0){
            html.addClass(tr, 'even');
          }
          else{
            html.addClass(tr, 'odd');
          }
        }));

      },

      _onQueryListClicked:function(event){

        var target = event.target || event.srcElement;
        var tr = jimuUtils.getAncestorDom(target, lang.hitch(this, function(dom){
            return html.hasClass(dom, 'single-query');
        }), 10);
        if(!tr){
          return;
        }

        this.filterList = [];
        var singleConfig = tr.singleConfig;

        var inputFlag = false;
        array.forEach(singleConfig.filters, lang.hitch(this, function(fltr) {

          var filterInfo = fltr.filter;
          var filterUtils = new FilterUtils();
          if(filterUtils.isAskForValues(filterInfo)) {
            inputFlag = true;
          }

          this._checkAllLayers({filterObj: fltr});
        }));

        if(inputFlag){
          this.resetLayerDef();
          this._checkUserInput(singleConfig.filters, tr);
        }
        else{
          //not asking for input, just execute layer def
          this.resetLayerDef();
          this.applyFilterToLayer(this.filterList);
        }

        domClass.add(tr, "active-filter");

      },


      applyFilterToLayer: function(params) {
        //console.log(params);
        array.forEach(params, lang.hitch(this, function(param) {
          if((param.layer.originOperLayer.layerType).indexOf("MapService") > -1) {

            param.layer.layerObject.setLayerDefinitions(param.filter);
            param.layer.layerObject.setVisibility(true);

          } else {
            //it's a feature layer, just apply filter
            param.layer.layerObject.setDefinitionExpression(param.filter);
            param.layer.layerObject.setVisibility(true);
          }
        }));
      },

      // get tab layers
      _checkAllLayers: function(params) {
        array.forEach(this.layerList, lang.hitch(this, function(layer) {
          if(layer.newSubLayers.length > 0) {
            var buildExp = [];
            this._recurseOpLayers(layer.newSubLayers, params, buildExp);
          } else {
            if (params.filterObj.name === layer.title) {
              var newFilter = params.filterObj.filter.expr;
              this.filterList.push({layer:layer, filter:newFilter, originObject: layer});
            }
          }
        }));
      },

      _recurseOpLayers: function(pNode, params, build) {
        var nodeGrp = pNode;
        array.forEach(nodeGrp, lang.hitch(this, function(Node) {
          if(Node.newSubLayers.length > 0) {
            this._recurseOpLayers(Node.newSubLayers, params, build);
          } else {
            if (params.filterObj.name === Node.title) {
              var msSubId = Node.originOperLayer.mapService.subId;
              build[msSubId] = params.filterObj.filter.expr;
              if(this.filterList.length > 0) {
                array.forEach(this.filterList, lang.hitch(this, function(list) {
                  if(typeof(list.layer) !== 'undefined') {
                    if(list.layer === Node.parentLayerInfo)  {
                      list.filter[msSubId] = params.filterObj.filter.expr;
                    } else {
                      this.filterList.push({layer:Node.parentLayerInfo, filter:build, originObject: Node});
                    }
                  } else {
                    this.filterList.push({layer:Node.parentLayerInfo, filter:build, originObject: Node});
                  }
                }));
              } else {
                this.filterList.push({layer:Node.parentLayerInfo, filter:build, originObject: Node});
              }
            }
          }
        }));
      },


      resetLayerDef: function() {
        var queryNameInput = query(".query-name-input-show");
        array.forEach(queryNameInput, lang.hitch(this, function(input) {
          domClass.replace(input, "query-name-input-hide", "query-name-input-show");
        }));
        var queryArrow = query(".arrow-down");
        array.forEach(queryArrow, lang.hitch(this, function(input) {
          domClass.replace(input, "arrow", "arrow-down");
        }));
        var queryActFil = query(".active-filter");
        array.forEach(queryActFil, lang.hitch(this, function(input) {
          domClass.remove(input, "active-filter");
        }));

        array.forEach(this.layerList, lang.hitch(this, function(layer) {
          array.forEach(this.defaultDef, lang.hitch(this, function(def) {
            if(def.layer === layer.id ) {
              if(typeof(layer.layerObject.defaultDefinitionExpression) !== 'undefined'){
                layer.layerObject.setDefinitionExpression(def.definition);
              }
              else if(typeof(layer.layerObject.layerDefinitions) !== 'undefined') {
                //layer.layerObject.setDefaultLayerDefinitions();
                layer.layerObject.setLayerDefinitions(def.definition);
              }
              else {
                layer.layerObject.setDefinitionExpression(def.definition);
              }

              layer.layerObject.setVisibility(def.visible);
            }
          }));
        }));
      },


      _checkUserInput: function(params, tr) {
        var arrParams = [];
        var queryNameInput = query(".query-name-input-hide", tr)[0];
        domClass.replace(queryNameInput, "query-name-input-show", "query-name-input-hide");
        domConstruct.empty(queryNameInput);

        var queryArrow = query(".arrow", tr)[0];
        domClass.replace(queryArrow, "arrow-down", "arrow");

        array.forEach(params, lang.hitch(this, function(param) {
          array.forEach(this.filterList, lang.hitch(this, function(lyr) {
            if(lyr.originObject.title === param.name) {
               array.forEach(param.filter.parts, lang.hitch(this, function(part) {
                //show field context types (dates, numbers, etc)
                var inputParam = new FilterParameters();
                inputParam.placeAt(queryNameInput);
                inputParam.startup();

                var layerUrl = param.url;
                var partsObj = lang.clone(param.filter);
                if(lyr.originObject.parentLayerInfo !== null) {
                  var newFL = new FeatureLayer(param.url);
                  this.own(on(newFL, "load", lang.hitch(this, function() {
                    inputParam.build(layerUrl, newFL, partsObj);
                    arrParams.push(inputParam);
                  })));
                } else {
                  inputParam.build(layerUrl, lyr.layer.layerObject, partsObj);
                  arrParams.push(inputParam);
                }

              }));
            }
          }));
        }));

        var divBtn = domConstruct.create("div",{
          'class': 'jimu-btn jimu-priority-secondary btn-clear-all',
          innerHTML: "Apply",
          onclick: lang.hitch(this, function(){
              var valid = this._modifyFilterInputs(arrParams);
              if(valid) {
                this.applyFilterToLayer(this.filterList);
              } else {
                new Message({
                  message : "All fields need a value"
                });
              }
          })
        });
        domConstruct.place(divBtn, queryNameInput);


      },

      _modifyFilterInputs: function(params) {
        var noInput = array.some(params, lang.hitch(this, function(param) {
          return (param.getFilterExpr() === null);
        }));
        if(noInput === true) {
          return false;
        } else {
          array.forEach(params, lang.hitch(this, function(param) {
              var expr = param.getFilterExpr();
              array.forEach(this.filterList, lang.hitch(this, function(lyr) {
                //console.log(param);
                //console.log(lyr);

                if(lyr.originObject.parentLayerInfo !== null) {
                  if(lyr.originObject.title === param.layerInfo.name) {
                    var buildExp =[];
                    buildExp[param.layerInfo.layerId] = expr;
                    lyr.filter = buildExp;
                    console.log(lyr);
                    //think about any need to append.
                  }
                } else {
                  if(lyr.originObject.id === param.layerInfo.id) {
                    lyr.filter = expr;
                    //think about any need to append.
                  }
                }
              }));
          }));
          return true;
        }
      },

      _onBtnClearAllClicked: function(){
        this.resetLayerDef();
      },

      /*-------------------------common functions----------------------------------*/
      _zoomToLayer: function(gl){
        var currentAttrs = this._getCurrentAttrs();
        if(!this._isTable(currentAttrs.layerInfo)){
          var ext = jimuUtils.graphicsExtent(gl.graphics, 1.4);
          if(ext){
            this.map.setExtent(ext);
          }
        }
      }

    });
  });