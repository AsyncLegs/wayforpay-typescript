import * as https from 'https';
import { parse } from 'url';
import { HttpMethod } from './enums';

export const request = (url: string, requestData: any) => {
  const { port, hostname, path } = parse(url);
  return new Promise((resolve, reject) => {
    const httpRequest = https.request(
      {
        headers: requestData.headers,
        hostname,
        method: requestData.method as HttpMethod,
        path,
        port
      },
      response => {
        if (
          response &&
          response.statusCode &&
          (response.statusCode < 200 || response.statusCode > 299)
        ) {
          reject(
            new Error(
              `Request failed, status code: ${
                response.statusCode
              }, message is : ${response.statusMessage}`
            )
          );
        }

        const body: any[] = [];
        response.on('data', chunk => body.push(chunk));
        response.on('end', () => resolve(body.join('')));
        response.on('error', err => reject(err));
      }
    );
    httpRequest.on('error', err => reject(err));
    if (requestData.body) {
      httpRequest.write(requestData.body);
    }
    httpRequest.end();
  });
};
