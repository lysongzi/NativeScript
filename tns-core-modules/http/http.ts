import * as image from "image-source";
import * as httpRequest from "./http-request";

global.moduleMerge(httpRequest, exports);

export function getString(arg: any): Promise<string> {
    return new Promise<string>((resolve, reject) => {
        httpRequest.request(typeof arg === "string" ? { url: arg, method: "GET" } : arg)
            .then(r => {
            try {
                var str = r.content.toString();
                resolve(str);
            } catch (e) {
                reject(e);
            }
        }, e => reject(e));
    });
}

export function getJSON<T>(arg: any): Promise<T> {
    return new Promise<T>((resolve, reject) => {
        httpRequest.request(typeof arg === "string" ? { url: arg, method: "GET" } : arg)
            .then(r => {
            try {
                var json = r.content.toJSON();
                resolve(json);
            } catch (e) {
                reject(e);
            }
        }, e => reject(e));
    });
}

export function getImage(arg: any): Promise<image.ImageSource> {
    return httpRequest
        .request(typeof arg === "string" ? { url: arg, method: "GET" } : arg)
        .then(responce => responce.content.toImage());
}

export function getFile(arg: any, destinationFilePath?: string): Promise<any> {
    return new Promise<any>((resolve, reject) => {
        httpRequest.request(typeof arg === "string" ? { url: arg, method: "GET" } : arg)
            .then(r => {
                try {
                    var file = r.content.toFile(destinationFilePath);
                    resolve(file);
                } catch (e) {
                    reject(e);
                }
            }, e => reject(e));
    });
}
