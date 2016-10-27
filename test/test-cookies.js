const {Cookies, modifyPrefCookie} = require("../lib/CookieChanger");

exports.testCookieParsing = (assert) => {
    var t = (cookieString) => {
        return (new Cookies(cookieString)).unparse();
    };

    assert.equal(t(""), "");
    assert.equal(t("a=b"), "a=b");
    assert.equal(t("a=1; b=2"), "a=1; b=2");
    assert.equal(t("b=2; a=1"), "b=2; a=1");

    assert.equal(t("a=1;   b=2"), "a=1; b=2");
    assert.equal(t("a=1; ; b=2"), "a=1; b=2");
    assert.equal(t("a=1;; b=2"), "a=1; b=2");
    assert.equal(t("a=1;;b=2"), "a=1; b=2");
    assert.equal(t("a=1 ;b=2"), "a=1 ; b=2");

    // Cookies uses a Map as its backend
    assert.equal(t("a=1; a=2"), "a=2");

    assert.equal(t("abc"), "");
    assert.equal(t("abc="), "abc=");
    assert.equal(t("=abc"), "=abc");
    assert.equal(t("a=1; abc; b=2"), "a=1; b=2");
};

exports.testModifyPref = (assert) => {
    var t = (testcase, key, value) => {
        var cookies = new Cookies(testcase);
        modifyPrefCookie(cookies, key, value);
        return cookies.unparse();
    };

    var t1 = "PREF=f1=abc&f2=999";
    assert.equal(t(t1, "f1", "1234"), "PREF=f1=1234&f2=999");
    assert.equal(t(t1, "f2", "abcd"), "PREF=f1=abc&f2=abcd");
    assert.equal(t(t1, "f3", "123"), "PREF=f1=abc&f2=999&f3=123");
    assert.equal(t(t1, "f1", ""), "PREF=f1=&f2=999");
    assert.equal(t(t1, "f2", ""), "PREF=f1=abc&f2=");

    assert.equal(t("PREF=", "f2", "1"), "PREF=f2=1");
    assert.equal(t("", "f2", "1"), "PREF=f2=1");
};

require('sdk/test').run(exports);
