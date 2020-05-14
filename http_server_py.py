import http.server
import socketserver

PORT = 8080
Handler = http.server.SimpleHTTPRequestHandler

with socketserver.TCPServer(("", PORT), Handler) as httpd:
    print("serving at http://localhost:"+ str(PORT)+ " or http://127.0.0.1:"+str(PORT))
    httpd.serve_forever()
