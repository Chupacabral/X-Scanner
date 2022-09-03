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
describe(SECTION('XScanner - Scan Methods'), function () {
  this.beforeEach(function () {
    xs = new XScanner(testText);
  });

  describe('#scanString()', function () {
    xit('properly scans a string input and updates position', function () {});
  });
});
