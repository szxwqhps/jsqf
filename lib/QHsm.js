/**
 * Copyright (c) 2014, Wanqiang Xia. All rights reserved.
 *
 * This program is open source software: you can redistribute it and/or
 * modify it under the terms of the BSD 2-Clause license.
 *
 * This program is a javascript implementation of QP framework. You can visit QP
 * website (http://www.state-machine.com) for more information
 */

var assert = require('assert'),
    RET_HANDLED = 0,
    RET_IGNORED = 1,
    RET_TRANSFER = 2,
    RET_SUPER = 3,
    RET_UNHANDLED = 4,
    top = null;


var ignored = function() {
    return RET_IGNORED;
};

var handled = function() {
    return RET_HANDLED;
};

var unhandled = function() {
    return RET_UNHANDLED;
};

/*
 * handler required, other optional
 */
var QState = function(handler, parent, entry, exit, init) {
    this.handler = handler;

    if (typeof parent === 'undefined') {
        this.parent = top;
    } else {
        this.parent = parent;
    }

    this.entry = entry || handled;
    this.exit = exit || handled;
    this.init = init || handled;
};

var top = new QState(ignored, null);

/*
 * signal required, other optional
 */
var QEvent = function(signal, data, sender) {
    this.signal = signal;

    if (typeof data === 'undefined') {
        this.data = null;
    } else {
        this.data = data;
    }

    if (typeof sender === 'undefined') {
        this.sender = null;
    } else {
        this.sender = sender;
    }
};

/*
 * ao, signal, all required
 */
var QTimeEvent = function(ao, signal) {
    this.lastTick = Date.now();
    this.activeObject = ao;
    this.signal = signal;
    this.interval = 0;
    this.repeat = false;
};



/*
 * QHsm, defines the Hierarchical State Machine (HSM)
 */
var QHsm = function(initial) {
    var state = top,
        target = initial;

    var findLca = function(p, q) {
        var ps = [],
            qs = [],
            t = top;

        ps.push(p);
        qs.push(q);

        while (p !== top) {
            p = p.parent;
            ps.push(p);
        }

        while(q !== top) {
            q = q.parent;
            qs.push(q);
        }

        while (ps.length > 0 && qs.length > 0) {
            p = ps.pop();
            q = qs.pop();
            if (p === q) {
                t = p;
            } else {
                break;
            }
        }

        return t;
    };

    this.transfer = function(t) {
        target = t;
        return RET_TRANSFER;
    };

    this.init = function(e) {
        var s = state,
            t = target,
            i = 0,
            r = RET_HANDLED,
            path = [];

        r = t.handler(e);

        do {                             // drill into the target...
            path = [];
            path.push(target);
            t = target.parent;
            while (s !== t) {
                path.push(t);
                t = t.parent;
            }

            for (i = path.length - 1; i >= 0; i--) {
                path[i].entry();
            }

            s = target;
        } while (s.init() === RET_TRANSFER);

        state = s;                            // change the current active state
        target  = s;                           // mark the configuration as stable
    };

    //
    this.dispatch = function(e) {
        var s = state,
            t = target,
            p = top,
            r = RET_HANDLED,
            entries = [],
            exits = [];

        assert(s === t, 'state msut be stable!');
        r = t.handler(e);
        while (r === RET_UNHANDLED) {
            t = t.parent;
            r = t.handler(e);
        }

        if (r === RET_TRANSFER) {
            // current -> transfer source, exit
            while (s !== t) {
                exits.push(s);
                s = s.parent;
            }

            if (s === target) {	// self transfer
                exits.push(s);
                entries.push(s);
            } else {
                // Lca p
                p = findLca(s, target);

                // source -> p, exit
                while (s !== p) {
                    exits.push(s);
                    s = s.parent;
                }

                // target -> p, entries
                s = target;
                while (s !== p) {
                    entries.push(s);
                    s = s.parent;
                }
            }

            // do exists
            while (exits.length > 0) {
                s = exits.shift();
                s.exit();
            }

            // do entries
            while (entries.length > 0) {
                t = entries.pop();
                t.entry();
            }

            // drill in target, init
            t = target;
            while (t.init() === RET_TRANSFER) {
                entries = [];
                entries.push(target);
                s = target.parent;
                while (s !== t) {
                    entries.push(s);
                    s = s.parent;
                }

                while (entries.length > 0) {
                    entries.pop().entry();
                }

                t = target;
            }

            state = t;
            target = t;
        }
    };

    this.isIn = function(s) {
        var p = state;

        while (p !== top) {
            if (p === s) {
                return true;
            }
            p = p.parent;
        }

        return false;
    };
};

QHsm.top = top;
QHsm.ignored = ignored;
QHsm.handled = handled;
QHsm.unhandled = unhandled;

module.exports.QState = QState;
module.exports.QEvent = QEvent;
module.exports.QTimeEvent = QTimeEvent;
module.exports.QHsm = QHsm;