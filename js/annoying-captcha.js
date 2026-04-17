(function () {
    var CAPTCHA_PAGE = "./captcha.html";

    function normalizeHref(href) {
        if (!href) {
            return "";
        }

        return href.trim().replace(/\\/g, "/");
    }

    function shouldIntercept(anchor) {
        if (!anchor) {
            return false;
        }

        var href = normalizeHref(anchor.getAttribute("href"));

        if (!href || href === "#" || href.indexOf("javascript:") === 0) {
            return false;
        }

        if (anchor.hasAttribute("data-captcha-wrapped")) {
            return false;
        }

        if (href.indexOf(CAPTCHA_PAGE) === 0) {
            return false;
        }

        return true;
    }

    function buildCaptchaHref(anchor) {
        var href = anchor.getAttribute("href");
        var absoluteTarget = new URL(href, window.location.href).toString();
        var label = (anchor.textContent || anchor.title || "Requested page").trim();

        return (
            CAPTCHA_PAGE +
            "?target=" + encodeURIComponent(absoluteTarget) +
            "&label=" + encodeURIComponent(label)
        );
    }

    function wrapLinks() {
        var links = document.querySelectorAll("a[href]");

        Array.prototype.forEach.call(links, function (anchor) {
            if (!shouldIntercept(anchor)) {
                return;
            }

            anchor.setAttribute("data-captcha-wrapped", "true");
            anchor.setAttribute("data-original-href", anchor.getAttribute("href"));
            anchor.setAttribute("href", buildCaptchaHref(anchor));
            anchor.removeAttribute("onclick");
            anchor.removeAttribute("onClick");
        });
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", wrapLinks);
    } else {
        wrapLinks();
    }
})();
