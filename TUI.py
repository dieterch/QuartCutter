from webcutter2.dplex import PlexInterface
from webcutter2.dcut import CutterInterface

from simplemenu.dmenu import CutterMenu, Menu, Repeat
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

while True:
    #clear()
    header = \
"""
Plex CutterApp
=============="""
    # select Section
    while True:
        choices = []
        try:
            for s in plex.sections:
                choices.append(f"{s.type:<10} {s.title:<20} {s.totalSize:>5}")
            ch = Menu(choices,'Select Plex Section', header).choice()
            c = plex.sections[ch].title
            header = header + '\n- ' + c
            break
        except Repeat:
            continue

    # select content
    try:
        choices = []
        plex.set_key(key='addedAt', reverse=True)
        for elem in plex.sorted_content(c):
            choices.append(f"{elem.addedAt}   {elem.title}")
        ch = Menu(choices,'Select Element', header, scrollby=10).choice()
        movie = plex.sorted_content(c)[ch]
        header = header + '\n- ' + movie.title
    except Repeat:
        continue

    # select content
    while True:
        try:
            choices = []
            for client in plex.clients:
                choices.append(f"{client.title}")
            ch = Menu(choices,'Select Client', header).choice()
            client = plex.client(choices[ch])
            header = header + '\n- Titel: ' + client.title
            break
        except Repeat:
            continue
        
    mm = plex.ms_to_min(movie.duration)
    header = header + '\n- Länge ' + str(mm) + 'min'
    header = header + '\n- Ende  ' + str(mm-15) + 'min'

    client.connect()
    for i in range(2):
        try:
            client.playMedia(movie)
        except Exception:
            pass

    client.pause(mtype='video')
    while True:
        try:
            erg = CutterMenu('Cut Command:', header, client).choice()
            print(erg)
            c = input('ok?')
            if c == 'ok':
                cutter.cut(movie,erg[0],erg[1],inplace=False)
            raise SystemExit
        except Repeat:
            continue


