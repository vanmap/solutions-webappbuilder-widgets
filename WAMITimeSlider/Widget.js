define([
    'dojo/_base/declare', 'dijit/_WidgetsInTemplateMixin', 'dojo/_base/lang', 'dojo/dom', 'dojo/dom-style', 'dojo/dom-construct', 'dojo/dom-attr', 'dojo/dom-class', 'dojo/_base/array',
    'dojo/data/ObjectStore', 'dojo/store/Memory', 'dijit/form/Select', 'dijit/form/HorizontalSlider', 'dijit/form/NumberSpinner',
    'jimu/BaseWidget', 
    'esri/layers/ArcGISImageServiceLayer','esri/TimeExtent','esri/dijit/TimeSlider'
],
       function (
        declare, _WidgetsInTemplateMixin, lang, dom,domStyle,domConstruct,domAttr,domClass,array,
        ObjectStore,Memory,Select,HorizontalSlider, NumberSpinner,
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
            templateString: "<div>This is a very simple widget. <input type='button' value='Get Map Id' data-dojo-attach-event='click:_getMapId'>.</div>",
            framerate : null,
            imageQuality:null,
            //delete
            _getMapId: function () {alert(this.map.id);},
            
            startup: function(){
                this.imageLayers = this.getImageLayers();
                this.initImageSelect();
                this.framerate = this.config.WAMITimeSlider.framerate;
                this.imageQuality = this.config.WAMITimeSlider.quality;
                
                //TODO: Change this to some other widget to set framerate
                this.qualitySlider.on('change', lang.hitch(this, this._updateQuality));
                this.framerateSpinner.on('change', lang.hitch(this, this._updatreframerate));
            },
            
            onOpen: function() {
                this.inherited(arguments);
                if (!this.timeSliderDiv) {
                    this.initDiv();
                }
                if (this.timeSlider) {
                    domStyle.set(this.timeSlider.domNode, 'display', '');
                }
                
                this.timeSliderDiv.innerHTML = '';
                this.timeSlider = new TimeSlider({style: 'width: 100%;'}, this.timeSliderDiv);
                this.map.setTimeSlider(this.timeSlider);
                

                
            },
            
            onClose: function() {
                if (this.timeSlider) {
                    domStyle.set(this.timeSlider.domNode, 'display', 'none');
                }
            },
            
            initImageSelect:function(){
                var _self = this;
                var store = new Memory({
                    data : this.imageLayers
                });
                var os = new ObjectStore({
                    objectStore : store
                });
                
                this.imageSelect.setStore(os, this.imageLayers[0]);
                this.imageSelect.on('change',function(newValue){
                    _self.updatewamiImageLayer();
                });
            },
            
            //TODO:Replace with standard HTML in the Widget.html
            initDiv: function() {
                this.timeSliderDiv = domConstruct.create('div');
                domAttr.set(this.timeSliderDiv, 'id', 'WAMITimeSliderDiv');
                domClass.add(this.timeSliderDiv, 'esriTimeSlider');
                domConstruct.place(this.timeSliderDiv, this.domNode);
                this.timeSliderDiv.innerHTML = 'Loading......';
            },
            
            wamiSlider: function (){
                this.timeExtent = this.wamilayer.timeInfo.timeExtent;
                //Manual Time Extent
/*                this.timeExtent = new TimeExtent();
                this.timeExtent.startTime = new Date(1305141105968);
                his.timeExtent.endTime = new Date(1305141281468);
                var configjson = this.config.WAMITimeSlider;*/
                
                
                console.log('wamislider Framerate ' + this.framerate);
                
                //Time Slider Interval
                this.timeSlider.setThumbCount(1);
                this.timeSlider.createTimeStopsByTimeInterval(this.timeExtent, (1 / this.framerate) * 1000, 'esriTimeUnitsMilliseconds');
                this.timeSlider.setThumbIndexes([0,1]);
                this.timeSlider.setThumbMovingRate(this.framerate * 1000);
                this.timeSlider.startup();
                
            
/*                var slider = new HorizontalSlider({
                    name: 'slider',
                    value: 1305141105968,
                    minimum: 1305141105968,
                    maximum: 1305141281468,
                    discreteValues: 1322765639474 - 1322763583474,
                    intermediateChanges: false,
                    style: 'width:300px;',
                    onChange: function(value){
                        dom.byId('sliderValue').value = Date(value);
                    }
                }, 'slider').startup();*/
            
        },
            getImageLayers: function() {
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
            
            updatewamiImageLayer:function(){
                console.log (this.imageSelect.get('value'));
                for(var i = 0; i < this.imageLayers.length; i+= 1) {
                    //Turn on the Selected Layer and apply the currently defined properties. Zooms the map to the extent of the layer
                    //TODO: Make the zoom a config option or possible widget option
                    if (this.imageLayers[i].id == this.imageSelect.get('value')){
                        console.log(i);
                        this.wamilayer = this.map.getLayer(this.imageSelect.get('value'));
                        this.wamilayer.format = 'jpg';
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
                //this.wamilayer = this.map.getLayer(this.imageSelect.get('value'));
                
                var lt = this.wamilayer;
                //this.wamilayer.format = 'jpg';
                //this.wamilayer.setVisibility(true);
                
                //this.wamilayer.setImageFormat(this.config.WAMITimeSlider.format);
                //this.wamilayer.setCompressionQuality(this.imageQuality);
                //this.wamilayer.refresh();
                
                console.log ('format '+lt.format+
                             'format '+lt.url+
                             'layer'
                            );
                
                // Reset Slider to use the time extent from the WAMI Layer
                this.wamiSlider();
                
                //Turn off other WAMI Layers
                
                //Disable Time Update on other layers?
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