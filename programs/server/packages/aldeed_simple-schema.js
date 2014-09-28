(function () {

/* Imports */
var Meteor = Package.meteor.Meteor;
var Tracker = Package.tracker.Tracker;
var Deps = Package.tracker.Deps;
var _ = Package.underscore._;
var check = Package.check.check;
var Match = Package.check.Match;
var Random = Package.random.Random;

/* Package-scope variables */
var SimpleSchema, MongoObject, Utility, S, doValidation1, doValidation2, SimpleSchemaValidationContext;

(function () {

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/aldeed:simple-schema/mongo-object.js                                                                       //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
/*                                                                                                                     // 1
 * @constructor                                                                                                        // 2
 * @param {Object} objOrModifier                                                                                       // 3
 * @param {string[]} blackBoxKeys - A list of the names of keys that shouldn't be traversed                            // 4
 * @returns {undefined}                                                                                                // 5
 *                                                                                                                     // 6
 * Creates a new MongoObject instance. The object passed as the first argument                                         // 7
 * will be modified in place by calls to instance methods. Also, immediately                                           // 8
 * upon creation of the instance, the object will have any `undefined` keys                                            // 9
 * removed recursively.                                                                                                // 10
 */                                                                                                                    // 11
MongoObject = function(objOrModifier, blackBoxKeys) {                                                                  // 12
  var self = this;                                                                                                     // 13
  self._obj = objOrModifier;                                                                                           // 14
  self._affectedKeys = {};                                                                                             // 15
  self._genericAffectedKeys = {};                                                                                      // 16
  self._parentPositions = [];                                                                                          // 17
  self._positionsInsideArrays = [];                                                                                    // 18
  self._objectPositions = [];                                                                                          // 19
                                                                                                                       // 20
  function parseObj(val, currentPosition, affectedKey, operator, adjusted, isWithinArray) {                            // 21
                                                                                                                       // 22
    // Adjust for first-level modifier operators                                                                       // 23
    if (!operator && affectedKey && affectedKey.substring(0, 1) === "$") {                                             // 24
      operator = affectedKey;                                                                                          // 25
      affectedKey = null;                                                                                              // 26
    }                                                                                                                  // 27
                                                                                                                       // 28
    var affectedKeyIsBlackBox = false;                                                                                 // 29
    var affectedKeyGeneric;                                                                                            // 30
    var stop = false;                                                                                                  // 31
    if (affectedKey) {                                                                                                 // 32
                                                                                                                       // 33
      // Adjust for $push and $addToSet and $pull and $pop                                                             // 34
      if (!adjusted) {                                                                                                 // 35
        if (operator === "$push" || operator === "$addToSet" || operator === "$pop") {                                 // 36
          // Adjust for $each                                                                                          // 37
          // We can simply jump forward and pretend like the $each array                                               // 38
          // is the array for the field. This has the added benefit of                                                 // 39
          // skipping past any $slice, which we also don't care about.                                                 // 40
          if (isBasicObject(val) && "$each" in val) {                                                                  // 41
            val = val.$each;                                                                                           // 42
            currentPosition = currentPosition + "[$each]";                                                             // 43
          } else {                                                                                                     // 44
            affectedKey = affectedKey + ".0";                                                                          // 45
          }                                                                                                            // 46
          adjusted = true;                                                                                             // 47
        } else if (operator === "$pull") {                                                                             // 48
          affectedKey = affectedKey + ".0";                                                                            // 49
          if (isBasicObject(val)) {                                                                                    // 50
            stop = true;                                                                                               // 51
          }                                                                                                            // 52
          adjusted = true;                                                                                             // 53
        }                                                                                                              // 54
      }                                                                                                                // 55
                                                                                                                       // 56
      // Make generic key                                                                                              // 57
      affectedKeyGeneric = makeGeneric(affectedKey);                                                                   // 58
                                                                                                                       // 59
      // Determine whether affected key should be treated as a black box                                               // 60
      affectedKeyIsBlackBox = _.contains(blackBoxKeys, affectedKeyGeneric);                                            // 61
                                                                                                                       // 62
      // Mark that this position affects this generic and non-generic key                                              // 63
      if (currentPosition) {                                                                                           // 64
        self._affectedKeys[currentPosition] = affectedKey;                                                             // 65
        self._genericAffectedKeys[currentPosition] = affectedKeyGeneric;                                               // 66
                                                                                                                       // 67
        // If we're within an array, mark this position so we can omit it from flat docs                               // 68
        isWithinArray && self._positionsInsideArrays.push(currentPosition);                                            // 69
      }                                                                                                                // 70
    }                                                                                                                  // 71
                                                                                                                       // 72
    if (stop)                                                                                                          // 73
      return;                                                                                                          // 74
                                                                                                                       // 75
    // Loop through arrays                                                                                             // 76
    if (_.isArray(val) && !_.isEmpty(val)) {                                                                           // 77
      if (currentPosition) {                                                                                           // 78
        // Mark positions with arrays that should be ignored when we want endpoints only                               // 79
        self._parentPositions.push(currentPosition);                                                                   // 80
      }                                                                                                                // 81
                                                                                                                       // 82
      // Loop                                                                                                          // 83
      _.each(val, function(v, i) {                                                                                     // 84
        parseObj(v, (currentPosition ? currentPosition + "[" + i + "]" : i), affectedKey + '.' + i, operator, adjusted, true);
      });                                                                                                              // 86
    }                                                                                                                  // 87
                                                                                                                       // 88
    // Loop through object keys, only for basic objects,                                                               // 89
    // but always for the passed-in object, even if it                                                                 // 90
    // is a custom object.                                                                                             // 91
    else if ((isBasicObject(val) && !affectedKeyIsBlackBox) || !currentPosition) {                                     // 92
      if (currentPosition && !_.isEmpty(val)) {                                                                        // 93
        // Mark positions with objects that should be ignored when we want endpoints only                              // 94
        self._parentPositions.push(currentPosition);                                                                   // 95
        // Mark positions with objects that should be left out of flat docs.                                           // 96
        self._objectPositions.push(currentPosition);                                                                   // 97
      }                                                                                                                // 98
      // Loop                                                                                                          // 99
      _.each(val, function(v, k) {                                                                                     // 100
        if (v === void 0) {                                                                                            // 101
          delete val[k];                                                                                               // 102
        } else if (k !== "$slice") {                                                                                   // 103
          parseObj(v, (currentPosition ? currentPosition + "[" + k + "]" : k), appendAffectedKey(affectedKey, k), operator, adjusted, isWithinArray);
        }                                                                                                              // 105
      });                                                                                                              // 106
    }                                                                                                                  // 107
                                                                                                                       // 108
  }                                                                                                                    // 109
  parseObj(self._obj);                                                                                                 // 110
                                                                                                                       // 111
  function reParseObj() {                                                                                              // 112
    self._affectedKeys = {};                                                                                           // 113
    self._genericAffectedKeys = {};                                                                                    // 114
    self._parentPositions = [];                                                                                        // 115
    self._positionsInsideArrays = [];                                                                                  // 116
    self._objectPositions = [];                                                                                        // 117
    parseObj(self._obj);                                                                                               // 118
  }                                                                                                                    // 119
                                                                                                                       // 120
  /**                                                                                                                  // 121
   * @method MongoObject.forEachNode                                                                                   // 122
   * @param {Function} func                                                                                            // 123
   * @param {Object} [options]                                                                                         // 124
   * @param {Boolean} [options.endPointsOnly=true] - Only call function for endpoints and not for nodes that contain other nodes
   * @returns {undefined}                                                                                              // 126
   *                                                                                                                   // 127
   * Runs a function for each endpoint node in the object tree, including all items in every array.                    // 128
   * The function arguments are                                                                                        // 129
   * (1) the value at this node                                                                                        // 130
   * (2) a string representing the node position                                                                       // 131
   * (3) the representation of what would be changed in mongo, using mongo dot notation                                // 132
   * (4) the generic equivalent of argument 3, with "$" instead of numeric pieces                                      // 133
   */                                                                                                                  // 134
  self.forEachNode = function(func, options) {                                                                         // 135
    if (typeof func !== "function")                                                                                    // 136
      throw new Error("filter requires a loop function");                                                              // 137
                                                                                                                       // 138
    options = _.extend({                                                                                               // 139
      endPointsOnly: true                                                                                              // 140
    }, options);                                                                                                       // 141
                                                                                                                       // 142
    var updatedValues = {};                                                                                            // 143
    _.each(self._affectedKeys, function(affectedKey, position) {                                                       // 144
      if (options.endPointsOnly && _.contains(self._parentPositions, position))                                        // 145
        return; //only endpoints                                                                                       // 146
      func.call({                                                                                                      // 147
        value: self.getValueForPosition(position),                                                                     // 148
        operator: extractOp(position),                                                                                 // 149
        position: position,                                                                                            // 150
        key: affectedKey,                                                                                              // 151
        genericKey: self._genericAffectedKeys[position],                                                               // 152
        updateValue: function(newVal) {                                                                                // 153
          updatedValues[position] = newVal;                                                                            // 154
        },                                                                                                             // 155
        remove: function() {                                                                                           // 156
          updatedValues[position] = void 0;                                                                            // 157
        }                                                                                                              // 158
      });                                                                                                              // 159
    });                                                                                                                // 160
                                                                                                                       // 161
    // Actually update/remove values as instructed                                                                     // 162
    _.each(updatedValues, function(newVal, position) {                                                                 // 163
      self.setValueForPosition(position, newVal);                                                                      // 164
    });                                                                                                                // 165
                                                                                                                       // 166
  };                                                                                                                   // 167
                                                                                                                       // 168
  self.getValueForPosition = function(position) {                                                                      // 169
    var subkey, subkeys = position.split("["), current = self._obj;                                                    // 170
    for (var i = 0, ln = subkeys.length; i < ln; i++) {                                                                // 171
      subkey = subkeys[i];                                                                                             // 172
      // If the subkey ends in "]", remove the ending                                                                  // 173
      if (subkey.slice(-1) === "]") {                                                                                  // 174
        subkey = subkey.slice(0, -1);                                                                                  // 175
      }                                                                                                                // 176
      current = current[subkey];                                                                                       // 177
      if (!_.isArray(current) && !isBasicObject(current) && i < ln - 1) {                                              // 178
        return;                                                                                                        // 179
      }                                                                                                                // 180
    }                                                                                                                  // 181
    return current;                                                                                                    // 182
  };                                                                                                                   // 183
                                                                                                                       // 184
  /**                                                                                                                  // 185
   * @method MongoObject.prototype.setValueForPosition                                                                 // 186
   * @param {String} position                                                                                          // 187
   * @param {Any} value                                                                                                // 188
   * @returns {undefined}                                                                                              // 189
   */                                                                                                                  // 190
  self.setValueForPosition = function(position, value) {                                                               // 191
    var nextPiece, subkey, subkeys = position.split("["), current = self._obj;                                         // 192
                                                                                                                       // 193
    for (var i = 0, ln = subkeys.length; i < ln; i++) {                                                                // 194
      subkey = subkeys[i];                                                                                             // 195
      // If the subkey ends in "]", remove the ending                                                                  // 196
      if (subkey.slice(-1) === "]") {                                                                                  // 197
        subkey = subkey.slice(0, -1);                                                                                  // 198
      }                                                                                                                // 199
      // If we've reached the key in the object tree that needs setting or                                             // 200
      // deleting, do it.                                                                                              // 201
      if (i === ln - 1) {                                                                                              // 202
        current[subkey] = value;                                                                                       // 203
        //if value is undefined, delete the property                                                                   // 204
        if (value === void 0)                                                                                          // 205
          delete current[subkey];                                                                                      // 206
      }                                                                                                                // 207
      // Otherwise attempt to keep moving deeper into the object.                                                      // 208
      else {                                                                                                           // 209
        // If we're setting (as opposed to deleting) a key and we hit a place                                          // 210
        // in the ancestor chain where the keys are not yet created, create them.                                      // 211
        if (current[subkey] === void 0 && value !== void 0) {                                                          // 212
          //see if the next piece is a number                                                                          // 213
          nextPiece = subkeys[i + 1];                                                                                  // 214
          nextPiece = parseInt(nextPiece, 10);                                                                         // 215
          current[subkey] = isNaN(nextPiece) ? {} : [];                                                                // 216
        }                                                                                                              // 217
                                                                                                                       // 218
        // Move deeper into the object                                                                                 // 219
        current = current[subkey];                                                                                     // 220
                                                                                                                       // 221
        // If we can go no further, then quit                                                                          // 222
        if (!_.isArray(current) && !isBasicObject(current) && i < ln - 1) {                                            // 223
          return;                                                                                                      // 224
        }                                                                                                              // 225
      }                                                                                                                // 226
    }                                                                                                                  // 227
                                                                                                                       // 228
    reParseObj();                                                                                                      // 229
  };                                                                                                                   // 230
                                                                                                                       // 231
  /**                                                                                                                  // 232
   * @method MongoObject.prototype.removeValueForPosition                                                              // 233
   * @param {String} position                                                                                          // 234
   * @returns {undefined}                                                                                              // 235
   */                                                                                                                  // 236
  self.removeValueForPosition = function(position) {                                                                   // 237
    self.setValueForPosition(position, void 0);                                                                        // 238
  };                                                                                                                   // 239
                                                                                                                       // 240
  /**                                                                                                                  // 241
   * @method MongoObject.prototype.getKeyForPosition                                                                   // 242
   * @param {String} position                                                                                          // 243
   * @returns {undefined}                                                                                              // 244
   */                                                                                                                  // 245
  self.getKeyForPosition = function(position) {                                                                        // 246
    return self._affectedKeys[position];                                                                               // 247
  };                                                                                                                   // 248
                                                                                                                       // 249
  /**                                                                                                                  // 250
   * @method MongoObject.prototype.getGenericKeyForPosition                                                            // 251
   * @param {String} position                                                                                          // 252
   * @returns {undefined}                                                                                              // 253
   */                                                                                                                  // 254
  self.getGenericKeyForPosition = function(position) {                                                                 // 255
    return self._genericAffectedKeys[position];                                                                        // 256
  };                                                                                                                   // 257
                                                                                                                       // 258
  /**                                                                                                                  // 259
   * @method MongoObject.getInfoForKey                                                                                 // 260
   * @param {String} key - Non-generic key                                                                             // 261
   * @returns {undefined|Object}                                                                                       // 262
   *                                                                                                                   // 263
   * Returns the value and operator of the requested non-generic key.                                                  // 264
   * Example: {value: 1, operator: "$pull"}                                                                            // 265
   */                                                                                                                  // 266
  self.getInfoForKey = function(key) {                                                                                 // 267
    // Get the info                                                                                                    // 268
    var position = self.getPositionForKey(key);                                                                        // 269
    if (position) {                                                                                                    // 270
      return {                                                                                                         // 271
        value: self.getValueForPosition(position),                                                                     // 272
        operator: extractOp(position)                                                                                  // 273
      };                                                                                                               // 274
    }                                                                                                                  // 275
                                                                                                                       // 276
    // If we haven't returned yet, check to see if there is an array value                                             // 277
    // corresponding to this key                                                                                       // 278
    // We find the first item within the array, strip the last piece off the                                           // 279
    // position string, and then return whatever is at that new position in                                            // 280
    // the original object.                                                                                            // 281
    var positions = self.getPositionsForGenericKey(key + ".$"), p, v;                                                  // 282
    for (var i = 0, ln = positions.length; i < ln; i++) {                                                              // 283
      p = positions[i];                                                                                                // 284
      v = self.getValueForPosition(p) || self.getValueForPosition(p.slice(0, p.lastIndexOf("[")));                     // 285
      if (v) {                                                                                                         // 286
        return {                                                                                                       // 287
          value: v,                                                                                                    // 288
          operator: extractOp(p)                                                                                       // 289
        };                                                                                                             // 290
      }                                                                                                                // 291
    }                                                                                                                  // 292
  };                                                                                                                   // 293
                                                                                                                       // 294
  /**                                                                                                                  // 295
   * @method MongoObject.getPositionForKey                                                                             // 296
   * @param {String} key - Non-generic key                                                                             // 297
   * @returns {undefined|String} Position string                                                                       // 298
   *                                                                                                                   // 299
   * Returns the position string for the place in the object that                                                      // 300
   * affects the requested non-generic key.                                                                            // 301
   * Example: 'foo[bar][0]'                                                                                            // 302
   */                                                                                                                  // 303
  self.getPositionForKey = function(key) {                                                                             // 304
    // Get the info                                                                                                    // 305
    for (var position in self._affectedKeys) {                                                                         // 306
      if (self._affectedKeys.hasOwnProperty(position)) {                                                               // 307
        if (self._affectedKeys[position] === key) {                                                                    // 308
          // We return the first one we find. While it's                                                               // 309
          // possible that multiple update operators could                                                             // 310
          // affect the same non-generic key, we'll assume that's not the case.                                        // 311
          return position;                                                                                             // 312
        }                                                                                                              // 313
      }                                                                                                                // 314
    }                                                                                                                  // 315
                                                                                                                       // 316
    // If we haven't returned yet, we need to check for affected keys                                                  // 317
  };                                                                                                                   // 318
                                                                                                                       // 319
  /**                                                                                                                  // 320
   * @method MongoObject.getPositionsForGenericKey                                                                     // 321
   * @param {String} key - Generic key                                                                                 // 322
   * @returns {String[]} Array of position strings                                                                     // 323
   *                                                                                                                   // 324
   * Returns an array of position strings for the places in the object that                                            // 325
   * affect the requested generic key.                                                                                 // 326
   * Example: ['foo[bar][0]']                                                                                          // 327
   */                                                                                                                  // 328
  self.getPositionsForGenericKey = function(key) {                                                                     // 329
    // Get the info                                                                                                    // 330
    var list = [];                                                                                                     // 331
    for (var position in self._genericAffectedKeys) {                                                                  // 332
      if (self._genericAffectedKeys.hasOwnProperty(position)) {                                                        // 333
        if (self._genericAffectedKeys[position] === key) {                                                             // 334
          list.push(position);                                                                                         // 335
        }                                                                                                              // 336
      }                                                                                                                // 337
    }                                                                                                                  // 338
                                                                                                                       // 339
    return list;                                                                                                       // 340
  };                                                                                                                   // 341
                                                                                                                       // 342
  /**                                                                                                                  // 343
   * @deprecated Use getInfoForKey                                                                                     // 344
   * @method MongoObject.getValueForKey                                                                                // 345
   * @param {String} key - Non-generic key                                                                             // 346
   * @returns {undefined|Any}                                                                                          // 347
   *                                                                                                                   // 348
   * Returns the value of the requested non-generic key                                                                // 349
   */                                                                                                                  // 350
  self.getValueForKey = function(key) {                                                                                // 351
    var position = self.getPositionForKey(key);                                                                        // 352
    if (position) {                                                                                                    // 353
      return self.getValueForPosition(position);                                                                       // 354
    }                                                                                                                  // 355
  };                                                                                                                   // 356
                                                                                                                       // 357
  /**                                                                                                                  // 358
   * @method MongoObject.prototype.addKey                                                                              // 359
   * @param {String} key - Key to set                                                                                  // 360
   * @param {Any} val - Value to give this key                                                                         // 361
   * @param {String} op - Operator under which to set it, or `null` for a non-modifier object                          // 362
   * @returns {undefined}                                                                                              // 363
   *                                                                                                                   // 364
   * Adds `key` with value `val` under operator `op` to the source object.                                             // 365
   */                                                                                                                  // 366
  self.addKey = function(key, val, op) {                                                                               // 367
    var position = op ? op + "[" + key + "]" : MongoObject._keyToPosition(key);                                        // 368
    self.setValueForPosition(position, val);                                                                           // 369
  };                                                                                                                   // 370
                                                                                                                       // 371
  /**                                                                                                                  // 372
   * @method MongoObject.prototype.removeGenericKeys                                                                   // 373
   * @param {String[]} keys                                                                                            // 374
   * @returns {undefined}                                                                                              // 375
   *                                                                                                                   // 376
   * Removes anything that affects any of the generic keys in the list                                                 // 377
   */                                                                                                                  // 378
  self.removeGenericKeys = function(keys) {                                                                            // 379
    for (var position in self._genericAffectedKeys) {                                                                  // 380
      if (self._genericAffectedKeys.hasOwnProperty(position)) {                                                        // 381
        if (_.contains(keys, self._genericAffectedKeys[position])) {                                                   // 382
          self.removeValueForPosition(position);                                                                       // 383
        }                                                                                                              // 384
      }                                                                                                                // 385
    }                                                                                                                  // 386
  };                                                                                                                   // 387
                                                                                                                       // 388
  /**                                                                                                                  // 389
   * @method MongoObject.removeGenericKey                                                                              // 390
   * @param {String} key                                                                                               // 391
   * @returns {undefined}                                                                                              // 392
   *                                                                                                                   // 393
   * Removes anything that affects the requested generic key                                                           // 394
   */                                                                                                                  // 395
  self.removeGenericKey = function(key) {                                                                              // 396
    for (var position in self._genericAffectedKeys) {                                                                  // 397
      if (self._genericAffectedKeys.hasOwnProperty(position)) {                                                        // 398
        if (self._genericAffectedKeys[position] === key) {                                                             // 399
          self.removeValueForPosition(position);                                                                       // 400
        }                                                                                                              // 401
      }                                                                                                                // 402
    }                                                                                                                  // 403
  };                                                                                                                   // 404
                                                                                                                       // 405
  /**                                                                                                                  // 406
   * @method MongoObject.removeKey                                                                                     // 407
   * @param {String} key                                                                                               // 408
   * @returns {undefined}                                                                                              // 409
   *                                                                                                                   // 410
   * Removes anything that affects the requested non-generic key                                                       // 411
   */                                                                                                                  // 412
  self.removeKey = function(key) {                                                                                     // 413
    // We don't use getPositionForKey here because we want to be sure to                                               // 414
    // remove for all positions if there are multiple.                                                                 // 415
    for (var position in self._affectedKeys) {                                                                         // 416
      if (self._affectedKeys.hasOwnProperty(position)) {                                                               // 417
        if (self._affectedKeys[position] === key) {                                                                    // 418
          self.removeValueForPosition(position);                                                                       // 419
        }                                                                                                              // 420
      }                                                                                                                // 421
    }                                                                                                                  // 422
  };                                                                                                                   // 423
                                                                                                                       // 424
  /**                                                                                                                  // 425
   * @method MongoObject.removeKeys                                                                                    // 426
   * @param {String[]} keys                                                                                            // 427
   * @returns {undefined}                                                                                              // 428
   *                                                                                                                   // 429
   * Removes anything that affects any of the non-generic keys in the list                                             // 430
   */                                                                                                                  // 431
  self.removeKeys = function(keys) {                                                                                   // 432
    for (var i = 0, ln = keys.length; i < ln; i++) {                                                                   // 433
      self.removeKey(keys[i]);                                                                                         // 434
    }                                                                                                                  // 435
  };                                                                                                                   // 436
                                                                                                                       // 437
  /**                                                                                                                  // 438
   * @method MongoObject.filterGenericKeys                                                                             // 439
   * @param {Function} test - Test function                                                                            // 440
   * @returns {undefined}                                                                                              // 441
   *                                                                                                                   // 442
   * Passes all affected keys to a test function, which                                                                // 443
   * should return false to remove whatever is affecting that key                                                      // 444
   */                                                                                                                  // 445
  self.filterGenericKeys = function(test) {                                                                            // 446
    var gk, checkedKeys = [], keysToRemove = [];                                                                       // 447
    for (var position in self._genericAffectedKeys) {                                                                  // 448
      if (self._genericAffectedKeys.hasOwnProperty(position)) {                                                        // 449
        gk = self._genericAffectedKeys[position];                                                                      // 450
        if (!_.contains(checkedKeys, gk)) {                                                                            // 451
          checkedKeys.push(gk);                                                                                        // 452
          if (gk && !test(gk)) {                                                                                       // 453
            keysToRemove.push(gk);                                                                                     // 454
          }                                                                                                            // 455
        }                                                                                                              // 456
      }                                                                                                                // 457
    }                                                                                                                  // 458
                                                                                                                       // 459
    _.each(keysToRemove, function(key) {                                                                               // 460
      self.removeGenericKey(key);                                                                                      // 461
    });                                                                                                                // 462
  };                                                                                                                   // 463
                                                                                                                       // 464
  /**                                                                                                                  // 465
   * @method MongoObject.setValueForKey                                                                                // 466
   * @param {String} key                                                                                               // 467
   * @param {Any} val                                                                                                  // 468
   * @returns {undefined}                                                                                              // 469
   *                                                                                                                   // 470
   * Sets the value for every place in the object that affects                                                         // 471
   * the requested non-generic key                                                                                     // 472
   */                                                                                                                  // 473
  self.setValueForKey = function(key, val) {                                                                           // 474
    // We don't use getPositionForKey here because we want to be sure to                                               // 475
    // set the value for all positions if there are multiple.                                                          // 476
    for (var position in self._affectedKeys) {                                                                         // 477
      if (self._affectedKeys.hasOwnProperty(position)) {                                                               // 478
        if (self._affectedKeys[position] === key) {                                                                    // 479
          self.setValueForPosition(position, val);                                                                     // 480
        }                                                                                                              // 481
      }                                                                                                                // 482
    }                                                                                                                  // 483
  };                                                                                                                   // 484
                                                                                                                       // 485
  /**                                                                                                                  // 486
   * @method MongoObject.setValueForGenericKey                                                                         // 487
   * @param {String} key                                                                                               // 488
   * @param {Any} val                                                                                                  // 489
   * @returns {undefined}                                                                                              // 490
   *                                                                                                                   // 491
   * Sets the value for every place in the object that affects                                                         // 492
   * the requested generic key                                                                                         // 493
   */                                                                                                                  // 494
  self.setValueForGenericKey = function(key, val) {                                                                    // 495
    // We don't use getPositionForKey here because we want to be sure to                                               // 496
    // set the value for all positions if there are multiple.                                                          // 497
    for (var position in self._genericAffectedKeys) {                                                                  // 498
      if (self._genericAffectedKeys.hasOwnProperty(position)) {                                                        // 499
        if (self._genericAffectedKeys[position] === key) {                                                             // 500
          self.setValueForPosition(position, val);                                                                     // 501
        }                                                                                                              // 502
      }                                                                                                                // 503
    }                                                                                                                  // 504
  };                                                                                                                   // 505
                                                                                                                       // 506
  /**                                                                                                                  // 507
   * @method MongoObject.getObject                                                                                     // 508
   * @returns {Object}                                                                                                 // 509
   *                                                                                                                   // 510
   * Get the source object, potentially modified by other method calls on this                                         // 511
   * MongoObject instance.                                                                                             // 512
   */                                                                                                                  // 513
  self.getObject = function() {                                                                                        // 514
    return self._obj;                                                                                                  // 515
  };                                                                                                                   // 516
                                                                                                                       // 517
  /**                                                                                                                  // 518
   * @method MongoObject.getFlatObject                                                                                 // 519
   * @returns {Object}                                                                                                 // 520
   *                                                                                                                   // 521
   * Gets a flat object based on the MongoObject instance.                                                             // 522
   * In a flat object, the key is the name of the non-generic affectedKey,                                             // 523
   * with mongo dot notation if necessary, and the value is the value for                                              // 524
   * that key.                                                                                                         // 525
   *                                                                                                                   // 526
   * With `keepArrays: true`, we don't flatten within arrays. Currently                                                // 527
   * MongoDB does not see a key such as `a.0.b` and automatically assume                                               // 528
   * an array. Instead it would create an object with key "0" if there                                                 // 529
   * wasn't already an array saved as the value of `a`, which is rarely                                                // 530
   * if ever what we actually want. To avoid this confusion, we                                                        // 531
   * set entire arrays.                                                                                                // 532
   */                                                                                                                  // 533
  self.getFlatObject = function(options) {                                                                             // 534
    options = options || {};                                                                                           // 535
    var newObj = {};                                                                                                   // 536
    _.each(self._affectedKeys, function(affectedKey, position) {                                                       // 537
      if (typeof affectedKey === "string" &&                                                                           // 538
        (options.keepArrays === true && !_.contains(self._positionsInsideArrays, position) && !_.contains(self._objectPositions, position)) ||
        (!options.keepArrays && !_.contains(self._parentPositions, position))                                          // 540
        ) {                                                                                                            // 541
        newObj[affectedKey] = self.getValueForPosition(position);                                                      // 542
      }                                                                                                                // 543
    });                                                                                                                // 544
    return newObj;                                                                                                     // 545
  };                                                                                                                   // 546
                                                                                                                       // 547
  /**                                                                                                                  // 548
   * @method MongoObject.affectsKey                                                                                    // 549
   * @param {String} key                                                                                               // 550
   * @returns {Object}                                                                                                 // 551
   *                                                                                                                   // 552
   * Returns true if the non-generic key is affected by this object                                                    // 553
   */                                                                                                                  // 554
  self.affectsKey = function(key) {                                                                                    // 555
    return !!self.getPositionForKey(key);                                                                              // 556
  };                                                                                                                   // 557
                                                                                                                       // 558
  /**                                                                                                                  // 559
   * @method MongoObject.affectsGenericKey                                                                             // 560
   * @param {String} key                                                                                               // 561
   * @returns {Object}                                                                                                 // 562
   *                                                                                                                   // 563
   * Returns true if the generic key is affected by this object                                                        // 564
   */                                                                                                                  // 565
  self.affectsGenericKey = function(key) {                                                                             // 566
    for (var position in self._genericAffectedKeys) {                                                                  // 567
      if (self._genericAffectedKeys.hasOwnProperty(position)) {                                                        // 568
        if (self._genericAffectedKeys[position] === key) {                                                             // 569
          return true;                                                                                                 // 570
        }                                                                                                              // 571
      }                                                                                                                // 572
    }                                                                                                                  // 573
    return false;                                                                                                      // 574
  };                                                                                                                   // 575
                                                                                                                       // 576
  /**                                                                                                                  // 577
   * @method MongoObject.affectsGenericKeyImplicit                                                                     // 578
   * @param {String} key                                                                                               // 579
   * @returns {Object}                                                                                                 // 580
   *                                                                                                                   // 581
   * Like affectsGenericKey, but will return true if a child key is affected                                           // 582
   */                                                                                                                  // 583
  self.affectsGenericKeyImplicit = function(key) {                                                                     // 584
    for (var position in self._genericAffectedKeys) {                                                                  // 585
      if (self._genericAffectedKeys.hasOwnProperty(position)) {                                                        // 586
        var affectedKey = self._genericAffectedKeys[position];                                                         // 587
                                                                                                                       // 588
        // If the affected key is the test key                                                                         // 589
        if (affectedKey === key) {                                                                                     // 590
          return true;                                                                                                 // 591
        }                                                                                                              // 592
                                                                                                                       // 593
        // If the affected key implies the test key because the affected key                                           // 594
        // starts with the test key followed by a period                                                               // 595
        if (affectedKey.substring(0, key.length + 1) === key + ".") {                                                  // 596
          return true;                                                                                                 // 597
        }                                                                                                              // 598
                                                                                                                       // 599
        // If the affected key implies the test key because the affected key                                           // 600
        // starts with the test key and the test key ends with ".$"                                                    // 601
        var lastTwo = key.slice(-2);                                                                                   // 602
        if (lastTwo === ".$" && key.slice(0, -2) === affectedKey) {                                                    // 603
          return true;                                                                                                 // 604
        }                                                                                                              // 605
      }                                                                                                                // 606
    }                                                                                                                  // 607
    return false;                                                                                                      // 608
  };                                                                                                                   // 609
};                                                                                                                     // 610
                                                                                                                       // 611
/** Takes a string representation of an object key and its value                                                       // 612
 *  and updates "obj" to contain that key with that value.                                                             // 613
 *                                                                                                                     // 614
 *  Example keys and results if val is 1:                                                                              // 615
 *    "a" -> {a: 1}                                                                                                    // 616
 *    "a[b]" -> {a: {b: 1}}                                                                                            // 617
 *    "a[b][0]" -> {a: {b: [1]}}                                                                                       // 618
 *    "a[b.0.c]" -> {a: {'b.0.c': 1}}                                                                                  // 619
 */                                                                                                                    // 620
                                                                                                                       // 621
/** Takes a string representation of an object key and its value                                                       // 622
 *  and updates "obj" to contain that key with that value.                                                             // 623
 *                                                                                                                     // 624
 *  Example keys and results if val is 1:                                                                              // 625
 *    "a" -> {a: 1}                                                                                                    // 626
 *    "a[b]" -> {a: {b: 1}}                                                                                            // 627
 *    "a[b][0]" -> {a: {b: [1]}}                                                                                       // 628
 *    "a[b.0.c]" -> {a: {'b.0.c': 1}}                                                                                  // 629
 *                                                                                                                     // 630
 * @param {any} val                                                                                                    // 631
 * @param {String} key                                                                                                 // 632
 * @param {Object} obj                                                                                                 // 633
 * @returns {undefined}                                                                                                // 634
 */                                                                                                                    // 635
MongoObject.expandKey = function(val, key, obj) {                                                                      // 636
  var nextPiece, subkey, subkeys = key.split("["), current = obj;                                                      // 637
  for (var i = 0, ln = subkeys.length; i < ln; i++) {                                                                  // 638
    subkey = subkeys[i];                                                                                               // 639
    if (subkey.slice(-1) === "]") {                                                                                    // 640
      subkey = subkey.slice(0, -1);                                                                                    // 641
    }                                                                                                                  // 642
    if (i === ln - 1) {                                                                                                // 643
      //last iteration; time to set the value; always overwrite                                                        // 644
      current[subkey] = val;                                                                                           // 645
      //if val is undefined, delete the property                                                                       // 646
      if (val === void 0)                                                                                              // 647
        delete current[subkey];                                                                                        // 648
    } else {                                                                                                           // 649
      //see if the next piece is a number                                                                              // 650
      nextPiece = subkeys[i + 1];                                                                                      // 651
      nextPiece = parseInt(nextPiece, 10);                                                                             // 652
      if (!current[subkey]) {                                                                                          // 653
        current[subkey] = isNaN(nextPiece) ? {} : [];                                                                  // 654
      }                                                                                                                // 655
    }                                                                                                                  // 656
    current = current[subkey];                                                                                         // 657
  }                                                                                                                    // 658
};                                                                                                                     // 659
                                                                                                                       // 660
MongoObject._keyToPosition = function keyToPosition(key, wrapAll) {                                                    // 661
  var position = '';                                                                                                   // 662
  _.each(key.split("."), function (piece, i) {                                                                         // 663
    if (i === 0 && !wrapAll) {                                                                                         // 664
      position += piece;                                                                                               // 665
    } else {                                                                                                           // 666
      position += "[" + piece + "]";                                                                                   // 667
    }                                                                                                                  // 668
  });                                                                                                                  // 669
  return position;                                                                                                     // 670
};                                                                                                                     // 671
                                                                                                                       // 672
/**                                                                                                                    // 673
 * @method MongoObject._positionToKey                                                                                  // 674
 * @param {String} position                                                                                            // 675
 * @returns {String} The key that this position in an object would affect.                                             // 676
 *                                                                                                                     // 677
 * This is different from MongoObject.prototype.getKeyForPosition in that                                              // 678
 * this method does not depend on the requested position actually being                                                // 679
 * present in any particular MongoObject.                                                                              // 680
 */                                                                                                                    // 681
MongoObject._positionToKey = function positionToKey(position) {                                                        // 682
  //XXX Probably a better way to do this, but this is                                                                  // 683
  //foolproof for now.                                                                                                 // 684
  var mDoc = new MongoObject({});                                                                                      // 685
  mDoc.setValueForPosition(position, 1); //value doesn't matter                                                        // 686
  var key = mDoc.getKeyForPosition(position);                                                                          // 687
  mDoc = null;                                                                                                         // 688
  return key;                                                                                                          // 689
};                                                                                                                     // 690
                                                                                                                       // 691
var isArray = _.isArray;                                                                                               // 692
                                                                                                                       // 693
var isObject = function(obj) {                                                                                         // 694
  return obj === Object(obj);                                                                                          // 695
};                                                                                                                     // 696
                                                                                                                       // 697
// getPrototypeOf polyfill                                                                                             // 698
if (typeof Object.getPrototypeOf !== "function") {                                                                     // 699
  if (typeof "".__proto__ === "object") {                                                                              // 700
    Object.getPrototypeOf = function(object) {                                                                         // 701
      return object.__proto__;                                                                                         // 702
    };                                                                                                                 // 703
  } else {                                                                                                             // 704
    Object.getPrototypeOf = function(object) {                                                                         // 705
      // May break if the constructor has been tampered with                                                           // 706
      return object.constructor.prototype;                                                                             // 707
    };                                                                                                                 // 708
  }                                                                                                                    // 709
}                                                                                                                      // 710
                                                                                                                       // 711
/* Tests whether "obj" is an Object as opposed to                                                                      // 712
 * something that inherits from Object                                                                                 // 713
 *                                                                                                                     // 714
 * @param {any} obj                                                                                                    // 715
 * @returns {Boolean}                                                                                                  // 716
 */                                                                                                                    // 717
var isBasicObject = function(obj) {                                                                                    // 718
  return isObject(obj) && Object.getPrototypeOf(obj) === Object.prototype;                                             // 719
};                                                                                                                     // 720
                                                                                                                       // 721
/* Takes a specific string that uses mongo-style dot notation                                                          // 722
 * and returns a generic string equivalent. Replaces all numeric                                                       // 723
 * "pieces" with a dollar sign ($).                                                                                    // 724
 *                                                                                                                     // 725
 * @param {type} name                                                                                                  // 726
 * @returns {unresolved}                                                                                               // 727
 */                                                                                                                    // 728
var makeGeneric = function makeGeneric(name) {                                                                         // 729
  if (typeof name !== "string")                                                                                        // 730
    return null;                                                                                                       // 731
  return name.replace(/\.[0-9]+\./g, '.$.').replace(/\.[0-9]+/g, '.$');                                                // 732
};                                                                                                                     // 733
                                                                                                                       // 734
var appendAffectedKey = function appendAffectedKey(affectedKey, key) {                                                 // 735
  if (key === "$each") {                                                                                               // 736
    return affectedKey;                                                                                                // 737
  } else {                                                                                                             // 738
    return (affectedKey ? affectedKey + "." + key : key);                                                              // 739
  }                                                                                                                    // 740
};                                                                                                                     // 741
                                                                                                                       // 742
// Extracts operator piece, if present, from position string                                                           // 743
var extractOp = function extractOp(position) {                                                                         // 744
  var firstPositionPiece = position.slice(0, position.indexOf("["));                                                   // 745
  return (firstPositionPiece.substring(0, 1) === "$") ? firstPositionPiece : null;                                     // 746
};                                                                                                                     // 747
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}).call(this);






(function () {

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/aldeed:simple-schema/simple-schema-utility.js                                                              //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
Utility = {                                                                                                            // 1
  appendAffectedKey: function appendAffectedKey(affectedKey, key) {                                                    // 2
    if (key === "$each") {                                                                                             // 3
      return affectedKey;                                                                                              // 4
    } else {                                                                                                           // 5
      return (affectedKey ? affectedKey + "." + key : key);                                                            // 6
    }                                                                                                                  // 7
  },                                                                                                                   // 8
  shouldCheck: function shouldCheck(key) {                                                                             // 9
    if (key === "$pushAll") {                                                                                          // 10
      throw new Error("$pushAll is not supported; use $push + $each");                                                 // 11
    }                                                                                                                  // 12
    return !_.contains(["$pull", "$pullAll", "$pop", "$slice"], key);                                                  // 13
  },                                                                                                                   // 14
  errorObject: function errorObject(errorType, keyName, keyValue, def, ss) {                                           // 15
    return {name: keyName, type: errorType, value: keyValue};                                                          // 16
  },                                                                                                                   // 17
  // Tests whether it's an Object as opposed to something that inherits from Object                                    // 18
  isBasicObject: function isBasicObject(obj) {                                                                         // 19
    return _.isObject(obj) && Object.getPrototypeOf(obj) === Object.prototype;                                         // 20
  },                                                                                                                   // 21
  // The latest Safari returns false for Uint8Array, etc. instanceof Function                                          // 22
  // unlike other browsers.                                                                                            // 23
  safariBugFix: function safariBugFix(type) {                                                                          // 24
    return (typeof Uint8Array !== "undefined" && type === Uint8Array)                                                  // 25
    || (typeof Uint16Array !== "undefined" && type === Uint16Array)                                                    // 26
    || (typeof Uint32Array !== "undefined" && type === Uint32Array)                                                    // 27
    || (typeof Uint8ClampedArray !== "undefined" && type === Uint8ClampedArray);                                       // 28
  },                                                                                                                   // 29
  isNotNullOrUndefined: function isNotNullOrUndefined(val) {                                                           // 30
    return val !== void 0 && val !== null;                                                                             // 31
  },                                                                                                                   // 32
  // Extracts operator piece, if present, from position string                                                         // 33
  extractOp: function extractOp(position) {                                                                            // 34
    var firstPositionPiece = position.slice(0, position.indexOf("["));                                                 // 35
    return (firstPositionPiece.substring(0, 1) === "$") ? firstPositionPiece : null;                                   // 36
  },                                                                                                                   // 37
  deleteIfPresent: function deleteIfPresent(obj, key) {                                                                // 38
    if (key in obj) {                                                                                                  // 39
      delete obj[key];                                                                                                 // 40
    }                                                                                                                  // 41
  },                                                                                                                   // 42
  looksLikeModifier: function looksLikeModifier(obj) {                                                                 // 43
    for (var key in obj) {                                                                                             // 44
      if (obj.hasOwnProperty(key) && key.substring(0, 1) === "$") {                                                    // 45
        return true;                                                                                                   // 46
      }                                                                                                                // 47
    }                                                                                                                  // 48
    return false;                                                                                                      // 49
  },                                                                                                                   // 50
  dateToDateString: function dateToDateString(date) {                                                                  // 51
    var m = (date.getUTCMonth() + 1);                                                                                  // 52
    if (m < 10) {                                                                                                      // 53
      m = "0" + m;                                                                                                     // 54
    }                                                                                                                  // 55
    var d = date.getUTCDate();                                                                                         // 56
    if (d < 10) {                                                                                                      // 57
      d = "0" + d;                                                                                                     // 58
    }                                                                                                                  // 59
    return date.getUTCFullYear() + '-' + m + '-' + d;                                                                  // 60
  }                                                                                                                    // 61
};                                                                                                                     // 62
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}).call(this);






(function () {

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/aldeed:simple-schema/simple-schema.js                                                                      //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
if (Meteor.isServer) {                                                                                                 // 1
  S = Npm.require("string");                                                                                           // 2
}                                                                                                                      // 3
if (Meteor.isClient) {                                                                                                 // 4
  S = window.S;                                                                                                        // 5
}                                                                                                                      // 6
                                                                                                                       // 7
var schemaDefinition = {                                                                                               // 8
  type: Match.Any,                                                                                                     // 9
  label: Match.Optional(Match.OneOf(String, Function)),                                                                // 10
  optional: Match.Optional(Match.OneOf(Boolean, Function)),                                                            // 11
  min: Match.Optional(Match.OneOf(Number, Date, Function)),                                                            // 12
  max: Match.Optional(Match.OneOf(Number, Date, Function)),                                                            // 13
  minCount: Match.Optional(Match.OneOf(Number, Function)),                                                             // 14
  maxCount: Match.Optional(Match.OneOf(Number, Function)),                                                             // 15
  allowedValues: Match.Optional(Match.OneOf([Match.Any], Function)),                                                   // 16
  decimal: Match.Optional(Boolean),                                                                                    // 17
  regEx: Match.Optional(Match.OneOf(RegExp, [RegExp])),                                                                // 18
  custom: Match.Optional(Function),                                                                                    // 19
  blackbox: Match.Optional(Boolean),                                                                                   // 20
  autoValue: Match.Optional(Function),                                                                                 // 21
  defaultValue: Match.Optional(Match.Any),                                                                             // 22
  trim: Match.Optional(Boolean)                                                                                        // 23
};                                                                                                                     // 24
                                                                                                                       // 25
//exported                                                                                                             // 26
SimpleSchema = function(schemas, options) {                                                                            // 27
  var self = this;                                                                                                     // 28
  var firstLevelSchemaKeys = [];                                                                                       // 29
  var fieldNameRoot;                                                                                                   // 30
  options = options || {};                                                                                             // 31
  schemas = schemas || {};                                                                                             // 32
                                                                                                                       // 33
  if (!_.isArray(schemas)) {                                                                                           // 34
    schemas = [schemas];                                                                                               // 35
  }                                                                                                                    // 36
                                                                                                                       // 37
  // adjust and store a copy of the schema definitions                                                                 // 38
  self._schema = mergeSchemas(schemas);                                                                                // 39
                                                                                                                       // 40
  // store the list of defined keys for speedier checking                                                              // 41
  self._schemaKeys = [];                                                                                               // 42
                                                                                                                       // 43
  // store autoValue functions by key                                                                                  // 44
  self._autoValues = {};                                                                                               // 45
                                                                                                                       // 46
  // store the list of blackbox keys for passing to MongoObject constructor                                            // 47
  self._blackboxKeys = [];                                                                                             // 48
                                                                                                                       // 49
  // a place to store custom validators for this instance                                                              // 50
  self._validators = [];                                                                                               // 51
                                                                                                                       // 52
  // a place to store custom error messages for this schema                                                            // 53
  self._messages = {};                                                                                                 // 54
                                                                                                                       // 55
  self._depsMessages = new Deps.Dependency;                                                                            // 56
  self._depsLabels = {};                                                                                               // 57
                                                                                                                       // 58
  _.each(self._schema, function(definition, fieldName) {                                                               // 59
    // Validate the field definition                                                                                   // 60
    if (!Match.test(definition, schemaDefinition)) {                                                                   // 61
      throw new Error('Invalid definition for ' + fieldName + ' field.');                                              // 62
    }                                                                                                                  // 63
                                                                                                                       // 64
    fieldNameRoot = fieldName.split(".")[0];                                                                           // 65
                                                                                                                       // 66
    self._schemaKeys.push(fieldName);                                                                                  // 67
                                                                                                                       // 68
    // We support defaultValue shortcut by converting it immediately into an                                           // 69
    // autoValue.                                                                                                      // 70
    if ('defaultValue' in definition) {                                                                                // 71
      if ('autoValue' in definition) {                                                                                 // 72
        console.warn('SimpleSchema: Found both autoValue and defaultValue options for "' + fieldName + '". Ignoring defaultValue.');
      } else {                                                                                                         // 74
        if (fieldName.slice(-2) === ".$") {                                                                            // 75
          throw new Error('An array item field (one that ends with ".$") cannot have defaultValue.')                   // 76
        }                                                                                                              // 77
        self._autoValues[fieldName] = (function defineAutoValue(v) {                                                   // 78
          return function() {                                                                                          // 79
            if (this.operator === null && !this.isSet) {                                                               // 80
              return v;                                                                                                // 81
            }                                                                                                          // 82
          };                                                                                                           // 83
        })(definition.defaultValue);                                                                                   // 84
      }                                                                                                                // 85
    }                                                                                                                  // 86
                                                                                                                       // 87
    if ('autoValue' in definition) {                                                                                   // 88
      if (fieldName.slice(-2) === ".$") {                                                                              // 89
        throw new Error('An array item field (one that ends with ".$") cannot have autoValue.')                        // 90
      }                                                                                                                // 91
      self._autoValues[fieldName] = definition.autoValue;                                                              // 92
    }                                                                                                                  // 93
                                                                                                                       // 94
    self._depsLabels[fieldName] = new Deps.Dependency;                                                                 // 95
                                                                                                                       // 96
    if (definition.blackbox === true) {                                                                                // 97
      self._blackboxKeys.push(fieldName);                                                                              // 98
    }                                                                                                                  // 99
                                                                                                                       // 100
    if (!_.contains(firstLevelSchemaKeys, fieldNameRoot)) {                                                            // 101
      firstLevelSchemaKeys.push(fieldNameRoot);                                                                        // 102
    }                                                                                                                  // 103
  });                                                                                                                  // 104
                                                                                                                       // 105
                                                                                                                       // 106
  // Cache these lists                                                                                                 // 107
  self._firstLevelSchemaKeys = firstLevelSchemaKeys;                                                                   // 108
  self._objectKeys = getObjectKeys(self._schema, self._schemaKeys);                                                    // 109
                                                                                                                       // 110
  // We will store named validation contexts here                                                                      // 111
  self._validationContexts = {};                                                                                       // 112
};                                                                                                                     // 113
                                                                                                                       // 114
// This allows other packages or users to extend the schema                                                            // 115
// definition options that are supported.                                                                              // 116
SimpleSchema.extendOptions = function(options) {                                                                       // 117
  _.extend(schemaDefinition, options);                                                                                 // 118
};                                                                                                                     // 119
                                                                                                                       // 120
// this domain regex matches all domains that have at least one .                                                      // 121
// sadly IPv4 Adresses will be caught too but technically those are valid domains                                      // 122
// this expression is extracted from the original RFC 5322 mail expression                                             // 123
// a modification enforces that the tld consists only of characters                                                    // 124
var RX_DOMAIN = '(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\\.)+[a-z](?:[a-z-]*[a-z])?';                                       // 125
// this domain regex matches everythign that could be a domain in intranet                                             // 126
// that means "localhost" is a valid domain                                                                            // 127
var RX_NAME_DOMAIN = '(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?(?:\\.|$))+';                                                  // 128
// strict IPv4 expression which allows 0-255 per oktett                                                                // 129
var RX_IPv4 = '(?:(?:[0-1]?\\d{1,2}|2[0-4]\\d|25[0-5])(?:\\.|$)){4}';                                                  // 130
// strict IPv6 expression which allows (and validates) all shortcuts                                                   // 131
var RX_IPv6 = '(?:(?:[\\dA-Fa-f]{1,4}(?::|$)){8}' // full adress                                                       // 132
  + '|(?=(?:[^:\\s]|:[^:\\s])*::(?:[^:\\s]|:[^:\\s])*$)' // or min/max one '::'                                        // 133
  + '[\\dA-Fa-f]{0,4}(?:::?(?:[\\dA-Fa-f]{1,4}|$)){1,6})'; // and short adress                                         // 134
// this allows domains (also localhost etc) and ip adresses                                                            // 135
var RX_WEAK_DOMAIN = '(?:' + [RX_NAME_DOMAIN,RX_IPv4,RX_IPv6].join('|') + ')';                                         // 136
                                                                                                                       // 137
SimpleSchema.RegEx = {                                                                                                 // 138
  // We use the RegExp suggested by W3C in http://www.w3.org/TR/html5/forms.html#valid-e-mail-address                  // 139
  // This is probably the same logic used by most browsers when type=email, which is our goal. It is                   // 140
  // a very permissive expression. Some apps may wish to be more strict and can write their own RegExp.                // 141
  Email: /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/,
                                                                                                                       // 143
  Domain: new RegExp('^' + RX_DOMAIN + '$'),                                                                           // 144
  WeakDomain: new RegExp('^' + RX_WEAK_DOMAIN + '$'),                                                                  // 145
                                                                                                                       // 146
  IP: new RegExp('^(?:' + RX_IPv4 + '|' + RX_IPv6 + ')$'),                                                             // 147
  IPv4: new RegExp('^' + RX_IPv4 + '$'),                                                                               // 148
  IPv6: new RegExp('^' + RX_IPv6 + '$'),                                                                               // 149
  // URL RegEx from https://gist.github.com/dperini/729294                                                             // 150
  // http://mathiasbynens.be/demo/url-regex                                                                            // 151
  Url: /^(?:(?:https?|ftp):\/\/)(?:\S+(?::\S*)?@)?(?:(?!10(?:\.\d{1,3}){3})(?!127(?:\.\d{1,3}){3})(?!169\.254(?:\.\d{1,3}){2})(?!192\.168(?:\.\d{1,3}){2})(?!172\.(?:1[6-9]|2\d|3[0-1])(?:\.\d{1,3}){2})(?:[1-9]\d?|1\d\d|2[01]\d|22[0-3])(?:\.(?:1?\d{1,2}|2[0-4]\d|25[0-5])){2}(?:\.(?:[1-9]\d?|1\d\d|2[0-4]\d|25[0-4]))|(?:(?:[a-z\u00a1-\uffff0-9]+-?)*[a-z\u00a1-\uffff0-9]+)(?:\.(?:[a-z\u00a1-\uffff0-9]+-?)*[a-z\u00a1-\uffff0-9]+)*(?:\.(?:[a-z\u00a1-\uffff]{2,})))(?::\d{2,5})?(?:\/[^\s]*)?$/i,
  // unique id from the random package also used by minimongo                                                          // 153
  // character list: https://github.com/meteor/meteor/blob/release/0.8.0/packages/random/random.js#L88                 // 154
  // string length: https://github.com/meteor/meteor/blob/release/0.8.0/packages/random/random.js#L143                 // 155
  Id: /^[23456789ABCDEFGHJKLMNPQRSTWXYZabcdefghijkmnopqrstuvwxyz]{17}$/                                                // 156
};                                                                                                                     // 157
                                                                                                                       // 158
SimpleSchema._makeGeneric = function(name) {                                                                           // 159
  if (typeof name !== "string")                                                                                        // 160
    return null;                                                                                                       // 161
                                                                                                                       // 162
  return name.replace(/\.[0-9]+\./g, '.$.').replace(/\.[0-9]+/g, '.$');                                                // 163
};                                                                                                                     // 164
                                                                                                                       // 165
SimpleSchema._depsGlobalMessages = new Deps.Dependency;                                                                // 166
                                                                                                                       // 167
// Inherit from Match.Where                                                                                            // 168
// This allow SimpleSchema instance to be recognized as a Match.Where instance as well                                 // 169
// as a SimpleSchema instance                                                                                          // 170
SimpleSchema.prototype = new Match.Where();                                                                            // 171
                                                                                                                       // 172
// If an object is an instance of Match.Where, Meteor built-in check API will look at                                  // 173
// the function named `condition` and will pass it the document to validate                                            // 174
SimpleSchema.prototype.condition = function(obj) {                                                                     // 175
  var self = this;                                                                                                     // 176
                                                                                                                       // 177
  //determine whether obj is a modifier                                                                                // 178
  var isModifier, isNotModifier;                                                                                       // 179
  _.each(obj, function(val, key) {                                                                                     // 180
    if (key.substring(0, 1) === "$") {                                                                                 // 181
      isModifier = true;                                                                                               // 182
    } else {                                                                                                           // 183
      isNotModifier = true;                                                                                            // 184
    }                                                                                                                  // 185
  });                                                                                                                  // 186
                                                                                                                       // 187
  if (isModifier && isNotModifier)                                                                                     // 188
    throw new Match.Error("Object cannot contain modifier operators alongside other keys");                            // 189
                                                                                                                       // 190
  if (!self.newContext().validate(obj, {modifier: isModifier, filter: false, autoConvert: false}))                     // 191
    throw new Match.Error("One or more properties do not match the schema.");                                          // 192
                                                                                                                       // 193
  return true;                                                                                                         // 194
};                                                                                                                     // 195
                                                                                                                       // 196
function logInvalidKeysForContext(context, name) {                                                                     // 197
  Meteor.startup(function() {                                                                                          // 198
    Deps.autorun(function() {                                                                                          // 199
      if (!context.isValid()) {                                                                                        // 200
        console.log('SimpleSchema invalid keys for "' + name + '" context:', context.invalidKeys());                   // 201
      }                                                                                                                // 202
    });                                                                                                                // 203
  });                                                                                                                  // 204
}                                                                                                                      // 205
                                                                                                                       // 206
SimpleSchema.prototype.namedContext = function(name) {                                                                 // 207
  var self = this;                                                                                                     // 208
  if (typeof name !== "string") {                                                                                      // 209
    name = "default";                                                                                                  // 210
  }                                                                                                                    // 211
  if (!self._validationContexts[name]) {                                                                               // 212
    self._validationContexts[name] = new SimpleSchemaValidationContext(self);                                          // 213
                                                                                                                       // 214
    // In debug mode, log all invalid key errors to the browser console                                                // 215
    if (SimpleSchema.debug && Meteor.isClient) {                                                                       // 216
      Deps.nonreactive(function() {                                                                                    // 217
        logInvalidKeysForContext(self._validationContexts[name], name);                                                // 218
      });                                                                                                              // 219
    }                                                                                                                  // 220
  }                                                                                                                    // 221
  return self._validationContexts[name];                                                                               // 222
};                                                                                                                     // 223
                                                                                                                       // 224
// Global custom validators                                                                                            // 225
SimpleSchema._validators = [];                                                                                         // 226
SimpleSchema.addValidator = function(func) {                                                                           // 227
  SimpleSchema._validators.push(func);                                                                                 // 228
};                                                                                                                     // 229
                                                                                                                       // 230
// Instance custom validators                                                                                          // 231
// validator is deprecated; use addValidator                                                                           // 232
SimpleSchema.prototype.addValidator = SimpleSchema.prototype.validator = function(func) {                              // 233
  this._validators.push(func);                                                                                         // 234
};                                                                                                                     // 235
                                                                                                                       // 236
/**                                                                                                                    // 237
 * @method SimpleSchema.prototype.clean                                                                                // 238
 * @param {Object} doc - Document or modifier to clean. Referenced object will be modified in place.                   // 239
 * @param {Object} [options]                                                                                           // 240
 * @param {Boolean} [options.filter=true] - Do filtering?                                                              // 241
 * @param {Boolean} [options.autoConvert=true] - Do automatic type converting?                                         // 242
 * @param {Boolean} [options.removeEmptyStrings=true] - Remove keys in normal object or $set where the value is an empty string?
 * @param {Boolean} [options.trimStrings=true] - Trim string values?                                                   // 244
 * @param {Boolean} [options.getAutoValues=true] - Inject automatic and default values?                                // 245
 * @param {Boolean} [options.isModifier=false] - Is doc a modifier object?                                             // 246
 * @param {Object} [options.extendAutoValueContext] - This object will be added to the `this` context of autoValue functions.
 * @returns {Object} The modified doc.                                                                                 // 248
 *                                                                                                                     // 249
 * Cleans a document or modifier object. By default, will filter, automatically                                        // 250
 * type convert where possible, and inject automatic/default values. Use the options                                   // 251
 * to skip one or more of these.                                                                                       // 252
 */                                                                                                                    // 253
SimpleSchema.prototype.clean = function(doc, options) {                                                                // 254
  var self = this;                                                                                                     // 255
                                                                                                                       // 256
  // By default, doc will be filtered and autoconverted                                                                // 257
  options = _.extend({                                                                                                 // 258
    filter: true,                                                                                                      // 259
    autoConvert: true,                                                                                                 // 260
    removeEmptyStrings: true,                                                                                          // 261
    trimStrings: true,                                                                                                 // 262
    getAutoValues: true,                                                                                               // 263
    isModifier: false,                                                                                                 // 264
    extendAutoValueContext: {}                                                                                         // 265
  }, options || {});                                                                                                   // 266
                                                                                                                       // 267
  // Convert $pushAll (deprecated) to $push with $each                                                                 // 268
  if ("$pushAll" in doc) {                                                                                             // 269
    console.warn("SimpleSchema.clean: $pushAll is deprecated; converting to $push with $each");                        // 270
    doc.$push = doc.$push || {};                                                                                       // 271
    for (var field in doc.$pushAll) {                                                                                  // 272
      doc.$push[field] = doc.$push[field] || {};                                                                       // 273
      doc.$push[field].$each = doc.$push[field].$each || [];                                                           // 274
      for (var i = 0, ln = doc.$pushAll[field].length; i < ln; i++) {                                                  // 275
        doc.$push[field].$each.push(doc.$pushAll[field][i]);                                                           // 276
      }                                                                                                                // 277
      delete doc.$pushAll;                                                                                             // 278
    }                                                                                                                  // 279
  }                                                                                                                    // 280
                                                                                                                       // 281
  var mDoc = new MongoObject(doc, self._blackboxKeys);                                                                 // 282
                                                                                                                       // 283
  // Clean loop                                                                                                        // 284
  if (options.filter || options.autoConvert || options.removeEmptyStrings || options.trimStrings) {                    // 285
    mDoc.forEachNode(function() {                                                                                      // 286
      var gKey = this.genericKey;                                                                                      // 287
      if (gKey) {                                                                                                      // 288
        var def = self._schema[gKey];                                                                                  // 289
        var val = this.value;                                                                                          // 290
        // Filter out props if necessary; any property is OK for $unset because we want to                             // 291
        // allow conversions to remove props that have been removed from the schema.                                   // 292
        if (options.filter && this.operator !== "$unset" && !self.allowsKey(gKey)) {                                   // 293
          // XXX Special handling for $each; maybe this could be made nicer                                            // 294
          if (this.position.slice(-7) === "[$each]") {                                                                 // 295
            mDoc.removeValueForPosition(this.position.slice(0, -7));                                                   // 296
          } else {                                                                                                     // 297
            this.remove();                                                                                             // 298
          }                                                                                                            // 299
          if (SimpleSchema.debug) {                                                                                    // 300
            console.info('SimpleSchema.clean: filtered out value that would have affected key "' + gKey + '", which is not allowed by the schema');
          }                                                                                                            // 302
          return; // no reason to do more                                                                              // 303
        }                                                                                                              // 304
        if (val !== void 0) {                                                                                          // 305
          // Autoconvert values if requested and if possible                                                           // 306
          var wasAutoConverted = false;                                                                                // 307
          if (options.autoConvert && def) {                                                                            // 308
            var newVal = typeconvert(val, def.type);                                                                   // 309
            if (newVal !== void 0 && newVal !== val) {                                                                 // 310
              // remove empty strings                                                                                  // 311
              if (options.removeEmptyStrings && (!this.operator || this.operator === "$set") && typeof newVal === "string" && !newVal.length) {
                // For a document, we remove any fields that are being set to an empty string                          // 313
                newVal = void 0;                                                                                       // 314
                // For a modifier, we $unset any fields that are being set to an empty string                          // 315
                if (this.operator === "$set") {                                                                        // 316
                  var p = this.position.replace("$set", "$unset");                                                     // 317
                  mDoc.setValueForPosition(p, "");                                                                     // 318
                }                                                                                                      // 319
              }                                                                                                        // 320
              // trim strings                                                                                          // 321
              else if (options.trimStrings && typeof newVal === "string") {                                            // 322
                newVal = S(newVal).trim().s;                                                                           // 323
              }                                                                                                        // 324
                                                                                                                       // 325
              // Change value; if undefined, will remove it                                                            // 326
              SimpleSchema.debug && console.info('SimpleSchema.clean: autoconverted value ' + val + ' from ' + typeof val + ' to ' + typeof newVal + ' for ' + gKey);
              this.updateValue(newVal);                                                                                // 328
              wasAutoConverted = true;                                                                                 // 329
            }                                                                                                          // 330
          }                                                                                                            // 331
          if (!wasAutoConverted) {                                                                                     // 332
            // remove empty strings                                                                                    // 333
            if (options.removeEmptyStrings && (!this.operator || this.operator === "$set") && typeof val === "string" && !val.length) {
              // For a document, we remove any fields that are being set to an empty string                            // 335
              this.remove();                                                                                           // 336
              // For a modifier, we $unset any fields that are being set to an empty string                            // 337
              if (this.operator === "$set") {                                                                          // 338
                var p = this.position.replace("$set", "$unset");                                                       // 339
                mDoc.setValueForPosition(p, "");                                                                       // 340
              }                                                                                                        // 341
            }                                                                                                          // 342
            // trim strings                                                                                            // 343
            else if (options.trimStrings && typeof val === "string" && (!def || (def && def.trim !== false))) {        // 344
              this.updateValue(S(val).trim().s);                                                                       // 345
            }                                                                                                          // 346
          }                                                                                                            // 347
        }                                                                                                              // 348
      }                                                                                                                // 349
    }, {endPointsOnly: false});                                                                                        // 350
  }                                                                                                                    // 351
                                                                                                                       // 352
  // Set automatic values                                                                                              // 353
  options.getAutoValues && getAutoValues.call(self, mDoc, options.isModifier, options.extendAutoValueContext);         // 354
                                                                                                                       // 355
  return doc;                                                                                                          // 356
};                                                                                                                     // 357
                                                                                                                       // 358
// Returns the entire schema object or just the definition for one key                                                 // 359
// in the schema.                                                                                                      // 360
SimpleSchema.prototype.schema = function(key) {                                                                        // 361
  var self = this;                                                                                                     // 362
  // if not null or undefined (more specific)                                                                          // 363
  if (key != null) {                                                                                                   // 364
    return self._schema[SimpleSchema._makeGeneric(key)];                                                               // 365
  } else {                                                                                                             // 366
    return self._schema;                                                                                               // 367
  }                                                                                                                    // 368
};                                                                                                                     // 369
                                                                                                                       // 370
// Returns the evaluated definition for one key in the schema                                                          // 371
// key = non-generic key                                                                                               // 372
// [propList] = props to include in the result, for performance                                                        // 373
// [functionContext] = used for evaluating schema options that are functions                                           // 374
SimpleSchema.prototype.getDefinition = function(key, propList, functionContext) {                                      // 375
  var self = this;                                                                                                     // 376
  var defs = self.schema(key);                                                                                         // 377
  if (!defs)                                                                                                           // 378
    return;                                                                                                            // 379
                                                                                                                       // 380
  if (_.isArray(propList)) {                                                                                           // 381
    defs = _.pick(defs, propList);                                                                                     // 382
  } else {                                                                                                             // 383
    defs = _.clone(defs);                                                                                              // 384
  }                                                                                                                    // 385
                                                                                                                       // 386
  // For any options that support specifying a function,                                                               // 387
  // evaluate the functions.                                                                                           // 388
  _.each(['min', 'max', 'minCount', 'maxCount', 'allowedValues', 'optional', 'label'], function (prop) {               // 389
    if (_.isFunction(defs[prop])) {                                                                                    // 390
      defs[prop] = defs[prop].call(functionContext || {});                                                             // 391
    }                                                                                                                  // 392
  });                                                                                                                  // 393
                                                                                                                       // 394
  // Inflect label if not defined                                                                                      // 395
  defs["label"] = defs["label"] || inflectedLabel(key);                                                                // 396
                                                                                                                       // 397
  return defs;                                                                                                         // 398
};                                                                                                                     // 399
                                                                                                                       // 400
// Check if the key is a nested dot-syntax key inside of a blackbox object                                             // 401
SimpleSchema.prototype.keyIsInBlackBox = function(key) {                                                               // 402
  var self = this;                                                                                                     // 403
  var parentPath = SimpleSchema._makeGeneric(key), lastDot, def;                                                       // 404
                                                                                                                       // 405
  // Iterate the dot-syntax hierarchy until we find a key in our schema                                                // 406
  do {                                                                                                                 // 407
    lastDot = parentPath.lastIndexOf('.');                                                                             // 408
    if (lastDot !== -1) {                                                                                              // 409
      parentPath = parentPath.slice(0, lastDot); // Remove last path component                                         // 410
      def = self.getDefinition(parentPath);                                                                            // 411
    }                                                                                                                  // 412
  } while (lastDot !== -1 && !def);                                                                                    // 413
                                                                                                                       // 414
  return !!(def && def.blackbox);                                                                                      // 415
};                                                                                                                     // 416
                                                                                                                       // 417
// Use to dynamically change the schema labels.                                                                        // 418
SimpleSchema.prototype.labels = function(labels) {                                                                     // 419
  var self = this;                                                                                                     // 420
  _.each(labels, function(label, fieldName) {                                                                          // 421
    if (!_.isString(label) && !_.isFunction(label))                                                                    // 422
      return;                                                                                                          // 423
                                                                                                                       // 424
    if (!(fieldName in self._schema))                                                                                  // 425
      return;                                                                                                          // 426
                                                                                                                       // 427
    self._schema[fieldName].label = label;                                                                             // 428
    self._depsLabels[fieldName] && self._depsLabels[fieldName].changed();                                              // 429
  });                                                                                                                  // 430
};                                                                                                                     // 431
                                                                                                                       // 432
// should be used to safely get a label as string                                                                      // 433
SimpleSchema.prototype.label = function(key) {                                                                         // 434
  var self = this;                                                                                                     // 435
                                                                                                                       // 436
  // Get all labels                                                                                                    // 437
  if (key == null) {                                                                                                   // 438
    var result = {};                                                                                                   // 439
    _.each(self.schema(), function(def, fieldName) {                                                                   // 440
      result[fieldName] = self.label(fieldName);                                                                       // 441
    });                                                                                                                // 442
    return result;                                                                                                     // 443
  }                                                                                                                    // 444
                                                                                                                       // 445
  // Get label for one field                                                                                           // 446
  var def = self.getDefinition(key);                                                                                   // 447
  if (def) {                                                                                                           // 448
    var genericKey = SimpleSchema._makeGeneric(key);                                                                   // 449
    self._depsLabels[genericKey] && self._depsLabels[genericKey].depend();                                             // 450
    return def.label;                                                                                                  // 451
  }                                                                                                                    // 452
                                                                                                                       // 453
  return null;                                                                                                         // 454
};                                                                                                                     // 455
                                                                                                                       // 456
// Global messages                                                                                                     // 457
                                                                                                                       // 458
SimpleSchema._globalMessages = {                                                                                       // 459
  required: "[label] is required",                                                                                     // 460
  minString: "[label] must be at least [min] characters",                                                              // 461
  maxString: "[label] cannot exceed [max] characters",                                                                 // 462
  minNumber: "[label] must be at least [min]",                                                                         // 463
  maxNumber: "[label] cannot exceed [max]",                                                                            // 464
  minDate: "[label] must be on or before [min]",                                                                       // 465
  maxDate: "[label] cannot be after [max]",                                                                            // 466
  minCount: "You must specify at least [minCount] values",                                                             // 467
  maxCount: "You cannot specify more than [maxCount] values",                                                          // 468
  noDecimal: "[label] must be an integer",                                                                             // 469
  notAllowed: "[value] is not an allowed value",                                                                       // 470
  expectedString: "[label] must be a string",                                                                          // 471
  expectedNumber: "[label] must be a number",                                                                          // 472
  expectedBoolean: "[label] must be a boolean",                                                                        // 473
  expectedArray: "[label] must be an array",                                                                           // 474
  expectedObject: "[label] must be an object",                                                                         // 475
  expectedConstructor: "[label] must be a [type]",                                                                     // 476
  regEx: [                                                                                                             // 477
    {msg: "[label] failed regular expression validation"},                                                             // 478
    {exp: SimpleSchema.RegEx.Email, msg: "[label] must be a valid e-mail address"},                                    // 479
    {exp: SimpleSchema.RegEx.WeakEmail, msg: "[label] must be a valid e-mail address"},                                // 480
    {exp: SimpleSchema.RegEx.Domain, msg: "[label] must be a valid domain"},                                           // 481
    {exp: SimpleSchema.RegEx.WeakDomain, msg: "[label] must be a valid domain"},                                       // 482
    {exp: SimpleSchema.RegEx.IP, msg: "[label] must be a valid IPv4 or IPv6 address"},                                 // 483
    {exp: SimpleSchema.RegEx.IPv4, msg: "[label] must be a valid IPv4 address"},                                       // 484
    {exp: SimpleSchema.RegEx.IPv6, msg: "[label] must be a valid IPv6 address"},                                       // 485
    {exp: SimpleSchema.RegEx.Url, msg: "[label] must be a valid URL"},                                                 // 486
    {exp: SimpleSchema.RegEx.Id, msg: "[label] must be a valid alphanumeric ID"}                                       // 487
  ],                                                                                                                   // 488
  keyNotInSchema: "[label] is not allowed by the schema"                                                               // 489
};                                                                                                                     // 490
                                                                                                                       // 491
SimpleSchema.messages = function(messages) {                                                                           // 492
  _.extend(SimpleSchema._globalMessages, messages);                                                                    // 493
  SimpleSchema._depsGlobalMessages.changed();                                                                          // 494
};                                                                                                                     // 495
                                                                                                                       // 496
// Schema-specific messages                                                                                            // 497
                                                                                                                       // 498
SimpleSchema.prototype.messages = function(messages) {                                                                 // 499
  var self = this;                                                                                                     // 500
  _.extend(self._messages, messages);                                                                                  // 501
  self._depsMessages.changed();                                                                                        // 502
};                                                                                                                     // 503
                                                                                                                       // 504
// Returns a string message for the given error type and key. Uses the                                                 // 505
// def and value arguments to fill in placeholders in the error messages.                                              // 506
SimpleSchema.prototype.messageForError = function(type, key, def, value) {                                             // 507
  var self = this;                                                                                                     // 508
                                                                                                                       // 509
  // We proceed even if we can't get a definition because it might be a keyNotInSchema error                           // 510
  def = def || self.getDefinition(key, ['regEx', 'label', 'minCount', 'maxCount', 'min', 'max', 'type']) || {};        // 511
                                                                                                                       // 512
  // Adjust for complex types, currently only regEx,                                                                   // 513
  // where we might have regEx.1 meaning the second                                                                    // 514
  // expression in the array.                                                                                          // 515
  var firstTypePeriod = type.indexOf("."), index = null;                                                               // 516
  if (firstTypePeriod !== -1) {                                                                                        // 517
    index = type.substring(firstTypePeriod + 1);                                                                       // 518
    index = parseInt(index, 10);                                                                                       // 519
    type = type.substring(0, firstTypePeriod);                                                                         // 520
  }                                                                                                                    // 521
                                                                                                                       // 522
  // Which regExp is it?                                                                                               // 523
  var regExpMatch;                                                                                                     // 524
  if (type === "regEx") {                                                                                              // 525
    if (index != null && !isNaN(index)) {                                                                              // 526
      regExpMatch = def.regEx[index];                                                                                  // 527
    } else {                                                                                                           // 528
      regExpMatch = def.regEx;                                                                                         // 529
    }                                                                                                                  // 530
    if (regExpMatch) {                                                                                                 // 531
      regExpMatch = regExpMatch.toString();                                                                            // 532
    }                                                                                                                  // 533
  }                                                                                                                    // 534
                                                                                                                       // 535
  // Prep some strings to be used when finding the correct message for this error                                      // 536
  var typePlusKey = type + " " + key;                                                                                  // 537
  var genericKey = SimpleSchema._makeGeneric(key);                                                                     // 538
  var typePlusGenKey = type + " " + genericKey;                                                                        // 539
                                                                                                                       // 540
  // reactively update when message templates or labels are changed                                                    // 541
  SimpleSchema._depsGlobalMessages.depend();                                                                           // 542
  self._depsMessages.depend();                                                                                         // 543
  self._depsLabels[key] && self._depsLabels[key].depend();                                                             // 544
                                                                                                                       // 545
  // Prep a function that finds the correct message for regEx errors                                                   // 546
  function findRegExError(message) {                                                                                   // 547
    if (type !== "regEx" || !_.isArray(message)) {                                                                     // 548
      return message;                                                                                                  // 549
    }                                                                                                                  // 550
    // Parse regEx messages, which are provided in a special object array format                                       // 551
    // [{exp: RegExp, msg: "Foo"}]                                                                                     // 552
    // Where `exp` is optional                                                                                         // 553
                                                                                                                       // 554
    var msgObj;                                                                                                        // 555
    // First see if there's one where exp matches this expression                                                      // 556
    if (regExpMatch) {                                                                                                 // 557
      msgObj = _.find(message, function (o) {                                                                          // 558
        return o.exp && o.exp.toString() === regExpMatch;                                                              // 559
      });                                                                                                              // 560
    }                                                                                                                  // 561
                                                                                                                       // 562
    // If not, see if there's a default message defined                                                                // 563
    if (!msgObj) {                                                                                                     // 564
      msgObj = _.findWhere(message, {exp: null});                                                                      // 565
      if (!msgObj) {                                                                                                   // 566
        msgObj = _.findWhere(message, {exp: void 0});                                                                  // 567
      }                                                                                                                // 568
    }                                                                                                                  // 569
                                                                                                                       // 570
    return msgObj ? msgObj.msg : null;                                                                                 // 571
  }                                                                                                                    // 572
                                                                                                                       // 573
  // Try finding the correct message to use at various levels, from most                                               // 574
  // specific to least specific.                                                                                       // 575
  var message = self._messages[typePlusKey] ||                  // (1) Use schema-specific message for specific key    // 576
                self._messages[typePlusGenKey] ||               // (2) Use schema-specific message for generic key     // 577
                self._messages[type];                           // (3) Use schema-specific message for type            // 578
  message = findRegExError(message);                                                                                   // 579
                                                                                                                       // 580
  if (!message) {                                                                                                      // 581
    message = SimpleSchema._globalMessages[typePlusKey] ||      // (4) Use global message for specific key             // 582
              SimpleSchema._globalMessages[typePlusGenKey] ||   // (5) Use global message for generic key              // 583
              SimpleSchema._globalMessages[type];               // (6) Use global message for type                     // 584
    message = findRegExError(message);                                                                                 // 585
  }                                                                                                                    // 586
                                                                                                                       // 587
  if (!message) {                                                                                                      // 588
    return "Unknown validation error";                                                                                 // 589
  }                                                                                                                    // 590
                                                                                                                       // 591
  // Now replace all placeholders in the message with the correct values                                               // 592
                                                                                                                       // 593
  // [label]                                                                                                           // 594
  self._depsLabels[key] && self._depsLabels[key].depend(); // React to label changes                                   // 595
  message = message.replace("[label]", def.label);                                                                     // 596
                                                                                                                       // 597
  // [minCount]                                                                                                        // 598
  if (typeof def.minCount !== "undefined") {                                                                           // 599
    message = message.replace("[minCount]", def.minCount);                                                             // 600
  }                                                                                                                    // 601
                                                                                                                       // 602
  // [maxCount]                                                                                                        // 603
  if (typeof def.maxCount !== "undefined") {                                                                           // 604
    message = message.replace("[maxCount]", def.maxCount);                                                             // 605
  }                                                                                                                    // 606
                                                                                                                       // 607
  // [value]                                                                                                           // 608
  if (value !== void 0 && value !== null) {                                                                            // 609
    message = message.replace("[value]", value.toString());                                                            // 610
  } else {                                                                                                             // 611
    message = message.replace("[value]", 'null');                                                                      // 612
  }                                                                                                                    // 613
                                                                                                                       // 614
  // [min] and [max]                                                                                                   // 615
  var min = def.min;                                                                                                   // 616
  var max = def.max;                                                                                                   // 617
  if (def.type === Date || def.type === [Date]) {                                                                      // 618
    if (typeof min !== "undefined") {                                                                                  // 619
      message = message.replace("[min]", Utility.dateToDateString(min));                                               // 620
    }                                                                                                                  // 621
    if (typeof max !== "undefined") {                                                                                  // 622
      message = message.replace("[max]", Utility.dateToDateString(max));                                               // 623
    }                                                                                                                  // 624
  } else {                                                                                                             // 625
    if (typeof min !== "undefined") {                                                                                  // 626
      message = message.replace("[min]", min);                                                                         // 627
    }                                                                                                                  // 628
    if (typeof max !== "undefined") {                                                                                  // 629
      message = message.replace("[max]", max);                                                                         // 630
    }                                                                                                                  // 631
  }                                                                                                                    // 632
                                                                                                                       // 633
  // [type]                                                                                                            // 634
  if (def.type instanceof Function) {                                                                                  // 635
    message = message.replace("[type]", def.type.name);                                                                // 636
  }                                                                                                                    // 637
                                                                                                                       // 638
  // Now return the message                                                                                            // 639
  return message;                                                                                                      // 640
};                                                                                                                     // 641
                                                                                                                       // 642
// Returns true if key is explicitly allowed by the schema or implied                                                  // 643
// by other explicitly allowed keys.                                                                                   // 644
// The key string should have $ in place of any numeric array positions.                                               // 645
SimpleSchema.prototype.allowsKey = function(key) {                                                                     // 646
  var self = this;                                                                                                     // 647
                                                                                                                       // 648
  // Loop through all keys in the schema                                                                               // 649
  return _.any(self._schemaKeys, function(schemaKey) {                                                                 // 650
                                                                                                                       // 651
    // If the schema key is the test key, it's allowed.                                                                // 652
    if (schemaKey === key) {                                                                                           // 653
      return true;                                                                                                     // 654
    }                                                                                                                  // 655
                                                                                                                       // 656
    // Black box handling                                                                                              // 657
    if (self.schema(schemaKey).blackbox === true) {                                                                    // 658
      var kl = schemaKey.length;                                                                                       // 659
      var compare1 = key.slice(0, kl + 2);                                                                             // 660
      var compare2 = compare1.slice(0, -1);                                                                            // 661
                                                                                                                       // 662
      // If the test key is the black box key + ".$", then the test                                                    // 663
      // key is NOT allowed because black box keys are by definition                                                   // 664
      // only for objects, and not for arrays.                                                                         // 665
      if (compare1 === schemaKey + '.$')                                                                               // 666
        return false;                                                                                                  // 667
                                                                                                                       // 668
      // Otherwise                                                                                                     // 669
      if (compare2 === schemaKey + '.')                                                                                // 670
        return true;                                                                                                   // 671
    }                                                                                                                  // 672
                                                                                                                       // 673
    return false;                                                                                                      // 674
  });                                                                                                                  // 675
};                                                                                                                     // 676
                                                                                                                       // 677
SimpleSchema.prototype.newContext = function() {                                                                       // 678
  return new SimpleSchemaValidationContext(this);                                                                      // 679
};                                                                                                                     // 680
                                                                                                                       // 681
// Returns all the child keys for the object identified by the generic prefix,                                         // 682
// or all the top level keys if no prefix is supplied.                                                                 // 683
SimpleSchema.prototype.objectKeys = function(keyPrefix) {                                                              // 684
  var self = this;                                                                                                     // 685
  if (!keyPrefix) {                                                                                                    // 686
    return self._firstLevelSchemaKeys;                                                                                 // 687
  }                                                                                                                    // 688
  return self._objectKeys[keyPrefix + "."] || [];                                                                      // 689
};                                                                                                                     // 690
                                                                                                                       // 691
/*                                                                                                                     // 692
 * PRIVATE FUNCTIONS                                                                                                   // 693
 */                                                                                                                    // 694
                                                                                                                       // 695
//called by clean()                                                                                                    // 696
var typeconvert = function(value, type) {                                                                              // 697
  if (_.isArray(value) || (_.isObject(value) && !(value instanceof Date)))                                             // 698
    return value; //can't and shouldn't convert arrays or objects                                                      // 699
  if (type === String) {                                                                                               // 700
    if (typeof value !== "undefined" && value !== null && typeof value !== "string") {                                 // 701
      return value.toString();                                                                                         // 702
    }                                                                                                                  // 703
    return value;                                                                                                      // 704
  }                                                                                                                    // 705
  if (type === Number) {                                                                                               // 706
    if (typeof value === "string" && !S(value).isEmpty()) {                                                            // 707
      //try to convert numeric strings to numbers                                                                      // 708
      var numberVal = Number(value);                                                                                   // 709
      if (!isNaN(numberVal)) {                                                                                         // 710
        return numberVal;                                                                                              // 711
      } else {                                                                                                         // 712
        return value; //leave string; will fail validation                                                             // 713
      }                                                                                                                // 714
    }                                                                                                                  // 715
    return value;                                                                                                      // 716
  }                                                                                                                    // 717
  return value;                                                                                                        // 718
};                                                                                                                     // 719
                                                                                                                       // 720
var mergeSchemas = function(schemas) {                                                                                 // 721
                                                                                                                       // 722
  // Merge all provided schema definitions.                                                                            // 723
  // This is effectively a shallow clone of each object, too,                                                          // 724
  // which is what we want since we are going to manipulate it.                                                        // 725
  var mergedSchema = {};                                                                                               // 726
  _.each(schemas, function(schema) {                                                                                   // 727
                                                                                                                       // 728
    // Create a temporary SS instance so that the internal object                                                      // 729
    // we use for merging/extending will be fully expanded                                                             // 730
    if (Match.test(schema, SimpleSchema)) {                                                                            // 731
      schema = schema._schema;                                                                                         // 732
    } else {                                                                                                           // 733
      schema = addImplicitKeys(expandSchema(schema));                                                                  // 734
    }                                                                                                                  // 735
                                                                                                                       // 736
    // Loop through and extend each individual field                                                                   // 737
    // definition. That way you can extend and overwrite                                                               // 738
    // base field definitions.                                                                                         // 739
    _.each(schema, function(def, field) {                                                                              // 740
      mergedSchema[field] = mergedSchema[field] || {};                                                                 // 741
      _.extend(mergedSchema[field], def);                                                                              // 742
    });                                                                                                                // 743
                                                                                                                       // 744
  });                                                                                                                  // 745
                                                                                                                       // 746
  // If we merged some schemas, do this again to make sure                                                             // 747
  // extended definitions are pushed into array item field                                                             // 748
  // definitions properly.                                                                                             // 749
  schemas.length && adjustArrayFields(mergedSchema);                                                                   // 750
                                                                                                                       // 751
  return mergedSchema;                                                                                                 // 752
};                                                                                                                     // 753
                                                                                                                       // 754
var expandSchema = function(schema) {                                                                                  // 755
  // Flatten schema by inserting nested definitions                                                                    // 756
  _.each(schema, function(val, key) {                                                                                  // 757
    var dot, type;                                                                                                     // 758
    if (!val)                                                                                                          // 759
      return;                                                                                                          // 760
    if (Match.test(val.type, SimpleSchema)) {                                                                          // 761
      dot = '.';                                                                                                       // 762
      type = val.type;                                                                                                 // 763
      val.type = Object;                                                                                               // 764
    } else if (Match.test(val.type, [SimpleSchema])) {                                                                 // 765
      dot = '.$.';                                                                                                     // 766
      type = val.type[0];                                                                                              // 767
      val.type = [Object];                                                                                             // 768
    } else {                                                                                                           // 769
      return;                                                                                                          // 770
    }                                                                                                                  // 771
    //add child schema definitions to parent schema                                                                    // 772
    _.each(type._schema, function(subVal, subKey) {                                                                    // 773
      var newKey = key + dot + subKey;                                                                                 // 774
      if (!(newKey in schema))                                                                                         // 775
        schema[newKey] = subVal;                                                                                       // 776
    });                                                                                                                // 777
  });                                                                                                                  // 778
  return schema;                                                                                                       // 779
};                                                                                                                     // 780
                                                                                                                       // 781
var adjustArrayFields = function(schema) {                                                                             // 782
  _.each(schema, function(def, existingKey) {                                                                          // 783
    if (_.isArray(def.type) || def.type === Array) {                                                                   // 784
      // Copy some options to array-item definition                                                                    // 785
      var itemKey = existingKey + ".$";                                                                                // 786
      if (!(itemKey in schema)) {                                                                                      // 787
        schema[itemKey] = {};                                                                                          // 788
      }                                                                                                                // 789
      if (_.isArray(def.type)) {                                                                                       // 790
        schema[itemKey].type = def.type[0];                                                                            // 791
      }                                                                                                                // 792
      if (def.label) {                                                                                                 // 793
        schema[itemKey].label = def.label;                                                                             // 794
      }                                                                                                                // 795
      schema[itemKey].optional = true;                                                                                 // 796
      if (typeof def.min !== "undefined") {                                                                            // 797
        schema[itemKey].min = def.min;                                                                                 // 798
      }                                                                                                                // 799
      if (typeof def.max !== "undefined") {                                                                            // 800
        schema[itemKey].max = def.max;                                                                                 // 801
      }                                                                                                                // 802
      if (typeof def.allowedValues !== "undefined") {                                                                  // 803
        schema[itemKey].allowedValues = def.allowedValues;                                                             // 804
      }                                                                                                                // 805
      if (typeof def.decimal !== "undefined") {                                                                        // 806
        schema[itemKey].decimal = def.decimal;                                                                         // 807
      }                                                                                                                // 808
      if (typeof def.regEx !== "undefined") {                                                                          // 809
        schema[itemKey].regEx = def.regEx;                                                                             // 810
      }                                                                                                                // 811
      if (typeof def.blackbox !== "undefined") {                                                                       // 812
        schema[itemKey].blackbox = def.blackbox;                                                                       // 813
      }                                                                                                                // 814
      // Remove copied options and adjust type                                                                         // 815
      def.type = Array;                                                                                                // 816
      _.each(['min', 'max', 'allowedValues', 'decimal', 'regEx', 'blackbox'], function(k) {                            // 817
        Utility.deleteIfPresent(def, k);                                                                               // 818
      });                                                                                                              // 819
    }                                                                                                                  // 820
  });                                                                                                                  // 821
};                                                                                                                     // 822
                                                                                                                       // 823
/**                                                                                                                    // 824
 * Adds implied keys.                                                                                                  // 825
 * * If schema contains a key like "foo.$.bar" but not "foo", adds "foo".                                              // 826
 * * If schema contains a key like "foo" with an array type, adds "foo.$".                                             // 827
 * @param {Object} schema                                                                                              // 828
 * @returns {Object} modified schema                                                                                   // 829
 */                                                                                                                    // 830
var addImplicitKeys = function(schema) {                                                                               // 831
  var arrayKeysToAdd = [], objectKeysToAdd = [], newKey, key;                                                          // 832
                                                                                                                       // 833
  // Pass 1 (objects)                                                                                                  // 834
  _.each(schema, function(def, existingKey) {                                                                          // 835
    var pos = existingKey.indexOf(".");                                                                                // 836
    while (pos !== -1) {                                                                                               // 837
      newKey = existingKey.substring(0, pos);                                                                          // 838
                                                                                                                       // 839
      // It's an array item; nothing to add                                                                            // 840
      if (newKey.substring(newKey.length - 2) === ".$") {                                                              // 841
        pos = -1;                                                                                                      // 842
      }                                                                                                                // 843
      // It's an array of objects; add it with type [Object] if not already in the schema                              // 844
      else if (existingKey.substring(pos, pos + 3) === ".$.") {                                                        // 845
        arrayKeysToAdd.push(newKey); // add later, since we are iterating over schema right now                        // 846
        pos = existingKey.indexOf(".", pos + 3); // skip over next dot, find the one after                             // 847
      }                                                                                                                // 848
      // It's an object; add it with type Object if not already in the schema                                          // 849
      else {                                                                                                           // 850
        objectKeysToAdd.push(newKey); // add later, since we are iterating over schema right now                       // 851
        pos = existingKey.indexOf(".", pos + 1); // find next dot                                                      // 852
      }                                                                                                                // 853
    }                                                                                                                  // 854
  });                                                                                                                  // 855
                                                                                                                       // 856
  for (var i = 0, ln = arrayKeysToAdd.length; i < ln; i++) {                                                           // 857
    key = arrayKeysToAdd[i];                                                                                           // 858
    if (!(key in schema)) {                                                                                            // 859
      schema[key] = {type: [Object], optional: true};                                                                  // 860
    }                                                                                                                  // 861
  }                                                                                                                    // 862
                                                                                                                       // 863
  for (var i = 0, ln = objectKeysToAdd.length; i < ln; i++) {                                                          // 864
    key = objectKeysToAdd[i];                                                                                          // 865
    if (!(key in schema)) {                                                                                            // 866
      schema[key] = {type: Object, optional: true};                                                                    // 867
    }                                                                                                                  // 868
  }                                                                                                                    // 869
                                                                                                                       // 870
  // Pass 2 (arrays)                                                                                                   // 871
  adjustArrayFields(schema);                                                                                           // 872
                                                                                                                       // 873
  return schema;                                                                                                       // 874
};                                                                                                                     // 875
                                                                                                                       // 876
// Returns an object relating the keys in the list                                                                     // 877
// to their parent object.                                                                                             // 878
var getObjectKeys = function(schema, schemaKeyList) {                                                                  // 879
  var keyPrefix, remainingText, rKeys = {}, loopArray;                                                                 // 880
  _.each(schema, function(definition, fieldName) {                                                                     // 881
    if (definition.type === Object) {                                                                                  // 882
      //object                                                                                                         // 883
      keyPrefix = fieldName + ".";                                                                                     // 884
    } else {                                                                                                           // 885
      return;                                                                                                          // 886
    }                                                                                                                  // 887
                                                                                                                       // 888
    loopArray = [];                                                                                                    // 889
    _.each(schemaKeyList, function(fieldName2) {                                                                       // 890
      if (S(fieldName2).startsWith(keyPrefix)) {                                                                       // 891
        remainingText = fieldName2.substring(keyPrefix.length);                                                        // 892
        if (remainingText.indexOf(".") === -1) {                                                                       // 893
          loopArray.push(remainingText);                                                                               // 894
        }                                                                                                              // 895
      }                                                                                                                // 896
    });                                                                                                                // 897
    rKeys[keyPrefix] = loopArray;                                                                                      // 898
  });                                                                                                                  // 899
  return rKeys;                                                                                                        // 900
};                                                                                                                     // 901
                                                                                                                       // 902
// returns an inflected version of fieldName to use as the label                                                       // 903
var inflectedLabel = function(fieldName) {                                                                             // 904
  var label = fieldName, lastPeriod = label.lastIndexOf(".");                                                          // 905
  if (lastPeriod !== -1) {                                                                                             // 906
    label = label.substring(lastPeriod + 1);                                                                           // 907
    if (label === "$") {                                                                                               // 908
      var pcs = fieldName.split(".");                                                                                  // 909
      label = pcs[pcs.length - 2];                                                                                     // 910
    }                                                                                                                  // 911
  }                                                                                                                    // 912
  if (label === "_id")                                                                                                 // 913
    return "ID";                                                                                                       // 914
  return S(label).humanize().s;                                                                                        // 915
};                                                                                                                     // 916
                                                                                                                       // 917
/**                                                                                                                    // 918
 * @method getAutoValues                                                                                               // 919
 * @private                                                                                                            // 920
 * @param {MongoObject} mDoc                                                                                           // 921
 * @param {Boolean} [isModifier=false] - Is it a modifier doc?                                                         // 922
 * @param {Object} [extendedAutoValueContext] - Object that will be added to the context when calling each autoValue function
 * @returns {undefined}                                                                                                // 924
 *                                                                                                                     // 925
 * Updates doc with automatic values from autoValue functions or default                                               // 926
 * values from defaultValue. Modifies the referenced object in place.                                                  // 927
 */                                                                                                                    // 928
function getAutoValues(mDoc, isModifier, extendedAutoValueContext) {                                                   // 929
  var self = this;                                                                                                     // 930
  var doneKeys = [];                                                                                                   // 931
                                                                                                                       // 932
  //on the client we can add the userId if not already in the custom context                                           // 933
  if (Meteor.isClient && extendedAutoValueContext.userId === void 0) {                                                 // 934
    extendedAutoValueContext.userId = (Meteor.userId && Meteor.userId()) || null;                                      // 935
  }                                                                                                                    // 936
                                                                                                                       // 937
  function runAV(func) {                                                                                               // 938
    var affectedKey = this.key;                                                                                        // 939
    // If already called for this key, skip it                                                                         // 940
    if (_.contains(doneKeys, affectedKey))                                                                             // 941
      return;                                                                                                          // 942
    var lastDot = affectedKey.lastIndexOf('.');                                                                        // 943
    var fieldParentName = lastDot === -1 ? '' : affectedKey.slice(0, lastDot + 1);                                     // 944
    var doUnset = false;                                                                                               // 945
    var autoValue = func.call(_.extend({                                                                               // 946
      isSet: (this.value !== void 0),                                                                                  // 947
      unset: function() {                                                                                              // 948
        doUnset = true;                                                                                                // 949
      },                                                                                                               // 950
      value: this.value,                                                                                               // 951
      operator: this.operator,                                                                                         // 952
      field: function(fName) {                                                                                         // 953
        var keyInfo = mDoc.getInfoForKey(fName) || {};                                                                 // 954
        return {                                                                                                       // 955
          isSet: (keyInfo.value !== void 0),                                                                           // 956
          value: keyInfo.value,                                                                                        // 957
          operator: keyInfo.operator || null                                                                           // 958
        };                                                                                                             // 959
      },                                                                                                               // 960
      siblingField: function(fName) {                                                                                  // 961
        var keyInfo = mDoc.getInfoForKey(fieldParentName + fName) || {};                                               // 962
        return {                                                                                                       // 963
          isSet: (keyInfo.value !== void 0),                                                                           // 964
          value: keyInfo.value,                                                                                        // 965
          operator: keyInfo.operator || null                                                                           // 966
        };                                                                                                             // 967
      }                                                                                                                // 968
    }, extendedAutoValueContext || {}), mDoc.getObject());                                                             // 969
                                                                                                                       // 970
    // Update tracking of which keys we've run autovalue for                                                           // 971
    doneKeys.push(affectedKey);                                                                                        // 972
                                                                                                                       // 973
    if (autoValue === void 0) {                                                                                        // 974
      if (doUnset) {                                                                                                   // 975
        mDoc.removeValueForPosition(this.position);                                                                    // 976
      }                                                                                                                // 977
      return;                                                                                                          // 978
    }                                                                                                                  // 979
                                                                                                                       // 980
    // If the user's auto value is of the pseudo-modifier format, parse it                                             // 981
    // into operator and value.                                                                                        // 982
    var op, newValue;                                                                                                  // 983
    if (_.isObject(autoValue)) {                                                                                       // 984
      for (var key in autoValue) {                                                                                     // 985
        if (autoValue.hasOwnProperty(key) && key.substring(0, 1) === "$") {                                            // 986
          op = key;                                                                                                    // 987
          newValue = autoValue[key];                                                                                   // 988
          break;                                                                                                       // 989
        }                                                                                                              // 990
      }                                                                                                                // 991
    }                                                                                                                  // 992
                                                                                                                       // 993
    // Add $set for updates and upserts if necessary                                                                   // 994
    if (!op && isModifier && this.position.slice(0, 1) !== '$') {                                                      // 995
      op = "$set";                                                                                                     // 996
      newValue = autoValue;                                                                                            // 997
    }                                                                                                                  // 998
                                                                                                                       // 999
    // Update/change value                                                                                             // 1000
    if (op) {                                                                                                          // 1001
      mDoc.removeValueForPosition(this.position);                                                                      // 1002
      mDoc.setValueForPosition(op + '[' + affectedKey + ']', newValue);                                                // 1003
    } else {                                                                                                           // 1004
      mDoc.setValueForPosition(this.position, autoValue);                                                              // 1005
    }                                                                                                                  // 1006
  }                                                                                                                    // 1007
                                                                                                                       // 1008
  _.each(self._autoValues, function(func, fieldName) {                                                                 // 1009
    var positionSuffix, key, keySuffix, positions;                                                                     // 1010
                                                                                                                       // 1011
    // If we're under an array, run autovalue for all the properties of                                                // 1012
    // any objects that are present in the nearest ancestor array.                                                     // 1013
    if (fieldName.indexOf("$") !== -1) {                                                                               // 1014
      var testField = fieldName.slice(0, fieldName.lastIndexOf("$") + 1);                                              // 1015
      keySuffix = fieldName.slice(testField.length + 1);                                                               // 1016
      positionSuffix = MongoObject._keyToPosition(keySuffix, true);                                                    // 1017
      keySuffix = '.' + keySuffix;                                                                                     // 1018
      positions = mDoc.getPositionsForGenericKey(testField);                                                           // 1019
    } else {                                                                                                           // 1020
                                                                                                                       // 1021
      // See if anything in the object affects this key                                                                // 1022
      positions = mDoc.getPositionsForGenericKey(fieldName);                                                           // 1023
                                                                                                                       // 1024
      // Run autovalue for properties that are set in the object                                                       // 1025
      if (positions.length) {                                                                                          // 1026
        key = fieldName;                                                                                               // 1027
        keySuffix = '';                                                                                                // 1028
        positionSuffix = '';                                                                                           // 1029
      }                                                                                                                // 1030
                                                                                                                       // 1031
      // Run autovalue for properties that are NOT set in the object                                                   // 1032
      else {                                                                                                           // 1033
        key = fieldName;                                                                                               // 1034
        keySuffix = '';                                                                                                // 1035
        positionSuffix = '';                                                                                           // 1036
        if (isModifier) {                                                                                              // 1037
          positions = ["$set[" + fieldName + "]"];                                                                     // 1038
        } else {                                                                                                       // 1039
          positions = [MongoObject._keyToPosition(fieldName)];                                                         // 1040
        }                                                                                                              // 1041
      }                                                                                                                // 1042
                                                                                                                       // 1043
    }                                                                                                                  // 1044
                                                                                                                       // 1045
    _.each(positions, function(position) {                                                                             // 1046
      runAV.call({                                                                                                     // 1047
        key: (key || MongoObject._positionToKey(position)) + keySuffix,                                                // 1048
        value: mDoc.getValueForPosition(position + positionSuffix),                                                    // 1049
        operator: Utility.extractOp(position),                                                                         // 1050
        position: position + positionSuffix                                                                            // 1051
      }, func);                                                                                                        // 1052
    });                                                                                                                // 1053
  });                                                                                                                  // 1054
}                                                                                                                      // 1055
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}).call(this);






(function () {

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/aldeed:simple-schema/simple-schema-validation.js                                                           //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
doValidation1 = function doValidation1(obj, isModifier, isUpsert, keyToValidate, ss, extendedCustomContext) {          // 1
  // First do some basic checks of the object, and throw errors if necessary                                           // 2
  if (!_.isObject(obj)) {                                                                                              // 3
    throw new Error("The first argument of validate() or validateOne() must be an object");                            // 4
  }                                                                                                                    // 5
                                                                                                                       // 6
  if (!isModifier && Utility.looksLikeModifier(obj)) {                                                                 // 7
    throw new Error("When the validation object contains mongo operators, you must set the modifier option to true");  // 8
  }                                                                                                                    // 9
                                                                                                                       // 10
  var invalidKeys = [];                                                                                                // 11
  var mDoc; // for caching the MongoObject if necessary                                                                // 12
                                                                                                                       // 13
  // Validation function called for each affected key                                                                  // 14
  function validate(val, affectedKey, affectedKeyGeneric, def, op, skipRequiredCheck, isInArrayItemObject, isInSubObject) {
                                                                                                                       // 16
    // Get the schema for this key, marking invalid if there isn't one.                                                // 17
    if (!def) {                                                                                                        // 18
      invalidKeys.push(Utility.errorObject("keyNotInSchema", affectedKey, val, def, ss));                              // 19
      return;                                                                                                          // 20
    }                                                                                                                  // 21
                                                                                                                       // 22
    // Check for missing required values. The general logic is this:                                                   // 23
    // * If the operator is $unset or $rename, it's invalid.                                                           // 24
    // * If the value is null, it's invalid.                                                                           // 25
    // * If the value is undefined and one of the following are true, it's invalid:                                    // 26
    //     * We're validating a key of a sub-object.                                                                   // 27
    //     * We're validating a key of an object that is an array item.                                                // 28
    //     * We're validating a document (as opposed to a modifier).                                                   // 29
    //     * We're validating a key under the $set operator in a modifier, and it's an upsert.                         // 30
    if (!skipRequiredCheck && !def.optional) {                                                                         // 31
      if (                                                                                                             // 32
        val === null ||                                                                                                // 33
        op === "$unset" ||                                                                                             // 34
        op === "$rename" ||                                                                                            // 35
        (val === void 0 && (isInArrayItemObject || isInSubObject || !op || op === "$set"))                             // 36
        ) {                                                                                                            // 37
        invalidKeys.push(Utility.errorObject("required", affectedKey, null, def, ss));                                 // 38
        return;                                                                                                        // 39
      }                                                                                                                // 40
    }                                                                                                                  // 41
                                                                                                                       // 42
    // For $rename, make sure that the new name is allowed by the schema                                               // 43
    if (op === "$rename" && typeof val === "string" && !ss.allowsKey(val)) {                                           // 44
      invalidKeys.push(Utility.errorObject("keyNotInSchema", val, null, null, ss));                                    // 45
      return;                                                                                                          // 46
    }                                                                                                                  // 47
                                                                                                                       // 48
    // No further checking necessary for $unset or $rename                                                             // 49
    if (_.contains(["$unset", "$rename"], op)) {                                                                       // 50
      return;                                                                                                          // 51
    }                                                                                                                  // 52
                                                                                                                       // 53
    // Value checks are not necessary for null or undefined values                                                     // 54
    if (Utility.isNotNullOrUndefined(val)) {                                                                           // 55
                                                                                                                       // 56
      // Check that value is of the correct type                                                                       // 57
      var typeError = doTypeChecks(def, val, op);                                                                      // 58
      if (typeError) {                                                                                                 // 59
        invalidKeys.push(Utility.errorObject(typeError, affectedKey, val, def, ss));                                   // 60
        return;                                                                                                        // 61
      }                                                                                                                // 62
                                                                                                                       // 63
      // Check value against allowedValues array                                                                       // 64
      if (def.allowedValues && !_.contains(def.allowedValues, val)) {                                                  // 65
        invalidKeys.push(Utility.errorObject("notAllowed", affectedKey, val, def, ss));                                // 66
        return;                                                                                                        // 67
      }                                                                                                                // 68
                                                                                                                       // 69
    }                                                                                                                  // 70
                                                                                                                       // 71
    // Perform custom validation                                                                                       // 72
    var lastDot = affectedKey.lastIndexOf('.');                                                                        // 73
    var fieldParentName = lastDot === -1 ? '' : affectedKey.slice(0, lastDot + 1);                                     // 74
    var validators = def.custom ? [def.custom] : [];                                                                   // 75
    validators = validators.concat(ss._validators).concat(SimpleSchema._validators);                                   // 76
    _.every(validators, function(validator) {                                                                          // 77
      var errorType = validator.call(_.extend({                                                                        // 78
        key: affectedKey,                                                                                              // 79
        genericKey: affectedKeyGeneric,                                                                                // 80
        definition: def,                                                                                               // 81
        isSet: (val !== void 0),                                                                                       // 82
        value: val,                                                                                                    // 83
        operator: op,                                                                                                  // 84
        field: function(fName) {                                                                                       // 85
          mDoc = mDoc || new MongoObject(obj, ss._blackboxKeys); //create if necessary, cache for speed                // 86
          var keyInfo = mDoc.getInfoForKey(fName) || {};                                                               // 87
          return {                                                                                                     // 88
            isSet: (keyInfo.value !== void 0),                                                                         // 89
            value: keyInfo.value,                                                                                      // 90
            operator: keyInfo.operator                                                                                 // 91
          };                                                                                                           // 92
        },                                                                                                             // 93
        siblingField: function(fName) {                                                                                // 94
          mDoc = mDoc || new MongoObject(obj, ss._blackboxKeys); //create if necessary, cache for speed                // 95
          var keyInfo = mDoc.getInfoForKey(fieldParentName + fName) || {};                                             // 96
          return {                                                                                                     // 97
            isSet: (keyInfo.value !== void 0),                                                                         // 98
            value: keyInfo.value,                                                                                      // 99
            operator: keyInfo.operator                                                                                 // 100
          };                                                                                                           // 101
        }                                                                                                              // 102
      }, extendedCustomContext || {}));                                                                                // 103
      if (typeof errorType === "string") {                                                                             // 104
        invalidKeys.push(Utility.errorObject(errorType, affectedKey, val, def, ss));                                   // 105
        return false;                                                                                                  // 106
      }                                                                                                                // 107
      return true;                                                                                                     // 108
    });                                                                                                                // 109
  }                                                                                                                    // 110
                                                                                                                       // 111
  // The recursive function                                                                                            // 112
  function checkObj(val, affectedKey, operator, setKeys, isInArrayItemObject, isInSubObject) {                         // 113
    var affectedKeyGeneric, def;                                                                                       // 114
                                                                                                                       // 115
    if (affectedKey) {                                                                                                 // 116
      // When we hit a blackbox key, we don't progress any further                                                     // 117
      if (ss.keyIsInBlackBox(affectedKey)) {                                                                           // 118
        return;                                                                                                        // 119
      }                                                                                                                // 120
                                                                                                                       // 121
      // Make a generic version of the affected key, and use that                                                      // 122
      // to get the schema for this key.                                                                               // 123
      affectedKeyGeneric = SimpleSchema._makeGeneric(affectedKey);                                                     // 124
      def = ss.getDefinition(affectedKey);                                                                             // 125
                                                                                                                       // 126
      // Perform validation for this key                                                                               // 127
      if (!keyToValidate || keyToValidate === affectedKey || keyToValidate === affectedKeyGeneric) {                   // 128
        // We can skip the required check for keys that are ancestors                                                  // 129
        // of those in $set or $setOnInsert because they will be created                                               // 130
        // by MongoDB while setting.                                                                                   // 131
        var skipRequiredCheck = _.some(setKeys, function(sk) {                                                         // 132
          return (sk.slice(0, affectedKey.length + 1) === affectedKey + ".");                                          // 133
        });                                                                                                            // 134
        validate(val, affectedKey, affectedKeyGeneric, def, operator, skipRequiredCheck, isInArrayItemObject, isInSubObject);
      }                                                                                                                // 136
    }                                                                                                                  // 137
                                                                                                                       // 138
    // Temporarily convert missing objects to empty objects                                                            // 139
    // so that the looping code will be called and required                                                            // 140
    // descendent keys can be validated.                                                                               // 141
    if ((val === void 0 || val === null) && (!def || (def.type === Object && !def.optional))) {                        // 142
      val = {};                                                                                                        // 143
    }                                                                                                                  // 144
                                                                                                                       // 145
    // Loop through arrays                                                                                             // 146
    if (_.isArray(val)) {                                                                                              // 147
      _.each(val, function(v, i) {                                                                                     // 148
        checkObj(v, affectedKey + '.' + i, operator, setKeys);                                                         // 149
      });                                                                                                              // 150
    }                                                                                                                  // 151
                                                                                                                       // 152
    // Loop through object keys                                                                                        // 153
    else if (Utility.isBasicObject(val) && (!def || !def.blackbox)) {                                                  // 154
                                                                                                                       // 155
      // Get list of present keys                                                                                      // 156
      var presentKeys = _.keys(val);                                                                                   // 157
                                                                                                                       // 158
      // Check all present keys plus all keys defined by the schema.                                                   // 159
      // This allows us to detect extra keys not allowed by the schema plus                                            // 160
      // any missing required keys, and to run any custom functions for other keys.                                    // 161
      var keysToCheck = _.union(presentKeys, ss.objectKeys(affectedKeyGeneric));                                       // 162
                                                                                                                       // 163
      // If this object is within an array, make sure we check for                                                     // 164
      // required as if it's not a modifier                                                                            // 165
      var isInArrayItemObject = (affectedKeyGeneric && affectedKeyGeneric.slice(-2) === ".$");                         // 166
                                                                                                                       // 167
      // Check all keys in the merged list                                                                             // 168
      _.each(keysToCheck, function(key) {                                                                              // 169
        checkObj(val[key], Utility.appendAffectedKey(affectedKey, key), operator, setKeys, isInArrayItemObject, true); // 170
      });                                                                                                              // 171
    }                                                                                                                  // 172
                                                                                                                       // 173
  }                                                                                                                    // 174
                                                                                                                       // 175
  function checkModifier(mod) {                                                                                        // 176
    // Check for empty modifier                                                                                        // 177
    if (_.isEmpty(mod)) {                                                                                              // 178
      throw new Error("When the modifier option is true, validation object must have at least one operator");          // 179
    }                                                                                                                  // 180
                                                                                                                       // 181
    // Get a list of all keys in $set and $setOnInsert combined, for use later                                         // 182
    var setKeys = _.keys(mod.$set || {}).concat(_.keys(mod.$setOnInsert || {}));                                       // 183
                                                                                                                       // 184
    // If this is an upsert, add all the $setOnInsert keys to $set;                                                    // 185
    // since we don't know whether it will be an insert or update, we'll                                               // 186
    // validate upserts as if they will be an insert.                                                                  // 187
    if ("$setOnInsert" in mod) {                                                                                       // 188
      if (isUpsert) {                                                                                                  // 189
        mod.$set = mod.$set || {};                                                                                     // 190
        mod.$set = _.extend(mod.$set, mod.$setOnInsert);                                                               // 191
      }                                                                                                                // 192
      delete mod.$setOnInsert;                                                                                         // 193
    }                                                                                                                  // 194
                                                                                                                       // 195
    // Loop through operators                                                                                          // 196
    _.each(mod, function (opObj, op) {                                                                                 // 197
      // If non-operators are mixed in, throw error                                                                    // 198
      if (op.slice(0, 1) !== "$") {                                                                                    // 199
        throw new Error("When the modifier option is true, all validation object keys must be operators. Did you forget `$set`?");
      }                                                                                                                // 201
      if (Utility.shouldCheck(op)) {                                                                                   // 202
        // For an upsert, missing props would not be set if an insert is performed,                                    // 203
        // so we add null keys to the modifier to force any "required" checks to fail                                  // 204
        if (isUpsert && op === "$set") {                                                                               // 205
          var presentKeys = _.keys(opObj);                                                                             // 206
          _.each(ss.objectKeys(), function (schemaKey) {                                                               // 207
            if (!_.contains(presentKeys, schemaKey)) {                                                                 // 208
              checkObj(void 0, schemaKey, op, setKeys);                                                                // 209
            }                                                                                                          // 210
          });                                                                                                          // 211
        }                                                                                                              // 212
        _.each(opObj, function (v, k) {                                                                                // 213
          if (op === "$push" || op === "$addToSet") {                                                                  // 214
            if (Utility.isBasicObject(v) && "$each" in v) {                                                            // 215
              v = v.$each;                                                                                             // 216
            } else {                                                                                                   // 217
              k = k + ".0";                                                                                            // 218
            }                                                                                                          // 219
          }                                                                                                            // 220
          checkObj(v, k, op, setKeys);                                                                                 // 221
        });                                                                                                            // 222
      }                                                                                                                // 223
    });                                                                                                                // 224
  }                                                                                                                    // 225
                                                                                                                       // 226
  // Kick off the validation                                                                                           // 227
  if (isModifier)                                                                                                      // 228
    checkModifier(obj);                                                                                                // 229
  else                                                                                                                 // 230
    checkObj(obj);                                                                                                     // 231
                                                                                                                       // 232
  // Make sure there is only one error per fieldName                                                                   // 233
  var addedFieldNames = [];                                                                                            // 234
  invalidKeys = _.filter(invalidKeys, function(errObj) {                                                               // 235
    if (!_.contains(addedFieldNames, errObj.name)) {                                                                   // 236
      addedFieldNames.push(errObj.name);                                                                               // 237
      return true;                                                                                                     // 238
    }                                                                                                                  // 239
    return false;                                                                                                      // 240
  });                                                                                                                  // 241
                                                                                                                       // 242
  return invalidKeys;                                                                                                  // 243
};                                                                                                                     // 244
                                                                                                                       // 245
function doTypeChecks(def, keyValue, op) {                                                                             // 246
  var expectedType = def.type;                                                                                         // 247
                                                                                                                       // 248
  // String checks                                                                                                     // 249
  if (expectedType === String) {                                                                                       // 250
    if (typeof keyValue !== "string") {                                                                                // 251
      return "expectedString";                                                                                         // 252
    } else if (def.max !== null && def.max < keyValue.length) {                                                        // 253
      return "maxString";                                                                                              // 254
    } else if (def.min !== null && def.min > keyValue.length) {                                                        // 255
      return "minString";                                                                                              // 256
    } else if (def.regEx instanceof RegExp && !def.regEx.test(keyValue)) {                                             // 257
      return "regEx";                                                                                                  // 258
    } else if (_.isArray(def.regEx)) {                                                                                 // 259
      var regExError;                                                                                                  // 260
      _.every(def.regEx, function(re, i) {                                                                             // 261
        if (!re.test(keyValue)) {                                                                                      // 262
          regExError = "regEx." + i;                                                                                   // 263
          return false;                                                                                                // 264
        }                                                                                                              // 265
        return true;                                                                                                   // 266
      });                                                                                                              // 267
      if (regExError)                                                                                                  // 268
        return regExError;                                                                                             // 269
    }                                                                                                                  // 270
  }                                                                                                                    // 271
                                                                                                                       // 272
  // Number checks                                                                                                     // 273
  else if (expectedType === Number) {                                                                                  // 274
    if (typeof keyValue !== "number" || isNaN(keyValue)) {                                                             // 275
      return "expectedNumber";                                                                                         // 276
    } else if (op !== "$inc" && def.max !== null && def.max < keyValue) {                                              // 277
      return "maxNumber";                                                                                              // 278
    } else if (op !== "$inc" && def.min !== null && def.min > keyValue) {                                              // 279
      return "minNumber";                                                                                              // 280
    } else if (!def.decimal && keyValue.toString().indexOf(".") > -1) {                                                // 281
      return "noDecimal";                                                                                              // 282
    }                                                                                                                  // 283
  }                                                                                                                    // 284
                                                                                                                       // 285
  // Boolean checks                                                                                                    // 286
  else if (expectedType === Boolean) {                                                                                 // 287
    if (typeof keyValue !== "boolean") {                                                                               // 288
      return "expectedBoolean";                                                                                        // 289
    }                                                                                                                  // 290
  }                                                                                                                    // 291
                                                                                                                       // 292
  // Object checks                                                                                                     // 293
  else if (expectedType === Object) {                                                                                  // 294
    if (!Utility.isBasicObject(keyValue)) {                                                                            // 295
      return "expectedObject";                                                                                         // 296
    }                                                                                                                  // 297
  }                                                                                                                    // 298
                                                                                                                       // 299
  // Array checks                                                                                                      // 300
  else if (expectedType === Array) {                                                                                   // 301
    if (!_.isArray(keyValue)) {                                                                                        // 302
      return "expectedArray";                                                                                          // 303
    } else if (def.minCount !== null && keyValue.length < def.minCount) {                                              // 304
      return "minCount";                                                                                               // 305
    } else if (def.maxCount !== null && keyValue.length > def.maxCount) {                                              // 306
      return "maxCount";                                                                                               // 307
    }                                                                                                                  // 308
  }                                                                                                                    // 309
                                                                                                                       // 310
  // Constructor function checks                                                                                       // 311
  else if (expectedType instanceof Function || Utility.safariBugFix(expectedType)) {                                   // 312
                                                                                                                       // 313
    // Generic constructor checks                                                                                      // 314
    if (!(keyValue instanceof expectedType)) {                                                                         // 315
      return "expectedConstructor";                                                                                    // 316
    }                                                                                                                  // 317
                                                                                                                       // 318
    // Date checks                                                                                                     // 319
    else if (expectedType === Date) {                                                                                  // 320
      if (_.isDate(def.min) && def.min.getTime() > keyValue.getTime()) {                                               // 321
        return "minDate";                                                                                              // 322
      } else if (_.isDate(def.max) && def.max.getTime() < keyValue.getTime()) {                                        // 323
        return "maxDate";                                                                                              // 324
      }                                                                                                                // 325
    }                                                                                                                  // 326
  }                                                                                                                    // 327
                                                                                                                       // 328
}                                                                                                                      // 329
                                                                                                                       // 330
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}).call(this);






(function () {

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/aldeed:simple-schema/simple-schema-validation-new.js                                                       //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
doValidation2 = function doValidation2(obj, isModifier, isUpsert, keyToValidate, ss, extendedCustomContext) {          // 1
                                                                                                                       // 2
  // First do some basic checks of the object, and throw errors if necessary                                           // 3
  if (!_.isObject(obj)) {                                                                                              // 4
    throw new Error("The first argument of validate() or validateOne() must be an object");                            // 5
  }                                                                                                                    // 6
                                                                                                                       // 7
  if (isModifier) {                                                                                                    // 8
    if (_.isEmpty(obj)) {                                                                                              // 9
      throw new Error("When the modifier option is true, validation object must have at least one operator");          // 10
    } else {                                                                                                           // 11
      var allKeysAreOperators = _.every(obj, function(v, k) {                                                          // 12
        return (k.substring(0, 1) === "$");                                                                            // 13
      });                                                                                                              // 14
      if (!allKeysAreOperators) {                                                                                      // 15
        throw new Error("When the modifier option is true, all validation object keys must be operators");             // 16
      }                                                                                                                // 17
                                                                                                                       // 18
      // We use a LocalCollection to figure out what the resulting doc                                                 // 19
      // would be in a worst case scenario. Then we validate that doc                                                  // 20
      // so that we don't have to validate the modifier object directly.                                               // 21
      obj = convertModifierToDoc(obj, ss.schema(), isUpsert);                                                          // 22
    }                                                                                                                  // 23
  } else if (Utility.looksLikeModifier(obj)) {                                                                         // 24
    throw new Error("When the validation object contains mongo operators, you must set the modifier option to true");  // 25
  }                                                                                                                    // 26
                                                                                                                       // 27
  var invalidKeys = [];                                                                                                // 28
  var mDoc; // for caching the MongoObject if necessary                                                                // 29
                                                                                                                       // 30
  // Validation function called for each affected key                                                                  // 31
  function validate(val, affectedKey, affectedKeyGeneric, def, op, skipRequiredCheck, strictRequiredCheck) {           // 32
                                                                                                                       // 33
    // Get the schema for this key, marking invalid if there isn't one.                                                // 34
    if (!def) {                                                                                                        // 35
      invalidKeys.push(Utility.errorObject("keyNotInSchema", affectedKey, val, def, ss));                              // 36
      return;                                                                                                          // 37
    }                                                                                                                  // 38
                                                                                                                       // 39
    // Check for missing required values. The general logic is this:                                                   // 40
    // * If the operator is $unset or $rename, it's invalid.                                                           // 41
    // * If the value is null, it's invalid.                                                                           // 42
    // * If the value is undefined and one of the following are true, it's invalid:                                    // 43
    //     * We're validating a key of a sub-object.                                                                   // 44
    //     * We're validating a key of an object that is an array item.                                                // 45
    //     * We're validating a document (as opposed to a modifier).                                                   // 46
    //     * We're validating a key under the $set operator in a modifier, and it's an upsert.                         // 47
    if (!skipRequiredCheck && !def.optional) {                                                                         // 48
      if (val === null || val === void 0) {                                                                            // 49
        invalidKeys.push(Utility.errorObject("required", affectedKey, null, def, ss));                                 // 50
        return;                                                                                                        // 51
      }                                                                                                                // 52
    }                                                                                                                  // 53
                                                                                                                       // 54
    // Value checks are not necessary for null or undefined values                                                     // 55
    if (Utility.isNotNullOrUndefined(val)) {                                                                           // 56
                                                                                                                       // 57
      // Check that value is of the correct type                                                                       // 58
      var typeError = doTypeChecks(def, val, op);                                                                      // 59
      if (typeError) {                                                                                                 // 60
        invalidKeys.push(Utility.errorObject(typeError, affectedKey, val, def, ss));                                   // 61
        return;                                                                                                        // 62
      }                                                                                                                // 63
                                                                                                                       // 64
      // Check value against allowedValues array                                                                       // 65
      if (def.allowedValues && !_.contains(def.allowedValues, val)) {                                                  // 66
        invalidKeys.push(Utility.errorObject("notAllowed", affectedKey, val, def, ss));                                // 67
        return;                                                                                                        // 68
      }                                                                                                                // 69
                                                                                                                       // 70
    }                                                                                                                  // 71
                                                                                                                       // 72
    // Perform custom validation                                                                                       // 73
    var lastDot = affectedKey.lastIndexOf('.');                                                                        // 74
    var fieldParentName = lastDot === -1 ? '' : affectedKey.slice(0, lastDot + 1);                                     // 75
    var validators = def.custom ? [def.custom] : [];                                                                   // 76
    validators = validators.concat(ss._validators).concat(SimpleSchema._validators);                                   // 77
    _.every(validators, function(validator) {                                                                          // 78
      var errorType = validator.call(_.extend({                                                                        // 79
        key: affectedKey,                                                                                              // 80
        genericKey: affectedKeyGeneric,                                                                                // 81
        definition: def,                                                                                               // 82
        isSet: (val !== void 0),                                                                                       // 83
        value: val,                                                                                                    // 84
        operator: op,                                                                                                  // 85
        field: function(fName) {                                                                                       // 86
          mDoc = mDoc || new MongoObject(obj, ss._blackboxKeys); //create if necessary, cache for speed                // 87
          var keyInfo = mDoc.getInfoForKey(fName) || {};                                                               // 88
          return {                                                                                                     // 89
            isSet: (keyInfo.value !== void 0),                                                                         // 90
            value: keyInfo.value,                                                                                      // 91
            operator: keyInfo.operator                                                                                 // 92
          };                                                                                                           // 93
        },                                                                                                             // 94
        siblingField: function(fName) {                                                                                // 95
          mDoc = mDoc || new MongoObject(obj, ss._blackboxKeys); //create if necessary, cache for speed                // 96
          var keyInfo = mDoc.getInfoForKey(fieldParentName + fName) || {};                                             // 97
          return {                                                                                                     // 98
            isSet: (keyInfo.value !== void 0),                                                                         // 99
            value: keyInfo.value,                                                                                      // 100
            operator: keyInfo.operator                                                                                 // 101
          };                                                                                                           // 102
        }                                                                                                              // 103
      }, extendedCustomContext || {}));                                                                                // 104
      if (typeof errorType === "string") {                                                                             // 105
        invalidKeys.push(Utility.errorObject(errorType, affectedKey, val, def, ss));                                   // 106
        return false;                                                                                                  // 107
      }                                                                                                                // 108
      return true;                                                                                                     // 109
    });                                                                                                                // 110
  }                                                                                                                    // 111
                                                                                                                       // 112
  // The recursive function                                                                                            // 113
  function checkObj(val, affectedKey, skipRequiredCheck, strictRequiredCheck) {                                        // 114
    var affectedKeyGeneric, def;                                                                                       // 115
                                                                                                                       // 116
    if (affectedKey) {                                                                                                 // 117
                                                                                                                       // 118
      // When we hit a blackbox key, we don't progress any further                                                     // 119
      if (ss.keyIsInBlackBox(affectedKey)) {                                                                           // 120
        return;                                                                                                        // 121
      }                                                                                                                // 122
                                                                                                                       // 123
      // Make a generic version of the affected key, and use that                                                      // 124
      // to get the schema for this key.                                                                               // 125
      affectedKeyGeneric = SimpleSchema._makeGeneric(affectedKey);                                                     // 126
      def = ss.getDefinition(affectedKey);                                                                             // 127
                                                                                                                       // 128
      // Perform validation for this key                                                                               // 129
      if (!keyToValidate || keyToValidate === affectedKey || keyToValidate === affectedKeyGeneric) {                   // 130
        validate(val, affectedKey, affectedKeyGeneric, def, null, skipRequiredCheck, strictRequiredCheck);             // 131
      }                                                                                                                // 132
    }                                                                                                                  // 133
                                                                                                                       // 134
    // Temporarily convert missing objects to empty objects                                                            // 135
    // so that the looping code will be called and required                                                            // 136
    // descendent keys can be validated.                                                                               // 137
    if ((val === void 0 || val === null) && (!def || (def.type === Object && !def.optional))) {                        // 138
      val = {};                                                                                                        // 139
    }                                                                                                                  // 140
                                                                                                                       // 141
    // Loop through arrays                                                                                             // 142
    if (_.isArray(val)) {                                                                                              // 143
      _.each(val, function(v, i) {                                                                                     // 144
        checkObj(v, affectedKey + '.' + i);                                                                            // 145
      });                                                                                                              // 146
    }                                                                                                                  // 147
                                                                                                                       // 148
    // Loop through object keys                                                                                        // 149
    else if (Utility.isBasicObject(val) && (!def || !def.blackbox)) {                                                  // 150
                                                                                                                       // 151
      // Get list of present keys                                                                                      // 152
      var presentKeys = _.keys(val);                                                                                   // 153
                                                                                                                       // 154
      // Check all present keys plus all keys defined by the schema.                                                   // 155
      // This allows us to detect extra keys not allowed by the schema plus                                            // 156
      // any missing required keys, and to run any custom functions for other keys.                                    // 157
      var keysToCheck = _.union(presentKeys, ss._schemaKeys);                                                          // 158
                                                                                                                       // 159
      // If this object is within an array, make sure we check for                                                     // 160
      // required as if it's not a modifier                                                                            // 161
      var strictRequiredCheck = (affectedKeyGeneric && affectedKeyGeneric.slice(-2) === ".$");                         // 162
                                                                                                                       // 163
      // Check all keys in the merged list                                                                             // 164
      _.each(keysToCheck, function(key) {                                                                              // 165
        if (Utility.shouldCheck(key)) {                                                                                // 166
          checkObj(val[key], Utility.appendAffectedKey(affectedKey, key), skipRequiredCheck, strictRequiredCheck);     // 167
        }                                                                                                              // 168
      });                                                                                                              // 169
    }                                                                                                                  // 170
                                                                                                                       // 171
  }                                                                                                                    // 172
                                                                                                                       // 173
  // Kick off the validation                                                                                           // 174
  checkObj(obj);                                                                                                       // 175
                                                                                                                       // 176
  // Make sure there is only one error per fieldName                                                                   // 177
  var addedFieldNames = [];                                                                                            // 178
  invalidKeys = _.filter(invalidKeys, function(errObj) {                                                               // 179
    if (!_.contains(addedFieldNames, errObj.name)) {                                                                   // 180
      addedFieldNames.push(errObj.name);                                                                               // 181
      return true;                                                                                                     // 182
    }                                                                                                                  // 183
    return false;                                                                                                      // 184
  });                                                                                                                  // 185
                                                                                                                       // 186
  return invalidKeys;                                                                                                  // 187
};                                                                                                                     // 188
                                                                                                                       // 189
function convertModifierToDoc(mod, schema, isUpsert) {                                                                 // 190
  // Create unmanaged LocalCollection as scratchpad                                                                    // 191
  var t = new Meteor.Collection(null);                                                                                 // 192
                                                                                                                       // 193
  // LocalCollections are in memory, and it seems                                                                      // 194
  // that it's fine to use them synchronously on                                                                       // 195
  // either client or server                                                                                           // 196
  var id;                                                                                                              // 197
  if (isUpsert) {                                                                                                      // 198
    // We assume upserts will be inserts (conservative                                                                 // 199
    // validation of requiredness)                                                                                     // 200
    id = Random.id();                                                                                                  // 201
    t.upsert({_id: id}, mod);                                                                                          // 202
  } else {                                                                                                             // 203
    var mDoc = new MongoObject(mod);                                                                                   // 204
    // Create a ficticious existing document                                                                           // 205
    var fakeDoc = new MongoObject({});                                                                                 // 206
    _.each(schema, function (def, fieldName) {                                                                         // 207
      var setVal;                                                                                                      // 208
      // Prefill doc with empty arrays to avoid the                                                                    // 209
      // mongodb issue where it does not understand                                                                    // 210
      // that numeric pieces should create arrays.                                                                     // 211
      if (def.type === Array && mDoc.affectsGenericKey(fieldName)) {                                                   // 212
        setVal = [];                                                                                                   // 213
      }                                                                                                                // 214
      // Set dummy values for required fields because                                                                  // 215
      // we assume any existing data would be valid.                                                                   // 216
      else if (!def.optional) {                                                                                        // 217
        // TODO correct value type based on schema type                                                                // 218
        if (def.type === Boolean)                                                                                      // 219
          setVal = true;                                                                                               // 220
        else if (def.type === Number)                                                                                  // 221
          setVal = def.min || 0;                                                                                       // 222
        else if (def.type === Date)                                                                                    // 223
          setVal = def.min || new Date;                                                                                // 224
        else if (def.type === Array)                                                                                   // 225
          setVal = [];                                                                                                 // 226
        else if (def.type === Object)                                                                                  // 227
          setVal = {};                                                                                                 // 228
        else                                                                                                           // 229
          setVal = "0";                                                                                                // 230
      }                                                                                                                // 231
                                                                                                                       // 232
      if (setVal !== void 0) {                                                                                         // 233
        var key = fieldName.replace(/\.\$/g, ".0");                                                                    // 234
        var pos = MongoObject._keyToPosition(key, false);                                                              // 235
        fakeDoc.setValueForPosition(pos, setVal);                                                                      // 236
      }                                                                                                                // 237
    });                                                                                                                // 238
    fakeDoc = fakeDoc.getObject();                                                                                     // 239
    // Insert fake doc into local scratch collection                                                                   // 240
    id = t.insert(fakeDoc);                                                                                            // 241
    // Now update it with the modifier                                                                                 // 242
    t.update(id, mod);                                                                                                 // 243
  }                                                                                                                    // 244
                                                                                                                       // 245
  var doc = t.findOne(id);                                                                                             // 246
  // We're done with it                                                                                                // 247
  t.remove(id);                                                                                                        // 248
  // Currently we don't validate _id unless it is                                                                      // 249
  // explicitly added to the schema                                                                                    // 250
  if (!schema._id) {                                                                                                   // 251
    delete doc._id;                                                                                                    // 252
  }                                                                                                                    // 253
  return doc;                                                                                                          // 254
}                                                                                                                      // 255
                                                                                                                       // 256
function doTypeChecks(def, keyValue, op) {                                                                             // 257
  var expectedType = def.type;                                                                                         // 258
                                                                                                                       // 259
  // String checks                                                                                                     // 260
  if (expectedType === String) {                                                                                       // 261
    if (typeof keyValue !== "string") {                                                                                // 262
      return "expectedString";                                                                                         // 263
    } else if (def.max !== null && def.max < keyValue.length) {                                                        // 264
      return "maxString";                                                                                              // 265
    } else if (def.min !== null && def.min > keyValue.length) {                                                        // 266
      return "minString";                                                                                              // 267
    } else if (def.regEx instanceof RegExp && !def.regEx.test(keyValue)) {                                             // 268
      return "regEx";                                                                                                  // 269
    } else if (_.isArray(def.regEx)) {                                                                                 // 270
      var regExError;                                                                                                  // 271
      _.every(def.regEx, function(re, i) {                                                                             // 272
        if (!re.test(keyValue)) {                                                                                      // 273
          regExError = "regEx." + i;                                                                                   // 274
          return false;                                                                                                // 275
        }                                                                                                              // 276
        return true;                                                                                                   // 277
      });                                                                                                              // 278
      if (regExError)                                                                                                  // 279
        return regExError;                                                                                             // 280
    }                                                                                                                  // 281
  }                                                                                                                    // 282
                                                                                                                       // 283
  // Number checks                                                                                                     // 284
  else if (expectedType === Number) {                                                                                  // 285
    if (typeof keyValue !== "number" || isNaN(keyValue)) {                                                             // 286
      return "expectedNumber";                                                                                         // 287
    } else if (op !== "$inc" && def.max !== null && def.max < keyValue) {                                              // 288
      return "maxNumber";                                                                                              // 289
    } else if (op !== "$inc" && def.min !== null && def.min > keyValue) {                                              // 290
      return "minNumber";                                                                                              // 291
    } else if (!def.decimal && keyValue.toString().indexOf(".") > -1) {                                                // 292
      return "noDecimal";                                                                                              // 293
    }                                                                                                                  // 294
  }                                                                                                                    // 295
                                                                                                                       // 296
  // Boolean checks                                                                                                    // 297
  else if (expectedType === Boolean) {                                                                                 // 298
    if (typeof keyValue !== "boolean") {                                                                               // 299
      return "expectedBoolean";                                                                                        // 300
    }                                                                                                                  // 301
  }                                                                                                                    // 302
                                                                                                                       // 303
  // Object checks                                                                                                     // 304
  else if (expectedType === Object) {                                                                                  // 305
    if (!Utility.isBasicObject(keyValue)) {                                                                            // 306
      return "expectedObject";                                                                                         // 307
    }                                                                                                                  // 308
  }                                                                                                                    // 309
                                                                                                                       // 310
  // Array checks                                                                                                      // 311
  else if (expectedType === Array) {                                                                                   // 312
    if (!_.isArray(keyValue)) {                                                                                        // 313
      return "expectedArray";                                                                                          // 314
    } else if (def.minCount !== null && keyValue.length < def.minCount) {                                              // 315
      return "minCount";                                                                                               // 316
    } else if (def.maxCount !== null && keyValue.length > def.maxCount) {                                              // 317
      return "maxCount";                                                                                               // 318
    }                                                                                                                  // 319
  }                                                                                                                    // 320
                                                                                                                       // 321
  // Constructor function checks                                                                                       // 322
  else if (expectedType instanceof Function || Utility.safariBugFix(expectedType)) {                                   // 323
                                                                                                                       // 324
    // Generic constructor checks                                                                                      // 325
    if (!(keyValue instanceof expectedType)) {                                                                         // 326
      return "expectedConstructor";                                                                                    // 327
    }                                                                                                                  // 328
                                                                                                                       // 329
    // Date checks                                                                                                     // 330
    else if (expectedType === Date) {                                                                                  // 331
      if (_.isDate(def.min) && def.min.getTime() > keyValue.getTime()) {                                               // 332
        return "minDate";                                                                                              // 333
      } else if (_.isDate(def.max) && def.max.getTime() < keyValue.getTime()) {                                        // 334
        return "maxDate";                                                                                              // 335
      }                                                                                                                // 336
    }                                                                                                                  // 337
  }                                                                                                                    // 338
                                                                                                                       // 339
}                                                                                                                      // 340
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}).call(this);






(function () {

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/aldeed:simple-schema/simple-schema-context.js                                                              //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
/*                                                                                                                     // 1
 * PUBLIC API                                                                                                          // 2
 */                                                                                                                    // 3
                                                                                                                       // 4
SimpleSchemaValidationContext = function SimpleSchemaValidationContext(ss) {                                           // 5
  var self = this;                                                                                                     // 6
  self._simpleSchema = ss;                                                                                             // 7
  self._schema = ss.schema();                                                                                          // 8
  self._schemaKeys = _.keys(self._schema);                                                                             // 9
  self._invalidKeys = [];                                                                                              // 10
  //set up validation dependencies                                                                                     // 11
  self._deps = {};                                                                                                     // 12
  self._depsAny = new Deps.Dependency;                                                                                 // 13
  _.each(self._schemaKeys, function(name) {                                                                            // 14
    self._deps[name] = new Deps.Dependency;                                                                            // 15
  });                                                                                                                  // 16
};                                                                                                                     // 17
                                                                                                                       // 18
//validates the object against the simple schema and sets a reactive array of error objects                            // 19
SimpleSchemaValidationContext.prototype.validate = function SimpleSchemaValidationContext_validate(doc, options) {     // 20
  var self = this;                                                                                                     // 21
  options = _.extend({                                                                                                 // 22
    modifier: false,                                                                                                   // 23
    upsert: false,                                                                                                     // 24
    extendedCustomContext: {}                                                                                          // 25
  }, options || {});                                                                                                   // 26
                                                                                                                       // 27
  //on the client we can add the userId if not already in the custom context                                           // 28
  if (Meteor.isClient && options.extendedCustomContext.userId === void 0) {                                            // 29
    options.extendedCustomContext.userId = (Meteor.userId && Meteor.userId()) || null;                                 // 30
  }                                                                                                                    // 31
                                                                                                                       // 32
  var invalidKeys = doValidation(doc, options.modifier, options.upsert, null, self._simpleSchema, options.extendedCustomContext);
                                                                                                                       // 34
  //now update self._invalidKeys and dependencies                                                                      // 35
                                                                                                                       // 36
  //note any currently invalid keys so that we can mark them as changed                                                // 37
  //due to new validation (they may be valid now, or invalid in a different way)                                       // 38
  var removedKeys = _.pluck(self._invalidKeys, "name");                                                                // 39
                                                                                                                       // 40
  //update                                                                                                             // 41
  self._invalidKeys = invalidKeys;                                                                                     // 42
                                                                                                                       // 43
  //add newly invalid keys to changedKeys                                                                              // 44
  var addedKeys = _.pluck(self._invalidKeys, "name");                                                                  // 45
                                                                                                                       // 46
  //mark all changed keys as changed                                                                                   // 47
  var changedKeys = _.union(addedKeys, removedKeys);                                                                   // 48
  self._markKeysChanged(changedKeys);                                                                                  // 49
                                                                                                                       // 50
  // Return true if it was valid; otherwise, return false                                                              // 51
  return self._invalidKeys.length === 0;                                                                               // 52
};                                                                                                                     // 53
                                                                                                                       // 54
//validates doc against self._schema for one key and sets a reactive array of error objects                            // 55
SimpleSchemaValidationContext.prototype.validateOne = function SimpleSchemaValidationContext_validateOne(doc, keyName, options) {
  var self = this;                                                                                                     // 57
  options = _.extend({                                                                                                 // 58
    modifier: false,                                                                                                   // 59
    upsert: false,                                                                                                     // 60
    extendedCustomContext: {}                                                                                          // 61
  }, options || {});                                                                                                   // 62
                                                                                                                       // 63
  //on the client we can add the userId if not already in the custom context                                           // 64
  if (Meteor.isClient && options.extendedCustomContext.userId === void 0) {                                            // 65
    options.extendedCustomContext.userId = (Meteor.userId && Meteor.userId()) || null;                                 // 66
  }                                                                                                                    // 67
                                                                                                                       // 68
  var invalidKeys = doValidation(doc, options.modifier, options.upsert, keyName, self._simpleSchema, options.extendedCustomContext);
                                                                                                                       // 70
  //now update self._invalidKeys and dependencies                                                                      // 71
                                                                                                                       // 72
  //remove objects from self._invalidKeys where name = keyName                                                         // 73
  var newInvalidKeys = [];                                                                                             // 74
  for (var i = 0, ln = self._invalidKeys.length, k; i < ln; i++) {                                                     // 75
    k = self._invalidKeys[i];                                                                                          // 76
    if (k.name !== keyName) {                                                                                          // 77
      newInvalidKeys.push(k);                                                                                          // 78
    }                                                                                                                  // 79
  }                                                                                                                    // 80
  self._invalidKeys = newInvalidKeys;                                                                                  // 81
                                                                                                                       // 82
  //merge invalidKeys into self._invalidKeys                                                                           // 83
  for (var i = 0, ln = invalidKeys.length, k; i < ln; i++) {                                                           // 84
    k = invalidKeys[i];                                                                                                // 85
    self._invalidKeys.push(k);                                                                                         // 86
  }                                                                                                                    // 87
                                                                                                                       // 88
  //mark key as changed due to new validation (they may be valid now, or invalid in a different way)                   // 89
  self._markKeysChanged([keyName]);                                                                                    // 90
                                                                                                                       // 91
  // Return true if it was valid; otherwise, return false                                                              // 92
  return !self._keyIsInvalid(keyName);                                                                                 // 93
};                                                                                                                     // 94
                                                                                                                       // 95
function doValidation(obj, isModifier, isUpsert, keyToValidate, ss, extendedCustomContext) {                           // 96
  var useOld = true; //for now this can be manually changed to try the experimental method, which doesn't yet work properly
  var func = useOld ? doValidation1 : doValidation2;                                                                   // 98
  return func(obj, isModifier, isUpsert, keyToValidate, ss, extendedCustomContext);                                    // 99
}                                                                                                                      // 100
                                                                                                                       // 101
//reset the invalidKeys array                                                                                          // 102
SimpleSchemaValidationContext.prototype.resetValidation = function SimpleSchemaValidationContext_resetValidation() {   // 103
  var self = this;                                                                                                     // 104
  var removedKeys = _.pluck(self._invalidKeys, "name");                                                                // 105
  self._invalidKeys = [];                                                                                              // 106
  self._markKeysChanged(removedKeys);                                                                                  // 107
};                                                                                                                     // 108
                                                                                                                       // 109
SimpleSchemaValidationContext.prototype.isValid = function SimpleSchemaValidationContext_isValid() {                   // 110
  var self = this;                                                                                                     // 111
  self._depsAny.depend();                                                                                              // 112
  return !self._invalidKeys.length;                                                                                    // 113
};                                                                                                                     // 114
                                                                                                                       // 115
SimpleSchemaValidationContext.prototype.invalidKeys = function SimpleSchemaValidationContext_invalidKeys() {           // 116
  var self = this;                                                                                                     // 117
  self._depsAny.depend();                                                                                              // 118
  return self._invalidKeys;                                                                                            // 119
};                                                                                                                     // 120
                                                                                                                       // 121
SimpleSchemaValidationContext.prototype.addInvalidKeys = function SimpleSchemaValidationContext_addInvalidKeys(errors) {
  var self = this;                                                                                                     // 123
                                                                                                                       // 124
  if (!errors || !errors.length)                                                                                       // 125
    return;                                                                                                            // 126
                                                                                                                       // 127
  var changedKeys = [];                                                                                                // 128
  _.each(errors, function (errorObject) {                                                                              // 129
    changedKeys.push(errorObject.name);                                                                                // 130
    self._invalidKeys.push(errorObject);                                                                               // 131
  });                                                                                                                  // 132
                                                                                                                       // 133
  self._markKeysChanged(changedKeys);                                                                                  // 134
};                                                                                                                     // 135
                                                                                                                       // 136
SimpleSchemaValidationContext.prototype._markKeysChanged = function SimpleSchemaValidationContext__markKeysChanged(keys) {
  var self = this;                                                                                                     // 138
                                                                                                                       // 139
  if (!keys || !keys.length)                                                                                           // 140
    return;                                                                                                            // 141
                                                                                                                       // 142
  _.each(keys, function(name) {                                                                                        // 143
    var genericName = SimpleSchema._makeGeneric(name);                                                                 // 144
    if (genericName in self._deps) {                                                                                   // 145
      self._deps[genericName].changed();                                                                               // 146
    }                                                                                                                  // 147
  });                                                                                                                  // 148
  self._depsAny.changed();                                                                                             // 149
};                                                                                                                     // 150
                                                                                                                       // 151
SimpleSchemaValidationContext.prototype._getInvalidKeyObject = function SimpleSchemaValidationContext__getInvalidKeyObject(name, genericName) {
  var self = this;                                                                                                     // 153
  genericName = genericName || SimpleSchema._makeGeneric(name);                                                        // 154
                                                                                                                       // 155
  var errorObj = _.findWhere(self._invalidKeys, {name: name});                                                         // 156
  if (!errorObj) {                                                                                                     // 157
    errorObj = _.findWhere(self._invalidKeys, {name: genericName});                                                    // 158
  }                                                                                                                    // 159
  return errorObj;                                                                                                     // 160
};                                                                                                                     // 161
                                                                                                                       // 162
SimpleSchemaValidationContext.prototype._keyIsInvalid = function SimpleSchemaValidationContext__keyIsInvalid(name, genericName) {
  return !!this._getInvalidKeyObject(name, genericName);                                                               // 164
};                                                                                                                     // 165
                                                                                                                       // 166
// Like the internal one, but with deps                                                                                // 167
SimpleSchemaValidationContext.prototype.keyIsInvalid = function SimpleSchemaValidationContext_keyIsInvalid(name) {     // 168
  var self = this, genericName = SimpleSchema._makeGeneric(name);                                                      // 169
  self._deps[genericName] && self._deps[genericName].depend();                                                         // 170
                                                                                                                       // 171
  return self._keyIsInvalid(name, genericName);                                                                        // 172
};                                                                                                                     // 173
                                                                                                                       // 174
SimpleSchemaValidationContext.prototype.keyErrorMessage = function SimpleSchemaValidationContext_keyErrorMessage(name) {
  var self = this, genericName = SimpleSchema._makeGeneric(name);                                                      // 176
  self._deps[genericName] && self._deps[genericName].depend();                                                         // 177
                                                                                                                       // 178
  var errorObj = self._getInvalidKeyObject(name, genericName);                                                         // 179
  if (!errorObj) {                                                                                                     // 180
    return "";                                                                                                         // 181
  }                                                                                                                    // 182
                                                                                                                       // 183
  return self._simpleSchema.messageForError(errorObj.type, errorObj.name, null, errorObj.value);                       // 184
};                                                                                                                     // 185
                                                                                                                       // 186
SimpleSchemaValidationContext.prototype.getErrorObject = function SimpleSchemaValidationContext_getErrorObject(context) {
  var self = this, message, invalidKeys = this._invalidKeys;                                                           // 188
  if (invalidKeys.length) {                                                                                            // 189
    message = self.keyErrorMessage(invalidKeys[0].name);                                                               // 190
    // We add `message` prop to the invalidKeys.                                                                       // 191
    invalidKeys = _.map(invalidKeys, function (o) {                                                                    // 192
      return _.extend({message: self.keyErrorMessage(o.name)}, o);                                                     // 193
    });                                                                                                                // 194
  } else {                                                                                                             // 195
    message = "Failed validation";                                                                                     // 196
  }                                                                                                                    // 197
  var error = new Error(message);                                                                                      // 198
  error.invalidKeys = invalidKeys;                                                                                     // 199
  // If on the server, we add a sanitized error, too, in case we're                                                    // 200
  // called from a method.                                                                                             // 201
  if (Meteor.isServer) {                                                                                               // 202
    error.sanitizedError = new Meteor.Error(400, message);                                                             // 203
  }                                                                                                                    // 204
  return error;                                                                                                        // 205
};                                                                                                                     // 206
                                                                                                                       // 207
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}).call(this);


/* Exports */
if (typeof Package === 'undefined') Package = {};
Package['aldeed:simple-schema'] = {
  SimpleSchema: SimpleSchema,
  MongoObject: MongoObject
};

})();
