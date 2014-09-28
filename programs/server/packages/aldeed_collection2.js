(function () {

/* Imports */
var Meteor = Package.meteor.Meteor;
var SimpleSchema = Package['aldeed:simple-schema'].SimpleSchema;
var MongoObject = Package['aldeed:simple-schema'].MongoObject;
var _ = Package.underscore._;
var Tracker = Package.tracker.Tracker;
var Deps = Package.tracker.Deps;
var check = Package.check.check;
var Match = Package.check.Match;
var EJSON = Package.ejson.EJSON;
var MongoInternals = Package.mongo.MongoInternals;
var Mongo = Package.mongo.Mongo;

/* Package-scope variables */
var Mongo;

(function () {

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                    //
// packages/aldeed:collection2/collection2.js                                                                         //
//                                                                                                                    //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                      //
// Extend the schema options allowed by SimpleSchema                                                                  // 1
SimpleSchema.extendOptions({                                                                                          // 2
  index: Match.Optional(Match.OneOf(Number, String, Boolean)),                                                        // 3
  unique: Match.Optional(Boolean),                                                                                    // 4
  denyInsert: Match.Optional(Boolean),                                                                                // 5
  denyUpdate: Match.Optional(Boolean)                                                                                 // 6
});                                                                                                                   // 7
                                                                                                                      // 8
// Define some extra validation error messages                                                                        // 9
SimpleSchema.messages({                                                                                               // 10
  notUnique: "[label] must be unique",                                                                                // 11
  insertNotAllowed: "[label] cannot be set during an insert",                                                         // 12
  updateNotAllowed: "[label] cannot be set during an update"                                                          // 13
});                                                                                                                   // 14
                                                                                                                      // 15
/*                                                                                                                    // 16
 * Public API                                                                                                         // 17
 */                                                                                                                   // 18
                                                                                                                      // 19
// backwards compatibility                                                                                            // 20
if (typeof Mongo === "undefined") {                                                                                   // 21
  Mongo = {};                                                                                                         // 22
  Mongo.Collection = Meteor.Collection;                                                                               // 23
}                                                                                                                     // 24
                                                                                                                      // 25
/**                                                                                                                   // 26
 * Mongo.Collection.prototype.attachSchema                                                                            // 27
 * @param {SimpleSchema|Object} ss - SimpleSchema instance or a schema definition object from which to create a new SimpleSchema instance
 * @param {Object} [options]                                                                                          // 29
 * @param {Boolean} [options.transform=false] Set to `true` if your document must be passed through the collection's transform to properly validate.
 * @return {undefined}                                                                                                // 31
 *                                                                                                                    // 32
 * Use this method to attach a schema to a collection created by another package,                                     // 33
 * such as Meteor.users. It is most likely unsafe to call this method more than                                       // 34
 * once for a single collection, or to call this for a collection that had a                                          // 35
 * schema object passed to its constructor.                                                                           // 36
 */                                                                                                                   // 37
Mongo.Collection.prototype.attachSchema = function c2AttachSchema(ss, options) {                                      // 38
  var self = this;                                                                                                    // 39
  options = options || {};                                                                                            // 40
                                                                                                                      // 41
  if (!(ss instanceof SimpleSchema)) {                                                                                // 42
    ss = new SimpleSchema(ss);                                                                                        // 43
  }                                                                                                                   // 44
                                                                                                                      // 45
  self._c2 = self._c2 || {};                                                                                          // 46
                                                                                                                      // 47
  // If we've already attached one schema, we combine both into a new schema                                          // 48
  if (self._c2._simpleSchema) {                                                                                       // 49
    ss = new SimpleSchema([self._c2._simpleSchema, ss]);                                                              // 50
  }                                                                                                                   // 51
                                                                                                                      // 52
  // Track the schema in the collection                                                                               // 53
  self._c2._simpleSchema = ss;                                                                                        // 54
                                                                                                                      // 55
  // Loop over fields definitions and ensure collection indexes (server side only)                                    // 56
  _.each(ss.schema(), function(definition, fieldName) {                                                               // 57
    if (Meteor.isServer && ('index' in definition || definition.unique === true)) {                                   // 58
                                                                                                                      // 59
      function setUpIndex() {                                                                                         // 60
        var index = {}, indexValue;                                                                                   // 61
        // If they specified `unique: true` but not `index`, we assume `index: 1` to set up the unique index in mongo // 62
        if ('index' in definition) {                                                                                  // 63
          indexValue = definition['index'];                                                                           // 64
          if (indexValue === true) {                                                                                  // 65
            indexValue = 1;                                                                                           // 66
          }                                                                                                           // 67
        } else {                                                                                                      // 68
          indexValue = 1;                                                                                             // 69
        }                                                                                                             // 70
        var indexName = 'c2_' + fieldName;                                                                            // 71
        // In the index object, we want object array keys without the ".$" piece                                      // 72
        var idxFieldName = fieldName.replace(/\.\$\./g, ".");                                                         // 73
        index[idxFieldName] = indexValue;                                                                             // 74
        var unique = !!definition.unique && (indexValue === 1 || indexValue === -1);                                  // 75
        var sparse = !!definition.optional && unique;                                                                 // 76
        if (indexValue !== false) {                                                                                   // 77
          self._collection._ensureIndex(index, {                                                                      // 78
            background: true,                                                                                         // 79
            name: indexName,                                                                                          // 80
            unique: unique,                                                                                           // 81
            sparse: sparse                                                                                            // 82
          });                                                                                                         // 83
        } else {                                                                                                      // 84
          try {                                                                                                       // 85
            self._collection._dropIndex(indexName);                                                                   // 86
          } catch (err) {                                                                                             // 87
            console.warn("Collection2: Tried to drop mongo index " + indexName + ", but there is no index with that name");
          }                                                                                                           // 89
        }                                                                                                             // 90
      }                                                                                                               // 91
                                                                                                                      // 92
      Meteor.startup(setUpIndex);                                                                                     // 93
    }                                                                                                                 // 94
  });                                                                                                                 // 95
                                                                                                                      // 96
  // Set up additional checks                                                                                         // 97
  ss.validator(function() {                                                                                           // 98
    var test, totalUsing, totalWillUse, sel;                                                                          // 99
    var def = this.definition;                                                                                        // 100
    var val = this.value;                                                                                             // 101
    var op = this.operator;                                                                                           // 102
    var key = this.key;                                                                                               // 103
                                                                                                                      // 104
    if (def.denyInsert && val !== void 0 && !op) {                                                                    // 105
      // This is an insert of a defined value into a field where denyInsert=true                                      // 106
      return "insertNotAllowed";                                                                                      // 107
    }                                                                                                                 // 108
                                                                                                                      // 109
    if (def.denyUpdate && op) {                                                                                       // 110
      // This is an insert of a defined value into a field where denyUpdate=true                                      // 111
      if (op !== "$set" || (op === "$set" && val !== void 0)) {                                                       // 112
        return "updateNotAllowed";                                                                                    // 113
      }                                                                                                               // 114
    }                                                                                                                 // 115
                                                                                                                      // 116
    return true;                                                                                                      // 117
  });                                                                                                                 // 118
                                                                                                                      // 119
  defineDeny(self, options);                                                                                          // 120
  keepInsecure(self);                                                                                                 // 121
};                                                                                                                    // 122
                                                                                                                      // 123
Mongo.Collection.prototype.simpleSchema = function c2SS() {                                                           // 124
  var self = this;                                                                                                    // 125
  return self._c2 ? self._c2._simpleSchema : null;                                                                    // 126
};                                                                                                                    // 127
                                                                                                                      // 128
// Wrap DB write operation methods                                                                                    // 129
_.each(['insert', 'update', 'upsert'], function(methodName) {                                                         // 130
  var _super = Mongo.Collection.prototype[methodName];                                                                // 131
  Mongo.Collection.prototype[methodName] = function () {                                                              // 132
    var self = this, args = _.toArray(arguments);                                                                     // 133
    if (self._c2) {                                                                                                   // 134
      args = doValidate.call(self, methodName, args, false,                                                           // 135
        (Meteor.isClient && Meteor.userId && Meteor.userId()) || null, Meteor.isServer);                              // 136
      if (!args) {                                                                                                    // 137
        // doValidate already called the callback or threw the error                                                  // 138
        if (methodName === "insert") {                                                                                // 139
          // insert should always return an ID to match core behavior                                                 // 140
          return self._makeNewID();                                                                                   // 141
        } else {                                                                                                      // 142
          return;                                                                                                     // 143
        }                                                                                                             // 144
      }                                                                                                               // 145
    }                                                                                                                 // 146
    return _super.apply(self, args);                                                                                  // 147
  };                                                                                                                  // 148
});                                                                                                                   // 149
                                                                                                                      // 150
/*                                                                                                                    // 151
 * Private                                                                                                            // 152
 */                                                                                                                   // 153
                                                                                                                      // 154
function doValidate(type, args, skipAutoValue, userId, isFromTrustedCode) {                                           // 155
  var self = this, schema = self._c2._simpleSchema,                                                                   // 156
      doc, callback, error, options, isUpsert, selector;                                                              // 157
                                                                                                                      // 158
  if (!args.length) {                                                                                                 // 159
    throw new Error(type + " requires an argument");                                                                  // 160
  }                                                                                                                   // 161
                                                                                                                      // 162
  // Gather arguments and cache the selector                                                                          // 163
  if (type === "insert") {                                                                                            // 164
    doc = args[0];                                                                                                    // 165
    options = args[1];                                                                                                // 166
    callback = args[2];                                                                                               // 167
                                                                                                                      // 168
    // The real insert doesn't take options                                                                           // 169
    if (typeof options === "function") {                                                                              // 170
      args = [doc, options];                                                                                          // 171
    } else if (typeof callback === "function") {                                                                      // 172
      args = [doc, callback];                                                                                         // 173
    } else {                                                                                                          // 174
      args = [doc];                                                                                                   // 175
    }                                                                                                                 // 176
                                                                                                                      // 177
  } else if (type === "update" || type === "upsert") {                                                                // 178
    selector = args[0];                                                                                               // 179
    doc = args[1];                                                                                                    // 180
    options = args[2];                                                                                                // 181
    callback = args[3];                                                                                               // 182
  } else {                                                                                                            // 183
    throw new Error("invalid type argument");                                                                         // 184
  }                                                                                                                   // 185
                                                                                                                      // 186
  // Support missing options arg                                                                                      // 187
  if (!callback && typeof options === "function") {                                                                   // 188
    callback = options;                                                                                               // 189
    options = {};                                                                                                     // 190
  }                                                                                                                   // 191
  options = options || {};                                                                                            // 192
                                                                                                                      // 193
  // If update was called with upsert:true or upsert was called, flag as an upsert                                    // 194
  isUpsert = (type === "upsert" || (type === "update" && options.upsert === true));                                   // 195
                                                                                                                      // 196
  // Add a default callback function if we're on the client and no callback was given                                 // 197
  if (Meteor.isClient && !callback) {                                                                                 // 198
    // Client can't block, so it can't report errors by exception,                                                    // 199
    // only by callback. If they forget the callback, give them a                                                     // 200
    // default one that logs the error, so they aren't totally                                                        // 201
    // baffled if their writes don't work because their database is                                                   // 202
    // down.                                                                                                          // 203
    callback = function(err) {                                                                                        // 204
      if (err)                                                                                                        // 205
        Meteor._debug(type + " failed: " + (err.reason || err.stack));                                                // 206
    };                                                                                                                // 207
  }                                                                                                                   // 208
                                                                                                                      // 209
  // If client validation is fine or is skipped but then something                                                    // 210
  // is found to be invalid on the server, we get that error back                                                     // 211
  // as a special Meteor.Error that we need to parse.                                                                 // 212
  if (Meteor.isClient) {                                                                                              // 213
    var last = args.length - 1;                                                                                       // 214
    if (typeof args[last] === 'function') {                                                                           // 215
      callback = args[last] = wrapCallbackForParsingServerErrors(self, options.validationContext, callback);          // 216
    }                                                                                                                 // 217
  }                                                                                                                   // 218
                                                                                                                      // 219
  // If _id has already been added, remove it temporarily if it's                                                     // 220
  // not explicitly defined in the schema.                                                                            // 221
  var id;                                                                                                             // 222
  if (Meteor.isServer && doc._id && !schema.allowsKey("_id")) {                                                       // 223
    id = doc._id;                                                                                                     // 224
    delete doc._id;                                                                                                   // 225
  }                                                                                                                   // 226
                                                                                                                      // 227
  function doClean(docToClean, getAutoValues, filter, autoConvert, removeEmptyStrings, trimStrings) {                 // 228
    // Clean the doc/modifier in place                                                                                // 229
    schema.clean(docToClean, {                                                                                        // 230
      filter: filter,                                                                                                 // 231
      autoConvert: autoConvert,                                                                                       // 232
      getAutoValues: getAutoValues,                                                                                   // 233
      isModifier: (type !== "insert"),                                                                                // 234
      removeEmptyStrings: removeEmptyStrings,                                                                         // 235
      trimStrings: trimStrings,                                                                                       // 236
      extendAutoValueContext: {                                                                                       // 237
        isInsert: (type === "insert"),                                                                                // 238
        isUpdate: (type === "update" && options.upsert !== true),                                                     // 239
        isUpsert: isUpsert,                                                                                           // 240
        userId: userId,                                                                                               // 241
        isFromTrustedCode: isFromTrustedCode,                                                                         // 242
        docId: ((type === "update" || type === "upsert") && selector && selector._id) ? selector._id : void 0         // 243
      }                                                                                                               // 244
    });                                                                                                               // 245
  }                                                                                                                   // 246
                                                                                                                      // 247
  // On the server, we allow passing `getAutoValues: false` to disable autoValue functions                            // 248
  if (Meteor.isServer && options.getAutoValues === false) {                                                           // 249
    skipAutoValue = true;                                                                                             // 250
  }                                                                                                                   // 251
                                                                                                                      // 252
  // Preliminary cleaning on both client and server. On the server, automatic                                         // 253
  // values will also be set at this point.                                                                           // 254
  doClean(doc, (Meteor.isServer && !skipAutoValue), options.filter !== false, options.autoConvert !== false, options.removeEmptyStrings !== false, options.trimStrings !== false);
                                                                                                                      // 256
  // We clone before validating because in some cases we need to adjust the                                           // 257
  // object a bit before validating it. If we adjusted `doc` itself, our                                              // 258
  // changes would persist into the database.                                                                         // 259
  var docToValidate = {};                                                                                             // 260
  for (var prop in doc) {                                                                                             // 261
    // We omit prototype properties when cloning because they will not be valid                                       // 262
    // and mongo omits them when saving to the database anyway.                                                       // 263
    if (doc.hasOwnProperty(prop)) {                                                                                   // 264
      docToValidate[prop] = doc[prop];                                                                                // 265
    }                                                                                                                 // 266
  }                                                                                                                   // 267
                                                                                                                      // 268
  // On the server, upserts are possible; SimpleSchema handles upserts pretty                                         // 269
  // well by default, but it will not know about the fields in the selector,                                          // 270
  // which are also stored in the database if an insert is performed. So we                                           // 271
  // will allow these fields to be considered for validation by adding them                                           // 272
  // to the $set in the modifier. This is no doubt prone to errors, but there                                         // 273
  // probably isn't any better way right now.                                                                         // 274
  if (Meteor.isServer && isUpsert && _.isObject(selector)) {                                                          // 275
    var set = docToValidate.$set || {};                                                                               // 276
    docToValidate.$set = _.clone(selector);                                                                           // 277
    _.extend(docToValidate.$set, set);                                                                                // 278
  }                                                                                                                   // 279
                                                                                                                      // 280
  // Set automatic values for validation on the client.                                                               // 281
  // On the server, we already updated doc with auto values, but on the client,                                       // 282
  // we will add them to docToValidate for validation purposes only.                                                  // 283
  // This is because we want all actual values generated on the server.                                               // 284
  if (Meteor.isClient) {                                                                                              // 285
    doClean(docToValidate, true, false, false, false, false);                                                         // 286
  }                                                                                                                   // 287
                                                                                                                      // 288
  // Validate doc                                                                                                     // 289
  var ctx = schema.namedContext(options.validationContext);                                                           // 290
  var isValid;                                                                                                        // 291
  if (options.validate === false) {                                                                                   // 292
    isValid = true;                                                                                                   // 293
  } else {                                                                                                            // 294
    isValid = ctx.validate(docToValidate, {                                                                           // 295
      modifier: (type === "update" || type === "upsert"),                                                             // 296
      upsert: isUpsert,                                                                                               // 297
      extendedCustomContext: {                                                                                        // 298
        isInsert: (type === "insert"),                                                                                // 299
        isUpdate: (type === "update" && options.upsert !== true),                                                     // 300
        isUpsert: isUpsert,                                                                                           // 301
        userId: userId,                                                                                               // 302
        isFromTrustedCode: isFromTrustedCode,                                                                         // 303
        docId: ((type === "update" || type === "upsert") && selector && selector._id) ? selector._id : void 0         // 304
      }                                                                                                               // 305
    });                                                                                                               // 306
  }                                                                                                                   // 307
                                                                                                                      // 308
  if (isValid) {                                                                                                      // 309
    // Add the ID back                                                                                                // 310
    if (id) {                                                                                                         // 311
      doc._id = id;                                                                                                   // 312
    }                                                                                                                 // 313
    // Update the args to reflect the cleaned doc                                                                     // 314
    if (type === "insert") {                                                                                          // 315
      args[0] = doc;                                                                                                  // 316
    } else {                                                                                                          // 317
      args[1] = doc;                                                                                                  // 318
    }                                                                                                                 // 319
                                                                                                                      // 320
    // If callback, set invalidKey when we get a mongo unique error                                                   // 321
    if (Meteor.isServer) {                                                                                            // 322
      var last = args.length - 1;                                                                                     // 323
      if (typeof args[last] === 'function') {                                                                         // 324
        args[last] = wrapCallbackForParsingMongoValidationErrors(self, doc, options.validationContext, args[last]);   // 325
      }                                                                                                               // 326
    }                                                                                                                 // 327
    return args;                                                                                                      // 328
  } else {                                                                                                            // 329
    error = getErrorObject(ctx);                                                                                      // 330
    if (callback) {                                                                                                   // 331
      // insert/update/upsert pass `false` when there's an error, so we do that                                       // 332
      callback(error, false);                                                                                         // 333
    } else {                                                                                                          // 334
      throw error;                                                                                                    // 335
    }                                                                                                                 // 336
  }                                                                                                                   // 337
}                                                                                                                     // 338
                                                                                                                      // 339
function getErrorObject(context) {                                                                                    // 340
  var message, invalidKeys = context.invalidKeys();                                                                   // 341
  if (invalidKeys.length) {                                                                                           // 342
    message = context.keyErrorMessage(invalidKeys[0].name);                                                           // 343
  } else {                                                                                                            // 344
    message = "Failed validation";                                                                                    // 345
  }                                                                                                                   // 346
  var error = new Error(message);                                                                                     // 347
  error.invalidKeys = invalidKeys;                                                                                    // 348
  // If on the server, we add a sanitized error, too, in case we're                                                   // 349
  // called from a method.                                                                                            // 350
  if (Meteor.isServer) {                                                                                              // 351
    error.sanitizedError = new Meteor.Error(400, message);                                                            // 352
  }                                                                                                                   // 353
  return error;                                                                                                       // 354
}                                                                                                                     // 355
                                                                                                                      // 356
function addUniqueError(context, errorMessage) {                                                                      // 357
  var name = errorMessage.split('c2_')[1].split(' ')[0];                                                              // 358
  var val = errorMessage.split('dup key:')[1].split('"')[1];                                                          // 359
  context.addInvalidKeys([{                                                                                           // 360
    name: name,                                                                                                       // 361
    type: 'notUnique',                                                                                                // 362
    value: val                                                                                                        // 363
  }]);                                                                                                                // 364
}                                                                                                                     // 365
                                                                                                                      // 366
function wrapCallbackForParsingMongoValidationErrors(col, doc, vCtx, cb) {                                            // 367
  return function wrappedCallbackForParsingMongoValidationErrors(error) {                                             // 368
    if (error && ((error.name === "MongoError" && error.code === 11001) || error.message.indexOf('MongoError: E11000' !== -1)) && error.message.indexOf('c2_') !== -1) {
      var context = col.simpleSchema().namedContext(vCtx);                                                            // 370
      addUniqueError(context, error.message);                                                                         // 371
      arguments[0] = getErrorObject(context);                                                                         // 372
    }                                                                                                                 // 373
    return cb.apply(this, arguments);                                                                                 // 374
  };                                                                                                                  // 375
}                                                                                                                     // 376
                                                                                                                      // 377
function wrapCallbackForParsingServerErrors(col, vCtx, cb) {                                                          // 378
  return function wrappedCallbackForParsingServerErrors(error) {                                                      // 379
    // Handle our own validation errors                                                                               // 380
    var context = col.simpleSchema().namedContext(vCtx);                                                              // 381
    if (error instanceof Meteor.Error && error.error === 400 && error.reason === "INVALID" && typeof error.details === "string") {
      var invalidKeysFromServer = EJSON.parse(error.details);                                                         // 383
      context.addInvalidKeys(invalidKeysFromServer);                                                                  // 384
      arguments[0] = getErrorObject(context);                                                                         // 385
    }                                                                                                                 // 386
    // Handle Mongo unique index errors, which are forwarded to the client as 409 errors                              // 387
    else if (error instanceof Meteor.Error && error.error === 409 && error.reason && error.reason.indexOf('E11000') !== -1 && error.reason.indexOf('c2_') !== -1) {
      addUniqueError(context, error.reason);                                                                          // 389
      arguments[0] = getErrorObject(context);                                                                         // 390
    }                                                                                                                 // 391
    return cb.apply(this, arguments);                                                                                 // 392
  };                                                                                                                  // 393
}                                                                                                                     // 394
                                                                                                                      // 395
var alreadyInsecured = {};                                                                                            // 396
function keepInsecure(c) {                                                                                            // 397
  // If insecure package is in use, we need to add allow rules that return                                            // 398
  // true. Otherwise, it would seemingly turn off insecure mode.                                                      // 399
  if (Package && Package.insecure && !alreadyInsecured[c._name]) {                                                    // 400
    c.allow({                                                                                                         // 401
      insert: function() {                                                                                            // 402
        return true;                                                                                                  // 403
      },                                                                                                              // 404
      update: function() {                                                                                            // 405
        return true;                                                                                                  // 406
      },                                                                                                              // 407
      remove: function () {                                                                                           // 408
        return true;                                                                                                  // 409
      },                                                                                                              // 410
      fetch: [],                                                                                                      // 411
      transform: null                                                                                                 // 412
    });                                                                                                               // 413
    alreadyInsecured[c._name] = true;                                                                                 // 414
  }                                                                                                                   // 415
  // If insecure package is NOT in use, then adding the two deny functions                                            // 416
  // does not have any effect on the main app's security paradigm. The                                                // 417
  // user will still be required to add at least one allow function of her                                            // 418
  // own for each operation for this collection. And the user may still add                                           // 419
  // additional deny functions, but does not have to.                                                                 // 420
}                                                                                                                     // 421
                                                                                                                      // 422
var alreadyDefined = {};                                                                                              // 423
function defineDeny(c, options) {                                                                                     // 424
  if (!alreadyDefined[c._name]) {                                                                                     // 425
                                                                                                                      // 426
    // First define deny functions to extend doc with the results of clean                                            // 427
    // and autovalues. This must be done with "transform: null" or we would be                                        // 428
    // extending a clone of doc and therefore have no effect.                                                         // 429
    c.deny({                                                                                                          // 430
      insert: function(userId, doc) {                                                                                 // 431
        var ss = c.simpleSchema();                                                                                    // 432
        // If _id has already been added, remove it temporarily if it's                                               // 433
        // not explicitly defined in the schema.                                                                      // 434
        var id;                                                                                                       // 435
        if (Meteor.isServer && doc._id && !ss.allowsKey("_id")) {                                                     // 436
          id = doc._id;                                                                                               // 437
          delete doc._id;                                                                                             // 438
        }                                                                                                             // 439
                                                                                                                      // 440
        // Referenced doc is cleaned in place                                                                         // 441
        ss.clean(doc, {                                                                                               // 442
          isModifier: false,                                                                                          // 443
          // We don't do these here because they are done on the client if desired                                    // 444
          filter: false,                                                                                              // 445
          autoConvert: false,                                                                                         // 446
          removeEmptyStrings: false,                                                                                  // 447
          trimStrings: false,                                                                                         // 448
          extendAutoValueContext: {                                                                                   // 449
            isInsert: true,                                                                                           // 450
            isUpdate: false,                                                                                          // 451
            isUpsert: false,                                                                                          // 452
            userId: userId,                                                                                           // 453
            isFromTrustedCode: false                                                                                  // 454
          }                                                                                                           // 455
        });                                                                                                           // 456
                                                                                                                      // 457
        // Add the ID back                                                                                            // 458
        if (id) {                                                                                                     // 459
          doc._id = id;                                                                                               // 460
        }                                                                                                             // 461
                                                                                                                      // 462
        return false;                                                                                                 // 463
      },                                                                                                              // 464
      update: function(userId, doc, fields, modifier) {                                                               // 465
        var ss = c.simpleSchema();                                                                                    // 466
        // Referenced modifier is cleaned in place                                                                    // 467
        ss.clean(modifier, {                                                                                          // 468
          isModifier: true,                                                                                           // 469
          // We don't do these here because they are done on the client if desired                                    // 470
          filter: false,                                                                                              // 471
          autoConvert: false,                                                                                         // 472
          removeEmptyStrings: false,                                                                                  // 473
          trimStrings: false,                                                                                         // 474
          extendAutoValueContext: {                                                                                   // 475
            isInsert: false,                                                                                          // 476
            isUpdate: true,                                                                                           // 477
            isUpsert: false,                                                                                          // 478
            userId: userId,                                                                                           // 479
            isFromTrustedCode: false,                                                                                 // 480
            docId: doc && doc._id                                                                                     // 481
          }                                                                                                           // 482
        });                                                                                                           // 483
                                                                                                                      // 484
        return false;                                                                                                 // 485
      },                                                                                                              // 486
      fetch: ['_id'],                                                                                                 // 487
      transform: null                                                                                                 // 488
    });                                                                                                               // 489
                                                                                                                      // 490
    // Second define deny functions to validate again on the server                                                   // 491
    // for client-initiated inserts and updates. These should be                                                      // 492
    // called after the clean/autovalue functions since we're adding                                                  // 493
    // them after. These must *not* have "transform: null" if options.transform is true because                       // 494
    // we need to pass the doc through any transforms to be sure                                                      // 495
    // that custom types are properly recognized for type validation.                                                 // 496
    c.deny(_.extend({                                                                                                 // 497
      insert: function(userId, doc) {                                                                                 // 498
        // We pass the false options because we will have done them on client if desired                              // 499
        doValidate.call(c, "insert", [doc, {trimStrings: false, removeEmptyStrings: false, filter: false, autoConvert: false}, function(error) {
            if (error) {                                                                                              // 501
              throw new Meteor.Error(400, 'INVALID', EJSON.stringify(error.invalidKeys));                             // 502
            }                                                                                                         // 503
          }], true, userId, false);                                                                                   // 504
                                                                                                                      // 505
        return false;                                                                                                 // 506
      },                                                                                                              // 507
      update: function(userId, doc, fields, modifier) {                                                               // 508
        // NOTE: This will never be an upsert because client-side upserts                                             // 509
        // are not allowed once you define allow/deny functions.                                                      // 510
        // We pass the false options because we will have done them on client if desired                              // 511
        doValidate.call(c, "update", [{_id: doc && doc._id}, modifier, {trimStrings: false, removeEmptyStrings: false, filter: false, autoConvert: false}, function(error) {
            if (error) {                                                                                              // 513
              throw new Meteor.Error(400, 'INVALID', EJSON.stringify(error.invalidKeys));                             // 514
            }                                                                                                         // 515
          }], true, userId, false);                                                                                   // 516
                                                                                                                      // 517
        return false;                                                                                                 // 518
      },                                                                                                              // 519
      fetch: ['_id']                                                                                                  // 520
    }, options.transform === true ? {} : {transform: null}));                                                         // 521
                                                                                                                      // 522
    // note that we've already done this collection so that we don't do it again                                      // 523
    // if attachSchema is called again                                                                                // 524
    alreadyDefined[c._name] = true;                                                                                   // 525
  }                                                                                                                   // 526
}                                                                                                                     // 527
                                                                                                                      // 528
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}).call(this);


/* Exports */
if (typeof Package === 'undefined') Package = {};
Package['aldeed:collection2'] = {};

})();
