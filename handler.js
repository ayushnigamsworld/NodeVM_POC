const {NodeVM} = require('vm2');
const requestMe = require('request');

function looseJsonParse(obj) {
  return Function(`"use strict";return ( ${obj} )`)();
}

function checkLooseJson() {
  const script = (event, context) => {
    for (let a = 1; a < 10000000; a++) {

    }
    console.log('Hi inside LooseJSONPARse');
  };
  const toRun = looseJsonParse(`{handle: ${script} }`);
  toRun.handle({a: 1}, {b: 2});
}

console.time('LooseJSONParse');
checkLooseJson();
console.timeEnd('LooseJSONParse');

function checkVM2() {
  console.time('Creating VM2');
  const vm = new NodeVM({
    console: 'inherit',
    sandbox: {},
    require: {
      external: true,
      builtin: ['fs', 'path'],
      root: "./",
      mock: {
        fs: {
          readFileSync() { return 'Nice try!'; }
        }
      }
    },
    wrapper: 'none'
  });
  console.timeEnd('Creating VM2');

  console.time('Running VM2');
  const result = vm.run(`
    for (let a = 1; a < 10000000; a++) {

    }
    return 'I am returned from Inside VM2';
  `);
  console.log('Result from VM2: ', result);
  console.timeEnd('Running VM2');

  // Sync
  let functionInSandbox = vm.run("module.exports = function(who) { console.log('hello '+ who); }");
  functionInSandbox('world');

  // Async
  let functionWithCallbackInSandbox = vm.run("module.exports = function(who, callback) { callback('hello '+ who); }");
  functionWithCallbackInSandbox('world', (greeting) => {
    console.log(greeting);
  });
}

console.time('VM2');
checkVM2();
console.timeEnd('VM2');
