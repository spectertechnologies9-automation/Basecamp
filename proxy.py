"""
Multi-threaded localhost HTTP/HTTPS CONNECT proxy in Python standard library.
Enables node.exe to reach external registries via 127.0.0.1 across parallel connections.
"""
import socket
import select
import sys
from http.server import ThreadingHTTPServer, BaseHTTPRequestHandler

class ProxyHandler(BaseHTTPRequestHandler):
    def do_CONNECT(self):
        host, port = self.path.split(":")
        port = int(port)
        try:
            remote = socket.create_connection((host, port), timeout=30)
            self.send_response(200, "Connection Established")
            self.end_headers()
        except Exception as e:
            self.send_error(502, f"Bad Gateway: {e}")
            return

        conns = [self.connection, remote]
        while True:
            rlist, _, xlist = select.select(conns, [], conns, 30)
            if xlist or not rlist:
                break
            for sock in rlist:
                other = remote if sock is self.connection else self.connection
                try:
                    data = sock.recv(65536)
                    if not data:
                        return
                    other.sendall(data)
                except Exception:
                    return

    def do_GET(self):
        import urllib.request
        try:
            req = urllib.request.Request(self.path, headers={k: v for k, v in self.headers.items() if k.lower() != 'host'})
            with urllib.request.urlopen(req, timeout=30) as resp:
                self.send_response(resp.status)
                for k, v in resp.headers.items():
                    self.send_header(k, v)
                self.end_headers()
                self.wfile.write(resp.read())
        except Exception as e:
            self.send_error(500, str(e))

    def log_message(self, format, *args):
        pass

def main():
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 8888
    server = ThreadingHTTPServer(("127.0.0.1", port), ProxyHandler)
    server.daemon_threads = True
    print(f"MULTI_THREADED_PROXY_LISTENING:{port}", flush=True)
    server.serve_forever()

if __name__ == "__main__":
    main()
