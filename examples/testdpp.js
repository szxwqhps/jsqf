/**
 * Copyright (c) 2014, Wanqiang Xia. All rights reserved.
 *
 * This program is open source software: you can redistribute it and/or
 * modify it under the terms of the BSD 2-Clause license.
 *
 * This program is a javascript implementation of QP framework. You can visit QP
 * website (http://www.state-machine.com) for more information
 */

var dpp = require('./dpp'),
    QF = require('../lib/QF'),
    QEvent = require('../lib/QHsm').QEvent,
    rl = require('readline').createInterface(process.stdin, process.stdout),
    i = 0,
    p = null;

QF.init(20);

rl.on('SIGINT', function() {
    QF.publish(new QEvent(dpp.DPP_TERMINATE));
    QF.stop();	// end here!
    rl.close();
});

for (i = 0; i < dpp.PHILO_NUMBER; i++) {
    p = new dpp.Philo(i);
    dpp.getPhilos().push(p);
    QF.startActive(p, i + 1);
}

p = new dpp.Table();
dpp.setTable(p);
QF.startActive(p, dpp.PHILO_NUMBER + 1);

QF.run();