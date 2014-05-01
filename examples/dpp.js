/**
 * dpp, dinner of philosophy problem
 * Created by xiawanqiang on 14-5-1.
 */

var qhsm = require('../lib/QHsm'),
    QActive = require('../lib/QActive'),
    QF = require('../lib/QF'),
    QHsm = qhsm.QHsm,
    QState = qhsm.QState,
    QEvent = qhsm.QEvent,
    QTimeEvent = qhsm.QTimeEvent,

    assert = require('assert'),
    util = require('util'),

    PHILO_NUMBER = 5,
    THINK_TIME = 3000,
    EAT_TIME = 2000,
    DPP_DONE = 'dpp:done',
    DPP_HUNGRY = 'dpp:hungry',
    DPP_EAT = 'dpp:eat',
    DPP_TIMEOUT = 'dpp:timeout',
    DPP_TERMINATE = 'dpp:terminate',
    FORK_FREE = 0,
    FORK_USED = 1,

    table = null,
    philos = [];

var busyDelay = function(n) {
    var timeNow = Date.now();
    while ((Date.now() - timeNow) < n) {
    }
};

var displayStat = function(n, s) {
    console.log('philosophy ' + n + ' is ' + s);
};

// Table class
var Table = function() {
    var forks = new Array(PHILO_NUMBER),
        isHungry = new Array(PHILO_NUMBER),
        self = this,
        i = 0;

    var left = function(n) {
        return (n + 1) % PHILO_NUMBER;
    };

    var right = function(n) {
        return (n + PHILO_NUMBER - 1) % PHILO_NUMBER;
    };

    var initial = new QState(function(e) {
        QF.subscribe(self, DPP_DONE);
        QF.subscribe(self, DPP_TERMINATE);
        return self.transfer(serving);
    });

    var terminate = new QState(QHsm.handled,  QHsm.top, function() {
        QF.unsubscribeAll(self);
        QF.stopActive(self);
        return QHsm.handled();
    });

    var serving = new QState(function(e) {
        var n = 0,
            m = 0;

        switch (e.signal) {
            case DPP_HUNGRY:
                n = e.data;
                assert.ok(n < PHILO_NUMBER);
                busyDelay(5);
                displayStat(n, 'hungry');
                m = left(n);
                if (forks[m] === FORK_FREE && forks[n] === FORK_FREE) {
                    forks[m] = FORK_USED;
                    forks[n] = FORK_USED;
                    QF.publish(new QEvent(DPP_EAT, n, self));
                    displayStat(n, 'eating');
                } else {
                    isHungry[n] = true;
                }
                return QHsm.handled();
            case DPP_DONE:
                busyDelay(5);
                n = e.data;
                assert.ok(n < PHILO_NUMBER && !isHungry[n]);

                m = left(n);
                assert.ok(forks[n] === FORK_USED && forks[m] === FORK_USED);
                forks[n] = FORK_FREE;
                forks[m] = FORK_FREE;

                // check right side
                m = right(n);
                if (isHungry[m] && forks[m] === FORK_FREE) {
                    forks[m] = FORK_USED;
                    forks[n] = FORK_USED;
                    isHungry[m] = false;
                    QF.publish(new QEvent(DPP_EAT, m, self));
                    displayStat(m, 'eating');
                }

                // check left side
                m = left(n);
                n = left(m);
                if (isHungry[m] && forks[n] === FORK_FREE) {
                    forks[m] = FORK_USED;
                    forks[n] = FORK_USED;
                    isHungry[m] = false;
                    QF.publish(new QEvent(DPP_EAT, m, self));
                    displayStat(m, 'eating');
                }
                return QHsm.handled();
            case DPP_TERMINATE:
                return self.transfer(terminate);
        }

        return QHsm.unhandled();
    });

    for (i = 0; i < PHILO_NUMBER; i++) {
        forks[i] = FORK_FREE;
        isHungry[i] = false;
    }

    QActive.call(this, initial);
};

util.inherits(Table, QActive);

// Philo class
var Philo = function(id) {
    var self = this,
        timeoutEvent = new QTimeEvent(self, DPP_TIMEOUT);

    var initial = new QState(function(e) {
        QF.subscribe(self, DPP_EAT);
        return self.transfer(thinking);
    });

    var thinking = new QState(function(e) {
        switch (e.signal) {
            case DPP_TIMEOUT:
                busyDelay(5);
                return self.transfer(hungry);
            case DPP_DONE:
                return QHsm.handled();
            case DPP_EAT:
                return QHsm.handled();
        }

        return QHsm.unhandled();
    }, QHsm.top, function() {
        QF.arm(timeoutEvent, THINK_TIME, false);
        return QHsm.handled();
    });

    var hungry = new QState(function(e) {
        switch (e.signal) {
            case DPP_DONE:
                return QHsm.handled();
            case DPP_EAT:
                if (e.data === self.id) {
                    busyDelay(5);
                    return self.transfer(eating);
                }
                return QHsm.handled();
        }

        return QHsm.unhandled();
    }, QHsm.top, function() {
        table.postFifo(new QEvent(DPP_HUNGRY, self.id, self));
        return QHsm.handled();
    });

    var eating = new QState(function(e) {
        switch (e.signal) {
            case DPP_TIMEOUT:
                busyDelay(5);
                return self.transfer(thinking);
            case DPP_DONE:
                assert.ok(e.data !== self.id);
                return QHsm.handled();
            case DPP_EAT:
                assert.ok(e.data !== self.id);
                return QHsm.handled();
        }

        return QHsm.unhandled();
    }, QHsm.top, function() {
        QF.arm(timeoutEvent, EAT_TIME, false);
        return QHsm.handled();
    }, function() {
        QF.publish(new QEvent(DPP_DONE, self.id, self));
        return QHsm.handled();
    });

    this.id = id;
    QActive.call(this, initial);
};

util.inherits(Table, QActive);

module.exports.Table = Table;
module.exports.Philo = Philo;
module.exports.PHILO_NUMBER = PHILO_NUMBER;
module.exports.DPP_TERMINATE = DPP_TERMINATE;
module.exports.getTable = function() {
    return table;
};

module.exports.setTable = function(t) {
    table = t;
};

module.exports.getPhilos = function() {
    return philos;
};