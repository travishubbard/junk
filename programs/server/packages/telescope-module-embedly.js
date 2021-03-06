(function () {

/* Imports */
var Meteor = Package.meteor.Meteor;
var deepExtend = Package['telescope-lib'].deepExtend;
var camelToDash = Package['telescope-lib'].camelToDash;
var dashToCamel = Package['telescope-lib'].dashToCamel;
var camelCaseify = Package['telescope-lib'].camelCaseify;
var getSetting = Package['telescope-lib'].getSetting;
var getThemeSetting = Package['telescope-lib'].getThemeSetting;
var getSiteUrl = Package['telescope-lib'].getSiteUrl;
var trimWords = Package['telescope-lib'].trimWords;
var can = Package['telescope-lib'].can;
var adminNav = Package['telescope-base'].adminNav;
var viewNav = Package['telescope-base'].viewNav;
var addToPostSchema = Package['telescope-base'].addToPostSchema;
var addToCommentsSchema = Package['telescope-base'].addToCommentsSchema;
var addToSettingsSchema = Package['telescope-base'].addToSettingsSchema;
var preloadSubscriptions = Package['telescope-base'].preloadSubscriptions;
var primaryNav = Package['telescope-base'].primaryNav;
var secondaryNav = Package['telescope-base'].secondaryNav;
var viewParameters = Package['telescope-base'].viewParameters;
var footerModules = Package['telescope-base'].footerModules;
var heroModules = Package['telescope-base'].heroModules;
var postModules = Package['telescope-base'].postModules;
var postHeading = Package['telescope-base'].postHeading;
var postMeta = Package['telescope-base'].postMeta;
var modulePositions = Package['telescope-base'].modulePositions;
var postSubmitRenderedCallbacks = Package['telescope-base'].postSubmitRenderedCallbacks;
var postSubmitClientCallbacks = Package['telescope-base'].postSubmitClientCallbacks;
var postSubmitMethodCallbacks = Package['telescope-base'].postSubmitMethodCallbacks;
var postAfterSubmitMethodCallbacks = Package['telescope-base'].postAfterSubmitMethodCallbacks;
var postEditRenderedCallbacks = Package['telescope-base'].postEditRenderedCallbacks;
var postEditClientCallbacks = Package['telescope-base'].postEditClientCallbacks;
var postEditMethodCallbacks = Package['telescope-base'].postEditMethodCallbacks;
var postAfterEditMethodCallbacks = Package['telescope-base'].postAfterEditMethodCallbacks;
var commentSubmitRenderedCallbacks = Package['telescope-base'].commentSubmitRenderedCallbacks;
var commentSubmitClientCallbacks = Package['telescope-base'].commentSubmitClientCallbacks;
var commentSubmitMethodCallbacks = Package['telescope-base'].commentSubmitMethodCallbacks;
var commentAfterSubmitMethodCallbacks = Package['telescope-base'].commentAfterSubmitMethodCallbacks;
var commentEditRenderedCallbacks = Package['telescope-base'].commentEditRenderedCallbacks;
var commentEditClientCallbacks = Package['telescope-base'].commentEditClientCallbacks;
var commentEditMethodCallbacks = Package['telescope-base'].commentEditMethodCallbacks;
var commentAfterEditMethodCallbacks = Package['telescope-base'].commentAfterEditMethodCallbacks;
var getTemplate = Package['telescope-base'].getTemplate;
var templates = Package['telescope-base'].templates;
var themeSettings = Package['telescope-base'].themeSettings;
var HTTP = Package.http.HTTP;

/* Package-scope variables */
var getEmbedlyData;

(function () {

///////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                   //
// packages/telescope-module-embedly/lib/embedly.js                                                  //
//                                                                                                   //
///////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                     //
var thumbnailProperty = {                                                                            // 1
  propertyName: 'thumbnailUrl',                                                                      // 2
  propertySchema: {                                                                                  // 3
    type: String,                                                                                    // 4
    optional: true                                                                                   // 5
  }                                                                                                  // 6
}                                                                                                    // 7
addToPostSchema.push(thumbnailProperty);                                                             // 8
                                                                                                     // 9
var mediaProperty = {                                                                                // 10
  propertyName: 'media',                                                                             // 11
  propertySchema: {                                                                                  // 12
    type: Object,                                                                                    // 13
    optional: true,                                                                                  // 14
    blackbox: true                                                                                   // 15
  }                                                                                                  // 16
}                                                                                                    // 17
addToPostSchema.push(mediaProperty);                                                                 // 18
                                                                                                     // 19
                                                                                                     // 20
postModules.push({                                                                                   // 21
  template: 'postThumbnail',                                                                         // 22
  position: 'center-left'                                                                            // 23
});                                                                                                  // 24
                                                                                                     // 25
var embedlyKeyProperty = {                                                                           // 26
  propertyName: 'embedlyKey',                                                                        // 27
  propertySchema: {                                                                                  // 28
    type: String,                                                                                    // 29
    optional: true                                                                                   // 30
  }                                                                                                  // 31
}                                                                                                    // 32
addToSettingsSchema.push(embedlyKeyProperty);                                                        // 33
///////////////////////////////////////////////////////////////////////////////////////////////////////

}).call(this);






(function () {

///////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                   //
// packages/telescope-module-embedly/lib/server/get_embedly_data.js                                  //
//                                                                                                   //
///////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                     //
getEmbedlyData = function (url) {                                                                    // 1
  var data = {}                                                                                      // 2
  var extractBase = 'http://api.embed.ly/1/extract';                                                 // 3
  var embedlyKey = getSetting('embedlyKey');                                                         // 4
                                                                                                     // 5
  try {                                                                                              // 6
                                                                                                     // 7
    if(!embedlyKey)                                                                                  // 8
      throw new Error("Couldn't find an Embedly API key! Please add it to your Telescope settings.") // 9
                                                                                                     // 10
    var result = Meteor.http.get(extractBase, {                                                      // 11
      params: {                                                                                      // 12
        key: embedlyKey,                                                                             // 13
        url: url,                                                                                    // 14
        image_width: 200,                                                                            // 15
        image_height: 150,                                                                           // 16
        image_method: 'crop'                                                                         // 17
      }                                                                                              // 18
    });                                                                                              // 19
                                                                                                     // 20
    if(!result.data.images.length)                                                                   // 21
      throw new Error("Couldn't find an image!");                                                    // 22
                                                                                                     // 23
    data.thumbnailUrl = result.data.images[0].url;                                                   // 24
                                                                                                     // 25
    if(typeof result.data.media !== 'undefined')                                                     // 26
      data.media = result.data.media                                                                 // 27
                                                                                                     // 28
    return data;                                                                                     // 29
  } catch (error) {                                                                                  // 30
    console.log(error)                                                                               // 31
    return null;                                                                                     // 32
  }                                                                                                  // 33
}                                                                                                    // 34
                                                                                                     // 35
Meteor.methods({                                                                                     // 36
  testGetEmbedlyData: function (url) {                                                               // 37
    console.log(getEmbedlyData(url))                                                                 // 38
  },                                                                                                 // 39
  setThumbnail: function (post) {                                                                    // 40
    var set = {};                                                                                    // 41
    if(post.url){                                                                                    // 42
      var data = getEmbedlyData(post.url);                                                           // 43
      if(!!data && !!data.thumbnailUrl)                                                              // 44
        set.thumbnailUrl = data.thumbnailUrl;                                                        // 45
      if(!!data && !!data.media.html)                                                                // 46
        set.media = data.media                                                                       // 47
      console.log(set)                                                                               // 48
      Posts.update({_id: post._id}, {$set: set});                                                    // 49
    }                                                                                                // 50
  }                                                                                                  // 51
});                                                                                                  // 52
                                                                                                     // 53
var extendPost = function (post) {                                                                   // 54
  if(post.url){                                                                                      // 55
    var data = getEmbedlyData(post.url);                                                             // 56
    if(!!data && !!data.thumbnailUrl)                                                                // 57
      post.thumbnailUrl = data.thumbnailUrl;                                                         // 58
    if(!!data && !!data.media.html)                                                                  // 59
      post.media = data.media                                                                        // 60
  }                                                                                                  // 61
  return post;                                                                                       // 62
}                                                                                                    // 63
                                                                                                     // 64
postSubmitMethodCallbacks.push(extendPost);                                                          // 65
///////////////////////////////////////////////////////////////////////////////////////////////////////

}).call(this);


/* Exports */
if (typeof Package === 'undefined') Package = {};
Package['telescope-module-embedly'] = {};

})();
