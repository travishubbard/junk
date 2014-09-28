(function () {

/* Imports */
var Meteor = Package.meteor.Meteor;
var Handlebars = Package['cmather:handlebars-server'].Handlebars;
var OriginalHandlebars = Package['cmather:handlebars-server'].OriginalHandlebars;

/* Package-scope variables */
var buildEmailTemplate, sendEmail, buildAndSendEmail, getEmailTemplate, Handlebars;

(function () {

///////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                           //
// packages/telescope-email/lib/server/email.js                                              //
//                                                                                           //
///////////////////////////////////////////////////////////////////////////////////////////////
                                                                                             //
                                                                                             // 1
var htmlToText = Npm.require('html-to-text');                                                // 2
                                                                                             // 3
getEmailTemplate = function (template) {                                                     // 4
  return Handlebars.templates[getTemplate(template)];                                        // 5
}                                                                                            // 6
                                                                                             // 7
buildEmailTemplate = function (htmlContent) {                                                // 8
                                                                                             // 9
  var emailProperties = {                                                                    // 10
    headerColor: getSetting('headerColor', '#444444'),                                       // 11
    buttonColor: getSetting('buttonColor', '#DD3416'),                                       // 12
    siteName: getSetting('title'),                                                           // 13
    tagline: getSetting('tagline'),                                                          // 14
    siteUrl: getSiteUrl(),                                                                   // 15
    body: htmlContent,                                                                       // 16
    unsubscribe: '',                                                                         // 17
    accountLink: getSiteUrl()+'account',                                                     // 18
    footer: getSetting('emailFooter'),                                                       // 19
    logoUrl: getSetting('logoUrl'),                                                          // 20
    logoHeight: getSetting('logoHeight'),                                                    // 21
    logoWidth: getSetting('logoWidth')                                                       // 22
  }                                                                                          // 23
                                                                                             // 24
  var emailHTML = Handlebars.templates[getTemplate('emailWrapper')](emailProperties);        // 25
                                                                                             // 26
  var inlinedHTML = Async.runSync(function(done) {                                           // 27
    juice.juiceContent(emailHTML, {                                                          // 28
      url: getSiteUrl(),                                                                     // 29
      removeStyleTags: false                                                                 // 30
    }, function (error, result) {                                                            // 31
      done(null, result);                                                                    // 32
    });                                                                                      // 33
  }).result;                                                                                 // 34
                                                                                             // 35
  var doctype = '<!DOCTYPE html PUBLIC "-//W3C//DTD HTML 4.01 Transitional//EN" "http://www.w3.org/TR/html4/loose.dtd">'
                                                                                             // 37
  return doctype+inlinedHTML;                                                                // 38
}                                                                                            // 39
                                                                                             // 40
sendEmail = function(to, subject, html, text){                                               // 41
                                                                                             // 42
  // TODO: limit who can send emails                                                         // 43
  // TODO: fix this error: Error: getaddrinfo ENOTFOUND                                      // 44
                                                                                             // 45
  var from = getSetting('defaultEmail', 'noreply@example.com');                              // 46
  var siteName = getSetting('title');                                                        // 47
  var subject = '['+siteName+'] '+subject;                                                   // 48
                                                                                             // 49
  if (typeof text == 'undefined'){                                                           // 50
    // Auto-generate text version if it doesn't exist. Has bugs, but should be good enough.  // 51
    var text = htmlToText.fromString(html, {                                                 // 52
        wordwrap: 130                                                                        // 53
    });                                                                                      // 54
  }                                                                                          // 55
                                                                                             // 56
  console.log('//////// sending email…');                                                    // 57
  console.log('from: '+from);                                                                // 58
  console.log('to: '+to);                                                                    // 59
  console.log('subject: '+subject);                                                          // 60
  // console.log('html: '+html);                                                             // 61
  // console.log('text: '+text);                                                             // 62
                                                                                             // 63
  var email = {                                                                              // 64
    from: from,                                                                              // 65
    to: to,                                                                                  // 66
    subject: subject,                                                                        // 67
    text: text,                                                                              // 68
    html: html                                                                               // 69
  }                                                                                          // 70
                                                                                             // 71
  Email.send(email);                                                                         // 72
                                                                                             // 73
  return email;                                                                              // 74
};                                                                                           // 75
                                                                                             // 76
buildAndSendEmail = function (to, subject, template, properties) {                           // 77
  var html = buildEmailTemplate(getEmailTemplate(template)(properties));                     // 78
  return sendEmail (to, subject, html);                                                      // 79
}                                                                                            // 80
                                                                                             // 81
Meteor.methods({                                                                             // 82
  testEmail: function () {                                                                   // 83
    console.log(Handlebars.templates)                                                        // 84
    if(isAdminById(this.userId)){                                                            // 85
      var email = buildAndSendEmail (getSetting('defaultEmail'), 'Telescope email test', 'emailTest', {date: new Date()});
      console.log(email);                                                                    // 87
    }                                                                                        // 88
  }                                                                                          // 89
})                                                                                           // 90
///////////////////////////////////////////////////////////////////////////////////////////////

}).call(this);






(function () {

///////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                           //
// packages/telescope-email/lib/server/templates/handlebars.emailAccountApproved.js          //
//                                                                                           //
///////////////////////////////////////////////////////////////////////////////////////////////
                                                                                             //
Handlebars = Handlebars || {};Handlebars.templates = Handlebars.templates || {} ;var template = OriginalHandlebars.compile("<span class=\"heading\">{{username}}, welcome to {{siteTitle}}!</span><br><br>\n\nYou've just been invited. <a href=\"{{siteUrl}}\">Start posting</a>.<br><br>");Handlebars.templates["emailAccountApproved"] = function (data, partials) { partials = (partials || {});return template(data || {}, { helpers: OriginalHandlebars.helpers,partials: partials,name: "emailAccountApproved"});};
///////////////////////////////////////////////////////////////////////////////////////////////

}).call(this);






(function () {

///////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                           //
// packages/telescope-email/lib/server/templates/handlebars.emailInvite.js                   //
//                                                                                           //
///////////////////////////////////////////////////////////////////////////////////////////////
                                                                                             //
Handlebars = Handlebars || {};Handlebars.templates = Handlebars.templates || {} ;var template = OriginalHandlebars.compile("<span class=\"heading\">\n<a href=\"{{profileUrl}}\">{{invitedBy}}</a>\ninvited you to join {{communityName}}\n</span><br><br>\n\n{{#if newUser}}\n<a href=\"{{actionLink}}\">Join {{communityName}}</a>\n{{else}}\n<a href=\"{{actionLink}}\">Sign in to {{communityName}}</a>\n{{/if}}\n<br><br>\n");Handlebars.templates["emailInvite"] = function (data, partials) { partials = (partials || {});return template(data || {}, { helpers: OriginalHandlebars.helpers,partials: partials,name: "emailInvite"});};
///////////////////////////////////////////////////////////////////////////////////////////////

}).call(this);






(function () {

///////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                           //
// packages/telescope-email/lib/server/templates/handlebars.emailNewComment.js               //
//                                                                                           //
///////////////////////////////////////////////////////////////////////////////////////////////
                                                                                             //
Handlebars = Handlebars || {};Handlebars.templates = Handlebars.templates || {} ;var template = OriginalHandlebars.compile("<span class=\"heading\">\n<a href=\"{{profileUrl}}\">{{comment.author}}</a>\nleft a new comment on \n<a href=\"{{postLink}}\" class=\"action-link\">{{post.title}}</a>:\n</span>\n<br/><br/>\n\n<div class=\"comment-body\">\n{{{body}}}\n</div>\n<br>\n\n<a href=\"{{postCommentUrl}}\" class=\"action-link\">Discuss</a><br/><br/>");Handlebars.templates["emailNewComment"] = function (data, partials) { partials = (partials || {});return template(data || {}, { helpers: OriginalHandlebars.helpers,partials: partials,name: "emailNewComment"});};
///////////////////////////////////////////////////////////////////////////////////////////////

}).call(this);






(function () {

///////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                           //
// packages/telescope-email/lib/server/templates/handlebars.emailNewPost.js                  //
//                                                                                           //
///////////////////////////////////////////////////////////////////////////////////////////////
                                                                                             //
Handlebars = Handlebars || {};Handlebars.templates = Handlebars.templates || {} ;var template = OriginalHandlebars.compile("<span class=\"heading\">\n<a href=\"{{profileUrl}}\">{{postAuthorName}}</a>\nhas created a new post:\n{{#if url}}\n  <a href=\"{{linkUrl}}\" class=\"action-link\">{{postTitle}}}</a>\n{{else}}\n  {{postTitle}}}\n{{/if}}\n</span><br><br>\n\n{{#if body}}\n  <div class=\"post-body\">\n  {{{body}}}\n  </div>\n  <br>\n{{/if}}\n\n<a href=\"{{postUrl}}\">Discuss</a><br><br>");Handlebars.templates["emailNewPost"] = function (data, partials) { partials = (partials || {});return template(data || {}, { helpers: OriginalHandlebars.helpers,partials: partials,name: "emailNewPost"});};
///////////////////////////////////////////////////////////////////////////////////////////////

}).call(this);






(function () {

///////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                           //
// packages/telescope-email/lib/server/templates/handlebars.emailNewReply.js                 //
//                                                                                           //
///////////////////////////////////////////////////////////////////////////////////////////////
                                                                                             //
Handlebars = Handlebars || {};Handlebars.templates = Handlebars.templates || {} ;var template = OriginalHandlebars.compile("<span class=\"heading\"><a href=\"{{profileUrl}}\">{{comment.author}}</a>\nhas replied to your comment on\n<a href=\"{{postLink}}\" class=\"action-link\">{{post.title}}</a>:\n</span>\n<br/><br/>\n\n<div class=\"comment-body\">\n{{{body}}}\n</div>\n<br>\n\n<a href=\"{{postCommentUrl}}\" class=\"action-link\">Discuss</a><br/><br/>");Handlebars.templates["emailNewReply"] = function (data, partials) { partials = (partials || {});return template(data || {}, { helpers: OriginalHandlebars.helpers,partials: partials,name: "emailNewReply"});};
///////////////////////////////////////////////////////////////////////////////////////////////

}).call(this);






(function () {

///////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                           //
// packages/telescope-email/lib/server/templates/handlebars.emailNewUser.js                  //
//                                                                                           //
///////////////////////////////////////////////////////////////////////////////////////////////
                                                                                             //
Handlebars = Handlebars || {};Handlebars.templates = Handlebars.templates || {} ;var template = OriginalHandlebars.compile("<span class=\"heading\">A new user account has been created: <a href=\"{{profileUrl}}\">{{username}}</a></span><br><br>");Handlebars.templates["emailNewUser"] = function (data, partials) { partials = (partials || {});return template(data || {}, { helpers: OriginalHandlebars.helpers,partials: partials,name: "emailNewUser"});};
///////////////////////////////////////////////////////////////////////////////////////////////

}).call(this);






(function () {

///////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                           //
// packages/telescope-email/lib/server/templates/handlebars.emailTest.js                     //
//                                                                                           //
///////////////////////////////////////////////////////////////////////////////////////////////
                                                                                             //
Handlebars = Handlebars || {};Handlebars.templates = Handlebars.templates || {} ;var template = OriginalHandlebars.compile("<span class=\"heading\">This is just a test</span><br><br>\n\nSent at {{date}}.<br><br>");Handlebars.templates["emailTest"] = function (data, partials) { partials = (partials || {});return template(data || {}, { helpers: OriginalHandlebars.helpers,partials: partials,name: "emailTest"});};
///////////////////////////////////////////////////////////////////////////////////////////////

}).call(this);






(function () {

///////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                           //
// packages/telescope-email/lib/server/templates/handlebars.emailWrapper.js                  //
//                                                                                           //
///////////////////////////////////////////////////////////////////////////////////////////////
                                                                                             //
Handlebars = Handlebars || {};Handlebars.templates = Handlebars.templates || {} ;var template = OriginalHandlebars.compile("<html lang=\"en\">\n<head>\n    <meta http-equiv=\"Content-Type\" content=\"text/html; charset=UTF-8\">\n    <meta name=\"viewport\" content=\"initial-scale=1.0\">    <!-- So that mobile webkit will display zoomed in -->\n    <meta name=\"format-detection\" content=\"telephone=no\"> <!-- disable auto telephone linking in iOS -->\n\n    <title>{{siteName}}</title>\n    <style type=\"text/css\">\n\n        /* Resets: see reset.css for details */\n        .ReadMsgBody { width: 100%; background-color: #ebebeb;}\n        .ExternalClass {width: 100%; background-color: #ebebeb;}\n        .ExternalClass, .ExternalClass p, .ExternalClass span, .ExternalClass font, .ExternalClass td, .ExternalClass div {line-height:100%;}\n        body {-webkit-text-size-adjust:none; -ms-text-size-adjust:none;}\n        body {margin:0; padding:0;}\n        table {border-spacing:0;}\n        table td {border-collapse:collapse;}\n        .yshortcuts a {border-bottom: none !important;}\n\n\n        /* Constrain email width for small screens */\n        @media screen and (max-width: 600px) {\n            table[class=\"container\"] {\n                width: 95% !important;\n            }\n            .main-container{\n              font-size: 14px !important;\n            }\n        }\n\n        /* Give content more room on mobile */\n        @media screen and (max-width: 480px) {\n            td[class=\"container-padding\"] {\n                padding-left: 12px !important;\n                padding-right: 12px !important;\n            }\n        }\n        a{\n          color: {{buttonColor}};\n          font-weight: bold;\n          text-decoration: none;\n        }\n        .wrapper{\n          padding: 20px 0;\n        }\n        .container{\n          border-radius: 3px;\n        }\n        .heading-container{\n          background: {{headerColor}};\n          padding: 15px;\n          text-align: center;\n          border-radius: 3px 3px 0px 0px;\n        }\n        .heading-container, .logo{\n          text-align: center;\n          color: white;\n          font-family: Helvetica, sans-serif;\n          font-weight: bold;\n          font-size: 20px;          \n        }\n        .main-container{\n          line-height: 1.7;\n          background: white;\n          padding: 0 30px;\n          font-size: 15px;\n          font-family: Helvetica, sans-serif;\n          color: #555;\n        }\n        .heading{\n          font-weight: bold;\n          font-size: 18px;\n          line-height: 1.5;\n          margin: 0;\n        }\n        .footer-container{\n          background: #ddd;\n          font-family: Helvetica, sans-serif;\n          padding: 30px;\n          color: #777;\n          border-radius: 0px 0px 3px 3px;\n          font-size: 13px;\n        }\n        .post-thumbnail{\n          height: 28px;\n          width: 37px;\n          vertical-align: top;\n        }\n        .post-body, .comment-body{\n          border-top: 1px solid #ddd;\n          border-bottom: 1px solid #ddd;\n          padding: 10px 0;\n        }\n    </style>\n</head>\n<body style=\"margin:0; padding:10px 0;\" bgcolor=\"#ebebeb\" leftmargin=\"0\" topmargin=\"0\" marginwidth=\"0\" marginheight=\"0\">\n\n<br>\n\n<!-- 100% wrapper (grey background) -->\n<table border=\"0\" width=\"100%\" height=\"100%\" cellpadding=\"0\" cellspacing=\"0\" bgcolor=\"#ebebeb\">\n  <tr>\n    <td class=\"wrapper\" align=\"center\" valign=\"top\" bgcolor=\"#ebebeb\" style=\"background-color: #ebebeb;\">\n\n      <!-- 600px container (white background) -->\n      <table border=\"0\" width=\"600\" cellpadding=\"0\" cellspacing=\"0\" class=\"container\" bgcolor=\"#ffffff\">\n        <tr>\n          <td class=\"heading-container\">\n            {{#if logoUrl}}\n              <img class=\"logo\" src=\"{{logoUrl}}\" height=\"{{logoHeight}}\" width=\"{{logoWidth}}\" alt=\"{{siteName}}\"/>\n            {{else}}\n              {{siteName}}\n            {{/if}}\n          </td>\n        </tr>\n        <tr>\n          <td class=\"main-container container-padding\" bgcolor=\"#ffffff\">\n            <br>\n\n            {{{body}}}\n\n          </td>\n        </tr>\n        <tr>\n          <td class=\"footer-container\">\n            <a href=\"{{accountLink}}\">Change your notifications settings</a><br/><br/>\n            {{{footer}}}\n          </td>\n        </tr>\n      </table>\n      <!--/600px container -->\n\n    </td>\n  </tr>\n</table>\n<!--/100% wrapper-->\n<br>\n<br>\n</body>\n</html>\n");Handlebars.templates["emailWrapper"] = function (data, partials) { partials = (partials || {});return template(data || {}, { helpers: OriginalHandlebars.helpers,partials: partials,name: "emailWrapper"});};
///////////////////////////////////////////////////////////////////////////////////////////////

}).call(this);


/* Exports */
if (typeof Package === 'undefined') Package = {};
Package['telescope-email'] = {
  buildEmailTemplate: buildEmailTemplate,
  sendEmail: sendEmail,
  buildAndSendEmail: buildAndSendEmail,
  getEmailTemplate: getEmailTemplate
};

})();
