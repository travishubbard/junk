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
var buildEmailTemplate = Package['telescope-email'].buildEmailTemplate;
var sendEmail = Package['telescope-email'].sendEmail;
var buildAndSendEmail = Package['telescope-email'].buildAndSendEmail;
var getEmailTemplate = Package['telescope-email'].getEmailTemplate;
var SimpleSchema = Package['aldeed:simple-schema'].SimpleSchema;
var MongoObject = Package['aldeed:simple-schema'].MongoObject;
var Handlebars = Package['cmather:handlebars-server'].Handlebars;
var OriginalHandlebars = Package['cmather:handlebars-server'].OriginalHandlebars;

/* Package-scope variables */
var Notifications, createNotification, buildSiteNotification, newPostNotification, buildEmailNotification, getUnsubscribeLink, postSubmitMethodCallbacks, notificationEmail;

(function () {

///////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                           //
// packages/telescope-notifications/lib/notifications.js                                                     //
//                                                                                                           //
///////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                             //
Notifications = new Meteor.Collection('notifications');                                                      // 1
                                                                                                             // 2
// Notifications = new Meteor.Collection("notifications", {                                                  // 3
//   schema: new SimpleSchema({                                                                              // 4
//     properties: {                                                                                         // 5
//       type: Object                                                                                        // 6
//     },                                                                                                    // 7
//     event: {                                                                                              // 8
//       type: String                                                                                        // 9
//     },                                                                                                    // 10
//     read: {                                                                                               // 11
//       type: Boolean                                                                                       // 12
//     },                                                                                                    // 13
//     createdAt: {                                                                                          // 14
//       type: Date                                                                                          // 15
//     },                                                                                                    // 16
//     userId: {                                                                                             // 17
//       type: "???"                                                                                         // 18
//     }                                                                                                     // 19
//   })                                                                                                      // 20
// });                                                                                                       // 21
                                                                                                             // 22
Notifications.allow({                                                                                        // 23
  insert: function(userId, doc){                                                                             // 24
    // new notifications can only be created via a Meteor method                                             // 25
    return false;                                                                                            // 26
  },                                                                                                         // 27
  update: can.editById,                                                                                      // 28
  remove: can.editById                                                                                       // 29
});                                                                                                          // 30
                                                                                                             // 31
createNotification = function(event, properties, userToNotify) {                                             // 32
  // 1. Store notification in database                                                                       // 33
  var notification = {                                                                                       // 34
    timestamp: new Date().getTime(),                                                                         // 35
    userId: userToNotify._id,                                                                                // 36
    event: event,                                                                                            // 37
    properties: properties,                                                                                  // 38
    read: false                                                                                              // 39
  };                                                                                                         // 40
  var newNotificationId = Notifications.insert(notification);                                                // 41
                                                                                                             // 42
  // 2. Send notification by email (if on server)                                                            // 43
  if(Meteor.isServer && getUserSetting('notifications.replies', false, userToNotify)){                       // 44
    // put in setTimeout so it doesn't hold up the rest of the method                                        // 45
    Meteor.setTimeout(function () {                                                                          // 46
      notificationEmail = buildEmailNotification(notification);                                              // 47
      sendEmail(getEmail(userToNotify), notificationEmail.subject, notificationEmail.html);                  // 48
    }, 1);                                                                                                   // 49
  }                                                                                                          // 50
};                                                                                                           // 51
                                                                                                             // 52
buildSiteNotification = function (notification) {                                                            // 53
  var event = notification.event,                                                                            // 54
      comment = notification.properties.comment,                                                             // 55
      post = notification.properties.post,                                                                   // 56
      userToNotify = Meteor.users.findOne(notification.userId),                                              // 57
      template,                                                                                              // 58
      html;                                                                                                  // 59
                                                                                                             // 60
  var properties = {                                                                                         // 61
    profileUrl: getProfileUrlById(comment.userId),                                                           // 62
    author: comment.author,                                                                                  // 63
    postCommentUrl: getPostCommentUrl(post._id, comment._id),                                                // 64
    postTitle: post.title                                                                                    // 65
  };                                                                                                         // 66
                                                                                                             // 67
  switch(event){                                                                                             // 68
    case 'newReply':                                                                                         // 69
      template = 'notificationNewReply';                                                                     // 70
      break;                                                                                                 // 71
                                                                                                             // 72
    case 'newComment':                                                                                       // 73
      template = 'notificationNewComment';                                                                   // 74
      break;                                                                                                 // 75
                                                                                                             // 76
    default:                                                                                                 // 77
      break;                                                                                                 // 78
  }                                                                                                          // 79
                                                                                                             // 80
  html = Blaze.toHTML(Blaze.With(properties, function(){                                                     // 81
    return Template[getTemplate(template)]                                                                   // 82
  }));                                                                                                       // 83
                                                                                                             // 84
  return html;                                                                                               // 85
};                                                                                                           // 86
                                                                                                             // 87
Meteor.methods({                                                                                             // 88
  markAllNotificationsAsRead: function() {                                                                   // 89
    Notifications.update(                                                                                    // 90
      {userId: Meteor.userId()},                                                                             // 91
      {                                                                                                      // 92
        $set:{                                                                                               // 93
          read: true                                                                                         // 94
        }                                                                                                    // 95
      },                                                                                                     // 96
      {multi: true}                                                                                          // 97
    );                                                                                                       // 98
  }                                                                                                          // 99
});                                                                                                          // 100
                                                                                                             // 101
// add new post notification callback on post submit                                                         // 102
postAfterSubmitMethodCallbacks.push(function (post) {                                                        // 103
  if(Meteor.isServer && !!getSetting('emailNotifications', false)){                                          // 104
    // we don't want emails to hold up the post submission, so we make the whole thing async with setTimeout // 105
    Meteor.setTimeout(function () {                                                                          // 106
      newPostNotification(post, [post.userId])                                                               // 107
    }, 1);                                                                                                   // 108
  }                                                                                                          // 109
  return post;                                                                                               // 110
});                                                                                                          // 111
                                                                                                             // 112
// add new comment notification callback on comment submit                                                   // 113
commentAfterSubmitMethodCallbacks.push(function (comment) {                                                  // 114
  if(Meteor.isServer){                                                                                       // 115
                                                                                                             // 116
    var parentCommentId = comment.parentCommentId;                                                           // 117
    var user = Meteor.user();                                                                                // 118
    var post = Posts.findOne(comment.postId);                                                                // 119
    var postUser = Meteor.users.findOne(post.userId);                                                        // 120
                                                                                                             // 121
    var notificationProperties = {                                                                           // 122
      comment: _.pick(comment, '_id', 'userId', 'author', 'body'),                                           // 123
      post: _.pick(post, '_id', 'title', 'url')                                                              // 124
    };                                                                                                       // 125
                                                                                                             // 126
    if(parentCommentId){                                                                                     // 127
      // child comment                                                                                       // 128
      var parentComment = Comments.findOne(parentCommentId);                                                 // 129
      var parentUser = Meteor.users.findOne(parentComment.userId);                                           // 130
                                                                                                             // 131
      notificationProperties.parentComment = _.pick(parentComment, '_id', 'userId', 'author');               // 132
                                                                                                             // 133
      // reply notification                                                                                  // 134
      // do not notify users of their own actions (i.e. they're replying to themselves)                      // 135
      if(parentUser._id != user._id)                                                                         // 136
        createNotification('newReply', notificationProperties, parentUser);                                  // 137
                                                                                                             // 138
      // comment notification                                                                                // 139
      // if the original poster is different from the author of the parent comment, notify them too          // 140
      if(postUser._id != user._id && parentComment.userId != post.userId)                                    // 141
        createNotification('newComment', notificationProperties, postUser);                                  // 142
                                                                                                             // 143
    }else{                                                                                                   // 144
      // root comment                                                                                        // 145
      // don't notify users of their own comments                                                            // 146
      if(postUser._id != user._id)                                                                           // 147
        createNotification('newComment', notificationProperties, postUser);                                  // 148
    }                                                                                                        // 149
  }                                                                                                          // 150
                                                                                                             // 151
  return comment;                                                                                            // 152
});                                                                                                          // 153
///////////////////////////////////////////////////////////////////////////////////////////////////////////////

}).call(this);






