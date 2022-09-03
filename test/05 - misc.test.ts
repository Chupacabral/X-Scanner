import { expect, should, config } from 'chai';
import { XScanner } from '../out/index';
import { SECTION } from './utils';
import {
  testText,
  goodString,
  goodStringCI,
  badString,
  goodRegex,
  goodRegexCI,
  badRegex,
  testEnumOutput,
  testPointerName,
  testTypeName,
  testMacroName,
} from './constants';

// Initialize chai.should so that it can be used.
should();

// Disable truncation from chai output.
config.truncateThreshold = 0;

var xs: XScanner;

// * TESTING START
describe(SECTION('XScanner - Misc Methods'), function () {
  this.beforeEach(function () {
    xs = new XScanner(testText);
  });

  describe('#do()', function () {
    xit('runs a given macro', function () {});

    xit('throws an error if macro not found', function () {});
  });

  describe('#toString()', function () {
    xit('outputs in the proper format', function () {});
  });
});
