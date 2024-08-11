Soulful-Bot
Soulful-Bot is a Telegram bot designed for managing events, specifically tailored for Soulful Mafclub Toronto. It allows admins to create events, manage attendees, and handle RSVP actions.

Features
Create new events with descriptions and maximum attendee limits.
Users can register or unregister from events via inline buttons.
Admins can manage the list of attendees and add/remove other admins.
Automatic database handling with SQLite.
Requirements
Node.js (v14 or later)
SQLite database (automatically created)
Getting Started
1. Clone the repository
   bash
   Copy code
   git clone https://github.com/yourusername/soulful-bot.git
   cd soulful-bot
2. Install dependencies
   bash
   Copy code
   yarn install
3. Create a .env file
   In the root of the project, create a .env file with the following contents:

env
Copy code
BOT_TOKEN=your_telegram_bot_token
ADMIN_ID=your_initial_admin_telegram_id
BOT_TOKEN: Your Telegram bot token obtained from the BotFather.
ADMIN_ID: Your Telegram ID to be set as the initial admin.
4. Running the bot in development
   To start the bot in development mode with hot-reloading, run:

bash
Copy code
yarn dev
5. Building and running for production
   To build the project and start the bot in production mode:

bash
Copy code
yarn build
yarn start
6. Cleaning the project
   To clean up node_modules, yarn.lock, and build files, run:

bash
Copy code
yarn cleanAll
Usage
Commands
/start - Welcome message for the bot.
/event "Event Description" max_attendees - Creates a new event.
/addplayer <name> - Admin command to add a player to the event.
/removeplayer <name> - Admin command to remove a player from the event.
/addadmin <user_id> - Admin command to add a new admin.
/removeadmin <user_id> - Admin command to remove an admin.
Registering for Events
Users can register or unregister from events by clicking the inline buttons provided in the event message.

Admin Actions
Admins can add or remove attendees manually and manage other admins. Only admins can perform these actions.

Deployment
You can deploy the bot on platforms like Heroku, DigitalOcean, AWS, or Railway. Make sure to set the environment variables for BOT_TOKEN and ADMIN_ID when deploying.

Example for Heroku Deployment
Create an app on Heroku.
Set up environment variables BOT_TOKEN and ADMIN_ID on Heroku.
Push your code to Heroku:
bash
Copy code
git push heroku main
Your bot should start running automatically.
License
This project is licensed under the ISC License. See the LICENSE file for details.

Author
George Vesper