(function () {

///////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                           //
// packages/telescope-notifications/lib/server/notifications-server.js                                       //
//                                                                                                           //
///////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                             //
getUnsubscribeLink = function(user){                                                                         // 1
  return Meteor.absoluteUrl()+'unsubscribe/'+user.email_hash;                                                // 2
};                                                                                                           // 3
                                                                                                             // 4
// given a notification, return the correct subject and html to send an email                                // 5
buildEmailNotification = function (notification) {                                                           // 6
                                                                                                             // 7
  var subject, template;                                                                                     // 8
  var post = notification.properties.post;                                                                   // 9
  var comment = notification.properties.comment;                                                             // 10
                                                                                                             // 11
  switch(notification.event){                                                                                // 12
    case 'newReply':                                                                                         // 13
      subject = 'Someone replied to your comment on "'+post.title+'"';                                       // 14
      template = 'emailNewReply';                                                                            // 15
      break;                                                                                                 // 16
                                                                                                             // 17
    case 'newComment':                                                                                       // 18
      subject = 'A new comment on your post "'+post.title+'"';                                               // 19
      template = 'emailNewComment';                                                                          // 20
      break;                                                                                                 // 21
                                                                                                             // 22
    default:                                                                                                 // 23
      break;                                                                                                 // 24
  }                                                                                                          // 25
                                                                                                             // 26
  var emailProperties = _.extend(notification.properties, {                                                  // 27
    body: marked(comment.body),                                                                              // 28
    profileUrl: getProfileUrlById(comment.userId),                                                           // 29
    postCommentUrl: getPostCommentUrl(post._id, comment._id),                                                // 30
    postLink: getPostLink(post)                                                                              // 31
  });                                                                                                        // 32
                                                                                                             // 33
  // console.log(emailProperties)                                                                            // 34
                                                                                                             // 35
  var notificationHtml = getEmailTemplate(template)(emailProperties);                                        // 36
  var html = buildEmailTemplate(notificationHtml);                                                           // 37
                                                                                                             // 38
  return {                                                                                                   // 39
    subject: subject,                                                                                        // 40
    html: html                                                                                               // 41
  }                                                                                                          // 42
};                                                                                                           // 43
                                                                                                             // 44
newPostNotification = function(post, excludedIDs){                                                           // 45
  var excludedIDs = typeof excludedIDs == 'undefined' ? [] : excludedIDs;                                    // 46
  var p = getPostProperties(post);                                                                           // 47
  var subject = p.postAuthorName+' has created a new post: '+p.postTitle;                                    // 48
  var html = buildEmailTemplate(getEmailTemplate('emailNewPost')(p));                                        // 49
                                                                                                             // 50
  // send a notification to every user according to their notifications settings                             // 51
  Meteor.users.find({'profile.notifications.posts': 1}).forEach(function(user) {                             // 52
    // don't send user a notification if their ID is in excludedIDs                                          // 53
    if(excludedIDs.indexOf(user._id) == -1)                                                                  // 54
      sendEmail(getEmail(user), subject, html);                                                              // 55
  });                                                                                                        // 56
};                                                                                                           // 57
                                                                                                             // 58
Meteor.methods({                                                                                             // 59
  unsubscribeUser : function(hash){                                                                          // 60
    // TO-DO: currently, if you have somebody's email you can unsubscribe them                               // 61
    // A user-specific salt should be added to the hashing method to prevent this                            // 62
    var user = Meteor.users.findOne({email_hash: hash});                                                     // 63
    if(user){                                                                                                // 64
      var update = Meteor.users.update(user._id, {                                                           // 65
        $set: {                                                                                              // 66
          'profile.notifications.users' : 0,                                                                 // 67
          'profile.notifications.posts' : 0,                                                                 // 68
          'profile.notifications.comments' : 0,                                                              // 69
          'profile.notifications.replies' : 0                                                                // 70
        }                                                                                                    // 71
      });                                                                                                    // 72
      return true;                                                                                           // 73
    }                                                                                                        // 74
    return false;                                                                                            // 75
  }                                                                                                          // 76
});                                                                                                          // 77
                                                                                                             // 78
                                                                                                             // 79
///////////////////////////////////////////////////////////////////////////////////////////////////////////////

}).call(this);






(function () {

///////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                           //
// packages/telescope-notifications/lib/server/publication.js                                                //
//                                                                                                           //
///////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                             //
Meteor.publish('notifications', function() {                                                                 // 1
  // only publish notifications belonging to the current user                                                // 2
  if(canViewById(this.userId)){                                                                              // 3
    return Notifications.find({userId:this.userId});                                                         // 4
  }                                                                                                          // 5
  return [];                                                                                                 // 6
});                                                                                                          // 7
///////////////////////////////////////////////////////////////////////////////////////////////////////////////

}).call(this);


/* Exports */
if (typeof Package === 'undefined') Package = {};
Package['telescope-notifications'] = {
  Notifications: Notifications,
  createNotification: createNotification,
  buildSiteNotification: buildSiteNotification,
  newPostNotification: newPostNotification,
  buildEmailNotification: buildEmailNotification,
  getUnsubscribeLink: getUnsubscribeLink,
  postSubmitMethodCallbacks: postSubmitMethodCallbacks
};

})();
