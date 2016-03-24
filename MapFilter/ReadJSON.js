define([
  'dojo/Evented',
  'dojo/_base/declare',
  'dojo/Deferred',
  'dojo/_base/html',
  'dojo/has',
  'dojo/_base/lang',
  'jimu/utils',
  'jimu/dijit/Message'
],
function (Evented, declare, Deferred, html, has, lang, utils, Message) {
return declare([Evented], {
  declaredClass : 'readJson',
  config : null,
  jsonFile: null,

  constructor: function(/*Object*/args) {
    declare.safeMixin(this, args);
  },

  checkFileReader: function() {
    if (this.supportHTML5()) {
      console.log('HTML 5 loader');
      this._processFiles(this.jsonFile);
    }
    else if (!this.supportHTML5() && !has('safari') && this.isEnabledFlash()) {
      utils.file.loadFileAPI().then(lang.hitch(this, function() {
        console.log('loading FileAPI');
        //domClass.add(this.csvFileInput, 'fileInputNonHTML5, js-fileapi-wrapper');
      }));
    } else {
      console.log('no loader');
      //domClass.add(this.csvFileInput, 'fileInputHTML5');
      //domClass.remove(this.showFileDialogBtn, 'hide');
    }
  },

  _processFiles : function(files) {
    if (files.length > 0) {
      var file = files[0];
      if (file.name.indexOf('.json') !== -1) {
        if (file) {
          this.handleJson(file);
        } else {
          /*
          Message({
            message : this.nls.error.fileIssue
          });
          domClass.remove(this.showFileDialogBtn, 'jimu-state-disabled');
          this.clearCSVResults();
          */
        }
      } else {
        new Message({
          message : 'Not a json file'
        });
        context.errorPrompt('error');
      }
    }
  },

  handleJson : function(file) {
    //console.log('Reading CSV: ', file, ', ', file.name, ', ', file.type, ', ', file.size);
    if (this.supportHTML5()) {
      var reader = new FileReader();
      reader.onload = (function(context) {
        return function(e) {
          if(reader.result.indexOf("groups") > -1) {
            context.completePrompt(reader.result);
          } else {
            new Message({
              message : 'json file is Invalid'
            });
            context.errorPrompt('error');
          }

        };
      })(this);
      reader.readAsText(file);
    } else {
      window.FileAPI.readAsText(file, lang.hitch(this, function (evt) {
        if (evt.type === 'load') {
          //this._processCSVData(evt.result);
        }
      }));
    }
  },






  supportHTML5: function() {
    if (window.File && window.FileReader && window.FileList && window.Blob) {
      return true;
    } else {
      return false;
    }
  },
  supportFileAPI: function() {
    if (has('safari') && has('safari') < 6) {
      return false;
    }
    if (window.FileAPI && window.FileAPI.readAsDataURL) {
      return true;
    }
    return false;
  },
  isEnabledFlash: function(){
    var swf = null;
    if (document.all) {
      try{
        swf = new ActiveXObject('ShockwaveFlash.ShockwaveFlash');
      }catch(e) {
        swf = null;
      }
    } else {
      if (navigator.plugins && navigator.plugins.length > 0) {
        swf = navigator.plugins["Shockwave Flash"];
      }
    }
    return !!swf;
  },

  completePrompt: function(pSettings) {
    this.emit("complete", {'UserSettings':pSettings});
  },

  errorPrompt: function(pSettings) {
    this.emit("error", {'UserSettings':'error'});
  }

});
});