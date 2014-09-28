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
var SimpleSchema = Package['aldeed:simple-schema'].SimpleSchema;
var MongoObject = Package['aldeed:simple-schema'].MongoObject;
var MailChimpAPI = Package['mrt:mailchimp'].MailChimpAPI;
var MailChimp = Package['mrt:mailchimp'].MailChimp;
var MailChimpOptions = Package['mrt:mailchimp'].MailChimpOptions;
var SyncedCron = Package['percolatestudio:synced-cron'].SyncedCron;
var Handlebars = Package['cmather:handlebars-server'].Handlebars;
var OriginalHandlebars = Package['cmather:handlebars-server'].OriginalHandlebars;
var Async = Package['meteorhacks:async'].Async;

/* Package-scope variables */
var campaignSchema, Campaigns, defaultFrequency, defaultPosts, getCampaignPosts, buildCampaign, scheduleNextCampaign, Later, getSchedule, getNextCampaignSchedule, scheduleCampaign, addToMailChimpList, syncAddToMailChimpList, Handlebars;

(function () {

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                //
// packages/telescope-newsletter/lib/newsletter.js                                                                //
//                                                                                                                //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                  //
campaignSchema = new SimpleSchema({                                                                               // 1
 _id: {                                                                                                           // 2
    type: String,                                                                                                 // 3
    optional: true                                                                                                // 4
  },                                                                                                              // 5
  createdAt: {                                                                                                    // 6
    type: Date,                                                                                                   // 7
    optional: true                                                                                                // 8
  },                                                                                                              // 9
  sentAt: {                                                                                                       // 10
    type: String,                                                                                                 // 11
    optional: true                                                                                                // 12
  },                                                                                                              // 13
  status: {                                                                                                       // 14
    type: String,                                                                                                 // 15
    optional: true                                                                                                // 16
  },                                                                                                              // 17
  posts: {                                                                                                        // 18
    type: [String],                                                                                               // 19
    optional: true                                                                                                // 20
  },                                                                                                              // 21
  webHits: {                                                                                                      // 22
    type: Number,                                                                                                 // 23
    optional: true                                                                                                // 24
  },                                                                                                              // 25
});                                                                                                               // 26
                                                                                                                  // 27
Campaigns = new Meteor.Collection("campaigns", {                                                                  // 28
  schema: campaignSchema                                                                                          // 29
});                                                                                                               // 30
                                                                                                                  // 31
addToPostSchema.push(                                                                                             // 32
  {                                                                                                               // 33
    propertyName: 'scheduledAt',                                                                                  // 34
    propertySchema: {                                                                                             // 35
      type: Date,                                                                                                 // 36
      optional: true                                                                                              // 37
    }                                                                                                             // 38
  }                                                                                                               // 39
);                                                                                                                // 40
                                                                                                                  // 41
// Settings                                                                                                       // 42
                                                                                                                  // 43
// note for next two fields: need to add a way to tell app not to publish field to client except for admins       // 44
                                                                                                                  // 45
var showBanner = {                                                                                                // 46
  propertyName: 'showBanner',                                                                                     // 47
  propertySchema: {                                                                                               // 48
    type: Boolean,                                                                                                // 49
    optional: true,                                                                                               // 50
    label: 'Show newsletter sign-up banner'                                                                       // 51
  }                                                                                                               // 52
}                                                                                                                 // 53
addToSettingsSchema.push(showBanner);                                                                             // 54
                                                                                                                  // 55
var mailChimpAPIKey = {                                                                                           // 56
  propertyName: 'mailChimpAPIKey',                                                                                // 57
  propertySchema: {                                                                                               // 58
    type: String,                                                                                                 // 59
    optional: true,                                                                                               // 60
  }                                                                                                               // 61
}                                                                                                                 // 62
addToSettingsSchema.push(mailChimpAPIKey);                                                                        // 63
                                                                                                                  // 64
var mailChimpListId = {                                                                                           // 65
  propertyName: 'mailChimpListId',                                                                                // 66
  propertySchema: {                                                                                               // 67
    type: String,                                                                                                 // 68
    optional: true,                                                                                               // 69
  }                                                                                                               // 70
}                                                                                                                 // 71
addToSettingsSchema.push(mailChimpListId);                                                                        // 72
                                                                                                                  // 73
var postsPerNewsletter = {                                                                                        // 74
  propertyName: 'postsPerNewsletter',                                                                             // 75
  propertySchema: {                                                                                               // 76
    type: Number,                                                                                                 // 77
    optional: true                                                                                                // 78
  }                                                                                                               // 79
}                                                                                                                 // 80
addToSettingsSchema.push(postsPerNewsletter);                                                                     // 81
                                                                                                                  // 82
var newsletterFrequency = {                                                                                       // 83
  propertyName: 'newsletterFrequency',                                                                            // 84
  propertySchema: {                                                                                               // 85
    type: Number,                                                                                                 // 86
    optional: true,                                                                                               // 87
    autoform: {                                                                                                   // 88
      options: [                                                                                                  // 89
        {                                                                                                         // 90
          value: 1,                                                                                               // 91
          label: 'Every Day'                                                                                      // 92
        },                                                                                                        // 93
        {                                                                                                         // 94
          value: 2,                                                                                               // 95
          label: 'Mondays, Wednesdays, Fridays'                                                                   // 96
        },                                                                                                        // 97
        {                                                                                                         // 98
          value: 3,                                                                                               // 99
          label: 'Mondays & Thursdays'                                                                            // 100
        },                                                                                                        // 101
        {                                                                                                         // 102
          value: 7,                                                                                               // 103
          label: 'Once a week (Mondays)'                                                                          // 104
        },                                                                                                        // 105
        {                                                                                                         // 106
          value: 0,                                                                                               // 107
          label: "Don't send newsletter"                                                                          // 108
        }                                                                                                         // 109
      ]                                                                                                           // 110
    },                                                                                                            // 111
    label: 'Newsletter Frequency (requires restart)'                                                              // 112
  }                                                                                                               // 113
}                                                                                                                 // 114
addToSettingsSchema.push(newsletterFrequency);                                                                    // 115
                                                                                                                  // 116
// create new "campaign" lens for all posts from the past X days that haven't been scheduled yet                  // 117
viewParameters.campaign = function (terms) {                                                                      // 118
  return {                                                                                                        // 119
    find: {                                                                                                       // 120
      scheduledAt: {$exists: false},                                                                              // 121
      postedAt: {                                                                                                 // 122
        $gte: terms.after                                                                                         // 123
      }                                                                                                           // 124
    },                                                                                                            // 125
    options: {sort: {sticky: -1, score: -1}}                                                                      // 126
  };                                                                                                              // 127
}                                                                                                                 // 128
                                                                                                                  // 129
heroModules.push({                                                                                                // 130
  template: 'newsletterBanner'                                                                                    // 131
});                                                                                                               // 132
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}).call(this);






