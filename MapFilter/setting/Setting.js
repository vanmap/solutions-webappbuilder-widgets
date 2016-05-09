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
  'jimu/BaseWidgetSetting',
  'dijit/_WidgetsInTemplateMixin',
  'jimu/dijit/SimpleTable',
  'dojo/dom',
  'dojo/dom-construct',
  'dojo/on',
  'dojo/query',
  'dojo/_base/lang',
  'dojo/_base/array',
  'dijit/form/Select',
  'dijit/form/TextBox',
  'dijit/form/ValidationTextBox',
  'dijit/form/RadioButton',
  'dijit/registry',
  'jimu/utils',
  'jimu/LayerInfos/LayerInfos',
  'jimu/dijit/Message',
  '../LayersHandler',
  'dijit/form/CheckBox'
],
  function(declare, BaseWidgetSetting, _WidgetsInTemplateMixin, SimpleTable, dom, domConstruct, on, query, lang, array, Select, TextBox, ValidationTextBox, RadioButton, registry, utils, LayerInfos, Message, LayersHandler) {
    return declare([BaseWidgetSetting, _WidgetsInTemplateMixin], {

      //these two properties is defined in the BaseWidget
      baseClass: 'jimu-widget-map-filter',

      groupCounter: 0,
      groupLayerContainer: [],
      groupLayerName: [],
      groupLayerDesc: [],
      groupLayerOperator: [],
      groupLayerDefault: [],      
      layerCounter: 0,
      layerList: null,

      postCreate: function() {
        this.inherited(arguments);
      },

      startup: function() {
        this.inherited(arguments);
        this.setConfig(this.config);
      },

      setConfig: function(config) {
        this.config = config;
        this.groupLayerContainer = [];
        this.groupLayerName = [];
        this.groupLayerDesc = [];
        this.groupLayerOperator = [];
        this.groupLayerDefault = [];        
        this.chkSimpleMode.set('checked', this.config.simpleMode);
        this.chkOptionsMode.set('checked', this.config.optionsMode);          
        this.createMapLayerList();
      },

      getConfig: function() {
        if(this.layerList.length > 0 || this.layerList === null) {       
          var validGroups = this.validateNoGroups();
          var validGroupsNames = this.validateNoGroupsName();
          var validTables = this.validateTableRows();
  
          if(validGroups && validGroupsNames && validTables) {
            this.config.simpleMode = this.chkSimpleMode.checked;
            this.config.optionsMode = this.chkOptionsMode.checked;
            this.config.groups = [];
            array.forEach(this.groupLayerName, lang.hitch(this, function(groupName, i) {
              if(groupName !== null) {
                if(this.groupLayerContainer[i] !== null) {
                  var groupObj = {};
                  groupObj.name = utils.sanitizeHTML(groupName.value);
                  groupObj.desc = utils.sanitizeHTML(this.groupLayerDesc[i].value);
                  groupObj.operator = utils.sanitizeHTML(this.groupLayerOperator[i].value);
                  groupObj.defaultVal = utils.sanitizeHTML(this.groupLayerDefault[i].value);
                  groupObj.layers = [];
  
                  var result = array.forEach(this.groupLayerContainer[i].getRows(), lang.hitch(this, function(row) {
                    var layerStruct = {};
                    if(typeof(row.domainCol) !== 'undefined') {
                      layerStruct.layer = row.layerCol.value;
                      layerStruct.field = row.fieldCol.value;
                      layerStruct.dataType = row.dataTypeCol.attr('displayedValue');
                      if(row.domainCol.checked) {
                        layerStruct.useDomain = row.domainCol.value;
                      } else {
                        layerStruct.useDomain = '';
                      }
                    } else {
                      layerStruct.layer = row.layerCol.value;
                      layerStruct.field = row.fieldCol.value;
                      layerStruct.dataType = row.dataTypeCol.attr('displayedValue');
                      layerStruct.useDomain = '';
                    }
  
                    groupObj.layers.push(layerStruct);
                  }));
                  this.config.groups.push(groupObj);
                }
              }
            }));
            return this.config;
          } else {
            return false;
          }
        } else {
          new Message({
            message : this.nls.errors.noLayers
          });          
          return false;
        }
      },

      createMapLayerList: function() {
        LayerInfos.getInstance(this.map, this.map.itemInfo)
          .then(lang.hitch(this, function(operLayerInfos) {
            if(operLayerInfos._layerInfos && operLayerInfos._layerInfos.length > 0) {
              //this.layerList = operLayerInfos._layerInfos;


              layerHandle =  new LayersHandler({
                "layers": operLayerInfos._layerInfos
              });
              this.own(on(layerHandle, "complete", lang.hitch(this, function(results) {
                this.layerList = results.data.items;
                if(this.config.groups.length > 0) {
                  array.forEach(this.config.groups, lang.hitch(this, function(group) {
                    this.createGroupBlock({group: group});
                  }));
                } else {
                  this.createGroupBlock({group: null});
                }
              })));
              this.own(on(layerHandle, "error", lang.hitch(this, function(results) {
                console.log("error");
              })));
              layerHandle.getAllMapLayers();


            }
          }));

      },

      createGroupBlock: function(pParam) {
        this.groupCounter++;

        var dsNode = domConstruct.create("div",{
          id: 'grpDiv_' + this.groupCounter,
          'class': 'group-block'
        });
        domConstruct.place(dsNode, this.layerMappingBlock);

        var groupSettingTable = domConstruct.create("table",{
          'class': 'group-setting-table',
        });
        domConstruct.place(groupSettingTable, dsNode);
        
        var rowName = groupSettingTable.insertRow(-1);
        var cellNameLabel = rowName.insertCell(0);
        var cellNameInput = rowName.insertCell(1);
        var cellDescLabel = rowName.insertCell(2); 
        var cellDescInput = rowName.insertCell(3);
        var cellDelete = rowName.insertCell(4);       

        var rowPreset = groupSettingTable.insertRow(-1);
        var cellOperatorLabel = rowPreset.insertCell(0);
        var cellOperatorInput = rowPreset.insertCell(1);
        var cellDefaultLabel = rowPreset.insertCell(2); 
        var cellDefaultInput = rowPreset.insertCell(3);
        var cellSpacer = rowPreset.insertCell(4); 

        cellNameLabel.innerHTML = this.nls.labels.groupName;
        cellDescLabel.innerHTML = this.nls.labels.groupDesc;
        cellOperatorLabel.innerHTML = this.nls.labels.groupOperator;
        cellDefaultLabel.innerHTML = this.nls.labels.groupDefault;        

        var groupName = '';
        var groupDesc = '';
        var groupOper = '';
        var groupDef = '';
        if(typeof(pParam.group) !== 'undefined' && pParam.group !== null) {
          groupName = pParam.group.name;
          groupDesc = pParam.group.desc;
          groupOper = pParam.group.operator;
          groupDef = pParam.group.defaultVal;
        }

        var txtGroupName = new ValidationTextBox({
            name: "txtGroupName",
            value: groupName,
            'class': 'groupName-textbox',
            placeHolder: this.nls.inputs.groupName,
            required: "true"
        }, cellNameInput);
        this.groupLayerName.push(txtGroupName);

        var txtGroupDesc = new TextBox({
            name: "txtGroupDesc",
            value: groupDesc,
            'class': 'groupName-Desctextbox',
            placeHolder: this.nls.inputs.groupDesc
        }, cellDescInput);
        this.groupLayerDesc.push(txtGroupDesc);

        var txtGroupDefault = new TextBox({
            name: "txtGroupDefault",
            value: groupDef,
            'class': 'groupName-Desctextbox',
            placeHolder: this.nls.inputs.groupDefault
        }, cellDefaultInput);
        this.groupLayerDefault.push(txtGroupDefault);

        var deleteNameNode = domConstruct.create("div",{
          id: 'addGroupDelete_' + this.groupCounter,
          'class': 'group-block-delete'
        });
        var deleteAction = on(deleteNameNode, "click", lang.hitch(this, function(evt) {
          deleteAction.remove();
          this.removeGroup(deleteNameNode.id);
        }));
        domConstruct.place(deleteNameNode, cellDelete);

        this.createOperatorSelection({cell:cellOperatorInput, value:groupOper});

        this.createTableObject(pParam);

        var addLayerNode = domConstruct.create("div",{
          id: 'addLyrDiv_' + this.groupCounter,
          'class': 'jimu-btn group-block-add-layer'
        });
        this.own(on(addLayerNode, "click", lang.hitch(this, function(evt) {
          this.addLayerRow(addLayerNode.id);
        })));
        domConstruct.place(addLayerNode, dom.byId('grpDiv_' + this.groupCounter));
        dom.byId('addLyrDiv_' + this.groupCounter).innerHTML = this.nls.buttons.addLayer;

      },

      createOperatorSelection: function(params) {
        var ObjList = [
          {'value': '', 'label': this.nls.inputs.optionNONE},
          {'value': '=', 'label': this.nls.inputs.optionEQUAL},
          {'value': '<>', 'label': this.nls.inputs.optionNOTEQUAL},
          {'value': '>', 'label': this.nls.inputs.optionGREATERTHAN},
          {'value': '>=', 'label': this.nls.inputs.optionGREATERTHANEQUAL},
          {'value': '<', 'label': this.nls.inputs.optionLESSTHAN},
          {'value': '<=', 'label': this.nls.inputs.optionLESSTHANEQUAL},
          {'value': 'START', 'label': this.nls.inputs.optionSTART},
          {'value': 'END', 'label': this.nls.inputs.optionEND},
          {'value': 'LIKE', 'label': this.nls.inputs.optionLIKE},
          {'value': 'NOT LIKE', 'label': this.nls.inputs.optionNOTLIKE}
        ];
        var opSelect = new Select({
          options: ObjList,
          "class": "operator-select"
        }).placeAt(params.cell);
        opSelect.startup();
        opSelect.set('value', params.value);
        this.groupLayerOperator.push(opSelect);
      },


      createTableObject: function(pParam) {
        var fields = null;
        fields = [{
          name: "layerCol",
          title: this.nls.tables.layer,
          "class": "label",
          type: "empty"
        }, {
          name: "fieldCol",
          title: this.nls.tables.field,
          "class": "label",
          type: "empty"
        }, {
          name: "domainCol",
          title: this.nls.tables.domain,
          "class": "label",
          type: "empty",
          width: "150px"
        }, {
          name: "actions",
          title: this.nls.tables.action,
          type: "actions",
          actions: ["delete"],
          width: "125px"
        }, {
          name : 'dataTypeCol',
          type : 'empty',
          hidden : true,
          width : 0
        }];

        var args = {
          fields: fields,
          'class': 'layer-tables'
        };
        var layerTable = new SimpleTable(args);
        layerTable.placeAt(dom.byId('grpDiv_' + this.groupCounter));
        this.groupLayerContainer.push(layerTable);

        if(typeof(pParam.group) !== 'undefined' && pParam.group !== null) {
          array.forEach(pParam.group.layers, lang.hitch(this, function(layer) {
            this.addLayerRow(dom.byId('grpDiv_' + this.groupCounter).id, layer);
          }));
        } else {
          this.addLayerRow(dom.byId('grpDiv_' + this.groupCounter).id, pParam);
        }

        //this.createLayerSelection();
      },

      addLayerRow: function(pBlock, pParam) {
        var numPart = pBlock.substring(pBlock.indexOf('_')+1);
        var result = this.groupLayerContainer[numPart-1].addRow({});
        if (result.success && result.tr) {
          var tr = result.tr;
          this.createLayerSelection(tr, pParam, numPart);
          // if (domClass.contains(this.btnOk, 'jimu-state-disabled')) {
          //   html.removeClass(this.btnOk, 'jimu-state-disabled');
          // }
        }
      },

      createLayerSelection: function(tr, pParam, pCounter) {
        var ctlLayerList = [];
        array.forEach(this.layerList, lang.hitch(this, function(layer) {
          if(layer.children.length > 0) {
            array.forEach(layer.children, lang.hitch(this, function(child) {
              var lryObject = {};
              lryObject.value = child.id;
              lryObject.label = child.label;
              lryObject.selected = false;
              ctlLayerList.push(lryObject);
            }));
          } else {
            var lryObject = {};
            lryObject.value = layer.id;
            lryObject.label = layer.label;
            lryObject.selected = false;
            ctlLayerList.push(lryObject);
          }
        }));

        var td = query('.simple-table-cell', tr)[0];
        if (td) {
          var lyrSelect = new Select({
            options: ctlLayerList,
          }).placeAt(td);

          lyrSelect.startup();
          tr.layerCol = lyrSelect;
          this.own(on(lyrSelect, "change", lang.hitch(this, function(val) {
            this.createFieldSelection(val, tr, pParam, pCounter);
          })));

          if(typeof(pParam) !== 'undefined') {
            lyrSelect.set('value', pParam.layer);
          }

        }

        this.createFieldSelection(lyrSelect.value, tr, pParam, pCounter);

      },

      createFieldSelection: function(pLayer, pTR, pParam, pCounter) {
        var ctlfieldList = [];
        var ctlfieldDataType = [];
        array.forEach(this.layerList, lang.hitch(this, function(layer) {
          if(layer.children.length > 0) {
            array.forEach(layer.children, lang.hitch(this, function(child) {
              if(child.id === pLayer) {
                array.forEach(child.children, lang.hitch(this, function(field) {
                  var fieldObject = {};
                  fieldObject.value = field.name;
                  fieldObject.label = field.label;
                  fieldObject.selected = false;
                  ctlfieldList.push(fieldObject);

                  var fieldDataType = {};
                  fieldDataType.value = field.name;
                  fieldDataType.label = field.fieldType;
                  fieldDataType.selected = false;
                  ctlfieldDataType.push(fieldDataType);
                }));
              }
            }));
          } else {
            if(layer.id === pLayer) {
              array.forEach(layer.layer.fields, lang.hitch(this, function(field) {
                var fieldObject = {};
                fieldObject.value = field.name;
                fieldObject.label = field.alias;
                fieldObject.selected = false;
                ctlfieldList.push(fieldObject);

                var fieldDataType = {};
                fieldDataType.value = field.name;
                fieldDataType.label = field.type;
                fieldDataType.selected = false;
                ctlfieldDataType.push(fieldDataType);
              }));
            }
          }

        }));

        var td = query('.simple-table-cell', pTR)[1];
        var dataID = query('.simple-table-cell', pTR)[4];
        if (td) {
          domConstruct.empty(td);
          var fieldSelect = new Select({
            options: ctlfieldList
          }).placeAt(td);
          fieldSelect.startup();
          pTR.fieldCol = fieldSelect;

          domConstruct.empty(dataID);
          var dataTypeSelect = new Select({
            options: ctlfieldDataType
          }).placeAt(dataID);
          dataTypeSelect.startup();
          pTR.dataTypeCol = dataTypeSelect;

          this.own(on(fieldSelect, "change", lang.hitch(this, function(val) {
            this.domainRadio({layer: pLayer, field: val, row: pTR, param: pParam, counter: pCounter});
            this.dataTypeSync({layer: pLayer, field: val, row: pTR, param: pParam, select: dataTypeSelect});
          })));

          if(typeof(pParam) !== 'undefined') {
            fieldSelect.set('value', pParam.field);
            dataTypeSelect.set('value', pParam.field);
          }
        }
        this.domainRadio({
          layer: pLayer,
          field: fieldSelect.value,
          row: pTR,
          param: pParam,
          counter: pCounter
        });

      },

      dataTypeSync: function(pParam) {
        var dtSelection = pParam.select;
        dtSelection.set('value', pParam.field);
      },

      domainRadio: function(pParam) {
        array.forEach(this.layerList, lang.hitch(this, function(layer) {
          if(layer.id === pParam.layer) {
            array.forEach(layer.layer.fields, lang.hitch(this, function(field) {
              if(field.name === pParam.field) {
                if(typeof(field.domain) !== 'undefined') {
                  if(field.domain.type === 'codedValue' || field.domain.type === 'range') {
                    var td = query('.simple-table-cell', pParam.row)[2];
                    if (td) {
                      var content = query('.dijit', td)[0];
                      if(content){
                        existRadio = registry.byNode(content);
                        dijit.byId(existRadio.id).destroyRecursive();
                      }
                      domConstruct.empty(td);
                      var domainRadio = new RadioButton({
                        name: 'useDomain' + pParam.counter
                      }).placeAt(td);

                      domainRadio.startup();
                      pParam.row.domainCol = domainRadio;

                      if(typeof(pParam) !== 'undefined') {
                        if(typeof(pParam.param) !== 'undefined') {
                          if(pParam.param.useDomain !== '') {
                            domainRadio.set('value', pParam.param.useDomain);
                          }
                        }
                      }
                    }
                  }
                } else {
                  var row = pParam.row;
                  if(typeof(row.domainCol) !== 'undefined') {
                    row.domainCol.value = '';
                  }
                  var td = query('.simple-table-cell', pParam.row)[2];
                  if (td) {
                    var content = query('.dijit', td)[0];
                    if(content){
                      existRadio = registry.byNode(content);
                      dijit.byId(existRadio.id).destroyRecursive();
                    }
                  }
                  //domConstruct.empty(td);


                }
              }
            }));
          }
        }));

      },


      validateNoGroups: function(){
        var validForm = false;
        var message = this.nls.errors.noGroups;
        array.forEach(this.groupLayerName, lang.hitch(this, function(groupName) {
          if(groupName !== null) {
            validForm = true;
          }
        }));
        if(!validForm) {
          new Message({
            message : message
          });
          return false;
        } else {
          return true;
        }
      },

      validateNoGroupsName: function(){
        var validForm = true;
        var message = this.nls.errors.noGroupName;
        array.forEach(this.groupLayerName, lang.hitch(this, function(groupName) {
          if(groupName !== null) {
            if(!groupName.get('value')) {
              validForm = false;
            }
          }
        }));
        if(validForm === false) {
          new Message({
            message : message
          });
        }
        return validForm;
      },

      validateTableRows: function() {
        var validForm = true;
        array.forEach(this.groupLayerContainer, lang.hitch(this, function(group) {
        if(group !== null) {
          if((group.getRows()).length <= 0) {
            validForm = false;
          }
        }
        }));
        if(validForm === false) {
          new Message({
            message : this.nls.errors.noRows
          });
        }
        return validForm;
      },

      removeGroup: function(pBlock) {
        var numPart = pBlock.substring(pBlock.indexOf('_')+1);
        this.groupLayerContainer[numPart-1] = null;
        this.groupLayerName[numPart-1] = null;
        this.groupLayerDesc[numPart-1] = null;
        this.groupLayerOperator[numPart-1] = null;
        this.groupLayerDefault[numPart-1] = null;        
        //dijit.byId('addGroupName_' + numPart).destroyRecursive(true);
        //dijit.byId('addGroupDesc_' + numPart).destroyRecursive(true);
        domConstruct.destroy(dom.byId('addGroupDelete_' + numPart));
        domConstruct.destroy(dom.byId('addLyrDiv_' + numPart));
        domConstruct.destroy(dom.byId('grpDiv_' + numPart));
      }

    });
  });
