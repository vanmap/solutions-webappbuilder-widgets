define([
    'dojo/_base/declare',
    'dojo/_base/array',
    'dojo/_base/lang',
    'dojo/query',
    'dojo/on',
    'dojo/dom',
    'dojo/dom-construct',
    'dojo/Deferred',
    'dojox/data/CsvStore',
    'esri/geometry/webMercatorUtils',
    'esri/geometry/Multipoint',
    'esri/geometry/Point',
    'esri/Color',
    'esri/symbols/SimpleMarkerSymbol',
    'esri/renderers/SimpleRenderer',
    'esri/layers/FeatureLayer',
    'esri/tasks/locator',
    'jimu/utils',
    'jimu/loaderplugins/jquery-loader!https://code.jquery.com/jquery-git1.min.js'
],
function (declare, array, lang, query, on, dom, domConstruct, Deferred, CsvStore, webMercatorUtils, Multipoint, Point, Color, SimpleMarkerSymbol, SimpleRenderer, FeatureLayer, Locator, jimuUtils, $) {
    return declare([], {
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

      onGetFeatureCollection: function () {

      },

      onProcessForm: function () {
        var objectId = 0;
        var counter = 0;
        this.locateData().then(lang.hitch(this, function (data) {
          this.featureCollection = this.onGenerateFeatureCollectionTemplateCSV();

          var attributes = {};
          
          //TODO I have no idea if this is really safe...are the items gaurenteed to be returned in the same order as they were sent?
          // Has to be a safer way to do this.
          for (var i = 0; i < this.storeItems.length; i++) {
            var si = this.storeItems[i];
            var di = data[i];
            array.forEach(this.inArrayFields, lang.hitch(this, function (f) {
              attributes[f.name] = this.csvStore.getValue(si, this.mappedArrayFields[f.name]);
            }));
            attributes["ObjectID"] = objectId;
            objectId++;

            var feature = {
              "geometry": di.location,
              "attributes": attributes
            };

            //var geometry = webMercatorUtils.geographicToWebMercator(new Point(di.location.x, di.location.y));
            //var geometry = new Point(di.location.x, di.location.y, di.location.spatialReference);

              //var feature = {
              //  "geometry": geometry.toJson(),
              //  "attributes": attributes
              //};

              //JSON.stringify(feature);
              this.featureCollection.featureSet.features.push(feature);
          }

          var orangeRed = new Color([238, 69, 0, 0.5]); // hex is #ff4500
          var marker = new SimpleMarkerSymbol("solid", 10, null, orangeRed);
          var renderer = new SimpleRenderer(marker);

          this.featureLayer = new FeatureLayer(this.featureCollection, {
            id: this.inFile.name,
            editable: true,
            outFields: ["*"]
          });
          this.featureLayer.setRenderer(renderer);
          on(this.featureLayer, "click", function (e) {
            console.log("FL clicked");
            console.log(e.graphic);
            console.log(e.graphic.attributes);
            console.log("X: " + e.graphic.geometry.x + ", Y: " + e.graphic.geometry.y);
          });
          this.inMap.addLayers([this.featureLayer]);
          this.onZoomToData(this.featureLayer);
          //this.submitData.disabled = false;
          //this.addToMap.disabled = true;
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

        //TODO structure the current data in the store to match what comes from the locator
        // so both can be used in the same way further downstream

        def.resolve(null);
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

      onGenerateFeatureCollectionTemplateCSV: function () {
        console.log("onGenerateFeatureCollectionTemplateCSV");
        //create a feature collection for the input csv file
        this.featureCollection = {
          "layerDefinition": null,
          "featureSet": {
            "features": [],
            "geometryType": "esriGeometryPoint"
          }
        };
        this.featureCollection.layerDefinition = {
          "geometryType": "esriGeometryPoint",
          "objectIdField": "ObjectID",
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
        };


        //var tempArray = [];
        //for (i = 1; i < this.mappedArrayFields.length; i++) {
        //  var entry = this.mappedArrayFields[i][1];
        //  tempArray.push(entry)
        //}

        //var count = 0;
        array.forEach(this.inArrayFields, lang.hitch(this, function (af) {
          this.featureCollection.layerDefinition.fields.push({
                  "name": af.name,
                  "alias": af.name,
                  "type": af.value,
                  "editable": true,
                  "domain": null
                });
        }));

        //array.forEach(tempArray, lang.hitch(this, function (csvFieldName) {
        //  console.log("csvFieldName " + csvFieldName);
        //  var value = this.csvStore.getValue(this.storeItems[0], csvFieldName);
        //  var parsedValue = Number(value);
        //  var correctFieldName = this.mappedArrayFields[count][1];
        //  if (isNaN(parsedValue)) { //check first value and see if it is a number
        //    this.featureCollection.layerDefinition.fields.push({
        //      "name": correctFieldName,
        //      "alias": correctFieldName,
        //      "type": "esriFieldTypeString",
        //      "editable": true,
        //      "domain": null
        //    });
        //    count += 1;
        //  } else {
        //    this.featureCollection.layerDefinition.fields.push({
        //      "name": correctFieldName,
        //      "alias": correctFieldName,
        //      "type": "esriFieldTypeDouble",
        //      "editable": true,
        //      "domain": null
        //    });
        //    count += 1;
        //  }
        //}));
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
        return def;
        //query('select[id^="select"]').forEach(lang.hitch(this, function (node, index, arr) {
        //  console.log("+++++++ " + node.name + " " + node.value);
        //  array.forEach(this.csvFieldNames, lang.hitch(this, function (csvFieldName, i) {
        //    //use   domconstruct here to create html elements -- lookup how this works -- look for sample code. Use to create html node and insert into widget.html element
        //    //declarative code vs constructed via dom-construct
        //    //get field names from REST endpoint
        //    //need way to determine type before the field is created.
        //    domConstruct.create("option", {
        //      value: i,
        //      innerHTML: csvFieldName,
        //      selected: false
        //    }, node);
        //  }));

        //  // Select the first option that matches one of the configuration field names
        //  var values = this.findValueByKeyValue(this.inArrayFields, "name", node.name.replace('select', 'array'));
        //  if (values) {
        //    array.forEach(node.options, function (optionItem) {
        //      if (values.includes(optionItem.text)) {
        //        // TODO: Use dojo not jQuery
        //        $("#" + node.name).val(optionItem.value);
        //        return false;
        //      }
        //    });
        //  }
        //}));
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
        console.log("onZoomToData");
        var multipoint = new Multipoint(this.inMap.spatialReference);
        array.forEach(featureLayer.graphics, function (graphic) {
          var geometry = graphic.geometry;
          if (geometry) {
            multipoint.addPoint({
              x: geometry.x,
              y: geometry.y
            });
          }
        });

        if (multipoint.points.length > 0) {
          this.inMap.setExtent(multipoint.getExtent().expand(1.25), true);
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