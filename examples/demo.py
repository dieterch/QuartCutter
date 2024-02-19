from webcutter2.dplex import PlexInterface
from webcutter2.dcut import CutterInterface

from simplemenu.dmenu import Menu
from pprint import pprint as pp
import time
import sys

clear = lambda: print("\033[H\033[J", end="")

import tomli
with open("config.toml", mode="rb") as fp:
    cfg = tomli.load(fp)
    
fileserver = cfg['fileserver']
baseurl = cfg['plexurl']
token = cfg['plextoken']

plex = PlexInterface(baseurl,token)
cutter = CutterInterface(fileserver)

clear()
print('WebCutter Demo App')
print("="*18)

# select Section
choices = []
for s in plex.sections:
    choices.append(f"{s.type:<10} {s.title:<20} {s.totalSize:>5}")

ch = Menu(choices,'Select Plex Section').choice()
print(c := plex.sections[ch].title)

# select content
choices = []
plex.set_key(key='addedAt', reverse=True)
for elem in plex.sorted_content(c):
    choices.append(f"{elem.addedAt}   {elem.title}")
ch = Menu(choices,'Select Element', scrollby=10).choice()
movie = plex.sorted_content(c)[ch]

# select content
choices = []
for client in plex.clients:
    choices.append(f"{client.title}")
ch = Menu(choices,'Select Client').choice()
client = plex.client(choices[ch])

print(f"playing: {movie.title}")
mm = plex.ms_to_min(movie.duration)
print(f"lenght: {movie.duration} = {mm}")
print(f"ss: {plex.min_to_ms(15)} = {15}")
print(f"to: {plex.min_to_ms(mm-15)} = {mm-15}")

client.connect()
try:
    client.playMedia(movie)
except Exception:
    pass

try:
    client.playMedia(movie)
except Exception:
    pass

client.pause(mtype='video')

while True:
    mm = input('seek min: ')
    ms = int(float(mm) * 60000)
    try:
        client.seekTo(ms, mtype='video', timeout=1)
    except Exception:
        pass

