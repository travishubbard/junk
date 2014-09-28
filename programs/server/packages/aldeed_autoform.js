(function () {

/* Imports */
var Meteor = Package.meteor.Meteor;
var SimpleSchema = Package['aldeed:simple-schema'].SimpleSchema;
var MongoObject = Package['aldeed:simple-schema'].MongoObject;
var check = Package.check.check;
var Match = Package.check.Match;

(function () {

///////////////////////////////////////////////////////////////////////
//                                                                   //
// packages/aldeed:autoform/autoform-common.js                       //
//                                                                   //
///////////////////////////////////////////////////////////////////////
                                                                     //
// Extend the schema options allowed by SimpleSchema                 // 1
SimpleSchema.extendOptions({                                         // 2
  autoform: Match.Optional(Object)                                   // 3
});                                                                  // 4
///////////////////////////////////////////////////////////////////////

}).call(this);


/* Exports */
if (typeof Package === 'undefined') Package = {};
Package['aldeed:autoform'] = {};

})();
