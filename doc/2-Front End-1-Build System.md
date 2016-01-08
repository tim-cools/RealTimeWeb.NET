Front-end Development
---------------------
Modern web-application consist of large part JavaScript code these days. The tools improved drastically the last years.

A whole range of JavaScript files are available to use these days. You could argue a little too much as pointed out in <technology radar link>. These libraries are managed by npm, the node package manager.

The main library in RealTimeWeb are
- React, a client side library developed by Facebook, for creating a single page application
- Redux for managing state in the javascript application
- React bootstrap enabling the usage of the Twitter Bootstrap library from React

<Add text why a build tool is needed>

Front-End command line tools
----------------------------

To build all front-end files files from client to wwwroot we us a build script:

```
gulp build
```

Watch for changes in JS files and build
```
gulp build-watch
```

Build only development files
```
gulp build-dev
```

Run all JS tests:

```  
npm test
```

Run all JS tests and watch for changes:
  
```  
npm test-watch
```

Run all JS tests and check for coverage:
  
```  
npm test-coverage
```

Gulp scripts
------------
Gulp is a node.js task runner that supports many plug-ins. It is used to create build tasks and  The most important plug-ins used are browserify and babelify. Browserify combines all javascripts in a single file. And babelify transpilesw ES6 to JavaScript to enable the usage of new JS features and syntaxes.

Combining browserify and babelify to build the react application:

<add script>

Building the vendor external files. 

<add script>
