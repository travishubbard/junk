(function () {

/* Imports */
var Meteor = Package.meteor.Meteor;
var Tracker = Package.tracker.Tracker;
var Deps = Package.tracker.Deps;

/* Package-scope variables */
var T9n, __coffeescriptShare;

(function () {

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/softwarerero:accounts-t9n/t9n.coffee.js                                                                    //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
__coffeescriptShare = typeof __coffeescriptShare === 'object' ? __coffeescriptShare : {}; var share = __coffeescriptShare;
        

Meteor.startup(function() {
  if (Meteor.isClient) {
    return UI.registerHelper('t9n', function(x) {
      return T9n.get(x);
    });
  }
});

T9n = (function() {
  function T9n() {}

  T9n.maps = {};

  T9n.defaultLanguage = 'en';

  T9n.language = '';

  T9n.dep = new Deps.Dependency();

  T9n.depLanguage = new Deps.Dependency();

  T9n.missingPrefix = ">";

  T9n.missingPostfix = "<";

  T9n.map = function(language, map) {
    if (!this.maps[language]) {
      this.maps[language] = {};
    }
    this.registerMap(language, '', false, map);
    return this.dep.changed();
  };

  T9n.get = function(label, markIfMissing, args) {
    var ret, _ref, _ref1;
    if (markIfMissing == null) {
      markIfMissing = true;
    }
    if (args == null) {
      args = {};
    }
    this.dep.depend();
    this.depLanguage.depend();
    if (typeof label !== 'string') {
      return '';
    }
    ret = ((_ref = this.maps[this.language]) != null ? _ref[label] : void 0) || ((_ref1 = this.maps[this.defaultLanguage]) != null ? _ref1[label] : void 0) || (markIfMissing ? this.missingPrefix + label + this.missingPostfix : label);
    if (Object.keys(args).length === 0) {
      return ret;
    } else {
      return this.replaceParams(label, args);
    }
  };

  T9n.registerMap = function(language, prefix, dot, map) {
    var key, value, _results;
    if (typeof map === 'string') {
      return this.maps[language][prefix] = map;
    } else if (typeof map === 'object') {
      if (dot) {
        prefix = prefix + '.';
      }
      _results = [];
      for (key in map) {
        value = map[key];
        _results.push(this.registerMap(language, prefix + key, true, value));
      }
      return _results;
    }
  };

  T9n.getLanguage = function() {
    this.depLanguage.depend();
    return this.language;
  };

  T9n.getLanguages = function() {
    this.dep.depend();
    return Object.keys(this.maps).sort();
  };

  T9n.setLanguage = function(language) {
    if (!this.maps[language] || this.language === language) {
      return;
    }
    this.language = language;
    return this.depLanguage.changed();
  };

  T9n.replaceParams = function(str, args) {
    var key, re, value;
    for (key in args) {
      value = args[key];
      re = new RegExp("@{" + key + "}", 'g');
      str = str.replace(re, value);
    }
    return str;
  };

  return T9n;

})();

this.T9n = T9n;

this.t9n = function(x) {
  return T9n.get(x);
};
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}).call(this);






(function () {

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/softwarerero:accounts-t9n/t9n/ar.coffee.js                                                                 //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
__coffeescriptShare = typeof __coffeescriptShare === 'object' ? __coffeescriptShare : {}; var share = __coffeescriptShare;
var ar;

ar = {
  add: "اضف",
  and: "و",
  back: "رجوع",
  changePassword: "غير كلمة السر",
  choosePassword: "اختر كلمة السر",
  clickAgree: "بفتح حسابك انت توافق على",
  configure: "تعديل",
  createAccount: "افتح حساب جديد",
  currentPassword: "كلمة السر الحالية",
  dontHaveAnAccount: "ليس عندك حساب؟",
  email: "البريد الالكترونى",
  emailAddress: "البريد الالكترونى",
  emailResetLink: "اعادة تعيين البريد الالكترونى",
  forgotPassword: "نسيت كلمة السر؟",
  ifYouAlreadyHaveAnAccount: "اذا كان عندك حساب",
  newPassword: "كلمة السر الجديدة",
  newPasswordAgain: "كلمة السر الجديدة مرة اخرى",
  optional: "اختيارى",
  OR: "او",
  password: "كلمة السر",
  passwordAgain: "كلمة السر مرة اخرى",
  privacyPolicy: "سياسة الخصوصية",
  remove: "ازالة",
  resetYourPassword: "اعادة تعيين كلمة السر",
  setPassword: "تعيين كلمة السر",
  sign: "تسجيل",
  signIn: "تسجيل الدخول",
  signin: "تسجيل الدخول",
  signOut: "تسجيل الخروج",
  signUp: "افتح حساب جديد",
  signupCode: "رمز التسجيل",
  signUpWithYourEmailAddress: "سجل ببريدك الالكترونى",
  terms: "شروط الاستخدام",
  updateYourPassword: "جدد كلمة السر",
  username: "اسم المستخدم",
  usernameOrEmail: "اسم المستخدم او البريد الالكترونى",
  "with": "مع",
  info: {
    emailSent: "تم ارسال البريد الالكترونى",
    emailVerified: "تم تأكيد البريد الالكترونى",
    passwordChanged: "تم تغيير كلمة السر",
    passwordReset: "تم اعادة تعيين كلمة السر"
  },
  error: {
    emailRequired: "البريد الالكترونى مطلوب",
    minChar: "سبعة حروف هو الحد الادنى لكلمة السر",
    pwdsDontMatch: "كلمتين السر لا يتطابقان",
    pwOneDigit: "كلمة السر يجب ان تحتوى على رقم واحد على الاقل",
    pwOneLetter: "كلمة السر تحتاج الى حرف اخر",
    signInRequired: "عليك بتسجبل الدخول لفعل ذلك",
    signupCodeIncorrect: "رمز التسجيل غير صحيح",
    signupCodeRequired: "رمز التسجيل مطلوب",
    usernameIsEmail: "اسم المستخدم لا يمكن ان يكون بريد الكترونى",
    usernameRequired: "اسم المستخدم مطلوب",
    accounts: {
      "Email already exists.": "البريد الالكترونى مسجل",
      "Email doesn't match the criteria.": "البريد الالكترونى لا يتوافق مع الشروط",
      "Invalid login token": "رمز الدخول غير صالح",
      "Login forbidden": "تسجيل الدخول غير مسموح",
      "Service unknown": "خدمة غير معروفة",
      "Unrecognized options for login request": "اختيارات غير معلومة عند تسجيل الدخول",
      "User validation failed": "تأكيد المستخدم فشل",
      "Username already exists.": "اسم المستخدم مسجل",
      "You are not logged in.": "لم تسجل دخولك",
      "You've been logged out by the server. Please log in again.": "لقد تم تسجيل خروجك من قبل الخادم. قم بتسجيل الدخول مجددا.",
      "Your session has expired. Please log in again.": "لقد انتهت جلستك. قم بتسجيل الدخول مجددا.",
      "No matching login attempt found": "لم نجد محاولة دخول مطابقة",
      "Password is old. Please reset your password.": "كلمة السر قديمة. قم باعادة تعيين كلمة السر.",
      "Incorrect password": "كلمة السر غير صحيحة.",
      "Invalid email": "البريد الالكترونى غير صالح",
      "Must be logged in": "يجب ان تسجل دخولك",
      "Need to set a username or email": "يجب تعيين اسم مستخدم او بريد الكترونى",
      "old password format": "صيغة كلمة السر القديمة",
      "Password may not be empty": "كلمة السر لا يمكن ان تترك فارغة",
      "Signups forbidden": "فتح الحسابات غير مسموح",
      "Token expired": "انتهى زمن الرمز",
      "Token has invalid email address": "الرمز يحتوى على بريد الكترونى غير صالح",
      "User has no password set": "المستخدم لم يقم بتعيين كلمة سر",
      "User not found": "اسم المستخدم غير موجود",
      "Verify email link expired": "انتهى زمن رابط تأكيد البريد الالكترونى",
      "Verify email link is for unknown address": "رابط تأكيد البريد الالكترونى ينتمى الى بريد الكترونى غير معروف",
      "Match failed": "المطابقة فشلت",
      "Unknown error": "خطأ غير معروف"
    }
  }
};

T9n.map("ar", ar);
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}).call(this);






(function () {

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/softwarerero:accounts-t9n/t9n/zh-cn.coffee.js                                                              //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
__coffeescriptShare = typeof __coffeescriptShare === 'object' ? __coffeescriptShare : {}; var share = __coffeescriptShare;
var zh_cn;

zh_cn = {
  add: "添加",
  and: "和",
  back: "返回",
  changePassword: "修改密码",
  choosePassword: "新密码",
  clickAgree: "点击注册表示您同意",
  configure: "配置",
  createAccount: "创建账户",
  currentPassword: "当前密码",
  dontHaveAnAccount: "没有账户？",
  email: "电子邮箱",
  emailAddress: "电邮地址",
  emailResetLink: "邮件重置链接",
  forgotPassword: "忘记密码？",
  ifYouAlreadyHaveAnAccount: "如果您已有账户",
  newPassword: "新密码",
  newPasswordAgain: "再输一遍新密码",
  optional: "可选的",
  OR: "或",
  password: "密码",
  passwordAgain: "再输一遍密码",
  privacyPolicy: "隐私条例",
  remove: "移除",
  resetYourPassword: "重置您的密码",
  setPassword: "设置密码",
  sign: "登",
  signIn: "登陆",
  signin: "登陆",
  signOut: "登出",
  signUp: "注册",
  signupCode: "注册码",
  signUpWithYourEmailAddress: "用您的电子邮件地址注册",
  terms: "使用条例",
  updateYourPassword: "更新您的密码",
  username: "用户名",
  usernameOrEmail: "用户名或电子邮箱",
  "with": "与",
  info: {
    emailSent: "邮件已发出",
    emailVerified: "邮件验证成功",
    passwordChanged: "密码修改成功",
    passwordReset: "密码重置成功"
  },
  error: {
    emailRequired: "必须填写电子邮件",
    minChar: "密码至少7个字符长",
    pwdsDontMatch: "两次密码不一致",
    pwOneDigit: "密码中至少有一位数字",
    pwOneLetter: "密码中至少有一位字母",
    signInRequired: "您必须登陆后才能查看",
    signupCodeIncorrect: "注册码错误",
    signupCodeRequired: "必须有注册码",
    usernameIsEmail: "是用户名而不是电子邮件地址",
    usernameRequired: "必须填写用户名。",
    accounts: {
      "Email already exists.": "该电子邮件地址已被使用。",
      "Email doesn't match the criteria.": "错误的的电子邮件地址。",
      "Invalid login token": "登陆密匙错误",
      "Login forbidden": "登陆被阻止",
      "Service unknown": "未知服务",
      "Unrecognized options for login request": "登陆请求存在无法识别的选项",
      "User validation failed": "用户验证失败",
      "Username already exists.": "用户名已被占用。",
      "You are not logged in.": "您还没有登陆。",
      "You've been logged out by the server. Please log in again.": "您被服务器登出了。请重新登陆。",
      "Your session has expired. Please log in again.": "会话过期，请重新登陆。",
      "No matching login attempt found": "未发现对应登陆请求",
      "Password is old. Please reset your password.": "密码过于老了，请重置您的密码。",
      "Incorrect password": "错误的密码",
      "Invalid email": "不合法的电子邮件地址",
      "Must be logged in": "必须先登陆",
      "Need to set a username or email": "必须设置用户名或电子邮件地址",
      "old password format": "较老的密码格式",
      "Password may not be empty": "密码不应该为空",
      "Signups forbidden": "注册被禁止",
      "Token expired": "密匙过期",
      "Token has invalid email address": "密匙对应的电子邮箱地址不合法",
      "User has no password set": "用户没有密码",
      "User not found": "未找到该用户",
      "Verify email link expired": "激活验证邮件的链接已过期",
      "Verify email link is for unknown address": "验证邮件的链接去向未知地址",
      "Match failed": "匹配失败",
      "Unknown error": "未知错误"
    }
  }
};

T9n.map("zh-cn", zh_cn);
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}).call(this);






(function () {

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/softwarerero:accounts-t9n/t9n/cs.coffee.js                                                                 //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
__coffeescriptShare = typeof __coffeescriptShare === 'object' ? __coffeescriptShare : {}; var share = __coffeescriptShare;
var cs;

cs = {
  add: "přidat",
  and: "a",
  back: "zpět",
  changePassword: "Změnte heslo",
  choosePassword: "Zvolte heslo",
  clickAgree: "Stiskem tlačítka Registrovat souhlasíte s",
  configure: "Nastavit",
  createAccount: "Vytvořit účet",
  currentPassword: "Současné heslo",
  dontHaveAnAccount: "Nemáte účet?",
  email: "Email",
  emailAddress: "Emailová adresa",
  emailResetLink: "Odkaz na reset emailu",
  forgotPassword: "Zapomenuté heslo?",
  ifYouAlreadyHaveAnAccount: "Pokud již máte účet",
  newPassword: "Nové heslo",
  newPasswordAgain: "Nové heslo (zopakovat)",
  optional: "Volitelný",
  OR: "nebo",
  password: "Heslo",
  passwordAgain: "Heslo (zopakovat)",
  privacyPolicy: "Nastavení soukromí",
  remove: "odstranit",
  resetYourPassword: "Resetovat heslo",
  setPassword: "Nastavit heslo",
  sign: "Přihlášení",
  signIn: "Přihlásit se",
  signin: "přihlásit se",
  signOut: "Odhlásit se",
  signUp: "Registrovat",
  signupCode: "Registrační kód",
  signUpWithYourEmailAddress: "Registrovat se emailovou adresou",
  terms: "Podmínky použití",
  updateYourPassword: "Aktualizujte si své heslo",
  username: "Uživatelské jméno",
  usernameOrEmail: "Uživatelské jméno nebo email",
  "with": "s",
  info: {
    emailSent: "Email odeslán",
    emailVerified: "Email ověřen",
    passwordChanged: "Heslo změněno",
    passwordReset: "Heslo resetováno"
  },
  error: {
    emailRequired: "Email je povinný.",
    minChar: "minimální délka hesla je 7 znaků.",
    pwdsDontMatch: "Hesla nesouhlasí",
    pwOneDigit: "Heslo musí obsahovat alespoň jednu číslici.",
    pwOneLetter: "Heslo musí obsahovat alespoň 1 slovo.",
    signInRequired: "Musíte být příhlášeni.",
    signupCodeIncorrect: "Registrační kód je chybný.",
    signupCodeRequired: "Registrační kód je povinný.",
    usernameIsEmail: "Uživatelské jméno nemůže být emailová adresa.",
    usernameRequired: "Uživatelské jméno je povinné."
  },
  accounts: {
    "A login handler should return a result or undefined": "Přihlašovací rutina musí vracet výsledek nebo undefined",
    "Email already exists.": "Email již existuje.",
    "Email doesn't match the criteria.": "Email nesplňuje požadavky.",
    "Invalid login token": "Neplatný přihlašovací token",
    "Login forbidden": "Přihlášení je zakázáno",
    "Service unknown": "Neznámá služba",
    "Unrecognized options for login request": "Nerozpoznaná volba přihlašovacího požadavku",
    "User validation failed": "Validace uživatele selhala",
    "Username already exists.": "Uživatelské jméno již existuje.",
    "You are not logged in.": "Nejste přihlášený.",
    "You've been logged out by the server. Please log in again.": "Byl jste odhlášen. Prosím přihlašte se znovu.",
    "Your session has expired. Please log in again.": "Vaše připojení vypršelo. Prosím přihlašte se znovu.",
    "No matching login attempt found": "Nenalezen odpovídající způsob přihlášení",
    "Password is old. Please reset your password.": "Heslo je staré. Prosíme nastavte si ho znovu.",
    "Incorrect password": "Chybné heslo",
    "Invalid email": "Neplatný email",
    "Must be logged in": "Uživatel musí být přihlášen",
    "Need to set a username or email": "Je třeba zadat uživatelské jméno nebo email",
    "old password format": "starý formát hesla",
    "Password may not be empty": "Heslo nemůže být prázdné",
    "Signups forbidden": "Registrace je zakázaná",
    "Token expired": "Token vypršel",
    "Token has invalid email address": "Token má neplatnou emailovou adresu",
    "User has no password set": "Uživatel nemá nastavené heslo",
    "User not found": "Uživatel nenalezen",
    "Verify email link expired": "Odkaz pro ověření emailu vypršel",
    "Verify email link is for unknown address": "Odkaz pro ověření emailu má neznámou adresu",
    "Match failed": "Nesouhlasí",
    "Unknown error": "Neznámá chyba"
  }
};

T9n.map("cs", cs);
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}).call(this);






(function () {

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/softwarerero:accounts-t9n/t9n/da.coffee.js                                                                 //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
__coffeescriptShare = typeof __coffeescriptShare === 'object' ? __coffeescriptShare : {}; var share = __coffeescriptShare;
var da;

da = {
  add: "tilføj",
  and: "og",
  back: "tilbage",
  changePassword: "Skift kodeord",
  choosePassword: "Vælg kodeord",
  clickAgree: "Ved at klikke på tilmeld accepterer du vores",
  configure: "Konfigurer",
  createAccount: "Opret konto",
  currentPassword: "Nuværende kodeord",
  dontHaveAnAccount: "Har du ikke en konto?",
  email: "E-mail",
  emailAddress: "E-mail adresse",
  emailResetLink: "Nulstil E-mail Link",
  forgotPassword: "Glemt kodeord?",
  ifYouAlreadyHaveAnAccount: "Hvis jeg allerede har en konto",
  newPassword: "Nyt kodeord",
  newPasswordAgain: "Nyt kodeord (igen)",
  optional: "Frivilligt",
  OR: "eller",
  password: "Kodeord",
  passwordAgain: "Kodeord (igen)",
  privacyPolicy: "Privatlivspolitik",
  remove: "fjern",
  resetYourPassword: "Nulstil dit kodeord",
  setPassword: "Sæt kodeord",
  sign: "Log",
  signIn: "Log ind",
  signin: "Log ind",
  signOut: "Log ud",
  signUp: "Tilmeld",
  signupCode: "Tilmeldingskode",
  signUpWithYourEmailAddress: "Tilmeld med din e-mail adresse",
  terms: "Betingelser for brug",
  updateYourPassword: "Skift dit kodeord",
  username: "Brugernavn",
  usernameOrEmail: "Brugernavn eller e-mail",
  "with": "med",
  info: {
    emailSent: "E-mail sendt",
    emailVerified: "Email verificeret",
    passwordChanged: "Password ændret",
    passwordReset: "Password reset"
  },
  error: {
    emailRequired: "E-mail er påkrævet.",
    minChar: "Kodeordet skal være mindst 7 tegn.",
    pwdsDontMatch: "De to kodeord er ikke ens.",
    pwOneDigit: "Kodeord kræver mindste et tal.",
    pwOneLetter: "Kodeord kræver mindst et bogstav.",
    signInRequired: "Du skal være logget ind for at kunne gøre det.",
    signupCodeIncorrect: "Tilmeldingskode er forkert.",
    signupCodeRequired: "Tilmeldingskode er påkrævet.",
    usernameIsEmail: "Brugernavn kan ikke være en e-mail adresse.",
    usernameRequired: "Brugernavn skal udfyldes.",
    accounts: {
      "Email already exists.": "E-mail findes allerede.",
      "Email doesn't match the criteria.": "E-mail modsvarer ikke kriteriet.",
      "Invalid login token": "Invalid log ind token",
      "Login forbidden": "Log ind forbudt",
      "Service unknown": "Service ukendt",
      "Unrecognized options for login request": "Ukendte options for login forsøg",
      "User validation failed": "Bruger validering fejlede",
      "Username already exists.": "Brugernavn findes allerede.",
      "You are not logged in.": "Du er ikke logget ind.",
      "You've been logged out by the server. Please log in again.": "Du er blevet logget af serveren. Log ind igen.",
      "Your session has expired. Please log in again.": "Din session er udløbet. Log ind igen.",
      "No matching login attempt found": "Der fandtes ingen login forsøg",
      "Password is old. Please reset your password.": "Kodeordet er for gammelt. Du skal resette det.",
      "Incorrect password": "Forkert kodeord",
      "Invalid email": "Invalid e-mail",
      "Must be logged in": "Du skal være logget ind",
      "Need to set a username or email": "Du skal angive enten brugernavn eller e-mail",
      "old password format": "gammelt kodeord format",
      "Password may not be empty": "Kodeord skal være udfyldt",
      "Signups forbidden": "Tilmeldinger forbudt",
      "Token expired": "Token udløbet",
      "Token has invalid email address": "Token har en invalid e-mail adresse",
      "User has no password set": "Bruger har ikke angivet noget kodeord",
      "User not found": "Bruger ej fundet",
      "Verify email link expired": "Verify email link expired",
      "Verify email link is for unknown address": "Verificer e-mail link for ukendt adresse",
      "Match failed": "Match fejlede",
      "Unknown error": "Ukendt fejl"
    }
  }
};

T9n.map("da", da);
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}).call(this);






(function () {

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/softwarerero:accounts-t9n/t9n/de.coffee.js                                                                 //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
__coffeescriptShare = typeof __coffeescriptShare === 'object' ? __coffeescriptShare : {}; var share = __coffeescriptShare;
var de;

de = {
  add: "hinzufügen",
  and: "und",
  back: "zurück",
  changePasswort: "Passwort ändern",
  choosePasswort: "Passwort auswählen",
  clickAgree: "Durch die Registrierung akzeptieren Sie unsere",
  configure: "Konfigurieren",
  createAccount: "Konto erzeugen",
  currentPasswort: "Aktuelles Passwort",
  dontHaveAnAccount: "Noch kein Konto?",
  email: "E-Mail",
  emailAddress: "E-Mail Adresse",
  emailResetLink: "Senden",
  forgotPasswort: "Passwort vergessen?",
  ifYouAlreadyHaveAnAccount: "Falls Sie ein Konto haben, bitte hier",
  newPasswort: "Neues Passwort",
  newPasswortAgain: "Neues Passwort (wiederholen)",
  optional: "Optional",
  OR: "ODER",
  Passwort: "Passwort",
  PasswortAgain: "Passwort (wiederholen)",
  privacyPolicy: "Datenschutzerklärung",
  remove: "entfernen",
  resetYourPasswort: "Passwort zurücksetzen",
  setPasswort: "Passwort bestimmen",
  sign: "Anmelden",
  signIn: "Anmelden",
  signin: "anmelden",
  signOut: "Abmelden",
  signUp: "Registrieren",
  signupCode: "Registrierungscode",
  signUpWithYourEmailAddress: "Mit E-Mail registrieren",
  terms: "Geschäftsbedingungen",
  updateYourPasswort: "Passwort aktualisieren",
  username: "Benutzername",
  usernameOrEmail: "Benutzername oder E-Mail",
  "with": "mit",
  info: {
    emailSent: "Email gesendet",
    emailVerified: "Email verifiziert",
    PasswortChanged: "Passwort geändert",
    PasswortReset: "Passwort zurückgesetzt"
  },
  error: {
    emailRequired: "E-Mail benötigt.",
    minChar: "Passwort muss mindesten 7 Zeichen lang sein.",
    pwdsDontMatch: "Passwörter stimmen nicht überein.",
    pwOneDigit: "Passwort muss mindestens eine Ziffer enthalten.",
    pwOneLetter: "Passwort muss mindestens einen Buchstaben enthalten.",
    signInRequired: "Sie müssen sich anmelden.",
    signupCodeIncorrect: "Registrierungscode ungültig.",
    signupCodeRequired: "Registrierungscode benötigt.",
    usernameIsEmail: "Benutzername kann nicht eine E-Mail.",
    usernameRequired: "Benutzername benötigt.",
    accounts: {
      "Email already exists.": "Die Email gibt es schon.",
      "Email doesn't match the criteria.": "Emails stimmt nicht mit den Kriterien überein.",
      "User validation failed": "Die Benutzerdaten scheinen nicht korrekt",
      "Username already exists.": "Den Benutzer gibt es schon.",
      "You are not logged in.": "Sie sind nicht eingeloggt.",
      "You've been logged out by the server. Please log in again.": "Der Server hat Dich ausgeloggt. Bitte melde Dich erneut an.",
      "Your session has expired. Please log in again.": "Deine Sitzung ist abgelaufen. Bitte melde Dich erneut an.",
      "Passwort is old. Please reset your Passwort.": "Das Passwort ist abgelaufen, bitte zurücksetzen.",
      "Incorrect Passwort": "Falschen Passwort",
      "Invalid email": "Falschen Email",
      "Must be logged in": "Da muss man sich aber erst anmelden",
      "Need to set a username or email": "Benutzername oder Email sollte man schon angeben",
      "Passwort may not be empty": "Das Passwort darf nicht leer bleiben",
      "Signups forbidden": "Anmeldungen sind verboten",
      "Token expired": "Das Token ist abgelaufen",
      "Token has invalid email address": "Für des Token stimmt die Email-Adresse nicht",
      "User has no Passwort set": "Kein Passwort für den Benutzer angegeben",
      "User not found": "Benutzer nicht gefunden",
      "Verify email link expired": "Token zur Verifizierung der Email ist abgelaufen",
      "Verify email link is for unknown address": "Token zur Verifizierung der Email ist für eine unbekannte Adresse"
    }
  }
};

T9n.map("de", de);
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}).call(this);






(function () {

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/softwarerero:accounts-t9n/t9n/en.coffee.js                                                                 //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
__coffeescriptShare = typeof __coffeescriptShare === 'object' ? __coffeescriptShare : {}; var share = __coffeescriptShare;
var en;

en = {
  add: "add",
  and: "and",
  back: "back",
  changePassword: "Change Password",
  choosePassword: "Choose a Password",
  clickAgree: "By clicking Register, you agree to our",
  configure: "Configure",
  createAccount: "Create an Account",
  currentPassword: "Current Password",
  dontHaveAnAccount: "Don't have an account?",
  email: "Email",
  emailAddress: "Email Address",
  emailResetLink: "Email Reset Link",
  forgotPassword: "Forgot your password?",
  ifYouAlreadyHaveAnAccount: "If you already have an account",
  newPassword: "New Password",
  newPasswordAgain: "New Password (again)",
  optional: "Optional",
  OR: "OR",
  password: "Password",
  passwordAgain: "Password (again)",
  privacyPolicy: "Privacy Policy",
  remove: "remove",
  resetYourPassword: "Reset your password",
  setPassword: "Set Password",
  sign: "Sign",
  signIn: "Sign In",
  signin: "sign in",
  signOut: "Sign Out",
  signUp: "Register",
  signupCode: "Registration Code",
  signUpWithYourEmailAddress: "Register with your email address",
  terms: "Terms of Use",
  updateYourPassword: "Update your password",
  username: "Username",
  usernameOrEmail: "Username or email",
  "with": "with",
  info: {
    emailSent: "Email sent",
    emailVerified: "Email verified",
    passwordChanged: "Password changed",
    passwordReset: "Password reset"
  },
  error: {
    emailRequired: "Email is required.",
    minChar: "7 character minimum password.",
    pwdsDontMatch: "Passwords don't match",
    pwOneDigit: "Password must have at least one digit.",
    pwOneLetter: "Password requires 1 letter.",
    signInRequired: "You must be signed in to do that.",
    signupCodeIncorrect: "Registration code is incorrect.",
    signupCodeRequired: "Registration code is required.",
    usernameIsEmail: "Username cannot be an email address.",
    usernameRequired: "Username is required.",
    accounts: {
      "Email already exists.": "Email already exists.",
      "Email doesn't match the criteria.": "Email doesn't match the criteria.",
      "Invalid login token": "Invalid login token",
      "Login forbidden": "Login forbidden",
      "Service unknown": "Service unknown",
      "Unrecognized options for login request": "Unrecognized options for login request",
      "User validation failed": "User validation failed",
      "Username already exists.": "Username already exists.",
      "You are not logged in.": "You are not logged in.",
      "You've been logged out by the server. Please log in again.": "You've been logged out by the server. Please log in again.",
      "Your session has expired. Please log in again.": "Your session has expired. Please log in again.",
      "No matching login attempt found": "No matching login attempt found",
      "Password is old. Please reset your password.": "Password is old. Please reset your password.",
      "Incorrect password": "Incorrect password",
      "Invalid email": "Invalid email",
      "Must be logged in": "Must be logged in",
      "Need to set a username or email": "Need to set a username or email",
      "old password format": "old password format",
      "Password may not be empty": "Password may not be empty",
      "Signups forbidden": "Signups forbidden",
      "Token expired": "Token expired",
      "Token has invalid email address": "Token has invalid email address",
      "User has no password set": "User has no password set",
      "User not found": "User not found",
      "Verify email link expired": "Verify email link expired",
      "Verify email link is for unknown address": "Verify email link is for unknown address",
      "Match failed": "Match failed",
      "Unknown error": "Unknown error"
    }
  }
};

T9n.map("en", en);
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}).call(this);






(function () {

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/softwarerero:accounts-t9n/t9n/es.coffee.js                                                                 //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
__coffeescriptShare = typeof __coffeescriptShare === 'object' ? __coffeescriptShare : {}; var share = __coffeescriptShare;
var es;

es = {
  add: "agregar",
  and: "y",
  back: "atrás",
  changePassword: "Cambiar Contraseña",
  choosePassword: "Eligir Contraseña",
  clickAgree: "Si haces clic en Sucribir estas de acuerdo con la",
  configure: "Disposición",
  createAccount: "Crear cuenta",
  currentPassword: "Contraseña actual",
  dontHaveAnAccount: "No tenés una cuenta?",
  email: "Email",
  emailAddress: "Dirección de Email",
  emailResetLink: "Reiniciar Email",
  forgotPassword: "Contraseña olvidada?",
  ifYouAlreadyHaveAnAccount: "Si ya tenés una cuenta",
  newPassword: "Nueva Contraseña",
  newPasswordAgain: "Nueva Contraseña (repetición)",
  optional: "Opcional",
  OR: "O",
  password: "Contraseña",
  passwordAgain: "Contraseña (repetición)",
  privacyPolicy: "Póliza de Privacidad",
  remove: "remover",
  resetYourPassword: "Resetear tu contraseña",
  setPassword: "Definir Contraseña",
  sign: "Ingresar",
  signIn: "Entrar",
  signin: "entrar",
  signOut: "Salir",
  signUp: "Suscribir",
  signupCode: "Codigo para suscribir",
  signUpWithYourEmailAddress: "Suscribir con tu email",
  terms: "Terminos de Uso",
  updateYourPassword: "Actualizar tu contraseña",
  username: "Usuario",
  usernameOrEmail: "Usuario o email",
  "with": "con",
  info: {
    emailSent: "Email enviado",
    emailVerified: "Email verificado",
    passwordChanged: "Contraseña cambiado",
    passwordReset: "Resetar Contraseña"
  },
  error: {
    emailRequired: "Email es necesario.",
    minChar: "7 carácteres mínimo.",
    pwdsDontMatch: "Contraseñas no coninciden",
    pwOneDigit: "mínimo un dígito.",
    pwOneLetter: "mínimo una letra.",
    signInRequired: "Debes iniciar sesión para hacer eso.",
    signupCodeIncorrect: "Código para suscribir no coincide.",
    signupCodeRequired: "Código para suscribir es necesario.",
    usernameIsEmail: "Usuario no puede ser Email.",
    usernameRequired: "Usuario es necesario.",
    accounts: {
      "Email already exists.": "Email ya existe.",
      "Email doesn't match the criteria.": "Email no coincide con los criterios.",
      "User validation failed": "No se ha podido validar el usuario",
      "Username already exists.": "Usuario ya existe.",
      "You've been logged out by the server. Please log in again.": "Has sido desconectado por el servidor. Por favor ingresa otra vez.",
      "Your session has expired. Please log in again.": "Tu session ha expirado. Por favor ingresa otra vez.",
      "Incorrect password": "Contraseña no válida",
      "Must be logged in": "Hay que ingresar",
      "Need to set a username or email": "Tienes que especificar un usuario o un email",
      "Signups forbidden": "Registro prohibido",
      "Token expired": "Token expirado",
      "Token has invalid email address": "Token contiene un Email inválido",
      "User has no password set": "Usuario no tiene contraseña",
      "User not found": "Usuario no encontrado",
      "Verify email link expired": "Enlace para verificar el Email ha expirado",
      "Verify email link is for unknown address": "Enlace para verificar el Email contiene una dirección desconocida"
    }
  }
};

T9n.map("es", es);
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}).call(this);






(function () {

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/softwarerero:accounts-t9n/t9n/es_ES.coffee.js                                                              //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
__coffeescriptShare = typeof __coffeescriptShare === 'object' ? __coffeescriptShare : {}; var share = __coffeescriptShare;
var es_ES;

es_ES = {
  add: "agregar",
  and: "y",
  back: "atrás",
  changePassword: "Cambiar Contraseña",
  choosePassword: "Eligir Contraseña",
  clickAgree: "Si haces clic en Crear Cuenta estás de acuerdo con la",
  configure: "Configurar",
  createAccount: "Crear cuenta",
  currentPassword: "Contraseña actual",
  dontHaveAnAccount: "¿No estás registrado?",
  email: "Email",
  emailAddress: "Dirección de email",
  emailResetLink: "Restaurar email",
  forgotPassword: "¿Has olvidado tu contraseña?",
  ifYouAlreadyHaveAnAccount: "Ya tienes una cuenta, ",
  newPassword: "Nueva Contraseña",
  newPasswordAgain: "Nueva Contraseña (repetición)",
  optional: "Opcional",
  OR: "O",
  password: "Contraseña",
  passwordAgain: "Contraseña (repetición)",
  privacyPolicy: "Póliza de Privacidad",
  remove: "remover",
  resetYourPassword: "Recuperar tu contraseña",
  setPassword: "Definir Contraseña",
  sign: "Entrar",
  signIn: "Entrar",
  signin: "entra",
  signOut: "Salir",
  signUp: "Regístrate",
  signupCode: "Código para registrarte",
  signUpWithYourEmailAddress: "Regístrate con tu email",
  terms: "Términos de Uso",
  updateYourPassword: "Actualizar tu contraseña",
  username: "Usuario",
  usernameOrEmail: "Usuario o email",
  "with": "con",
  info: {
    emailSent: "Email enviado",
    emailVerified: "Email verificado",
    passwordChanged: "Contraseña cambiado",
    passwordReset: "Resetar Contraseña"
  },
  error: {
    emailRequired: "El email es necesario.",
    minChar: "7 carácteres mínimo.",
    pwdsDontMatch: "Contraseñas no coninciden",
    pwOneDigit: "mínimo un dígito.",
    pwOneLetter: "mínimo una letra.",
    signInRequired: "Debes iniciar sesión para esta opción.",
    signupCodeIncorrect: "Código de registro inválido.",
    signupCodeRequired: "Se requiere un código de registro.",
    usernameIsEmail: "El usuario no puede ser una dirección de correo.",
    usernameRequired: "Se quiere nombre de usuario.",
    accounts: {
      "Email already exists.": "El correo ya existe.",
      "Email doesn't match the criteria.": "El correo no coincide.",
      "User validation failed": "No hemos podido verificar el usuario",
      "Username already exists.": "Este usuario ya existe.",
      "You've been logged out by the server. Please log in again.": "Has sido desconectado por el servidor. Por favor inicia sesión de nuevo.",
      "Your session has expired. Please log in again.": "Tu session ha expirado. Por favor inicia sesión de nuevo.",
      "Incorrect password": "Contraseña inválida",
      "Must be logged in": "Debes iniciar sesión",
      "Need to set a username or email": "Debes especificar un usuario o email",
      "Signups forbidden": "Los registros no están permitidos en este momento",
      "Token expired": "El token ha expirado",
      "Token has invalid email address": "EL token contiene un email inválido",
      "User has no password set": "El usuario no tiene contraseña",
      "User not found": "Usuario no encontrado",
      "Verify email link expired": "El enlace para verificar el email ha expierado",
      "Verify email link is for unknown address": "El enlace para verificar el email está asociado a una dirección desconocida"
    }
  }
};

T9n.map("es_ES", es_ES);
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}).call(this);






(function () {

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/softwarerero:accounts-t9n/t9n/fa.coffee.js                                                                 //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
__coffeescriptShare = typeof __coffeescriptShare === 'object' ? __coffeescriptShare : {}; var share = __coffeescriptShare;
var fa;

fa = {
  add: "افزودن",
  and: "و",
  back: "برگشت",
  changePassword: "تعویض گذرواژه",
  choosePassword: "انتخاب یک گذرواژه",
  clickAgree: "با انتخاب ثبت‌نام، شما موافق هستید با",
  configure: "پیکربندی",
  createAccount: "ایجاد یک حساب",
  currentPassword: "گذرواژه کنونی",
  dontHaveAnAccount: "یک حساب ندارید؟",
  email: "رایانامه",
  emailAddress: "آدرس رایانامه",
  emailResetLink: "پیوند بازنشانی رایانامه",
  forgotPassword: "گذرواژه‌تان را فراموش کرده‌اید؟",
  ifYouAlreadyHaveAnAccount: "اگر هم‌اکنون یک حساب دارید",
  newPassword: "گذرواژه جدید",
  newPasswordAgain: "گذرواژه جدید (تکرار)",
  optional: "اختيارى",
  OR: "یا",
  password: "گذرواژه",
  passwordAgain: "گذرواژه (دوباره)",
  privacyPolicy: "حریم خصوصی",
  remove: "حذف",
  resetYourPassword: "بازنشانی گذرواژه شما",
  setPassword: "تنظیم گذرواژه",
  sign: "نشان",
  signIn: "ورود",
  signin: "ورود",
  signOut: "خروج",
  signUp: "ثبت‌نام",
  signupCode: "کد ثبت‌نام",
  signUpWithYourEmailAddress: "با آدرس رایانامه‌تان ثبت‌نام کنید",
  terms: "قوانین استفاده",
  updateYourPassword: "گذرواژه‌تان را به روز کنید",
  username: "نام کاربری",
  usernameOrEmail: "نام کاربری یا رایانامه",
  "with": "با",
  info: {
    emailSent: "رایانامه ارسال شد",
    emailVerified: "رایانامه تایید شد",
    passwordChanged: "گذرواژه تغییر کرد",
    passwordReset: "گذرواژه بازنشانی شد"
  },
  error: {
    emailRequired: "رایانامه ضروری است.",
    minChar: "گذرواژه حداقل ۷ کاراکتر.",
    pwdsDontMatch: "گذرواژه‌ها تطابق ندارند",
    pwOneDigit: "گذرواژه باید لااقل یک رقم داشته باشد.",
    pwOneLetter: "گذرواژه یک حرف نیاز دارد.",
    signInRequired: "برای انجام آن باید وارد شوید.",
    signupCodeIncorrect: "کد ثبت‌نام نادرست است.",
    signupCodeRequired: "کد ثبت‌نام ضروری است.",
    usernameIsEmail: "نام کاربری نمی‌توان آدرس رایانامه باشد.",
    usernameRequired: "نام کاربری ضروری است.",
    accounts: {
      "Email already exists.": "رایانامه هم‌اکنون وجود دارد.",
      "Email doesn't match the criteria.": "رایانامه با ضوابط تطابق ندارد.",
      "Invalid login token": "علامت ورود نامعتبر است",
      "Login forbidden": "ورود ممنوع است",
      "Service unknown": "سرویس ناشناس",
      "Unrecognized options for login request": "گزینه‌های نامشخص برای درخواست ورود",
      "User validation failed": "اعتبارسنجی کاربر ناموفق",
      "Username already exists.": "نام کاربری هم‌اکنون وجود دارد.",
      "You are not logged in.": "شما وارد نشده‌اید.",
      "You've been logged out by the server. Please log in again.": "شما توسط سرور خارج شده‌اید. لطفأ دوباره وارد شوید.",
      "Your session has expired. Please log in again.": "جلسه شما منقضی شده است. لطفا دوباره وارد شوید.",
      "No matching login attempt found": "تلاش ورود مطابق یافت نشد",
      "Password is old. Please reset your password.": "گذرواژه قدیمی است. لطفأ گذرواژه‌تان را بازتنظیم کنید.",
      "Incorrect password": "گذرواژه نادرست",
      "Invalid email": "رایانامه نامعتبر",
      "Must be logged in": "باید وارد شوید",
      "Need to set a username or email": "یک نام کاربری یا ایمیل باید تنظیم شود",
      "old password format": "قالب گذرواژه قدیمی",
      "Password may not be empty": "گذرواژه نمی‌تواند خالی باشد",
      "Signups forbidden": "ثبت‌نام ممنوع",
      "Token expired": "علامت رمز منقظی شده است",
      "Token has invalid email address": "علامت رمز دارای آدرس رایانامه نامعتبر است",
      "User has no password set": "کاربر گذرواژه‌ای تنظیم نکرده است",
      "User not found": "کاربر یافت نشد",
      "Verify email link expired": "پیوند تایید رایانامه منقضی شده است",
      "Verify email link is for unknown address": "پیوند تایید رایانامه برای آدرس ناشناخته است",
      "Match failed": "تطابق ناموفق",
      "Unknown error": "خطای ناشناخته"
    }
  }
};

T9n.map("fa", fa);
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}).call(this);






(function () {

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/softwarerero:accounts-t9n/t9n/fr.coffee.js                                                                 //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
__coffeescriptShare = typeof __coffeescriptShare === 'object' ? __coffeescriptShare : {}; var share = __coffeescriptShare;
var fr;

fr = {
  add: "Ajouter",
  and: "et",
  back: "retour",
  changePassword: "Modifier le mot de passe",
  choosePassword: "Choisir le mot de passe",
  clickAgree: "En cliquant sur S'enregistrer, vous acceptez notre",
  configure: "Configurer",
  createAccount: "Créer un compte",
  currentPassword: "Mot de passe actuel",
  dontHaveAnAccount: "Vous n'avez pas de compte ?",
  email: "Email",
  emailAddress: "Adresse Email",
  emailResetLink: "Envoyer le mail de réinitialisation",
  forgotPassword: "Vous avez oublié votre mot de passe ?",
  ifYouAlreadyHaveAnAccount: "Si vous avez déjà un compte",
  newPassword: "Nouveau mot de passe",
  newPasswordAgain: "Confirmer le nouveau mot de passe",
  optional: "Optionnel",
  OR: "OU",
  password: "Mot de passe",
  passwordAgain: "Confirmer le mot de passe",
  privacyPolicy: "Politique de confidentialité",
  remove: "Supprimer",
  resetYourPassword: "Reinitialiser votre mot de passe",
  setPassword: "Spécifier le mot de passe",
  sign: "S'enregistrer",
  signIn: "Se Connecter",
  signin: "se connecter",
  signOut: "Se Deconnecter",
  signUp: "S'enregistrer",
  signupCode: "Code d'inscription",
  signUpWithYourEmailAddress: "S'enregistrer avec votre adresse email",
  terms: "Conditions d'utilisation",
  updateYourPassword: "Mettre à jour le mot de passe",
  username: "Nom d'utilisateur",
  usernameOrEmail: "Nom d'utilisateur ou email",
  "with": "avec",
  info: {
    emailSent: "Email envoyé",
    emailVerified: "Email verifié",
    passwordChanged: "Mot de passe modifié",
    passwordReset: "Mot de passe réinitialisé"
  },
  error: {
    emailRequired: "Un email est requis.",
    minChar: "Votre mot de passe doit contenir au minimum 7 caractères.",
    pwdsDontMatch: "Les mots de passe ne correspondent pas",
    pwOneDigit: "Votre mot de passe doit contenir au moins un chiffre.",
    pwOneLetter: "Votre mot de passe doit contenir au moins une lettre.",
    signInRequired: "Vous devez être connecté pour continuer.",
    signupCodeIncorrect: "Le code d'enregistrement est incorrect.",
    signupCodeRequired: "Un code d'inscription est requis.",
    usernameIsEmail: "Le nom d'utilisateur ne peut être le même que l'adresse email.",
    usernameRequired: "Un nom d'utilisateur est requis.",
    accounts: {
      "Email already exists.": "Adresse email déjà utilisée.",
      "Email doesn't match the criteria.": "Adresse email ne correspond pas aux critères.",
      "Invalid login token": "Jeton d'authentification invalide",
      "Login forbidden": "Authentification interdite",
      "Service unknown": "Service inconnu",
      "Unrecognized options for login request": "Options inconnues pour la requête d'authentification",
      "User validation failed": "Echec de la validation de l'utilisateur",
      "Username already exists.": "Nom d'utilisateur déjà utilisé.",
      "You are not logged in.": "Vous n'êtes pas authentifié.",
      "You've been logged out by the server. Please log in again.": "Vous avez été déconnecté par le serveur. Veuillez vous reconnecter.",
      "Your session has expired. Please log in again.": "Votre session a expiré. Veuillez vous reconnecter.",
      "No matching login attempt found": "Aucune tentative d'authentification ne correspond",
      "Password is old. Please reset your password.": "Votre mot de passe est trop ancien. Veuillez le modifier.",
      "Incorrect password": "Mot de passe incorrect",
      "Invalid email": "Email invalide",
      "Must be logged in": "Vous devez être connecté",
      "Need to set a username or email": "Vous devez renseigner un nom d'utilisateur ou une adresse email",
      "old password format": "Ancien format de mot de passe",
      "Password may not be empty": "Le mot de passe ne peut être vide",
      "Signups forbidden": "La création de compte est interdite",
      "Token expired": "Jeton expiré",
      "Token has invalid email address": "Le jeton contient une adresse email invalide",
      "User has no password set": "L'utilisateur n'a pas de mot de passe",
      "User not found": "Utilisateur inconnu",
      "Verify email link expired": "Lien de vérification d'email expiré",
      "Verify email link is for unknown address": "Le lien de vérification d'email réfère à une adresse inconnue",
      "Match failed": "La correspondance a échoué",
      "Unknown error": "Erreur inconnue"
    }
  }
};

T9n.map("fr", fr);
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}).call(this);






(function () {

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/softwarerero:accounts-t9n/t9n/he.coffee.js                                                                 //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
__coffeescriptShare = typeof __coffeescriptShare === 'object' ? __coffeescriptShare : {}; var share = __coffeescriptShare;
var he;

he = {
  add: "הוסף",
  and: "ו",
  back: "חזרה",
  changePassword: "שינוי סיסמא",
  choosePassword: "בחירת סיסמא",
  clickAgree: "על ידי לחיצה על הירשם, הינך מסכים",
  configure: "הגדרות",
  createAccount: "הוספת חשבון",
  currentPassword: "סיסמא נוכחית",
  dontHaveAnAccount: "אין לך חשבון?",
  email: "דוא\"ל",
  emailAddress: "דוא\"ל",
  emailResetLink: "שלח קישור לאיפוס סיסמא",
  forgotPassword: "שכחת סיסמא?",
  ifYouAlreadyHaveAnAccount: "אם יש לך חשבון",
  newPassword: "סיסמא חדשה",
  newPasswordAgain: "סיסמא חדשה (שוב)",
  optional: "רשות",
  OR: "או",
  password: "סיסמא",
  passwordAgain: "סיסמא (שוב)",
  privacyPolicy: "למדיניות הפרטיות",
  remove: "הסרה",
  resetYourPassword: "איפוס סיסמא",
  setPassword: "עדכון סיסמא",
  signIn: "כניסה",
  signin: "כניסה",
  signOut: "יציאה",
  signUp: "הרשמה לחשבון",
  signupCode: "קוד הרשמה",
  signUpWithYourEmailAddress: "הירשם באמצעות הדוא\"ל",
  terms: "לתנאי השימוש",
  updateYourPassword: "עדכון סיסמא",
  username: "שם משתמש",
  usernameOrEmail: "שם משמש או דוא\"ל",
  "with": "עם",
  info: {
    emailSent: "נשלחה הודעה לדוא\"ל",
    emailVerified: "כתובת הדוא\"ל וודאה בהצלחה",
    passwordChanged: "סיסמתך שונתה בהצלחה",
    passwordReset: "סיסמתך אופסה בהצלחה"
  },
  error: {
    emailRequired: "חובה להזין כתובת דוא\"ל",
    minChar: "חובה להזין סיסמא בעלת 7 תווים לפחות.",
    pwdsDontMatch: "הסיסמאות אינן זהות.",
    pwOneDigit: "הסיסמא חייבת לכלול ספרה אחת לפחות.",
    pwOneLetter: "הסיסמא חייבת לכלול אות אחת לפחות.",
    signInRequired: "חובה להיכנס למערכת כדי לבצע פעולה זו.",
    signupCodeIncorrect: "קוד ההרשמה שגוי.",
    signupCodeRequired: "חובה להזין את קוד ההרשמה.",
    usernameIsEmail: "של המשתמש לא יכול להיות כתובת דוא\"ל.",
    usernameRequired: "חובה להזין שם משתמש.",
    accounts: {
      "Email already exists.": "הדוא\"ל כבר רשום לחשבון.",
      "Email doesn't match the criteria.": "הדוא\"ל לא מקיים את הקריטריונים.",
      "Invalid login token": "Token כניסה שגוי",
      "Login forbidden": "הכניסה נאסרה",
      "Service unknown": "Service לא ידוע",
      "Unrecognized options for login request": "נסיון הכניסה כלל אופציות לא מזוהות",
      "User validation failed": "אימות המשתמש נכשל",
      "Username already exists.": "שם המשתמש כבר קיים.",
      "You are not logged in.": "לא נכנסת לחשבון.",
      "You've been logged out by the server. Please log in again.": "השרת הוציא אותך מהמערכת. נא להיכנס לחשבונך שוב.",
      "Your session has expired. Please log in again.": "ה-session שלך פג תוקף. נא להיכנס לחשבונך שוב.",
      "No matching login attempt found": "לא נמצא נסיון כניסה מתאים",
      "Password is old. Please reset your password.": "סיסמתך ישנה. נא להחליך אותה.",
      "Incorrect password": "סיסמא שגויה",
      "Invalid email": "דוא\"ל שגוי",
      "Must be logged in": "חובה להיכנס למערכת כדי לבצע פעולה זו.",
      "Need to set a username or email": "חובה להגדיר שם משתמש או דוא\"ל",
      "old password format": "פורמט סיסמא ישן",
      "Password may not be empty": "הסיסמא לא יכולה להיות ריקה",
      "Signups forbidden": "אסור להירשם",
      "Token expired": "ה-token פג תוקף",
      "Token has invalid email address": "ה-token מכיל כתובת דוא\"ל שגוייה",
      "User has no password set": "למשתמש אין סיסמא",
      "User not found": "המשתמש לא נמצא",
      "Verify email link expired": "קישור וידוי הדוא\"ל פג תוקף",
      "Verify email link is for unknown address": "קישור וידוי הדוא\"ל הוא לכתובת לא ידועה",
      "Match failed": "ההתאמה נכשלה",
      "Unknown error": "שגיאה לא ידועה"
    }
  }
};

T9n.map("he", he);
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}).call(this);






(function () {

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/softwarerero:accounts-t9n/t9n/it.coffee.js                                                                 //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
__coffeescriptShare = typeof __coffeescriptShare === 'object' ? __coffeescriptShare : {}; var share = __coffeescriptShare;
var it;

it = {
  add: "aggiungi",
  and: "e",
  back: "indietro",
  changePassword: "Cambia Password",
  choosePassword: "Scegli una Password",
  clickAgree: "Cliccando Registrati, accetti la nostra",
  configure: "Configura",
  createAccount: "Crea un Account",
  currentPassword: "Password Corrente",
  dontHaveAnAccount: "Non hai un account?",
  email: "Email",
  emailAddress: "Indirizzo Email",
  emailResetLink: "Invia Link di Reset",
  forgotPassword: "Hai dimenticato la password?",
  ifYouAlreadyHaveAnAccount: "Se hai già un account",
  newPassword: "Nuova Password",
  newPasswordAgain: "Nuova Password (di nuovo)",
  optional: "Opzionale",
  OR: "OPPURE",
  password: "Password",
  passwordAgain: "Password (di nuovo)",
  privacyPolicy: "Privacy Policy",
  remove: "rimuovi",
  resetYourPassword: "Reimposta la password",
  setPassword: "Imposta Password",
  sign: "Accedi",
  signIn: "Accedi",
  signin: "accedi",
  signOut: "Esci",
  signUp: "Registrati",
  signupCode: "Codice di Registrazione",
  signUpWithYourEmailAddress: "Registrati con il tuo indirizzo email",
  terms: "Termini di Servizio",
  updateYourPassword: "Aggiorna la password",
  username: "Username",
  usernameOrEmail: "Nome utente o email",
  "with": "con",
  info: {
    emailSent: "Email inviata",
    emailVerified: "Email verificata",
    passwordChanged: "Password cambiata",
    passwordReset: "Password reimpostata"
  },
  error: {
    emailRequired: "L'Email è obbligatoria.",
    minChar: "La Password deve essere di almeno 7 caratteri.",
    pwdsDontMatch: "Le Password non corrispondono",
    pwOneDigit: "La Password deve contenere almeno un numero.",
    pwOneLetter: "La Password deve contenere 1 lettera.",
    signInRequired: "Per fare questo devi accedere.",
    signupCodeIncorrect: "Codice di Registrazione errato.",
    signupCodeRequired: "Il Codice di Registrazione è obbligatorio.",
    usernameIsEmail: "Il Nome Utente non può essere un indirizzo email.",
    usernameRequired: "Il Nome utente è obbligatorio.",
    accounts: {
      "Email already exists.": "Indirizzo email già esistente.",
      "Email doesn't match the criteria.": "L'indirizzo email non soddisfa i requisiti.",
      "Invalid login token": "Codice di accesso non valido",
      "Login forbidden": "Accesso non consentito",
      "Service unknown": "Servizio sconosciuto",
      "Unrecognized options for login request": "Opzioni per la richiesta di accesso non ricunosciute",
      "User validation failed": "Validazione utente fallita",
      "Username already exists.": "Nome utente già esistente.",
      "You are not logged in.": "Non hai effettuato l'accesso.",
      "You've been logged out by the server. Please log in again.": "Sei stato disconnesso dal server. Per favore accedi di nuovo.",
      "Your session has expired. Please log in again.": "La tua sessione è scaduta. Per favore accedi di nuovo.",
      "No matching login attempt found": "Tentativo di accesso corrispondente non trovato",
      "Password is old. Please reset your password.": "La password è vecchia. Per favore reimposta la tua password.",
      "Incorrect password": "Password non corretta",
      "Invalid email": "Email non valida",
      "Must be logged in": "Devi aver eseguito l'accesso",
      "Need to set a username or email": "È necessario specificare un nome utente o un indirizzo email",
      "old password format": "vecchio formato password",
      "Password may not be empty": "La password non può essere vuota",
      "Signups forbidden": "Registrazioni non consentite",
      "Token expired": "Codice scaduto",
      "Token has invalid email address": "Il codice ha un indirizzo email non valido",
      "User has no password set": "L'utente non ha una password impostata",
      "User not found": "Utente non trovato",
      "Verify email link expired": "Link per la verifica dell'email scaduto",
      "Verify email link is for unknown address": "Il link per la verifica dell'email fa riferimento ad un indirizzo sconosciuto",
      "Match failed": "Riscontro fallito",
      "Unknown error": "Errore Sconosciuto"
    }
  }
};

T9n.map("it", it);
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}).call(this);






(function () {

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/softwarerero:accounts-t9n/t9n/pl.coffee.js                                                                 //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
__coffeescriptShare = typeof __coffeescriptShare === 'object' ? __coffeescriptShare : {}; var share = __coffeescriptShare;
var pl;

pl = {
  add: "dodaj",
  and: "i",
  back: "powrót",
  changePassword: "Zmień hasło",
  choosePassword: "Wybierz hasło",
  clickAgree: "Klikając na Zarejestruj się zgadzasz się z naszą",
  configure: "Konfiguruj",
  createAccount: "Utwórz konto",
  currentPassword: "Aktualne hasło",
  dontHaveAnAccount: "Nie masz konta?",
  email: "Email",
  emailAddress: "Adres email",
  emailResetLink: "Wyślij email z linkiem do zmiany hasła",
  forgotPassword: "Zapomniałeś hasła?",
  ifYouAlreadyHaveAnAccount: "Jeżeli już masz konto",
  newPassword: "Nowe hasło",
  newPasswordAgain: "Nowe hasło (powtórz)",
  optional: "Nieobowiązkowe",
  OR: "LUB",
  password: "Hasło",
  passwordAgain: "Hasło (powtórz)",
  privacyPolicy: "polityką prywatności",
  remove: "usuń",
  resetYourPassword: "Ustaw nowe hasło",
  setPassword: "Ustaw hasło",
  sign: "Podpisz",
  signIn: "Zaloguj się",
  signin: "zaloguj się",
  signOut: "Wyloguj się",
  signUp: "Zarejestruj się",
  signupCode: "Kod rejestracji",
  signUpWithYourEmailAddress: "Zarejestruj się używając adresu email",
  terms: "warunkami korzystania z serwisu",
  updateYourPassword: "Zaktualizuj swoje hasło",
  username: "Nazwa użytkownika",
  usernameOrEmail: "Nazwa użytkownika lub email",
  "with": "z",
  info: {
    emailSent: "Adres email wysłany",
    emailVerified: "Adres email zweryfikowany",
    passwordChanged: "Hasło zmienione",
    passwordReset: "Hasło wyzerowane"
  },
  error: {
    emailRequired: "Wymagany jest adres email.",
    minChar: "7 znaków to minimalna długość hasła.",
    pwdsDontMatch: "Hasła są różne",
    pwOneDigit: "Hasło musi zawierać przynajmniej jedną cyfrę.",
    pwOneLetter: "Hasło musi zawierać 1 literę.",
    signInRequired: "Musisz być zalogowany, aby to zrobić.",
    signupCodeIncorrect: "Kod rejestracji jest nieprawidłowy.",
    signupCodeRequired: "Wymagany jest kod rejestracji.",
    usernameIsEmail: "Adres email nie może być nazwą użytkownika.",
    usernameRequired: "Wymagana jest nazwa użytkownika.",
    accounts: {
      "Email already exists.": "Adres email już istnieje.",
      "Email doesn't match the criteria.": "Adres email nie spełnia kryteriów.",
      "Invalid login token": "Błędny token logowania",
      "Login forbidden": "Logowanie zabronione",
      "Service unknown": "Nieznana usługa",
      "Unrecognized options for login request": "Nieznane parametry w żądaniu logowania.",
      "User validation failed": "Niepoprawna nazwa użytkownika",
      "Username already exists.": "Nazwa użytkownika już istnieje.",
      "You are not logged in.": "Nie jesteś zalogowany.",
      "You've been logged out by the server. Please log in again.": "Zostałeś wylogowane przez serwer. Zaloguj się ponownie.",
      "Your session has expired. Please log in again.": "Twoja sesja wygasła. Zaloguj się ponownie.",
      "No matching login attempt found": "Nie dopasowano danych logowania.",
      "Password is old. Please reset your password.": "Hasło jest stare. Proszę wyzerować hasło.",
      "Incorrect password": "Niepoprawne hasło",
      "Invalid email": "Błędny adres email",
      "Must be logged in": "Musisz być zalogowany",
      "Need to set a username or email": "Wymagane ustawienie nazwy użytkownika lub adresu email",
      "old password format": "stary format hasła",
      "Password may not be empty": "Hasło nie może być puste",
      "Signups forbidden": "Rejestracja zabroniona",
      "Token expired": "Token wygasł",
      "Token has invalid email address": "Token ma niewłaściwy adres email",
      "User has no password set": "Użytkownik nie ma ustawionego hasła",
      "User not found": "Nie znaleziono użytkownika",
      "Verify email link expired": "Link weryfikacyjny wygasł",
      "Verify email link is for unknown address": "Link weryfikacyjny jest dla nieznanego adresu",
      "Match failed": "Błędne dopasowanie",
      "Unknown error": "Nieznany błąd"
    }
  }
};

T9n.map("pl", pl);
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}).call(this);






(function () {

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/softwarerero:accounts-t9n/t9n/pt.coffee.js                                                                 //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
__coffeescriptShare = typeof __coffeescriptShare === 'object' ? __coffeescriptShare : {}; var share = __coffeescriptShare;
var pt;

pt = {
  and: "e",
  clickAgree: "Ao clicar em Entrar, você aceita nosso",
  configure: "Configurar",
  createAccount: "Criar Conta",
  dontHaveAnAccount: "Não tem conta?",
  email: "E-mail",
  emailAddress: "Endereço de e-mail",
  emailResetLink: "Gerar nova senha",
  forgotPassword: "Esqueceu sua senha?",
  ifYouAlreadyHaveAnAccount: "Se você já tem uma conta",
  optional: "Opcional",
  OR: "OU",
  password: "Senha",
  privacyPolicy: "Política de Privacidade",
  resetYourPassword: "Gerar nova senha",
  sign: "Entrar",
  signIn: "Entrar",
  signin: "entrar",
  signOut: "Sair",
  signUp: "Registrar",
  signupCode: "Código de acesso",
  signUpWithYourEmailAddress: "Entre usando seu endereço de e-mail",
  terms: "Termos de Uso",
  updateYourPassword: "Atualizar senha",
  username: "Nome de usuário",
  usernameOrEmail: "Usuario ou e-mail",
  "with": "com",
  error: {
    emailRequired: "E-mail é obrigatório.",
    minChar: "Senha requer um mínimo de 7 caracteres.",
    pwOneDigit: "Senha deve conter pelo menos um digito.",
    pwOneLetter: "Senha deve conter pelo menos uma letra.",
    signInRequired: "Você precisa estar logado para fazer isso.",
    signupCodeIncorrect: "Código de acesso incorreto.",
    signupCodeRequired: "É necessário um código de acesso.",
    usernameIsEmail: "Nome de usuário não pode ser um endereço de e-mail.",
    usernameRequired: "Nome de usuário é obrigatório."
  }
};

T9n.map("pt", pt);
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}).call(this);






(function () {

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/softwarerero:accounts-t9n/t9n/ru.coffee.js                                                                 //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
__coffeescriptShare = typeof __coffeescriptShare === 'object' ? __coffeescriptShare : {}; var share = __coffeescriptShare;
var ru;

ru = {
  add: "добавить",
  and: "и",
  back: "назад",
  changePassword: "Сменить пароль",
  choosePassword: "Придумайте пароль",
  clickAgree: "Нажав на Регистрация вы соглашаетесь с условиями",
  configure: "Конфигурировать",
  createAccount: "Создать аккаунт",
  currentPassword: "Текущий пароль",
  dontHaveAnAccount: "Нет аккаунта?",
  email: "Email",
  emailAddress: "Email",
  emailResetLink: "Отправить ссылку для сброса",
  forgotPassword: "Забыли пароль?",
  ifYouAlreadyHaveAnAccount: "Если у вас уже есть аккаунт",
  newPassword: "Новый пароль",
  newPasswordAgain: "Новый пароль (еще раз)",
  optional: "Необязательно",
  OR: "ИЛИ",
  password: "Пароль",
  passwordAgain: "Пароль (еще раз)",
  privacyPolicy: "Политики безопасности",
  remove: "Удалить",
  resetYourPassword: "Сбросить пароль",
  setPassword: "Установить пароль",
  sign: "Подпись",
  signIn: "Войти",
  signin: "bойти",
  signOut: "Выйти",
  signUp: "Регистрация",
  signupCode: "Регистрационный код",
  signUpWithYourEmailAddress: "Зарегистрируйтесь с вашим email адресом",
  terms: "Условиями пользования",
  updateYourPassword: "Обновить пароль",
  username: "Имя пользователя",
  usernameOrEmail: "Имя пользователя или email",
  "with": "с",
  info: {
    emailSent: "Email отправлен",
    emailVerified: "Email прошел проверку",
    passwordChanged: "Пароль изменен",
    passwordReset: "Пароль сброшен"
  },
  error: {
    emailRequired: "Email обязательно.",
    minChar: "Минимальное кол-во символов для пароля 7.",
    pwdsDontMatch: "Пароли не совпадают",
    pwOneDigit: "В пароле должна быть хотя бы одна цифра.",
    pwOneLetter: "В пароле должна быть хотя бы одна буква.",
    signInRequired: "Необходимо войти для чтобы продолжить.",
    signupCodeIncorrect: "Неправильный регистрационный код.",
    signupCodeRequired: "Необходим регистрациооный код.",
    usernameIsEmail: "Имя пользователя не может быть адресом email.",
    usernameRequired: "Имя пользователя обязательно.",
    accounts: {
      "Email already exists.": "Email уже существует",
      "Email doesn't match the criteria.": "Email не соответствует критериям.",
      "Invalid login token": "Неверный токен для входа",
      "Login forbidden": "Вход запрещен",
      "Service unknown": "Cервис неизвестен",
      "Unrecognized options for login request": "Неизвестные параметры для запроса входа",
      "User validation failed": "Проверка пользователя неудалась",
      "Username already exists.": "Пользователь существует.",
      "You are not logged in.": "Вы не вошли.",
      "You've been logged out by the server. Please log in again.": "Сервер инициировал выход. Пожалуйста войдите еще раз.",
      "Your session has expired. Please log in again.": "Ваша сессия устарела. Пожалуйста войдите еще раз.",
      "No matching login attempt found": "Не было найдено соответствующей попытки войти",
      "Password is old. Please reset your password.": "Пароль устарел. Пожалуйста сбросьте Ваш пароль.",
      "Incorrect password": "Неправильный пароль",
      "Invalid email": "Несуществующий Email",
      "Must be logged in": "Необходимо войти",
      "Need to set a username or email": "Необходимо имя пользователя или email",
      "old password format": "старый формат пароля",
      "Password may not be empty": "Пароль не может быть пустым",
      "Signups forbidden": "Регистрация отключена",
      "Token expired": "Время действия токена истекло",
      "Token has invalid email address": "У токена неправильный email адрес",
      "User has no password set": "У пользователя не установлен пароль",
      "User not found": "Пользователь не найден",
      "Verify email link expired": "Ссылка подтверждения email устарела",
      "Verify email link is for unknown address": "Ссылка подтверждения email для неизвестного адреса",
      "Match failed": "Не совпадают",
      "Unknown error": "Неизвестная ошибка"
    }
  }
};

T9n.map("ru", ru);
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}).call(this);






(function () {

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/softwarerero:accounts-t9n/t9n/sl.coffee.js                                                                 //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
__coffeescriptShare = typeof __coffeescriptShare === 'object' ? __coffeescriptShare : {}; var share = __coffeescriptShare;
var sl;

sl = {
  add: "dodaj",
  and: "in",
  back: "nazaj",
  changePassword: "Spremeni geslo",
  choosePassword: "Izberi geslo",
  clickAgree: "S klikom na Registracija se strinjaš",
  configure: "Nastavi",
  createAccount: "Nova registracija",
  currentPassword: "Trenutno geslo",
  dontHaveAnAccount: "Nisi registriran(a)?",
  email: "Email",
  emailAddress: "Email naslov",
  emailResetLink: "Pošlji ponastavitveno povezavo",
  forgotPassword: "Pozabljeno geslo?",
  ifYouAlreadyHaveAnAccount: "Če si že registriran(a),",
  newPassword: "Novo geslo",
  newPasswordAgain: "Novo geslo (ponovno)",
  optional: "Po želji",
  OR: "ALI",
  password: "Geslo",
  passwordAgain: "Geslo (ponovno)",
  privacyPolicy: "z našimi pogoji uporabe",
  remove: "briši",
  resetYourPassword: "Ponastavi geslo",
  setPassword: "Nastavi geslo",
  sign: "Prijava",
  signIn: "Prijava",
  signin: "se prijavi",
  signOut: "Odjava",
  signUp: "Registracija",
  signupCode: "Prijavna koda",
  signUpWithYourEmailAddress: "Prijava z email naslovom",
  terms: "Pogoji uporabe",
  updateYourPassword: "Spremeni geslo",
  username: "Uporabniško ime",
  usernameOrEmail: "Uporabniško ime ali email",
  "with": "z",
  info: {
    emailSent: "E-pošta poslana",
    emailVerified: "Email naslov preverjen",
    passwordChanged: "Geslo spremenjeno",
    passwordReset: "Geslo ponastavljeno"
  },
  error: {
    emailRequired: "Email je obvezen vnos.",
    minChar: "Geslo mora imeti vsaj sedem znakov.",
    pwdsDontMatch: "Gesli se ne ujemata",
    pwOneDigit: "V geslu mora biti vsaj ena številka.",
    pwOneLetter: "V geslu mora biti vsaj ena črka.",
    signInRequired: "Za to moraš biti prijavljen(a).",
    signupCodeIncorrect: "Prijavna koda je napačna.",
    signupCodeRequired: "Prijavna koda je obvezen vnos.",
    usernameIsEmail: "Uporabniško ime ne more biti email naslov.",
    usernameRequired: "Uporabniško ime je obvezen vnos.",
    accounts: {
      "Email already exists.": "Email že obstaja.",
      "Email doesn't match the criteria.": "Email ne odgovarja kriterijem.",
      "Invalid login token": "Napačen prijavni žeton",
      "Login forbidden": "Prijava ni dovoljena",
      "Service unknown": "Neznana storitev",
      "Unrecognized options for login request": "Neznane možnosti v prijavnem zahtevku",
      "User validation failed": "Preverjanje uporabnika neuspešno",
      "Username already exists.": "Uporabniško ime že obstaja",
      "You are not logged in.": "Nisi prijavljen(a).",
      "You've been logged out by the server. Please log in again.": "Odjavljen(a) si s strežnika. Ponovi prijavo.",
      "Your session has expired. Please log in again.": "Seja je potekla. Ponovi prijavo.",
      "No matching login attempt found": "Prijava ne obstaja",
      "Password is old. Please reset your password.": "Geslo je staro. Zamenjaj ga.",
      "Incorrect password": "Napačno geslo",
      "Invalid email": "Napačen email",
      "Must be logged in": "Moraš biti prijavljane(a)",
      "Need to set a username or email": "Prijava ali email sta obvezna",
      "old password format": "stara oblika gesla",
      "Password may not be empty": "Geslo ne sme biti prazno",
      "Signups forbidden": "Prijave onemogočene",
      "Token expired": "Žeton je potekel",
      "Token has invalid email address": "Žeton vsebuje napačen email",
      "User has no password set": "Uporabnik nima gesla",
      "User not found": "Uporabnik ne obstaja",
      "Verify email link expired": "Povezava za potrditev je potekla",
      "Verify email link is for unknown address": "Povezava za potrditev vsebuje neznan naslov",
      "Match failed": "Prijava neuspešna",
      "Unknown error": "Neznana napaka"
    }
  }
};

T9n.map("sl", sl);
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}).call(this);






(function () {

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/softwarerero:accounts-t9n/t9n/sv.coffee.js                                                                 //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
__coffeescriptShare = typeof __coffeescriptShare === 'object' ? __coffeescriptShare : {}; var share = __coffeescriptShare;
var sv;

sv = {
  add: "lägg till",
  and: "och",
  back: "tillbaka",
  changePassword: "Ändra lösenord",
  choosePassword: "Välj lösenord",
  clickAgree: "När du väljer att skapa ett konto så godkänner du också vår",
  configure: "Konfigurera",
  createAccount: "Skapa ett konto",
  currentPassword: "Nuvarande lösenord",
  dontHaveAnAccount: "Har du inget konto?",
  email: "E-postadress",
  emailAddress: "E-postadress",
  emailResetLink: "E-post återställningslänk",
  forgotPassword: "Glömt din e-postadress?",
  ifYouAlreadyHaveAnAccount: "Om du redan har ett konto",
  newPassword: "Nytt lösenord",
  newPasswordAgain: "Nytt lösenord (upprepa)",
  optional: "Valfri",
  OR: "ELLER",
  password: "Lösenord",
  passwordAgain: "Lösenord (upprepa)",
  privacyPolicy: "integritetspolicy",
  remove: "ta bort",
  resetYourPassword: "Återställ ditt lösenord",
  setPassword: "Sätt ett lösenord",
  sign: "Logga",
  signIn: "Logga in",
  signin: "logga in",
  signOut: "Logga ut",
  signUp: "Skapa konto",
  signupCode: "Registreringskod",
  signUpWithYourEmailAddress: "Skapa ett konto med din e-postadress",
  terms: "användarvilkor",
  updateYourPassword: "Uppdatera ditt lösenord",
  username: "Användarnamn",
  usernameOrEmail: "Användarnamn eller e-postadress",
  "with": "med",
  info: {
    emailSent: "E-post skickades",
    emailVerified: "E-post verifierades",
    passwordChanged: "Lösenordet har ändrats",
    passwordReset: "Återställ lösenordet"
  },
  error: {
    emailRequired: "Det krävs ett lösenord.",
    minChar: "Det krävs minst 7 tecken i ditt lösenord.",
    pwdsDontMatch: "Lösenorden matchar inte.",
    pwOneDigit: "Lösenordet måste ha minst 1 siffra.",
    pwOneLetter: "Lösenordet måste ha minst 1 bokstav.",
    signInRequired: "Inloggning krävs här.",
    signupCodeIncorrect: "Registreringskoden är felaktig.",
    signupCodeRequired: "Det krävs en registreringskod.",
    usernameIsEmail: "Användarnamnet kan inte vara en e-postadress.",
    usernameRequired: "Det krävs ett användarnamn.",
    accounts: {
      "Email already exists.": "E-postadressen finns redan.",
      "Email doesn't match the criteria.": "E-postadressen uppfyller inte kriterierna.",
      "Invalid login token": "Felaktig login-token",
      "Login forbidden": "Inloggning tillåts ej",
      "Service unknown": "Okänd service",
      "Unrecognized options for login request": "Okända val för inloggningsförsöket",
      "User validation failed": "Validering av användare misslyckades",
      "Username already exists.": "Användarnamn finns redan.",
      "You are not logged in.": "Du är inte inloggad.",
      "You've been logged out by the server. Please log in again.": "Du har loggats ut av servern. Vänligen logga in igen.",
      "Your session has expired. Please log in again.": "Din session har gått ut. Vänligen ligga in igen.",
      "No matching login attempt found": "Inget matchande loginförsök kunde hittas",
      "Password is old. Please reset your password.": "Ditt lösenord är gammalt. Vänligen återställ ditt lösenord.",
      "Incorrect password": "Felaktigt lösenord",
      "Invalid email": "Ogiltig e-postadress",
      "Must be logged in": "Måste vara inloggad",
      "Need to set a username or email": "Ett användarnamn eller en e-postadress krävs.",
      "old password format": "gammalt lösenordsformat",
      "Password may not be empty": "Lösenordet får inte vara tomt",
      "Signups forbidden": "Registrering förbjuden",
      "Token expired": "Token har gått ut",
      "Token has invalid email address": "Token har ogiltig e-postadress",
      "User has no password set": "Användaren har inget lösenord",
      "User not found": "Användaren hittades inte",
      "Verify email link expired": "Länken för att verifera e-postadress har gått ut",
      "Verify email link is for unknown address": "Länken för att verifiera e-postadress är för en okänd adress.",
      "Match failed": "Matchning misslyckades",
      "Unknown error": "Okänt fel"
    }
  }
};

T9n.map("sv", sv);
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}).call(this);






(function () {

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/softwarerero:accounts-t9n/t9n/uk.coffee.js                                                                 //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
__coffeescriptShare = typeof __coffeescriptShare === 'object' ? __coffeescriptShare : {}; var share = __coffeescriptShare;
var uk;

uk = {
  add: "додати",
  and: "та",
  back: "назад",
  changePassword: "Змінити пароль",
  choosePassword: "Придумайте пароль",
  clickAgree: "Натиснувши на Реєстрація ви погоджуєтеся з умовами",
  configure: "Налаштувати",
  createAccount: "Створити аккаунт",
  currentPassword: "Діючий пароль",
  dontHaveAnAccount: "Немає аккаунта?",
  email: "Email",
  emailAddress: "Email",
  emailResetLink: "Отримати посилання для оновлення паролю",
  forgotPassword: "Забули пароль?",
  ifYouAlreadyHaveAnAccount: "Якщо у вас вже є аккаунт:",
  newPassword: "Новий пароль",
  newPasswordAgain: "Новий пароль (ще раз)",
  optional: "Необов’язково",
  OR: "АБО",
  password: "Пароль",
  passwordAgain: "Пароль (ще раз)",
  privacyPolicy: "Політики безпеки",
  remove: "Видалити",
  resetYourPassword: "Відновити пароль",
  setPassword: "Встановити пароль",
  sign: "Підпис",
  signIn: "Увійти",
  signin: "увійти",
  signOut: "Вийти",
  signUp: "Зареєструватися",
  signupCode: "Реєстраційний код",
  signUpWithYourEmailAddress: "Зареєструйтесь з вашою email адресою",
  terms: "Умовами користування",
  updateYourPassword: "Оновити пароль",
  username: "Ім’я користувача",
  usernameOrEmail: "Ім’я користувача або email",
  "with": "з",
  info: {
    emailSent: "Email відправлено",
    emailVerified: "Email пройшов перевірку",
    passwordChanged: "Пароль змінено",
    passwordReset: "Пароль скинуто"
  },
  error: {
    emailRequired: "Email є обов’язковим.",
    minChar: "Мінімальна кіл-ть символів для паролю 7.",
    pwdsDontMatch: "Паролі не співпадають",
    pwOneDigit: "Пароль повинен містити хоча б одну цифру.",
    pwOneLetter: "Пароль повинен містити хоча б одну букву.",
    signInRequired: "Для продовження необхідно увійти.",
    signupCodeIncorrect: "Невірний реєстраційний код.",
    signupCodeRequired: "Необхідний реєстраційний код.",
    usernameIsEmail: "Ім’я користувача не може бути email адресою.",
    usernameRequired: "Ім’я користувача є обов’язковим.",
    accounts: {
      "Email already exists.": "Email вже існує",
      "Email doesn't match the criteria.": "Email відповідає критеріям.",
      "Invalid login token": "Невірний токен для входу",
      "Login forbidden": "Вхід заборонено",
      "Service unknown": "Невідомий сервіс",
      "Unrecognized options for login request": "Невідомі параметри для запиту входу",
      "User validation failed": "Перевірка користувача не вдалася",
      "Username already exists.": "Користувач існує.",
      "You are not logged in.": "Ви не ввійшли.",
      "You've been logged out by the server. Please log in again.": "Сервер ініціював вихід. Будь ласка увійдіть ще раз.",
      "Your session has expired. Please log in again.": "Ваша сесія застаріла. Будь ласка увійдіть ще раз.",
      "No matching login attempt found": "Не було знайдено відповідної спроби увійти",
      "Password is old. Please reset your password.": "Пароль застарів. Будь ласка, скиньте Ваш пароль.",
      "Incorrect password": "Невірний пароль",
      "Invalid email": "Неіснуючий Email",
      "Must be logged in": "Необхідно увійти",
      "Need to set a username or email": "Необхідно ім’я користувача або email",
      "old password format": "старий формат паролю",
      "Password may not be empty": "Пароль не може бути пустим",
      "Signups forbidden": "Реєстрацію відключено",
      "Token expired": "Час дії токена вичерпано",
      "Token has invalid email address": "Невірна email адреса для токена",
      "User has no password set": "У користувача не встановлено пароль",
      "User not found": "Користувач не знайдений",
      "Verify email link expired": "Посилання підтвердження email застаріло",
      "Verify email link is for unknown address": "Посилання підтвердження email для невідомої адреси",
      "Match failed": "Не співпадають",
      "Unknown error": "Невідома помилка"
    }
  }
};

T9n.map("uk", uk);
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}).call(this);






(function () {

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/softwarerero:accounts-t9n/t9n/vi.coffee.js                                                                 //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
__coffeescriptShare = typeof __coffeescriptShare === 'object' ? __coffeescriptShare : {}; var share = __coffeescriptShare;
var vi;

vi = {
  add: "thêm",
  and: "và",
  back: "trở lại",
  clickAgree: "Bằng cách nhấn vào Đăng ký, bạn đã đồng ý với",
  configure: "Cấu hình",
  createAccount: "Tạo Tài khoản",
  dontHaveAnAccount: "Chưa có tài khoản?",
  email: "Email",
  emailAddress: "Địa chỉ Email",
  emailResetLink: "Gửi",
  forgotPassword: "Quên mật khẩu?",
  ifYouAlreadyHaveAnAccount: "Nếu bạn đã có tài khoản",
  optional: "Tùy chọn",
  OR: "Hoặc",
  password: "Mật khẩu",
  privacyPolicy: "Chính sách bảo mật",
  remove: "xóa",
  resetYourPassword: "Lấy lại mật khẩu",
  sign: "Ký",
  signIn: "Đăng nhập",
  signin: "đăng nhập",
  signOut: "Đăng xuất",
  signUp: "Đăng ký",
  signupCode: "Mã đăng ký",
  signUpWithYourEmailAddress: "Đăng ký với email của bạn",
  terms: "Điều khoản sử dụng",
  updateYourPassword: "Cập nhật mật khẩu",
  username: "Tên đăng nhập",
  usernameOrEmail: "Tên đăng nhập hoặc email",
  "with": "với",
  info: {
    emailSent: "Email đã được gửi đi!"
  },
  error: {
    emailRequired: "Email phải có.",
    minChar: "Mật khẩu phải có ít nhất 7 ký tự.",
    pwOneDigit: "Mật khẩu phải có ít nhất 1 chữ số.",
    pwOneLetter: "Mật khẩu phải có 1 ký tự chữ.",
    signInRequired: "Phải đăng nhập.",
    signupCodeIncorrect: "Mã số đăng ký sai.",
    signupCodeRequired: "Phải có mã số đăng ký.",
    usernameIsEmail: "Tên đăng nhập không thể là địa chỉ email.",
    usernameRequired: "Phải có tên đăng nhập.",
    accounts: {
      "Email already exists.": "Email đã tồn tại.",
      "Email doesn't match the criteria.": "Email không phù hợp.",
      "Invalid login token": "Mã đăng nhập không đúng",
      "Login forbidden": "Đăng nhập bị cấm",
      "Service unknown": "Chưa biết Dịch vụ",
      "Unrecognized options for login request": "Tùy chọn không được công nhận đối với yêu cầu đăng nhập",
      "User validation failed": "Xác nhận người dùng thất bại",
      "Username already exists.": "Tên đăng nhập đã tồn tại.",
      "You are not logged in.": "Bạn chưa đăng nhập.",
      "You've been logged out by the server. Please log in again.": "Bạn đã bị đăng xuất bởi máy chủ. Vui lòng đăng nhập lại.",
      "Your session has expired. Please log in again.": "Thời gian đăng nhập đã hết. Vui lòng đăng nhập lại.",
      "No matching login attempt found": "Không tìm thấy đăng nhập phù hợp",
      "Password is old. Please reset your password.": "Mật khẩu đã cũ. Vui lòng lấy lại mật khẩu.",
      "Incorrect password": "Mật khẩu sai",
      "Invalid email": "Email sai",
      "Must be logged in": "Phải đăng nhập",
      "Need to set a username or email": "Phải điền tên đăng nhập hoặc email",
      "old password format": "định dạng mật khẩu cũ",
      "Signups forbidden": "Đăng ký đã bị cấm",
      "Token expired": "Hết phiên đăng nhập",
      "Token has invalid email address": "Phiên đăng nhập chứa địa chỉ email sai",
      "User has no password set": "Người dùng chưa có mật khẩu",
      "User not found": "Không tìm thấy người dùng",
      "Verify email link expired": "Đường dẫn xác nhận email đã hết hạn",
      "Verify email link is for unknown address": "Đường dẫn xác nhận email là cho địa chỉ chưa xác định",
      "Match failed": "Không đúng"
    }
  }
};

T9n.map("vi", vi);
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}).call(this);






(function () {

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/softwarerero:accounts-t9n/t9n/no_NB.coffee.js                                                              //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
__coffeescriptShare = typeof __coffeescriptShare === 'object' ? __coffeescriptShare : {}; var share = __coffeescriptShare;
var no_NB;

no_NB = {
  add: "legg til",
  and: "og",
  back: "tilbake",
  changePassword: "Bytt passord",
  choosePassword: "Velg passord",
  clickAgree: "Ved å klikke meld på godtar du vår",
  configure: "Konfigurer",
  createAccount: "Oprett konto",
  currentPassword: "Nåværende passord",
  dontHaveAnAccount: "Har du ikke en konto?",
  email: "E-post",
  emailAddress: "E-postadresse",
  emailResetLink: "Epost nullstillingslenke",
  forgotPassword: "Glemt passord?",
  ifYouAlreadyHaveAnAccount: "Hvis du allerede har en konto",
  newPassword: "Nytt passord",
  newPasswordAgain: "Gjengi nytt passord",
  optional: "Frivillig",
  OR: "eller",
  password: "Passord",
  passwordAgain: "Gjengi passord",
  privacyPolicy: "Personvern",
  remove: "fjern",
  resetYourPassword: "Nullstill passord",
  setPassword: "Sett passord",
  sign: "Logg",
  signIn: "Logg inn",
  signin: "Logg inn",
  signOut: "Logg ut",
  signUp: "Meld på",
  signupCode: "Påmeldingskode",
  signUpWithYourEmailAddress: "Meld på med din e-postadresse",
  terms: "Betingelser for bruk",
  updateYourPassword: "Oppdater passord",
  username: "Brukernavn",
  usernameOrEmail: "Brukernavn eller e-epost",
  "with": "med",
  info: {
    emailSent: "E-post sendt",
    emailVerified: "E-post bekreftet",
    passwordChanged: "Passord endret",
    passwordReset: "Passord nullstillt"
  },
  error: {
    emailRequired: "E-post obligatorisk.",
    minChar: "Passordet må ha minst 7 tegn.",
    pwdsDontMatch: "Passordene er ikke like.",
    pwOneDigit: "Passordet må ha minst ett tall.",
    pwOneLetter: "Passordet må ha minst en bokstav.",
    signInRequired: "Du må være logget inn for å gjøre dette.",
    signupCodeIncorrect: "Påmelding gikk galt.",
    signupCodeRequired: "Påmeldingskode kreves.",
    usernameIsEmail: "Brukernavn kan ikke være en e-postadresse.",
    usernameRequired: "Brukernavn må utfylles.",
    accounts: {
      "Email already exists.": "E-postadressen finnes allerede.",
      "Email doesn't match the criteria.": "E-postadressen møter ikke kriteriet.",
      "Invalid login token": "Ugyldig innloggingstegn",
      "Login forbidden": "Innlogging forbudt",
      "Service unknown": "Ukjent tjeneste",
      "Unrecognized options for login request": "Ukjendte valg ved innloggingsforsøk",
      "User validation failed": "Brukergodkjenning gikk galt",
      "Username already exists.": "Brukernavnet finnes allerede.",
      "You are not logged in.": "Du er ikke logget inn.",
      "You've been logged out by the server. Please log in again.": "Tjeneren loggt deg ut. Logg inn på ny.",
      "Your session has expired. Please log in again.": "Din økt er utløpt. Logg inn på ny.",
      "No matching login attempt found": "Fant ingen samsvarende innloggingsførsøk",
      "Password is old. Please reset your password.": "Passordet er for gammelt. Nullstill passordet ditt.",
      "Incorrect password": "Feil passord",
      "Invalid email": "Ugyldig e-postadresse",
      "Must be logged in": "Du må være innlogget",
      "Need to set a username or email": "Oppgi brukernavn eller e-postadresse",
      "old password format": "gammelt passordformat",
      "Password may not be empty": "Passord må være utfyllt",
      "Signups forbidden": "Påmeldinger ikke tillatt",
      "Token expired": "Økten er utløpt",
      "Token has invalid email address": "Innloggingstegnet har ugyldig e-postadresse",
      "User has no password set": "Brukeren har ikke angitt passord",
      "User not found": "Bruker ikke funnet",
      "Verify email link expired": "Lenke for e-postbekreftelse er utløpt",
      "Verify email link is for unknown address": "Lenke for e-postbekreftelse er for en ukjent adresse",
      "Match failed": "Ikke samsvar",
      "Unknown error": "Ukjent feil"
    }
  }
};

T9n.map("no_NB", no_NB);
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}).call(this);


/* Exports */
if (typeof Package === 'undefined') Package = {};
Package['softwarerero:accounts-t9n'] = {
  T9n: T9n
};

})();
