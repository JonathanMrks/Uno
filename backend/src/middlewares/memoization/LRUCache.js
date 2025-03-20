import _ from "lodash"

class LRUCache {
    constructor(max, maxAge) {
        this.cache = new Map();
        this.max = max;
        this.maxAge = maxAge;
        this.order = [];
    }

    _isExpired(key) {
        const node = this.cache.get(key);
        return Date.now() - node.timestamp > this.maxAge;
    }

    _moveToHead(key) {
        _.pull(this.order, key);
        this.order.unshift(key);
    }

    _evictIfNecessary() {
        if (this.order.length > this.max) {
            const lruKey = this.order.pop(); 
            this.cache.delete(lruKey);
        }
    }

    get(key) {
        if (!this.cache.has(key)) return null;

        if (this._isExpired(key)) {
            this.cache.delete(key);
            _.pull(this.order, key);
            return null;
        }

        this._moveToHead(key);
        this.cache.get(key).timestamp = Date.now()
        return this.cache.get(key).data;
    }

    set(key, data) {
        if (this.cache.has(key)) {
            this.cache.get(key).data = data;
            this.cache.get(key).timestamp = Date.now();
            this._moveToHead(key);
        } else {
            this.cache.set(key, { data, timestamp: Date.now() });
            this.order.unshift(key);
        }

        this._evictIfNecessary();
    }
}

export {LRUCache}