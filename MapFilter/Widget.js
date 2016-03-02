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
  'dijit/registry',
  'jimu/LayerInfos/LayerInfos'
],
function(declare, _WidgetsInTemplateMixin, BaseWidget, SimpleTable, dom, domConstruct, domClass, on, query, lang, array, Select, TextBox, registry, LayerInfos) {
  //To create a widget, you need to derive from BaseWidget.
  return declare([BaseWidget, _WidgetsInTemplateMixin], {
    // DemoWidget code goes here

    //please note that this property is be set by the framework when widget is loaded.
    //templateString: template,

    baseClass: 'jimu-widget-map-filter',

    layerList: null,
    grpSelect: null,
    filterList: [],
    filterConjunction: [],
    groupCounter: 0,
    defaultDef: [],

    postCreate: function() {
      this.inherited(arguments);
      this.createMapLayerList();
    },

    startup: function() {
      this.inherited(arguments);
      //this.mapIdNode.innerHTML = 'map id:' + this.map.id;
      //this.createDivsForFilter();
      this.createNewRow();
    },

    createMapLayerList: function() {
      LayerInfos.getInstance(this.map, this.map.itemInfo)
        .then(lang.hitch(this, function(operLayerInfos) {
          if(operLayerInfos._layerInfos && operLayerInfos._layerInfos.length > 0) {
            this.layerList = operLayerInfos._layerInfos;
            array.forEach(operLayerInfos._layerInfos, lang.hitch(this, function(layer) {
              if(typeof(layer.layerObject.getDefinitionExpression()) !== 'undefined' ) {
                this.defaultDef.push({layer: layer.id, definition: layer.layerObject.getDefinitionExpression()});
              } else {
                this.defaultDef.push({layer: layer.id, definition: null});
              }
            }));
            this.createGroupSelection();
          }
        }));
    },

    createNewRow: function() {
      var table = dom.byId("tblPredicates");
      if(table.rows.length > 2) {
        var prevRowConjunCell = table.rows[(table.rows.length-1)].cells[2];
        this.createConditionSelection(prevRowConjunCell);
      } else {
        if(table.rows.length === 2) {
          var prevRowConjunCell = table.rows[(table.rows.length-1)].cells[2];
          this.createConditionSelection(prevRowConjunCell);
        }
      }
      var row = table.insertRow(-1);
      var cell_operator = row.insertCell(0);
      var cell_value = row.insertCell(1);
      var cell_conjunc = row.insertCell(2);
      var cell_remove = row.insertCell(3);

      domClass.add(cell_operator, "tdOperatorHide");
      //if((table.rows.length % 2) === 0) {
        //domClass.add(row, "tableRow");
      //}

      this.createOperatorSelection(cell_operator);
      this.createTextBoxFilter(cell_value);
      this.removeTableRow(cell_remove,row,table.rows.length);

      //document.getElementById("myTable").deleteRow(0);
    },

    createGroupSelection: function() {
        var ObjList = [];
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
          //handle change
        })));
    },

    createOperatorSelection: function(pCell) {
      //if(pCounter > 1) {
        var ObjList = [
          {'value': '=', 'label': 'EQUAL'},
          {'value': '<', 'label': 'GREATER THAN'},
          {'value': '<=', 'label': 'GREATER THAN EQUAL'},
          {'value': '>=', 'label': 'LESS THAN EQUAL'}
        ];
        var grpSelect = new Select({
          options: ObjList,
        }).placeAt(pCell);
         grpSelect.startup();
        //this.filterConjunction.push(grpSelect);
      //}
    },

    createTextBoxFilter: function(pCell) {
      var txtFilterParam = new TextBox({
          value: "" /* no or empty value! */,
          placeHolder: "Type in a Value"
      }).placeAt(pCell);
      txtFilterParam.startup();
      this.filterList.push(txtFilterParam);
    },

    createConditionSelection: function(pCell) {
      domConstruct.empty(pCell);
      //if(pCounter > 1) {
        var ObjList = [
          {'value': 'AND', 'label': 'AND'},
          {'value': 'OR', 'label': 'OR'}
        ];
        var grpSelect = new Select({
          options: ObjList,
        }).placeAt(pCell);
        grpSelect.startup();
        this.filterConjunction.push(grpSelect);
      //}
    },

    removeTableRow: function(pCell,pRow,pCount) {
      if(pCount !== 2) {
        var dsNode = domConstruct.create("div",{
          innerHTML: 'delete'
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
            array.forEach(group.layers, lang.hitch(this, function(grpLayer) {
              if(layer.id === grpLayer.layer) {
                console.log(layer);
                var expr = '';
                array.forEach(sqlParams, lang.hitch(this, function(p,i) {
                  array.forEach(layer.layerObject.fields, lang.hitch(this, function(field) {
                    if(field.name === grpLayer.field) {
                      if((field.type).indexOf("String") > -1) {
                        expr = expr + grpLayer.field + " " + p.operator + " '" + p.userValue + "' " + p.conjunc + " ";
                      } else {
                        expr = expr + grpLayer.field + " " + p.operator + " " + p.userValue + " " + p.conjunc + " ";
                      }
                    }
                  }));
                }));
                console.log(expr);
                if(expr !== "") {
                  layer.layerObject.setDefinitionExpression(expr);
                }
              }
              //layer.layerObject.setDefinitionExpression(def.definition);
            }));
          }
        }));
      }));
    },

    resetLayerDef: function() {
      array.forEach(this.layerList, lang.hitch(this, function(layer) {
        array.forEach(this.defaultDef, lang.hitch(this, function(def) {
          if(def.layer === layer.id ) {
            layer.layerObject.setDefinitionExpression(def.definition);
            //this.defaultDef.push({layer: layer.id, definition: layer.layerObject.defaultDefinitionExpression});
          }
        }));
      }));
    },

    cleanEmptyValues: function() {
      if(this.filterConjunction.length >= 0) {
        array.forEach(this.filterConjunction, lang.hitch(this, function(conJunc,i) {
          if(this.filterList[i].value === '' ) {
            this.filterList.splice((i), 1);
            this.filterConjunction.splice(i,1);
          }
        }));
        this.setFilterLayerDef();
      } else {
        if(typeof(this.filterList[0].value) === 'undefined' ) {
          alert("no input value");
        } else {
          this.setFilterLayerDef();
        }
      }
    },

    onOpen: function(){
      console.log('onOpen');
    },

    onClose: function(){

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