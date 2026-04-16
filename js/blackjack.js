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
        this.replayButton = this.root.querySelector("[data-blackjack-replay]");
        this.cancelButton = this.root.querySelector("[data-blackjack-cancel]");
    };

    BlackjackGate.prototype.bind = function () {
        var self = this;
        this.hitButton.addEventListener("click", function () {
            self.hit();
        });
        this.standButton.addEventListener("click", function () {
            self.stand();
        });
        this.replayButton.addEventListener("click", function () {
            self.startRound();
        });
        this.cancelButton.addEventListener("click", function () {
            self.close();
            if (self.callbacks.onCancel) {
                self.callbacks.onCancel();
            }
        });
    };

    BlackjackGate.prototype.open = function (context) {
        this.context = context || {};
        this.active = true;
        this.title.textContent = context.title || "Blackjack Verification";
        this.subtitle.textContent = context.subtitle || "Win one round to continue.";
        this.overlay.classList.add("active");
        this.startRound();
    };

    BlackjackGate.prototype.close = function () {
        this.active = false;
        this.overlay.classList.remove("active");
    };

    BlackjackGate.prototype.startRound = function () {
        var deck = createDeck();
        this.state = {
            deck: deck,
            dealer: [deck.pop(), deck.pop()],
            player: [deck.pop(), deck.pop()],
            finished: false,
            result: null
        };

        this.status.className = "blackjack-status";
        this.status.textContent = "Your verification round has started. Beat the dealer to unlock submit.";
        this.setButtons(true);
        this.replayButton.disabled = true;
        this.render(false);

        if (handValue(this.state.player) === 21) {
            this.stand();
        }
    };

    BlackjackGate.prototype.setButtons = function (playing) {
        this.hitButton.disabled = !playing;
        this.standButton.disabled = !playing;
        this.cancelButton.disabled = playing;
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
            this.finish("loss", "Bust. You went over 21, so submit stays locked.");
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
            this.finish("win", "You beat the dealer. Submit is now unlocked.");
            return;
        }

        if (playerTotal < dealerTotal) {
            this.finish("loss", "Dealer wins this round. Play again to continue.");
            return;
        }

        this.finish("push", "Push. A tie does not unlock submit, so you need another round.");
    };

    BlackjackGate.prototype.finish = function (result, message) {
        this.state.finished = true;
        this.state.result = result;
        this.render(true);
        this.setButtons(false);
        this.replayButton.disabled = false;
        this.status.className = "blackjack-status " + result;
        this.status.textContent = message;

        if (result === "win" && this.callbacks.onWin) {
            this.callbacks.onWin(this.context || {});
        }
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
