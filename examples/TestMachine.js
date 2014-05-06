/**
 * Copyright (c) 2014, Wanqiang Xia. All rights reserved.
 *
 * This program is open source software: you can redistribute it and/or
 * modify it under the terms of the BSD 2-Clause license.
 *
 * This program is a javascript implementation of QP framework. You can visit QP
 * website (http://www.state-machine.com) for more information
 */

var qhsm = require('../lib/QHsm'),
    QActive = require('../lib/QActive'),
    QF = require('../lib/QF'),
    QHsm = qhsm.QHsm,
    QState = qhsm.QState,
    util = require('util');

var TestMachine = function() {
    var self = this,
        foo = false;

    var initial = new QState(function(e) {
        console.log('In initial.');
        foo = false;
        console.log('Transfer to s2');
        return self.transfer(s2);
    });

    var terminate = new QState(QHsm.handled, QHsm.top, function() {
        console.log('In terminate.');
        QF.stopActive(self);	// remove from QF
    });

    var s = new QState(function(e) {
        switch (e.signal) {
            case 'tm:e':
                console.log('s - e');
                console.log('Transfer to s11');
                return self.transfer(s11);
            case 'tm:terminate':
                console.log('s - terminate');
                console.log('Transfer to terminate');
                return self.transfer(terminate);
        }

        return QHsm.unhandled();
    },  QHsm.top, function() {
        console.log('Enter s.');
    }, function() {
        console.log('Exit s.');
    }, function() {
        console.log('Init s.');
        if (foo) {
            foo = false;
            console.log('Transfer to s11');
            return self.transfer(s11);
        }
        return QHsm.handled();
    });

    var s1 = new QState(function(e) {
        switch (e.signal) {
            case 'tm:b':
                console.log('s1 - b');
                console.log('Transfer to s11');
                return self.transfer(s11);
            case 'tm:d':
                if (!foo) {
                    console.log('s1 - d');
                    foo = true;
                    console.log('Transfer to s');
                    return self.transfer(s);
                }
                return QHsm.unhandled();
            case 'tm:c':
                console.log('s1 - c');
                console.log('Transfer to s2');
                return self.transfer(s2);
            case 'tm:a':
                console.log('s1 - a');
                console.log('Self transfer to s1');
                return self.transfer(s1);
            case 'tm:f':
                console.log('s1 - f');
                console.log('Transfer to s211');
                return self.transfer(s211);
        }

        return QHsm.unhandled();
    }, s, function() {
        console.log('Enter s1.');
    }, function() {
        console.log('Exit s1.');
    }, function() {
        console.log('Init s1.');
        console.log('Transfer to s11');
        return self.transfer(s11);
    });

    var s11 = new QState(function(e) {
        switch (e.signal) {
            case 'tm:d':
                if (foo) {
                    console.log('s11 - d');
                    console.log('Transfer to s1');
                    foo = false;
                    return self.transfer(s1);
                }
                return QHsm.unhandled();
            case 'tm:h':
                console.log('s11 - h');
                console.log('Transfer to s');
                return self.transfer(s);
            case 'tm:g':
                console.log('s11 - g');
                console.log('Transfer to s211');
                return self.transfer(s211);
        }

        return QHsm.unhandled();
    }, s1, function() {
        console.log('Enter s11.');
    }, function() {
        console.log('Exit s11.');
    });

    var s2 = new QState(function(e) {
        switch (e.signal) {
            case 'tm:c':
                console.log('s2 - c');
                console.log('Transfer to s1');
                return self.transfer(s1);
            case 'tm:f':
                console.log('s2 - f');
                console.log('Transfer to s11');
                return self.transfer(s11);
        }

        return QHsm.unhandled();
    }, s, function() {
        console.log('Enter s2.');
    }, function() {
        console.log('Exit s2.');
    }, function() {
        console.log('Init s2.');
        if (!foo) {
            foo = true;
            console.log('Transfer to s211');
            return self.transfer(s211);
        }
        return QHsm.handled();
    });

    var s21 = new QState(function(e) {
        switch (e.signal) {
            case 'tm:a':
                console.log('s21 - a');
                console.log('Self transfer to s21');
                return self.transfer(s21);
            case 'tm:g':
                console.log('s21 - g');
                console.log('Transfer to s11');
                return self.transfer(s11);
            case 'tm:b':
                console.log('s21 - b');
                console.log('Transfer to s211');
                return self.transfer(s211);
        }

        return QHsm.unhandled();
    }, s2, function() {
        console.log('Enter s21.');
    }, function() {
        console.log('Exit s21.');
    }, function() {
        console.log('Init s21.');
        console.log('Transfer to s211');
        return self.transfer(s211);
    });

    var s211 = new QState(function(e) {
        switch (e.signal) {
            case 'tm:d':
                console.log('s211 - d');
                console.log('Transfer to s21');
                return self.transfer(s21);
            case 'tm:h':
                console.log('s211 - h');
                console.log('Transfer to s');
                return self.transfer(s);
        }

        return QHsm.unhandled();
    }, s21, function() {
        console.log('Enter s211.');
    }, function() {
        console.log('Exit s211.');
    });

    QActive.call(self, initial);
};

util.inherits(TestMachine, QActive);

module.exports = TestMachine;