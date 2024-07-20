import * as uuid from "uuid";
export function assertUuid(str) {
    if (!uuid.validate(str)) {
        throw new Error(`Invalid UUID: ${str}`);
    }
}
