export function createGILManager() {
    let currentState = 'released';
    let acquireCount = 0;
    let releaseCount = 0;
    let contentionCount = 0;
    const manager = {
        acquire() {
            if (currentState === 'held') {
                contentionCount++;
                return;
            }
            currentState = 'held';
            acquireCount++;
        },
        release() {
            if (currentState === 'released')
                return;
            currentState = 'released';
            releaseCount++;
        },
        getState() {
            return currentState;
        },
        getStats() {
            return {
                acquireCount,
                releaseCount,
                contentionCount,
                currentState,
            };
        },
        reset() {
            currentState = 'released';
            acquireCount = 0;
            releaseCount = 0;
            contentionCount = 0;
        },
        destroy() {
            manager.reset();
        },
    };
    return manager;
}
//# sourceMappingURL=gil-manager.js.map