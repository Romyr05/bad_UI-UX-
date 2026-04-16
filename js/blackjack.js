(function () {
    function createDeck() {
        var suits = [
            { symbol: "♠", color: "black" },
            { symbol: "♥", color: "red" },
            { symbol: "♦", color: "red" },
            { symbol: "♣", color: "black" }
        ];
        var ranks = ["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"];
        var deck = [];

        suits.forEach(function (suit) {
            ranks.forEach(function (rank) {
                deck.push({ rank: rank, suit: suit.symbol, color: suit.color });
            });
        });

        for (var i = deck.length - 1; i > 0; i -= 1) {
            var j = Math.floor(Math.random() * (i + 1));
            var temp = deck[i];
            deck[i] = deck[j];
            deck[j] = temp;
        }

        return deck;
    }

    function cardValue(rank) {
        if (rank === "A") {
            return 11;
        }
        if (rank === "K" || rank === "Q" || rank === "J") {
            return 10;
        }
        return parseInt(rank, 10);
    }

    function handValue(cards) {
        var total = 0;
        var aces = 0;

        cards.forEach(function (card) {
            total += cardValue(card.rank);
            if (card.rank === "A") {
                aces += 1;
            }
        });

        while (total > 21 && aces > 0) {
            total -= 10;
            aces -= 1;
        }

        return total;
    }

    function renderCards(container, cards, revealAll) {
        container.innerHTML = "";
        cards.forEach(function (card, index) {
            var tile = document.createElement("div");
            var hideCard = !revealAll && index === 1;
            tile.className = "card-tile" + (hideCard ? " hidden" : "") + (card.color === "red" ? " red" : "");

            if (!hideCard) {
                tile.innerHTML =
                    '<div class="card-corner">' + card.rank + card.suit + "</div>" +
                    '<div class="card-suit">' + card.suit + "</div>" +
                    '<div class="card-corner">' + card.rank + card.suit + "</div>";
            }

            container.appendChild(tile);
        });
    }

    function BlackjackGate(root, callbacks) {
        this.root = root;
        this.callbacks = callbacks || {};
        this.active = false;
        this.state = null;
        this.series = null;
        this.roundTimer = null;
        this.cache();
        this.bind();
    }

    BlackjackGate.prototype.cache = function () {
        this.overlay = this.root.querySelector("[data-blackjack-overlay]");
        this.title = this.root.querySelector("[data-blackjack-title]");
        this.subtitle = this.root.querySelector("[data-blackjack-subtitle]");
        this.dealerCards = this.root.querySelector("[data-blackjack-dealer-cards]");
        this.playerCards = this.root.querySelector("[data-blackjack-player-cards]");
        this.dealerScore = this.root.querySelector("[data-blackjack-dealer-score]");
        this.playerScore = this.root.querySelector("[data-blackjack-player-score]");
        this.status = this.root.querySelector("[data-blackjack-status]");
        this.hitButton = this.root.querySelector("[data-blackjack-hit]");
        this.standButton = this.root.querySelector("[data-blackjack-stand]");
    };

    BlackjackGate.prototype.bind = function () {
        var self = this;
        this.hitButton.addEventListener("click", function () {
            self.hit();
        });
        this.standButton.addEventListener("click", function () {
            self.stand();
        });
    };

    BlackjackGate.prototype.open = function (context) {
        this.context = context || {};
        this.active = true;
        this.title.textContent = context.title || "Blackjack Verification";
        this.subtitle.textContent = context.subtitle || "Win 2 out of 3.";
        this.overlay.classList.add("active");
        this.series = {
            wins: 0,
            losses: 0,
            rounds: 0
        };
        this.startRound();
    };

    BlackjackGate.prototype.close = function () {
        this.active = false;
        if (this.roundTimer) {
            window.clearTimeout(this.roundTimer);
            this.roundTimer = null;
        }
        this.overlay.classList.remove("active");
    };

    BlackjackGate.prototype.updateSubtitle = function () {
        if (!this.series) {
            return;
        }
        this.subtitle.textContent =
            "Win 2 out of 3. " +
            "W:" + this.series.wins + " L:" + this.series.losses + " R:" + this.series.rounds + "/3";
    };

    BlackjackGate.prototype.resetSeries = function () {
        this.series = {
            wins: 0,
            losses: 0,
            rounds: 0
        };
        this.updateSubtitle();
    };

    BlackjackGate.prototype.startRound = function () {
        if (this.roundTimer) {
            window.clearTimeout(this.roundTimer);
            this.roundTimer = null;
        }

        var deck = createDeck();
        this.state = {
            deck: deck,
            dealer: [deck.pop(), deck.pop()],
            player: [deck.pop(), deck.pop()],
            finished: false,
            result: null
        };

        this.status.className = "blackjack-status";
        this.status.textContent = "";
        this.setButtons(true);
        this.updateSubtitle();
        this.render(false);

        if (handValue(this.state.player) === 21) {
            this.stand();
        }
    };

    BlackjackGate.prototype.setButtons = function (playing) {
        this.hitButton.disabled = !playing;
        this.standButton.disabled = !playing;
    };

    BlackjackGate.prototype.draw = function (hand) {
        hand.push(this.state.deck.pop());
    };

    BlackjackGate.prototype.hit = function () {
        if (!this.active || this.state.finished) {
            return;
        }

        this.draw(this.state.player);
        this.render(false);

        if (handValue(this.state.player) > 21) {
            this.finish("loss");
        }
    };

    BlackjackGate.prototype.stand = function () {
        if (!this.active || this.state.finished) {
            return;
        }

        while (handValue(this.state.dealer) < 17) {
            this.draw(this.state.dealer);
        }

        var playerTotal = handValue(this.state.player);
        var dealerTotal = handValue(this.state.dealer);

        if (dealerTotal > 21 || playerTotal > dealerTotal) {
            this.finish("win");
            return;
        }

        if (playerTotal < dealerTotal) {
            this.finish("loss");
            return;
        }

        this.finish("loss");
    };

    BlackjackGate.prototype.finish = function (result) {
        this.state.finished = true;
        this.state.result = result;
        this.render(true);
        this.setButtons(false);
        this.status.className = "blackjack-status " + result;
        this.status.textContent = result === "win" ? "WIN" : "LOSE";

        if (!this.series) {
            this.resetSeries();
        }

        this.series.rounds += 1;
        if (result === "win") {
            this.series.wins += 1;
        } else {
            this.series.losses += 1;
        }
        this.updateSubtitle();

        if (this.series.wins >= 2) {
            if (this.callbacks.onWin) {
                this.roundTimer = window.setTimeout(this.callbacks.onWin.bind(this, this.context || {}), 700);
            }
            return;
        }

        if (this.series.losses >= 2 || this.series.rounds >= 3) {
            this.roundTimer = window.setTimeout(function () {
                this.resetSeries();
                this.startRound();
            }.bind(this), 1200);
            return;
        }

        this.roundTimer = window.setTimeout(this.startRound.bind(this), 900);
    };

    BlackjackGate.prototype.render = function (revealDealer) {
        revealDealer = !!revealDealer || this.state.finished;
        renderCards(this.dealerCards, this.state.dealer, revealDealer);
        renderCards(this.playerCards, this.state.player, true);

        this.playerScore.textContent = "Player total: " + handValue(this.state.player);
        if (revealDealer) {
            this.dealerScore.textContent = "Dealer total: " + handValue(this.state.dealer);
        } else {
            this.dealerScore.textContent = "Dealer total: ?";
        }
    };

    window.BlackjackGate = BlackjackGate;
})();