(function () {

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                //
// packages/telescope-newsletter/lib/server/campaign.js                                                           //
//                                                                                                                //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                  //
defaultFrequency = 7;                                                                                             // 1
defaultPosts = 5;                                                                                                 // 2
                                                                                                                  // 3
getCampaignPosts = function (postsCount) {                                                                        // 4
                                                                                                                  // 5
  var newsletterFrequency = getSetting('newsletterFrequency', defaultFrequency);                                  // 6
                                                                                                                  // 7
  // look for last scheduled campaign in the database                                                             // 8
  var lastCampaign = SyncedCron._collection.findOne({name: 'Schedule newsletter'}, {sort: {finishedAt: -1}, limit: 1});
                                                                                                                  // 10
  // if there is a last campaign use its date, else default to posts from the last 7 days                         // 11
  var lastWeek = moment().subtract(7, 'days').toDate();                                                           // 12
  var after = (typeof lastCampaign != 'undefined') ? lastCampaign.finishedAt : lastWeek                           // 13
                                                                                                                  // 14
  var params = getParameters({                                                                                    // 15
    view: 'campaign',                                                                                             // 16
    limit: postsCount,                                                                                            // 17
    after: after                                                                                                  // 18
  });                                                                                                             // 19
  return Posts.find(params.find, params.options).fetch();                                                         // 20
}                                                                                                                 // 21
                                                                                                                  // 22
buildCampaign = function (postsArray) {                                                                           // 23
  var postsHTML = '', subject = '';                                                                               // 24
                                                                                                                  // 25
  // 1. Iterate through posts and pass each of them through a handlebars template                                 // 26
  postsArray.forEach(function (post, index) {                                                                     // 27
    if(index > 0)                                                                                                 // 28
      subject += ', ';                                                                                            // 29
                                                                                                                  // 30
    subject += post.title;                                                                                        // 31
                                                                                                                  // 32
    var postUser = Meteor.users.findOne(post.userId);                                                             // 33
                                                                                                                  // 34
    // the naked post object as stored in the database is missing a few properties, so let's add them             // 35
    var properties = _.extend(post, {                                                                             // 36
      authorName: getAuthorName(post),                                                                            // 37
      postLink: getPostLink(post),                                                                                // 38
      profileUrl: getProfileUrl(postUser),                                                                        // 39
      postPageLink: getPostPageUrl(post),                                                                         // 40
      date: moment(post.postedAt).format("MMMM D YYYY")                                                           // 41
    });                                                                                                           // 42
                                                                                                                  // 43
    if (post.body)                                                                                                // 44
      properties.body = marked(trimWords(post.body, 20)).replace('<p>', '').replace('</p>', ''); // remove p tags // 45
                                                                                                                  // 46
    if(post.url)                                                                                                  // 47
      properties.domain = getDomain(post.url)                                                                     // 48
                                                                                                                  // 49
    postsHTML += getEmailTemplate('emailPostItem')(properties);                                                   // 50
  });                                                                                                             // 51
                                                                                                                  // 52
  // 2. Wrap posts HTML in digest template                                                                        // 53
  var digestHTML = getEmailTemplate('emailDigest')({                                                              // 54
    siteName: getSetting('title'),                                                                                // 55
    date: moment().format("dddd, MMMM Do YYYY"),                                                                  // 56
    content: postsHTML                                                                                            // 57
  });                                                                                                             // 58
                                                                                                                  // 59
  // 3. wrap digest HTML in email wrapper tempalte                                                                // 60
  var emailHTML = buildEmailTemplate(digestHTML);                                                                 // 61
                                                                                                                  // 62
  return {                                                                                                        // 63
    postIds: _.pluck(postsArray, '_id'),                                                                          // 64
    subject: trimWords(subject, 15),                                                                              // 65
    html: emailHTML                                                                                               // 66
  }                                                                                                               // 67
}                                                                                                                 // 68
                                                                                                                  // 69
scheduleNextCampaign = function (isTest) {                                                                        // 70
  var isTest = typeof isTest === 'undefined' ? false : isTest;                                                    // 71
  var posts = getCampaignPosts(getSetting('postsPerNewsletter', defaultPosts));                                   // 72
  if(!!posts.length){                                                                                             // 73
    return scheduleCampaign(buildCampaign(posts), isTest);                                                        // 74
  }else{                                                                                                          // 75
    var result = 'No posts to schedule today…';                                                                   // 76
    console.log(result)                                                                                           // 77
    return result                                                                                                 // 78
  }                                                                                                               // 79
}                                                                                                                 // 80
                                                                                                                  // 81
Meteor.methods({                                                                                                  // 82
  testCampaign: function () {                                                                                     // 83
    if(isAdminById(this.userId))                                                                                  // 84
      scheduleNextCampaign(true);                                                                                 // 85
  }                                                                                                               // 86
});                                                                                                               // 87
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}).call(this);






