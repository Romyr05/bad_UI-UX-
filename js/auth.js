(function () {
    function ready(fn) {
        if (document.readyState === "loading") {
            document.addEventListener("DOMContentLoaded", fn);
            return;
        }
        fn();
    }

    function roleLabel(role) {
        return role.charAt(0).toUpperCase() + role.slice(1);
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
                        '<p data-blackjack-subtitle>Win 2 out of 3.</p>' +
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
                            "</div>" +
                            '<div class="blackjack-status" data-blackjack-status></div>' +
                        "</div>" +
                    "</div>" +
                "</div>" +
            "</div>"
        );
    }

    function initScientificPicker(form) {
        var picker = form.querySelector("[data-scientific-picker]");
        if (!picker) {
            return;
        }

        var hidden = picker.querySelector("[data-birth-date-input]");
        var preview = picker.querySelector("[data-birth-preview]");
        var cells = picker.querySelectorAll("[data-science-part]");

        function compute() {
            var values = {};

            Array.prototype.forEach.call(cells, function (cell) {
                var part = cell.getAttribute("data-science-part");
                var mantissaInput = cell.querySelector("[data-mantissa]");
                var exponentInput = cell.querySelector("[data-exponent]");
                var formulaNode = cell.querySelector("[data-formula]");
                var valueNode = cell.querySelector("[data-value]");
                var mantissa = parseFloat(mantissaInput.value);
                var exponent = parseInt(exponentInput.value, 10);
                var result = Math.round(mantissa * Math.pow(10, exponent));

                values[part] = result;
                formulaNode.textContent = mantissa.toFixed(2) + " x 10^" + exponent;
                valueNode.textContent = result;
            });

            var month = values.month;
            var day = values.day;
            var year = values.year;
            var date = new Date(year, month - 1, day);
            var valid = (
                year >= 1900 &&
                year <= 2099 &&
                month >= 1 &&
                month <= 12 &&
                day >= 1 &&
                day <= 31 &&
                date.getFullYear() === year &&
                date.getMonth() === month - 1 &&
                date.getDate() === day
            );

            if (valid) {
                hidden.value = [
                    String(year),
                    String(month).padStart(2, "0"),
                    String(day).padStart(2, "0")
                ].join("-");
                preview.className = "science-preview";
                preview.textContent = "Date resolved: " + hidden.value ;
            } else {
                hidden.value = "";
                preview.className = "science-preview invalid";
                preview.textContent = "Date unstable....";
            }
        }

        Array.prototype.forEach.call(picker.querySelectorAll("input, select"), function (input) {
            input.addEventListener("input", compute);
            input.addEventListener("change", compute);
        });

        compute();
    }

    function initFanLogin(form) {
        var panel = form.querySelector("[data-fan-login]");
        if (!panel) {
            return;
        }

        var speedInput = panel.querySelector("[data-fan-speed]");
        var speedLabel = panel.querySelector("[data-fan-speed-label]");
        var keyboard = panel.querySelector("[data-fan-keyboard]");
        var shell = panel.querySelector("[data-fan-shell]");
        var fieldContainers = panel.querySelectorAll("[data-fan-field]");
        var fieldButtons = panel.querySelectorAll("[data-select-field]");
        var keys = panel.querySelectorAll("[data-fan-key]");
        var activeInput = null;
        var state = {
            driftX: 0,
            driftY: 0,
            wobble: 0
        };
        var lockedSpeed = 100;

        function getFieldLimit(input) {
            if (!input || input.maxLength < 0) {
                return null;
            }
            return input.maxLength;
        }

        function updateSpeedLabel() {
            if (speedInput) {
                speedInput.value = String(lockedSpeed);
                speedInput.setAttribute("value", String(lockedSpeed));
                speedInput.disabled = true;
                speedInput.title = "The wind is permanently stuck at 100 RPM.";
            }
            if (speedLabel) {
                speedLabel.textContent = lockedSpeed + " RPM forever hehehe blee";
            }
        }

        function setActiveField(name) {
            Array.prototype.forEach.call(fieldContainers, function (container) {
                var isActive = container.getAttribute("data-fan-field") === name;
                container.classList.toggle("is-active", isActive);
                if (isActive) {
                    activeInput = container.querySelector("input");
                }
            });

            Array.prototype.forEach.call(fieldButtons, function (button) {
                button.classList.toggle("is-active", button.getAttribute("data-select-field") === name);
            });
        }

        Array.prototype.forEach.call(fieldButtons, function (button) {
            button.addEventListener("click", function () {
                setActiveField(button.getAttribute("data-select-field"));
            });
        });

        Array.prototype.forEach.call(keys, function (button) {
            button.addEventListener("click", function () {
                if (!activeInput) {
                    return;
                }

                var action = button.getAttribute("data-fan-key");
                var value = activeInput.value;

                if (action === "backspace") {
                    activeInput.value = value.slice(0, -1);
                    return;
                }
                if (action === "clear") {
                    activeInput.value = "";
                    return;
                }
                if (action === "space") {
                    if (getFieldLimit(activeInput) !== null && value.length >= getFieldLimit(activeInput)) {
                        return;
                    }
                    activeInput.value = value + " ";
                    return;
                }

                if (getFieldLimit(activeInput) !== null && value.length >= getFieldLimit(activeInput)) {
                    return;
                }

                activeInput.value = (value + action).slice(0, getFieldLimit(activeInput) || undefined);
            });
        });

        shell.addEventListener("mousemove", function (event) {
            var shellRect = shell.getBoundingClientRect();
            var keyboardRect = keyboard.getBoundingClientRect();
            var speed = lockedSpeed;
            var cursorX = event.clientX;
            var cursorY = event.clientY;
            var keyboardCenterX = keyboardRect.left + keyboardRect.width / 2;
            var keyboardCenterY = keyboardRect.top + keyboardRect.height / 2;
            var deltaX = keyboardCenterX - cursorX;
            var deltaY = keyboardCenterY - cursorY;
            var distance = Math.max(24, Math.sqrt(deltaX * deltaX + deltaY * deltaY));
            var intensity = Math.max(0, (230 - Math.min(distance, 230)) / 230) * (speed / 10);

            state.driftX += (deltaX / distance) * intensity * 12;
            state.driftY += (deltaY / distance) * intensity * 6;

            var maxX = Math.max(0, (shellRect.width - keyboardRect.width - 40) / 2);
            var maxY = Math.max(0, (shellRect.height - keyboardRect.height - 36) / 2);
            state.driftX = Math.max(-maxX, Math.min(maxX, state.driftX));
            state.driftY = Math.max(-maxY, Math.min(maxY, state.driftY));
        });

        shell.addEventListener("mouseleave", function () {
            state.driftX *= 0.35;
            state.driftY *= 0.35;
        });

        if (speedInput) {
            speedInput.addEventListener("input", function () {
                speedInput.value = String(lockedSpeed);
                updateSpeedLabel();
            });
        }
        updateSpeedLabel();
        setActiveField(fieldContainers[0].getAttribute("data-fan-field"));

        (function animate() {
            var speed = lockedSpeed;
            var time = Date.now() / 280;
            var drift = Math.sin(time * (speed / 40 + 0.5)) * (speed / 6);
            var bob = Math.cos(time * (speed / 55 + 0.5)) * (speed / 14);
            var tilt = Math.sin(time * (speed / 32 + 0.4)) * Math.min(11, speed / 7);
            state.wobble = tilt;
            state.driftX *= 0.96;
            state.driftY *= 0.94;
            keyboard.style.transform =
                "translate(" + (state.driftX + drift).toFixed(1) + "px, " + (state.driftY + bob).toFixed(1) + "px) " +
                "rotate(" + state.wobble.toFixed(1) + "deg)";
            window.requestAnimationFrame(animate);
        })();
    }

    function attachAuthForm(form) {
        var role = form.getAttribute("data-role");
        var mode = form.getAttribute("data-mode");
        var statusNode = form.querySelector("[data-auth-status]");
        var successPanel = form.parentNode.querySelector("[data-fake-success]");
        var gateRoot = document.createElement("div");
        var pendingData = null;

        initScientificPicker(form);
        initFanLogin(form);

        gateRoot.innerHTML = buildBlackjackMarkup();
        document.body.appendChild(gateRoot);

        var gate = new window.BlackjackGate(gateRoot, {
            onWin: function () {
                if (!pendingData) {
                    return;
                }

                gate.close();

                if (mode === "signup") {
                    if (successPanel) {
                        successPanel.classList.remove("auth-hidden");
                    }
                    setStatus(statusNode, "Blackjack cleared. Fake account created. Redirecting to the " + roleLabel(role) + " log-in page.", "");
                    window.setTimeout(function () {
                        window.location.href = form.getAttribute("data-next");
                    }, 1500);
                    return;
                }

                setStatus(statusNode, "Blackjack cleared. Redirecting to the live " + roleLabel(role) + " CRS page.", "");
                window.setTimeout(function () {
                    window.location.href = form.getAttribute("data-crs-target");
                }, 700);
            }
        });

        form.addEventListener("submit", function (event) {
            event.preventDefault();

            var invalidField = validateRequired(form);
            if (invalidField) {
                setStatus(statusNode, "COMPLETE THE GIVEN REQUEST", "error");
                invalidField.focus();
                return;
            }

            pendingData = serializeForm(form);
            setStatus(statusNode, "Submit captured. Win 2 out of 3 Blackjack rounds to unlock the next step.", "");
            gate.open({
                title: "Blackjack Verification for " + roleLabel(role) + " " + (mode === "signup" ? "Sign-up" : "Log-in"),
                subtitle: "Win 2 out of 3."
            });
        });
    }

    ready(function () {
        var forms = document.querySelectorAll("[data-auth-form]");
        Array.prototype.forEach.call(forms, attachAuthForm);
    });
})();
