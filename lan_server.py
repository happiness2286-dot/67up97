import os
import sys
if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler

class CustomHandler(SimpleHTTPRequestHandler):
    def end_headers(self):
        # Bật no-cache để iPhone 11 luôn nhận code và dữ liệu mới nhất
        self.send_header('Cache-Control', 'no-cache, no-store, must-revalidate')
        self.send_header('Pragma', 'no-cache')
        self.send_header('Expires', '0')
        super().end_headers()

def main():
    port = 8080
    host = '0.0.0.0'
    server_address = (host, port)
    httpd = ThreadingHTTPServer(server_address, CustomHandler)
    print(f"🚀 SERVER LAN ĐANG CHẠY TẠI:")
    print(f"👉 Localhost: http://localhost:{port}/index.html")
    print(f"👉 Dành cho iPhone 11 (Cùng mạng Wi-Fi): http://192.168.1.60:{port}/index.html")
    print(f"Nhấn Ctrl+C để dừng server.")
    httpd.serve_forever()

if __name__ == '__main__':
    main()
