*This doc is work in progress and will be completed in the near future*

Tests
-----

```  
scripts\run-tests
```
  
Front-end Development
-----------

Build all front-end files files from client to wwwroot. This build will
- Clean the output foledr (wwwroot)
- Transpile ES6 and ES7 to ES5 with babel
- Combine all necessary modules into a single JS file with Browserify.
- Copy static js and css files
- 

```
gulp build
```

Watch for changes in JS files and build.
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
