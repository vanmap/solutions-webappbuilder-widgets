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
    'dojox/validate/regexp',
    "esri/request",
    "dojo/_base/lang",
    "dijit/TitlePane",
    "dojo/store/Memory",
    "dijit/tree/ObjectStoreModel",
    "dijit/Tree",
    "dojo/dom-construct"
  ],
  function (
    declare,
    BaseWidgetSetting,
    _WidgetsInTemplateMixin,
    regexp,
    esriRequest,
    lang,
    TitlePane,
    Memory,
    ObjectStoreModel,
    Tree,
    domConstruct
    ) {
      return declare([BaseWidgetSetting, _WidgetsInTemplateMixin], {

          baseClass: 'jimu-widget-IsolationTrace-setting',
          url: null,
          gpServiceTasks: null,
          startup: function () {
              this.inherited(arguments);
          },

          /*
          * This function will execute when user clicked on the "Set Task"
          */
          _OnValidate: function () {

              this.gpServiceTasks = [];
              console.log("Validate");
              var isURLcorrect = this._Urlvalidator(this.txtURL.value);
              if (isURLcorrect) {

                  this.url = this.txtURL.value;
                  var requestArgs = {

                      url: this.url,
                      content: { f: "json" },
                      handleAs: "json",
                      callbackParamName: "callback",
                      timeout: 20000

                  };
                  esriRequest(requestArgs).then(lang.hitch(this, function (response) {

                      if (response.tasks !== undefined) {
                          var treeDom = dojo.byId("dijit_Tree_0");
                          if (treeDom !== null)
                          {
                              domConstruct.destroy(treeDom);
                          }
                          var myStore = new Memory({
                              data: [{ id: response.tasks, name: response.tasks}],
                              getChildren: function (object) {
                                  return this.query({ parent: object.id });
                              }
                          });

                          var myModel = new ObjectStoreModel({
                              store: myStore,
                              query: { id: response.tasks }
                          });
                          var tree = new Tree({
                              model: myModel
                          });
                          tree.placeAt(this.GpTasks);
                          tree.startup();
                      }
                      else {
                          alert(this.nls.inValidGPService);
                      }


                  }), lang.hitch(this, function (err) {
                      alert(err);
                  }));

              }
              else {
                  alert(this.nls.inValidGPService);
              }
          },

          /**
          * This function will validate the URL string.
          **/
          _Urlvalidator: function (value) {

              var strReg = '^' + regexp.url({
                  allowNamed: true,
                  allLocal: false
              });

              var reg = new RegExp(strReg, 'g');
              var b1 = reg.test(value);
              var p2 = /\/rest\/services/gi;
              var b2 = p2.test(value);
              return b1 && b2;
          }



      });
  });
