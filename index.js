import express from "express"
import { createClient } from "redis"
import { createHmac } from "node:crypto"
import 'dotenv/config'

const PORT = process.env.PORT || 5000
const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));


const getRedisClient = async () => {
    const client = await createClient()
    .on("error", (err) => console.log("Redis client error", err))
    .on("connect", () => console.log("Redis client connected"))
    .on("reconnecting", () => console.log("Redis client reconnecting"))
    .on("ready", () => console.log("Redis client ready"))
    .connect()

    return client;
}

const isValid = (url) => {
    try {
        return (url.startsWith("http://") || url.startsWith("https://")) && url.includes(".") && url.length > 10
    } catch (error) {
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
        throw new Error("Error in getting short url: " + error)
    }
}

app.post("/shorten", async (req, res) => {
    try {
        const { originalUrl } = req.body;
        if(!isValid(originalUrl)) return res.status(400).json({error: 'Please enter a valid url'})
        
        const shortUrl = getShortUrl(originalUrl);
        
        const client = await getRedisClient();
        if(await client.exists(shortUrl).catch((err) => console.log("Error in GET:", err)))
            return res.status(409).json({error: 'Shortened url already exists for this url'})
        
        await client.set(shortUrl, originalUrl).catch((err) => console.log("Error in SET:", err))
        
        client.disconnect();
        res.status(201).json({ shortUrl });
    } catch(error) {
        res.status(500).json({ "Error shortening url": error.message });
    }
})

app.get("/listurls", async (req, res) => {
    const client = await getRedisClient();
    let urls = []
    
    const keys = await client.keys("*").catch((err) => console.log("Error in GET:", err))
    
    for (const key in keys) {
        const value = await client.get(keys[key])
        urls.push({originalUrl: value, shortUrl: keys[key]})
    }

    await client.disconnect();
    res.status(200).json({ urls });
})

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`)
})