(function () {

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                //
// packages/telescope-newsletter/lib/server/cron.js                                                               //
//                                                                                                                //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                  //
Later = Npm.require('later');                                                                                     // 1
                                                                                                                  // 2
defaultFrequency = 7; // once a week                                                                              // 3
                                                                                                                  // 4
getSchedule = function (parser) {                                                                                 // 5
  var frequency = getSetting('newsletterFrequency', defaultFrequency);                                            // 6
  console.log(frequency)                                                                                          // 7
  switch (frequency) {                                                                                            // 8
    case 1: // every day                                                                                          // 9
    // sched = {schedules: [{dw: [1,2,3,4,5,6,0]}]};                                                              // 10
    return parser.recur().on(1,2,3,4,5,6,0).dayOfWeek();                                                          // 11
                                                                                                                  // 12
    case 2: // Mondays, Wednesdays, Fridays                                                                       // 13
    // sched = {schedules: [{dw: [2,4,6]}]};                                                                      // 14
    return parser.recur().on(2,4,6).dayOfWeek();                                                                  // 15
                                                                                                                  // 16
    case 3: // Mondays, Thursdays                                                                                 // 17
    // sched = {schedules: [{dw: [2,5]}]};                                                                        // 18
    return parser.recur().on(2,5).dayOfWeek();                                                                    // 19
                                                                                                                  // 20
    case 7: // Once a week (Mondays)                                                                              // 21
    // sched = {schedules: [{dw: [2]}]};                                                                          // 22
    return parser.recur().on(2).dayOfWeek();                                                                      // 23
                                                                                                                  // 24
    default: // Don't send                                                                                        // 25
    return null;                                                                                                  // 26
  }                                                                                                               // 27
}                                                                                                                 // 28
                                                                                                                  // 29
SyncedCron.getNext = function (jobName) {                                                                         // 30
  var scheduledAt;                                                                                                // 31
  try {                                                                                                           // 32
    this._entries.some(function(entry) {                                                                          // 33
      if(entry.name === jobName){                                                                                 // 34
        var schedule = entry.schedule(Later.parse);                                                               // 35
        scheduledAt = Later.schedule(schedule).next(1);                                                           // 36
        return true;                                                                                              // 37
      }                                                                                                           // 38
    });                                                                                                           // 39
  }                                                                                                               // 40
  catch (error) {                                                                                                 // 41
    console.log(error)                                                                                            // 42
    scheduledAt = 'No job scheduled';                                                                             // 43
  }                                                                                                               // 44
  return scheduledAt;                                                                                             // 45
}                                                                                                                 // 46
                                                                                                                  // 47
getNextCampaignSchedule = function () {                                                                           // 48
  return SyncedCron.getNext('Schedule newsletter');                                                               // 49
}                                                                                                                 // 50
                                                                                                                  // 51
SyncedCron.add({                                                                                                  // 52
  name: 'Schedule newsletter',                                                                                    // 53
  schedule: function(parser) {                                                                                    // 54
    // parser is a later.parse object                                                                             // 55
    // var sched;                                                                                                 // 56
    return getSchedule(parser)                                                                                    // 57
                                                                                                                  // 58
  },                                                                                                              // 59
  job: function() {                                                                                               // 60
    scheduleNextCampaign();                                                                                       // 61
  }                                                                                                               // 62
});                                                                                                               // 63
                                                                                                                  // 64
Meteor.startup(function() {                                                                                       // 65
  if(getSetting('newsletterFrequency', defaultFrequency) != 0) {                                                  // 66
    SyncedCron.start();                                                                                           // 67
  };                                                                                                              // 68
});                                                                                                               // 69
                                                                                                                  // 70
Meteor.methods({                                                                                                  // 71
  getNextJob: function (jobName) {                                                                                // 72
    var nextJob = getNextCampaignSchedule();                                                                      // 73
    console.log(nextJob);                                                                                         // 74
    return nextJob;                                                                                               // 75
  }                                                                                                               // 76
});                                                                                                               // 77
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}).call(this);






