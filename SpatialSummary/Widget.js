///////////////////////////////////////////////////////////////////////////
// Copyright © 2015 Esri. All Rights Reserved.
//
// Licensed under the Apache License Version 2.0 (the 'License');
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//    http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an 'AS IS' BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.
///////////////////////////////////////////////////////////////////////////
define(['dojo/_base/declare',
        'dijit/_WidgetsInTemplateMixin',
        'dijit/form/Select',
        'dojo/_base/array',
        'dojo/_base/lang',
        'dojo/dom',
        'dojo/dom-construct',
        'dojo/dom-style',
        'dojo/dom-class',
        'dojo/on',
        'dojo/query',
        'jimu/BaseWidget',
        'jimu/dijit/DrawBox',
        'jimu/dijit/SimpleTable',
        'esri/geometry/Polygon',
        'esri/graphic',
        'esri/graphicsUtils',
        'esri/geometry/Extent',
        'esri/geometry/geometryEngine',
        'esri/Color',
        'esri/symbols/SimpleFillSymbol',
        'esri/symbols/SimpleLineSymbol',
        'esri/layers/GraphicsLayer',
        'esri/toolbars/draw',
        'esri/tasks/QueryTask',
        'esri/tasks/query',
        'esri/tasks/StatisticDefinition',
        './mapLayersList'], 
function(declare,
          _WidgetsInTemplateMixin,
          Select,
          array,
          lang,
          dom,
          domConstruct,
          domStyle,
          domClass,
          on,
          domQuery,
          BaseWidget,
          DrawBox,
          SimpleTable,
          Polygon, 
          Graphic, 
          graphicsUtils,
          Extent,
          geometryEngine,
          Color,
          SimpleFillSymbol,
          SimpleLineSymbol,
          GraphicsLayer,
          Draw,
          QueryTask,
          Query,
          StatisticDefinition,
          mapLayersList) {

  return declare([BaseWidget, _WidgetsInTemplateMixin], {
    name: 'SpatialSummary',
    baseClass : 'solutions-widget-spatial_summary',
    graphicLayer: null,
    graphicObject: null,
    operations: {
      'count':[],
      'length':[],
      'area':[],
      'avg':[],
      'min':[],
      'max':[],
      'sum':[],
      'groupby':[]
    },
    export: {
      'recordCount':null,
      'recordCurrentCount':null,
      'records':[]
    },
    summaryLayers: [],
    layerTables: [],
    postCreate : function() {
      //this.inherited(arguments);
    },

    startup : function() {
      this.inherited(arguments);
      //read from config into variables
      this.drawBox.setMap(this.map);
      this._bindEvents();
      
      this._initalizeLookupLayers();
            
      this.graphicLayer = new GraphicsLayer();
      this.map.addLayer(this.graphicLayer);     
    },
  
      showSelectFeatureForm: function() {
      /* radio option to select on polygon feature on the map
       * ensure polygon type is selected
       */ 
       this.btnDraw.checked = false;
       domStyle.set(this.drawArea, 'display', 'none');
    },
    
    showDrawFeatureForm: function() {
      /* radio option to draw a polygon on the map
       * show draw toolbar
       */
      this.btnSelect.checked = false;
      domStyle.set(this.drawArea, 'display', 'block');
    },
   
    _bindEvents: function() {
        //bind DrawBox
        this.own(on(this.drawBox,'DrawEnd',lang.hitch(this,this._callbackGetInputFeature)));
    },
  
    
    _initalizeLookupLayers : function() {
      /* read operational layers and put in arrays
       * show the layers in table for user to select summary items. 
       */     
      this.summaryLayers = [];
      if ((this.map.itemInfo.itemData.operationalLayers).length > 0) {
        var lyrDet = new mapLayersList(this.map);
        lyrDet.getAllMapLayers();
        on(lyrDet, 'complete', lang.hitch(this, this._completeMapLayers));
      } else {
        //this._noLayersDisplay();
      }           
          
    },


    //After the class has returned layers, push only Featurelayers and Layers into the layer list.
    _completeMapLayers: function(args) {
      if (args) {
        array.forEach(args.data.items, lang.hitch(this, function(layer) {           
          var vOperators = lang.clone(this.operations);
          var vExport = lang.clone(this.export);       
          if (layer.type === 'Feature Layer') {
            if(layer.geometryType === 'esriGeometryPoint') { 
            }
            if(layer.geometryType === 'esriGeometryLine') { 
            }             
            if(layer.geometryType === 'esriGeometryPolygon') {;
            }         
            var tempLayer = {
                            "url": layer.url,
                            "name": layer.label,
                            "fields": layer.children,
                            "paritions":[],
                            "stats":vOperators,
                            "export":vExport
                            };            
            this.summaryLayers.push(tempLayer);   
    
          } else if (layer.type === 'Service') {
            array.forEach(layer.children, lang.hitch(this, function(subLayer) {
              if (subLayer.type === 'Layer') {
                  if(subLayer.geometryType === 'esriGeometryPoint') { 
                  }
                  if(subLayer.geometryType === 'esriGeometryLine') { 
                  }             
                  if(subLayer.geometryType === 'esriGeometryPolygon') { 
                  }                   
                   var tempLayer = {
                            "url": subLayer.url,
                            "name": subLayer.label,
                            "fields": subLayer.children,                            
                            "paritions":[],
                            "stats":vOperators,
                            "export":vExport
                            };                
                this.summaryLayers.push(tempLayer);                                
              }
            }));
          } else {
          }
          
        }));
        if (this.summaryLayers.length >= 1) {
          //this.loadLayerTable();
          console.log("done");
        } else {
          //this._noLayersDisplay();
        }
      
      
      array.forEach(this.summaryLayers, lang.hitch(this,function(lay,i) {
        
          var tableID = lay.name + '_table';
          var tableName = lay.name + '_name';
          var tableIcon = lay.name + '_icon';
          var rowName = domConstruct.toDom("<div id='" + tableName + "' class='result-text' >"+lay.name+"</div>");
          var rowIcon = domConstruct.toDom("<img id='" + tableIcon + "' src='" + this.folderUrl + "/images/add_enable.png'>");
          var rowTable = domConstruct.toDom("<div id='" + tableID + "' class='table-holder' ></div>");
          domConstruct.place(rowName, this.tableArea);
          domConstruct.place(rowIcon, rowName, 'first');
          domConstruct.place(rowTable, this.tableArea);
          
          this.createLayerTable(tableID);
          this.own(on(dom.byId(tableIcon), 'click', lang.hitch(this, "addTableRow", lay,i,tableID)));

          //TODO: make these results div hidden during start up
          var resultDataArea = lay.name + '_data';
          var rowName = domConstruct.toDom("<div id='" + resultDataArea + "' class='result-container' >"+ lay.name +"</div>");
          domConstruct.place(rowName, this.resultsArea);

          //wrap in TRY in case layers were not loaded.
              this.own(on(this.layerTables[i], 'row-add', lang.hitch(this, function(tr){
                var rowCount = 0;
                for(key in lay.stats) {
                  array.forEach(lay.stats[key], lang.hitch(this,function(stat){
                    rowCount = rowCount + stat.length;    
                  }));    
                }
                this._createFieldsDropDown(lay,rowCount,tr);
                this._createStatsTypeDropDown(lay,rowCount,tr); 
                
                this.updateSummaryType();
              })));          

              this.own(on(this.layerTables[i], 'row-delete', lang.hitch(this, function(tr){
                if((this.layerTables[i].table.rows).length <= 1) {
                  domStyle.set(dom.byId(tableID),'display','none');
                }
                
                this.updateSummaryType(); 
              })));
                      
      }));        
       
        
      }
    },
   

    //This creates the layer table structure
    createLayerTable : function(pTableLoc) {
      var layerTableFields = [{
        name : 'delete',
        title : 'Remove',
        type : 'actions',
        actions : ['delete']
      }, {
        name : 'func',
        title : 'Function',
        type : 'text'
      }, {
        name : 'fields',
        title : 'Fields',
        type : 'text'
      }, {
        name : 'id',
        type : 'text',
        hidden : true
      }, {
        name : 'url',
        type : 'text',
        hidden : true
      }];
      var args = {
        fields : layerTableFields,
        selectable : false
      };
      
      var table = new SimpleTable(args);
      table.placeAt(dom.byId(pTableLoc));
      table.startup();
      //this.own(on(table, 'checkbox-checked', lang.hitch(this, this.updateSummaryType)));
      
      this.layerTables.push(table);

    },


    _createStatsTypeDropDown: function(pLayer,pI,pTR) {
            var selectOptionArray = [];
            for(key in pLayer.stats) {
              selectOptionArray.push({ 'label': key, 'value': key });            
            }
                     
            var childTDs = pTR.children;
            var vSelectBoxLoc = null;
            for (var i = 0; i < childTDs.length; i++) {
              var td = childTDs[i];
              if(domClass.contains(td, 'func')){
                vSelectBoxLoc = td;
              }              
            }
            if(vSelectBoxLoc) {
              var milliseconds = (new Date).getTime();
              var selectDropDown = new Select({ options: selectOptionArray, id:"'slb_stat_" + pLayer.name + "_" + milliseconds + "'", name:"'slb_stat_" + pLayer.name + "_" + milliseconds + "'" }); 
              selectDropDown.placeAt(vSelectBoxLoc, "only").startup();
            }
      },


    _createFieldsDropDown: function(pLayer,pI,pTR) {
            var selectOptionArray = [];
            array.forEach(pLayer.fields, lang.hitch(this, function(field) {
              selectOptionArray.push({ 'label': field.label, 'value': field.name });            
            }));
                     
            var childTDs = pTR.children;
            var vSelectBoxLoc = null;
            for (var i = 0; i < childTDs.length; i++) {
              var td = childTDs[i];
              if(domClass.contains(td, 'fields')){
                vSelectBoxLoc = td;
              }               
            }
            if(vSelectBoxLoc) {
              var milliseconds = (new Date).getTime();
              var selectDropDown = new Select({ options: selectOptionArray, id:"'slb_fields_" + pLayer.name + "_" + milliseconds + "'", name:"'slbfields_" + pLayer.name + "_" + milliseconds + "'" }); 
              selectDropDown.placeAt(vSelectBoxLoc, "only").startup();
            }
      },


    addTableRow: function(pLayer,pI,pTableLoc) {
      domStyle.set(dom.byId(pTableLoc),'display','block');
      
      var row = this.layerTables[pI].addRow({
        id : pLayer.name,
        url : pLayer.url
      });     
    },
    
    deleteTableRow: function(pLayer,pI) {
      
    },


    updateSummaryType: function() {
      array.forEach(this.summaryLayers, lang.hitch(this, function(layer){
        for(key in layer.stats) {
          layer.stats[key] = [];  
        }
      }));
      
      array.forEach(this.layerTables, lang.hitch(this, function(table) {
        array.forEach(table.tbody.rows, lang.hitch(this, function(tr) {
          var rowData = table.getRowData(tr);
          //console.log(rowData);
          array.forEach(this.summaryLayers, lang.hitch(this, function(layer){
            if(layer.name === rowData.id) {
                for(key in layer.stats) {
                      var validRow = null;
                      var strStart = (rowData.func).indexOf('>') +1;
                      var strEnd = (rowData.func).indexOf('<', strStart);
                      var selectVal = (rowData.func).substring(strStart,strEnd);
                      if(key === selectVal) {
                          validRow = 0;
                      }                     
                      
                      var validExp = null;
                      var validLabel = null;
                      var strStart = (rowData.fields).indexOf('>') +1;
                      var strEnd = (rowData.fields).indexOf('<', strStart);
                      var selectVal = (rowData.fields).substring(strStart,strEnd);
                      array.forEach(layer.fields, lang.hitch(this, function(field){
                        if(field.label === selectVal) {
                          validExp = field.name; 
                          validLabel = field.label;
                        }
                      }));  
                      
                      if(validRow != null && validExp != null) {
                        layer.stats[key].push({'value':validRow, 'expression':validExp, 'label':validLabel}); 
                      }                    
                           
                }
            }  
          }));
        }));
      }));     
    },


      
    _callbackGetInputFeature: function(evt) {
      /* The call back after a valid polygon has been selected
       * or after when a polygon has been drawn.
       */
        domStyle.set(this.resultsArea,'display','block');
        domStyle.set(this.tableArea,'display','none');
        domStyle.set(this.inputArea,'display','none');       
        this.updateSummaryType();
        
        array.forEach(this.summaryLayers, lang.hitch(this,function(layer){
          var process = false;
          for(key in layer.stats) {
            if (layer.stats.hasOwnProperty(key)) {
              array.forEach(layer.stats[key], lang.hitch(this, function(stat){
                if (stat.value != null) {
                  
                  //dom.byId(layer.name + '_data').innerHTML = layer.name;
                  domStyle.set(dom.byId(layer.name + '_data'),'display','block');
                  //TODO: only make picked layers visible.
  
                  var rowDowload = domConstruct.toDom("<img src='"+this.folderUrl+"/images/download-csv.png' id='"+ layer.name +"_download'>"); 
                  domConstruct.place(rowDowload, dom.byId(layer.name + '_data'));                 
                  this.own(on(dom.byId(layer.name + '_download'), 'click', lang.hitch(this, "verifyInputFeatureGeom", evt,layer,evt.geometry,{operation:key,expression:stat.expression,label:stat.label},'export'))); 
                  
                  var resultID = layer.name + '_results';
                  var rowID = layer.name + '_results_' + key + '_' + stat.expression;
                  var resultsTableDOM = domConstruct.toDom("<table id='" + resultID + "' class='results-table' ></table");
                  var rowTable = domConstruct.toDom("<tr id='"+ rowID +"'></tr>");
                  var rowPro = domConstruct.toDom("<td width='14' id='"+ rowID +"_0'><img src='"+ this.folderUrl +"/images/processing.gif' width='14'></td>");
                  var rowExp = domConstruct.toDom("<td class='result-table-label' id='"+ rowID +"_1'>"+ stat.label +"</td>");
                  var rowKey = domConstruct.toDom("<td class='result-table-exp' id='"+ rowID +"_2'>"+ key +"</td>");                    
                  var rowSum = domConstruct.toDom("<td class='result-table-sum' id='"+ rowID +"_3'>0</td>");
                  domConstruct.place(rowPro, rowTable);
                  domConstruct.place(rowExp, rowTable);
                  domConstruct.place(rowKey, rowTable);
                  domConstruct.place(rowSum, rowTable);
                  domConstruct.place(rowTable, resultsTableDOM);
                  domConstruct.place(resultsTableDOM, dom.byId(layer.name + '_data'));                  
                  
                  if(key === 'area' || key === 'length') {                                 
                    var qryStats = this.verifyInputFeatureGeom(evt,layer,evt.geometry,{operation:key,expression:stat.expression,label:stat.label},'countOnly');  
                  } else {
                    var qryStats = this.prepGeomToService(layer,evt.geometry,{operation:key,expression:stat.expression,label:stat.label});   
                  }
                 
                }                  
              }));
            }
          }
 
        }));
                        
    },
    
    verifyInputFeatureGeom: function(pGraphic,pLayer,pGeom,pStat,pAction) {
      /* do a check if geometry already contains less than 1000 records for each summary layer
       * if it has less than 1K, go ahead and store in chunk array
       * if over 1K, split feature by 4 extents, and recurse this function again.
       */  
              var queryTask = new QueryTask(pLayer.url);
              var query = new Query();
                  query.returnGeometry = true;
                  query.geometry = pGeom;
                  query.outFields = ["*"];
              queryTask.executeForCount(query, lang.hitch(this, function(count){
                if(pAction === 'countOnly' || pAction === 'export') {
                  pLayer.export.recordCount = count; 
                  if(pAction === 'export') {
                    pStat.operation = 'export';
                    var recurse = this.verifyInputFeatureGeom(pGraphic,pLayer,pGeom,pStat,null); 
                  } else {
                    var recurse = this.verifyInputFeatureGeom(pGraphic,pLayer,pGeom,pStat,null); 
                  }
                } 
                else {
                  if (count > 500) {
                    var pExtent = pGeom.getExtent();
                    var xmid = (pExtent.xmax + pExtent.xmin) / 2;
                    var ymid = (pExtent.ymax + pExtent.ymin) / 2;
                    var extentArray = new Array();
                    extentArray[0] = new Extent(pExtent.xmin, ymid, xmid, pExtent.ymax, pGraphic.geometry.spatialReference);
                    extentArray[1] = new Extent(xmid, ymid, pExtent.xmax, pExtent.ymax, pGraphic.geometry.spatialReference);
                    extentArray[2] = new Extent(pExtent.xmin, pExtent.ymin, xmid, ymid, pGraphic.geometry.spatialReference);
                    extentArray[3] = new Extent(xmid, pExtent.ymin, pExtent.xmax, ymid, pGraphic.geometry.spatialReference);
                          array.forEach(extentArray, lang.hitch(this,function(arrExt) {
                            if(geometryEngine.intersects(arrExt, pGeom)) { 
                              
                              var newGeom = geometryEngine.clip(pGeom, arrExt);
                            
                            var recurse = this.verifyInputFeatureGeom(pGraphic,pLayer,newGeom,pStat,pAction);  
                            }
                          }));
                    
                  } else {
                      pLayer.paritions.push(pGeom); 
                      this.prepGeomToService(pLayer,pGeom,pStat);               
                  } 
                }        
              }));
    },

    prepGeomToService: function(pLayer,pGeom,pStat) {
      /* for each chunk for each summary layer, add to deferred class object
       * call the query callback
       */
      //TODO: add distinct filter for export (mayeb area and length) so we get current count
              var queryTask = new QueryTask(pLayer.url);
              var query = new Query();
                  query.returnGeometry = true;
                  query.geometry = pGeom;
                  query.outFields = ["*"];
                  
                  if(pStat != null) {
                    if(pStat.operation != 'area' && pStat.operation != 'length' && pStat.operation != 'export') {
                      var statisticDefinition = new StatisticDefinition();
                      if(pStat.operation === 'groupby') {
                        statisticDefinition.statisticType = 'count';
                      } else {
                        statisticDefinition.statisticType = pStat.operation;
                      }
                      statisticDefinition.onStatisticField = pStat.expression;
                      statisticDefinition.outStatisticFieldName = pStat.label;
                      query.outStatistics = [statisticDefinition];
                      if(pStat.operation === 'groupby') {
                        query.groupByFieldsForStatistics = [pStat.expression];   
                      }
                    } 
                  }            
              queryTask.execute(query, 
                lang.hitch(this, function(results){
                  this._callbackQueryService(pLayer,results,pStat.operation,pStat.expression,pGeom);
                }),
                lang.hitch(this, function(results){
                  this._callbackQueryError(pLayer,pStat.operation,pStat.expression);
                })
              );     
         
      
    },
    
    _callbackQueryError: function(pLayer,pStatType,pField) {
      var rowID = pLayer.name + '_results_' + pStatType + '_' + pField;
      dom.byId(rowID + '_0').innerHTML = "<img src='" + this.folderUrl + "/images/error.png' width='14'>";      
    },
    
    _callbackQueryService: function(pLayer,pResults,pStatType,pField,pGeom) {
      /* sequentially send deferred object to query service.
       * successful execution will recurse this function
       * until all deferred objects are sent.
       */  
       
          if(pStatType !== 'length' && pStatType !== 'area' && pStatType !== 'export') {
            this.sumByStat(pLayer,pResults.features,pStatType,pField);
          } else {
              if(pStatType === 'area') {
                this.sumByArea(pLayer,pResults.features,pStatType,pField,pGeom);  
              } else if (pStatType === 'length') {
                this.sumByLength(pLayer,pResults.features,pStatType,pField,pGeom);  
              } else {
                this.exportPrep(pLayer,pResults.features,pStatType,pField,pGeom);  
              }         
          }      
                
         var sfs = new SimpleFillSymbol(SimpleFillSymbol.STYLE_SOLID,
                new SimpleLineSymbol(SimpleLineSymbol.STYLE_DASHDOT,
                new Color([255,255,0]), 2),new Color([0,0,0,0.25])
         );
            
         var gra = new Graphic(pGeom,sfs);
         this.graphicLayer.add(gra);        
              
    },

    sumByStat: function(pLayer,pResults,pStatType,pField) {
      /* take the result and get the record count.
       * append to the global count variable for each summary layer 
       */
        array.forEach(pResults, lang.hitch(this, function(result) {
         for (var f in result.attributes) {
            if( result.attributes.hasOwnProperty(f)) {
              var rowID = pLayer.name + '_results_' + pStatType + '_' + pField;
              dom.byId(rowID + '_0').innerHTML = "<img src='" + this.folderUrl + "/images/complete.png' width='14'>";
              dom.byId(rowID + '_3').innerHTML = parseFloat(result.attributes[f]);
            }
          }          
        }));     
      
    },

    sumByLength: function(pLayer,pResults,pStatType,pField,pGeom) {
      /* Loop through the result use client geomEngine to calculate length
       * append to the global length variable for each summary layer 
       */
      pLayer.export.recordCurrentCount = pLayer.export.recordCurrentCount + pResults.length;
      
      array.forEach(pResults, lang.hitch(this,function(result){
        var intersectGeom = geometryEngine.intersect(result.geometry,pGeom);
        var currLen = geometryEngine.planarLength(intersectGeom);
        
        pLayer.stats.length[0].value =  currLen + parseFloat(pLayer.stats.length[0].value); 
        var rowID = pLayer.name + '_results_' + pStatType + '_' + pField;
        if (pLayer.export.recordCurrentCount >= pLayer.export.recordCount) {
          dom.byId(rowID + '_0').innerHTML = "<img src='" + this.folderUrl + "/images/complete.png' width='14'>";
        }
        dom.byId(rowID + '_3').innerHTML = (pLayer.stats.length[0].value).toFixed(2); 
      })); 
      
    },

    sumByArea: function(pLayer,pResults,pStatType,pField,pGeom) {
      /* Loop through the result use client geomEngine to calculate Area
       * append to the global length variable for each summary layer 
       */
      pLayer.export.recordCurrentCount = pLayer.export.recordCurrentCount + pResults.length;
      
      array.forEach(pResults, lang.hitch(this,function(result){
        var intersectGeom = geometryEngine.intersect(result.geometry,pGeom);
        var currArea = geometryEngine.planarArea(intersectGeom);
        
        pLayer.stats.area[0].value =  currArea + parseFloat(pLayer.stats.area[0].value); 
        var rowID = pLayer.name + '_results_' + pStatType + '_' + pField;
        if (pLayer.export.recordCurrentCount >= pLayer.export.recordCount) {
          dom.byId(rowID + '_0').innerHTML = "<img src='" + this.folderUrl + "/images/complete.png' width='14'>";
        }
        dom.byId(rowID + '_3').innerHTML = (pLayer.stats.area[0].value).toFixed(2); 
      }));      
      
    },


    unionDataToGraphic: function() {
      /* All the returned summary data, append the data back to the graphic
       * Turn graphic different color to signify completion.
       */
    },
    
    clearInputFeature: function() {
      /* clean up functions to clear graphic and data.
       * 
       */
      //TODO: clean up all existing records and record counts
      this.graphicLayer.clear();
      this.drawBox.clear();
      array.forEach(this.summaryLayers, lang.hitch(this, function(layer) { 
        if(dom.byId(layer.name + '_data')) {
          dom.byId(layer.name + '_data').innerHTML = layer.name;
          domStyle.set(dom.byId(layer.name + '_data'),'display','none');
          //domConstruct.destroy(layer.name + '_data');           
        }
        
        layer.export.recordCount = null;
        layer.export.recordCurrentCount = null;
        layer.export.records= [];       
      }));
      
      domStyle.set(this.resultsArea,'display','none');
      domStyle.set(this.tableArea,'display','block');
      domStyle.set(this.inputArea,'display','block'); 
      
    },

    exportPrep: function(pLayer,pResults,pStatType,pField,pGeom) {
      array.forEach(pResults, lang.hitch(this, function(result,i){
        pLayer.export.recordCurrentCount++;
        if (pLayer.export.recordCurrentCount <= pLayer.export.recordCount) {
          (pLayer.export.records).push(result); 
          if (pLayer.export.recordCurrentCount === pLayer.export.recordCount) {
            this.exportToCSV(pLayer);            
          }
        } else {
          this.exportToCSV(pLayer);
        }         
      }));
       
    },
    
    exportToCSV: function(pLayer) {
      //TODO: reset records after CSV export, or clear before next export so results don't double.'
      var csvContent = "data:text/csv;charset=utf-8,";
      var firstRec = pLayer.export.records[0];
      var arrayHeader = [];
      for(key in firstRec.attributes) {
        if (firstRec.attributes.hasOwnProperty(key)) {
          arrayHeader.push(key); 
        }
      }      
      csvContent += arrayHeader.join(",") + "\n"; 
      
      array.forEach(pLayer.export.records, function(rec, index){     
         var tempArray = [];
          for(key in rec.attributes) {
            if (rec.attributes.hasOwnProperty(key)) {
             tempArray.push(rec.attributes[key]); 
            }
          }
          csvContent += tempArray.join(",") + "\n";   
      }); 
     
      var encodedUri = encodeURI(csvContent);
      var link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", pLayer.name + ".csv");     
      link.click(); 
          
      pLayer.export.recordCount = null;
      pLayer.export.recordCurrentCount = null;
      pLayer.export.records= [];          
    }




  });
});
