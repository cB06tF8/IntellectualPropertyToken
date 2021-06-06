//import { assert } from 'chai';
const chai = require("./SetupChai.js");
const assert = chai.assert;

async function inLogs(logs, eventName) {
  const event = logs.find(e => e.event === eventName);
  assert.exists(event);
}
exports.inLogs = inLogs;

async function inTransaction(tx, eventName) {
  const { logs } = await tx;
  return inLogs(logs, eventName);
}
exports.inTransaction = inTransaction;
//exports default inTransaction;
