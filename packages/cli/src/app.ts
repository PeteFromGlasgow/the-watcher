import { getProgram } from './cli.js'

(await getProgram(out => console.log(JSON.stringify(out, null, 2)))).parse()
