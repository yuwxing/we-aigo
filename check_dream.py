import urllib.request, json

# Use the requests-compatible approach but with proper headers
req = urllib.request.Request(
    'https://we-aigo.cn/api/dreams/latest',
    headers={'User-Agent': 'Mozilla/5.0'}
)
r = urllib.request.urlopen(req)
data = json.loads(r.read().decode('utf-8'))
for d in data[:5]:
    print(f"#{d['id']}: {d['content'][:60]} -- {d['nickname']} @ {d['created_at']}")