(function () {

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                //
// packages/telescope-newsletter/lib/server/mailchimp.js                                                          //
//                                                                                                                //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                  //
scheduleCampaign = function (campaign, isTest) {                                                                  // 1
  var isTest = typeof isTest === 'undefined' ? false : isTest;                                                    // 2
                                                                                                                  // 3
  MailChimpOptions.apiKey = getSetting('mailChimpAPIKey');                                                        // 4
  MailChimpOptions.listId = getSetting('mailChimpListId');                                                        // 5
                                                                                                                  // 6
  var htmlToText = Npm.require('html-to-text');                                                                   // 7
  var text = htmlToText.fromString(campaign.html, {                                                               // 8
      wordwrap: 130                                                                                               // 9
  });                                                                                                             // 10
  var defaultEmail = getSetting('defaultEmail');                                                                  // 11
  var result= '';                                                                                                 // 12
                                                                                                                  // 13
  if(!!MailChimpOptions.apiKey && !!MailChimpOptions.listId){                                                     // 14
                                                                                                                  // 15
    console.log( 'Creating campaign…');                                                                           // 16
                                                                                                                  // 17
    try {                                                                                                         // 18
        var api = new MailChimp();                                                                                // 19
    } catch ( error ) {                                                                                           // 20
        console.log( error.message );                                                                             // 21
    }                                                                                                             // 22
                                                                                                                  // 23
    api.call( 'campaigns', 'create', {                                                                            // 24
      type: 'regular',                                                                                            // 25
      options: {                                                                                                  // 26
        list_id: MailChimpOptions.listId,                                                                         // 27
        subject: campaign.subject,                                                                                // 28
        from_email: getSetting('defaultEmail'),                                                                   // 29
        from_name: getSetting('title')+ ' Top Posts',                                                             // 30
      },                                                                                                          // 31
      content: {                                                                                                  // 32
        html: campaign.html,                                                                                      // 33
        text: text                                                                                                // 34
      }                                                                                                           // 35
    }, Meteor.bindEnvironment(function ( error, result ) {                                                        // 36
      if ( error ) {                                                                                              // 37
        console.log( error.message );                                                                             // 38
        result = error.message;                                                                                   // 39
      } else {                                                                                                    // 40
        console.log( 'Campaign created');                                                                         // 41
        // console.log( JSON.stringify( result ) );                                                               // 42
                                                                                                                  // 43
        var cid = result.id;                                                                                      // 44
        var archive_url = result.archive_url;                                                                     // 45
        var scheduledTime = moment().zone(0).add('hours', 1).format("YYYY-MM-DD HH:mm:ss");                       // 46
                                                                                                                  // 47
        api.call('campaigns', 'schedule', {                                                                       // 48
          cid: cid,                                                                                               // 49
          schedule_time: scheduledTime                                                                            // 50
        }, Meteor.bindEnvironment(function ( error, result) {                                                     // 51
          if (error) {                                                                                            // 52
            console.log( error.message );                                                                         // 53
            result = error.message;                                                                               // 54
          }else{                                                                                                  // 55
            console.log('Campaign scheduled for '+scheduledTime);                                                 // 56
            console.log(campaign.subject)                                                                         // 57
            // console.log( JSON.stringify( result ) );                                                           // 58
                                                                                                                  // 59
            // if this is not a test, mark posts as sent                                                          // 60
            if (!isTest)                                                                                          // 61
              Posts.update({_id: {$in: campaign.postIds}}, {$set: {scheduledAt: new Date()}}, {multi: true})      // 62
                                                                                                                  // 63
            // send confirmation email                                                                            // 64
            var confirmationHtml = getEmailTemplate('emailDigestConfirmation')({                                  // 65
              time: scheduledTime,                                                                                // 66
              newsletterLink: archive_url,                                                                        // 67
              subject: campaign.subject                                                                           // 68
            });                                                                                                   // 69
            sendEmail(defaultEmail, 'Newsletter scheduled', buildEmailTemplate(confirmationHtml));                // 70
            result = campaign.subject;                                                                            // 71
          }                                                                                                       // 72
        }));                                                                                                      // 73
      }                                                                                                           // 74
    }));                                                                                                          // 75
  }                                                                                                               // 76
  return result;                                                                                                  // 77
}                                                                                                                 // 78
                                                                                                                  // 79
addToMailChimpList = function(userOrEmail, confirm, done){                                                        // 80
  var user, email;                                                                                                // 81
                                                                                                                  // 82
  if(typeof userOrEmail == "string"){                                                                             // 83
    user = null;                                                                                                  // 84
    email = userOrEmail;                                                                                          // 85
  }else if(typeof userOrEmail == "object"){                                                                       // 86
    user = userOrEmail;                                                                                           // 87
    email = getEmail(user);                                                                                       // 88
    if (!email)                                                                                                   // 89
      throw 'User must have an email address';                                                                    // 90
  }                                                                                                               // 91
                                                                                                                  // 92
  MailChimpOptions.apiKey = getSetting('mailChimpAPIKey');                                                        // 93
  MailChimpOptions.listId = getSetting('mailChimpListId');                                                        // 94
  // add a user to a MailChimp list.                                                                              // 95
  // called when a new user is created, or when an existing user fills in their email                             // 96
  if(!!MailChimpOptions.apiKey && !!MailChimpOptions.listId){                                                     // 97
                                                                                                                  // 98
    console.log('adding "'+email+'" to MailChimp list…');                                                         // 99
                                                                                                                  // 100
    try {                                                                                                         // 101
        var api = new MailChimp();                                                                                // 102
    } catch ( error ) {                                                                                           // 103
        console.log( error.message );                                                                             // 104
    }                                                                                                             // 105
                                                                                                                  // 106
    api.call( 'lists', 'subscribe', {                                                                             // 107
      id: MailChimpOptions.listId,                                                                                // 108
      email: {"email": email},                                                                                    // 109
      double_optin: confirm                                                                                       // 110
    }, Meteor.bindEnvironment(function ( error, result ) {                                                        // 111
      if ( error ) {                                                                                              // 112
        console.log( error.message );                                                                             // 113
        done(error, null);                                                                                        // 114
      } else {                                                                                                    // 115
        console.log( JSON.stringify( result ) );                                                                  // 116
        if(!!user)                                                                                                // 117
          setUserSetting('subscribedToNewsletter', true, user);                                                   // 118
        done(null, result);                                                                                       // 119
      }                                                                                                           // 120
    }));                                                                                                          // 121
  }                                                                                                               // 122
                                                                                                                  // 123
};                                                                                                                // 124
                                                                                                                  // 125
syncAddToMailChimpList = Async.wrap(addToMailChimpList);                                                          // 126
                                                                                                                  // 127
Meteor.methods({                                                                                                  // 128
  addCurrentUserToMailChimpList: function(){                                                                      // 129
    var currentUser = Meteor.users.findOne(this.userId);                                                          // 130
    try {                                                                                                         // 131
      return syncAddToMailChimpList(currentUser, false);                                                          // 132
    } catch (error) {                                                                                             // 133
      throw new Meteor.Error(500, error.message);                                                                 // 134
    }                                                                                                             // 135
  },                                                                                                              // 136
  addEmailToMailChimpList: function (email) {                                                                     // 137
    try {                                                                                                         // 138
      return syncAddToMailChimpList(email, true);                                                                 // 139
    } catch (error) {                                                                                             // 140
      throw new Meteor.Error(500, error.message);                                                                 // 141
    }                                                                                                             // 142
  }                                                                                                               // 143
})                                                                                                                // 144
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}).call(this);






