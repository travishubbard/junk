(function () {

/* Imports */
var Meteor = Package.meteor.Meteor;
var Accounts = Package['accounts-base'].Accounts;
var check = Package.check.check;
var Match = Package.check.Match;
var _ = Package.underscore._;
var RouteController = Package['iron:router'].RouteController;
var Route = Package['iron:router'].Route;
var Router = Package['iron:router'].Router;

/* Package-scope variables */
var AccountsTemplates, STATE_PAT, CONFIG_PAT, FIELD_SUB_PAT, FIELD_PAT, AT;

(function () {

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                 //
// packages/splendido:accounts-templates-core/lib/core.js                                                          //
//                                                                                                                 //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                   //
// ---------------------------------------------------------------------------------                               // 1
                                                                                                                   // 2
// Patterns for methods" parameters                                                                                // 3
                                                                                                                   // 4
// ---------------------------------------------------------------------------------                               // 5
                                                                                                                   // 6
STATE_PAT = {                                                                                                      // 7
    changePwd: Match.Optional(String),                                                                             // 8
    enrollAccount: Match.Optional(String),                                                                         // 9
    forgotPwd: Match.Optional(String),                                                                             // 10
    resetPwd: Match.Optional(String),                                                                              // 11
    signIn: Match.Optional(String),                                                                                // 12
    signUp: Match.Optional(String),                                                                                // 13
};                                                                                                                 // 14
                                                                                                                   // 15
                                                                                                                   // 16
// Configuration pattern to be checked with check                                                                  // 17
CONFIG_PAT = {                                                                                                     // 18
    // Behaviour                                                                                                   // 19
    confirmPassword: Match.Optional(Boolean),                                                                      // 20
    enablePasswordChange: Match.Optional(Boolean),                                                                 // 21
    forbidClientAccountCreation: Match.Optional(Boolean),                                                          // 22
    overrideLoginErrors: Match.Optional(Boolean),                                                                  // 23
    sendVerificationEmail: Match.Optional(Boolean),                                                                // 24
                                                                                                                   // 25
    // Appearance                                                                                                  // 26
    showAddRemoveServices: Match.Optional(Boolean),                                                                // 27
    showForgotPasswordLink: Match.Optional(Boolean),                                                               // 28
    showLabels: Match.Optional(Boolean),                                                                           // 29
    showPlaceholders: Match.Optional(Boolean),                                                                     // 30
                                                                                                                   // 31
    // Client-side Validation                                                                                      // 32
    continuousValidation: Match.Optional(Boolean),                                                                 // 33
    negativeFeedback: Match.Optional(Boolean),                                                                     // 34
    negativeValidation: Match.Optional(Boolean),                                                                   // 35
    positiveValidation: Match.Optional(Boolean),                                                                   // 36
    positiveFeedback: Match.Optional(Boolean),                                                                     // 37
                                                                                                                   // 38
    // Privacy Policy and Terms of Use                                                                             // 39
    privacyUrl: Match.Optional(String),                                                                            // 40
    termsUrl: Match.Optional(String),                                                                              // 41
                                                                                                                   // 42
    // Redirects                                                                                                   // 43
    homeRoutePath: Match.Optional(String),                                                                         // 44
    redirectTimeout: Match.Optional(Number),                                                                       // 45
                                                                                                                   // 46
    // Texts                                                                                                       // 47
    buttonText: Match.Optional(STATE_PAT),                                                                         // 48
    title: Match.Optional(STATE_PAT),                                                                              // 49
};                                                                                                                 // 50
                                                                                                                   // 51
                                                                                                                   // 52
FIELD_SUB_PAT = {                                                                                                  // 53
    default: Match.Optional(String),                                                                               // 54
    changePwd: Match.Optional(String),                                                                             // 55
    enrollAccount: Match.Optional(String),                                                                         // 56
    forgotPwd: Match.Optional(String),                                                                             // 57
    resetPwd: Match.Optional(String),                                                                              // 58
    signIn: Match.Optional(String),                                                                                // 59
    signUp: Match.Optional(String),                                                                                // 60
};                                                                                                                 // 61
                                                                                                                   // 62
                                                                                                                   // 63
// Field pattern                                                                                                   // 64
FIELD_PAT = {                                                                                                      // 65
    _id: String,                                                                                                   // 66
    type: String,                                                                                                  // 67
    required: Match.Optional(Boolean),                                                                             // 68
    displayName: Match.Optional(Match.OneOf(String, FIELD_SUB_PAT)),                                               // 69
    placeholder: Match.Optional(Match.OneOf(String, FIELD_SUB_PAT)),                                               // 70
    minLength: Match.Optional(Match.Integer),                                                                      // 71
    maxLength: Match.Optional(Match.Integer),                                                                      // 72
    re: Match.Optional(RegExp),                                                                                    // 73
    func: Match.Optional(Match.Where(_.isFunction)),                                                               // 74
    errStr: Match.Optional(String),                                                                                // 75
                                                                                                                   // 76
    // Client-side Validation                                                                                      // 77
    continuousValidation: Match.Optional(Boolean),                                                                 // 78
    negativeFeedback: Match.Optional(Boolean),                                                                     // 79
    negativeValidation: Match.Optional(Boolean),                                                                   // 80
    positiveValidation: Match.Optional(Boolean),                                                                   // 81
    positiveFeedback: Match.Optional(Boolean),                                                                     // 82
                                                                                                                   // 83
    // Transforms                                                                                                  // 84
    trim: Match.Optional(Boolean),                                                                                 // 85
    lowercase: Match.Optional(Boolean),                                                                            // 86
    uppercase: Match.Optional(Boolean),                                                                            // 87
};                                                                                                                 // 88
                                                                                                                   // 89
// Route configuration pattern to be checked with check                                                            // 90
var ROUTE_PAT = {                                                                                                  // 91
    name: Match.Optional(String),                                                                                  // 92
    path: Match.Optional(String),                                                                                  // 93
    template: Match.Optional(String),                                                                              // 94
    layoutTemplate: Match.Optional(String),                                                                        // 95
    redirect: Match.Optional(Match.OneOf(String, Match.Where(_.isFunction))),                                      // 96
};                                                                                                                 // 97
                                                                                                                   // 98
                                                                                                                   // 99
// ---------------------------------------------------------------------------------                               // 100
                                                                                                                   // 101
// AccountsTemplates object                                                                                        // 102
                                                                                                                   // 103
// ---------------------------------------------------------------------------------                               // 104
                                                                                                                   // 105
                                                                                                                   // 106
                                                                                                                   // 107
// -------------------                                                                                             // 108
// Client/Server stuff                                                                                             // 109
// -------------------                                                                                             // 110
                                                                                                                   // 111
// Constructor                                                                                                     // 112
AT = function() {                                                                                                  // 113
                                                                                                                   // 114
};                                                                                                                 // 115
                                                                                                                   // 116
                                                                                                                   // 117
                                                                                                                   // 118
                                                                                                                   // 119
/*                                                                                                                 // 120
    Each field object is represented by the following properties:                                                  // 121
        _id:         String   (required)  // A unique field"s id / name                                            // 122
        type:        String   (required)  // Displayed input type                                                  // 123
        required:    Boolean  (optional)  // Specifies Whether to fail or not when field is left empty             // 124
        displayName: String   (optional)  // The field"s name to be displayed as a label above the input element   // 125
        placeholder: String   (optional)  // The placeholder text to be displayed inside the input element         // 126
        minLength:   Integer  (optional)  // Possibly specifies the minimum allowed length                         // 127
        maxLength:   Integer  (optional)  // Possibly specifies the maximum allowed length                         // 128
        re:          RegExp   (optional)  // Regular expression for validation                                     // 129
        func:        Function (optional)  // Custom function for validation                                        // 130
        errStr:      String   (optional)  // Error message to be displayed in case re validation fails             // 131
*/                                                                                                                 // 132
                                                                                                                   // 133
                                                                                                                   // 134
                                                                                                                   // 135
/*                                                                                                                 // 136
    Routes configuration can be done by calling AccountsTemplates.configureRoute with the route name and the       // 137
    following options in a separate object. E.g. AccountsTemplates.configureRoute("gingIn", option);               // 138
        name:           String (optional). A unique route"s name to be passed to iron-router                       // 139
        path:           String (optional). A unique route"s path to be passed to iron-router                       // 140
        template:       String (optional). The name of the template to be rendered                                 // 141
        layoutTemplate: String (optional). The name of the layout to be used                                       // 142
        redirect:       String (optional). The name of the route (or its path) where to redirect after form submit // 143
*/                                                                                                                 // 144
                                                                                                                   // 145
                                                                                                                   // 146
// Allowed routes along with theirs default configuration values                                                   // 147
AT.prototype.ROUTE_DEFAULT = {                                                                                     // 148
    changePwd:     { name: "atChangePwd",     path: "/change-password"},                                           // 149
    enrollAccount: { name: "atEnrollAccount", path: "/enroll-account"},                                            // 150
    forgotPwd:     { name: "atForgotPwd",     path: "/forgot-password"},                                           // 151
    resetPwd:      { name: "atResetPwd",      path: "/reset-password"},                                            // 152
    signIn:        { name: "atSignIn",        path: "/sign-in"},                                                   // 153
    signUp:        { name: "atSignUp",        path: "/sign-up"},                                                   // 154
    verifyEmail:   { name: "atVerifyEmail",   path: "/verify-email"},                                              // 155
};                                                                                                                 // 156
                                                                                                                   // 157
                                                                                                                   // 158
                                                                                                                   // 159
// Allowed input types                                                                                             // 160
AT.prototype.INPUT_TYPES = [                                                                                       // 161
    "password",                                                                                                    // 162
    "email",                                                                                                       // 163
    "text",                                                                                                        // 164
    "tel",                                                                                                         // 165
    "url",                                                                                                         // 166
];                                                                                                                 // 167
                                                                                                                   // 168
// Current configuration values                                                                                    // 169
AT.prototype.options = {                                                                                           // 170
    // Appearance                                                                                                  // 171
    showAddRemoveServices: false,                                                                                  // 172
    showForgotPasswordLink: false,                                                                                 // 173
    showLabels: true,                                                                                              // 174
    showPlaceholders: true,                                                                                        // 175
                                                                                                                   // 176
    // Behaviour                                                                                                   // 177
    confirmPassword: true,                                                                                         // 178
    enablePasswordChange: false,                                                                                   // 179
    forbidClientAccountCreation: false,                                                                            // 180
    overrideLoginErrors: true,                                                                                     // 181
    sendVerificationEmail: false,                                                                                  // 182
                                                                                                                   // 183
    // Client-side Validation                                                                                      // 184
    //continuousValidation: false,                                                                                 // 185
    //negativeFeedback: false,                                                                                     // 186
    //negativeValidation: false,                                                                                   // 187
    //positiveValidation: true,                                                                                    // 188
    //positiveFeedback: true,                                                                                      // 189
                                                                                                                   // 190
    // Privacy Policy and Terms of Use                                                                             // 191
    privacyUrl: undefined,                                                                                         // 192
    termsUrl: undefined,                                                                                           // 193
                                                                                                                   // 194
    // Redirects                                                                                                   // 195
    homeRoutePath: "/",                                                                                            // 196
    redirectTimeout: 2000, // 2 seconds                                                                            // 197
};                                                                                                                 // 198
                                                                                                                   // 199
AT.prototype.SPECIAL_FIELDS = [                                                                                    // 200
    "current_password",                                                                                            // 201
    "new_password",                                                                                                // 202
    "new_password_again",                                                                                          // 203
    "password_again",                                                                                              // 204
    "username_and_email",                                                                                          // 205
];                                                                                                                 // 206
                                                                                                                   // 207
// SignIn / SignUp fields                                                                                          // 208
AT.prototype._fields = [{                                                                                          // 209
    _id: "email",                                                                                                  // 210
    type: "email",                                                                                                 // 211
    required: true,                                                                                                // 212
    lowercase: true,                                                                                               // 213
    trim: true,                                                                                                    // 214
}, {                                                                                                               // 215
    _id: "password",                                                                                               // 216
    type: "password",                                                                                              // 217
    required: true,                                                                                                // 218
    minLength: 6                                                                                                   // 219
}];                                                                                                                // 220
                                                                                                                   // 221
// Configured routes                                                                                               // 222
AT.prototype.routes = {};                                                                                          // 223
                                                                                                                   // 224
AT.prototype._initialized = false;                                                                                 // 225
                                                                                                                   // 226
// Input type validation                                                                                           // 227
AT.prototype._isValidInputType = function(value) {                                                                 // 228
    return _.indexOf(this.INPUT_TYPES, value) !== -1;                                                              // 229
};                                                                                                                 // 230
                                                                                                                   // 231
AT.prototype.addField = function(field) {                                                                          // 232
    // Fields can be added only before initialization                                                              // 233
    if (this._initialized)                                                                                         // 234
        throw new Error("AccountsTemplates.addField should strictly be called before AccountsTemplates.init!");    // 235
    check(field, FIELD_PAT);                                                                                       // 236
    // Checks there"s currently no field called field._id                                                          // 237
    if (_.indexOf(_.pluck(this._fields, "_id"), field._id) !== -1)                                                 // 238
        throw new Error("A field called " + field._id + " already exists!");                                       // 239
    // Validates field.type                                                                                        // 240
    if (!this._isValidInputType(field.type))                                                                       // 241
        throw new Error("field.type is not valid!");                                                               // 242
    // Checks field.minLength is strictly positive                                                                 // 243
    if (typeof field.minLength !== "undefined" && field.minLength <= 0)                                            // 244
        throw new Error("field.minLength should be greater than zero!");                                           // 245
    // Checks field.maxLength is strictly positive                                                                 // 246
    if (typeof field.maxLength !== "undefined" && field.maxLength <= 0)                                            // 247
        throw new Error("field.maxLength should be greater than zero!");                                           // 248
    // Checks field.maxLength is greater than field.minLength                                                      // 249
    if (typeof field.minLength !== "undefined" && typeof field.minLength !== "undefined" && field.maxLength < field.minLength)
        throw new Error("field.maxLength should be greater than field.maxLength!");                                // 251
                                                                                                                   // 252
    if (!(Meteor.isServer && _.contains(this.SPECIAL_FIELDS, field._id)))                                          // 253
        this._fields.push(field);                                                                                  // 254
    return this._fields;                                                                                           // 255
};                                                                                                                 // 256
                                                                                                                   // 257
AT.prototype.addFields = function(fields) {                                                                        // 258
    var ok;                                                                                                        // 259
    try { // don"t bother with `typeof` - just access `length` and `catch`                                         // 260
        ok = fields.length > 0 && "0" in Object(fields);                                                           // 261
    } catch (e) {                                                                                                  // 262
        throw new Error("field argument should be an array of valid field objects!");                              // 263
    }                                                                                                              // 264
    if (ok) {                                                                                                      // 265
        _.map(fields, function(field){                                                                             // 266
            this.addField(field);                                                                                  // 267
        }, this);                                                                                                  // 268
    } else                                                                                                         // 269
        throw new Error("field argument should be an array of valid field objects!");                              // 270
    return this._fields;                                                                                           // 271
};                                                                                                                 // 272
                                                                                                                   // 273
AT.prototype.configure = function(config) {                                                                        // 274
    check(config, CONFIG_PAT);                                                                                     // 275
    // Configuration options can be set only before initialization                                                 // 276
    if (this._initialized)                                                                                         // 277
        throw new Error("Configuration options must be set before AccountsTemplates.init!");                       // 278
                                                                                                                   // 279
    // Updates the current configuration                                                                           // 280
    var normal_options = _.omit(config, "title", "buttonText");                                                    // 281
    this.options = _.defaults(normal_options, this.options);                                                       // 282
                                                                                                                   // 283
    if (Meteor.isClient){                                                                                          // 284
        if (config.buttonText)                                                                                     // 285
            // Updates the current buttonTexts object                                                              // 286
            this.buttonText = _.defaults(config.buttonText, this.buttonText);                                      // 287
        if (config.title)                                                                                          // 288
            // Updates the current title object                                                                    // 289
            this.title = _.defaults(config.title, this.title);                                                     // 290
    }                                                                                                              // 291
};                                                                                                                 // 292
                                                                                                                   // 293
AT.prototype.configureRoute = function(route, options) {                                                           // 294
    check(route, String);                                                                                          // 295
    check(options, Match.OneOf(undefined, ROUTE_PAT));                                                             // 296
    // Route Configuration can be done only before initialization                                                  // 297
    if (this._initialized)                                                                                         // 298
        throw new Error("Route Configuration can be done only before AccountsTemplates.init!");                    // 299
    // Only allowed routes can be configured                                                                       // 300
    if (!(route in this.ROUTE_DEFAULT))                                                                            // 301
        throw new Error("Unknown Route!");                                                                         // 302
                                                                                                                   // 303
    // Possibly adds a initial / to the provided path                                                              // 304
    if (options && options.path && options.path[0] !== "/"){                                                       // 305
        options = _.clone(options);                                                                                // 306
        options.path = "/" + options.path;                                                                         // 307
    }                                                                                                              // 308
    // Updates the current configuration                                                                           // 309
    options = _.defaults(options || {}, this.ROUTE_DEFAULT[route]);                                                // 310
    this.routes[route] = options;                                                                                  // 311
};                                                                                                                 // 312
                                                                                                                   // 313
AT.prototype.hasField = function(fieldId) {                                                                        // 314
    return !!this.getField(fieldId);                                                                               // 315
};                                                                                                                 // 316
                                                                                                                   // 317
AT.prototype.getField = function(fieldId) {                                                                        // 318
    var field = _.filter(this._fields, function(field){                                                            // 319
        return field._id == fieldId;                                                                               // 320
    });                                                                                                            // 321
    return (field.length === 1) ? field[0] : undefined;                                                            // 322
};                                                                                                                 // 323
                                                                                                                   // 324
AT.prototype.getFields = function() {                                                                              // 325
    return this._fields;                                                                                           // 326
};                                                                                                                 // 327
                                                                                                                   // 328
AT.prototype.getFieldIds = function() {                                                                            // 329
    return _.pluck(this._fields, "_id");                                                                           // 330
};                                                                                                                 // 331
                                                                                                                   // 332
AT.prototype.getRouteName = function(route) {                                                                      // 333
    if (route in this.routes)                                                                                      // 334
        return this.routes[route].name;                                                                            // 335
    return null;                                                                                                   // 336
};                                                                                                                 // 337
                                                                                                                   // 338
AT.prototype.getRoutePath = function(route) {                                                                      // 339
    if (route in this.routes)                                                                                      // 340
        return this.routes[route].path;                                                                            // 341
    return "#";                                                                                                    // 342
};                                                                                                                 // 343
                                                                                                                   // 344
AT.prototype.oauthServices = function(){                                                                           // 345
    // Extracts names of available services                                                                        // 346
    var names = (Accounts.oauth && Accounts.loginServicesConfigured() && Accounts.oauth.serviceNames()) || [];     // 347
                                                                                                                   // 348
    // Extracts names of configured services                                                                       // 349
    var configuredServices = [];                                                                                   // 350
    if (Accounts.loginServiceConfiguration)                                                                        // 351
        configuredServices = _.pluck(Accounts.loginServiceConfiguration.find().fetch(), "service");                // 352
                                                                                                                   // 353
    // Builds a list of objects containing service name as _id and its configuration status                        // 354
    var services = _.map(names, function(name){                                                                    // 355
        return {                                                                                                   // 356
            _id : name,                                                                                            // 357
            configured: _.contains(configuredServices, name),                                                      // 358
        };                                                                                                         // 359
    });                                                                                                            // 360
                                                                                                                   // 361
    // Checks whether there is a UI to configure services...                                                       // 362
    // XXX: this only works with the accounts-ui package                                                           // 363
    var showUnconfigured = typeof Accounts._loginButtonsSession !== "undefined";                                   // 364
                                                                                                                   // 365
    // Filters out unconfigured services in case they"re not to be displayed                                       // 366
    if (!showUnconfigured){                                                                                        // 367
        services = _.filter(services, function(service){                                                           // 368
            return service.configured;                                                                             // 369
        });                                                                                                        // 370
    }                                                                                                              // 371
                                                                                                                   // 372
    // Sorts services by name                                                                                      // 373
    services = _.sortBy(services, function(service){                                                               // 374
        return service._id;                                                                                        // 375
    });                                                                                                            // 376
                                                                                                                   // 377
    return services;                                                                                               // 378
};                                                                                                                 // 379
                                                                                                                   // 380
AT.prototype.validateField = function(fieldId, value, strict) {                                                    // 381
    check(fieldId, String);                                                                                        // 382
    check(value, Match.OneOf(undefined, String));                                                                  // 383
    var field = this.getField(fieldId);                                                                            // 384
    if (!field)                                                                                                    // 385
        return null;                                                                                               // 386
    if (!value){                                                                                                   // 387
        if (strict){                                                                                               // 388
            if (field.required)                                                                                    // 389
                return "Required Field";                                                                           // 390
            else                                                                                                   // 391
                return false;                                                                                      // 392
        }                                                                                                          // 393
        else                                                                                                       // 394
            return null;                                                                                           // 395
    }                                                                                                              // 396
    var valueLength = value.length;                                                                                // 397
    var minLength = field.minLength;                                                                               // 398
    if (minLength && valueLength < minLength)                                                                      // 399
        return "Minimum Required Length:" + minLength;                                                             // 400
    var maxLength = field.maxLength;                                                                               // 401
    if (maxLength && valueLength > maxLength)                                                                      // 402
        return "Maximum Allowed Length:" + maxLength;                                                              // 403
    if (field.re && valueLength && !value.match(field.re))                                                         // 404
        return field.errStr;                                                                                       // 405
    if (field.func && valueLength && !field.func(value))                                                           // 406
        return field.errStr;                                                                                       // 407
    return false;                                                                                                  // 408
};                                                                                                                 // 409
                                                                                                                   // 410
AT.prototype.removeField = function(fieldId) {                                                                     // 411
    // Fields can be removed only before initialization                                                            // 412
    if (this._initialized)                                                                                         // 413
        throw new Error("AccountsTemplates.removeField should strictly be called before AccountsTemplates.init!"); // 414
    // Tries to look up the field with given _id                                                                   // 415
    var index = _.indexOf(_.pluck(this._fields, "_id"), fieldId);                                                  // 416
    if (index !== -1)                                                                                              // 417
        this._fields.splice(index, 1);                                                                             // 418
    else                                                                                                           // 419
        if (!(Meteor.isServer && _.contains(this.SPECIAL_FIELDS, fieldId)))                                        // 420
            throw new Error("A field called " + fieldId + " does not exist!");                                     // 421
};                                                                                                                 // 422
                                                                                                                   // 423
AT.prototype.setupRoutes = function() {                                                                            // 424
    if (Meteor.isServer){                                                                                          // 425
        // Possibly prints a warning in case showForgotPasswordLink is set to true but the route is not configured // 426
        if (AccountsTemplates.options.showForgotPasswordLink && !("forgotPwd" in  AccountsTemplates.routes))       // 427
            console.warn("AccountsTemplates - WARNING: showForgotPasswordLink set to true, but forgotPwd route is not configured!");
        // Configures "reset password" email link                                                                  // 429
        if ("resetPwd" in AccountsTemplates.routes){                                                               // 430
            Accounts.urls.resetPassword = function(token){                                                         // 431
                var path = AccountsTemplates.routes["resetPwd"].path;                                              // 432
                return Meteor.absoluteUrl(path + "/" + token);                                                     // 433
            };                                                                                                     // 434
        }                                                                                                          // 435
        // Configures "enroll account" email link                                                                  // 436
        if ("enrollAccount" in AccountsTemplates.routes){                                                          // 437
            Accounts.urls.enrollAccount = function(token){                                                         // 438
                var path = AccountsTemplates.routes["enrollAccount"].path;                                         // 439
                return Meteor.absoluteUrl(path + "/" + token);                                                     // 440
            };                                                                                                     // 441
        }                                                                                                          // 442
        // Configures "verify email" email link                                                                    // 443
        if ("verifyEmail" in AccountsTemplates.routes){                                                            // 444
            Accounts.urls.verifyEmail = function(token){                                                           // 445
                var path = AccountsTemplates.routes["verifyEmail"].path;                                           // 446
                return Meteor.absoluteUrl(path + "/" + token);                                                     // 447
            };                                                                                                     // 448
        }                                                                                                          // 449
    }                                                                                                              // 450
                                                                                                                   // 451
    Router.map(function() {                                                                                        // 452
        _.each(AccountsTemplates.routes, function(options, route){                                                 // 453
            if (route === "changePwd" && !AccountsTemplates.options.enablePasswordChange)                          // 454
                throw new Error("changePwd route configured but enablePasswordChange set to false!");              // 455
            if (route === "forgotPwd" && !AccountsTemplates.options.showForgotPasswordLink)                        // 456
                throw new Error("forgotPwd route configured but showForgotPasswordLink set to false!");            // 457
            if (route === "signUp" && AccountsTemplates.options.forbidClientAccountCreation)                       // 458
                throw new Error("signUp route configured but forbidClientAccountCreation set to true!");           // 459
            // Possibly prints a warning in case the MAIL_URL environment variable was not set                     // 460
            if (Meteor.isServer && route === "forgotPwd" && (!process.env.MAIL_URL || ! Package["email"])){        // 461
                console.warn("AccountsTemplates - WARNING: showForgotPasswordLink set to true, but MAIL_URL is not configured!");
            }                                                                                                      // 463
                                                                                                                   // 464
            var name = options.name; // Default provided...                                                        // 465
            var path = options.path; // Default provided...                                                        // 466
            var template = options.template || "fullPageAtForm";                                                   // 467
            var layoutTemplate = options.layoutTemplate || Router.options.layoutTemplate;                          // 468
                                                                                                                   // 469
            // Possibly adds token parameter                                                                       // 470
            if (_.contains(["enrollAccount", "resetPwd", "verifyEmail"], route)){                                  // 471
                path += "/:paramToken";                                                                            // 472
                if (route === "verifyEmail"){                                                                      // 473
                    this.route(name, {                                                                             // 474
                        path: path,                                                                                // 475
                        template: template,                                                                        // 476
                        layoutTemplate: layoutTemplate,                                                            // 477
                        onAfterAction: function(pause) {                                                           // 478
                            AccountsTemplates.setDisabled(true);                                                   // 479
                            var token = this.params.paramToken;                                                    // 480
                            Accounts.verifyEmail(token, function(error){                                           // 481
                                AccountsTemplates.setDisabled(false);                                              // 482
                                AccountsTemplates.submitCallback(error, undefined, function(){                     // 483
                                    AccountsTemplates.state.form.set("result", "info.emailVerified");              // 484
                                });                                                                                // 485
                            });                                                                                    // 486
                        },                                                                                         // 487
                        onBeforeAction: function(pause) {                                                          // 488
                            AccountsTemplates.setState(route);                                                     // 489
                        },                                                                                         // 490
                        onStop: function() {                                                                       // 491
                            AccountsTemplates.clearState();                                                        // 492
                        }                                                                                          // 493
                    });                                                                                            // 494
                }                                                                                                  // 495
                else                                                                                               // 496
                    this.route(name, {                                                                             // 497
                        path: path,                                                                                // 498
                        template: template,                                                                        // 499
                        layoutTemplate: layoutTemplate,                                                            // 500
                        onBeforeAction: function(pause) {                                                          // 501
                            AccountsTemplates.setState(route);                                                     // 502
                        },                                                                                         // 503
                        onRun: function() {                                                                        // 504
                            AccountsTemplates.paramToken = this.params.paramToken;                                 // 505
                        },                                                                                         // 506
                        onStop: function() {                                                                       // 507
                            AccountsTemplates.clearState();                                                        // 508
                            AccountsTemplates.paramToken = null;                                                   // 509
                        }                                                                                          // 510
                    });                                                                                            // 511
            }                                                                                                      // 512
            else                                                                                                   // 513
                this.route(name, {                                                                                 // 514
                    path: path,                                                                                    // 515
                    template: template,                                                                            // 516
                    layoutTemplate: layoutTemplate,                                                                // 517
                    onBeforeAction: function(pause) {                                                              // 518
                        AccountsTemplates.setState(route);                                                         // 519
                    },                                                                                             // 520
                    onStop: function() {                                                                           // 521
                        AccountsTemplates.clearState();                                                            // 522
                    }                                                                                              // 523
                });                                                                                                // 524
        }, this);                                                                                                  // 525
    });                                                                                                            // 526
};                                                                                                                 // 527
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}).call(this);






(function () {

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                 //
// packages/splendido:accounts-templates-core/lib/server.js                                                        //
//                                                                                                                 //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                   //
// Initialization                                                                                                  // 1
AT.prototype.init = function() {                                                                                   // 2
    if (this._initialized)                                                                                         // 3
        return;                                                                                                    // 4
                                                                                                                   // 5
    // Checks there is at least one account service installed                                                      // 6
    if (!Package["accounts-password"] && (this.oauthServices().length === 0))                                      // 7
        throw Error("AccountsTemplates: You must add at least one account service!");                              // 8
                                                                                                                   // 9
    // A password field is strictly required                                                                       // 10
    var password = this.getField("password");                                                                      // 11
    if (!password)                                                                                                 // 12
        throw Error("A password field is strictly required!");                                                     // 13
    if (password.type !== "password")                                                                              // 14
        throw Error("The type of password field should be password!");                                             // 15
                                                                                                                   // 16
    // Then we can have "username" or "email" or even both of them                                                 // 17
    // but at least one of the two is strictly required                                                            // 18
    var username = this.getField("username");                                                                      // 19
    var email = this.getField("email");                                                                            // 20
    if (!username && !email)                                                                                       // 21
        throw Error("At least one field out of username and email is strictly required!");                         // 22
    if (username && !username.required)                                                                            // 23
        throw Error("The username field should be required!");                                                     // 24
    if (email){                                                                                                    // 25
        if (email.type !== "email")                                                                                // 26
            throw Error("The type of email field should be email!");                                               // 27
        if (username){                                                                                             // 28
            // username and email                                                                                  // 29
            if (username.type !== "text")                                                                          // 30
                throw Error("The type of username field should be text when email field is present!");             // 31
        }else{                                                                                                     // 32
            // email only                                                                                          // 33
            if (!email.required)                                                                                   // 34
                throw Error("The email field should be required when username is not present!");                   // 35
        }                                                                                                          // 36
    }                                                                                                              // 37
    else{                                                                                                          // 38
        // username only                                                                                           // 39
        if (username.type !== "text" && username.type !== "tel")                                                   // 40
            throw Error("The type of username field should be text or tel!");                                      // 41
    }                                                                                                              // 42
                                                                                                                   // 43
    // Possibly publish more user data in order to be able to show add/remove                                      // 44
    // buttons for 3rd-party services                                                                              // 45
    if (this.options.showAddRemoveServices){                                                                       // 46
        // Publish additional current user info to get the list of registered services                             // 47
        // XXX TODO:                                                                                               // 48
        // ...adds only user.services.*.id                                                                         // 49
        Meteor.publish("userRegisteredServices", function() {                                                      // 50
            var userId = this.userId;                                                                              // 51
            return Meteor.users.find(userId, {fields: {services: 1}});                                             // 52
            /*                                                                                                     // 53
            if (userId){                                                                                           // 54
                var user = Meteor.users.findOne(userId);                                                           // 55
                var services_id = _.chain(user.services)                                                           // 56
                    .keys()                                                                                        // 57
                    .reject(function(service){return service === "resume";})                                       // 58
                    .map(function(service){return "services." + service + ".id";})                                 // 59
                    .value();                                                                                      // 60
                var projection = {};                                                                               // 61
                _.each(services_id, function(key){projection[key] = 1;});                                          // 62
                return Meteor.users.find(userId, {fields: projection});                                            // 63
            }                                                                                                      // 64
            */                                                                                                     // 65
        });                                                                                                        // 66
    }                                                                                                              // 67
                                                                                                                   // 68
    // Security stuff                                                                                              // 69
    if (this.options.overrideLoginErrors){                                                                         // 70
        Accounts.validateLoginAttempt(function(attempt){                                                           // 71
            if (attempt.error){                                                                                    // 72
                var reason = attempt.error.reason;                                                                 // 73
                if (reason === "User not found" || reason === "Incorrect password")                                // 74
                    throw new Meteor.Error(403, "Login forbidden");                                                // 75
            }                                                                                                      // 76
            return attempt.allowed;                                                                                // 77
        });                                                                                                        // 78
    }                                                                                                              // 79
                                                                                                                   // 80
    // ------------                                                                                                // 81
    // Server-Side Routes Definition                                                                               // 82
    //                                                                                                             // 83
    //   this allows for server-side iron-router usage, like, e.g.                                                 // 84
    //   Router.map(function(){                                                                                    // 85
    //       this.route("fullPageSigninForm", {                                                                    // 86
    //           path: "*",                                                                                        // 87
    //           where: "server"                                                                                   // 88
    //           action: function() {                                                                              // 89
    //               this.response.statusCode = 404;                                                               // 90
    //               return this.response.end(Handlebars.templates["404"]());                                      // 91
    //           }                                                                                                 // 92
    //       });                                                                                                   // 93
    //   })                                                                                                        // 94
    // ------------                                                                                                // 95
    AccountsTemplates.setupRoutes();                                                                               // 96
                                                                                                                   // 97
    // Marks AccountsTemplates as initialized                                                                      // 98
    this._initialized = true;                                                                                      // 99
};                                                                                                                 // 100
                                                                                                                   // 101
AccountsTemplates = new AT();                                                                                      // 102
                                                                                                                   // 103
                                                                                                                   // 104
// Client side account creation is disabled by default:                                                            // 105
// the methos ATCreateUserServer is used instead!                                                                  // 106
// to actually disable client side account creation use:                                                           // 107
//                                                                                                                 // 108
//    AccountsTemplates.config({                                                                                   // 109
//        forbidClientAccountCreation: true                                                                        // 110
//    });                                                                                                          // 111
Accounts.config({                                                                                                  // 112
    forbidClientAccountCreation: true                                                                              // 113
});                                                                                                                // 114
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}).call(this);






(function () {

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                 //
// packages/splendido:accounts-templates-core/lib/methods.js                                                       //
//                                                                                                                 //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                   //
                                                                                                                   // 1
Meteor.methods({                                                                                                   // 2
    ATRemoveService: function(service_name){                                                                       // 3
        var userId = this.userId;                                                                                  // 4
        if (userId){                                                                                               // 5
            var user = Meteor.users.findOne(userId);                                                               // 6
            var numServices = _.keys(user.services).length; // including "resume"                                  // 7
            if (numServices === 2)                                                                                 // 8
                throw new Meteor.Error(403, "Cannot remove the only active service!", {});                         // 9
            var unset = {};                                                                                        // 10
            unset["services." + service_name] = "";                                                                // 11
            Meteor.users.update(userId, {$unset: unset});                                                          // 12
        }                                                                                                          // 13
    },                                                                                                             // 14
});                                                                                                                // 15
                                                                                                                   // 16
                                                                                                                   // 17
if (Meteor.isServer) {                                                                                             // 18
    Meteor.methods({                                                                                               // 19
        ATCreateUserServer: function(options){                                                                     // 20
            if (AccountsTemplates.options.forbidClientAccountCreation)                                             // 21
                throw new Meteor.Error(403, "Client side accounts creation is disabled!!!");                       // 22
            // createUser() does more checking.                                                                    // 23
            check(options, Object);                                                                                // 24
            var allFieldIds = AccountsTemplates.getFieldIds();                                                     // 25
            // Picks-up whitelisted fields for profile                                                             // 26
            var profile = options.profile;                                                                         // 27
            profile = _.pick(profile, allFieldIds);                                                                // 28
            profile = _.omit(profile, "username", "email", "password");                                            // 29
            // Validates fields" value                                                                             // 30
            var signupInfo = _.clone(profile);                                                                     // 31
            if (options.username)                                                                                  // 32
                signupInfo.username = options.username;                                                            // 33
            if (options.email)                                                                                     // 34
                signupInfo.email = options.email;                                                                  // 35
            if (options.password)                                                                                  // 36
                signupInfo.password = options.password;                                                            // 37
            var validationErrors = {};                                                                             // 38
            var someError = false;                                                                                 // 39
                                                                                                                   // 40
            // Validates fields values                                                                             // 41
            _.each(allFieldIds, function(fieldId){                                                                 // 42
                var value = signupInfo[fieldId];                                                                   // 43
                if (fieldId === "password"){                                                                       // 44
                    // Can"t Pick-up password here                                                                 // 45
                    // NOTE: at this stage the password is already encripted,                                      // 46
                    //       so there is no way to validate it!!!                                                  // 47
                    check(value, Object);                                                                          // 48
                    return;                                                                                        // 49
                }                                                                                                  // 50
                var validationErr = AccountsTemplates.validateField(fieldId, value, "strict");                     // 51
                if (validationErr) {                                                                               // 52
                    validationErrors[fieldId] = validationErr;                                                     // 53
                    someError = true;                                                                              // 54
                }                                                                                                  // 55
            });                                                                                                    // 56
            if (someError)                                                                                         // 57
                throw new Meteor.Error(403, "Validation Errors", validationErrors);                                // 58
                                                                                                                   // 59
            // Possibly removes the profile field                                                                  // 60
            if (_.isEmpty(options.profile))                                                                        // 61
                delete options.profile;                                                                            // 62
                                                                                                                   // 63
            // Create user. result contains id and token.                                                          // 64
            var userId = Accounts.createUser(options);                                                             // 65
            // safety belt. createUser is supposed to throw on error. send 500 error                               // 66
            // instead of sending a verification email with empty userid.                                          // 67
            if (! userId)                                                                                          // 68
                throw new Error("createUser failed to insert new user");                                           // 69
                                                                                                                   // 70
            // If `Accounts._options.sendVerificationEmail` is set, register                                       // 71
            // a token to verify the user"s primary email, and send it to                                          // 72
            // that address.                                                                                       // 73
            if (options.email && AccountsTemplates.options.sendVerificationEmail)                                  // 74
                Accounts.sendVerificationEmail(userId, options.email);                                             // 75
                                                                                                                   // 76
            // client gets logged in as the new user afterwards.                                                   // 77
            // return {userId: userId};                                                                            // 78
        },                                                                                                         // 79
    });                                                                                                            // 80
}                                                                                                                  // 81
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}).call(this);


/* Exports */
if (typeof Package === 'undefined') Package = {};
Package['splendido:accounts-templates-core'] = {
  AccountsTemplates: AccountsTemplates
};

})();
