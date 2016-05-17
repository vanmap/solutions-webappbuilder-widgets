///////////////////////////////////////////////////////////////////////////
// Copyright © 2014 Esri. All Rights Reserved.
//
// Licensed under the Apache License Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//    http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.
///////////////////////////////////////////////////////////////////////////

define(['dojo/_base/declare',
    'dijit/_WidgetBase',
    'dijit/_TemplatedMixin',
    'dijit/_WidgetsInTemplateMixin',
    'dojo/_base/lang',
    'dojo/_base/array',
    "dojo/dom-class",
    "dojo/throttle",
    'dojo/on',
    'dojo/topic',
    //"dojo/promise/all",
    //'jimu/portalUtils',
    "dojo/query",
    "jimu/utils",
    'dojo/_base/config',
    "dojo/cookie",
    'dojo/text!./templates/ShareLink.html',
    'jimu/shareUtils',
    "dojo/string",
    "dijit/form/Select",
    "dijit/form/NumberTextBox",
    "dojo/dom-attr",
    "dojo/dom-style",
    "dijit/form/TextBox",
    "dijit/form/Textarea",
    "dijit/form/RadioButton",
    "dijit/form/Select",
    "dijit/form/CheckBox",
    "dijit/form/NumberTextBox",
    "dijit/form/SimpleTextarea",
    "dijit/form/ValidationTextBox"
  ],
  function(declare, _WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin, lang, array, dojoClass, throttle,
           on, topic, /*all, portalUtils,*/ dojoQuery, jimuUtils, dojoConfig, dojoCookie,
           template, shareUtils, dojoString, Select, NumberTextBox, domAttr, domStyle) {

    var so = declare([_WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin], {
      templateString: template,
      declaredClass: "jimu.dijit.ShareLink",
      showSocialMediaLinks: true,
      bitlyUrl: "http://api.bit.ly/v3/shorten?login=arcgisdev&apiKey=R_18b3867d45854ba98d9e0e7c20dbf6d3",
      bitlyUrlSSL: "https://api-ssl.bitly.com/v3/shorten?login=arcgisdev" +
      "&apiKey=R_18b3867d45854ba98d9e0e7c20dbf6d3",
      share: {
        shareEmailSubject: "",
        shareTwitterTxt: "",
        languages: ["ar", "cs", "da", "de", "en", "el", "es", "et", "fi", "fr", "he", "it", "ja", "ko", "lt",
          "lv", "nb", "nl", "pl", "pt-br", "pt-pt", "ro", "ru", "sv", "th", "tr", "zh-cn", "vi", "zh-hk", "zh-tw"],
        DEFAULT_MOBILE_LAYOUT: 600
      },
      portalUrl: "",
      appTitle: "",
      webmapTitle: window.appInfo.name,

      //https://developers.arcgis.com/web-appbuilder/guide/app-url-parameters-for-dev.htm
      postMixInProperties: function() {
        this.inherited(arguments);
        this.nls = window.jimuNls.shareLink;

        this.share = {
          shareEmailSubject: this.nls.shareEmailSubject + "${appTitle} ",
          shareTwitterTxt: this.nls.shareEmailSubject + "${appTitle}:\n"
        }
      },
      postCreate: function() {
        this.inherited(arguments);
        this._initUI();
        this._initMap();
      },
      startup: function(shareContainer, options) {
        if (!shareContainer || !options) {
          return;
        }
        this._shareContainer = shareContainer;
        this.portalUrl = options.portalUrl;
        this.appTitle = options.appTitle;
        shareUtils.setPortal(this.portalUrl);

        if (window.isXT) {
          this._initShow();
        } else {
          shareUtils._getBaseShareInfo().then(lang.hitch(this, function(result) {
            this.shareInfo = result;
            var oneItem = this.shareInfo.item;
            shareUtils.getItemById/*getItemByUserAndItemId*/(oneItem).then(
              (lang.hitch(this, function(result) {
                if (typeof result.sharing === "undefined" && result.access) {
                  result.sharing = {
                    access: result.access
                  };
                }
                oneItem.sharing = result.sharing;
                this.shareInfo.sharing = result.sharing;
                this.shareInfo.webMapId = this.shareInfo.item.id;
                //this.shareInfo.sharingInfo = lang.mixin(this.shareInfo, result.sharing);
                this._updateResUrls();
                if (false === this._ensureAccess()) {
                  dojoClass.toggle(this.socialNetworkLinks, "displaynone");
                }
                this._initShow();
              })));
          }));
        }
      },
      _initShow: function() {
        this.updateUrl(null);
        this._linkUrlTextBox.focus();
        this._initOptions();
        this._initOptionsEvent();
      },
      _initMap: function() {
        if (window.isBuilder) {
          this.own(topic.subscribe("app/mapLoaded", lang.hitch(this, this._onMapLoaded)));
          this.own(topic.subscribe("app/mapChanged", lang.hitch(this, this._onMapLoaded)));
        } else {
          this.own(topic.subscribe("mapLoaded", lang.hitch(this, this._onMapLoaded)));
          this.own(topic.subscribe("mapChanged", lang.hitch(this, this._onMapLoaded)));
        }
        if (window._widgetManager.map) {
          this.map = window._widgetManager.map;
        }
      },
      _onMapLoaded: function(map) {
        this.map = map;
      },

      _initUI: function() {
        if (!window.isXT) {
          dojoClass.toggle(this.backBtn, "displaynone");
        } else {
          this.own(on(this.backBtn, "click", lang.hitch(this, this._toggleLinkOptions)));
        }
        this.own(on(this.linkOptions, "click", lang.hitch(this, this._toggleLinkOptions)));
        //if (this.portal && (!this.portal.userCanShareWithPublic() || !this.portal.canShareViaSocialMedia()))
        //  d.add(this.FacebookShare, "hide"),
        //    d.add(this.TwitterShare, "hide");
        //this._linkUrlTextBox.attr("onclick", "this.select()");
        //this._linkUrlTextBox.attr("onmouseup", "return false;");
        domAttr.set(this._linkUrlTextBox, "onclick", "this.select()");
        domAttr.set(this._linkUrlTextBox, "onmouseup", "return false;");

        this.own(on(this.emailShare, "click", lang.hitch(this, this._toEmail)));
        this.own(on(this.googlePlusShare, "click", lang.hitch(this, this._toGooglePlus)));
        // if (this.portal && (!this.portal.userCanShareWithPublic() || !this.portal.canShareViaSocialMedia()))
        //   d.add(this.FacebookShare, "hide"),
        //     d.add(this.TwitterShare, "hide");

        //this._embedCodeTextArea.attr("onclick", "this.select()");
        //this._embedCodeTextArea.attr("onmouseup", "return false;");
        domAttr.set(this._embedCodeTextArea, "onclick", "this.select()");
        domAttr.set(this._embedCodeTextArea, "onmouseup", "return false;");

        this._sizeOptions = new Select({
          options: [{
            label: this.nls.smallSize,
            value: "small",
            selected: !0
          }, {
            label: this.nls.mediumSize,
            value: "medium",
            selected: !1
          }, {
            label: this.nls.largeSize,
            value: "large",
            selected: !1
          }, {
            label: this.nls.customSize,
            value: "custom",
            selected: !1
          }],
          "class": "sizeOptionsSelect"
        });
        this._sizeOptions.placeAt(this.SizeSelect);
        this.own(on(this._sizeOptions, "change", function(a) {
          switch (a) {
            case "small":
              this._widthTextBox.set("value", 300);
              this._heightTextBox.set("value", 200);
              dojoClass.add(this.CustomSizeContainer, "disable");
              this._updateEmbedCodeFrameSize();
              break;
            case "medium":
              this._widthTextBox.set("value", 800);
              this._heightTextBox.set("value", 600);
              dojoClass.add(this.CustomSizeContainer, "disable");
              this._updateEmbedCodeFrameSize();
              break;
            case "large":
              this._widthTextBox.set("value", 1080);
              this._heightTextBox.set("value", 720);
              dojoClass.add(this.CustomSizeContainer, "disable");
              this._updateEmbedCodeFrameSize();
              break;
            case "custom":
              dojoClass.remove(this.CustomSizeContainer, "disable");
          }
        }.bind(this)));
        //widthTextBox
        this._widthTextBox = new NumberTextBox({
          "class": "sizeTextBox",
          value: 300,
          constraints: {
            pattern: "#",
            places: 0
          }
        });
        this._widthTextBox.placeAt(this.CustomSizeContainer, 1);
        this.own(on(this._widthTextBox, "change", function(a) {
          if (200 > a) {
            this._widthTextBox.set("value", 200 > a ? 200 : a);
          } else {
            this._updateEmbedCodeFrameSize();
          }
        }.bind(this)));
        this._heightTextBox = new NumberTextBox({
          "class": "sizeTextBox",
          value: 200,
          constraints: {
            pattern: "#",
            places: 0
          }
        });
        this._heightTextBox.placeAt(this.CustomSizeContainer, 3);
        this.own(on(this._heightTextBox, "change", function(a) {
          if (200 > a) {
            this._heightTextBox.set("value", 200 > a ? 200 : a);
          } else {
            this._updateEmbedCodeFrameSize();
          }
        }.bind(this)));
        domAttr.set(this.mobileLayout, "value", this.share.DEFAULT_MOBILE_LAYOUT);
      },
      _setLinkUrl: function(shortenedUrl) {
        this._linkUrlTextBox.set("value", shortenedUrl);
        domAttr.set(this._linkUrlTextBox.domNode, "data-old", shortenedUrl);
      },
      _setEmbedCode: function(url) {
        var b = '\x3ciframe width\x3d"' + this._widthTextBox.value + '" height\x3d"' + this._heightTextBox.value +
          '" frameborder\x3d"0" scrolling\x3d"no" allowfullscreen src\x3d"';
        b = b + url + '"\x3e\x3c/iframe\x3e';
        this._embedCodeTextArea.set("value", b);
        domAttr.set(this._embedCodeTextArea.domNode, "data-old-shortened", url);
      },
      _updateEmbedCodeFrameSize: function(a) {
        a = this._embedCodeTextArea.get("value");
        a = a.replace(/width=\"[0-9]*\"/i, 'width\x3d"' + this._widthTextBox.value + '"');
        a = a.replace(/height=\"[0-9]*\"/i, 'height\x3d"' + this._heightTextBox.value + '"');
        this._embedCodeTextArea.set("value", a);
      },

      _ensureAccess: function() {
        var canShareFlag = true;
        if (this.shareInfo.userRole && this.shareInfo.userRole.isCustom() &&
          !this.shareInfo.userRole.canShareItemToOrg() && !this.shareInfo.userRole.canShareItemToGroup() &&
          (!this.shareInfo.userRole.canShareItemToPublic() || !shareUtils.portal.canSharePublic)) {
          canShareFlag = false;
        }
        if (this.shareInfo.sharing.access === "public") {
          // is public
          if (shareUtils.canShowSocialMediaLinks() && shareUtils.roleIsAllowed_ShareSocialMediaLinks("")) {
            canShareFlag = true;
          }
        } else if (this.shareInfo.sharing.access === "shared" || this.shareInfo.sharing.access === "org") {
          // is shared with groups or account
          if (shareUtils.canShowSocialMediaLinks(this.shareInfo.userRole) &&
            shareUtils.roleIsAllowed_ShareSocialMediaLinks("")) {
            canShareFlag = true;
          }
        } else {
          //hareUtils.portal.access === "private"
          canShareFlag = false;
        }
        return canShareFlag;
      },

      _initOptions: function() {
        var maxLvl = this.map.getMaxZoom(),
          minLvl = this.map.getMinZoom(),
          currentLvl = this.map.getLevel();
        //chooseCenterWithLevel
        this.chooseCenterWithLevel_levels.removeOption(this.chooseCenterWithLevel_levels.getOptions());
        var options = [];
        for (var i = minLvl; i < maxLvl; i++) {
          var opt = {label: i + "", value: i + ""};
          if (i === currentLvl) {
            opt.selected = true;
          } else {
            opt.selected = false;
          }
          options.push(opt);
        }
        this.chooseCenterWithLevel_levels.addOption(options);
        //chooseCenterWithScale
        options = [];
        if (this.map._params && this.map._params.lods) {
          var scals = array.filter(this.map._params.lods, lang.hitch(this, function(lod) {
            return (lod.level >= minLvl && lod.level <= maxLvl);
          }));

          array.forEach(scals, function(scale) {
            var opt = {label: scale.scale + "", value: scale.scale + ""};
            if (scale.level === currentLvl) {
              opt.selected = true;
            } else {
              opt.selected = false;
            }
            options.push(opt);
          });
        }
        this.chooseCenterWithScale_scales.addOption(options);

        options = [];
        array.forEach(this.share.languages, function(language) {
          var opt = {label: language, value: language};
          if (language === dojoConfig.locale) {
            opt.selected = true;
          } else {
            opt.selected = false;
          }
          options.push(opt);
        });
        this.setlanguage_languages.addOption(options);

        var token = "";
        try {
          token = JSON.parse(dojoCookie("esri_auth")).token;
        } catch (err) {
          console.error(err);
        }
        this.authtoken.set("value", token);

        //addMarker
        this.addMarker_spatialReference.removeOption(this.addMarker_spatialReference.getOptions());
        options = [];
        for (var i in this.map.spatialReference) {
          if (this.map.spatialReference.hasOwnProperty(i)) {
            options.push({label: this.map.spatialReference["wkid"], value: this.map.spatialReference["wkid"]});
          }
        }
        this.addMarker_spatialReference.addOption(options);
        this.addMarker_level.removeOption(this.addMarker_level.getOptions());
        var options = [];
        for (var i = minLvl; i < maxLvl; i++) {
          var opt = {label: i + "", value: i + ""};
          if (i === currentLvl) {
            opt.selected = true;
          } else {
            opt.selected = false;
          }
          options.push(opt);
        }
        this.addMarker_level.addOption(options);
      },
      _initOptionsEvent: function() {
        //outline radios
        var shareRadios = dojoQuery(".shareRadios");
        this.own(on(shareRadios, "change", lang.hitch(this, function(results) {
          this.optionSrc = results.srcElement.id;
          this.updateUrl();
        })));

        //outline checkBoxes
        // mobileLayout,setlanguage,auth
        var shareCheckBoxes = dojoQuery(".shareCheckBoxes");
        this.own(on(shareCheckBoxes, "change", lang.hitch(this, function() {
          this.updateUrl();
        })));

        //inner shareSelects
        this.own(on(this.chooseCenterWithLevel_levels, "change", lang.hitch(this, function(/*results*/) {
          this.updateUrl();
        })));
        this.own(on(this.chooseCenterWithScale_scales, "change", lang.hitch(this, function() {
          this.updateUrl();
        })));
        this.own(on(this.setlanguage_languages, "change", lang.hitch(this, function() {
          this.updateUrl();
        })));
        //inner input
        this.own(on(this.findLocation_input, "change", lang.hitch(this, this.updateUrl)));
        this.own(on(this.findLocation_input, "KeyUp", throttle(lang.hitch(this, this.updateUrl), 500)));

        this.own(on(this.queryFeature_layer, "change", lang.hitch(this, this._updateQueryFeature_Field)));
        this.own(on(this.queryFeature_field, "change", lang.hitch(this, this._updateQueryFeature_Value)));
        this.own(on(this.queryFeature_value, "change", lang.hitch(this, this.updateUrl)));

        //marker
        this.own(on(this.addMarker_marker, "click", lang.hitch(this, function() {
          this._onMarkersClick();
        })));
        this.own(on(this.addMarker_spatialReference, "change", lang.hitch(this, this.updateUrl)));
        this.own(on(this.addMarker_title, "KeyUp", lang.hitch(this, this.updateUrl)));
        this.own(on(this.addMarker_symbolURL, "KeyUp", lang.hitch(this, this.updateUrl)));
        this.own(on(this.addMarker_label, "KeyUp", lang.hitch(this, this.updateUrl)));
        this.own(on(this.addMarker_level, "change", lang.hitch(this, this.updateUrl)));

        //chooseCenterWithLevel
        this.own(on(this.chooseCenterWithLevel_marker, "click", lang.hitch(this, function() {
          this._onMarkersClick();
        })));
        this.own(on(this.chooseCenterWithScale_marker, "click", lang.hitch(this, function() {
          this._onMarkersClick();
        })));
      },
      _onMarkersClick: function() {
        this._hidePopup();
        //this.graphicsLayer.remove(this._markerGraphic);
        //this._markerGraphic = null;
        this.own(on.once(this.map, "click", lang.hitch(this, this._onMapClick)));
      },
      _onMapClick: function(evt) {
        var param = evt.mapPoint;
        this.updateUrl(param);
        this._showPopup();
      },
      _hidePopup: function() {
        //TODO hide class="jimu-overlay" + class="jimu-popup plugin-app-actions-template-popup"
        dojoQuery("#main-page > .jimu-overlay").style("display", "none");
        dojoQuery("#main-page > .jimu-popup").style("display", "none");
      },
      _showPopup: function() {
        dojoQuery("#main-page > .jimu-overlay").style("display", "block");
        dojoQuery("#main-page > .jimu-popup").style("display", "block");
      },

      _updateResUrls: function(param) {
        var type = this.optionSrc;
        var paramObj = param || this.paramObj;
        this.paramObj = paramObj;

        if (typeof type === "undefined") {
          //init
          var id = shareUtils.getAppId(this.shareInfo);
          if (window.isXT) {
            if (id === "stemapp" || id === "stemapp3d") {
              //stemapp or stemapp3d
              this.baseHrefUrl = window.top.location.href;
            } else {
              //apps/+id
              this.baseHrefUrl = window.location.protocol + "//" + window.location.host + "/webappbuilder/apps/" + id;
            }
          } else {
            this.baseHrefUrl = shareUtils.portalUrl + "apps/webappbuilder/index.html";
            this.baseHrefUrl = jimuUtils.url.addQueryParamToUrl(shareUtils.portalUrl +
              "apps/webappbuilder/index.html", "id", id);
          }
        }

        if (type === "currentMapExtent" || typeof type === "undefined") {
          var gcsExtStr = shareUtils.getMapExtent(this.map);
          this.resultUrl = jimuUtils.url.addQueryParamToUrl(this.baseHrefUrl, "extent", gcsExtStr);
        } else if (type === "chooseCenterWithLevel") {
          this.resultUrl = jimuUtils.url.addQueryParamToUrl(this.baseHrefUrl, "center",
            shareUtils.getMapCenter(this.map, paramObj));
          this.resultUrl = jimuUtils.url.addQueryParamToUrl(this.resultUrl, "level",
            this.chooseCenterWithLevel_levels.get("value"));//TODO encoded getlevel()
        } else if (type === "chooseCenterWithScale") {
          this.resultUrl = jimuUtils.url.addQueryParamToUrl(this.baseHrefUrl, "center",
            shareUtils.getMapCenter(this.map, paramObj));
          this.resultUrl = jimuUtils.url.addQueryParamToUrl(this.resultUrl, "scale",
            this.chooseCenterWithScale_scales.get("value"));//TODO encoded getscale()
        } else if (type === "findLocation") {
          var locate = this.findLocation_input.get("value");
          this.resultUrl = jimuUtils.url.addQueryParamToUrl(this.baseHrefUrl, "find", locate);
        } else if (type === "queryFeature") {
          if (!this.queryFeature_layer.get("value")) {
            this._updateQueryFeature_Layer();//init
          } else {
            this._updateUrlByQueryFeatures();//update
          }
        } else if (type === "addMarker") {
          this.resultUrl = jimuUtils.url.addQueryParamToUrl(this.baseHrefUrl, "marker",
            shareUtils.getMapCenter(this.map, paramObj));
          this.resultUrl += ",";
          this.resultUrl += this.addMarker_title.get("value");
          this.resultUrl += ",";
          this.resultUrl += this.addMarker_symbolURL.get("value");
          this.resultUrl += ",";
          this.resultUrl += this.addMarker_label.get("value");
          this.resultUrl += ",";
          this.resultUrl += this.addMarker_level.get("value");
        }


        //checkbox
        if (this.overwirteMobileLayout.get('value')) {
          this.resultUrl = jimuUtils.url.addQueryParamToUrl(this.resultUrl, "mobileBreakPoint",
            this.mobileLayout.getValue());
        }
        if (this.setlanguage.get('value')) {
          this.resultUrl = jimuUtils.url.addQueryParamToUrl(this.resultUrl, "locale",
            this.setlanguage_languages.getValue());
        }
        if (this.auth.get('value')) {
          this.resultUrl = jimuUtils.url.addQueryParamToUrl(this.resultUrl, "token",
            this.authtoken.getValue());
        }
      },

      //queryFeature_layer
      _updateUrlByQueryFeatures: function(){
        var layer = this.queryFeature_layer.get("value");
        var field = this.queryFeature_field.get("value");
        var value = this.queryFeature_value.get("value");
        if(layer){
          this.resultUrl = jimuUtils.url.addQueryParamToUrl(this.baseHrefUrl, "query", layer);
          if(field){
            this.resultUrl += ",";
            this.resultUrl += field;
            if(value){
              this.resultUrl += ",";
              this.resultUrl += value;
            }
          }
        }
      },
      _updateQueryFeature_Layer: function(){
        var layerIds = this.map.graphicsLayerIds;
        var featureLayers = [];
        this.queryFeature_layer.removeOption(this.queryFeature_layer.getOptions());
        var options = [];
        array.forEach(layerIds, lang.hitch(this, function(layerId) {
          var oneLayer = this.map.getLayer(layerId);
          if (oneLayer.declaredClass === "esri.layers.FeatureLayer") {
            featureLayers.push(oneLayer);
            var opt = {label: oneLayer.name, value: layerId};
            options.push(opt);
          }
        }));
        this.queryFeature_layer.addOption(options);
        this._updateUrlByQueryFeatures();

        this._updateQueryFeature_Field();
        this._updateQueryFeature_Value();
        this.updateUrl();
      },
      _updateQueryFeature_Field: function(){
        var fields = [];
        var queryFeatureLayer = this.map.getLayer(this.queryFeature_layer.get("value"));
        fields = queryFeatureLayer.fields;
        var options = [];
        this.queryFeature_field.removeOption(this.queryFeature_field.getOptions());
        array.forEach(fields, lang.hitch(this, function(field) {
          var opt = {label: field.name, value: field.name};
          options.push(opt);
        }));
        this.queryFeature_field.addOption(options);
        this._updateUrlByQueryFeatures();

        this._updateQueryFeature_Value();
        this.updateUrl();
      },
      _updateQueryFeature_Value: function() {
        var queryFields = [];
        var field = this.queryFeature_field.get("value");
        queryFields.push(field);
        var queryFeatureLayer = this.map.getLayer(this.queryFeature_layer.get("value"));
        shareUtils._query(queryFields, queryFeatureLayer.url).then(lang.hitch(this, function(response) {
          var features = response.features;
          var options = [];
          this.queryFeature_value.removeOption(this.queryFeature_value.getOptions());
          options = shareUtils._getQueryedValues(field, response);
          this.queryFeature_value.addOption(options);
          this._updateUrlByQueryFeatures();
          this.updateUrl();
        }));
      },

      _updateLinkOptionsUI: function() {
        dojoQuery(".optionsMore").style("display", "none");
        dojoQuery("." + this.optionSrc + "_optionsMore").style("display", "block");
        if (this.overwirteMobileLayout.get('value')) {
          dojoQuery(".share-options-overwirteMobileLayout_optionsMore").style("display", "block");
        }
        if (this.setlanguage.get('value')) {
          dojoQuery(".share-options-language_optionsMore").style("display", "block");
        }
        if (this.auth.get('value')) {
          dojoQuery(".share-options-auth_optionsMore").style("display", "block");
        }
      },
      updateUrl: function(param) {
        this._updateResUrls(param);
        this._updateLinkOptionsUI();
        //if (!this.shortenedUrl) {
        // if item.access is public or shared then we always use the non org url
        // do not do this for Portal
        var url = this.resultUrl;
        // if ((this.sharingInfo.access === "public" || this.sharingInfo.access === "shared") && !this.portal.isPortal) {
        //   // generic URL
        //   var p = url.indexOf("://");
        //   var p2 = url.indexOf("/", p + 3);
        //   url = url.substring(0, p + 3) + this.portalUrl + url.substring(p2);
        // } // else custom URL
        this.preview.set("value", url);

        if (shareUtils.isUseShortenUrl()) {
          shareUtils.shortenUrl(url, this.bitlyUrl, this.bitlyUrlSSL).then(lang.hitch(this, function(res) {
            this._useShortenUrl(res);
          }), lang.hitch(this, function(res) {
            this._useLengthenUrl(url, res);
          }));
        } else {
          this._useLengthenUrl(url);
        }
      },
      _useShortenUrl: function(shortenedUrl) {
        this.shortenedUrl = shortenedUrl;

        this._setLinkUrl(shortenedUrl);
        this._setEmbedCode(shortenedUrl);
      },
      _useLengthenUrl: function(rawUrl/*, result*/) {
        var url = rawUrl || "";//result.data.long_url || rawUrl;
        //dojo.style(this._linkUrlTextBox, "width", "450px");
        this._setLinkUrl(url);
        this._linkUrlTextBox.focus();
        this._setEmbedCode(url);
        domStyle.set(this.socialNetworkLinks, "display", "none");
      },

      _toFacebook: function() {
        var a;
        a = "http://www.facebook.com/sharer/sharer.php?s\x3d100\x26p[url]\x3d" +
          this._linkUrlTextBox.get('value') + "&t=" + shareUtils.socialNetworkTitle(shareUtils.getAppTitle(this));
        window.open(a, "_blank");
      },
      _toTwitter: function() {
        var a = dojoString.substitute(this.share.shareTwitterTxt, {
            sceneName: this.webscene ? this.webscene.portalItemProperties.title : ""
          }),
          b = this._linkUrlTextBox.get('value'),
          d = 140 - (b.length + 1);
        if (a.length + 14 > d) {
          a = a.substr(0, d - 3) + "...";
        }
        a = a + "&text=" + shareUtils.socialNetworkTitle(shareUtils.getAppTitle(this));
        window.open("http://twitter.com/home?status\x3d" +
          encodeURIComponent(a + "" + b + "\n@ArcGISOnline"), "_blank");
      },
      _toEmail: function() {
        var a = "mailto:?subject\x3d" + dojoString.substitute(this.share.shareEmailSubject, {
              appTitle: encodeURIComponent(shareUtils.getAppTitle(this))
            }),
          previewUrl = this.preview.get('value');
        a = a + ("\x26body\x3d" + encodeURIComponent(this.nls.shareEmailTxt1) + "%0D%0A" + encodeURIComponent(shareUtils.getAppTitle(this)));
        a = a + ("%0D%0A%0D%0A" + encodeURIComponent(previewUrl));
        a = a + ("%0D%0A%0D%0A" + encodeURIComponent(this.nls.shareEmailTxt2));
        a = a + ("%0D%0A" + encodeURIComponent(this.nls.shareEmailTxt3));
        window.location.href = a;
      },
      _toGooglePlus: function() {
        var link = this._linkUrlTextBox.get('value');
        var url = 'http://plus.google.com/share?url=' + link;
        window.open(url, "_blank");
      },
      _toggleLinkOptions: function() {
        //TODO
        var shareOptionsWrapper = dojoQuery(".share-container .shareOptionsWrapper");
        var shareUrlsWrapper = dojoQuery(".share-container .shareUrlsWrapper");
        var shareLinkOptionsWrapper = dojoQuery(".share-container .shareLinkOptionsWrapper");
        if (shareOptionsWrapper && shareOptionsWrapper[0]) {
          dojoClass.toggle(shareOptionsWrapper[0], "displaynone");
        }
        dojoClass.toggle(shareUrlsWrapper[0], "displaynone");
        dojoClass.toggle(shareLinkOptionsWrapper[0], "displaynone");

        //if the 2nd menu is show, the "X"&"cancel" means return to top menu
        if (!window.isXT) {
          if (this._shareContainer && !dojoClass.contains(shareLinkOptionsWrapper[0], "displaynone")) {
            //this._shareContainer.buttons[0].change("jimuNls.common.back");
            this.own(on.once(this._shareContainer, "Close", lang.hitch(this, function() {
              //this._shareContainer.buttons[0].change("jimuNls.common.share");
              this._toggleLinkOptions();
              return false;
            })));
          }
        }

      },
      _moreOptionsExpandCollapse: function() {
        dojoClass.toggle(this.MoreOptionsContainer, "displaynone");
        dojoClass.toggle(this.MoreOptionsIcon, "rotate");
      }
      /*
       _ensureAccess: function(){
       if (this.shareInfo.userRole && this.shareInfo.userRole.isCustom() &&
       !this.shareInfo.userRole.canShareItemToOrg() && !this.shareInfo.userRole.canShareItemToGroup() &&
       (!this.shareInfo.userRole.canShareItemToPublic() || !shareUtils.portal.canSharePublic)) {
       hasAnySharingRights = false;
       }
       // always enabled
       //var user = arcgisonline.sharing.util.getUser();
       //TODO mapMap is access === "public"???
       if (this.shareInfo.sharing.access === "public") {
       // is public
       // embed
       //this.updateMapSize(this.size);
       //dojo.style(dojo.byId("share-map-not-public"), "display", "none");
       //      if (showShareOption == true) {
       //this.currentUser = arcgisonline.sharing.util.getUser();
       if (this.shareInfo.currentUser && hasAnySharingRights &&
       ((this.shareInfo.user.groups && this.shareInfo.user.groups.length > 0) ||
       (this.shareInfo.webMapOwner === this.shareInfo.currentUser.email) ||
       this.shareInfo.isAdmin)) {
       // show share options
       //dojo.style(dojo.byId("share-map-make-public"), "display", "block");
       //dojo.style(dojo.byId("share-map-is-public"), "display", "none");
       } else {
       // user can't change any share options
       //dojo.style(dojo.byId("share-map-make-public"), "display", "none");
       //dojo.style(dojo.byId("share-map-is-public"), "display", "block");
       }

       if (shareUtils.canShowSocialMediaLinks() && shareUtils.roleIsAllowed_ShareSocialMediaLinks("")) {
       dojo.style(this.socialNetworkLinks, "display", "block");
       }
       //dojo.style(dojo.byId("share-map-embed"), "display", "none");

       } else if (this.shareInfo.sharing.access === "shared" || this.shareInfo.sharing.access === "org") {
       // is shared with groups or account
       if (!this.shareInfo.user ||
       (this.shareInfo.webMapOwner !== this.shareInfo.user.email && !this.shareInfo.isAdmin) ||
       !hasAnySharingRights) {
       // shared and not owner and not admin
       // dojo.style(dojo.byId("share-map-not-public"), "display", "block");
       // dojo.style(dojo.byId("share-map-make-public"), "display", "none");
       // dojo.style(dojo.byId("share-map-is-public"), "display", "none");
       } else {
       // shared and owner or Admin
       // dojo.style(dojo.byId("share-map-not-public"), "display", "none");
       // dojo.style(dojo.byId("share-map-make-public"), "display", "block");
       // dojo.style(dojo.byId("share-map-is-public"), "display", "none");
       }

       if (shareUtils.canShowSocialMediaLinks(this.shareInfo.userRole) &&
       shareUtils.roleIsAllowed_ShareSocialMediaLinks("")) {
       dojo.style(this.socialNetworkLinks, "display", "block");
       }

       } else {
       if (!this.shareInfo.user ||
       (this.shareInfo.webMapOwner !== this.shareInfo.user.email && !this.shareInfo.isAdmin) ||
       !hasAnySharingRights) {
       // not public and not owner and not admin
       //dojo.style(dojo.byId("share-map-not-public"), "display", "block");
       //dojo.style(dojo.byId("share-map-make-public"), "display", "none");
       //dojo.style(dojo.byId("share-map-is-public"), "display", "block");
       } else {
       // not public and owner or Admin
       //dojo.style(dojo.byId("share-map-not-public"), "display", "none");
       //dojo.style(dojo.byId("share-map-make-public"), "display", "block");
       //dojo.style(dojo.byId("share-map-is-public"), "display", "none");
       }
       dojo.style(this.socialNetworkLinks, "display", "none");
       //dojo.style(dojo.byId("share-map-embed"), "display", "none");
       }

       if (shareUtils.portal && shareUtils.portal.access === "private") {
       this._isPrivateOrg = true;
       }
       },*/
    });
    return so;
  });