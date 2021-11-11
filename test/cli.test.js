const { resolve } = require('path')
const { spawn } = require('child_process')

const KEY_STROKE = {
  ARROW_UP: '\u001b[A',
  ARROW_DOWN: '\u001b[B',
  ARROW_LEFT: '\u001b[C',
  ARROW_RIGHT: '\u001b[D',
  ENTER: '\n',
}

class CLITestInstance {
  constructor({ args, scope = 'mono1' } = {}) {
    const script = resolve('./cli.js')
    this.cli = spawn(script, args, { cwd: resolve(`test/${scope}`) })
  }

  output(timeout = 1000) {
    return new Promise((resolve) => {
      let data = ''
      let submit
      this.cli.stdout.on('data', (buffer) => {
        data += buffer.toString()
        clearTimeout(submit)
        submit = setTimeout(() => resolve(data), timeout)
      })
    })
  }

  input(...args) {
    return this.cli.stdin.write(...args)
  }

  cleanup() {
    return this.cli.kill()
  }
}

function loosely(str) {
  if (Array.isArray(str)) {
    str = str[0]
  }
  return str
    .replace(/[^a-zA-Z0-9 !@#$%^&*()-=_+[\]{}\\|;':",.<>/?`~┌┬┐├┼┤└┴┘│─]/g, ' ')
    .replace(/\[\d+[A-z]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

// ================================================================================================

describe('CLI', () => {
  it('should give help menu when no options given', async () => {
    const cli = new CLITestInstance()
    const output = await cli.output()
    expect(loosely(output)).toEqual(loosely`
      Usage: cli [options] [command]
      Manage semantic versioning in a monorepo context.
      Options:
        -V, --version        output the version number
        -h, --help           display help for command
      Commands:
        sync                 Manage package versions in coordination
        graph [packages...]  View the dependency graph
        help [command]       display help for command
    `)
    await cli.cleanup()
  })

  describe('graph', () => {
    it('should list out the entire inverse dependency graph', async () => {
      const cli = new CLITestInstance({ args: ['graph'] })
      let output = await cli.output()
      expect(loosely(output)).toEqual(loosely`
      @test/mono1-a is depended on by:  
        as a peerDependency:   @test/mono1-c  @test/mono1-d  @test/mono1-b  
      
      @test/mono1-b is depended on by:   
        as a devDependency:    @test/mono1-c  @test/mono1-d 
      
      @test/mono1-c is depended on by: 
        as a dependency:       @test/mono1-d   
      
      @test/mono1-d is depended on by:    
      
      @test/mono1-e is depended on by:   
      `)
      await cli.cleanup()
    })

    it('should scope the inverse dependency graph when an argument is given', async () => {
      const cli = new CLITestInstance({ args: ['graph', '@test/mono1-a'] })
      let output = await cli.output()
      expect(loosely(output)).toEqual(loosely`
        @test/mono1-a is depended on by:  
          as a peerDependency:   @test/mono1-c  @test/mono1-d  @test/mono1-b  
      `)
      await cli.cleanup()
    })
  })

  describe('sync', () => {
    it('should list available options', async () => {
      const cli = new CLITestInstance({ args: ['sync'] })
      let output = await cli.output()
      expect(loosely(output)).toEqual(loosely`
        ? What would you like to do?: (Use arrow keys)
        ❯ Prepare new release
          View out of sync packages
          Update out of sync packages
      `)
      await cli.cleanup()
    })

    it('should let me view out of sync packages (no changes needed)', async () => {
      const cli = new CLITestInstance({ args: ['sync'] })
      await cli.output()

      await cli.input(KEY_STROKE.ARROW_DOWN)
      await cli.output() // wait for selection rerender
      await cli.input(KEY_STROKE.ENTER)

      expect(await cli.output()).toContain('Everything up to date.')

      await cli.cleanup()
    })

    it('should let me view out of sync packages (one package out of sync)', async () => {
      const cli = new CLITestInstance({ args: ['sync'], scope: 'mono2' })
      await cli.output()

      await cli.input(KEY_STROKE.ARROW_DOWN)
      await cli.output() // wait for selection rerender
      await cli.input(KEY_STROKE.ENTER)

      expect(loosely(await cli.output())).toContain(loosely`
        peerDependencies
        ┌─────────┬─────────────────┬────────────────────────┬─────────┐
        │ (index) │      name       │        requires        │ current │
        ├─────────┼─────────────────┼────────────────────────┼─────────┤
        │    0    │ '@test/mono2-b' │ '@test/mono2-a@^1.0.0' │ '2.0.0' │
        │    1    │ '@test/mono2-c' │ '@test/mono2-a@^1.0.0' │ '2.0.0' │
        │    2    │ '@test/mono2-d' │ '@test/mono2-a@^1.0.0' │ '2.0.0' │
        └─────────┴─────────────────┴────────────────────────┴─────────┘
      `)

      await cli.cleanup()
    })

    it('should allow updating of out of sync packages', async () => {
      const cli = new CLITestInstance({ args: ['sync'], scope: 'mono2' })
      await cli.output()

      await cli.input(KEY_STROKE.ARROW_DOWN)
      await cli.output() // wait for selection rerender
      await cli.input(KEY_STROKE.ARROW_DOWN)
      await cli.output() // wait for selection rerender
      await cli.input(KEY_STROKE.ENTER)

      expect(loosely(await cli.output())).toContain(loosely`
        The following packages will update:
          @test/mono2-b 1.0.0 --> 2.0.0
          @test/mono2-c 1.0.0 --> 2.0.0
          @test/mono2-d 1.0.0 --> 2.0.0
      `)

      await cli.cleanup()
    })

    it('should migration of a package', async () => {
      const cli = new CLITestInstance({ args: ['sync'] })
      await cli.output()
      await cli.input(KEY_STROKE.ENTER)

      expect(loosely(await cli.output())).toContain(loosely`
        ? Which package are you wanting to release?: (Use arrow keys)
        ❯ @test/mono1-a 
          @test/mono1-b 
          @test/mono1-c 
          @test/mono1-d 
          @test/mono1-e 
      `)

      await cli.input(KEY_STROKE.ENTER)

      expect(loosely(await cli.output())).toContain(loosely`
        ? What is the new version (current is 1.0.0)?
      `)

      await cli.input('2.0.0-alpha.0')
      await cli.input(KEY_STROKE.ENTER)

      expect(loosely(await cli.output())).toContain(loosely`
        Preparing update for @test/mono1-a to move to version 2.0.0-alpha.0
        Moving @test/mono1-a from 1.0.0 to 2.0.0-alpha.0 implies:
          @test/mono1-a 1.0.0 --> 2.0.0-alpha.0
          @test/mono1-b 1.0.0 --> 2.0.0-alpha.0
          @test/mono1-c 1.0.0 --> 2.0.0-alpha.0
          @test/mono1-d 1.0.0 --> 2.0.0-alpha.0
      `)

      await cli.cleanup()
    })
  })
})
