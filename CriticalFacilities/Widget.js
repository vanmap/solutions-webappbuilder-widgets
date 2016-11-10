define(['dojo/_base/declare',
  'jimu/BaseWidget',
  'dojo/_base/lang',
  'dojo/on',
  'dojo/dom',
  'dojo/_base/array',
  "dojox/data/CsvStore",
  "dojo/query",
  "dojo/html",
  "dojo/dom-construct",
  "dijit/registry",
  "esri/geometry/webMercatorUtils",
  "esri/geometry/Point",
  "esri/Color",
  "esri/config",
  "esri/symbols/SimpleMarkerSymbol",
  "esri/renderers/SimpleRenderer",
  "esri/layers/FeatureLayer",
  "esri/request",
  "./helyxcsvstore",
  'jimu/loaderplugins/jquery-loader!https://code.jquery.com/jquery-git1.min.js'],


  function (declare, BaseWidget, lang, on, dom, arrayUtils, CsvStore, query, html, domConstruct, registry, webMercatorUtils, Point, Color, esriConfig, SimpleMarkerSymbol, SimpleRenderer, FeatureLayer, esriRequest, hCsvStore, $) {
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
      arrayFieldsFromFeatureService: null,
      latFieldFromConfig: null,
      longFieldFromConfig: null,
      featureservice: null,

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
        
        
        //array of fields
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

        //array of fields to map to (need to create this from the feature service)

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

        this.featureservice = this.config.selectedFeatureService;
        latFieldFromConfig = this.config.latitudeField;
        longFieldFromConfig = this.config.longitudeField;

        console.log("config Feature Service " + this.featureservice + " fields " + latFieldFromConfig + " " + longFieldFromConfig );

        arrayFieldsFromFeatureService = [];

         var requestHandle = esriRequest({
            "url": this.featureservice,
            "content": {
              "f": "json"
            },
            "callbackParamName": "callback"
          });

          requestHandle.then(
              function(response) {
                  
                  console.log("Success: ", response.fields);
              
              var fieldsArray = response.fields;

              arrayUtils.forEach(fieldsArray, function(i, field) {
               // console.log("fields " + i.name);
              console.log("name " + "array"+i.name + " type " + i.type);


              if(i.type != "esriFieldTypeGeometry" && i.type != "esriFieldTypeOID"){  
                  arrayFieldsFromFeatureService.push({"name": "array"+i.name, "value": i.name});
                }

              });
              console.log("length " + arrayFieldsFromFeatureService.length);

                arrayUtils.forEach(arrayFieldsFromFeatureService, function(i, value){
                var fieldName = i.value;

                console.log("field Name " + fieldName);
       // <!-- <label data-dojo-attach-point="labelFacility" for="selectFacility">Facility</label>
         //   <select id="selectFacility" name="selectFacility" data-dojo-attach-point="fieldFacility"></select>-->
        
                var node = domConstruct.toDom('<label data-dojo-attach-point="label'+fieldName + '" for="select'+fieldName+'">' + fieldName + '</label>');
                var selectNode = domConstruct.toDom('<select id="select'+fieldName + '" name="select' + fieldName + '" data-dojo-attach-point="field' + fieldName + '"></select>');

             //   console.log("node ++++++++++ " + node);
          
                document.getElementById('fieldsetForm').appendChild(node);
                document.getElementById('fieldsetForm').appendChild(selectNode);
              //console.log ("arrayPopulation " + i.name + " " + i.value);
          });
          //first need the correct number of html fields with labels setup
          //set the html elements
          //example dojo.query('fieldset#fieldsetForm')[0].children[1].innerText = "Facility";

            },    function(error) {
                  console.log("Error: ", error.message);
      });
       
  
      },

      startup: function () {
        console.log('startup');
        this.inherited(arguments);
        // this.mapIdNode.innerHTML = 'map id:' + this.map.id;
        // this.mapSrNode.innerHTML = 'map sr:' + this.map.spatialReference.wkid;
        thisMap = this.map;
        // get feature service and map fields
       


        
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
           
           // console.log("latField " + latfieldFromConfig + " " + " longField " + longFieldFromConfig);

            myCsvStore.latField = latFieldFromConfig;
            myCsvStore.longField = longFieldFromConfig;
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


     /*   var map0 = dojo.query('select#selectFacility')[0][dojo.query('select#selectFacility').val()].firstChild.data;
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
        var lab9 = "Y"; */

        //var arrayMappedFields = [[map0,lab0], [map1,lab1], [map2,lab2], [map3,lab3], [map4,lab4], [map5,lab5], [map6,lab6], [map7,lab7], [map8,lab8], [map9,lab9]];

       var arrayMappedFields = [[]];

       console.log("arrayFieldsFromFeatureService " + arrayFieldsFromFeatureService.length);
      
       arrayUtils.forEach(arrayFieldsFromFeatureService, function(setField){
          
          
          if(setField!=null){
          var tempText = setField.value;
          console.log("tempText " + tempText);
          var queryResult = dojo.query('select#select' + tempText)[0][dojo.query('select#select' + tempText).val()].firstChild.data;
          }
         
          
          arrayMappedFields.push([queryResult, tempText]);

       });


        arraySelectedFields = [];
 
      //  query('select[id^="select"]').forEach(function (node, index, arr) {
        //    var nodeName = node.name;
          //  console.log("node Name +++++ " + nodeName);
            //var selectedOption = $("#" + node.name + " :selected").text();
            
          // console.log("node Name " + node.name + ": " + selectedOption );
            // Populate selected fields array and update class property
         //   arraySelectedFields.push({ name: nodeName, value: selectedOption });
           // myCsvStore.arraySelectedFields = arraySelectedFields;#
        
           //console.log("arrayMappedFields length " + arrayMappedFields.length);
            myCsvStore.correctFieldNames = arrayFieldsFromFeatureService;
            myCsvStore.mappedArrayFields = arrayMappedFields;
        //});
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
        var flayer = new esri.layers.FeatureLayer(this.featureservice,  {
          mode: esri.layers.FeatureLayer.MODE_ONDEMAND,
          
          outFields: ['*']
        });

       // console.log("featureService " + flayer.graphics)

        //features to add
         var features = featureLayer.graphics;
         var theExtent = null;

        // console.log("features length " + features.length);

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
        var flayer = new esri.layers.FeatureLayer(this.featureservice,  {
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


  });