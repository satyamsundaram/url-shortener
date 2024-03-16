## a simple url-shortener
[under development]

### Features
- storing mappings between shorturl -> originalurl
- validating originalurl for correctness
- generating shorturls using a hash of the originalurl to ensure uniqueness

### Tech stack
- currently using local <s>redis server</s> mysql server
- nodejs, express

### Upcoming features
- add more robust url validation (if possible)
- add functionality to set expiry for shorturl depending on maxVisits or validUntil
- add functionality to track number of visits to shorturl
- might need to use a database for this (might not if we map shorturl with [originalurl, visits, maxvisits, validuntil])
- add functionality to allow custom shorturl

### Mysql
```
CREATE TABLE IF NOT EXISTS urls (
    short_url VARCHAR(100) NOT NULL PRIMARY KEY,
    original_url VARCHAR(512) NOT NULL UNIQUE,
    creation_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    valid_until TIMESTAMP,
    visit_count INT NOT NULL DEFAULT 0,
    max_visits INT
);

// valid_until TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP + INTERVAL 30 DAY
// unable to create original_url of VARCHAR(1024) or VARCHAR(2048) with UNIQUE constraint on it

INSERT INTO urls (short_url, original_url) VALUES ('a23bde', 'https://www.facebook.com');
INSERT INTO urls (short_url, original_url, valid_until) VALUES ('3h2h2d', 'https://www.twitter.com', '2024-03-29 00:00:00');
INSERT INTO urls (short_url, original_url, max_visits) VALUES ('4h2h22', 'https://www.pinterest.com', 10);
```

### todo
- create separate files for different functionalities
- create separate functions wherever possible

### Notes
- table CSS borrowed from [this](https://codepen.io/AllThingsSmitty/pen/MyqmdM) codepen
