const express = require('express');
const { createClient } = require('redis');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();
const port = 3000;

// Middleware
app.use(cors()); // מאפשר לפרונט לדבר איתנו
app.use(bodyParser.json());

// חיבור ל-Redis
// שימו לב: 'db' זה השם של הסרביס שנגדיר ב-Docker Compose
const client = createClient({
    url: 'redis://db:6379'
});

client.on('error', (err) => console.log('Redis Client Error', err));

async function startServer() {
    await client.connect();
    console.log('Connected to Redis');

    // API שמירה
    app.post('/api/room', async (req, res) => {
        const roomData = JSON.stringify(req.body);
        await client.set('my-room', roomData);
        console.log('Room saved to Redis!');
        res.send({ status: 'saved' });
    });

    // API טעינה
    app.get('/api/room', async (req, res) => {
        const roomData = await client.get('my-room');
        if (roomData) {
            res.send(JSON.parse(roomData));
        } else {
            res.send([]); // חדר ריק
        }
    });

    app.listen(port, () => {
        console.log(`Backend listening on port ${port}`);
    });
}

startServer();