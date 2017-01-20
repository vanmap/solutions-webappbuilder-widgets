define([
    'dojo/_base/declare',
    'dojo/_base/array',
    'dojo/_base/lang',
    'dojo/query',
    'dojo/on',
    'dojo/dom',
    'dojo/dom-construct',
    'dojo/Deferred',
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
function (declare, array, lang, query, on, dom, domConstruct, Deferred, Evented, CsvStore,
  graphicsUtils, webMercatorUtils, Point, Color, SimpleMarkerSymbol, SimpleRenderer, FeatureLayer, Locator,
  jimuUtils) {
  return declare([Evented], {
      constructor: function (options) {
        this.inFile = options.inFile;
        this.inMap = options.inMap;
        this.inArrayFields = options.inArrayFields;
        this.arraySelectedFields = null;
        this.fileData = null;
        this.separatorCharacter = null;
        this.csvStore = null;
        this.csvFieldNames = null;
        this.storeItems = null;
        this.fullpath = null;
        this.featureCollection = null;
        this.featureLayer = null;
        this.correctFieldNames = null;
        this.mappedArrayFields = null;
        this.latField = null;
        this.longField = null;
        this.geocodeSources = options.geocodeSources;
        this.useAddr = true;
        this.addrFieldName = "";
        this.xFieldName = "";
        this.yFieldName = "";
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
        this.locateData().then(lang.hitch(this, function (data) {
          this.featureCollection = this._generateFeatureCollection();
          
          //TODO I have no idea if this is really safe...are the items gaurenteed to be returned in the same order as they were sent?
          // Has to be a safer way to do this.
          for (var i = 0; i < this.storeItems.length; i++) {
            var attributes = {};
            var si = this.storeItems[i];
            var di = data[i];
            array.forEach(this.inArrayFields, lang.hitch(this, function (f) {
              attributes[f.name] = this.csvStore.getValue(si, this.mappedArrayFields[f.name]);
            }));
            attributes["ObjectID"] = i;
            this.featureCollection.featureSet.features.push({
              "geometry": di.location,
              "attributes": lang.clone(attributes)
            });
          }

          this.featureLayer = new FeatureLayer(this.featureCollection, {
            id: this.inFile.name,
            editable: true,
            outFields: ["*"]
          });

          var orangeRed = new Color([238, 69, 0, 0.5]); // hex is #ff4500
          this.featureLayer.setRenderer(new SimpleRenderer(new SimpleMarkerSymbol("solid", 10, null, orangeRed)));
          on(this.featureLayer, "click", function (e) {
            console.log("FL clicked");
            console.log(e.graphic);
            console.log("X: " + e.graphic.geometry.x + ", Y: " + e.graphic.geometry.y);
          });
          this.inMap.addLayers([this.featureLayer]);
          this.onZoomToData(this.featureLayer);

          this.emit('complete');
        }));
      },

      locateData: function () {
        //TODO handle geocode or Lat Lon
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
        //TODO structure the current data in the store to match what comes from the locator
        // so both can be used in the same way further downstream
        array.forEach(this.storeItems, lang.hitch(this, function (i) {
          var attributes = {};
          var _attrs = this.csvStore.getAttributes(i);
          array.forEach(_attrs, lang.hitch(this, function (a) {
            attributes[a] = this.csvStore.getValue(i, a);
          }));

          var xCoord = this.csvStore.getValue(i, this.xFieldName);
          var yCoord = this.csvStore.getValue(i, this.yFieldName);
          
          if (typeof (this.isGeographic) === 'undefined') {
            this.isGeographic = /([-]?\d{1,3}[.]?\d*)/.exec(xCoord) ? true : false;
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
        var def = new Deferred();
        var fName = this.locatorSource.singleLineFieldName;
        //var attributes = this.csvStore._attributes;
        var addresses = [];
        var x = 0;
        array.forEach(this.storeItems, lang.hitch(this, function (i) {
          x += 1;
          var addr = { "OBJECTID": x };
          addr[fName] = this.csvStore.getValue(i, this.addrFieldName);
          //array.forEach(attributes, lang.hitch(this, function (a) {
          //  addr[a] = this.csvStore.getValue(i, a);
          //}));
          addresses.push(addr);
        }));
        var locator = this.locatorSource.locator;
        locator.outSpatialReference = this.inMap.spatialReference;
        locator.addressesToLocations({ addresses: addresses }).then(function (data) {
          def.resolve(data);
        });
        return def;
      },

      _generateFeatureCollection: function () {
        //create a feature collection for the input csv file
        this.featureCollection = {
          "layerDefinition": {
            "geometryType": "esriGeometryPoint",
            "objectIdField": "ObjectID",
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
                  "name": "ObjectID",
                  "alias": "ObjectID",
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
        def.resolve(this.csvFieldNames);
        this.emit('fields complete', this.csvFieldNames);
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
          var ext = graphicsUtils.graphicsExtent(featureLayer.graphics);
          this.inMap.setExtent(ext.expand(1.25), true)
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
                zoomScale: source.zoomScale || 50000,
                useMapExtent: !!source.searchInCurrentMapExtent
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