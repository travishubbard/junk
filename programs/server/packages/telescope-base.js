(function () {

/* Imports */
var Meteor = Package.meteor.Meteor;
var i18n = Package['telescope-i18n'].i18n;
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
var adminNav, viewNav, addToPostSchema, addToCommentsSchema, addToSettingsSchema, preloadSubscriptions, primaryNav, secondaryNav, viewParameters, footerModules, heroModules, postModules, postHeading, postMeta, modulePositions, postSubmitRenderedCallbacks, postSubmitClientCallbacks, postSubmitMethodCallbacks, postAfterSubmitMethodCallbacks, postEditRenderedCallbacks, postEditClientCallbacks, postEditMethodCallbacks, postAfterEditMethodCallbacks, commentSubmitRenderedCallbacks, commentSubmitClientCallbacks, commentSubmitMethodCallbacks, commentAfterSubmitMethodCallbacks, commentEditRenderedCallbacks, commentEditClientCallbacks, commentEditMethodCallbacks, commentAfterEditMethodCallbacks, getTemplate, templates, themeSettings, postAfterMethodCallbacks;

(function () {

//////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                          //
// packages/telescope-base/lib/base.js                                                      //
//                                                                                          //
//////////////////////////////////////////////////////////////////////////////////////////////
                                                                                            //
// ------------------------------------- Schemas -------------------------------- //        // 1
                                                                                            // 2
// array containing properties to be added to the post/settings/comments schema on startup. // 3
addToPostSchema = [];                                                                       // 4
addToCommentsSchema = [];                                                                   // 5
addToSettingsSchema = [];                                                                   // 6
                                                                                            // 7
// ------------------------------------- Navigation -------------------------------- //     // 8
                                                                                            // 9
                                                                                            // 10
// array containing nav items; initialize with views menu and admin menu                    // 11
primaryNav = ['viewsMenu', 'adminMenu'];                                                    // 12
                                                                                            // 13
secondaryNav = ['userMenu', 'notificationsMenu', 'submitButton'];                           // 14
                                                                                            // 15
// array containing items in the admin menu                                                 // 16
adminNav = [];                                                                              // 17
                                                                                            // 18
// array containing items in the views menu                                                 // 19
viewNav = [                                                                                 // 20
  {                                                                                         // 21
    route: 'posts_top',                                                                     // 22
    label: 'Top'                                                                            // 23
  },                                                                                        // 24
  {                                                                                         // 25
    route: 'posts_new',                                                                     // 26
    label: 'New'                                                                            // 27
  },                                                                                        // 28
  {                                                                                         // 29
    route: 'posts_best',                                                                    // 30
    label: 'Best'                                                                           // 31
  },                                                                                        // 32
  {                                                                                         // 33
    route: 'posts_digest',                                                                  // 34
    label: 'Digest'                                                                         // 35
  }                                                                                         // 36
];                                                                                          // 37
                                                                                            // 38
// ------------------------------------- Views -------------------------------- //          // 39
                                                                                            // 40
                                                                                            // 41
// object containing post list view parameters                                              // 42
viewParameters = {}                                                                         // 43
                                                                                            // 44
viewParameters.top = function (terms) {                                                     // 45
  return {                                                                                  // 46
    options: {sort: {sticky: -1, score: -1}}                                                // 47
  };                                                                                        // 48
}                                                                                           // 49
                                                                                            // 50
viewParameters.new = function (terms) {                                                     // 51
  return {                                                                                  // 52
    options: {sort: {sticky: -1, postedAt: -1}}                                             // 53
  };                                                                                        // 54
}                                                                                           // 55
                                                                                            // 56
viewParameters.best = function (terms) {                                                    // 57
  return {                                                                                  // 58
    options: {sort: {sticky: -1, baseScore: -1}}                                            // 59
  };                                                                                        // 60
}                                                                                           // 61
                                                                                            // 62
viewParameters.pending = function (terms) {                                                 // 63
  return {                                                                                  // 64
    find: {status: 1},                                                                      // 65
    options: {sort: {createdAt: -1}}                                                        // 66
  };                                                                                        // 67
}                                                                                           // 68
                                                                                            // 69
viewParameters.digest = function (terms) {                                                  // 70
  return {                                                                                  // 71
    find: {                                                                                 // 72
      postedAt: {                                                                           // 73
        $gte: terms.after,                                                                  // 74
        $lt: terms.before                                                                   // 75
      }                                                                                     // 76
    },                                                                                      // 77
    options: {                                                                              // 78
      sort: {sticky: -1, baseScore: -1, limit: 0}                                           // 79
    }                                                                                       // 80
  };                                                                                        // 81
}                                                                                           // 82
                                                                                            // 83
                                                                                            // 84
heroModules = [];                                                                           // 85
                                                                                            // 86
footerModules = [];                                                                         // 87
                                                                                            // 88
// array containing post modules                                                            // 89
modulePositions = [                                                                         // 90
  'left-left',                                                                              // 91
  'left-center',                                                                            // 92
  'left-right',                                                                             // 93
  'center-left',                                                                            // 94
  'center-center',                                                                          // 95
  'center-right',                                                                           // 96
  'right-left',                                                                             // 97
  'right-center',                                                                           // 98
  'right-right'                                                                             // 99
];                                                                                          // 100
                                                                                            // 101
postModules = [                                                                             // 102
  {                                                                                         // 103
    template: 'postUpvote',                                                                 // 104
    position: 'left-left'                                                                   // 105
  },                                                                                        // 106
  {                                                                                         // 107
    template: 'postActions',                                                                // 108
    position: 'left-right'                                                                  // 109
  },                                                                                        // 110
  {                                                                                         // 111
    template: 'postContent',                                                                // 112
    position: 'center-center'                                                               // 113
  },                                                                                        // 114
  {                                                                                         // 115
    template: 'postDiscuss',                                                                // 116
    position: 'right-right'                                                                 // 117
  }                                                                                         // 118
];                                                                                          // 119
                                                                                            // 120
postHeading = [                                                                             // 121
  {                                                                                         // 122
    template: 'postTitle',                                                                  // 123
    order: 1                                                                                // 124
  },                                                                                        // 125
  {                                                                                         // 126
    template: 'postDomain',                                                                 // 127
    order: 5                                                                                // 128
  }                                                                                         // 129
]                                                                                           // 130
                                                                                            // 131
postMeta = [                                                                                // 132
  {                                                                                         // 133
    template: 'postInfo',                                                                   // 134
    order: 1                                                                                // 135
  },                                                                                        // 136
  {                                                                                         // 137
    template: 'postCommentsLink',                                                           // 138
    order: 3                                                                                // 139
  },                                                                                        // 140
  {                                                                                         // 141
    template: 'postAdmin',                                                                  // 142
    order: 5                                                                                // 143
  }                                                                                         // 144
]                                                                                           // 145
// ------------------------------ Callbacks ------------------------------ //               // 146
                                                                                            // 147
postSubmitRenderedCallbacks = [];                                                           // 148
postSubmitClientCallbacks = [];                                                             // 149
postSubmitMethodCallbacks = [];                                                             // 150
postAfterSubmitMethodCallbacks = [];                                                        // 151
                                                                                            // 152
postEditRenderedCallbacks = [];                                                             // 153
postEditClientCallbacks = [];                                                               // 154
postEditMethodCallbacks = []; // not used yet                                               // 155
postAfterMethodCallbacks = []; // not used yet                                              // 156
                                                                                            // 157
commentSubmitRenderedCallbacks = [];                                                        // 158
commentSubmitClientCallbacks = [];                                                          // 159
commentSubmitMethodCallbacks = [];                                                          // 160
commentAfterSubmitMethodCallbacks = [];                                                     // 161
                                                                                            // 162
commentEditRenderedCallbacks = [];                                                          // 163
commentEditClientCallbacks = [];                                                            // 164
commentEditMethodCallbacks = []; // not used yet                                            // 165
commentAfterEditMethodCallbacks = []; // not used yet                                       // 166
                                                                                            // 167
// ------------------------------ Dynamic Templates ------------------------------ //       // 168
                                                                                            // 169
                                                                                            // 170
templates = {}                                                                              // 171
                                                                                            // 172
getTemplate = function (name) {                                                             // 173
  // if template has been overwritten, return this; else return template name               // 174
  return !!templates[name] ? templates[name] : name;                                        // 175
}                                                                                           // 176
                                                                                            // 177
// ------------------------------ Theme Settings ------------------------------ //          // 178
                                                                                            // 179
themeSettings = {                                                                           // 180
  'useDropdowns': true // whether or not to use dropdown menus in a theme                   // 181
};                                                                                          // 182
                                                                                            // 183
// ------------------------------ Subscriptions ------------------------------ //           // 184
                                                                                            // 185
// array containing subscriptions to be preloaded                                           // 186
preloadSubscriptions = [];                                                                  // 187
//////////////////////////////////////////////////////////////////////////////////////////////

}).call(this);






(function () {

//////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                          //
// packages/telescope-base/lib/base_server.js                                               //
//                                                                                          //
//////////////////////////////////////////////////////////////////////////////////////////////
                                                                                            //
                                                                                            // 1
//////////////////////////////////////////////////////////////////////////////////////////////

}).call(this);


/* Exports */
if (typeof Package === 'undefined') Package = {};
Package['telescope-base'] = {
  adminNav: adminNav,
  viewNav: viewNav,
  addToPostSchema: addToPostSchema,
  addToCommentsSchema: addToCommentsSchema,
  addToSettingsSchema: addToSettingsSchema,
  preloadSubscriptions: preloadSubscriptions,
  primaryNav: primaryNav,
  secondaryNav: secondaryNav,
  viewParameters: viewParameters,
  footerModules: footerModules,
  heroModules: heroModules,
  postModules: postModules,
  postHeading: postHeading,
  postMeta: postMeta,
  modulePositions: modulePositions,
  postSubmitRenderedCallbacks: postSubmitRenderedCallbacks,
  postSubmitClientCallbacks: postSubmitClientCallbacks,
  postSubmitMethodCallbacks: postSubmitMethodCallbacks,
  postAfterSubmitMethodCallbacks: postAfterSubmitMethodCallbacks,
  postEditRenderedCallbacks: postEditRenderedCallbacks,
  postEditClientCallbacks: postEditClientCallbacks,
  postEditMethodCallbacks: postEditMethodCallbacks,
  postAfterEditMethodCallbacks: postAfterEditMethodCallbacks,
  commentSubmitRenderedCallbacks: commentSubmitRenderedCallbacks,
  commentSubmitClientCallbacks: commentSubmitClientCallbacks,
  commentSubmitMethodCallbacks: commentSubmitMethodCallbacks,
  commentAfterSubmitMethodCallbacks: commentAfterSubmitMethodCallbacks,
  commentEditRenderedCallbacks: commentEditRenderedCallbacks,
  commentEditClientCallbacks: commentEditClientCallbacks,
  commentEditMethodCallbacks: commentEditMethodCallbacks,
  commentAfterEditMethodCallbacks: commentAfterEditMethodCallbacks,
  getTemplate: getTemplate,
  templates: templates,
  themeSettings: themeSettings
};

})();
