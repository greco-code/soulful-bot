module.exports = {
    apps: [
        {
            name: "soulful-bot",
            script: "build/index.js",
            watch: false,
            autorestart: true,
            env: {
                NODE_ENV: "production",
                BOT_TOKEN: process.env.BOT_TOKEN,
                ADMIN_ID: process.env.ADMIN_ID,
                PGUSER: process.env.PGUSER,
                PGPASSWORD: process.env.PGPASSWORD,
                PGDATABASE: process.env.PGDATABASE,
                PGHOST: process.env.PGHOST,
                PGPORT: process.env.PGPORT,
                DATABASE_URL: process.env.DATABASE_URL
            }
        }
    ]
};
