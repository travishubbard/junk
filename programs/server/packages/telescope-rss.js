(function () {

/* Imports */
var Meteor = Package.meteor.Meteor;
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
var deepExtend = Package['telescope-lib'].deepExtend;
var camelToDash = Package['telescope-lib'].camelToDash;
var dashToCamel = Package['telescope-lib'].dashToCamel;
var camelCaseify = Package['telescope-lib'].camelCaseify;
var getSetting = Package['telescope-lib'].getSetting;
var getThemeSetting = Package['telescope-lib'].getThemeSetting;
var getSiteUrl = Package['telescope-lib'].getSiteUrl;
var trimWords = Package['telescope-lib'].trimWords;
var can = Package['telescope-lib'].can;

/* Package-scope variables */
var serveRSS, servePostRSS, filters, serveCommentRSS, post;

(function () {

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                //
// packages/telescope-rss/lib/server/rss.js                                                                       //
//                                                                                                                //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                  //
var RSS = Npm.require('rss');                                                                                     // 1
                                                                                                                  // 2
var getMeta = function() {                                                                                        // 3
  return {                                                                                                        // 4
    title: getSetting('title'),                                                                                   // 5
    description: getSetting('tagline'),                                                                           // 6
    feed_url: Meteor.absoluteUrl()+'feed.xml',                                                                    // 7
    site_url: Meteor.absoluteUrl(),                                                                               // 8
    image_url: Meteor.absoluteUrl()+'img/favicon.png',                                                            // 9
  };                                                                                                              // 10
};                                                                                                                // 11
                                                                                                                  // 12
servePostRSS = function() {                                                                                       // 13
  var feed = new RSS(getMeta());                                                                                  // 14
                                                                                                                  // 15
  filters = {                                                                                                     // 16
    status: STATUS_APPROVED,                                                                                      // 17
    postedAt: {$lte: new Date()}                                                                                  // 18
  };                                                                                                              // 19
  Posts.find(filters, {sort: {postedAt: -1}, limit: 20}).forEach(function(post) {                                 // 20
    var description = !!post.body ? post.body+'</br></br>' : '';                                                  // 21
    feed.item({                                                                                                   // 22
     title: post.title,                                                                                           // 23
     description: description+'<a href="'+getPostUrl(post._id)+'">Discuss</a>',                                   // 24
     author: post.author,                                                                                         // 25
     date: post.postedAt,                                                                                         // 26
     url: getPostLink(post),                                                                                      // 27
     guid: post._id                                                                                               // 28
    });                                                                                                           // 29
  });                                                                                                             // 30
                                                                                                                  // 31
  return feed.xml();                                                                                              // 32
};                                                                                                                // 33
                                                                                                                  // 34
serveCommentRSS = function() {                                                                                    // 35
  var feed = new RSS(getMeta());                                                                                  // 36
                                                                                                                  // 37
  Comments.find({isDeleted: {$ne: true}}, {sort: {postedAt: -1}, limit: 20}).forEach(function(comment) {          // 38
    post = Posts.findOne(comment.postId);                                                                         // 39
    feed.item({                                                                                                   // 40
     title: 'Comment on '+post.title,                                                                             // 41
     description: comment.body+'</br></br>'+'<a href="'+getPostCommentUrl(post._id, comment._id)+'">Discuss</a>', // 42
     author: comment.author,                                                                                      // 43
     date: comment.postedAt,                                                                                      // 44
     url: getCommentUrl(comment._id),                                                                             // 45
     guid: comment._id                                                                                            // 46
    });                                                                                                           // 47
  });                                                                                                             // 48
                                                                                                                  // 49
  return feed.xml();                                                                                              // 50
};                                                                                                                // 51
                                                                                                                  // 52
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}).call(this);






(function () {

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                //
// packages/telescope-rss/lib/server/routes.js                                                                    //
//                                                                                                                //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                  //
Meteor.startup(function () {                                                                                      // 1
                                                                                                                  // 2
  Router.map(function() {                                                                                         // 3
                                                                                                                  // 4
    // Post RSS                                                                                                   // 5
                                                                                                                  // 6
    this.route('feed', {                                                                                          // 7
      where: 'server',                                                                                            // 8
      path: '/feed.xml',                                                                                          // 9
      action: function() {                                                                                        // 10
        this.response.write(servePostRSS());                                                                      // 11
        this.response.end();                                                                                      // 12
      }                                                                                                           // 13
    });                                                                                                           // 14
                                                                                                                  // 15
    // Comment RSS                                                                                                // 16
                                                                                                                  // 17
    this.route('rss_comments', {                                                                                  // 18
      where: 'server',                                                                                            // 19
      path: '/rss/comments.xml',                                                                                  // 20
      action: function() {                                                                                        // 21
        this.response.write(serveCommentRSS());                                                                   // 22
        this.response.end();                                                                                      // 23
      }                                                                                                           // 24
    });                                                                                                           // 25
                                                                                                                  // 26
  });                                                                                                             // 27
                                                                                                                  // 28
});                                                                                                               // 29
                                                                                                                  // 30
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}).call(this);


/* Exports */
if (typeof Package === 'undefined') Package = {};
Package['telescope-rss'] = {
  serveRSS: serveRSS
};

})();
