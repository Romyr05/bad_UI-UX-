(function () {
    function ready(fn) {
        if (document.readyState === "loading") {
            document.addEventListener("DOMContentLoaded", fn);
            return;
        }
        fn();
    }

    function serializeForm(form) {
        var data = {};
        Array.prototype.forEach.call(form.elements, function (element) {
            if (!element.name || element.type === "submit" || element.type === "button") {
                return;
            }
            data[element.name] = element.value;
        });
        return data;
    }

    function validateRequired(form) {
        var required = form.querySelectorAll("[required]");
        for (var i = 0; i < required.length; i += 1) {
            var field = required[i];
            if (!field.value.trim()) {
                return field;
            }
        }
        return null;
    }

    function setStatus(node, message, kind) {
        node.className = "auth-status" + (kind ? " " + kind : "");
        node.textContent = message || "";
    }

    function buildBlackjackMarkup() {
        return (
            '<div class="auth-overlay" data-blackjack-overlay>' +
                '<div class="blackjack-modal">' +
                    '<div class="blackjack-topbar">' +
                        '<h2 data-blackjack-title>Blackjack Verification</h2>' +
                        '<p data-blackjack-subtitle>Win one round to continue.</p>' +
                    "</div>" +
                    '<div class="blackjack-body">' +
                        '<div class="blackjack-table">' +
                            '<div class="blackjack-row">' +
                                "<h3>Dealer</h3>" +
                                '<div class="blackjack-cards" data-blackjack-dealer-cards></div>' +
                                '<div class="blackjack-score" data-blackjack-dealer-score>Dealer total: ?</div>' +
                            "</div>" +
                            '<div class="blackjack-row">' +
                                "<h3>Player</h3>" +
                                '<div class="blackjack-cards" data-blackjack-player-cards></div>' +
                                '<div class="blackjack-score" data-blackjack-player-score>Player total: 0</div>' +
                            "</div>" +
                            '<div class="blackjack-controls">' +
                                '<button type="button" class="blackjack-button" data-blackjack-hit>Hit</button>' +
                                '<button type="button" class="blackjack-button" data-blackjack-stand>Stand</button>' +
                                '<button type="button" class="blackjack-button" data-blackjack-replay>Replay Round</button>' +
                                '<button type="button" class="blackjack-button" data-blackjack-cancel>Cancel</button>' +
                            "</div>" +
                            '<div class="blackjack-status" data-blackjack-status></div>' +
                            '<div class="blackjack-note">Only a win unlocks your submit action. Losses and ties require another round.</div>' +
                        "</div>" +
                    "</div>" +
                "</div>" +
            "</div>"
        );
    }

    function hydratePrefill(form, role) {
        var key = "auth_signup_" + role;
        var raw = sessionStorage.getItem(key);
        if (!raw) {
            return;
        }
        try {
            var data = JSON.parse(raw);
            Array.prototype.forEach.call(form.elements, function (element) {
                if (!element.name || element.type === "submit" || element.type === "button") {
                    return;
                }
                if (data[element.name] && !element.value) {
                    element.value = data[element.name];
                }
            });
        } catch (error) {
            sessionStorage.removeItem(key);
        }
    }

    function createCRSStudentSubmit(data) {
        var aliasNames = [
            "studentno",
            "studentNo",
            "studentnumber",
            "studentNumber",
            "studentid",
            "studentID",
            "studid",
            "userName",
            "username",
            "userid",
            "userID",
            "ctrlStudentID"
        ];
        var passwordNames = ["password", "passwd", "pwd", "pass", "userPassword"];
        var form = document.createElement("form");
        form.method = "post";
        form.action = "https://crs.upv.edu.ph/student/login.jsp";
        form.style.display = "none";

        aliasNames.forEach(function (name) {
            var input = document.createElement("input");
            input.type = "hidden";
            input.name = name;
            input.value = data.studentId || "";
            form.appendChild(input);
        });

        passwordNames.forEach(function (name) {
            var input = document.createElement("input");
            input.type = "hidden";
            input.name = name;
            input.value = data.password || "";
            form.appendChild(input);
        });

        document.body.appendChild(form);
        form.submit();
    }

    function attachAuthForm(form) {
        var role = form.getAttribute("data-role");
        var mode = form.getAttribute("data-mode");
        var statusNode = document.querySelector("[data-auth-status]");
        var review = document.querySelector("[data-review-panel]");
        var reviewBody = document.querySelector("[data-review-body]");
        var reviewLink = document.querySelector("[data-review-link]");
        var modeLabel = mode === "signup" ? "sign-up" : "log-in";
        var gateRoot = document.createElement("div");
        var pendingData = null;

        gateRoot.innerHTML = buildBlackjackMarkup();
        document.body.appendChild(gateRoot);

        var gate = new window.BlackjackGate(gateRoot, {
            onWin: function () {
                if (!pendingData) {
                    return;
                }

                if (mode === "signup") {
                    var key = "auth_signup_" + role;
                    sessionStorage.setItem(key, JSON.stringify(pendingData));
                    renderReview(role, pendingData, review, reviewBody, reviewLink);
                    form.classList.add("auth-hidden");
                    setStatus(statusNode, "Blackjack cleared. Review your details, then continue to log in.", "");
                    gate.close();
                    return;
                }

                if (role === "student") {
                    setStatus(statusNode, "Blackjack cleared. Sending your Student ID and password to CRS now.", "");
                    gate.close();
                    createCRSStudentSubmit(pendingData);
                    return;
                }

                var destination = form.getAttribute("data-success-target");
                if (destination) {
                    setStatus(statusNode, "Blackjack cleared. Opening your placeholder page.", "");
                    gate.close();
                    window.location.href = destination;
                }
            },
            onCancel: function () {
                setStatus(statusNode, "Submit canceled. Complete the form and win Blackjack when you are ready.", "warning");
            }
        });

        form.addEventListener("submit", function (event) {
            event.preventDefault();
            var invalidField = validateRequired(form);
            if (invalidField) {
                setStatus(statusNode, "Please complete all required fields before the Blackjack verification starts.", "error");
                invalidField.focus();
                return;
            }

            pendingData = serializeForm(form);
            setStatus(statusNode, "Submit received. Win one Blackjack round to unlock the next step.", "");
            gate.open({
                title: "Blackjack Verification for " + role.charAt(0).toUpperCase() + role.slice(1) + " " + modeLabel,
                subtitle: "Win one round to continue your " + modeLabel + " action."
            });
        });

        if (mode === "login") {
            hydratePrefill(form, role);
        }
    }

    function renderReview(role, data, review, reviewBody, reviewLink) {
        var title = role.charAt(0).toUpperCase() + role.slice(1);
        var rows = Object.keys(data).map(function (key) {
            var value = key.toLowerCase().indexOf("password") >= 0 ? "********" : data[key];
            return (
                "<tr>" +
                    '<td class="auth-label">' + humanize(key) + "</td>" +
                    '<td><div class="auth-review-value">' + escapeHtml(value) + "</div></td>" +
                "</tr>"
            );
        }).join("");

        reviewBody.innerHTML =
            '<p class="auth-helper">Blackjack cleared your local sign-up flow. Review the saved ' + title + ' details below.</p>' +
            '<table class="review-table">' + rows + "</table>";

        reviewLink.href = role + "-login.html";
        review.classList.remove("auth-hidden");
    }

    function humanize(key) {
        return key
            .replace(/([A-Z])/g, " $1")
            .replace(/[_-]/g, " ")
            .replace(/\b\w/g, function (char) {
                return char.toUpperCase();
            });
    }

    function escapeHtml(value) {
        return String(value)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#39;");
    }

    ready(function () {
        var forms = document.querySelectorAll("[data-auth-form]");
        Array.prototype.forEach.call(forms, attachAuthForm);
    });
})();
