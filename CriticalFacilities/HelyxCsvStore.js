define([
    'dojo/_base/declare',
    'dojo/_base/array',
    'dojo/_base/lang',
    'dojo/query',
    'dojo/on',
    'dojo/dom',
    'dojo/dom-construct',
    'dojox/data/CsvStore',
    'esri/geometry/webMercatorUtils',
    'esri/geometry/Multipoint',
    'esri/geometry/Point',
    'esri/Color',
    'esri/symbols/SimpleMarkerSymbol',
    'esri/renderers/SimpleRenderer',
    'esri/layers/FeatureLayer',
    'jimu/loaderplugins/jquery-loader!https://code.jquery.com/jquery-git1.min.js'
], 


function (declare, arrayUtils, lang, query, on, dom, domConstruct, CsvStore, webMercatorUtils, Multipoint, Point, Color, SimpleMarkerSymbol, SimpleRenderer, FeatureLayer, $) {
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
     


        },

        
        
        onHandleCsv: function () {
            console.log("onHandleCsv");
            console.log("Processing CSV: ", this.inFile, ", ", this.inFile.name, ", ", this.inFile.type, ", ", this.inFile.size);
            if (this.inFile.data) {
                console.log('file.data');
                //var decoded = bytesToString(base64.decode(file.data));
                //processCsvData(decoded);
            }
            else {
                console.log("not file data");
                var reader = new FileReader();
                reader.onload = lang.hitch(this, function () {
                    console.log("Finished reading CSV data");
                    // processCsvData(reader.result);
                    this.fileData = reader.result;
                    
                    this.onProcessCsvData();
                });
                reader.readAsText(this.inFile);
            }
        },

        onProcessCsvData: function () {
            console.log("onProcessCsvData");

            // Get the separator
            this.onGetSeparator();

            // Get the store and fetch the items
            this.onGetCsvStore();

        },
        
        onGetFeatureCollection: function () {
            console.log("onGetFeatureCollection");
        },

        //this is the location where the schema lookup is actually done (I think!)
        onProcessForm: function () {
            console.log("processForm");

            var objectId = 0;
            var counter = 0;

            //get the lat and long fields from the mapped fields/from the user telling us in the configuration

            //var latField = "latitude";
           // var longFields = "longitude";
            
            //var latField = this.findValueByKeyValue(this.arraySelectedFields, "name", "selectLatitude");
            //var longField = this.findValueByKeyValue(this.arraySelectedFields, "name", "selectLongitude");

            // Init the feature collections
            this.featureCollection = this.onGenerateFeatureCollectionTemplateCSV();

         
            console.log("++++ mappedArrayFields " + this.mappedArrayFields.length);

          /**   arrayUtils.forEach(this.mappedArrayFields, function(field){
                    console.log("mapped Array Fields " + field);
                });*/

          
        
            arrayUtils.forEach(this.storeItems, lang.hitch(this, function(item) {

                var attrs = this.csvStore.getAttributes(item),
            
                attributes = {}; 

                //console.log ("attrs " + attrs);
                   
                // Read all the attributes for this record/item
                //use 1 to skip the spatial object
                var count = 1;

                arrayUtils.forEach(attrs, lang.hitch(this, function(attr) {
                    //attr is the name of the attribute
                    
                  //  console.log("attr " + attr + " numValue " + numVal);
                    //change the value lookup to get the number indicated by the lookup
                   // console.log ("+!+!+! " + this.mappedArrayFields[count][0]);
                   
                    var value = Number(this.csvStore.getValue(item, this.mappedArrayFields[count][0]));

                 //   console.log(" value " + value + " csvStore.getValue " + this.csvStore.getValue(item, this.mappedArrayFields[count][0]));

                    attributes[this.mappedArrayFields[count][1]] = isNaN(value) ? this.csvStore.getValue(item, this.mappedArrayFields[count][0]) : value;
                    
                   // if(attributes[this.mappedArrayFields[count][1]] == isNaN(value)){

                      //this.mappedArrayFields[count][1] = this.csvStore.getValue(item, this.mappedArrayFields[count][0]);
                    //}

                   //console.log("attributes " + attributes[this.mappedArrayFields[count][1]]);
                   // console.log("attr " + attr + " value " + attributes[attr] );
                   count++;

                })); 

                
                attributes["ObjectID"] = objectId;
                objectId++;

               // console.log("latfield " + this.latField + " longfield " + this.longField);

                //console.log("attributes  1 " + attributes);
           

                //console.log("latitude " + attributes[this.latField] + " longitude " + attributes[this.longField]);


                var latitude = parseFloat(attributes[this.latField]);
                var longitude = parseFloat(attributes[this.longField]);


                if (isNaN(latitude) || isNaN(longitude)) {
                    return;
                }

                //setup new set of attributes

                var geometry = webMercatorUtils
                    .geographicToWebMercator(new Point(longitude, latitude));
                var feature = {
                    "geometry": geometry.toJson(),
                    "attributes": attributes
                };


                JSON.stringify(feature);
               // console.log("Stringified feature " + JSON.stringify(feature));
                this.featureCollection.featureSet.features.push(feature);

            }));

            var orangeRed = new Color([238, 69, 0, 0.5]); // hex is #ff4500
            var marker = new SimpleMarkerSymbol("solid", 10, null, orangeRed);
            var renderer = new SimpleRenderer(marker);

            //var json = { title: "Attributes", content: "Lat: ${Lat}<br>Lon: ${Lon}" }
            //var infoTemplate = new InfoTemplate(json);

            this.featureLayer = new FeatureLayer(this.featureCollection, {
                //infoTemplate: infoTemplate,
                //make it get the file name here
                id: "temporaryCSVFile",
                editable: true,
                outFields: ["*"]
            });
            this.featureLayer.setRenderer(renderer);

            // featureLayer.on("click")
            on(this.featureLayer, "click", function(e) {
                console.log("FL clicked");
                console.log(e.graphic);
                console.log(e.graphic.attributes);
                console.log("X: " + e.graphic.geometry.x + ", Y: " + e.graphic.geometry.y);
                // var node = e.graphic.getNode();
                // console.log(node); 
            });

            this.inMap.addLayers([this.featureLayer]);
            this.onZoomToData(this.featureLayer);

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
            
            
            
            
            
            var tempArray = [];

            for (i=1;i<this.mappedArrayFields.length;i++){
                var entry = this.mappedArrayFields[i][1];
                
                tempArray.push(entry)
            }
          /*  arrayUtils.forEach(this.mappedArrayFields, function(selectedField) {
                //console.log("selectedFieldName " + selectedField[1]);
                tempArray.push(selectedField[1]);
            });*/

           var count = 0;
          // arrayUtils.forEach(this.mappedArrayFields, lang.hitch(this, function(field) {
            
            //var count1 = 0;

             arrayUtils.forEach(tempArray, function(temp) {
                //console.log("tempArray " + temp);
                //tempArray.push(selectedField[1]);
            });

           

            console.log("tempArray " + tempArray.length);
            
            arrayUtils.forEach(tempArray, lang.hitch(this,function(csvFieldName) {
               
               // console.log ("count " + this.correctFieldNames[count].value);

                var value = this.csvStore.getValue(this.storeItems[0], csvFieldName);
                var parsedValue = Number(value);
                
          //      console.log("CSV Field Name " + field + " " );
                
                var correctFieldName = this.mappedArrayFields[count][1];

                console.log("    " + this.mappedArrayFields[count][1]);

                if (isNaN(parsedValue)) { //check first value and see if it is a number
                    this.featureCollection.layerDefinition.fields.push({
                        "name": correctFieldName,
                        "alias": correctFieldName,
                        "type": "esriFieldTypeString",
                        "editable": true,
                        "domain": null
                    });
                     count+=1;
                } else {
                    this.featureCollection.layerDefinition.fields.push({
                        "name": correctFieldName,
                        "alias": correctFieldName,
                        "type": "esriFieldTypeDouble",
                        "editable": true,
                        "domain": null
                        
                    });
                     count+=1;
                }
           
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
            arrayUtils.forEach(separators, function (separator) {
                var length = firstLine.split(separator).length;
                if (length > maxSeparatorLength) {
                    maxSeparatorLength = length;
                    maxSeparatorValue = separator;
                }
            });
            this.separatorCharacter = maxSeparatorValue;
        },

        onGetCsvStore: function () {
            console.log("onGetCsvStore");
            // Create the store and update the class property
            this.csvStore = new CsvStore({
                data: this.fileData,
                separator: this.separatorCharacter
            });

            // Fetch the items and update the items property
            this.csvStore.fetch({
                onComplete: lang.hitch(this, function (items) {
                    this.storeItems = items;

                    // Get the fields and add to the widget
                    this.onFetchFieldsAndUpdateForm();

                }),
                onError: function (error) {
                    console.error("Error fetching items from CSV store: ", error);
                }
            });
        },

        onFetchFieldsAndUpdateForm: function () {
            console.log("onFetchFieldsAndUpdateForm");
            // Update the class property
            this.csvFieldNames = this.csvStore.getAttributes(this.storeItems[0]);
            console.log("   s: " + this.csvFieldNames);

            // Add the string of options to the form's select controls
            query('select[id^="select"]').forEach(lang.hitch(this, function(node, index, arr) {
                console.log("+++++++ " + node.name + " " + node.value);
                //arrayUtils.forEach(this.csvFieldNames, lang.hitch(this, function(csvFieldName, i) {
                    arrayUtils.forEach(this.csvFieldNames, lang.hitch(this, function(csvFieldName, i) {
                    // console.log(node.name + ": " + csvFieldName);

                    //use domconstruct here to create html elements -- lookup how this works -- look for sample code. Use to create html node and insert into widget.html element
                    //declarative code vs constructed via dom-construct
                    //get field names from REST endpoint
                    //need way to determine type before the field is created.

                    domConstruct.create("option", {
                        value: i,
                        innerHTML: csvFieldName,
                        selected: false
                    }, node);
                }));

                // Select the first option that matches one of the configuration field names
                var values = this.findValueByKeyValue(this.inArrayFields, "name", node.name.replace('select', 'array'));
                if (values) {

                    arrayUtils.forEach(node.options, function(optionItem) {
                        if (values.includes(optionItem.text)) {
                            // TODO: Use dojo not jQuery
                            $("#" + node.name).val(optionItem.value);
                            return false;
                        }
                    });
                }

            }));
        },

        findValueByKeyValue: function(arraytosearch, key, valuetosearch) {
            for (var i = 0; i < arraytosearch.length; i++) {
                if (arraytosearch[i][key] == valuetosearch) {
                    return arraytosearch[i].value;
                }
            }
            console.log("Unable to find key-value: " + key + "-" + valuetosearch)
            return null;
        },

        onZoomToData: function (featureLayer) {
            console.log("onZoomToData");
            // Zoom to the collective extent of the data
            var multipoint = new Multipoint(this.inMap.spatialReference);
            arrayUtils.forEach(featureLayer.graphics, function (graphic) {
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
        }

    });
});