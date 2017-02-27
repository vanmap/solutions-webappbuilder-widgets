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
    'dojo/_base/array',
    'dojo/_base/lang',
    'dojo/query',
    'dojo/on',
    'dojo/Deferred',
    'dojo/DeferredList',
    'dojo/Evented',
    'dojox/data/CsvStore',
    'esri/graphicsUtils',
    'esri/geometry/webMercatorUtils',
    'esri/geometry/Point',
    'esri/Color',
    'esri/symbols/SimpleMarkerSymbol',
    'esri/renderers/SimpleRenderer',
    'esri/layers/FeatureLayer',
    'esri/tasks/locator',
    'jimu/utils'
],
function (declare, array, lang, query, on, Deferred, DeferredList, Evented, CsvStore,
  graphicsUtils, webMercatorUtils, Point, Color, SimpleMarkerSymbol, SimpleRenderer, FeatureLayer, Locator,
  jimuUtils) {
  return declare([Evented], {
      constructor: function (options) {
        this.file = options.file;
        this.map = options.map;
        this.arrayFields = options.arrayFields;
        this.geocodeSources = options.geocodeSources;

        this.data = null;
        this.separatorCharacter = null;
        this.csvStore = null;
        this.csvFieldNames = null;
        this.storeItems = null;
        this.featureCollection = null;
        this.featureLayer = null;
        this.mappedArrayFields = null;
        
        this.useAddr = true;
        this.addrFieldName = "";
        this.xFieldName = "";
        this.yFieldName = "";
        this.objectIdField = "ObjectID";
        this.nls = options.nls;
      },

      onHandleCsv: function () {
        var def = new Deferred();
        if (this.file && !this.file.data) {
          var reader = new FileReader();
          reader.onload = lang.hitch(this, function () {
            this.data = reader.result;
            this.onProcessCsvData().then(function (a) {
              def.resolve(a)
            });
          });
          reader.readAsText(this.file);
        }
        return def;
      },

      onProcessCsvData: function () {
        var def = new Deferred();
        this._convertSources().then(lang.hitch(this, function (source) {
          this.locatorSource = source;
          this.onGetSeparator();
          this.onGetCsvStore().then(lang.hitch(this, function (a) {
            def.resolve(a)
          }));
        }));
        return def;
      },

      onProcessForm: function () {
        var def = new Deferred();
        this.locateData().then(lang.hitch(this, function (data) {

            this.featureCollection = this._generateFC();
            this.unmatchedFC = this._generateFC();
          
            //TODO I have no idea if this is really safe...are the items gaurenteed to be returned in the same order as they were sent?
            // Has to be a safer way to do this.
            var unmatchedI = 0;
            for (var i = 0; i < this.storeItems.length; i++) {
              var attributes = {};
              var si = this.storeItems[i];
              var di = data[i];
              array.forEach(this.arrayFields, lang.hitch(this, function (f) {
                attributes[f.name] = this.csvStore.getValue(si, this.mappedArrayFields[f.name]);
              }));
              //TODO could also have a score threshold evaluated here
              if (di) {
                attributes["ObjectID"] = i - unmatchedI;
                this.featureCollection.featureSet.features.push({
                  "geometry": di.location,
                  "attributes": lang.clone(attributes)
                });
              } else {
                attributes["ObjectID"] = unmatchedI;
                //TODO need to handle the null location by doing something
                this.unmatchedFC.featureSet.features.push({
                  "geometry": new Point(0, 0, this.map.spatialReference),
                  "attributes": lang.clone(attributes)
                });
                unmatchedI++;
              }
            }

            if (unmatchedI > 0) {
              this.unMatchedFeatureLayer = this._initLayer(this.unmatchedFC,
                this.file.name += "_UnMatched");
            }

            //TODO this should be the theme color
            this.featureLayer = this._initLayer(this.featureCollection, this.file.name);

            this.onZoomToData(this.featureLayer);
            def.resolve('complete');

        }));
        return def;
      },

      _initLayer: function (fc, id) {
        var lyr = new FeatureLayer(fc, {
          id: id,
          editable: true,
          outFields: ["*"]
        });
        this.map.addLayers([lyr]);
        return lyr;
      },

      locateData: function () {
        var def = new Deferred();
        if (this.useAddr) {
          this._geocodeData().then(function (data) {
            def.resolve(data);
          });
        } else {
          this._xyData().then(function (data) {
            def.resolve(data);
          });
        }
        return def;
      },

      _xyData: function () {
        var def = new Deferred();

          this.isGeographic = undefined;
          var data = [];
          array.forEach(this.storeItems, lang.hitch(this, function (i) {
            var attributes = {};
            var _attrs = this.csvStore.getAttributes(i);
            array.forEach(_attrs, lang.hitch(this, function (a) {
              attributes[a] = this.csvStore.getValue(i, a);
            }));

            var xCoord = this.csvStore.getValue(i, this.xFieldName);
            var yCoord = this.csvStore.getValue(i, this.yFieldName);

            if (typeof (this.isGeographic) === 'undefined') {
              this.isGeographic = /(?=^[-]?\d{1,3}\.)^[-]?\d{1,3}\.\d+|(?=^[-]?\d{4,})|^[-]?\d{1,3}/.exec(xCoord) ? true : false;
            }
            var geometry = new Point(parseFloat(xCoord), parseFloat(yCoord));
            if (this.isGeographic) {
              geometry = webMercatorUtils.geographicToWebMercator(geometry);
            } else {
              geometry.spatialReference = new SpatialReference({ wkid: this.map.spatialReference.wkid });
            }

            data.push({
              attributes: attributes,
              location: geometry
            })
          }));

          def.resolve(data);


        return def;
      },

      _geocodeData: function () {
        //TODO pass additional user configured parameters

        //TODO see if the classification fields for the address elements
        // can be determined from the locator and handled more effectively
        var def = new Deferred();

          var fName = this.locatorSource.singleLineFieldName;
          var locator = this.locatorSource.locator;
          locator.outSpatialReference = this.map.spatialReference;

          var addrField, cityField, stateField, zipField;
          if (this.useMultiFields) {
            array.forEach(this.multiFields, lang.hitch(this, function (f) {
              switch (f.keyField) {
                case this.nls.address:
                  addrField = f.value;
                case this.nls.city:
                  cityField = f.value;
                case this.nls.state:
                  stateField = f.value;
                case this.nls.zip:
                  zipField = f.value;
              }
            }));
          }

          var max = 500;
          var geocodeOps = [];
          var x = 0;
          var i, j;
          for (var i = 0, j = this.storeItems.length; i < j; i += max) {
            var items = this.storeItems.slice(i, i + max);
            var addresses = [];
            array.forEach(items, lang.hitch(this, function (i) {
              x += 1;
              var addr = { "OBJECTID": x };
              if (this.useMultiFields) {
                var addrValue, cityValue, stateValue, zipValue;
                var concatAddr = "";
                if (addrField !== this.nls.noValue) {
                  concatAddr += this.csvStore.getValue(i, addrField);
                }
                if (cityField !== this.nls.noValue) {
                  concatAddr += ", " + this.csvStore.getValue(i, cityField);
                }
                if (stateField !== this.nls.noValue) {
                  concatAddr += ", " + this.csvStore.getValue(i, stateField);
                }
                if (zipField !== this.nls.noValue) {
                  concatAddr += " " + this.csvStore.getValue(i, zipField);
                }
                addr[fName] = concatAddr;
              } else {
                addr[fName] = this.csvStore.getValue(i, this.addrFieldName);
              }
              addresses.push(addr);
            }));
            geocodeOps.push(locator.addressesToLocations({ addresses: addresses, countryCode: this.locatorSource.countryCode }));
          }

          var geocodeList = new DeferredList(geocodeOps);
          geocodeList.then(lang.hitch(this, function (results) {
            var finalResults = [];
            if (results) {
              array.forEach(results, function (r) {
                array.forEach(r[1], function (_r) {
                  finalResults.push(_r);
                });
              });
              def.resolve(finalResults);
            }
          }));

        return def;
      },

      _generateFC: function () {
        var baseImageUrl = window.location.protocol + "//" + window.location.host + require.toUrl("widgets");
        //create a feature collection for the input csv file
        var lyr = {
          "layerDefinition": {
            "geometryType": "esriGeometryPoint",
            "objectIdField": this.objectIdField,
            "type": "Feature Layer",
            "drawingInfo": {
              "renderer": {
                "type": "simple",
                "symbol": {
                  "type": "esriPMS",
                  "url": baseImageUrl + "/CriticalFacilities/images/redpushpin.png",
                  "contentType": "image/png",
                  "width": 15,
                  "height": 15
                }
              }
            },
            "fields": [
                {
                  "name": this.objectIdField,
                  "alias": this.objectIdField,
                  "type": "esriFieldTypeOID"
                }
            ]
          },
          "featureSet": {
            "features": [],
            "geometryType": "esriGeometryPoint"
          }
        };

        array.forEach(this.arrayFields, lang.hitch(this, function (af) {
          lyr.layerDefinition.fields.push({
            "name": af.name,
            "alias": af.name,
            "type": af.value,
            "editable": true,
            "domain": null
          });
        }));

        return lyr;
      },

      clear: function () {
        if (this.featureLayer) {
          this.map.removeLayer(this.featureLayer);
          this.featureLayer.clear();
        }
        if (this.unMatchedFeatureLayer) {
          this.map.removeLayer(this.unMatchedFeatureLayer);
          this.unMatchedFeatureLayer.clear();
        }
        this.file = undefined;
        this.arrayFields = undefined;
        this.data = undefined;
        this.separatorCharacter = undefined;
        this.csvStore = undefined;
        this.csvFieldNames = undefined;
        this.storeItems = undefined;
        this.featureCollection = undefined;
        this.featureLayer = undefined;
        this.unMatchedFeatureLayer = undefined;
        this.mappedArrayFields = undefined;
        this.useAddr = true;
        this.addrFieldName = "";
        this.xFieldName = "";
        this.yFieldName = "";
      },

      onGetSeparator: function () {
        var newLineIndex = this.data.indexOf("\n");
        var firstLine = lang.trim(this.data.substr(0, newLineIndex));
        var separators = [",", "      ", ";", "|"];
        var maxSeparatorLength = 0;
        var maxSeparatorValue = "";
        array.forEach(separators, function (separator) {
          var length = firstLine.split(separator).length;
          if (length > maxSeparatorLength) {
            maxSeparatorLength = length;
            maxSeparatorValue = separator;
          }
        });
        this.separatorCharacter = maxSeparatorValue;
      },

      onGetCsvStore: function () {
        var def = new Deferred();
        this.csvStore = new CsvStore({
          data: this.data,
          separator: this.separatorCharacter
        });
        this.csvStore.fetch({
          onComplete: lang.hitch(this, function (items) {
            this.storeItems = items;
            this.onFetchFieldsAndUpdateForm().then(function (a) { def.resolve(a) });
          }),
          onError: function (error) {
            console.error("Error fetching items from CSV store: ", error);
            def.reject(error);
          }
        });
        return def;
      },

      onFetchFieldsAndUpdateForm: function () {
        var def = new Deferred();

          this.csvFieldNames = this.csvStore.getAttributes(this.storeItems[0]);
          this.fieldTypes = {};
          array.forEach(this.csvFieldNames, lang.hitch(this, function (attr) {
            var type = null;
            array.forEach(this.storeItems, lang.hitch(this, function (si) {
              var checkVal = true;
              var fTypeInt = true;
              var fTypeFloat = true;
              if (this.fieldTypes.hasOwnProperty(attr)) {
                fTypeInt = this.fieldTypes[attr].supportsInt;
                fTypeFloat = this.fieldTypes[attr].supportsFloat;
                if (!(fTypeInt) && !(fTypeFloat)) {
                  checkVal = false;
                }
              }
              if (checkVal) {
                var v = this.csvStore.getValue(si, attr);
                this.fieldTypes[attr] = {
                  supportsInt: ((parseInt(v) !== NaN) && parseInt(v).toString().length === v.toString().length) && fTypeInt,
                  supportsFloat: ((parseFloat(v) !== NaN) && parseFloat(v).toString().length === v.toString().length) && fTypeFloat
                }
              }
            }));
          }));
          def.resolve({
            fields: this.csvFieldNames,
            fieldTypes: this.fieldTypes,
            arrayFields: this.arrayFields
          });

        return def;
      },

      onZoomToData: function (featureLayer) {
        if (featureLayer.graphics && featureLayer.graphics.length > 0) {
          try {
            //TODO this would not handle null features
            var ext = graphicsUtils.graphicsExtent(featureLayer.graphics);
            this.map.setExtent(ext.expand(1.5), true)
          } catch (err) {
            console.log(err.message);
          }
        }
      },

      _convertSources: function () {
        var def = new Deferred();
        if (this.geocodeSources && this.geocodeSources.length > 0) {
          this._geocodeSources = array.map(this.geocodeSources, lang.hitch(this, function (source) {
            if (source && source.url && source.type === 'locator') {
              var _source = {
                locator: new Locator(source.url || ""),
                outFields: ["*"],
                singleLineFieldName: source.singleLineFieldName || "",
                name: jimuUtils.stripHTML(source.name || ""),
                placeholder: jimuUtils.stripHTML(source.placeholder || ""),
                countryCode: source.countryCode || "",
                maxSuggestions: source.maxSuggestions,
                maxResults: source.maxResults || 6,
                zoomScale: source.zoomScale || 50000
              };

              if (source.enableLocalSearch) {
                _source.localSearchOptions = {
                  minScale: source.localSearchMinScale,
                  distance: source.localSearchDistance
                };
              }
              def.resolve(_source);
            } else {
              def.resolve(null);
            }
          }));
        } else {
          def.resolve(null);
        }
        return def;
      }
  });
});