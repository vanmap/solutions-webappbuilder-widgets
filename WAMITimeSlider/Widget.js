define([
    'dojo/_base/declare', 'dijit/_WidgetsInTemplateMixin', 'dojo/_base/lang', 'dojo/dom', 'dojo/dom-style', 'dojo/dom-construct', 'dojo/dom-attr', 'dojo/dom-class', 'dojo/_base/array',
    'dojo/date/locale','dojo/data/ObjectStore', 'dojo/store/Memory', 'dijit/form/Select', 'dijit/form/HorizontalSlider', 'dijit/form/NumberSpinner',
    'jimu/BaseWidget', 
    'esri/layers/ArcGISImageServiceLayer','esri/TimeExtent','esri/dijit/TimeSlider'
],
       function (
        declare, _WidgetsInTemplateMixin, lang, dom,domStyle,domConstruct,domAttr,domClass,array,
        locale,ObjectStore,Memory,Select,HorizontalSlider, NumberSpinner,
        BaseWidget,
        ArcGISImageServiceLayer,TimeExtent,TimeSlider
        
    ) {
        var clazz = declare([BaseWidget, _WidgetsInTemplateMixin], {
            name: 'WAMITimeSlider',
            baseClass: 'jimu-widget-wamitimeslider',
            timeSlider: null,
            timeSliderDiv: null,
            loaded: false,
            wamiLayer:null,
            imageLayers : [],
            framerate : null,
            playback:null,
            imageQuality: null,
            //delete
            _getMapId: function () {alert(this.map.id);},
            
            
            //Required Functions for Widget Lifecyle
                postCreate: function() {
                    this.inherited(arguments);
                    console.log('postCreate');
                },
            startup: function() {
                this.inherited(arguments);
                
                this.imageLayers = this.getImageLayers();
                this.initImageSelect();
                this.framerate = this.config.WAMITimeSlider.framerate;
                this.playback = this.config.WAMITimeSlider.playback;
                this.imageQuality = this.config.WAMITimeSlider.quality;

                this.timeSlider = new TimeSlider({style: 'width: 100%;'}, dom.byId('wamiTimeSlider'));
                this.qualitySlider.on('change', lang.hitch(this, this._updateQuality));
                this.framerateSpinner.on('change', lang.hitch(this, this._updatreframerate));
                this.map.on('time-extent-change',lang.hitch(this, this.timeExtentChangeHandler));
                console.log('startup');
            },
            
            onOpen: function(){
                
                console.log('onOpen');
            },
            
            onClose: function(){
                
                if (this.timeSlider) {
                    domStyle.set(this.timeSlider.domNode, 'display', 'none');            
                    console.log('onClose');
                }
            },
            
            onMinimize: function(){
                
                console.log('onMinimize');
            },
            onMaximize: function(){
                
                console.log('onMaximize');
            },
            
            onSignIn: function(credential){
                
                /* jshint unused:false*/
                console.log('onSignIn');
            },
            
            onSignOut: function(){
                
                console.log('onSignOut');
            },
                        
            //End of Widget Lifecyle Functions
            
            
            //Create a list of Image Layers that can be annimated by the video play controls            
            getImageLayers: function() {
            
            //TODO: Filter list to only time enabled image layers with "fast refresh"
            var ids = this.map.layerIds;
            var len = ids.length;
                for (var i = 0; i < len; i++) {
                    var layer = this.map.getLayer(ids[i]);
                    //if (layer.setMosaicRule)
                    if (layer.declaredClass === 'esri.layers.ArcGISImageServiceLayer'){
                        this.imageLayers.push({
                            label : layer.arcgisProps.title,
                            id : layer.id
                    });
                    }
                    
                }
            return this.imageLayers;
            },
            
            //Initialize the WAMI Select Widget with the Image Service Layers in the web map            
            initImageSelect:function(){
                var _self = this;
                var store = new Memory({
                    data : this.imageLayers
                });
                var os = new ObjectStore({
                    objectStore : store
                });
                
                //TODO: Remove the need to automatically select a layer. Need to add defensive/initialization logic to all elements.
                this.imageSelect.setStore(os, this.imageLayers[0]);
                this.imageSelect.on('change',function(newValue){ _self.selectwamiImageLayer();});
            },
            
/*            //TODO:Replace with standard HTML in the Widget.html
            initDiv: function() {
                this.timeSliderDiv = domConstruct.create('div');
                domAttr.set(this.timeSliderDiv, 'id', 'WAMITimeSliderDiv');
                domClass.add(this.timeSliderDiv, 'esriTimeSlider');
                domConstruct.place(this.timeSliderDiv, this.domNode);
                this.timeSliderDiv.innerHTML = 'Loading......';
            },
            */
            wamiSlider: function (){
                this.timeExtent = this.wamilayer.timeInfo.timeExtent;
                //setup the slider
                //this.wamiTimeSlider.innerHTML = '';

                this.map.setTimeSlider(this.timeSlider);
                
                //Manual Time Extent
/*                this.timeExtent = new TimeExtent();
                this.timeExtent.startTime = new Date(1305141105968);
                his.timeExtent.endTime = new Date(1305141281468);
                var configjson = this.config.WAMITimeSlider;*/
                
                
                console.log('wamislider tic value ' + ((1 / this.framerate) * 1000));
                console.log('Playback in Tics' + (this.playback * ((1 / this.framerate) * 1000)));
                
                //Time Slider Interval
                this.timeSlider.setThumbCount(1);
                //Sets the number of steps on the slider based on frames per second
                this.timeSlider.createTimeStopsByTimeInterval(this.timeExtent, (1 / this.framerate) * 1000, 'esriTimeUnitsMilliseconds');
                
                //Set the moving rate, based on the frame rate * 1000 MS will make it play all the required frames in 1 second
                
                this.timeSlider.setThumbMovingRate (this.playback * ((1 / this.framerate) * 1000));
                this.timeSlider.setThumbIndexes([0,1]);
                
                
                this.timeSlider.startup();
            },
/*            manualSlider: function(){
                this.timeExtent = this.wamilayer.timeInfo.timeExtent;
                console.log('start time in ms ' + this.timeExtent.startTime.getTime());
                var manualSlider = new HorizontalSlider({
                    
                    name: 'manualSlider',
                    value: this.timeExtent.startTime.getTime(),
                    minimum: this.timeExtent.startTime.getTime(),
                    maximum: this.timeExtent.endTime.getTime(),
                    discreteValues: this.timeExtent.endTime.getTime() - this.timeExtent.startTime.getTime(),
                    intermediateChanges: false,
                    style: 'width:300px;',
                    onChange: function(value){
                        dom.byId('manualValue').value = Date(value);
                    }
                }, 'manualSlider').startup();
            },*/

            
            selectwamiImageLayer:function(){
                console.log (this.imageSelect.get('value'));
                for(var i = 0; i < this.imageLayers.length; i+= 1) {
                    //Turn on the Selected Layer and apply the currently defined properties. Zooms the map to the extent of the layer
                    //TODO: Make the zoom a config option or possible widget option
                    if (this.imageLayers[i].id == this.imageSelect.get('value')){
                        console.log(i);
                        this.wamilayer = this.map.getLayer(this.imageSelect.get('value'));
                        this.wamilayer.setVisibility(true);
                        this.wamilayer.setImageFormat(this.config.WAMITimeSlider.format);
                        this.wamilayer.setCompressionQuality(this.imageQuality);
                        this.map.setExtent(this.wamilayer.fullExtent);
                    }
                    else{
                       var layer = this.map.getLayer(this.imageLayers[i].id);
                        layer.setVisibility(false);
                    }
                        
                }
                var lt = this.wamilayer;            
                console.log ('format '+lt.format+
                             'format '+lt.url+
                             'layer'
                            );
                
                // Reset Slider to use the time extent from the WAMI Layer
                this.wamiSlider();
                //this.manualSlider();
                
                //Disable Time Update on other layers
            },
            
            timeExtentChangeHandler:function(e){
                if (this.map.timeExtent){
                    var d = locale.format(this.map.timeExtent.endTime,{datePattern:'MMM d, yyyy h:m:s.SSS a'});
                    //console.log(d);
                    dom.byId('manualValue').value = d;
                }
                else {
                    console.log('No Time Extent Update');
                }

            },
            
            _updateQuality: function() {
                this.imageQuality = this.qualitySlider.value;
                if (this.wamilayer){
                    this.wamilayer.setCompressionQuality(this.imageQuality);
                }
                console.log('Slider Change Quality ' + this.imageQuality);
                //TODO: Figure out how to show initial value
                this.qualityValue.innerHTML = this.qualitySlider.value;
            },
            _updatreframerate:function(){
                if(this.framerateSpinner.value){
                    this.framerate = this.framerateSpinner.value;
                    console.log('Framerate Change ' + this.framerate);
                    //This seems expensive to do on every framerate change
                    //TODO: Change this implementation
                    this.wamiSlider();
                }
            }

            
        });
        
        clazz.hasStyle = false;
        clazz.hasUIFile = false;
        clazz.hasLocale = false;
        clazz.hasConfig = false;
        return clazz;
        });