(function () {

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                //
// packages/telescope-newsletter/lib/server/routes.js                                                             //
//                                                                                                                //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                  //
                                                                                                                  // 1
Meteor.startup(function () {                                                                                      // 2
                                                                                                                  // 3
  Router.map(function() {                                                                                         // 4
                                                                                                                  // 5
    this.route('campaign', {                                                                                      // 6
      where: 'server',                                                                                            // 7
      path: '/email/campaign',                                                                                    // 8
      action: function() {                                                                                        // 9
        var campaign = buildCampaign(getCampaignPosts(getSetting('postsPerNewsletter', 5)));                      // 10
        var campaignSubject = '<div class="campaign-subject"><strong>Subject:</strong> '+campaign.subject+' (note: contents might change)</div>';
        var campaignSchedule = '<div class="campaign-schedule"><strong>Scheduled for:</strong> '+getNextCampaignSchedule()+'</div>';
                                                                                                                  // 13
        this.response.write(campaignSubject+campaignSchedule+campaign.html);                                      // 14
        this.response.end();                                                                                      // 15
      }                                                                                                           // 16
    });                                                                                                           // 17
                                                                                                                  // 18
    this.route('digestConfirmation', {                                                                            // 19
      where: 'server',                                                                                            // 20
      path: '/email/digest-confirmation',                                                                         // 21
      action: function() {                                                                                        // 22
        var confirmationHtml = getEmailTemplate('emailDigestConfirmation')({                                      // 23
          time: 'January 1st, 1901',                                                                              // 24
          newsletterLink: 'http://example.com',                                                                   // 25
          subject: 'Lorem ipsum dolor sit amet'                                                                   // 26
        });                                                                                                       // 27
        this.response.write(buildEmailTemplate(confirmationHtml));                                                // 28
        this.response.end();                                                                                      // 29
      }                                                                                                           // 30
    });                                                                                                           // 31
                                                                                                                  // 32
  });                                                                                                             // 33
                                                                                                                  // 34
});                                                                                                               // 35
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}).call(this);






