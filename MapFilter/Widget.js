define([
  'dojo/_base/declare',
  'dijit/_WidgetsInTemplateMixin',
  'jimu/BaseWidget',
  'jimu/dijit/SimpleTable',
  'dojo/dom',
  'dojo/dom-construct',
  'dojo/dom-class',
  'dojo/on',
  'dojo/query',
  'dojo/_base/lang',
  'dojo/_base/array',
  'dijit/form/Select',
  'dijit/form/TextBox',
  'dijit/form/DateTextBox',
  'dijit/registry',
  'jimu/LayerInfos/LayerInfos',
  'jimu/utils',
  './SaveJSON',
  './ReadJSON',
  './LayersHandler'
],
function(declare, _WidgetsInTemplateMixin, BaseWidget, SimpleTable, dom, domConstruct, domClass, on, query, lang, array, Select, TextBox, DateTextBox, registry, LayerInfos, utils, saveJson, readJson, LayersHandler) {
  //To create a widget, you need to derive from BaseWidget.
  return declare([BaseWidget, _WidgetsInTemplateMixin], {

    baseClass: 'jimu-widget-map-filter',

    layerList: null,
    grpSelect: null,
    groupCounter: 0,
    defaultDef: [],
    runTimeConfig: null,
    isAdvMode: false,
    useDomain: null,
    useDate: null,

    postCreate: function() {
      this.inherited(arguments);

    },

    startup: function() {
      this.inherited(arguments);
      //this.mapIdNode.innerHTML = 'map id:' + this.map.id;
      //this.createDivsForFilter();
      this.createMapLayerList();
      //this.createNewRow({operator:"=",value:"",conjunc:"OR",state:"new"});
      
    },

    btnNewRowAction: function() {
      this.createNewRow({operator:"=",value:"",conjunc:"OR",state:"new"});
      this.showAdvMode(this.isAdvMode);
    },

    createMapLayerList: function() {
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
                this.createGroupSelection();
                this.createNewRow({operator:"=",value:"",conjunc:"OR",state:"new"});
                this.resize();
          }
        }));
    },

    checkDomainUse: function(pParam) {
      this.useDomain = null;
      array.forEach(this.config.groups, lang.hitch(this, function(group) {
        if(group.name === pParam.group) {
          array.forEach(group.layers, lang.hitch(this, function(grpLayer) {
            array.forEach(this.layerList, lang.hitch(this, function(layer) {
              if(grpLayer.layer === layer.id) {
                array.forEach(layer.layerObject.fields, lang.hitch(this, function(field) {
                  if(field.name === grpLayer.field) {
                    if(grpLayer.useDomain !== "") {
                      if(typeof(field.domain) !== 'undefined') {
                        this.useDomain = field.domain;
                      }
                    }
                  }
                }));
              }
            }));
          }));
        }
      }));
    },

    checkDateUse: function(pParam) {
      this.useDate = null;
      array.forEach(this.config.groups, lang.hitch(this, function(group) {
        if(group.name === pParam.group) {
          array.forEach(group.layers, lang.hitch(this, function(grpLayer) {
            array.forEach(this.layerList, lang.hitch(this, function(layer) {
              if(grpLayer.layer === layer.id) {
                array.forEach(layer.layerObject.fields, lang.hitch(this, function(field) {
                  if(field.name === grpLayer.field) {
                    if((field.type).indexOf("Date") >= 0) {
                      this.useDate = true;
                    }
                  }
                }));
              }
            }));
          }));
        }
      }));
    },

    createNewRow: function(pValue) {
      var table = dom.byId("tblPredicates");

      if(pValue.state === "new") {
        if(table.rows.length > 2) {
          var prevRowConjunCell = table.rows[(table.rows.length-1)].cells[2];
          this.createConditionSelection(prevRowConjunCell, pValue);
        } else {
          if(table.rows.length === 2) {
            var prevRowConjunCell = table.rows[(table.rows.length-1)].cells[2];
            this.createConditionSelection(prevRowConjunCell, pValue);
          }
        }
      }
      var row = table.insertRow(-1);
      var cell_operator = row.insertCell(0);
      var cell_value = row.insertCell(1);
      var cell_conjunc = row.insertCell(2);
      var cell_remove = row.insertCell(3);

      domClass.add(cell_operator, "tdOperatorHide");
      if(this.isAdvMode) {
        this.showAdvMode(this.isAdvMode);
      }
      //this.addStyleToCell(cell_operator, "tdOperatorHide");
      //if((table.rows.length % 2) === 0) {
        //domClass.add(row, "tableRow");
      //}

      this.createOperatorSelection(cell_operator,pValue);
      this.createTextBoxFilter(cell_value,pValue);
      this.removeTableRow(cell_remove,row,table.rows.length);

      if(pValue.state === "reload") {
        if(pValue.conjunc !== "") {
          var currRowConjunCell = table.rows[(table.rows.length-1)].cells[2];
          this.createConditionSelection(currRowConjunCell, pValue);
        }
      }

    },

    addStyleToCell: function(pCell, pCSS) {
      domClass.add(pCell, pCSS);
    },

    createGroupSelection: function() {
        var ObjList = [];
        var descLabel = '';
        array.forEach(this.config.groups, lang.hitch(this, function(group) {
          var grpObj = {};
          grpObj.value = group.name;
          grpObj.label = group.name;
          grpObj.selected = false;
          ObjList.push(grpObj);
        }));

        this.grpSelect = new Select({
          options: ObjList,
        }).placeAt(this.groupPicker);

        this.grpSelect.startup();
        this.own(on(this.grpSelect, "change", lang.hitch(this, function(val) {
          this.resetLayerDef();
          this.removeAllRows();
          this.checkDomainUse({group: val});
          this.checkDateUse({group: val});
          this.reconstructRows(val);
          this.updateGroupDesc(val);
          this.setFilterLayerDef();
        })));
        this.checkDomainUse({group: this.grpSelect.value});
        this.checkDateUse({group: this.grpSelect.value});

        if(typeof(this.config.groups[0]) !== 'undefined') {
          descLabel = this.config.groups[0].desc;
          this.groupDesc.innerHTML = descLabel;
        }
    },

    createOperatorSelection: function(pCell, pValue) {
      /*
          {'value': '=', 'label': this.nls.inputs.optionEQUAL},
          {'value': '>', 'label': this.nls.inputs.optionGREATERTHAN},
          {'value': '>=', 'label': this.nls.inputs.optionGREATERTHANEQUAL},
          {'value': '<=', 'label': this.nls.inputs.optionLESSTHAN},
          {'value': '<=', 'label': this.nls.inputs.optionLESSTHANEQUAL}
       */
        var ObjList = [
          {'value': '=', 'label': '='},
          {'value': '>', 'label': '>'},
          {'value': '>=', 'label': '>='},
          {'value': '<=', 'label': '<'},
          {'value': '<=', 'label': '<='}
        ];
        var grpSelect = new Select({
          options: ObjList,
          "class": "operatorSelect"
        }).placeAt(pCell);
         grpSelect.startup();
         grpSelect.set('value', pValue.operator);
    },

    createTextBoxFilter: function(pCell, pValue) {
      if(this.useDomain !== null) {
        domConstruct.empty(pCell);
        var ObjList = [];
        array.forEach(this.useDomain.codedValues, lang.hitch(this, function(codedVal) {
          ObjList.push({'value': codedVal.code, 'label': codedVal.name});
        }));
        var domainSelect = new Select({
          options: ObjList,
          "class": "userInputNormal"
        }).placeAt(pCell);
        domainSelect.startup();
        domainSelect.set('value', pValue.value);
      } else if(this.useDate === true) {
        var d = new Date();
        var defaultDate = (d.getMonth()+1)  + "-" + d.getDate() + "-" + d.getFullYear();
        if(pValue.value !== "") {
          defaultDate = pValue.value;
        }
        var txtDate = new DateTextBox({
          value: defaultDate,
          placeHolder: defaultDate,
          "class": "userInputNormal"
        }).placeAt(pCell);
        txtDate.startup();
      } else {
        var txtFilterParam = new TextBox({
          value: pValue.value /* no or empty value! */,
          placeHolder: "Type in a Value",
          "class": "userInputNormal"
        }).placeAt(pCell);
        txtFilterParam.startup();
      }
    },

    createConditionSelection: function(pCell, pValue) {
      domConstruct.empty(pCell);
        var ObjList = [
          {'value': 'OR', 'label': this.nls.inputs.optionOR},
          {'value': 'AND', 'label': this.nls.inputs.optionAND}
        ];
        var grpSelect = new Select({
          options: ObjList,
          "class": "conjuncSelect"
        }).placeAt(pCell);
        grpSelect.startup();
        grpSelect.set('value', pValue.conjunc);
    },

    removeTableRow: function(pCell,pRow,pCount) {
      if(pCount !== 2) {
        var dsNode = domConstruct.create("div",{
          'class': 'deleteCell',
          innerHTML: ''
        });
        on(dsNode,'click',lang.hitch(this, function() {
          domConstruct.destroy(pRow);
          var table = dom.byId("tblPredicates");
          if(table.rows.length >= 2) {
            var conjunCell = table.rows[table.rows.length-1].cells[2];
            domConstruct.empty(conjunCell);
          }
        }));
        domConstruct.place(dsNode, pCell);
      }
    },

    removeAllRows: function() {
      var table = dom.byId("tblPredicates");
      if(table.rows.length > 1) {
          domConstruct.destroy(table.rows[1]);
          this.removeAllRows();
      }
    },

    reconstructRows: function(pValue) {
      if(pValue !== "") {
        array.forEach(this.config.groups, lang.hitch(this, function(group) {
          if (group.name === pValue) {
            if(typeof(group.def) !== 'undefined') {
              if(group.def.length > 0) {
                array.forEach(group.def, lang.hitch(this, function(def) {
                  this.createNewRow({value: def.value, operator: def.operator, conjunc: def.conjunc, state:"reload"});
                }));
              } else {
                this.createNewRow({operator:"=",value:"",conjunc:"OR",state:"new"});
              }
            } else {
              this.createNewRow({operator:"=",value:"",conjunc:"OR",state:"new"});
            }
          }
        }));
      } else {
        this.createNewRow({operator:"=",value:"",conjunc:"OR",state:"new"});
      }
    },

    parseTable: function() {
      var sqlParams = [];
      var rows = dom.byId("tblPredicates").rows;
      array.forEach(rows, lang.hitch(this, function(row, i){
        if(i >= 1) {
          var cell_operator = registry.byNode(row.cells[0].childNodes[0]);
          var cell_value = registry.byNode(row.cells[1].childNodes[0]);
          var cell_conjunc = {};
          if(typeof(row.cells[2].childNodes[0]) !== 'undefined') {
            cell_conjunc = registry.byNode(row.cells[2].childNodes[0]);
          } else {
            cell_conjunc.value = '';
          }
          sqlParams.push({
            operator: cell_operator.value,
            userValue: cell_value.value,
            conjunc: cell_conjunc.value
          });
        }
      }));
      return sqlParams;
    },

    setFilterLayerDef: function() {
      var sqlParams = this.parseTable();
      array.forEach(this.layerList, lang.hitch(this, function(layer) {
        array.forEach(this.config.groups, lang.hitch(this, function(group) {
          if(this.grpSelect.value === group.name) {
            var msExpr = [];
            array.forEach(group.layers, lang.hitch(this, function(grpLayer) {
              var expr = '';
              var filterType = "";
              if(layer.id === grpLayer.layer) {
                group.def = [];
                filterType = "FeatureLayer";
                array.forEach(sqlParams, lang.hitch(this, function(p) {
                  if(p.userValue !== "") {
                    array.forEach(layer.layerObject.fields, lang.hitch(this, function(field) {
                      if(field.name === grpLayer.field) {
                        if(((field.type).indexOf("Integer") > -1) || (field.type).indexOf("Double") > -1) {
                          expr = expr + grpLayer.field + " " + p.operator + " " + utils.sanitizeHTML(p.userValue) + " " + p.conjunc + " ";
                        } else {
                          expr = expr + grpLayer.field + " " + p.operator + " '" + utils.sanitizeHTML(p.userValue) + "' " + p.conjunc + " ";
                        }
                        group.def.push({value: utils.sanitizeHTML(p.userValue), operator: p.operator, conjunc: p.conjunc});
                      }
                    }));
                  }
                }));
              }
              else if(grpLayer.layer.indexOf(layer.id) >= 0) {  //if it's a map service, sublayers .x is appended. so check if the root layerID is there
                group.def = [];
                filterType = "MapService";
                var msSubs = (grpLayer.layer).split(".");
                array.forEach(sqlParams, lang.hitch(this, function(p) {
                  if(p.userValue !== "") {
                    if(((grpLayer.dataType).indexOf("Integer") > -1) || (grpLayer.dataType).indexOf("Double") > -1) {
                      expr = expr + grpLayer.field + " " + p.operator + " " + utils.sanitizeHTML(p.userValue) + " " + p.conjunc + " ";
                    } else {
                      expr = expr + grpLayer.field + " " + p.operator + " '" + utils.sanitizeHTML(p.userValue) + "' " + p.conjunc + " ";
                    }
                    group.def.push({value: utils.sanitizeHTML(p.userValue), operator: p.operator, conjunc: p.conjunc});
                  }
                }));
                if(expr !== "") {
                  msExpr[msSubs[1]] = expr.trim();
                }
              }
              else {

              }

              if(filterType === "FeatureLayer") {
                console.log(expr);
                if(expr !== "") {
                  layer.layerObject.setDefinitionExpression(expr.trim());
                  layer.layerObject.setVisibility(true);
                }
              } else if(filterType === "MapService") {
                console.log(msExpr);
                if(msExpr.length > 0) {
                  layer.layerObject.setLayerDefinitions(msExpr);
                  layer.layerObject.setVisibility(true);
                }
              } else {
                //do nothing, not a valid service
              }
            }));
          this._publishData(group);
          }
        }));
      }));
    },

    resetLayerDef: function() {
      array.forEach(this.layerList, lang.hitch(this, function(layer) {
        array.forEach(this.defaultDef, lang.hitch(this, function(def) {
          if(def.layer === layer.id ) {

            if(typeof(layer.layerObject.defaultDefinitionExpression) !== 'undefined'){
              layer.layerObject.setDefinitionExpression(def.definition);
            }
            else if(typeof(layer.layerObject.layerDefinitions) !== 'undefined') {
              layer.layerObject.setDefaultLayerDefinitions();
            }
            else {
              layer.layerObject.setDefinitionExpression(def.definition);
            }

            layer.layerObject.setVisibility(def.visible);
            //this.defaultDef.push({layer: layer.id, definition: layer.layerObject.defaultDefinitionExpression});
          }
        }));
      }));
    },

    updateGroupDesc: function(pParam) {
      array.forEach(this.config.groups, lang.hitch(this, function(group) {
        if(group.name === pParam) {
          this.groupDesc.innerHTML = group.desc;
        }
      }));
    },

    //BEGIN: advance filter options
    toggleAdvMode: function() {
      var advNode = query(".advModeClose");
      if(advNode.length > 0) {
        domClass.replace(advNode[0], "advModeOpen", "advModeClose");
        this.isAdvMode = true;
        this.showAdvMode();
      } else {
        var basicNode = query(".advModeOpen");
        if(basicNode.length > 0) {
          domClass.replace(basicNode[0], "advModeClose", "advModeOpen");
          this.isAdvMode = false;
          this.showAdvMode();
        }
      }
    },

    showAdvMode: function() {
      this.resize();
    },
    //END: advance filter options

    //START: saving/reading functions
    toggleSaveFilter: function() {
      var saveNode = query(".saveTD");
      if(saveNode.length > 0) {
        var containerNode = query(".container");
        if(containerNode.length > 0) {
          domClass.replace(dom.byId("saveTD"), "saveTDClose", "saveTD");
          containerNode.style("height", "50%");
          query(".saveContainer").style("display", "block");
        }
      } else {
        var basicNode = query(".saveTDClose");
        if(basicNode.length > 0) {
          domClass.replace(basicNode[0], "saveTD", "saveTDClose");
          var containerNode = query(".container");
          if(containerNode.length > 0) {
            domClass.replace(dom.byId("saveTD"), "saveTD", "saveTDClose");
            containerNode.style("height", "70%");
            query(".saveContainer").style("display", "none");
          }
        }
      }
    },

    saveJsonToFile: function() {
      saveDef = new saveJson({
        "config" : this.config
      });
      on(saveDef, "complete", lang.hitch(this, function() {
        console.log("save done");
      }));
      saveDef.exportsJson(this.nls.files.jsonFile + ".json", this.config);
    },

    readJsonToConfig: function() {
      query(".loadProgressHeader").style("display", "block");
      query(".loadProgressShow").style("display", "block");

      readDef =  new readJson({
        "config": this.config,
        "jsonFile": this.jsonFileInput.files
      });
      on(readDef, "complete", lang.hitch(this, function(results) {
        this.config = JSON.parse(results.UserSettings);
          this.resetLayerDef();
          this.removeAllRows();
          this.checkDomainUse({group: this.grpSelect.value});
          this.checkDateUse({group: this.grpSelect.value});
          this.reconstructRows(this.grpSelect.value);
          this.updateGroupDesc(this.grpSelect.value);
          this.setFilterLayerDef();
          query(".loadProgressHeader").style("display", "none");
          query(".loadProgressShow").style("display", "none");
      }));
      on(readDef, "error", lang.hitch(this, function(results) {
          this.jsonFileInput.value = null;
          query(".loadProgressHeader").style("display", "none");
          query(".loadProgressShow").style("display", "none");
      }));
      readDef.checkFileReader();
    },
    //END: saving/reading functions

    //BEGIN: W2W communication
    _publishData: function(pValue) {
      this.publishData({
        message: pValue
      });
    },
    //END: W2W communication

    resize: function() {
      var widgetWidth = this.domNode.clientWidth;
      
      if(this.isAdvMode) {
        var operNode = query(".tdOperatorHide");
        if(operNode.length > 0) {
          operNode.style("display", "block");
          operNode.style("width", "75px");
        }
        var inputNodes = query(".operatorSelect");
        if(inputNodes.length > 0) {
          inputNodes.style("width", "65px");
        }        
        
        var inputNodes = query(".userInputNormal");
        if(inputNodes.length > 0) {
          inputNodes.style("width", "98%");
        }

        var inputNodes = query(".tdValue");
        if(inputNodes.length > 0) {
          inputNodes.style("width", (widgetWidth - 175) + "px");
        }

      } else {
        var operNode = query(".tdOperatorHide");
        if(operNode.length > 0) {
          operNode.style("display", "none");
          operNode.style("width", "50px");
        }
        var inputNodes = query(".userInputNormal");
        if(inputNodes.length > 0) {
          inputNodes.style("width", "95%");
        }

        var inputNodes = query(".tdValue");
        if(inputNodes.length > 0) {
          inputNodes.style("width", (widgetWidth - 135) + "px");
        }      
      }      
    },

    onOpen: function(){
      console.log('onOpen');
    },

    onClose: function(){
      this.resetLayerDef();
      this.removeAllRows();
      this.reconstructRows("");
    },

    onMinimize: function(){
      console.log('onMinimize');
    },

    onMaximize: function(){
      console.log('onMaximize');
    },

    onSignIn: function(credential){
      /* jshint unused:false*/
      console.log('onSignIn');
    },

    onSignOut: function(){
      console.log('onSignOut');
    }
  });
});