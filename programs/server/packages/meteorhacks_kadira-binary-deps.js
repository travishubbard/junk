(function () {

/* Imports */
var Meteor = Package.meteor.Meteor;

/* Package-scope variables */
var KadiraBinaryDeps;

(function () {

///////////////////////////////////////////////////////////////////////
//                                                                   //
// packages/meteorhacks:kadira-binary-deps/index.js                  //
//                                                                   //
///////////////////////////////////////////////////////////////////////
                                                                     //
KadiraBinaryDeps = {                                                 // 1
  usage: Npm.require('usage')                                        // 2
};                                                                   // 3
///////////////////////////////////////////////////////////////////////

}).call(this);


/* Exports */
if (typeof Package === 'undefined') Package = {};
Package['meteorhacks:kadira-binary-deps'] = {
  KadiraBinaryDeps: KadiraBinaryDeps
};

})();
