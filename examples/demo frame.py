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
print('WebCutter Frame Demo')
print("="*20)

movie = plex._plex.library.section('Plex Recordings').get('Monty Pythons wunderbare Welt der Schwerkraft')
pp(plex.movie_rec(movie))

try:
    print(f"\n---- '{movie.title}' ---")
    cutter.frame(movie, '00:15:19')
except Exception as err:
    print()
    print(str(err))
