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
    'dijit/_WidgetsInTemplateMixin',
    'jimu/BaseWidget',
    'dojo/text!./LookupList.html',
    'dojo/Evented',
    'jimu/dijit/SimpleTable',
    'dojo/dom-style',
    'dojo/query',
    'dojo/_base/lang',
    'dojo/_base/array',
    'dojo/on'
],
  function (declare,  _WidgetsInTemplateMixin, BaseWidget, template, Evented, SimpleTable, domStyle, query, lang, array, on) {
    return declare([BaseWidget, _WidgetsInTemplateMixin, Evented], {
      templateString: template,
      baseClass: 'jimu-widget-setting-critical-facilities',
      row: null,
      values: [],

      constructor: function (options) {
        this.nls = options.nls;
        this.row = options.row;
        this.fieldName = options.fieldName;
        this.isRecognizedValues = options.isRecognizedValues;
      },

      postMixInProperties: function(){
        this.inherited(arguments);
        this.nls.common = window.jimuNls.common;
      },

      postCreate: function () {
        this.inherited(arguments);
        this._initList();
        var aaa;
        if (this.isRecognizedValues !== "") {
          aaa = JSON.parse(this.isRecognizedValues);
        }

        if (aaa && aaa.length > 0) {
          array.forEach(aaa, lang.hitch(this, function (v) {
            this._addRow(v);
          }));
        } else {
          this._addRow(this.fieldName);
        }
      },

      _addRow: function(v){
        var addResult = this.sourceList.addRow({
          name: v
        });
        if (addResult && addResult.success) {
          this._setRowConfig(addResult.tr, this.fieldName);
        } else {
          console.error("add row failed ", addResult);
        }
      },

      _initList: function () {
        this.sourceList = new SimpleTable({
          autoHeight: false,
          selectable: true,
          fields: [{
            name: "name",
            title: this.nls.name,
            width: "auto",
            type: "text",
            editable: true
          }, {
            name: "actions",
            title: "",
            width: "70px",
            type: "actions",
            actions: ["up", "down", "delete"]
          }]
        }, this.sourceList);
        domStyle.set(this.sourceList.domNode, 'height', '100%');
        this.sourceList.startup();
        this.own(on(this.sourceList, 'row-select', lang.hitch(this, this._onSourceItemSelected)));
        this.own(on(this.sourceList, 'row-delete', lang.hitch(this, this._onSourceItemRemoved)));
      },

      _onSourceItemRemoved: function () {

      },

      _onAddClick: function () {
        var addResult = this.sourceList.addRow({
          name: this.nls.newNamePlaceholder
        });
        if (addResult && addResult.success) {
          this._setRowConfig(addResult.tr, this.nls.newNamePlaceholder);
        } else {
          console.error("add row failed ", addResult);
        }
      },

      _setRowConfig: function (tr, source) {
        query(tr).data('config', lang.clone(source));
      },

      _getRowConfig: function (tr) {
        return query(tr).data('config')[0];
      },

      _removeRowConfig: function (tr) {
        return query(tr).removeData('config');
      },

      destroy: function () {

      }
    });
  });
