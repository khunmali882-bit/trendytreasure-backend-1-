const fs = require('fs').promises;
const path = require('path');

const dataDir = path.join(__dirname, '..', 'data');

// Simple in-memory mutex to prevent race conditions on file writes
const locks = {};

const getLock = (fileName) => {
    if (!locks[fileName]) {
        locks[fileName] = Promise.resolve();
    }
    return locks[fileName];
};

const readData = async (fileName) => {
    try {
        const filePath = path.join(dataDir, fileName);
        const data = await fs.readFile(filePath, 'utf8');
        const trimmed = data.trim();
        if (!trimmed) return [];
        return JSON.parse(trimmed);
    } catch (error) {
        if (error.code === 'ENOENT' || error instanceof SyntaxError) {
            return [];
        }
        throw error;
    }
};

const writeData = async (fileName, content) => {
    const lock = getLock(fileName);
    const newLock = lock.then(async () => {
        const filePath = path.join(dataDir, fileName);
        const tmpPath = filePath + '.tmp';
        try {
            await fs.writeFile(tmpPath, JSON.stringify(content, null, 2), 'utf8');
            await fs.rename(tmpPath, filePath);
        } catch (error) {
            console.error(`Error writing to ${fileName}:`, error);
            try { await fs.unlink(tmpPath); } catch (_) {}
            throw error;
        }
    });
    locks[fileName] = newLock;
    return newLock;
};

module.exports = { readData, writeData };
