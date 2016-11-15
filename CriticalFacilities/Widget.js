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

//"selectedFeatureService" : "https://opsserver1041.bristol.local:6443/arcgis/rest/services/critical_facilities/shelters_manatee/FeatureServer/0",
//"selectedFeatureService" : "https://opsserver1041.bristol.local:6443/arcgis/rest/services/critical_facilities/bugsites/FeatureServer/0",

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
        /*arrayFields = [
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
        ]; */

        //array of fields to map to (need to create this from the feature service)

      /*  correctArrayFields = [
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
        ]; */

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

              var numberOfFields = 0;
                arrayUtils.forEach(arrayFieldsFromFeatureService, function(i, value){
                  var fieldName = i.value;

                  console.log("field Name " + fieldName);
         
                  var node = domConstruct.toDom('<label id="label'+fieldName+'" data-dojo-attach-point="label'+fieldName + '" for="select'+fieldName+'">' + fieldName + '</label>');
                  var selectNode = domConstruct.toDom('<select id="select'+fieldName + '" name="select' + fieldName + '" data-dojo-attach-point="field' + fieldName + '"></select>');

      
                  document.getElementById('fieldsetForm').appendChild(node);
                  document.getElementById('fieldsetForm').appendChild(selectNode);

                  //set element styling
                  document.getElementById('label'+fieldName).style.fontSize="10pt";
                  document.getElementById('label'+fieldName).style.fontFamily="Avenir, LT";
                  document.getElementById('label'+fieldName).style.lineHeight = "13px";
                  document.getElementById('label'+fieldName).style.margin = "3px";



                  numberOfFields++;
            });

                  console.log("number of fields " + numberOfFields);
                  //do dynamic widget styling here
                  //things to do:
                  // font size: document.getElementById('labellatitude').style.fontSize="10pt";
                  // font : document.getElementById('labellatitude').style.fontFamily("Avenir, LT");
                  // margin around select boxes: document.getElementById('selectlatitude').style.margin="0px";
                  // align labels and elements: document.getElementById('selectlatitude').style.height; document.getElementById('labellatitude').style.lineHeight = "20px" (selectbox height);
                  // set the widget frame to the correct size: document.getElementById('dijit__WidgetBase_4').style.width = "360px";
                  // set the whole widget to the correct size: document.getElementById('_5_panel').style.width="300px";


                  var height = (numberOfFields * 20) + 200; 
                  var widgetHeight = height + 80;
                  var buttonHeight = (numberOfFields * 20) + 150;

                  document.getElementById('fieldsetForm').style.height = height + 'px';
                  document.getElementById('fieldsetForm').style.width = '300px';
                  document.getElementById('dijit__WidgetBase_4').style.width = "350px";
                  document.getElementById('_5_panel').style.width="350px";
                  document.getElementById('_5_panel').style.height=widgetHeight+'px';
                  document.getElementById('btnSubmitData').style.top = buttonHeight + 'px';
                  document.getElementById('btnAddToMap').style.top = buttonHeight + 'px';

                 
                  //disable submit to feature service button until points have been added.

                  document.getElementById('btnSubmitData').disabled = true;
                 

                  //set field form spacing

            },    function(error) {
                  console.log("Error: ", error.message);
      });
       
  
      },

      startup: function () {
        console.log('startup');
        this.inherited(arguments);
  
        thisMap = this.map;
     
       


        
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

      
        if (files && files.length === 1) {
          console.log("[ FILES ]");
          var file = files[0]; // that's right I'm only reading one file
          console.log("type = ", file.type);
          if (file.name.indexOf(".csv") !== -1) {
            console.log("handle as Csv (file)");
            
            myCsvStore = new hCsvStore({
                inFile: file,
                inArrayFields: arrayFieldsFromFeatureService,
                inMap: thisMap
                
            });
           

            myCsvStore.latField = latFieldFromConfig;
            myCsvStore.longField = longFieldFromConfig;
            myCsvStore.arraySelectedFields = this.arraySelectedFields;
            myCsvStore.onHandleCsv();
           
          }
        }

  

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
    
      },

      onMouseMove: function (evt) {
       // console.log('onMouseMove');
   
      },



 

      onAddClick: function() {
        console.log('onAddClick');

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

            myCsvStore.correctFieldNames = arrayFieldsFromFeatureService;
            myCsvStore.mappedArrayFields = arrayMappedFields;

        myCsvStore.onProcessForm();

      },

      // submit to feature service
      onSubmitClick: function(){
         console.log('onSubmitClick');

         var featureLayer = myCsvStore.featureLayer;                         

         console.log("featureLayer size " + featureLayer.id ); 

        var flayer = new esri.layers.FeatureLayer(this.featureservice,  {
          mode: esri.layers.FeatureLayer.MODE_ONDEMAND,
          
          outFields: ['*']
        });

     
         var features = featureLayer.graphics;
         var theExtent = null;

      

         for (var f = 0, fl = features.length; f < fl; f++) {
            var feature = features[f];
            var attribs = feature.attributes;
         
             feature.setInfoTemplate(flayer.infoTemplate);
                            flayer.add(feature);

                            //adds, updates, deletes, callback, errback
                            flayer.applyEdits([feature], null , null);
                       

                          
        }  

        console.log("finished " + flayer.graphics.length + " " + flayer.name);
       
      },

      onClearClick: function(){
             console.log('onClearClick');

        //get data from REST endpoint and compare the ID of each of the records against what is already there. Sort them into two arrays and invoke add/update 
        //via applyEdits below
        var flayer = new esri.layers.FeatureLayer(this.featureservice,  {
          mode: esri.layers.FeatureLayer.MODE_ONDEMAND,
          
          outFields: ['*']
        });

        var features = flayer.graphics;

        console.log("featureService " + flayer.graphics);


         var theExtent = null;
         var selectQuery = new Query();

        //  selectQuery.where = "'Facility' = '*'";
        selectQuery.where = "1=1";

        var selectFeatures = flayer.selectFeatures(selectQuery, flayer.SELECTION_NEW);

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

    });


  });