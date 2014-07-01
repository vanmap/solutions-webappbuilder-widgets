define([
    'dojo/_base/declare', 'dijit/_WidgetsInTemplateMixin', 'dojo/_base/lang', 'dojo/dom', 'dojo/dom-style', 'dojo/dom-construct', 'dojo/dom-attr', 'dojo/dom-class', 'dojo/_base/array', 'dojo/parser', 'dojo/fx/Toggler',
    'dojo/date/locale', 'dijit/registry', 'dojo/data/ObjectStore', 'dojo/store/Memory', 'dijit/form/Select', 'dojox/timing/_base', 'dijit/form/HorizontalSlider', 'dijit/form/NumberSpinner',
    'jimu/BaseWidget', 
    'esri/layers/ArcGISImageServiceLayer','esri/TimeExtent','esri/dijit/TimeSlider'
],
       function (
        declare, _WidgetsInTemplateMixin,lang, dom,domStyle,domConstruct,domAttr,domClass,array,parser,Toggler,
        locale,registry,ObjectStore,Memory,Select, timingBase, HorizontalSlider, NumberSpinner,
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
            movingrate:null,
            imageQuality: null,
            _timer : null,
            indexTime: null,
            direction: null,
            playbackToggle: null,
            
//Required Functions for Widget Lifecyle
                postCreate: function() {
                    this.inherited(arguments);
                    console.log('postCreate');
                },
            startup: function() {
                this.inherited(arguments);
                
                this.imageLayers = this._getImageLayers();
                this._initImageSelect();
                this.framerate = this.config.WAMITimeSlider.framerate;
                this.playback = this.config.WAMITimeSlider.playback;
                this.imageQuality = this.config.WAMITimeSlider.quality;
                this.movingrate = (this.playback * (1 / this.framerate) * 1000);

                
                //UX Elements for the player
                this.qualitySlider.on('change', lang.hitch(this, this._updateQuality));
                this.framerateSpinner.on('change', lang.hitch(this, this._updatreFramerate));
                this.map.on('time-extent-change',lang.hitch(this, this.timeExtentChanged));
                registry.byId('playbackSlider').on('change', lang.hitch(this, this._sliderTimeChange));
                registry.byId('playfwd').on('click',lang.hitch(this, this._playfwdControl));
                registry.byId('playrev').on('click',lang.hitch(this, this._playrevControl));
                registry.byId('pause').on('click',lang.hitch(this, this._pauseControl));
                
                this.playbackToggle = new Toggler({node: 'playbackDiv', showDuration:500,hideDuration:0});
                this.playbackToggle.hide();
                //Create the timer and set it's event, use the config file setting for initial values
                this._timer = new timingBase.Timer();
                this._timer.setInterval(this.movingrate);
                this._timer.onTick = lang.hitch(this, '_setTime', 1);
                
                //this.timeSlider = new TimeSlider({style: 'width: 100%;'}, dom.byId('wamiTimeSlider'));
                //this._createSlider();
                
                
                console.log('startup');
            },
            
            onOpen: function(){
                
                console.log('onOpen');
            },
            
            onClose: function(){
                
                if (this.timeSlider) {
                    domStyle.set(this.playbackDiv.domNode, 'display', 'none');            
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
            
            imageLayerSelected:function(){
                //console.log (this.imageSelect.get('value'));
                //Enable the Video Slider Div
                
                this.playbackToggle.show(100);
                //Set the Video Layers Properties
                for(var i = 0; i < this.imageLayers.length; i+= 1) {
                    //Turn on the Selected Layer and apply the currently defined properties. Zooms the map to the extent of the layer. Turns off other Image Layers.
                    //TODO: Make the zoom a config option or possible widget option
                    if (this.imageLayers[i].id == this.imageSelect.get('value')){
                        //console.log(i);
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
                // Reset Slider to use the time extent from the WAMI Layer
                //this.wamiSlider(); //Built in Time Slider
                this._setupSlider();
            },
            
            timeExtentChanged:function(e){
                if (this.map.timeExtent){
                    var d = locale.format(this.map.timeExtent.endTime,{selector:'time', timePattern:'H:m:ss.SSS'});
                    registry.byId('playbackSlider').attr('value',this.map.timeExtent.endTime.getTime()); 
                    dom.byId('playbackValue').innerHTML = d;
                    
                }
                else {
                    console.log('No Time Extent Update');
                }

            },
            _playrevControl:function(val){
                console.log('Reverse');
                if(this.direction != 'rev'){this._timer.start();this.direction='rev';}
                
            },
            _playfwdControl:function(val){
                console.log('Forward');
                if(this.direction != 'fwd'){this._timer.start();this.direction='fwd';}
                
            },
            _pauseControl:function(val){
                console.log('Pause');
                this._timer.stop();
                this.direction = null;
                
            },
            _setTime:function(){
                if (this.direction == 'fwd'){this.indexTime += this.movingrate;}
                else if (this.direction == 'rev'){this.indexTime -= this.movingrate;}
                else {console.log('paused');
                      return;}
                
                console.log('Image Date using Index ' + this.indexTime);
                //TODO: Need to protect against empty time extent
                if (this.wamilayer){
                    if (this.indexTime > this.wamilayer.timeInfo.timeExtent.startTime ){
                        var vidTimeExtent = new TimeExtent();
                        vidTimeExtent.startTime = this.wamilayer.timeInfo.timeExtent.startTime;
                        vidTimeExtent.endTime = new Date(this.indexTime);
                        this.map.setTimeExtent(vidTimeExtent);                    
                    }
                    else {console.log('paused');}
                }
                else{console.log('No Image Selected Fix this bug!');}
      
            },
            _sliderTimeChange:function(){
                var sliderTime = registry.byId('playbackSlider').value;
                this.playbackValue = this.indexTime;
                console.log('Playback Slider changed to : ' + registry.byId('playbackSlider').value);
                console.log('Index Time Before Update' + this.indexTime);
                this.indexTime = sliderTime;
                console.log('Index Time After Update' + Math.floor(this.indexTime));
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
            
            _updatreFramerate:function(){
                if(this.framerateSpinner.value){
                    this.framerate = this.framerateSpinner.value;
                    console.log('Framerate Change ' + this.framerate);
                    //This seems expensive to do on every framerate change
                    //TODO: Change this implementation
                    //this.wamiSlider(); //Built In Time Slider
                    this.movingrate = (this.playback * (1 / this.framerate) * 1000);
                    this._timer.setInterval(this.movingrate);
                    //Changing to set the tick interval
                    
                }
            },
            
//UX Setup Functions          
            //Setup the Slider based on the time extent of the selected layer
            _setupSlider: function(){
                
                this.timeExtent = this.wamilayer.timeInfo.timeExtent;
                this.map.setTimeExtent(this.timeExtent);
                var slider = registry.byId('playbackSlider');
                
                //Set the time index to the start time 
                this.indexTime = this.timeExtent.startTime.getTime();
                //Set up the slider extent to equal the video layer extent
                slider.set({
                    value:this.timeExtent.startTime.getTime(),
                    minimum:this.timeExtent.startTime.getTime(),
                    maximum:this.timeExtent.endTime.getTime(),
                    discreteValues:(this.timeExtent.endTime - this.timeExtent.startTime)
                });
              
            },           
            //Create a list of Image Layers that can be annimated by the video play controls            
            _getImageLayers: function() {
            //TODO: Filter list to only time enabled image layers
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
            _initImageSelect:function(){
                var _self = this;
                var store = new Memory({
                    data : this.imageLayers
                });
                var os = new ObjectStore({
                    objectStore : store
                });
                this.imageSelect.setStore(os/*,this.imageLayers[0]*/);
                this.imageSelect.on('change',function(newValue){ _self.imageLayerSelected();});
            }
/*,
//Built In Time Slider - Remove
            wamiSlider: function (){
                this.timeExtent = this.wamilayer.timeInfo.timeExtent;
                //setup the slider
                //this.wamiTimeSlider.innerHTML = '';

                this.map.setTimeSlider(this.timeSlider);                
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
            }
*/

            
        });
        
        clazz.hasStyle = false;
        clazz.hasUIFile = false;
        clazz.hasLocale = false;
        clazz.hasConfig = false;
        return clazz;
        });