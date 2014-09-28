(function () {

/* Imports */
var Meteor = Package.meteor.Meteor;
var KadiraBinaryDeps = Package['meteorhacks:kadira-binary-deps'].KadiraBinaryDeps;
var LocalCollection = Package.minimongo.LocalCollection;
var Minimongo = Package.minimongo.Minimongo;
var DDP = Package.ddp.DDP;
var DDPServer = Package.ddp.DDPServer;
var EJSON = Package.ejson.EJSON;
var _ = Package.underscore._;
var HTTP = Package.http.HTTP;
var Email = Package.email.Email;
var Random = Package.random.Random;
var MongoInternals = Package.mongo.MongoInternals;
var Mongo = Package.mongo.Mongo;

/* Package-scope variables */
var Kadira, Retry, HaveAsyncCallback, UniqueId, DefaultUniqueId, Ntp, WaitTimeBuilder, KadiraModel, MethodsModel, PubsubModel, collectionName, SystemModel, ErrorModel, OplogCheck, TracerStore, wrapSession, wrapSubscription;

(function () {

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                    //
// packages/meteorhacks:kadira/lib/retry.js                                                                           //
//                                                                                                                    //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                      //
// Retry logic with an exponential backoff.                                                                           // 1
//                                                                                                                    // 2
// options:                                                                                                           // 3
//  baseTimeout: time for initial reconnect attempt (ms).                                                             // 4
//  exponent: exponential factor to increase timeout each attempt.                                                    // 5
//  maxTimeout: maximum time between retries (ms).                                                                    // 6
//  minCount: how many times to reconnect "instantly".                                                                // 7
//  minTimeout: time to wait for the first `minCount` retries (ms).                                                   // 8
//  fuzz: factor to randomize retry times by (to avoid retry storms).                                                 // 9
                                                                                                                      // 10
//TODO: remove this class and use Meteor Retry in a later version of meteor.                                          // 11
                                                                                                                      // 12
Retry = function (options) {                                                                                          // 13
  var self = this;                                                                                                    // 14
  _.extend(self, _.defaults(_.clone(options || {}), {                                                                 // 15
    baseTimeout: 1000, // 1 second                                                                                    // 16
    exponent: 2.2,                                                                                                    // 17
    // The default is high-ish to ensure a server can recover from a                                                  // 18
    // failure caused by load.                                                                                        // 19
    maxTimeout: 5 * 60000, // 5 minutes                                                                               // 20
    minTimeout: 10,                                                                                                   // 21
    minCount: 2,                                                                                                      // 22
    fuzz: 0.5 // +- 25%                                                                                               // 23
  }));                                                                                                                // 24
  self.retryTimer = null;                                                                                             // 25
};                                                                                                                    // 26
                                                                                                                      // 27
_.extend(Retry.prototype, {                                                                                           // 28
                                                                                                                      // 29
  // Reset a pending retry, if any.                                                                                   // 30
  clear: function () {                                                                                                // 31
    var self = this;                                                                                                  // 32
    if(self.retryTimer)                                                                                               // 33
      clearTimeout(self.retryTimer);                                                                                  // 34
    self.retryTimer = null;                                                                                           // 35
  },                                                                                                                  // 36
                                                                                                                      // 37
  // Calculate how long to wait in milliseconds to retry, based on the                                                // 38
  // `count` of which retry this is.                                                                                  // 39
  _timeout: function (count) {                                                                                        // 40
    var self = this;                                                                                                  // 41
                                                                                                                      // 42
    if(count < self.minCount)                                                                                         // 43
      return self.minTimeout;                                                                                         // 44
                                                                                                                      // 45
    var timeout = Math.min(                                                                                           // 46
      self.maxTimeout,                                                                                                // 47
      self.baseTimeout * Math.pow(self.exponent, count));                                                             // 48
    // fuzz the timeout randomly, to avoid reconnect storms when a                                                    // 49
    // server goes down.                                                                                              // 50
    timeout = timeout * ((Random.fraction() * self.fuzz) +                                                            // 51
                         (1 - self.fuzz/2));                                                                          // 52
    return Math.ceil(timeout);                                                                                        // 53
  },                                                                                                                  // 54
                                                                                                                      // 55
  // Call `fn` after a delay, based on the `count` of which retry this is.                                            // 56
  retryLater: function (count, fn) {                                                                                  // 57
    var self = this;                                                                                                  // 58
    var timeout = self._timeout(count);                                                                               // 59
    if(self.retryTimer)                                                                                               // 60
      clearTimeout(self.retryTimer);                                                                                  // 61
                                                                                                                      // 62
    self.retryTimer = setTimeout(fn, timeout);                                                                        // 63
    return timeout;                                                                                                   // 64
  }                                                                                                                   // 65
                                                                                                                      // 66
});                                                                                                                   // 67
                                                                                                                      // 68
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}).call(this);






(function () {

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                    //
// packages/meteorhacks:kadira/lib/utils.js                                                                           //
//                                                                                                                    //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                      //
var Fiber = Npm.require('fibers');                                                                                    // 1
                                                                                                                      // 2
HaveAsyncCallback = function(args) {                                                                                  // 3
  var lastArg = args[args.length -1];                                                                                 // 4
  return (typeof lastArg) == 'function';                                                                              // 5
};                                                                                                                    // 6
                                                                                                                      // 7
UniqueId = function(start) {                                                                                          // 8
  this.id = 0;                                                                                                        // 9
}                                                                                                                     // 10
                                                                                                                      // 11
UniqueId.prototype.get = function() {                                                                                 // 12
  return "" + this.id++;                                                                                              // 13
};                                                                                                                    // 14
                                                                                                                      // 15
DefaultUniqueId = new UniqueId();                                                                                     // 16
                                                                                                                      // 17
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}).call(this);






(function () {

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                    //
// packages/meteorhacks:kadira/lib/ntp.js                                                                             //
//                                                                                                                    //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                      //
var logger = getLogger();                                                                                             // 1
                                                                                                                      // 2
Ntp = function (endpoint) {                                                                                           // 3
  this.endpoint = endpoint + '/simplentp/sync';                                                                       // 4
  this.diff = 0;                                                                                                      // 5
  this.synced = false;                                                                                                // 6
  this.reSyncCount = 0;                                                                                               // 7
  this.reSync = new Retry({                                                                                           // 8
    baseTimeout: 1000*60,                                                                                             // 9
    maxTimeout: 1000*60*10,                                                                                           // 10
    minCount: 0                                                                                                       // 11
  });                                                                                                                 // 12
}                                                                                                                     // 13
                                                                                                                      // 14
Ntp._now = function() {                                                                                               // 15
  var now = Date.now();                                                                                               // 16
  if(typeof now == 'number') {                                                                                        // 17
    return now;                                                                                                       // 18
  } else if(now instanceof Date) {                                                                                    // 19
    // some extenal JS libraries override Date.now and returns a Date object                                          // 20
    // which directly affect us. So we need to prepare for that                                                       // 21
    return now.getTime();                                                                                             // 22
  } else {                                                                                                            // 23
    // trust me. I've seen now === undefined                                                                          // 24
    return (new Date()).getTime();                                                                                    // 25
  }                                                                                                                   // 26
};                                                                                                                    // 27
                                                                                                                      // 28
Ntp.prototype.getTime = function() {                                                                                  // 29
  return Ntp._now() + Math.round(this.diff);                                                                          // 30
};                                                                                                                    // 31
                                                                                                                      // 32
Ntp.prototype.syncTime = function(localTime) {                                                                        // 33
  return localTime + Math.ceil(this.diff);                                                                            // 34
};                                                                                                                    // 35
                                                                                                                      // 36
Ntp.prototype.sync = function() {                                                                                     // 37
  logger('init sync');                                                                                                // 38
  var self = this;                                                                                                    // 39
  var retryCount = 0;                                                                                                 // 40
  var retry = new Retry({                                                                                             // 41
    baseTimeout: 1000*20,                                                                                             // 42
    maxTimeout: 1000*60,                                                                                              // 43
    minCount: 1,                                                                                                      // 44
    minTimeout: 0                                                                                                     // 45
  });                                                                                                                 // 46
  syncTime();                                                                                                         // 47
                                                                                                                      // 48
  function syncTime () {                                                                                              // 49
    if(retryCount<5) {                                                                                                // 50
      logger('attempt time sync with server', retryCount);                                                            // 51
      // if we send 0 to the retryLater, cacheDns will run immediately                                                // 52
      retry.retryLater(retryCount++, cacheDns);                                                                       // 53
    } else {                                                                                                          // 54
      logger('maximum retries reached');                                                                              // 55
      self.reSync.retryLater(self.reSyncCount++, function () {                                                        // 56
        var args = [].slice.call(arguments);                                                                          // 57
        self.sync.apply(self, args);                                                                                  // 58
      });                                                                                                             // 59
    }                                                                                                                 // 60
  }                                                                                                                   // 61
                                                                                                                      // 62
  // first attempt is to cache dns. So, calculation does not                                                          // 63
  // include DNS resolution time                                                                                      // 64
  function cacheDns () {                                                                                              // 65
    self.getServerTime(function(err) {                                                                                // 66
      if(!err) {                                                                                                      // 67
        calculateTimeDiff();                                                                                          // 68
      } else {                                                                                                        // 69
        syncTime();                                                                                                   // 70
      }                                                                                                               // 71
    });                                                                                                               // 72
  }                                                                                                                   // 73
                                                                                                                      // 74
  function calculateTimeDiff () {                                                                                     // 75
    var startTime = (new Date()).getTime();                                                                           // 76
    self.getServerTime(function(err, serverTime) {                                                                    // 77
      if(!err && serverTime) {                                                                                        // 78
        // (Date.now() + startTime)/2 : Midpoint between req and res                                                  // 79
        self.diff = serverTime - ((new Date()).getTime() + startTime)/2;                                              // 80
        self.synced = true;                                                                                           // 81
        // we need to send 1 into retryLater.                                                                         // 82
        self.reSync.retryLater(self.reSyncCount++, function () {                                                      // 83
          var args = [].slice.call(arguments);                                                                        // 84
          self.sync.apply(self, args);                                                                                // 85
        });                                                                                                           // 86
        logger('successfully updated diff value', self.diff);                                                         // 87
      } else {                                                                                                        // 88
        syncTime();                                                                                                   // 89
      }                                                                                                               // 90
    });                                                                                                               // 91
  }                                                                                                                   // 92
}                                                                                                                     // 93
                                                                                                                      // 94
Ntp.prototype.getServerTime = function(callback) {                                                                    // 95
  var self = this;                                                                                                    // 96
                                                                                                                      // 97
  if(Meteor.isServer) {                                                                                               // 98
    var Fiber = Npm.require('fibers');                                                                                // 99
    new Fiber(function() {                                                                                            // 100
      HTTP.get(self.endpoint, function (err, res) {                                                                   // 101
        if(err) {                                                                                                     // 102
          callback(err);                                                                                              // 103
        } else {                                                                                                      // 104
          var serverTime = parseInt(res.content)                                                                      // 105
          callback(null, serverTime);                                                                                 // 106
        }                                                                                                             // 107
      });                                                                                                             // 108
    }).run();                                                                                                         // 109
  } else {                                                                                                            // 110
    $.ajax({                                                                                                          // 111
      type: 'GET',                                                                                                    // 112
      url: self.endpoint,                                                                                             // 113
      success: function(serverTime) {                                                                                 // 114
        callback(null, parseInt(serverTime));                                                                         // 115
      },                                                                                                              // 116
      error: function(err) {                                                                                          // 117
        callback(err);                                                                                                // 118
      }                                                                                                               // 119
    });                                                                                                               // 120
  }                                                                                                                   // 121
};                                                                                                                    // 122
                                                                                                                      // 123
function getLogger() {                                                                                                // 124
  if(Meteor.isServer) {                                                                                               // 125
    return Npm.require('debug')("kadira:ntp");                                                                        // 126
  } else {                                                                                                            // 127
    return function(message) {                                                                                        // 128
      var canLogKadira =                                                                                              // 129
        Meteor._localStorage.getItem('LOG_KADIRA') !== null                                                           // 130
        && typeof console !== 'undefined';                                                                            // 131
                                                                                                                      // 132
      if(canLogKadira) {                                                                                              // 133
        if(message) {                                                                                                 // 134
          message = "kadira:ntp " + message;                                                                          // 135
          arguments[0] = message;                                                                                     // 136
        }                                                                                                             // 137
        console.log.apply(console, arguments);                                                                        // 138
      }                                                                                                               // 139
    }                                                                                                                 // 140
  }                                                                                                                   // 141
}                                                                                                                     // 142
                                                                                                                      // 143
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}).call(this);






(function () {

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                    //
// packages/meteorhacks:kadira/lib/wait_time_builder.js                                                               //
//                                                                                                                    //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                      //
var WAITON_MESSAGE_FIELDS = ['msg', 'id', 'method', 'name', 'waitTime'];                                              // 1
                                                                                                                      // 2
// This is way how we can build waitTime and it's breakdown                                                           // 3
WaitTimeBuilder = function() {                                                                                        // 4
  this._waitListStore = {};                                                                                           // 5
  this._currentProcessingMessages = {};                                                                               // 6
  this._messageCache = {};                                                                                            // 7
};                                                                                                                    // 8
                                                                                                                      // 9
WaitTimeBuilder.prototype.register = function(session, msgId) {                                                       // 10
  var self = this;                                                                                                    // 11
  var mainKey = self._getMessageKey(session.id, msgId);                                                               // 12
                                                                                                                      // 13
  var waitList = session.inQueue.map(function(msg) {                                                                  // 14
    var key = self._getMessageKey(session.id, msg.id);                                                                // 15
    return self._getCacheMessage(key, msg);                                                                           // 16
  });                                                                                                                 // 17
                                                                                                                      // 18
  //add currently processing ddp message if exists                                                                    // 19
  var currentlyProcessingMessage = this._currentProcessingMessages[session.id];                                       // 20
  if(currentlyProcessingMessage) {                                                                                    // 21
    var key = self._getMessageKey(session.id, currentlyProcessingMessage.id);                                         // 22
    waitList.unshift(this._getCacheMessage(key, currentlyProcessingMessage));                                         // 23
  }                                                                                                                   // 24
                                                                                                                      // 25
  this._waitListStore[mainKey] = waitList;                                                                            // 26
};                                                                                                                    // 27
                                                                                                                      // 28
WaitTimeBuilder.prototype.build = function(session, msgId) {                                                          // 29
  var mainKey = this._getMessageKey(session.id, msgId);                                                               // 30
  var waitList = this._waitListStore[mainKey] || [];                                                                  // 31
  delete this._waitListStore[mainKey];                                                                                // 32
                                                                                                                      // 33
  var filteredWaitList =  waitList.map(this._cleanCacheMessage.bind(this));                                           // 34
  return filteredWaitList;                                                                                            // 35
};                                                                                                                    // 36
                                                                                                                      // 37
WaitTimeBuilder.prototype._getMessageKey = function(sessionId, msgId) {                                               // 38
  return sessionId + "::" + msgId;                                                                                    // 39
};                                                                                                                    // 40
                                                                                                                      // 41
WaitTimeBuilder.prototype._getCacheMessage = function(key, msg) {                                                     // 42
  var self = this;                                                                                                    // 43
  var cachedMessage = self._messageCache[key];                                                                        // 44
  if(!cachedMessage) {                                                                                                // 45
    self._messageCache[key] = cachedMessage = _.pick(msg, WAITON_MESSAGE_FIELDS);                                     // 46
    cachedMessage._key = key;                                                                                         // 47
    cachedMessage._registered = 1;                                                                                    // 48
  } else {                                                                                                            // 49
    cachedMessage._registered++;                                                                                      // 50
  }                                                                                                                   // 51
                                                                                                                      // 52
  return cachedMessage;                                                                                               // 53
};                                                                                                                    // 54
                                                                                                                      // 55
WaitTimeBuilder.prototype._cleanCacheMessage = function(msg) {                                                        // 56
  msg._registered--;                                                                                                  // 57
  if(msg._registered == 0) {                                                                                          // 58
    delete this._messageCache[msg._key];                                                                              // 59
  }                                                                                                                   // 60
                                                                                                                      // 61
  // need to send a clean set of objects                                                                              // 62
  // otherwise register can go with this                                                                              // 63
  return _.pick(msg, WAITON_MESSAGE_FIELDS);                                                                          // 64
};                                                                                                                    // 65
                                                                                                                      // 66
WaitTimeBuilder.prototype.trackWaitTime = function(session, msg, unblock) {                                           // 67
  var self = this;                                                                                                    // 68
  var started = Date.now();                                                                                           // 69
  self._currentProcessingMessages[session.id] = msg;                                                                  // 70
                                                                                                                      // 71
  var unblocked = false;                                                                                              // 72
  var wrappedUnblock = function() {                                                                                   // 73
    if(!unblocked) {                                                                                                  // 74
      var waitTime = Date.now() - started;                                                                            // 75
      var key = self._getMessageKey(session.id, msg.id);                                                              // 76
      var cachedMessage = self._messageCache[key];                                                                    // 77
      if(cachedMessage) {                                                                                             // 78
        cachedMessage.waitTime = waitTime;                                                                            // 79
      }                                                                                                               // 80
      delete self._currentProcessingMessages[session.id];                                                             // 81
      unblocked = true;                                                                                               // 82
      unblock();                                                                                                      // 83
    }                                                                                                                 // 84
  };                                                                                                                  // 85
                                                                                                                      // 86
  return wrappedUnblock;                                                                                              // 87
};                                                                                                                    // 88
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}).call(this);






(function () {

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                    //
// packages/meteorhacks:kadira/lib/models/0model.js                                                                   //
//                                                                                                                    //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                      //
KadiraModel = function() {                                                                                            // 1
                                                                                                                      // 2
};                                                                                                                    // 3
                                                                                                                      // 4
KadiraModel.prototype._getDateId = function(timestamp) {                                                              // 5
  var remainder = timestamp % (1000 * 60);                                                                            // 6
  var dateId = timestamp - remainder;                                                                                 // 7
  return dateId;                                                                                                      // 8
};                                                                                                                    // 9
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}).call(this);






(function () {

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                    //
// packages/meteorhacks:kadira/lib/models/methods.js                                                                  //
//                                                                                                                    //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                      //
var METHOD_METRICS_FIELDS = ['wait', 'db', 'http', 'email', 'async', 'compute', 'total'];                             // 1
                                                                                                                      // 2
MethodsModel = function (metricsThreshold) {                                                                          // 3
  var self = this;                                                                                                    // 4
                                                                                                                      // 5
  this.methodMetricsByMinute = {};                                                                                    // 6
  this.errorMap = {};                                                                                                 // 7
                                                                                                                      // 8
  this._metricsThreshold = _.extend({                                                                                 // 9
    "wait": 100,                                                                                                      // 10
    "db": 100,                                                                                                        // 11
    "http": 1000,                                                                                                     // 12
    "email": 100,                                                                                                     // 13
    "async": 100,                                                                                                     // 14
    "compute": 100,                                                                                                   // 15
    "total": 200                                                                                                      // 16
  }, metricsThreshold || {});                                                                                         // 17
                                                                                                                      // 18
  //store max time elapsed methods for each method, event(metrics-field)                                              // 19
  this.maxEventTimesForMethods = {};                                                                                  // 20
                                                                                                                      // 21
  this.tracerStore = new TracerStore({                                                                                // 22
    interval: 1000 * 60, //process traces every minute                                                                // 23
    maxTotalPoints: 30, //for 30 minutes                                                                              // 24
    archiveEvery: 5 //always trace for every 5 minutes,                                                               // 25
  });                                                                                                                 // 26
                                                                                                                      // 27
  this.tracerStore.start();                                                                                           // 28
};                                                                                                                    // 29
                                                                                                                      // 30
_.extend(MethodsModel.prototype, KadiraModel.prototype);                                                              // 31
                                                                                                                      // 32
MethodsModel.prototype.processMethod = function(methodTrace) {                                                        // 33
  var dateId = this._getDateId(methodTrace.at);                                                                       // 34
                                                                                                                      // 35
  //append metrics to previous values                                                                                 // 36
  this._appendMetrics(dateId, methodTrace);                                                                           // 37
  if(methodTrace.errored) {                                                                                           // 38
    this.methodMetricsByMinute[dateId].methods[methodTrace.name].errors ++                                            // 39
  }                                                                                                                   // 40
                                                                                                                      // 41
  this.tracerStore.addTrace(methodTrace);                                                                             // 42
};                                                                                                                    // 43
                                                                                                                      // 44
MethodsModel.prototype._appendMetrics = function(id, methodTrace) {                                                   // 45
  //initialize meteric for this time interval                                                                         // 46
  if(!this.methodMetricsByMinute[id]) {                                                                               // 47
    this.methodMetricsByMinute[id] = {                                                                                // 48
      // startTime needs to be converted into serverTime before sending                                               // 49
      startTime: methodTrace.at,                                                                                      // 50
      methods: {}                                                                                                     // 51
    };                                                                                                                // 52
  }                                                                                                                   // 53
                                                                                                                      // 54
  var methods = this.methodMetricsByMinute[id].methods;                                                               // 55
                                                                                                                      // 56
  //initialize method                                                                                                 // 57
  if(!methods[methodTrace.name]) {                                                                                    // 58
    methods[methodTrace.name] = {                                                                                     // 59
      count: 0,                                                                                                       // 60
      errors: 0                                                                                                       // 61
    };                                                                                                                // 62
                                                                                                                      // 63
    METHOD_METRICS_FIELDS.forEach(function(field) {                                                                   // 64
      methods[methodTrace.name][field] = 0;                                                                           // 65
    });                                                                                                               // 66
  }                                                                                                                   // 67
                                                                                                                      // 68
  //merge                                                                                                             // 69
  METHOD_METRICS_FIELDS.forEach(function(field) {                                                                     // 70
    var value = methodTrace.metrics[field];                                                                           // 71
    if(value > 0) {                                                                                                   // 72
      methods[methodTrace.name][field] += value;                                                                      // 73
    }                                                                                                                 // 74
  });                                                                                                                 // 75
                                                                                                                      // 76
  methods[methodTrace.name].count++;                                                                                  // 77
  this.methodMetricsByMinute[id].endTime = methodTrace.metrics.at;                                                    // 78
};                                                                                                                    // 79
                                                                                                                      // 80
/*                                                                                                                    // 81
  There are two types of data                                                                                         // 82
                                                                                                                      // 83
  1. methodMetrics - metrics about the methods (for every 10 secs)                                                    // 84
  2. methodRequests - raw method request. normally max, min for every 1 min and errors always                         // 85
*/                                                                                                                    // 86
MethodsModel.prototype.buildPayload = function(buildDetailedInfo) {                                                   // 87
  var payload = {                                                                                                     // 88
    methodMetrics: [],                                                                                                // 89
    methodRequests: []                                                                                                // 90
  };                                                                                                                  // 91
                                                                                                                      // 92
  //handling metrics                                                                                                  // 93
  var methodMetricsByMinute = this.methodMetricsByMinute;                                                             // 94
  this.methodMetricsByMinute = {};                                                                                    // 95
                                                                                                                      // 96
  //create final paylod for methodMetrics                                                                             // 97
  for(var key in methodMetricsByMinute) {                                                                             // 98
    var methodMetrics = methodMetricsByMinute[key];                                                                   // 99
    // converting startTime into the actual serverTime                                                                // 100
    var startTime = methodMetrics.startTime;                                                                          // 101
    methodMetrics.startTime = Kadira.syncedDate.syncTime(startTime);                                                  // 102
                                                                                                                      // 103
    for(var methodName in methodMetrics.methods) {                                                                    // 104
      METHOD_METRICS_FIELDS.forEach(function(field) {                                                                 // 105
        methodMetrics.methods[methodName][field] /=                                                                   // 106
          methodMetrics.methods[methodName].count;                                                                    // 107
      });                                                                                                             // 108
    }                                                                                                                 // 109
                                                                                                                      // 110
    payload.methodMetrics.push(methodMetricsByMinute[key]);                                                           // 111
  }                                                                                                                   // 112
                                                                                                                      // 113
  //collect traces and send them with the payload                                                                     // 114
  payload.methodRequests = this.tracerStore.collectTraces();                                                          // 115
                                                                                                                      // 116
  return payload;                                                                                                     // 117
};                                                                                                                    // 118
                                                                                                                      // 119
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}).call(this);






(function () {

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                    //
// packages/meteorhacks:kadira/lib/models/pubsub.js                                                                   //
//                                                                                                                    //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                      //
var logger = Npm.require('debug')('kadira:pubsub');                                                                   // 1
                                                                                                                      // 2
PubsubModel = function() {                                                                                            // 3
  this.metricsByMinute = {};                                                                                          // 4
  this.subscriptions = {};                                                                                            // 5
                                                                                                                      // 6
  this.tracerStore = new TracerStore({                                                                                // 7
    interval: 1000 * 60, //process traces every minute                                                                // 8
    maxTotalPoints: 30, //for 30 minutes                                                                              // 9
    archiveEvery: 5 //always trace for every 5 minutes,                                                               // 10
  });                                                                                                                 // 11
                                                                                                                      // 12
  this.tracerStore.start();                                                                                           // 13
}                                                                                                                     // 14
                                                                                                                      // 15
PubsubModel.prototype._trackSub = function(session, msg) {                                                            // 16
  logger('SUB:', session.id, msg.id, msg.name, msg.params, msg.route);                                                // 17
  var publication = this._getPublicationName(msg.name);                                                               // 18
  var subscriptionId = msg.id;                                                                                        // 19
  var timestamp = Ntp._now();                                                                                         // 20
  var metrics = this._getMetrics(timestamp, publication);                                                             // 21
                                                                                                                      // 22
  metrics.subs++;                                                                                                     // 23
                                                                                                                      // 24
  var route = msg.route;                                                                                              // 25
  if(route !== undefined){                                                                                            // 26
    metrics.subRoutes = metrics.subRoutes || {};                                                                      // 27
    metrics.subRoutes[route] = metrics.subRoutes[route] || 0;                                                         // 28
    metrics.subRoutes[route]++;                                                                                       // 29
  }                                                                                                                   // 30
                                                                                                                      // 31
  this.subscriptions[msg.id] = {                                                                                      // 32
    // We use localTime here, because when we used synedTime we might get                                             // 33
    // minus or more than we've expected                                                                              // 34
    //   (before serverTime diff changed overtime)                                                                    // 35
    startTime: timestamp,                                                                                             // 36
    publication: publication,                                                                                         // 37
    params: msg.params,                                                                                               // 38
    route: msg.route,                                                                                                 // 39
    id: msg.id                                                                                                        // 40
  };                                                                                                                  // 41
                                                                                                                      // 42
  //set session startedTime                                                                                           // 43
  session._startTime = session._startTime || timestamp;                                                               // 44
};                                                                                                                    // 45
                                                                                                                      // 46
_.extend(PubsubModel.prototype, KadiraModel.prototype);                                                               // 47
                                                                                                                      // 48
PubsubModel.prototype._trackUnsub = function(session, sub) {                                                          // 49
  logger('UNSUB:', session.id, sub._subscriptionId);                                                                  // 50
  var publication = this._getPublicationName(sub._name);                                                              // 51
  var subscriptionId = sub._subscriptionId;                                                                           // 52
  var subscriptionState = this.subscriptions[subscriptionId];                                                         // 53
                                                                                                                      // 54
  var startTime = null;                                                                                               // 55
  var route = null;                                                                                                   // 56
  //sometime, we don't have these states                                                                              // 57
  if(subscriptionState) {                                                                                             // 58
    startTime = subscriptionState.startTime;                                                                          // 59
    route = subscriptionState.route;                                                                                  // 60
  } else {                                                                                                            // 61
    //if this is null subscription, which is started automatically                                                    // 62
    //hence, we don't have a state                                                                                    // 63
    startTime = session._startTime;                                                                                   // 64
  }                                                                                                                   // 65
                                                                                                                      // 66
  //in case, we can't get the startTime                                                                               // 67
  if(startTime) {                                                                                                     // 68
    var timestamp = Ntp._now();                                                                                       // 69
    var metrics = this._getMetrics(timestamp, publication);                                                           // 70
    //track the count                                                                                                 // 71
    metrics.unsubs++;                                                                                                 // 72
    //use the current date to get the lifeTime of the subscription                                                    // 73
    metrics.lifeTime += timestamp - startTime;                                                                        // 74
                                                                                                                      // 75
    if(route){                                                                                                        // 76
      metrics.unsubRoutes = metrics.unsubRoutes || {};                                                                // 77
      metrics.unsubRoutes[route] = metrics.unsubRoutes[route] || 0;                                                   // 78
      metrics.unsubRoutes[route]++;                                                                                   // 79
    }                                                                                                                 // 80
                                                                                                                      // 81
    //this is place we can clean the subscriptionState if exists                                                      // 82
    delete this.subscriptions[subscriptionId];                                                                        // 83
  }                                                                                                                   // 84
};                                                                                                                    // 85
                                                                                                                      // 86
PubsubModel.prototype._trackReady = function(session, sub, trace) {                                                   // 87
  logger('READY:', session.id, sub._subscriptionId);                                                                  // 88
  //use the current time to track the response time                                                                   // 89
  var publication = this._getPublicationName(sub._name);                                                              // 90
  var subscriptionId = sub._subscriptionId;                                                                           // 91
  var timestamp = Ntp._now();                                                                                         // 92
  var metrics = this._getMetrics(timestamp, publication);                                                             // 93
                                                                                                                      // 94
  var subscriptionState = this.subscriptions[subscriptionId];                                                         // 95
  if(subscriptionState && !subscriptionState.readyTracked) {                                                          // 96
    metrics.resTime += timestamp - subscriptionState.startTime;                                                       // 97
    subscriptionState.readyTracked = true;                                                                            // 98
  }                                                                                                                   // 99
                                                                                                                      // 100
  if(trace) {                                                                                                         // 101
    this.tracerStore.addTrace(trace);                                                                                 // 102
  }                                                                                                                   // 103
};                                                                                                                    // 104
                                                                                                                      // 105
PubsubModel.prototype._trackError = function(session, sub, trace) {                                                   // 106
  logger('ERROR:', session.id, sub._subscriptionId);                                                                  // 107
  //use the current time to track the response time                                                                   // 108
  var publication = this._getPublicationName(sub._name);                                                              // 109
  var subscriptionId = sub._subscriptionId;                                                                           // 110
  var timestamp = Ntp._now();                                                                                         // 111
  var metrics = this._getMetrics(timestamp, publication);                                                             // 112
                                                                                                                      // 113
  metrics.errors++;                                                                                                   // 114
                                                                                                                      // 115
  if(trace) {                                                                                                         // 116
    this.tracerStore.addTrace(trace);                                                                                 // 117
  }                                                                                                                   // 118
};                                                                                                                    // 119
                                                                                                                      // 120
PubsubModel.prototype._trackNetworkImpact = function(session, sub, event, collection, id, stringifiedFields) {        // 121
  logger('DI:' + event, session.id, sub._subscriptionId, collection, id);                                             // 122
  if(event != 'removed' && stringifiedFields) {                                                                       // 123
    var subscriptionId = sub._subscriptionId;                                                                         // 124
    var subscriptionState = this.subscriptions[subscriptionId];                                                       // 125
                                                                                                                      // 126
    var publication = this._getPublicationName(sub._name);                                                            // 127
    var timestamp = Ntp._now();                                                                                       // 128
    var metrics = this._getMetrics(timestamp, publication);                                                           // 129
                                                                                                                      // 130
    if(subscriptionState) {                                                                                           // 131
      var sendingDataSize = Buffer.byteLength(stringifiedFields);                                                     // 132
      sub._totalDocsSent = sub._totalDocsSent || 0;                                                                   // 133
      sub._totalDocsSent++;                                                                                           // 134
      sub._totalDataSent = sub._totalDataSent || 0;                                                                   // 135
      sub._totalDataSent += sendingDataSize;                                                                          // 136
      if(subscriptionState.readyTracked) {                                                                            // 137
        //using JSON instead of EJSON to save the CPU usage                                                           // 138
        if(event == 'added') {                                                                                        // 139
          metrics.bytesAddedAfterReady += sendingDataSize;                                                            // 140
        } else if(event == 'changed') {                                                                               // 141
          metrics.bytesChangedAfterReady += sendingDataSize;                                                          // 142
        };                                                                                                            // 143
      } else {                                                                                                        // 144
        metrics.bytesBeforeReady += sendingDataSize;                                                                  // 145
      }                                                                                                               // 146
    }                                                                                                                 // 147
  }                                                                                                                   // 148
};                                                                                                                    // 149
                                                                                                                      // 150
PubsubModel.prototype._getMetrics = function(timestamp, publication) {                                                // 151
  var dateId = this._getDateId(timestamp);                                                                            // 152
                                                                                                                      // 153
  if(!this.metricsByMinute[dateId]) {                                                                                 // 154
    this.metricsByMinute[dateId] = {                                                                                  // 155
      // startTime needs to be convert to serverTime before sending to the server                                     // 156
      startTime: timestamp,                                                                                           // 157
      pubs: {}                                                                                                        // 158
    };                                                                                                                // 159
  }                                                                                                                   // 160
                                                                                                                      // 161
  if(!this.metricsByMinute[dateId].pubs[publication]) {                                                               // 162
    this.metricsByMinute[dateId].pubs[publication] = {                                                                // 163
      subs: 0,                                                                                                        // 164
      unsubs: 0,                                                                                                      // 165
      resTime: 0,                                                                                                     // 166
      bytesBeforeReady: 0,                                                                                            // 167
      bytesAddedAfterReady: 0,                                                                                        // 168
      bytesChangedAfterReady: 0,                                                                                      // 169
      activeSubs: 0,                                                                                                  // 170
      activeDocs: 0,                                                                                                  // 171
      lifeTime: 0,                                                                                                    // 172
      totalObservers: 0,                                                                                              // 173
      cachedObservers: 0,                                                                                             // 174
      avgDocSize: 0,                                                                                                  // 175
      errors: 0                                                                                                       // 176
    };                                                                                                                // 177
  }                                                                                                                   // 178
                                                                                                                      // 179
  return this.metricsByMinute[dateId].pubs[publication];                                                              // 180
};                                                                                                                    // 181
                                                                                                                      // 182
PubsubModel.prototype._getPublicationName = function(name) {                                                          // 183
  return name || "null(autopublish)";                                                                                 // 184
};                                                                                                                    // 185
                                                                                                                      // 186
PubsubModel.prototype._getSubscriptionInfo = function() {                                                             // 187
  var self = this;                                                                                                    // 188
  var activeSubs = {};                                                                                                // 189
  var activeDocs = {};                                                                                                // 190
  var totalDocsSent = {};                                                                                             // 191
  var totalDataSent = {};                                                                                             // 192
  var totalObservers = {};                                                                                            // 193
  var cachedObservers = {};                                                                                           // 194
                                                                                                                      // 195
  for(var sessionId in Meteor.default_server.sessions) {                                                              // 196
    var session = Meteor.default_server.sessions[sessionId];                                                          // 197
    _.each(session._namedSubs, countSubData);                                                                         // 198
    _.each(session._universalSubs, countSubData);                                                                     // 199
  }                                                                                                                   // 200
                                                                                                                      // 201
  var avgDocSize = {};                                                                                                // 202
  _.each(totalDataSent, function(value, publication) {                                                                // 203
    avgDocSize[publication] = totalDataSent[publication] / totalDocsSent[publication];                                // 204
  });                                                                                                                 // 205
                                                                                                                      // 206
  var avgObserverReuse = {};                                                                                          // 207
  _.each(totalObservers, function(value, publication) {                                                               // 208
    avgObserverReuse[publication] = cachedObservers[publication] / totalObservers[publication];                       // 209
  });                                                                                                                 // 210
                                                                                                                      // 211
  return {                                                                                                            // 212
    activeSubs: activeSubs,                                                                                           // 213
    activeDocs: activeDocs,                                                                                           // 214
    avgDocSize: avgDocSize,                                                                                           // 215
    avgObserverReuse: avgObserverReuse                                                                                // 216
  };                                                                                                                  // 217
                                                                                                                      // 218
  function countSubData (sub) {                                                                                       // 219
    var publication = self._getPublicationName(sub._name);                                                            // 220
    countSubscriptions(sub, publication);                                                                             // 221
    countDocuments(sub, publication);                                                                                 // 222
    countTotalDocsSent(sub, publication);                                                                             // 223
    countTotalDataSent(sub, publication);                                                                             // 224
    countObservers(sub, publication);                                                                                 // 225
  }                                                                                                                   // 226
                                                                                                                      // 227
  function countSubscriptions (sub, publication) {                                                                    // 228
    activeSubs[publication] = activeSubs[publication] || 0;                                                           // 229
    activeSubs[publication]++;                                                                                        // 230
  }                                                                                                                   // 231
                                                                                                                      // 232
  function countDocuments (sub, publication) {                                                                        // 233
    activeDocs[publication] = activeDocs[publication] || 0;                                                           // 234
    for(collectionName in sub._documents) {                                                                           // 235
      activeDocs[publication] += _.keys(sub._documents[collectionName]).length;                                       // 236
    }                                                                                                                 // 237
  }                                                                                                                   // 238
                                                                                                                      // 239
  function countTotalDocsSent (sub, publication) {                                                                    // 240
    totalDocsSent[publication] = totalDocsSent[publication] || 0;                                                     // 241
    totalDocsSent[publication] += sub._totalDocsSent;                                                                 // 242
  }                                                                                                                   // 243
                                                                                                                      // 244
  function countTotalDataSent (sub, publication) {                                                                    // 245
    totalDataSent[publication] = totalDataSent[publication] || 0;                                                     // 246
    totalDataSent[publication] += sub._totalDataSent;                                                                 // 247
  }                                                                                                                   // 248
                                                                                                                      // 249
  function countObservers(sub, publication) {                                                                         // 250
    totalObservers[publication] = totalObservers[publication] || 0;                                                   // 251
    cachedObservers[publication] = cachedObservers[publication] || 0;                                                 // 252
                                                                                                                      // 253
    totalObservers[publication] += sub._totalObservers;                                                               // 254
    cachedObservers[publication] += sub._cachedObservers;                                                             // 255
  }                                                                                                                   // 256
}                                                                                                                     // 257
                                                                                                                      // 258
PubsubModel.prototype.buildPayload = function(buildDetailInfo) {                                                      // 259
  var metricsByMinute = this.metricsByMinute;                                                                         // 260
  this.metricsByMinute = {};                                                                                          // 261
                                                                                                                      // 262
  var payload = {                                                                                                     // 263
    pubMetrics: []                                                                                                    // 264
  };                                                                                                                  // 265
                                                                                                                      // 266
  var subscriptionData = this._getSubscriptionInfo();                                                                 // 267
  var activeSubs = subscriptionData.activeSubs;                                                                       // 268
  var activeDocs = subscriptionData.activeDocs;                                                                       // 269
  var avgDocSize = subscriptionData.avgDocSize;                                                                       // 270
  var avgObserverReuse = subscriptionData.avgObserverReuse;                                                           // 271
                                                                                                                      // 272
  //to the averaging                                                                                                  // 273
  for(var dateId in metricsByMinute) {                                                                                // 274
    var dateMetrics = metricsByMinute[dateId];                                                                        // 275
    // We need to convert startTime into actual serverTime                                                            // 276
    dateMetrics.startTime = Kadira.syncedDate.syncTime(dateMetrics.startTime);                                        // 277
                                                                                                                      // 278
    for(var publication in metricsByMinute[dateId].pubs) {                                                            // 279
      var singlePubMetrics = metricsByMinute[dateId].pubs[publication];                                               // 280
      // We only calculate resTime for new subscriptions                                                              // 281
      singlePubMetrics.resTime /= singlePubMetrics.subs;                                                              // 282
      singlePubMetrics.resTime = singlePubMetrics.resTime || 0;                                                       // 283
      // We only track lifeTime in the unsubs                                                                         // 284
      singlePubMetrics.lifeTime /= singlePubMetrics.unsubs;                                                           // 285
      singlePubMetrics.lifeTime = singlePubMetrics.lifeTime || 0;                                                     // 286
                                                                                                                      // 287
      // This is a very efficient solution. We can come up with another solution                                      // 288
      // which maintains the count inside the API.                                                                    // 289
      // But for now, this is the most reliable method.                                                               // 290
                                                                                                                      // 291
      // If there are two ore more dateIds, we will be using the currentCount for all of them.                        // 292
      // We can come up with a better solution later on.                                                              // 293
      singlePubMetrics.activeSubs = activeSubs[publication] || 0;                                                     // 294
      singlePubMetrics.activeDocs = activeDocs[publication] || 0;                                                     // 295
      singlePubMetrics.avgDocSize = avgDocSize[publication] || 0;                                                     // 296
      singlePubMetrics.avgObserverReuse = avgObserverReuse[publication] || 0;                                         // 297
    }                                                                                                                 // 298
    payload.pubMetrics.push(metricsByMinute[dateId]);                                                                 // 299
  }                                                                                                                   // 300
                                                                                                                      // 301
  //collect traces and send them with the payload                                                                     // 302
  payload.pubRequests = this.tracerStore.collectTraces();                                                             // 303
                                                                                                                      // 304
  return payload;                                                                                                     // 305
};                                                                                                                    // 306
                                                                                                                      // 307
PubsubModel.prototype.incrementHandleCount = function(trace, isCached) {                                              // 308
  var publicationName = trace.name;                                                                                   // 309
  var timestamp = Ntp._now();                                                                                         // 310
  var publication = this._getMetrics(timestamp, publicationName);                                                     // 311
                                                                                                                      // 312
  var session = Meteor.default_server.sessions[trace.session];                                                        // 313
  if(session) {                                                                                                       // 314
    var sub = session._namedSubs[trace.id];                                                                           // 315
    if(sub) {                                                                                                         // 316
      sub._totalObservers = sub._totalObservers || 0;                                                                 // 317
      sub._cachedObservers = sub._cachedObservers || 0;                                                               // 318
    }                                                                                                                 // 319
  }                                                                                                                   // 320
  // not sure, we need to do this? But I don't need to break the however                                              // 321
  sub = sub || {_totalObservers:0 , _cachedObservers: 0};                                                             // 322
                                                                                                                      // 323
  publication.totalObservers++;                                                                                       // 324
  sub._totalObservers++;                                                                                              // 325
  if(isCached) {                                                                                                      // 326
    publication.cachedObservers++;                                                                                    // 327
    sub._cachedObservers++;                                                                                           // 328
  }                                                                                                                   // 329
}                                                                                                                     // 330
                                                                                                                      // 331
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}).call(this);






(function () {

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                    //
// packages/meteorhacks:kadira/lib/models/system.js                                                                   //
//                                                                                                                    //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                      //
var os = Npm.require('os');                                                                                           // 1
                                                                                                                      // 2
SystemModel = function () {                                                                                           // 3
  var self = this;                                                                                                    // 4
  this.startTime = Ntp._now();                                                                                        // 5
  try {                                                                                                               // 6
    var usage = (typeof KadiraBinaryDeps != 'undefined')?                                                             // 7
      KadiraBinaryDeps.usage: Npm.require('usage');                                                                   // 8
    this.usageLookup = Meteor._wrapAsync(usage.lookup.bind(usage));                                                   // 9
  } catch(ex) {                                                                                                       // 10
    console.error('Kadira: usage npm module loading failed - ', ex.message);                                          // 11
  }                                                                                                                   // 12
}                                                                                                                     // 13
                                                                                                                      // 14
_.extend(SystemModel.prototype, KadiraModel.prototype);                                                               // 15
                                                                                                                      // 16
SystemModel.prototype.buildPayload = function() {                                                                     // 17
  var metrics = {};                                                                                                   // 18
  var now = Ntp._now();                                                                                               // 19
  metrics.startTime = Kadira.syncedDate.syncTime(this.startTime);                                                     // 20
  metrics.endTime = Kadira.syncedDate.syncTime(now);                                                                  // 21
                                                                                                                      // 22
  metrics.sessions = _.keys(Meteor.default_server.sessions).length;                                                   // 23
  metrics.memory = process.memoryUsage().rss / (1024*1024);                                                           // 24
                                                                                                                      // 25
  if(this.usageLookup && !this._dontTrackUsage) {                                                                     // 26
    try {                                                                                                             // 27
      metrics.pcpu = this.usageLookup(process.pid, {keepHistory: true}).cpu;                                          // 28
      // this metric will be added soon. So we just need to make it reserved                                          // 29
      metrics.cputime = -1;                                                                                           // 30
    } catch(ex) {                                                                                                     // 31
      if(/Unsupported OS/.test(ex.message)) {                                                                         // 32
        this._dontTrackUsage = true;                                                                                  // 33
        var message =                                                                                                 // 34
          "kadira: we can't track CPU usage in this OS. " +                                                           // 35
          "But it will work when you deploy your app!"                                                                // 36
        console.warn(message);                                                                                        // 37
      } else {                                                                                                        // 38
        throw ex;                                                                                                     // 39
      }                                                                                                               // 40
    }                                                                                                                 // 41
  }                                                                                                                   // 42
                                                                                                                      // 43
  this.startTime = now;                                                                                               // 44
  return {systemMetrics: [metrics]};                                                                                  // 45
};                                                                                                                    // 46
                                                                                                                      // 47
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}).call(this);






(function () {

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                    //
// packages/meteorhacks:kadira/lib/models/errors.js                                                                   //
//                                                                                                                    //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                      //
                                                                                                                      // 1
ErrorModel = function (appId) {                                                                                       // 2
  var self = this;                                                                                                    // 3
  this.appId = appId;                                                                                                 // 4
  this.errors = {};                                                                                                   // 5
  this.startTime = Date.now();                                                                                        // 6
  this.maxErrors = 10;                                                                                                // 7
}                                                                                                                     // 8
                                                                                                                      // 9
_.extend(ErrorModel.prototype, KadiraModel.prototype);                                                                // 10
                                                                                                                      // 11
ErrorModel.prototype.buildPayload = function() {                                                                      // 12
  var metrics = _.values(this.errors);                                                                                // 13
  this.startTime = Date.now();                                                                                        // 14
  this.errors = {};                                                                                                   // 15
  return {errors: metrics};                                                                                           // 16
};                                                                                                                    // 17
                                                                                                                      // 18
ErrorModel.prototype.errorCount = function () {                                                                       // 19
  return _.values(this.errors).length;                                                                                // 20
};                                                                                                                    // 21
                                                                                                                      // 22
ErrorModel.prototype.trackError = function(ex, trace) {                                                               // 23
  var key = trace.type + ':' + ex.message;                                                                            // 24
  if(this.errors[key]) {                                                                                              // 25
    this.errors[key].count++;                                                                                         // 26
  } else if (this.errorCount() < this.maxErrors) {                                                                    // 27
    this.errors[key] = this._formatError(ex, trace);                                                                  // 28
  }                                                                                                                   // 29
};                                                                                                                    // 30
                                                                                                                      // 31
ErrorModel.prototype._formatError = function(ex, trace) {                                                             // 32
  var time = Date.now();                                                                                              // 33
  return {                                                                                                            // 34
    appId: this.appId,                                                                                                // 35
    name: ex.message,                                                                                                 // 36
    type: trace.type,                                                                                                 // 37
    startTime: time,                                                                                                  // 38
    subType: trace.subType || trace.name,                                                                             // 39
    trace: trace,                                                                                                     // 40
    stacks: [{stack: ex.stack}],                                                                                      // 41
    count: 1,                                                                                                         // 42
  }                                                                                                                   // 43
};                                                                                                                    // 44
                                                                                                                      // 45
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}).call(this);






(function () {

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                    //
// packages/meteorhacks:kadira/lib/kadira.js                                                                          //
//                                                                                                                    //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                      //
var http = Npm.require('http');                                                                                       // 1
var hostname = Npm.require('os').hostname();                                                                          // 2
var logger = Npm.require('debug')('kadira:apm');                                                                      // 3
var Fibers = Npm.require('fibers');                                                                                   // 4
                                                                                                                      // 5
Kadira = {};                                                                                                          // 6
Kadira.models = {};                                                                                                   // 7
Kadira.options = {};                                                                                                  // 8
Kadira.env = {                                                                                                        // 9
  currentSub: null, // keep current subscription inside ddp                                                           // 10
  kadiraInfo: new Meteor.EnvironmentVariable(),                                                                       // 11
};                                                                                                                    // 12
Kadira.waitTimeBuilder = new WaitTimeBuilder();                                                                       // 13
                                                                                                                      // 14
Kadira.connect = function(appId, appSecret, options) {                                                                // 15
  options = options || {};                                                                                            // 16
  options.appId = appId;                                                                                              // 17
  options.payloadTimeout = options.payloadTimeout || 1000 * 20;                                                       // 18
  options.endpoint = options.endpoint || "https://engine.kadira.io";                                                  // 19
  options.thresholds = options.thresholds || {};                                                                      // 20
                                                                                                                      // 21
  // remove trailing slash from endpoint url (if any)                                                                 // 22
  if(_.last(options.endpoint) === '/') {                                                                              // 23
    options.endpoint = options.endpoint.substr(0, options.endpoint.length - 1);                                       // 24
  }                                                                                                                   // 25
                                                                                                                      // 26
  Kadira.options = options;                                                                                           // 27
  Kadira.syncedDate = new Ntp(options.endpoint);                                                                      // 28
  Kadira.syncedDate.sync();                                                                                           // 29
  Kadira.models.methods = new MethodsModel(options.thresholds.methods);                                               // 30
  Kadira.models.pubsub = new PubsubModel();                                                                           // 31
  Kadira.models.system = new SystemModel();                                                                           // 32
  Kadira.models.error = new ErrorModel(appId);                                                                        // 33
  Kadira.sendPayload = sendPayload;                                                                                   // 34
                                                                                                                      // 35
  // setting runtime info, which will be sent to kadira                                                               // 36
  __meteor_runtime_config__.kadira = {                                                                                // 37
    appId: appId,                                                                                                     // 38
    endpoint: options.endpoint                                                                                        // 39
  };                                                                                                                  // 40
                                                                                                                      // 41
  if(canTrackErrors()) {                                                                                              // 42
    Kadira.enableErrorTracking();                                                                                     // 43
  } else {                                                                                                            // 44
    Kadira.disableErrorTracking();                                                                                    // 45
  }                                                                                                                   // 46
                                                                                                                      // 47
  //track how many times we've sent the data                                                                          // 48
  var countDataSent = 0;                                                                                              // 49
  var detailInfoSentInterval = Math.ceil((1000 * 60) / options.payloadTimeout); //once per min                        // 50
                                                                                                                      // 51
  if(appId && appSecret) {                                                                                            // 52
    appId = appId.trim();                                                                                             // 53
    appSecret = appSecret.trim();                                                                                     // 54
                                                                                                                      // 55
    pingToCheckAuth(function(){                                                                                       // 56
      schedulePayloadSend();                                                                                          // 57
    });                                                                                                               // 58
    logger('connected to app: ', appId);                                                                              // 59
  } else {                                                                                                            // 60
    throw new Error('Kadira: required appId and appSecret');                                                          // 61
  }                                                                                                                   // 62
                                                                                                                      // 63
  //start wrapping Meteor's internal methods                                                                          // 64
  Kadira._startInstrumenting(function() {                                                                             // 65
    console.log('Kadira: completed instrumenting the app')                                                            // 66
    Kadira.connected = true;                                                                                          // 67
  });                                                                                                                 // 68
                                                                                                                      // 69
  var payloadRetries = 0;                                                                                             // 70
  var payloadRetry = new Retry({                                                                                      // 71
      minCount: 0, // don't do any immediate payloadRetries                                                           // 72
      baseTimeout: 5*1000,                                                                                            // 73
      maxTimeout: 60000                                                                                               // 74
  });                                                                                                                 // 75
                                                                                                                      // 76
  function sendPayload(callback) {                                                                                    // 77
                                                                                                                      // 78
    callHTTP();                                                                                                       // 79
                                                                                                                      // 80
    function callHTTP() {                                                                                             // 81
      new Fibers(function() {                                                                                         // 82
        var payload = buildPayload();                                                                                 // 83
        var headers = buildHeaders();                                                                                 // 84
        var httpOptions = {headers: headers, data: payload};                                                          // 85
                                                                                                                      // 86
        try {                                                                                                         // 87
          var response = HTTP.call('POST', options.endpoint, httpOptions);                                            // 88
          processResponse(response);                                                                                  // 89
        } catch(err) {                                                                                                // 90
          tryAgain(err);                                                                                              // 91
        }                                                                                                             // 92
      }).run();                                                                                                       // 93
    }                                                                                                                 // 94
                                                                                                                      // 95
    function processResponse(response) {                                                                              // 96
      if(response.statusCode == '401') {                                                                              // 97
        throw new Error('Kadira: AppId, AppSecret combination is invalid');                                           // 98
      } else if(response.statusCode == '200') {                                                                       // 99
        //success send again in 10 secs                                                                               // 100
        schedulePayloadSend();                                                                                        // 101
        if(payloadRetries > 0) {                                                                                      // 102
          logger('connected again and payload sent.')                                                                 // 103
        }                                                                                                             // 104
        cleaPayloadRetry();                                                                                           // 105
        callback && callback();                                                                                       // 106
      } else {                                                                                                        // 107
        tryAgain();                                                                                                   // 108
      }                                                                                                               // 109
    }                                                                                                                 // 110
                                                                                                                      // 111
    function tryAgain(err) {                                                                                          // 112
      err = err || {};                                                                                                // 113
      logger('retrying to send payload to server')                                                                    // 114
      if(++payloadRetries < 5) {                                                                                      // 115
        payloadRetry.retryLater(payloadRetries, callHTTP);                                                            // 116
      } else {                                                                                                        // 117
        console.error('Kadira: Error sending payload(dropped after 5 tries) ', err.message);                          // 118
        cleaPayloadRetry();                                                                                           // 119
        schedulePayloadSend();                                                                                        // 120
      }                                                                                                               // 121
    }                                                                                                                 // 122
                                                                                                                      // 123
  }                                                                                                                   // 124
                                                                                                                      // 125
  function cleaPayloadRetry() {                                                                                       // 126
    payloadRetries = 0;                                                                                               // 127
    payloadRetry.clear();                                                                                             // 128
  }                                                                                                                   // 129
                                                                                                                      // 130
  function buildHeaders(){                                                                                            // 131
    return {'APM-APP-ID': appId, 'APM-APP-SECRET': appSecret}                                                         // 132
  }                                                                                                                   // 133
                                                                                                                      // 134
  function schedulePayloadSend() {                                                                                    // 135
    setTimeout(sendPayload, options.payloadTimeout);                                                                  // 136
  }                                                                                                                   // 137
                                                                                                                      // 138
  function canTrackErrors () {                                                                                        // 139
    if(Kadira.options.enableErrorTracking === undefined) {                                                            // 140
      return true;                                                                                                    // 141
    } else {                                                                                                          // 142
      return Kadira.options.enableErrorTracking;                                                                      // 143
    }                                                                                                                 // 144
  }                                                                                                                   // 145
                                                                                                                      // 146
                                                                                                                      // 147
  var authCheckFailures = 0;                                                                                          // 148
  function pingToCheckAuth(callback){                                                                                 // 149
    var httpOptions = {headers: buildHeaders(), data: {}};                                                            // 150
    var endpoint = options.endpoint + '/ping'                                                                         // 151
                                                                                                                      // 152
    new Fibers(function() {                                                                                           // 153
      HTTP.call('POST', endpoint, httpOptions, function(err, response){                                               // 154
        if(response) {                                                                                                // 155
          if(response.statusCode == 200) {                                                                            // 156
            console.log('Kadira: successfully authenticated');                                                        // 157
            authRetry.clear();                                                                                        // 158
            callback();                                                                                               // 159
          } else if(response.statusCode == 401) {                                                                     // 160
            console.error('Kadira: authenticatation failed - check your appId & appSecret')                           // 161
          } else {                                                                                                    // 162
            retryPingToCheckAuth(callback);                                                                           // 163
          }                                                                                                           // 164
        } else {                                                                                                      // 165
          retryPingToCheckAuth();                                                                                     // 166
        }                                                                                                             // 167
      });                                                                                                             // 168
    }).run();                                                                                                         // 169
                                                                                                                      // 170
    var authRetry = new Retry({                                                                                       // 171
      minCount: 0, // don't do any immediate retries                                                                  // 172
      baseTimeout: 5*1000 // start with 30s                                                                           // 173
    });                                                                                                               // 174
                                                                                                                      // 175
    function retryPingToCheckAuth(){                                                                                  // 176
      console.log('Kadira: retrying to authenticate');                                                                // 177
      authRetry.retryLater(authCheckFailures, function(){                                                             // 178
        pingToCheckAuth(callback)                                                                                     // 179
      });                                                                                                             // 180
    }                                                                                                                 // 181
  }                                                                                                                   // 182
                                                                                                                      // 183
  function buildPayload() {                                                                                           // 184
    var payload = {host: hostname};                                                                                   // 185
    var buildDetailedInfo = (countDataSent++ % detailInfoSentInterval) == 0;                                          // 186
    _.extend(payload, Kadira.models.methods.buildPayload(buildDetailedInfo));                                         // 187
    _.extend(payload, Kadira.models.pubsub.buildPayload(buildDetailedInfo));                                          // 188
    _.extend(payload, Kadira.models.system.buildPayload());                                                           // 189
    if(options.enableErrorTracking) {                                                                                 // 190
      _.extend(payload, Kadira.models.error.buildPayload());                                                          // 191
    }                                                                                                                 // 192
                                                                                                                      // 193
    return payload;                                                                                                   // 194
  }                                                                                                                   // 195
};                                                                                                                    // 196
                                                                                                                      // 197
// this return the __kadiraInfo from the current Fiber by default                                                     // 198
// if called with 2nd argument as true, it will get the kadira info from                                              // 199
// Meteor.EnvironmentVariable                                                                                         // 200
//                                                                                                                    // 201
// WARNNING: retunred info object is the reference object.                                                            // 202
//  Changing it might cause issues when building traces. So use with care                                             // 203
Kadira._getInfo = function(currentFiber, useEnvironmentVariable) {                                                    // 204
  currentFiber = currentFiber || Fibers.current;                                                                      // 205
  if(currentFiber) {                                                                                                  // 206
    if(useEnvironmentVariable) {                                                                                      // 207
      return Kadira.env.kadiraInfo.get();                                                                             // 208
    }                                                                                                                 // 209
    return currentFiber.__kadiraInfo;                                                                                 // 210
  }                                                                                                                   // 211
};                                                                                                                    // 212
                                                                                                                      // 213
// this does not clone the info object. So, use with care                                                             // 214
Kadira._setInfo = function(info) {                                                                                    // 215
  Fibers.current.__kadiraInfo = info;                                                                                 // 216
  var kadiraInfo = Kadira.env.kadiraInfo.get();                                                                       // 217
};                                                                                                                    // 218
                                                                                                                      // 219
Kadira.enableErrorTracking = function () {                                                                            // 220
  __meteor_runtime_config__.kadira.enableErrorTracking = true;                                                        // 221
  Kadira.options.enableErrorTracking = true;                                                                          // 222
};                                                                                                                    // 223
                                                                                                                      // 224
Kadira.disableErrorTracking = function () {                                                                           // 225
  __meteor_runtime_config__.kadira.enableErrorTracking = false;                                                       // 226
  Kadira.options.enableErrorTracking = false;                                                                         // 227
};                                                                                                                    // 228
                                                                                                                      // 229
Kadira.trackError = function (type, message, options) {                                                               // 230
  if(Kadira.options.enableErrorTracking && type && message) {                                                         // 231
    options = options || {};                                                                                          // 232
    options.subType = options.subType || 'server';                                                                    // 233
    options.stacks = options.stacks || '';                                                                            // 234
    var error = {message: message, stack: options.stacks};                                                            // 235
    var trace = {                                                                                                     // 236
      type: type,                                                                                                     // 237
      subType: options.subType,                                                                                       // 238
      name: message,                                                                                                  // 239
      errored: true,                                                                                                  // 240
      at: Kadira.syncedDate.getTime(),                                                                                // 241
      events: [['start', 0, {}], ['error', 0, {error: error}]],                                                       // 242
      metrics: {total: 0}                                                                                             // 243
    };                                                                                                                // 244
    Kadira.models.error.trackError(error, trace);                                                                     // 245
  }                                                                                                                   // 246
}                                                                                                                     // 247
                                                                                                                      // 248
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}).call(this);






(function () {

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                    //
// packages/meteorhacks:kadira/lib/check_for_oplog.js                                                                 //
//                                                                                                                    //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                      //
// expose for testing purpose                                                                                         // 1
OplogCheck = {};                                                                                                      // 2
                                                                                                                      // 3
OplogCheck._070 = function(cursorDescription) {                                                                       // 4
  var options = cursorDescription.options;                                                                            // 5
  if (options.limit) {                                                                                                // 6
    return {                                                                                                          // 7
      code: "070_LIMIT_NOT_SUPPORTED",                                                                                // 8
      reason: "Meteor 0.7.0 does not support limit with oplog.",                                                      // 9
      solution: "Upgrade your app to Meteor version 0.7.2 or later."                                                  // 10
    }                                                                                                                 // 11
  };                                                                                                                  // 12
                                                                                                                      // 13
  var exists$ = _.any(cursorDescription.selector, function (value, field) {                                           // 14
    if (field.substr(0, 1) === '$')                                                                                   // 15
      return true;                                                                                                    // 16
  });                                                                                                                 // 17
                                                                                                                      // 18
  if(exists$) {                                                                                                       // 19
    return {                                                                                                          // 20
      code: "070_$_NOT_SUPPORTED",                                                                                    // 21
      reason: "Meteor 0.7.0 supports only equal checks with oplog.",                                                  // 22
      solution: "Upgrade your app to Meteor version 0.7.2 or later."                                                  // 23
    }                                                                                                                 // 24
  };                                                                                                                  // 25
                                                                                                                      // 26
  var onlyScalers = _.all(cursorDescription.selector, function (value, field) {                                       // 27
    return typeof value === "string" ||                                                                               // 28
      typeof value === "number" ||                                                                                    // 29
      typeof value === "boolean" ||                                                                                   // 30
      value === null ||                                                                                               // 31
      value instanceof Meteor.Collection.ObjectID;                                                                    // 32
  });                                                                                                                 // 33
                                                                                                                      // 34
  if(!onlyScalers) {                                                                                                  // 35
    return {                                                                                                          // 36
      code: "070_ONLY_SCALERS",                                                                                       // 37
      reason: "Meteor 0.7.0 only supports scalers as comparators.",                                                   // 38
      solution: "Upgrade your app to Meteor version 0.7.2 or later."                                                  // 39
    }                                                                                                                 // 40
  }                                                                                                                   // 41
                                                                                                                      // 42
  return true;                                                                                                        // 43
};                                                                                                                    // 44
                                                                                                                      // 45
OplogCheck._071 = function(cursorDescription) {                                                                       // 46
  var options = cursorDescription.options;                                                                            // 47
  var matcher = new Minimongo.Matcher(cursorDescription.selector);                                                    // 48
  if (options.limit) {                                                                                                // 49
    return {                                                                                                          // 50
      code: "071_LIMIT_NOT_SUPPORTED",                                                                                // 51
      reason: "Meteor 0.7.1 does not support limit with oplog.",                                                      // 52
      solution: "Upgrade your app to Meteor version 0.7.2 or later."                                                  // 53
    }                                                                                                                 // 54
  };                                                                                                                  // 55
                                                                                                                      // 56
  return true;                                                                                                        // 57
};                                                                                                                    // 58
                                                                                                                      // 59
                                                                                                                      // 60
OplogCheck.env = function() {                                                                                         // 61
  if(!process.env.MONGO_OPLOG_URL) {                                                                                  // 62
    return {                                                                                                          // 63
      code: "NO_ENV",                                                                                                 // 64
      reason: "You haven't added oplog support for your the Meteor app.",                                             // 65
      solution: "Add oplog support for your Meteor app. see: http://goo.gl/Co1jJc"                                    // 66
    }                                                                                                                 // 67
  } else {                                                                                                            // 68
    return true;                                                                                                      // 69
  }                                                                                                                   // 70
};                                                                                                                    // 71
                                                                                                                      // 72
OplogCheck.disableOplog = function(cursorDescription) {                                                               // 73
  if(cursorDescription.options._disableOplog) {                                                                       // 74
    return {                                                                                                          // 75
      code: "DISABLE_OPLOG",                                                                                          // 76
      reason: "You've disable oplog for this cursor explicitly with _disableOplog option."                            // 77
    };                                                                                                                // 78
  } else {                                                                                                            // 79
    return true;                                                                                                      // 80
  }                                                                                                                   // 81
};                                                                                                                    // 82
                                                                                                                      // 83
// when creating Minimongo.Matcher object, if that's throws an exception                                              // 84
// meteor won't do the oplog support                                                                                  // 85
OplogCheck.miniMongoMatcher = function(cursorDescription) {                                                           // 86
  if(Minimongo.Matcher) {                                                                                             // 87
    try {                                                                                                             // 88
      var matcher = new Minimongo.Matcher(cursorDescription.selector);                                                // 89
      return true;                                                                                                    // 90
    } catch(ex) {                                                                                                     // 91
      return {                                                                                                        // 92
        code: "MINIMONGO_MATCHER_ERROR",                                                                              // 93
        reason: "There's something wrong in your mongo query: " +  ex.message,                                        // 94
        solution: "Check your selector and change it accordingly."                                                    // 95
      };                                                                                                              // 96
    }                                                                                                                 // 97
  } else {                                                                                                            // 98
    // If there is no Minimongo.Matcher, we don't need to check this                                                  // 99
    return true;                                                                                                      // 100
  }                                                                                                                   // 101
};                                                                                                                    // 102
                                                                                                                      // 103
OplogCheck.miniMongoSorter = function(cursorDescription) {                                                            // 104
  var matcher = new Minimongo.Matcher(cursorDescription.selector);                                                    // 105
  if(Minimongo.Sorter && cursorDescription.options.sort) {                                                            // 106
    try {                                                                                                             // 107
      var sorter = new Minimongo.Sorter(                                                                              // 108
        cursorDescription.options.sort,                                                                               // 109
        { matcher: matcher }                                                                                          // 110
      );                                                                                                              // 111
      return true;                                                                                                    // 112
    } catch(ex) {                                                                                                     // 113
      return {                                                                                                        // 114
        code: "MINIMONGO_SORTER_ERROR",                                                                               // 115
        reason: "Some of your sort specifiers are not supported: " + ex.message,                                      // 116
        solution: "Check your sort specifiers and chage them accordingly."                                            // 117
      }                                                                                                               // 118
    }                                                                                                                 // 119
  } else {                                                                                                            // 120
    return true;                                                                                                      // 121
  }                                                                                                                   // 122
};                                                                                                                    // 123
                                                                                                                      // 124
OplogCheck.fields = function(cursorDescription) {                                                                     // 125
  var options = cursorDescription.options;                                                                            // 126
  if(options.fields) {                                                                                                // 127
    try {                                                                                                             // 128
      LocalCollection._checkSupportedProjection(options.fields);                                                      // 129
      return true;                                                                                                    // 130
    } catch (e) {                                                                                                     // 131
      if (e.name === "MinimongoError") {                                                                              // 132
        return {                                                                                                      // 133
          code: "NOT_SUPPORTED_FIELDS",                                                                               // 134
          reason: "Some of the field filters are not supported: " + e.message,                                        // 135
          solution: "Try removing those field filters."                                                               // 136
        };                                                                                                            // 137
      } else {                                                                                                        // 138
        throw e;                                                                                                      // 139
      }                                                                                                               // 140
    }                                                                                                                 // 141
  }                                                                                                                   // 142
  return true;                                                                                                        // 143
};                                                                                                                    // 144
                                                                                                                      // 145
OplogCheck.skip = function(cursorDescription) {                                                                       // 146
  if(cursorDescription.options.skip) {                                                                                // 147
    return {                                                                                                          // 148
      code: "SKIP_NOT_SUPPORTED",                                                                                     // 149
      reason: "Skip does not support with oplog.",                                                                    // 150
      solution: "Try to avoid using skip. Use range queries instead: http://goo.gl/b522Av"                            // 151
    };                                                                                                                // 152
  }                                                                                                                   // 153
                                                                                                                      // 154
  return true;                                                                                                        // 155
};                                                                                                                    // 156
                                                                                                                      // 157
OplogCheck.where = function(cursorDescription) {                                                                      // 158
  var matcher = new Minimongo.Matcher(cursorDescription.selector);                                                    // 159
  if(matcher.hasWhere()) {                                                                                            // 160
    return {                                                                                                          // 161
      code: "WHERE_NOT_SUPPORTED",                                                                                    // 162
      reason: "Meteor does not support queries with $where.",                                                         // 163
      solution: "Try to remove $where from your query. Use some alternative."                                         // 164
    }                                                                                                                 // 165
  };                                                                                                                  // 166
                                                                                                                      // 167
  return true;                                                                                                        // 168
};                                                                                                                    // 169
                                                                                                                      // 170
OplogCheck.geo = function(cursorDescription) {                                                                        // 171
  var matcher = new Minimongo.Matcher(cursorDescription.selector);                                                    // 172
                                                                                                                      // 173
  if(matcher.hasGeoQuery()) {                                                                                         // 174
    return {                                                                                                          // 175
      code: "GEO_NOT_SUPPORTED",                                                                                      // 176
      reason: "Meteor does not support queries with geo partial operators.",                                          // 177
      solution: "Try to remove geo partial operators from your query if possible."                                    // 178
    }                                                                                                                 // 179
  };                                                                                                                  // 180
                                                                                                                      // 181
  return true;                                                                                                        // 182
};                                                                                                                    // 183
                                                                                                                      // 184
OplogCheck.limitButNoSort = function(cursorDescription) {                                                             // 185
  var options = cursorDescription.options;                                                                            // 186
                                                                                                                      // 187
  if((options.limit && !options.sort)) {                                                                              // 188
    return {                                                                                                          // 189
      code: "LIMIT_NO_SORT",                                                                                          // 190
      reason: "Meteor oplog implementation does not support limit without a sort specifier.",                         // 191
      solution: "Try adding a sort specifier."                                                                        // 192
    }                                                                                                                 // 193
  };                                                                                                                  // 194
                                                                                                                      // 195
  return true;                                                                                                        // 196
};                                                                                                                    // 197
                                                                                                                      // 198
OplogCheck.olderVersion = function(cursorDescription, driver) {                                                       // 199
  if(driver && !driver.constructor.cursorSupported) {                                                                 // 200
    return {                                                                                                          // 201
      code: "OLDER_VERSION",                                                                                          // 202
      reason: "Your Meteor version does not have oplog support.",                                                     // 203
      solution: "Upgrade your app to Meteor version 0.7.2 or later."                                                  // 204
    };                                                                                                                // 205
  }                                                                                                                   // 206
  return true;                                                                                                        // 207
};                                                                                                                    // 208
                                                                                                                      // 209
OplogCheck.gitCheckout = function(cursorDescription, driver) {                                                        // 210
  if(!Meteor.release) {                                                                                               // 211
    return {                                                                                                          // 212
      code: "GIT_CHECKOUT",                                                                                           // 213
      reason: "Seems like your Meteor version is based on a Git checkout and it doesn't have the oplog support.",     // 214
      solution: "Try to upgrade your Meteor version."                                                                 // 215
    };                                                                                                                // 216
  }                                                                                                                   // 217
  return true;                                                                                                        // 218
};                                                                                                                    // 219
                                                                                                                      // 220
var preRunningMatchers = [                                                                                            // 221
  OplogCheck.env,                                                                                                     // 222
  OplogCheck.disableOplog,                                                                                            // 223
  OplogCheck.miniMongoMatcher                                                                                         // 224
];                                                                                                                    // 225
                                                                                                                      // 226
var globalMatchers = [                                                                                                // 227
  OplogCheck.fields,                                                                                                  // 228
  OplogCheck.skip,                                                                                                    // 229
  OplogCheck.where,                                                                                                   // 230
  OplogCheck.geo,                                                                                                     // 231
  OplogCheck.limitButNoSort,                                                                                          // 232
  OplogCheck.miniMongoSorter,                                                                                         // 233
  OplogCheck.olderVersion,                                                                                            // 234
  OplogCheck.gitCheckout                                                                                              // 235
];                                                                                                                    // 236
                                                                                                                      // 237
var versionMatchers = [                                                                                               // 238
  [/^0\.7\.1/, OplogCheck._071],                                                                                      // 239
  [/^0\.7\.0/, OplogCheck._070],                                                                                      // 240
];                                                                                                                    // 241
                                                                                                                      // 242
Kadira.checkWhyNoOplog = function(cursorDescription, observerDriver) {                                                // 243
  if(typeof Minimongo == 'undefined') {                                                                               // 244
    return {                                                                                                          // 245
      code: "CANNOT_DETECT",                                                                                          // 246
      reason: "You are running an older Meteor version and Kadira can't check oplog state.",                          // 247
      solution: "Try updating your Meteor app"                                                                        // 248
    }                                                                                                                 // 249
  }                                                                                                                   // 250
                                                                                                                      // 251
  var result = runMatchers(preRunningMatchers, cursorDescription, observerDriver);                                    // 252
  if(result !== true) {                                                                                               // 253
    return result;                                                                                                    // 254
  }                                                                                                                   // 255
                                                                                                                      // 256
  var meteorVersion = Meteor.release;                                                                                 // 257
  for(var lc=0; lc<versionMatchers.length; lc++) {                                                                    // 258
    var matcherInfo = versionMatchers[lc];                                                                            // 259
    if(matcherInfo[0].test(meteorVersion)) {                                                                          // 260
      var matched = matcherInfo[1](cursorDescription, observerDriver);                                                // 261
      if(matched !== true) {                                                                                          // 262
        return matched;                                                                                               // 263
      }                                                                                                               // 264
    }                                                                                                                 // 265
  }                                                                                                                   // 266
                                                                                                                      // 267
  result = runMatchers(globalMatchers, cursorDescription, observerDriver);                                            // 268
  if(result !== true) {                                                                                               // 269
    return result;                                                                                                    // 270
  }                                                                                                                   // 271
                                                                                                                      // 272
  return {                                                                                                            // 273
    code: "OPLOG_SUPPORTED",                                                                                          // 274
    reason: "This query should support oplog. It's weird if it's not.",                                               // 275
    solution: "Please contact Kadira support and let's discuss."                                                      // 276
  };                                                                                                                  // 277
};                                                                                                                    // 278
                                                                                                                      // 279
function runMatchers(matcherList, cursorDescription, observerDriver) {                                                // 280
  for(var lc=0; lc<matcherList.length; lc++) {                                                                        // 281
    var matcher = matcherList[lc];                                                                                    // 282
    var matched = matcher(cursorDescription, observerDriver);                                                         // 283
    if(matched !== true) {                                                                                            // 284
      return matched;                                                                                                 // 285
    }                                                                                                                 // 286
  }                                                                                                                   // 287
  return true;                                                                                                        // 288
}                                                                                                                     // 289
                                                                                                                      // 290
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}).call(this);






(function () {

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                    //
// packages/meteorhacks:kadira/lib/tracer.js                                                                          //
//                                                                                                                    //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                      //
var Fibers = Npm.require('fibers');                                                                                   // 1
var eventLogger = Npm.require('debug')('kadira:tracer');                                                              // 2
var REPITITIVE_EVENTS = {'db': true, 'http': true, 'email': true, 'wait': true, 'async': true};                       // 3
                                                                                                                      // 4
function Tracer() {                                                                                                   // 5
                                                                                                                      // 6
};                                                                                                                    // 7
                                                                                                                      // 8
//In the future, we might wan't to track inner fiber events too.                                                      // 9
//Then we can't serialize the object with methods                                                                     // 10
//That's why we use this method of returning the data                                                                 // 11
Tracer.prototype.start = function(session, msg) {                                                                     // 12
  var traceInfo = {                                                                                                   // 13
    _id: session.id + "::" + msg.id,                                                                                  // 14
    session: session.id,                                                                                              // 15
    userId: session.userId,                                                                                           // 16
    id: msg.id,                                                                                                       // 17
    events: []                                                                                                        // 18
  };                                                                                                                  // 19
                                                                                                                      // 20
  if(msg.msg == 'method') {                                                                                           // 21
    traceInfo.type = 'method';                                                                                        // 22
    traceInfo.name = msg.method;                                                                                      // 23
  } else if(msg.msg == 'sub') {                                                                                       // 24
    traceInfo.type = 'sub';                                                                                           // 25
    traceInfo.name = msg.name;                                                                                        // 26
  } else {                                                                                                            // 27
    return null;                                                                                                      // 28
  }                                                                                                                   // 29
                                                                                                                      // 30
  return traceInfo;                                                                                                   // 31
};                                                                                                                    // 32
                                                                                                                      // 33
Tracer.prototype.event = function(traceInfo, type, data) {                                                            // 34
  // do not allow to proceed, if already completed or errored                                                         // 35
  var lastEvent = this.getLastEvent(traceInfo);                                                                       // 36
  if(lastEvent && ['complete', 'error'].indexOf(lastEvent.type) >= 0) {                                               // 37
    return false;                                                                                                     // 38
  }                                                                                                                   // 39
                                                                                                                      // 40
  //expecting a end event                                                                                             // 41
  var eventId = true;                                                                                                 // 42
                                                                                                                      // 43
  //specially handling for repitivive events like db, http                                                            // 44
  if(REPITITIVE_EVENTS[type]) {                                                                                       // 45
    //can't accept a new start event                                                                                  // 46
    if(traceInfo._lastEventId) {                                                                                      // 47
      return false;                                                                                                   // 48
    }                                                                                                                 // 49
    eventId = traceInfo._lastEventId = DefaultUniqueId.get();                                                         // 50
  }                                                                                                                   // 51
                                                                                                                      // 52
  var event = {type: type, at: Ntp._now()};                                                                           // 53
  if(data) {                                                                                                          // 54
    event.data = data;                                                                                                // 55
  }                                                                                                                   // 56
                                                                                                                      // 57
  traceInfo.events.push(event);                                                                                       // 58
                                                                                                                      // 59
  eventLogger("%s %s", type, traceInfo._id);                                                                          // 60
  return eventId;                                                                                                     // 61
};                                                                                                                    // 62
                                                                                                                      // 63
Tracer.prototype.eventEnd = function(traceInfo, eventId, data) {                                                      // 64
  if(traceInfo._lastEventId && traceInfo._lastEventId == eventId) {                                                   // 65
    var lastEvent = this.getLastEvent(traceInfo);                                                                     // 66
    var type = lastEvent.type + 'end';                                                                                // 67
    var event = {type: type, at: Ntp._now()};                                                                         // 68
    if(data) {                                                                                                        // 69
      event.data = data;                                                                                              // 70
    }                                                                                                                 // 71
    traceInfo.events.push(event);                                                                                     // 72
    eventLogger("%s %s", type, traceInfo._id);                                                                        // 73
                                                                                                                      // 74
    traceInfo._lastEventId = null;                                                                                    // 75
    return true;                                                                                                      // 76
  } else {                                                                                                            // 77
    return false;                                                                                                     // 78
  }                                                                                                                   // 79
};                                                                                                                    // 80
                                                                                                                      // 81
Tracer.prototype.getLastEvent = function(traceInfo) {                                                                 // 82
  return traceInfo.events[traceInfo.events.length -1]                                                                 // 83
};                                                                                                                    // 84
                                                                                                                      // 85
Tracer.prototype.endLastEvent = function(traceInfo) {                                                                 // 86
  var lastEvent = this.getLastEvent(traceInfo);                                                                       // 87
  if(lastEvent && !/end$/.test(lastEvent.type)) {                                                                     // 88
    traceInfo.events.push({                                                                                           // 89
      type: lastEvent.type + 'end',                                                                                   // 90
      at: Ntp._now()                                                                                                  // 91
    });                                                                                                               // 92
    return true;                                                                                                      // 93
  }                                                                                                                   // 94
  return false;                                                                                                       // 95
};                                                                                                                    // 96
                                                                                                                      // 97
Tracer.prototype.buildTrace = function(traceInfo) {                                                                   // 98
  var firstEvent = traceInfo.events[0];                                                                               // 99
  var lastEvent = traceInfo.events[traceInfo.events.length - 1];                                                      // 100
  var processedEvents = [];                                                                                           // 101
                                                                                                                      // 102
  if(firstEvent.type != 'start') {                                                                                    // 103
    console.warn('Kadira: trace is not started yet');                                                                 // 104
    return null;                                                                                                      // 105
  } else if(lastEvent.type != 'complete' && lastEvent.type != 'error') {                                              // 106
    //trace is not completed or errored yet                                                                           // 107
    console.warn('Kadira: trace is not completed or errored yet');                                                    // 108
    return null;                                                                                                      // 109
  } else {                                                                                                            // 110
    //build the metrics                                                                                               // 111
    traceInfo.errored = lastEvent.type == 'error';                                                                    // 112
    traceInfo.at = firstEvent.at;                                                                                     // 113
                                                                                                                      // 114
    var metrics = {                                                                                                   // 115
      total: lastEvent.at - firstEvent.at,                                                                            // 116
    };                                                                                                                // 117
                                                                                                                      // 118
    var totalNonCompute = 0;                                                                                          // 119
                                                                                                                      // 120
    firstEvent = ['start', 0];                                                                                        // 121
    if(traceInfo.events[0].data) firstEvent.push(traceInfo.events[0].data);                                           // 122
    processedEvents.push(firstEvent);                                                                                 // 123
                                                                                                                      // 124
    for(var lc=1; lc < traceInfo.events.length - 1; lc += 2) {                                                        // 125
      var prevEventEnd = traceInfo.events[lc-1];                                                                      // 126
      var startEvent = traceInfo.events[lc];                                                                          // 127
      var endEvent = traceInfo.events[lc+1];                                                                          // 128
      var computeTime = startEvent.at - prevEventEnd.at;                                                              // 129
      if(computeTime > 0) processedEvents.push(['compute', computeTime]);                                             // 130
      if(!endEvent) {                                                                                                 // 131
        console.error('Kadira: no end event for type: ', startEvent.type);                                            // 132
        return null;                                                                                                  // 133
      } else if(endEvent.type != startEvent.type + 'end') {                                                           // 134
        console.error('Kadira: endevent type mismatch: ', startEvent.type, endEvent.type, JSON.stringify(traceInfo)); // 135
        return null;                                                                                                  // 136
      } else {                                                                                                        // 137
        var elapsedTimeForEvent = endEvent.at - startEvent.at                                                         // 138
        var currentEvent = [startEvent.type, elapsedTimeForEvent];                                                    // 139
        currentEvent.push(_.extend({}, startEvent.data, endEvent.data));                                              // 140
        processedEvents.push(currentEvent);                                                                           // 141
        metrics[startEvent.type] = metrics[startEvent.type] || 0;                                                     // 142
        metrics[startEvent.type] += elapsedTimeForEvent;                                                              // 143
        totalNonCompute += elapsedTimeForEvent;                                                                       // 144
      }                                                                                                               // 145
    }                                                                                                                 // 146
                                                                                                                      // 147
    computeTime = lastEvent.at - traceInfo.events[traceInfo.events.length - 2];                                       // 148
    if(computeTime > 0) processedEvents.push(['compute', computeTime]);                                               // 149
                                                                                                                      // 150
    var lastEventData = [lastEvent.type, 0];                                                                          // 151
    if(lastEvent.data) lastEventData.push(lastEvent.data);                                                            // 152
    processedEvents.push(lastEventData);                                                                              // 153
                                                                                                                      // 154
    metrics.compute = metrics.total - totalNonCompute;                                                                // 155
    traceInfo.metrics = metrics;                                                                                      // 156
    traceInfo.events = processedEvents;                                                                               // 157
    traceInfo.isEventsProcessed = true;                                                                               // 158
    return traceInfo;                                                                                                 // 159
  }                                                                                                                   // 160
};                                                                                                                    // 161
                                                                                                                      // 162
Kadira.tracer = new Tracer();                                                                                         // 163
                                                                                                                      // 164
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}).call(this);






(function () {

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                    //
// packages/meteorhacks:kadira/lib/tracer_store.js                                                                    //
//                                                                                                                    //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                      //
var logger = Npm.require('debug')('kadira:ts');                                                                       // 1
                                                                                                                      // 2
TracerStore = function TracerStore(options) {                                                                         // 3
  options = options || {};                                                                                            // 4
                                                                                                                      // 5
  this.maxTotalPoints = options.maxTotalPoints || 30;                                                                 // 6
  this.interval = options.interval || 1000 * 60;                                                                      // 7
  this.archiveEvery = options.archiveEvery || this.maxTotalPoints / 6;                                                // 8
                                                                                                                      // 9
  //store max total on the past 30 minutes (or past 30 items)                                                         // 10
  this.maxTotals = {};                                                                                                // 11
  //store the max trace of the current interval                                                                       // 12
  this.currentMaxTrace = {};                                                                                          // 13
  //archive for the traces                                                                                            // 14
  this.traceArchive = [];                                                                                             // 15
                                                                                                                      // 16
  this.processedCnt = {};                                                                                             // 17
                                                                                                                      // 18
  //group errors by messages between an interval                                                                      // 19
  this.errorMap = {};                                                                                                 // 20
};                                                                                                                    // 21
                                                                                                                      // 22
TracerStore.prototype.addTrace = function(trace) {                                                                    // 23
  var kind = [trace.type, trace.name].join('::');                                                                     // 24
  if(!this.currentMaxTrace[kind]) {                                                                                   // 25
    this.currentMaxTrace[kind] = EJSON.clone(trace);                                                                  // 26
  } else if(this.currentMaxTrace[kind].metrics.total < trace.metrics.total) {                                         // 27
    this.currentMaxTrace[kind] = EJSON.clone(trace);                                                                  // 28
  } else if(trace.errored) {                                                                                          // 29
    this._handleErrors(trace);                                                                                        // 30
  }                                                                                                                   // 31
};                                                                                                                    // 32
                                                                                                                      // 33
TracerStore.prototype.collectTraces = function() {                                                                    // 34
  var traces = this.traceArchive;                                                                                     // 35
  this.traceArchive = [];                                                                                             // 36
                                                                                                                      // 37
  // convert at(timestamp) into the actual serverTime                                                                 // 38
  traces.forEach(function(trace) {                                                                                    // 39
    trace.at = Kadira.syncedDate.syncTime(trace.at);                                                                  // 40
  });                                                                                                                 // 41
  return traces;                                                                                                      // 42
};                                                                                                                    // 43
                                                                                                                      // 44
TracerStore.prototype.start = function() {                                                                            // 45
  this._timeoutHandler = setInterval(this.processTraces.bind(this), this.interval);                                   // 46
};                                                                                                                    // 47
                                                                                                                      // 48
TracerStore.prototype.stop = function() {                                                                             // 49
  if(this._timeoutHandler) {                                                                                          // 50
    clearInterval(this._timeoutHandler);                                                                              // 51
  }                                                                                                                   // 52
};                                                                                                                    // 53
                                                                                                                      // 54
TracerStore.prototype._handleErrors = function(trace) {                                                               // 55
  // sending error requests as it is                                                                                  // 56
  var lastEvent = trace.events[trace.events.length -1];                                                               // 57
  if(lastEvent && lastEvent[2]) {                                                                                     // 58
    var error = lastEvent[2].error;                                                                                   // 59
                                                                                                                      // 60
    // grouping errors occured (reset after processTraces)                                                            // 61
    var errorKey = [trace.type, trace.name, error.message].join("::");                                                // 62
    if(!this.errorMap[errorKey]) {                                                                                    // 63
      var erroredTrace = EJSON.clone(trace);                                                                          // 64
      this.errorMap[errorKey] = erroredTrace;                                                                         // 65
                                                                                                                      // 66
      this.traceArchive.push(erroredTrace);                                                                           // 67
    }                                                                                                                 // 68
  } else {                                                                                                            // 69
    logger('last events is not an error: ', JSON.stringify(trace.events));                                            // 70
  }                                                                                                                   // 71
};                                                                                                                    // 72
                                                                                                                      // 73
TracerStore.prototype.processTraces = function() {                                                                    // 74
  var self = this;                                                                                                    // 75
  var kinds = _.union(                                                                                                // 76
    _.keys(this.maxTotals),                                                                                           // 77
    _.keys(this.currentMaxTrace)                                                                                      // 78
  );                                                                                                                  // 79
                                                                                                                      // 80
  kinds.forEach(function(kind) {                                                                                      // 81
    self.processedCnt[kind] = self.processedCnt[kind] || 0;                                                           // 82
    var currentMaxTrace = self.currentMaxTrace[kind];                                                                 // 83
    var currentMaxTotal = currentMaxTrace? currentMaxTrace.metrics.total : 0;                                         // 84
                                                                                                                      // 85
    self.maxTotals[kind] = self.maxTotals[kind] || [];                                                                // 86
    //add the current maxPoint                                                                                        // 87
    self.maxTotals[kind].push(currentMaxTotal);                                                                       // 88
    var exceedingPoints = self.maxTotals[kind].length - self.maxTotalPoints;                                          // 89
    if(exceedingPoints > 0) {                                                                                         // 90
      self.maxTotals[kind].splice(0, exceedingPoints);                                                                // 91
    }                                                                                                                 // 92
                                                                                                                      // 93
    var archiveDefault = (self.processedCnt[kind] % self.archiveEvery) == 0;                                          // 94
    self.processedCnt[kind]++;                                                                                        // 95
                                                                                                                      // 96
    var canArchive = archiveDefault                                                                                   // 97
      || self._isTraceOutlier(kind, currentMaxTrace);                                                                 // 98
                                                                                                                      // 99
    if(canArchive && currentMaxTrace) {                                                                               // 100
      self.traceArchive.push(currentMaxTrace);                                                                        // 101
    }                                                                                                                 // 102
                                                                                                                      // 103
    //reset currentMaxTrace                                                                                           // 104
    self.currentMaxTrace[kind] = null;                                                                                // 105
  });                                                                                                                 // 106
                                                                                                                      // 107
  //reset the errorMap                                                                                                // 108
  self.errorMap = {};                                                                                                 // 109
};                                                                                                                    // 110
                                                                                                                      // 111
TracerStore.prototype._isTraceOutlier = function(kind, trace) {                                                       // 112
  if(trace) {                                                                                                         // 113
    var dataSet = this.maxTotals[kind];                                                                               // 114
    return this._isOutlier(dataSet, trace.metrics.total, 3);                                                          // 115
  } else {                                                                                                            // 116
    return false;                                                                                                     // 117
  }                                                                                                                   // 118
};                                                                                                                    // 119
                                                                                                                      // 120
/*                                                                                                                    // 121
  Data point must exists in the dataSet                                                                               // 122
*/                                                                                                                    // 123
TracerStore.prototype._isOutlier = function(dataSet, dataPoint, maxMadZ) {                                            // 124
  var median = this._getMedian(dataSet);                                                                              // 125
  var mad = this._calculateMad(dataSet, median);                                                                      // 126
  var madZ = this._funcMedianDeviation(median)(dataPoint) / mad;                                                      // 127
                                                                                                                      // 128
  return madZ > maxMadZ;                                                                                              // 129
};                                                                                                                    // 130
                                                                                                                      // 131
TracerStore.prototype._getMedian = function(dataSet) {                                                                // 132
  var sortedDataSet = _.clone(dataSet).sort(function(a, b) {                                                          // 133
    return a-b;                                                                                                       // 134
  });                                                                                                                 // 135
  return this._pickQuartile(sortedDataSet, 2);                                                                        // 136
};                                                                                                                    // 137
                                                                                                                      // 138
TracerStore.prototype._pickQuartile = function(dataSet, num) {                                                        // 139
  var pos = ((dataSet.length + 1) * num) / 4;                                                                         // 140
  if(pos % 1 == 0) {                                                                                                  // 141
    return dataSet[pos -1];                                                                                           // 142
  } else {                                                                                                            // 143
    pos = pos - (pos % 1);                                                                                            // 144
    return (dataSet[pos -1] + dataSet[pos])/2                                                                         // 145
  }                                                                                                                   // 146
};                                                                                                                    // 147
                                                                                                                      // 148
TracerStore.prototype._calculateMad = function(dataSet, median) {                                                     // 149
  var medianDeviations = _.map(dataSet, this._funcMedianDeviation(median));                                           // 150
  var mad = this._getMedian(medianDeviations);                                                                        // 151
                                                                                                                      // 152
  return mad;                                                                                                         // 153
};                                                                                                                    // 154
                                                                                                                      // 155
TracerStore.prototype._funcMedianDeviation = function(median) {                                                       // 156
  return function(x) {                                                                                                // 157
    return Math.abs(median - x);                                                                                      // 158
  };                                                                                                                  // 159
};                                                                                                                    // 160
                                                                                                                      // 161
TracerStore.prototype._getMean = function(dataPoints) {                                                               // 162
  if(dataPoints.length > 0) {                                                                                         // 163
    var total = 0;                                                                                                    // 164
    dataPoints.forEach(function(point) {                                                                              // 165
      total += point;                                                                                                 // 166
    });                                                                                                               // 167
    return total/dataPoints.length;                                                                                   // 168
  } else {                                                                                                            // 169
    return 0;                                                                                                         // 170
  }                                                                                                                   // 171
};                                                                                                                    // 172
                                                                                                                      // 173
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}).call(this);






(function () {

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                    //
// packages/meteorhacks:kadira/lib/hijack/wrap_session.js                                                             //
//                                                                                                                    //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                      //
wrapSession = function(sessionProto) {                                                                                // 1
  var originalProcessMessage = sessionProto.processMessage;                                                           // 2
  sessionProto.processMessage = function(msg) {                                                                       // 3
    if(Kadira.connected) {                                                                                            // 4
      //only add kadiraInfo if it is connected                                                                        // 5
      var kadiraInfo = {                                                                                              // 6
        session: this.id,                                                                                             // 7
        userId: this.userId                                                                                           // 8
      };                                                                                                              // 9
                                                                                                                      // 10
      if(msg.msg == 'method' || msg.msg == 'sub') {                                                                   // 11
        kadiraInfo.trace = Kadira.tracer.start(this, msg);                                                            // 12
        Kadira.waitTimeBuilder.register(this, msg.id);                                                                // 13
                                                                                                                      // 14
        //use JSON stringify to save the CPU                                                                          // 15
        var startData = { userId: this.userId, params: JSON.stringify(msg.params) };                                  // 16
        Kadira.tracer.event(kadiraInfo.trace, 'start', startData);                                                    // 17
        var waitEventId = Kadira.tracer.event(kadiraInfo.trace, 'wait', {}, kadiraInfo);                              // 18
        msg._waitEventId = waitEventId;                                                                               // 19
        msg.__kadiraInfo = kadiraInfo;                                                                                // 20
                                                                                                                      // 21
        if(msg.msg == 'sub') {                                                                                        // 22
          // start tracking inside processMessage allows us to indicate                                               // 23
          // wait time as well                                                                                        // 24
          Kadira.models.pubsub._trackSub(this, msg);                                                                  // 25
        }                                                                                                             // 26
      }                                                                                                               // 27
    }                                                                                                                 // 28
                                                                                                                      // 29
    return originalProcessMessage.call(this, msg);                                                                    // 30
  };                                                                                                                  // 31
                                                                                                                      // 32
  //adding the method context to the current fiber                                                                    // 33
  var originalMethodHandler = sessionProto.protocol_handlers.method;                                                  // 34
  sessionProto.protocol_handlers.method = function(msg, unblock) {                                                    // 35
    var self = this;                                                                                                  // 36
    //add context                                                                                                     // 37
    var kadiraInfo = msg.__kadiraInfo;                                                                                // 38
    Kadira._setInfo(kadiraInfo);                                                                                      // 39
                                                                                                                      // 40
    // end wait event                                                                                                 // 41
    var waitList = Kadira.waitTimeBuilder.build(this, msg.id);                                                        // 42
    Kadira.tracer.eventEnd(kadiraInfo.trace, msg._waitEventId, {waitOn: waitList});                                   // 43
                                                                                                                      // 44
    unblock = Kadira.waitTimeBuilder.trackWaitTime(this, msg, unblock);                                               // 45
    var response = Kadira.env.kadiraInfo.withValue(kadiraInfo, function () {                                          // 46
      return originalMethodHandler.call(self, msg, unblock);                                                          // 47
    });                                                                                                               // 48
    unblock();                                                                                                        // 49
    return response;                                                                                                  // 50
  };                                                                                                                  // 51
                                                                                                                      // 52
  //to capture the currently processing message                                                                       // 53
  var orginalSubHandler = sessionProto.protocol_handlers.sub;                                                         // 54
  sessionProto.protocol_handlers.sub = function(msg, unblock) {                                                       // 55
    var self = this;                                                                                                  // 56
    //add context                                                                                                     // 57
    var kadiraInfo = msg.__kadiraInfo;                                                                                // 58
    Kadira._setInfo(kadiraInfo);                                                                                      // 59
                                                                                                                      // 60
    // end wait event                                                                                                 // 61
    var waitList = Kadira.waitTimeBuilder.build(this, msg.id);                                                        // 62
    Kadira.tracer.eventEnd(kadiraInfo.trace, msg._waitEventId, {waitOn: waitList});                                   // 63
                                                                                                                      // 64
    unblock = Kadira.waitTimeBuilder.trackWaitTime(this, msg, unblock);                                               // 65
    var response = Kadira.env.kadiraInfo.withValue(kadiraInfo, function () {                                          // 66
      return orginalSubHandler.call(self, msg, unblock);                                                              // 67
    });                                                                                                               // 68
    unblock();                                                                                                        // 69
    return response;                                                                                                  // 70
  };                                                                                                                  // 71
                                                                                                                      // 72
  //to capture the currently processing message                                                                       // 73
  var orginalUnSubHandler = sessionProto.protocol_handlers.unsub;                                                     // 74
  sessionProto.protocol_handlers.unsub = function(msg, unblock) {                                                     // 75
    unblock = Kadira.waitTimeBuilder.trackWaitTime(this, msg, unblock);                                               // 76
    var response = orginalUnSubHandler.call(this, msg, unblock);                                                      // 77
    unblock();                                                                                                        // 78
    return response;                                                                                                  // 79
  };                                                                                                                  // 80
                                                                                                                      // 81
  //track method ending (to get the result of error)                                                                  // 82
  var originalSend = sessionProto.send;                                                                               // 83
  sessionProto.send = function(msg) {                                                                                 // 84
    if(msg.msg == 'result') {                                                                                         // 85
      var kadiraInfo = Kadira._getInfo();                                                                             // 86
      if(msg.error) {                                                                                                 // 87
        var error = _.pick(msg.error, ['message', 'stack']);                                                          // 88
                                                                                                                      // 89
        // pick the error from the wrapped method handler                                                             // 90
        if(kadiraInfo && kadiraInfo.currentError) {                                                                   // 91
          // the error stack is wrapped so Meteor._debug can identify                                                 // 92
          // this as a method error.                                                                                  // 93
          error = {                                                                                                   // 94
            message: kadiraInfo.currentError.message,                                                                 // 95
            stack: kadiraInfo.currentError.stack.stack                                                                // 96
          };                                                                                                          // 97
        }                                                                                                             // 98
                                                                                                                      // 99
        Kadira.tracer.endLastEvent(kadiraInfo.trace);                                                                 // 100
        Kadira.tracer.event(kadiraInfo.trace, 'error', {error: error});                                               // 101
      } else {                                                                                                        // 102
        var isForced = Kadira.tracer.endLastEvent(kadiraInfo.trace);                                                  // 103
        if (isForced) {                                                                                               // 104
          console.warn('Kadira endevent forced complete', JSON.stringify(kadiraInfo.trace.events));                   // 105
        };                                                                                                            // 106
        Kadira.tracer.event(kadiraInfo.trace, 'complete');                                                            // 107
      }                                                                                                               // 108
                                                                                                                      // 109
      if(kadiraInfo) {                                                                                                // 110
        //processing the message                                                                                      // 111
        var trace = Kadira.tracer.buildTrace(kadiraInfo.trace);                                                       // 112
        Kadira.models.methods.processMethod(trace);                                                                   // 113
                                                                                                                      // 114
        // error may or may not exist and error tracking can be disabled                                              // 115
        if(error && Kadira.options.enableErrorTracking) {                                                             // 116
          Kadira.models.error.trackError(error, trace);                                                               // 117
        }                                                                                                             // 118
                                                                                                                      // 119
        //clean and make sure, fiber is clean                                                                         // 120
        //not sure we need to do this, but a preventive measure                                                       // 121
        Kadira._setInfo(null);                                                                                        // 122
      }                                                                                                               // 123
    }                                                                                                                 // 124
                                                                                                                      // 125
    return originalSend.call(this, msg);                                                                              // 126
  };                                                                                                                  // 127
                                                                                                                      // 128
  //for the pub/sub data-impact calculation                                                                           // 129
  ['sendAdded', 'sendChanged', 'sendRemoved'].forEach(function(funcName) {                                            // 130
    var originalFunc = sessionProto[funcName];                                                                        // 131
    sessionProto[funcName] = function(collectionName, id, fields) {                                                   // 132
      var self = this;                                                                                                // 133
      //fields is not relevant for `sendRemoved`, but does make any harm                                              // 134
      var eventName = funcName.substring(4).toLowerCase();                                                            // 135
      var subscription = Kadira.env.currentSub;                                                                       // 136
                                                                                                                      // 137
      if(subscription) {                                                                                              // 138
        // we need to pick the actual DDP message send by the meteor                                                  // 139
        // otherwise that'll add a huge performance issue                                                             // 140
        // that's why we do this nasty hack, but it works great                                                       // 141
        var originalSocketSend = self.socket.send;                                                                    // 142
        var stringifiedFields;                                                                                        // 143
        self.socket.send = function(rawData) {                                                                        // 144
          stringifiedFields = rawData;                                                                                // 145
          originalSocketSend.call(self, rawData);                                                                     // 146
        };                                                                                                            // 147
                                                                                                                      // 148
        var res = originalFunc.call(self, collectionName, id, fields);                                                // 149
        Kadira.models.pubsub._trackNetworkImpact(self, subscription, eventName, collectionName, id, stringifiedFields);
                                                                                                                      // 151
        // revert to the original function                                                                            // 152
        self.socket.send = originalSocketSend;                                                                        // 153
        return res;                                                                                                   // 154
      } else {                                                                                                        // 155
        return originalFunc.call(self, collectionName, id, fields);                                                   // 156
      }                                                                                                               // 157
    };                                                                                                                // 158
  });                                                                                                                 // 159
};                                                                                                                    // 160
                                                                                                                      // 161
// wrap existing method handlers for capturing errors                                                                 // 162
_.each(Meteor.default_server.method_handlers, function(handler, name) {                                               // 163
  wrapMethodHanderForErrors(name, handler, Meteor.default_server.method_handlers);                                    // 164
});                                                                                                                   // 165
                                                                                                                      // 166
// wrap future method handlers for capturing errors                                                                   // 167
var originalMeteorMethods = Meteor.methods;                                                                           // 168
Meteor.methods = function(methodMap) {                                                                                // 169
  _.each(methodMap, function(handler, name) {                                                                         // 170
    wrapMethodHanderForErrors(name, handler, methodMap);                                                              // 171
  });                                                                                                                 // 172
  originalMeteorMethods(methodMap);                                                                                   // 173
};                                                                                                                    // 174
                                                                                                                      // 175
                                                                                                                      // 176
function wrapMethodHanderForErrors(name, originalHandler, methodMap) {                                                // 177
  methodMap[name] = function() {                                                                                      // 178
    try{                                                                                                              // 179
      return originalHandler.apply(this, arguments);                                                                  // 180
    } catch(ex) {                                                                                                     // 181
                                                                                                                      // 182
      if(Kadira._getInfo()) {                                                                                         // 183
        // wrap error stack so Meteor._debug can identify and ignore it                                               // 184
        ex.stack = {stack: ex.stack, source: 'method'};                                                               // 185
        Kadira._getInfo().currentError = ex;                                                                          // 186
      }                                                                                                               // 187
      throw ex;                                                                                                       // 188
    }                                                                                                                 // 189
  }                                                                                                                   // 190
}                                                                                                                     // 191
                                                                                                                      // 192
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}).call(this);






(function () {

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                    //
// packages/meteorhacks:kadira/lib/hijack/wrap_subscription.js                                                        //
//                                                                                                                    //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                      //
var Fiber = Npm.require('fibers');                                                                                    // 1
                                                                                                                      // 2
wrapSubscription = function(subscriptionProto) {                                                                      // 3
  // If the ready event runs outside the Fiber, Kadira._getInfo() doesn't work.                                       // 4
  // we need some other way to store kadiraInfo so we can use it at ready hijack.                                     // 5
  var originalRunHandler = subscriptionProto._runHandler;                                                             // 6
  subscriptionProto._runHandler = function() {                                                                        // 7
    var kadiraInfo = Kadira._getInfo();                                                                               // 8
    if (kadiraInfo) {                                                                                                 // 9
      this.__kadiraInfo = kadiraInfo;                                                                                 // 10
    };                                                                                                                // 11
    originalRunHandler.call(this);                                                                                    // 12
  }                                                                                                                   // 13
                                                                                                                      // 14
  var originalReady = subscriptionProto.ready;                                                                        // 15
  subscriptionProto.ready = function() {                                                                              // 16
    // meteor has a field called `_ready` which tracks this                                                           // 17
    // but we need to make it future proof                                                                            // 18
    if(!this._apmReadyTracked) {                                                                                      // 19
      var kadiraInfo = Kadira._getInfo() || this.__kadiraInfo;                                                        // 20
      delete this.__kadiraInfo;                                                                                       // 21
      //sometime .ready can be called in the context of the method                                                    // 22
      //then we have some problems, that's why we are checking this                                                   // 23
      //eg:- Accounts.createUser                                                                                      // 24
      if(kadiraInfo && this._subscriptionId == kadiraInfo.trace.id) {                                                 // 25
        var isForced = Kadira.tracer.endLastEvent(kadiraInfo.trace);                                                  // 26
        if (isForced) {                                                                                               // 27
          console.warn('Kadira endevent forced complete', JSON.stringify(kadiraInfo.trace.events));                   // 28
        };                                                                                                            // 29
        Kadira.tracer.event(kadiraInfo.trace, 'complete');                                                            // 30
        var trace = Kadira.tracer.buildTrace(kadiraInfo.trace);                                                       // 31
      }                                                                                                               // 32
                                                                                                                      // 33
      Kadira.models.pubsub._trackReady(this._session, this, trace);                                                   // 34
      this._apmReadyTracked = true;                                                                                   // 35
    }                                                                                                                 // 36
                                                                                                                      // 37
    // we still pass the control to the original implementation                                                       // 38
    // since multiple ready calls are handled by itself                                                               // 39
    originalReady.call(this);                                                                                         // 40
  };                                                                                                                  // 41
                                                                                                                      // 42
  var originalError = subscriptionProto.error;                                                                        // 43
  subscriptionProto.error = function(err) {                                                                           // 44
    var kadiraInfo = Kadira._getInfo();                                                                               // 45
                                                                                                                      // 46
    if(kadiraInfo && this._subscriptionId == kadiraInfo.trace.id) {                                                   // 47
      Kadira.tracer.endLastEvent(kadiraInfo.trace);                                                                   // 48
                                                                                                                      // 49
      var errorForApm = _.pick(err, 'message', 'stack');                                                              // 50
      Kadira.tracer.event(kadiraInfo.trace, 'error', {error: errorForApm});                                           // 51
      var trace = Kadira.tracer.buildTrace(kadiraInfo.trace);                                                         // 52
                                                                                                                      // 53
      Kadira.models.pubsub._trackError(this._session, this, trace);                                                   // 54
                                                                                                                      // 55
      // error tracking can be disabled and if there is a trace                                                       // 56
      // trace should be avaialble all the time, but it won't                                                         // 57
      // if something wrong happened on the trace building                                                            // 58
      if(Kadira.options.enableErrorTracking && trace) {                                                               // 59
        Kadira.models.error.trackError(err, trace);                                                                   // 60
      }                                                                                                               // 61
    }                                                                                                                 // 62
                                                                                                                      // 63
    // wrap error stack so Meteor._debug can identify and ignore it                                                   // 64
    err.stack = {stack: err.stack, source: 'subscription'};                                                           // 65
    originalError.call(this, err);                                                                                    // 66
  };                                                                                                                  // 67
                                                                                                                      // 68
  var originalDeactivate = subscriptionProto._deactivate;                                                             // 69
  subscriptionProto._deactivate = function() {                                                                        // 70
    Kadira.models.pubsub._trackUnsub(this._session, this);                                                            // 71
    originalDeactivate.call(this);                                                                                    // 72
  };                                                                                                                  // 73
                                                                                                                      // 74
  //adding the currenSub env variable                                                                                 // 75
  ['added', 'changed', 'removed'].forEach(function(funcName) {                                                        // 76
    var originalFunc = subscriptionProto[funcName];                                                                   // 77
    subscriptionProto[funcName] = function(collectionName, id, fields) {                                              // 78
      var self = this;                                                                                                // 79
                                                                                                                      // 80
      //we need to run this code in a fiber and that's how we track                                                   // 81
      //subscription info. May be we can figure out, some other way to do this                                        // 82
      Kadira.env.currentSub = self;                                                                                   // 83
      var res = originalFunc.call(self, collectionName, id, fields);                                                  // 84
      Kadira.env.currentSub = null;                                                                                   // 85
                                                                                                                      // 86
      return res;                                                                                                     // 87
    };                                                                                                                // 88
  });                                                                                                                 // 89
};                                                                                                                    // 90
                                                                                                                      // 91
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}).call(this);






(function () {

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                    //
// packages/meteorhacks:kadira/lib/hijack/session.js                                                                  //
//                                                                                                                    //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                      //
var logger = Npm.require('debug')('kadira:hijack:session');                                                           // 1
                                                                                                                      // 2
Kadira._startInstrumenting = function(callback) {                                                                     // 3
  //instrumenting session                                                                                             // 4
  var fakeSocket = {send: function() {}, close: function() {}, headers: []};                                          // 5
  var ddpConnectMessage = {msg: 'connect', version: 'pre1', support: ['pre1']};                                       // 6
  Meteor.default_server._handleConnect(fakeSocket, ddpConnectMessage);                                                // 7
                                                                                                                      // 8
  if(fakeSocket._meteorSession) { //for newer meteor versions                                                         // 9
    wrapSession(fakeSocket._meteorSession.constructor.prototype);                                                     // 10
                                                                                                                      // 11
    //instrumenting subscription                                                                                      // 12
    instrumentSubscription(fakeSocket._meteorSession);                                                                // 13
                                                                                                                      // 14
    if(Meteor.default_server._removeSession) {                                                                        // 15
      //0.8.x                                                                                                         // 16
      fakeSocket._meteorSession.close();                                                                              // 17
    } else if(Meteor.default_server._closeSession) {                                                                  // 18
      //0.7.x                                                                                                         // 19
      Meteor.default_server._closeSession(fakeSocket._meteorSession);                                                 // 20
    } else if(Meteor.default_server._destroySession) {                                                                // 21
      //0.6.6.x                                                                                                       // 22
      Meteor.default_server._destroySession(fakeSocket._meteorSession);                                               // 23
    }                                                                                                                 // 24
    callback();                                                                                                       // 25
  } else if(fakeSocket.meteor_session) { //support for 0.6.5.x                                                        // 26
    wrapSession(fakeSocket.meteor_session.constructor.prototype);                                                     // 27
                                                                                                                      // 28
    //instrumenting subscription                                                                                      // 29
    instrumentSubscription(fakeSocket.meteor_session);                                                                // 30
                                                                                                                      // 31
    fakeSocket.meteor_session.detach(fakeSocket);                                                                     // 32
    callback();                                                                                                       // 33
  } else {                                                                                                            // 34
    console.error('Kadira: session instrumenting failed');                                                            // 35
  }                                                                                                                   // 36
};                                                                                                                    // 37
                                                                                                                      // 38
function instrumentSubscription(session) {                                                                            // 39
  var subId = Random.id();                                                                                            // 40
  var publicationHandler = function() {this.ready()};                                                                 // 41
  var pubName = '__kadira_pub';                                                                                       // 42
                                                                                                                      // 43
  session._startSubscription(publicationHandler, subId, [], pubName);                                                 // 44
  var subscription = session._namedSubs[subId];                                                                       // 45
  wrapSubscription(subscription.constructor.prototype);                                                               // 46
                                                                                                                      // 47
  //cleaning up                                                                                                       // 48
  session._stopSubscription(subId);                                                                                   // 49
}                                                                                                                     // 50
                                                                                                                      // 51
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}).call(this);






(function () {

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                    //
// packages/meteorhacks:kadira/lib/hijack/db.js                                                                       //
//                                                                                                                    //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                      //
var mongoConnectionProto = getMongoConnectionProto();                                                                 // 1
                                                                                                                      // 2
//findOne is handled by find - so no need to track it                                                                 // 3
//upsert is handles by update                                                                                         // 4
['find', 'update', 'remove', 'insert', '_ensureIndex', '_dropIndex'].forEach(function(func) {                         // 5
  var originalFunc = mongoConnectionProto[func];                                                                      // 6
  mongoConnectionProto[func] = function(collName, selector, mod, options) {                                           // 7
    options = options || {};                                                                                          // 8
    var payload = {                                                                                                   // 9
      coll: collName,                                                                                                 // 10
      func: func,                                                                                                     // 11
    };                                                                                                                // 12
                                                                                                                      // 13
    if(func == 'insert') {                                                                                            // 14
      //add nothing more to the payload                                                                               // 15
    } else if(func == '_ensureIndex' || func == '_dropIndex') {                                                       // 16
      //add index                                                                                                     // 17
      payload.index = JSON.stringify(selector);                                                                       // 18
    } else if(func == 'update' && options.upsert) {                                                                   // 19
      payload.func = 'upsert';                                                                                        // 20
      payload.selector = JSON.stringify(selector);                                                                    // 21
    } else {                                                                                                          // 22
      //all the other functions have selectors                                                                        // 23
      payload.selector = JSON.stringify(selector);                                                                    // 24
    }                                                                                                                 // 25
                                                                                                                      // 26
    var kadiraInfo = Kadira._getInfo();                                                                               // 27
    if(kadiraInfo) {                                                                                                  // 28
      var eventId = Kadira.tracer.event(kadiraInfo.trace, 'db', payload);                                             // 29
    }                                                                                                                 // 30
                                                                                                                      // 31
    //this cause V8 to avoid any performance optimizations, but this is must to use                                   // 32
    //otherwise, if the error adds try catch block our logs get messy and didn't work                                 // 33
    //see: issue #6                                                                                                   // 34
    try{                                                                                                              // 35
      var ret = originalFunc.apply(this, arguments);                                                                  // 36
      //handling functions which can be triggered with an asyncCallback                                               // 37
      var endOptions = {};                                                                                            // 38
                                                                                                                      // 39
      if(HaveAsyncCallback(arguments)) {                                                                              // 40
        endOptions.async = true;                                                                                      // 41
      }                                                                                                               // 42
                                                                                                                      // 43
      if(func == 'update') {                                                                                          // 44
        // upsert only returns an object when called `upsert` directly                                                // 45
        // otherwise it only act an update command                                                                    // 46
        if(options.upsert && typeof ret == 'object') {                                                                // 47
          endOptions.updatedDocs = ret.numberAffected;                                                                // 48
          endOptions.insertedId = ret.insertedId;                                                                     // 49
        } else {                                                                                                      // 50
          endOptions.updatedDocs = ret;                                                                               // 51
        }                                                                                                             // 52
      } else if(func == 'remove') {                                                                                   // 53
        endOptions.removedDocs = ret;                                                                                 // 54
      }                                                                                                               // 55
                                                                                                                      // 56
      if(eventId) {                                                                                                   // 57
        Kadira.tracer.eventEnd(kadiraInfo.trace, eventId, endOptions);                                                // 58
      }                                                                                                               // 59
                                                                                                                      // 60
      if(func == 'find' && !ret.constructor.prototype._ampOk) {                                                       // 61
        hijackCursor(ret.constructor.prototype);                                                                      // 62
      }                                                                                                               // 63
    } catch(ex) {                                                                                                     // 64
      if(eventId) {                                                                                                   // 65
        Kadira.tracer.eventEnd(kadiraInfo.trace, eventId, {err: ex.message});                                         // 66
      }                                                                                                               // 67
      throw ex;                                                                                                       // 68
    }                                                                                                                 // 69
                                                                                                                      // 70
    return ret;                                                                                                       // 71
  };                                                                                                                  // 72
});                                                                                                                   // 73
                                                                                                                      // 74
function hijackCursor(cursorProto) {                                                                                  // 75
  ['forEach', 'map', 'fetch', 'count', 'observeChanges', 'observe', 'rewind'].forEach(function(type) {                // 76
    var originalFunc = cursorProto[type];                                                                             // 77
    cursorProto[type] = function() {                                                                                  // 78
      var cursorDescription = this._cursorDescription;                                                                // 79
      var payload = {                                                                                                 // 80
        coll: cursorDescription.collectionName,                                                                       // 81
        selector: JSON.stringify(cursorDescription.selector),                                                         // 82
        func: type,                                                                                                   // 83
        cursor: true                                                                                                  // 84
      };                                                                                                              // 85
                                                                                                                      // 86
      if(cursorDescription.options) {                                                                                 // 87
        var options = _.pick(cursorDescription.options, ['fields', 'sort', 'limit']);                                 // 88
        for(var field in options) {                                                                                   // 89
          var value = options[field]                                                                                  // 90
          if(typeof value == 'object') {                                                                              // 91
            value = JSON.stringify(value);                                                                            // 92
          }                                                                                                           // 93
          payload[field] = value;                                                                                     // 94
        }                                                                                                             // 95
      };                                                                                                              // 96
                                                                                                                      // 97
      var kadiraInfo = Kadira._getInfo();                                                                             // 98
      if(kadiraInfo) {                                                                                                // 99
        var eventId = Kadira.tracer.event(kadiraInfo.trace, 'db', payload);                                           // 100
      }                                                                                                               // 101
                                                                                                                      // 102
      try{                                                                                                            // 103
        var ret = originalFunc.apply(this, arguments);                                                                // 104
                                                                                                                      // 105
        var endData = {};                                                                                             // 106
        if(type == 'observeChanges' || type == 'observe') {                                                           // 107
          var observerDriver;                                                                                         // 108
          endData.oplog = false;                                                                                      // 109
          if(ret._multiplexer) {                                                                                      // 110
            endData.noOfHandles = Object.keys(ret._multiplexer._handles).length;                                      // 111
            // track the cache handlers                                                                               // 112
            if(kadiraInfo && kadiraInfo.trace.type == 'sub') {                                                        // 113
              var isCachedHandle = endData.noOfHandles > 1;                                                           // 114
              Kadira.models.pubsub.incrementHandleCount(kadiraInfo.trace, isCachedHandle);                            // 115
            }                                                                                                         // 116
                                                                                                                      // 117
            // older meteor versions done not have an _multiplexer value                                              // 118
            observerDriver = ret._multiplexer._observeDriver;                                                         // 119
            if(observerDriver) {                                                                                      // 120
              observerDriver = ret._multiplexer._observeDriver;                                                       // 121
              var observerDriverClass = observerDriver.constructor;                                                   // 122
              var usesOplog = typeof observerDriverClass.cursorSupported == 'function';                               // 123
              endData.oplog = usesOplog;                                                                              // 124
              var size = 0;                                                                                           // 125
              ret._multiplexer._cache.docs.forEach(function() {size++});                                              // 126
              endData.noOfCachedDocs = size;                                                                          // 127
            }                                                                                                         // 128
          }                                                                                                           // 129
                                                                                                                      // 130
          if(!endData.oplog) {                                                                                        // 131
            // let's try to find the reason                                                                           // 132
            var reasonInfo = Kadira.checkWhyNoOplog(cursorDescription, observerDriver);                               // 133
            endData.noOplogCode = reasonInfo.code;                                                                    // 134
            endData.noOplogReason = reasonInfo.reason;                                                                // 135
            endData.noOplogSolution = reasonInfo.solution;                                                            // 136
          }                                                                                                           // 137
        } else if(type == 'fetch' || type == 'map'){                                                                  // 138
          //for other cursor operation                                                                                // 139
          endData.docsFetched = ret.length;                                                                           // 140
        }                                                                                                             // 141
                                                                                                                      // 142
        if(eventId) {                                                                                                 // 143
          Kadira.tracer.eventEnd(kadiraInfo.trace, eventId, endData);                                                 // 144
        }                                                                                                             // 145
        return ret;                                                                                                   // 146
      } catch(ex) {                                                                                                   // 147
        if(eventId) {                                                                                                 // 148
          Kadira.tracer.eventEnd(kadiraInfo.trace, eventId, {err: ex.message});                                       // 149
        }                                                                                                             // 150
        throw ex;                                                                                                     // 151
      }                                                                                                               // 152
    };                                                                                                                // 153
  });                                                                                                                 // 154
                                                                                                                      // 155
  cursorProto._ampOk = true;                                                                                          // 156
}                                                                                                                     // 157
                                                                                                                      // 158
function getMongoConnectionProto() {                                                                                  // 159
  var coll = new Meteor.Collection('__kadira_dummy_collection__');                                                    // 160
  //we need wait until db get connected with meteor, .findOne() does that                                             // 161
  coll.findOne();                                                                                                     // 162
  return MongoInternals.defaultRemoteCollectionDriver().mongo.constructor.prototype;                                  // 163
}                                                                                                                     // 164
                                                                                                                      // 165
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}).call(this);






(function () {

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                    //
// packages/meteorhacks:kadira/lib/hijack/http.js                                                                     //
//                                                                                                                    //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                      //
var originalCall = HTTP.call;                                                                                         // 1
                                                                                                                      // 2
HTTP.call = function(method, url) {                                                                                   // 3
  var kadiraInfo = Kadira._getInfo();                                                                                 // 4
  if(kadiraInfo) {                                                                                                    // 5
    var eventId = Kadira.tracer.event(kadiraInfo.trace, 'http', {method: method, url: url});                          // 6
  }                                                                                                                   // 7
                                                                                                                      // 8
  try {                                                                                                               // 9
    var response = originalCall.apply(this, arguments);                                                               // 10
                                                                                                                      // 11
    //if the user supplied an asynCallback, we don't have a response object and it handled asynchronously             // 12
    //we need to track it down to prevent issues like: #3                                                             // 13
    var endOptions = HaveAsyncCallback(arguments)? {async: true}: {statusCode: response.statusCode};                  // 14
    if(eventId) {                                                                                                     // 15
      Kadira.tracer.eventEnd(kadiraInfo.trace, eventId, endOptions);                                                  // 16
    }                                                                                                                 // 17
    return response;                                                                                                  // 18
  } catch(ex) {                                                                                                       // 19
    if(eventId) {                                                                                                     // 20
      Kadira.tracer.eventEnd(kadiraInfo.trace, eventId, {err: ex.message});                                           // 21
    }                                                                                                                 // 22
    throw ex;                                                                                                         // 23
  }                                                                                                                   // 24
};                                                                                                                    // 25
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}).call(this);






(function () {

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                    //
// packages/meteorhacks:kadira/lib/hijack/email.js                                                                    //
//                                                                                                                    //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                      //
var originalSend = Email.send;                                                                                        // 1
                                                                                                                      // 2
Email.send = function(options) {                                                                                      // 3
  var kadiraInfo = Kadira._getInfo();                                                                                 // 4
  if(kadiraInfo) {                                                                                                    // 5
    var eventId = Kadira.tracer.event(kadiraInfo.trace, 'email');                                                     // 6
  }                                                                                                                   // 7
  try {                                                                                                               // 8
    var ret = originalSend.call(this, options);                                                                       // 9
    if(eventId) {                                                                                                     // 10
      Kadira.tracer.eventEnd(kadiraInfo.trace, eventId);                                                              // 11
    }                                                                                                                 // 12
    return ret;                                                                                                       // 13
  } catch(ex) {                                                                                                       // 14
    if(eventId) {                                                                                                     // 15
      Kadira.tracer.eventEnd(kadiraInfo.trace, eventId, {err: ex.message});                                           // 16
    }                                                                                                                 // 17
    throw ex;                                                                                                         // 18
  }                                                                                                                   // 19
};                                                                                                                    // 20
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}).call(this);






(function () {

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                    //
// packages/meteorhacks:kadira/lib/hijack/async.js                                                                    //
//                                                                                                                    //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                      //
var Fibers = Npm.require('fibers');                                                                                   // 1
                                                                                                                      // 2
var originalYield = Fibers.yield;                                                                                     // 3
Fibers.yield = function() {                                                                                           // 4
  var kadiraInfo = Kadira._getInfo();                                                                                 // 5
  if(kadiraInfo) {                                                                                                    // 6
    var eventId = Kadira.tracer.event(kadiraInfo.trace, 'async');;                                                    // 7
    if(eventId) {                                                                                                     // 8
      Fibers.current._apmEventId = eventId;                                                                           // 9
    }                                                                                                                 // 10
  }                                                                                                                   // 11
                                                                                                                      // 12
  originalYield();                                                                                                    // 13
};                                                                                                                    // 14
                                                                                                                      // 15
var originalRun = Fibers.prototype.run;                                                                               // 16
Fibers.prototype.run = function(val) {                                                                                // 17
  if(this._apmEventId) {                                                                                              // 18
    var kadiraInfo = Kadira._getInfo(this);                                                                           // 19
    Kadira.tracer.eventEnd(kadiraInfo.trace, this._apmEventId);                                                       // 20
    this._apmEventId = null;                                                                                          // 21
  }                                                                                                                   // 22
  originalRun.call(this, val);                                                                                        // 23
};                                                                                                                    // 24
                                                                                                                      // 25
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}).call(this);






(function () {

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                    //
// packages/meteorhacks:kadira/lib/hijack/error.js                                                                    //
//                                                                                                                    //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                      //
process.on('uncaughtException', function (err) {                                                                      // 1
  // let the server crash normally if error tracking is disabled                                                      // 2
  if(!Kadira.options.enableErrorTracking) {                                                                           // 3
    throw err;                                                                                                        // 4
  }                                                                                                                   // 5
                                                                                                                      // 6
  // looking for already tracked errors and throw them immediately                                                    // 7
  // throw error immediately if kadira is not ready                                                                   // 8
  if(err._tracked || !Kadira.connected) {                                                                             // 9
    throw err;                                                                                                        // 10
  }                                                                                                                   // 11
                                                                                                                      // 12
  var trace = getTrace(err, 'server-crash', 'uncaughtException');                                                     // 13
  Kadira.models.error.trackError(err, trace);                                                                         // 14
  Kadira.sendPayload(function () {                                                                                    // 15
    clearTimeout(timer);                                                                                              // 16
    throwError(err);                                                                                                  // 17
  });                                                                                                                 // 18
                                                                                                                      // 19
  var timer = setTimeout(function () {                                                                                // 20
    throwError(err);                                                                                                  // 21
  }, 1000*10);                                                                                                        // 22
                                                                                                                      // 23
  function throwError(err) {                                                                                          // 24
    // sometimes error came back from a fiber.                                                                        // 25
    // But we don't fibers to track that error for us                                                                 // 26
    // That's why we throw the error on the nextTick                                                                  // 27
    process.nextTick(function() {                                                                                     // 28
      // we need to mark this error where we really need to throw                                                     // 29
      err._tracked = true;                                                                                            // 30
      throw err;                                                                                                      // 31
    });                                                                                                               // 32
  }                                                                                                                   // 33
});                                                                                                                   // 34
                                                                                                                      // 35
var originalMeteorDebug = Meteor._debug;                                                                              // 36
Meteor._debug = function (message, stack) {                                                                           // 37
  if(!Kadira.options.enableErrorTracking) {                                                                           // 38
    return originalMeteorDebug.call(this, message, stack);                                                            // 39
  }                                                                                                                   // 40
                                                                                                                      // 41
  // We've changed `stack` into an object at method and sub handlers so we can                                        // 42
  // ignore them here. These errors are already tracked so don't track again.                                         // 43
  if(stack && stack.stack) {                                                                                          // 44
    stack = stack.stack                                                                                               // 45
  } else {                                                                                                            // 46
    // only send to the server, if only connected to kadira                                                           // 47
    if(Kadira.connected) {                                                                                            // 48
      var error = new Error(message);                                                                                 // 49
      error.stack = stack;                                                                                            // 50
      var trace = getTrace(error, 'server-internal', 'Meteor._debug');                                                // 51
      Kadira.models.error.trackError(error, trace);                                                                   // 52
    }                                                                                                                 // 53
  }                                                                                                                   // 54
                                                                                                                      // 55
  return originalMeteorDebug.apply(this, arguments);                                                                  // 56
}                                                                                                                     // 57
                                                                                                                      // 58
function getTrace(err, type, subType) {                                                                               // 59
  return {                                                                                                            // 60
    type: type,                                                                                                       // 61
    subType: subType,                                                                                                 // 62
    name: err.message,                                                                                                // 63
    errored: true,                                                                                                    // 64
    at: Kadira.syncedDate.getTime(),                                                                                  // 65
    events: [                                                                                                         // 66
      ['start', 0, {}],                                                                                               // 67
      ['error', 0, {error: {message: err.message, stack: err.stack}}]                                                 // 68
    ],                                                                                                                // 69
    metrics: {                                                                                                        // 70
      total: 0                                                                                                        // 71
    }                                                                                                                 // 72
  };                                                                                                                  // 73
}                                                                                                                     // 74
                                                                                                                      // 75
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}).call(this);






(function () {

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                    //
// packages/meteorhacks:kadira/lib/auto_connect.js                                                                    //
//                                                                                                                    //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                      //
// AutoConnect using Environment Variables                                                                            // 1
if(process.env.KADIRA_APP_ID && process.env.KADIRA_APP_SECRET) {                                                      // 2
  Kadira.connect(                                                                                                     // 3
    process.env.KADIRA_APP_ID,                                                                                        // 4
    process.env.KADIRA_APP_SECRET                                                                                     // 5
  );                                                                                                                  // 6
                                                                                                                      // 7
  Kadira.connect = function() {                                                                                       // 8
    throw new Error('Kadira has been already connected using credentials from Environment Variables');                // 9
  };                                                                                                                  // 10
}                                                                                                                     // 11
                                                                                                                      // 12
// AutoConnect using Meteor.settings                                                                                  // 13
if(Meteor.settings.kadira) {                                                                                          // 14
  Kadira.connect(                                                                                                     // 15
    Meteor.settings.kadira.appId,                                                                                     // 16
    Meteor.settings.kadira.appSecret,                                                                                 // 17
    Meteor.settings.kadira.options || {}                                                                              // 18
  );                                                                                                                  // 19
                                                                                                                      // 20
  Kadira.connect = function() {                                                                                       // 21
    throw new Error('Kadira has been already connected using credentials from Meteor.settings');                      // 22
  };                                                                                                                  // 23
}                                                                                                                     // 24
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}).call(this);


/* Exports */
if (typeof Package === 'undefined') Package = {};
Package['meteorhacks:kadira'] = {
  Kadira: Kadira
};

})();
