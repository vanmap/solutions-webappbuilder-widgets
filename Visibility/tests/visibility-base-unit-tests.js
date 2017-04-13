define([
  'intern!object',
  'intern/chai!assert',
  'dojo/dom-construct',
  'dojo/_base/lang',
  'dojo/_base/window', 
  'esri/map',
  'esri/geometry/Point',
  'esri/graphic',
  'esri/geometry/Extent',
  'esri/tasks/FeatureSet',  
  'jimu/dijit/DrawBox',  
  'Vis/VisibilityControl'
], function(
	registerSuite, 
    assert, 
	domConstruct, 
	lang, 	 
	win,
	Map, 
	esriPoint,
	esriGraphic,
	Extent, 
	FeatureSet,
	DrawBox,
	VisibilityControl
	){
	var vis, map;
  	registerSuite({
	    name: 'Visibility-Widget',
		//before the suite starts
		setup: function() {

			//load claro and esri css, create a map div in the body, and create the map object and print widget for our tests
			domConstruct.place('<link rel="stylesheet" type="text/css" href="//js.arcgis.com/3.19/esri/css/esri.css">', win.doc.getElementsByTagName("head")[0], 'last');
			domConstruct.place('<link rel="stylesheet" type="text/css" href="//js.arcgis.com/3.19/dijit/themes/claro/claro.css">', win.doc.getElementsByTagName("head")[0], 'last');
			domConstruct.place('<script src="http://js.arcgis.com/3.19/"></script>', win.doc.getElementsByTagName("head")[0], 'last');
			domConstruct.place('<div id="map" style="width:800px;height:600px;" class="claro"></div>', win.body(), 'only');
			domConstruct.place('<div id="visNode" style="width:300px;" class="claro"></div>', win.body(), 'last');	
			domConstruct.place('<div data-dojo-attach-point="drawBox" data-dojo-type="jimu/dijit/DrawBox"></div>', win.body(), 'last');	

			map = new Map("map", {
				basemap: "topo",
				center: [-122.45, 37.75],
				zoom: 13,
				sliderStyle: "small"
			});
		  
		  	//unittests
		  	vis = new VisibilityControl({
				viewshedService: {
					url: 'https://nationalsecurity.esri.com:6443/arcgis/rest/services/Tasks/Viewshed/GPServer/Viewshed'
				},
				map: map
			}, domConstruct.create("div")).placeAt("visNode");	
			vis.startup();	
		},

		//before each test executes
		beforeEach: function() {
			if (vis === undefined || vis === null) {
			  	vis = new VisibilityControl({
					viewshedService: {
						url: 'https://nationalsecurity.esri.com:6443/arcgis/rest/services/Tasks/Viewshed/GPServer/Viewshed'
					},
					map: map
				}, domConstruct.create("div")).placeAt("visNode");	
				vis.startup();					
			}
		},

		// after the suite is done (all tests)
		teardown: function() {
			if (map.loaded) {
				map.destroy();                    
			}            
		},
		
		'Test widget Loads': function(){
			assert.isNotNull(vis);
		},	

		'Test widget is instanceOf Visibility': function() {
			assert.instanceOf(vis, VisibilityControl);
		},
		
		'Test template loaded': function() {
			assert.isDefined(vis);
		},

		'Test execute viewshed': function() {
			var pt = new esriPoint(-13044299.165624933, 4036556.738114527, map.spatialReference);
			var g = new esriGraphic(pt);
			var featureSet = new FeatureSet();
			featureSet.features = [g];


			var params = {
				"Input_Observer": featureSet,
				"Near_Distance__RADIUS1_": 3000,
				"Maximum_Distance__RADIUS2_": 5000,
				"Left_Azimuth__AZIMUTH1_": 45,
				"Right_Azimuth__AZIMUTH2_": 35,
				"Observer_Offset__OFFSETA_": 2
			}; 

			vis.viewshed(params);
		}
  	})
});