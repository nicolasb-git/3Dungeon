import { defineConfig } from 'vite';
import fs from 'fs';
import path from 'path';

export default defineConfig({
    plugins: [
        {
            name: 'save-map-plugin',
            configureServer(server) {
                server.middlewares.use((req, res, next) => {
                    if (req.method === 'POST' && req.url === '/api/save-map') {
                        let body = '';
                        req.on('data', (chunk) => {
                            body += chunk.toString();
                        });
                        req.on('end', () => {
                            try {
                                const { floor, content } = JSON.parse(body);
                                if (!floor || !content) {
                                    res.statusCode = 400;
                                    res.end('Missing floor or content');
                                    return;
                                }

                                const mapsDir = path.resolve(process.cwd(), 'src/maps');
                                const filePath = path.join(mapsDir, `${floor}.txt`);

                                fs.writeFileSync(filePath, content);

                                res.setHeader('Content-Type', 'application/json');
                                res.statusCode = 200;
                                res.end(JSON.stringify({ message: `Level ${floor} saved successfully!` }));
                            } catch (err) {
                                res.statusCode = 500;
                                res.end(JSON.stringify({ error: err.message }));
                            }
                        });
                        return;
                    }
                    next();
                });
            }
        }
    ]
});
