function getEnv(key: string): string {
    const value = process.env[key];
    if (!value) {
        throw new Error(`Missing environment variable: ${key}`);
    }
    return value;
}

export const env = {
    BOT_TOKEN: getEnv("BOT_TOKEN"),
    CONNECTION_URL: getEnv("CONNECTION_URL"), 
};
