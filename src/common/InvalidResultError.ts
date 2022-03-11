class InvalidResultError extends Error {
    constructor(result: string) {
        const msg = `Error: Invalid simulation result: '${result}'.`
        super(msg)
        this.name = this.constructor.name
    }
}

export default InvalidResultError;