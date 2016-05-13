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
  'dojo/on',
  'dojo/dom-construct',
  'dojo/_base/lang',
  'dojo/_base/array',
  'dijit/form/Select',
  'dojo/text!./presetValuePicker.html'
],
  function(declare, BaseWidgetSetting, _WidgetsInTemplateMixin,
    on, domConstruct, lang, array, Select, template) {
    return declare([BaseWidgetSetting, _WidgetsInTemplateMixin], {

      //these two properties is defined in the BaseWidget
      baseClass: 'jimu-widget-map-filter-preset',
      templateString: template,

      layerList: null,
      map: null,
      nls: null,

      postCreate: function() {
        this.inherited(arguments);
        this.startup();
      },

      startup: function() {
        this.inherited(arguments);
        this.createLayerSelection();
      },

      createLayerSelection: function() {
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

        var lyrSelect = new Select({
          options: ctlLayerList
        }).placeAt(this.layerLevel);
        lyrSelect.startup();

        this.own(on(lyrSelect, "change", lang.hitch(this, function(val) {
          this.createFieldSelection(val);
        })));

        this.createFieldSelection(lyrSelect.value);

      },

      createFieldSelection: function(pLayer) {
        var ctlfieldList = [];
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
              }));
            }
          }

        }));

        domConstruct.empty(this.fieldLevel);
        var fieldSelect = new Select({
          options: ctlfieldList
        }).placeAt(this.fieldLevel);
        fieldSelect.startup();

        this.own(on(fieldSelect, "change", lang.hitch(this, function() {

        })));
      }

    });
  });
