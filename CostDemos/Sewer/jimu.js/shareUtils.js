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

define([
    'dojo/_base/lang',
    //'jimu/portalUtils',
    //'jimu/portalUrlUtils',
    //'esri/urlUtils',
    'esri/request',
    'dojo/_base/array',
    "dojo/promise/all",
    "jimu/shared/basePortalUrlUtils",
    'dojo/Deferred',
    //"dojo/promise/all",
    'esri/lang',
    'jimu/portalUtils',
    'jimu/Role',
    "jimu/utils",
    'esri/tasks/query',
    'esri/tasks/QueryTask',
    //"dojo/request/xhr"
  ],
  function(lang, /*portalUtils, portalUrlUtils,esriUrlUtils, */esriRequest, array, all,
           basePortalUrlUtils, Deferred, /* all,*/esriLang, portalUtils, Role, jimuUtils, EsriQuery, QueryTask) {
    /*global escape*/
    var su = {};
    su.portalUrl = window.portalUrl;
    su.portal = portalUtils.getPortal(su.portalUrl);

    su.setPortal = function(portalUrl){
      su.portalUrl = portalUrl;
      su.portal = portalUtils.getPortal(su.portalUrl);
    };
    su._getBaseShareInfo = function() {
      var def = new Deferred();
      all({
        getUser: su.portal.getUser(),
        loadSelfInfo: su.portal.loadSelfInfo(),
        getItem: su.portal.getItemById(window.appInfo.id)
      }).then(lang.hitch(this, function(results) {
        var shareInfo = {};

        shareInfo.item = results.getItem;
        if (shareInfo.item && shareInfo.item.ownerFolder &&
          shareInfo.item.ownerFolder.length && shareInfo.item.ownerFolder !== '/') {
          shareInfo.item.folderId = shareInfo.item.ownerFolder;
        }

        shareInfo.user = results.getUser;
        su._setUserRole(results.loadSelfInfo, shareInfo);
        //this.loadConnections();
        shareInfo.currentUser = shareInfo.user;
        // admin?
        shareInfo.isAdmin = false;
        //if (this.currentUser && this.currentUser.accountId && this.currentUser.role && this.currentUser.role === "account_admin") {
        if (shareInfo.userRole && (shareInfo.userRole.isAdmin() ||
          (shareInfo.userRole.isCustom() && shareInfo.userRole.canUpdateOrgItems()))) {
          // in regards to sharing admin role and custom role with updateOrgItems is the same
          shareInfo.isAdmin = true;
          if (shareInfo.item.owner !== shareInfo.currentUser.name) {
            su._getProfile(shareInfo.item, su.portalUrl).then(lang.hitch(this, function(result) {
              shareInfo.itemUser = result;
              if (shareInfo.itemUser.orgId !== shareInfo.currentUser.orgId/*accountId*/) {
                // user is not the admin of the web map owner
                shareInfo.isAdmin = false;
              }

              def.resolve(shareInfo);
            }));
          } else {
            shareInfo.itemUser = shareInfo.currentUser;
            def.resolve(shareInfo);
          }

        } else if (shareInfo.currentUser) {
          shareInfo.itemUser = shareInfo.currentUser;
          def.resolve(shareInfo);
        } else {
          // user is not logged in
          def.resolve(shareInfo);
        }
      }));
      return def;
    };

    su._setUserRole = function(res, shareInfo) {
      if (res.urlKey) {
        shareInfo.userPortalUrl = res.urlKey + '.' + res.customBaseUrl;
      } else {
        shareInfo.userPortalUrl = this.portalUrl;
      }

      if (res && !res.code && !res.message) {
        shareInfo.organization = res;//"portals/self?" += "&token="
      }

      if (res && res.user) {
        shareInfo.userRole = new Role({
          id: (res.user.roleId) ? res.user.roleId : res.user.role,
          role: res.user.role
        });

        shareInfo._isCustomRole = shareInfo.userRole.isCustom();
        shareInfo._roleCanShareToGroup = shareInfo._isCustomRole && shareInfo.userRole.canShareItemToGroup();
        shareInfo._roleCanShareToOrg = shareInfo._isCustomRole && shareInfo.userRole.canShareItemToOrg();
        shareInfo._roleCanSharePublic = shareInfo._isCustomRole && shareInfo.userRole.canShareItemToPublic();
        shareInfo._roleCanShare = (shareInfo._roleCanShareToGroup ||
        shareInfo._roleCanShareToOrg || shareInfo._roleCanShareToPublic);
        shareInfo._roleCanUpdateItems = shareInfo._isCustomRole && shareInfo.userRole.canUpdateOrgItems();
        shareInfo._roleCanShareOthersItemsToGroup = shareInfo._isCustomRole &&
          shareInfo.userRole.canShareOthersItemsToGroup();
        shareInfo._roleCanShareOthersItemsToOrg = shareInfo._isCustomRole &&
          shareInfo.userRole.canShareOthersItemsToOrg();
        shareInfo._roleCanShareOthersItemsToPublic = shareInfo._isCustomRole &&
          shareInfo.userRole.canShareOthersItemsToPublic();

        shareInfo._roleCanShareOthersItems = shareInfo._isCustomRole && (
            shareInfo.userRole.canShareOthersItemsToGroup() ||
            shareInfo.userRole.canShareOthersItemsToOrg() ||
            shareInfo._roleCanShareOthersItemsToPublic
          );

        //An org user can share public if one set of the
        shareInfo._orgUserCanSharePublicOrOverride = (shareInfo.organization && (
          (shareInfo.organization.canSharePublic === true &&
          (!shareInfo._isCustomRole || shareInfo._roleCanSharePublic || shareInfo._roleCanShareOthersItemsToPublic)) ||
          (shareInfo.userRole.isAdmin())
        ));

      } else {
        return false;
      }
    };

    su._isUserOwnTheApp = function(userObj) {
      if (userObj && userObj.username && userObj.username === window.appInfo.appOwner) {
        return true;
      } else {
        return false;
      }
    };

    su.getItemById = function(item) {
      //http://www.arcgis.com/sharing/rest/content/items/
      var def = new Deferred();
      var url = basePortalUrlUtils.getStandardPortalUrl(su.portalUrl);
      url += '/sharing/rest/content/items/' + item.id;
      //basePortalUrlUtils.getUserContentUrl(_portalUrl, _user, _folderId);
      var content = {
        f: 'json'
      };
      esriRequest({
        url: url,
        handleAs: 'json',
        content: content,
        callbackParamName: 'callback'
      }).then(lang.hitch(this, function(groupsResponse) {
        def.resolve(groupsResponse);
      }), lang.hitch(this, function(err) {
        console.error(err);
        def.reject(err);
      }));
      return def;
    };
    su.getItemByUserAndItemId = function(item, itemUser, user/*, portalUrl*/) {
      var def = new Deferred();
      var url = basePortalUrlUtils.getStandardPortalUrl(su.portalUrl);
      url += '/sharing/rest/content/users/';
      //basePortalUrlUtils.getUserContentUrl(_portalUrl, _user, _folderId);
      url += (itemUser ?
        (itemUser.username ? itemUser.username : itemUser.email) : user.email);
      if ((esriLang.isDefined(item.folderId) && item.folderId !== '/') ||
        (esriLang.isDefined(item.ownerFolder) && item.ownerFolder !== '/')) {
        url += '/' + (item.folderId || item.ownerFolder);
      }
      url += '/items/' + item.id;
      var content = {
        f: 'json'
      };
      esriRequest({
        url: url,
        handleAs: 'json',
        content: content,
        callbackParamName: 'callback'
      }).then(lang.hitch(this, function(groupsResponse) {
        def.resolve(groupsResponse);
      }), lang.hitch(this, function(err) {
        console.error(err);
        def.reject(err);
      }));
      return def;
    };

    su._getProfile = function(item/*, portalUrl*/) {
      var def = new Deferred();
      var url = basePortalUrlUtils.getUserUrl(su.portalUrl, item.owner);
      var content = {
        f: 'json'
      };
      esriRequest({
        url: url,
        handleAs: 'json',
        content: content,
        callbackParamName: 'callback'
      }).then(lang.hitch(this, function(groupsResponse) {
        def.resolve(groupsResponse);
      }), lang.hitch(this, function(err) {
        console.error(err);
        def.reject(err);
      }));
      return def;
    };
    su._unshareItemById = function(args, itemId/*, portalUrl, itemFolderId*/) {
      var def = new Deferred();
      //var userStr = (this.itemUser ? (this.itemUser.username ? this.itemUser.username : this.itemUser.email) : this.user.email);
      //var contentItems = basePortalUrlUtils.getUserItemsUrl(this.portalUrl, userStr, itemFolderId);
      var url = basePortalUrlUtils.getStandardPortalUrl(su.portalUrl);
      url += '/sharing/rest/content/items/' + itemId + "/unshare";
      var content = {
        f: 'json'
      };
      content = lang.mixin(content, args);
      esriRequest({
        url: url,
        handleAs: 'json',
        content: content,
        callbackParamName: 'callback'
      }, {
        usePost: true
      }).then(lang.hitch(this, function(res) {
        def.resolve(res);
      }), lang.hitch(this, function(err) {
        console.error(err);
        def.reject(err);
      }));
      return def;
    };
    su.canSharePublic = function(portalObj) {
      // always returns true if called before /self is retrieved or if canSharePublic is not defined in esriGeowConfig.self
      return (portalObj.selfUrl &&
      (portalObj.canSharePublic === true || portalObj.canSharePublic === false)) ? portalObj.canSharePublic : true;
    };
    su.unshareItemsByUser = function(username, request) {
      //var url = esriGeowConfig.restBaseUrl + 'content/users/' + username + '/unshareItems';
      //this.util.postJson(request, url, handler, errorHandler);
      var def = new Deferred();
      //var userStr = (this.itemUser ? (this.itemUser.username ? this.itemUser.username : this.itemUser.email) : this.user.email);
      //var contentItems = basePortalUrlUtils.getUserItemsUrl(this.portalUrl, userStr, itemFolderId);
      var url = basePortalUrlUtils.getStandardPortalUrl(su.portalUrl);
      url += '/sharing/rest/content/users/' + username + '/unshareItems';
      var content = {
        f: 'json'
      };
      content = lang.mixin(content, request);
      esriRequest({
        url: url,
        handleAs: 'json',
        content: content,
        callbackParamName: 'callback'
      }, {
        usePost: true
      }).then(lang.hitch(this, function(res) {
        def.resolve(res);
      }), lang.hitch(this, function(err) {
        console.error(err);
        def.reject(err);
      }));
      return def;
    };
    su.unshareItems = function(itemUser, request) {
      //var user = this.util.getUser();
      //if (user == null) return;
      var def = new Deferred();
      var url = basePortalUrlUtils.getStandardPortalUrl(su.portalUrl);
      url += '/sharing/rest/content/users/' + (request.owner || itemUser.email) + '/unshareItems';
      var content = {
        f: 'json'
      };
      content = lang.mixin(content, request);
      esriRequest({
        url: url,
        handleAs: 'json',
        content: content,
        callbackParamName: 'callback'
      }, {
        usePost: true
      }).then(lang.hitch(this, function(res) {
        def.resolve(res);
      }), lang.hitch(this, function(err) {
        console.error(err);
        def.reject(err);
      }));
      return def;
    };
    su.shareItemsByUser = function(username, request) {
      var def = new Deferred();
      var url = basePortalUrlUtils.getStandardPortalUrl(su.portalUrl);
      url += '/sharing/rest/content/users/' + username + '/shareItems';
      var content = {
        f: 'json'
      };
      content = lang.mixin(content, request);
      esriRequest({
        url: url,
        handleAs: 'json',
        content: content,
        callbackParamName: 'callback'
      }, {
        usePost: true
      }).then(lang.hitch(this, function(res) {
        def.resolve(res);
      }), lang.hitch(this, function(err) {
        console.error(err);
        def.reject(err);
      }));
      return def;
    };
    su.shareItems = function(itemUser, request) {
      //var user = this.util.getUser();
      //if (user == null) return;
      var def = new Deferred();
      var url = basePortalUrlUtils.getStandardPortalUrl(su.portalUrl);
      url += '/sharing/rest/content/users/' + (request.owner || itemUser.email) + '/shareItems';
      var content = {
        f: 'json'
      };
      content = lang.mixin(content, request);
      esriRequest({
        url: url,
        handleAs: 'json',
        content: content,
        callbackParamName: 'callback'
      }, {
        usePost: true
      }).then(lang.hitch(this, function(res) {
        def.resolve(res);
      }), lang.hitch(this, function(err) {
        console.error(err);
        def.reject(err);
      }));
      return def;
    };

    su.getItemsGroups = function(item) {
      var def = new Deferred();
      var url = basePortalUrlUtils.getStandardPortalUrl(su.portalUrl);
      url += '/sharing/rest/content/items/' + item.id + '/groups';
      var content = {
        f: 'json'
      };
      //content = lang.mixin(content, request);
      esriRequest({
        url: url,
        handleAs: 'json',
        content: content,
        callbackParamName: 'callback'
      }, {
        usePost: true
      }).then(lang.hitch(this, function(res) {
        def.resolve(res);
      }), lang.hitch(this, function(err) {
        console.error(err);
        def.reject(err);
      }));
      return def;
    };
    /////////////////////////////////////////////////////////
    /////      shareLink
    /////////////////////////////////////////////////////////
    // item: can be content item or group item

    su.isUseShortenUrl = function(){
      if (location.hostname.endWith("esri.com") || location.hostname.endWith("arcgis.com")) {
        return true;
      } else {
        return false;
      }
    };
    // calls handler(shortenedUrl) on success
    su.shortenUrl = function(url, bitlyUrl, bitlyUrlSSL) {
      var def = new Deferred();
      /*
       {
       "status_code": 200,
       "data": {
       "url": "http://bit.ly/cmeH01",
       "hash": "cmeH01",
       "global_hash": "1YKMfY",
       "long_url": "http://www.arcgis.com/home/item.html?id=xxx",
       "new_hash": 0
       },
       "status_txt": "OK"
       }
       */
      var uri = bitlyUrl;
      if (location.protocol === "https:") {
        uri = bitlyUrlSSL;
      }
      uri += "&longUrl=" + escape(url) + "&format=json";

      esriRequest({
        url: uri,
        handleAs: 'json',
        //content: content,
        callbackParamName: 'callback'
      }).then(lang.hitch(this, function(result) {
        if (result && result.status_code === 200 && result.data && result.data.url && result.data.url.length > 0) {
          def.resolve(result.data.url);
        } else {
          def.reject(result);
        }
      }), lang.hitch(this, function(err) {
        console.log("can't fetch shortenUrl " + err);
        def.reject(err);
      }));
      return def;
    };
    /*su.urlToObject = function(url) {
     var urlObj = esri.urlToObject(url);
     urlObj.query = urlObj.query || {};
     for (var key in urlObj.query) {
     if (urlObj.query.hasOwnProperty(key)) {
     // strip out some HTML (<,>,%3C,%3E,&lt;,&gt;)
     urlObj.query[key] = urlObj.query[key].replace(/(&lt;|&gt;|<|>|%3C|%3E)/g, "");
     }
     }
     return urlObj;
     };*/
    su.canShowSocialMediaLinks = function(/*userRole*/) {
      //TODO
      // Determine if the user should be able to see the social media links.
      // Checks to determine if the application is configured to show them (esriGeowConfig.showSocialMediaLinks) and
      // whether the user can see them (anonymous or public user, or org user where org canSharePublic and
      // org hasn't set self.portalProperties.showSocialMediaLinks to false)
      //
      // NOTE: Privileges to share must be checked externally
      return true;
      /*esriGeowConfig.showSocialMediaLinks &&            // app configuration allows it
       sharingUtil.canSharePublic() &&          // org allows public sharing
       (!userRole || !esriGeowConfig.self || ( // anonymous or public user
       esriGeowConfig.userRole && esriGeowConfig.self &&      // org user and
       (!esriGeowConfig.self.portalProperties ||              // org has undefined portalProperties.showSocialMediaLinks
       (esriGeowConfig.self.portalProperties &&               // or it is set explicitly to true
       (!esri.isDefined(esriGeowConfig.self.portalProperties.showSocialMediaLinks) ||
       (esriGeowConfig.self.portalProperties.showSocialMediaLinks === true))))));*/
    };
    su.roleIsAllowed_ShareSocialMediaLinks = function() {
      //TODO arcgisonline.map.role.isAllowed("share_socialMediaLinks")
      return true;
    };

    su.getPortalHomeUrl = function(portalUrl) {
      var baseUrl = basePortalUrlUtils.getStandardPortalUrl(portalUrl);
      var homeUrl = baseUrl + "/home/";
      return homeUrl;
    };

    su.socialNetworkTitle = function(title) {
      if (title.length > 100) {
        title = title.substring(0, 97) + "...";
      }
      // escape :             This%20is%20a%20title%20with%20some%20special%20characters%20like%20percent%20%25%20and%20ampercent%20%26.
      // encodeURI:           This%20is%20a%20title%20with%20some%20special%20characters%20like%20percent%20%25%20and%20ampercent%20&.  (& doesn't show up in Twitter)
      // encodeURIComponent : This%20is%20a%20title%20with%20some%20special%20characters%20like%20percent%20%25%20and%20ampercent%20%26.

      // don't replace " " with "%20"
      // escape doesn't properly encode Japanese characters, umlauts, ...
      // encodeURI doesn't encode '&'
      return encodeURIComponent(title.replace(/ /g, "+"));
    };

    su.getMapExtent = function(map) {
      var accuracy = 1E4;
      var extent = map.extent;
      return null !== extent ? su._roundValue(extent.xmin, accuracy) + "," +
      su._roundValue(extent.ymin, accuracy) + "," + su._roundValue(extent.xmax, accuracy) + "," +
      su._roundValue(extent.ymax, accuracy) + "," + extent.spatialReference.wkid : "";
    };
    // su._roundExtent = function(extent) {
    //   var accuracy = 1E4;
    //   return null !== extent ? su._roundValue(extent.xmin, accuracy) + "," +
    //   su._roundValue(extent.ymin, accuracy) + "," + su._roundValue(extent.xmax, accuracy) + "," +
    //   su._roundValue(extent.ymax, accuracy) : "";
    // };
    su._roundValue = function(a, b) {
      return Math.round(a * b) / b;
    };

    su.getMapCenter = function(map, paramObj) {
      var accuracy = 1E4;
      var center = null;
      if (paramObj && paramObj.x && paramObj.y) {
        center = paramObj;
      } else if (map.extent.getCenter()) {
        center = map.extent.getCenter();
      }

      return null !== center ? su._roundValue(center.x, accuracy) + "," +
      su._roundValue(center.y, accuracy) + "," + center.spatialReference.wkid : "";
    };

    su.getAppTitle = function(dijit) {
      return dijit.webmapTitle ? dijit.webmapTitle : dijit.appTitle;
    };
    su.getAppId = function(shareInfo) {
      var id = "";
      if (window.isXT) {
        var urlObj = jimuUtils.urlToObject(window.top.location.href);
        if (urlObj && urlObj.query && urlObj.query.id) {
          //url within ?id=
          id = urlObj.query.id;
        } else {
          //url within /webappbuilder/"id"/
          var path = window.appInfo.appPath;
          var array = path.split("/");
          if (array.length >= 2) {
            id = array[array.length - 2];
          }
        }
      } else if (typeof shareInfo !== "undefined" && typeof shareInfo.item !== "undefined" &&
        esriLang.isDefined(shareInfo.item.id)) {
        id = shareInfo.item.id;
      }

      return id;
    };

    su._query = function(outFields, url/*where, geometry, returnGeometry, relationship*/) {
      var queryParams = new EsriQuery();
      queryParams.where = "1=1";
      // if(geometry){
      //   queryParams.geometry = geometry;
      // }
      //queryParams.outSpatialReference = this.map.spatialReference;
      //queryParams.returnGeometry = !!returnGeometry;
      //queryParams.spatialRelationship = relationship;
      queryParams.outFields = outFields;
      var queryTask = new QueryTask(url);
      return queryTask.execute(queryParams);
    };
    su._getQueryedValues = function(outField, response) {
      var features = response.features;
      var options = [];
      array.forEach(features, lang.hitch(this, function(feature, idx) {
        var val = feature.attributes[outField];
        var opt = {label: val, value: val};
        options.push(opt);
      }));

      return options;
    };

    return su;
  });