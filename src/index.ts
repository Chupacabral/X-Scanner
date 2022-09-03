import { deepCopy } from './deep_copy';

export interface ScannerState {
  readonly pos: number;
  readonly lastPos: number;
  readonly lastMatch?: any;
}
export interface ScanOutputData {
  readonly matched: boolean;
  readonly type?: string | null;
  readonly key?: any | null;
  readonly result?: any | null;
  readonly textMatched?: string | null;
}

export type ComparatorOutput = {
  matched: boolean;
  textMatched?: string | null;
};
export type StringComparator = (s: string, text: string) => ComparatorOutput;
export type RegexpComparator = (r: RegExp, text: string) => ComparatorOutput;
export type ComparatorGroup = {
  string: StringComparator;
  regexp: RegexpComparator;
};
export type ScannerTypeFunction = (
  s: XScanner,
  ...args: any[]
) => ComparatorOutput;
export type ScannerMacroFunction = (s: XScanner, ...args: any[]) => void;
export type ScannerAction = (s: XScanner) => void;
export type ScannerOutputProcessor = (data: ScanOutputData) => any;
export type ScanInputOption =
  | string // STRING OPTION
  | RegExp // REGEX OPTION
  | [string] // TYPE OPTION
  | [string, any] // ENUM W/ STRING KEY OPTION
  | [RegExp, any] // ENUM W/ REGEX KEY OPTION
  | [[string], any]; // ENUM W/ TYPE KEY OPTION

export type ScanEnumKeyOption =
  | string // STRING OPTION
  | RegExp // REGEX OPTION
  | [string]; // TYPE OPTION

export class AdvancedScannerOutput implements ScanOutputData {
  readonly #parent: XScanner;
  readonly #matched: boolean;
  readonly #type?: string | null;
  readonly #key?: any | null;
  readonly #result?: any | null;
  readonly #textMatched?: string | null;

  constructor(parent: XScanner, data: ScanOutputData) {
    if (parent == null) {
      throw new TypeError(
        'An XScanner.AdvancedScannerOutput object needs an XScanner for the ' +
          'parent, not null/undefined.',
      );
    }

    this.#parent = parent;
    this.#matched = Boolean(data.matched);
    this.#type = data.type;
    this.#key = data.key;
    this.#result = data.result;
    this.#textMatched = data.textMatched;
  }

  public get parent() {
    return this.#parent;
  }
  public get matched() {
    return this.#matched;
  }
  public get type() {
    return this.#type;
  }
  public get key() {
    return this.#key;
  }
  public get result() {
    return this.#result;
  }
  public get textMatched() {
    return this.#textMatched;
  }

  public get then() {
    return this.#matched ? this.#parent : null;
  }

  public toString() {
    const parentString =
      'XScanner {\n' +
      `    text: "${this.parent.text}"\n` +
      `    pos:  ${this.parent.pos}\n` +
      '  }';

    const key = typeof this.#key === 'string' ? `"${this.#key}"` : this.#key;

    const result =
      typeof this.#result === 'string' ? `"${this.#result}"` : this.#result;

    const type =
      typeof this.#type === 'string' ? `"${this.#type}"` : this.#type;
    const textMatched =
      typeof this.#textMatched === 'string'
        ? `"${this.#textMatched}"`
        : this.#textMatched;

    return (
      'AdvancedScannerOutput {\n' +
      `  parent:      ${parentString}\n` +
      `  matched:     ${this.matched}\n` +
      `  type:        ${type}\n` +
      `  key:         ${key}\n` +
      `  result:      ${result}\n` +
      `  textMatched: ${textMatched}\n` +
      '}'
    );
  }
}

