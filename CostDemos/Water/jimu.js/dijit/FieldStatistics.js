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
  'dijit/_WidgetBase',
  'dojo/_base/lang',
  'dojo/_base/html',
  'dojo/_base/array',
  'dojo/when',
  "esri/tasks/StatisticDefinition",
  "esri/tasks/QueryTask",
  "esri/tasks/query",
  "esri/lang",
  'jimu/dijit/Popup',
  'jimu/utils'
], function(declare, _WidgetBase, lang, html, array, when,
  StatisticDefinition, QueryTask, Query,
  esriLang, Popup, jimuUtils) {
  /*jshint unused: false*/
  return declare([_WidgetBase], {
    definitions: ["count", "sum", "min", "max", "avg", "stddev"],
    definitionNames: ["countField", "sumField", "minField",
      "maxField", "avgField", "stddevField"
    ],
    // layer: null,
    // fieldName: null,
    postMixInProperties: function() {
      this.nls = window.jimuNls.fieldStatistics;
      lang.mixin(this.nls, window.jimuNls.common);
    },

    statistics: function(layer, fieldName, filterStr, definitions, definitionNames) {
      this.getStatisticsInfo(layer, fieldName, filterStr, definitions, definitionNames)
      .then(lang.hitch(this, function(attributes) {
        if (attributes) {
          var flabels = array.filter(layer.fields, function(f) {
            return f.name === fieldName;
          });
          this.showStatisticsPopup(flabels[0].alias, attributes);
        } else {
          console.error('attributes is ', attributes);
        }
      }));
    },

    getStatisticsInfo: function(layer, fieldName, filterStr, definitions, definitionNames) {
      if (!(layer && layer.url) || !fieldName) {
        return when(null);
      }
      definitions = definitions && definitions.length > 0 ? definitions : this.definitions;
      definitionNames = definitionNames && definitionNames.length > 0 ?
        definitionNames : this.definitionNames;
      var query, queryTask;

      query = new Query();
      query.outFields = [fieldName];
      query.outStatistics = [];
      // query.where = "1=1";

      array.forEach(definitions, function(d, idx) {
        var def = new StatisticDefinition();
        def.statisticType = d;
        def.displayFeildName = fieldName;
        def.onStatisticField = fieldName;
        def.outStatisticFieldName = definitionNames[idx];
        query.outStatistics.push(def);
      });

      // var expr = this._getLayerFilterExpression();
      query.where = filterStr ? filterStr : "1=1";

      queryTask = new QueryTask(layer.url);

      return queryTask.execute(query).then(lang.hitch(this, function(result) {
        if (!this.domNode) {
          return;
        }
        if (result && result.features && result.features.length > 0) {
          return result.features[0] && result.features[0].attributes;
        } else {
          return null;
        }
      }));
    },

    showStatisticsPopup: function(fieldLabel, attributes) {
      if (!fieldLabel || !esriLang.isDefined(attributes)) {
        return;
      }
      var lowerCase = {},
        definitionTitles = ["count", "sum", "min", "max", "ave", "stddev"],
        wrapper, table, tbody, tr,
        avg, count, max, min, stddev, sum,
        key;

      if (this._statisticsPopup && this._statisticsPopup.domNode) {
        this._statisticsPopup.close();
      }
      this._statisticsPopup = null;

      // Content Container for Dialog
      wrapper = html.create("div", {
        className: "esriAGOTableStatistics",
        innerHTML: ""
      });

      // Set Dialog Title
      html.create("div", {
        className: "header",
        innerHTML: this.nls.field + ": " + fieldLabel
      }, wrapper);

      // Create a Horizontal break line
      html.create("div", {
        className: "hzLine",
        innerHTML: ""
      }, wrapper);

      // Create the Table Node
      table = html.create("table", {
        className: "attrTable",
        innerHTML: "",
        style: {
          cellpadding: 0,
          cellspacing: 0
        }
      }, wrapper);

      for (key in attributes) {
        if (attributes.hasOwnProperty(key)) {
          lowerCase[key.toLowerCase()] = attributes[key];
        }
      }

      count = esriLang.isDefined(lowerCase.countfield) ?
        jimuUtils.localizeNumber(lowerCase.countfield, {
          places: 2
        }) : "";
      sum = esriLang.isDefined(lowerCase.sumfield) ?
        jimuUtils.localizeNumber(lowerCase.sumfield, {
          places: 2
        }) : "";
      min = esriLang.isDefined(lowerCase.minfield) ?
        jimuUtils.localizeNumber(lowerCase.minfield, {
          places: 2
        }) : "";
      max = esriLang.isDefined(lowerCase.maxfield) ?
        jimuUtils.localizeNumber(lowerCase.maxfield, {
          places: 2
        }) : "";
      avg = esriLang.isDefined(lowerCase.avgfield) ?
        jimuUtils.localizeNumber(lowerCase.avgfield, {
          places: 2
        }) : "";
      stddev = esriLang.isDefined(lowerCase.stddevfield) ?
        jimuUtils.localizeNumber(lowerCase.stddevfield, {
          places: 2
        }) : "";

      tbody = html.create("tbody", {}, table);
      var stats = [count, sum, min, max, avg, stddev];
      var that = this;
      array.forEach(stats, function(s, i) {
        if (s === "") {
          return;
        }
        tr = html.create("tr", {
          valign: "top"
        }, tbody);
        html.create("td", {
          "class": "attrName",
          innerHTML: that.nls[definitionTitles[i]]
        }, tr);
        html.create("td", {
          "class": "attrValue",
          innerHTML: s
        }, tr);
      });

      // Padding for Close Button
      html.create("div", {
        className: "break",
        innerHTML: ""
      }, wrapper);

      this._statisticsPopup = new Popup({
        titleLabel: this.nls.statistics,
        content: wrapper,
        width: 330,
        height: 300,
        buttons: [{
          label: this.nls.ok
        }]
      });
      // this class come from api.
      html.addClass(this._statisticsPopup.domNode, "esri-feature-table-dialog");

      this.emit('statistics', {
        statistics: attributes
      });
    }
  });
});