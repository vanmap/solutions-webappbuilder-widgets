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
        this.inFile = options.inFile;
        this.inMap = options.inMap;
        this.inArrayFields = options.inArrayFields;
        this.fileData = null;
        this.separatorCharacter = null;
        this.csvStore = null;
        this.csvFieldNames = null;
        this.storeItems = null;
        this.featureCollection = null;
        this.featureLayer = null;
        this.correctFieldNames = null;
        this.mappedArrayFields = null;
        this.geocodeSources = options.geocodeSources;
        this.useAddr = true;
        this.addrFieldName = "";
        this.xFieldName = "";
        this.yFieldName = "";
        this.objectIdField = "ObjectID";
        this.nls = options.nls;
      },

      onHandleCsv: function () {
        console.log("Processing CSV: ", this.inFile, ", ", this.inFile.name, ", ", this.inFile.type, ", ", this.inFile.size);
        var def = new Deferred();
        if (this.inFile && !this.inFile.data) {
          var reader = new FileReader();
          reader.onload = lang.hitch(this, function () {
            this.fileData = reader.result;
            this.onProcessCsvData().then(function (a) { def.resolve(a) })
          });
          reader.readAsText(this.inFile);
        }
        return def;
      },

      onProcessCsvData: function () {
        var def = new Deferred();
        this._convertSources().then(lang.hitch(this, function (source) {
          this.locatorSource = source;
          this.onGetSeparator();
          this.onGetCsvStore().then(function (a) { def.resolve(a) });
        }));
        return def;
      },

      onProcessForm: function () {
        var def = new Deferred();
        this.locateData().then(lang.hitch(this, function (data) {
          try{
            this._generateFeatureCollection();
            this._generateUnMatchedFeatureCollection();
          
            //TODO I have no idea if this is really safe...are the items gaurenteed to be returned in the same order as they were sent?
            // Has to be a safer way to do this.
            var unmatchedI = 0;
            for (var i = 0; i < this.storeItems.length; i++) {
              var attributes = {};
              var si = this.storeItems[i];
              var di = data[i];
              array.forEach(this.inArrayFields, lang.hitch(this, function (f) {
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
                this.unMatchedFeatureCollection.featureSet.features.push({
                  "geometry": new Point(0, 0, this.inMap.spatialReference),
                  "attributes": lang.clone(attributes)
                });
                unmatchedI++;
              }
            }

            if (unmatchedI > 0) {
              this.unMatchedFeatureLayer = new FeatureLayer(this.unMatchedFeatureCollection, {
                id: this.inFile.name += "_UnMatched",
                editable: true,
                outFields: ["*"]
              });

              var b = new Color([0, 255, 0, 0.5]); // hex is #ff4500
              this.unMatchedFeatureLayer.setRenderer(new SimpleRenderer(new SimpleMarkerSymbol("solid", 10, null, b)));
              on(this.unMatchedFeatureLayer, "click", function (e) {
                console.log("UnMatched FL clicked");
                console.log(e.graphic);
                console.log("X: " + e.graphic.geometry.x + ", Y: " + e.graphic.geometry.y);
              });
              this.inMap.addLayers([this.unMatchedFeatureLayer]);
            }


            this.featureLayer = new FeatureLayer(this.featureCollection, {
              id: this.inFile.name,
              editable: true,
              outFields: ["*"]
            });
            var orangeRed = new Color([238, 69, 0, 0.2]); // hex is #ff4500
            this.featureLayer.setRenderer(new SimpleRenderer(new SimpleMarkerSymbol("solid", 10, null, orangeRed)));
            on(this.featureLayer, "click", function (e) {
              console.log("FL clicked");
              console.log(e.graphic);
              console.log("X: " + e.graphic.geometry.x + ", Y: " + e.graphic.geometry.y);
            });
            this.inMap.addLayers([this.featureLayer]);
            this.onZoomToData(this.featureLayer);
            def.resolve('complete');
          } catch (err) {
            console.log(err);
            def.reject(err)
          }
        }));
        return def;
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
            geometry.spatialReference = new SpatialReference({ wkid: this.inMap.spatialReference.wkid });
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
        //TODO understand the limits of this and handle chunking the requests if necessary
        //TODO pass additional user configured parameters

        //TODO see if the classification fields for the address elements
        // can be determined from the locator and handled more effectively
        var def = new Deferred();
        var fName = this.locatorSource.singleLineFieldName;
        var locator = this.locatorSource.locator;
        locator.outSpatialReference = this.inMap.spatialReference;

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

        var max = 2;
        var geocodeOps = [];
        var x = 0;
        var i, j;
        for (var i = 0, j = this.storeItems.length; i < j; i+= max) {
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

      _generateFeatureCollection: function () {
        //create a feature collection for the input csv file
        this.featureCollection = {
          "layerDefinition": {
            "geometryType": "esriGeometryPoint",
            "objectIdField": this.objectIdField,
            "type": "Feature Layer",
            "drawingInfo": {
              "renderer": {
                "type": "simple",
                "symbol": {
                  "type": "esriPMS",
                  "url": "https://static.arcgis.com/images/Symbols/Basic/RedSphere.png",
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

        array.forEach(this.inArrayFields, lang.hitch(this, function (af) {
          this.featureCollection.layerDefinition.fields.push({
            "name": af.name,
            "alias": af.name,
            "type": af.value,
            "editable": true,
            "domain": null
          });
        }));
        return this.featureCollection;
      },

      _generateUnMatchedFeatureCollection: function () {
        //create a feature collection for the null results from the
        // geocode operation
        this.unMatchedFeatureCollection = {
          "layerDefinition": {
            "geometryType": "esriGeometryPoint",
            "objectIdField": this.objectIdField,
            "type": "Feature Layer",
            "drawingInfo": {
              "renderer": {
                "type": "simple",
                "symbol": {
                  "type": "esriPMS",
                  "url": "https://static.arcgis.com/images/Symbols/Basic/RedSphere.png",
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

        array.forEach(this.inArrayFields, lang.hitch(this, function (af) {
          this.unMatchedFeatureCollection.layerDefinition.fields.push({
            "name": af.name,
            "alias": af.name,
            "type": af.value,
            "editable": true,
            "domain": null
          });
        }));
        return this.unMatchedFeatureCollection;
      },

      clear: function () {
        if (this.featureLayer) {
          this.inMap.removeLayer(this.featureLayer);
          this.featureLayer.clear();
        }
        if (this.unMatchedFeatureLayer) {
          this.inMap.removeLayer(this.unMatchedFeatureLayer);
          this.unMatchedFeatureLayer.clear();
        }
        this.inFile = undefined;
        this.inArrayFields = undefined;
        this.fileData = undefined;
        this.separatorCharacter = undefined;
        this.csvStore = undefined;
        this.csvFieldNames = undefined;
        this.storeItems = undefined;
        this.featureCollection = undefined;
        this.featureLayer = undefined;
        this.unMatchedFeatureLayer = undefined;
        this.correctFieldNames = undefined;
        this.mappedArrayFields = undefined;
        this.useAddr = true;
        this.addrFieldName = "";
        this.xFieldName = "";
        this.yFieldName = "";
      },

      onGetSeparator: function () {
        console.log("onGetSeparator");
        var newLineIndex = this.fileData.indexOf("\n");
        var firstLine = lang.trim(this.fileData.substr(0, newLineIndex));
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
          data: this.fileData,
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
          arrayFields: this.inArrayFields
        });
        return def;
      },

      findValueByKeyValue: function (arraytosearch, key, valuetosearch) {
        for (var i = 0; i < arraytosearch.length; i++) {
          if (arraytosearch[i][key] == valuetosearch) {
            return arraytosearch[i].value;
          }
        }
        return null;
      },

      onZoomToData: function (featureLayer) {
        if (featureLayer.graphics && featureLayer.graphics.length > 0) {
          //TODO this would not handle null features
          var ext = graphicsUtils.graphicsExtent(featureLayer.graphics);
          this.inMap.setExtent(ext.expand(1.5), true)
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
      },
  });
});