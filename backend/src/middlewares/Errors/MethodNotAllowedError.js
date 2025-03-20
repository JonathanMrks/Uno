class MethodNotAllowedError extends Error {
    constructor(message) {
        super(message);
        this.name = 'MethodNotAllowedError';
        this.status = 405;
    }
}

export default MethodNotAllowedError;
