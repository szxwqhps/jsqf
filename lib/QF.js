/**
 * Created by xiawanqiang on 14-5-1.
 */

/**
 * QF, defines the active object framework
 */

var QEvent = require('./QHsm').QEvent,
    QF_TICK_RATE = 10;

var QF = {
    subscribes: {},

    activeObjects: [],

    timeEvents: [],

    timerId: 0,

    tickRate: QF_TICK_RATE,

    init: function(tick) {
        QF.subscribes = {};
        QF.activeObjects = [];
        QF.timeEvents = [];
        QF.tickRate = tick;
        QF.timerId = 0;
    },

    run: function() {
        QF.onStartup();
        QF.timerId = setInterval(QF.tick, QF.tickRate);
    },

    startActive: function(ao, priority) {
        if (QF.activeObjects.indexOf(ao) === -1) {
            ao.priority = priority;
            QF.activeObjects.push(ao);
            QF.activeObjects.sort(function(a, b) {
                return a.priority - b.priority;
            });
            ao.init(null);
        }
    },

    stopActive: function(ao) {
        var pos = QF.activeObjects.indexOf(ao);
        if (pos !== -1) {
            QF.activeObjects.splice(pos, 1);
        }
    },

    arm: function(te, interval, repeat) {
        if (QF.timeEvents.indexOf(te) === -1) {
            te.interval = interval;
            te.repeat = repeat;
            te.lastTick = Date.now();
            QF.timeEvents.push(te);
        }
    },

    disarm: function(te) {
        var pos = QF.timeEvents.indexOf(te);
        if (pos !== -1) {
            QF.timeEvents.splice(pos, 1);
        }
    },

    subscribe: function(ao, signal) {
        var subs = QF.subscribes[signal];
        if (!subs) {
            QF.subscribes[signal] = [];
            subs = QF.subscribes[signal];
        }

        if (subs.indexOf(ao) === -1) {
            subs.push(ao);
        }
    },

    unsubscribe: function(ao, signal) {
        var subs = QF.subscribes[signal],
            pos = 0;

        if (!subs) {
            return;
        }

        pos = subs.indexOf(ao);
        if (pos !== -1) {
            subs.splice(pos, 1);
        }
    },

    unsubscribeAll: function(ao) {
        var pos = 0,
            p,
            subs = [];

        for (p in QF.subscribes) {
            if (QF.subscribes.hasOwnProperty(p) &&
                QF.subscribes[p] instanceof Array ) {
                subs = QF.subscribes[p];
                pos = subs.indexOf(ao);
                if (pos !== -1) {
                    subs.splice(pos, 1);
                }
            }
        }
    },

    publish: function(e) {
        var i = 0,
            length = 0,
            subs = QF.subscribes[e.signal];

        if (!subs) {
            return;
        }

        for (i = 0, length = subs.length; i < length; i++) {
            subs[i].postFifo(e);
        }
    },

    tick: function() {
        var i = 0,
            length = QF.timeEvents.length,
            te = null,
            timeNow = Date.now();

        for (i = length - 1; i >= 0; i--) {
            te = QF.timeEvents[i];
            if ((timeNow - te.lastTick) >= te.interval) {
                te.activeObject.postFifo(new QEvent(te.signal, null, te.activeObject));
                if (te.repeat) {
                    te.lastTick = timeNow;
                } else {
                    QF.timeEvents.splice(i, 1);	// remove
                }
            }
        }

        QF.schedule();
    },

    schedule: function() {
        var i = 0,
            e = null,
            ao = null,
            length = QF.activeObjects.length;

        for (i = length - 1; i >= 0; i--) {
            ao = QF.activeObjects[i];
            e = ao.getEvent();
            while (e !== null) {
                ao.dispatch(e);
                e = ao.getEvent();
            }
        }
    },

    onStartup: function() {
        console.log('QF Startup!');
    },

    stop: function() {
        QF.onCleanup();
        clearInterval(QF.timerId);
    },

    onCleanup: function() {
        console.log('QF Cleanup');
    }
};

module.exports = QF;