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

require('sdk/test').run(exports);
