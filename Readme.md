# Soulful-Bot

Soulful-Bot is a Telegram bot designed for managing events, specifically tailored for Soulful Mafclub Toronto. It allows admins to create events, manage attendees, and handle RSVP actions.

## Features

- Create new events with descriptions and maximum attendee limits
- Users can register or unregister from events via inline buttons
- Admins can manage the list of attendees and add/remove other admins
- PostgreSQL database with Docker containerization
- Production-ready deployment setup

## Requirements

- Docker and Docker Compose
- Node.js (v18 or later)
- PostgreSQL (via Docker)
- Telegram Bot Token from [BotFather](https://t.me/botfather)

## Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/yourusername/soulful-bot.git
cd soulful-bot
```

### 2. Install dependencies

```bash
yarn install
```

### 3. Environment Configuration

Create environment files in the root of the project:

**For development** (`.env.dev`):
```env
BOT_TOKEN=your_telegram_bot_token
ADMIN_ID=your_initial_admin_telegram_id
PGUSER=postgres
PGPASSWORD=your_password
PGDATABASE=soulful_bot
PGHOST=postgres
PGPORT=5432
```

**For production** (`.env.prod`):
```env
BOT_TOKEN=your_production_telegram_bot_token
ADMIN_ID=your_initial_admin_telegram_id
PGUSER=postgres
PGPASSWORD=your_secure_password
PGDATABASE=soulful_bot
PGHOST=postgres
PGPORT=5432
```

**Environment Variables:**
- `BOT_TOKEN`: Your Telegram bot token obtained from the BotFather
- `ADMIN_ID`: Your Telegram ID to be set as the initial admin
- `PGUSER`: PostgreSQL username
- `PGPASSWORD`: PostgreSQL password
- `PGDATABASE`: PostgreSQL database name
- `PGHOST`: PostgreSQL host (use `postgres` for Docker, `localhost` for local)
- `PGPORT`: PostgreSQL port (default: 5432)

### 4. Running the Bot

**Development mode:**
```bash
make dev
```

**Production mode:**
```bash
make up
```
## Makefile Commands

The project includes a comprehensive Makefile for managing Docker containers, databases, and deployments. Run `make help` to see all available commands.

### Production Commands

| Command | Description |
|---------|-------------|
| `make up` | Start production containers using `.env.prod` file |
| `make down` | Stop production containers |
| `make build` | Rebuild production containers |
| `make logs` | Show production container logs (follow mode) |
| `make status` | Show production container status |

**Example:**
```bash
# Start production environment
make up

# View logs
make logs

# Check status
make status

# Stop when done
make down
```

### Development Commands

| Command | Description |
|---------|-------------|
| `make dev` | Start development containers using `.env.dev` |
| `make dev-down` | Stop development containers |
| `make dev-logs` | Show development container logs (follow mode) |
| `make dev-status` | Show development container status |

**Example:**
```bash
# Start development environment
make dev

# View logs
make dev-logs

# Stop when done
make dev-down
```

### Database Commands

| Command | Description |
|---------|-------------|
| `make db-shell` | Connect to production PostgreSQL shell |
| `make dev-db-shell` | Connect to development PostgreSQL shell |
| `make dev-db-reset` | Reset development database (stops containers, removes volume, restarts) |

**Example:**
```bash
# Connect to development database
make dev-db-shell

# Reset development database (useful for testing)
make dev-db-reset
```

**Database Shell Usage:**
Once connected, you can run SQL commands:
```sql
-- List all tables
\dt

-- Query events
SELECT * FROM events;

-- Exit
\q
```

### Cleanup Commands

| Command | Description |
|---------|-------------|
| `make clean` | Stop and remove production containers, networks, and volumes |
| `make dev-clean` | Stop and remove development containers, networks, and volumes |
| `make force-clean` | Force stop and remove ALL containers (dev + prod) |

**Example:**
```bash
# Clean up development environment
make dev-clean

# Nuclear option - remove everything
make force-clean
```

### Help

```bash
make help
```

Displays all available commands with descriptions.

## Bot Usage

### Commands

- `/start` - Welcome message for the bot
- `/event "Event Description" max_attendees` - Creates a new event (admin only)
- `/addplayer <name>` - Admin command to add a player to the event
- `/removeplayer <name>` - Admin command to remove a player from the event
- `/addadmin <user_id>` - Admin command to add a new admin
- `/removeadmin <user_id>` - Admin command to remove an admin
- `/updatedescription "New Description"` - Update event description (admin only)
- `/updatemaxattendees <number>` - Update max attendees for event (admin only)

### Registering for Events

Users can register or unregister from events by clicking the inline buttons provided in the event message.

### Admin Actions

Admins can add or remove attendees manually and manage other admins. Only admins can perform these actions.

## Testing Production-Like Environment

To test your bot in a production-like environment locally:

1. Ensure your `.env.prod` file has test credentials
2. Run: `make up`
3. Test your bot functionality
4. Check logs: `make logs`
5. Stop when done: `make down`

This uses the same Docker setup as production, so you can catch issues before deploying.

## Deployment

The bot is containerized with Docker and can be deployed to any platform that supports Docker Compose:

- **DigitalOcean App Platform**
- **AWS ECS**
- **Google Cloud Run**
- **Railway**
- **Fly.io**
- **Self-hosted VPS**

### Deployment Steps

1. Set up your environment variables on your deployment platform
2. Ensure Docker and Docker Compose are available
3. Run `make up` or use your platform's Docker Compose support
4. Monitor logs using `make logs`

### Environment Variables for Production

Make sure to set all required environment variables:
- `BOT_TOKEN`
- `ADMIN_ID`
- `PGUSER`
- `PGPASSWORD`
- `PGDATABASE`
- `PGHOST`
- `PGPORT`

## License

This project is licensed under the ISC License.

## Author

George Vesper
