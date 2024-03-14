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
        return mysql.createPool({
          host: process.env.MYSQL_HOST,
          user: process.env.MYSQL_USER,
          password: process.env.MYSQL_PASSWORD,
          database: process.env.MYSQL_DATABASE,
        });
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

const shortUrlExists = async (client, shortUrl) => {
    try {
        const [results] = await client.execute(
          "SELECT COUNT(*) FROM `urls` WHERE `short_url` = ?",
          [shortUrl]
        )
        return results[0]["COUNT(*)"] == 1
    } catch(error) {
        console.log("Error in checking if short url exists: ", error)
        throw new Error("Error in checking if short url exists: " + error)
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

        if(await shortUrlExists(client, shortUrl) == true) return res.status(409).json({ error: "Shortened url already exists for this url" });

        await client.execute(
            'INSERT INTO `urls` (`short_url`, `original_url`, `valid_until`, `max_visits`) VALUES (?, ?, ?, ?)',
            [shortUrl, originalUrl, validUntil, maxVisits]
        )      
        res.status(201).json({ shortUrl });
    } catch(error) {
        console.log("Error in shortening url: ", error);
        res.status(500).json({ "Error in shortening url": error.message });
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
        console.log("Error in getting urls:", err);
        res.status(500).json({ "Error in getting urls": err.message });
    }
})

app.put("/url", async (req, res) => {
    try {
        let { shortUrl, validUntil, maxVisits } = req.body;
        if(!validUntil) validUntil = null;
        if(!maxVisits) maxVisits = null;

        const client = await getMysqlConnecion();
        
        if(await shortUrlExists(client, shortUrl) == false) return res.status(404).json({ error: "Short url not found" });

        await client.execute(
            'UPDATE `urls` SET `valid_until` = ?, `max_visits` = ? WHERE `short_url` = ?',
            [validUntil, maxVisits, shortUrl]
        )
        const [results] = await client.execute(
            'SELECT * FROM `urls` WHERE `short_url` = ?',
            [shortUrl]
        )
        res.status(200).json({ "updatedUrl": results });
    } catch (err) {
        console.log("Error in updating url:", err);
        res.status(500).json({ "Error in updating url": err.message });
    }
})

app.delete("/url", async (req, res) => {
    try {
        const { shortUrl } = req.body;
        const client = await getMysqlConnecion();

        if(await shortUrlExists(client, shortUrl) == false) return res.status(404).json({ error: "Short url not found" });

        await client.execute(
            'DELETE FROM `urls` WHERE `short_url` = ?',
            [shortUrl]
        )
        res.status(200).json({ "deletedUrl": shortUrl });
    } catch (err) {
        console.log("Error in deleting url:", err);
        res.status(500).json({ "Error in deleting url": err.message });
    }
})

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`)
})
