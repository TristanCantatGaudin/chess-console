from http.server import SimpleHTTPRequestHandler, HTTPServer
import urllib.request

class ProxyHandler(SimpleHTTPRequestHandler):
    def do_GET(self):
        if self.path.startswith("/study/"):
            study_id = self.path.split("/study/")[1]
            url = f"https://lichess.org/study/{study_id}.pgn"

            try:
                with urllib.request.urlopen(url) as response:
                    content = response.read()

                self.send_response(200)
                self.send_header("Content-type", "text/plain")
                self.send_header("Access-Control-Allow-Origin", "*")
                self.end_headers()
                self.wfile.write(content)
            except Exception as e:
                self.send_error(500, str(e))
        else:
            super().do_GET()

if __name__ == "__main__":
    server = HTTPServer(("localhost", 8000), ProxyHandler)
    print("Server running at http://localhost:8000")
    server.serve_forever()
