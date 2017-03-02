///////////////////////////////////////////////////////////////////////////
// Copyright 2016 Esri. All Rights Reserved.
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
    'dojo/_base/lang',
    'dojo/_base/array',
    'dojo/query',
    'dojo/on',
    'dojo/Evented',
    'dijit/_TemplatedMixin',
    'jimu/BaseWidgetSetting',
    'jimu/dijit/SimpleTable',
    'jimu/dijit/Popup',
    './LookupList'
  ],
  function (declare, lang, array, query, on, Evented, _TemplatedMixin, BaseWidgetSetting, SimpleTable, Popup, LookupList) {
    return declare([BaseWidgetSetting, _TemplatedMixin, Evented], {
      baseClass: "jimu-widget-setting-fields-critical-facilities",
      templateString: '<div><div data-dojo-attach-point="fieldsTable"></div></div>',
      _layerInfo: null,
      isRecognizedValues: null,
      type: "",
      addressFields: null,

      postCreate: function() {
        this.inherited(arguments);
        this.nls = lang.mixin(this.nls, window.jimuNls.common);
        this._initFieldsTable();

        //Accepts data from a layers fieldInfos, the locators field definitions, XY fields that are defined in the config file
        if (this.type === 'fieldInfos') {
          this.popupTitle = this.nls.configureFields;
          this._setFieldsTable(this._layerInfo.fieldInfos);
        } else {
          this._setAddressFieldsTable(this.addressFields);
        }
      },

      popupEditPage: function () {
        var fieldsPopup = new Popup({
          titleLabel: this.popupTitle,
          width: 640,
          maxHeight: 600,
          autoHeight: true,
          content: this,
          buttons: [{
            label: this.nls.ok,
            onClick: lang.hitch(this, function() {
              this._resetFieldInfos();
              fieldsPopup.close();
              this.emit('edit-fields-popup-ok');
            })
          }, {
            label: this.nls.cancel,
            classNames: ['jimu-btn-vacation'],
            onClick: lang.hitch(this, function() {
              fieldsPopup.close();
              this.emit('edit-fields-popup-cancel');
            })
          }],
          onClose: lang.hitch(this, function () {
            this.emit('edit-fields-popup-close');
          })
        });
      },

      _initFieldsTable: function() {
        var fields = [{
          name: 'visible',
          title: this.nls.display,
          type: 'checkbox',
          'class': 'display',
          hidden: typeof (this.disableDisplayOption) === 'undefined' ? false : this.disableDisplayOption
        }, {
          name: 'fieldName',
          title: this.nls.editpageName,
          type: 'text'
        }, {
          name: 'label',
          title: this.nls.editpageAlias,
          type: 'text',
          editable: true
        }, {
          name: 'actions',
          title: this.nls.actions,
          type: 'actions',
          actions: ['up', 'down', 'edit'],
          'class': 'actions'
        }, {
          name: 'type',
          title: '',
          type: 'text',
          editable: true,
          hidden: true
        }, {
          name: 'isRecognizedValues',
          title: '',
          type: 'extension', //doing this so I can store an array in the rowData
          hidden: true,
          create: lang.hitch(this, this._create),
          setValue: lang.hitch(this, this._setValue),
          getValue: lang.hitch(this, this._getValue)
        }];
        this._fieldsTable = new SimpleTable({
          fields: fields,
          selectable: false,
          autoHeight: true,
          style: {
            'height': '300px',
            'maxHeight': '300px'
          }
        });
        this._fieldsTable.placeAt(this.fieldsTable);
        this._fieldsTable.startup();

        this.own(on(this._fieldsTable, 'actions-edit',
          lang.hitch(this, this._onEditFieldsClick)));
      },

      _create: function (td) {
        //TODO could do something like this for the text box also rather than use the one from 
        // SimpleTable if the double-click to edit thing is whacky
      },

      _setValue: function (td, fieldData) {
        td._isRecognizedValues = fieldData;
      },

      _getValue: function (td) {
        return td._isRecognizedValues;
      },

      _setFieldsTable: function(fieldInfos) {
        var skipFields = ['esriFieldTypeOID', 'esriFieldTypeGlobalID'];
        array.forEach(fieldInfos, function (fieldInfo) {
          if (fieldInfo.type && skipFields.indexOf(fieldInfo.type) === -1) {
            this._fieldsTable.addRow({
              fieldName: fieldInfo.fieldName,
              label: fieldInfo.label,
              visible: fieldInfo.visible,
              type: fieldInfo.type,
              isRecognizedValues: fieldInfo.isRecognizedValues
            });
          }
        }, this);
      },

      _setAddressFieldsTable: function (fields) {
        array.forEach(fields, function (field) {
          //TODO check if this is a safe way to get the locale
          var l = navigator.language.toLowerCase();
          if (field.hasOwnProperty('fieldName') && field.hasOwnProperty('isRecognizedValues')) {
            this._fieldsTable.addRow(field);
          } else {
            this._fieldsTable.addRow({
              fieldName: field.localizedNames && field.hasOwnProperty(l) ? field.localizedNames[l] : field.name,
              label: field.localizedNames && field.hasOwnProperty(l) ? field.localizedNames[l] : field.alias,
              visible: field.hasOwnProperty('visible') ? field.visible : false,
              type: "STRING",
              isRecognizedValues: field.recognizedNames ? field.recognizedNames[l] : field.isRecognizedValues
            });
          }
        }, this);
      },

      _onDisplayFieldChanged: function(tr) {
        var rowData = this._fieldsTable.getRowData(tr);
        //if (!rowData.visible) {
          this._fieldsTable.editRow(tr, rowData);
        //}
      },

      _onIsRecognizedListChanged: function (tr) {
        var rowData = this._fieldsTable.getRowData(tr);
        rowData.isRecognizedValues = this.isRecognizedValues;
        this._fieldsTable.editRow(tr, rowData);
      },

      _resetFieldInfos: function() {
        var newFieldInfos = [];
        var fieldsTableData =  this._fieldsTable.getData();
        array.forEach(fieldsTableData, function(fieldData) {
          newFieldInfos.push({
            "fieldName": fieldData.fieldName,
            "label": fieldData.label,
            "visible": fieldData.visible,
            "type": fieldData.type,
            "isRecognizedValues": fieldData.isRecognizedValues
          });
        });
        if (this.type === 'fieldInfos') {
          this._layerInfo.fieldInfos = newFieldInfos;
        } else {
          this.fieldInfos = newFieldInfos;
        }
      },

      _onEditFieldsClick: function (tr) {
        var rowData = this._fieldsTable.getRowData(tr);
        var sourceDijit = new LookupList({
          nls: this.nls,
          row: tr,
          rowData: rowData
        });

        var popup = new Popup({
          width: 400,
          autoHeight: true,
          content: sourceDijit,
          titleLabel: this.nls.lookupList + " (" + rowData.fieldName + ")",
          buttons: [{
            label: this.nls.ok,
            onClick: lang.hitch(this, function () {
              var data = popup.content.sourceList.getData();
              this.isRecognizedValues = [];
              array.forEach(data, lang.hitch(this, function (v) {
                if (this.isRecognizedValues.indexOf(v.name) === -1 && v.name !== this.nls.newNamePlaceholder) {
                  this.isRecognizedValues.push(v.name);
                }
              }));
              this._onIsRecognizedListChanged(popup.content.row);
              popup.close();
            })
          }, {
            label: this.nls.cancel,
            classNames: ['jimu-btn-vacation'],
            onClick: lang.hitch(this, function () {
              popup.close();
            })
          }],
          onClose: lang.hitch(this, function () {
          })
        });
      }
    });
  });
