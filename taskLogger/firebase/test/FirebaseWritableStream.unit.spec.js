const FireBaseWritableStream = require('../FirebaseWritableStream');
// const sinon = require('sinon');
const { expect } =  require('chai');

class FirebaseClientMock {
    child() { return this; }
    push() { return this; }
    key() { return Math.random().toString(36).substring(2); }
    update(data, callback) { callback(); }
}

const fireBaseWritableStreamOpts = Object.create({
    messageSizeLimitPerTimeUnit: 1 * 1024 * 1024, // 1 MB
    timeUnitLimitMs: 1000,
    batchSize: 5,
    debounceDelay: 500 // flush every 500 ms
});

const firebaseClientMock = new FirebaseClientMock();

describe('Firebase Writable Stream Tests', () => {

    let fireBaseWritableStream = new FireBaseWritableStream(firebaseClientMock, fireBaseWritableStreamOpts);
    // const sandbox = sinon.createSandbox();

    beforeEach(() => {
        fireBaseWritableStream = new FireBaseWritableStream(firebaseClientMock, fireBaseWritableStreamOpts);
    });

    afterEach(() => {
        fireBaseWritableStream.destroy();
        fireBaseWritableStream = undefined;
    });

    it('should successfully write message to logs batch', () => {
        const chunk = Buffer.from('some fake str', 'utf8');
        fireBaseWritableStream._write(chunk, 'utf8', () => {});
        expect(Object.keys(fireBaseWritableStream._logsBatch).length).to.be.equal(1);
        expect(fireBaseWritableStream._currentLogByteSize).to.be.equal(Buffer.byteLength(chunk));
    });

    it('should successfully write messages to logs batch and flush to firebase', () => {
        for (let i = 0; i < fireBaseWritableStreamOpts.batchSize; i += 1) {
            fireBaseWritableStream._write(Buffer.from('some fake str', 'utf8'), 'utf8', () => {});
        }
        expect(Object.keys(fireBaseWritableStream._logsBatch).length).to.be.equal(0);
    });

    /* it('should successfully flush to firebase after message size per unit time has exceeded', () => {
        expect(Object.keys(fireBaseWritableStream._logsBatch).length).to.be.equal(0);
    }); */

    it('should successfully write message to logs batch and flush to firebase after debounce delay', (done) => {
        fireBaseWritableStream._write(Buffer.from('some fake str', 'utf8'), 'utf8', () => {});
        setTimeout(() => {
            expect(Object.keys(fireBaseWritableStream._logsBatch).length).to.be.equal(0);
            done();
        }, fireBaseWritableStreamOpts.debounceDelay + 10);
    });

});