'use strict';
const VM = require('vm2').VM;
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

console.log("-------------------------------------------------------------");

function checkVM2() {
  console.time('Creating VM2');
  const event = { a: 1};
  const context = { b: 2};
  const vm = new VM({
    timeout: 1000,
    console: 'inherit',
    sandbox: {module: module, console: console, event: event, context: context},
    require: {
      external: true,
      builtin: ['fs', 'path'],
      root: "./"
    },
    compiler: 'javascript'
  });
  console.timeEnd('Creating VM2');

  console.log("-------------------------------------------------------------");
  console.time('Running VM2');
  const result = vm.run(`
    for (let a = 1; a < 10000000; a++) {

    }
    // return 'I am returned from Inside VM2';
  `);
  console.timeEnd('Running VM2');

  console.log("-------------------Way 1------------------------------------------");
  let scriptToRun = `function hey() {
    // console.log(process.env); // Throws Error on compilation.
    // while(true) {};
    console.log('I am yet another function inside VM');
  }
  function handler(event, context) {
    console.log('Event: ', event);
    console.log('Context: ', context);
    hey();
  }`;
  scriptToRun += ` module.exports = function main(event, context) {
    handler(event, context);
  }`;
  // Sync
  const mainMethod = vm.run(`${scriptToRun}`);
  mainMethod('I am Event from Outside', 'I am Context from Outside');
  console.log("--------------------Way 2-----------------------------------------");

  let scriptToRun2 = `function hey() {
    // console.log(process.env); // Throws Error on compilation.
    // while(true) {};
    console.log('I am yet another function inside VM');
  }
  function handler(event, context) {
    event['c'] = 3;
    console.log('Event: ', event);
    console.log('Context: ', context);
    hey();
  }`;
  scriptToRun2 += ` 
  handler(event, context);`;
  // Sync
  vm.run(`${scriptToRun2}`);
  console.log('Event : ', event);

  console.log("-------------------------------------------------------------");
  // Async
  let functionWithCallbackInSandbox = vm.run(`module.exports = function(who, callback) {  
    console.log('Hey outside Callback');
    callback('Hello '+ who); 
  }`);
  functionWithCallbackInSandbox('world', (greeting) => {
    console.log('CallBack');
    console.log(greeting);
  });
}

console.time('VM2');
checkVM2();
console.timeEnd('VM2');
