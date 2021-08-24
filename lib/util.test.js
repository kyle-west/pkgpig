const { inc, diff } = require('./util');

diffTests = [
  [ '1.1.0', '1.1.1', 'patch' ],
  [ '1.1.0', '1.2.0', 'minor' ],
  [ '1.1.0', '2.0.0', 'major' ],
  
  [ '1.1.0', '1.1.1-alpha.0', 'patch-alpha' ],
  [ '1.1.0', '1.2.0-alpha.0', 'minor-alpha' ],
  [ '1.1.0', '2.0.0-alpha.0', 'major-alpha' ],
  
  [ '1.1.0', '1.1.1-beta.0', 'patch-beta' ],
  [ '1.1.0', '1.2.0-beta.0', 'minor-beta' ],
  [ '1.1.0', '2.0.0-beta.0', 'major-beta' ],

  [ '1.1.0-beta.0', '1.1.1-beta.0', 'patch-beta' ],
  [ '1.1.0-beta.0', '1.2.0-beta.0', 'minor-beta' ],
  [ '1.1.0-beta.0', '2.0.0-beta.0', 'major-beta' ],
  
  [ '1.1.1-beta.0', '1.1.1-beta.1', 'prerelease-beta' ],
  [ '1.2.0-beta.0', '1.2.0-beta.1', 'prerelease-beta' ],
  [ '2.0.0-beta.0', '2.0.0-beta.1', 'prerelease-beta' ],

  [ '0.1.0', '0.1.1', 'minor-pre' ],
  [ '0.1.0', '0.2.0', 'major-pre' ],
  [ '0.1.0', '1.0.0', 'major' ],

  [ '0.1.0', '0.1.1-alpha.0', 'minor-prealpha' ],
  [ '0.1.0', '0.2.0-alpha.0', 'major-prealpha' ],
  [ '0.1.0', '1.0.0-alpha.0', 'major-alpha' ],

  [ '0.1.0-alpha.0', '0.1.1-alpha.0', 'minor-prealpha' ],
  [ '0.1.0-alpha.0', '0.2.0-alpha.0', 'major-prealpha' ],
  [ '0.1.0-alpha.0', '1.0.0-alpha.0', 'major-alpha' ],

  [ '0.1.0-alpha.0', '0.1.0-alpha.1', 'prerelease-prealpha' ],
  [ '0.1.1-alpha.0', '0.1.1-alpha.1', 'prerelease-prealpha' ],
]

describe('diff', () => {
  diffTests.forEach(([ v1, v2, expected ]) => {
    it(`${v1} --> ${v2} : ${expected}`, () => expect(diff(v1, v2)).toEqual(expected));
  })
})

// inc should be 1:1 compatible with diff
incTests = diffTests.map(([ a, b, c ]) => [ a, c, b ])

describe('inc', () => {
  incTests.forEach(([ version, type, expected ]) => {
    it(`${type} of ${version}: ${expected}`, () => expect(inc(version, type)).toEqual(expected));
  });

  [
    [ '1.1.1', '1.2.0', 'minor-pre' ], // same as 'minor'
    [ '1.1.1', '2.0.0', 'major-pre' ], // same as 'major'
    [ '1.1.1-alpha.0', '1.2.0-alpha.0', 'minor-prealpha' ], // same as 'minor-alpha'
    [ '1.1.1-alpha.0', '2.0.0-alpha.0', 'major-prealpha' ], // same as 'major-alpha'
  ].forEach(([ original, pending, type ]) => {
    it(`MISS-USE ${type} of ${original}: ${pending}`, () => expect(inc(original, type)).toEqual(pending));
  });
})

