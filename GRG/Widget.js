///////////////////////////////////////////////////////////////////////////
// Copyright (c) 2015 Esri. All Rights Reserved.
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
  'dojo/topic',
  'dijit/_WidgetsInTemplateMixin',
  'jimu/BaseWidget',
  'jimu/dijit/TabContainer3',
  './TabCreateGRG',
  './TabDeleteGRG'
], function (
  dojoDeclare,
  dojoTopic,
  dijitWidgetsInTemplate,
  jimuBaseWidget,
  JimuTabContainer3,
  TabCreateGRG,
  TabDeleteGRG
) {
  'use strict';
  var clz = dojoDeclare([jimuBaseWidget, dijitWidgetsInTemplate], {
    baseClass: 'jimu-widget-GRG',

    /**
     *
     **/
    postCreate: function () {

      this.createGRGTab = new TabCreateGRG({
        map: this.map,
        canavasAreaFillSymbol: {
          type: 'esriSFS',
          style: 'esriSFSNull',
          color: [0,0,255,0],
          outline: {
            color: [0, 0, 255, 255],
            width: 1.25,
            type: 'esriSLS',
            style: 'esriSLSSolid'
          }
        },
        cellAreaFillSymbol: {
          type: 'esriSFS',
          style: 'esriSFSNull',
          color: [0,255,0,0],
          outline: {
            color: [0, 255, 0, 255],
            width: 1.25,
            type: 'esriSLS',
            style: 'esriSLSSolid'
          }
        }
        },
        this.createTabNode
      );

      this.removeGRGTab = new TabDeleteGRG({
        map: this.map
        },
        this.deleteTabNode
      );

      this.tab = new JimuTabContainer3({
        tabs: [
          {
            title: 'Create GRG',
            content: this.createGRGTab
          },
          {
            title: 'Remove GRG',
            content: this.removeGRGTab
          }
        ]
      }, this.tabContainer);
    },

    onClose: function () {
      dojoTopic.publish('DD_WIDGET_CLOSE');
    },

    onOpen: function () {
      dojoTopic.publish('DD_WIDGET_OPEN');
    }
  });
  return clz;
});
