## a simple url-shortener
[under development]

### Features
- storing mappings between shorturl -> originalurl
- validating originalurl for correctness
- generating shorturls using a hash of the originalurl to ensure uniqueness

### Tech stack
- currently using local redis server
- nodejs, express

### Upcoming features
- add more robust url validation (if possible)
- add functionality to set expiry for shorturl depending on maxVisits or validUntil
- add functionality to track number of visits to shorturl
- might need to use a database for this (might not if we map shorturl with [originalurl, visits, maxvisits, validuntil])
- add functionality to allow custom shorturl
