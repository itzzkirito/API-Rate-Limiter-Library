"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RateLimitError = void 0;
/**
 * Rate limit error
 */
class RateLimitError extends Error {
    constructor(message, result) {
        super(message);
        this.result = result;
        this.name = 'RateLimitError';
        Object.setPrototypeOf(this, RateLimitError.prototype);
    }
}
exports.RateLimitError = RateLimitError;
//# sourceMappingURL=types.js.map