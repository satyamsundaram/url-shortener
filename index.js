import express from "express"
import mysql from "mysql2/promise"
import { createHmac } from "node:crypto"
import 'dotenv/config'

const PORT = process.env.PORT || 5000
const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

const getMysqlConnecion = async () => {
    try {
        const pool = await mysql.createPool({
          host: process.env.MYSQL_HOST,
          user: process.env.MYSQL_USER,
          password: process.env.MYSQL_PASSWORD,
          database: process.env.MYSQL_DATABASE,
        });

        return pool;
    } catch(err) {
        console.log("Error in getting mysql connection: ", err);
        throw new Error("Error in getting mysql connection: " + err)
    }
}

const isValid = (url) => {
    try {
        return (url.startsWith("http://") || url.startsWith("https://")) && url.includes(".") && url.length > 10
    } catch (error) {
        console.log("Error in validating url: ", error)
        throw new Error("Error in validating url: " + error)
    }
}

const getShortUrl = (url) => {
    try {
        const hash = createHmac("sha256", process.env.HASH_SECRET)
        .update(url)
        .digest("hex");

        const truncatedHash = hash.slice(0, 8);

        const encodedHash = Buffer.from(truncatedHash, "hex")
        .toString("base64")
        .replace(/\+/g, "S")
        .replace(/\//g, "x")
        .replace(/=/g, "");

        return encodedHash;
    } catch(error) {
        console.log("Error in getting short url: ", error)
        throw new Error("Error in getting short url: " + error)
    }
}

app.post("/shorten", async (req, res) => {
    try {
        let { originalUrl, validUntil, maxVisits } = req.body;
        if(!isValid(originalUrl)) return res.status(400).json({error: 'Please enter a valid url'})
        
        const shortUrl = getShortUrl(originalUrl);
        if(!validUntil) validUntil = null;
        if(!maxVisits) maxVisits = null;
        
        const client = await getMysqlConnecion();
        const [results] = await client.execute(
            'SELECT COUNT(*) FROM `urls` WHERE `short_url` = ?',
            [shortUrl]
        )
        if(results[0]['COUNT(*)'] == 1) return res.status(409).json({error: 'Shortened url already exists for this url'})

        await client.execute(
            'INSERT INTO `urls` (`short_url`, `original_url`, `valid_until`, `max_visits`) VALUES (?, ?, ?, ?)',
            [shortUrl, originalUrl, validUntil, maxVisits]
        )      
        res.status(201).json({ shortUrl });
    } catch(error) {
        console.log("Error shortening url: ", error);
        res.status(500).json({ "Error shortening url": error.message });
    }
})

app.get("/listurls", async (req, res) => {
    try {
        const client = await getMysqlConnecion();
        const [results] = await client.execute(
            'SELECT * FROM `urls`'
        )
        res.status(200).json({ "urls": results });
    } catch (err) {
        console.log(err);
        res.status(500).json({ "Error getting urls": err.message });
    }
})

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`)
})
