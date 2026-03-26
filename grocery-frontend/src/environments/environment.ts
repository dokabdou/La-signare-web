export const environment = {
  production: false,
  // If this runs on the server (SSR), use the Docker container name.
  // If it runs in the browser, use localhost.
  apiUrl:
    typeof process !== 'undefined' && process.env['API_URL']
      ? process.env['API_URL']
      : 'http://localhost:8080/api',
};
