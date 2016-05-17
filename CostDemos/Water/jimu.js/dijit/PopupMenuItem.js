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

define(['dojo/_base/declare',
  'dojo/_base/html',
  'dojo/_base/lang',
  'dojo/_base/event',
  'dojo/on',
  'dojo/Evented',
  'dijit/_WidgetBase',
  'dijit/_TemplatedMixin'
], function(declare, html, lang, Event, on, Evented, _WidgetBase, _TemplatedMixin) {
  return declare([_WidgetBase, _TemplatedMixin, Evented], {
    baseClass: 'popup-menu-item',
    templateString: '<div>' +
      '<div class="icon jimu-float-leading">' +
      '<img data-dojo-attach-point="iconNode"></img>' +
      '</div>' +
      '<div class="label" data-dojo-attach-point="labelNode"></div>' +
      '</div>',

    /**
     * An instance of jimu/BaseFeatureAction
     * {
     *   label: string;
     *   icon: string;
     *   onExecute: (args) => Promise;
     *   data: object
     * }
     */
    action: null,

    postCreate: function() {
      this.inherited(arguments);

      if (this.action) {
        html.setAttr(this.iconNode, 'src', this.action.icon);
        this.labelNode.innerHTML = this.action.label;
      }

      this.own(on(this.domNode, 'click', lang.hitch(this, this._clickHandler)));
    },

    _clickHandler: function(event) {
      Event.stop(event);

      if (this.action) {
        this.action.onExecute(this.action.data);
      }

      this.emit('click');
    }
  });
});