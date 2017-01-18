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
    'dojo/Evented'
],
  function (declare,
    _WidgetsInTemplateMixin,
    BaseWidget,
    template,
    Evented) {
    return declare([BaseWidget, _WidgetsInTemplateMixin, Evented], {
      templateString: template,
      baseClass: 'jimu-widget-setting-fields-lookup-critical-facilities',
      row: null,

      constructor: function (options) {
        this.nls = options.nls;
        this.row = options.row;
      },

      postMixInProperties: function(){
        this.inherited(arguments);
        this.nls.common = window.jimuNls.common;
      },

      postCreate: function () {
        this.inherited(arguments);
      },

      destroy: function () {

      }
    });
  });