(function () {

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                //
// packages/telescope-newsletter/lib/server/templates/handlebars.emailDigest.js                                   //
//                                                                                                                //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                  //
Handlebars = Handlebars || {};Handlebars.templates = Handlebars.templates || {} ;var template = OriginalHandlebars.compile("<style type=\"text/css\">\n  .email-digest{\n  }\n  .digest-date{\n    color: #999;\n    font-weight: normal;\n    font-size: 16px;\n  }\n  .post-item{\n    border-top: 1px solid #ddd;\n  }\n  .post-date{\n    font-size: 13px;\n    color: #999;\n  }\n  .post-title{\n    font-size: 18px;\n    line-height: 1.6;\n  }\n  .post-thumbnail{\n  }\n  .post-meta{\n    font-size: 13px;\n    color: #999;\n    margin: 5px 0;\n  }\n  .post-meta a{\n    color: #333;\n  }  \n  .post-domain{\n    font-weight: bold;\n  }\n  .post-body-excerpt{\n    font-size: 14px;\n  }\n  .post-body-excerpt p{\n    margin: 0;\n  }\n</style>\n\n<span class=\"heading\">Recently on {{siteName}}</span>\n<span class=\"digest-date\">– {{date}}</span>\n<br><br>\n\n<div class=\"email-digest\">\n  {{{content}}}\n</div>\n<br>");Handlebars.templates["emailDigest"] = function (data, partials) { partials = (partials || {});return template(data || {}, { helpers: OriginalHandlebars.helpers,partials: partials,name: "emailDigest"});};
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}).call(this);






