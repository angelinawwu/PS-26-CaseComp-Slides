import react from '@vitejs/plugin-react'
import { readFile, writeFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { defineConfig, type Plugin } from 'vite'

/**
 * Edit mode's notes, read and written as one JSON file in the repo.
 *
 * The notes are the team's shared shot list (which footage and which prototype
 * clip lands on which slide), so they live in `notes/slide-notes.json` and go
 * through git like everything else, not in one person's browser. The dev
 * server answers GET and PUT on `/__notes`; the file sits outside `src` and is
 * left out of the watcher, so a save never reloads the page you are typing in.
 */
function slideNotes(): Plugin {
  const file = fileURLToPath(new URL('./notes/slide-notes.json', import.meta.url))

  return {
    name: 'slide-notes',
    apply: 'serve',
    configureServer(server) {
      server.middlewares.use('/__notes', (req, res) => {
        if (req.method === 'GET') {
          readFile(file, 'utf8').then(
            (text) => {
              res.setHeader('Content-Type', 'application/json')
              res.setHeader('Cache-Control', 'no-store')
              res.end(text)
            },
            () => {
              res.statusCode = 404
              res.end()
            },
          )
          return
        }

        if (req.method === 'PUT') {
          let body = ''
          req.setEncoding('utf8')
          req.on('data', (chunk: string) => {
            body += chunk
          })
          req.on('end', () => {
            let parsed: unknown
            try {
              parsed = JSON.parse(body)
            } catch {
              res.statusCode = 400
              res.end('Not JSON')
              return
            }
            writeFile(file, `${JSON.stringify(parsed, null, 2)}\n`).then(
              () => {
                res.statusCode = 204
                res.end()
              },
              (error: unknown) => {
                res.statusCode = 500
                res.end(String(error))
              },
            )
          })
          return
        }

        res.statusCode = 405
        res.end()
      })
    },
  }
}

export default defineConfig({
  plugins: [react(), slideNotes()],
  server: {
    // Vite's default binds IPv6 only, so `127.0.0.1:5196` refuses the
    // connection and any browser that resolves localhost to IPv4 first sees
    // nothing. Binding every interface answers on both stacks — and lets a
    // phone on the same network open the deck for a real presenter test.
    host: true,
    port: 5196,
    watch: {
      ignored: ['**/notes/**'],
    },
  },
})
