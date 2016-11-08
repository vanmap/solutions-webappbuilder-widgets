define(['dojo/_base/declare',
  'jimu/BaseWidget',
  'dojo/_base/lang',
  'dojo/on',
  'dojo/dom',
  'dojo/_base/array',
  "dojox/data/CsvStore",
  "dojo/query",
  "dijit/registry",
  "esri/geometry/webMercatorUtils",
  "esri/geometry/Point",
  "esri/Color",
  "esri/config",
  "esri/symbols/SimpleMarkerSymbol",
  "esri/renderers/SimpleRenderer",
  "esri/layers/FeatureLayer",
  "./helyxcsvstore",
  'jimu/loaderplugins/jquery-loader!https://code.jquery.com/jquery-git1.min.js'],
  function (declare, BaseWidget, lang, on, dom, arrayUtils, CsvStore, query, registry, webMercatorUtils, Point, Color, esriConfig, SimpleMarkerSymbol, SimpleRenderer, FeatureLayer, hCsvStore, $) {
    //To create a widget, you need to derive from BaseWidget.
    return declare([BaseWidget], {
      // Custom widget code goes here

      baseClass: 'jimu-widget-customwidget',

      // this property is set by the framework when widget is loaded.
      name: 'HelyxWidget',

      thisMap: null,
      domMap: null,
      arraySelectedFields: null,
      arrayFields: null,
      myCsvStore: null,
      correctArrayFields: null,
      

      // methods to communication with app container:
      postCreate: function () {
        console.log('postCreate');
        this.inherited(arguments);
        this.own(on(this.map, "mouse-move", lang.hitch(this, this.onMouseMove)));
        this.own(on(this.map, "click", lang.hitch(this, this.onMapClick)));
        //change here when looking up field headers from a feature service
        var arrayFacility = ['Facility', 'Fac', 'Facil'];
        var arrayAddress = ['Address', 'Add'];
        var arrayCity = ['Town', 'City'];
        var arrayState = ['State', 'St'];
        var arrayLongitude = ['Lon', 'Long', 'Longitude'];
        var arrayLatitude = ['Lat', 'Latitude'];
        var arrayType = ['Type', 'Ty'];
        var arrayUsngNot = ['USNGNOT', 'USNG', 'USNG_NOT'];
        var arrayX = ['X', 'XCoords'];
        var arrayY = ['Y', 'YCoords'];
        arrayFields = [
          { name: 'arrayFacility', value: arrayFacility },
          { name: 'arrayAddress', value: arrayAddress },
          { name: 'arrayCity', value: arrayCity },
          { name: 'arrayState', value: arrayState },
          { name: 'arrayLongitude', value: arrayLongitude },
          { name: 'arrayLatitude', value: arrayLatitude },
          { name: 'arrayType', value: arrayType },
          { name: 'arrayUsngNot', value: arrayUsngNot },
          { name: 'arrayX', value: arrayX },
          { name: 'arrayY', value: arrayY }
        ];

        correctArrayFields = [
          { name: 'arrayFacility', value: 'Facility' },
          { name: 'arrayAddress', value: 'Address' },
          { name: 'arrayCity', value: 'City' },
          { name: 'arrayState', value: 'State' },
          { name: 'arrayLongitude', value: 'Longitude' },
          { name: 'arrayLatitude', value: 'Latitude' },
          { name: 'arrayType', value: 'Type' },
          { name: 'arrayUsngNot', value: 'USING_NOT' },
          { name: 'arrayX', value: 'X' },
          { name: 'arrayY', value: 'Y' }
        ];

      


      },

      startup: function () {
        console.log('startup');
        this.inherited(arguments);
        // this.mapIdNode.innerHTML = 'map id:' + this.map.id;
        // this.mapSrNode.innerHTML = 'map sr:' + this.map.spatialReference.wkid;
        thisMap = this.map;
        //hide all layers
        var featureservice = this.config.selectedFeatureService;
        console.log("config Feature Service " + featureservice);
        domMap = dom.byId(this.map.id);
        if (thisMap) {
          on(domMap, "dragenter", this.onDragEnter);
          on(domMap, "dragover", this.onDragOver);
          on(domMap, "drop", this.onDrop);   

        } else {
          console.log('Error grabbing map from DOM');
        }
      },

      onDragEnter: function (event) {
        console.log('onDragEnter');
        event.preventDefault();
      },

      onDragOver: function (event) {
        console.log('onDragOver');
        event.preventDefault();
      },

      onDrop: function (event) {
        console.log('onDrop');
        event.preventDefault();

        var dataTransfer = event.dataTransfer,
          files = dataTransfer.files,
          types = dataTransfer.types;

        // File drop?
        if (files && files.length === 1) {
          console.log("[ FILES ]");
          var file = files[0]; // that's right I'm only reading one file
          console.log("type = ", file.type);
          if (file.name.indexOf(".csv") !== -1) {
            console.log("handle as Csv (file)");
            myCsvStore = new hCsvStore({
                inFile: file,
                inArrayFields: arrayFields,
                inMap: thisMap
            });
            myCsvStore.arraySelectedFields = this.arraySelectedFields;
            myCsvStore.onHandleCsv();
           
          }
        }

        // Show form - need to test all ok here first
        // $('#fields-popup').show();

      },

      bytesToString: function (b) {
        console.log("bytes to string");
        var s = [];
        arrayUtils.forEach(b, function (c) {
          s.push(String.fromCharCode(c));
        });
        return s.join("");
      },

      onMapClick: function (evt) {
      // console.log('onMapClick');
        // if (window.appInfo.isRunInMobile) {
        //   return;
        // }
        // if (!this.enableRealtime || !this.selectedItem) {
        //   return;
        // }
        //console.log(JSON.stringify(evt.mapPoint));
      },

      onMouseMove: function (evt) {
       // console.log('onMouseMove');
   
      },



      //this is where things are added

      onAddClick: function() {
        console.log('onAddClick');


        var map0 = dojo.query('select#selectFacility')[0][dojo.query('select#selectFacility').val()].firstChild.data;
        var map1 = dojo.query('select#selectAddress')[0][dojo.query('select#selectAddress').val()].firstChild.data;
        var map2 = dojo.query('select#selectCity')[0][dojo.query('select#selectCity').val()].firstChild.data;
        var map3 = dojo.query('select#selectState')[0][dojo.query('select#selectState').val()].firstChild.data;
        var map4 = dojo.query('select#selectLongitude')[0][dojo.query('select#selectLongitude').val()].firstChild.data;
        var map5 = dojo.query('select#selectLatitude')[0][dojo.query('select#selectLatitude').val()].firstChild.data;
        var map6 = dojo.query('select#selectType')[0][dojo.query('select#selectType').val()].firstChild.data;
        //var map7 = dojo.query('select#selectUsngNot')[0][dojo.query('select#selectUsngNot').val()].firstChild.data
        var map7 = "USNG_NOT";
        var map8 = dojo.query('select#selectX')[0][dojo.query('select#selectX').val()].firstChild.data;
        var map9 = dojo.query('select#selectY')[0][dojo.query('select#selectY').val()].firstChild.data;

        var lab0 = "Facility";
        var lab1 = "Address";
        var lab2 = "City";
        var lab3 = "State";
        var lab4 = "Longitude";
        var lab5 = "Latitude";
        var lab6 = "Type";
        var lab7 = "USNG_NOT";
        var lab8 = "X";
        var lab9 = "Y";


        var arrayMappedFields = [[map0,lab0], [map1,lab1], [map2,lab2], [map3,lab3], [map4,lab4], [map5,lab5], [map6,lab6], [map7,lab7], [map8,lab8], [map9,lab9]];

       // arrayUtils.forEach(arrayMappedFields, lang.hitch(this, function(mappedField, i) {

         // console.log("++++ " + mappedField);

       // }));

         //schema mapping here!
         //get array of fields from the feature collection
         //get an array of fields from the select boxes by value and map the two
         //setup new feature collection by mapping new feature names to old feature names

        arraySelectedFields = [];
 
        query('select[id^="select"]').forEach(function (node, index, arr) {
            var nodeName = node.name;
            var selectedOption = $("#" + node.name + " :selected").text();
            
          // console.log("node Name " + node.name + ": " + selectedOption );
            // Populate selected fields array and update class property
            arraySelectedFields.push({ name: nodeName, value: selectedOption });
            myCsvStore.arraySelectedFields = arraySelectedFields;
            myCsvStore.correctFieldNames = correctArrayFields;
            myCsvStore.mappedArrayFields = arrayMappedFields;
        });
    //    console.log("Stringified selected fields: " + JSON.stringify(arraySelectedFields));
        
        // Add the CSV Store to the map using featurecollection and featurelayer
        myCsvStore.onProcessForm();
        // processForm(this.map, arraySelectedFields);

      },

      // submit to feature service
      onSubmitClick: function(){
         console.log('onSubmitClick');

         //submits the added graphics to the feature service, this is currently hard coded, but will eventually be taken from the confurator thing
        

         var featureLayer = myCsvStore.featureLayer;

        // var features = featureLayer.features;        
                         

         console.log("featureLayer size " + featureLayer.id ); 

         //update features in this demo, add features later and update

        //get data from REST endpoint and compare the ID of each of the records against what is already there. Sort them into two arrays and invoke add/update 
        //via applyEdits below
        var flayer = new esri.layers.FeatureLayer("https://opsserver1041.bristol.local:6443/arcgis/rest/services/critical_facilities/shelters_manatee/FeatureServer/0",  {
          mode: esri.layers.FeatureLayer.MODE_ONDEMAND,
          
          outFields: ['*']
        });

        console.log("featureService " + flayer.graphics)

        //features to add
         var features = featureLayer.graphics;
         var theExtent = null;

         console.log("features length " + features.length);

         for (var f = 0, fl = features.length; f < fl; f++) {
            var feature = features[f];
            var attribs = feature.attributes;
             // feature.setSymbol(normalpictureMarkerSymbol);
             feature.setInfoTemplate(flayer.infoTemplate);
                            flayer.add(feature);

                            //adds, updates, deletes, callback, errback
                            flayer.applyEdits([feature], null , null);
                            //this.map.addLayers([flayer]);

                          
        }  

        console.log("finished " + flayer.graphics.length + " " + flayer.name);
       
      },

      onClearClick: function(){
             console.log('onClearClick');

         //REST endpoint https://opsserver1041.bristol.local:6443/arcgis/rest/services/critical_facilities/shelters_manatee/FeatureServer/0/applyEdits
         //update features in this demo, add features later and update

        //get data from REST endpoint and compare the ID of each of the records against what is already there. Sort them into two arrays and invoke add/update 
        //via applyEdits below
        var flayer = new esri.layers.FeatureLayer("https://opsserver1041.bristol.local:6443/arcgis/rest/services/critical_facilities/shelters_manatee/FeatureServer/0",  {
          mode: esri.layers.FeatureLayer.MODE_ONDEMAND,
          
          outFields: ['*']
        });

        var features = flayer.graphics;

        console.log("featureService " + flayer.graphics);

        //features to add
        // var features = featureLayer.selectFeatures();
         var theExtent = null;
         var selectQuery = new Query();

        //  selectQuery.where = "'Facility' = '*'";
        selectQuery.where = "1=1";

         var selectFeatures = flayer.selectFeatures(selectQuery, flayer.SELECTION_NEW);
         

         //console.log("features length " + selectFeatures.length);

        /* for (var f = 0, fl = features.length; f < fl; f++) {
            var feature = features[f];
            var attribs = feature.attributes;
             // feature.setSymbol(normalpictureMarkerSymbol);
             feature.setInfoTemplate(flayer.infoTemplate);
                            flayer.add(feature);

                            //adds, updates, deletes, callback, errback
                            flayer.applyEdits(null, null, [feature]);
                            //this.map.addLayers([flayer]);
                            flayer.refresh();
        } */

        console.log("selected Features " + selectedFeatures.id);

        flayer.applyEdits(null,null,[selectFeatures]); 

        console.log("finished clearing features " + flayer.graphics.length + " " + flayer.name);

      },

  
      onResetClick: function() {
        console.log('onResetClick');
      },

      onOpen: function () {
        console.log('onOpen');
      },

      onClose: function () {
        console.log('onClose');
      },

      onMinimize: function () {
        console.log('onMinimize');
      },

      onMaximize: function () {
        console.log('onMaximize');
      },

      onSignIn: function (credential) {
        /* jshint unused:false*/
        console.log('onSignIn');
      },

      onSignOut: function () {
        console.log('onSignOut');
      },

      onPositionChange: function () {
        console.log('onPositionChange');
      },

      resize: function () {
        console.log('resize');
      }

      //methods to communication between widgets:

    });


    // // function handleCsv(file) {
    // //   console.log("Processing CSV: ", file, ", ", file.name, ", ", file.type, ", ", file.size);
    // //   if (file.data) {
    // //     console.log('file.data');
    // //     var decoded = bytesToString(base64.decode(file.data));
    // //     processCsvData(decoded);
    // //   }
    // //   else {
    // //     console.log('not file.data');
    // //     var reader = new FileReader();
    // //     reader.onload = function () {
    // //       console.log("Finished reading CSV data");
    // //       processCsvData(reader.result);
    // //     };
    // //     reader.readAsText(file);
    // //   }
    // // }

    // function bytesToString(b) {
    //   console.log("bytes to string");
    //   var s = [];
    //   arrayUtils.forEach(b, function (c) {
    //     s.push(String.fromCharCode(c));
    //   });
    //   return s.join("");
    // };

    // function processCsvData(data) {
    //   console.log("Process CSV Data");
    //   var newLineIndex = data.indexOf("\n");
    //   var firstLine = lang.trim(data.substr(0, newLineIndex));
    //   var separator = getSeparator(firstLine);
    //   csvStore = new CsvStore({
    //     data: data,
    //     separator: separator
    //   });

    //   var optionsArr = [];
    //   var optionsStr = "";

    //   csvStore.fetch({
    //     onComplete: function (items) {
    //       console.log(typeof (items));
    //       csvItems = items;

    //       // Iterate the first row to get all field names
    //       var fieldNames = csvStore.getAttributes(items[0]);
    //       arrayUtils.forEach(fieldNames, function (fieldName, i) {
    //         // Add item to array
    //         optionsArr.push({
    //           value: i + "",
    //           text: fieldName
    //         });
    //         // Add item to string
    //         optionsStr += '<option value="' + i + '">' + fieldName + '</option>';
    //       });
    //       console.log(optionsStr);

    //       // Add the string of options to the form's select controls
    //       query('select[id^="select"]').forEach(function (node, index, arr) {
    //         // query(".form-control").forEach(function (node, index, arr) {
    //         console.debug(node.name);
    //         $("#" + node.name).empty();
    //         $("#" + node.name).append(optionsStr);

    //         // Get the appropriate array for the select element
    //         var values = findValueByKeyValue(arrayFields, "name", node.name.replace('select', 'array'));
    //         if (values) {
    //           // Iterate select options
    //           $("#" + node.name + " > option").each(function () {
    //             //console.log(this.value + ' ' + this.text);
    //             // Set the select option from first match encountered
    //             if (values.includes(this.text)) {
    //               $("#" + node.name).val(this.value);
    //               return false;
    //             }
    //           });
    //         }
    //       });



    //     },
    //     onError: function (error) {
    //       console.error("Error fetching items from CSV store: ", error);
    //     }
    //   });
    // }

    // function processForm(_map, arraySelectedFields) {
    //   console.log("processForm");

    //   var objectId = 0;

    //   csvStore.fetch({
    //     onComplete: function (items) {
    //       console.log("csvStore.fetch");
    //       var objectId = 0;
    //       var latField = findValueByKeyValue(arraySelectedFields, "name", "selectLatitude");
    //       var longField = findValueByKeyValue(arraySelectedFields, "name", "selectLongitude")

    //       // Init the feature collections
    //       featureCollection = generateFeatureCollectionTemplateCSV(csvStore, items);

    //       // Add records in this CSV store as graphics
    //       arrayUtils.forEach(items, function (item) {
    //         var attrs = csvStore.getAttributes(item),
    //           attributes = {};
    //         // Read all the attributes for this record/item
    //         arrayUtils.forEach(attrs, function (attr) {
    //           var value = Number(csvStore.getValue(item, attr));
    //           attributes[attr] = isNaN(value) ? csvStore.getValue(item, attr) : value;
    //         });

    //         attributes["ObjectID"] = objectId;
    //         objectId++;

    //         var latitude = parseFloat(attributes[latField]);
    //         var longitude = parseFloat(attributes[longField]);

    //         if (isNaN(latitude) || isNaN(longitude)) {
    //           return;
    //         }

    //         var geometry = webMercatorUtils
    //           .geographicToWebMercator(new Point(longitude, latitude));
    //         var feature = {
    //           "geometry": geometry.toJson(),
    //           "attributes": attributes
    //         };
    //         JSON.stringify(feature);
    //         // featureCollection.featureSet.features.push(feature);
    //       });

    //       var orangeRed = new Color([238, 69, 0, 0.5]); // hex is #ff4500
    //       var marker = new SimpleMarkerSymbol("solid", 10, null, orangeRed);
    //       var renderer = new SimpleRenderer(marker);

    //       //var json = { title: "Attributes", content: "Lat: ${Lat}<br>Lon: ${Lon}" }
    //       //var infoTemplate = new InfoTemplate(json);

    //       featureLayer = new FeatureLayer(featureCollection, {
    //         //infoTemplate: infoTemplate,
    //         id: 'csvLayer',
    //         editable: true,
    //         outFields: ["*"]
    //       });
    //       featureLayer.setRenderer(renderer);

    //       _map.addLayer(featureLayer);
    //       // zoomToData(featureLayer);

    //       //create new FeatureTable and set its properties
    //       // var featureTable = new FeatureTable({
    //       //   featureLayer: featureLayer,
    //       //   map: map,
    //       //   showAttachments: true,
    //       //   gridOptions: {
    //       //     allowSelectAll: false,
    //       //     allowTextSelection: true,
    //       //   },
    //       //   editable: true,

    //       //   //define order and visibility of fields. If the fields are not listed in 'outFIelds'
    //       //   // then they will be hidden when the table starts.
    //       //   outFields: ["*"],
    //       //   fieldInfos: [
    //       //     {
    //       //       name: 'ObjectId',
    //       //       alias: 'Object ID',
    //       //     },
    //       //     {
    //       //       name: 'Lat',
    //       //       alias: 'Lat',
    //       //     },
    //       //     {
    //       //       name: 'Lon',
    //       //       alias: 'Lon',
    //       //     }
    //       //   ],
    //       // }, 'myTableNode');

    //       // featureTable.startup();

    //       // featureTable.on("row-select", function (evt) {
    //       //   console.log("select event - ", evt[0].data);
    //       // });

    //     },
    //     onError: function (error) {
    //       console.error("Error fetching items from CSV store: ", error);
    //     }
    //   });
    // }

    // function generateFeatureCollectionTemplateCSV(store, items) {
    //   console.log("generateFeatureCollectionTemplateCSV");
    //   //create a feature collection for the input csv file
    //   var featureCollection = {
    //     "layerDefinition": null,
    //     "featureSet": {
    //       "features": [],
    //       "geometryType": "esriGeometryPoint"
    //     }
    //   };
    //   featureCollection.layerDefinition = {
    //     "geometryType": "esriGeometryPoint",
    //     "objectIdField": "ObjectID",
    //     "drawingInfo": {
    //       "renderer": {
    //         "type": "simple",
    //         "symbol": {
    //           "type": "esriPMS",
    //           "url": "https://static.arcgis.com/images/Symbols/Basic/RedSphere.png",
    //           "contentType": "image/png",
    //           "width": 15,
    //           "height": 15
    //         }
    //       }
    //     },
    //     "fields": [
    //       {
    //         "name": "ObjectID",
    //         "alias": "ObjectID",
    //         "type": "esriFieldTypeOID"
    //       }
    //     ]
    //   };

    //   var fields = store.getAttributes(items[0]);
    //   arrayUtils.forEach(fields, function (field) {
    //     var value = store.getValue(items[0], field);
    //     var parsedValue = Number(value);
    //     if (isNaN(parsedValue)) { //check first value and see if it is a number
    //       featureCollection.layerDefinition.fields.push({
    //         "name": field,
    //         "alias": field,
    //         "type": "esriFieldTypeString",
    //         "editable": true,
    //         "domain": null
    //       });
    //     }
    //     else {
    //       featureCollection.layerDefinition.fields.push({
    //         "name": field,
    //         "alias": field,
    //         "type": "esriFieldTypeDouble",
    //         "editable": true,
    //         "domain": null
    //       });
    //     }
    //   });
    //   return featureCollection;
    // }

    // function getSeparator(string) {
    //   var separators = [",", "      ", ";", "|"];
    //   var maxSeparatorLength = 0;
    //   var maxSeparatorValue = "";
    //   arrayUtils.forEach(separators, function (separator) {
    //     var length = string.split(separator).length;
    //     if (length > maxSeparatorLength) {
    //       maxSeparatorLength = length;
    //       maxSeparatorValue = separator;
    //     }
    //   });
    //   return maxSeparatorValue;
    // }

    // function findValueByKeyValue(arraytosearch, key, valuetosearch) {
    //   for (var i = 0; i < arraytosearch.length; i++) {
    //     if (arraytosearch[i][key] == valuetosearch) {
    //       return arraytosearch[i].value;
    //     }
    //   }
    //   console.log("Unable to find key-value: " + key + "-" + valuetosearch)
    //   return null;
    // }

  });