(function () {

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                //
// packages/telescope-newsletter/lib/server/templates/handlebars.emailDigestConfirmation.js                       //
//                                                                                                                //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                  //
Handlebars = Handlebars || {};Handlebars.templates = Handlebars.templates || {} ;var template = OriginalHandlebars.compile("<span class=\"heading\">Newsletter scheduled for {{time}}</span><br><br>\n\n<a href=\"{{newsletterLink}}\">{{subject}}</a><br><br>");Handlebars.templates["emailDigestConfirmation"] = function (data, partials) { partials = (partials || {});return template(data || {}, { helpers: OriginalHandlebars.helpers,partials: partials,name: "emailDigestConfirmation"});};
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}).call(this);






(function () {

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                //
// packages/telescope-newsletter/lib/server/templates/handlebars.emailPostItem.js                                 //
//                                                                                                                //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                  //
Handlebars = Handlebars || {};Handlebars.templates = Handlebars.templates || {} ;var template = OriginalHandlebars.compile("<div class=\"post-item\">\n<br >\n\n<span class=\"post-title\">\n  {{#if thumbnailUrl}}\n    <img class=\"post-thumbnail\" src=\"{{thumbnailUrl}}\"/>&nbsp;\n  {{/if}}\n\n  <a href=\"{{postLink}}\" target=\"_blank\">{{title}}</a>\n</span>\n\n<div class=\"post-meta\">\n  {{#if domain}}\n    <a class=\"post-domain\" href=\"\">{{domain}}</a>\n    | \n  {{/if}}\n  <span class=\"post-submitted\">Submitted by <a href=\"{{profileUrl}}\" class=\"comment-link\" target=\"_blank\">{{authorName}}</a></span>\n  <span class=\"post-date\">on {{date}}</span>\n  |\n  <a href=\"{{postPageLink}}\" class=\"comment-link\" target=\"_blank\">{{comments}} Comments</a>\n</div>\n\n\n{{#if body}}\n  <div class=\"post-body-excerpt\">\n    {{{body}}}\n    <a href=\"{{postPageLink}}\" class=\"comment-link\" target=\"_blank\">Read more</a>\n  </div>\n{{/if}}\n\n\n<br>\n</div>\n\n");Handlebars.templates["emailPostItem"] = function (data, partials) { partials = (partials || {});return template(data || {}, { helpers: OriginalHandlebars.helpers,partials: partials,name: "emailPostItem"});};
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}).call(this);


/* Exports */
if (typeof Package === 'undefined') Package = {};
Package['telescope-newsletter'] = {};

})();