export class XScanner {
  #lastState: ScannerState = { pos: 0, lastPos: 0, lastMatch: null };
  #text: string;
  #pos: number = 0;
  #lastPos: number = 0;
  #lastMatch?: any = null;
  #pointers: Record<string, ScannerState> = {};
  #types: Record<string, ScannerTypeFunction> = {};
  #macros: Record<string, ScannerMacroFunction> = {};
  #outputTypes: Record<string, ScannerOutputProcessor> = {
    normal: (data) => data.result,
    full: (data) => data,
    advanced: (data) => new AdvancedScannerOutput(this, data),
  };
  #comparisonModes: Record<string, ComparatorGroup> = {
    normal: {
      string: (s, text) => {
        const matched = text.startsWith(s);

        return { matched, textMatched: s };
      },
      regexp: (r, text) => {
        const match = text.match(r);
        const matched = Boolean(match && match[0] !== '');

        const textMatched: string = matched
          ? (match as RegExpMatchArray)[0]
          : '';

        return { matched, textMatched };
      },
    },
    insensitive: {
      string: (s, text) => {
        const matched = text.toLowerCase().startsWith(s.toLowerCase());

        return { matched, textMatched: text.slice(0, s.length) };
      },
      regexp: (r, text) => {
        if (!r.flags.includes('i')) {
          r = new RegExp(r.source, r.flags + 'i');
        }

        const match = text.match(r);
        const matched = Boolean(match && match[0] !== '');

        const textMatched: string = matched
          ? (match as RegExpMatchArray)[0]
          : '';

        return { matched, textMatched };
      },
    },
  };
  #data: Record<any, any> = {};
  #outputType: string = 'normal';
  #comparisonMode: string = 'normal';

  constructor(text: string) {
    this.#text = text;
  }

  public get lastState() {
    return this.#lastState;
  }

  public get text() {
    return this.#text;
  }
  public get scannedText() {
    return this.#text.slice(0, this.#pos);
  }
  public get unscannedText() {
    return this.#text.slice(this.#pos);
  }
  public get pos() {
    return this.#pos;
  }
  public get lastPos() {
    return this.#lastPos;
  }
  public get lastMatch() {
    return this.#lastMatch;
  }
  public get pointers() {
    return this.#pointers;
  }
  public get types() {
    return this.#types;
  }
  public get macros() {
    return this.#macros;
  }
  public get outputTypes() {
    return this.#outputTypes;
  }
  public get comparisonModes() {
    return this.#comparisonModes;
  }
  public get data() {
    return this.#data;
  }
  public get outputType() {
    return this.#outputType;
  }
  public set outputType(name: string) {
    if (name in this.#outputTypes) {
      this.#outputType = name;
    } else {
      throw new Error(`Output Type "${name}" does not exist on XScanner.`);
    }
  }
  public get comparisonMode() {
    return this.#comparisonMode;
  }
  public set comparisonMode(mode: string) {
    if (mode in this.#comparisonModes) {
      this.#comparisonMode = mode;
    } else {
      throw new Error(`Comparison Mode "${mode}" does not exist on XScanner.`);
    }
  }

  #updateLastState() {
    this.#lastState = {
      pos: this.#pos,
      lastPos: this.#lastPos,
      lastMatch: this.#lastMatch,
    };
  }

  // * UTILITY FUNCTIONS

  // * EXTENSION FUNCTIONS
  public savePointer(name: string) {
    if (typeof name !== 'string') {
      throw new TypeError(
        'You can only have a string for a scan pointer name.',
      );
    }

    this.#pointers[name] = {
      pos: this.#pos,
      lastPos: this.#lastPos,
      lastMatch: this.#lastMatch,
    };

    return this;
  }

  public loadPointer(name: string) {
    this.#updateLastState();

    if (name in this.#pointers) {
      const pointer: ScannerState = this.#pointers[name];

      if (pointer != null) {
        this.#pos = pointer.pos;
        this.#lastPos = pointer.lastPos;
        this.#lastMatch = pointer.lastMatch;
      }
    } else {
      throw Error(`Pointer "${name}" does not exist on XScanner.`);
    }

    return this;
  }

  public addType(name: string, onScan: ScannerTypeFunction) {
    if (typeof name !== 'string') {
      throw TypeError('You can only have a string for a scan type name.');
    }
    if (typeof onScan !== 'function') {
      throw TypeError('You can only have functions for a scan type.');
    }

    this.#types[name] = onScan;

    return this;
  }

  public removeType(name: string) {
    if (typeof name !== 'string') {
      throw TypeError('You can only have a string for a scan type name.');
    }
    if (!(name in this.types)) {
      throw Error(
        `The type "${name}" cannot be removed as it does not exist on XScanner.`,
      );
    }

    delete this.#types[name];
  }

  public addMacro(name: string, fn: ScannerMacroFunction) {
    if (typeof name !== 'string') {
      throw TypeError('You can only have a string for a scan macro name.');
    }
    if (typeof fn !== 'function') {
      throw TypeError('You can only have functions for a scan macro.');
    }

    this.#macros[name] = fn;

    return this;
  }

  public removeMacro(name: string) {
    if (typeof name !== 'string') {
      throw TypeError('You can only have a string for a scan macro name.');
    }
    if (!(name in this.macros)) {
      throw Error(
        `The macro "${name}" cannot be removed as it does not exist on XScanner.`,
      );
    }

    delete this.#macros[name];
  }

  // TODO: Add methods like addOutputType and addComparisonMode

  public movePosition(n: number) {
    this.#updateLastState();

    this.#lastPos = this.#pos;
    this.#pos += n;

    if (this.#pos < 0) {
      this.#pos = 0;
    } else if (this.#pos > this.#text.length) {
      this.#pos = this.#text.length;
    }

    return this;
  }

  public setPosition(n: number) {
    this.#updateLastState();

    this.#lastPos = this.#pos;
    this.#pos = n;

    if (this.#pos < 0) {
      this.#pos = 0;
    } else if (this.#pos > this.#text.length) {
      this.#pos = this.#text.length;
    }

    return this;
  }

  public reset(everthing = false) {
    this.#pos = 0;
    this.#lastPos = 0;
    this.#lastMatch = null;

    if (everthing) {
      this.#pointers = {};
      this.#types = {};
      this.#macros = {};
      this.#data = {};
      this.#outputType = 'normal';
      this.#comparisonMode = 'normal';
    }

    // * I feel it makes more sense to actually reset last state for a reset.
    this.#lastState = { pos: 0, lastPos: 0, lastMatch: null };

    return this;
  }

  public updateMatch(match: string) {
    this.movePosition(match.length);
    this.#lastMatch = match;

    return this;
  }

  public undoLastMovement() {
    const previousLastState = {
      pos: this.#pos,
      lastPos: this.#lastPos,
      lastmMatch: this.#lastMatch,
    };

    this.#pos = this.#lastState.pos;
    this.#lastPos = this.#lastState?.lastPos;
    this.#lastMatch = this.#lastState?.lastMatch;

    this.#lastState = previousLastState;

    return this;
  }

  public duplicate(): XScanner {
    const dup = new XScanner(this.#text);
    dup.#pos = this.#pos;
    dup.#lastPos = this.#lastPos;

    dup.#lastMatch = deepCopy(this.#lastMatch);
    dup.#pointers = deepCopy(this.#pointers);
    dup.#types = deepCopy(this.#types);
    dup.#macros = deepCopy(this.#macros);
    dup.#outputTypes = deepCopy(this.#outputTypes);
    dup.#comparisonModes = deepCopy(this.#comparisonModes);

    dup.#data = deepCopy(this.#data);
    dup.#outputType = this.#outputType;
    dup.#comparisonMode = this.#comparisonMode;

    return dup;
  }

  private _checkString(s: string): ScanOutputData {
    if (s === '') {
      return this._fullOutputFrom({ matched: false }, {});
    }

    const text = this.unscannedText;
    const match = this.#comparisonModes[this.#comparisonMode].string(s, text);

    return this._fullOutputFrom(match, { type: 'string', key: s });
  }

  public checkString(s: string): string | null {
    if (s === '') {
      return this._normalOutputFrom({ matched: false }, {});
    }

    const text = this.unscannedText;
    const match = this.#comparisonModes[this.#comparisonMode].string(s, text);

    return this._normalOutputFrom(match, { type: 'string', key: s });
  }

  public scanString(s: string): string | null {
    const match = this._checkString(s);
    let finalResult: string | null;

    if (match.matched) {
      this.updateMatch(match.result);
      finalResult = this._normalOutputFrom(match, {
        type: match.type,
        key: match.key,
      });
    } else {
      finalResult = this._normalOutputFrom(match, {});
    }

    return finalResult;
  }

  public _checkRegex(r: RegExp): ScanOutputData {
    // Empty regex gets set to (?:)
    if (r.source === '(?:)') {
      return this._fullOutputFrom({ matched: false }, {});
    }

    let rSource = r.source;
    const rFlags = r.flags;

    if (!rSource.startsWith('^')) {
      rSource = '^' + rSource;
    }

    const text = this.unscannedText;
    const newR = new RegExp(rSource, rFlags);

    const match = this.#comparisonModes[this.#comparisonMode].regexp(
      newR,
      text,
    );

    return this._fullOutputFrom(match, { type: 'regex', key: r });
  }

  public checkRegex(r: RegExp): string | null {
    // Empty regex gets set to (?:)
    if (r.source === '(?:)') {
      return this._normalOutputFrom({ matched: false }, {});
    }

    let rSource = r.source;
    const rFlags = r.flags;

    if (!rSource.startsWith('^')) {
      rSource = '^' + rSource;
    }

    const text = this.unscannedText;
    const newR = new RegExp(rSource, rFlags);

    const match = this.#comparisonModes[this.#comparisonMode].regexp(
      newR,
      text,
    );

    return this._normalOutputFrom(match, { type: 'regex', key: r });
  }

  public scanRegex(r: RegExp): string | null {
    const match = this._checkRegex(r);
    let finalResult: string | null;

    if (match.matched) {
      this.updateMatch(match.result);
      finalResult = this._normalOutputFrom(match, {
        type: match.type,
        key: match.key,
      });
    } else {
      finalResult = this._normalOutputFrom(match, {});
    }

    return finalResult;
  }

  private _check(...options: ScanInputOption[]): ScanOutputData {
    let match: ScanOutputData = { matched: false };

    const check = (option: ScanInputOption) => {
      let result: ScanOutputData;

      // * String options get scanned in straightforward manner, checkString.
      if (typeof option === 'string') {
        // Use private version of method to guarantee consistent output.
        result = this._checkString(option);
        return result;
      }
      // * Regex options also straightforward, use checkRegex.
      else if (Object.prototype.toString.call(option) === '[object RegExp]') {
        // Use private version of method to guarantee consistent output.
        result = this._checkRegex(option as RegExp);
        return result;
      } else if (Array.isArray(option)) {
        // * Option array.length > 1 means enum option.
        if (option.length > 1) {
          // ! This means that there is an enum as the key for an enum, which is
          // ! not allowed as I don't want to recursively check enums in enums.
          if (Array.isArray(option[0]) && option[0].length > 1) {
            throw TypeError(
              'An XScanner cannot have an enum value for the key of an enum.',
            );
          }

          result = this._check(option[0]);

          result = this._fullOutputFrom(result, {
            type: 'enum',
            key: option[0],
            result: option[1],
          });

          return result;
        }
        // * Otherwise option array represents the name of a scan type.
        else {
          if (typeof option[0] !== 'string') {
            throw TypeError(
              'An XScanner type scan option cannot have a non-string name.',
            );
          }

          result = this._checkType(option[0]);

          return result;
        }
      }
      // * Not a valid scan option.
      else {
        return this._fullOutputFrom({ matched: false }, {});
      }
    };

    for (const option of options) {
      match = check(option);

      if (match.matched) {
        break;
      }
    }

    return match;
  }

  public check<Output extends ScanOutputData>(
    ...options: ScanInputOption[]
  ): Output {
    const match = this._check(...options);

    return this._outputFrom(match, {
      type: match.type,
      key: match.key,
      result: match.result,
    });
  }

  public scan<Output extends ScanOutputData>(
    ...options: ScanInputOption[]
  ): Output {
    const match = this._check(...options);
    let finalResult: Output;

    if (match.matched) {
      this.updateMatch(match.textMatched as string);
      finalResult = this._outputFrom(match, {
        type: match.type,
        key: match.key,
        result: match.result,
      });
    } else {
      finalResult = this._outputFrom(match, {});
    }

    return finalResult;
  }

  public checkEnum(key: ScanEnumKeyOption, value: any) {
    const match = this._check(key);
    return this._normalOutputFrom(match, {
      type: 'enum',
      key,
      result: value,
    });
  }

  public scanEnum(key: ScanEnumKeyOption, value: any) {
    // ! Enum cannot have enum key [option, output].
    if (Array.isArray(key) && key.length > 1) {
      throw TypeError(
        'An XScanner cannot have an enum value for the key of an enum.',
      );
    }

    const match = this._check(key);

    if (match.matched) {
      this.updateMatch(match.textMatched as string);
    }

    return this._normalOutputFrom(match, {
      type: 'enum',
      key,
      result: value,
    });
  }

  private _checkType(name: string, ...args: any[]) {
    if (!(name in this.types)) {
      throw Error(`Type "${name}" not found for XScanner.`);
    }

    const scanner = this.duplicate();
    const match = this.types[name](scanner, ...args);

    return this._fullOutputFrom(match, { type: `type:${name}`, key: name });
  }

  public checkType(name: string, ...args: any[]): string | null {
    if (!(name in this.types)) {
      throw Error(`Type "${name}" not found for XScanner.`);
    }

    const scanner = this.duplicate();
    const match = this.types[name](scanner, ...args);

    return this._normalOutputFrom(match, { type: `type:${name}`, key: name });
  }

  public scanType(name: string, ...args: any[]): string | null {
    if (!(name in this.types)) {
      throw Error(`Type "${name}" not found for XScanner.`);
    }

    const scanner = this.duplicate();
    const match = this.types[name](scanner, ...args);

    if (match.matched) {
      this.updateMatch(match.textMatched as string);
    }

    return this._normalOutputFrom(match, { type: `type:${name}`, key: name });
  }

  do(name: string, ...args: any[]) {
    if (!(name in this.macros)) {
      throw Error(`Macro "${name}" not found on XScanner.`);
    }

    this.macros[name](this, ...args);

    return this;
  }

  private _normalOutputFrom(
    match: ComparatorOutput,
    {
      type,
      key,
      result,
    }: { type?: string | null; key?: any | null; result?: any | null },
  ) {
    return this.#outputTypes.normal({
      matched: match.matched,
      type: match.matched ? type : null,
      key: match.matched ? key : null,
      result: match.matched
        ? result !== undefined
          ? result
          : match.textMatched
        : null,
      textMatched: match.matched ? match.textMatched : null,
    });
  }

  private _fullOutputFrom(
    match: ComparatorOutput,
    {
      type,
      key,
      result,
    }: { type?: string | null; key?: any | null; result?: any | null },
  ) {
    return this.#outputTypes.full({
      matched: match.matched,
      type: match.matched ? type : null,
      key: match.matched ? key : null,
      result: match.matched
        ? result !== undefined
          ? result
          : match.textMatched
        : null,
      textMatched: match.matched ? match.textMatched : null,
    });
  }
  private _outputFrom<Output extends ScanOutputData>(
    match: ComparatorOutput,
    {
      type,
      key,
      result,
    }: { type?: string | null; key?: any | null; result?: any | null },
  ): Output {
    return this.#outputTypes[this.#outputType]({
      matched: match.matched,
      type: match.matched ? type : null,
      key: match.matched ? key : null,
      result: match.matched
        ? result !== undefined
          ? result
          : match.textMatched
        : null,
      textMatched: match.matched ? match.textMatched : null,
    });
  }

  public toString() {
    let pointersList = Object.keys(this.#pointers)
      .map(
        (name) =>
          `${this.#pointers[name].pos.toString().padEnd(4)} @ "${name}"`,
      )
      .join('\n    ');

    pointersList = pointersList !== '' ? `{\n    ${pointersList}\n  }` : '{ }';

    const toList = (xs: object) => {
      let base = Object.keys(xs)
        .map((name) => `"${name}"`)
        .join('\n    ');

      base = base !== '' ? `{\n    ${base}\n  }` : '{ }';

      return base;
    };

    const lastMatch =
      typeof this.lastMatch === 'string'
        ? `"${this.lastMatch}"`
        : this.lastMatch;

    return (
      'XScanner {\n' +
      `  text:            "${this.text}"\n` +
      `  pos:             ${this.pos}\n` +
      `  lastPos:         ${this.lastPos}\n` +
      `  lastMatch:       ${lastMatch}\n` +
      `  outputType:      "${this.#outputType}"\n` +
      `  comparisonMode:  "${this.#comparisonMode}"\n` +
      `  pointers:        ${pointersList}\n` +
      `  types:           ${toList(this.#types)}\n` +
      `  macros:          ${toList(this.#macros)}\n` +
      `  outputTypes:     ${toList(this.#outputTypes)}\n` +
      `  comparisonModes: ${toList(this.#comparisonModes)}\n` +
      `  data:            ${toList(this.#data)}\n` +
      '}'
    );
  }
}
