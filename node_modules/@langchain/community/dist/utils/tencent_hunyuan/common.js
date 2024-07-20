export const service = "hunyuan";
export const signedHeaders = `content-type;host`;
export const getDate = (timestamp) => {
    const date = new Date(timestamp * 1000);
    const year = date.getUTCFullYear();
    const month = `0${(date.getUTCMonth() + 1).toString()}`.slice(-2);
    const day = `0${date.getUTCDate()}`.slice(-2);
    return `${year}-${month}-${day}`;
};
