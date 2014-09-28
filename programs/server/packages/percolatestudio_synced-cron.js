(function () {

/* Imports */
var Meteor = Package.meteor.Meteor;
var _ = Package.underscore._;
var check = Package.check.check;
var Match = Package.check.Match;
var MongoInternals = Package.mongo.MongoInternals;
var Mongo = Package.mongo.Mongo;

/* Package-scope variables */
var SyncedCron, Later;

(function () {

/////////////////////////////////////////////////////////////////////////////////////
//                                                                                 //
// packages/percolatestudio:synced-cron/synced-cron-server.js                      //
//                                                                                 //
/////////////////////////////////////////////////////////////////////////////////////
                                                                                   //
// A package for running jobs synchronized across multiple processes               // 1
SyncedCron = {                                                                     // 2
  _entries: [],                                                                    // 3
  options: {                                                                       // 4
    log: true,                                                                     // 5
    collectionName: 'cronHistory',                                                 // 6
    utc: false //default to using localTime                                        // 7
  }                                                                                // 8
}                                                                                  // 9
                                                                                   // 10
Later = Npm.require('later');                                                      // 11
                                                                                   // 12
// Use UTC or localtime for evaluating schedules                                   // 13
if (SyncedCron.options.utc)                                                        // 14
  Later.date.UTC();                                                                // 15
else                                                                               // 16
  Later.date.localTime();                                                          // 17
                                                                                   // 18
// collection holding the job history records                                      // 19
SyncedCron._collection =                                                           // 20
  new Mongo.Collection(SyncedCron.options.collectionName);                         // 21
SyncedCron._collection._ensureIndex({intendedAt: 1, name: 1}, {unique: true});     // 22
                                                                                   // 23
var log = {                                                                        // 24
  info: function(message) {                                                        // 25
    if (SyncedCron.options.log)                                                    // 26
      console.log(message);                                                        // 27
  }                                                                                // 28
}                                                                                  // 29
                                                                                   // 30
// add a scheduled job                                                             // 31
// SyncedCron.add({                                                                // 32
//   name: String, //*required* unique name of the job                             // 33
//   schedule: function(laterParser) {},//*required* when to run the job           // 34
//   job: function() {}, //*required* the code to run                              // 35
// });                                                                             // 36
SyncedCron.add = function(entry) {                                                 // 37
  check(entry.name, String);                                                       // 38
  check(entry.schedule, Function);                                                 // 39
  check(entry.job, Function);                                                      // 40
                                                                                   // 41
  // check                                                                         // 42
  this._entries.push(entry);                                                       // 43
}                                                                                  // 44
                                                                                   // 45
// Start processing added jobs                                                     // 46
SyncedCron.start = function() {                                                    // 47
  var self = this;                                                                 // 48
                                                                                   // 49
  // Schedule each job with later.js                                               // 50
  this._entries.forEach(function(entry) {                                          // 51
    var schedule = entry.schedule(Later.parse);                                    // 52
    entry._timer = self._laterSetInterval(self._entryWrapper(entry), schedule);    // 53
                                                                                   // 54
    log.info('SyncedCron: scheduled "' + entry.name + '" next run @'               // 55
      + Later.schedule(schedule).next(1));                                         // 56
  });                                                                              // 57
}                                                                                  // 58
                                                                                   // 59
// Return the next scheduled date of the first matching entry or undefined         // 60
SyncedCron.nextScheduledAtDate = function (jobName) {                              // 61
  var entry = _.find(this._entries, function(entry) {                              // 62
    return entry.name === jobName;                                                 // 63
  });                                                                              // 64
                                                                                   // 65
  if (entry)                                                                       // 66
    return Later.schedule(entry.schedule(Later.parse)).next(1);                    // 67
}                                                                                  // 68
                                                                                   // 69
// Stop processing jobs                                                            // 70
SyncedCron.stop = function() {                                                     // 71
  if (this._timer) {                                                               // 72
    this._timer.clear();                                                           // 73
    this._timer = null;                                                            // 74
  }                                                                                // 75
}                                                                                  // 76
                                                                                   // 77
// The meat of our logic. Checks if the specified has already run. If not,         // 78
// records that it's running the job, runs it, and records the output              // 79
SyncedCron._entryWrapper = function(entry) {                                       // 80
  var self = this;                                                                 // 81
                                                                                   // 82
  return function(intendedAt) {                                                    // 83
    var jobHistory = {                                                             // 84
      intendedAt: intendedAt,                                                      // 85
      name: entry.name,                                                            // 86
      startedAt: new Date()                                                        // 87
    };                                                                             // 88
                                                                                   // 89
    // If we have a dup key error, another instance has already tried to run       // 90
    // this job.                                                                   // 91
    try {                                                                          // 92
      jobHistory._id = self._collection.insert(jobHistory);                        // 93
    } catch(e) {                                                                   // 94
      // http://www.mongodb.org/about/contributors/error-codes/                    // 95
      // 11000 == duplicate key error                                              // 96
      if (e.name === 'MongoError' && e.code === 11000) {                           // 97
        log.info('SyncedCron: Not running "' + entry.name + '" again.');           // 98
        return;                                                                    // 99
      }                                                                            // 100
                                                                                   // 101
      throw e;                                                                     // 102
    };                                                                             // 103
                                                                                   // 104
    // run and record the job                                                      // 105
    try {                                                                          // 106
      log.info('SyncedCron: Starting "' + entry.name + '".');                      // 107
      var output = entry.job(intendedAt); // <- Run the actual job                 // 108
                                                                                   // 109
      log.info('SyncedCron: Finished "' + entry.name + '".');                      // 110
      self._collection.update({_id: jobHistory._id}, {                             // 111
        $set: {                                                                    // 112
          finishedAt: new Date(),                                                  // 113
          result: output                                                           // 114
        }                                                                          // 115
      });                                                                          // 116
                                                                                   // 117
      if (entry.purgeLogsAfterDays)                                                // 118
        SyncedCron._purgeEntries(entry.name, entry.purgeLogsAfterDays);            // 119
    } catch(e) {                                                                   // 120
      log.info('SyncedCron: Exception "' + entry.name +'" ' + e.stack);            // 121
      self._collection.update({_id: jobHistory._id}, {                             // 122
        $set: {                                                                    // 123
          finishedAt: new Date(),                                                  // 124
          error: e.stack                                                           // 125
        }                                                                          // 126
      });                                                                          // 127
    }                                                                              // 128
  };                                                                               // 129
}                                                                                  // 130
                                                                                   // 131
// remove entries that are older than daysBefore                                   // 132
SyncedCron._purgeEntries = function(name, daysBefore) {                            // 133
  var beforeDate = new Date;                                                       // 134
  beforeDate.setDate(beforeDate.getDate() - daysBefore);                           // 135
                                                                                   // 136
  this._collection.remove({name: name, startedAt: {$lte: beforeDate}});            // 137
}                                                                                  // 138
                                                                                   // 139
// for tests                                                                       // 140
SyncedCron._reset = function() {                                                   // 141
  this._entries = [];                                                              // 142
  this._collection.remove({});                                                     // 143
}                                                                                  // 144
                                                                                   // 145
// ---------------------------------------------------------------------------     // 146
// The following two functions are lifted from the later.js package, however       // 147
// I've made the following changes:                                                // 148
// - Use Meteor.setTimeout and Meteor.clearTimeout                                 // 149
// - Added an 'intendedAt' parameter to the callback fn that specifies the precise // 150
//   time the callback function *should* be run (so we can co-ordinate jobs)       // 151
//   between multiple, potentially laggy and unsynced machines                     // 152
                                                                                   // 153
// From: https://github.com/bunkat/later/blob/master/src/core/setinterval.js       // 154
SyncedCron._laterSetInterval = function(fn, sched) {                               // 155
                                                                                   // 156
  var t = SyncedCron._laterSetTimeout(scheduleTimeout, sched),                     // 157
      done = false;                                                                // 158
                                                                                   // 159
  /**                                                                              // 160
  * Executes the specified function and then sets the timeout for the next         // 161
  * interval.                                                                      // 162
  */                                                                               // 163
  function scheduleTimeout(intendedAt) {                                           // 164
    if(!done) {                                                                    // 165
      fn(intendedAt);                                                              // 166
      t = SyncedCron._laterSetTimeout(scheduleTimeout, sched);                     // 167
    }                                                                              // 168
  }                                                                                // 169
                                                                                   // 170
  return {                                                                         // 171
                                                                                   // 172
    /**                                                                            // 173
    * Clears the timeout.                                                          // 174
    */                                                                             // 175
    clear: function() {                                                            // 176
      done = true;                                                                 // 177
      t.clear();                                                                   // 178
    }                                                                              // 179
                                                                                   // 180
  };                                                                               // 181
                                                                                   // 182
};                                                                                 // 183
                                                                                   // 184
// From: https://github.com/bunkat/later/blob/master/src/core/settimeout.js        // 185
SyncedCron._laterSetTimeout = function(fn, sched) {                                // 186
                                                                                   // 187
  var s = Later.schedule(sched), t;                                                // 188
  scheduleTimeout();                                                               // 189
                                                                                   // 190
  /**                                                                              // 191
  * Schedules the timeout to occur. If the next occurrence is greater than the     // 192
  * max supported delay (2147483647 ms) than we delay for that amount before       // 193
  * attempting to schedule the timeout again.                                      // 194
  */                                                                               // 195
  function scheduleTimeout() {                                                     // 196
    var now = Date.now(),                                                          // 197
        next = s.next(2, now),                                                     // 198
        diff = next[0].getTime() - now,                                            // 199
        intendedAt = next[0];                                                      // 200
                                                                                   // 201
    // minimum time to fire is one second, use next occurrence instead             // 202
    if(diff < 1000) {                                                              // 203
      diff = next[1].getTime() - now;                                              // 204
      intendedAt = next[1];                                                        // 205
    }                                                                              // 206
                                                                                   // 207
    if(diff < 2147483647) {                                                        // 208
      t = Meteor.setTimeout(function() { fn(intendedAt); }, diff);                 // 209
    }                                                                              // 210
    else {                                                                         // 211
      t = Meteor.setTimeout(scheduleTimeout, 2147483647);                          // 212
    }                                                                              // 213
  }                                                                                // 214
                                                                                   // 215
  return {                                                                         // 216
                                                                                   // 217
    /**                                                                            // 218
    * Clears the timeout.                                                          // 219
    */                                                                             // 220
    clear: function() {                                                            // 221
      Meteor.clearTimeout(t);                                                      // 222
    }                                                                              // 223
                                                                                   // 224
  };                                                                               // 225
                                                                                   // 226
};                                                                                 // 227
// ---------------------------------------------------------------------------     // 228
/////////////////////////////////////////////////////////////////////////////////////

}).call(this);


/* Exports */
if (typeof Package === 'undefined') Package = {};
Package['percolatestudio:synced-cron'] = {
  SyncedCron: SyncedCron
};

})();
