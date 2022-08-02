var chai = require('chai')
var [expect, should] = [chai.expect, chai.should()]

chai.config.truncateThreshold = 0

var XScanner = require('./index')

var xs

testText = 'Hello, World'
goodString = 'Hello'
goodStringCI = goodString.toLowerCase()
badString = 'wrong'
goodRegex = /[a-zA-Z]+/
goodRegexCI = /[a-z]+/
badRegex = /wrong/
testEnumOutput = 'greeting'

testPointerName = 'test pointer'
testTypeName = 'test type'
testMacroName = 'test macro'


console.log(`
  Key For Mode Names:
  N = Normal Mode
  I = Case Insensitive Mode
  C = Complex Mode`.trim().replaceAll('\n', ''))

describe('XScanner', function() {
  beforeEach(function() {
    xs = new XScanner(testText)
  })

  describe('setCaseInsensitive', function() {
    it('sets caseInsensitive to true', function() {
      xs.setCaseInsensitive(true)
      xs.caseInsensitive.should.be.true
    })

    it('sets caseInsensitive to false', function() {
      xs.setCaseInsensitive(false)
      xs.caseInsensitive.should.be.false
    })
  })

  describe('setComplexOutput', function() {
    it('sets complexOutput to true', function() {
      xs.setComplexOutput(true)
      xs.complexOutput.should.be.true
    })
    
    it('sets complexOutput to false', function() {
      xs.setComplexOutput(false)
      xs.complexOutput.should.be.false
    })
  })

  describe('savePointer', function() {
    it('saves the current state of the scanner as a pointer', function() {
      xs.scan(goodString)

      expect(xs.pointers[testPointerName]).to.not.exist

      let savedPointer = xs.savePointer(testPointerName)

      // Test to make sure created pointer data is correct.
      xs.pointers[testPointerName].should.exist
      savedPointer.should.equal(xs.pointers[testPointerName])
      xs.pointers[testPointerName].pos.should.equal(goodString.length)
      xs.pointers[testPointerName].lastPos.should.equal(0)
      xs.pointers[testPointerName].lastMatch.should.equal(goodString)

      xs.pos.should.equal(savedPointer.pos)
      xs.lastPos.should.equal(savedPointer.lastPos)
      xs.lastMatch.should.equal(savedPointer.lastMatch)
    })

    it('saved state is different after scanner changes its state', function() {
      xs.scan(goodString)

      expect(xs.pointers[testPointerName]).to.not.exist
      xs.savePointer(testPointerName)
      xs.pointers[testPointerName].should.exist

      xs.undoLastMovement()

      xs.pointers[testPointerName].should.exist

      let savedPointer = xs.pointers[testPointerName]

      xs.pos.should.not.equal(savedPointer.pos)
      // Last match for both is 0, so this should match.
      xs.lastPos.should.equal(savedPointer.lastPos)
      expect(xs.lastMatch).to.not.equal(savedPointer.lastMatch)
    })
  })

  describe('loadPointer', function() {
    it('should load an existing pointer', function() {
      let pointer = xs.savePointer('start')
      xs.pointers['start'].should.exist

      xs.scan(goodString)

      xs.loadPointer('start')

      xs.pos.should.equal(pointer.pos)
      xs.lastPos.should.equal(pointer.lastPos)
      expect(xs.lastMatch).to.equal(pointer.lastMatch)
    })

    //! Referencing a nonexistent pointer is not allowed.
    it('should throw an error if pointer does not exist', function() {
      let threwError = false
      
      try { xs.loadPointer(testPointerName) }
      catch (error) { threwError = true }

      threwError.should.be.true
    })

    it('should override a pre-existing pointer if needed', function() {
      let startPointer = xs.savePointer(testPointerName)

      xs.scan(goodString)

      xs.savePointer(testPointerName)

      startPointer.should.not.deep.equal(xs.pointers[testPointerName])
    })
  })

  describe('addType', function() {
    it('should save the given type to the XScanner', function() {
      expect(xs.types[testTypeName]).to.not.exist

      xs.addType(testTypeName, scanner => scanner.scan(goodString))

      xs.types[testTypeName].should.exist
    })

    it('should throw error if the data for type is not function', function() {
      let threwError = false

      try { xs.addType(testTypeName, 1) }
      catch (error) { threwError = true }

      threwError.should.be.true
    })

    it('should override a pre-existing type if needed', function() {
      let startingFunction = (scanner) => scanner.scanString(goodString)

      xs.addType(testTypeName, startingFunction)

      xs.types[testTypeName].should.equal(startingFunction)

      xs.addType(testTypeName, (scanner) => null)

      xs.types[testTypeName].should.not.equal(startingFunction)
    })
  })

  describe('addMacro', function() {
    it('should save the given macro to the XScanner', function() {
      expect(xs.macros[testMacroName]).to.not.exist

      xs.addMacro(testMacroName, scanner => scanner.scan(goodString))

      xs.macros[testMacroName].should.exist
    })

    it('should throw error if the data for macro is not function', function() {
      let threwError = false

      try { xs.addMacro(testMacroName, 1) }
      catch (error) { threwError = true }

      threwError.should.be.true
    })

    it('should override a pre-existing macro if needed', function() {
      let startingFunction = (scanner) => scanner.scanString(goodString)

      xs.addMacro(testMacroName, startingFunction)

      xs.macros[testMacroName].should.equal(startingFunction)

      xs.addMacro(testMacroName, (scanner) => null)

      xs.macros[testMacroName].should.not.equal(startingFunction)
    })
  })

  describe('movePosition', function() {
    it('should shift the position by the given amount', function() {
      xs.movePosition(3)

      xs.pos.should.equal(3)
      xs.lastPos.should.equal(0)

      xs.movePosition(-3)

      xs.pos.should.equal(0)
      xs.lastPos.should.equal(3)
    })

    it('should not go past the end of text', function() {
      xs.movePosition(xs.text.length + 10)

      xs.pos.should.equal(xs.text.length)
      xs.lastPos.should.equal(0)
    })

    it('should not go past the beginning of text', function() {
      xs.movePosition(-10)

      xs.pos.should.equal(0)
      xs.lastPos.should.equal(0)
    })
  })

  describe('setPosition', function() {
    it('should set the position to the given index', function() {
      xs.setPosition(5)

      xs.pos.should.equal(5)
      xs.lastPos.should.equal(0)
    })

    it('should not go past the end of text', function() {
      xs.setPosition(xs.text.length + 10)

      xs.pos.should.equal(xs.text.length)
      xs.lastPos.should.equal(0)
    })

    it('should not go past the beginning of text', function() {
      xs.setPosition(-10)

      xs.pos.should.equal(0)
      xs.lastPos.should.equal(0)
    })
  })

  describe('reset', function() {
    it('should reset the positions and last match', function() {
      xs.scan(goodString)

      xs.reset()

      xs.pos.should.equal(0)
      xs.lastPos.should.equal(0)
      expect(xs.lastMatch).to.be.null
    })

    it('should reset everything else if needed', function() {
      xs.scan(goodString)
      xs.savePointer()
      xs.addType(testTypeName, (scanner) => null)
      xs.addMacro(testMacroName, (scanner) => null)
      xs.setCaseInsensitive(true)
      xs.setComplexOutput(true)
      xs.data[goodString] = goodString

      xs.reset(true)

      xs.pos.should.equal(0)
      xs.lastPos.should.equal(0)
      expect(xs.lastMatch).to.be.null
      xs.pointers.should.deep.equal({})
      xs.types.should.deep.equal({})
      xs.macros.should.deep.equal({})
      xs.data.should.deep.equal({})
      xs.caseInsensitive.should.be.false
      xs.complexOutput.should.be.false
    })
  })

  describe('updateMatch', function() {
    it('should update the match data for the scanner', function() {
      xs.updateMatch(goodString)

      xs.pos.should.equal(goodString.length)
      xs.lastPos.should.equal(0)
      xs.lastMatch.should.equal(goodString)
    })
  })

  describe('undoLastMovement', function() {
    it('should undo the match data to the previous state', function() {
      xs.scan(goodString)
      
      // Do scan to change match data again.
      xs.scan(/./)

      xs.pos.should.equal(goodString.length + 1)
      xs.lastPos.should.equal(goodString.length)
      xs.lastMatch.should.equal(xs.text[goodString.length])

      // Undo to first match data.
      xs.undoLastMovement()

      xs.pos.should.equal(goodString.length)
      xs.lastPos.should.equal(0)
      xs.lastMatch.should.equal(goodString)
    })

    it('should do effectively nothing if no scan done', function() {
      xs.undoLastMovement()

      xs.pos.should.equal(0)
      xs.lastPos.should.equal(0)
      expect(xs.lastMatch).to.be.null
    })
  })

  describe('scanString', function() {
    it('returns the matched text on success', function() {
      let match = xs.scanString(goodString)
      match.should.equal(goodString)
    })

    it('returns null on failure', function() {
      let match = xs.scanString(badString)
      expect(match).to.be.null
    })

    it('returns null for empty string', function() {
      let match = xs.scanString('')
      expect(match).to.be.null
    })

    it('is case insensitive in I mode', function() {
      let match = xs.scanString(goodStringCI)
      expect(match).to.be.null

      xs.setCaseInsensitive(true)
      match = xs.scanString(goodStringCI)
      match.should.equal(goodString)
    })

    it('returns same output in complex mode', function() {
      xs.setComplexOutput(true)
      let match = xs.scanString(goodString)
      match.should.equal(goodString)
    })

    describe('proper pointer interaction', function() {
      it('update pointer and last match on success', function() {
        xs.scanString(goodString)

        xs.pos.should.equal(goodString.length)
        xs.lastPos.should.equal(0)
        xs.lastMatch.should.equal(goodString)
      })

      it('not update pointer or last match on failure', function() {
        xs.scanString(badString)

        xs.pos.should.equal(0)
        xs.lastPos.should.equal(0)
        expect(xs.lastMatch).to.be.null
      })
    })
  })

  describe('scanRegex', function() {
    it('returns the matched text on success', function() {
      let match = xs.scanRegex(goodRegex)
      match.should.equal(goodString)
    })

    it('returns null on failure', function() {
      let match = xs.scanRegex(badRegex)
      expect(match).to.be.null
    })

    it('returns null for empty regex', function() {
      let match = xs.scanRegex(new RegExp())
      expect(match).to.be.null
    })

    it('is case insensitive in I mode', function() {
      let match = xs.scanRegex(goodRegexCI)
      expect(match).to.be.null

      xs.setCaseInsensitive(true)
      match = xs.scanRegex(goodRegexCI)
      match.should.equal(goodString)
    })

    it('returns same output in complex mode', function() {
      xs.setComplexOutput(true)
      let match = xs.scanRegex(goodRegex)
      match.should.equal(goodString)
    })

    describe('proper pointer interaction', function() {
      it('update pointer and last match on success', function() {
        xs.scanRegex(goodRegex)

        xs.pos.should.equal(goodString.length)
        xs.lastPos.should.equal(0)
        xs.lastMatch.should.equal(goodString)
      })

      it('not update pointer or last match on failure', function() {
        xs.scanRegex(badRegex)

        xs.pos.should.equal(0)
        xs.lastPos.should.equal(0)
        expect(xs.lastMatch).to.be.null
      })
    })
  })

  describe('scanEnum', function() {
    describe('return the value in the key:value pair on match', function() {
      it('works for string input', function() {
        let match = xs.scanEnum(testText, testEnumOutput)
        match.should.equal(testEnumOutput)
      })

      it('works for regex input', function() {
        let match = xs.scanEnum(goodRegex, testEnumOutput)
        match.should.equal(testEnumOutput)
      })

      it('works for string input in NI mode', function() {
        xs.setCaseInsensitive(true)
        let match = xs.scanEnum(goodStringCI, testEnumOutput)
        match.should.equal(testEnumOutput)
      })

      it('works for regex input in NI mode', function() {
        xs.setCaseInsensitive(true)
        let match = xs.scanEnum(goodRegexCI, testEnumOutput)
        match.should.equal(testEnumOutput)
      })

      it('returns same output even in complex mode', function() {
        xs.setComplexOutput(true)
        let match = xs.scanEnum(testText, testEnumOutput)
        match.should.equal(testEnumOutput)

        match = xs.scanEnum(goodRegex, testEnumOutput)
        match.should.equal(testEnumOutput)
      })

      it('throws an error when has enum key', function() {
        threwTypeError = false

        try {
          let enumKey = [goodString, 'MATCHED']

          xs.scanEnum(enumKey, 'OUTPUT')
        }
        catch (typeError) { threwTypeError = true }
        
        threwTypeError.should.be.true
      })

      it('throws an error when has a nested enum key', function() {
        threwTypeError = false

        try {
          let enumKey = [goodString, 'MATCHED']
          let nestedEnumKey = [[goodString, 'X'], 'MATCHED 2']

          xs.scanEnum(nestedEnumKey, 'OUTPUT')
        }
        catch (typeError) { threwTypeError = true }
        
        threwTypeError.should.be.true
      })
    })

    describe('return null on bad match in N mode', function() {
      it('works for string input', function() {
        let match = xs.scanEnum(badString, 'never returned')
        expect(match).to.be.null
      })

      it('works for regex input', function() {
        let match = xs.scanEnum(badRegex, 'never returned')
        expect(match).to.be.null
      })

      it('works for string input in NI mode', function() {
        xs.setCaseInsensitive(true)
        let match = xs.scanEnum(badString, 'never returned')
        expect(match).to.be.null
      })

      it('works for regex input in NI mode', function() {
        xs.setCaseInsensitive(true)
        let match = xs.scanEnum(badRegex, 'never returned')
        expect(match).to.be.null
      })
    })

    describe('proper pointer interaction', function() {
      it('update pointer and last match on success', function() {
        xs.scanEnum(goodString, testEnumOutput)

        xs.pos.should.equal(goodString.length)
        xs.lastPos.should.equal(0)
        xs.lastMatch.should.equal(goodString)
      })

      it('not update pointer or last match on failure', function() {
        xs.scanEnum(badString, 'never returned')

        xs.pos.should.equal(0)
        xs.lastPos.should.equal(0)
        expect(xs.lastMatch).to.be.null
      })
    })
  })

  describe('scanType', function() {
    beforeEach(function() {
      xs.addType('good type', scanner => {
        return scanner.scanString(goodString)
      })

      xs.addType('bad type', (scanner, out = null) => {
        return scanner.scanString(badString) ?? out
      })
    })

    it('returns the matched text on success', function() {
      let match = xs.scanType('good type')
      match.should.equal(goodString)
    })

    it('returns null for falsy values', function() {
      let outputs = [false, null, undefined, 0, -0, 0n, '', "", ``, NaN]

      let matches = outputs.map(o => xs.scanType('bad type', o))

      matches.forEach(match => expect(match).to.be.null)
    })

    it('throws an error when type not found', function() {
      threwError = false

      try {
        xs.scanType('NOT A TYPE NAME')
      }
      catch (error) {
        threwError = true
      }
      
      threwError.should.be.true
    })

    describe('pointer interaction', function() {
      it('update pointer and last match on success', function() {
        let match = xs.scanType('good type')
        
        xs.pos.should.equal(goodString.length)
        xs.lastPos.should.equal(0)
        xs.lastMatch.should.equal(goodString)
      })

      it('not update pointer or last match on failure', function() {
        let match = xs.scanType('bad type')

        xs.pos.should.equal(0)
        xs.lastPos.should.equal(0)
        expect(xs.lastMatch).to.be.null
      })
    })
  })

  describe('scan', function() {
    beforeEach(function() {
      xs.addType('good type', scanner => {
        return scanner.scanString(goodString)
      })

      xs.addType('bad type', (scanner, out = null) => {
        return scanner.scanString(badString) ?? out
      })
    })

    //* GOOD MATCH CHECKING
    describe('works properly for normal output', function() {
      it('goes through multiple options if needed', function() {
        let match = xs.scan(badString, badRegex, goodRegex)
        match.should.equal(goodString)

        xs.pos.should.equal(goodString.length)
        xs.lastPos.should.equal(0)
        xs.lastMatch.should.equal(goodString)
      })

      it('returns for the first good option', function() {
        let match1 = xs.scan(badString, goodRegex, goodString)
        match1.should.equal(goodString)

        xs.undoLastMovement()

        // The best guess for if a normal mode scan returned an earlier
        // good option (for two equivalent results), is to see if it
        // returns the same result without the second good option.
        let match2 = xs.scan(badString, goodRegex)
        match2.should.equal(match1)

        xs.pos.should.equal(goodString.length)
        xs.lastPos.should.equal(0)
        xs.lastMatch.should.equal(goodString)
      })

      it('goes through all failing options if needed', function() {
        let match = xs.scan(badString, badRegex, goodRegexCI, goodRegexCI)
        expect(match).to.be.null

        xs.pos.should.equal(0)
        xs.lastPos.should.equal(0)
        expect(xs.lastMatch).to.be.null
      })

      describe('matches other scan function successes in normal mode', function() {
        it('scans a string correctly', function() {
          let match1 = xs.scan(goodString)
          match1.should.equal(goodString)

          xs.undoLastMovement()

          let match2 = xs.scanString(goodString)
          match1.should.equal(match2)
  
          xs.pos.should.equal(goodString.length)
          xs.lastPos.should.equal(0)
          xs.lastMatch.should.equal(goodString)
        })
  
        it('scans a regex correctly', function() {
          let match1 = xs.scan(goodRegex)
          match1.should.equal(goodString)

          xs.undoLastMovement()

          let match2 = xs.scanRegex(goodRegex)
          match1.should.equal(match2)
  
          xs.pos.should.equal(goodString.length)
          xs.lastPos.should.equal(0)
          xs.lastMatch.should.equal(goodString)
        })
  
        it('scans an enum (with string key) correctly', function() {
          let match1 = xs.scan([goodString, testEnumOutput])
          match1.should.equal(testEnumOutput)

          xs.undoLastMovement()

          let match2 = xs.scanEnum(goodString, testEnumOutput)
          match1.should.equal(match2)
  
          xs.pos.should.equal(goodString.length)
          xs.lastPos.should.equal(0)
          xs.lastMatch.should.equal(goodString)
        })
  
        it('scans an enum (with regex key) correctly', function() {
          let match1 = xs.scan([goodRegex, testEnumOutput])
          match1.should.equal(testEnumOutput)

          xs.undoLastMovement()

          let match2 = xs.scanEnum(goodRegex, testEnumOutput)
          match1.should.equal(match2)
  
          xs.pos.should.equal(goodString.length)
          xs.lastPos.should.equal(0)
          xs.lastMatch.should.equal(goodString)
        })
  
        //! Enum keys for enums not supported.
        it('throws an error when an enum has an enum key', function() {
          threwTypeError = false
  
          try {
            let enumKey = [goodString, 'MATCHED']
  
            xs.scan([enumKey, 'OUTPUT'])
          }
          catch (typeError) { threwTypeError = true }
          
          threwTypeError.should.be.true
        })

        it('throws an error when an enum has a nested enum key', function() {
          threwTypeError = false
  
          try {
            let enumKey = [goodString, 'MATCHED']
            let nestedEnumKey = [[enumKey, 'X'], 'MATCHED 2']
  
            xs.scan([nestedEnumKey, 'OUTPUT'])
          }
          catch (typeError) { threwTypeError = true }
          
          threwTypeError.should.be.true
        })
  
        it('scans an enum (with type key) correctly', function() {
          let match1 = xs.scan([['good type'], testEnumOutput])
          match1.should.equal(testEnumOutput)

          xs.undoLastMovement()

          let match2 = xs.scanEnum(['good type'], testEnumOutput)
          match2.should.equal(match1)
  
          xs.pos.should.equal(goodString.length)
          xs.lastPos.should.equal(0)
          xs.lastMatch.should.equal(goodString)
        })
  
        it('scans an enum with non-string value correctly', function() {
          let match1 = xs.scan([goodRegex, goodRegex])
          match1.should.equal(goodRegex)

          xs.undoLastMovement()

          let match2 = xs.scanEnum(goodRegex, goodRegex)
          match2.should.equal(match1)
  
          xs.pos.should.equal(goodString.length)
          xs.lastPos.should.equal(0)
          xs.lastMatch.should.equal(goodString)
        })
  
        it('scans an enum with null value correctly', function() {
          let match1 = xs.scan([goodRegex, null])
          expect(match1).to.be.null

          xs.undoLastMovement()
  
          let match2 = xs.scanEnum(goodRegex, null)
          expect(match2).to.equal(match1)

          xs.pos.should.equal(goodString.length)
          xs.lastPos.should.equal(0)
          xs.lastMatch.should.equal(goodString)
        })
  
        it('scans an enum with undefined value correctly', function() {
          let match1 = xs.scan([goodRegex, undefined])
          expect(match1).to.be.undefined

          xs.undoLastMovement()

          let match2 = xs.scanEnum(goodRegex, undefined)
          expect(match2).to.equal(match1)
  
          xs.pos.should.equal(goodString.length)
          xs.lastPos.should.equal(0)
          xs.lastMatch.should.equal(goodString)
        })
  
        it('scans a type correctly', function() {
          let match1 = xs.scan(['good type'])
          match1.should.equal(goodString)

          xs.undoLastMovement()

          let match2 = xs.scanType('good type')
          match2.should.equal(match1)
  
          xs.pos.should.equal(goodString.length)
          xs.lastPos.should.equal(0)
          xs.lastMatch.should.equal(goodString)
        })
      })

      //* BAD MATCH CHECKING.
      describe('matches other scan function fails in normal mode', function() {
        it('returns null on string failure', function() {
          let match1 = xs.scan(badString)
          let match2 = xs.scanString(badString)
          expect(match1).to.be.null
          expect(match1).to.equal(match2)
  
          xs.pos.should.equal(0)
          xs.lastPos.should.equal(0)
          expect(xs.lastMatch).to.be.null
        })

        it('returns null on regex failure', function() {
          let match1 = xs.scan(badRegex)
          let match2 = xs.scanRegex(badRegex)
          expect(match1).to.be.null
          expect(match1).to.equal(match2)
  
          xs.pos.should.equal(0)
          xs.lastPos.should.equal(0)
          expect(xs.lastMatch).to.be.null
        })

        it('returns null on enum failure', function() {
          let match1 = xs.scan([badString, testEnumOutput])
          let match2 = xs.scanEnum(badString, testEnumOutput)
          expect(match1).to.be.null
          expect(match1).to.equal(match2)
  
          xs.pos.should.equal(0)
          xs.lastPos.should.equal(0)
          expect(xs.lastMatch).to.be.null
        })

        it('returns null on type failure', function() {
          let match1 = xs.scan(['bad type'])
          let match2 = xs.scanType('bad type')
          expect(match1).to.be.null
          expect(match1).to.equal(match2)
  
          xs.pos.should.equal(0)
          xs.lastPos.should.equal(0)
          expect(xs.lastMatch).to.be.null
        })
      })
    })

    describe('works properly for complex output', function() {
      beforeEach(function() {
        xs.setComplexOutput(true)
      })

      it('goes through multiple options if needed', function() {
        let match = xs.scan(badString, badRegex, goodRegex)
        match.should.deep.equal({
          matched: true, type: 'regex', key: goodRegex, value: goodString
        })

        xs.pos.should.equal(goodString.length)
        xs.lastPos.should.equal(0)
        xs.lastMatch.should.equal(goodString)
      })

      it('returns for the first good option', function() {
        let match = xs.scan(badString, goodRegex, goodString)
        match.should.deep.equal({
          matched: true, type: 'regex', key: goodRegex, value: goodString
        })

        xs.pos.should.equal(goodString.length)
        xs.lastPos.should.equal(0)
        xs.lastMatch.should.equal(goodString)
      })

      it('goes through all failing options if needed', function() {
        let match = xs.scan(badString, badRegex, goodRegexCI, goodRegexCI)
        match.should.deep.equal({
          matched: false, type: null, key: null, value: null
        })

        xs.pos.should.equal(0)
        xs.lastPos.should.equal(0)
        expect(xs.lastMatch).to.be.null
      })

      it('scans a string correctly', function() {
        let match = xs.scan(goodString)
        match.should.deep.equal({
          matched: true, type: 'string', key: goodString, value: goodString
        })

        xs.pos.should.equal(match.value.length)
        xs.lastPos.should.equal(0)
        xs.lastMatch.should.equal(match.value)
      })

      it('scans a regex correctly', function() {
        let match = xs.scan(goodRegex)
        match.should.deep.equal({
          matched: true, type: 'regex', key: goodRegex, value: goodString
        })

        xs.pos.should.equal(match.value.length)
        xs.lastPos.should.equal(0)
        xs.lastMatch.should.equal(match.value)
      })

      it('scans an enum (with string key) correctly', function() {
        let match = xs.scan([goodString, testEnumOutput])
        match.should.deep.equal({
          matched: true, type: 'enum', key: goodString,
          textMatched: goodString, value: testEnumOutput
        })

        xs.pos.should.equal(match.textMatched.length)
        xs.lastPos.should.equal(0)
        xs.lastMatch.should.equal(match.textMatched)
      })

      it('scans an enum (with regex key) correctly', function() {
        let match = xs.scan([goodRegex, testEnumOutput])
        match.should.deep.equal({
          matched: true, type: 'enum', key: goodRegex,
          textMatched: goodString, value: testEnumOutput
        })

        xs.pos.should.equal(match.textMatched.length)
        xs.lastPos.should.equal(0)
        xs.lastMatch.should.equal(match.textMatched)
      })

      //! Enum keys for enums not supported.
      it('throws an error when an enum has an enum key', function() {
        threwTypeError = false

        try {
          let enumKey = [goodString, 'MATCHED']

          xs.scan([enumKey, 'OUTPUT'])
        }
        catch (typeError) { threwTypeError = true }
        
        threwTypeError.should.be.true
      })

      it('throws an error when an enum has a nested enum key', function() {
        threwTypeError = false

        try {
          let enumKey = [goodString, 'MATCHED']
          let nestedEnumKey = [[enumKey, 'X'], 'MATCHED 2']

          xs.scan([nestedEnumKey, 'OUTPUT'])
        }
        catch (typeError) { threwTypeError = true }
        
        threwTypeError.should.be.true
      })

      it('scans an enum (with type key) correctly', function() {
        let match = xs.scan([['good type'], testEnumOutput])
        match.should.deep.equal({
          matched: true, type: 'enum', key: ['good type'],
          textMatched: goodString, value: testEnumOutput
        })

        xs.pos.should.equal(match.textMatched.length)
        xs.lastPos.should.equal(0)
        xs.lastMatch.should.equal(match.textMatched)
      })

      it('scans an enum with non-string value correctly', function() {
        let match = xs.scan([goodRegex, goodRegex])
        match.should.deep.equal({
          matched: true, type: 'enum', key: goodRegex,
          textMatched: goodString, value: goodRegex
        })

        xs.pos.should.equal(match.textMatched.length)
        xs.lastPos.should.equal(0)
        xs.lastMatch.should.equal(match.textMatched)
      })

      it('scans an enum with null value correctly', function() {
        let match = xs.scan([goodRegex, null])
        match.should.deep.equal({
          matched: true, type: 'enum', key: goodRegex,
          textMatched: goodString, value: null
        })

        xs.pos.should.equal(match.textMatched.length)
        xs.lastPos.should.equal(0)
        xs.lastMatch.should.equal(match.textMatched)
      })

      it('scans an enum with undefined value correctly', function() {
        let match = xs.scan([goodRegex, undefined])
        match.should.deep.equal({
          matched: true, type: 'enum', key: goodRegex,
          textMatched: goodString, value: undefined
        })

        xs.pos.should.equal(match.textMatched.length)
        xs.lastPos.should.equal(0)
        xs.lastMatch.should.equal(match.textMatched)
      })

      it('scans a type correctly', function() {
        let match = xs.scan(['good type'])
        
        match.should.deep.equal({
          matched: true, type: 'type', key: 'good type', value: goodString
        })

        xs.pos.should.equal(match.value.length)
        xs.lastPos.should.equal(0)
        xs.lastMatch.should.equal(match.value)
      })

      describe('complex mode returns proper fail object', function() {
        it('returns a fail object for string', function() {
          let match = xs.scan(badString)

          match.should.deep.equal({
            matched: false, type: null, key: null, value: null
          })

          xs.pos.should.equal(0)
          xs.lastPos.should.equal(0)
          expect(xs.lastMatch).to.be.null
        })

        it('returns a fail object for regex', function() {
          let match = xs.scan(badRegex)

          match.should.deep.equal({
            matched: false, type: null, key: null, value: null
          })

          xs.pos.should.equal(0)
          xs.lastPos.should.equal(0)
          expect(xs.lastMatch).to.be.null
        })

        it('returns a fail object for enum', function() {
          let match = xs.scan([badRegex, testEnumOutput])

          match.should.deep.equal({
            matched: false, type: null, key: null, value: null,
            textMatched: null
          })

          xs.pos.should.equal(0)
          xs.lastPos.should.equal(0)
          expect(xs.lastMatch).to.be.null
        })

        it('returns a fail object for type', function() {
          let match = xs.scan(['bad type'])

          match.should.deep.equal({
            matched: false, type: null, key: null, value: null
          })

          xs.pos.should.equal(0)
          xs.lastPos.should.equal(0)
          expect(xs.lastMatch).to.be.null
        })
      })
    })

    describe('works properly with I mode', function() {
      beforeEach(function() {
        xs.setCaseInsensitive(true)

        xs.addType('good type', scanner => {
          return scanner.scanString(goodStringCI)
        })
  
        xs.addType('bad type', (scanner, out = null) => {
          return scanner.scanString(badString) ?? out
        })
      })

      it('scans a string correctly', function() {
        let match = xs.scan(goodStringCI)
        match.should.equal(goodString)

        xs.pos.should.equal(goodString.length)
        xs.lastPos.should.equal(0)
        xs.lastMatch.should.equal(goodString)
      })

      it('scans a regex correctly', function() {
        let match = xs.scan(goodRegexCI)
        match.should.equal(goodString)

        xs.pos.should.equal(goodString.length)
        xs.lastPos.should.equal(0)
        xs.lastMatch.should.equal(goodString)
      })

      it('scans an enum (with string key) correctly', function() {
        let match = xs.scan([goodStringCI, testEnumOutput])
        match.should.equal(testEnumOutput)

        xs.pos.should.equal(goodString.length)
        xs.lastPos.should.equal(0)
        xs.lastMatch.should.equal(goodString)
      })

      it('scans an enum (with regex key) correctly', function() {
        let match = xs.scan([goodRegexCI, testEnumOutput])
        match.should.equal(testEnumOutput)

        xs.pos.should.equal(goodString.length)
        xs.lastPos.should.equal(0)
        xs.lastMatch.should.equal(goodString)
      })

      //! Enum keys for enums not supported.
      it('throws an error when an enum has an enum key', function() {
        threwTypeError = false

        try {
          let enumKey = [goodStringCI, 'MATCHED']

          xs.scan([enumKey, 'OUTPUT'])
        }
        catch (typeError) { threwTypeError = true }
        
        threwTypeError.should.be.true
      })

      it('throws an error when an enum has a nested enum key', function() {
        threwTypeError = false

        try {
          let enumKey = [goodStringCI, 'MATCHED']
          let nestedEnumKey = [[enumKey, 'X'], 'MATCHED 2']

          xs.scan([nestedEnumKey, 'OUTPUT'])
        }
        catch (typeError) { threwTypeError = true }
        
        threwTypeError.should.be.true
      })

      it('scans an enum (with type key) correctly', function() {
        let match = xs.scan([['good type'], testEnumOutput])
        match.should.equal(testEnumOutput)

        xs.pos.should.equal(goodString.length)
        xs.lastPos.should.equal(0)
        xs.lastMatch.should.equal(goodString)
      })

      it('scans an enum with non-string value correctly', function() {
        let match = xs.scan([goodRegexCI, goodRegexCI])
        match.should.equal(goodRegexCI)

        xs.pos.should.equal(goodString.length)
        xs.lastPos.should.equal(0)
        xs.lastMatch.should.equal(goodString)
      })

      it('scans an enum with null value correctly', function() {
        let match = xs.scan([goodRegexCI, null])
        expect(match).to.be.null

        xs.pos.should.equal(goodString.length)
        xs.lastPos.should.equal(0)
        xs.lastMatch.should.equal(goodString)
      })

      it('scans an enum with undefined value correctly', function() {
        let match = xs.scan([goodRegexCI, undefined])
        expect(match).to.be.undefined

        xs.pos.should.equal(goodString.length)
        xs.lastPos.should.equal(0)
        xs.lastMatch.should.equal(goodString)
      })

      it('scans a type correctly', function() {
        let match = xs.scan(['good type'])
        match.should.equal(goodString)

        xs.pos.should.equal(goodString.length)
        xs.lastPos.should.equal(0)
        xs.lastMatch.should.equal(goodString)
      })
    })
  })

  describe('do', function() {
    beforeEach(function() {
      xs.addMacro(testMacroName, scanner => scanner.scan(goodString))
      xs.addMacro('add data times', (scanner, times) => {
        for (let x = 1; x <= times; x++) {
          scanner.data['test' + x] = x
        }
      })
    })

    it('should run a macro with no args', function() {
      xs.do(testMacroName)

      xs.pos.should.equal(goodString.length)
      xs.lastPos.should.equal(0)
      xs.lastMatch.should.equal(goodString)
    })

    it('should run a macro with args', function() {
      xs.do('add data times', 2)

      xs.data['test1'].should.equal(1)
      xs.data['test2'].should.equal(2)
    })

    it('should throw an error for nonexistent macro', function() {
      threwError = false
      try { xs.do(badString) }
      catch (error) { threwError = true }

      threwError.should.be.true
    })
  })
})