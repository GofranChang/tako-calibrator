"""Local-only static server, no dependencies."""
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
from functools import partial
from pathlib import Path
import argparse

parser = argparse.ArgumentParser(description="Tako calibration UI")
parser.add_argument("--port", type=int, default=8080)
args = parser.parse_args()
root = Path(__file__).resolve().parent / "dist"
handler = partial(SimpleHTTPRequestHandler, directory=str(root))
server = ThreadingHTTPServer(("127.0.0.1", args.port), handler)
print(f"Tako 校准台：http://localhost:{args.port}（请用 Windows Chrome / Edge 打开）", flush=True)
try:
    server.serve_forever()
except KeyboardInterrupt:
    server.server_close()
