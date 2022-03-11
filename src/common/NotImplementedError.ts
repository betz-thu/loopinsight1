class NotImplementedError extends Error {
    constructor(className: string, methodName: string) {
        const msg = `Error: Method '${methodName}' not implemented in class '${className}'.`
        super(msg)
        this.name = this.constructor.name
    }

}

export default NotImplementedError;