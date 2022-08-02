class XScanner {
  #lastState = null

  constructor(text) {
    this.text = text
    this.pos = 0
    this.lastPos = 0
    this.lastMatch = null

    this.pointers = {}
    this.types = {}
    this.macros = {}
    // General object for storing variables linked to the scanner.
    // Allows for possibly running a scan macro that saves the data to
    // the scanner which can be accessed afterwards.
    // So you can have very abstract macros like "scan function" and
    // it would save all the info you'd want saved.
    this.data = {}

    this.caseInsensitive = false
    this.complexOutput = false
    //* Pointer reference last state of position, in case of undo needed.
    this.#lastState = { pos: 0, lastPos: 0, lastMatch: null }
  }

  setCaseInsensitive(option) { this.caseInsensitive = Boolean(option); return this }
  setComplexOutput(option) { this.complexOutput = Boolean(option); return this }

  #updateLastState() {
    this.#lastState = {
      pos: this.pos, lastPos: this.lastPos, lastMatch: this.lastMatch
    }
  }

  savePointer(name) {
    this.pointers[name] = {
      pos: this.pos, lastPos: this.lastPos, lastMatch: this.lastMatch
    }

    return this.pointers[name]
  }

  loadPointer(name) {
    this.#updateLastState()

    if (name in this.pointers) {
      let pointer = this.pointers[name]
      this.pos = pointer.pos
      this.lastPos = pointer.lastPos
      this.lastMatch = pointer.lastMatch
    }
    else {
      throw Error(`Pointer "${name}" does not exist on XScanner.`)
    }
  }

  addType(name, onScan) {
    if (typeof onScan != 'function') {
      throw TypeError('You can only add a function for a scanner type')
    }

    this.types[name] = onScan
  }

  addMacro(name, fn) {
    if (typeof fn != 'function') {
      throw TypeError('You can only add a function for a scanner macro.')
    }

    this.macros[name] = fn
  }

  movePosition(n) {
    this.#updateLastState()

    this.lastPos = this.pos
    this.pos += n

    if (this.pos < 0) { this.pos = 0 }
    else if (this.pos > this.text.length) { this.pos = this.text.length }
  }

  setPosition(n) {
    this.#updateLastState()

    this.lastPos = this.pos
    this.pos = n

    if (this.pos < 0) { this.pos = 0 }
    else if (this.pos > this.text.length) { this.pos = this.text.length }
  }

  reset(everything = false) {
    this.pos = 0
    this.lastPos = 0
    this.lastMatch = null

    if (everything) {
      this.pointers = {}
      this.types = {}
      this.macros = {}
      this.data = {}
      this.caseInsensitive = false
      this.complexOutput = false

      //* I feel it makes more sense to actually reset last state for a reset.
      this.#lastState = { pos: 0, lastPos: 0, lastMatch: 0 }
    }
  }

  updateMatch(match) {
    this.movePosition(match.length)
    this.lastMatch = match
  }

  undoLastMovement() {
    let previousLastState = {
      pos: this.pos,
      lastPos: this.lastPos,
      lastMatch: this.lastMatch
    }

    this.pos = this.#lastState.pos
    this.lastPos = this.#lastState.lastPos
    this.lastMatch = this.#lastState.lastMatch

    this.#lastState = previousLastState
  }

  duplicate() {
    let dup = new XScanner(this.text)
    dup.pos = this.pos
    dup.lastPos = this.lastPos
    dup.lastMatch = this.lastMatch

    for (const pointer in this.pointers) {
      dup.pointers[pointer] = {}
      Object.assign(dup.pointers[pointer], this.pointers[pointer])
    }

    Object.assign(dup.types, this.types)
    Object.assign(dup.macros, this.macros)

    dup.caseInsensitive = this.caseInsensitive
    dup.complexOutput = this.complexOutput

    return dup
  }

  checkString(s) {
    if (s === '') { return null }

    let text = this.unscannedText()
    let cased = s => this.caseInsensitive ? s.toLowerCase() : s

    let isMatch = cased(text).startsWith(cased(s))

    return isMatch ? text.slice(0, s.length) : null
  }

  scanString(s) {
    let match = this.checkString(s)

    if (match) { this.updateMatch(match) }

    return match
  }

  checkRegex(r) {
    // Empty regex gets set to (?:)
    if (r.source === '(?:)') { return null }
    let rSource = r.source
    let rFlags = r.flags

    if (!rSource.startsWith('^')) { rSource = '^' + rSource }
    if (this.caseInsensitive && !rFlags.includes('i')) { rFlags += 'i' }

    let match = this.unscannedText().match(new RegExp(rSource, rFlags))

    if (match && match[0] === '') { match = null }

    return match ? match[0] : null
  }

  scanRegex(r) {
    let match = this.checkRegex(r)

    if (match) { this.updateMatch(match) }

    return match
  }

  #check(...options) {
    let match = null
    let check = opt => {
      let result = null

      //* String options get scanned in a straightforward manner, checkString.
      if (this.#isString(opt)) {
        result = this.checkString(opt)
        return { matched: Boolean(result), type: 'string', key: opt, value: result }
      }
      //* Regex options are also straightforward, use checkRegex.
      else if (this.#isRegex(opt)) {
        result = this.checkRegex(opt)
        return { matched: Boolean(result), type: 'regex', key: opt, value: result }
      }
      else if (Array.isArray(opt)) {
        //* Option array > 1 means enum option.
        if (opt.length > 1) {
          //! This means that there is an enum as the key for an enum, which is
          //! not allowed since I don't want to recursively check enums in enums.
          if (Array.isArray(opt[0]) && opt[0].length > 1) {
            throw TypeError(
              'An XScanner cannot have an enum value for the key of an enum.'
            )
          }

          result = this.#check(opt[0])

          result = result.value

          return {
            matched: Boolean(result), type: 'enum', key: opt[0], value: opt[1],
            textMatched: result
          }
        }
        //* Otherwise option array represents the name of a scan type.
        else {
          result = this.checkType(opt[0])

          return { matched: Boolean(result), type: 'type', key: opt[0], value: result }
        }
      }
      //* Not a valid scan option.
      else {
        return { matched: false, type: null, key: null, value: null }
      }
    }

    let foundMatch = options.find(option => {
      match = check(option)
      return match.matched
    })

    //* If no match found, set all data to null, since these fields are likely
    //* to have been overwritten during the matching loop.
    if (!foundMatch) { match.type = null; match.key = null; match.value = null }

    return match
  }

  check(...options) {
    let match = this.#check(...options)

    if (!this.complexOutput) { match = this.#getValue(match) }
    else { match.value = this.#getValue(match) }

    if (this.complexOutput && match.value == null) {
      match.matched = false; match.type = null; match.key = null
    }

    return match
  }

  scan(...options) {
    let match = this.#check(...options)

    if (match) {
      let text = this.#getMatchedText(match)

      if (text != null) { this.updateMatch(text) }
    }

    if (!this.complexOutput) { match = this.#getValue(match) }
    else { match.value = this.#getValue(match) }

    if (this.complexOutput && match.matched == false) {
      match.matched = false; match.type = null; match.key = null
    }

    return match
  }

  checkEnum(key, value) {
    let match = this.check(key)
    return match ? value : null
  }

  scanEnum(key, value) {
    //! Enum cannot have enum key [option, output].
    if (Array.isArray(key) && key.length > 1) {
      throw TypeError(
        'An XScanner cannot have an enum value for the key of an enum.'
      )
    }
    let match = this.check(key)

    if (match) { this.updateMatch(match); match = value }

    return match
  }

  checkType(name, ...args) {
    if (!(name in this.types)) {
      throw Error(`Type "${name}" not found for XScanner.`)
    }

    let scanner = this.duplicate()
    let match = this.types[name](scanner, ...args)

    return match ? match : null
  }

  #checkType(name, ...args) {
    if (!(name in this.types)) {
      throw Error(`Type "${name}" not found for XScanner.`)
    }

    let scanner = this.duplicate()
    let match = this.types[name](scanner, ...args)

    return match ? { output: match, dup: scanner } : null
  }

  scanType(name, ...args) {
    let match = this.#checkType(name, ...args)

    if (match) {
      this.updateMatch(match.dup.lastMatch)

      match = match.output
    }

    return match
  }

  #getValue(output) {
    if (output?.value == null) { return output?.value }

    let prevValue = output
    let value = output.value

    while (value != null) {
      prevValue = value
      value = value.value
    }

    return prevValue
  }

  #getMatchedText(output) {
    let value = output.textMatched ?? output.value

    while (!this.#isString(value) && value != null) {
      value = value.textMatched ?? value.value
    }

    return value
  }

  do(name, ...args) {
    if (!(name in this.macros)) {
      throw Error(`Macro "${name}" not found on XScanner.`)
    }

    let ci = this.caseInsensitive
    let co = this.complexOutput
    let ls = {
      pos: this.#lastState.pos,
      lastPos: this.#lastState.lastPos,
      lastMatch: this.#lastState.lastMatch
    }

    this.macros[name](this, ...args)

    // Restore general settings in case they were changed in macro.
    // Everything else, like positions, is fine to have changed.
    this.caseInsensitive = ci
    this.complexOutput = co
    // Last state is also restored in case the macro movement needs to be
    // undone.
    this.#lastState = ls

    return this
  }

  scannedText() { return this.text.slice(0, this.pos) }
  unscannedText() { return this.text.slice(this.pos) }

  #isString(x) { return Object.prototype.toString.call(x) == '[object String]' }
  #isRegex(x) { return Object.prototype.toString.call(x) == '[object RegExp]' }
}

module.exports = XScanner