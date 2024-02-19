from simplemenu.dmenu import CutterMenu, Repeat
import re



while True:
    header = \
"""
Plex CutterApp
=============="""
    try:
        erg = CutterMenu('Cut Command:', header).choice()
        print(erg)
        break
    except Repeat:
        pass


