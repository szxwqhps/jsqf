/**
 * Created by xiawanqiang on 14-5-1.
 */


var	QF = require('../lib/QF'),
    QEvent = require('../lib/QHsm').QEvent,
    TestMachine = require('./testMachine'),
    rl = require('readline').createInterface(process.stdin, process.stdout),
    machine = new TestMachine();

QF.init(50);

QF.startActive(machine, 1);

rl.on('line', function(line) {
    var l = line.trim().toLowerCase();
    switch (l) {
        case 'a':
            console.log('Send event A');
            machine.postFifo(new QEvent('tm:a'));
            break;
        case 'b':
            console.log('Send event B');
            machine.postFifo(new QEvent('tm:b'));
            break;
        case 'c':
            console.log('Send event C');
            machine.postFifo(new QEvent('tm:c'));
            break;
        case 'd':
            console.log('Send event D');
            machine.postFifo(new QEvent('tm:d'));
            break;
        case 'e':
            console.log('Send event E');
            machine.postFifo(new QEvent('tm:e'));
            break;
        case 'f':
            console.log('Send event F');
            machine.postFifo(new QEvent('tm:f'));
            break;
        case 'g':
            console.log('Send event G');
            machine.postFifo(new QEvent('tm:g'));
            break;
        case 'h':
            console.log('Send event H');
            machine.postFifo(new QEvent('tm:h'));
            break;
        case 'exit':
            console.log('exit the app.');
            machine.postLifo(new QEvent('tm:terminate'));
            rl.close();
            QF.stop();
            break;
        default:
            break;
    }
});

QF.run();
