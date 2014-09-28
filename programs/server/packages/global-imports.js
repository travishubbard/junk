/* Imports for global scope */

Accounts = Package['accounts-base'].Accounts;
Spiderable = Package.spiderable.Spiderable;
Email = Package.email.Email;
RouteController = Package['iron:router'].RouteController;
Route = Package['iron:router'].Route;
Router = Package['iron:router'].Router;
FastRender = Package['meteorhacks:fast-render'].FastRender;
SubsManager = Package['meteorhacks:subs-manager'].SubsManager;
SimpleSchema = Package['aldeed:simple-schema'].SimpleSchema;
MongoObject = Package['aldeed:simple-schema'].MongoObject;
moment = Package['mrt:moment'].moment;
MailChimpAPI = Package['mrt:mailchimp'].MailChimpAPI;
MailChimp = Package['mrt:mailchimp'].MailChimp;
MailChimpOptions = Package['mrt:mailchimp'].MailChimpOptions;
Handlebars = Package.ui.Handlebars;
OriginalHandlebars = Package['cmather:handlebars-server'].OriginalHandlebars;
juice = Package['sacha:juice'].juice;
SyncedCron = Package['percolatestudio:synced-cron'].SyncedCron;
preloadSubscriptions = Package['telescope-base'].preloadSubscriptions;
adminNav = Package['telescope-search'].adminNav;
Categories = Package['telescope-tags'].Categories;
addToPostSchema = Package['telescope-base'].addToPostSchema;
primaryNav = Package['telescope-base'].primaryNav;
postModules = Package['telescope-base'].postModules;
viewNav = Package['telescope-base'].viewNav;
addToCommentsSchema = Package['telescope-base'].addToCommentsSchema;
addToSettingsSchema = Package['telescope-base'].addToSettingsSchema;
secondaryNav = Package['telescope-base'].secondaryNav;
viewParameters = Package['telescope-search'].viewParameters;
footerModules = Package['telescope-base'].footerModules;
heroModules = Package['telescope-base'].heroModules;
postHeading = Package['telescope-base'].postHeading;
postMeta = Package['telescope-base'].postMeta;
modulePositions = Package['telescope-base'].modulePositions;
postSubmitRenderedCallbacks = Package['telescope-base'].postSubmitRenderedCallbacks;
postSubmitClientCallbacks = Package['telescope-base'].postSubmitClientCallbacks;
postSubmitMethodCallbacks = Package['telescope-notifications'].postSubmitMethodCallbacks;
postAfterSubmitMethodCallbacks = Package['telescope-base'].postAfterSubmitMethodCallbacks;
postEditRenderedCallbacks = Package['telescope-base'].postEditRenderedCallbacks;
postEditClientCallbacks = Package['telescope-base'].postEditClientCallbacks;
postEditMethodCallbacks = Package['telescope-base'].postEditMethodCallbacks;
postAfterEditMethodCallbacks = Package['telescope-base'].postAfterEditMethodCallbacks;
commentSubmitRenderedCallbacks = Package['telescope-base'].commentSubmitRenderedCallbacks;
commentSubmitClientCallbacks = Package['telescope-base'].commentSubmitClientCallbacks;
commentSubmitMethodCallbacks = Package['telescope-base'].commentSubmitMethodCallbacks;
commentAfterSubmitMethodCallbacks = Package['telescope-base'].commentAfterSubmitMethodCallbacks;
commentEditRenderedCallbacks = Package['telescope-base'].commentEditRenderedCallbacks;
commentEditClientCallbacks = Package['telescope-base'].commentEditClientCallbacks;
commentEditMethodCallbacks = Package['telescope-base'].commentEditMethodCallbacks;
commentAfterEditMethodCallbacks = Package['telescope-base'].commentAfterEditMethodCallbacks;
getTemplate = Package['telescope-base'].getTemplate;
templates = Package['telescope-base'].templates;
themeSettings = Package['telescope-base'].themeSettings;
deepExtend = Package['telescope-lib'].deepExtend;
camelToDash = Package['telescope-lib'].camelToDash;
dashToCamel = Package['telescope-lib'].dashToCamel;
camelCaseify = Package['telescope-lib'].camelCaseify;
getSetting = Package['telescope-lib'].getSetting;
getThemeSetting = Package['telescope-lib'].getThemeSetting;
getSiteUrl = Package['telescope-lib'].getSiteUrl;
trimWords = Package['telescope-lib'].trimWords;
can = Package['telescope-lib'].can;
serveRSS = Package['telescope-rss'].serveRSS;
serveAPI = Package['telescope-api'].serveAPI;
PostsDailyController = Package['telescope-daily'].PostsDailyController;
i18n = Package['telescope-i18n'].i18n;
buildEmailTemplate = Package['telescope-email'].buildEmailTemplate;
sendEmail = Package['telescope-email'].sendEmail;
buildAndSendEmail = Package['telescope-email'].buildAndSendEmail;
getEmailTemplate = Package['telescope-email'].getEmailTemplate;
compareVersions = Package['telescope-update-prompt'].compareVersions;
Notifications = Package['telescope-notifications'].Notifications;
createNotification = Package['telescope-notifications'].createNotification;
buildSiteNotification = Package['telescope-notifications'].buildSiteNotification;
newPostNotification = Package['telescope-notifications'].newPostNotification;
buildEmailNotification = Package['telescope-notifications'].buildEmailNotification;
getUnsubscribeLink = Package['telescope-notifications'].getUnsubscribeLink;
CollectionHooks = Package['matb33:collection-hooks'].CollectionHooks;
sanitizeHtml = Package['djedi:sanitize-html'].sanitizeHtml;
ServiceConfiguration = Package['service-configuration'].ServiceConfiguration;
Async = Package['meteorhacks:async'].Async;
CryptoJS = Package['tmeasday:crypto-base'].CryptoJS;
AccountsTemplates = Package['splendido:accounts-templates-core'].AccountsTemplates;
Meteor = Package.meteor.Meteor;
WebApp = Package.webapp.WebApp;
main = Package.webapp.main;
WebAppInternals = Package.webapp.WebAppInternals;
Log = Package.logging.Log;
Tracker = Package.deps.Tracker;
Deps = Package.deps.Deps;
DDP = Package.livedata.DDP;
DDPServer = Package.livedata.DDPServer;
MongoInternals = Package.mongo.MongoInternals;
Mongo = Package.mongo.Mongo;
Blaze = Package.ui.Blaze;
UI = Package.ui.UI;
Spacebars = Package.spacebars.Spacebars;
check = Package.check.check;
Match = Package.check.Match;
_ = Package.underscore._;
Random = Package.random.Random;
EJSON = Package.ejson.EJSON;
T9n = Package['softwarerero:accounts-t9n'].T9n;
HTML = Package.htmljs.HTML;
