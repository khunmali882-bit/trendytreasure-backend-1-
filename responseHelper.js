const sendJSON = (res, status, data) => {
    res.writeHead(status, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(data));
};

const sendError = (res, status, message) => {
    res.writeHead(status, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: message }));
};

const getRequestBody = (req) => {
    return new Promise((resolve, reject) => {
        let body = '';
        req.on('data', chunk => {
            body += chunk.toString();
        });
        req.on('end', () => {
            try {
                const trimmed = body.trim();
                if (!trimmed) {
                    resolve({});
                } else {
                    resolve(JSON.parse(trimmed));
                }
            } catch (error) {
                reject(new Error('Invalid JSON in request body'));
            }
        });
        req.on('error', (err) => {
            reject(err);
        });
    });
};

module.exports = { sendJSON, sendError, getRequestBody };
