function requireEnv(name) {
    const value = process.env[name];
    if (value === undefined || value === '' || value === null) {
        throw new Error(`Missing required environment variable: ${name}`);
    }
    return value;
}

module.exports = requireEnv;
