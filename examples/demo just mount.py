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
print('WebCutter Demo App - Ich denke oft an Piroschka (1955).ts')
print("="*57)

movie = plex._plex.library.section('Plex Recordings').get('Ich denke oft an Piroschka')
pp(plex.movie_rec(movie))

if movie.title == 'Ich denke oft an Piroschka':
    try:
        cutter.mount(movie)
    except Exception as err:
        print()
        print(str(err))
else:
    print("you did not select 'Ich denke oft an Piroschka (1955)'")
