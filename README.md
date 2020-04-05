# Introduction 

minst is a minimalistic state manager that is intended to be super simple to use 
and avoid boilerplate code as much as possible. It is also supposed to utilize
latest features of modern JavaScript language, thus it's not compatible with pre-ES6 
runtimes.

# Getting Started

1. Installation

`npm install minst`

2. Usage

Inside `moduleA.js`:
```
// moduleA.js
import stateManager from "minst";

// get state that one wants to use, open it in ReadWrite mode by providing
// writerName
let sampleState = stateManager.getState("sample", "writerName");

// modify state:
sampleState.field1 = 10;
```
Inside `moduleB.js`:
```
// moduleB.js
import stateManager from "minst";

// get state in ReadOnly mode by not providing writerName parameter:
let sampleState = stateManager.getState("sample");

// subscribe to all state changes:
stateManager.subscribe("sample", (previousValue, newValue, writerName) => {
    console.log("State has changed!");
    console.log(`Previous value: ${JSON.stringify(previousValue)}`);
    console.log(`New value: ${JSON.stringify(newValue)}`);
    console.log(`Changes done by: ${writerName}`);
});
```

# Motivation

Why use minst instead of currently existing state managers?
Currently JavaScript frameworks are very complex and thus require 
many time spent on learning and troubleshooting issues. For instance, 
state managers require you to define stores, commands, queries
and introducing additional layers to your application. With ES6 Javascript 
has changed significantly and it's possible to write complex
applications without using complex tools. However, it still lacks simple to
use 'observable' capabilities and that's where minst is supposed to shine.
It saves you from writing some boilerplate code.

To summarize:

Because it's way simpler => lowers development cost
Because it supports modern JavaScript
Because you don't need to support pre-ES6 runtimes 
(older browsers like IE for instance)*

*If for any reason you need to support older runtimes - you will most likely
need to stick to current frameworks and tools.

# Build and Test

```
npm i
npm run test
```

# Contribute

You are more then welcome to submit a PR. Especially if it's about bugfix.
In case of new features, please submit an issue first to discuss it.

This project is supposed to be minimalistic and way simpler then currently
available state managers, so new features need to be carefully discussed